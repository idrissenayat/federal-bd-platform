import assert from "node:assert/strict";
import test from "node:test";
import { buildValueHypothesisProposal, type ValueProposalItem } from "../lib/value-hypothesis-proposal";

const item: ValueProposalItem = {
  key: "STR-024",
  title: "Build governed agent execution from STEER assignments",
  description: "Assigned agents claim and execute governed work, report progress, and return exact evidence for human review.",
  priority: "Now",
  work_type: "Platform capability",
  evidence_url: "https://github.com/example/repository/blob/0123456789012345678901234567890123456789/brief.md",
  github_url: "https://github.com/example/repository/issues/52",
};

test("Value Agent prepares every required human-review field without blanks", () => {
  const proposal = buildValueHypothesisProposal(item, "member-product", "2026-08-15T17:30:00.000Z");

  for (const field of ["primaryType", "beneficiary", "outcomeMetric", "baseline", "target", "unit", "observationDate", "outcomeOwner", "outcomeOwnerId", "impact", "timeCriticality", "strategicAlignment", "confidence", "evidence", "assumptions", "period"] as const) {
    assert.ok(String(proposal[field]).trim(), `${field} should be prefilled`);
  }
  assert.equal(proposal.acceptanceState, "proposed");
  assert.equal(proposal.advisory?.source, "AI");
  assert.match(proposal.beneficiary, /Product Leads/);
  assert.match(proposal.target, /90%/);
  assert.equal(proposal.observationDate, "2026-09-14");
});

test("Value Agent produces useful work-type-specific proposals", () => {
  const proposal = buildValueHypothesisProposal({ ...item, title: "Investigate adoption risk", description: "Answer the named decision questions.", priority: "Next", work_type: "Research / discovery" }, "member-product", "2026-08-15T17:30:00.000Z");

  assert.equal(proposal.primaryType, "learning or option value");
  assert.match(proposal.beneficiary, /decision-makers/);
  assert.match(proposal.unit, /decision questions/);
  assert.equal(proposal.impact, "Medium");
});
