CREATE TABLE "pfz_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone_id" varchar(100) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"sector" varchar(150),
	"year" double precision,
	"julian_day" varchar(30),
	"length_km" double precision,
	"source" varchar(100) NOT NULL,
	"observed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(30) DEFAULT 'valid' NOT NULL
);
