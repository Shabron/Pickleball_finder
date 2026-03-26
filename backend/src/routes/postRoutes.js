const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { getPosts, createPost, updatePost } = require('../controllers/postController');

// GET /api/posts — list posts (optionally filtered)
router.get('/', getPosts);

// POST /api/posts — create a new post
router.post('/', protect, createPost);

// PUT /api/posts/:id — update your own post
router.put('/:id', protect, updatePost);

module.exports = router;

