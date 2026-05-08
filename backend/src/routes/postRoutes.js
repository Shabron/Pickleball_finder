const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { getPosts, createPost, updatePost, getMyPosts, getPostById, getReplies, addReply } = require('../controllers/postController');

// GET /api/posts/my — list logged in user's posts
router.get('/my', protect, getMyPosts);

// GET /api/posts/:id/replies — list replies for a post (public)
router.get('/:id/replies', getReplies);

// POST /api/posts/:id/replies — add a reply to a post (authenticated)
router.post('/:id/replies', protect, addReply);

// GET /api/posts/:id — get a single post
router.get('/:id', getPostById);

// GET /api/posts — list posts (optionally filtered)
router.get('/', getPosts);

// POST /api/posts — create a new post
router.post('/', protect, createPost);

// PUT /api/posts/:id — update your own post
router.put('/:id', protect, updatePost);

module.exports = router;

