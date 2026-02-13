
const pg = require("pg")
const { Pool, Client } = pg
 
const pool = new Pool();
module.exports = pool; 