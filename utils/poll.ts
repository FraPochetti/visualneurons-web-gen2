export default async function poll<T>(
  fn: () => Promise<T>,
  intervalMs: number,
  shouldStop: (result: T) => boolean
): Promise<T> {
  const timeoutMs = 60000; // 1 minute timeout
  const start = Date.now();
  while (true) {
    const result = await fn();
    if (shouldStop(result)) {
      return result;
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error('Polling timed out');
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
