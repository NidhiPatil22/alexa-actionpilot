import { describe, it, expect, beforeEach } from 'vitest';
import { alexaOrchestrator } from './apps/mcp-server/src/agent/alexaOrchestrator.js';
import { memoryStore } from './apps/mcp-server/src/storage/memoryStore.js';

describe('ActionPilot End-to-End Alexa+ Agent Workflow', () => {
  beforeEach(() => {
    memoryStore.resetToDefault();
  });

  it('Scenario 1: User asks "Alexa, what should I work on next?"', async () => {
    const response = await alexaOrchestrator.handleAlexaQuery('Alexa, what should I work on next?');

    expect(response.intent).toBe('NEXT_BEST_ACTION');
    expect(response.speechResponse).toBeTruthy();
    expect(response.reasoningChain.length).toBeGreaterThanOrEqual(5);

    // Verify tools executed
    const toolNames = response.toolsExecuted.map(t => t.tool);
    expect(toolNames).toContain('get_tasks');
    expect(toolNames).toContain('get_calendar');
    expect(toolNames).toContain('analyze_workload');
    expect(toolNames).toContain('prioritize_tasks');
    expect(toolNames).toContain('find_free_slots');
    expect(toolNames).toContain('get_next_action');

    // Verify recommendation content
    expect(response.nextBestAction).toBeDefined();
    expect(response.nextBestAction!.recommendedTask.title).toBe('Complete AWS Bedrock Agent Integration');
    expect(response.nextBestAction!.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(response.nextBestAction!.recommendedSlot.formattedTime).toBeTruthy();
  });

  it('Scenario 2: User asks "Move my CS assignment to tomorrow"', async () => {
    const response = await alexaOrchestrator.handleAlexaQuery('Move my CS assignment to tomorrow');

    expect(response.intent).toBe('RESCHEDULE_TASK');
    expect(response.consequenceAnalysis).toBeDefined();
    expect(response.consequenceAnalysis!.proposedChange.taskTitle).toContain('CS-504 Distributed Systems Assignment');
    expect(response.consequenceAnalysis!.explanationForAlexa).toBeTruthy();

    const toolNames = response.toolsExecuted.map(t => t.tool);
    expect(toolNames).toContain('analyze_consequences');
  });

  it('Scenario 3: User asks "Analyze my workload for today"', async () => {
    const response = await alexaOrchestrator.handleAlexaQuery('Analyze my workload for today');

    expect(response.intent).toBe('CHECK_WORKLOAD');
    expect(response.speechResponse).toContain('hours');
    const toolNames = response.toolsExecuted.map(t => t.tool);
    expect(toolNames).toContain('analyze_workload');
    expect(toolNames).toContain('find_free_slots');
  });

  it('Scenario 4: User asks "Schedule a focus block for AWS Bedrock"', async () => {
    const response = await alexaOrchestrator.handleAlexaQuery('Schedule a focus block for AWS Bedrock');

    expect(response.intent).toBe('CREATE_FOCUS_BLOCK');
    expect(response.speechResponse).toContain('focus block');
    const toolNames = response.toolsExecuted.map(t => t.tool);
    expect(toolNames).toContain('create_focus_block');
  });
});
