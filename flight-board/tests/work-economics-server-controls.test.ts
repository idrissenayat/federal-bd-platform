import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { schnorr } from "@noble/curves/secp256k1.js";
import { canonicalJson, sha256Hex } from "../lib/dispatch-lifecycle";
import { handleApi } from "../worker/api";

const dispatchEnv = {
  DISPATCH_SERVICE_PRIVATE_KEY: "0".repeat(63) + "7",
  DISPATCH_SERVICE_KEY_ID: "test-dispatch-signer",
  DISPATCH_SERVICE_KEY_VERSION: "1",
  DISPATCH_SERVICE_TOKEN: "test-dispatch-service-token-0000000000000000",
  DISPATCH_ALLOW_TEST_PRIVACY_POLICY: "true",
};

const privacyInventory = await readFile(new URL("../../steer/evidence/0028-dispatch-data-inventory.md", import.meta.url), "utf8");

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

function serviceRequest(path: string, body: unknown) {
  return new Request(`https://steer.test${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${dispatchEnv.DISPATCH_SERVICE_TOKEN}` },
    body: JSON.stringify(body),
  });
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
    VALUES ('pod-a', 1, 'https://github.com/idrissenayat/federal-bd-platform/blob/367707def83a36bbf03e3a17eae838b89a63cbee/steer/evidence/0028-dispatch-data-inventory.md',
      'd1862566b1d88a9c79f6429bf1b259503edcc5418455ebf9b1b801bde0c2353b', 90, 30, 'BLOCKED_BACKUP_RULING', 'member-a', 'Test fixture', '2026-08-18T00:00:00.000Z')`).run();
  db.sqlite.prepare(`INSERT INTO buzz_channel_registry
    (pod_id, registry_version, channel_id, channel_name, relay_url, status, changed_by, change_reason, created_at)
    VALUES ('pod-a', 1, '10ac2fb4-f7fc-4dbc-bb73-8c545f31a470', '#steer-team', 'https://relay.example', 'ACTIVE', 'member-a', 'Test fixture', '2026-08-18T00:00:00.000Z')`).run();
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
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM steer_telemetry").get()!.total, 1);
  const row = db.sqlite.prepare("SELECT metric_name, label_name, label_value, value, case_id FROM steer_telemetry").get()!;
  assert.deepEqual({ ...row }, { metric_name: "steer_work_item_save_outcome_total", label_name: "outcome", label_value: "success", value: 1, case_id: "SAVE-01" });
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
    const accepted = await handleApi(request("agent-a", `/api/dispatches/${intentId}/acknowledgements`, "POST", acknowledgement), { DB: db, ...dispatchEnv });
    assert.equal(accepted?.status, 201, await accepted?.text());
    const replay = await handleApi(request("agent-a", `/api/dispatches/${intentId}/acknowledgements`, "POST", acknowledgement), { DB: db, ...dispatchEnv });
    assert.equal(replay?.status, 200, await replay?.clone().text());
    assert.equal((await replay?.json() as { idempotent_replay: boolean }).idempotent_replay, true);

    const requestedAt = new Date().toISOString();
    const readPayload = { schema: "steer-dispatch-read/v1", method: "POST", path: `/api/dispatches/${intentId}/read`, dispatch_intent_id: intentId, requested_at: requestedAt };
    const read = await handleApi(request("agent-a", `/api/dispatches/${intentId}/read`, "POST", { member_id: "agent-a", key_id: "agent-a-key", key_version: 1, requested_at: requestedAt, signature: await signBinding(readPayload, agentSecret) }), { DB: db, ...dispatchEnv });
    assert.equal(read?.status, 200, await read?.clone().text());
    const readBody = await read?.json() as { events: unknown[]; projection: { state: string } };
    assert.equal(readBody.projection.state, "ACKNOWLEDGED");
    assert.equal(readBody.events.length, 5);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_receipts").get()!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_outbox").get()!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_attempts").get()!.total, 1);
    assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS total FROM dispatch_events WHERE event_type = 'ACKNOWLEDGED'").get()!.total, 1);

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
