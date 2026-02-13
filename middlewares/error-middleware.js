function errorMiddlware(err, req, res, next) {
    if (err.isOperational) {
        console.dir({
            message: err.message,
            status: err.status,
            details: err.details,
            stack: err.stack,
        },{ depth: null });
        return res
            .status(err.status)
            .json({
                message: err.message || 'Ha ocurrido un error inesperado.',
                details: err.details,
            });
    } else return res.status(500).json({ message: 'Internal server error.' });
}

module.exports = errorMiddlware;
