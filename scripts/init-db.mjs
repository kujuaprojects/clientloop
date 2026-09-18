import pg from "pg";
import { readFileSync } from "fs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

const sql = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
await pool.query(sql);
console.log("Database schema initialized.");
await pool.end();
