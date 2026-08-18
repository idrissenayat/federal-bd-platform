ALTER TABLE `dispatch_privacy_policies` ADD `ruling_url` text;--> statement-breakpoint
ALTER TABLE `dispatch_privacy_policies` ADD `ruling_sha256` text;--> statement-breakpoint
ALTER TABLE `dispatch_privacy_policies` ADD `authority_role` text;--> statement-breakpoint
ALTER TABLE `dispatch_privacy_policies` ADD `authorization_event_id` text;--> statement-breakpoint
ALTER TABLE `dispatch_privacy_policies` ADD `idempotency_key` text;--> statement-breakpoint
ALTER TABLE `dispatch_privacy_policies` ADD `activation_receipt_sha256` text;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_dispatch_privacy_policy_event` ON `dispatch_privacy_policies` (`authorization_event_id`) WHERE `authorization_event_id` IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_dispatch_privacy_policy_idempotency` ON `dispatch_privacy_policies` (`pod_id`,`idempotency_key`) WHERE `idempotency_key` IS NOT NULL;
