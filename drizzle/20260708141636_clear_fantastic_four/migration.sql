CREATE TABLE `projects` (
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "projects_name_check" CHECK(length("name") > 0),
	CONSTRAINT "projects_path_check" CHECK(length("path") > 0),
	CONSTRAINT "projects_status_check" CHECK("status" in ('active', 'deleted'))
);
--> statement-breakpoint
ALTER TABLE `conversations` ADD `project_id` text REFERENCES projects(id);--> statement-breakpoint
CREATE INDEX `conversations_project_id_status_updated_at_idx` ON `conversations` (`project_id`,`status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `projects_status_updated_at_idx` ON `projects` (`status`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_path_unique_idx` ON `projects` (`path`);