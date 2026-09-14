require("dotenv").config({ path: ".env.local" });

const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL);

sql.unsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rag_documents'")
  .then((result) => {
    console.log(result);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
