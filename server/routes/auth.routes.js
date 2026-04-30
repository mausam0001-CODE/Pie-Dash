const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.get('/callback', authController.handleFacebookCallback);

module.exports = router;
