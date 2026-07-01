CREATE TABLE `conversations` (
	`archived_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`id` text PRIMARY KEY,
	`metadata` text DEFAULT '{}' NOT NULL,
	`model` text,
	`status` text DEFAULT 'active' NOT NULL,
	`title` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "conversations_status_check" CHECK("status" in ('active', 'archived', 'deleted')),
	CONSTRAINT "conversations_metadata_json_check" CHECK(json_valid("metadata"))
);
--> statement-breakpoint
CREATE INDEX `conversations_deleted_at_updated_at_idx` ON `conversations` (`deleted_at`,`updated_at`);--> statement-breakpoint
CREATE INDEX `conversations_status_updated_at_idx` ON `conversations` (`status`,`updated_at`);