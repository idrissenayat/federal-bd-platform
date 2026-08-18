import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { dispatchPublicKey, signSchnorrBinding } from "../lib/dispatch-lifecycle";
import { reviewManifestSha256, type ReviewTarget } from "../lib/review-lifecycle";

const expectedVerifierPublicKey = "692f22559c40755774615c070956134867995f07f54c1f2507b905d3b9bb0a52";
const repositoryRoot = resolve(import.meta.dirname, "../..");
const packetPath = resolve(repositoryRoot, "steer/evidence/0028-gate-3-review-target.json");
const oid = process.argv[2];
const privateKey = process.env.STR028_TEST_AGENT_PRIVATE_KEY;

if (!/^[0-9a-f]{40}$/.test(oid ?? "")) throw new Error("Pass the exact SHA-1 commit OID.");
if (!privateKey || dispatchPublicKey(privateKey) !== expectedVerifierPublicKey) throw new Error("The enrolled Test Agent private key is unavailable or does not match its public key.");

const previous = JSON.parse(await readFile(packetPath, "utf8")) as {
  target: ReviewTarget;
  prior_binding_digests: string[];
};
const paths = previous.target.target_artifacts.map((artifact) => artifact.path);
const commit = execFileSync("git", ["cat-file", "commit", oid], { cwd: repositoryRoot });
const commitSize = Number(execFileSync("git", ["cat-file", "-s", oid], { cwd: repositoryRoot, encoding: "utf8" }).trim());
const targetBase = {
  target_git_object_format: "sha1" as const,
  target_git_commit_oid: oid,
  target_commit_object_sha256: createHash("sha256").update(Buffer.concat([Buffer.from(`commit ${commitSize}\0`), commit])).digest("hex"),
  target_artifacts: paths.map((path) => {
    const bytes = execFileSync("git", ["show", `${oid}:${path}`], { cwd: repositoryRoot });
    return {
      path,
      url: `https://github.com/idrissenayat/federal-bd-platform/blob/${oid}/${path}`,
      size_bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  }),
};
const target = { ...targetBase, target_artifact_manifest_sha256: await reviewManifestSha256(targetBase) };
const receipt = {
  schema: "steer-target-verification/v1" as const,
  target,
  verified_at: new Date().toISOString(),
  verification_method: "git-cat-file-and-sha256-bytes" as const,
  verifier_member_id: "agent-test",
  verifier_key_id: "buzz-roster-v3:test",
  verifier_key_version: 3,
};
const { signature } = await signSchnorrBinding(receipt, privateKey);
await writeFile(packetPath, `${JSON.stringify({ stage: "GATE_3_BUILD", target, target_verification: { receipt, signature }, prior_binding_digests: previous.prior_binding_digests }, null, 2)}\n`);
console.log(JSON.stringify({ oid, target_artifact_manifest_sha256: target.target_artifact_manifest_sha256, target_commit_object_sha256: target.target_commit_object_sha256, artifact_count: target.target_artifacts.length, verifier_public_key: expectedVerifierPublicKey }));
