export function isMissingServerAction(message: string): boolean {
  return /Server Action[\s\S]*was not found on the server|Failed to find Server Action/i.test(message);
}
