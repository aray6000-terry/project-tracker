CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`project_id` text,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `project_access` (
	`project_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`granted_by` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`project_id`, `email`)
);
--> statement-breakpoint
CREATE TABLE `project_archives` (
	`project_id` text PRIMARY KEY NOT NULL,
	`folder_id` text NOT NULL,
	`snapshot_id` text NOT NULL,
	`summary_id` text NOT NULL,
	`revision` integer NOT NULL,
	`checksum` text NOT NULL,
	`archived_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `project_versions` (
	`project_id` text NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`project_id`, `revision`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`created_by` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`can_create` integer DEFAULT 0 NOT NULL,
	`can_share` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
