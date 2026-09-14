CREATE TABLE "marine_boundaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"boundary_id" varchar(150) NOT NULL,
	"name" varchar(200),
	"country" varchar(150),
	"boundary_type" varchar(100) NOT NULL,
	"geometry" geometry(MultiPolygon,4326) NOT NULL,
	"source" varchar(200) NOT NULL,
	"source_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(30) DEFAULT 'valid' NOT NULL,
	"notes" text,
	CONSTRAINT "marine_boundaries_boundary_id_unique" UNIQUE("boundary_id")
);
