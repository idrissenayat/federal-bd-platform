# Issue #77 owner-only staging verification

**Result:** PASS for implementation and owner-only staging verification. This record does not authorize merge, production deployment, Release, closure, or Gate 3.

**Completed:** 2026-08-20T14:58:00Z

## Exact authority and target

- Gate 1 Brief revision: `6a0c6efec80e788c86ed90b9da2f31202d39e26e`
- Gate 1 Brief SHA-256: `958f75721c610f5e21f80a4d1892fc802bc98952abadcf1911660838c3502386`
- Gate 2 Exam revision: `c2983ef41027ecbc893262bdeca1c9aa7650b477`
- Gate 2 Exam SHA-256: `5b4096abd78806bdd45a180c3a7ae4f46171f52e827c2a4985659c95c8d80930`
- Exact implementation revision: `bfb2178cfee32d3667c7a188209f4c7d83db5d65`
- Staging Sites version: 42, `appgprj_6a83763dc1148191b439c0795aa86a1c~appgver_731519c3617c819184fffbbb33e749d4`
- Final candidate deployment: `appgdep_6a87172f17b08191a4fde152edbc246d`
- Staging environment-set revision: 28

The canonical staging project remained custom owner-only: one owner, zero groups, and zero external visitors.

## Implementation result

The server-owned `steer.verification-fixture/v1` classifier partitions the complete issue #74 fixture identity only in staging. Normal work-management surfaces receive operational items and bounded operational history. The staging-only Verification Evidence surface receives the classified fixture register. Detailed review, decision, readiness, receipt, activity, notification, and economics evidence is loaded only when a reviewer opens one classified fixture.

The on-demand evidence endpoint is authenticated, POD-scoped, staging-authoritative, bounded per evidence family, and rejects operational or production records. No schema, migration, dependency, secret, external call, browser-stored classifier state, or persistence rewrite was introduced.

## Reconciliation

| Observation | Exact pre-change v38 | Restored candidate v41 |
|---|---:|---:|
| Normal Human Decisions | 106 | 0 |
| Normal WIP | 460 | 8 |
| Verification Evidence total | absent | 452 |
| Pending fixture rulings preserved | 106 in normal decisions | 106 in evidence |
| Other classified fixtures preserved | mixed into normal work | 346 in evidence |
| Genuine pending rulings | 0 | 0 |

The candidate evidence register rendered 452 cards with 452 unique fixture keys: 106 `Needed now` or `Resubmitted` fixtures and 346 decided fixtures. The operational Backlog rendered no `RR74-` fixture key. The evidence copy states “Preserved, not operational” and “Nothing was deleted or rewritten.”

Search for `RR74-B5E6E9A6B62B` returned exactly one record. Its read-only drawer loaded the existing signed Critic PASS, three immutable rulings, READY snapshot `ed5692e81af6…`, EFFECTIVE receipt, decision intent, latest event SHA-256, and three activity rows. Opening the drawer created no decision, readiness, or work mutation.

## Rollback and restore

1. Candidate v41 was deployed and reconciled; final contrast-only candidate v42 preserved the same partition and server behavior.
2. Exact pre-change staging version 38, `appgprj_6a83763dc1148191b439c0795aa86a1c~appgver_17fba91296708191b81550aa894e7394`, was deployed as `appgdep_6a87154fba2c81918c371169c6618841`.
3. The prior presentation deterministically returned: no Verification Evidence destination, Human Decisions 106, WIP 460, and the issue #74 fixture as the next decision target.
4. Exact candidate v41 was restored as `appgdep_6a8715b975a08191966fe9e7442d1d1b`, then contrast-only v42 was deployed as `appgdep_6a87172f17b08191a4fde152edbc246d`.
5. The clean partition deterministically returned: Verification Evidence 452, Human Decisions 0, WIP 8, and no fixture decision target.
6. The restored representative drawer exposed the same readiness snapshot, receipt, intent, event hash, rulings, and activity as before rollback. The complete 452-key register and its 106/346 status partition were unchanged.

Only bounded read telemetry was appended by these observations. No fixture, ruling, review, readiness, intent, receipt, activity, economics, or notification row was edited or deleted.

## Performance

The pure classifier processed a 500-item population in 100 local runs with p95 `0.077 ms` and maximum `0.530 ms`, below the 50 ms p95 budget.

Cloudflare Worker logs provide the same-environment authenticated-bootstrap sample. Each set discarded its first post-deployment warm-up request:

- exact pre-change v38 stable wall times: `5288, 5372, 5239, 5167, 5193 ms`; p95 `5372 ms`;
- exact final candidate v42 stable wall times: `1422, 1175, 1050, 1239, 1151 ms`; p95 `1422 ms`.

The candidate reduced hosted bootstrap p95 by 73.5%, so it does not exceed the permitted 10% regression. Candidate stable CPU time was 43–54 ms. The evidence view renders only fixture summaries eagerly; all bounded lifecycle collections are fetched on drawer open. The representative hosted lazy-evidence request completed in 337 ms wall / 6 ms CPU.

## Accessibility and interaction

- Local JSDOM/axe structural checks passed for populated, empty, and filtered-empty evidence states at a 320 px container and CSS zoom 2, with no serious or critical finding. JSDOM color contrast is disabled; a separate deterministic WCAG calculation covers every new text/control pair.
- The exact contrast matrix passes AA at or above 4.5:1. Staging inspection found and corrected two borderline tokens before the final candidate: small muted evidence text is now 4.68:1 and the primary evidence control is 4.56:1.
- Existing governed-dialog regression coverage proves initial focus, Tab containment, Escape, and opener restoration.
- Agent-operated hosted keyboard verification confirmed initial drawer focus on Close, Shift+Tab remaining inside the dialog, Escape closure, and return to the evidence register.
- Agent-operated real Chrome zoom was reset to 100%, increased to exactly 200%, and checked for both the populated register and full drawer. Text, labels, status copy, search, fixture card, Inspect control, Close control, review, and lifecycle evidence remained readable and operable; navigation overflowed into its existing horizontal scroll behavior rather than clipping content.
- Register screenshot: `steer/evidence/0077-staging-200-percent-register.jpeg`, SHA-256 `2fdf905af2ca3141e76f40d3df8b78e1798fd3e1936bd55226d24988c5810b8b`.
- Drawer screenshot: `steer/evidence/0077-staging-200-percent-drawer.jpeg`, SHA-256 `138268b42ce2f7d72c74df3be95f637d411b3238e3ea881e462b90864f294388`.
- Chrome was restored to 100% after the check.

## Verification commands

- `npm run build` — PASS
- `npm run typecheck` — PASS
- `npm run lint` — PASS
- `npm test` — PASS, 155/155
- `bash scripts/gauntlet.sh` — PASS: 16/16 pytest, gitleaks, OSV, Semgrep 494 rules / 258 files / 0 findings; one disclosed non-blocking local SAM.gov-credential warning

## Production boundary

Production remained untouched throughout implementation, rollback, restore, and interaction verification:

- project: `appgprj_6a7ce092d7608191b97e3becd405c373`;
- latest version: 36;
- live URL: `https://steer-flight-board.idriss-enayat.chatgpt.site`;
- environment/table inventory: unchanged at 34 tables, with no issue #74 readiness or issue #77 fixture-partition stores;
- access: one owner, zero groups, zero external visitors.

No PR, merge, production deployment, Release, closure, Gate 3 action, or independent Critic ruling was performed.
