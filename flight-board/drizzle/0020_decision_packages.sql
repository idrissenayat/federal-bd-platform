CREATE TABLE IF NOT EXISTS `decision_packages` (
  `package_id` text PRIMARY KEY NOT NULL,
  `item_id` integer NOT NULL,
  `pod_id` text NOT NULL,
  `decision_kind` text NOT NULL,
  `target_json` text NOT NULL,
  `package_json` text NOT NULL,
  `package_sha256` text NOT NULL,
  `evidence_set_sha256` text NOT NULL,
  `preparation_principal` text NOT NULL,
  `created_at` text NOT NULL
);
CREATE INDEX IF NOT EXISTS `idx_decision_packages_item_created` ON `decision_packages` (`item_id`,`created_at`);

CREATE TABLE IF NOT EXISTS `decision_intents` (
  `intent_id` text PRIMARY KEY NOT NULL,
  `receipt_id` text NOT NULL UNIQUE,
  `package_id` text NOT NULL,
  `item_id` integer NOT NULL,
  `pod_id` text NOT NULL,
  `idempotency_key` text NOT NULL,
  `intent_json` text NOT NULL,
  `intent_sha256` text NOT NULL,
  `current_state` text NOT NULL,
  `current_sequence` integer NOT NULL,
  `current_event_sha256` text NOT NULL,
  `required_countersignatures` integer NOT NULL DEFAULT 1,
  `accepted_countersignatures` integer NOT NULL DEFAULT 0,
  `submitter_id` text NOT NULL,
  `submitter_role` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  UNIQUE(`pod_id`,`idempotency_key`)
);
CREATE INDEX IF NOT EXISTS `idx_decision_intents_item_created` ON `decision_intents` (`item_id`,`created_at`);

CREATE TABLE IF NOT EXISTS `decision_proof_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `intent_id` text NOT NULL,
  `sequence` integer NOT NULL,
  `event_type` text NOT NULL,
  `resulting_state` text NOT NULL,
  `previous_event_sha256` text,
  `event_json` text NOT NULL,
  `event_sha256` text NOT NULL,
  `actor_id` text NOT NULL,
  `created_at` text NOT NULL,
  UNIQUE(`intent_id`,`sequence`)
);
CREATE INDEX IF NOT EXISTS `idx_decision_proof_events_intent_created` ON `decision_proof_events` (`intent_id`,`created_at`);

CREATE TABLE IF NOT EXISTS `decision_issuer_signers` (
  `pod_id` text NOT NULL, `key_id` text NOT NULL, `key_version` integer NOT NULL,
  `public_key` text NOT NULL, `status` text NOT NULL, `activated_by` text NOT NULL,
  `activation_reason` text NOT NULL, `created_at` text NOT NULL,
  UNIQUE(`pod_id`,`key_id`,`key_version`)
);
CREATE INDEX IF NOT EXISTS `idx_decision_issuer_signers_active` ON `decision_issuer_signers` (`pod_id`,`status`);

CREATE TABLE IF NOT EXISTS `decision_issuer_envelopes` (
  `intent_id` text PRIMARY KEY NOT NULL, `key_id` text NOT NULL, `key_version` integer NOT NULL,
  `envelope_json` text NOT NULL, `envelope_sha256` text NOT NULL, `created_at` text NOT NULL
);

CREATE TRIGGER IF NOT EXISTS `decision_packages_no_update`
BEFORE UPDATE ON `decision_packages` BEGIN SELECT RAISE(ABORT, 'decision packages are immutable'); END;
CREATE TRIGGER IF NOT EXISTS `decision_packages_no_delete`
BEFORE DELETE ON `decision_packages` BEGIN SELECT RAISE(ABORT, 'decision packages require governed retention'); END;
CREATE TRIGGER IF NOT EXISTS `decision_intents_immutable_payload`
BEFORE UPDATE ON `decision_intents` WHEN NEW.intent_json != OLD.intent_json OR NEW.intent_sha256 != OLD.intent_sha256 OR NEW.submitter_id != OLD.submitter_id OR NEW.created_at != OLD.created_at
BEGIN SELECT RAISE(ABORT, 'decision intent authority is immutable'); END;
CREATE TRIGGER IF NOT EXISTS `decision_proof_events_no_update`
BEFORE UPDATE ON `decision_proof_events` BEGIN SELECT RAISE(ABORT, 'decision proof events are append-only'); END;
CREATE TRIGGER IF NOT EXISTS `decision_proof_events_no_delete`
BEFORE DELETE ON `decision_proof_events` BEGIN SELECT RAISE(ABORT, 'decision proof events require governed retention'); END;
CREATE TRIGGER IF NOT EXISTS `decision_issuer_signers_no_update`
BEFORE UPDATE ON `decision_issuer_signers` BEGIN SELECT RAISE(ABORT, 'decision issuer signer records are immutable'); END;
CREATE TRIGGER IF NOT EXISTS `decision_issuer_envelopes_no_update`
BEFORE UPDATE ON `decision_issuer_envelopes` BEGIN SELECT RAISE(ABORT, 'decision issuer envelopes are immutable'); END;
CREATE TRIGGER IF NOT EXISTS `decision_issuer_envelopes_no_delete`
BEFORE DELETE ON `decision_issuer_envelopes` BEGIN SELECT RAISE(ABORT, 'decision issuer envelopes require governed retention'); END;
