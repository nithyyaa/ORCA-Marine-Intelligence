CREATE TABLE "marine_observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"wind_speed" double precision,
	"wind_direction" double precision,
	"wave_height" double precision,
	"wave_direction" double precision,
	"wave_period" double precision,
	"sea_surface_temperature" double precision,
	"ocean_current_velocity" double precision,
	"ocean_current_direction" double precision,
	"source" varchar(100) NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(30) DEFAULT 'valid' NOT NULL,
	"notes" text
);
