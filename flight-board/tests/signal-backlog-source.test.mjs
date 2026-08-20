import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const api = await readFile(new URL("../worker/api.ts", import.meta.url), "utf8");

test("SB-04 navigation separates captured signals from admitted delivery work", () => {
  assert.match(page, /id: "signals", label: "Signal Backlog"/u);
  assert.match(page, /id: "backlog", label: "Product Backlog"/u);
  assert.match(page, /view === "signals" && <SignalBacklog/u);
  assert.match(page, /view === "backlog" && <Backlog items=\{filteredItems\} onOpen=\{openItem\} \/>/u);
  assert.doesNotMatch(page, /Recent contributor signals|signals\.slice\(0, 8\)|<Backlog[^>]+signals=/u);
});

test("SB-10 bootstrap does not restore a competing capped signal register", () => {
  const bootstrapStart = api.indexOf("async function bootstrap(");
  const bootstrapEnd = api.indexOf("const telemetryContract", bootstrapStart);
  assert.ok(bootstrapStart >= 0 && bootstrapEnd > bootstrapStart);
  const bootstrap = api.slice(bootstrapStart, bootstrapEnd);
  assert.doesNotMatch(bootstrap, /FROM signals[^;]+LIMIT 20/su);
  assert.doesNotMatch(bootstrap, /signals:\s*recentSignals/u);
});
