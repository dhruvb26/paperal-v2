CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"file_url" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
