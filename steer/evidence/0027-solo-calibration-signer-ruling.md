# STR-027 bounded solo-calibration signer ruling

**Recorded:** 2026-08-18T22:58:45Z  
**Human authority:** Idriss Enayat, Product Lead and interim Tech Lead  
**Scope:** STR-027 signer-count policy only  
**Implementation branch:** `codex/str027-builder`  
**Draft pull request:** https://github.com/idrissenayat/federal-bd-platform/pull/67

## Ruling

The human owner approved the bounded correction proposed in the active Codex task:

- explicit `SOLO_CALIBRATION` mode uses a signed required-signer set with zero additional
  countersigners;
- team mode retains the existing requirement for at least two distinct authenticated
  human countersigners, including the forbidden submitter/countersigner pairing;
- exact-revision issuer proof, separate-session enforcement, the 24-hour default-closed
  interval, fresh Critic review, immutable history, and all other approved STR-027 controls
  remain required.

## Authority boundary

This ruling authorizes the bounded Brief/Exam correction and implementation on the STR-027
Builder branch. It does not activate a signer, approve a secret, deploy staging or
production, merge the pull request, release the capability, satisfy CORE-11 by itself, or
approve Gate 3. The final packet must bind this ruling to an authenticated Work Management
receipt when the capability exists; no historical receipt or signature may be fabricated.
