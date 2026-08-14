import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { handleApi } from "../worker/api";

class D1Statement {
  constructor(private readonly db: DatabaseSync, private readonly sql: string, private readonly values: unknown[] = []) {}
  bind(...values: unknown[]) { return new D1Statement(this.db, this.sql, values); }
  async first<T>() { return (this.db.prepare(this.sql).get(...this.values as never[]) as T | undefined) ?? null; }
  async all<T>() { return { results: this.db.prepare(this.sql).all(...this.values as never[]) as T[] }; }
  async run<T>() {
    const result = this.db.prepare(this.sql).run(...this.values as never[]);
    return { results: [] as T[], meta: { last_row_id: Number(result.lastInsertRowid) } };
  }
}

class D1Database {
  readonly sqlite = new DatabaseSync(":memory:");
  prepare(sql: string) { return new D1Statement(this.sqlite, sql); }
  async batch(statements: D1Statement[]) { return Promise.all(statements.map((statement) => statement.run())); }
}

function request(user: string, path: string, method = "GET", body?: unknown) {
  return new Request(`https://steer.test${path}`, {
    method,
    headers: {
      "oai-authenticated-user-id": user,
      "oai-authenticated-user-email": `${user}@example.test`,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const forecast = {
  sizeBand: "M", humanEffortRanges: [{ role: "Delivery roles", minMinutes: 30, maxMinutes: 90 }],
  agentCostRanges: [{ provider: "OpenAI", minCost: 1, maxCost: 5, currency: "USD", expectedAttempts: 2 }],
  complexity: 3, uncertainty: 3, coordination: 2, basis: "Expert judgment; insufficient cohort", basisKind: "expert judgment", comparableItems: "None", serviceLevel: null, timezone: "UTC",
  earliestCompletion: "2026-08-14T17:00:00.000Z", likelyCompletion: "2026-08-14T18:00:00.000Z", latestCompletion: "2026-08-14T20:00:00.000Z",
  confidence: "low", nextMilestone: "Independent retest", nextMilestoneAt: "2026-08-14T17:30:00.000Z", phaseExit: "Evaluate", phaseExitAt: "2026-08-14T18:00:00.000Z",
  agentWorkCompletedAt: null, humanDecisionTargetAt: null, blockedSince: null, unblockOwner: "", unblockAction: "", cannotForecastUntil: "", freshnessHours: 24,
  acceptedBy: "member-a", acceptedAt: "2026-08-14T15:00:00.000Z", updatedAt: "2026-08-14T15:00:00.000Z", changeReason: "Initial forecast", advisory: null, acceptanceState: "no proposal", deliveryOwnerId: "member-a",
};

async function setup() {
  const db = new D1Database();
  const initialized = await handleApi(request("member-a", "/api/bootstrap"), { DB: db });
  assert.equal(initialized?.status, 200);
  db.sqlite.prepare("UPDATE members SET role = 'Platform / Ops Lead', pod_id = 'pod-a' WHERE id = 'member-a'").run();
  db.sqlite.prepare("INSERT INTO members (id, display_name, email, kind, role, authority, status, accent, pod_id) VALUES ('member-b', 'Other POD', 'member-b@example.test', 'human', 'Tech Lead', 'Gate 2', 'available', 'aqua', 'pod-b')").run();
  db.sqlite.prepare("INSERT INTO members (id, display_name, kind, role, authority, status, accent, pod_id) VALUES ('agent-a', 'Builder', 'agent', 'Builder', 'Build', 'enrolled', 'coral', 'pod-a')").run();
  const result = db.sqlite.prepare(`INSERT INTO work_items
    (key,title,description,phase,priority,workflow,state,gate,decision_status,decision_authority,assignee_id,next_action,evidence_url,github_url,pod_id,delivery_owner_id,delivery_forecast_json,created_by,created_at,updated_at)
    VALUES ('STR-900','Server controls','Exercise every server control','Engineer','Now','STEER','active','Gate 2 passed','Rework','Tech Lead','agent-a','Run the exact independent retest evidence.','https://github.com/idrissenayat/federal-bd-platform/blob/main/README.md','https://github.com/idrissenayat/federal-bd-platform/issues/31','pod-a','member-a',?,'member-a','2026-08-14T14:00:00.000Z','2026-08-14T14:00:00.000Z')`).run(JSON.stringify(forecast));
  return { db, itemId: Number(result.lastInsertRowid) };
}

test("general item mutation and dispatch enforce same-POD scope and retain payload-safe denial audit", async () => {
  const { db, itemId } = await setup();
  const patchResponse = await handleApi(request("member-b", `/api/items/${itemId}`, "PATCH", { title: "Cross-POD overwrite", description: "sensitive payload" }), { DB: db });
  assert.equal(patchResponse?.status, 404);
  assert.equal(db.sqlite.prepare("SELECT title FROM work_items WHERE id = ?").get(itemId)!.title, "Server controls");
  const dispatchResponse = await handleApi(request("member-b", `/api/items/${itemId}/dispatch`, "POST"), { DB: db });
  assert.equal(dispatchResponse?.status, 404);
  const economicsResponse = await handleApi(request("member-b", `/api/items/${itemId}/work-economics`, "PATCH", { section: "actualEconomics", value: { sensitive: "payload" }, reason: "Cross-POD request" }), { DB: db });
  assert.equal(economicsResponse?.status, 403);
  const denials = db.sqlite.prepare("SELECT previous_json, replacement_json, reason FROM work_economics_events WHERE item_id = ? AND action = 'denied' ORDER BY id").all(itemId) as Array<Record<string, unknown>>;
  assert.equal(denials.length, 3);
  assert.ok(denials.every((event) => event.previous_json === null && event.replacement_json === null));
  assert.ok(denials.every((event) => !String(event.reason).includes("sensitive payload")));
});

test("general item mutation rejects a cross-POD assignee", async () => {
  const { db, itemId } = await setup();
  const response = await handleApi(request("member-a", `/api/items/${itemId}`, "PATCH", { assigneeId: "member-b" }), { DB: db });
  assert.equal(response?.status, 400);
  assert.equal(db.sqlite.prepare("SELECT assignee_id FROM work_items WHERE id = ?").get(itemId)!.assignee_id, "agent-a");
});

test("every item-ID review, workflow, decision, code-review, and notification route is POD scoped", async () => {
  const { db, itemId } = await setup();
  const probes: Array<[string, string, unknown?]> = [
    ["POST", `/api/items/${itemId}/reviews`],
    ["POST", `/api/items/${itemId}/workflow`, { action: "start_rework" }],
    ["POST", `/api/items/${itemId}/decisions`, { decision: "APPROVED", reasoning: "Cross-POD request must not reach decision logic." }],
    ["GET", `/api/items/${itemId}/code-review`],
    ["POST", `/api/items/${itemId}/code-review`, { action: "ACCEPT", reasoning: "Cross-POD request must not reach GitHub." }],
  ];
  for (const [method, path, body] of probes) {
    const response = await handleApi(request("member-b", path, method, body), { DB: db });
    assert.equal(response?.status, 404, `${method} ${path}`);
  }
  const inserted = db.sqlite.prepare(`INSERT INTO notifications
    (dedupe_key,item_id,member_id,recipient_role,kind,title,body,channel,status,created_at)
    VALUES ('pod-a-notice',?,'member-a','Platform / Ops Lead','test','POD A only','Do not expose','Block Buzz','queued','2026-08-14T16:00:00.000Z')`).run(itemId);
  const notificationResponse = await handleApi(request("member-b", `/api/notifications/${Number(inserted.lastInsertRowid)}/read`, "POST"), { DB: db });
  assert.equal(notificationResponse?.status, 404);
  assert.equal(db.sqlite.prepare("SELECT status FROM notifications WHERE id = ?").get(inserted.lastInsertRowid)!.status, "queued");
});

test("value evidence and comparable history are server verified and fail closed", async () => {
  const { db, itemId } = await setup();
  db.sqlite.prepare("UPDATE members SET role = 'Product Lead · Platform / Ops Lead' WHERE id = 'member-a'").run();
  const value = {
    primaryType: "platform capability or reuse", beneficiary: "POD", outcomeMetric: "coverage", baseline: "0", target: "90", unit: "percent", observationDate: "2026-09-01", outcomeOwner: "Product Lead", outcomeOwnerId: "member-a",
    impact: "High", timeCriticality: "Medium", strategicAlignment: "High", confidence: "medium", evidence: "https://evidence.invalid/client-verified", evidenceStatus: "verified", evidenceRevision: "client", evidenceSha256: "a".repeat(64), evidenceVerifiedAt: "2026-08-14T15:00:00.000Z", valueMode: "non-monetary", assumptions: "Ten observations", advisory: null, acceptanceState: "no proposal", acceptedBy: "client", acceptedAt: "2026-08-14T15:00:00.000Z",
  };
  const valueResponse = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", { section: "valueHypothesis", value, reason: "Client evidence must not be trusted" }), { DB: db });
  assert.equal(valueResponse?.status, 409);
  assert.equal(db.sqlite.prepare("SELECT value_hypothesis_json FROM work_items WHERE id = ?").get(itemId)!.value_hypothesis_json, null);

  const fabricated = { ...forecast, basisKind: "comparable history", confidence: "high", comparableItems: "fabricated other-POD rows", serviceLevel: { podId: "pod-b", workType: "STEER", sampleSize: 999, percentile: 85, lowHours: 1, highHours: 2 } };
  const forecastResponse = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", { section: "deliveryForecast", value: fabricated, reason: "Server must bind the cohort" }), { DB: db });
  assert.equal(forecastResponse?.status, 409);

  const outcome = { status: "verified positive", observedMetric: "coverage", observedResult: "90", unit: "percent", observationDate: "2026-09-01", verifier: "client", evidence: "https://evidence.invalid/outcome", evidenceRevision: "client", evidenceSha256: "a".repeat(64), evidenceVerifiedAt: "2026-08-14T15:00:00.000Z", confidence: "medium", causalLimitations: "Initial cohort", verifiedAt: "2026-08-14T15:00:00.000Z", outcomeOwnerId: "member-a", advisory: null, acceptanceState: "no proposal" };
  const outcomeResponse = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", { section: "realizedOutcome", value: outcome, reason: "Client outcome evidence must not be trusted" }), { DB: db });
  assert.equal(outcomeResponse?.status, 409);
  const pendingInvalidDate = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", { section: "realizedOutcome", value: { ...outcome, status: "pending evidence", observationDate: "not-a-date", evidence: "", causalLimitations: "" }, reason: "Invalid dates fail closed" }), { DB: db });
  assert.equal(pendingInvalidDate?.status, 400);
});

test("actuals normalize queryable delivery facts and replace client completion and variance with server facts", async () => {
  const { db, itemId } = await setup();
  db.sqlite.prepare("UPDATE work_items SET state = 'complete', updated_at = '2026-08-14T18:30:00.000Z' WHERE id = ?").run(itemId);
  db.sqlite.prepare("INSERT INTO activity (item_id,actor_id,action,detail,created_at) VALUES (?,'member-a','updated','state → complete','2026-08-14T18:30:00.000Z')").run(itemId);
  const actual = {
    humanRoleTotals: [{ role: "Delivery roles", activeMinutes: 45 }],
    agentTelemetry: [{ eventId: "provider-1", provider: "OpenAI", model: "gpt-5", attempts: 2, inputTokens: 1000, outputTokens: 250, meteredCost: 0.5, currency: "USD", executionMinutes: 10, source: "provider event", completeness: "complete", observedAt: "2026-08-14T18:20:00.000Z", ingestionState: "conflict", conflictReason: "Provider retry duplicates one earlier event" }],
    durationFacts: { agentExecutionMinutes: 10, queueMinutes: 5, blockedMinutes: 10, gateWaitMinutes: 20, cycleMinutes: 75 },
    reworkEvents: [{ originatingPhase: "Engineer", minutes: 20, reason: "Independent-test correction" }], defectEvents: [{ severity: "blocker", count: 2 }], rollbackEvents: [{ reason: "Restore safe revision", occurredAt: "2026-08-14T17:00:00.000Z" }],
    telemetrySource: "provider plus workflow events", completeness: "complete", completionAt: "2030-01-01T00:00:00.000Z", likelyVarianceMinutes: 999999,
    correctedBy: "client", correctedAt: "2026-08-14T18:20:00.000Z", correctionReason: "Reconciled system facts", advisory: null, acceptanceState: "no proposal",
  };
  const response = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", { section: "actualEconomics", value: actual, reason: "Record authoritative actual delivery facts" }), { DB: db });
  assert.equal(response?.status, 200, await response?.text());
  const stored = JSON.parse(String(db.sqlite.prepare("SELECT actual_economics_json FROM work_items WHERE id = ?").get(itemId)!.actual_economics_json));
  assert.equal(stored.completionAt, "2026-08-14T18:30:00.000Z");
  assert.equal(stored.likelyVarianceMinutes, 30);
  assert.equal(db.sqlite.prepare("SELECT conflict_reason FROM work_economics_agent_facts WHERE item_id = ? AND record_kind = 'actual'").get(itemId)!.conflict_reason, "Provider retry duplicates one earlier event");
  const deliveryEvents = db.sqlite.prepare("SELECT event_kind, count(*) AS total FROM work_economics_delivery_events WHERE item_id = ? GROUP BY event_kind ORDER BY event_kind").all(itemId).map((row) => ({ ...row }));
  assert.deepEqual(deliveryEvents, [
    { event_kind: "defect", total: 1 }, { event_kind: "rework", total: 1 }, { event_kind: "rollback", total: 1 },
  ]);
});
