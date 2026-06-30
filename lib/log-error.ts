// Surface errors that server-action reads otherwise swallow (they fall back to
// mock/empty data so pages still render). Logging the message means the real
// cause — e.g. a missing column or table — shows up in the server / Vercel logs
// instead of silently becoming "0 results".
export function logActionError(context: string, error: unknown): void {
  console.error(`${context} failed:`, error);
}
