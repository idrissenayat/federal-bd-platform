import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { verifyAuthorityPayload } from "../lib/decision-package.ts";

const baseUrl = process.env.ISSUE74_STAGING_URL;
const serviceToken = process.env.ISSUE74_SERVICE_TOKEN;
const sitesToken = process.env.ISSUE74_SITES_TOKEN;
const publicKey = process.env.ISSUE74_PUBLIC_KEY;
const outputPath = process.env.ISSUE74_LEDGER_PATH;
const expected = {
  source_revision: process.env.ISSUE74_SOURCE_REVISION,
  build_sha256: process.env.ISSUE74_BUILD_SHA256,
  migration_set_sha256: process.env.ISSUE74_MIGRATION_SET_SHA256,
  policy_sha256: process.env.ISSUE74_POLICY_SHA256,
};
for (const [name, value] of Object.entries({ baseUrl, serviceToken, sitesToken, publicKey, outputPath, ...expected })) {
  if (!value) throw new Error(`Missing ${name}`);
}

const runId = process.env.ISSUE74_RUN_ID || `rr74-${new Date().toISOString().replace(/[-:.TZ]/g, "").toLowerCase()}`;
const verified = "2026-08-19T20:00:00.000Z";
const at = (hours, deltaMs = 0) => new Date(Date.parse(verified) + hours * 3_600_000 + deltaMs).toISOString();
const base = (caseId, overrides = {}) => ({
  run_id: runId, case_id: caseId, declared_risk_codes: ["NONE"], derived_risk_codes: ["NONE"],
  operating_mode: "SOLO_CALIBRATION", satisfaction_path: "TIME", verification_completed_at: verified,
  server_now: verified, signatures: [], drift_field: "NONE", ...overrides,
});
const human = (member_id, role, overrides = {}) => ({
  member_id, role, kind: "human", pod_id: "steer-flight-team", current_role: role,
  status: "available", is_submitter: false, is_builder: false, ...overrides,
});

const cases = [
  [base("RR74-CLASS-OPEN"), "DEFAULT_OPEN", "READY", "TIME_PATH_SATISFIED"],
  [base("RR74-CLASS-ELEVATED", { declared_risk_codes: ["SECURITY_NON_AUTH"], derived_risk_codes: ["SECURITY_NON_AUTH"], server_now: at(3) }), "ELEVATED", "NOT_READY", "COOLING_PERIOD_ACTIVE"],
  [base("RR74-CLASS-CLOSED", { declared_risk_codes: ["GOVERNANCE_CONTROL"], derived_risk_codes: ["GOVERNANCE_CONTROL"], server_now: at(23) }), "DEFAULT_CLOSED", "NOT_READY", "COOLING_PERIOD_ACTIVE"],
  [base("RR74-CLASS-UNKNOWN", { declared_risk_codes: ["UNKNOWN_CODE"], derived_risk_codes: ["UNKNOWN_CODE"] }), "DEFAULT_CLOSED", "NOT_READY", "RISK_CODE_UNKNOWN"],
  [base("RR74-TIME-OPEN-BEFORE", { server_now: at(0, -1) }), "DEFAULT_OPEN", "NOT_READY", "COOLING_PERIOD_ACTIVE"],
  [base("RR74-TIME-OPEN-AT"), "DEFAULT_OPEN", "READY", "TIME_PATH_SATISFIED"],
  [base("RR74-TIME-ELEVATED-BEFORE", { declared_risk_codes: ["SECURITY_NON_AUTH"], derived_risk_codes: ["SECURITY_NON_AUTH"], server_now: at(4, -1) }), "ELEVATED", "NOT_READY", "COOLING_PERIOD_ACTIVE"],
  [base("RR74-TIME-ELEVATED-AT", { declared_risk_codes: ["SECURITY_NON_AUTH"], derived_risk_codes: ["SECURITY_NON_AUTH"], server_now: at(4) }), "ELEVATED", "READY", "TIME_PATH_SATISFIED"],
  [base("RR74-TIME-CLOSED-BEFORE", { declared_risk_codes: ["GOVERNANCE_CONTROL"], derived_risk_codes: ["GOVERNANCE_CONTROL"], server_now: at(24, -1) }), "DEFAULT_CLOSED", "NOT_READY", "COOLING_PERIOD_ACTIVE"],
  [base("RR74-TIME-CLOSED-AT", { declared_risk_codes: ["GOVERNANCE_CONTROL"], derived_risk_codes: ["GOVERNANCE_CONTROL"], server_now: at(24) }), "DEFAULT_CLOSED", "READY", "TIME_PATH_SATISFIED"],
  [base("RR74-SIGNER-ELEVATED-VALID", { declared_risk_codes: ["ACCESSIBILITY_UI"], derived_risk_codes: ["ACCESSIBILITY_UI"], satisfaction_path: "QUALIFIED_HUMAN", signatures: [human("human-design-1", "Product Designer")] }), "ELEVATED", "READY", "QUALIFIED_HUMAN_PATH_SATISFIED"],
  [base("RR74-SIGNER-WRONG-DOMAIN", { declared_risk_codes: ["ACCESSIBILITY_UI"], derived_risk_codes: ["ACCESSIBILITY_UI"], satisfaction_path: "QUALIFIED_HUMAN", signatures: [human("human-security-1", "Security Owner")] }), "ELEVATED", "NOT_READY", "QUALIFIED_HUMAN_REQUIRED"],
  [base("RR74-SIGNER-SUBMITTER", { declared_risk_codes: ["ACCESSIBILITY_UI"], derived_risk_codes: ["ACCESSIBILITY_UI"], satisfaction_path: "QUALIFIED_HUMAN", signatures: [human("human-design-1", "Product Designer", { is_submitter: true })] }), "ELEVATED", "NOT_READY", "QUALIFIED_HUMAN_REQUIRED"],
  [base("RR74-SIGNER-BUILDER", { declared_risk_codes: ["ACCESSIBILITY_UI"], derived_risk_codes: ["ACCESSIBILITY_UI"], satisfaction_path: "QUALIFIED_HUMAN", signatures: [human("human-design-1", "Product Designer", { is_builder: true })] }), "ELEVATED", "NOT_READY", "QUALIFIED_HUMAN_REQUIRED"],
  [base("RR74-SIGNER-TEAM-COMPLETE", { declared_risk_codes: ["GOVERNANCE_CONTROL"], derived_risk_codes: ["GOVERNANCE_CONTROL"], operating_mode: "TEAM", satisfaction_path: "QUALIFIED_TEAM", signatures: [human("human-product-1", "Product Lead"), human("human-tech-1", "Tech Lead")] }), "DEFAULT_CLOSED", "READY", "QUALIFIED_HUMAN_PATH_SATISFIED"],
  [base("RR74-SIGNER-TEAM-DUPLICATE", { declared_risk_codes: ["GOVERNANCE_CONTROL"], derived_risk_codes: ["GOVERNANCE_CONTROL"], operating_mode: "TEAM", satisfaction_path: "QUALIFIED_TEAM", signatures: [human("human-stack-1", "Product Lead", { current_role: "Product Lead Tech Lead" }), human("human-stack-1", "Tech Lead", { current_role: "Product Lead Tech Lead" })] }), "DEFAULT_CLOSED", "NOT_READY", "QUALIFIED_HUMAN_REQUIRED"],
  ...["IMPLEMENTATION", "MIGRATION", "RUNTIME_POLICY", "EXAM", "VERIFICATION_RECEIPT", "DERIVED_DOMAINS", "CRITIC_TARGET", "RISK_POLICY"].map((field) => [base(`RR74-DRIFT-${field.replaceAll("_", "-")}`, { drift_field: field }), "DEFAULT_OPEN", "INVALIDATED", `${field}_DRIFT`]),
];
assert.equal(cases.length, 24);

async function send(input, token = serviceToken) {
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}/api/staging-release-readiness-cases`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "OAI-Sites-Authorization": `Bearer ${sitesToken}`, "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch { body = { transport_error: "NON_JSON_PROVIDER_RESPONSE", content_type: response.headers.get("content-type"), body_sha256_pending: true }; }
    return { status: response.status, body, latency_ms: Math.round((performance.now() - started) * 100) / 100, transport_failure: body?.transport_error ?? null };
  } catch (error) {
    return { status: 0, body: { transport_error: error instanceof Error ? error.name : "FETCH_FAILURE" }, latency_ms: Math.round((performance.now() - started) * 100) / 100, transport_failure: error instanceof Error ? error.name : "FETCH_FAILURE" };
  }
}

async function sendWithReconciliation(input, token = serviceToken, maximumAttempts = 6) {
  const attempts = [];
  for (let index = 0; index < maximumAttempts; index += 1) {
    const result = await send(input, token);
    attempts.push(result);
    if (!result.transport_failure && result.status < 500) return { ...result, attempts };
    await new Promise((resolve) => setTimeout(resolve, 250 * (index + 1)));
  }
  return { ...attempts.at(-1), attempts };
}

const observations = [];
for (const [input, tier, status, reason] of cases) {
  const result = await sendWithReconciliation(input);
  assert.ok([200, 201].includes(result.status), JSON.stringify(result.body));
  assert.equal(result.body.response.classification.tier, tier);
  assert.equal(result.body.response.result.status, status);
  assert.equal(result.body.response.result.reason, reason);
  for (const [key, value] of Object.entries(expected)) assert.equal(result.body.response[key], value);
  assert.equal(verifyAuthorityPayload("STEER_HOSTED_READINESS_CASE_V1", result.body.response, result.body.service_signature, publicKey), true);
  observations.push({ case_id: input.case_id, request: input, http_status: result.status, response: result.body.response, response_sha256: result.body.response_sha256, service_signature: result.body.service_signature, latency_ms: result.latency_ms, transport_attempts: result.attempts.map((entry) => ({ status: entry.status, transport_failure: entry.transport_failure, latency_ms: entry.latency_ms })), oracle: { tier, status, reason }, pass: true });
}

const replayInput = base("RR74-REPLAY-IDEMPOTENT");
const replayFirst = await sendWithReconciliation(replayInput);
const replaySecond = await sendWithReconciliation(replayInput);
assert.ok([200, 201].includes(replayFirst.status));
assert.equal(replaySecond.status, 200);
assert.equal(replaySecond.body.replay, true);
assert.equal(replayFirst.body.response_sha256, replaySecond.body.response_sha256);
observations.push({ case_id: replayInput.case_id, first_http_status: replayFirst.status, replay_http_status: replaySecond.status, response_sha256: replayFirst.body.response_sha256, replay: true, latency_ms: replaySecond.latency_ms, pass: true });

const concurrencyInput = base("RR74-CONCURRENCY-100");
const concurrentInitial = await Promise.all(Array.from({ length: 100 }, () => send(concurrencyInput)));
const successfulConcurrent = concurrentInitial.filter((entry) => !entry.transport_failure && [200, 201].includes(entry.status));
assert.ok(successfulConcurrent.length > 0);
assert.ok(successfulConcurrent.filter((entry) => entry.status === 201).length <= 1);
assert.equal(new Set(successfulConcurrent.map((entry) => entry.body.response_sha256)).size, 1);
const reconciledConcurrency = await sendWithReconciliation(concurrencyInput);
assert.equal(reconciledConcurrency.status, 200);
assert.equal(reconciledConcurrency.body.replay, true);
assert.equal(new Set([...successfulConcurrent.map((entry) => entry.body.response_sha256), reconciledConcurrency.body.response_sha256]).size, 1);
observations.push({ case_id: concurrencyInput.case_id, initial_attempts: 100, initial_authoritative_responses: successfulConcurrent.length, initial_transport_failures: concurrentInitial.filter((entry) => entry.transport_failure || entry.status >= 500).length, created_responses: successfulConcurrent.filter((entry) => entry.status === 201).length, reconciliation_replay_http_status: reconciledConcurrency.status, one_authoritative_identity: true, response_sha256: reconciledConcurrency.body.response_sha256, latencies_ms: concurrentInitial.map((entry) => entry.latency_ms), pass: true });

const faultInput = base("RR74-FAULT-AUTH-RETRY");
const rejected = await send(faultInput, "invalid-service-token-that-is-long-enough-0000");
const recovered = await sendWithReconciliation(faultInput);
assert.equal(rejected.status, 401);
assert.equal(recovered.status, 201);
observations.push({ case_id: faultInput.case_id, rejected_http_status: rejected.status, retry_http_status: recovered.status, response_sha256: recovered.body.response_sha256, pass: true });

assert.equal(observations.length, 27);
const allLatencies = observations.flatMap((entry) => entry.latencies_ms ?? (entry.latency_ms === undefined ? [] : [entry.latency_ms])).sort((a, b) => a - b);
const p95 = allLatencies[Math.max(0, Math.ceil(allLatencies.length * 0.95) - 1)];
const ledger = {
  schema: "steer.issue74-hosted-ledger/v1", run_id: runId, generated_at: new Date().toISOString(),
  target: { staging_url: baseUrl, ...expected }, denominator: 30, hosted_api_cases: 27,
  rollback_cases_reserved: ["RR74-ROLLBACK-LEGACY", "RR74-ROLLBACK-INERT", "RR74-RESTORE-NO-DUPLICATE"],
  latency: { observation_count: allLatencies.length, p95_ms: p95 }, observations,
};
await writeFile(outputPath, JSON.stringify(ledger, null, 2) + "\n");
console.log(JSON.stringify({ run_id: runId, cases: observations.length, p95_ms: p95, output: outputPath }));
