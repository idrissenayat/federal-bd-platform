CREATE TABLE `agent_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`agent_id` text NOT NULL,
	`review_mode` text NOT NULL,
	`recommendation` text NOT NULL,
	`confidence` text NOT NULL,
	`summary` text NOT NULL,
	`findings_json` text NOT NULL,
	`dependencies_json` text NOT NULL,
	`impacts_json` text NOT NULL,
	`actions_json` text NOT NULL,
	`derived_tags_json` text NOT NULL,
	`evidence_scope` text NOT NULL,
	`reviewed_item_updated_at` text NOT NULL,
	`requested_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_agent_reviews_item_created` ON `agent_reviews` (`item_id`,`created_at`);