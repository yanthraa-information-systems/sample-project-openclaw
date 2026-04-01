from fastapi import APIRouter
from app.schemas.agent import AgentRunRequest, AgentRunResponse
from app.services.agent_service import AgentService
from app.api.deps import CurrentUser, DBSession

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/run", response_model=AgentRunResponse, status_code=201)
async def run_agent(request: AgentRunRequest, current_user: CurrentUser, db: DBSession):
    """
    Run an AI agent that can use tools and RAG to answer complex queries.
    The agent will:
    1. Understand the query
    2. Decompose into steps
    3. Use tools (document search, calculation, summarization)
    4. Return a comprehensive response
    """
    service = AgentService(db)
    return await service.run(request, current_user)
