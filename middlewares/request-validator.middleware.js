const { validationResult } = require('express-validator');
const ValidationError = require('../errors/ValidationError');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Error, los campos no cumplen los requisitos de validación', errors.array());
  }
  next();
}

module.exports = validateRequest;
