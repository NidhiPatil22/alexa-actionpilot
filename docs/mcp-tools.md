# ActionPilot MCP Tools Reference

ActionPilot implements the **Model Context Protocol (MCP) specification 2025-11-25** using **Streamable HTTP**.

All tools are accessible via JSON-RPC 2.0 requests to the `/mcp` endpoint or via SSE notifications at `/sse`.

---

## Tool Directory

| # | Tool Name | Description | Key Parameters |
|---|---|---|---|
| 1 | `create_task` | Create a task with deadlines, effort, priority, and energy level. | `title`, `deadline`, `priority`, `estimatedDuration`, `energyLevel` |
| 2 | `get_tasks` | Query user tasks with optional status or tag filtering. | `status`, `tag` |
| 3 | `update_task` | Modify attributes, schedule, or status of an existing task. | `id`, partial fields |
| 4 | `complete_task` | Mark a task as completed and update workload capacity. | `id` |
| 5 | `get_calendar` | Retrieve calendar events and focus blocks for a date range. | `startDate`, `endDate` |
| 6 | `find_free_slots` | Deterministically find free focus slots within working hours. | `date`, `minDurationMinutes` |
| 7 | `analyze_workload` | Compute capacity ratio, stress index, and deadline distribution. | `date` |
| 8 | `prioritize_tasks` | Deterministically rank active tasks by urgency & importance. | none |
| 9 | `get_next_action` | **Flagship**: Compute the single Next Best Action with full explainability. | none |
| 10 | `create_focus_block` | Reserve a dedicated calendar block for a task. | `taskId`, `title`, `start`, `end` |
| 11 | `analyze_consequences` | **Flagship**: Simulate schedule movements, detect clashes & ripple effects. | `taskId`, `proposedDateOrTime` |
| 12 | `get_user_context` | Retrieve learned habits, work hours, and active goals. | none |
| 13 | `save_user_preference` | Store a learned preference into persistent contextual memory. | `key`, `value` |

---

## Detailed Tool Specifications

### 1. `get_next_action`
The core decision engine of ActionPilot. Synthesizes tasks, calendar events, working hours, and workload pressure to recommend the highest-value action.

#### Request Example (JSON-RPC 2.0)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_next_action",
    "arguments": {}
  }
}
```

#### Response Example
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"recommendedTask\": {\n    \"id\": \"task-bedrock-01\",\n    \"title\": \"Complete AWS Bedrock Agent Integration\",\n    \"priority\": 5,\n    \"estimatedDuration\": 90,\n    \"energyLevel\": \"deep_work\"\n  },\n  \"confidenceScore\": 96,\n  \"recommendedSlot\": {\n    \"start\": \"2026-10-05T14:30:00.000Z\",\n    \"end\": \"2026-10-05T16:00:00.000Z\",\n    \"formattedTime\": \"Oct 5 from 02:30 PM to 04:00 PM\"\n  },\n  \"reasoning\": \"Prioritized 'Complete AWS Bedrock Agent Integration' (Priority 5/5) because it is due in 3 hours and matches an open focus window.\",\n  \"factors\": {\n    \"urgency\": 95,\n    \"importance\": 100,\n    \"energyFit\": 100,\n    \"slotFit\": 100,\n    \"workloadPressure\": 45\n  },\n  \"explanationForAlexa\": \"I recommend working on Complete AWS Bedrock Agent Integration. It is due in 3 hours, and you have an open 90-minute focus block starting at 02:30 PM. Would you like me to book it?\"\n}"
      }
    ]
  }
}
```

---

### 2. `analyze_consequences`
Evaluates the downstream repercussions of rescheduling a task.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "taskId": { "type": "string", "description": "ID or title of the task" },
    "proposedDateOrTime": { "type": "string", "description": "Target date or ISO timestamp (e.g. 'tomorrow', '2026-10-06T14:00:00Z')" }
  },
  "required": ["taskId", "proposedDateOrTime"]
}
```

#### Response Structure
- `isFeasible`: `boolean`
- `impactSeverity`: `'none' | 'low' | 'medium' | 'high' | 'critical'`
- `conflicts`: Array of overlapping calendar events with fixed/flexible indicators.
- `deadlineBreaches`: Array of tasks that will miss deadlines if this move occurs.
- `rippleEffects`: Array of dependent tasks impacted by cascading delays.
- `mitigationPlan`: Concrete suggestion to resolve conflicts.
- `alternativeSlots`: Array of conflict-free slots on target day.
- `explanationForAlexa`: Voice-optimized natural language explanation.

---

### 3. `find_free_slots`
Deterministically calculates available time windows within working hours.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "date": { "type": "string", "description": "YYYY-MM-DD or 'today' | 'tomorrow'" },
    "minDurationMinutes": { "type": "number", "description": "Minimum continuous duration in minutes (default: 30)" }
  }
}
```

#### Output
Array of `TimeSlot` objects containing:
- `start` (ISO 8601)
- `end` (ISO 8601)
- `durationMinutes` (number)
- `energyFit` (`'ideal' | 'moderate' | 'low'`)

---

### 4. `create_focus_block`
Reserves time on the calendar dedicated to a specific task and updates the task state to `in_progress`.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "taskId": { "type": "string" },
    "title": { "type": "string" },
    "start": { "type": "string" },
    "end": { "type": "string" }
  },
  "required": ["taskId", "title", "start", "end"]
}
```

---

### 5. `analyze_workload`
Evaluates daily scheduled meetings, free focus time, and workload stress levels.

#### Output
- `totalScheduledMinutes`: Total minutes in meetings.
- `totalFreeMinutes`: Total available focus time.
- `taskDemandMinutes`: Minutes needed for tasks due today.
- `capacityRatio`: Demand vs. free time ratio.
- `stressLevel`: `'low' | 'moderate' | 'high' | 'critical'`.
- `deadlineDistribution`: Tasks due today, tomorrow, within 3 days, and within a week.
- `recommendations`: Actionable workload balancing suggestions.
