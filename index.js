
if (process.env.NODE_ENV !== "production") {
  require('dotenv').config(); // load .env only in dev
}
const app = require('./app');   
const PORT = process.env.PORT || 2000;
const pool = require('./config/pool.js')
const sequelize = require('./config/database.js'); 

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});