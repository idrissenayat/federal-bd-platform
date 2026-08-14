import assert from "node:assert/strict";
import test from "node:test";
import { buildPullForecast, buildServiceLevelDistributions, completionVarianceMinutes, evaluateForecast, materialForecastChange, type ActualEconomics, type DeliveryForecast, type WorkEconomicsRecord } from "../lib/work-economics";
import { humanAcceptanceState } from "../lib/work-economics-validation";
import { gateOneValueReady, validateWorkEconomics, workEconomicsAuthorized, workEconomicsNamedAuthority } from "../worker/api";

const now = "2026-08-14T16:00:00.000Z";
const forecast: DeliveryForecast = {
  sizeBand: "M", humanEffortRanges: [{ role: "Delivery roles", minMinutes: 30, maxMinutes: 90 }],
  agentCostRanges: [{ provider: "OpenAI", minCost: 1, maxCost: 5, currency: "USD", expectedAttempts: 2 }],
  complexity: 3, uncertainty: 3, coordination: 2, basis: "Expert judgment; no comparable cohort yet",
  basisKind: "expert judgment", comparableItems: "None yet", serviceLevel: null, timezone: "America/New_York",
  earliestCompletion: "2026-08-14T17:00:00.000Z", likelyCompletion: "2026-08-14T18:00:00.000Z", latestCompletion: "2026-08-14T20:00:00.000Z",
  confidence: "low", nextMilestone: "Move to Evaluate / QA", nextMilestoneAt: "2026-08-14T17:30:00.000Z",
  phaseExit: "Evaluate", phaseExitAt: "2026-08-14T18:00:00.000Z", agentWorkCompletedAt: null, humanDecisionTargetAt: null,
  blockedSince: null, unblockOwner: "", unblockAction: "", cannotForecastUntil: "", freshnessHours: 24,
  acceptedBy: "member-tech", acceptedAt: "2026-08-14T15:00:00.000Z", updatedAt: "2026-08-14T15:00:00.000Z", changeReason: "Initial owner forecast",
  advisory: null, acceptanceState: "no proposal", deliveryOwnerId: "member-tech",
};

function economics(deliveryForecast: DeliveryForecast | null): WorkEconomicsRecord {
  return { valueHypothesis: null, deliveryForecast, actualEconomics: null, realizedOutcome: null, forecast: evaluateForecast(deliveryForecast, { state: "active", decision_status: "Decided" }, now) };
}

test("human acceptance distinguishes unchanged AI advice from human edits", () => {
  const advisory = { source: "AI", recommendation: "Proceed", confidence: "medium", drivers: [], evidence: [], omissions: [], createdAt: now };
  assert.equal(humanAcceptanceState(null, "human edited"), "no proposal");
  assert.equal(humanAcceptanceState(advisory, "human accepted"), "human accepted");
  assert.equal(humanAcceptanceState(advisory, "human edited"), "human edited");
  assert.equal(humanAcceptanceState(advisory, "proposed"), "human accepted");
});

test("an accepted range produces an on-track forecast with a separate milestone", () => {
  const result = evaluateForecast(forecast, { state: "active", decision_status: "Decided" }, now);
  assert.equal(result.state, "on track");
  assert.equal(result.nextMilestone, "Move to Evaluate / QA");
  assert.match(result.likelyWindow, /Aug 14/);
});

test("missing, stale, and materially changed forecasts never remain green", () => {
  assert.equal(evaluateForecast(null, { state: "active" }, now).state, "unknown");
  assert.equal(evaluateForecast({ ...forecast, updatedAt: "2026-08-12T15:00:00.000Z" }, { state: "active" }, now).state, "at risk");
  const changed = evaluateForecast({ ...forecast, reforecastRequiredReason: "owner changed" }, { state: "active" }, now);
  assert.equal(changed.state, "at risk");
  assert.match(changed.reason, /owner changed/);
});

test("blocked and human-gate waiting time is distinguishable from agent execution", () => {
  assert.match(evaluateForecast(forecast, { state: "blocked", decision_status: "Decided" }, now).reason, /blocked/i);
  assert.match(evaluateForecast(forecast, { state: "active", decision_status: "Needed now" }, now).reason, /human gate/i);
});

test("pull forecast exposes missing owners and never invents a date", () => {
  const result = buildPullForecast([
    { key: "STR-017", state: "active", assignee_name: "Builder", work_economics: economics(forecast) },
    { key: "STR-018", state: "active", assignee_name: "Ops Agent", work_economics: economics(null) },
  ], 2, now);
  assert.equal(result.status, "incomplete");
  assert.equal(result.itemKey, "STR-017");
  assert.deepEqual(result.missingOwners, ["Ops Agent"]);
  assert.equal(result.confidence, "low");
});

test("pull forecast reports immediate capacity below the WIP limit", () => {
  const result = buildPullForecast([{ key: "STR-017", state: "active", assignee_name: "Builder", work_economics: economics(forecast) }], 2, now);
  assert.equal(result.status, "available");
  assert.match(result.headline, /available now/);
});

test("material workflow changes require a reforecast", () => {
  assert.match(materialForecastChange(["title", "description"]) ?? "", /scope title changed.*scope description changed/);
  assert.match(materialForecastChange(["assigneeId", "phase"]) ?? "", /owner changed, phase changed/);
  assert.match(materialForecastChange(["gate", "testResult", "dependency", "blocker"]) ?? "", /gate decision.*test result.*dependency.*blocker/);
});

test("server-side authority excludes agents and preserves named human roles", () => {
  assert.equal(workEconomicsAuthorized("deliveryForecast", "agent", "Implementation Agent"), false);
  assert.equal(workEconomicsAuthorized("valueHypothesis", "human", "Product Lead · interim Tech Lead"), true);
  assert.equal(workEconomicsAuthorized("actualEconomics", "human", "Contributor"), false);
  assert.equal(workEconomicsAuthorized("actualEconomics", "human", "Platform / Ops Lead"), true);
});

test("validation rejects person-level scoring and invalid completion ranges", () => {
  assert.match(validateWorkEconomics("actualEconomics", { employeeScore: 5 }) ?? "", /not permitted/);
  assert.match(validateWorkEconomics("actualEconomics", {
    humanRoleTotals: [{ role: "Delivery roles", activeMinutes: 10 }], agentTelemetry: [], durationFacts: { agentExecutionMinutes: 0, queueMinutes: 0, blockedMinutes: 0, gateWaitMinutes: 0, cycleMinutes: 10 }, reworkEvents: [], defectEvents: [], rollbackEvents: [], telemetrySource: "audit", completeness: "missing", completionAt: null, likelyVarianceMinutes: null, correctedBy: "member-ops", correctedAt: now, correctionReason: "Audited role totals", metadata: { employeeName: "Alice", rankingScore: 99 },
  }) ?? "", /not an allowed field|person-level/);
  assert.match(validateWorkEconomics("actualEconomics", {
    humanRoleTotals: [{ role: "alice@example.com", activeMinutes: 10 }], agentTelemetry: [], durationFacts: { agentExecutionMinutes: 0, queueMinutes: 0, blockedMinutes: 0, gateWaitMinutes: 0, cycleMinutes: 10 }, reworkEvents: [], defectEvents: [], rollbackEvents: [], telemetrySource: "audit", completeness: "missing", completionAt: null, likelyVarianceMinutes: null, correctedBy: "member-ops", correctedAt: now, correctionReason: "Audited role totals",
  }) ?? "", /email address|approved aggregate role/);
  const invalid = validateWorkEconomics("deliveryForecast", { ...forecast, earliestCompletion: forecast.latestCompletion, latestCompletion: forecast.earliestCompletion });
  assert.match(invalid ?? "", /earliest–likely–latest/);
});

test("verified outcomes are stamped by the server rather than trusting a client verifier", () => {
  const error = validateWorkEconomics("realizedOutcome", {
    status: "verified positive", observedMetric: "Cycle time", observedResult: "20", unit: "minutes", observationDate: "2026-08-20",
    evidence: "https://example.com/evidence", confidence: "medium", causalLimitations: "Small initial sample", outcomeOwnerId: "member-product", acceptanceState: "no proposal", advisory: null, verifier: "", verifiedAt: "",
  });
  assert.equal(error, null);
});

test("available agent telemetry requires provider provenance", () => {
  const error = validateWorkEconomics("actualEconomics", {
    humanRoleTotals: [{ role: "Delivery roles", activeMinutes: 10 }], agentTelemetry: [{ eventId: "event-1", provider: "", model: "", attempts: 1, inputTokens: null, outputTokens: null, meteredCost: null, currency: "USD", executionMinutes: 4, source: "provider export", completeness: "complete", observedAt: now, ingestionState: "accepted", conflictReason: "" }],
    durationFacts: { agentExecutionMinutes: 4, queueMinutes: 0, blockedMinutes: 0, gateWaitMinutes: 0, cycleMinutes: 14 }, reworkEvents: [], defectEvents: [], rollbackEvents: [], telemetrySource: "provider export", completeness: "complete", completionAt: null, likelyVarianceMinutes: null, correctedBy: "member-ops", correctedAt: now, correctionReason: "Initial actuals",
  });
  assert.match(error ?? "", /provider, model/);
});

test("named-owner and POD authority fail closed", () => {
  const member = { id: "member-tech", kind: "human", role: "Tech Lead", pod_id: "pod-a" };
  assert.equal(workEconomicsNamedAuthority("deliveryForecast", member, { pod_id: "pod-a", delivery_owner_id: "member-tech" }), true);
  assert.equal(workEconomicsNamedAuthority("deliveryForecast", member, { pod_id: "pod-a", delivery_owner_id: "member-other" }), false);
  assert.equal(workEconomicsNamedAuthority("deliveryForecast", member, { pod_id: "pod-b", delivery_owner_id: "member-tech" }), false);
});

test("expert judgment is low confidence and Gate 1 requires verified evidence", () => {
  assert.match(validateWorkEconomics("deliveryForecast", { ...forecast, confidence: "high" }) ?? "", /Expert-judgment.*low confidence/);
  const value = { primaryType: "platform capability or reuse", beneficiary: "POD contributors", outcomeMetric: "forecast coverage", baseline: "0", target: "90", unit: "percent", observationDate: "2026-09-14", outcomeOwner: "Product Lead", outcomeOwnerId: "member-product", impact: "High", timeCriticality: "Medium", strategicAlignment: "High", confidence: "medium", evidence: "https://github.com/example/evidence", evidenceStatus: "verified", assumptions: "First 10 completed items", advisory: null, acceptanceState: "no proposal", acceptedBy: "member-product", acceptedAt: now };
  assert.equal(gateOneValueReady(JSON.stringify(value)), true);
  assert.equal(gateOneValueReady(JSON.stringify({ ...value, evidenceStatus: "unverified" })), false);
});

test("completion variance is calculated against the accepted likely window without a person score", () => {
  assert.equal(completionVarianceMinutes(forecast, "2026-08-14T18:30:00.000Z"), 30);
});

test("pull forecast exposes every contributing WIP item and range", () => {
  const result = buildPullForecast([
    { key: "STR-017", state: "active", assignee_name: "Builder", work_economics: economics(forecast) },
    { key: "STR-018", state: "active", assignee_name: "Test", work_economics: economics({ ...forecast, likelyCompletion: "2026-08-14T19:00:00.000Z" }) },
  ], 2, now);
  assert.deepEqual(result.contributors.map((entry) => entry.itemKey), ["STR-017", "STR-018"]);
  assert.ok(result.contributors.every((entry) => entry.earliest && entry.latest));
});

test("service levels use only same-POD/work-type completed history and show sample size", () => {
  const actual = (cycleMinutes: number): ActualEconomics => ({ humanRoleTotals: [], agentTelemetry: [], durationFacts: { agentExecutionMinutes: 1, queueMinutes: 1, blockedMinutes: 0, gateWaitMinutes: 0, cycleMinutes }, reworkEvents: [], defectEvents: [], rollbackEvents: [], telemetrySource: "events", completeness: "complete", completionAt: now, likelyVarianceMinutes: null, correctedBy: "member-ops", correctedAt: now, correctionReason: "System facts" });
  const records = [60, 90, 120, 150, 180].map((minutes) => ({ pod_id: "pod-a", workflow: "STEER", work_economics: { ...economics(forecast), actualEconomics: actual(minutes) } }));
  records.push({ pod_id: "pod-b", workflow: "STEER", work_economics: { ...economics(forecast), actualEconomics: actual(999) } });
  const result = buildServiceLevelDistributions(records);
  assert.equal(result.length, 1);
  assert.deepEqual(result[0], { podId: "pod-a", workType: "STEER", sampleSize: 5, percentile: 85, lowHours: 1, medianHours: 2, highHours: 3 });
});
