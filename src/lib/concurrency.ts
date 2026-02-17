/**
 * Process a list of items with a fixed concurrency limit.
 *
 * Uses a worker-pool pattern: N workers simultaneously pull tasks from a
 * shared queue and process them until the queue is exhausted.
 *
 * @param items - The items to process
 * @param concurrency - Maximum number of concurrent workers
 * @param fn - Async function to call for each item
 */
export async function processWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item === undefined) break;
      await fn(item);
    }
  }

  const effectiveConcurrency = Math.min(concurrency, items.length);
  if (effectiveConcurrency <= 0) return;

  const workers = Array.from({ length: effectiveConcurrency }, () => worker());
  await Promise.all(workers);
}

/**
 * Split an array into chunks of the given size.
 */
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
