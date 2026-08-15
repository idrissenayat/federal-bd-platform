# STR-024 Gate 1 exact-revision receipt — awaiting human countersignature

**Status:** `PENDING_PLATFORM_EXPORT_AND_HUMAN_COUNTERSIGNATURE`
**Purpose:** reconcile the authoritative STEER Work Management ruling with
`GATES.md`/`SOLO-MODE.md` exact-revision and in-file signature requirements
**Not authority:** this unsigned template is not a Gate 1 or Gate 2 ruling and must not
be cited as an approval

## Exact approved content target

- Work item: `STR-024`
- Brief commit:
  `5c0db389d1b0e9fa492a33930febcf4d1c067cb0`
- Brief Git blob: `57c1f496f76a2940bce09e7b2e3d84cb4f0a1aab`
- Brief SHA-256:
  `6a5dcf65e1ef6930c7964374d1aaf0220a0810c8d99022c2936c2cb1607c065c`
- Substantive-body SHA-256, defined as the exact file bytes before the first line that
  begins `GATE 1:` (including the preceding `---` and LF):
  `cf6e63a869375415ba4013c675bf99a0cf298e19e8db46a3cd26680f8ffadc1a`
- Workflow: `STEER` (frozen)
- Recorded approver: Idriss Enayat
- Recorded role: Product Lead / authenticated human owner
- Recorded ruling time: `2026-08-15T16:22-04:00`
- Recorded scope: Exam design only; no credential, implementation, release, or later
  gate authority

The Codex supervisor reports that the authenticated Work Management activity trail
contains Idriss Enayat's approval against the exact linked Brief revision. That
supervisor report is provenance for preparing this template, not an independently
exportable receipt or human countersignature.

## Required Work Management export

The platform owner must export one canonical signed receipt containing all fields below.
`PENDING` means the field is absent and the receipt is not effective; no agent may fill
it from inference.

| Field | Required value/status |
|---|---|
| Receipt schema | `steer.gate-receipt.v1` |
| Work Management event id | `PENDING_PLATFORM_EXPORT` |
| Work Management monotonic sequence | `PENDING_PLATFORM_EXPORT` |
| Work item / gate | `STR-024` / `GATE_1` |
| Actor id / authenticated account / role | `PENDING_PLATFORM_EXPORT` — must resolve to Idriss Enayat / Product Lead |
| Decision / effective time | `APPROVED` / `2026-08-15T16:22-04:00` |
| Approved Brief commit/blob/SHA-256 | exact three values above |
| Substantive-body SHA-256 | exact value above |
| Decision text digest | `PENDING_PLATFORM_EXPORT` |
| Previous gate event/sequence | `PENDING_PLATFORM_EXPORT` |
| Review session id / Brief-authoring session id | `PENDING_PLATFORM_EXPORT` — must prove different sessions |
| Solo cooling-off/batch check | `PENDING_PLATFORM_EXPORT` — no other gate for STR-024 and no more than two signatures in that session |
| Export time / issuer / key id | `PENDING_PLATFORM_EXPORT` |
| Canonical receipt SHA-256 / signature | `PENDING_PLATFORM_EXPORT` |
| Public-key verification result | `PENDING_PLATFORM_EXPORT` |

The signature covers canonical receipt bytes and all fields above. The issuer is the
Work Management gate-event service, not Codex, an agent, Buzz, or Git metadata. CORE-11
verification must bind the authenticated actor, role, artifact revision, decision,
sequence and time and must reject a changed body hash, unknown key, invalid signature,
replay, sequence mismatch, same writing/signing session, same-item batched gate or
over-limit signature session.

## Required human countersignature

After verifying the platform signature and rereading the exact Brief, Idriss Enayat must
commit or approve this receipt through an authenticated repository action. The intended
line is shown below but remains deliberately unsigned:

```text
GATE 1 RECEIPT COUNTERSIGNATURE: PENDING — required from Idriss Enayat after platform receipt verification
```

The countersignature record must replace that line with:

```text
GATE 1 RECEIPT COUNTERSIGNATURE: VERIFIED — <ISO timestamp> — IE / Idriss Enayat — <authenticated account> — <canonical receipt SHA-256>
```

It confirms an earlier authoritative ruling; it does not backdate a new decision or
authorize Gate 2.

## Existing-policy-compliant in-file audit note

A detached receipt alone does not satisfy the current `GATES.md` and `SOLO-MODE.md`
requirement that the Brief file contain the Gate 1 signature line. After platform export
and human countersignature, an authenticated human-authorized **signature-only Brief
descendant** must replace only the existing `GATE 1:` and `GATE 1 EVIDENCE:` lines with:

```text
GATE 1: APPROVED — 2026-08-15T16:22-04:00 — IE
GATE 1 EVIDENCE: <immutable URL to the countersigned receipt commit> — Work Management receipt <event-id>/<canonical-receipt-sha256>
```

The authorized recorder must prove:

1. exact commit `5c0db389...` is an ancestor and the Brief diff from that commit to the
   signature-only commit changes only the Gate 1 audit-note/evidence lines;
2. the substantive-body SHA-256 remains
   `cf6e63a869375415ba4013c675bf99a0cf298e19e8db46a3cd26680f8ffadc1a`;
3. only the Gate 1 audit-note/evidence lines changed—no Brief substance, tags, scope,
   measurement, exclusions, risks, or design intent changed;
4. the authenticated human authorization and required CI/CORE-11 sequence checks pass;
   and
5. the signature-only descendant is not authored or approved by the Builder and does
   not imply Gate 2.

This Architect run does not perform that human-only signature action and leaves the
frozen Brief byte-identical.
