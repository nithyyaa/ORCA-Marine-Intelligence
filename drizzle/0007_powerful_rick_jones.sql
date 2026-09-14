CREATE TABLE "rag_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"source" varchar(500) NOT NULL,
	"title" varchar(300),
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
