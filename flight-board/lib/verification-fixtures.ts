export const VERIFICATION_FIXTURE_CLASSIFIER_VERSION = "steer.verification-fixture/v1" as const;

export type VerificationFixtureKind = "ISSUE_74_HOSTED_LIFECYCLE" | "OPERATIONAL";

export type VerificationFixtureClassification = {
  classifier_version: typeof VERIFICATION_FIXTURE_CLASSIFIER_VERSION;
  kind: VerificationFixtureKind;
  is_fixture: boolean;
};

type FixtureCandidate = {
  key?: unknown;
  workflow?: unknown;
  github_url?: unknown;
  assignee_id?: unknown;
};

const issue74Key = /^RR74-[A-F0-9]{12}$/;
const issue74Url = /^https:\/\/staging\.test\/issue-74\/[a-z0-9][a-z0-9._:-]{2,79}\/RR74-[A-Z0-9-]{3,50}$/;
const issue74Builder = /^rr74-builder-[a-f0-9]{16}$/;

function bounded(value: unknown, maximum: number) {
  const text = typeof value === "string" ? value : "";
  return text.length <= maximum ? text : "";
}

export function classifyVerificationFixture(candidate: FixtureCandidate, environment: unknown): VerificationFixtureClassification {
  const matches = environment === "staging"
    && bounded(candidate.workflow, 64) === "Setup / excluded"
    && issue74Key.test(bounded(candidate.key, 64))
    && issue74Url.test(bounded(candidate.github_url, 512))
    && issue74Builder.test(bounded(candidate.assignee_id, 128));
  return {
    classifier_version: VERIFICATION_FIXTURE_CLASSIFIER_VERSION,
    kind: matches ? "ISSUE_74_HOSTED_LIFECYCLE" : "OPERATIONAL",
    is_fixture: matches,
  };
}

export function isIssue74VerificationMember(candidate: { id?: unknown; authority?: unknown }, environment: unknown) {
  if (environment !== "staging") return false;
  const id = bounded(candidate.id, 128);
  const authority = bounded(candidate.authority, 128);
  return (/^rr74-(?:builder-[a-f0-9]{16}|human-[a-z0-9-]{3,64}|fixture-(?:critic|verifier))$/.test(id))
    && /(?:staging fixture|issue #74 staging fixture)/i.test(authority);
}
