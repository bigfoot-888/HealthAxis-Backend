const { Sequelize } = require('sequelize');

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
          dialect: 'postgres',
          logging: false, 
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
              logging: false, 
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

if (process.env.NODE_ENV !== 'test') {
    testDB();
}

module.exports = sequelize;