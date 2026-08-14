import assert from "node:assert/strict";
import test from "node:test";
import { engineeringRecordFromDescription, normalizeEngineeringRecordUrl } from "../worker/api";

test("accepts only issue and pull-request records from the STEER repository", () => {
  assert.equal(
    normalizeEngineeringRecordUrl("https://github.com/idrissenayat/federal-bd-platform/issues/31"),
    "https://github.com/idrissenayat/federal-bd-platform/issues/31",
  );
  assert.equal(
    normalizeEngineeringRecordUrl("https://github.com/idrissenayat/federal-bd-platform/pull/40/"),
    "https://github.com/idrissenayat/federal-bd-platform/pull/40",
  );
  assert.equal(normalizeEngineeringRecordUrl("https://github.com/other/repository/issues/31"), null);
  assert.equal(normalizeEngineeringRecordUrl("https://github.com/idrissenayat/federal-bd-platform/blob/main/README.md"), null);
});

test("restores an explicitly named GitHub issue from an existing description", () => {
  assert.equal(
    engineeringRecordFromDescription("GitHub issue #31 is the durable record."),
    "https://github.com/idrissenayat/federal-bd-platform/issues/31",
  );
  assert.equal(
    engineeringRecordFromDescription("Continue the work tracked in GitHub PR #40."),
    "https://github.com/idrissenayat/federal-bd-platform/pull/40",
  );
  assert.equal(engineeringRecordFromDescription("No durable record has been selected."), null);
});
