import assert from "node:assert/strict";
import test from "node:test";
import {
  createSignalBacklogCursor,
  escapeSignalSearch,
  lifecycleStatesForGroup,
  parseSignalBacklogQuery,
  presentationForSignalState,
  signalAttentionReason,
  signalExcerpt,
  SignalBacklogContractError,
} from "../lib/signal-backlog";

const now = new Date("2026-08-20T15:00:00.000Z");

test("SB-08 parses only the closed bounded signal-list query", async () => {
  const defaults = await parseSignalBacklogQuery(new URL("https://steer.test/api/signals"), now);
  assert.deepEqual(defaults, { group: "ALL", q: null, limit: 25, snapshotAt: now.toISOString(), after: null, cursorProvided: false });

  const normalized = await parseSignalBacklogQuery(new URL("https://steer.test/api/signals?limit=50&group=NEEDS_ATTENTION&q=%20ＡＢＣ%20"), now);
  assert.equal(normalized.q, "ABC");
  assert.equal(normalized.limit, 50);
  assert.equal(normalized.group, "NEEDS_ATTENTION");

  const invalid = [
    ["?limit=0", "INVALID_SIGNAL_PAGE_LIMIT"], ["?limit=01", "INVALID_SIGNAL_PAGE_LIMIT"],
    ["?limit=51", "INVALID_SIGNAL_PAGE_LIMIT"], ["?limit=+2", "INVALID_SIGNAL_PAGE_LIMIT"],
    ["?group=READY", "INVALID_SIGNAL_GROUP"], ["?q=", "INVALID_SIGNAL_QUERY"],
    ["?q=%00", "INVALID_SIGNAL_QUERY"], ["?unknown=1", "INVALID_SIGNAL_LIST_PARAMETER"],
    ["?limit=2&limit=3", "INVALID_SIGNAL_PAGE_LIMIT"],
  ] as const;
  for (const [search, code] of invalid) {
    await assert.rejects(() => parseSignalBacklogQuery(new URL(`https://steer.test/api/signals${search}`), now), (error: unknown) => error instanceof SignalBacklogContractError && error.code === code);
  }
});

test("SB-02 continuation cursor binds the snapshot, query, limit, and position", async () => {
  const query = await parseSignalBacklogQuery(new URL("https://steer.test/api/signals?limit=7&group=NEW&q=owner"), now);
  const last = { createdAt: "2026-08-19T12:00:00.000Z", signalId: "0198abcd-0000-7000-8000-000000000001" };
  const cursor = await createSignalBacklogCursor(query, last);
  const continued = await parseSignalBacklogQuery(new URL(`https://steer.test/api/signals?limit=7&group=NEW&q=owner&cursor=${cursor}`), now);
  assert.deepEqual(continued.after, last);
  assert.equal(continued.snapshotAt, now.toISOString());
  assert.equal(continued.cursorProvided, true);

  await assert.rejects(() => parseSignalBacklogQuery(new URL(`https://steer.test/api/signals?limit=8&group=NEW&q=owner&cursor=${cursor}`), now), /continuation cursor is invalid/u);
  const decoded = Buffer.from(cursor.replaceAll("-", "+").replaceAll("_", "/"), "base64").toString("utf8");
  const duplicateKey = Buffer.from(decoded.replace('"v":1', '"v":1,"v":1')).toString("base64url");
  await assert.rejects(() => parseSignalBacklogQuery(new URL(`https://steer.test/api/signals?limit=7&group=NEW&q=owner&cursor=${duplicateKey}`), now), /continuation cursor is invalid/u);
});

test("SB-06 lifecycle presentation is closed and server-authored", () => {
  assert.deepEqual(presentationForSignalState("CAPTURED"), { group: "NEW", label: "New" });
  assert.deepEqual(presentationForSignalState("PROCESSING"), { group: "SCREENING", label: "Screening" });
  assert.deepEqual(presentationForSignalState("READY"), { group: "READY_FOR_REVIEW", label: "Ready for review" });
  assert.deepEqual(presentationForSignalState("STALE"), { group: "NEEDS_ATTENTION", label: "Needs attention" });
  assert.deepEqual(lifecycleStatesForGroup("NEEDS_ATTENTION"), ["STALE", "SAFE_FAILURE"]);
  assert.throws(() => presentationForSignalState("ADMITTED"), (error: unknown) => error instanceof SignalBacklogContractError && error.code === "SIGNAL_STATE_CONTRACT_VIOLATION");
  assert.equal(signalAttentionReason("STALE", null), "SOURCE_CHANGED");
  assert.equal(signalAttentionReason("SAFE_FAILURE", "PROVIDER_TIMEOUT"), "PROVIDER_TIMEOUT");
  assert.equal(signalAttentionReason("SAFE_FAILURE", "USER_EMAIL"), "SAFE_FAILURE");
});

test("SB-07 excerpts and literal search inputs stay bounded and inert", () => {
  const excerpt = signalExcerpt(`${"🚀".repeat(250)}\n<script>alert(1)</script>`);
  assert.equal([...excerpt].length, 240);
  assert.equal(excerpt.endsWith("…"), true);
  assert.equal(signalExcerpt("line one\n  line two"), "line one line two");
  assert.equal(escapeSignalSearch("100%_done\\next"), "100\\%\\_done\\\\next");
});
