# ActionPilot Testing Strategy & Verification

ActionPilot includes automated test suites covering deterministic scheduling algorithms, MCP tool schemas, and agent orchestration.

---

## Running Automated Tests

To execute the test suite across the project:

```bash
npm test
```

Or run vitest directly in the MCP server:

```bash
cd apps/mcp-server
npx vitest run
```

---

## Test Coverage Overview

### 1. Deterministic Scheduling Engine (`engine.test.ts`)
- **`findFreeSlots`**:
  - Validates gaps within working hours (08:30 - 18:00).
  - Tests buffer padding (e.g. 10m buffer before/after meetings).
  - Verifies energy fit tagging (ideal vs moderate vs low).
- **`priorityScorer`**:
  - Tests non-linear deadline urgency curves (due in 12h vs 24h vs 3 days).
  - Validates priority weightings (1-5 scale).
  - Tests dependency penalty enforcement (penalizes tasks with uncompleted prerequisites).
- **`consequenceEngine`**:
  - Detects critical deadline breaches when moving tasks past their due time.
  - Verifies cascading ripple effects on downstream dependent tasks.
  - Identifies direct clashes with fixed calendar events.
- **`workloadAnalyzer`**:
  - Calculates scheduled vs free time ratios.
  - Evaluates burnout stress index (`low`, `moderate`, `high`, `critical`).
  - Verifies deadline proximity distributions.
- **`determineNextBestAction`**:
  - Validates optimal slot selection and explainability rationale generation.

### 2. MCP Tools Suite (`tools.test.ts`)
- Verifies registration and JSON-Schema compliance of all 13 tools:
  - `create_task`, `get_tasks`, `update_task`, `complete_task`
  - `get_calendar`, `find_free_slots`, `analyze_workload`
  - `prioritize_tasks`, `get_next_action`, `create_focus_block`
  - `analyze_consequences`, `get_user_context`, `save_user_preference`
- End-to-end tool execution and state mutation.

---

## Continuous Integration (GitHub Actions)

Located in [`.github/workflows/ci.yml`](file:///c:/Users/Asus/Downloads/alexa/.github/workflows/ci.yml):
- Runs on every push and pull request.
- Installs dependencies across workspaces.
- Executes `npm test`.
- Builds MCP server and Web frontend.
- Validates AWS CDK synthesis (`cdk synth`).
