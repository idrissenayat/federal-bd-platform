CREATE TABLE `signal_retention_authorizations` (
	`signal_id` text PRIMARY KEY NOT NULL,
	`authorization_nonce` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `signal_retention_holds` (
	`hold_event_id` text PRIMARY KEY NOT NULL,
	`signal_id` text NOT NULL,
	`action` text NOT NULL,
	`reason_code` text NOT NULL,
	`expires_at` text NOT NULL,
	`actor_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_signal_retention_holds_signal_created` ON `signal_retention_holds` (`signal_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `signal_retention_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cutoff_at` text NOT NULL,
	`eligible_count` integer NOT NULL,
	`deleted_count` integer NOT NULL,
	`policy_bindings_sha256` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_signal_retention_runs_created` ON `signal_retention_runs` (`created_at`);
--> statement-breakpoint
DROP TRIGGER IF EXISTS `signals_no_delete`;
--> statement-breakpoint
CREATE TRIGGER `signals_no_delete` BEFORE DELETE ON `signals` WHEN NOT EXISTS (
	SELECT 1 FROM `signal_retention_authorizations` a
	WHERE a.`signal_id` = OLD.`signal_id` AND unixepoch(a.`expires_at`) > unixepoch('now')
) BEGIN SELECT RAISE(ABORT, 'signals require the governed retention path'); END;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `signal_events_no_delete`;
--> statement-breakpoint
CREATE TRIGGER `signal_events_no_delete` BEFORE DELETE ON `signal_events` WHEN NOT EXISTS (
	SELECT 1 FROM `signal_retention_authorizations` a
	WHERE a.`signal_id` = OLD.`signal_id` AND unixepoch(a.`expires_at`) > unixepoch('now')
) BEGIN SELECT RAISE(ABORT, 'signal events require the governed retention path'); END;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `signal_proposals_no_delete`;
--> statement-breakpoint
CREATE TRIGGER `signal_proposals_no_delete` BEFORE DELETE ON `signal_proposals` WHEN NOT EXISTS (
	SELECT 1 FROM `signal_retention_authorizations` a
	WHERE a.`signal_id` = OLD.`signal_id` AND unixepoch(a.`expires_at`) > unixepoch('now')
) BEGIN SELECT RAISE(ABORT, 'signal proposals require the governed retention path'); END;
--> statement-breakpoint
DROP TRIGGER IF EXISTS `signal_sources_no_delete`;
--> statement-breakpoint
CREATE TRIGGER `signal_sources_no_delete` BEFORE DELETE ON `signal_sources` WHEN NOT EXISTS (
	SELECT 1 FROM `signal_retention_authorizations` a
	WHERE a.`signal_id` = OLD.`signal_id` AND unixepoch(a.`expires_at`) > unixepoch('now')
) BEGIN SELECT RAISE(ABORT, 'signal sources require the governed retention path'); END;
--> statement-breakpoint
CREATE TRIGGER `signal_generation_attempts_no_delete` BEFORE DELETE ON `signal_generation_attempts` WHEN NOT EXISTS (
	SELECT 1 FROM `signal_retention_authorizations` a
	WHERE a.`signal_id` = OLD.`signal_id` AND unixepoch(a.`expires_at`) > unixepoch('now')
) BEGIN SELECT RAISE(ABORT, 'signal attempts require the governed retention path'); END;
--> statement-breakpoint
CREATE TRIGGER `signal_retention_holds_no_update` BEFORE UPDATE ON `signal_retention_holds`
BEGIN SELECT RAISE(ABORT, 'signal retention hold events are immutable'); END;
--> statement-breakpoint
CREATE TRIGGER `signal_retention_holds_no_delete` BEFORE DELETE ON `signal_retention_holds` WHEN NOT EXISTS (
	SELECT 1 FROM `signal_retention_authorizations` a
	WHERE a.`signal_id` = OLD.`signal_id` AND unixepoch(a.`expires_at`) > unixepoch('now')
) BEGIN SELECT RAISE(ABORT, 'signal holds require the governed retention path'); END;
--> statement-breakpoint
CREATE TRIGGER `signal_retention_runs_no_update` BEFORE UPDATE ON `signal_retention_runs`
BEGIN SELECT RAISE(ABORT, 'signal retention runs are append-only'); END;
--> statement-breakpoint
CREATE TRIGGER `signal_retention_runs_no_delete` BEFORE DELETE ON `signal_retention_runs`
BEGIN SELECT RAISE(ABORT, 'signal retention runs are append-only'); END;
