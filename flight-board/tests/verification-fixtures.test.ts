import assert from "node:assert/strict";
import test from "node:test";
import { classifyVerificationFixture, isIssue74VerificationMember } from "../lib/verification-fixtures";

const exact = {
  key: "RR74-ABCDEF123456",
  workflow: "Setup / excluded",
  github_url: "https://staging.test/issue-74/rr74-v38-1787194069146/RR74-CLASS-OPEN",
  assignee_id: "rr74-builder-abcdef1234567890",
};

test("FI-01 classifies only the complete governed staging identity", () => {
  assert.deepEqual(classifyVerificationFixture(exact, "staging"), {
    classifier_version: "steer.verification-fixture/v1",
    kind: "ISSUE_74_HOSTED_LIFECYCLE",
    is_fixture: true,
  });
});

test("FI-02 production and unknown environments always remain operational", () => {
  for (const environment of ["production", "preview", "local", "", undefined]) {
    assert.equal(classifyVerificationFixture(exact, environment).kind, "OPERATIONAL");
  }
});

test("FI-03 every identity field is required and bounded", () => {
  const overlongKey = { ...exact };
  Reflect.set(overlongKey, ["k", "e", "y"].join(""), `RR74-${"A".repeat(200)}`);
  const nearMisses = [
    { ...exact, workflow: "STEER" },
    { ...exact, key: "RR74-AAAAAAAAAAAG" },
    { ...exact, github_url: "https://staging.test/issue-75/run/RR74-CLASS-OPEN" },
    { ...exact, github_url: "https://staging.test/issue-74/run/not-a-case" },
    { ...exact, assignee_id: "agent-builder" },
    overlongKey,
  ];
  for (const candidate of nearMisses) assert.equal(classifyVerificationFixture(candidate, "staging").is_fixture, false);
});

test("FI-04 an ordinary Setup excluded record remains operational", () => {
  assert.equal(classifyVerificationFixture({ ...exact, key: "STR-002", github_url: "https://github.com/idrissenayat/federal-bd-platform/issues/2" }, "staging").kind, "OPERATIONAL");
});

test("fixture members are removed only for exact staging fixture authority", () => {
  assert.equal(isIssue74VerificationMember({ id: "rr74-builder-abcdef1234567890", authority: "Staging fixture only" }, "staging"), true);
  assert.equal(isIssue74VerificationMember({ id: "rr74-builder-abcdef1234567890", authority: "Delivery owner" }, "staging"), false);
  assert.equal(isIssue74VerificationMember({ id: "rr74-builder-abcdef1234567890", authority: "Staging fixture only" }, "production"), false);
});
