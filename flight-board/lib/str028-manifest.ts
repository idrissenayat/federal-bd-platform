export const STR028_CASE_IDS = [
  "SAVE-01", "SAVE-02", "SAVE-03", "SAVE-04",
  "DISP-01", "DISP-02", "DISP-03", "DISP-04",
  "FAIL-01", "FAIL-02", "FAIL-03", "FAIL-04",
  "ORDER-01", "ORDER-02", "ORDER-03", "ORDER-04",
  "REC-01", "REC-02", "REC-03", "REC-04",
] as const;

export type Str028CaseId = typeof STR028_CASE_IDS[number];

export const STR028_FROZEN_SUBSTEPS = {
  "FAIL-03": ["F03-A", "F03-B", "F03-C", "F03-D", "F03-E", "F03-F"],
  "FAIL-04": ["F04-A", "F04-B", "F04-C", "F04-D", "F04-E"],
  "REC-04": ["R04-A", "R04-B", "R04-C", "R04-D", "R04-E", "R04-F"],
} as const satisfies Partial<Record<Str028CaseId, readonly string[]>>;

const caseIds = new Set<string>(STR028_CASE_IDS);

export function isStr028CaseId(value: string): value is Str028CaseId {
  return caseIds.has(value);
}
