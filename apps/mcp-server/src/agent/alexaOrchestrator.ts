import { tools, getToolByName } from '../tools/index.js';
import { bedrockService } from './bedrockClient.js';
import { AlexaAgentResponse, NextBestAction, ConsequenceAnalysis } from '../types.js';
import { dataStore } from '../storage/index.js';

export class AlexaOrchestrator {
  public async handleAlexaQuery(query: string): Promise<AlexaAgentResponse> {
    const lower = query.toLowerCase();
    const reasoningChain: string[] = [];
    const toolsExecuted: Array<{ tool: string; input: any; output: any }> = [];

    // Helper to log and run tools
    const executeTool = async (name: string, args: any = {}) => {
      const tool = getToolByName(name);
      if (!tool) throw new Error(`Tool ${name} not found`);
      const output = await tool.handler(args);
      toolsExecuted.push({ tool: name, input: args, output });
      return output;
    };

    // 1. Next Best Action Intent
    if (
      lower.includes('what should i do') ||
      lower.includes('what should i work on') ||
      lower.includes('what to do next') ||
      lower.includes('whats next') ||
      lower.includes("what's next") ||
      lower.includes('recommend')
    ) {
      reasoningChain.push('Goal: User is seeking the single highest-value action right now.');
      reasoningChain.push('Step 1: Querying active tasks from storage via get_tasks...');
      const tasksResult = await executeTool('get_tasks', { status: 'todo' });

      reasoningChain.push('Step 2: Retrieving today & tomorrow calendar commitments via get_calendar...');
      await executeTool('get_calendar');

      reasoningChain.push('Step 3: Calculating capacity and pressure index via analyze_workload...');
      await executeTool('analyze_workload', { date: 'today' });

      reasoningChain.push('Step 4: Running deterministic multi-factor priority scoring via prioritize_tasks...');
      await executeTool('prioritize_tasks');

      reasoningChain.push('Step 5: Locating optimal uninterrupted focus window via find_free_slots...');
      await executeTool('find_free_slots', { date: 'today', minDurationMinutes: 30 });

      reasoningChain.push('Step 6: Synthesizing Next-Best-Action with explainable rationale via get_next_action...');
      const nextAction: NextBestAction = await executeTool('get_next_action');

      let speech = nextAction.explanationForAlexa;

      // Bedrock optional enrichment
      const bedrockSpeech = await bedrockService.invokeReasoning(query, JSON.stringify(nextAction));
      if (bedrockSpeech && bedrockSpeech.trim().length > 0) {
        speech = bedrockSpeech.trim();
      }

      return {
        query,
        intent: 'NEXT_BEST_ACTION',
        speechResponse: speech,
        reasoningChain,
        toolsExecuted,
        actionTaken: {
          type: 'recommendation',
          data: nextAction
        },
        nextBestAction: nextAction
      };
    }

    // 2. Reschedule & Consequence Analysis Intent
    if (
      lower.includes('move') ||
      lower.includes('reschedule') ||
      lower.includes('postpone') ||
      lower.includes('push back') ||
      lower.includes('delay')
    ) {
      reasoningChain.push('Goal: User requested rescheduling an item. Consequence-Aware Rescheduling triggered.');
      reasoningChain.push('Step 1: Parsing target task name and target date/time from speech...');

      // Find matched task
      const allTasks = await dataStore.getTasks();
      let matchedTask = allTasks.find(t => lower.includes(t.title.toLowerCase()));

      if (!matchedTask) {
        // Fallback fuzzy match
        if (lower.includes('assignment') || lower.includes('cs')) {
          matchedTask = allTasks.find(t => t.id === 'task-cs-assignment');
        } else if (lower.includes('bedrock') || lower.includes('integration')) {
          matchedTask = allTasks.find(t => t.id === 'task-bedrock-01');
        } else if (lower.includes('slides') || lower.includes('deck')) {
          matchedTask = allTasks.find(t => t.id === 'task-demo-slides');
        } else {
          matchedTask = allTasks[0];
        }
      }

      const targetDate = lower.includes('tomorrow') ? 'tomorrow' : 'today';

      reasoningChain.push(`Step 2: Simulating move of "${matchedTask?.title}" to ${targetDate} via analyze_consequences...`);
      const consequence: ConsequenceAnalysis = await executeTool('analyze_consequences', {
        taskId: matchedTask?.id,
        proposedDateOrTime: targetDate
      });

      reasoningChain.push(`Step 3: Consequence evaluation complete. Severity: ${consequence.impactSeverity}. Feasible: ${consequence.isFeasible}.`);
      if (consequence.conflicts.length > 0) {
        reasoningChain.push(`Detected ${consequence.conflicts.length} conflict(s). Formulating cascade mitigation plan...`);
      }
      if (consequence.deadlineBreaches.length > 0) {
        reasoningChain.push(`⚠️ WARNING: Moving this task breaches deadline by ${consequence.deadlineBreaches[0].delayMinutes}m!`);
      }

      let speech = consequence.explanationForAlexa;
      const bedrockSpeech = await bedrockService.invokeReasoning(query, JSON.stringify(consequence));
      if (bedrockSpeech && bedrockSpeech.trim().length > 0) {
        speech = bedrockSpeech.trim();
      }

      return {
        query,
        intent: 'RESCHEDULE_TASK',
        speechResponse: speech,
        reasoningChain,
        toolsExecuted,
        actionTaken: {
          type: 'consequence_analysis',
          data: consequence
        },
        consequenceAnalysis: consequence
      };
    }

    // 3. Create Focus Block Intent
    if (lower.includes('focus block') || lower.includes('block out time') || lower.includes('book time') || lower.includes('focus time')) {
      reasoningChain.push('Goal: User requested booking dedicated focus block.');
      const tasks = await dataStore.getTasks({ status: 'todo' });
      const targetTask = tasks[0];
      const now = new Date();
      const start = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
      const end = new Date(now.getTime() + (30 + targetTask.estimatedDuration) * 60 * 1000).toISOString();

      const block = await executeTool('create_focus_block', {
        taskId: targetTask.id,
        title: `Focus: ${targetTask.title}`,
        start,
        end
      });

      return {
        query,
        intent: 'CREATE_FOCUS_BLOCK',
        speechResponse: `I've booked a ${targetTask.estimatedDuration}-minute focus block for "${targetTask.title}" on your calendar.`,
        reasoningChain,
        toolsExecuted,
        actionTaken: {
          type: 'scheduled_block',
          data: block
        }
      };
    }

    // 4. Workload & Schedule Intent
    if (
      lower.includes('workload') ||
      lower.includes('how busy') ||
      lower.includes('calendar') ||
      lower.includes('my schedule') ||
      lower.includes('schedule today')
    ) {
      reasoningChain.push('Goal: User wants situational workload assessment.');
      reasoningChain.push('Step 1: Inspecting schedule load via analyze_workload...');
      const workload = await executeTool('analyze_workload', { date: 'today' });

      reasoningChain.push('Step 2: Identifying remaining free capacity...');
      const freeSlots = await executeTool('find_free_slots', { date: 'today' });

      const speech = `Today you have ${Math.round(workload.totalScheduledMinutes / 60)} hours scheduled in meetings and ${Math.round(workload.totalFreeMinutes / 60)} hours of free focus time across ${freeSlots.freeSlotCount} slots. Your overall stress index is ${workload.stressLevel}.`;

      return {
        query,
        intent: 'CHECK_WORKLOAD',
        speechResponse: speech,
        reasoningChain,
        toolsExecuted,
        actionTaken: {
          type: 'status',
          data: workload
        }
      };
    }

    // Default intent fallback
    reasoningChain.push('Evaluating conversational request with ActionPilot situational memory...');
    const context = await executeTool('get_user_context');
    const tasks = await executeTool('get_tasks');

    return {
      query,
      intent: 'GENERAL_ASSIST',
      speechResponse: `I'm monitoring your ${tasks.count} tasks and calendar. You can ask me "What should I do next?" or ask to reschedule any item with consequence analysis.`,
      reasoningChain,
      toolsExecuted,
      actionTaken: {
        type: 'status',
        data: { context, taskCount: tasks.count }
      }
    };
  }
}

export const alexaOrchestrator = new AlexaOrchestrator();
