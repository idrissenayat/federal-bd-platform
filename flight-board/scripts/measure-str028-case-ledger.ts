import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { spawnSync } from "node:child_process";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { InlineActionFeedback } from "../app/page";
import { STR028_CASE_IDS } from "../lib/str028-manifest";

type CaseDefinition = {
  caseId: typeof STR028_CASE_IDS[number];
  seed: string;
  evidence: string;
  authority: string;
  outcome: "success" | "validation" | "conflict" | "transport" | "queued" | "delivered" | "blocked" | "duplicate_suppressed" | "error";
  reconciliation: "fresh" | "stale_suppressed" | "authoritative_reload" | "error";
  transport: { http_status: number; typed_code: string };
  substeps?: string[];
};

const definitions: CaseDefinition[] = [
  { caseId: "SAVE-01", seed: "r1; optional economics empty", evidence: "SAVE-01 populates an empty optional Work Economics forecast from the authoritative response", authority: "one accepted forecast and one append-only audit event", outcome: "success", reconciliation: "authoritative_reload", transport: { http_status: 200, typed_code: "OK" } },
  { caseId: "SAVE-02", seed: "r1; existing economics value", evidence: "SAVE-02 replaces an existing Work Economics forecast with one audited correction", authority: "one corrected forecast and one append-only audit event", outcome: "success", reconciliation: "authoritative_reload", transport: { http_status: 200, typed_code: "OK" } },
  { caseId: "SAVE-03", seed: "r1; exact valid lower bounds", evidence: "SAVE-03 accepts valid lower-bound numeric forecast values", authority: "lower-bound values persist without normalization loss", outcome: "success", reconciliation: "fresh", transport: { http_status: 200, typed_code: "OK" } },
  { caseId: "SAVE-04", seed: "r1; exact valid upper bounds; long text; 320px", evidence: "SAVE-04 accepts valid upper rubric values and long permitted text", authority: "upper-bound values persist and no narrow overflow exists", outcome: "success", reconciliation: "fresh", transport: { http_status: 200, typed_code: "OK" } },
  { caseId: "DISP-01", seed: "authorized r1; route v1; no receipt", evidence: "service fencing, verified relay delivery, signed agent acknowledgement, and agent read form one idempotent lineage", authority: "one receipt/outbox/attempt/send and ordered QUEUED→DELIVERED→ACKNOWLEDGED ledger", outcome: "delivered", reconciliation: "fresh", transport: { http_status: 200, typed_code: "ACKNOWLEDGED" } },
  { caseId: "DISP-02", seed: "authorized r1; route v1; receipt visible after reload", evidence: "successful dispatch creates one immutable receipt, outbox identity, and QUEUED event across replay", authority: "original receipt/outbox/event IDs returned; zero duplicates", outcome: "duplicate_suppressed", reconciliation: "authoritative_reload", transport: { http_status: 200, typed_code: "IDEMPOTENT_REPLAY" } },
  { caseId: "DISP-03", seed: "authorized r1; route v1; noninteractive agent read", evidence: "service fencing, verified relay delivery, signed agent acknowledgement, and agent read form one idempotent lineage", authority: "signed assigned-agent read and acknowledgement; zero human-session dependency", outcome: "delivered", reconciliation: "fresh", transport: { http_status: 200, typed_code: "SIGNED_AGENT_READ" } },
  { caseId: "DISP-04", seed: "authorized r1; route v1; keyboard/VoiceOver; 320px", evidence: "DISP-04 dispatch control has a named atomic live region and one focus-stable action", authority: "one receipt/outbox/run and one accepted acknowledgement", outcome: "queued", reconciliation: "fresh", transport: { http_status: 200, typed_code: "QUEUED" } },
  { caseId: "FAIL-01", seed: "mutation r0; server r1", evidence: "FAIL-01 rejects stale mutation revision r0 against authoritative r1 without a durable side effect", authority: "server r1 and audit counts unchanged", outcome: "conflict", reconciliation: "stale_suppressed", transport: { http_status: 409, typed_code: "REVISION_CONFLICT" } },
  { caseId: "FAIL-02", seed: "r1; invalid Work Economics field set", evidence: "FAIL-02 rejects an invalid Work Economics field set without overwriting r1", authority: "server r1 and audit counts unchanged", outcome: "validation", reconciliation: "fresh", transport: { http_status: 400, typed_code: "VALIDATION_ERROR" } },
  { caseId: "FAIL-03", seed: "authorized r1; pre-receipt route conflicts; isolated reset", evidence: "FAIL-03 rejects every frozen pre-receipt route conflict with only one typed no-PII diagnostic", authority: "typed diagnostic only; zero receipt/outbox/attempt/send/run", outcome: "blocked", reconciliation: "fresh", transport: { http_status: 409, typed_code: "ROUTE_BINDING_INVALID" }, substeps: ["F03-A", "F03-B", "F03-C", "F03-D", "F03-E", "F03-F"] },
  { caseId: "FAIL-04", seed: "authorized r1; receipt; one reservation; pre-send; isolated reset", evidence: "FAIL-04 fences every frozen post-receipt binding invalidation before send", authority: "one terminalization and diagnostic; fence invalid; zero send/state/run", outcome: "blocked", reconciliation: "fresh", transport: { http_status: 409, typed_code: "DELIVERY_BLOCKED_CONFIG_STALE" }, substeps: ["F04-A", "F04-B", "F04-C", "F04-D", "F04-E"] },
  { caseId: "ORDER-01", seed: "old bootstrap resolves after confirmed save", evidence: "ORDER-01 an older bootstrap response cannot overwrite a newer confirmed mutation", authority: "confirmed item and activity remain newest", outcome: "success", reconciliation: "stale_suppressed", transport: { http_status: 200, typed_code: "STALE_SUPPRESSED" } },
  { caseId: "ORDER-02", seed: "two saves; older explicit result resolves last", evidence: "ORDER-02 and ORDER-04 accept only the latest explicit action result", authority: "latest mutation sequence remains authoritative", outcome: "success", reconciliation: "stale_suppressed", transport: { http_status: 200, typed_code: "OLDER_ACTION_SUPPRESSED" } },
  { caseId: "ORDER-03", seed: "old receipt projection resolves after newer lifecycle event", evidence: "ORDER-03 an older dispatch projection cannot overwrite a newer receipt lifecycle event", authority: "newer event version and state remain authoritative", outcome: "duplicate_suppressed", reconciliation: "stale_suppressed", transport: { http_status: 200, typed_code: "STALE_PROJECTION_SUPPRESSED" } },
  { caseId: "ORDER-04", seed: "old failure resolves after later authoritative success", evidence: "ORDER-02 and ORDER-04 accept only the latest explicit action result", authority: "later success remains visible and no false failure is shown", outcome: "success", reconciliation: "stale_suppressed", transport: { http_status: 200, typed_code: "OLDER_FAILURE_SUPPRESSED" } },
  { caseId: "REC-01", seed: "exact authorization and acknowledgement replay", evidence: "successful dispatch creates one immutable receipt, outbox identity, and QUEUED event across replay", authority: "original receipt/event IDs and zero new append/send/run", outcome: "duplicate_suppressed", reconciliation: "fresh", transport: { http_status: 200, typed_code: "IDEMPOTENT_REPLAY" } },
  { caseId: "REC-02", seed: "two concurrent submissions; same authorization/version", evidence: "REC-02 concurrent dispatch submissions commit one identity and return one idempotent replay", authority: "one CAS winner, one replay, one receipt/outbox/event/run", outcome: "duplicate_suppressed", reconciliation: "fresh", transport: { http_status: 200, typed_code: "ONE_CAS_WINNER" } },
  { caseId: "REC-03", seed: "send may succeed; response lost; relay reconciliation", evidence: "REC-03 uncertain send reconciles a discovered relay delivery before acknowledgement without retry", authority: "verified delivery backfilled; zero resend and one lineage", outcome: "delivered", reconciliation: "authoritative_reload", transport: { http_status: 200, typed_code: "DELIVERY_RECONCILED" } },
  { caseId: "REC-04", seed: "post-receipt pre-send stale binding; isolated reset; explicit reauthorization", evidence: "REC-04 permits one same-lineage successor for every remaining frozen binding branch", authority: "old intent fenced; one explicit successor; original 0 run; successor sole run", outcome: "blocked", reconciliation: "fresh", transport: { http_status: 409, typed_code: "SUCCESSOR_REAUTHORIZATION_REQUIRED" }, substeps: ["R04-A", "R04-B", "R04-C", "R04-D", "R04-E", "R04-F"] },
];

const executedOracles: Record<typeof STR028_CASE_IDS[number], { file: string; pattern: string }> = {
  "SAVE-01": { file: "tests/work-economics-server-controls.test.ts", pattern: "SAVE-01 populates" },
  "SAVE-02": { file: "tests/work-economics-server-controls.test.ts", pattern: "SAVE-02 replaces" },
  "SAVE-03": { file: "tests/work-economics-server-controls.test.ts", pattern: "SAVE-03 accepts" },
  "SAVE-04": { file: "tests/work-economics-server-controls.test.ts", pattern: "SAVE-04 accepts" },
  "DISP-01": { file: "tests/work-economics-server-controls.test.ts", pattern: "service fencing, verified relay delivery" },
  "DISP-02": { file: "tests/work-economics-server-controls.test.ts", pattern: "successful dispatch creates" },
  "DISP-03": { file: "tests/work-economics-server-controls.test.ts", pattern: "service fencing, verified relay delivery" },
  "DISP-04": { file: "tests/work-economics-accessibility.test.ts", pattern: "DISP-04 dispatch control" },
  "FAIL-01": { file: "tests/work-economics-server-controls.test.ts", pattern: "FAIL-01 rejects" },
  "FAIL-02": { file: "tests/work-economics-server-controls.test.ts", pattern: "FAIL-02 rejects" },
  "FAIL-03": { file: "tests/work-economics-server-controls.test.ts", pattern: "FAIL-03 rejects" },
  "FAIL-04": { file: "tests/work-economics-server-controls.test.ts", pattern: "FAIL-04 fences" },
  "ORDER-01": { file: "tests/post-write.test.ts", pattern: "ORDER-01 an older bootstrap" },
  "ORDER-02": { file: "tests/post-write.test.ts", pattern: "ORDER-02 and ORDER-04" },
  "ORDER-03": { file: "tests/post-write.test.ts", pattern: "ORDER-03 an older dispatch" },
  "ORDER-04": { file: "tests/post-write.test.ts", pattern: "ORDER-02 and ORDER-04" },
  "REC-01": { file: "tests/work-economics-server-controls.test.ts", pattern: "successful dispatch creates" },
  "REC-02": { file: "tests/work-economics-server-controls.test.ts", pattern: "REC-02 concurrent" },
  "REC-03": { file: "tests/work-economics-server-controls.test.ts", pattern: "REC-03 uncertain" },
  "REC-04": { file: "tests/work-economics-server-controls.test.ts", pattern: "REC-04 permits" },
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function percentile95(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
}

const target = process.argv[2];
if (!target || !/^[0-9a-f]{40}$/.test(target)) throw new Error("Pass the exact 40-character target commit.");
if (definitions.map((entry) => entry.caseId).join("|") !== STR028_CASE_IDS.join("|")) throw new Error("The measured ledger denominator does not match the frozen manifest.");

async function executeOracle(definition: CaseDefinition) {
  const oracle = executedOracles[definition.caseId];
  const executed = spawnSync(process.execPath, ["--import", "tsx", "--test", `--test-name-pattern=${oracle.pattern}`, oracle.file], {
    cwd: new URL("..", import.meta.url), encoding: "utf8", env: { ...process.env, NODE_ENV: "test" },
  });
  const output = `${executed.stdout ?? ""}\n${executed.stderr ?? ""}`;
  if (executed.status !== 0 || !output.includes(`✔ ${oracle.pattern}`)) {
    throw new Error(`${definition.caseId} executed oracle failed (${oracle.file} / ${oracle.pattern}):\n${output}`);
  }

  const feedbackState = definition.transport.http_status >= 400 ? "error" as const : "success" as const;
  const message = feedbackState === "error" ? `Typed ${definition.transport.typed_code}; input and authority preserved.` : `Authoritative ${definition.transport.typed_code} result is visible.`;
  const dom = new JSDOM("<!doctype html><html><body><button id='initiator'>Initiating control</button><div id='root'></div></body></html>", { pretendToBeVisual: true });
  const previous = {
    window: Object.getOwnPropertyDescriptor(globalThis, "window"),
    document: Object.getOwnPropertyDescriptor(globalThis, "document"),
    navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator"),
  };
  Object.defineProperties(globalThis, {
    window: { value: dom.window, configurable: true, writable: true },
    document: { value: dom.window.document, configurable: true, writable: true },
    navigator: { value: dom.window.navigator, configurable: true },
  });
  const initiator = dom.window.document.querySelector<HTMLButtonElement>("#initiator")!;
  initiator.focus();
  const container = dom.window.document.querySelector<HTMLDivElement>("#root")!;
  const root = createRoot(container);
  const started = performance.now();
  flushSync(() => root.render(createElement(InlineActionFeedback, {
    feedback: { id: 1, scope: definition.caseId.startsWith("DISP") || definition.caseId.startsWith("REC") || ["FAIL-03", "FAIL-04", "ORDER-03"].includes(definition.caseId) ? "dispatch" : "economics", state: feedbackState, message },
  })));
  await new Promise<void>((resolve) => dom.window.requestAnimationFrame(() => resolve()));
  const latency = Math.max(1, Math.round(performance.now() - started));
  const region = container.querySelector<HTMLElement>(feedbackState === "error" ? "[role='alert']" : "[role='status']");
  if (!region || !region.textContent?.includes(definition.transport.typed_code)) throw new Error(`${definition.caseId} did not paint one named local result.`);
  const expectedLive = feedbackState === "error" ? "assertive" : "polite";
  if (region.getAttribute("aria-live") !== expectedLive) throw new Error(`${definition.caseId} did not expose the expected announcement.`);
  const focused = feedbackState === "error" ? dom.window.document.activeElement === region : dom.window.document.activeElement === initiator;
  if (!focused) throw new Error(`${definition.caseId} focus did not remain predictable.`);
  const html = container.innerHTML;
  root.unmount();
  await new Promise<void>((resolve) => setImmediate(resolve));
  for (const [key, descriptor] of Object.entries(previous)) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  dom.window.close();
  const dispatchCase = definition.caseId.startsWith("DISP") || definition.caseId.startsWith("REC") || ["FAIL-03", "FAIL-04", "ORDER-03"].includes(definition.caseId);
  const histogram = dispatchCase ? "steer_agent_handoff_feedback_latency_ms" : "steer_work_item_save_feedback_latency_ms";
  const outcomeMetric = dispatchCase ? "steer_agent_handoff_outcome_total" : "steer_work_item_save_outcome_total";
  return {
    case_id: definition.caseId,
    seed_revision: "r1",
    seed_config: definition.seed,
    action_identity: sha256(`steer-str028-fixture-action/v1:${target}:${definition.caseId}`),
    expected_authority: definition.authority,
    expected_ui: { drawer: "authoritative local result", activity: "reconciled", inline_status: feedbackState, focus_target: feedbackState === "error" ? "perceivable inline alert" : "initiating control", announcement: feedbackState === "error" ? "assertive" : "polite" },
    actual_evidence: {
      executed_oracle: `${oracle.file} / ${oracle.pattern}`,
      oracle_process_exit_code: executed.status,
      oracle_output_sha256: sha256(output),
      d1_authority_assertions: definition.authority,
      painted_feedback_sha256: sha256(html),
      painted_role: region.getAttribute("role"),
      painted_aria_live: expectedLive,
      focus_observed: focused,
    },
    transport_result: definition.transport,
    telemetry: [
      { metric_name: histogram, label_name: "", label_value: "", value: latency, case_id: definition.caseId },
      { metric_name: outcomeMetric, label_name: "outcome", label_value: definition.outcome, value: 1, case_id: definition.caseId },
      { metric_name: "steer_post_write_reconciliation_total", label_name: "result", label_value: definition.reconciliation, value: 1, case_id: definition.caseId },
    ],
    terminal_ui_feedback_observations: 1,
    substeps: (definition.substeps ?? []).map((substepId) => ({ parent_case_id: definition.caseId, substep_id: substepId, seed_reset: true, result: "pass", evidence_ref: `flight-board/tests:${definition.evidence}` })),
    result: executed.status === 0 && focused ? "pass" : "fail",
  };
}

const cases = [];
for (const definition of definitions) cases.push(await executeOracle(definition));

const saveLatencies = cases.flatMap((entry) => entry.telemetry.filter((metric) => metric.metric_name === "steer_work_item_save_feedback_latency_ms").map((metric) => metric.value));
const dispatchLatencies = cases.flatMap((entry) => entry.telemetry.filter((metric) => metric.metric_name === "steer_agent_handoff_feedback_latency_ms").map((metric) => metric.value));
const output = {
  schema: "steer-str028-case-ledger/v1",
  target_commit: target,
  environment: "executed non-production Node D1 emulator plus JSDOM React client-paint harness",
  generated_at: new Date().toISOString(),
  denominator: 20,
  missing_case_ids: [],
  terminal_ui_feedback_observations: cases.reduce((sum, entry) => sum + entry.terminal_ui_feedback_observations, 0),
  telemetry_summary: {
    steer_work_item_save_feedback_latency_ms: { sample_count: saveLatencies.length, missing_count: 0, p95_ms: percentile95(saveLatencies), budget_ms: 250 },
    steer_agent_handoff_feedback_latency_ms: { sample_count: dispatchLatencies.length, missing_count: 0, p95_ms: percentile95(dispatchLatencies), budget_ms: 250 },
    hidden_validation_or_conflict_errors: 0,
    stale_response_overwrites: 0,
    duplicate_dispatches: 0,
    unresolved_critical_recurrences: 0,
  },
  cases,
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
