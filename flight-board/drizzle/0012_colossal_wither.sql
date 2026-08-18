CREATE TABLE `dispatch_authorization_audits` (
	`audit_event_id` text PRIMARY KEY NOT NULL,
	`intent_id` text NOT NULL,
	`item_id` integer NOT NULL,
	`pod_id` text NOT NULL,
	`authorization_revision` text NOT NULL,
	`authorization_json` text NOT NULL,
	`actor_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dispatch_authorization_audits_intent_id_unique` ON `dispatch_authorization_audits` (`intent_id`);--> statement-breakpoint
CREATE INDEX `idx_dispatch_authorization_item_created` ON `dispatch_authorization_audits` (`item_id`,`created_at`);