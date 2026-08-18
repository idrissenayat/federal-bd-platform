CREATE TABLE `buzz_channel_registry` (
	`pod_id` text NOT NULL,
	`registry_version` integer NOT NULL,
	`channel_id` text NOT NULL,
	`channel_name` text NOT NULL,
	`relay_url` text NOT NULL,
	`status` text NOT NULL,
	`changed_by` text NOT NULL,
	`change_reason` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_buzz_channel_registry_version` ON `buzz_channel_registry` (`pod_id`,`channel_id`,`registry_version`);--> statement-breakpoint
CREATE INDEX `idx_buzz_channel_registry_active` ON `buzz_channel_registry` (`pod_id`,`channel_id`,`status`);--> statement-breakpoint
CREATE TABLE `dispatch_security_diagnostics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`configuration_version` integer,
	`observed_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_dispatch_security_diagnostics_observed` ON `dispatch_security_diagnostics` (`observed_at`);