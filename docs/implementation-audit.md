# ActionPilot Implementation Audit

> **Audit Date:** 2026-10-06
> **Auditor:** Antigravity AI
> **Method:** Full source inspection + live server testing + test suite execution

---

## Executive Summary

ActionPilot is **substantially functional** as a local development application. The core MCP server, planning engine, all 13 tools, and the React dashboard are all implemented and working. Tests pass **17/17**. Both flagship demo workflows execute end-to-end against the live server.

**However**, several critical components claimed in the README are either in "graceful fallback" mode or are entirely absent:

- **Amazon Bedrock** integration is wired but **inactive** (falls back to silence when `AWS_ACCESS_KEY_ID=demo_key`)
- **DynamoDB** is wired but **inactive** (falls back to in-memory store; `.env` explicitly sets `USE_LOCAL_STORAGE=true`)
- **Strands Agents SDK** is **not integrated** — the `agent/` directory is a thin HTTP wrapper, not the AWS Strands SDK
- **AgentCore Memory** is referenced in `.env` and CDK but **not implemented** in any code
- The MCP `/sse` endpoint provides real-time streaming but is **NOT** the MCP 2025-11-25 Streamable HTTP transport (which requires GET+POST on `/mcp`, not a separate `/sse` route)
- **Authentication** on the `/mcp` endpoint is **completely absent**

For the hackathon demo, the system works impressively well in local mode. For the AWS Builder track, real AWS wiring is needed.

---

## What Actually Works

| Component | Status |
|---|---|
| MCP server starts cleanly on port 3001 | ✅ |
| `/health` endpoint returns 200 with MCP spec metadata | ✅ |
| `/mcp` JSON-RPC 2.0 endpoint (POST) | ✅ |
| `initialize`, `tools/list`, `tools/call` methods | ✅ |
| All 13 MCP tools with real logic | ✅ |
| Free slot calculation (deterministic, with buffer) | ✅ |
| Multi-factor priority scoring (urgency/importance/energy/duration/dependency) | ✅ |
| Next Best Action engine with full explainability | ✅ |
| Consequence analysis (conflict detection, deadline breach, ripple effects) | ✅ |
| Workload analysis (capacity ratio, stress index, deadline distribution) | ✅ |
| Alexa query orchestrator (keyword-intent routing + tool chain execution) | ✅ |
| In-memory storage with seeded demo data | ✅ |
| REST API endpoints for the dashboard (`/api/*`) | ✅ |
| SSE stream for real-time tool execution logs (`/sse`) | ✅ |
| React dashboard (tasks, calendar, workload, NBA, consequence simulator) | ✅ |
| Vite proxy to MCP server | ✅ |
| CDK stack file (synthesizable, not deployed) | 🟡 |
| Dockerfile (valid, not build-tested) | 🟡 |
| **17/17 tests passing** | ✅ |

### Live-Verified E2E Flows

**Flow 1: "Alexa, what should I work on next?"**
```
get_tasks → get_calendar → analyze_workload → prioritize_tasks → find_free_slots → get_next_action
Response: "I recommend working on Complete AWS Bedrock Agent Integration. It is due in 13 hours,
          and you have an open 90-minute focus block starting at 04:10 PM. Would you like me to book it?"
```

**Flow 2: "Move my CS assignment to tomorrow"**
```
analyze_consequences → conflict detection (1 conflict) → ripple effect detection (1 ripple)
Response: "Moving CS-504 Distributed Systems Assignment to tomorrow overlaps with Flexible Focus
          Block: CS Prep. I can move Flexible Focus Block: CS Prep to 3:00 PM and book your assignment for 10:00 AM."
Impact: high | Feasible: true | Conflicts: 1 | Ripple Effects: 1
```

---

## What Is Mocked / Placeholder

| Component | Reality |
|---|---|
| Amazon Bedrock invocation | Falls back silently to empty string when `AWS_ACCESS_KEY_ID=demo_key`. `BedrockService.invokeReasoning()` returns `''`; orchestrator uses deterministic `explanationForAlexa` instead. |
| DynamoDB persistence | `.env` sets `USE_LOCAL_STORAGE=true` AND `AWS_ACCESS_KEY_ID=demo_key`, so `DynamoStore` always delegates to `memoryStore`. Data resets on every server restart. |
| Strands Agents SDK | `agent/src/index.ts` is a 38-line custom class that wraps `fetch()` to call `/api/alexa/query`. Does NOT use `@aws/strands-agent`. |
| AgentCore Memory | Referenced in `.env` (`AGENTCORE_MEMORY_ID=mem-actionpilot-hackathon-2026`) and CDK IAM policies, but **zero code** reads/writes AgentCore memory anywhere in the codebase. |
| MCP Streamable HTTP (spec-compliant) | MCP 2025-11-25 spec requires GET `/mcp` to return SSE stream. Current implementation uses GET `/sse` (non-standard) + POST `/mcp`. May fail strict client validation. |
| Authentication | No auth on any endpoint. Any client can call `/mcp`. |

---

## MCP Server Status

| Item | Result |
|---|---|
| **Implemented?** | ✅ YES — Express.js on port 3001 |
| **Streamable HTTP spec** | ⚠️ PARTIAL — POST `/mcp` works correctly; GET `/mcp` SSE channel absent (uses `/sse` instead) |
| **MCP spec version `2025-11-25`** | ✅ YES — `protocolVersion: "2025-11-25"` returned on `initialize` |
| **`/mcp` POST endpoint** | ✅ VERIFIED LIVE |
| **`/health` endpoint** | ✅ VERIFIED LIVE — returns `{"status":"healthy","spec":"MCP 2025-11-25","transport":"streamable-http"}` |
| **`/sse` endpoint** | ✅ Works for dashboard real-time logs. NOT the MCP-spec GET-on-/mcp transport. |
| **Authentication** | ❌ NOT IMPLEMENTED |
| **Compatible with real remote MCP client?** | ⚠️ UNKNOWN — works with custom wrapper; full compatibility needs GET `/mcp` SSE channel |

**Verified MCP methods:** `initialize` ✅ | `notifications/initialized` ✅ | `ping` ✅ | `tools/list` ✅ | `tools/call` ✅

---

## MCP Tool Status

| Tool | Implemented? | Logic | Persistence | Tests | Notes |
|---|---|---|---|---|---|
| `create_task` | ✅ YES | Real — creates Task with full schema | In-memory | ✅ | Works end-to-end |
| `get_tasks` | ✅ YES | Real — status/tag filter | In-memory | ✅ | Works |
| `update_task` | ✅ YES | Real — partial field updates | In-memory | ❌ no direct test | Works |
| `complete_task` | ✅ YES | Real — sets `status: 'completed'` | In-memory | ❌ no direct test | Works |
| `get_calendar` | ✅ YES | Real — date-range filter | In-memory | ✅ (indirect) | Works |
| `find_free_slots` | ✅ YES | **Real deterministic math** — buffer merging, gap detection, energy fit | In-memory | ✅ 2 tests | Full implementation |
| `analyze_workload` | ✅ YES | **Real** — capacity ratio, stress index, deadline distribution | In-memory | ✅ | Full implementation |
| `prioritize_tasks` | ✅ YES | **Real** — 5-factor weighted score (urgency 40%, importance 30%, energy 15%, duration 15%, dep penalty) | In-memory | ✅ | Full implementation |
| `get_next_action` | ✅ YES | **Real** — free slots + ranked tasks + workload + slot fit | In-memory | ✅ 2 tests | **FLAGSHIP — Fully verified** |
| `create_focus_block` | ✅ YES | Real — saves `CalendarEvent` type `focus_block`, links task | In-memory | ✅ | Works |
| `analyze_consequences` | ✅ YES | **Real** — conflict detection, deadline breach, ripple cascade, alternative slots | In-memory | ✅ 2 tests | **FLAGSHIP — Fully verified** |
| `get_user_context` | ✅ YES | Real — returns `UserContext` with preferences | In-memory | ✅ (indirect) | Works |
| `save_user_preference` | ✅ YES | Real — writes to `learnedPreferences` map | In-memory | ❌ no direct test | Works |

All 13 tools have proper JSON Schema `inputSchema` definitions and return structured TypeScript-typed objects.

---

## Planning Engine Status

| Algorithm | Status | Notes |
|---|---|---|
| Deadline urgency scoring | ✅ IMPLEMENTED | Step function: ≤0h=100, ≤12h=95, ≤24h=85, ≤48h=65, ≤72h=45, ≤168h=30, else=15 |
| Priority scoring (1-5 scale) | ✅ IMPLEMENTED | `priority * 20` maps to 20..100 |
| Duration/slot fit | ✅ IMPLEMENTED | Checks `slot.durationMinutes >= task.estimatedDuration` |
| Energy matching | ✅ IMPLEMENTED | `deep_work` favored in peak hours (09-12), `shallow_work` favored off-peak |
| Workload pressure | ✅ IMPLEMENTED | `capacityRatio = taskDemandMinutes / totalFreeMinutes` |
| Dependency handling | ✅ IMPLEMENTED | `-60 * uncompletedDeps.length` penalty on score |
| Free-slot calculation | ✅ IMPLEMENTED | Buffer merging + gap detection within work hours |
| Conflict detection | ✅ IMPLEMENTED | Overlap check + `isFixed` severity (`critical` vs `warning`) |
| Consequence simulation | ✅ IMPLEMENTED | Checks free slots, conflicts, deadline breach |
| Cascading/ripple-effect detection | ✅ IMPLEMENTED | Traverses `task.dependencies` to find downstream tasks at risk |

**No mocked logic.** All planning engine functions contain genuine mathematical implementations.

**Minor bug:** `durationFitScore` can reach 105 (line 69 in `priorityScorer.ts`) but is silently clamped to 100 at line 96.

---

## Strands + Bedrock Status

### Bedrock (`bedrockClient.ts`)

| Item | Status |
|---|---|
| Client code written | ✅ `BedrockRuntimeClient` + `InvokeModelCommand` |
| Model configured | ✅ `anthropic.claude-3-5-sonnet-20241022-v2:0` |
| **Active invocation** | ❌ NOT ACTIVE — detects `AWS_ACCESS_KEY_ID=demo_key`, returns `''` |
| Prompt template | ✅ Written — voice-appropriate 2-3 sentence prompt |
| Fallback behavior | ✅ Graceful — orchestrator uses deterministic `explanationForAlexa` |

### Strands Agents (`agent/src/index.ts`)

| Item | Status |
|---|---|
| AWS Strands SDK (`@aws/strands-agent`) | ❌ NOT USED — not in any `package.json` |
| `StrandsAgent` class | ⚠️ Custom 38-line HTTP wrapper calling `/api/alexa/query` |
| NLU / tool selection by LLM | ❌ NOT IN STRANDS — keyword switch in `alexaOrchestrator.ts` |
| Natural-language intent handling | ⚠️ PARTIAL — `string.includes()` keyword matching only |
| Explanation generation | ✅ REAL — template strings from deterministic engine outputs |

---

## DynamoDB Status

| Item | Status |
|---|---|
| DynamoDB client code | ✅ Written — Get/Put/Scan/Delete commands for 3 tables |
| Table schema | ✅ Correct — `ActionPilot-Tasks`, `-Calendar`, `-UserContext` |
| **Actual read/write operations** | ❌ NOT ACTIVE — `.env` bypasses Dynamo via `USE_LOCAL_STORAGE=true` |
| Local fallback storage | ✅ Fully working — `MemoryStore` with seed data |
| Data persistence across restarts | ❌ Lost on every server restart |
| GSI on Tasks table | ✅ Defined in CDK — `status-deadline-index` |

---

## Frontend Status

| Feature | Status | Notes |
|---|---|---|
| Task display | ✅ | `TaskMatrix` with status/priority/energy |
| Task creation | ✅ | `NewTaskModal` → `POST /api/tasks` |
| Task completion | ✅ | Click-to-complete in `TaskMatrix` |
| Calendar display | ✅ | `CalendarTimeline` from `/api/calendar` |
| Next Best Action display | ✅ | `NextBestActionHero` with confidence, factors, reasoning, slot |
| Consequence simulation | ✅ | `ConsequenceSimulator` — task + date → conflicts/ripple/mitigation |
| MCP activity timeline | ✅ | `McpStreamableInspector` with live SSE tool logs |
| Workload radar/chart | ✅ | `WorkloadRadar` with Recharts |
| Alexa voice bar | ✅ | `AlexaVoiceBar` → `/api/alexa/query` |
| Preferences modal | ✅ | `PreferencesModal` — edits work hours / focus preferences |
| API communication | ✅ | `api.ts` — 10 typed functions with error handling |
| Loading states | ✅ | `isLoading` gated on all async operations |
| Error states | ⚠️ PARTIAL | `console.error` only — no visible error UI for users |
| SSE real-time updates | ✅ | `EventSource('/sse')` in `App.tsx` |
| Direct MCP call from frontend | ✅ | `handleBookSlot` uses `POST /mcp` JSON-RPC directly |

---

## AWS Infrastructure Status

| Component | Status |
|---|---|
| CDK stack (`actionpilot-stack.ts`) | 🟡 Written (163 lines) — not deployed |
| VPC | 🟡 Defined — `maxAzs:2`, 1 NAT gateway |
| DynamoDB tables | 🟡 Defined — 3 tables with GSI |
| ECS Fargate cluster | 🟡 Defined — `actionpilot-ecs-cluster` |
| ALB | 🟡 Defined — `ApplicationLoadBalancedFargateService` |
| IAM | 🟡 Defined — DynamoDB RW + Bedrock InvokeModel + AgentCore memory policies |
| CloudWatch | 🟡 Defined — ALB + ECS widgets |
| Environment variables | ✅ Passed to ECS container correctly |
| Dockerfile | 🟡 Valid multi-stage Node.js build — not build-tested |
| `cdk synth` / `cdk deploy` | ❌ NOT RUN in this audit |
| AgentCore Memory | 🟡 IAM defined in CDK — zero code implementation |

**Dockerfile risk:** Runner stage copies `apps/mcp-server/node_modules` but may miss root workspace hoisted packages.

---

## Test Results

```
Test Files  3 passed (3)
      Tests  17 passed (17)   ← ALL GREEN
   Duration  6.57s
```

| Test File | Tests | Coverage |
|---|---|---|
| `engine/__tests__/engine.test.ts` | 7 | `findFreeSlots`, `rankTasks`, `calculateTaskPriority` (dep penalty), `analyzeConsequences` (breach + ripple), `analyzeWorkload`, `determineNextBestAction` |
| `tools/__tests__/tools.test.ts` | 6 | All 13 tools registered with schemas; `create_task`, `get_tasks`, `get_next_action`, `analyze_consequences`, `create_focus_block`, `analyze_workload` |
| `tests/integration.test.ts` | 4 | Full E2E Alexa scenarios × 4 |

**Not tested:** `update_task`, `complete_task`, `save_user_preference`, Bedrock live path, DynamoDB path, `streamableHttp.ts`, frontend.

---

## Critical Bugs

| # | Bug | Severity | Location |
|---|---|---|---|
| 1 | No authentication on `/mcp` | 🔴 Critical | `streamableHttp.ts` |
| 2 | Data resets on server restart (in-memory only) | 🔴 High | `storage/index.ts` + `.env` |
| 3 | `GET /mcp` not implemented — MCP spec requires it for SSE transport | 🟡 Medium | `streamableHttp.ts` |
| 4 | No error UI — API failures invisible to user | 🟡 Medium | `App.tsx` catch blocks |
| 5 | Intent routing is keyword-only — complex NL queries will fail | 🟡 Medium | `alexaOrchestrator.ts:84-97` |
| 6 | Strands Agent SDK not actually used | 🟡 Medium | `agent/src/index.ts` |
| 7 | `durationFitScore` can be 105 but is clamped to 100 silently | 🟡 Low | `priorityScorer.ts:69,96` |
| 8 | Dockerfile workspace hoisting may miss root `node_modules` | 🟡 Medium | `Dockerfile:30` |

---

## Hackathon Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Bedrock not invoked → no AI enrichment for judges | 🔴 HIGH | Set real AWS credentials in `.env` before demo |
| DynamoDB not used → data lost on restart | 🟡 MEDIUM | Set `USE_LOCAL_STORAGE=false` + provision tables |
| Strands SDK not integrated → AWS Builder track weakened | 🔴 HIGH | Replace `agent/src/index.ts` with `@aws/strands-agent` |
| GET `/mcp` missing → strict MCP client may refuse | 🟡 MEDIUM | Add GET `/mcp` SSE upgrade handler |
| No authentication → security risk on public URL | 🟡 MEDIUM | Add `x-api-key` header middleware |
| AgentCore Memory never read/written | 🟡 MEDIUM | Implement AgentCore memory API calls |

---

## Recommended Next Steps (Priority Order)

### 1. 🔑 Connect Real AWS Credentials + Enable Bedrock (1-2 hours)
Edit `.env`: set real `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `USE_LOCAL_STORAGE=false`.
Verify Claude 3.5 Sonnet model access in `us-east-1`. This single change enables AI-enriched responses and DynamoDB persistence.

### 2. 🧠 Replace StrandsAgent with Real Strands SDK (3-4 hours)
```bash
npm install @aws/strands-agent --workspace=agent
```
Rewrite `agent/src/index.ts` using the `Agent` class from `@aws/strands-agent`. Wire the 13 MCP tools as Strands tool definitions. Most impactful gap for the AWS Builder track.

### 3. 📡 Fix MCP Spec Compliance: Add GET `/mcp` SSE (1-2 hours)
Add `router.get('/mcp', ...)` that upgrades to SSE transport per MCP 2025-11-25 spec.
Required for Alexa+ MCP client compatibility.

### 4. 🔒 Add Authentication (1 hour)
Add `x-api-key` header validation middleware on `/mcp`. Read from `process.env.MCP_API_KEY`.

### 5. 🧩 Add AgentCore Memory Integration (2-3 hours)
Use `@aws-sdk/client-bedrock-agent-runtime` to persist user context in AgentCore.
Enables learned preferences to survive server restarts and demonstrate real contextual memory.

---

## Files Inspected

24 source files read across: `apps/mcp-server/src/` (index, mcp, tools, engine ×5, storage ×3, agent ×2, types), `apps/web/src/` (App, api, types), `infrastructure/cdk/lib/`, `apps/mcp-server/Dockerfile`, `agent/src/index.ts`, `.env`, all `package.json` files, `vitest.config.ts`, `vite.config.ts`, and all 3 test files.

## Commands Executed

```bash
# Tests
npm test
# → 17 passed (3 files), 6.57s

# Live server
npm run dev:mcp
# → Running on http://localhost:3001

# Endpoint verification
GET  http://localhost:3001/health                          # 200 OK, spec: MCP 2025-11-25
POST http://localhost:3001/mcp  {initialize}              # protocolVersion: 2025-11-25
POST http://localhost:3001/mcp  {tools/list}              # 13 tools returned
POST http://localhost:3001/mcp  {tools/call: get_next_action}   # Full NBA response
POST http://localhost:3001/api/alexa/query  "what should I work on next?"  # NEXT_BEST_ACTION intent, 6 tools executed
POST http://localhost:3001/api/alexa/query  "Move my CS assignment to tomorrow"  # RESCHEDULE_TASK, 1 conflict, 1 ripple
```

## Cursor MCP Compatibility Fix

- **Root cause:** `capabilities.experimental.streamableHttp` advertised the Streamable HTTP transport as a server capability and set its value to `true`. The MCP TypeScript SDK's 2025-11-25 `ServerCapabilitiesSchema` expects experimental capability values to be JSON objects, so this boolean fails schema validation. Streamable HTTP is a transport and does not need to be advertised in `capabilities`.
- **Code changed:** Removed `experimental: { streamableHttp: true }` from the initialize response in `apps/mcp-server/src/mcp/streamableHttp.ts`. The existing `tools` and `logging` capabilities and `/mcp` Streamable HTTP endpoint remain unchanged. Updated the capability description in `docs/architecture.md`.
- **Previous capabilities response:**
  ```json
  {"tools":{"listChanged":true},"logging":{},"experimental":{"streamableHttp":true}}
  ```
- **Corrected capabilities response:**
  ```json
  {"tools":{"listChanged":true},"logging":{}}
  ```
- **Test result:** `npm test` passes: 3 test files, 17/17 tests. After the server restarted with the change, `/health` returned healthy, `/mcp` returned the corrected initialize response, `notifications/initialized` returned HTTP 200, and `tools/list` returned all 13 tools. Protocol-level tool discovery is verified; direct discovery in the Cursor UI could not be confirmed from this VS Code session.
