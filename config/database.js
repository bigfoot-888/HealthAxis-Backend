const { Sequelize } = require('sequelize');
console.log(process.env.DATABASE_URL)
const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
          dialect: 'postgres',
          logging: console.log,
          dialectOptions: { ssl: { rejectUnauthorized: false } },
      })
    : new Sequelize(
          process.env.PGDATABASE,
          process.env.PGUSER,
          process.env.PGPASSWORD,
          {
              host: process.env.PGHOST,
              port: process.env.PGPORT,
              dialect: 'postgres',
              logging: console.log,
          },
      );

async function testDB() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

testDB();

module.exports = sequelize;
