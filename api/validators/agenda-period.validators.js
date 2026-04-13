const { check } = require('express-validator');
const ValidationError = require('../../errors/ValidationError');

const createAgendaPeriodRules = [
    check('openingDate')
        .notEmpty()
        .withMessage('La fecha de apertura es obligatoria')
        .custom((value) => {
            const openingDate = new Date(value);
            const today = new Date();

            // Remove time part so "today" works correctly
            today.setHours(0, 0, 0, 0);
            openingDate.setHours(0, 0, 0, 0);

            if (openingDate < today) {
                throw new ValidationError(
                    'La fecha de apertura no puede ser anterior a hoy',
                    { openingDate: value },
                );
            }

            return true;
        }),

    check('closingDate')
        .notEmpty()
        .withMessage('La fecha de cierre es obligatoria')
        .custom((value, { req }) => {
            const closingDate = new Date(value);
            const openingDate = new Date(req.body.openingDate);

            closingDate.setHours(0, 0, 0, 0);
            openingDate.setHours(0, 0, 0, 0);

            if (closingDate < openingDate) {
                throw new ValidationError(
                    'La fecha de cierre no puede ser anterior a la fecha de apertura',
                    {
                        closingDate: value,
                        openingDate: req.body.openingDate,
                    },
                );
            }
            return true;
        }),
];

const updateAgendaPeriodRules = [
    check('closingDate')
        .notEmpty()
        .withMessage('La fecha de cierre es obligatoria')
        .custom((value, { req }) => {
            const closingDate = new Date(value);
            const openingDate = new Date(req.body.openingDate);
            const today = new Date();

            today.setHours(0, 0, 0, 0); 
            closingDate.setHours(0, 0, 0, 0);
            openingDate.setHours(0, 0, 0, 0);

            if (closingDate < openingDate) {
                throw new ValidationError(
                    'La fecha de cierre no puede ser anterior a la fecha de apertura',
                    {
                        closingDate: value,
                        openingDate: req.body.openingDate,
                    },
                );
            }
            else if (closingDate < today) {
                throw new ValidationError(
                    'La fecha de cierre no puede ser anterior a hoy',
                    { closingDate: value },
                );
            }
            return true;
        }),
];

module.exports = {
    createAgendaPeriodRules,
    updateAgendaPeriodRules,
}
