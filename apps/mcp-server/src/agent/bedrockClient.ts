import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime';

export class BedrockService {
  private client: BedrockRuntimeClient | null = null;
  private modelId: string;
  private isAvailable: boolean = false;

  constructor() {
    this.modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    this.initClient();
  }

  private initClient(): void {
    const region = process.env.AWS_REGION || 'us-east-1';
    if (!process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID === 'demo_key') {
      console.log('ℹ️ [BedrockService] Zero-config local simulation mode active (AWS credentials not set or demo).');
      this.isAvailable = false;
      return;
    }

    try {
      this.client = new BedrockRuntimeClient({ region });
      this.isAvailable = true;
      console.log(`✅ [BedrockService] Initialized Amazon Bedrock client in ${region} using model ${this.modelId}`);
    } catch (err) {
      console.warn('⚠️ [BedrockService] Client init failed:', err);
      this.isAvailable = false;
    }
  }

  public async invokeReasoning(prompt: string, contextJson: string): Promise<string> {
    if (!this.isAvailable || !this.client) {
      return '';
    }

    try {
      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are ActionPilot, the next-best-action reasoning engine for Alexa+.
Context:
${contextJson}

User Request:
${prompt}

Provide a concise, conversational explanation suitable for Alexa voice output (2-3 sentences max) plus explainable reasoning.`
          }
        ]
      };

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload)
      });

      const response = await this.client.send(command);
      const decoded = new TextDecoder().decode(response.body);
      const json = JSON.parse(decoded);
      return json.content?.[0]?.text || '';
    } catch (err: any) {
      console.warn('⚠️ [BedrockService.invokeReasoning] AWS invocation error:', err.message);
      return '';
    }
  }
}

export const bedrockService = new BedrockService();
