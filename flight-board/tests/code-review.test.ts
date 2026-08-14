import assert from "node:assert/strict";
import test from "node:test";
import { codeReviewBrief, pullRequestFromItem } from "../worker/api";

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
