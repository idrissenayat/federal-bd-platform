# Fresh Critic evidence — STR-024 Gate 2 Exam

**Role:** named STEER Critic Agent, fresh context; Codex is the runtime host

**Work item:** [STR-024 / issue #52](https://github.com/idrissenayat/federal-bd-platform/issues/52)

**Review target:** Architect commit
`df0cdde2e1916062c239fa3867588a855f9b691b`

**Frozen Brief:** `steer/briefs/0024-governed-agent-execution.md` at
`5c0db389d1b0e9fa492a33930febcf4d1c067cb0`

**Supervisor-boundary comparison:** exact parallel commit
`909f438ca646ecb8e38aad2d2008c4082c6d7adb`

**Critic branch:** `codex/str024-fresh-critic-20260815204107`

**Authority boundary:** Critic evidence only. This artifact does not edit or approve the
Brief or Exam, change Gate state, authorize implementation, or approve Gate 2.

## Independent integrity and provenance checks

- The Brief is unchanged between `5c0db389d1b0e9fa492a33930febcf4d1c067cb0`
  and the Architect target: both trees use Git blob
  `57c1f496f76a2940bce09e7b2e3d84cb4f0a1aab`; both file contents have SHA-256
  `6a5dcf65e1ef6930c7964374d1aaf0220a0810c8d99022c2936c2cb1607c065c`.
- The Architect target has the frozen Brief as its direct parent and changes only the
  Exam and Architect evidence. No Brief drift was found.
- The exact supervisor-boundary commit `909f438c...` and the Architect target are
  siblings from `d9dcb533...`: `909f438c...` is **not** an ancestor of `df0cdde2...`.
  The boundary text and its linked operating-rule changes are absent from the target
  tree.
- Public issue #52 contains the authenticated owner comment for the earlier Scout
  dispatch only. It says Gate 1 is pending and forbids Exam drafting before Gate 1. No
  public Gate 1 ruling is present. The Exam and Architect evidence instead report a
  private Work Management ruling verified by the Codex supervisor, without an
  independently resolvable record.
- `git show --show-signature df0cdde2...` exposes no cryptographic commit signature.
  The commit's `STEER Architect Agent` author name/email is repository metadata, while
  the committer is the human owner. No Git attestation, note, immutable run record, or
  independently signed agent-output evidence is attached to the target.

## Findings

### BLOCKER 1 — The Exam cannot prove that the named platform agent, rather than Codex, authored the deliverable

**Evidence:** `STR024-BOOT-001` asks repository provenance and run events to
"independently agree," while `STR024-EVID-002` accepts work as agent-authored when the
assembled evidence attributes it to an agent attempt. In the proposed bootstrap, Codex
hosts the run and can produce the artifact, event stream, evidence package, and Git
author metadata. Those records therefore share one trust domain and are not independent
corroboration. `STR024-BOOT-002` tests an admitted Codex attempt, but cannot detect Codex
or a confused adapter emitting the same bytes under the named agent principal. A
display name, role prompt, run id, or forgeable commit author is not proof of execution
by a distinct principal.

**Required human/technical ruling:** Define what observable event constitutes "the
agent authored" and freeze a trust boundary that Codex cannot mint or rewrite. At
minimum, name the credential issuer, agent-scoped credential and proof-of-possession
method, key custody/non-exportability assumptions, adapter enforcement principal,
artifact/event signing or attestation format, verifier, revocation behavior, and how
mixed tool/human/supervisor edits are segmented. Add a hostile-host/confused-deputy
test that attempts to relabel Codex-created bytes as agent output and must fail at an
independently controlled verifier. Until then, the key bootstrap criterion is not
falsifiable and agent performance must not be claimed.

### BLOCKER 2 — The authority chain is neither durably verified nor revision-consistent, and the parallel operating rule widens Codex power

**Evidence:** The frozen Brief still reads `GATE 1: PENDING`, and the only public issue
evidence is the pre-Gate-1 Scout authorization. A self-report in the Exam/Architect
evidence that Codex observed a private ruling does not satisfy CORE-11 or `GATES.md`,
which require authenticated evidence bound to the exact artifact and checked sequence.
Separately, the requested normative supervisor rule exists only at parallel commit
`909f438c...`, so it cannot silently govern `df0cdde2...`.

The parallel rule also says Codex may "configure, ... evaluate, and improve agents,
their runtime, and the STEER platform" without requiring an exact authorized work item,
capability, revision, or affected-run hold. Its emergency paragraph requires human
authorization but does not require a failed/blocked agent, an exact run and intervention
scope, or an enforcement boundary for a purported "platform repair" that changes
prompts, configuration, tools, evaluation, or future output. The Exam is narrower, but
an unincorporated Exam cannot cure a broader normative operating rule on another branch.

**Required human ruling:** Publish authenticated Gate 1 evidence tied to the exact
Brief revision and sequence. Adopt any supervisor boundary through the governed,
default-closed change path and cite its exact incorporated revision. Limit ordinary
Codex supervision to enumerated non-deliverable capabilities; require exact-run,
exact-scope, time-bounded prior authorization for intervention; classify prompt,
configuration, tool-policy, evaluator, and artifact changes as deliverable-affecting;
and default-deny any ambiguous repair. Do not count the Architect artifact as evidence
that this authority chain already exists.

### BLOCKER 3 — Gate 2 would freeze placeholders and gameable measures rather than an executable Exam

**Evidence:** The Exam explicitly leaves essential values for later human selection.
Its displayed transition table is only a minimum, while its own checklist requires a
"complete" table and endpoint inventory before Gate 2. Terms such as safe boundary,
bounded retry, supported screen reader, material progress, tamper-evident, independently
agree, and complete evidence have no fixed oracle. `STR024-MET-004` also keeps replayed
dispatch requests in the outcome denominator even though `STR024-AUTH-003` maps all
replays to one run; replaying a successful authorization can inflate apparent coverage.
The 90% signal counts terminal outcomes without separately requiring useful agent
output, so fast `FAILED_BLOCKED`/`STOPPED` results can satisfy lifecycle completeness
while providing no delivery value. Versioning feedback is required, but no blind
holdout, evaluator isolation, fixture-access rule, or contamination test prevents
feedback from teaching the benchmark.

**Exact unresolved default-closed human parameters:**

- authenticated Gate 1 actor/decision/time/sequence evidence and the exact adopted
  supervisor-boundary revision;
- complete state/condition transition table, endpoint/command/webhook/consumer
  capability inventory, principal issuer and worker-authentication method, credential
  scopes/TTL/rotation/revocation, lease/heartbeat/fencing values, race precedence, safe
  stop boundary, retry classes/budget/backoff, and rate/payload limits;
- run-data field inventory, purpose, privacy classification, access roles, legal/policy
  basis, exact retention, deletion and subject/admin deletion behavior, revocation,
  export/backup treatment, audit owner, and access-review cadence;
- load assumptions and exact p95 budgets for every named operation; stale/provider/
  outbox detection thresholds; availability, RTO/RPO, reconciliation, backup/restore,
  and telemetry-completeness budgets;
- cohort id and unit of analysis, freeze timestamp/start/end rule, deduplication rule,
  numerator/denominator definitions, minimum useful-output criterion, metric-schema and
  rate-card revisions, accountable owner, and treatment of failures, replays,
  interventions, missingness, and unavailable provider fields;
- frozen benchmark and rubric fixtures, scoring oracle and thresholds, blind holdout
  and contamination policy, evaluator access/independence rules, canary scope, rollback
  trigger and owner, enabled-adapter set and portability evidence; and
- supported browser/viewport/keyboard/screen-reader matrix, live-region behavior and
  announcement limits, plus named security, privacy, accessibility, reliability, and
  design-system human owners.

**Required action:** Resolve these parameters in authenticated, immutable human
evidence before Gate 2 and bind concrete fixtures/oracles to the exact Exam revision.
Use unique authorization/run cohorts for outcome measures and separate transport replay
attempts into a guardrail denominator. Separate lifecycle-accounting success from useful
review-ready output. Freeze an evaluator-isolated holdout and contamination protocol.

## NOTES

- **Buzz versus STEER:** The Exam correctly gives Work Management authority and denies
  inbound Buzz authority. It should additionally test that the Buzz audience is
  authorized for each mirrored field and linked target, membership revocation closes
  future access, link previews cannot leak data, and delayed mirrors cannot resurrect
  revoked access.
- **Provider/model portability:** `STR024-NFR-005` can pass with only one enabled
  adapter, so it proves contract conformance rather than portability. Gate evidence
  should require either two materially different adapters/providers or explicitly
  label portability unproven and test export/migration with a deterministic fake.
- **Fresh-review independence:** Different Test/Critic run ids and role snapshots do
  not establish independent judgment when the same host, model family, prompt history,
  fixtures, or evaluator writes both records. Preserve clean-context evidence, disclose
  shared dependencies, and keep qualified human review as the assurance layer.
- **Security/privacy/reliability/accessibility coverage:** The Exam identifies the right
  domains and many important attacks and UI states. The blocker is closure and
  testability of exact values, ownership, trust boundaries, and fixtures—not absence of
  broad topic coverage.
- **Tag derivation:** For this documentation-only review target, `#security`, `#privacy`,
  `#a11y`, `#reliability`, and `#design-system` cover the apparent domains. No money
  movement, restricted-data handling, deployment, or external communication is
  authorized. Re-derive tags against the eventual implementation diff.
- The Architect correctly labels Gate 2 as pending and already reports missing
  independent review, default-closed rulings, and public Gate 1 traceability. This
  Critic independently confirms those stops and adds the attribution, cross-branch
  authority, metric-gaming, and feedback-contamination failures above.

## Validation record

- `uv run pytest -q tests/test_repository_contract.py` — PASS, 3 tests.
- `./scripts/gauntlet.sh` — PASS, 35 readiness checks, one expected missing-SAM-key
  warning, zero failures; Ruff, mypy, pytest, gitleaks, OSV, and Semgrep passed.
- `git diff --check` — PASS.
- Scope check — only this fresh Critic evidence file is added; the Brief, Exam,
  operating-model documents, implementation, app data, and gate state are unchanged.

## Recommendation

**Gate 2 readiness: BLOCK.** Do not approve or freeze the Exam. Obtain explicit human
dispositions for all three blockers, preserve the Brief unchanged, and rerun independent
Test and fresh-context Critic review against the resulting exact Exam and authority
revisions. This is a recommendation only; it is not a Gate 2 ruling.
