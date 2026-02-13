const { check } = require('express-validator');
const ValidationError = require('../../errors/ValidationError');

const createAgendaPeriodRules = [
    check('opening_date')
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
                    { opening_date: value },
                );
            }

            return true;
        }),

    check('closing_date')
        .notEmpty()
        .withMessage('La fecha de cierre es obligatoria')
        .custom((value, { req }) => {
            const closingDate = new Date(value);
            const openingDate = new Date(req.body.opening_date);

            closingDate.setHours(0, 0, 0, 0);
            openingDate.setHours(0, 0, 0, 0);

            if (closingDate < openingDate) {
                throw new ValidationError(
                    'La fecha de cierre no puede ser anterior a la fecha de apertura',
                    {
                        closing_date: value,
                        opening_date: req.body.opening_date,
                    },
                );
            }
            return true;
        }),
];

const updateAgendaPeriodRules = [
    check('closing_date')
        .notEmpty()
        .withMessage('La fecha de cierre es obligatoria')
        .custom((value, { req }) => {
            const closingDate = new Date(value);
            const openingDate = new Date(req.body.opening_date);
            const today = new Date();

            today.setHours(0, 0, 0, 0); 
            closingDate.setHours(0, 0, 0, 0);
            openingDate.setHours(0, 0, 0, 0);

            if (closingDate < openingDate) {
                throw new ValidationError(
                    'La fecha de cierre no puede ser anterior a la fecha de apertura',
                    {
                        closing_date: value,
                        opening_date: req.body.opening_date,
                    },
                );
            }
            else if (closingDate < today) {
                throw new ValidationError(
                    'La fecha de cierre no puede ser anterior a hoy',
                    { closing_date: value },
                );
            }
            return true;
        }),
];

module.exports = {
    createAgendaPeriodRules,
    updateAgendaPeriodRules,
}
