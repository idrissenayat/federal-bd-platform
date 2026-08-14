import assert from "node:assert/strict";
import test from "node:test";
import { nextWorkItemKey } from "../worker/api";

test("generates a key after the highest existing STR suffix instead of the row id", () => {
  assert.equal(nextWorkItemKey(["STR-001", "STR-009", "STR-010", "STR-014"]), "STR-015");
});

test("ignores nonconforming keys without reusing a valid key", () => {
  assert.equal(nextWorkItemKey(["STR-002", "STR-010-draft", "OTHER-999"]), "STR-003");
});

test("starts at STR-001 and preserves suffixes wider than three digits", () => {
  assert.equal(nextWorkItemKey([]), "STR-001");
  assert.equal(nextWorkItemKey(["STR-999"]), "STR-1000");
});
