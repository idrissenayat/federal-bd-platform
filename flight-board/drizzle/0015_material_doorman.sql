CREATE TABLE `dispatch_privacy_policies` (
	`pod_id` text NOT NULL,
	`policy_version` integer NOT NULL,
	`inventory_url` text NOT NULL,
	`inventory_sha256` text NOT NULL,
	`terminal_retention_days` integer NOT NULL,
	`provider_recovery_days` integer NOT NULL,
	`status` text NOT NULL,
	`changed_by` text NOT NULL,
	`change_reason` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_dispatch_privacy_policy_version` ON `dispatch_privacy_policies` (`pod_id`,`policy_version`);--> statement-breakpoint
CREATE INDEX `idx_dispatch_privacy_policy_active` ON `dispatch_privacy_policies` (`pod_id`,`status`,`policy_version`);