CREATE TABLE `code_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`repository` text NOT NULL,
	`pull_number` integer NOT NULL,
	`head_sha` text NOT NULL,
	`action` text NOT NULL,
	`reasoning` text NOT NULL,
	`actor_id` text NOT NULL,
	`actor_email` text,
	`github_delivery` text NOT NULL,
	`github_url` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_code_reviews_item_created` ON `code_reviews` (`item_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_code_reviews_pr_head` ON `code_reviews` (`repository`,`pull_number`,`head_sha`);