import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export interface StrandsAgentConfig {
  region?: string;
  modelId?: string;
  mcpServerUrl?: string;
}

export class StrandsAgent {
  private client: BedrockRuntimeClient;
  private modelId: string;
  private mcpServerUrl: string;

  constructor(config?: StrandsAgentConfig) {
    const region = config?.region || process.env.AWS_REGION || 'us-east-1';
    this.modelId = config?.modelId || process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    this.mcpServerUrl = config?.mcpServerUrl || process.env.MCP_BASE_URL || 'http://localhost:3001';
    this.client = new BedrockRuntimeClient({ region });
  }

  /**
   * Orchestrates an Alexa+ goal into an MCP tool chain execution
   */
  public async orchestrateGoal(goal: string, context: Record<string, any>): Promise<any> {
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
