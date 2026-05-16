from typing import Literal
from pydantic import BaseModel


class CalculationRequest(BaseModel):
    operand_a: float
    operand_b: float
    operation: Literal["add", "subtract", "multiply", "divide"]


class CalculationResponse(BaseModel):
    result: float


class HealthResponse(BaseModel):
    status: str
