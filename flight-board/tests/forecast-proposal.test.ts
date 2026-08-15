import assert from "node:assert/strict";
import test from "node:test";
import { buildForecastProposal, type ForecastProposalItem } from "../lib/forecast-proposal";
import { validateAndNormalizeWorkEconomics } from "../lib/work-economics-validation";

const item: ForecastProposalItem = {
  key: "STR-024",
  title: "Build governed agent execution from STEER assignments",
  description: "Agents execute governed work and return evidence.",
  phase: "Sense",
  gate: "Gate 1 pending",
  state: "active",
  work_type: "Platform capability",
  next_action: "Draft the matching Intent Brief and fresh Critic evidence.",
  evidence_url: "https://github.com/example/repository/issues/52",
  github_url: "https://github.com/example/repository/issues/52",
  blocked_since: null,
};

test("Forecast Agent pre-fills a complete low-confidence proposal without human date entry", () => {
  const proposal = buildForecastProposal(item, null, "member-product", "America/New_York", "2026-08-15T17:30:00.000Z");

  assert.equal(proposal.acceptanceState, "proposed");
  assert.equal(proposal.advisory?.source, "AI");
  assert.equal(proposal.confidence, "low");
  assert.equal(proposal.basisKind, "expert judgment");
  assert.match(proposal.nextMilestone, /Intent Brief/);
  assert.match(proposal.phaseExit, /Gate 1/);
  assert.ok(new Date(proposal.earliestCompletion) < new Date(proposal.likelyCompletion));
  assert.ok(new Date(proposal.likelyCompletion) < new Date(proposal.latestCompletion));
  assert.ok(proposal.humanEffortRanges[0].maxMinutes > 0);
  assert.ok(proposal.agentCostRanges[0].maxCost > 0);
  assert.equal(validateAndNormalizeWorkEconomics("deliveryForecast", proposal).error, null);
});

test("Forecast Agent uses only a qualifying same-POD work-type distribution", () => {
  const serviceLevel = { podId: "steer-flight-team", workType: "Platform capability", sampleSize: 7, percentile: 80, lowHours: 2, medianHours: 5, highHours: 11 };
  const proposal = buildForecastProposal(item, serviceLevel, "member-product", "UTC", "2026-08-15T17:30:00.000Z");

  assert.equal(proposal.basisKind, "comparable history");
  assert.equal(proposal.confidence, "medium");
  assert.equal(proposal.serviceLevel?.sampleSize, 7);
  assert.equal(new Date(proposal.likelyCompletion).getTime() - new Date("2026-08-15T17:30:00.000Z").getTime(), 5 * 60 * 60 * 1_000);
  assert.equal(validateAndNormalizeWorkEconomics("deliveryForecast", proposal).error, null);
});

test("Forecast Agent preserves the authoritative blocked-work contract", () => {
  const proposal = buildForecastProposal({ ...item, state: "blocked", blocked_since: "2026-08-15T16:00:00.000Z" }, null, "member-product", "UTC", "2026-08-15T17:30:00.000Z");

  assert.equal(proposal.blockedSince, "2026-08-15T16:00:00.000Z");
  assert.match(proposal.unblockAction, /Intent Brief/);
  assert.match(proposal.cannotForecastUntil, /Cannot forecast until/);
  assert.equal(validateAndNormalizeWorkEconomics("deliveryForecast", proposal).error, null);
});
