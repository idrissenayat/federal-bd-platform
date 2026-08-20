import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { createHash, randomBytes } from "node:crypto";

const cfg = process.env;
for (const key of ["ISSUE74_STAGING_URL", "ISSUE74_SERVICE_TOKEN", "ISSUE74_SITES_TOKEN", "ISSUE74_LEDGER_PATH",
  "ISSUE74_SOURCE_REVISION", "ISSUE74_BUILD_SHA256", "ISSUE74_MIGRATION_SET_SHA256", "ISSUE74_POLICY_SHA256",
  "ISSUE74_TARGET_PATH", "ISSUE74_TARGET_SHA256", "ISSUE74_TARGET_COMMIT_OBJECT_SHA256", "ISSUE74_CASE_CONTRACT_SHA256"]) {
  if (!cfg[key]) throw new Error(`Missing ${key}`);
}
const baseUrl = cfg.ISSUE74_STAGING_URL.replace(/\/$/, "");
const runId = cfg.ISSUE74_RUN_ID || `rr74-${new Date().toISOString().replace(/[-:.TZ]/g, "").toLowerCase()}`;
const brief = { path: "steer/briefs/0074-risk-based-gate3-readiness.md", commit: "e1644ff3421800423e90980929fa4eac3c64f1e1", sha256: "fbd22ba38942a4098b727d3c88ebde92b336f1879a5b73ef4cb9c9bc6d0ac6e5" };
const exam = { path: "steer/exams/0074-risk-based-gate3-readiness.md", commit: "1b8ad059a8ee2a4a94c7828bc617d4909a52813c", sha256: "a407773a621ee75421201a6bd5673024eee4d9f3d8f929cf50bf1740850709c6" };
const runtime = { source_revision: cfg.ISSUE74_SOURCE_REVISION, build_sha256: cfg.ISSUE74_BUILD_SHA256,
  migration_set_sha256: cfg.ISSUE74_MIGRATION_SET_SHA256, runtime_policy_sha256: cfg.ISSUE74_POLICY_SHA256 };
const target = { path: cfg.ISSUE74_TARGET_PATH, sha256: cfg.ISSUE74_TARGET_SHA256, commit_object_sha256: cfg.ISSUE74_TARGET_COMMIT_OBJECT_SHA256 };
const digest = (value) => createHash("sha256").update(String(value)).digest("hex");
const uuidV7 = (now = Date.now()) => {
  const bytes = randomBytes(16);
  let timestamp = Math.max(0, Math.min(now, 281_474_976_710_655));
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = timestamp % 256;
    timestamp = Math.floor(timestamp / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
const iso = (ms) => new Date(ms).toISOString();
const baseClock = Date.now() - 60_000;
const hour = 3_600_000;

async function call(path, { service = false, body, controlledNow, accepted = [200, 201], token = cfg.ISSUE74_SERVICE_TOKEN } = {}) {
  const attempts = [];
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const started = performance.now();
    try {
      const headers = { "content-type": "application/json", "OAI-Sites-Authorization": `Bearer ${cfg.ISSUE74_SITES_TOKEN}` };
      if (service) headers.authorization = `Bearer ${token}`;
      if (controlledNow) headers["x-steer-controlled-now"] = controlledNow;
      const response = await fetch(`${baseUrl}${path}`, { method: body === undefined ? "GET" : "POST", headers,
        body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30_000) });
      const text = await response.text();
      let parsed; try { parsed = JSON.parse(text); } catch { parsed = { non_json_sha256: digest(text) }; }
      const result = { status: response.status, body: parsed, latency_ms: Math.round((performance.now() - started) * 100) / 100, transport_error: null };
      attempts.push({ status: result.status, latency_ms: result.latency_ms, transport_error: null });
      if (accepted.includes(result.status)) return { ...result, attempts };
      if (result.status < 500) assert.fail(`${path}: ${result.status} ${JSON.stringify(parsed)}`);
    } catch (error) {
      attempts.push({ status: 0, latency_ms: Math.round((performance.now() - started) * 100) / 100,
        transport_error: error instanceof Error ? `${error.name}:${error.message}` : "FETCH_FAILED" });
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }
  throw new Error(`${path} did not reconcile: ${JSON.stringify(attempts)}`);
}

const define = (caseId, extra = {}) => ({ case_id: caseId, declared: ["NONE"], derived: ["NONE"], mode: "SOLO_CALIBRATION",
  path: "TIME", verified: iso(baseClock), controlled: iso(baseClock), signatures: [], drift: null,
  tier: "DEFAULT_OPEN", readiness: "READY", finalStatus: 201, snapshotReplay: false, ...extra });
const cases = [
  define("RR74-CLASS-OPEN"),
  define("RR74-CLASS-ELEVATED", { declared: ["SECURITY_NON_AUTH"], derived: ["SECURITY_NON_AUTH"], tier: "ELEVATED", readiness: "NOT_READY", finalStatus: 409 }),
  define("RR74-CLASS-CLOSED", { declared: ["GOVERNANCE_CONTROL"], derived: ["GOVERNANCE_CONTROL"], tier: "DEFAULT_CLOSED", readiness: "NOT_READY", finalStatus: 409 }),
  define("RR74-CLASS-UNKNOWN", { declared: ["UNKNOWN_CODE"], derived: ["UNKNOWN_CODE"], tier: "DEFAULT_CLOSED", readiness: "NOT_READY", finalStatus: 409 }),
  define("RR74-TIME-OPEN-BEFORE", { verified: iso(baseClock + 1), readiness: "NOT_READY", finalStatus: 409 }),
  define("RR74-TIME-OPEN-AT"),
  define("RR74-TIME-ELEVATED-BEFORE", { declared: ["SECURITY_NON_AUTH"], derived: ["SECURITY_NON_AUTH"], verified: iso(baseClock - 4 * hour + 1), tier: "ELEVATED", readiness: "NOT_READY", finalStatus: 409 }),
  define("RR74-TIME-ELEVATED-AT", { declared: ["SECURITY_NON_AUTH"], derived: ["SECURITY_NON_AUTH"], verified: iso(baseClock - 4 * hour), tier: "ELEVATED" }),
  define("RR74-TIME-CLOSED-BEFORE", { declared: ["GOVERNANCE_CONTROL"], derived: ["GOVERNANCE_CONTROL"], verified: iso(baseClock - 24 * hour + 1), tier: "DEFAULT_CLOSED", readiness: "NOT_READY", finalStatus: 409 }),
  define("RR74-TIME-CLOSED-AT", { declared: ["GOVERNANCE_CONTROL"], derived: ["GOVERNANCE_CONTROL"], verified: iso(baseClock - 24 * hour), tier: "DEFAULT_CLOSED" }),
  define("RR74-SIGNER-ELEVATED-VALID", { declared: ["ACCESSIBILITY_UI"], derived: ["ACCESSIBILITY_UI"], path: "QUALIFIED_HUMAN", tier: "ELEVATED", signatures: [["rr74-human-design-valid", "Product Designer", 201]] }),
  define("RR74-SIGNER-WRONG-DOMAIN", { declared: ["ACCESSIBILITY_UI"], derived: ["ACCESSIBILITY_UI"], path: "QUALIFIED_HUMAN", tier: "ELEVATED", signatures: [["rr74-human-security-wrong", "Security Owner", 400]], readiness: "NOT_READY", finalStatus: 409 }),
  define("RR74-SIGNER-SUBMITTER", { declared: ["ACCESSIBILITY_UI"], derived: ["ACCESSIBILITY_UI"], path: "QUALIFIED_HUMAN", tier: "ELEVATED", signatures: [["SUBMITTER", "Product Designer", 403]], readiness: "NOT_READY", finalStatus: 409 }),
  define("RR74-SIGNER-BUILDER", { declared: ["ACCESSIBILITY_UI"], derived: ["ACCESSIBILITY_UI"], path: "QUALIFIED_HUMAN", tier: "ELEVATED", signatures: [["BUILDER", "Product Designer", 403]], readiness: "NOT_READY", finalStatus: 409 }),
  define("RR74-SIGNER-TEAM-COMPLETE", { declared: ["GOVERNANCE_CONTROL"], derived: ["GOVERNANCE_CONTROL"], mode: "TEAM", path: "QUALIFIED_TEAM", tier: "DEFAULT_CLOSED", signatures: [["rr74-human-product-team", "Product Lead", 201], ["rr74-human-tech-team", "Tech Lead", 201]] }),
  define("RR74-SIGNER-TEAM-DUPLICATE", { declared: ["GOVERNANCE_CONTROL"], derived: ["GOVERNANCE_CONTROL"], mode: "TEAM", path: "QUALIFIED_TEAM", tier: "DEFAULT_CLOSED", signatures: [["rr74-human-stack-team", "Product Lead", 201], ["rr74-human-stack-team", "Product Lead", 200]], readiness: "NOT_READY", finalStatus: 409 }),
  ...["WORK_ITEM", "BRIEF_AUTHORITY", "EXAM_AUTHORITY", "CRITIC_RESULT", "DERIVED_DOMAINS", "OPERATING_MODE", "CANDIDATE_BUILDER", "VERIFICATION_RECEIPT"]
    .map((field) => define(`RR74-DRIFT-${field.replaceAll("_", "-")}`, { drift: field, readiness: "INVALIDATED", finalStatus: 409 })),
];
assert.equal(cases.length, 24);

async function receipt(itemId, builderId, submitterId, definition, salt = definition.case_id) {
  return call("/api/staging-verification-receipts", { service: true, body: { item_id: itemId, environment: "staging",
    brief_path: brief.path, brief_commit: brief.commit, brief_sha256: brief.sha256, exam_path: exam.path, exam_commit: exam.commit, exam_sha256: exam.sha256,
    source_revision: runtime.source_revision, build_sha256: runtime.build_sha256, migration_set_sha256: runtime.migration_set_sha256,
    runtime_policy_sha256: runtime.runtime_policy_sha256, case_ledger_sha256: digest(`${cfg.ISSUE74_CASE_CONTRACT_SHA256}:${salt}`),
    candidate_builder_id: builderId, intended_submitter_id: submitterId, completed_at: definition.verified } });
}

const humanCall = (itemId, operation, payload, accepted = [200, 201]) => call("/api/staging-release-readiness-fixtures", {
  service: true, accepted, body: { action: "HUMAN", item_id: itemId, operation, ...(payload === undefined ? {} : { payload }) } });

async function runFlow(definition) {
  const steps = {};
  steps.fixture = await call("/api/staging-release-readiness-fixtures", { service: true, body: { action: "CREATE", run_id: runId,
    case_id: definition.case_id, intended_submitter_id: "CURRENT_PRODUCT_LEAD", derived_risk_codes: definition.derived, operating_mode: definition.mode,
    target_path: target.path, target_sha256: target.sha256, target_commit_object_sha256: target.commit_object_sha256 } });
  const itemId = Number(steps.fixture.body.item_id); const builderId = String(steps.fixture.body.candidate_builder_id);
  const submitterId = String(steps.fixture.body.intended_submitter_id);
  steps.receipt = await receipt(itemId, builderId, submitterId, definition);
  const packet = { brief_path: brief.path, brief_commit: brief.commit, brief_sha256: brief.sha256,
    exam_path: exam.path, exam_commit: exam.commit, exam_sha256: exam.sha256, implementation_commit: runtime.source_revision,
    build_sha256: runtime.build_sha256, migration_set_sha256: runtime.migration_set_sha256, runtime_policy_sha256: runtime.runtime_policy_sha256,
    verification_receipt_id: steps.receipt.body.receipt_id, verification_receipt_sha256: steps.receipt.body.receipt_sha256,
    declared_risk_codes: definition.declared, operating_mode: definition.mode, satisfaction_path: definition.path };
  steps.snapshot = await humanCall(itemId, "SNAPSHOT", packet);
  assert.equal(steps.snapshot.body.snapshot.tier, definition.tier);
  const snapshotId = steps.snapshot.body.snapshot.snapshot_id;
  if (definition.snapshotReplay) {
    steps.snapshot_replay = await humanCall(itemId, "SNAPSHOT", packet);
    assert.equal(steps.snapshot_replay.body.replay, true);
    assert.equal(steps.snapshot_replay.body.snapshot.snapshot_id, snapshotId);
  }
  steps.signatures = [];
  for (const [identity, role, status] of definition.signatures) {
    const memberId = identity === "SUBMITTER" ? submitterId : identity === "BUILDER" ? builderId : identity;
    steps.signatures.push(await call("/api/staging-release-readiness-fixtures", { service: true, accepted: [status], body: { action: "COUNTERSIGN", item_id: itemId, snapshot_id: snapshotId, member_id: memberId, role } }));
  }
  steps.package = await humanCall(itemId, "PACKAGE", {});
  steps.session = await humanCall(itemId, "SESSION", { reason: "Fresh issue #74 real hosted verification session." });
  const idempotencyKey = uuidV7();
  assert.match(idempotencyKey, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  steps.intent = await humanCall(itemId, "INTENT", { package_id: steps.package.body.package.package_id, decision: "APPROVED",
    final_reasoning: "The exact issue #74 hosted candidate satisfies the recorded release controls.", decision_session_id: steps.session.body.session_id, idempotency_key: idempotencyKey }, [200, 201, 409]);
  const intentId = steps.intent.body.intent?.intent_id ?? steps.intent.body.intent_id ?? null;
  if (!intentId) {
    assert.equal(steps.intent.status, 409);
    assert.equal(definition.finalStatus, 409);
    assert.equal(definition.drift, null, `${definition.case_id} must reach an intent before drift is injected.`);
    steps.readiness = await humanCall(itemId, "READINESS");
    assert.equal(steps.readiness.body.status, definition.readiness);
    steps.projection = await call("/api/staging-release-readiness-fixtures", { service: true, body: { action: "PROJECT", item_id: itemId } });
    const stepRecord = Object.fromEntries(Object.entries(steps).map(([name, value]) => [name, Array.isArray(value)
      ? value.map((entry) => ({ status: entry.status, latency_ms: entry.latency_ms, body: entry.body }))
      : { status: value.status, latency_ms: value.latency_ms, attempts: value.attempts, body: value.body }]));
    return { case_id: definition.case_id, item_id: itemId, snapshot_id: snapshotId, intent_id: null, packet,
      oracle: { tier: definition.tier, readiness: definition.readiness, intent_http: 409, finalize_http: null, gate_effects: 0 },
      projection_sha256: steps.projection.body.projection_sha256, projection: steps.projection.body.projection, steps: stepRecord,
      latency_ms: Object.values(steps).flatMap((value) => Array.isArray(value) ? value.map((entry) => entry.latency_ms) : [value.latency_ms]), pass: true };
  }
  steps.proof = await call(`/api/decision-intents/${intentId}/issuer-proof`, { service: true, body: {} });
  if (definition.drift === "VERIFICATION_RECEIPT") steps.drift = await receipt(itemId, builderId, submitterId, definition, `${definition.case_id}:changed`);
  else if (definition.drift) steps.drift = await call("/api/staging-release-readiness-fixtures", { service: true, body: { action: "MUTATE", item_id: itemId, field: definition.drift } });
  steps.finalize = await call(`/api/decision-intents/${intentId}/finalize`, { service: true, body: {}, controlledNow: definition.controlled, accepted: [definition.finalStatus] });
  steps.readiness = await humanCall(itemId, "READINESS");
  const boundaryReadiness = steps.finalize.body.readiness?.status ?? steps.readiness.body.status;
  assert.equal(boundaryReadiness, definition.readiness);
  steps.projection = await call("/api/staging-release-readiness-fixtures", { service: true, body: { action: "PROJECT", item_id: itemId } });
  const effectCount = steps.projection.body.projection.decisions.filter((row) => row.decision_intent_id === intentId).length;
  assert.equal(effectCount, definition.finalStatus === 201 ? 1 : 0);
  const stepRecord = Object.fromEntries(Object.entries(steps).map(([name, value]) => [name, Array.isArray(value)
    ? value.map((entry) => ({ status: entry.status, latency_ms: entry.latency_ms, body: entry.body }))
    : { status: value.status, latency_ms: value.latency_ms, attempts: value.attempts, body: value.body }]));
  return { case_id: definition.case_id, item_id: itemId, snapshot_id: snapshotId, intent_id: intentId, packet,
    oracle: { tier: definition.tier, readiness: definition.readiness, finalize_http: definition.finalStatus, gate_effects: effectCount },
    projection_sha256: steps.projection.body.projection_sha256, projection: steps.projection.body.projection, steps: stepRecord,
    latency_ms: Object.values(steps).flatMap((value) => Array.isArray(value) ? value.map((entry) => entry.latency_ms) : [value.latency_ms]), pass: true };
}

const observations = [];
for (const definition of cases) {
  console.error(`START ${definition.case_id}`);
  observations.push(await runFlow(definition));
  console.error(`PASS ${definition.case_id}`);
}
const replay = await runFlow(define("RR74-REPLAY-IDEMPOTENT", { snapshotReplay: true }));
observations.push(replay);
console.error("PASS RR74-REPLAY-IDEMPOTENT");

const concurrent = [];
const concurrencyCases = Array.from({ length: 100 }, (_, index) => define(`RR74-C100-${String(index + 1).padStart(3, "0")}`));
for (let index = 0; index < 100; index += 10) {
  concurrent.push(...await Promise.all(concurrencyCases.slice(index, index + 10).map(runFlow)));
  console.error(`PASS RR74-CONCURRENCY ${index + 10}/100`);
}
assert.equal(new Set(concurrent.map((row) => row.snapshot_id)).size, 100); assert.equal(new Set(concurrent.map((row) => row.intent_id)).size, 100);
assert.equal(concurrent.reduce((sum, row) => sum + row.oracle.gate_effects, 0), 100);
observations.push({ case_id: "RR74-CONCURRENCY-100", identity_count: 100, distinct_snapshots: 100, distinct_intents: 100, gate_effects: 100,
  identities: concurrent.map((row) => ({ item_id: row.item_id, snapshot_id: row.snapshot_id, intent_id: row.intent_id, projection_sha256: row.projection_sha256 })),
  latency_ms: concurrent.flatMap((row) => row.latency_ms), pass: true });

const denied = await call("/api/staging-release-readiness-fixtures", { service: true, token: "invalid-service-token-that-is-long-enough-0000", accepted: [401], body: { action: "PROJECT", item_id: observations[0].item_id } });
const recovered = await call("/api/staging-release-readiness-fixtures", { service: true, body: { action: "PROJECT", item_id: observations[0].item_id } });
observations.push({ case_id: "RR74-FAULT-AUTH-RETRY", denied_http: denied.status, recovered_http: recovered.status,
  projection_sha256: recovered.body.projection_sha256, latency_ms: [denied.latency_ms, recovered.latency_ms], pass: true });
assert.equal(observations.length, 27);

const latencies = observations.flatMap((row) => row.latency_ms ?? []).sort((a, b) => a - b);
const p95 = latencies[Math.max(0, Math.ceil(latencies.length * 0.95) - 1)];
const ledger = { schema: "steer.issue74-real-hosted-ledger/v2", run_id: runId, generated_at: new Date().toISOString(),
  target: { staging_url: baseUrl, ...runtime, ...target, brief, exam, case_contract_sha256: cfg.ISSUE74_CASE_CONTRACT_SHA256 },
  denominator: 30, real_hosted_cases: 27, rollback_cases_reserved: ["RR74-ROLLBACK-LEGACY", "RR74-ROLLBACK-INERT", "RR74-RESTORE-NO-DUPLICATE"],
  concurrency: { identity_count: 100, lifecycle: "fixture→receipt→snapshot→package→session→intent→proof→finalization→D1 projection" },
  latency: { observation_count: latencies.length, p95_ms: p95 }, observations };
await writeFile(cfg.ISSUE74_LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(JSON.stringify({ run_id: runId, cases: observations.length, concurrency_identities: 100, p95_ms: p95, output: cfg.ISSUE74_LEDGER_PATH }));
