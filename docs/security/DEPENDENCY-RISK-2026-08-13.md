# Dependency risk review — 2026-08-13

**Scope:** `flight-board/package-lock.json` after the first public Work Management merge
**Status:** accepted temporarily for an experimental/pre-1.0 source distribution; not a
production security certification
**Review by:** 2026-08-27 or immediately when an upstream compatible fix is published
**Follow-up:** [GitHub issue 22](https://github.com/idrissenayat/federal-bd-platform/issues/22)

## Result

- `npm audit --omit=dev`: **0 vulnerabilities** in production dependencies.
- Full `npm audit`: **6 development/build dependency nodes** — 2 high and 4 moderate.
- Safe direct and transitive updates removed 14 vulnerable nodes from the initial local
  audit and preserved a passing build, lint, render test, and authorization test suite.

## Remaining advisories

| Chain | Severity | Exposure | Current upstream path |
|---|---|---|---|
| `vinext → image-size` | 2 high advisories | Crafted ICNS, JXL, or HEIF input can loop during a development/build-time image parse | npm offers only an incompatible `vinext` downgrade; no compatible patched parser is available in the resolved chain |
| `drizzle-kit → @esbuild-kit → esbuild` | 4 moderate dependency nodes representing one advisory chain | A locally exposed development server can be read by a hostile website | npm offers only an incompatible `drizzle-kit` downgrade |

These packages are development dependencies and are not present in the production
dependency audit. That narrows exposure but does not erase contributor or CI risk.

## Temporary controls

1. Run development servers on loopback only; do not expose them to an untrusted network.
2. Treat binary image additions as untrusted. Review their provenance and type before a
   maintainer permits CI or a local build.
3. Do not supply production credentials to pull-request builds or development servers.
4. Require the normal GitHub approval boundary before workflows from untrusted forks run.
5. Keep the hosted application limited to the validated build artifact; development
   packages are not an authorization boundary or production dependency.
6. Re-run both full and production-only audits on every dependency change and at the
   review deadline above.

## Exit criteria

The exception closes when compatible upstream releases remove both chains and the clean
install, build, lint, tests, production audit, full audit, and hosted packaging all pass.
Replacing `vinext` or the migration tool is a governed architecture change, not an audit
command to apply automatically.

This record must not be used to dismiss new advisories. A new runtime, critical, secret,
authorization, or cross-tenant finding blocks release and requires immediate review.
