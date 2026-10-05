# ActionPilot

### The Next-Best-Action Engine for Alexa+

> **"Don't just ask Alexa. Give it a goal."**

[![CI](https://github.com/actionpilot/actionpilot/actions/workflows/ci.yml/badge.svg)](https://github.com/actionpilot/actionpilot/actions)
[![MCP Spec](https://img.shields.io/badge/MCP%20Spec-2025--11--25-8B5CF6)](https://modelcontextprotocol.io)
[![AWS Bedrock](https://img.shields.io/badge/Amazon%20Bedrock-Claude%203.5%20Sonnet-06B6D4)](https://aws.amazon.com/bedrock/)
[![AWS CDK](https://img.shields.io/badge/AWS%20CDK-v2.179-FF9900)](https://aws.amazon.com/cdk/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

ActionPilot is an **Alexa+ Remote MCP Add-On** that helps users move from **goals to actions**.

Instead of simply responding to atomic requests with individual tool calls, ActionPilot continuously evaluates a user's active tasks, impending deadlines, calendar availability, energy levels, and situational constraints to determine the **Next Best Action**, simulate the **consequences of rescheduling**, and orchestrate multi-tool executions over **Streamable HTTP**.

---

## 🏆 Hackathon Tracks & Challenges

- **Primary Track**: **Alexa+** (Model Context Protocol 2025-11-25 Remote Server)
- **Mini Challenge**: **AWS Builder** (Amazon Bedrock, AgentCore, DynamoDB, ECS Fargate, ALB, CloudWatch, AWS CDK)
- **Challenge**: **Open Source** (MIT Licensed full-stack repository with test coverage)

---

## The Problem

Productivity assistants can create tasks, answer questions, and perform individual commands. But users still have to answer the hardest cognitive questions themselves:
* *What should I work on next?*
* *When should I work on it?*
* *What should I postpone?*
* *What happens to my downstream deadlines if I move something?*
* *Which deadline matters most?*
* *How should I use the 90 minutes of free time I have available this afternoon?*

**ActionPilot operates at this decision layer.**

---

## The Solution: Goal-to-Action Pipeline

ActionPilot acts as a specialized **situational intelligence and decision layer for Alexa+**:

```text
Goal
 ↓
Context (Working hours, peak focus time, energy curve)
 ↓
Constraints (Fixed meetings, dependencies, deadlines)
 ↓
Decision (Deterministic priority & slot scoring)
 ↓
Consequence Analysis (Domino effect & conflict simulation)
 ↓
Plan (Focus blocks & mitigations)
 ↓
Action (Multi-tool MCP execution)
 ↓
Updated State (DynamoDB & AgentCore Memory)
```

For example:
> **"Alexa, what should I work on next?"**

ActionPilot inspects the user's active deliverables, queries the calendar, identifies the highest-value deliverable, finds an uninterrupted free slot that fits the task's required energy type, and schedules a focus block with an explainable rationale.

---

## Key Features

### 1. 🎯 Next Best Action Engine
Considers:
* Proximity to deadline (exponential urgency curve)
* Task priority (1-5 scale)
* Estimated duration vs available slot fit
* Energy level requirements (`deep_work`, `shallow_work`, `quick_win`)
* Unfinished dependency blockers
* User workload pressure

### 2. ⚡ Consequence-Aware Rescheduling ("What-If" Engine)
Before moving an item (e.g., *"Move my CS assignment to tomorrow"*), ActionPilot simulates the move:
* Checks for collisions with non-movable fixed meetings.
* Flags critical deadline breaches.
* Computes cascading ripple effects on downstream dependent tasks.
* Automatically formulates a cascade mitigation plan (e.g., shifting flexible blocks).

### 3. 🧠 Contextual Memory & Learned Habits
Remembers user-specific scheduling patterns:
* Peak focus hours (e.g. 09:00 - 12:00 morning deep work)
* Preferred focus sprint durations (e.g. 90 minutes)
* Buffer cushion preferences between meetings
* Active north-star goals

### 4. 🗣️ Explainable Decisions for Alexa Voice
Explains *why* an action was recommended in plain, conversational language:
> *"I prioritized Complete AWS Bedrock Agent Integration because it is due today at 5:00 PM and you have an open 90-minute focus block starting at 2:30 PM."*

### 5. 📡 Streamable HTTP MCP 2025-11-25 Protocol
Remote MCP server exposing:
* `/mcp`: Streamable HTTP JSON-RPC 2.0 endpoint
* `/sse`: Server-Sent Events stream for live execution logs
* 13 First-Class MCP Tools with complete input/output schemas

---

## Architecture

```text
                         USER (Voice or Web)
                                  │
                                  ▼
                         ┌─────────────────┐
                         │     Alexa+      │
                         │   MCP Client    │
                         └────────┬────────┘
                                  │
                        Streamable HTTP (SSE)
                        MCP Spec: 2025-11-25
                                  │
                                  ▼
                 ┌─────────────────────────────────┐
                 │  ActionPilot Remote MCP Server  │
                 │   (Node.js / Express / TS)      │
                 └────────────────┬────────────────┘
                                  │
                 ┌────────────────┴────────────────┐
                 │                                 │
                 ▼                                 ▼
       ┌───────────────────┐             ┌───────────────────┐
       │   Amazon Bedrock  │             │   Deterministic   │
       │  (Claude 3.5 /    │             │   Math & Rule     │
       │   AgentCore)      │             │     Engine        │
       └─────────┬─────────┘             └─────────┬─────────┘
                 │                                 │
                 │  NLU & Explainable              │  Free Slots, Priority
                 │  Voice Synthesis                │  Consequence Check
                 └────────────────┬────────────────┘
                                  │
                                  ▼
                 ┌─────────────────────────────────┐
                 │        Amazon DynamoDB          │
                 │  (Tasks, Calendar, UserContext) │
                 └────────────────┬────────────────┘
                                  │
                                  ▼
                 ┌─────────────────────────────────┐
                 │     React Dashboard (Vite)      │
                 │   (Tailwind CSS & Recharts)     │
                 └─────────────────────────────────┘
```

---

## 13 Registered MCP Tools

| Tool | Purpose |
|---|---|
| `create_task` | Create new task with deadlines, effort, priority, and energy level. |
| `get_tasks` | Query user tasks with status/tag filters. |
| `update_task` | Modify attributes, schedule, or status of an existing task. |
| `complete_task` | Mark task completed and update workload capacity. |
| `get_calendar` | Retrieve calendar events and focus blocks. |
| `find_free_slots` | Deterministically locate continuous free windows in working hours. |
| `analyze_workload` | Compute capacity ratio, stress index, and deadline distribution. |
| `prioritize_tasks` | Deterministically score and rank all active tasks. |
| `get_next_action` | **Flagship**: Compute the single Next Best Action with explainability. |
| `create_focus_block` | Reserve a dedicated calendar block for a task. |
| `analyze_consequences` | **Flagship**: Simulate schedule movements, detect clashes & ripple effects. |
| `get_user_context` | Retrieve learned habits, work hours, and active goals. |
| `save_user_preference` | Store a learned preference into persistent contextual memory. |

---

## Repository Structure

```text
actionpilot/
├── apps/
│   ├── mcp-server/              # Remote MCP Server (Streamable HTTP 2025-11-25)
│   │   ├── src/
│   │   │   ├── agent/           # Bedrock & Alexa Orchestrator
│   │   │   ├── engine/          # Deterministic Scheduling, Priority & Consequence Logic
│   │   │   ├── mcp/             # Streamable HTTP & SSE Protocol Handlers
│   │   │   ├── storage/         # Amazon DynamoDB & Resilient Memory Store
│   │   │   ├── tools/           # 13 Registered MCP Tool Definitions & Handlers
│   │   │   └── index.ts         # Server Entry Point
│   │   └── Dockerfile           # Production container for ECS Fargate
│   │
│   └── web/                     # Interactive React Dashboard
│       ├── src/
│       │   ├── components/      # Alexa Bar, Hero, Consequence Sandbox, Timeline, Radar
│       │   ├── api.ts           # Client API & MCP connector
│       │   └── App.tsx          # Main Application
│       └── vite.config.ts
│
├── agent/                       # Strands Agent SDK integration
├── infrastructure/
│   └── cdk/                     # AWS CDK Stack (ECS Fargate, ALB, DynamoDB, Bedrock IAM)
│
├── docs/
│   ├── architecture.md          # Comprehensive architecture & design document
│   ├── mcp-tools.md             # Full API reference for all 13 MCP tools
│   ├── aws-integration.md       # AWS Builder Mini Challenge write-up
│   ├── testing.md               # Test strategy & verification guide
│   ├── demo-script.md           # Turn-by-turn presentation & voice demo script
│   └── product-feedback.md      # Developer feedback for Amazon Alexa+ and MCP teams
│
├── tests/
│   └── integration.test.ts      # E2E integration test suite for 4 core scenarios
│
└── .github/
    └── workflows/
        └── ci.yml               # GitHub Actions CI pipeline
```

---

## Local Development & Quickstart

### 1. Clone & Install
```bash
git clone https://github.com/actionpilot/actionpilot.git
cd actionpilot
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
*(The repository includes a zero-config offline fallback mode so anyone can run, test, and evaluate the full application without setting up AWS credentials!)*

### 3. Start the MCP Server
```bash
npm run dev:mcp
```
* MCP Streamable HTTP endpoint: `http://localhost:3001/mcp`
* SSE Event stream: `http://localhost:3001/sse`
* Health check: `http://localhost:3001/health`

### 4. Start the Web Dashboard
```bash
npm run dev:web
```
Visit `http://localhost:5173` in your browser.

---

## Testing

Run the automated test suite across deterministic algorithms, tool definitions, and agent workflows:

```bash
npm test
```

All 17 tests verify:
- Free slot interval calculation and buffer padding
- Multi-factor non-linear priority scoring
- Consequence analysis with cascading ripple effect detection
- JSON-Schema validation of all 13 MCP tools
- Complete E2E agent workflows for the 4 core demo scenarios

---

## AWS Deployment (AWS CDK)

Synthesize and deploy the production infrastructure to AWS ECS Fargate:

```bash
cd infrastructure/cdk
npm run synth
npx cdk deploy
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.
