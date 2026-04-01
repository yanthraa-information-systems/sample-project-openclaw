import json
import time
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI
from app.models.agent import AgentRun, AgentStep, AgentRunStatus
from app.models.user import User
from app.schemas.agent import AgentRunRequest
from app.services.rag_service import RAGService
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_documents",
            "description": "Search through uploaded documents to find relevant information",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query"},
                    "top_k": {"type": "integer", "description": "Number of results", "default": 5},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "Perform mathematical calculations",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Math expression to evaluate"},
                },
                "required": ["expression"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "summarize_text",
            "description": "Summarize a long piece of text into key points",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "Text to summarize"},
                    "max_points": {"type": "integer", "default": 5},
                },
                "required": ["text"],
            },
        },
    },
]

AGENT_SYSTEM_PROMPT = """You are an intelligent AI agent with access to tools.
When answering questions:
1. Understand what information is needed
2. Use available tools to gather relevant data
3. Synthesize the information into a clear, comprehensive answer
4. Be transparent about what sources you used

Always use search_documents when the question relates to uploaded documents."""


class AgentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.openai = AsyncOpenAI(api_key=settings.openai_api_key)
        self.rag_service = RAGService(db)

    async def _execute_tool(self, tool_name: str, tool_args: dict, project_id: Optional[str]) -> str:
        if tool_name == "search_documents":
            chunks = await self.rag_service.retrieve_context(
                query=tool_args.get("query", ""),
                project_id=project_id,
                top_k=tool_args.get("top_k", 5),
            )
            if not chunks:
                return "No relevant documents found."
            return "\n\n---\n\n".join(
                f"[{c.document_name}] (score: {c.score:.2f})\n{c.content}" for c in chunks
            )

        elif tool_name == "calculate":
            try:
                allowed = {"__builtins__": {}, "abs": abs, "round": round, "min": min, "max": max, "sum": sum, "pow": pow}
                result = eval(tool_args.get("expression", ""), allowed)
                return f"Result: {result}"
            except Exception as e:
                return f"Calculation error: {str(e)}"

        elif tool_name == "summarize_text":
            text = tool_args.get("text", "")
            max_points = tool_args.get("max_points", 5)
            try:
                response = await self.openai.chat.completions.create(
                    model=settings.openai_model,
                    messages=[{"role": "user", "content": f"Summarize into {max_points} bullet points:\n\n{text[:3000]}"}],
                    max_tokens=500,
                )
                return response.choices[0].message.content or "Summary unavailable"
            except Exception as e:
                return f"Summarization failed: {str(e)}"

        return f"Unknown tool: {tool_name}"

    async def run(self, request: AgentRunRequest, user: User) -> AgentRun:
        start_time = time.time()

        agent_run = AgentRun(
            user_id=user.id,
            project_id=request.project_id,
            input_query=request.query,
            status=AgentRunStatus.RUNNING.value,
        )
        self.db.add(agent_run)
        await self.db.flush()

        messages = [
            {"role": "system", "content": AGENT_SYSTEM_PROMPT},
            {"role": "user", "content": request.query},
        ]

        step_number = 0
        total_tokens = 0

        try:
            for _ in range(request.max_steps):
                response = await self.openai.chat.completions.create(
                    model=settings.openai_model,
                    messages=messages,
                    tools=AGENT_TOOLS,
                    tool_choice="auto",
                    max_tokens=settings.openai_max_tokens,
                )

                assistant_message = response.choices[0].message
                total_tokens += response.usage.total_tokens if response.usage else 0
                messages.append(assistant_message.model_dump())
                finish_reason = response.choices[0].finish_reason

                if finish_reason == "stop":
                    step_number += 1
                    step = AgentStep(
                        run_id=agent_run.id,
                        step_number=step_number,
                        step_type="respond",
                        description="Generated final response",
                        tokens_used=response.usage.total_tokens if response.usage else 0,
                    )
                    self.db.add(step)
                    agent_run.final_response = assistant_message.content
                    break

                elif finish_reason == "tool_calls" and assistant_message.tool_calls:
                    tool_results = []
                    for tool_call in assistant_message.tool_calls:
                        step_number += 1
                        tool_name = tool_call.function.name
                        tool_args = json.loads(tool_call.function.arguments)
                        tool_result = await self._execute_tool(tool_name, tool_args, request.project_id)

                        step = AgentStep(
                            run_id=agent_run.id,
                            step_number=step_number,
                            step_type="tool_call",
                            description=f"Called tool: {tool_name}",
                            tool_name=tool_name,
                            tool_input=json.dumps(tool_args),
                            tool_output=tool_result[:2000],
                            tokens_used=0,
                        )
                        self.db.add(step)
                        tool_results.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": tool_result,
                        })

                    messages.extend(tool_results)
                else:
                    break

            agent_run.status = AgentRunStatus.COMPLETED.value
            agent_run.total_tokens = total_tokens
            agent_run.execution_time_ms = int((time.time() - start_time) * 1000)

            if not agent_run.final_response:
                agent_run.final_response = "Unable to generate a complete response."

        except Exception as e:
            logger.error("agent_run_failed", run_id=agent_run.id, error=str(e))
            agent_run.status = AgentRunStatus.FAILED.value
            agent_run.error_message = str(e)
            agent_run.execution_time_ms = int((time.time() - start_time) * 1000)

        await self.db.flush()
        await self.db.refresh(agent_run)
        return agent_run
