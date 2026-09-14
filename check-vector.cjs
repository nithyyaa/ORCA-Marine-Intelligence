require("dotenv").config({ path: ".env.local" });

const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL);

sql.unsafe("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'")
  .then((result) => {
    console.log(result);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
