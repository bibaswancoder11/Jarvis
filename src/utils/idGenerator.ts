let messageCounter = 0;

/**
 * Generates an unconditionally unique ID for chat messages, tasks, and system events.
 * Combines timestamp, monotonic counter, and random entropy to guarantee zero key collisions
 * even when multiple messages are dispatched synchronously in the exact same millisecond.
 */
export function generateUniqueMessageId(prefix: string = 'msg'): string {
  messageCounter += 1;
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${Date.now()}-${messageCounter}-${rand}`;
}
