CREATE TABLE IF NOT EXISTS `decision_readiness_policies` (
  `pod_id` text NOT NULL,
  `policy_version` integer NOT NULL,
  `policy_json` text NOT NULL,
  `policy_sha256` text NOT NULL,
  `status` text NOT NULL,
  `activated_by` text NOT NULL,
  `activation_reason` text NOT NULL,
  `ruling_url` text NOT NULL,
  `ruling_sha256` text NOT NULL,
  `created_at` text NOT NULL,
  UNIQUE(`pod_id`,`policy_version`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_decision_readiness_policy_active` ON `decision_readiness_policies` (`pod_id`,`status`,`policy_version`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `staging_verification_receipts` (
  `receipt_id` text PRIMARY KEY NOT NULL,
  `item_id` integer NOT NULL,
  `pod_id` text NOT NULL,
  `receipt_json` text NOT NULL,
  `receipt_sha256` text NOT NULL UNIQUE,
  `source_revision` text NOT NULL,
  `build_sha256` text NOT NULL,
  `migration_set_sha256` text NOT NULL,
  `runtime_policy_sha256` text NOT NULL,
  `completed_at` text NOT NULL,
  `key_id` text NOT NULL,
  `key_version` integer NOT NULL,
  `service_signature` text NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_staging_verification_receipts_item_created` ON `staging_verification_receipts` (`item_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `decision_readiness_snapshots` (
  `snapshot_id` text PRIMARY KEY NOT NULL,
  `item_id` integer NOT NULL,
  `pod_id` text NOT NULL,
  `snapshot_json` text NOT NULL,
  `snapshot_sha256` text NOT NULL UNIQUE,
  `evidence_set_sha256` text NOT NULL,
  `critic_review_id` integer NOT NULL,
  `tier` text NOT NULL,
  `satisfaction_path` text NOT NULL,
  `effective_not_before` text NOT NULL,
  `current_state` text NOT NULL,
  `invalidation_reason` text,
  `predecessor_snapshot_sha256` text,
  `created_by` text NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_decision_readiness_snapshots_item_created` ON `decision_readiness_snapshots` (`item_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_decision_readiness_snapshots_pod_state` ON `decision_readiness_snapshots` (`pod_id`,`current_state`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `decision_readiness_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `snapshot_id` text NOT NULL,
  `event_type` text NOT NULL,
  `event_json` text NOT NULL,
  `event_sha256` text NOT NULL UNIQUE,
  `actor_id` text NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_decision_readiness_events_snapshot_created` ON `decision_readiness_events` (`snapshot_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `decision_readiness_countersignatures` (
  `snapshot_id` text NOT NULL,
  `member_id` text NOT NULL,
  `role` text NOT NULL,
  `proof_json` text NOT NULL,
  `proof_sha256` text NOT NULL,
  `status` text NOT NULL,
  `created_at` text NOT NULL,
  UNIQUE(`snapshot_id`,`member_id`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_decision_readiness_countersignatures_snapshot` ON `decision_readiness_countersignatures` (`snapshot_id`,`status`);
--> statement-breakpoint
ALTER TABLE `decision_intents` ADD `readiness_snapshot_sha256` text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `decision_intents_readiness_immutable_v3`
BEFORE UPDATE ON `decision_intents` WHEN NEW.readiness_snapshot_sha256 != OLD.readiness_snapshot_sha256
BEGIN SELECT RAISE(ABORT, 'decision intent readiness authority is immutable'); END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `decision_readiness_policies_no_update`
BEFORE UPDATE ON `decision_readiness_policies` BEGIN SELECT RAISE(ABORT, 'decision readiness policies are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `decision_readiness_policies_no_delete`
BEFORE DELETE ON `decision_readiness_policies` BEGIN SELECT RAISE(ABORT, 'decision readiness policies require governed retention'); END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `staging_verification_receipts_no_update`
BEFORE UPDATE ON `staging_verification_receipts` BEGIN SELECT RAISE(ABORT, 'staging verification receipts are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `staging_verification_receipts_no_delete`
BEFORE DELETE ON `staging_verification_receipts` BEGIN SELECT RAISE(ABORT, 'staging verification receipts require governed retention'); END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `decision_readiness_snapshots_authority_immutable`
BEFORE UPDATE ON `decision_readiness_snapshots` WHEN
  NEW.snapshot_id != OLD.snapshot_id OR NEW.item_id != OLD.item_id OR NEW.pod_id != OLD.pod_id OR
  NEW.snapshot_json != OLD.snapshot_json OR NEW.snapshot_sha256 != OLD.snapshot_sha256 OR
  NEW.evidence_set_sha256 != OLD.evidence_set_sha256 OR NEW.critic_review_id != OLD.critic_review_id OR
  NEW.tier != OLD.tier OR NEW.satisfaction_path != OLD.satisfaction_path OR
  NEW.effective_not_before != OLD.effective_not_before OR NEW.created_by != OLD.created_by OR
  COALESCE(NEW.predecessor_snapshot_sha256, '') != COALESCE(OLD.predecessor_snapshot_sha256, '') OR NEW.created_at != OLD.created_at
BEGIN SELECT RAISE(ABORT, 'decision readiness snapshot authority is immutable'); END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `decision_readiness_snapshots_state_transition`
BEFORE UPDATE ON `decision_readiness_snapshots` WHEN
  (OLD.current_state != NEW.current_state OR COALESCE(OLD.invalidation_reason, '') != COALESCE(NEW.invalidation_reason, '')) AND NOT (
    OLD.current_state = 'ACTIVE' AND NEW.current_state = 'INVALIDATED' AND LENGTH(COALESCE(NEW.invalidation_reason, '')) > 0
  )
BEGIN SELECT RAISE(ABORT, 'decision readiness snapshot state transition is invalid'); END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `decision_readiness_snapshots_no_delete`
BEFORE DELETE ON `decision_readiness_snapshots` BEGIN SELECT RAISE(ABORT, 'decision readiness snapshots require governed retention'); END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `decision_readiness_events_no_update`
BEFORE UPDATE ON `decision_readiness_events` BEGIN SELECT RAISE(ABORT, 'decision readiness events are append-only'); END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `decision_readiness_events_no_delete`
BEFORE DELETE ON `decision_readiness_events` BEGIN SELECT RAISE(ABORT, 'decision readiness events require governed retention'); END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `decision_readiness_countersignatures_no_update`
BEFORE UPDATE ON `decision_readiness_countersignatures` BEGIN SELECT RAISE(ABORT, 'decision readiness countersignatures are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `decision_readiness_countersignatures_no_delete`
BEFORE DELETE ON `decision_readiness_countersignatures` BEGIN SELECT RAISE(ABORT, 'decision readiness countersignatures require governed retention'); END;
