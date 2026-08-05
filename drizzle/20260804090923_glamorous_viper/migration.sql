CREATE TABLE `attachments` (
	`conversation_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`filename` text NOT NULL,
	`id` text PRIMARY KEY,
	`idempotency_key` text,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`storage_key` text NOT NULL,
	`submission_id` text,
	CONSTRAINT `fk_attachments_conversation_id_conversations_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
	CONSTRAINT "attachments_size_check" CHECK("size" >= 0),
	CONSTRAINT "attachments_status_check" CHECK("status" in ('pending', 'attached'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attachments_conversation_id_storage_key_unique` ON `attachments` (`conversation_id`,`storage_key`);--> statement-breakpoint
CREATE INDEX `attachments_conversation_id_submission_id_idx` ON `attachments` (`conversation_id`,`submission_id`);