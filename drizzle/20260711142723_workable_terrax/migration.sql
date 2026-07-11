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
	CONSTRAINT "projects_status_check" CHECK("status" in ('active', 'removed'))
);
--> statement-breakpoint
INSERT INTO `__new_projects`(`created_at`, `id`, `name`, `path`, `status`, `updated_at`) SELECT `created_at`, `id`, `name`, `path`, CASE WHEN `status` = 'deleted' THEN 'removed' ELSE `status` END, `updated_at` FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `projects_status_updated_at_idx` ON `projects` (`status`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_path_unique_idx` ON `projects` (`path`);
