import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

test("signal migration creates bounded stores and enforces immutable and append-only records", async () => {
  const signalSql = await readFile(new URL("../drizzle/0021_useful_silk_fever.sql", import.meta.url), "utf8");
  const retentionSql = await readFile(new URL("../drizzle/0022_signal_retention.sql", import.meta.url), "utf8");
  const terminalSql = await readFile(new URL("../drizzle/0023_signal_terminal_provenance.sql", import.meta.url), "utf8");
  const sql = `${signalSql}\n${retentionSql}\n${terminalSql}`.replaceAll("--> statement-breakpoint", "");
  const db = new DatabaseSync(":memory:");
  db.exec(sql);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'signal%' ORDER BY name").all().map((row) => row.name);
  assert.deepEqual(tables, ["signal_events", "signal_generation_attempts", "signal_proposals", "signal_rejections", "signal_retention_authorizations", "signal_retention_holds", "signal_retention_runs", "signal_sources", "signals"]);
  db.prepare(`INSERT INTO signals
    (signal_id,pod_id,submitter_id,original_text,original_sha256,idempotency_key,lifecycle_state,current_proposal_version,terminal_disposition_at,retention_delete_after,created_at,updated_at)
    VALUES ('s','p','u','exact','a','key','READY',1,'2026-08-19','2026-11-17','2026-08-19','2026-08-19')`).run();
  assert.throws(() => db.prepare("UPDATE signals SET original_text = 'changed' WHERE signal_id = 's'").run(), /immutable/);
  db.prepare(`INSERT INTO signals
    (signal_id,pod_id,submitter_id,original_text,original_sha256,idempotency_key,lifecycle_state,current_proposal_version,retention_delete_after,created_at,updated_at)
    VALUES ('s2','p','u','long lived','b','key2','CAPTURED',0,'9999-12-31T23:59:59.999Z','2025-01-01','2026-08-19')`).run();
  assert.throws(() => db.prepare("UPDATE signals SET lifecycle_state = 'READY' WHERE signal_id = 's2'").run(), /terminal retention boundary/);
  db.prepare(`UPDATE signals SET lifecycle_state = 'READY', terminal_disposition_at = '2026-08-19T12:00:00.000Z',
    retention_delete_after = '2026-11-17T12:00:00.000Z' WHERE signal_id = 's2'`).run();
  assert.throws(() => db.prepare("UPDATE signals SET terminal_disposition_at = '2026-08-20T12:00:00.000Z' WHERE signal_id = 's2'").run(), /immutable/);
  db.prepare(`INSERT INTO signal_proposals
    (proposal_id,signal_id,version,proposal_json,schema_version,input_sha256,output_sha256,state,confidence,readiness_status,provider,model,prompt_version,implementation_revision,created_at)
    VALUES ('p1','s',1,'{}','v1','i','o','CURRENT','low','ready','OpenAI','model','prompt','revision','2026-08-19')`).run();
  db.prepare("UPDATE signal_proposals SET state = 'STALE' WHERE proposal_id = 'p1'").run();
  assert.equal(db.prepare("SELECT state FROM signal_proposals WHERE proposal_id = 'p1'").get()?.state, "STALE");
  assert.throws(() => db.prepare("UPDATE signal_proposals SET proposal_json = '{\"changed\":true}' WHERE proposal_id = 'p1'").run(), /content is immutable/);
  db.prepare(`INSERT INTO signal_generation_attempts
    (attempt_id,signal_id,attempt_number,target_proposal_version,provider,model,prompt_version,implementation_revision,state,started_at,input_sha256)
    VALUES ('a1','s',1,1,'OpenAI','gpt-5.6-luna','signal-proposal-v1','revision-one','PROCESSING','2026-08-19','input')`).run();
  assert.throws(() => db.prepare("UPDATE signal_generation_attempts SET implementation_revision = 'revision-two' WHERE attempt_id = 'a1'").run(), /provenance is immutable/);
  db.prepare("INSERT INTO signal_events (signal_id,event_version,event_type,actor_id,detail_json,event_sha256,created_at) VALUES ('s',0,'CAPTURED','u','{}','e','2026-08-19')").run();
  assert.throws(() => db.prepare("DELETE FROM signal_events WHERE signal_id = 's'").run(), /governed retention/);
  db.prepare("INSERT INTO signal_retention_authorizations (signal_id,authorization_nonce,expires_at) VALUES ('s','n','2099-01-01')").run();
  db.prepare("DELETE FROM signal_events WHERE signal_id = 's'").run();
  db.prepare("INSERT INTO signal_retention_runs (cutoff_at,eligible_count,deleted_count,policy_bindings_sha256,created_at) VALUES ('2026-08-19',1,1,'h','2026-08-19')").run();
  assert.throws(() => db.prepare("DELETE FROM signal_retention_runs").run(), /append-only/);
});
