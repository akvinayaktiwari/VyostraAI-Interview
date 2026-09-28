const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Interview ids are UUIDs; anything else (e.g. a link cut off when copied) can never match a row. */
export function isValidInterviewId(id: string): boolean {
  return UUID_PATTERN.test(id);
}
