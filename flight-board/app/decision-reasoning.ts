type GateItem = {
  key: string;
  title: string;
  gate: string;
};

type GateFinding = {
  severity: "blocker" | "should-fix" | "note";
  title: string;
  detail: string;
  action: string;
};

type GateReview = {
  summary: string;
  findings: GateFinding[];
  evidence_revision: string | null;
  evidence_sha256: string | null;
};

function approvalBoundary(gate: string) {
  if (/gate 1/i.test(gate)) return "This approval authorizes Exam design only; it does not authorize credentials, implementation, release, or a later gate.";
  if (/gate 2/i.test(gate)) return "This approval authorizes implementation only against the signed brief and exam; it does not authorize release or Gate 3.";
  if (/gate 3/i.test(gate)) return "This approval applies only to the exact verified release artifact and does not authorize a later revision.";
  return "This approval applies only to the exact evidence reviewed for this ruling.";
}

export function buildApprovalReasoningDraft(item: GateItem, review: GateReview) {
  const gate = item.gate.replace(/\s+pending$/i, "");
  const revision = (review.evidence_revision ?? review.evidence_sha256 ?? "unresolved evidence").slice(0, 12);
  const blockers = review.findings.filter((finding) => finding.severity === "blocker");
  const concerns = review.findings.filter((finding) => finding.severity === "should-fix");

  if (blockers.length) {
    return [
      `The Critic Agent does not recommend approval of ${gate} for ${item.key} — ${item.title} while blocking conditions remain: ${blockers.map((finding) => finding.title).join("; ")}.`,
      "If I proceed, I must replace this AI draft with the specific evidence and named authority that resolves or explicitly accepts every blocker.",
      approvalBoundary(gate),
    ].join(" ");
  }

  return [
    `I approve ${gate} for ${item.key} — ${item.title} based on the exact linked evidence at revision ${revision}.`,
    `The current Critic Agent review found no automatic hard stop. ${review.summary.trim()}`,
    concerns.length
      ? `I considered the highlighted concern${concerns.length === 1 ? "" : "s"} (${concerns.map((finding) => finding.title).join("; ")}) and accept ${concerns.length === 1 ? "it" : "them"} as mandatory downstream controls that remain required at the named later gates.`
      : "The review identified no material concern requiring changes at this gate.",
    approvalBoundary(gate),
  ].join(" ");
}
