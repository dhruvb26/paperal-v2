CREATE TABLE "chunks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"namespace" text NOT NULL,
	"text" text NOT NULL,
	"bbox" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
