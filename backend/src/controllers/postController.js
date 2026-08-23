const Post = require('../models/Post');
const Reply = require('../models/Reply');
const SavedPost = require('../models/SavedPost');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');
const { sendPushNotification } = require('../utils/push');
const { geocodeApprox } = require('../utils/geocode');

const removeUndefined = (obj) => {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) delete cleaned[key];
  });
  return cleaned;
};

// @desc    List posts — not bound to a single state; when the caller's lat/lng
//          are known, sorted nearest-first by real distance instead.
// @route   GET /api/posts?lat=&lng=&state=&skillLevel=&playStyle=&status=&page=&limit=
// @access  Public
const getPosts = async (req, res) => {
  try {
    const { state, skillLevel, playStyle, status, page = '1', limit = '20', lat, lng } = req.query;

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

    const latNum = Number(lat);
    const lngNum = Number(lng);
    const hasViewerLocation = !Number.isNaN(latNum) && !Number.isNaN(lngNum) && lat !== undefined && lng !== undefined;

    let posts;
    let total;

    if (hasViewerLocation) {
      // Nearest-first: geocoded posts sorted by real distance from the viewer.
      const MAX_CANDIDATES = 500; // safety cap, not a hard page size
      const nearPosts = await Post.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lngNum, latNum] },
            distanceField: 'distanceMeters',
            spherical: true,
            query: { ...filter, location: { $exists: true, $ne: null } },
            key: 'location',
          },
        },
        { $sort: { distanceMeters: 1 } },
        { $limit: MAX_CANDIDATES },
      ]);

      // Legacy posts with no geocoded location — appended after (newest
      // first) so nothing silently disappears while data backfills.
      const noLocationPosts = await Post.find({
        ...filter,
        $or: [{ location: { $exists: false } }, { location: null }],
      })
        .sort({ createdAt: -1 })
        .limit(MAX_CANDIDATES)
        .lean();

      const combined = [
        ...nearPosts.map((p) => ({ ...p, distanceKm: Math.round((p.distanceMeters / 1000) * 10) / 10 })),
        ...noLocationPosts,
      ];
      total = combined.length;
      const page = combined.slice(skip, skip + limitNum);
      posts = await Post.populate(page, { path: 'author', select: 'name email' });
    } else {
      // Viewer location unknown — fall back to newest-first, everywhere.
      total = await Post.countDocuments(filter);
      posts = await Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('author', 'name email');
    }

    return res.status(200).json({
      success: true,
      data: {
        posts,
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

    const approx = geocodeApprox({ city, state });
    const location = approx ? { type: 'Point', coordinates: [approx.longitude, approx.latitude] } : undefined;

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
      location,
    });

    const post = await Post.create(postFields);

    // Populate author details for client display
    const populatedPost = await Post.findById(post._id).populate('author', 'name email');

    // Notification Logic for New Post Nearby
    try {
      // Find all profiles in the same state (basic proximity) with nearbyPosts enabled
      const nearbyProfiles = await Profile.find({
        state: state,
        user: { $ne: req.user._id }
      });
      
      const authorProfile = await Profile.findOne({ user: req.user._id }).populate('user', 'name');
      const authorName = authorProfile?.user?.name || 'Someone';

      const notificationsToInsert = nearbyProfiles
        .filter(p => p.notificationSettings?.nearbyPosts !== false)
        .map(p => ({
          recipient: p.user,
          type: 'new_post_nearby',
          title: `New Post in ${state}`,
          body: `${authorName} is looking to play: ${title}`,
          referenceId: post._id,
        }));

      if (notificationsToInsert.length > 0) {
        await Notification.insertMany(notificationsToInsert);
      }
    } catch (notifErr) {
      console.error('Failed to send new post notifications', notifErr);
    }

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

    let location;
    if (state || city) {
      const approx = geocodeApprox({ city, state });
      if (approx) location = { type: 'Point', coordinates: [approx.longitude, approx.latitude] };
    }

    const postFields = removeUndefined({
      title,
      description,
      state,
      city,
      skillLevel,
      playStyle,
      preferredTime,
      status,
      location,
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

    // Notification Logic for New Reply
    try {
      if (post.author.toString() !== req.user._id.toString()) {
        const postOwnerProfile = await Profile.findOne({ user: post.author });
        const replierProfile = await Profile.findOne({ user: req.user._id }).populate('user', 'name');
        const replierName = replierProfile?.user?.name || 'Someone';

        if (postOwnerProfile?.notificationSettings?.replies !== false) {
          await Notification.create({
            recipient: post.author,
            type: 'new_reply',
            title: 'New Reply on your Post',
            body: `${replierName} replied: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            referenceId: post._id,
          });
          await sendPushNotification(post.author, {
            title: 'New Reply on your Post',
            body: `${replierName} replied: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            data: { type: 'new_reply', referenceId: post._id.toString() },
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to send reply notification', notifErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save a post
// @route   POST /api/posts/:id/save
// @access  Private
const savePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    try {
      await SavedPost.create({ user: req.user._id, post: req.params.id });
    } catch (err) {
      if (err.code !== 11000) throw err; // already saved — treat as success
    }

    return res.status(200).json({ success: true, message: 'Post saved' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unsave a post
// @route   DELETE /api/posts/:id/save
// @access  Private
const unsavePost = async (req, res) => {
  try {
    await SavedPost.findOneAndDelete({ user: req.user._id, post: req.params.id });
    return res.status(200).json({ success: true, message: 'Post unsaved' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's saved posts
// @route   GET /api/posts/saved/my
// @access  Private
const getSavedPosts = async (req, res) => {
  try {
    const savedPosts = await SavedPost.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'post',
        populate: { path: 'author', select: 'name email' },
      });

    const posts = savedPosts.map((s) => s.post).filter(Boolean);

    return res.status(200).json({
      success: true,
      data: { posts },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPosts,
  createPost,
  updatePost,
  getMyPosts,
  getPostById,
  getReplies,
  addReply,
  savePost,
  unsavePost,
  getSavedPosts,
};

