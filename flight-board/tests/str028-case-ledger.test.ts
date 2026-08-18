import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { STR028_CASE_IDS, STR028_FROZEN_SUBSTEPS } from "../lib/str028-manifest";

const ledger = JSON.parse(await readFile(new URL("../../steer/evidence/0028-case-ledger-0fbf1b0.json", import.meta.url), "utf8")) as Record<string, unknown>;

test("STR-028 measured ledger closes the exact 20-case denominator and both p95 budgets", () => {
  assert.equal(ledger.schema, "steer-str028-case-ledger/v1");
  assert.equal(ledger.target_commit, "0fbf1b06b4597ce6bfee934c8389a681e73c7891");
  assert.equal(ledger.denominator, 20);
  assert.deepEqual(ledger.missing_case_ids, []);
  assert.equal(ledger.terminal_ui_feedback_observations, 20);
  const cases = ledger.cases as Array<Record<string, unknown>>;
  assert.deepEqual(cases.map((entry) => entry.case_id), [...STR028_CASE_IDS]);
  for (const entry of cases) {
    for (const field of ["case_id", "seed_revision", "seed_config", "action_identity", "expected_authority", "expected_ui", "actual_evidence", "transport_result", "telemetry", "result"]) {
      assert.ok(entry[field], `${entry.case_id}:${field}`);
    }
    assert.match(String(entry.action_identity), /^[0-9a-f]{64}$/);
    assert.equal(entry.terminal_ui_feedback_observations, 1);
    assert.equal(entry.result, "pass");
    const metrics = entry.telemetry as Array<Record<string, unknown>>;
    assert.equal(metrics.filter((metric) => String(metric.metric_name).endsWith("feedback_latency_ms")).length, 1);
    assert.equal(metrics.filter((metric) => String(metric.metric_name).endsWith("outcome_total")).length, 1);
    assert.equal(metrics.filter((metric) => metric.metric_name === "steer_post_write_reconciliation_total").length, 1);
    assert.ok(metrics.every((metric) => metric.case_id === entry.case_id));
  }
  for (const [caseId, expectedSubsteps] of Object.entries(STR028_FROZEN_SUBSTEPS)) {
    const entry = cases.find((candidate) => candidate.case_id === caseId)!;
    const substeps = entry.substeps as Array<Record<string, unknown>>;
    assert.deepEqual(substeps.map((substep) => substep.substep_id), [...expectedSubsteps]);
    assert.ok(substeps.every((substep) => substep.parent_case_id === caseId && substep.seed_reset === true && substep.result === "pass"));
  }
  const summary = ledger.telemetry_summary as Record<string, Record<string, number>>;
  for (const metric of ["steer_work_item_save_feedback_latency_ms", "steer_agent_handoff_feedback_latency_ms"]) {
    assert.ok(summary[metric].sample_count > 0);
    assert.equal(summary[metric].missing_count, 0);
    assert.ok(summary[metric].p95_ms <= 250);
  }
  assert.equal(summary.hidden_validation_or_conflict_errors as unknown as number, 0);
  assert.equal(summary.stale_response_overwrites as unknown as number, 0);
  assert.equal(summary.duplicate_dispatches as unknown as number, 0);
  assert.equal(summary.unresolved_critical_recurrences as unknown as number, 0);
  const serialized = JSON.stringify(ledger).toLowerCase();
  for (const forbidden of ["email", "display_name", "message_body", "private_key", "authorization_text", "scope_text", "actor_id", "member_id"]) {
    assert.ok(!serialized.includes(`\"${forbidden}\"`), forbidden);
  }
});
