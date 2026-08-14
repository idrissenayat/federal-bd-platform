import assert from "node:assert/strict";
import test from "node:test";
import { codeReviewBrief, parseGitHubPatch, pullRequestFromItem } from "../worker/api";

test("only accepts pull requests from the configured repository", () => {
  assert.deepEqual(
    pullRequestFromItem({ evidence_url: "https://github.com/idrissenayat/federal-bd-platform/pull/11" }),
    { owner: "idrissenayat", repo: "federal-bd-platform", repository: "idrissenayat/federal-bd-platform", number: 11 },
  );
  assert.equal(pullRequestFromItem({ evidence_url: "https://github.com/other/repository/pull/11" }), null);
  assert.equal(pullRequestFromItem({ evidence_url: "https://github.com/idrissenayat/federal-bd-platform/issues/11" }), null);
});

test("blocks merge advice when checks are pending", () => {
  const review = codeReviewBrief(
    { draft: false, mergeable: true, additions: 20, deletions: 5, changed_files: 2 },
    [
      { filename: "worker/api.ts", status: "modified", additions: 18, deletions: 5, changes: 23 },
      { filename: "tests/api.test.ts", status: "modified", additions: 2, deletions: 0, changes: 2 },
    ],
    { all_green: false, failed: 0, pending: 1, total: 2 },
  );
  assert.equal(review.recommendation, "Do not merge yet");
  assert.match(review.proposed_change_instructions, /Wait for checks to finish/);
  assert.ok(review.findings.some((finding) => finding.title.includes("still running")));
});

test("keeps human acceptance explicit for a small verified change", () => {
  const review = codeReviewBrief(
    { draft: false, mergeable: true, additions: 8, deletions: 2, changed_files: 2 },
    [
      { filename: "app/card.tsx", status: "modified", additions: 6, deletions: 2, changes: 8 },
      { filename: "tests/card.test.ts", status: "modified", additions: 2, deletions: 0, changes: 2 },
    ],
    { all_green: true, failed: 0, pending: 0, total: 3 },
  );
  assert.equal(review.recommendation, "Ready for human acceptance");
  assert.equal(review.findings.length, 0);
  assert.ok(review.dependencies.some((value) => value.includes("exact displayed head commit")));
});

test("turns a public GitHub patch into reviewable changed files", () => {
  const files = parseGitHubPatch([
    "diff --git a/worker/api.ts b/worker/api.ts",
    "index 1111111..2222222 100644",
    "--- a/worker/api.ts",
    "+++ b/worker/api.ts",
    "@@ -1 +1 @@",
    "-const status = 'old';",
    "+const status = 'new';",
    "diff --git a/tests/new.test.ts b/tests/new.test.ts",
    "new file mode 100644",
    "--- /dev/null",
    "+++ b/tests/new.test.ts",
    "@@ -0,0 +1,2 @@",
    "+test('one', () => {});",
    "+test('two', () => {});",
  ].join("\n"));

  assert.deepEqual(files.map(({ filename, status, additions, deletions, changes }) => ({ filename, status, additions, deletions, changes })), [
    { filename: "worker/api.ts", status: "modified", additions: 1, deletions: 1, changes: 2 },
    { filename: "tests/new.test.ts", status: "added", additions: 2, deletions: 0, changes: 2 },
  ]);
  assert.match(files[1].patch ?? "", /new file mode/);
});
