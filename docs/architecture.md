# ActionPilot Architecture Documentation

> **ActionPilot**: The Next-Best-Action Engine for Alexa+  
> **Hackathon**: Build, Ship, Shape: Amazon Developer Hackathon 2026  
> **Track**: Alexa+ | **Mini Challenge**: AWS Builder | **Challenge**: Open Source

---

## 1. High-Level Overview

ActionPilot acts as a specialized **situational intelligence and decision layer** for Alexa+. While standard voice assistants respond to atomic requests with individual tool executions, ActionPilot bridges the critical gap between **high-level user goals** and **deterministic, consequence-aware action execution**.

```
                         USER (Voice or Chat)
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
                 │  Natural Language &             │  Slot Detection,
                 │  Explainability                 │  Priority Scoring,
                 │                                 │  Consequence Check
                 └────────────────┬────────────────┘
                                  │
                                  ▼
                 ┌─────────────────────────────────┐
                 │        Persistence Layer        │
                 │   (Amazon DynamoDB / Memory)    │
                 └────────────────┬────────────────┘
                                  │
                                  ▼
                 ┌─────────────────────────────────┐
                 │    Real-Time React Dashboard    │
                 │      (Tailwind & Recharts)      │
                 └─────────────────────────────────┘
```

---

## 2. Separation of Concerns: Deterministic Logic vs. Generative AI

A common failure mode in AI-powered productivity tools is relying on LLMs to perform arithmetic, interval overlap math, or constraint validation. LLMs can hallucinate free slots, miss timezone offsets, or produce scheduling collisions.

ActionPilot strictly decouples reasoning:

| Layer | Responsibility | Technology |
|---|---|---|
| **Natural Language Understanding & Intent Extraction** | Understands user voice utterances, extracts relative time markers ("tomorrow afternoon"), structures goals. | Amazon Bedrock (Claude 3.5 Sonnet / Bedrock Nova) |
| **Context & Long-term Preferences** | Tracks user habits (e.g. morning deep work preference, 90-min sprints). | Amazon Bedrock AgentCore Memory & DynamoDB |
| **Free Slot Detection** | Pure interval arithmetic, working hours boundaries, buffer padding, day-part categorization. | Deterministic TypeScript Engine (`freeSlots.ts`) |
| **Multi-Factor Priority Scoring** | Non-linear urgency curves based on deadline proximity, user importance weights, and energy matching. | Deterministic TypeScript Engine (`priorityScorer.ts`) |
| **Consequence & Ripple-Effect Simulation** | Clones schedule state, validates hard constraints, checks fixed meetings, cascades dependent task delays. | Deterministic TypeScript Engine (`consequenceEngine.ts`) |
| **Explainable Decisions** | Generates clear, concise conversational rationale for Alexa voice output ("I prioritized this assignment because..."). | Bedrock + ActionPilot Decision Synthesizer |

---

## 3. Protocol: Model Context Protocol (MCP) 2025-11-25

ActionPilot exposes its intelligence through the standard **Model Context Protocol (MCP)** specification:

- **Transport**: Streamable HTTP (`/mcp` endpoint) with Server-Sent Events (`/sse`).
- **Remote MCP Server**: Deployed on AWS ECS Fargate behind an Application Load Balancer with public HTTPS.
- **Protocol Handlers**:
  - `initialize`: Advertises MCP protocol version `2025-11-25`, server capabilities (`tools`, `logging`), and metadata. Streamable HTTP is the transport, not a server capability.
  - `tools/list`: Dynamic discovery of all 13 registered tools with JSON-Schema validation.
  - `tools/call`: Executes deterministic scheduling, consequence analysis, or calendar operations and returns structured JSON output.
  - `sse`: Real-time bidirectional event streaming for live execution waterfalls.

---

## 4. The Agentic Goal-to-Action Pipeline

When a user says:
> *"Alexa, what should I work on next?"*

ActionPilot runs the following deterministic agentic pipeline:

```
User Utterance
      ↓
Alexa+ / Bedrock Intent Recognition
      ↓
get_tasks (Query active deliverables)
      ↓
get_calendar (Retrieve meetings & fixed blocks)
      ↓
analyze_workload (Compute capacity ratio & stress index)
      ↓
prioritize_tasks (Multi-factor urgency & importance scoring)
      ↓
find_free_slots (Find optimal uninterrupted focus window)
      ↓
get_next_action (Synthesize decision, factors & confidence score)
      ↓
Speech Output & Live UI Update (Explainable rationale)
```

---

## 5. Consequence-Aware Rescheduling Workflow

When a user says:
> *"Move my CS assignment to tomorrow."*

Instead of blindly rescheduling the item:

1. **Simulate Mutation**: ActionPilot creates an in-memory shadow branch of the user's schedule.
2. **Fixed Meeting Check**: Detects if the proposed slot collides with non-movable commitments (e.g., "Weekly 1:1 with Lead Architect").
3. **Deadline Breach Check**: Verifies if moving the task pushes its completion time past its deadline.
4. **Downstream Dependency Check**: Examines tasks that depend on this task (e.g., "Prepare Slide Deck depends on AWS Bedrock integration"). If the dependency buffer is violated, a cascade delay is flagged.
5. **Cascade Mitigation**: Computes alternative conflict-free slots or suggests shifting flexible focus blocks.
6. **Voice Synthesis**: Alexa reports:
   > *"Warning: Moving your assignment to tomorrow morning overlaps with your flexible focus block. I can move that block to 3:00 PM and book your assignment for 10:00 AM. Would you like me to do that?"*

---

## 6. AWS Production Topology

- **AWS ECS Fargate**: Serverless container execution hosting the ActionPilot MCP Server.
- **Application Load Balancer (ALB)**: Public endpoint routing Streamable HTTP and SSE requests with health checks at `/health`.
- **Amazon DynamoDB**: Three high-performance NoSQL tables (`ActionPilot-Tasks`, `ActionPilot-Calendar`, `ActionPilot-UserContext`) with on-demand capacity.
- **Amazon Bedrock**: Foundation model inference for natural language understanding and explainable voice generation.
- **Amazon CloudWatch**: End-to-end monitoring with dashboards tracking request latency, tool execution count, and container CPU/memory.
- **AWS CDK**: Infrastructure defined as TypeScript code for reproducible 1-click deployments.
