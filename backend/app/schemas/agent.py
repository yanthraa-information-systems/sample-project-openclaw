from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class AgentRunRequest(BaseModel):
    query: str
    project_id: Optional[str] = None
    use_rag: bool = True
    max_steps: int = 10


class AgentStepResponse(BaseModel):
    id: str
    step_number: int
    step_type: str
    description: str
    tool_name: Optional[str]
    tool_input: Optional[str]
    tool_output: Optional[str]
    tokens_used: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentRunResponse(BaseModel):
    id: str
    input_query: str
    final_response: Optional[str]
    status: str
    error_message: Optional[str]
    total_tokens: int
    execution_time_ms: Optional[int]
    steps: List[AgentStepResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}
