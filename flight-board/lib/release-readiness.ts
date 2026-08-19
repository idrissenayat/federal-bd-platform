import { canonicalJson, sha256Hex } from "./dispatch-lifecycle";

export const RISK_POLICY_VERSION = 1;

export const DEFAULT_CLOSED_CODES = [
  "AUTHN_AUTHZ_SESSION",
  "MONEY_MOVEMENT",
  "PERSONAL_DATA_NEW_USE",
  "DESTRUCTIVE_DATA",
  "MASS_COMMUNICATION",
  "GOVERNANCE_CONTROL",
  "CRITIC_BLOCK_OVERRIDE",
] as const;

export const ELEVATED_CODES = [
  "NONDESTRUCTIVE_PERSISTENCE",
  "EXTERNAL_PROVIDER",
  "AVAILABILITY_INFRA",
  "SECURITY_NON_AUTH",
  "PRIVACY_NO_NEW_DATA",
  "LEGAL_CLAIM",
  "ACCESSIBILITY_UI",
  "COST_NON_CHARGE",
] as const;

export type DefaultClosedRiskCode = typeof DEFAULT_CLOSED_CODES[number];
export type ElevatedRiskCode = typeof ELEVATED_CODES[number];
export type RiskCode = DefaultClosedRiskCode | ElevatedRiskCode | "NONE";
export type RiskTier = "DEFAULT_OPEN" | "ELEVATED" | "DEFAULT_CLOSED";
export type SatisfactionPath = "TIME" | "QUALIFIED_HUMAN" | "QUALIFIED_TEAM";
export type ReadinessStatus = "NOT_READY" | "READY" | "INVALIDATED";

export type RiskClassification = {
  tier: RiskTier;
  codes: RiskCode[];
  errors: string[];
  delay_hours: 0 | 4 | 24;
};

export type ReleaseReadinessSnapshot = {
  schema: "steer.gate-readiness-snapshot/v1";
  snapshot_id: string;
  work_item_id: number;
  work_item_key: string;
  work_item_updated_at: string;
  pod_id: string;
  brief_commit: string;
  brief_sha256: string;
  exam_commit: string;
  exam_sha256: string;
  implementation_commit: string;
  build_sha256: string;
  migration_set_sha256: string;
  runtime_policy_sha256: string;
  verification_receipt_id: string;
  verification_receipt_sha256: string;
  verification_completed_at: string;
  critic_review_id: number;
  critic_target_revision: string;
  critic_recommendation: string;
  evidence_set_sha256: string;
  declared_risk_codes: RiskCode[];
  derived_risk_codes: RiskCode[];
  resolved_risk_codes: RiskCode[];
  classification_errors: string[];
  tier: RiskTier;
  risk_policy_version: number;
  operating_mode: "SOLO_CALIBRATION" | "TEAM";
  satisfaction_path: SatisfactionPath;
  delay_hours: 0 | 4 | 24;
  required_roles: string[];
  effective_not_before: string;
  created_by: string;
  created_at: string;
  predecessor_snapshot_sha256: string | null;
};

const allCodes = new Set<string>([...DEFAULT_CLOSED_CODES, ...ELEVATED_CODES, "NONE"]);

function canonicalCodes(codes: RiskCode[]) {
  return [...new Set(codes)].sort() as RiskCode[];
}

export function parseRiskCodes(value: unknown): { codes: RiskCode[]; errors: string[] } {
  if (!Array.isArray(value) || value.length === 0 || value.length > 32) {
    return { codes: [], errors: ["RISK_CODES_MISSING_OR_MALFORMED"] };
  }
  if (value.some((entry) => typeof entry !== "string" || entry.length > 64)) return { codes: [], errors: ["RISK_CODES_MISSING_OR_MALFORMED"] };
  const raw = value.map((entry) => String(entry));
  const unknown = raw.filter((entry) => !allCodes.has(entry));
  if (unknown.length) return { codes: [], errors: ["RISK_CODE_UNKNOWN"] };
  const codes = canonicalCodes(raw as RiskCode[]);
  if (codes.includes("NONE") && codes.length > 1) return { codes: [], errors: ["RISK_CODE_NONE_CONFLICT"] };
  return { codes, errors: [] };
}

export function classifyRiskCodes(declaredValue: unknown, derivedValue: unknown): RiskClassification {
  const declared = parseRiskCodes(declaredValue);
  const derived = parseRiskCodes(derivedValue);
  const errors = [...declared.errors, ...derived.errors];
  if (!errors.length && canonicalJson(declared.codes) !== canonicalJson(derived.codes)) errors.push("DECLARED_DERIVED_RISK_MISMATCH");
  if (errors.length) return { tier: "DEFAULT_CLOSED", codes: canonicalCodes([...declared.codes, ...derived.codes].filter((code) => code !== "NONE")), errors: [...new Set(errors)].sort(), delay_hours: 24 };
  const codes = canonicalCodes([...declared.codes, ...derived.codes]);
  if (codes.some((code) => (DEFAULT_CLOSED_CODES as readonly string[]).includes(code))) return { tier: "DEFAULT_CLOSED", codes, errors: [], delay_hours: 24 };
  if (codes.some((code) => (ELEVATED_CODES as readonly string[]).includes(code))) return { tier: "ELEVATED", codes, errors: [], delay_hours: 4 };
  return { tier: "DEFAULT_OPEN", codes: ["NONE"], errors: [], delay_hours: 0 };
}

export function validateSatisfactionPath(classification: RiskClassification, operatingMode: string, path: string) {
  if (!['SOLO_CALIBRATION', 'TEAM'].includes(operatingMode)) return "OPERATING_MODE_INVALID";
  if (!['TIME', 'QUALIFIED_HUMAN', 'QUALIFIED_TEAM'].includes(path)) return "SATISFACTION_PATH_INVALID";
  if (classification.tier === "DEFAULT_OPEN" && path !== "TIME") return "DEFAULT_OPEN_REQUIRES_TIME_PATH";
  if (classification.tier === "ELEVATED" && !['TIME', 'QUALIFIED_HUMAN'].includes(path)) return "ELEVATED_PATH_INVALID";
  if (classification.tier === "DEFAULT_CLOSED" && operatingMode === "SOLO_CALIBRATION" && path !== "TIME") return "DEFAULT_CLOSED_SOLO_REQUIRES_TIME_PATH";
  if (classification.tier === "DEFAULT_CLOSED" && operatingMode === "TEAM" && path !== "QUALIFIED_TEAM") return "DEFAULT_CLOSED_TEAM_REQUIRES_TEAM_PATH";
  return null;
}

export function effectiveNotBefore(verifiedAt: string, delayHours: number) {
  const verified = Date.parse(verifiedAt);
  if (!Number.isFinite(verified)) throw new Error("VERIFICATION_TIME_INVALID");
  return new Date(verified + delayHours * 60 * 60 * 1000).toISOString();
}

export async function releaseReadinessDigest(value: unknown) {
  return sha256Hex(canonicalJson(value));
}

export function requiredRolesFor(codes: RiskCode[], tier: RiskTier) {
  const roles = new Set<string>(["Product Lead", "Tech Lead"]);
  if (codes.some((code) => ["AUTHN_AUTHZ_SESSION", "SECURITY_NON_AUTH", "EXTERNAL_PROVIDER", "CRITIC_BLOCK_OVERRIDE"].includes(code))) roles.add("Security Owner");
  if (codes.some((code) => ["PERSONAL_DATA_NEW_USE", "PRIVACY_NO_NEW_DATA"].includes(code))) roles.add("Privacy Owner");
  if (codes.includes("LEGAL_CLAIM")) roles.add("Legal Owner");
  if (codes.includes("ACCESSIBILITY_UI")) roles.add("Product Designer");
  if (codes.some((code) => ["DESTRUCTIVE_DATA", "NONDESTRUCTIVE_PERSISTENCE", "AVAILABILITY_INFRA"].includes(code))) roles.add("Platform / Ops Lead");
  if (codes.some((code) => ["MONEY_MOVEMENT", "COST_NON_CHARGE"].includes(code))) roles.add("Finance Owner");
  if (tier === "ELEVATED") return [...roles].filter((role) => !["Product Lead", "Tech Lead"].includes(role)).sort();
  return [...roles].sort();
}

export function readinessStatus(input: {
  snapshot: ReleaseReadinessSnapshot;
  now: string;
  currentCandidateSha256: string;
  currentCriticReviewId: number;
  signatures: Array<{ member_id: string; role: string; status: string }>;
}) {
  if (input.currentCandidateSha256 !== input.snapshot.evidence_set_sha256 || input.currentCriticReviewId !== input.snapshot.critic_review_id) {
    return { status: "INVALIDATED" as const, reason: "CANDIDATE_OR_CRITIC_DRIFT", missing_roles: input.snapshot.required_roles };
  }
  if (input.snapshot.classification_errors.length) return { status: "NOT_READY" as const, reason: input.snapshot.classification_errors[0], missing_roles: input.snapshot.required_roles };
  if (input.snapshot.satisfaction_path === "TIME") {
    const ready = Date.parse(input.now) >= Date.parse(input.snapshot.effective_not_before);
    return { status: ready ? "READY" as const : "NOT_READY" as const, reason: ready ? "TIME_PATH_SATISFIED" : "COOLING_PERIOD_ACTIVE", missing_roles: [] };
  }
  const valid = input.signatures.filter((signature) => signature.status === "ACCEPTED");
  const distinct = new Set(valid.map((signature) => signature.member_id));
  const missing = input.snapshot.required_roles.filter((role) => !valid.some((signature) => signature.role === role));
  const minimumHumans = input.snapshot.satisfaction_path === "QUALIFIED_TEAM" ? 2 : 1;
  const ready = missing.length === 0 && distinct.size >= minimumHumans;
  return { status: ready ? "READY" as const : "NOT_READY" as const, reason: ready ? "QUALIFIED_HUMAN_PATH_SATISFIED" : "QUALIFIED_HUMAN_REQUIRED", missing_roles: missing };
}

export const RELEASE_READINESS_POLICY_V1 = {
  schema: "steer.release-readiness-policy/v1",
  version: RISK_POLICY_VERSION,
  delays_hours: { DEFAULT_OPEN: 0, ELEVATED: 4, DEFAULT_CLOSED: 24 },
  default_closed_codes: [...DEFAULT_CLOSED_CODES],
  elevated_codes: [...ELEVATED_CODES],
  role_rules: {
    Security_Owner: ["AUTHN_AUTHZ_SESSION", "SECURITY_NON_AUTH", "EXTERNAL_PROVIDER", "CRITIC_BLOCK_OVERRIDE"],
    Privacy_Owner: ["PERSONAL_DATA_NEW_USE", "PRIVACY_NO_NEW_DATA"],
    Legal_Owner: ["LEGAL_CLAIM"],
    Product_Designer: ["ACCESSIBILITY_UI"],
    Platform_Ops_Lead: ["DESTRUCTIVE_DATA", "NONDESTRUCTIVE_PERSISTENCE", "AVAILABILITY_INFRA"],
    Finance_Owner: ["MONEY_MOVEMENT", "COST_NON_CHARGE"],
  },
  path_rules: {
    DEFAULT_OPEN: ["TIME"],
    ELEVATED: ["TIME", "QUALIFIED_HUMAN"],
    DEFAULT_CLOSED_SOLO_CALIBRATION: ["TIME"],
    DEFAULT_CLOSED_TEAM: ["QUALIFIED_TEAM"],
  },
  unknown_or_mismatch: "DEFAULT_CLOSED",
  automatic_ripening: false,
} as const;
