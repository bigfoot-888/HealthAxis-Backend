if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

const app = require('./app');   
const sequelize = require('./config/database.js'); 

const User = require('./models/user.model');
const Patient = require('./models/patient.model');
const { Agenda, AgendaPeriod, associate: associateAgendas } = require('./models/agenda.model');

(async () => {
  if (process.env.RUN_DB_SYNC === "true") {
    console.log("Running DB sync...");
    await sequelize.sync({ force: true });
    console.log("Tables created!");
  }

  const PORT = process.env.PORT || 2000;
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
})();
