import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);

(async () => {
  try {
    const result = await sql.query(
      "SELECT * FROM student_accounts WHERE email = $1 LIMIT 1",
      ["ivanovaanastasiya145@gmail.com"]
    );
    console.log("Result type:", Array.isArray(result) ? "array" : typeof result);
    console.log("Result:", result);
    
    if (Array.isArray(result) && result.length > 0) {
      console.log("\nFound account:", result[0]);
    } else {
      console.log("\nAccount not found! Checking all accounts:");
      const all = await sql.query("SELECT email FROM student_accounts LIMIT 5");
      console.log("All accounts:", all);
    }
  } catch (err) {
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);
  }
})();
