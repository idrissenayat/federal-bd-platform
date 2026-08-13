CREATE TABLE `activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_activity_item_created` ON `activity` (`item_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`gate` text NOT NULL,
	`decision` text NOT NULL,
	`reasoning` text NOT NULL,
	`actor_id` text NOT NULL,
	`actor_email` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_decisions_item_created` ON `decisions` (`item_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`email` text,
	`kind` text NOT NULL,
	`role` text NOT NULL,
	`authority` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`accent` text DEFAULT 'aqua' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_members_kind` ON `members` (`kind`);--> statement-breakpoint
CREATE TABLE `work_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`phase` text NOT NULL,
	`priority` text NOT NULL,
	`workflow` text NOT NULL,
	`state` text NOT NULL,
	`gate` text NOT NULL,
	`decision_status` text NOT NULL,
	`decision_authority` text NOT NULL,
	`assignee_id` text,
	`next_action` text NOT NULL,
	`evidence_url` text,
	`github_url` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `work_items_key_unique` ON `work_items` (`key`);--> statement-breakpoint
CREATE INDEX `idx_work_items_phase_state` ON `work_items` (`phase`,`state`);--> statement-breakpoint
CREATE INDEX `idx_work_items_decision_status` ON `work_items` (`decision_status`);--> statement-breakpoint
CREATE INDEX `idx_work_items_assignee` ON `work_items` (`assignee_id`);