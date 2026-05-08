const Post = require('../models/Post');
const Reply = require('../models/Reply');

const stateNeighbors = {
  AL: ['FL', 'GA', 'MS', 'TN'],
  AK: ['WA'], // No land borders with US, WA is closest
  AZ: ['CA', 'CO', 'NV', 'NM', 'UT'],
  AR: ['LA', 'MS', 'MO', 'OK', 'TN', 'TX'],
  CA: ['AZ', 'NV', 'OR'],
  CO: ['AZ', 'KS', 'NE', 'NM', 'OK', 'UT', 'WY'],
  CT: ['MA', 'NY', 'RI'],
  DE: ['MD', 'NJ', 'PA'],
  FL: ['AL', 'GA'],
  GA: ['AL', 'FL', 'NC', 'SC', 'TN'],
  HI: ['CA'], // Closest
  ID: ['MT', 'NV', 'OR', 'UT', 'WA', 'WY'],
  IL: ['IN', 'IA', 'MI', 'KY', 'MO', 'WI'],
  IN: ['IL', 'KY', 'MI', 'OH'],
  IA: ['IL', 'MN', 'MO', 'NE', 'SD', 'WI'],
  KS: ['CO', 'MO', 'NE', 'OK'],
  KY: ['IL', 'IN', 'MO', 'OH', 'TN', 'VA', 'WV'],
  LA: ['AR', 'MS', 'TX'],
  ME: ['NH'],
  MD: ['DE', 'PA', 'VA', 'WV'],
  MA: ['CT', 'NH', 'NY', 'RI', 'VT'],
  MI: ['IL', 'IN', 'OH', 'WI'],
  MN: ['IA', 'MI', 'ND', 'SD', 'WI'],
  MS: ['AL', 'AR', 'LA', 'TN'],
  MO: ['AR', 'IL', 'IA', 'KS', 'KY', 'NE', 'OK', 'TN'],
  MT: ['ID', 'ND', 'SD', 'WY'],
  NE: ['CO', 'IA', 'KS', 'MO', 'SD', 'WY'],
  NV: ['AZ', 'CA', 'ID', 'OR', 'UT'],
  NH: ['ME', 'MA', 'VT'],
  NJ: ['DE', 'NY', 'PA'],
  NM: ['AZ', 'CO', 'OK', 'TX', 'UT'],
  NY: ['CT', 'MA', 'NJ', 'PA', 'VT'],
  NC: ['GA', 'SC', 'TN', 'VA'],
  ND: ['MN', 'MT', 'SD'],
  OH: ['IN', 'KY', 'MI', 'PA', 'WV'],
  OK: ['AR', 'CO', 'KS', 'MO', 'NM', 'TX'],
  OR: ['CA', 'ID', 'NV', 'WA'],
  PA: ['DE', 'MD', 'NJ', 'NY', 'OH', 'WV'],
  RI: ['CT', 'MA'],
  SC: ['GA', 'NC'],
  SD: ['IA', 'MN', 'MT', 'NE', 'ND', 'WY'],
  TN: ['AL', 'AR', 'GA', 'KY', 'MS', 'MO', 'NC', 'VA'],
  TX: ['AR', 'LA', 'NM', 'OK'],
  UT: ['AZ', 'CO', 'ID', 'NV', 'NM', 'WY'],
  VT: ['MA', 'NH', 'NY'],
  VA: ['KY', 'MD', 'NC', 'TN', 'WV'],
  WA: ['ID', 'OR'],
  WV: ['KY', 'MD', 'OH', 'PA', 'VA'],
  WI: ['IL', 'IA', 'MI', 'MN'],
  WY: ['CO', 'ID', 'MT', 'NE', 'SD', 'UT'],
  DC: ['MD', 'VA']
};

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
      author: req.query.author,
    });

    let total = await Post.countDocuments(filter);
    let posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('author', 'name email');

    let fallbackUsed = false;

    // Fallback logic if no posts found in the requested state
    if (posts.length === 0 && state) {
      fallbackUsed = true;
      const neighbors = stateNeighbors[state] || [];
      
      if (neighbors.length > 0) {
        filter.state = { $in: neighbors };
        total = await Post.countDocuments(filter);
        posts = await Post.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('author', 'name email');
      }

      // If still empty, drop the state filter entirely to show ANY posts
      if (posts.length === 0) {
        delete filter.state;
        total = await Post.countDocuments(filter);
        posts = await Post.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('author', 'name email');
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        posts,
        fallbackUsed,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
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

// @desc    Get user's own posts
// @route   GET /api/posts/my
// @access  Private
const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'name email');

    return res.status(200).json({
      success: true,
      data: { posts },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name email');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get replies for a post
// @route   GET /api/posts/:id/replies
// @access  Public
const getReplies = async (req, res) => {
  try {
    const replies = await Reply.find({ post: req.params.id })
      .sort({ createdAt: 1 })
      .populate('author', 'name email');

    return res.status(200).json({
      success: true,
      data: { replies },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a reply to a post
// @route   POST /api/posts/:id/replies
// @access  Private
const addReply = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Reply content is required' });
    }

    // Ensure the post exists
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const reply = await Reply.create({
      post: req.params.id,
      author: req.user._id,
      content: content.trim(),
    });

    const populated = await Reply.findById(reply._id).populate('author', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPosts, createPost, updatePost, getMyPosts, getPostById, getReplies, addReply };

