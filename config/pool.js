
const pg = require("pg")
const { Pool, Client } = pg
 
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {} // Uses local PG env vars
);

module.exports = pool; 