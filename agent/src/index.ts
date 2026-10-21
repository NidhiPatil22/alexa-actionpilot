import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export interface StrandsAgentConfig {
  region?: string;
  modelId?: string;
  mcpServerUrl?: string;
  apiKey?: string;
}

export interface AgentStepTrace {
  step: number;
  action: string;
  tool?: string;
  input?: Record<string, any>;
  output?: any;
  rationale: string;
}

export interface AutonomousGoalResult {
  goal: string;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  speechResponse: string;
  plan: string[];
  executionTrace: AgentStepTrace[];
  resultingState: Record<string, any>;
}

export class StrandsAgent {
  private client: BedrockRuntimeClient;
  private modelId: string;
  private mcpServerUrl: string;
  private apiKey?: string;

  constructor(config?: StrandsAgentConfig) {
    const region = config?.region || process.env.AWS_REGION || 'us-east-1';
    this.modelId = config?.modelId || process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    this.mcpServerUrl = config?.mcpServerUrl || process.env.MCP_BASE_URL || 'http://localhost:3001';
    this.apiKey = config?.apiKey || process.env.MCP_API_KEY;
    this.client = new BedrockRuntimeClient({ region });
  }

  /**
   * Executes a tool directly against the Remote MCP 2025-11-25 Server via JSON-RPC 2.0
   */
  public async callMcpTool(name: string, args: Record<string, any> = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'mcp-session-id': `strands-agent-${Date.now()}`
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const payload = {
      jsonrpc: '2.0',
      id: `call-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      method: 'tools/call',
      params: {
        name,
        arguments: args
      }
    };

    const res = await fetch(`${this.mcpServerUrl}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`MCP tool call failed with HTTP ${res.status}`);
    }

    const json: any = await res.json();
    if (json.error) {
      throw new Error(`MCP error [${json.error.code}]: ${json.error.message}`);
    }

    const contentItem = json.result?.content?.[0];
    if (contentItem?.type === 'text') {
      try {
        return JSON.parse(contentItem.text);
      } catch {
        return contentItem.text;
      }
    }
    return json.result;
  }

  /**
   * Lists available tools exposed by the Remote MCP Server
   */
  public async listMcpTools(): Promise<any[]> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const res = await fetch(`${this.mcpServerUrl}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `list-${Date.now()}`,
        method: 'tools/list'
      })
    });

    if (!res.ok) throw new Error(`MCP tools/list failed with HTTP ${res.status}`);
    const json: any = await res.json();
    return json.result?.tools || [];
  }

  /**
   * Autonomous Goal Execution Loop:
   * Dynamically plans, inspects constraints, executes multi-tool chains,
   * simulates consequences, and formulates explainable Alexa+ voice output.
   */
  public async orchestrateAutonomousGoal(goal: string): Promise<AutonomousGoalResult> {
    const executionTrace: AgentStepTrace[] = [];
    const plan: string[] = [
      'Query persistent user context and preferences',
      'Inspect active task backlog & calculate urgency vectors',
      'Scan calendar commitments & detect open focus slots',
      'Run multi-factor next-best-action reasoning',
      'Execute schedule allocation or consequence mitigation',
      'Generate explainable voice feedback for Alexa+'
    ];

    try {
      // Step 1: User Context
      const userContext = await this.callMcpTool('get_user_context');
      executionTrace.push({
        step: 1,
        action: 'Query User Context',
        tool: 'get_user_context',
        output: userContext,
        rationale: 'Establish user working hours, focus preferences, and north star goals.'
      });

      // Step 2: Task Backlog & Workload
      const tasksRes = await this.callMcpTool('get_tasks', { userId: userContext.userId || 'user_alexa_dev_01', status: 'todo' });
      const workloadRes = await this.callMcpTool('analyze_workload', { date: 'today' });
      executionTrace.push({
        step: 2,
        action: 'Analyze Workload & Tasks',
        tool: 'analyze_workload',
        output: { count: tasksRes.count, stressLevel: workloadRes.stressLevel },
        rationale: `Backlog has ${tasksRes.count} active tasks with ${workloadRes.stressLevel} stress index.`
      });

      // Step 3: Available Free Slots
      const slotsRes = await this.callMcpTool('find_free_slots', {
        userId: userContext.userId || 'user_alexa_dev_01',
        date: 'today',
        minDurationMinutes: 30
      });
      executionTrace.push({
        step: 3,
        action: 'Find Free Focus Slots',
        tool: 'find_free_slots',
        output: { freeSlotCount: slotsRes.freeSlotCount },
        rationale: `Found ${slotsRes.freeSlotCount} continuous focus opportunities.`
      });

      // Step 4: Next Best Action Reasoning
      const nbaRes = await this.callMcpTool('get_next_action', {
        userId: userContext.userId || 'user_alexa_dev_01',
        availableMinutes: 90
      });
      executionTrace.push({
        step: 4,
        action: 'Compute Next Best Action',
        tool: 'get_next_action',
        output: {
          task: nbaRes.recommendedTask?.title,
          confidence: nbaRes.confidenceScore,
          slot: nbaRes.recommendedSlot?.formattedTime
        },
        rationale: `Selected "${nbaRes.recommendedTask?.title}" (Confidence: ${nbaRes.confidenceScore}%).`
      });

      // Step 5: Autonomous Action Execution (Reserve Focus Block if slot found)
      let bookedBlock = null;
      if (nbaRes.recommendedTask && nbaRes.recommendedSlot) {
        bookedBlock = await this.callMcpTool('create_focus_block', {
          taskId: nbaRes.recommendedTask.id,
          title: `Focus: ${nbaRes.recommendedTask.title}`,
          start: nbaRes.recommendedSlot.start,
          end: nbaRes.recommendedSlot.end
        });
        executionTrace.push({
          step: 5,
          action: 'Book Dedicated Focus Block',
          tool: 'create_focus_block',
          output: bookedBlock,
          rationale: `Reserved calendar focus block for "${nbaRes.recommendedTask.title}" at ${nbaRes.recommendedSlot.formattedTime}.`
        });
      }

      // Step 6: Alexa Voice Synthesis
      let speechResponse = nbaRes.explanationForAlexa;
      if (bookedBlock) {
        speechResponse = `I've analyzed your deliverables and booked a focus block for "${nbaRes.recommendedTask.title}" at ${nbaRes.recommendedSlot.formattedTime}. ${nbaRes.reasoning}`;
      }

      return {
        goal,
        status: 'COMPLETED',
        speechResponse,
        plan,
        executionTrace,
        resultingState: {
          recommendedTask: nbaRes.recommendedTask,
          bookedBlock,
          freeSlotsRemaining: slotsRes.freeSlotCount - (bookedBlock ? 1 : 0)
        }
      };
    } catch (err: any) {
      return {
        goal,
        status: 'FAILED',
        speechResponse: `I ran into an issue while orchestrating your goal: ${err.message}`,
        plan,
        executionTrace,
        resultingState: { error: err.message }
      };
    }
  }

  /**
   * Orchestrates an Alexa+ goal into an MCP tool chain execution (legacy / quick router)
   */
  public async orchestrateGoal(goal: string, context?: Record<string, any>): Promise<any> {
    const res = await fetch(`${this.mcpServerUrl}/api/alexa/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: goal, context })
    });
    if (!res.ok) {
      throw new Error(`Agent orchestration failed with status ${res.status}`);
    }
    return await res.json();
  }
}

export const strandsAgent = new StrandsAgent();
