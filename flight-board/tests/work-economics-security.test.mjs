import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const api = await readFile(new URL("../worker/api.ts", import.meta.url), "utf8");
const validation = await readFile(new URL("../lib/work-economics-validation.ts", import.meta.url), "utf8");
const migration = await readFile(new URL("../drizzle/0006_sticky_sleeper.sql", import.meta.url), "utf8");

test("Work Economics API wires POD scope, named-owner authorization, and evidence-safe denial audit", () => {
  assert.match(api, /workEconomicsNamedAuthority/);
  assert.match(api, /pod_id = \(SELECT pod_id FROM members WHERE id = \?\)/);
  assert.match(api, /'denied'/);
  assert.match(api, /previous_json, replacement_json, reason/);
  assert.match(api, /Permission denied\. Ask the named record owner in this POD/);
});

test("authoritative actual fields use explicit server assignments", () => {
  assert.match(api, /value\.completionAt = completionAt/);
  assert.match(api, /value\.likelyVarianceMinutes = completionAt/);
  assert.doesNotMatch(api, /Object\.assign\(value/);
});

test("exact recursive schemas and safe reads reject legacy or injected fields", () => {
  assert.match(validation, /ownKeys\(entry/);
  assert.match(validation, /privacyBoundary\(nested/);
  assert.match(validation, /email address/);
  assert.match(api, /Legacy record failed the current privacy\/schema boundary/);
});

test("database audit history is append-only and economics facts are queryable", () => {
  assert.match(migration, /work_economics_human_facts/);
  assert.match(migration, /work_economics_agent_facts/);
  assert.match(migration, /work_economics_duration_facts/);
  assert.match(migration, /work_economics_events_no_update/);
  assert.match(migration, /work_economics_events_no_delete/);
  assert.match(migration, /RAISE\(ABORT, 'work_economics_events are immutable'\)/);
  assert.match(migration, /UNIQUE INDEX `uq_work_economics_agent_item_kind_event`.*`item_id`,`record_kind`,`event_id`/);
});
