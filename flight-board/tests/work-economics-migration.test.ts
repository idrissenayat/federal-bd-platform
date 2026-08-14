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
  db.prepare("INSERT INTO work_items (key,title,description,phase,priority,workflow,state,gate,decision_status,decision_authority,next_action,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .run("STR-001", "Existing work", "Must survive migration", "Engineer", "Now", "STEER", "active", "Gate 2 passed", "Decided", "Tech Lead", "Keep building", "human-1", "2026-08-14", "2026-08-14");

  const migration = readFileSync(new URL("../drizzle/0005_normal_iron_fist.sql", import.meta.url), "utf8").replaceAll("--> statement-breakpoint", "");
  db.exec(migration);
  const migrated = db.prepare("SELECT key, title, value_hypothesis_json, delivery_forecast_json, actual_economics_json, realized_outcome_json FROM work_items WHERE key = 'STR-001'").get() as Record<string, unknown>;
  assert.equal(migrated.title, "Existing work");
  assert.equal(migrated.value_hypothesis_json, null);
  assert.equal(migrated.delivery_forecast_json, null);

  db.exec("DROP TABLE work_economics_events; ALTER TABLE work_items DROP COLUMN realized_outcome_json; ALTER TABLE work_items DROP COLUMN actual_economics_json; ALTER TABLE work_items DROP COLUMN delivery_forecast_json; ALTER TABLE work_items DROP COLUMN value_hypothesis_json;");
  const rolledBack = db.prepare("SELECT key, title, next_action FROM work_items WHERE key = 'STR-001'").get() as Record<string, unknown>;
  assert.equal(rolledBack.key, "STR-001");
  assert.equal(rolledBack.title, "Existing work");
  assert.equal(rolledBack.next_action, "Keep building");
});
