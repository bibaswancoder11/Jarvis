/**
 * Guaranteed unique ID generator for React components, chat messages, and tasks.
 * Combines timestamp, monotonic counter, and random entropy to prevent any collision
 * even when multiple items are generated in the exact same millisecond.
 */

let idCounter = 0;

export function generateUniqueId(prefix = 'item'): string {
  idCounter = (idCounter + 1) % 1000000;
  const time = Date.now();
  const rand = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${time}-${idCounter}-${rand}`;
}

export function generateMessageId(): string {
  return generateUniqueId('msg');
}

export function generateTaskId(step?: number): string {
  return generateUniqueId(`task${step !== undefined ? `-${step}` : ''}`);
}

export function generatePlanId(): string {
  return generateUniqueId('plan');
}
