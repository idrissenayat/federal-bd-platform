# Initial Federal BD pilot framing

This is the repository README immediately before STEER was reframed as an open-source
distribution. It is preserved to show the original intent and why the structure changed.
Git history remains the authoritative exact record.

The initial repository described itself as a **STEER Agentic SDLC Validation Project**.
Its first purpose was to evaluate STEER using a demanding Federal business-development
platform as the real-world test vehicle. The research question asked whether STEER could
produce independently useful, verified software outcomes faster or with less qualified
human effort than a credible Kanban-style control without degrading quality, safety,
cost, or team experience.

The Federal BD product boundary covered public federal contract opportunities from
official sources through immutable evidence, normalization, fit analysis, an explainable
`BID`, `NO_BID`, or `REVIEW` recommendation, and a human decision to advance to Capture
or Archive. It explicitly excluded grants, autonomous submissions, government contact,
and non-public or regulated data.

The initial structure placed the STEER operating system and experiment controls in
`steer/`, product material in `docs/product/`, and implementation boundaries in
`apps/`, `workers/`, and `packages/`. The initial status was pre-implementation: the
experiment and environment controls existed, while the first product briefs and exams
still required gates.

## Why it changed

The pilot exposed a broader product: organizations need a reusable operating model and
shared platform that can support several PODs and projects, not a framework whose public
identity is tied to Federal BD. The new framing therefore separates STEER Core, Work
Management, adapters, and Labs while keeping this pilot as the first reference project
and evidence source.
