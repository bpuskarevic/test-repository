# Simple Calculator — Architecture Document

**Version:** 1.0

---

## 1. System Overview

The Simple Calculator is a two-tier web application composed of:

- A **vanilla HTML/CSS/JS single-page frontend** served as static files.
- A **Python 3.11+ REST API backend** built with FastAPI and served by uvicorn.

The frontend communicates with the backend exclusively via HTTP (JSON over REST). There is no shared state, database, or authentication layer.

```
┌────────────────────────────┐         HTTP/JSON          ┌──────────────────────────────┐
│        Browser             │ ─── POST /calculate ──────▶ │        FastAPI App           │
│   index.html / app.js      │ ◀── { result: float } ───── │   main.py + calculator.py    │
│   (vanilla HTML/CSS/JS)    │ ─── GET  /health ─────────▶ │                              │
└────────────────────────────┘                             └──────────────────────────────┘
```

---

## 2. Technology Choices and Rationale

### Backend

| Choice | Rationale |
|---|---|
| **Python 3.11+** | Mandated by requirements; modern Python with improved performance and error messages. |
| **FastAPI** | Provides automatic request validation via Pydantic models, automatic OpenAPI docs, and async support — all with minimal boilerplate. Ideal for a small, well-defined API surface. |
| **uvicorn** | ASGI server recommended for FastAPI; lightweight and production-capable for a project of this scope. |
| **Pydantic models** (`models.py`) | Declares request/response schemas as Python classes, giving automatic type coercion and validation without hand-written parsing code. |
| **Separate `calculator.py`** | Isolates pure arithmetic logic from HTTP concerns, making it independently testable with no FastAPI dependency. |

### Frontend

| Choice | Rationale |
|---|---|
| **Vanilla HTML/CSS/JS** | Mandated by requirements; eliminates build tooling, bundlers, and framework overhead for a project of this scope. |
| **Single HTML page** | Keeps the UI self-contained; no routing needed for four operations. |
| **`fetch` API** | Native browser API for async HTTP — no external libraries required. |

---

## 3. File and Folder Structure

```
project/
├── backend/
│   ├── main.py          # FastAPI app instance, route definitions, CORS config
│   ├── calculator.py    # Pure arithmetic functions (add, subtract, multiply, divide)
│   ├── models.py        # Pydantic request/response models and operation enum
│   └── requirements.txt # fastapi, uvicorn[standard]
└── frontend/
    ├── index.html       # Page structure: inputs, operator selector, button, result area
    ├── style.css        # Layout and visual styling
    └── app.js           # fetch calls, DOM manipulation, client-side validation
```

---

## 4. Interface Contracts

### 4.1 POST /calculate

Performs a single arithmetic operation.

**Request body (JSON)**

```json
{
  "operand_a": <float>,
  "operand_b": <float>,
  "operation": <"add" | "subtract" | "multiply" | "divide">
}
```

**Success response — HTTP 200**

```json
{
  "result": <float>
}
```

**Error response — HTTP 422 (validation failure)**

Returned automatically by FastAPI when a field is missing, non-numeric, or `operation` is not a valid enum member.

```json
{
  "detail": [
    {
      "loc": ["body", "<field_name>"],
      "msg": "<human-readable message>",
      "type": "<error_type>"
    }
  ]
}
```

**Error response — HTTP 400 (domain error)**

Returned explicitly by application logic (e.g., division by zero).

```json
{
  "detail": "Division by zero is not allowed."
}
```

### 4.2 GET /health

Liveness probe for the backend.

**Response — HTTP 200**

```json
{
  "status": "ok"
}
```

---

## 5. System Design Decisions

### 5.1 Separation of Concerns

`calculator.py` contains only pure functions with no FastAPI imports. This means arithmetic logic can be unit-tested without spinning up an HTTP server, and it can be swapped or extended without touching route definitions.

`models.py` owns all schema definitions. Routes in `main.py` import from `models.py` rather than declaring inline `dict` schemas, keeping route handlers thin.

### 5.2 Input Validation Strategy

Validation is handled at two levels:

1. **Client side (`app.js`):** Checks that both input fields are non-empty and numeric before sending the request, providing immediate feedback without a network round-trip.
2. **Server side (`models.py` + FastAPI):** Pydantic enforces types and the operation enum on every request regardless of client behaviour. The server never trusts client input.

Division by zero is a domain error caught in `calculator.py` and surfaced as an HTTP 400 by `main.py`.

### 5.3 CORS Configuration

CORS is enabled in `main.py` using FastAPI's `CORSMiddleware` with `allow_origins=["*"]`. This allows the static frontend files to be opened directly from the filesystem (`file://`) or served from any local development server without a proxy. For production the allowed origin should be locked to the known frontend host.

### 5.4 Error Response Consistency

All error responses use FastAPI's standard `detail` field so the frontend only needs one error-handling path: read `response.detail` (a string for domain errors, an array for validation errors) and display it in the result area.

### 5.5 No State / No Database

Every `/calculate` request is fully self-contained. The backend holds no session state and requires no persistence layer, keeping the operational footprint minimal.

---

## 6. Data Flow — Calculate Request

```
User fills inputs and clicks "Calculate"
        │
        ▼
app.js validates inputs (non-empty, numeric)
        │  invalid → display error in UI, abort
        ▼
app.js sends POST /calculate with JSON body
        │
        ▼
FastAPI / Pydantic validates request schema
        │  invalid → 422 response → app.js displays error
        ▼
main.py calls calculator.py function
        │  domain error (e.g. div/0) → 400 response → app.js displays error
        ▼
calculator.py returns float result
        │
        ▼
main.py returns { "result": <float> }
        │
        ▼
app.js renders result in the result display area
```

---

## 7. Running the Application

```bash
# Backend
cd project/backend
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000

# Frontend
# Open project/frontend/index.html in a browser,
# or serve with any static file server pointing at project/frontend/.
```

The frontend `app.js` targets `http://localhost:8000` as the API base URL (configurable via the `API_BASE` constant at the top of the file).
