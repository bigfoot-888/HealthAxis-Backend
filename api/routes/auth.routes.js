
const router = require('express').Router();
const controller = require('../controllers/auth.controller');

router.post('/login', controller.login);
router.get('/me', controller.me);
router.post('/logout', controller.logout);

module.exports = router;