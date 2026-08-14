import assert from "node:assert/strict";
import test from "node:test";
import { buildApprovalReasoningDraft, recommendGateDecision } from "../app/decision-reasoning";

const item = {
  key: "STR-015",
  title: "Governed multi-model Model Fabric",
  gate: "Gate 1 pending",
};

test("drafts editable approval reasoning from the exact Critic review", () => {
  const draft = buildApprovalReasoningDraft(item, {
    summary: "No automatic hard stop was found, but one material concern should shape the human review.",
    findings: [{
      severity: "should-fix",
      title: "Default-closed controls apply",
      detail: "Named authority and cooling-off evidence are required.",
      action: "Confirm the controls are planned.",
    }],
    evidence_revision: "6ad380ec2d5fd8ffe7ff74c4a037802e6a9a9148",
    evidence_sha256: "evidence-hash",
  });

  assert.match(draft, /I approve Gate 1/);
  assert.match(draft, /STR-015/);
  assert.match(draft, /6ad380ec2d5f/);
  assert.match(draft, /Default-closed controls apply/);
  assert.match(draft, /Exam design only/);
  assert.match(draft, /does not authorize credentials, implementation, release, or a later gate/);
});

test("warns the human instead of presenting blocker approval as recommended", () => {
  const draft = buildApprovalReasoningDraft(item, {
    summary: "A blocking condition remains.",
    findings: [{
      severity: "blocker",
      title: "Evidence revision is unresolved",
      detail: "The ruling cannot be bound to exact evidence.",
      action: "Attach an immutable revision.",
    }],
    evidence_revision: null,
    evidence_sha256: "evidence-hash",
  });

  assert.match(draft, /does not recommend approval/i);
  assert.match(draft, /Evidence revision is unresolved/);
  assert.match(draft, /replace this AI draft/i);
});

test("recommends approval when exact reviewed evidence has no blocker", () => {
  const recommendation = recommendGateDecision({
    summary: "No automatic hard stop was found, but one concern should shape human review.",
    findings: [{
      severity: "should-fix",
      title: "Default-closed controls apply",
      detail: "Cooling-off evidence is required later.",
      action: "Retain the downstream control.",
    }],
    evidence_revision: "6ad380ec2d5fd8ffe7ff74c4a037802e6a9a9148",
    evidence_sha256: "evidence-hash",
  });

  assert.equal(recommendation.action, "APPROVED");
  assert.equal(recommendation.label, "AI recommends Approve");
  assert.match(recommendation.reason, /no blocking condition/i);
  assert.match(recommendation.reason, /1 should-fix concern/i);
});

test("recommends changes when a blocker remains or exact evidence is unresolved", () => {
  const blockerRecommendation = recommendGateDecision({
    summary: "A blocking condition remains.",
    findings: [{
      severity: "blocker",
      title: "Evidence revision is unresolved",
      detail: "The ruling cannot be bound to exact evidence.",
      action: "Attach an immutable revision.",
    }],
    evidence_revision: "revision",
    evidence_sha256: "evidence-hash",
  });
  assert.equal(blockerRecommendation.action, "CHANGES_REQUESTED");
  assert.equal(blockerRecommendation.label, "AI recommends Request changes");
  assert.match(blockerRecommendation.reason, /Evidence revision is unresolved/);

  const unresolvedRecommendation = recommendGateDecision({
    summary: "No finding was visible.",
    findings: [],
    evidence_revision: null,
    evidence_sha256: null,
  });
  assert.equal(unresolvedRecommendation.action, "CHANGES_REQUESTED");
  assert.match(unresolvedRecommendation.reason, /exact evidence/i);
});
