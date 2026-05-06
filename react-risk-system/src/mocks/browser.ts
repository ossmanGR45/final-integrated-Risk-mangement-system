// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Setup MSW worker with all handlers
export const worker = setupWorker(...handlers);
