# AWS Services Integration Guide

> **Challenge Track**: AWS Builder Mini Challenge  
> **Project**: ActionPilot — Next-Best-Action Engine for Alexa+

ActionPilot demonstrates deep, meaningful integration across the AWS ecosystem, combining cutting-edge generative AI, contextual memory, serverless container orchestration, and real-time NoSQL persistence.

---

## 1. Amazon Bedrock & Claude 3.5 Sonnet

### Role in ActionPilot
Amazon Bedrock serves as the cognitive reasoning engine for ActionPilot. While deterministic logic handles time, arithmetic, and conflict calculations, Bedrock handles:
- **Natural Language Understanding (NLU)**: Parsing ambiguous voice queries and intent extraction.
- **Explainable Decisions**: Translating complex multi-factor priority scores into warm, clear, conversational Alexa voice output.
- **Context Synthesis**: Grounding user goals against situational calendar state.

### Code Implementation
Located in [`apps/mcp-server/src/agent/bedrockClient.ts`](file:///c:/Users/Asus/Downloads/alexa/apps/mcp-server/src/agent/bedrockClient.ts):
```typescript
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const command = new InvokeModelCommand({
  modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  contentType: 'application/json',
  accept: 'application/json',
  body: JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are ActionPilot, the next-best-action reasoning engine for Alexa+...`
      }
    ]
  })
});
```

---

## 2. Amazon Bedrock AgentCore & Contextual Memory

### Role in ActionPilot
AgentCore provides long-term episodic and semantic memory:
- Remembers learned user habits (e.g., "Alex prefers deep work before 12:00 PM").
- Retains user working hours and default focus sprint durations.
- Stores active north-star goals across Alexa sessions.

### Code Implementation
Integrated through `apps/mcp-server/src/tools/index.ts` under the tools:
- `get_user_context`
- `save_user_preference`

---

## 3. Amazon DynamoDB

### Role in ActionPilot
DynamoDB provides serverless, single-digit millisecond latency persistence for all ActionPilot state.

### Table Schema Design

| Table Name | Partition Key (PK) | Sort Key (SK) | Global Secondary Index (GSI) | Purpose |
|---|---|---|---|---|
| `ActionPilot-Tasks` | `id` (String) | — | `status-deadline-index` (PK: `status`, SK: `deadline`) | Fast retrieval of pending tasks sorted by urgency |
| `ActionPilot-Calendar` | `id` (String) | — | `start-end-index` | Calendar intervals and focus blocks |
| `ActionPilot-UserContext` | `userId` (String) | — | — | User habits, work hours, and goals |

### Code Implementation
Located in [`apps/mcp-server/src/storage/dynamoStore.ts`](file:///c:/Users/Asus/Downloads/alexa/apps/mcp-server/src/storage/dynamoStore.ts):
- Utilizes `@aws-sdk/lib-dynamodb` `DynamoDBDocumentClient`.
- Features resilient zero-config local fallback when running in offline/demo mode so judges can run and inspect the app immediately without provisioning AWS resources.

---

## 4. Amazon ECS Fargate & Application Load Balancer (ALB)

### Role in ActionPilot
The production Remote MCP Server runs on serverless containers via AWS ECS Fargate:
- **Container**: Node.js 20 Alpine multi-stage Docker build.
- **Port**: 3001 exposed via ALB HTTP/HTTPS listeners.
- **Streamable HTTP**: Supports persistent Server-Sent Events (SSE) streaming connections (`/sse`) and JSON-RPC 2.0 execution (`/mcp`).
- **Health Checks**: ALB targets `/health` with automatic container self-healing.

---

## 5. Amazon CloudWatch Observability

### Role in ActionPilot
- **Log Groups**: Centralized container and audit logs (`/ecs/actionpilot-mcp-server`).
- **CloudWatch Dashboard**: `ActionPilot-Observability` widgets monitoring:
  - ALB Request Count and Target Response Time
  - ECS Task CPU and Memory utilization
  - Consequence Simulation error rates

---

## 6. AWS CDK Infrastructure as Code

All AWS infrastructure is codified in TypeScript using AWS CDK v2:
- Located in [`infrastructure/cdk/lib/actionpilot-stack.ts`](file:///c:/Users/Asus/Downloads/alexa/infrastructure/cdk/lib/actionpilot-stack.ts)
- Reproducible deployment:
  ```bash
  cd infrastructure/cdk
  npm run synth
  npx cdk deploy
  ```
