import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

test("Work Economics migration and rollback preserve existing work", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE work_items (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    key text NOT NULL UNIQUE,
    title text NOT NULL,
    description text NOT NULL,
    phase text NOT NULL,
    priority text NOT NULL,
    workflow text NOT NULL,
    state text NOT NULL,
    gate text NOT NULL,
    decision_status text NOT NULL,
    decision_authority text NOT NULL,
    assignee_id text,
    next_action text NOT NULL,
    evidence_url text,
    github_url text,
    rework_instructions text,
    blocked_since text,
    created_by text NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL
  );`);
  db.exec(`CREATE TABLE members (
    id text PRIMARY KEY NOT NULL, display_name text NOT NULL, email text, kind text NOT NULL,
    role text NOT NULL, authority text NOT NULL, status text DEFAULT 'available' NOT NULL, accent text DEFAULT 'aqua' NOT NULL
  );`);
  db.prepare("INSERT INTO work_items (key,title,description,phase,priority,workflow,state,gate,decision_status,decision_authority,next_action,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .run("STR-001", "Existing work", "Must survive migration", "Engineer", "Now", "STEER", "active", "Gate 2 passed", "Decided", "Tech Lead", "Keep building", "human-1", "2026-08-14", "2026-08-14");

  const migration = readFileSync(new URL("../drizzle/0005_normal_iron_fist.sql", import.meta.url), "utf8").replaceAll("--> statement-breakpoint", "");
  db.exec(migration);
  const normalizedMigration = readFileSync(new URL("../drizzle/0006_sticky_sleeper.sql", import.meta.url), "utf8").replaceAll("--> statement-breakpoint", "");
  db.exec(normalizedMigration);
  const deliveryEventMigration = readFileSync(new URL("../drizzle/0007_melodic_the_initiative.sql", import.meta.url), "utf8").replaceAll("--> statement-breakpoint", "");
  db.exec(deliveryEventMigration);
  const workTypeMigration = readFileSync(new URL("../drizzle/0008_shiny_calypso.sql", import.meta.url), "utf8").replaceAll("--> statement-breakpoint", "");
  db.exec(workTypeMigration);
  const migrated = db.prepare("SELECT key, title, value_hypothesis_json, delivery_forecast_json, actual_economics_json, realized_outcome_json FROM work_items WHERE key = 'STR-001'").get() as Record<string, unknown>;
  assert.equal(migrated.title, "Existing work");
  assert.equal(migrated.value_hypothesis_json, null);
  assert.equal(migrated.delivery_forecast_json, null);
  assert.equal(db.prepare("SELECT pod_id FROM work_items WHERE key = 'STR-001'").get()!.pod_id, "steer-flight-team");
  assert.equal(db.prepare("SELECT work_type FROM work_items WHERE key = 'STR-001'").get()!.work_type, "Unclassified");
  db.prepare("UPDATE work_items SET work_type = 'Platform capability' WHERE key = 'STR-001'").run();
  assert.equal(db.prepare("SELECT work_type FROM work_items WHERE key = 'STR-001'").get()!.work_type, "Platform capability");
  db.prepare("INSERT INTO work_economics_events (item_id, section, action, actor_id, actor_role, previous_json, replacement_json, reason, created_at) VALUES (1, 'deliveryForecast', 'accepted', 'human-1', 'Tech Lead', NULL, '{}', 'initial', '2026-08-14')").run();
  assert.throws(() => db.exec("UPDATE work_economics_events SET reason = 'changed' WHERE id = 1"), /immutable/);
  assert.throws(() => db.exec("DELETE FROM work_economics_events WHERE id = 1"), /immutable/);
  const insertAgentFact = db.prepare(`INSERT INTO work_economics_agent_facts
    (item_id, record_kind, event_id, provider, model, attempts, currency, source, completeness, ingestion_state, observed_at)
    VALUES (1, ?, 'shared-event', 'OpenAI', NULL, 1, 'USD', 'test', 'complete', 'accepted', '2026-08-14')`);
  insertAgentFact.run("forecast");
  insertAgentFact.run("actual");
  assert.throws(() => insertAgentFact.run("actual"), /UNIQUE/);
  db.prepare("UPDATE work_economics_agent_facts SET conflict_reason = 'Provider export conflicts with accepted event' WHERE record_kind = 'actual'").run();
  assert.equal(db.prepare("SELECT conflict_reason FROM work_economics_agent_facts WHERE record_kind = 'actual'").get()!.conflict_reason, "Provider export conflicts with accepted event");
  db.prepare(`INSERT INTO work_economics_delivery_events
    (item_id, event_kind, originating_phase, minutes, reason, occurred_at, recorded_at)
    VALUES (1, 'rework', 'Engineer', 30, 'Correct independent-test blocker', '2026-08-14', '2026-08-14')`).run();
  assert.equal(db.prepare("SELECT event_kind FROM work_economics_delivery_events WHERE item_id = 1").get()!.event_kind, "rework");

  db.exec("DROP INDEX idx_work_items_pod_work_type_state; ALTER TABLE work_items DROP COLUMN work_type; DROP TABLE work_economics_delivery_events; ALTER TABLE work_economics_agent_facts DROP COLUMN conflict_reason; DROP TRIGGER work_economics_events_no_update; DROP TRIGGER work_economics_events_no_delete; DROP TABLE work_economics_agent_facts; DROP TABLE work_economics_duration_facts; DROP TABLE work_economics_human_facts; ALTER TABLE members DROP COLUMN pod_id; ALTER TABLE work_items DROP COLUMN outcome_owner_id; ALTER TABLE work_items DROP COLUMN delivery_owner_id; ALTER TABLE work_items DROP COLUMN pod_id; DROP TABLE work_economics_events; ALTER TABLE work_items DROP COLUMN realized_outcome_json; ALTER TABLE work_items DROP COLUMN actual_economics_json; ALTER TABLE work_items DROP COLUMN delivery_forecast_json; ALTER TABLE work_items DROP COLUMN value_hypothesis_json;");
  const rolledBack = db.prepare("SELECT key, title, next_action FROM work_items WHERE key = 'STR-001'").get() as Record<string, unknown>;
  assert.equal(rolledBack.key, "STR-001");
  assert.equal(rolledBack.title, "Existing work");
  assert.equal(rolledBack.next_action, "Keep building");
});

test("privacy activation migration preserves the blocked version and adds append-only authority bindings", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE dispatch_privacy_policies (
    pod_id text NOT NULL, policy_version integer NOT NULL, inventory_url text NOT NULL,
    inventory_sha256 text NOT NULL, terminal_retention_days integer NOT NULL,
    provider_recovery_days integer NOT NULL, status text NOT NULL, changed_by text NOT NULL,
    change_reason text NOT NULL, created_at text NOT NULL, UNIQUE(pod_id, policy_version)
  );`);
  db.prepare(`INSERT INTO dispatch_privacy_policies
    (pod_id, policy_version, inventory_url, inventory_sha256, terminal_retention_days,
     provider_recovery_days, status, changed_by, change_reason, created_at)
    VALUES ('pod-a', 1, 'inventory', ?, 90, 30, 'BLOCKED_BACKUP_RULING', 'member-a', 'seed', '2026-08-18')`).run("a".repeat(64));
  const migration = readFileSync(new URL("../drizzle/0019_dispatch_privacy_activation.sql", import.meta.url), "utf8").replaceAll("--> statement-breakpoint", "");
  db.exec(migration);
  const preserved = db.prepare("SELECT policy_version, status, ruling_url, authorization_event_id FROM dispatch_privacy_policies").get()!;
  assert.deepEqual({ ...preserved }, { policy_version: 1, status: "BLOCKED_BACKUP_RULING", ruling_url: null, authorization_event_id: null });
  const insert = db.prepare(`INSERT INTO dispatch_privacy_policies
    (pod_id, policy_version, inventory_url, inventory_sha256, terminal_retention_days,
     provider_recovery_days, status, changed_by, change_reason, created_at, ruling_url,
     ruling_sha256, authority_role, authorization_event_id, idempotency_key, activation_receipt_sha256)
    VALUES ('pod-a', 2, 'inventory', ?, 90, 30, 'ACTIVE', 'member-a', 'approved', '2026-08-18',
      'ruling', ?, 'Product Lead · interim Tech Lead', ?, 'activation-key', ?)`);
  insert.run("a".repeat(64), "b".repeat(64), "c".repeat(64), "d".repeat(64));
  assert.equal(db.prepare("SELECT status FROM dispatch_privacy_policies WHERE policy_version = 2").get()!.status, "ACTIVE");
  assert.throws(() => insert.run("a".repeat(64), "b".repeat(64), "c".repeat(64), "d".repeat(64)), /UNIQUE/);
});

test("risk readiness migration preserves legacy decision receipts and adds immutable authority", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE decision_intents (
    intent_id text PRIMARY KEY NOT NULL, intent_json text NOT NULL
  );`);
  db.prepare("INSERT INTO decision_intents (intent_id, intent_json) VALUES ('legacy-intent', '{}')").run();
  const migration = readFileSync(new URL("../drizzle/0021_risk_based_release_readiness.sql", import.meta.url), "utf8").replaceAll("--> statement-breakpoint", "");
  db.exec(migration);
  const legacy = db.prepare("SELECT intent_id, readiness_snapshot_sha256 FROM decision_intents").get()!;
  assert.deepEqual({ ...legacy }, { intent_id: "legacy-intent", readiness_snapshot_sha256: "" });
  db.prepare(`INSERT INTO decision_readiness_snapshots
    (snapshot_id, item_id, pod_id, snapshot_json, snapshot_sha256, evidence_set_sha256,
     critic_review_id, tier, satisfaction_path, effective_not_before, current_state,
     predecessor_snapshot_sha256, created_by, created_at)
    VALUES ('snapshot-a', 74, 'pod-a', '{}', ?, ?, 1, 'DEFAULT_OPEN', 'TIME',
      '2026-08-19T20:00:00.000Z', 'ACTIVE', NULL, 'human-a', '2026-08-19T20:00:00.000Z')`)
    .run("a".repeat(64), "b".repeat(64));
  assert.throws(() => db.prepare("UPDATE decision_readiness_snapshots SET effective_not_before = '2000-01-01T00:00:00Z' WHERE snapshot_id = 'snapshot-a'").run(), /authority is immutable/);
  db.prepare("UPDATE decision_readiness_snapshots SET current_state = 'INVALIDATED', invalidation_reason = 'CANDIDATE_DRIFT' WHERE snapshot_id = 'snapshot-a'").run();
  assert.throws(() => db.prepare("UPDATE decision_readiness_snapshots SET current_state = 'ACTIVE', invalidation_reason = NULL WHERE snapshot_id = 'snapshot-a'").run(), /state transition is invalid/);
  assert.throws(() => db.prepare("UPDATE decision_intents SET readiness_snapshot_sha256 = ? WHERE intent_id = 'legacy-intent'").run("c".repeat(64)), /readiness authority is immutable/);
});
