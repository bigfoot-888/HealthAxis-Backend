require('dotenv').config();
const sequelize = require('../config/database');
const { User } = require('../models/user-model');
const { Patient } = require('../models/patient-model'); 
const { Agenda, AgendaPeriod, associate: associateAgendas } = require('../models/agenda-model'); 

associateAgendas();

(async () => {
  await sequelize.sync({ force: false }); // drops & recreates tables
  console.log("Tables created!");
})();


// 'use strict';

// module.exports = {
//   async up(queryInterface, Sequelize) {
//     await queryInterface.sequelize.query(`
//       ALTER TABLE "AgendaPeriods"
//       ADD CONSTRAINT agenda_period_dates_check
//       CHECK (opening_date <= closing_date)
//     `);
//   },

//   async down(queryInterface, Sequelize) {
//     await queryInterface.sequelize.query(`
//       ALTER TABLE "AgendaPeriods"
//       DROP CONSTRAINT agenda_period_dates_check
//     `);
//   }
// };

// npx sequelize-cli db:migrate
