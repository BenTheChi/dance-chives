/**
 * Normalize an Instagram handle by stripping leading '@' and lowercasing.
 */
export function normalizeInstagramHandle(handle: string): string {
  return handle.trim().replace(/^@/, "").toLowerCase();
}

