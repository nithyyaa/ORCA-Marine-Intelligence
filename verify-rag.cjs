require("dotenv").config({ path: ".env.local" });
const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL);

sql.unsafe("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rag_documents' ORDER BY ordinal_position")
  .then((result) => {
    console.log(result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("ERROR:", error.message);
    process.exit(1);
  });
