# Developer Experience & Product Feedback for Alexa+ MCP Team

> **Author**: ActionPilot Team  
> **Topic**: Developer Experience Feedback for Amazon Alexa+ and Model Context Protocol (MCP)  
> **Context**: Amazon Developer Hackathon 2026

During the design and implementation of ActionPilot, our team worked extensively with the **MCP 2025-11-25 specification**, **Streamable HTTP remote transports**, and **Amazon Bedrock Agent orchestration**. Below is constructive feedback based on real-world implementation experience.

---

## 1. Streamable HTTP vs. STDIO Transport for Voice Assistants

### Observation
While standard desktop MCP implementations often rely on STDIO process spawning, an ambient voice assistant like Alexa+ fundamentally requires **Remote Streamable HTTP (SSE)**.

### Feedback & What Worked Well
- Having a bidirectional HTTP endpoint (`/mcp` for JSON-RPC 2.0 requests with `/sse` for Server-Sent Events) made remote hosting on AWS ECS Fargate and ALB straightforward.
- Session headers (`Mcp-Session-Id`) allowed correlation across multiple conversational turns.

### Opportunities for Improvement
- **Streaming Response Standard**: The spec would benefit from a clearer normative definition for chunked tool outputs during long-running deterministic simulations.
- **Heartbeat & Reconnection Guidance**: Clearer guidelines on recommended ping intervals (e.g. 15s or 30s) across cloud load balancers that have aggressive idle timeouts (e.g., ALB 60s default).

---

## 2. Tool Discovery & Dynamic Capability Negotiation

### Observation
In our setup, 13 rich tools are exposed. When an LLM receives 13 large JSON schemas, token overhead and latency increase.

### Feedback
- We found that grouping related tools into sub-namespaces (e.g. `calendar:*`, `tasks:*`, `intelligence:*`) helped agent intent classification.
- **Recommendation**: Native support in the MCP spec for tool filtering or contextual tool discovery (e.g., `tools/list` accepting a domain or category filter) would significantly optimize prompt tokens for resource-constrained voice interactions.

---

## 3. Consequence-Aware Scheduling Patterns

### Observation
A core learning from ActionPilot is that **voice assistants should never rely on generative LLMs for interval arithmetic or constraint validation**.

### Recommendation for Alexa+ Skill/MCP Developers
- We recommend that the Alexa+ developer documentation explicitly advocate for a two-tier pattern:
  1. **Generative Tier**: Natural language intent parsing, user personality, and explainability (via Bedrock Claude 3.5 Sonnet / Nova).
  2. **Deterministic Tier**: Time calculation, overlap detection, deadline calculation, and graph dependency resolution (via TypeScript / Python application logic).
- Providing reference templates for this pattern in the Alexa+ SDK will prevent common scheduling hallucinations across third-party extensions.

---

## 4. Authentication & Cloud Deployment Experience

### Observation
Running remote MCP servers behind AWS Application Load Balancers requires careful handling of CORS and health checks.

### Feedback
- Adding an unauthenticated `/health` endpoint is essential for ALB target group health checks without interfering with JSON-RPC `/mcp` endpoints.
- When pairing Alexa+ with IAM-authenticated services, using AWS SigV4 headers or bearer token validation on the Streamable HTTP gateway provides robust enterprise security.
