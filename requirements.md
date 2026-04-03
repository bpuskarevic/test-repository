# Simple Calculator Requirements

## Overview

A simple calculator web application with a plain HTML/CSS/JS frontend and a Python 3.11+ REST API backend. Supports the four basic arithmetic operations: addition, subtraction, multiplication, and division.

---

## Features

1. **Addition** - Compute the sum of two numbers.
2. **Subtraction** - Compute the difference of two numbers.
3. **Multiplication** - Compute the product of two numbers.
4. **Division** - Compute the quotient of two numbers; return an error when dividing by zero.
5. **Input Validation** - Reject non-numeric inputs and missing fields with a descriptive error message.
6. **Error Handling** - Return structured error responses for invalid operations or inputs.
7. **Single-Page UI** - A minimal HTML page with number inputs, an operator selector, a calculate button, and a result display area.

---

## File / Folder Structure

```
project/
├── backend/
│   ├── main.py          # FastAPI app entry point; registers routes
│   ├── calculator.py    # Pure functions: add, subtract, multiply, divide
│   ├── models.py        # Pydantic request/response models
│   └── requirements.txt # Python dependencies (fastapi, uvicorn)
├── frontend/
│   ├── index.html       # Calculator UI markup
│   ├── style.css        # Layout and visual styling
│   └── app.js           # Fetch calls to the REST API; DOM updates
└── requirements.md      # This file
```

---

## Data Models & API Contract

### Base URL

```
http://localhost:8000
```

---

### POST /calculate

Performs the requested arithmetic operation.

#### Request Body (JSON)

| Field       | Type             | Required | Description                              |
|-------------|------------------|----------|------------------------------------------|
| `operand_a` | number (float)   | yes      | The left-hand operand.                   |
| `operand_b` | number (float)   | yes      | The right-hand operand.                  |
| `operation` | string (enum)    | yes      | One of: `add`, `subtract`, `multiply`, `divide`. |

**Example**

```json
{
  "operand_a": 10,
  "operand_b": 3,
  "operation": "divide"
}
```

#### Success Response `200 OK`

| Field    | Type   | Description              |
|----------|--------|--------------------------|
| `result` | float  | The computed result.     |

```json
{
  "result": 3.3333333333333335
}
```

#### Error Response `422 Unprocessable Entity` (validation failure)

```json
{
  "detail": "operand_b must not be zero for division."
}
```

#### Error Response `400 Bad Request` (unknown operation)

```json
{
  "detail": "Unknown operation: 'modulo'. Must be one of: add, subtract, multiply, divide."
}
```

---

### GET /health

Returns a liveness check confirming the API is running.

#### Success Response `200 OK`

```json
{
  "status": "ok"
}
```

---

## Pydantic Models (backend/models.py)

```python
from pydantic import BaseModel
from enum import Enum

class Operation(str, Enum):
    add      = "add"
    subtract = "subtract"
    multiply = "multiply"
    divide   = "divide"

class CalculateRequest(BaseModel):
    operand_a: float
    operand_b: float
    operation: Operation

class CalculateResponse(BaseModel):
    result: float

class ErrorResponse(BaseModel):
    detail: str
```

---

## Constraints & Notes

- Python 3.11+ is required; use `FastAPI` and `uvicorn` as the only runtime dependencies.
- The frontend must use only vanilla HTML, CSS, and JavaScript — no frameworks or build tools.
- CORS must be enabled on the backend so the frontend can call the API when served from a different origin (e.g., opened directly as a local file).
- All numeric results are returned as IEEE 754 doubles; the frontend should display at most 10 significant digits.
- Division by zero must be caught in `calculator.py` and surfaced as an HTTP 422 error, not a Python exception propagating to the client.
