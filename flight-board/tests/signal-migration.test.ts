import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

test("signal migration creates bounded stores and enforces immutable and append-only records", async () => {
  const sql = (await readFile(new URL("../drizzle/0021_useful_silk_fever.sql", import.meta.url), "utf8")).replaceAll("--> statement-breakpoint", "");
  const db = new DatabaseSync(":memory:");
  db.exec(sql);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'signal%' ORDER BY name").all().map((row) => row.name);
  assert.deepEqual(tables, ["signal_events", "signal_generation_attempts", "signal_proposals", "signal_rejections", "signal_sources", "signals"]);
  db.prepare(`INSERT INTO signals
    (signal_id,pod_id,submitter_id,original_text,original_sha256,idempotency_key,lifecycle_state,current_proposal_version,retention_delete_after,created_at,updated_at)
    VALUES ('s','p','u','exact','a','key','READY',1,'2026-11-17','2026-08-19','2026-08-19')`).run();
  assert.throws(() => db.prepare("UPDATE signals SET original_text = 'changed' WHERE signal_id = 's'").run(), /immutable/);
  db.prepare(`INSERT INTO signal_proposals
    (proposal_id,signal_id,version,proposal_json,schema_version,input_sha256,output_sha256,state,confidence,readiness_status,provider,model,prompt_version,implementation_revision,created_at)
    VALUES ('p1','s',1,'{}','v1','i','o','CURRENT','low','ready','OpenAI','model','prompt','revision','2026-08-19')`).run();
  db.prepare("UPDATE signal_proposals SET state = 'STALE' WHERE proposal_id = 'p1'").run();
  assert.equal(db.prepare("SELECT state FROM signal_proposals WHERE proposal_id = 'p1'").get()?.state, "STALE");
  assert.throws(() => db.prepare("UPDATE signal_proposals SET proposal_json = '{\"changed\":true}' WHERE proposal_id = 'p1'").run(), /content is immutable/);
  db.prepare("INSERT INTO signal_events (signal_id,event_version,event_type,actor_id,detail_json,event_sha256,created_at) VALUES ('s',0,'CAPTURED','u','{}','e','2026-08-19')").run();
  assert.throws(() => db.prepare("DELETE FROM signal_events WHERE signal_id = 's'").run(), /governed retention/);
});
