const express = require('express');
const router = express.Router();
const postsController = require('../controllers/posts.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, postsController.getAllPosts);
router.patch('/:id/status', authMiddleware, postsController.updateStatus);

module.exports = router;
