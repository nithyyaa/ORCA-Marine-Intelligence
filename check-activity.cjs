require("dotenv").config({ path: ".env.local" });

const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL);

sql.unsafe("SELECT pid, state, wait_event_type, wait_event, query FROM pg_stat_activity WHERE datname = 'orca_marine' AND pid <> pg_backend_pid()")
  .then((result) => {
    console.log(result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("ERROR:", error.message);
    process.exit(1);
  });
