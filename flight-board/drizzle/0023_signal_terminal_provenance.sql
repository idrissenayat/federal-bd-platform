ALTER TABLE `signal_generation_attempts` ADD `implementation_revision` text NOT NULL DEFAULT 'legacy-unbound';
--> statement-breakpoint
ALTER TABLE `signal_retention_authorizations` ADD `cutoff_at` text NOT NULL DEFAULT '1970-01-01T00:00:00.000Z';
--> statement-breakpoint
ALTER TABLE `signal_retention_authorizations` ADD `policy_version` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `signal_retention_authorizations` ADD `ruling_sha256` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `signal_retention_authorizations` ADD `activation_receipt_sha256` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `signals` ADD `terminal_disposition_at` text;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `signals_immutable_original`;
--> statement-breakpoint
UPDATE `signals` SET
  `terminal_disposition_at` = `updated_at`,
  `retention_delete_after` = strftime('%Y-%m-%dT%H:%M:%fZ', `updated_at`, '+90 days')
WHERE `lifecycle_state` IN ('READY', 'SAFE_FAILURE', 'STALE');
--> statement-breakpoint
UPDATE `signals` SET `retention_delete_after` = '9999-12-31T23:59:59.999Z'
WHERE `terminal_disposition_at` IS NULL;
--> statement-breakpoint
CREATE TRIGGER `signals_immutable_original` BEFORE UPDATE ON `signals` WHEN
  NEW.`signal_id` != OLD.`signal_id` OR NEW.`pod_id` != OLD.`pod_id` OR
  NEW.`submitter_id` != OLD.`submitter_id` OR NEW.`original_text` != OLD.`original_text` OR
  NEW.`original_sha256` != OLD.`original_sha256` OR NEW.`idempotency_key` != OLD.`idempotency_key` OR
  ((NEW.`terminal_disposition_at` IS NOT OLD.`terminal_disposition_at` OR
    NEW.`retention_delete_after` != OLD.`retention_delete_after`) AND NOT (
      OLD.`terminal_disposition_at` IS NULL AND NEW.`terminal_disposition_at` IS NOT NULL AND
      NEW.`lifecycle_state` IN ('READY', 'SAFE_FAILURE', 'STALE') AND
      unixepoch(NEW.`retention_delete_after`) = unixepoch(NEW.`terminal_disposition_at`, '+90 days')
  )) OR NEW.`created_at` != OLD.`created_at`
BEGIN SELECT RAISE(ABORT, 'signal original and authority are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER `signals_terminal_transition_guard` BEFORE UPDATE ON `signals` WHEN
  OLD.`terminal_disposition_at` IS NULL AND NEW.`lifecycle_state` IN ('READY', 'SAFE_FAILURE', 'STALE') AND
  (NEW.`terminal_disposition_at` IS NULL OR
    unixepoch(NEW.`retention_delete_after`) != unixepoch(NEW.`terminal_disposition_at`, '+90 days'))
BEGIN SELECT RAISE(ABORT, 'signal terminal retention boundary is required'); END;
--> statement-breakpoint
CREATE TRIGGER `signal_generation_attempts_immutable_provenance`
BEFORE UPDATE ON `signal_generation_attempts` WHEN
  NEW.`attempt_id` != OLD.`attempt_id` OR NEW.`signal_id` != OLD.`signal_id` OR
  NEW.`attempt_number` != OLD.`attempt_number` OR NEW.`target_proposal_version` != OLD.`target_proposal_version` OR
  NEW.`provider` != OLD.`provider` OR NEW.`model` != OLD.`model` OR
  NEW.`prompt_version` != OLD.`prompt_version` OR NEW.`implementation_revision` != OLD.`implementation_revision` OR
  NEW.`started_at` != OLD.`started_at` OR NEW.`input_sha256` != OLD.`input_sha256`
BEGIN SELECT RAISE(ABORT, 'signal attempt provenance is immutable'); END;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `signals_no_delete`;
--> statement-breakpoint
CREATE TRIGGER `signals_no_delete` BEFORE DELETE ON `signals` WHEN NOT EXISTS (
  SELECT 1 FROM `signal_retention_authorizations` a
  JOIN `dispatch_privacy_policies` policy ON policy.`pod_id` = OLD.`pod_id`
    AND policy.`policy_version` = a.`policy_version`
    AND policy.`policy_version` = (
      SELECT MAX(latest.`policy_version`) FROM `dispatch_privacy_policies` latest
      WHERE latest.`pod_id` = OLD.`pod_id`
    )
  WHERE a.`signal_id` = OLD.`signal_id`
    AND unixepoch(a.`expires_at`) > unixepoch('now')
    AND OLD.`lifecycle_state` IN ('READY', 'SAFE_FAILURE', 'STALE')
    AND OLD.`terminal_disposition_at` IS NOT NULL
    AND unixepoch(OLD.`retention_delete_after`) <= unixepoch(a.`cutoff_at`)
    AND policy.`status` = 'ACTIVE'
    AND policy.`terminal_retention_days` = 90
    AND policy.`provider_recovery_days` <= 30
    AND policy.`ruling_sha256` = a.`ruling_sha256`
    AND policy.`activation_receipt_sha256` = a.`activation_receipt_sha256`
    AND NOT EXISTS (
      SELECT 1 FROM `signal_retention_holds` hold
      WHERE hold.`signal_id` = OLD.`signal_id` AND hold.`action` = 'HOLD'
        AND unixepoch(hold.`expires_at`) > unixepoch('now')
        AND NOT EXISTS (
          SELECT 1 FROM `signal_retention_holds` release
          WHERE release.`signal_id` = hold.`signal_id` AND release.`action` = 'RELEASE'
            AND unixepoch(release.`created_at`) >= unixepoch(hold.`created_at`)
        )
    )
) BEGIN SELECT RAISE(ABORT, 'signal retention eligibility changed'); END;
