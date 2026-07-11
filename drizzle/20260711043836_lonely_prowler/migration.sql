PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_conversations` (
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY,
	`is_pinned` integer DEFAULT false NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`model` text,
	`project_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`title` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_conversations_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`),
	CONSTRAINT "conversations_status_check" CHECK("status" in ('active', 'archived', 'deleted')),
	CONSTRAINT "conversations_metadata_json_check" CHECK(json_valid("metadata") and json_type("metadata") = 'object')
);
--> statement-breakpoint
INSERT INTO `__new_conversations`(`created_at`, `id`, `is_pinned`, `metadata`, `model`, `project_id`, `status`, `title`, `updated_at`) SELECT `created_at`, `id`, `is_pinned`, `metadata`, `model`, `project_id`, `status`, `title`, `updated_at` FROM `conversations`;--> statement-breakpoint
DROP TABLE `conversations`;--> statement-breakpoint
ALTER TABLE `__new_conversations` RENAME TO `conversations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	CONSTRAINT "projects_name_check" CHECK(length("name") > 0),
	CONSTRAINT "projects_path_check" CHECK(length("path") > 0),
	CONSTRAINT "projects_status_check" CHECK("status" in ('active', 'deleted'))
);
--> statement-breakpoint
INSERT INTO `__new_projects`(`created_at`, `id`, `name`, `path`, `status`, `updated_at`) SELECT `created_at`, `id`, `name`, `path`, `status`, `updated_at` FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `conversations_status_updated_at_idx`;--> statement-breakpoint
DROP INDEX IF EXISTS `conversations_project_id_status_updated_at_idx`;--> statement-breakpoint
CREATE INDEX `conversations_status_is_pinned_updated_at_idx` ON `conversations` (`status`,`is_pinned`,`updated_at`);--> statement-breakpoint
CREATE INDEX `conversations_project_id_status_is_pinned_updated_at_idx` ON `conversations` (`project_id`,`status`,`is_pinned`,`updated_at`);--> statement-breakpoint
CREATE INDEX `projects_status_updated_at_idx` ON `projects` (`status`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_path_unique_idx` ON `projects` (`path`);