import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { schnorr } from "@noble/curves/secp256k1.js";
import { canonicalJson, sha256Hex } from "../lib/dispatch-lifecycle";
import { reviewManifestSha256 } from "../lib/review-lifecycle";
import { handleApi } from "../worker/api";

const dispatchEnv = {
  DISPATCH_SERVICE_PRIVATE_KEY: "0".repeat(63) + "7",
  DISPATCH_SERVICE_KEY_ID: "test-dispatch-signer",
  DISPATCH_SERVICE_KEY_VERSION: "1",
  DISPATCH_SERVICE_TOKEN: "test-dispatch-service-token-0000000000000000",
  DISPATCH_ALLOW_TEST_PRIVACY_POLICY: "true",
  REVIEW_SERVICE_PRIVATE_KEY: "0".repeat(63) + "9",
  REVIEW_SERVICE_KEY_ID: "test-review-signer",
  REVIEW_SERVICE_KEY_VERSION: "1",
  REVIEW_SERVICE_TOKEN: "test-review-service-token-000000000000000000",
};

const privacyInventory = await readFile(new URL("../../steer/evidence/0028-dispatch-data-inventory.md", import.meta.url), "utf8");

class D1Statement {
  constructor(private readonly db: DatabaseSync, private readonly sql: string, private readonly values: unknown[] = []) {}
  bind(...values: unknown[]) { return new D1Statement(this.db, this.sql, values); }
  async first<T>() { return (this.db.prepare(this.sql).get(...this.values as never[]) as T | undefined) ?? null; }
  async all<T>() { return { results: this.db.prepare(this.sql).all(...this.values as never[]) as T[] }; }
  runSync<T>() {
    const result = this.db.prepare(this.sql).run(...this.values as never[]);
    return { results: [] as T[], meta: { last_row_id: Number(result.lastInsertRowid), changes: Number(result.changes) } };
  }
  async run<T>() { return this.runSync<T>(); }
}

class D1Database {
  readonly sqlite = new DatabaseSync(":memory:");
  prepare(sql: string) { return new D1Statement(this.sqlite, sql); }
  async batch(statements: D1Statement[]) {
    this.sqlite.exec("BEGIN IMMEDIATE");
    try {
      const results = statements.map((statement) => statement.runSync());
      this.sqlite.exec("COMMIT");
      return results;
    } catch (error) {
      this.sqlite.exec("ROLLBACK");
      throw error;
    }
  }
}

function request(user: string, path: string, method = "GET", body?: unknown) {
  const versionedBody = method === "PATCH" && body && typeof body === "object" && !Array.isArray(body) && !("expectedRevision" in body)
    ? { ...body, expectedRevision: "2026-08-14T14:00:00.000Z" }
    : body;
  return new Request(`https://steer.test${path}`, {
    method,
    headers: {
      "oai-authenticated-user-id": user,
      "oai-authenticated-user-email": `${user}@example.test`,
      ...(versionedBody === undefined ? {} : { "content-type": "application/json" }),
    },
    body: versionedBody === undefined ? undefined : JSON.stringify(versionedBody),
  });
}

function serviceRequest(path: string, body: unknown) {
  return new Request(`https://steer.test${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${dispatchEnv.DISPATCH_SERVICE_TOKEN}` },
    body: JSON.stringify(body),
  });
}

function reviewServiceRequest(path: string, body: unknown) {
  return new Request(`https://steer.test${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${dispatchEnv.REVIEW_SERVICE_TOKEN}` },
    body: JSON.stringify(body),
  });
}

function reviewAgentRequest(path: string, body: Record<string, unknown>) {
  return reviewServiceRequest(path, { member_id: "agent-critic", ...body });
}

function hex(value: Uint8Array) {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function signBinding(payload: unknown, secret: Uint8Array) {
  const digest = await sha256Hex(canonicalJson(payload));
  return hex(schnorr.sign(Uint8Array.from(digest.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16))), secret));
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

function completedActual(cycleMinutes: number) {
  return {
    humanRoleTotals: [], agentTelemetry: [], durationFacts: { agentExecutionMinutes: 5, queueMinutes: 2, blockedMinutes: 0, gateWaitMinutes: 1, cycleMinutes },
    reworkEvents: [], defectEvents: [], rollbackEvents: [], telemetrySource: "workflow events", completeness: "complete", completionAt: "2026-08-14T18:30:00.000Z", likelyVarianceMinutes: 30,
    correctedBy: "member-a", correctedAt: "2026-08-14T18:30:00.000Z", correctionReason: "Authoritative completed history", advisory: null, acceptanceState: "no proposal",
  };
}

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
  db.sqlite.prepare(`INSERT INTO dispatch_privacy_policies
    (pod_id, policy_version, inventory_url, inventory_sha256, terminal_retention_days, provider_recovery_days, status, changed_by, change_reason, created_at)
    VALUES ('pod-a', 1, 'https://github.com/idrissenayat/federal-bd-platform/blob/382dba4b08abc94196f26f77c14f232e6e32d3b7/steer/evidence/0028-dispatch-data-inventory.md',
      '882afa8a3385b4ae596cc03656eb2173504b513e5a368959f4608ad5d48aaa24', 90, 30, 'BLOCKED_BACKUP_RULING', 'member-a', 'Test fixture', '2026-08-18T00:00:00.000Z')`).run();
  db.sqlite.prepare(`INSERT INTO buzz_channel_registry
    (pod_id, registry_version, channel_id, channel_name, relay_url, status, changed_by, change_reason, created_at)
    VALUES ('pod-a', 1, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://relay.example', 'ACTIVE', 'member-a', 'Test fixture', '2026-08-18T00:00:00.000Z')`).run();
  return { db, itemId: Number(result.lastInsertRowid) };
}

async function reviewTarget() {
  const oid = "f".repeat(40);
  const base = {
    target_git_object_format: "sha1" as const,
    target_git_commit_oid: oid,
    target_artifacts: [{
      path: "steer/evidence/0028-gate-3-build.md",
      url: `https://github.com/idrissenayat/federal-bd-platform/blob/${oid}/steer/evidence/0028-gate-3-build.md`,
      size_bytes: 1200,
      sha256: "a".repeat(64),
    }],
  };
  return { ...base, target_commit_object_sha256: "b".repeat(64), target_artifact_manifest_sha256: await reviewManifestSha256(base) };
}

function prepareDispatchAuthorizationSeed(db: D1Database, itemId: number, revision = "a".repeat(40)) {
  const acceptedAt = new Date().toISOString();
  const currentForecast = { ...forecast, acceptedAt, updatedAt: acceptedAt, earliestCompletion: "2026-08-20T14:00:00.000Z", likelyCompletion: "2026-08-20T18:00:00.000Z", latestCompletion: "2026-08-21T18:00:00.000Z", nextMilestoneAt: "2026-08-19T16:00:00.000Z", phaseExitAt: "2026-08-20T18:00:00.000Z" };
  db.sqlite.prepare(`UPDATE members SET agent_key_id = 'agent-a-key', agent_key_version = 1,
    agent_public_key = ?, agent_public_key_fingerprint = ? WHERE id = 'agent-a'`).run("e".repeat(64), "a".repeat(64));
  db.sqlite.prepare(`INSERT INTO workspace_routing
    (pod_id, route_key, configuration_version, channel_id, channel_name, relay_url, changed_by, change_reason, created_at)
    VALUES ('pod-a', 'workspace.routing.steer_agent_handoff.channel_id', 1, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://relay.example', 'member-a', 'Test fixture', ?)`)
    .run(acceptedAt);
  db.sqlite.prepare(`INSERT INTO agent_channel_memberships
    (pod_id, channel_id, member_id, membership_version, status, created_at)
    VALUES ('pod-a', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'agent-a', 1, 'active', ?)`)
    .run(acceptedAt);
  db.sqlite.prepare("UPDATE work_items SET evidence_url = ?, delivery_forecast_json = ? WHERE id = ?")
    .run(`https://github.com/idrissenayat/federal-bd-platform/blob/${revision}/steer/exams/0028.md`, JSON.stringify(currentForecast), itemId);
  db.sqlite.prepare(`INSERT INTO work_economics_events
    (item_id, section, action, actor_id, actor_role, previous_json, replacement_json, reason, created_at)
    VALUES (?, 'deliveryForecast', 'accepted', 'member-a', 'Delivery owner', NULL, ?, 'Test accepted forecast audit', ?)`)
    .run(itemId, JSON.stringify(currentForecast), acceptedAt);
  return acceptedAt;
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

test("STR-028 telemetry accepts only bounded labels and rejects PII-shaped extra fields", async () => {
  const { db } = await setup();
  const accepted = await handleApi(request("member-a", "/api/telemetry", "POST", {
    metric_name: "steer_work_item_save_outcome_total", label_name: "outcome", label_value: "success", value: 1, case_id: "SAVE-01",
  }), { DB: db });
  assert.equal(accepted?.status, 204);
  const rejected = await handleApi(request("member-a", "/api/telemetry", "POST", {
    metric_name: "steer_work_item_save_outcome_total", label_name: "outcome", label_value: "success", value: 1, actor_id: "member-a",
  }), { DB: db });
  assert.equal(rejected?.status, 400);
  const substitutedCase = await handleApi(request("member-a", "/api/telemetry", "POST", {
    metric_name: "steer_work_item_save_outcome_total", label_name: "outcome", label_value: "success", value: 1, case_id: "SAVE-99",
  }), { DB: db });
  assert.equal(substitutedCase?.status, 400);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM steer_telemetry").get()!.total, 1);
  const row = db.sqlite.prepare("SELECT metric_name, label_name, label_value, value, case_id FROM steer_telemetry").get()!;
  assert.deepEqual({ ...row }, { metric_name: "steer_work_item_save_outcome_total", label_name: "outcome", label_value: "success", value: 1, case_id: "SAVE-01" });
});

test("FAIL-01 rejects stale mutation revision r0 against authoritative r1 without a durable side effect", async () => {
  const { db, itemId } = await setup();
  db.sqlite.prepare("UPDATE work_items SET updated_at = '2026-08-14T14:01:00.000Z' WHERE id = ?").run(itemId);
  const response = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", {
    expectedRevision: "2026-08-14T14:00:00.000Z",
    section: "deliveryForecast",
    value: forecast,
    reason: "Stale revision must fail closed",
  }), { DB: db });
  assert.equal(response?.status, 409, await response?.clone().text());
  const body = await response?.json() as { code: string; snapshot: { item: { updated_at: string } } };
  assert.equal(body.code, "STALE_REVISION");
  assert.equal(body.snapshot.item.updated_at, "2026-08-14T14:01:00.000Z");
  assert.equal(db.sqlite.prepare("SELECT delivery_forecast_json FROM work_items WHERE id = ?").get(itemId)!.delivery_forecast_json, JSON.stringify(forecast));
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM work_economics_events WHERE item_id = ?").get(itemId)!.total, 0);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM activity WHERE item_id = ?").get(itemId)!.total, 0);
});

test("SAVE-01 populates an empty optional Work Economics forecast from the authoritative response", async () => {
  const { db, itemId } = await setup();
  db.sqlite.prepare("UPDATE work_items SET delivery_forecast_json = NULL WHERE id = ?").run(itemId);
  const response = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", {
    section: "deliveryForecast", value: forecast, reason: "SAVE-01 populated forecast",
  }), { DB: db });
  assert.equal(response?.status, 200, await response?.text());
  const stored = JSON.parse(String(db.sqlite.prepare("SELECT delivery_forecast_json FROM work_items WHERE id = ?").get(itemId)!.delivery_forecast_json));
  assert.equal(stored.acceptedBy, "member-a");
  assert.equal(db.sqlite.prepare("SELECT action FROM work_economics_events WHERE item_id = ?").get(itemId)!.action, "accepted");
});

test("SAVE-02 replaces an existing Work Economics forecast with one audited correction", async () => {
  const { db, itemId } = await setup();
  const replacement = { ...forecast, nextMilestone: "SAVE-02 corrected milestone", changeReason: "SAVE-02 audited correction" };
  const response = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", {
    section: "deliveryForecast", value: replacement, reason: "SAVE-02 audited correction",
  }), { DB: db });
  assert.equal(response?.status, 200, await response?.text());
  const event = db.sqlite.prepare("SELECT action, previous_json, replacement_json FROM work_economics_events WHERE item_id = ?").get(itemId)!;
  assert.equal(event.action, "corrected");
  assert.ok(event.previous_json);
  assert.equal(JSON.parse(String(event.replacement_json)).nextMilestone, "SAVE-02 corrected milestone");
});

test("SAVE-03 accepts valid lower-bound numeric forecast values", async () => {
  const { db, itemId } = await setup();
  const lowerBound = {
    ...forecast,
    sizeBand: "XS",
    humanEffortRanges: [{ role: "Delivery roles", minMinutes: 0, maxMinutes: 0 }],
    agentCostRanges: [{ provider: "OpenAI", minCost: 0, maxCost: 0, currency: "USD", expectedAttempts: 0 }],
    complexity: 1, uncertainty: 1, coordination: 1,
    changeReason: "SAVE-03 valid lower bounds",
  };
  const response = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", {
    section: "deliveryForecast", value: lowerBound, reason: "SAVE-03 valid lower bounds",
  }), { DB: db });
  assert.equal(response?.status, 200, await response?.text());
  const stored = JSON.parse(String(db.sqlite.prepare("SELECT delivery_forecast_json FROM work_items WHERE id = ?").get(itemId)!.delivery_forecast_json));
  assert.deepEqual(stored.humanEffortRanges[0], { role: "Delivery roles", minMinutes: 0, maxMinutes: 0 });
  assert.equal(stored.complexity, 1);
});

test("SAVE-04 accepts valid upper rubric values and long permitted text", async () => {
  const { db, itemId } = await setup();
  const longBasis = `SAVE-04 ${"bounded planning detail ".repeat(80)}`.trim();
  const upperBound = {
    ...forecast,
    sizeBand: "XL",
    humanEffortRanges: [{ role: "Delivery roles", minMinutes: 100_000, maxMinutes: 100_000 }],
    agentCostRanges: [{ provider: "OpenAI", minCost: 100_000, maxCost: 100_000, currency: "USD", expectedAttempts: 100_000 }],
    complexity: 5, uncertainty: 5, coordination: 5,
    basis: longBasis,
    changeReason: "SAVE-04 valid upper rubric and long text",
  };
  const response = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", {
    section: "deliveryForecast", value: upperBound, reason: "SAVE-04 valid upper rubric and long text",
  }), { DB: db });
  assert.equal(response?.status, 200, await response?.text());
  const stored = JSON.parse(String(db.sqlite.prepare("SELECT delivery_forecast_json FROM work_items WHERE id = ?").get(itemId)!.delivery_forecast_json));
  assert.equal(stored.basis, longBasis);
  assert.equal(stored.complexity, 5);
});

test("FAIL-02 rejects an invalid Work Economics field set without overwriting r1", async () => {
  const { db, itemId } = await setup();
  const response = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", {
    section: "deliveryForecast", value: { ...forecast, injectedField: "not permitted" }, reason: "FAIL-02 invalid field set",
  }), { DB: db });
  assert.equal(response?.status, 400, await response?.clone().text());
  assert.match(String((await response?.json() as { error: string }).error), /not an allowed field/);
  assert.equal(db.sqlite.prepare("SELECT delivery_forecast_json FROM work_items WHERE id = ?").get(itemId)!.delivery_forecast_json, JSON.stringify(forecast));
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM work_economics_events WHERE item_id = ?").get(itemId)!.total, 0);
});

test("FAIL-03 rejects every frozen pre-receipt route conflict with only one typed no-PII diagnostic", async () => {
  const cases: Array<{ id: string; code: string; mutate(db: D1Database): void }> = [
    {
      id: "F03-A", code: "ROUTE_CONFIG_MISSING",
      mutate: (db) => { db.sqlite.prepare("DELETE FROM workspace_routing WHERE pod_id = 'pod-a'").run(); },
    },
    {
      id: "F03-B", code: "ROUTE_CHANNEL_UNKNOWN",
      mutate: (db) => { db.sqlite.prepare(`INSERT INTO buzz_channel_registry
        (pod_id, registry_version, channel_id, channel_name, relay_url, status, changed_by, change_reason, created_at)
        VALUES ('pod-a', 2, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://relay.example', 'DELETED', 'member-a', 'Frozen F03-B', ?)`).run(new Date().toISOString()); },
    },
    {
      id: "F03-C", code: "ROUTE_CHANNEL_IDENTITY_MISMATCH",
      mutate: (db) => { db.sqlite.prepare(`INSERT INTO buzz_channel_registry
        (pod_id, registry_version, channel_id, channel_name, relay_url, status, changed_by, change_reason, created_at)
        VALUES ('pod-a', 2, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#wrong-channel', 'https://relay.example', 'ACTIVE', 'member-a', 'Frozen F03-C', ?)`).run(new Date().toISOString()); },
    },
    {
      id: "F03-D", code: "ROUTE_RELAY_WORKSPACE_MISMATCH",
      mutate: (db) => { db.sqlite.prepare(`INSERT INTO buzz_channel_registry
        (pod_id, registry_version, channel_id, channel_name, relay_url, status, changed_by, change_reason, created_at)
        VALUES ('pod-a', 2, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://wrong-relay.example', 'ACTIVE', 'member-a', 'Frozen F03-D', ?)`).run(new Date().toISOString()); },
    },
    {
      id: "F03-E", code: "ROUTE_AGENT_NOT_ENROLLED",
      mutate: (db) => { db.sqlite.prepare(`INSERT INTO agent_channel_memberships
        (pod_id, channel_id, member_id, membership_version, status, created_at)
        VALUES ('pod-a', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'agent-a', 2, 'removed', ?)`).run(new Date().toISOString()); },
    },
    {
      id: "F03-F", code: "ROUTE_COMPETING_SOURCE",
      mutate: (db) => { db.sqlite.prepare(`INSERT INTO workspace_routing_conflicts
        (pod_id, route_key, conflict_id, source_kind, source_reference_sha256, status, detected_by, detected_at)
        VALUES ('pod-a', 'workspace.routing.steer_agent_handoff.channel_id', 'f03-f', 'environment-override', ?, 'ACTIVE', 'member-a', ?)`).run("b".repeat(64), new Date().toISOString()); },
    },
  ];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => String(input).includes("0028-dispatch-data-inventory.md")
    ? new Response(privacyInventory, { status: 200 })
    : String(input).includes("raw.githubusercontent.com") ? new Response("# exact approved exam\n", { status: 200 })
    : originalFetch(input);
  try {
    for (const frozen of cases) {
      const { db, itemId } = await setup();
      prepareDispatchAuthorizationSeed(db, itemId);
      frozen.mutate(db);
      const response = await handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv });
      assert.equal(response?.status, 409, `${frozen.id}: ${await response?.clone().text()}`);
      assert.equal((await response?.json() as { code: string }).code, frozen.code, frozen.id);
      assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_security_diagnostics").get()!.total, 1, frozen.id);
      assert.equal(db.sqlite.prepare("SELECT code FROM dispatch_security_diagnostics").get()!.code, frozen.code, frozen.id);
      assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_receipts").get()!.total, 0, frozen.id);
      assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_outbox").get()!.total, 0, frozen.id);
      assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events").get()!.total, 0, frozen.id);
      assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_attempts").get()!.total, 0, frozen.id);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("FAIL-04 fences every frozen post-receipt binding invalidation before send", async () => {
  const cases: Array<{ id: string; code: string; mutate(db: D1Database): void }> = [
    {
      id: "F04-A", code: "CHANNEL_BINDING_STALE",
      mutate: (db) => { db.sqlite.prepare(`INSERT INTO workspace_routing
        (pod_id, route_key, configuration_version, channel_id, channel_name, relay_url, changed_by, change_reason, created_at)
        VALUES ('pod-a', 'workspace.routing.steer_agent_handoff.channel_id', 2, 'wrong-channel-id', '#wrong-channel', 'https://relay.example', 'member-a', 'Frozen F04-A', ?)`).run(new Date().toISOString()); },
    },
    {
      id: "F04-B", code: "RELAY_BINDING_STALE",
      mutate: (db) => {
        db.sqlite.prepare(`INSERT INTO workspace_routing
          (pod_id, route_key, configuration_version, channel_id, channel_name, relay_url, changed_by, change_reason, created_at)
          VALUES ('pod-a', 'workspace.routing.steer_agent_handoff.channel_id', 2, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://other-relay.example', 'member-a', 'Frozen F04-B', ?)`).run(new Date().toISOString());
        db.sqlite.prepare(`INSERT INTO buzz_channel_registry
          (pod_id, registry_version, channel_id, channel_name, relay_url, status, changed_by, change_reason, created_at)
          VALUES ('pod-a', 2, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://other-relay.example', 'ACTIVE', 'member-a', 'Frozen F04-B', ?)`).run(new Date().toISOString());
      },
    },
    {
      id: "F04-C", code: "ROUTE_CONFIG_MISSING",
      mutate: (db) => { db.sqlite.prepare("DELETE FROM workspace_routing WHERE pod_id = 'pod-a'").run(); },
    },
    {
      id: "F04-D", code: "MEMBERSHIP_STALE",
      mutate: (db) => { db.sqlite.prepare(`INSERT INTO agent_channel_memberships
        (pod_id, channel_id, member_id, membership_version, status, created_at)
        VALUES ('pod-a', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'agent-a', 2, 'removed', ?)`).run(new Date().toISOString()); },
    },
    {
      id: "F04-E", code: "RELAY_PUBLISHER_UNTRUSTED",
      mutate: (db) => { db.sqlite.prepare(`INSERT INTO relay_event_signers
        (pod_id, registry_version, relay_url, channel_id, key_id, key_version, public_key, valid_from, valid_until, status, changed_by, change_reason, created_at)
        VALUES ('pod-a', 2, 'https://relay.example', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'relay-test', 2, ?, ?, NULL, 'RETIRED', 'member-a', 'Frozen F04-E', ?)`)
        .run("c".repeat(64), new Date().toISOString(), new Date().toISOString()); },
    },
  ];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => String(input).includes("0028-dispatch-data-inventory.md")
    ? new Response(privacyInventory, { status: 200 })
    : String(input).includes("raw.githubusercontent.com") ? new Response("# exact approved exam\n", { status: 200 })
    : originalFetch(input);
  try {
    for (const frozen of cases) {
      const { db, itemId } = await setup();
      const acceptedAt = prepareDispatchAuthorizationSeed(db, itemId);
      db.sqlite.prepare(`INSERT INTO relay_event_signers
        (pod_id, registry_version, relay_url, channel_id, key_id, key_version, public_key, valid_from, valid_until, status, changed_by, change_reason, created_at)
        VALUES ('pod-a', 1, 'https://relay.example', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'relay-test', 1, ?, ?, NULL, 'ACTIVE', 'member-a', 'Test fixture', ?)`)
        .run("d".repeat(64), acceptedAt, acceptedAt);
      const authorized = await handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv });
      assert.equal(authorized?.status, 200, `${frozen.id}: ${await authorized?.text()}`);
      const intentId = String(db.sqlite.prepare("SELECT intent_id FROM dispatch_receipts").get()!.intent_id);
      const reserved = await handleApi(serviceRequest("/api/dispatches/next", {}), { DB: db, ...dispatchEnv });
      assert.equal(reserved?.status, 201, `${frozen.id}: ${await reserved?.clone().text()}`);
      frozen.mutate(db);
      const blocked = await handleApi(serviceRequest(`/api/dispatches/${intentId}/commands`, { command: "START_SEND" }), { DB: db, ...dispatchEnv });
      assert.equal(blocked?.status, 409, `${frozen.id}: ${await blocked?.clone().text()}`);
      assert.equal((await blocked?.json() as { code: string }).code, frozen.code, frozen.id);
      const outbox = db.sqlite.prepare(`SELECT current_state, terminalization_requested, lease_id, reservation_fence, send_started
        FROM dispatch_outbox WHERE intent_id = ?`).get(intentId)!;
      assert.deepEqual({ ...outbox }, { current_state: "QUEUED", terminalization_requested: 1, lease_id: null, reservation_fence: null, send_started: 0 }, frozen.id);
      assert.equal(db.sqlite.prepare("SELECT status FROM dispatch_attempts WHERE intent_id = ?").get(intentId)!.status, "FENCED_CONFIG_STALE", frozen.id);
      assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE intent_id = ? AND event_type = 'TERMINALIZATION_REQUESTED'").get(intentId)!.total, 1, frozen.id);
      assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE intent_id = ? AND event_type = 'DELIVERY_BLOCKED_CONFIG_STALE'").get(intentId)!.total, 1, frozen.id);
      assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE intent_id = ? AND event_type = 'SEND_ATTEMPT_STARTED'").get(intentId)!.total, 0, frozen.id);
      assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE intent_id = ? AND resulting_state <> 'QUEUED'").get(intentId)!.total, 0, frozen.id);
      const noSend = await handleApi(serviceRequest("/api/dispatches/next", {}), { DB: db, ...dispatchEnv });
      assert.equal(noSend?.status, 204, frozen.id);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("successful dispatch creates one immutable receipt, outbox identity, and QUEUED event across replay", async () => {
  const { db, itemId } = await setup();
  const revision = "b".repeat(40);
  const acceptedAt = new Date().toISOString();
  const currentForecast = { ...forecast, acceptedAt, updatedAt: acceptedAt, earliestCompletion: "2026-08-20T14:00:00.000Z", likelyCompletion: "2026-08-20T18:00:00.000Z", latestCompletion: "2026-08-21T18:00:00.000Z", nextMilestoneAt: "2026-08-19T16:00:00.000Z", phaseExitAt: "2026-08-20T18:00:00.000Z" };
  db.sqlite.prepare(`UPDATE members SET agent_key_id = 'agent-a-key', agent_key_version = 1,
    agent_public_key = ?, agent_public_key_fingerprint = ? WHERE id = 'agent-a'`).run("e".repeat(64), "a".repeat(64));
  db.sqlite.prepare(`INSERT INTO workspace_routing
    (pod_id, route_key, configuration_version, channel_id, channel_name, relay_url, changed_by, change_reason, created_at)
    VALUES ('pod-a', 'workspace.routing.steer_agent_handoff.channel_id', 1, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://relay.example', 'member-a', 'Test fixture', ?)`)
    .run(acceptedAt);
  db.sqlite.prepare(`INSERT INTO agent_channel_memberships
    (pod_id, channel_id, member_id, membership_version, status, created_at)
    VALUES ('pod-a', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'agent-a', 1, 'active', ?)`)
    .run(acceptedAt);
  db.sqlite.prepare("UPDATE work_items SET evidence_url = ?, delivery_forecast_json = ? WHERE id = ?")
    .run(`https://github.com/idrissenayat/federal-bd-platform/blob/${revision}/steer/exams/0028.md`, JSON.stringify(currentForecast), itemId);
  db.sqlite.prepare(`INSERT INTO work_economics_events
    (item_id, section, action, actor_id, actor_role, previous_json, replacement_json, reason, created_at)
    VALUES (?, 'deliveryForecast', 'accepted', 'member-a', 'Delivery owner', NULL, ?, 'Test accepted forecast audit', ?)`)
    .run(itemId, JSON.stringify(currentForecast), acceptedAt);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => String(input).includes("0028-dispatch-data-inventory.md")
    ? new Response(privacyInventory, { status: 200 })
    : String(input).includes("raw.githubusercontent.com") ? new Response("# exact approved exam\n", { status: 200 })
    : originalFetch(input);
  try {
    const productionBlocked = await handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv, DISPATCH_ALLOW_TEST_PRIVACY_POLICY: undefined });
    assert.equal(productionBlocked?.status, 409);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_receipts").get()!.total, 0);
    const first = await handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv });
    assert.equal(first?.status, 200, await first?.text());
    const replay = await handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv });
    const replayBody = await replay?.json() as { idempotent_replay: boolean; error?: string };
    assert.equal(replay?.status, 200, JSON.stringify(replayBody));
    assert.equal(replayBody.idempotent_replay, true);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_receipts").get()!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_outbox").get()!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE event_type = 'QUEUED'").get()!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT channel_name FROM dispatch_outbox").get()!.channel_name, "#steer-team");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("REC-02 concurrent dispatch submissions commit one identity and return one idempotent replay", async () => {
  const { db, itemId } = await setup();
  prepareDispatchAuthorizationSeed(db, itemId, "b".repeat(40));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => String(input).includes("0028-dispatch-data-inventory.md")
    ? new Response(privacyInventory, { status: 200 })
    : String(input).includes("raw.githubusercontent.com") ? new Response("# exact approved exam\n", { status: 200 })
    : originalFetch(input);
  try {
    const responses = await Promise.all([
      handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv }),
      handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv }),
    ]);
    assert.deepEqual(responses.map((response) => response?.status).sort(), [200, 200], JSON.stringify(await Promise.all(responses.map((response) => response?.clone().text()))));
    const bodies = await Promise.all(responses.map((response) => response?.json() as Promise<{ idempotent_replay: boolean }>));
    assert.deepEqual(bodies.map((body) => body.idempotent_replay).sort(), [false, true]);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_receipts").get()!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_authorization_audits").get()!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_outbox").get()!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE event_type = 'QUEUED'").get()!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM activity WHERE item_id = ? AND action = 'dispatch_authorized'").get(itemId)!.total, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("REC-03 uncertain send reconciles a discovered relay delivery before acknowledgement without retry", async () => {
  const { db, itemId } = await setup();
  const acceptedAt = prepareDispatchAuthorizationSeed(db, itemId, "e".repeat(40));
  const agentSecret = new Uint8Array(32); agentSecret[31] = 19;
  const relaySecret = new Uint8Array(32); relaySecret[31] = 23;
  const agentPublicKey = hex(schnorr.getPublicKey(agentSecret));
  const relayPublicKey = hex(schnorr.getPublicKey(relaySecret));
  db.sqlite.prepare("UPDATE members SET agent_public_key = ?, agent_public_key_fingerprint = ? WHERE id = 'agent-a'")
    .run(agentPublicKey, "a".repeat(64));
  db.sqlite.prepare(`INSERT INTO relay_event_signers
    (pod_id, registry_version, relay_url, channel_id, key_id, key_version, public_key, valid_from, valid_until, status, changed_by, change_reason, created_at)
    VALUES ('pod-a', 1, 'https://relay.example', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'relay-test', 1, ?, ?, NULL, 'ACTIVE', 'member-a', 'REC-03 fixture', ?)`)
    .run(relayPublicKey, acceptedAt, acceptedAt);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => String(input).includes("0028-dispatch-data-inventory.md")
    ? new Response(privacyInventory, { status: 200 })
    : String(input).includes("raw.githubusercontent.com") ? new Response("# exact approved exam\n", { status: 200 })
    : originalFetch(input);
  try {
    const authorized = await handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv });
    assert.equal(authorized?.status, 200, await authorized?.text());
    const receipt = JSON.parse(String(db.sqlite.prepare("SELECT receipt_json FROM dispatch_receipts").get()!.receipt_json)) as Record<string, unknown>;
    const intentId = String(receipt.dispatch_intent_id);
    const reserved = await handleApi(serviceRequest("/api/dispatches/next", {}), { DB: db, ...dispatchEnv });
    assert.equal(reserved?.status, 201, await reserved?.clone().text());
    const started = await handleApi(serviceRequest(`/api/dispatches/${intentId}/commands`, { command: "START_SEND" }), { DB: db, ...dispatchEnv });
    assert.equal(started?.status, 201, await started?.text());
    const uncertain = await handleApi(serviceRequest(`/api/dispatches/${intentId}/commands`, { command: "MARK_DELIVERY_UNKNOWN", reason_code: "RELAY_RESPONSE_LOST" }), { DB: db, ...dispatchEnv });
    assert.equal(uncertain?.status, 201, await uncertain?.clone().text());
    assert.equal((await uncertain?.json() as { projection: { state: string } }).projection.state, "RECONCILIATION_REQUIRED");

    const attempt = Number(db.sqlite.prepare("SELECT attempt_number FROM dispatch_outbox WHERE intent_id = ?").get(intentId)!.attempt_number);
    const relayContent = JSON.stringify({ schema: "steer-dispatch-delivery/v1", dispatch_intent_id: intentId, attempt_number: attempt, channel_id: receipt.canonical_channel_id, payload_sha256: receipt.authorized_handoff_sha256 });
    const relayUnsigned = { pubkey: relayPublicKey, created_at: Math.floor(Date.now() / 1000), kind: 9, tags: [["h", String(receipt.canonical_channel_id)], ["p", agentPublicKey]], content: relayContent };
    const relayId = await sha256Hex(JSON.stringify([0, relayUnsigned.pubkey, relayUnsigned.created_at, relayUnsigned.kind, relayUnsigned.tags, relayUnsigned.content]));
    const relayEvent = { ...relayUnsigned, id: relayId, sig: hex(schnorr.sign(Uint8Array.from(relayId.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16))), relaySecret)) };
    const recovered = await handleApi(serviceRequest(`/api/dispatches/${intentId}/commands`, { command: "CONFIRM_DELIVERY", relay_event: relayEvent }), { DB: db, ...dispatchEnv });
    assert.equal(recovered?.status, 201, await recovered?.clone().text());
    assert.equal((await recovered?.json() as { projection: { state: string } }).projection.state, "DELIVERED");
    const eventCount = Number(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE intent_id = ?").get(intentId)!.total);
    const staleReconciliation = await handleApi(serviceRequest(`/api/dispatches/${intentId}/commands`, { command: "CONFIRM_DELIVERY", relay_event: relayEvent }), { DB: db, ...dispatchEnv });
    assert.equal(staleReconciliation?.status, 200, await staleReconciliation?.clone().text());
    assert.equal((await staleReconciliation?.json() as { idempotent_replay: boolean }).idempotent_replay, true);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE intent_id = ?").get(intentId)!.total, eventCount);
    const noRetry = await handleApi(serviceRequest("/api/dispatches/next", {}), { DB: db, ...dispatchEnv });
    assert.equal(noRetry?.status, 204);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_attempts WHERE intent_id = ?").get(intentId)!.total, 1);

    const acknowledgedAt = new Date().toISOString();
    const acknowledgementPayload = {
      schema: "steer-dispatch-ack/v1", dispatch_intent_id: intentId,
      authorization_revision: receipt.authorization_revision, evidence_sha256: receipt.evidence_sha256,
      canonical_channel_id: receipt.canonical_channel_id, delivered_event_id: relayId,
      agent_claim_run_id: "claim-run-rec-03", acknowledged_at: acknowledgedAt,
    };
    const acknowledgement = { member_id: "agent-a", key_id: "agent-a-key", key_version: 1, ...acknowledgementPayload, signature: await signBinding(acknowledgementPayload, agentSecret) };
    const accepted = await handleApi(request("agent-a", `/api/dispatches/${intentId}/acknowledgements`, "POST", acknowledgement), { DB: db, ...dispatchEnv });
    assert.equal(accepted?.status, 201, await accepted?.text());
    assert.equal(db.sqlite.prepare("SELECT current_state FROM dispatch_outbox WHERE intent_id = ?").get(intentId)!.current_state, "ACKNOWLEDGED");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("REC-04 route invalidation fences the old intent and explicit reauthorization creates one same-lineage successor", async () => {
  const { db, itemId } = await setup();
  const revision = "d".repeat(40);
  const acceptedAt = new Date().toISOString();
  const currentForecast = { ...forecast, acceptedAt, updatedAt: acceptedAt, earliestCompletion: "2026-08-20T14:00:00.000Z", likelyCompletion: "2026-08-20T18:00:00.000Z", latestCompletion: "2026-08-21T18:00:00.000Z", nextMilestoneAt: "2026-08-19T16:00:00.000Z", phaseExitAt: "2026-08-20T18:00:00.000Z" };
  const relaySecret = new Uint8Array(32); relaySecret[31] = 17;
  const relayPublicKey = hex(schnorr.getPublicKey(relaySecret));
  db.sqlite.prepare(`UPDATE members SET agent_key_id = 'agent-a-key', agent_key_version = 1,
    agent_public_key = ?, agent_public_key_fingerprint = ? WHERE id = 'agent-a'`).run("e".repeat(64), "a".repeat(64));
  db.sqlite.prepare(`INSERT INTO workspace_routing
    (pod_id, route_key, configuration_version, channel_id, channel_name, relay_url, changed_by, change_reason, created_at)
    VALUES ('pod-a', 'workspace.routing.steer_agent_handoff.channel_id', 1, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://relay.example', 'member-a', 'Initial route', ?)`)
    .run(acceptedAt);
  db.sqlite.prepare(`INSERT INTO agent_channel_memberships
    (pod_id, channel_id, member_id, membership_version, status, created_at)
    VALUES ('pod-a', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'agent-a', 1, 'active', ?)`)
    .run(acceptedAt);
  db.sqlite.prepare(`INSERT INTO relay_event_signers
    (pod_id, registry_version, relay_url, channel_id, key_id, key_version, public_key, valid_from, valid_until, status, changed_by, change_reason, created_at)
    VALUES ('pod-a', 1, 'https://relay.example', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'relay-test', 1, ?, ?, NULL, 'ACTIVE', 'member-a', 'Test fixture', ?)`)
    .run(relayPublicKey, acceptedAt, acceptedAt);
  db.sqlite.prepare("UPDATE work_items SET evidence_url = ?, delivery_forecast_json = ? WHERE id = ?")
    .run(`https://github.com/idrissenayat/federal-bd-platform/blob/${revision}/steer/exams/0028.md`, JSON.stringify(currentForecast), itemId);
  db.sqlite.prepare(`INSERT INTO work_economics_events
    (item_id, section, action, actor_id, actor_role, previous_json, replacement_json, reason, created_at)
    VALUES (?, 'deliveryForecast', 'accepted', 'member-a', 'Delivery owner', NULL, ?, 'Test accepted forecast audit', ?)`)
    .run(itemId, JSON.stringify(currentForecast), acceptedAt);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => String(input).includes("0028-dispatch-data-inventory.md")
    ? new Response(privacyInventory, { status: 200 })
    : String(input).includes("raw.githubusercontent.com") ? new Response("# exact approved exam\n", { status: 200 })
    : originalFetch(input);
  try {
    const first = await handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv });
    assert.equal(first?.status, 200, await first?.text());
    const originalReceiptRow = db.sqlite.prepare("SELECT intent_id, lineage_id, receipt_json FROM dispatch_receipts").get()!;
    const originalIntent = String(originalReceiptRow.intent_id);
    const originalLineage = String(originalReceiptRow.lineage_id);

    const reserved = await handleApi(serviceRequest("/api/dispatches/next", {}), { DB: db, ...dispatchEnv });
    assert.equal(reserved?.status, 201, await reserved?.clone().text());
    assert.equal((await reserved?.json() as { dispatch_intent_id: string }).dispatch_intent_id, originalIntent);
    const replayWhileReserved = await handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv });
    assert.equal(replayWhileReserved?.status, 200, await replayWhileReserved?.clone().text());
    assert.equal((await replayWhileReserved?.json() as { idempotent_replay: boolean }).idempotent_replay, true);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_receipts").get()!.total, 1);
    db.sqlite.prepare(`INSERT INTO workspace_routing
      (pod_id, route_key, configuration_version, channel_id, channel_name, relay_url, changed_by, change_reason, created_at)
      VALUES ('pod-a', 'workspace.routing.steer_agent_handoff.channel_id', 2, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://relay.example', 'member-a', 'Audited route v2', ?)`)
      .run(new Date().toISOString());

    const staleStart = await handleApi(serviceRequest(`/api/dispatches/${originalIntent}/commands`, { command: "START_SEND" }), { DB: db, ...dispatchEnv });
    assert.equal(staleStart?.status, 409, await staleStart?.clone().text());
    assert.equal((await staleStart?.json() as { code: string }).code, "ROUTING_VERSION_STALE");
    const fenced = db.sqlite.prepare(`SELECT current_state, terminalization_requested, lease_id, reservation_fence, send_started
      FROM dispatch_outbox WHERE intent_id = ?`).get(originalIntent)!;
    assert.deepEqual({ ...fenced }, { current_state: "QUEUED", terminalization_requested: 1, lease_id: null, reservation_fence: null, send_started: 0 });
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE intent_id = ? AND event_type = 'TERMINALIZATION_REQUESTED'").get(originalIntent)!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE intent_id = ? AND event_type = 'DELIVERY_BLOCKED_CONFIG_STALE'").get(originalIntent)!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE intent_id = ? AND event_type = 'SEND_ATTEMPT_STARTED'").get(originalIntent)!.total, 0);
    assert.equal(db.sqlite.prepare("SELECT status FROM dispatch_attempts WHERE intent_id = ?").get(originalIntent)!.status, "FENCED_CONFIG_STALE");
    const noImplicitRetry = await handleApi(serviceRequest("/api/dispatches/next", {}), { DB: db, ...dispatchEnv });
    assert.equal(noImplicitRetry?.status, 204);

    const reauthorized = await handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv });
    assert.equal(reauthorized?.status, 200, await reauthorized?.text());
    const receipts = db.sqlite.prepare("SELECT intent_id, lineage_id, receipt_json FROM dispatch_receipts ORDER BY rowid").all() as Array<Record<string, unknown>>;
    assert.equal(receipts.length, 2);
    const successorIntent = String(receipts[1].intent_id);
    assert.notEqual(successorIntent, originalIntent);
    assert.equal(receipts[1].lineage_id, originalLineage);
    const successorReceipt = JSON.parse(String(receipts[1].receipt_json)) as Record<string, unknown>;
    assert.equal(successorReceipt.predecessor_intent_id, originalIntent);
    assert.equal(db.sqlite.prepare("SELECT current_state FROM dispatch_outbox WHERE intent_id = ?").get(originalIntent)!.current_state, "SUPERSEDED");
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE intent_id = ? AND event_type = 'SUPERSEDED'").get(originalIntent)!.total, 1);
    const replacementEvent = JSON.parse(String(db.sqlite.prepare("SELECT payload_json FROM dispatch_events WHERE intent_id = ? AND event_type = 'SUPERSEDED'").get(originalIntent)!.payload_json));
    assert.equal(replacementEvent.payload.payload.successor_intent_id, successorIntent);

    const successorReservation = await handleApi(serviceRequest("/api/dispatches/next", {}), { DB: db, ...dispatchEnv });
    assert.equal(successorReservation?.status, 201, await successorReservation?.clone().text());
    assert.equal((await successorReservation?.json() as { dispatch_intent_id: string }).dispatch_intent_id, successorIntent);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_attempts WHERE intent_id = ?").get(originalIntent)!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_attempts WHERE intent_id = ?").get(successorIntent)!.total, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("REC-04 permits one same-lineage successor for every remaining frozen binding branch", async () => {
  const cases: Array<{
    id: string;
    code: string;
    mutate(db: D1Database): void;
    repair(db: D1Database): void;
  }> = [
    {
      id: "R04-B", code: "CHANNEL_BINDING_STALE",
      mutate: (db) => { db.sqlite.prepare(`INSERT INTO workspace_routing
        (pod_id, route_key, configuration_version, channel_id, channel_name, relay_url, changed_by, change_reason, created_at)
        VALUES ('pod-a', 'workspace.routing.steer_agent_handoff.channel_id', 2, 'wrong-channel-id', '#wrong-channel', 'https://relay.example', 'member-a', 'Frozen R04-B', ?)`).run(new Date().toISOString()); },
      repair: (db) => { db.sqlite.prepare(`INSERT INTO workspace_routing
        (pod_id, route_key, configuration_version, channel_id, channel_name, relay_url, changed_by, change_reason, created_at)
        VALUES ('pod-a', 'workspace.routing.steer_agent_handoff.channel_id', 3, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://relay.example', 'member-a', 'Repair R04-B', ?)`).run(new Date().toISOString()); },
    },
    {
      id: "R04-C", code: "RELAY_BINDING_STALE",
      mutate: (db) => {
        db.sqlite.prepare(`INSERT INTO workspace_routing
          (pod_id, route_key, configuration_version, channel_id, channel_name, relay_url, changed_by, change_reason, created_at)
          VALUES ('pod-a', 'workspace.routing.steer_agent_handoff.channel_id', 2, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://other-relay.example', 'member-a', 'Frozen R04-C', ?)`).run(new Date().toISOString());
        db.sqlite.prepare(`INSERT INTO buzz_channel_registry
          (pod_id, registry_version, channel_id, channel_name, relay_url, status, changed_by, change_reason, created_at)
          VALUES ('pod-a', 2, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://other-relay.example', 'ACTIVE', 'member-a', 'Frozen R04-C', ?)`).run(new Date().toISOString());
      },
      repair: (db) => {
        db.sqlite.prepare(`INSERT INTO workspace_routing
          (pod_id, route_key, configuration_version, channel_id, channel_name, relay_url, changed_by, change_reason, created_at)
          VALUES ('pod-a', 'workspace.routing.steer_agent_handoff.channel_id', 3, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://relay.example', 'member-a', 'Repair R04-C', ?)`).run(new Date().toISOString());
        db.sqlite.prepare(`INSERT INTO buzz_channel_registry
          (pod_id, registry_version, channel_id, channel_name, relay_url, status, changed_by, change_reason, created_at)
          VALUES ('pod-a', 3, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://relay.example', 'ACTIVE', 'member-a', 'Repair R04-C', ?)`).run(new Date().toISOString());
      },
    },
    {
      id: "R04-D", code: "ROUTE_CONFIG_MISSING",
      mutate: (db) => { db.sqlite.prepare("DELETE FROM workspace_routing WHERE pod_id = 'pod-a'").run(); },
      repair: (db) => { db.sqlite.prepare(`INSERT INTO workspace_routing
        (pod_id, route_key, configuration_version, channel_id, channel_name, relay_url, changed_by, change_reason, created_at)
        VALUES ('pod-a', 'workspace.routing.steer_agent_handoff.channel_id', 2, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://relay.example', 'member-a', 'Repair R04-D', ?)`).run(new Date().toISOString()); },
    },
    {
      id: "R04-E", code: "MEMBERSHIP_STALE",
      mutate: (db) => { db.sqlite.prepare(`INSERT INTO agent_channel_memberships
        (pod_id, channel_id, member_id, membership_version, status, created_at)
        VALUES ('pod-a', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'agent-a', 2, 'removed', ?)`).run(new Date().toISOString()); },
      repair: (db) => { db.sqlite.prepare(`INSERT INTO agent_channel_memberships
        (pod_id, channel_id, member_id, membership_version, status, created_at)
        VALUES ('pod-a', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'agent-a', 3, 'active', ?)`).run(new Date().toISOString()); },
    },
    {
      id: "R04-F", code: "RELAY_PUBLISHER_UNTRUSTED",
      mutate: (db) => { db.sqlite.prepare(`INSERT INTO relay_event_signers
        (pod_id, registry_version, relay_url, channel_id, key_id, key_version, public_key, valid_from, valid_until, status, changed_by, change_reason, created_at)
        VALUES ('pod-a', 2, 'https://relay.example', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'relay-test', 2, ?, ?, NULL, 'REVOKED', 'member-a', 'Frozen R04-F', ?)`)
        .run("c".repeat(64), new Date().toISOString(), new Date().toISOString()); },
      repair: (db) => { db.sqlite.prepare(`INSERT INTO relay_event_signers
        (pod_id, registry_version, relay_url, channel_id, key_id, key_version, public_key, valid_from, valid_until, status, changed_by, change_reason, created_at)
        VALUES ('pod-a', 3, 'https://relay.example', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'relay-test', 3, ?, ?, NULL, 'ACTIVE', 'member-a', 'Repair R04-F', ?)`)
        .run("d".repeat(64), new Date().toISOString(), new Date().toISOString()); },
    },
  ];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => String(input).includes("0028-dispatch-data-inventory.md")
    ? new Response(privacyInventory, { status: 200 })
    : String(input).includes("raw.githubusercontent.com") ? new Response("# exact approved exam\n", { status: 200 })
    : originalFetch(input);
  try {
    for (const frozen of cases) {
      const { db, itemId } = await setup();
      const acceptedAt = prepareDispatchAuthorizationSeed(db, itemId);
      db.sqlite.prepare(`INSERT INTO relay_event_signers
        (pod_id, registry_version, relay_url, channel_id, key_id, key_version, public_key, valid_from, valid_until, status, changed_by, change_reason, created_at)
        VALUES ('pod-a', 1, 'https://relay.example', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'relay-test', 1, ?, ?, NULL, 'ACTIVE', 'member-a', 'Test fixture', ?)`)
        .run("d".repeat(64), acceptedAt, acceptedAt);
      const authorized = await handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv });
      assert.equal(authorized?.status, 200, `${frozen.id}: ${await authorized?.text()}`);
      const original = db.sqlite.prepare("SELECT intent_id, lineage_id FROM dispatch_receipts").get()!;
      const originalIntent = String(original.intent_id);
      const reserved = await handleApi(serviceRequest("/api/dispatches/next", {}), { DB: db, ...dispatchEnv });
      assert.equal(reserved?.status, 201, `${frozen.id}: ${await reserved?.clone().text()}`);
      frozen.mutate(db);
      const blocked = await handleApi(serviceRequest(`/api/dispatches/${originalIntent}/commands`, { command: "START_SEND" }), { DB: db, ...dispatchEnv });
      assert.equal(blocked?.status, 409, `${frozen.id}: ${await blocked?.clone().text()}`);
      assert.equal((await blocked?.json() as { code: string }).code, frozen.code, frozen.id);
      const noImplicitRetry = await handleApi(serviceRequest("/api/dispatches/next", {}), { DB: db, ...dispatchEnv });
      assert.equal(noImplicitRetry?.status, 204, frozen.id);
      frozen.repair(db);
      const reauthorized = await handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv });
      assert.equal(reauthorized?.status, 200, `${frozen.id}: ${await reauthorized?.text()}`);
      const receipts = db.sqlite.prepare("SELECT intent_id, lineage_id, receipt_json FROM dispatch_receipts ORDER BY rowid").all() as Array<Record<string, unknown>>;
      assert.equal(receipts.length, 2, frozen.id);
      assert.equal(receipts[1].lineage_id, original.lineage_id, frozen.id);
      assert.equal((JSON.parse(String(receipts[1].receipt_json)) as Record<string, unknown>).predecessor_intent_id, originalIntent, frozen.id);
      assert.equal(db.sqlite.prepare("SELECT current_state FROM dispatch_outbox WHERE intent_id = ?").get(originalIntent)!.current_state, "SUPERSEDED", frozen.id);
      const successor = await handleApi(serviceRequest("/api/dispatches/next", {}), { DB: db, ...dispatchEnv });
      assert.equal(successor?.status, 201, `${frozen.id}: ${await successor?.clone().text()}`);
      assert.equal((await successor?.json() as { dispatch_intent_id: string }).dispatch_intent_id, receipts[1].intent_id, frozen.id);
      assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_outbox WHERE current_state = 'QUEUED'").get()!.total, 1, frozen.id);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("changed authorization objective closes the old unsent intent and starts a new lineage", async () => {
  const { db, itemId } = await setup();
  const revision = "f".repeat(40);
  const acceptedAt = new Date().toISOString();
  const currentForecast = { ...forecast, acceptedAt, updatedAt: acceptedAt, earliestCompletion: "2026-08-20T14:00:00.000Z", likelyCompletion: "2026-08-20T18:00:00.000Z", latestCompletion: "2026-08-21T18:00:00.000Z", nextMilestoneAt: "2026-08-19T16:00:00.000Z", phaseExitAt: "2026-08-20T18:00:00.000Z" };
  db.sqlite.prepare(`UPDATE members SET agent_key_id = 'agent-a-key', agent_key_version = 1,
    agent_public_key = ?, agent_public_key_fingerprint = ? WHERE id = 'agent-a'`).run("e".repeat(64), "a".repeat(64));
  db.sqlite.prepare(`INSERT INTO workspace_routing
    (pod_id, route_key, configuration_version, channel_id, channel_name, relay_url, changed_by, change_reason, created_at)
    VALUES ('pod-a', 'workspace.routing.steer_agent_handoff.channel_id', 1, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://relay.example', 'member-a', 'Test fixture', ?)`)
    .run(acceptedAt);
  db.sqlite.prepare(`INSERT INTO agent_channel_memberships
    (pod_id, channel_id, member_id, membership_version, status, created_at)
    VALUES ('pod-a', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'agent-a', 1, 'active', ?)`)
    .run(acceptedAt);
  db.sqlite.prepare("UPDATE work_items SET evidence_url = ?, delivery_forecast_json = ? WHERE id = ?")
    .run(`https://github.com/idrissenayat/federal-bd-platform/blob/${revision}/steer/exams/0028.md`, JSON.stringify(currentForecast), itemId);
  db.sqlite.prepare(`INSERT INTO work_economics_events
    (item_id, section, action, actor_id, actor_role, previous_json, replacement_json, reason, created_at)
    VALUES (?, 'deliveryForecast', 'accepted', 'member-a', 'Delivery owner', NULL, ?, 'Test accepted forecast audit', ?)`)
    .run(itemId, JSON.stringify(currentForecast), acceptedAt);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => String(input).includes("0028-dispatch-data-inventory.md")
    ? new Response(privacyInventory, { status: 200 })
    : String(input).includes("raw.githubusercontent.com") ? new Response("# exact approved exam\n", { status: 200 })
    : originalFetch(input);
  try {
    const first = await handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv });
    assert.equal(first?.status, 200, await first?.text());
    const original = db.sqlite.prepare("SELECT intent_id, lineage_id FROM dispatch_receipts").get()!;
    db.sqlite.prepare("UPDATE work_items SET next_action = ?, updated_at = ? WHERE id = ?")
      .run("Run the newly authorized replacement objective.", new Date(Date.now() + 1000).toISOString(), itemId);
    const replacement = await handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv });
    assert.equal(replacement?.status, 200, await replacement?.text());
    const latest = db.sqlite.prepare("SELECT intent_id, lineage_id FROM dispatch_receipts ORDER BY rowid DESC LIMIT 1").get()!;
    assert.notEqual(latest.intent_id, original.intent_id);
    assert.notEqual(latest.lineage_id, original.lineage_id);
    assert.equal(db.sqlite.prepare("SELECT current_state FROM dispatch_outbox WHERE intent_id = ?").get(original.intent_id)!.current_state, "CANCELLED");
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE intent_id = ? AND event_type = 'CANCELLED'").get(original.intent_id)!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_outbox WHERE current_state = 'QUEUED'").get()!.total, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("service fencing, verified relay delivery, signed agent acknowledgement, and agent read form one idempotent lineage", async () => {
  const { db, itemId } = await setup();
  const revision = "c".repeat(40);
  const acceptedAt = new Date().toISOString();
  const currentForecast = { ...forecast, acceptedAt, updatedAt: acceptedAt, earliestCompletion: "2026-08-20T14:00:00.000Z", likelyCompletion: "2026-08-20T18:00:00.000Z", latestCompletion: "2026-08-21T18:00:00.000Z", nextMilestoneAt: "2026-08-19T16:00:00.000Z", phaseExitAt: "2026-08-20T18:00:00.000Z" };
  const agentSecret = new Uint8Array(32); agentSecret[31] = 11;
  const relaySecret = new Uint8Array(32); relaySecret[31] = 13;
  const agentPublicKey = hex(schnorr.getPublicKey(agentSecret));
  const relayPublicKey = hex(schnorr.getPublicKey(relaySecret));
  db.sqlite.prepare(`UPDATE members SET agent_key_id = 'agent-a-key', agent_key_version = 1,
    agent_public_key = ?, agent_public_key_fingerprint = ? WHERE id = 'agent-a'`).run(agentPublicKey, "a".repeat(64));
  db.sqlite.prepare(`INSERT INTO workspace_routing
    (pod_id, route_key, configuration_version, channel_id, channel_name, relay_url, changed_by, change_reason, created_at)
    VALUES ('pod-a', 'workspace.routing.steer_agent_handoff.channel_id', 1, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://relay.example', 'member-a', 'Test fixture', ?)`)
    .run(acceptedAt);
  db.sqlite.prepare(`INSERT INTO agent_channel_memberships
    (pod_id, channel_id, member_id, membership_version, status, created_at)
    VALUES ('pod-a', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'agent-a', 1, 'active', ?)`)
    .run(acceptedAt);
  db.sqlite.prepare(`INSERT INTO relay_event_signers
    (pod_id, registry_version, relay_url, channel_id, key_id, key_version, public_key, valid_from, valid_until, status, changed_by, change_reason, created_at)
    VALUES ('pod-a', 1, 'https://relay.example', '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', 'relay-test', 1, ?, ?, NULL, 'ACTIVE', 'member-a', 'Test fixture', ?)`)
    .run(relayPublicKey, acceptedAt, acceptedAt);
  db.sqlite.prepare("UPDATE work_items SET evidence_url = ?, delivery_forecast_json = ? WHERE id = ?")
    .run(`https://github.com/idrissenayat/federal-bd-platform/blob/${revision}/steer/exams/0028.md`, JSON.stringify(currentForecast), itemId);
  db.sqlite.prepare(`INSERT INTO work_economics_events
    (item_id, section, action, actor_id, actor_role, previous_json, replacement_json, reason, created_at)
    VALUES (?, 'deliveryForecast', 'accepted', 'member-a', 'Delivery owner', NULL, ?, 'Test accepted forecast audit', ?)`)
    .run(itemId, JSON.stringify(currentForecast), acceptedAt);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => String(input).includes("0028-dispatch-data-inventory.md")
    ? new Response(privacyInventory, { status: 200 })
    : String(input).includes("raw.githubusercontent.com") ? new Response("# exact approved exam\n", { status: 200 })
    : originalFetch(input);
  try {
    const authorized = await handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv });
    assert.equal(authorized?.status, 200, await authorized?.text());
    const intentId = String(db.sqlite.prepare("SELECT intent_id FROM dispatch_receipts").get()!.intent_id);
    const receipt = JSON.parse(String(db.sqlite.prepare("SELECT receipt_json FROM dispatch_receipts").get()!.receipt_json));

    const reserved = await handleApi(serviceRequest("/api/dispatches/next", {}), { DB: db, ...dispatchEnv });
    assert.equal(reserved?.status, 201, await reserved?.clone().text());
    const reservationBody = await reserved?.json() as { dispatch_intent_id: string; transport_content: string };
    assert.equal(reservationBody.dispatch_intent_id, intentId);
    assert.equal(JSON.parse(reservationBody.transport_content).payload_sha256, receipt.authorized_handoff_sha256);
    const started = await handleApi(serviceRequest(`/api/dispatches/${intentId}/commands`, { command: "START_SEND" }), { DB: db, ...dispatchEnv });
    assert.equal(started?.status, 201, await started?.text());
    const attempt = Number(db.sqlite.prepare("SELECT attempt_number FROM dispatch_outbox").get()!.attempt_number);
    const relayContent = JSON.stringify({ schema: "steer-dispatch-delivery/v1", dispatch_intent_id: intentId, attempt_number: attempt, channel_id: receipt.canonical_channel_id, payload_sha256: receipt.authorized_handoff_sha256 });
    const relayUnsigned = { pubkey: relayPublicKey, created_at: Math.floor(Date.now() / 1000), kind: 9, tags: [["h", receipt.canonical_channel_id], ["p", agentPublicKey]], content: relayContent };
    const relayId = await sha256Hex(JSON.stringify([0, relayUnsigned.pubkey, relayUnsigned.created_at, relayUnsigned.kind, relayUnsigned.tags, relayUnsigned.content]));
    const relayEvent = { ...relayUnsigned, id: relayId, sig: hex(schnorr.sign(Uint8Array.from(relayId.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16))), relaySecret)) };
    const delivered = await handleApi(serviceRequest(`/api/dispatches/${intentId}/commands`, { command: "CONFIRM_DELIVERY", relay_event: relayEvent }), { DB: db, ...dispatchEnv });
    assert.equal(delivered?.status, 201, await delivered?.text());

    const acknowledgedAt = new Date().toISOString();
    const acknowledgementPayload = {
      schema: "steer-dispatch-ack/v1", dispatch_intent_id: intentId,
      authorization_revision: receipt.authorization_revision, evidence_sha256: receipt.evidence_sha256,
      canonical_channel_id: receipt.canonical_channel_id, delivered_event_id: relayId,
      agent_claim_run_id: "claim-run-900", acknowledged_at: acknowledgedAt,
    };
    const acknowledgement = { member_id: "agent-a", key_id: "agent-a-key", key_version: 1, ...acknowledgementPayload, signature: await signBinding(acknowledgementPayload, agentSecret) };
    const wrongSecret = new Uint8Array(32); wrongSecret[31] = 29;
    const wrongKey = await handleApi(request("agent-a", `/api/dispatches/${intentId}/acknowledgements`, "POST", {
      ...acknowledgement,
      signature: await signBinding(acknowledgementPayload, wrongSecret),
    }), { DB: db, ...dispatchEnv });
    assert.equal(wrongKey?.status, 409, await wrongKey?.clone().text());
    assert.equal((await wrongKey?.json() as { code: string }).code, "ACK_SIGNATURE_INVALID");
    const acknowledgementResponses = await Promise.all([
      handleApi(request("agent-a", `/api/dispatches/${intentId}/acknowledgements`, "POST", acknowledgement), { DB: db, ...dispatchEnv }),
      handleApi(request("agent-a", `/api/dispatches/${intentId}/acknowledgements`, "POST", acknowledgement), { DB: db, ...dispatchEnv }),
    ]);
    assert.deepEqual(acknowledgementResponses.map((response) => response?.status).sort(), [200, 201], JSON.stringify(await Promise.all(acknowledgementResponses.map((response) => response?.clone().text()))));
    const acknowledgementBodies = await Promise.all(acknowledgementResponses.map((response) => response?.json() as Promise<{ idempotent_replay: boolean }>));
    assert.deepEqual(acknowledgementBodies.map((body) => body.idempotent_replay).sort(), [false, true]);

    const changedPayload = { ...acknowledgementPayload, agent_claim_run_id: "different-run-900", acknowledged_at: new Date().toISOString() };
    const changedAcknowledgement = { member_id: "agent-a", key_id: "agent-a-key", key_version: 1, ...changedPayload, signature: await signBinding(changedPayload, agentSecret) };
    const secondDifferent = await handleApi(request("agent-a", `/api/dispatches/${intentId}/acknowledgements`, "POST", changedAcknowledgement), { DB: db, ...dispatchEnv });
    assert.equal(secondDifferent?.status, 409, await secondDifferent?.clone().text());

    const authorizationReplay = await handleApi(request("member-a", `/api/items/${itemId}/dispatch`, "POST"), { DB: db, ...dispatchEnv });
    assert.equal(authorizationReplay?.status, 200, await authorizationReplay?.clone().text());
    assert.equal((await authorizationReplay?.json() as { idempotent_replay: boolean }).idempotent_replay, true);

    const requestedAt = new Date().toISOString();
    const readPayload = { schema: "steer-dispatch-read/v1", method: "POST", path: `/api/dispatches/${intentId}/read`, dispatch_intent_id: intentId, requested_at: requestedAt };
    const read = await handleApi(request("agent-a", `/api/dispatches/${intentId}/read`, "POST", { member_id: "agent-a", key_id: "agent-a-key", key_version: 1, requested_at: requestedAt, signature: await signBinding(readPayload, agentSecret) }), { DB: db, ...dispatchEnv });
    assert.equal(read?.status, 200, await read?.clone().text());
    const readBody = await read?.json() as { events: unknown[]; projection: { state: string } };
    assert.equal(readBody.projection.state, "ACKNOWLEDGED");
    assert.equal(readBody.events.length, 7);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_receipts").get()!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_outbox").get()!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_attempts").get()!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE event_type = 'ACKNOWLEDGED'").get()!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE event_type = 'ACK_REJECTED'").get()!.total, 2);

    db.sqlite.prepare("UPDATE dispatch_outbox SET updated_at = '2026-01-01T00:00:00.000Z'").run();
    const hold = await handleApi(request("member-a", `/api/dispatches/${intentId}/retention-holds`, "POST", { action: "HOLD", reason_code: "SECURITY_REVIEW", expires_at: new Date(Date.now() + 86_400_000).toISOString() }), { DB: db, ...dispatchEnv });
    assert.equal(hold?.status, 201, await hold?.text());
    const heldRun = await handleApi(serviceRequest("/api/dispatch-retention/run", {}), { DB: db, ...dispatchEnv });
    assert.equal(heldRun?.status, 200, await heldRun?.clone().text());
    assert.equal((await heldRun?.json() as { deleted_count: number }).deleted_count, 0);
    const release = await handleApi(request("member-a", `/api/dispatches/${intentId}/retention-holds`, "POST", { action: "RELEASE", reason_code: "SECURITY_REVIEW_COMPLETE" }), { DB: db, ...dispatchEnv });
    assert.equal(release?.status, 201, await release?.text());
    const deletion = await handleApi(serviceRequest("/api/dispatch-retention/run", {}), { DB: db, ...dispatchEnv });
    assert.equal(deletion?.status, 200, await deletion?.clone().text());
    assert.equal((await deletion?.json() as { deleted_count: number }).deleted_count, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_receipts").get()!.total, 0);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events").get()!.total, 0);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_authorization_audits").get()!.total, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Critic review requires exact target assignment, signed acknowledgement, and one signed result", async () => {
  const { db, itemId } = await setup();
  const criticSecret = new Uint8Array(32); criticSecret[31] = 17;
  const criticPublicKey = hex(schnorr.getPublicKey(criticSecret));
  db.sqlite.prepare(`UPDATE members SET pod_id = 'pod-a', agent_key_id = 'critic-key',
    agent_key_version = 1, agent_public_key = ?, agent_public_key_fingerprint = ?
    WHERE id = 'agent-critic'`).run(criticPublicKey, "c".repeat(64));
  const target = await reviewTarget();

  const created = await handleApi(request("member-a", `/api/items/${itemId}/reviews`, "POST", { stage: "GATE_3_BUILD", target, prior_binding_digests: ["d".repeat(64)] }), { DB: db, ...dispatchEnv });
  assert.equal(created?.status, 201, await created?.clone().text());
  const createdBody = await created?.json() as { assignment: { review_assignment_id: string }; request_event_sha256: string };
  const assignmentId = createdBody.assignment.review_assignment_id;
  assert.match(assignmentId, /^[0-9a-f]{64}$/);
  assert.deepEqual(db.sqlite.prepare("SELECT event_type FROM review_events WHERE assignment_id = ? ORDER BY event_version").all(assignmentId).map((row) => row.event_type), ["REVIEW_TARGET_READY", "REVIEW_ASSIGNED", "REVIEW_REQUESTED"]);

  const replay = await handleApi(request("member-a", `/api/items/${itemId}/reviews`, "POST", { stage: "GATE_3_BUILD", target, prior_binding_digests: ["d".repeat(64)] }), { DB: db, ...dispatchEnv });
  assert.equal(replay?.status, 200, await replay?.clone().text());
  assert.equal((await replay?.json() as { idempotent_replay: boolean }).idempotent_replay, true);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM review_events WHERE assignment_id = ?").get(assignmentId)!.total, 3);

  const result = {
    recommendation: "Ready for human Gate 3 review", confidence: "High",
    summary: "The exact build target satisfies the signed Exam within the reviewed scope.",
    findings: [], dependencies: ["Human Gate 3 remains required."], impacts: ["No production authority granted."],
    actions: ["Present the exact evidence to the named human authorities."], derived_tags: ["#security", "#privacy"],
    evidence_scope: "Exact immutable Gate 3 build target and fixed acceptance ledger.", completed_at: "2026-08-18T16:02:00.000Z",
  };
  const prematureResultPayload = { schema: "steer-review-result/v1", review_assignment_id: assignmentId, target_artifact_manifest_sha256: target.target_artifact_manifest_sha256, predecessor_event_sha256: "0".repeat(64), result_sha256: await sha256Hex(canonicalJson(result)), result };
  const premature = await handleApi(reviewAgentRequest(`/api/review-assignments/${assignmentId}/results`, { result, key_id: "critic-key", key_version: 1, signature: await signBinding(prematureResultPayload, criticSecret) }), { DB: db, ...dispatchEnv });
  assert.equal(premature?.status, 409, await premature?.clone().text());

  const acknowledgedAt = "2026-08-18T16:01:00.000Z";
  const acknowledgementPayload = { schema: "steer-review-acknowledgement/v1", review_assignment_id: assignmentId, target_artifact_manifest_sha256: target.target_artifact_manifest_sha256, source_request_event_sha256: createdBody.request_event_sha256, predecessor_event_sha256: createdBody.request_event_sha256, acknowledged_at: acknowledgedAt };
  const wrongKey = await handleApi(reviewAgentRequest(`/api/review-assignments/${assignmentId}/acknowledgements`, { acknowledged_at: acknowledgedAt, key_id: "critic-key", key_version: 1, signature: await signBinding(acknowledgementPayload, new Uint8Array(32).fill(3)) }), { DB: db, ...dispatchEnv });
  assert.equal(wrongKey?.status, 409, await wrongKey?.clone().text());
  const acknowledgementSignature = await signBinding(acknowledgementPayload, criticSecret);
  const acknowledged = await handleApi(reviewAgentRequest(`/api/review-assignments/${assignmentId}/acknowledgements`, { acknowledged_at: acknowledgedAt, key_id: "critic-key", key_version: 1, signature: acknowledgementSignature }), { DB: db, ...dispatchEnv });
  assert.equal(acknowledged?.status, 201, await acknowledged?.clone().text());
  const acknowledgedBody = await acknowledged?.json() as { event: { payload: { event_sha256?: string } } };
  const acknowledgementEventSha256 = String(db.sqlite.prepare("SELECT event_sha256 FROM review_events WHERE assignment_id = ? AND event_type = 'REVIEW_ACKNOWLEDGED'").get(assignmentId)!.event_sha256);

  const resultPayload = { schema: "steer-review-result/v1", review_assignment_id: assignmentId, target_artifact_manifest_sha256: target.target_artifact_manifest_sha256, predecessor_event_sha256: acknowledgementEventSha256, result_sha256: await sha256Hex(canonicalJson(result)), result };
  const resultSignature = await signBinding(resultPayload, criticSecret);
  const recorded = await handleApi(reviewAgentRequest(`/api/review-assignments/${assignmentId}/results`, { result, key_id: "critic-key", key_version: 1, signature: resultSignature }), { DB: db, ...dispatchEnv });
  assert.equal(recorded?.status, 201, await recorded?.clone().text());
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM agent_reviews WHERE item_id = ? AND review_mode = 'signed_assignment_review'").get(itemId)!.total, 1);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM review_events WHERE assignment_id = ?").get(assignmentId)!.total, 5);

  const exactReplay = await handleApi(reviewAgentRequest(`/api/review-assignments/${assignmentId}/results`, { result, key_id: "critic-key", key_version: 1, signature: resultSignature }), { DB: db, ...dispatchEnv });
  assert.equal(exactReplay?.status, 200, await exactReplay?.clone().text());
  const changed = { ...result, summary: "A changed second result must be rejected." };
  const changedPayload = { ...resultPayload, result_sha256: await sha256Hex(canonicalJson(changed)), result: changed };
  const mismatch = await handleApi(reviewAgentRequest(`/api/review-assignments/${assignmentId}/results`, { result: changed, key_id: "critic-key", key_version: 1, signature: await signBinding(changedPayload, criticSecret) }), { DB: db, ...dispatchEnv });
  assert.equal(mismatch?.status, 409, await mismatch?.clone().text());
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM agent_reviews WHERE item_id = ?").get(itemId)!.total, 1);
  void acknowledgedBody;
});

test("review retention honors a scoped hold and deletes every linked live record after release", async () => {
  const { db, itemId } = await setup();
  const assignmentId = "e".repeat(64);
  const completedAt = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString();
  db.sqlite.prepare(`INSERT INTO review_assignments
    (assignment_id,idempotency_key,item_id,pod_id,review_stage,reviewer_member_id,primary_claim_lineage_id,item_revision,target_manifest_sha256,assignment_json,current_state,current_event_version,current_event_sha256,authorizing_actor_id,authorizing_event_id,created_at,terminal_at,delete_after)
    VALUES (?, ?, ?, 'pod-a', 'GATE_3_BUILD', 'agent-critic', ?, 'r1', ?, '{}', 'RESULT_RECORDED', 4, ?, 'member-a', ?, ?, ?, ?)`)
    .run(assignmentId, "1".repeat(64), itemId, "2".repeat(64), "3".repeat(64), "4".repeat(64), "5".repeat(64), completedAt, completedAt, completedAt);
  db.sqlite.prepare(`INSERT INTO review_events
    (assignment_id,event_version,expected_event_version,event_type,payload_json,previous_event_sha256,event_sha256,service_key_id,service_key_version,service_signature,actor_id,created_at)
    VALUES (?,4,3,'REVIEW_RESULT_RECORDED','{}',?,?,'review-service',1,?,'agent-critic',?)`)
    .run(assignmentId, "6".repeat(64), "7".repeat(64), "8".repeat(128), completedAt);
  db.sqlite.prepare(`INSERT INTO agent_reviews
    (item_id,agent_id,review_mode,recommendation,confidence,summary,findings_json,dependencies_json,impacts_json,actions_json,derived_tags_json,evidence_scope,reviewed_item_updated_at,requested_by,created_at,review_assignment_id)
    VALUES (?, 'agent-critic', 'signed_assignment_review', 'Ready', 'High', 'Synthetic retention fixture', '[]', '[]', '[]', '[]', '[]', 'Synthetic', 'r1', 'member-a', ?, ?)`).run(itemId, completedAt, assignmentId);
  db.sqlite.prepare("INSERT INTO activity (item_id,actor_id,action,detail,created_at,review_assignment_id) VALUES (?, 'agent-critic','agent_review','Synthetic',?,?)").run(itemId, completedAt, assignmentId);
  db.sqlite.prepare(`INSERT INTO notifications
    (dedupe_key,item_id,member_id,recipient_role,kind,title,body,channel,status,created_at,review_assignment_id)
    VALUES (?,?,'agent-critic','Independent Critic','review_assignment','Synthetic','Synthetic','review-assignment-store','queued',?,?)`).run(`review-${assignmentId}`, itemId, completedAt, assignmentId);

  const hold = await handleApi(request("member-a", `/api/review-assignments/${assignmentId}/retention-holds`, "POST", { action: "HOLD", reason_code: "SECURITY_REVIEW", expires_at: new Date(Date.now() + 86_400_000).toISOString() }), { DB: db, ...dispatchEnv });
  assert.equal(hold?.status, 201, await hold?.clone().text());
  const heldRun = await handleApi(reviewServiceRequest("/api/review-retention/run", {}), { DB: db, ...dispatchEnv });
  assert.equal(heldRun?.status, 200, await heldRun?.clone().text());
  assert.equal((await heldRun?.json() as { deleted_count: number }).deleted_count, 0);
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM review_assignments WHERE assignment_id = ?").get(assignmentId)!.total, 1);

  const release = await handleApi(request("member-a", `/api/review-assignments/${assignmentId}/retention-holds`, "POST", { action: "RELEASE", reason_code: "SECURITY_REVIEW_COMPLETE" }), { DB: db, ...dispatchEnv });
  assert.equal(release?.status, 201, await release?.clone().text());
  const deletion = await handleApi(reviewServiceRequest("/api/review-retention/run", {}), { DB: db, ...dispatchEnv });
  assert.equal(deletion?.status, 200, await deletion?.clone().text());
  assert.equal((await deletion?.json() as { deleted_count: number }).deleted_count, 1);
  for (const table of ["review_assignments", "review_events", "review_retention_holds", "agent_reviews", "activity", "notifications"]) {
    const column = ["review_assignments", "review_events", "review_retention_holds"].includes(table) ? "assignment_id" : "review_assignment_id";
    assert.equal(db.sqlite.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE ${column} = ?`).get(assignmentId)!.total, 0, table);
  }
  assert.equal(db.sqlite.prepare("SELECT deleted_count FROM review_retention_runs ORDER BY id DESC LIMIT 1").get()!.deleted_count, 1);
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
  const response = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", { expectedRevision: "2026-08-14T18:30:00.000Z", section: "actualEconomics", value: actual, reason: "Record authoritative actual delivery facts" }), { DB: db });
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

test("comparable service levels use explicit work type and never workflow treatment", async () => {
  const { db, itemId } = await setup();
  db.sqlite.prepare("UPDATE members SET role = 'Tech Lead' WHERE id = 'member-a'").run();
  db.sqlite.prepare("UPDATE work_items SET work_type = 'Platform capability' WHERE id = ?").run(itemId);
  const insert = db.sqlite.prepare(`INSERT INTO work_items
    (key,title,description,phase,priority,workflow,work_type,state,gate,decision_status,decision_authority,next_action,pod_id,actual_economics_json,created_by,created_at,updated_at)
    VALUES (?,?,?,?,?,'STEER','Product feature','complete','Gate 3 passed','Decided','Product Lead','Observe outcome','pod-a',?,'member-a','2026-08-14T14:00:00.000Z','2026-08-14T18:30:00.000Z')`);
  [60, 90, 120, 150, 180].forEach((minutes, index) => insert.run(`STR-${910 + index}`, `History ${index}`, "Completed unrelated work type", "Observe", "Later", JSON.stringify(completedActual(minutes))));
  const comparable = { ...forecast, basisKind: "comparable history", confidence: "high", comparableItems: "Five current-POD platform capability items" };
  const unrelatedResponse = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", { section: "deliveryForecast", value: comparable, reason: "Do not mix workflow with work type" }), { DB: db });
  assert.equal(unrelatedResponse?.status, 409);
  db.sqlite.prepare("UPDATE work_items SET workflow = 'Control', work_type = 'Platform capability' WHERE key LIKE 'STR-91%'").run();
  const matchingResponse = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", { section: "deliveryForecast", value: comparable, reason: "Use exact explicit work-type history" }), { DB: db });
  assert.equal(matchingResponse?.status, 200, await matchingResponse?.text());
  const stored = JSON.parse(String(db.sqlite.prepare("SELECT delivery_forecast_json FROM work_items WHERE id = ?").get(itemId)!.delivery_forecast_json));
  assert.equal(stored.serviceLevel.workType, "Platform capability");
  assert.equal(stored.serviceLevel.sampleSize, 5);
});

test("blocked forecast acceptance preserves the authoritative blocker dependency contract", async () => {
  const { db, itemId } = await setup();
  db.sqlite.prepare("UPDATE members SET role = 'Tech Lead' WHERE id = 'member-a'").run();
  const authoritativeBlockedSince = "2026-08-14T16:00:00.000Z";
  const previous = { ...forecast, blockedSince: authoritativeBlockedSince, unblockOwner: "Tech Lead", unblockAction: "Resolve provider outage", cannotForecastUntil: "Cannot forecast until provider access is restored", reforecastRequiredReason: "state or blocker changed", reforecastRequiredAt: authoritativeBlockedSince };
  db.sqlite.prepare("UPDATE work_items SET state = 'blocked', blocked_since = ?, delivery_forecast_json = ? WHERE id = ?").run(authoritativeBlockedSince, JSON.stringify(previous), itemId);
  const erased = { ...forecast, blockedSince: null, unblockOwner: "", unblockAction: "", cannotForecastUntil: "", changeReason: "Attempt to clear blocker contract" };
  const denied = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", { section: "deliveryForecast", value: erased, reason: "Blocked contract must remain" }), { DB: db });
  assert.equal(denied?.status, 400);
  assert.equal(db.sqlite.prepare("SELECT delivery_forecast_json FROM work_items WHERE id = ?").get(itemId)!.delivery_forecast_json, JSON.stringify(previous));

  const valid = { ...forecast, blockedSince: "client-value-must-not-win", unblockOwner: "Tech Lead", unblockAction: "Restore provider access", cannotForecastUntil: "Cannot forecast until provider credentials are restored", changeReason: "Blocked forecast revised with explicit dependency" };
  const accepted = await handleApi(request("member-a", `/api/items/${itemId}/work-economics`, "PATCH", { section: "deliveryForecast", value: valid, reason: "Preserve authoritative blocker contract" }), { DB: db });
  assert.equal(accepted?.status, 200, await accepted?.text());
  const stored = JSON.parse(String(db.sqlite.prepare("SELECT delivery_forecast_json FROM work_items WHERE id = ?").get(itemId)!.delivery_forecast_json));
  assert.equal(stored.blockedSince, authoritativeBlockedSince);
  assert.equal(stored.unblockOwner, "Tech Lead");
  assert.match(stored.cannotForecastUntil, /credentials are restored/);
  const audit = db.sqlite.prepare("SELECT previous_json, replacement_json FROM work_economics_events WHERE item_id = ? AND section = 'deliveryForecast' ORDER BY id DESC LIMIT 1").get(itemId)!;
  assert.equal(audit.previous_json, JSON.stringify(previous));
  assert.equal(JSON.parse(String(audit.replacement_json)).blockedSince, authoritativeBlockedSince);
});
