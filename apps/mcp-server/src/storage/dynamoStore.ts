import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { Task, CalendarEvent, UserContext } from '../types.js';
import { memoryStore } from './memoryStore.js';

export class DynamoStore {
  private docClient: DynamoDBDocumentClient | null = null;
  private prefix: string;
  private isDynamoAvailable: boolean = false;

  constructor() {
    this.prefix = process.env.DYNAMODB_TABLE_PREFIX || 'ActionPilot';
    this.initClient();
  }

  private initClient(): void {
    const region = process.env.AWS_REGION || 'us-east-1';
    // If running in development with mock keys or USE_LOCAL_STORAGE=true, use fallback
    if (process.env.USE_LOCAL_STORAGE === 'true' || !process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID === 'demo_key') {
      console.log('ℹ️ [DynamoStore] Using in-memory store fallback for zero-config local development & testing.');
      this.isDynamoAvailable = false;
      return;
    }

    try {
      const client = new DynamoDBClient({ region });
      this.docClient = DynamoDBDocumentClient.from(client);
      this.isDynamoAvailable = true;
      console.log(`✅ [DynamoStore] Connected to AWS DynamoDB in region ${region} with prefix ${this.prefix}`);
    } catch (err) {
      console.warn('⚠️ [DynamoStore] DynamoDB client initialization failed, falling back to memory store:', err);
      this.isDynamoAvailable = false;
    }
  }

  public async getTasks(filter?: { status?: string; tag?: string }): Promise<Task[]> {
    if (!this.isDynamoAvailable || !this.docClient) {
      return memoryStore.getTasks(filter);
    }
    try {
      const command = new ScanCommand({
        TableName: `${this.prefix}-Tasks`
      });
      const response = await this.docClient.send(command);
      let items = (response.Items as Task[]) || [];
      if (filter?.status) {
        items = items.filter(t => t.status === filter.status);
      }
      if (filter?.tag) {
        items = items.filter(t => t.tags.includes(filter.tag!));
      }
      return items;
    } catch (err) {
      console.warn('⚠️ [DynamoStore.getTasks] DynamoDB scan failed, falling back to memory:', err);
      return memoryStore.getTasks(filter);
    }
  }

  public async getTask(id: string): Promise<Task | undefined> {
    if (!this.isDynamoAvailable || !this.docClient) {
      return memoryStore.getTask(id);
    }
    try {
      const command = new GetCommand({
        TableName: `${this.prefix}-Tasks`,
        Key: { id }
      });
      const response = await this.docClient.send(command);
      return response.Item as Task | undefined;
    } catch (err) {
      return memoryStore.getTask(id);
    }
  }

  public async saveTask(task: Task): Promise<Task> {
    task.updatedAt = new Date().toISOString();
    if (!this.isDynamoAvailable || !this.docClient) {
      return memoryStore.saveTask(task);
    }
    try {
      const command = new PutCommand({
        TableName: `${this.prefix}-Tasks`,
        Item: task
      });
      await this.docClient.send(command);
      return task;
    } catch (err) {
      console.warn('⚠️ [DynamoStore.saveTask] DynamoDB put failed, falling back to memory:', err);
      return memoryStore.saveTask(task);
    }
  }

  public async deleteTask(id: string): Promise<boolean> {
    if (!this.isDynamoAvailable || !this.docClient) {
      return memoryStore.deleteTask(id);
    }
    try {
      const command = new DeleteCommand({
        TableName: `${this.prefix}-Tasks`,
        Key: { id }
      });
      await this.docClient.send(command);
      return true;
    } catch (err) {
      return memoryStore.deleteTask(id);
    }
  }

  public async getEvents(startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    if (!this.isDynamoAvailable || !this.docClient) {
      return memoryStore.getEvents(startDate, endDate);
    }
    try {
      const command = new ScanCommand({
        TableName: `${this.prefix}-Calendar`
      });
      const response = await this.docClient.send(command);
      let items = (response.Items as CalendarEvent[]) || [];
      if (startDate) {
        const s = new Date(startDate).getTime();
        items = items.filter(e => new Date(e.end).getTime() >= s);
      }
      if (endDate) {
        const ed = new Date(endDate).getTime();
        items = items.filter(e => new Date(e.start).getTime() <= ed);
      }
      return items.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    } catch (err) {
      return memoryStore.getEvents(startDate, endDate);
    }
  }

  public async saveEvent(event: CalendarEvent): Promise<CalendarEvent> {
    if (!this.isDynamoAvailable || !this.docClient) {
      return memoryStore.saveEvent(event);
    }
    try {
      const command = new PutCommand({
        TableName: `${this.prefix}-Calendar`,
        Item: event
      });
      await this.docClient.send(command);
      return event;
    } catch (err) {
      return memoryStore.saveEvent(event);
    }
  }

  public async getUserContext(): Promise<UserContext> {
    if (!this.isDynamoAvailable || !this.docClient) {
      return memoryStore.getUserContext();
    }
    try {
      const command = new GetCommand({
        TableName: `${this.prefix}-UserContext`,
        Key: { userId: 'user_alexa_dev_01' }
      });
      const response = await this.docClient.send(command);
      if (response.Item) {
        return response.Item as UserContext;
      }
      return memoryStore.getUserContext();
    } catch (err) {
      return memoryStore.getUserContext();
    }
  }

  public async updateUserPreference(key: string, value: any): Promise<UserContext> {
    const current = await this.getUserContext();
    current.learnedPreferences[key] = value;
    if (this.isDynamoAvailable && this.docClient) {
      try {
        await this.docClient.send(
          new PutCommand({
            TableName: `${this.prefix}-UserContext`,
            Item: current
          })
        );
      } catch (err) {
        // Fallback
      }
    }
    return memoryStore.updateUserPreference(key, value);
  }
}

export const dynamoStore = new DynamoStore();
