# ActionPilot: Full Project Implementation & Architectural Guide

> **Project:** ActionPilot — The Next-Best-Action Engine for Alexa+  
> **Event:** Amazon Developer Hackathon 2026  
> **Specification Standard:** Model Context Protocol (MCP) 2025-11-25 (Streamable HTTP)  
> **AI / Cloud Services:** Amazon Bedrock (Anthropic Claude 3.5 Sonnet) & AWS DynamoDB / AWS CDK  

---

## 1. Executive Summary & Core Philosophy

Traditional voice assistants operate on an **atomic, request-response model**:
- User: *"Add 'write report' to my list."*
- Assistant: Calls `create_task()` and stops.
- User: *"What's on my calendar?"*
- Assistant: Calls `list_events()` and stops.

In contrast, **ActionPilot** is a **situational intelligence engine** designed for **Alexa+**. When a user gives Alexa a goal or asks *"What should I work on next?"*, ActionPilot does not merely query a database; it evaluates:
1. **Pending tasks and deadlines**
2. **Calendar events and buffer times**
3. **User energy matching** (Deep Work vs. Shallow Work vs. Quick Win)
4. **Task dependency graphs**
5. **Downstream consequences of rescheduling** (preventing domino-effect conflicts)
6. **Burnout and workload stress index**

Through the **Model Context Protocol (MCP)** over **Streamable HTTP**, ActionPilot provides 13 standardized tools that Alexa+ or any frontier LLM can orchestrate autonomously.

---

## 2. Complete Architecture Overview

```
                      +------------------------------------------+
                      |         Alexa+ / Bedrock Agent           |
                      |  (Conversational Intent Understanding)   |
                      +--------------------+---------------------+
                                           |
                              HTTP JSON-RPC 2.0 / SSE
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                            Remote MCP Server (:3001)                              |
|                                                                                   |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | /mcp (POST/GET)    |  | /sse (Live Stream) |  | /health                     |  |
|  | JSON-RPC 2.0       |  | EventSource Stream |  | MCP 2025-11-25 Verification  |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                      ActionPilot Deterministic Engines                      |  |
|  |                                                                             |  |
|  |  +---------------------+  +----------------------+  +--------------------+  |  |
|  |  | Priority Scorer     |  | Consequence Engine   |  | Workload Analyzer  |  |  |
|  |  | (Urgency, Energy)   |  | (Domino Conflict Sim)|  | (Stress & Capacity)|  |  |
|  |  +---------------------+  +----------------------+  +--------------------+  |  |
|  |                                                                             |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | Next-Best-Action Synthesizer (Slot Matching + Explainable Rationale)  |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                        13 Remote MCP Tool Registrations                     |  |
|  |  get_tasks, create_task, update_task, complete_task, get_calendar_events,   |  |
|  |  create_calendar_event, find_free_slots, prioritize_tasks, analyze_conseq, |  |
|  |  analyze_workload, get_next_action, create_focus_block, get_user_context    |  |
|  +-----------------------------------------------------------------------------+  |
|                                           |                                       |
|  +----------------------------------------+------------------------------------+  |
|  | Storage Layer: AWS DynamoDB Client (with zero-config In-Memory Fallback)    |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                           |
                               REST / SSE / WebSockets
                                           v
+-----------------------------------------------------------------------------------+
|                         ActionPilot Frontend Dashboard (:5173)                    |
|                         (Vite + React 18 + Tailwind CSS)                          |
|                                                                                   |
|  - Glowing AI Voice Orb (Equalizer wave animation, sound pulse)                   |
|  - Floating Command Bar & Quick Suggestion Chips                                  |
|  - AI Recommendation Hero with Explainable Rationale & Visual Progress Scoring   |
|  - What-If Rescheduling Sandbox with 1-Click Remedy Application                   |
|  - Calendar Schedule & Workload Burnout Radar (Recharts)                          |
|  - Task Matrix & Live Protocol Inspector                                          |
+-----------------------------------------------------------------------------------+
```

---

## 3. Backend & MCP Engine Implementation Details

### 3.1 Remote MCP Server (`apps/mcp-server/src/index.ts`)
- **Transport**: Conforms to the official **MCP 2025-11-25** specification using **Streamable HTTP**.
- **Endpoints**:
  - `POST /mcp`: Handles JSON-RPC 2.0 requests:
    - `initialize`: Returns protocol version (`2025-11-25`), server capabilities (tools, logging), and server metadata.
    - `tools/list`: Exposes all 13 tool definitions with strict JSON Schema schemas validated via Zod.
    - `tools/call`: Dispatches calls to underlying engines and returns structured tool results.
  - `GET /sse`: Server-Sent Events stream for real-time dashboard updates when tools execute.
  - `GET /health`: Health-check endpoint verifying MCP protocol readiness.
  - `GET/POST /api/*`: REST endpoints for dashboard hydration (tasks, calendar, workload, next action).

### 3.2 Deterministic Planning Engines (`apps/mcp-server/src/engine/`)

#### 1. Priority Scorer (`priorityScorer.ts`)
Calculates a 0–100 multi-factor priority score without relying on non-deterministic LLM hallucinations:
$$\text{Score} = w_{\text{urgency}} \cdot U + w_{\text{importance}} \cdot I + w_{\text{energy}} \cdot E + w_{\text{fit}} \cdot S$$
- **Urgency (0–100)**: Exponential decay based on hours remaining until deadline:
  - $< 6\text{h}$: Urgency 95–100.
  - $< 24\text{h}$: Urgency 80–90.
  - $> 72\text{h}$: Smooth gradient decay.
- **Importance (0–100)**: Direct mapping from task priority (P5 = 100, P4 = 80, P3 = 60, etc.).
- **Energy Match (0–100)**: Compares task energy level (`deep_work`, `shallow_work`, `quick_win`) against user current energy and time of day (e.g., peak morning deep work).
- **Dependency Penalty**: If prerequisite tasks are incomplete, the task score is severely discounted to prevent invalid execution.

#### 2. Consequence Engine (`consequenceEngine.ts`)
Simulates the **cascading ripple effects** of moving or postponing a task:
- **Direct Collision Detection**: Identifies overlapping fixed calendar events (meetings, syncs).
- **Deadline Breach Analysis**: Evaluates whether rescheduling pushes the task past its hard deadline.
- **Domino Cascade**: Evaluates whether moving task $A$ delays dependent task $B$, causing a secondary deadline violation.
- **Automated Mitigation**: Automatically scans the calendar to propose alternative conflict-free windows and returns an actionable remedy.

#### 3. Workload Analyzer (`workloadAnalyzer.ts`)
- Computes **Capacity Ratio** ($\frac{\text{Task Demand Minutes}}{\text{Free Calendar Minutes}}$).
- Categorizes stress levels into `healthy`, `balanced`, `high`, or `critical` (burnout risk).
- Aggregates deadline distribution (`today`, `tomorrow`, `within3Days`, `withinWeek`).

#### 4. Next Best Action Synthesizer (`nextBestAction.ts`)
Combines task prioritization with calendar free-slot detection:
- Finds contiguous available focus blocks matching the estimated duration.
- Generates an **Explainable Decision Rationale** explaining *why* this task was selected over other candidates.

---

## 4. Frontend Visual & UI/UX Transformation

### 4.1 Design Philosophy: Moving from Enterprise Dashboard to Futuristic Voice Companion
The initial UI resembled a dark enterprise dashboard with rigid rectangles, dense text tables, and blue/cyan outlines. Inspired by modern voice assistant interfaces (like the Amazon Alexa reference designs), the frontend was completely overhauled:

1. **Atmospheric Environment**:
   - Background transitioned from plain gray to deep obsidian/purple (`#05030A`, `#0B0614`, `#12081F`).
   - Multiple layers of ambient radial purple/magenta glows placed behind hero components.
   - Glassmorphism primitives (`backdrop-blur-2xl`, translucent borders `border-purple-500/20`).

2. **Flagship Centerpiece: The AI Voice Orb (`AlexaVoiceBar.tsx`)**:
   - **Visual Anchor**: Replaced the small mic input with a large, glowing circular AI Voice Orb.
   - **Breathing Light & Waveforms**: Concentric pulsing rings (`animate-ring-pulse`) and an interactive audio equalizer animation (`animate-wave-1` through `animate-wave-7`) that shifts during AI reasoning.
   - **Floating Command Bar**: Rounded-full pill input with glass backdrop and glowing purple-magenta **"Ask"** button.
   - **Quick Suggestions**: Pill chips (`"What should I work on next?"`, `"Move CS assignment to tomorrow"`) that trigger conversational intent.

3. **AI Recommendation Card (`NextBestActionHero.tsx`)**:
   - **32px Rounded Glass Panel**: Prominent bold typography for the recommended task.
   - **Engine Confidence Indicator**: Sleek pill badge with an integrated gradient progress bar.
   - **Scoring Progress Indicators**: Converted spreadsheet-style numbers into visual AI scoring progress bars (*Urgency*, *Importance*, *Energy Match*, *Slot Fit*).
   - **Optimal Time Slot Card**: Dedicated card with glowing calendar icon and a 1-click **"Book Focus Block"** button.

4. **Minimalist Text Simplification**:
   - Replaced verbose developer jargon with clean, user-friendly labels:
     - *"Consequence-Aware Rescheduling Sandbox"* $\rightarrow$ **"Schedule Sandbox"**
     - *"Deterministic + Bedrock Synthesized"* $\rightarrow$ Removed in favor of a clean **"Recommendation"** badge
     - *"Live Streamable HTTP Activity"* $\rightarrow$ **"Live Activity"**
     - Subtitle instructions shortened to clean, punchy copy to maintain visual breathing room.

---

## 5. File-by-File Changes & Implementation Map

| File Path | Description of Changes & Implementation Logic |
| :--- | :--- |
| [`tailwind.config.js`](file:///c:/Users/Asus/Downloads/alexa/apps/web/tailwind.config.js) | Added deep obsidian dark palette (`#05030A`), violet/fuchsia/magenta color scales, custom glow box-shadows (`glow-purple`, `glow-orb`), and keyframes for `orb-breathe` and `ring-expand`. |
| [`index.css`](file:///c:/Users/Asus/Downloads/alexa/apps/web/src/index.css) | Defined atmospheric radial gradient backgrounds, glassmorphism utilities (`.glass-panel`, `.glass-card`, `.glass-input`), custom purple scrollbars, and 7-bar audio waveform bounce animations. |
| [`App.tsx`](file:///c:/Users/Asus/Downloads/alexa/apps/web/src/App.tsx) | Added fixed ambient blur lighting layers, refreshed layout grid spacing, simplified minimal footer, and wired all state management and SSE listeners. |
| [`Header.tsx`](file:///c:/Users/Asus/Downloads/alexa/apps/web/src/components/Header.tsx) | Redesigned into a floating glass bar with glowing ActionPilot logo avatar, minimal status pills (`MCP`, `Bedrock`), and rounded pill action buttons. |
| [`AlexaVoiceBar.tsx`](file:///c:/Users/Asus/Downloads/alexa/apps/web/src/components/AlexaVoiceBar.tsx) | Transformed into the centerpiece AI Voice Assistant: glowing concentric voice orb, animated audio equalizer, floating command pill, and multi-tool reasoning drawer. |
| [`NextBestActionHero.tsx`](file:///c:/Users/Asus/Downloads/alexa/apps/web/src/components/NextBestActionHero.tsx) | Redesigned into a smart recommendation card with visual scoring progress bars, confidence pill, best time slot card, and 1-click calendar sync. |
| [`ConsequenceSimulator.tsx`](file:///c:/Users/Asus/Downloads/alexa/apps/web/src/components/ConsequenceSimulator.tsx) | Redesigned into a clean "Schedule Sandbox" with rounded selects, glowing impact badges (`SAFE TO MOVE`, `CRITICAL CONFLICT`), and 1-click remedy button. |
| [`CalendarTimeline.tsx`](file:///c:/Users/Asus/Downloads/alexa/apps/web/src/components/CalendarTimeline.tsx) | Implemented schedule timeline with pill date toggle (Today/Tomorrow), glowing focus blocks, and fixed event locks. |
| [`WorkloadRadar.tsx`](file:///c:/Users/Asus/Downloads/alexa/apps/web/src/components/WorkloadRadar.tsx) | Updated Recharts bar chart with vibrant violet and fuchsia fills, clean deadline distribution counters, and burnout risk badges. |
| [`TaskMatrix.tsx`](file:///c:/Users/Asus/Downloads/alexa/apps/web/src/components/TaskMatrix.tsx) | Redesigned active/completed task list with smooth completion checkmarks, priority badges, and 1-click "Reschedule" test buttons. |
| [`McpStreamableInspector.tsx`](file:///c:/Users/Asus/Downloads/alexa/apps/web/src/components/McpStreamableInspector.tsx) | Streamlined protocol inspector with copyable endpoint URL, tool schema viewer, and live JSON-RPC execution log stream. |
| [`NewTaskModal.tsx`](file:///c:/Users/Asus/Downloads/alexa/apps/web/src/components/NewTaskModal.tsx) | Styled modal with rounded-3xl glass backdrop, purple focus rings, and gradient submission button. |
| [`PreferencesModal.tsx`](file:///c:/Users/Asus/Downloads/alexa/apps/web/src/components/PreferencesModal.tsx) | Styled context memory modal for peak focus hours, work hours, and deadline buffer settings. |

---

## 6. How to Run and Verify the Project

### 6.1 Prerequisites
- **Node.js**: v20+ (Verified on Node v24.20.0, npm 11.19.0)
- **Dependencies**: Installed via root `npm install` (monorepo workspaces).

### 6.2 Running the Application
From the workspace root (`c:\Users\Asus\Downloads\alexa`):
```bash
# Start both Remote MCP Server (:3001) and Web Frontend (:5173) concurrently
npm run dev
```

### 6.3 Endpoints
- **Web Frontend Dashboard**: [http://localhost:5173/](http://localhost:5173/)
- **Remote MCP Endpoint**: [http://localhost:3001/mcp](http://localhost:3001/mcp) (POST JSON-RPC 2.0)
- **Live SSE Event Stream**: [http://localhost:3001/sse](http://localhost:3001/sse)
- **Health Check**: [http://localhost:3001/health](http://localhost:3001/health)

### 6.4 Verification & Testing
```bash
# Run complete test suite (37 tests across 5 test suites)
npm test

# Build frontend bundle
npm --workspace=apps/web run build
```
All **37 automated tests** pass, verifying MCP protocol conformance, priority scoring, consequence analysis, and end-to-end multi-tool execution.
