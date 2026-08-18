CREATE TABLE `dispatch_retention_authorizations` (
	`intent_id` text PRIMARY KEY NOT NULL,
	`authorization_nonce` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `dispatch_retention_holds` (
	`hold_event_id` text PRIMARY KEY NOT NULL,
	`intent_id` text NOT NULL,
	`action` text NOT NULL,
	`reason_code` text NOT NULL,
	`expires_at` text NOT NULL,
	`actor_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_dispatch_retention_holds_intent_created` ON `dispatch_retention_holds` (`intent_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `dispatch_retention_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cutoff_at` text NOT NULL,
	`eligible_count` integer NOT NULL,
	`deleted_count` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_dispatch_retention_runs_created` ON `dispatch_retention_runs` (`created_at`);