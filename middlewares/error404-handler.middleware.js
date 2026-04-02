function error404Middlware(req, res, next) {
    return res
        .status(404)
        .json({ message: `La dirección ${req.url} no existe.` });
}

module.exports = error404Middlware;
