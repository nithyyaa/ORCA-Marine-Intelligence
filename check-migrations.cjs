require("dotenv").config({ path: ".env.local" });

const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL);

sql.unsafe("SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at")
  .then((result) => {
    console.log(result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("ERROR:", error.message);
    process.exit(1);
  });
