CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dedupe_key` text NOT NULL,
	`item_id` integer NOT NULL,
	`member_id` text,
	`recipient_role` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`channel` text DEFAULT 'Block Buzz' NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`created_at` text NOT NULL,
	`read_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_dedupe_key_unique` ON `notifications` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `idx_notifications_role_created` ON `notifications` (`recipient_role`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_notifications_member_status` ON `notifications` (`member_id`,`status`);--> statement-breakpoint
ALTER TABLE `agent_reviews` ADD `evidence_url` text;--> statement-breakpoint
ALTER TABLE `agent_reviews` ADD `evidence_revision` text;--> statement-breakpoint
ALTER TABLE `agent_reviews` ADD `evidence_sha256` text;--> statement-breakpoint
ALTER TABLE `decisions` ADD `review_id` integer;--> statement-breakpoint
ALTER TABLE `decisions` ADD `evidence_url` text;--> statement-breakpoint
ALTER TABLE `decisions` ADD `evidence_revision` text;--> statement-breakpoint
ALTER TABLE `decisions` ADD `evidence_sha256` text;--> statement-breakpoint
ALTER TABLE `work_items` ADD `rework_instructions` text;