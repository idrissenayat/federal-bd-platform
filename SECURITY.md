# Security policy

## Supported scope

STEER is experimental / pre-1.0. The latest `main` branch is the only currently supported
line. No production support or response-time guarantee is offered yet. The Federal BD
reference project accepts public, unclassified information and synthetic test data only.

## Reporting

Use a private GitHub Security Advisory for a vulnerability or suspected credential
exposure. Do not place exploit details, keys, private contractor information, or source
attachments in a public issue or Discussion. For non-sensitive reliability defects, use
the defect issue form.

## Credential handling

- Keep SAM.gov and model-provider keys in local ignored environment files or the GitHub
  Actions secret store.
- Never paste a credential into an agent prompt, brief, exam, log, fixture, issue, PR, or
  Discussion.
- If exposure is suspected, revoke first, then investigate and rotate.

## Data boundary

Do not ingest or upload CUI, FCI, export-controlled, proprietary proposal, or classified
material. Attachments are hostile input and remain quarantined until the signed brief and
exam prove scanning and safe extraction controls.

An adopter is responsible for defining and enforcing its own classification, privacy,
identity, retention, and regulatory boundary. The current prototype is not a production
multi-tenant security claim. Do not place real organization secrets or sensitive project
content in it until the relevant isolation, backup, migration, and authorization exams
have passed.
