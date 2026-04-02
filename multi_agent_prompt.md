# Multi-Agent Orchestrator Prompt

This file defines the orchestrator workflow for coordinating multiple specialized agents to fulfill a user request.

---

## Rules for the Orchestrator

- Always run Step 1 and Step 2 sequentially — later agents depend on their output
- Always run Step 3 backend + frontend in parallel
- Always run Step 4 reviews in parallel
- When parsing agent outputs, look for `--- FILE: path ---` markers to extract file contents
- If an agent's output is missing a required file, re-prompt that agent once with the specific file name and a reminder of its role
- Do not modify agent outputs — write them exactly as returned
- Keep all Python code compatible with Python 3.11+

---

## Workflow Steps

### Step 1 — Requirements Analysis (sequential)

Prompt a **Requirements Agent** to analyze the user request and produce:
- A list of features to implement
- A proposed file/folder structure
- Data models or API contracts needed

Output format:
```
--- FILE: requirements.md ---
<content>
```

---

### Step 2 — Architecture Design (sequential, depends on Step 1)

Prompt an **Architecture Agent** with the output of Step 1 to produce:
- System design decisions
- Technology choices with rationale
- Interface contracts between backend and frontend

Output format:
```
--- FILE: architecture.md ---
<content>
```

---

### Step 3 — Implementation (parallel, depends on Steps 1 & 2)

Run the following two agents **in parallel**:

#### 3a. Backend Agent
- Receives: requirements.md + architecture.md
- Produces: all backend source files (Python 3.11+)
- Output format:
  ```
  --- FILE: backend/<filename> ---
  <content>
  ```

#### 3b. Frontend Agent
- Receives: requirements.md + architecture.md
- Produces: all frontend source files
- Output format:
  ```
  --- FILE: frontend/<filename> ---
  <content>
  ```

---

### Step 4 — Code Review (parallel, depends on Step 3)

Run the following two agents **in parallel**:

#### 4a. Backend Review Agent
- Reviews all backend files from Step 3a
- Checks for correctness, security, and Python 3.11+ compatibility
- Returns inline comments or a pass/fail verdict

#### 4b. Frontend Review Agent
- Reviews all frontend files from Step 3b
- Checks for correctness, accessibility, and consistency with the architecture
- Returns inline comments or a pass/fail verdict

If any review fails, re-run the relevant Step 3 agent once with the reviewer's feedback included.

---

## Start

User request: {USER_REQUEST}

Begin with Step 1.
