import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

test("SB-01 migration is additive and the bounded register query uses the approved index", async () => {
  const migration = await readFile(new URL("../drizzle/0024_signal_backlog_index.sql", import.meta.url), "utf8");
  assert.match(migration, /CREATE INDEX IF NOT EXISTS `?idx_signals_pod_created_id`?\s+ON `?signals`? \(`?pod_id`?, `?created_at`? DESC, `?signal_id`? DESC\)/u);
  assert.doesNotMatch(migration, /\b(?:INSERT|UPDATE|DELETE|DROP|ALTER|CREATE TABLE)\b/iu);

  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE signals (
    signal_id text PRIMARY KEY NOT NULL,
    pod_id text NOT NULL,
    created_at text NOT NULL
  )`);
  db.exec(migration);
  for (let index = 0; index < 40; index += 1) {
    db.prepare("INSERT INTO signals (signal_id, pod_id, created_at) VALUES (?, ?, ?)")
      .run(`signal-${index.toString().padStart(3, "0")}`, "pod-a", new Date(Date.UTC(2026, 7, 20, 12, index)).toISOString());
  }
  const plan = db.prepare(`EXPLAIN QUERY PLAN SELECT signal_id FROM signals
    WHERE pod_id = ? AND created_at <= ?
    ORDER BY created_at DESC, signal_id DESC LIMIT ?`).all("pod-a", "2026-08-21T00:00:00.000Z", 26);
  assert.match(plan.map((row) => String(row.detail)).join("\n"), /idx_signals_pod_created_id/u);
  db.close();
});
