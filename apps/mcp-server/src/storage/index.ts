import { dynamoStore } from './dynamoStore.js';
import { memoryStore } from './memoryStore.js';

export const dataStore = dynamoStore;
export { memoryStore };
