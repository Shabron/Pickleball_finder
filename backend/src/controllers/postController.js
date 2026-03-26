const Post = require('../models/Post');

const removeUndefined = (obj) => {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) delete cleaned[key];
  });
  return cleaned;
};

// @desc    List posts
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const { state, skillLevel, playStyle, status, page = '1', limit = '20' } = req.query;

    const pageNum = Number.parseInt(page, 10) || 1;
    const limitNum = Number.parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter = removeUndefined({
      state,
      skillLevel,
      playStyle,
      status,
    });

    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('author', 'name email');

    return res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const { title, description, state, city, skillLevel, playStyle, preferredTime, status } = req.body;

    // Basic required validation
    if (!title || !description || !state) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and state',
      });
    }

    const postFields = removeUndefined({
      author: req.user._id,
      title,
      description,
      state,
      city,
      skillLevel,
      playStyle,
      preferredTime,
      status,
    });

    const post = await Post.create(postFields);

    // Populate author details for client display
    const populatedPost = await Post.findById(post._id).populate('author', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: populatedPost,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update own post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  try {
    const { title, description, state, city, skillLevel, playStyle, preferredTime, status } = req.body;

    const postFields = removeUndefined({
      title,
      description,
      state,
      city,
      skillLevel,
      playStyle,
      preferredTime,
      status,
    });

    const updatedPost = await Post.findOneAndUpdate(
      { _id: req.params.id, author: req.user._id },
      { $set: postFields },
      { new: true }
    ).populate('author', 'name email');

    if (!updatedPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPosts, createPost, updatePost };

