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
  const migrated = db.prepare("SELECT key, title, value_hypothesis_json, delivery_forecast_json, actual_economics_json, realized_outcome_json FROM work_items WHERE key = 'STR-001'").get() as Record<string, unknown>;
  assert.equal(migrated.title, "Existing work");
  assert.equal(migrated.value_hypothesis_json, null);
  assert.equal(migrated.delivery_forecast_json, null);
  assert.equal(db.prepare("SELECT pod_id FROM work_items WHERE key = 'STR-001'").get()!.pod_id, "steer-flight-team");
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

  db.exec("DROP TABLE work_economics_delivery_events; ALTER TABLE work_economics_agent_facts DROP COLUMN conflict_reason; DROP TRIGGER work_economics_events_no_update; DROP TRIGGER work_economics_events_no_delete; DROP TABLE work_economics_agent_facts; DROP TABLE work_economics_duration_facts; DROP TABLE work_economics_human_facts; ALTER TABLE members DROP COLUMN pod_id; ALTER TABLE work_items DROP COLUMN outcome_owner_id; ALTER TABLE work_items DROP COLUMN delivery_owner_id; ALTER TABLE work_items DROP COLUMN pod_id; DROP TABLE work_economics_events; ALTER TABLE work_items DROP COLUMN realized_outcome_json; ALTER TABLE work_items DROP COLUMN actual_economics_json; ALTER TABLE work_items DROP COLUMN delivery_forecast_json; ALTER TABLE work_items DROP COLUMN value_hypothesis_json;");
  const rolledBack = db.prepare("SELECT key, title, next_action FROM work_items WHERE key = 'STR-001'").get() as Record<string, unknown>;
  assert.equal(rolledBack.key, "STR-001");
  assert.equal(rolledBack.title, "Existing work");
  assert.equal(rolledBack.next_action, "Keep building");
});
