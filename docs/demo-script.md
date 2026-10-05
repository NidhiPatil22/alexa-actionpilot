# ActionPilot Hackathon Demo Script

> **Project**: ActionPilot — The Next-Best-Action Engine for Alexa+  
> **Target Audience**: Hackathon Judges, Alexa+ Engineers, AWS Builders

---

## Pitch Hook (15 seconds)

> *"Most productivity assistants are command responders. You ask them to create a task, and they create a task. But you're still left with the hardest question: **What should I actually work on next?**"*
>
> *"ActionPilot transforms Alexa+ from an assistant you command into a decision partner you give goals to."*

---

## Turn 1: Next Best Action & Explainable Decisions

### Action
Click on the first preset prompt or speak into Alexa:
> **"Alexa, what should I work on next?"**

### What ActionPilot Does
1. Alexa+ receives the utterance and routes the goal to ActionPilot's Remote MCP Server via Streamable HTTP.
2. ActionPilot queries pending deliverables (`get_tasks`), checks today's meetings (`get_calendar`), evaluates schedule pressure (`analyze_workload`), and computes priority scores (`prioritize_tasks`).
3. ActionPilot identifies the optimal uninterrupted focus window (`find_free_slots`).
4. Bedrock synthesizes the conversational explanation.

### Alexa Voice Output
> *"I recommend working on **Complete AWS Bedrock Agent Integration**. It is due today at 5:00 PM, requires 90 minutes of deep work, and you have an open focus window from 2:30 PM to 4:00 PM. Would you like me to book it?"*

### Visual Highlight on Dashboard
- **Next Best Action Hero Card** lights up with 96% confidence score.
- **Explainable Decision Rationale** shows the exact weights: Urgency (95), Importance (100), Energy Match (100), Slot Fit (100).
- **Agent Decision Waterfall** in the Alexa bar expands, showing all 6 tools executed in real time.

---

## Turn 2: Intelligent Scheduling & 1-Click Commitment

### Action
Click **"Book Focus Block on Calendar"** in the Hero Card (or speak: *"Alexa, book that focus block"*).

### What ActionPilot Does
1. Executes `create_focus_block` tool via MCP.
2. Synchronizes task status to `in_progress`.
3. Creates a calendar event linked directly to the task.

### Visual Highlight on Dashboard
- The **Live Schedule & Focus Blocks** timeline updates immediately.
- A glowing violet **"Focus: Complete AWS Bedrock Agent Integration"** block appears in the 2:30 PM slot.
- Workload Radar updates free capacity metrics.

---

## Turn 3: Consequence-Aware Rescheduling ("What-If" Analysis)

### Action
In the Alexa bar or Consequence Simulator, submit:
> **"Move my CS assignment to tomorrow."**

### What ActionPilot Does
Instead of blindly moving the assignment, ActionPilot runs `analyze_consequences`:
1. It simulates moving the 120-minute assignment to tomorrow morning.
2. It detects that tomorrow at 10:00 AM overlaps with an existing flexible focus block ("Flexible Focus Block: CS Prep").
3. It checks for fixed meetings and confirms tomorrow afternoon has a fixed 1:1 at 2:00 PM.
4. It computes an automatic cascade mitigation plan: reschedule the flexible focus block to 3:00 PM, freeing 10:00 AM for the assignment.

### Alexa Voice Output
> *"Moving your assignment to tomorrow morning overlaps with your flexible focus block. I can move that block to 3:00 PM and book your assignment for 10:00 AM. Would you like me to do that?"*

### Visual Highlight on Dashboard
- **Consequence Simulator** shows a warning badge: **REQUIRING RESHUFFLE**.
- Shows detected overlap and the downstream ripple effect.
- The **"Apply Safe Mitigation"** button appears, allowing 1-click execution of the cascade adjustment.

---

## Turn 4: Workload & Capacity Radar

### Action
Submit:
> **"Analyze my workload for today."**

### Alexa Voice Output
> *"Today you have 1.5 hours scheduled in meetings and 4.5 hours of free focus time across 3 slots. Your overall stress index is Balanced. Healthy capacity to complete today's deliverables."*

### Visual Highlight on Dashboard
- **Workload & Burnout Radar** highlights scheduled meetings vs free time vs task demand.
- **Deadline Radar** shows deadline proximity (1 task due today, 1 tomorrow, 1 in 3 days).

---

## Turn 5: Protocol Inspection & Architectural Audit

### Action
Click on the **MCP Protocol Inspector** at the bottom of the screen.

### Visual Highlight on Dashboard
- Demonstrates active connection to `POST http://localhost:3001/mcp` and `GET /sse`.
- Shows all 13 registered MCP tools conforming to MCP Specification 2025-11-25.
- Displays the live streamable HTTP log of JSON-RPC requests and tool payloads generated during the demo.

---

## Closing Summary (15 seconds)

> *"ActionPilot proves that with Alexa+, users shouldn't have to micromanage tasks or calculate their own schedules. With the Model Context Protocol, deterministic safety logic, and Amazon Bedrock, Alexa+ can truly move users from **goals to actions**."*
