from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.calculator import calculate
from backend.models import CalculationRequest, CalculationResponse, HealthResponse

app = FastAPI(title="Calculator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/calculate", response_model=CalculationResponse)
def calculate_endpoint(request: CalculationRequest) -> CalculationResponse:
    try:
        result = calculate(request.operation, request.operand_a, request.operand_b)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return CalculationResponse(result=result)
