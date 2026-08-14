# Builder dependency evidence — STR-017

**Date:** 2026-08-14
**Status:** evidence for Security Owner disposition; this is not a Security approval and does not clear Gate 3.

## Audit result

`npm audit --json` reports 0 critical, 2 high, 4 moderate findings:

- High: `image-size@2.0.2`, declared by `vinext@1.0.0-beta.2`, has denial-of-service advisories for ICNS/JXL/HEIF parsing. The registry currently reports `2.0.2` as the latest `image-size` release. The only npm-proposed fix downgrades vinext to `0.0.45`, an unsafe framework change.
- Moderate: legacy `esbuild@0.18.20` exists only beneath the development-time `drizzle-kit -> @esbuild-kit` chain. Current Vite, Wrangler, and tsx paths use patched `esbuild` releases. npm proposes downgrading Drizzle Kit to `0.18.1`, also an unsafe toolchain change.

## Reachability and compensating boundary

- `image-size` is imported by vinext's build-time `metadata-route-build-data.js`. The production `dist` output contains no `image-size`, `imageSize(`, or metadata-build-data reference after a successful build. The Worker image endpoint delegates byte transformation to the bound Cloudflare Images service and does not import the vulnerable parser.
- The only repository metadata image is trusted `public/og.png`. The STEER Work Management app has no image upload, dynamic metadata-image, ICNS, JXL, HEIF, or user-supplied image parsing route. Work Economics accepts exact JSON fields and GitHub text evidence URLs; its server resolver reads text and never passes evidence bytes to `image-size`.
- Drizzle Kit and its legacy nested esbuild run only during local schema generation. They are not imported by the Worker application or shipped Work Economics route.
- No dependency was forced to a known incompatible version. `axe-core` and `jsdom` were added only as development dependencies for route-level automated accessibility evidence.

## Default-closed disposition request

The Builder recommends accepting the current reachability boundary only as a temporary, explicitly owned exception if the Security Owner confirms the production bundle does not expose the vulnerable parser. Track upstream `image-size`/vinext remediation and replace immediately when a patched compatible release exists. If Security cannot confirm non-reachability, Gate 3 remains blocked and the framework must be changed before release.

This finding remains visible and unresolved until an authenticated Security Owner ruling. No deployment, merge, Gate 3 request, or release is authorized by this document.
