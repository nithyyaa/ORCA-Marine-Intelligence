import {
  pgTable,
  serial,
  varchar,
  doublePrecision,
  timestamp,
  text,
  customType,
  vector,
} from "drizzle-orm/pg-core";

export const marineObservations = pgTable("marine_observations", {
  id: serial("id").primaryKey(),

  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),

  windSpeed: doublePrecision("wind_speed"),
  windDirection: doublePrecision("wind_direction"),

  waveHeight: doublePrecision("wave_height"),
  waveDirection: doublePrecision("wave_direction"),
  wavePeriod: doublePrecision("wave_period"),

  seaSurfaceTemperature: doublePrecision("sea_surface_temperature"),

  oceanCurrentVelocity: doublePrecision("ocean_current_velocity"),
  oceanCurrentDirection: doublePrecision("ocean_current_direction"),

  source: varchar("source", { length: 100 }).notNull(),

  observedAt: timestamp("observed_at", {
    withTimezone: true,
  }).notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  status: varchar("status", { length: 30 })
    .default("valid")
    .notNull(),

  notes: text("notes"),
});

/*
 * Existing PFZ geometry type
 */
const pointGeometry = customType<{
  data: string;
  driverDataType: "string";
}>({
  dataType() {
    return "geometry(Point,4326)";
  },
});

/*
 * Geofencing boundary geometry
 *
 * Marine Regions EEZ data uses MultiPolygon
 * geometry for the EEZ areas.
 */
const boundaryGeometry = customType<{
  data: string;
  driverDataType: "string";
}>({
  dataType() {
    return "geometry(MultiPolygon,4326)";
  },
});

export const pfzZones = pgTable("pfz_zones", {
  id: serial("id").primaryKey(),

  zoneId: varchar("zone_id", {
    length: 100,
  })
    .notNull()
    .unique(),

  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),

  location: pointGeometry("location"),

  sector: varchar("sector", {
    length: 150,
  }),

  year: doublePrecision("year"),

  julianDay: varchar("julian_day", {
    length: 30,
  }),

  lengthKm: doublePrecision("length_km"),

  source: varchar("source", {
    length: 100,
  }).notNull(),

  observedAt: timestamp("observed_at", {
    withTimezone: true,
  }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  status: varchar("status", {
    length: 30,
  })
    .default("valid")
    .notNull(),
});

/*
 * Maritime boundaries used for geofencing
 */
export const marineBoundaries = pgTable("marine_boundaries", {
  id: serial("id").primaryKey(),

  boundaryId: varchar("boundary_id", {
    length: 150,
  })
    .notNull()
    .unique(),

  name: varchar("name", {
    length: 200,
  }),

  country: varchar("country", {
    length: 150,
  }),

  boundaryType: varchar("boundary_type", {
    length: 100,
  }).notNull(),

  geometry: boundaryGeometry("geometry").notNull(),

  source: varchar("source", {
    length: 200,
  }).notNull(),

  sourceDate: timestamp("source_date", {
    withTimezone: true,
  }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  status: varchar("status", {
    length: 30,
  })
    .default("valid")
    .notNull(),

  notes: text("notes"),
});

/*
 * RAG knowledge chunks
 *
 * Stores source documents split into searchable chunks
 * together with their OpenAI embedding vectors.
 */
export const ragDocuments = pgTable("rag_documents", {
  id: serial("id").primaryKey(),

  content: text("content").notNull(),

  source: varchar("source", {
    length: 500,
  }).notNull(),

  title: varchar("title", {
    length: 300,
  }),

  embedding: vector("embedding", {
    dimensions: 1536,
  }).notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});