const { Agenda, AgendaPeriod, associate } = require('./agenda-model');

associate();

module.exports = {
  Agenda,
  AgendaPeriod
};
