import assert from "node:assert/strict";
import test from "node:test";
import { STR028_CASE_IDS, STR028_FROZEN_SUBSTEPS, isStr028CaseId } from "../lib/str028-manifest";

test("STR-028 pre-enrolls exactly the signed 20-case denominator", () => {
  assert.deepEqual(STR028_CASE_IDS, [
    "SAVE-01", "SAVE-02", "SAVE-03", "SAVE-04",
    "DISP-01", "DISP-02", "DISP-03", "DISP-04",
    "FAIL-01", "FAIL-02", "FAIL-03", "FAIL-04",
    "ORDER-01", "ORDER-02", "ORDER-03", "ORDER-04",
    "REC-01", "REC-02", "REC-03", "REC-04",
  ]);
  assert.equal(new Set(STR028_CASE_IDS).size, 20);
  assert.equal(isStr028CaseId("SAVE-01"), true);
  assert.equal(isStr028CaseId("SAVE-99"), false);
});

test("STR-028 preserves every mandatory frozen routing substep without changing the denominator", () => {
  assert.deepEqual(STR028_FROZEN_SUBSTEPS, {
    "FAIL-03": ["F03-A", "F03-B", "F03-C", "F03-D", "F03-E", "F03-F"],
    "FAIL-04": ["F04-A", "F04-B", "F04-C", "F04-D", "F04-E"],
    "REC-04": ["R04-A", "R04-B", "R04-C", "R04-D", "R04-E", "R04-F"],
  });
  assert.equal(STR028_CASE_IDS.length, 20);
});
