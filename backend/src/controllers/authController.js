const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../utils/mailer');
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const Reply = require('../models/Reply');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Generate + store a hashed 6-digit code on the user, then email it.
// Shared by signup's auto-send and the explicit resend endpoint.
const issueVerificationCode = async (user) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailVerificationToken = crypto.createHash('sha256').update(code).digest('hex');
  user.emailVerificationExpire = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });
  await sendVerificationEmail(user.email, code);
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { name, email, password, phone, skillLevel, playStyle, state, city, zipCode, ageRange, bio, availability } = req.body;

    // Check if required fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Create user
    const user = await User.create({ name, email, password });

    // Create profile if any profile fields are provided
    const hasProfileData = phone || skillLevel || playStyle || state || city || zipCode || ageRange || bio || availability;

    let profile = null;
    if (hasProfileData) {
      const profileFields = { user: user._id, phone, skillLevel, playStyle, state, city, zipCode, ageRange, bio, availability };
      // Remove undefined fields
      Object.keys(profileFields).forEach((key) => {
        if (profileFields[key] === undefined) delete profileFields[key];
      });
      // Mark as complete if key fields are filled
      profileFields.profileComplete = !!(skillLevel && state && city);
      profile = await Profile.create(profileFields);
    }

    // Generate token
    const token = generateToken(user._id);

    // Fire-and-forget — don't block signup on email delivery.
    issueVerificationCode(user).catch((err) =>
      console.error(`[signup] Failed to send verification email to ${user.email}:`, err)
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token,
        profileComplete: profile ? profile.profileComplete : false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Check profile
    const profile = await Profile.findOne({ user: user._id });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token,
        profileComplete: profile ? profile.profileComplete : false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot password — emails a 6-digit reset code
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`[forgotPassword] Request received for email: ${email}`);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email' });
    }

    const user = await User.findOne({ email });
    console.log(`[forgotPassword] User lookup for ${email} → ${user ? 'found' : 'not found'}`);

    // Only generate/send a code if the account exists, but always return the
    // same generic response so requests can't be used to discover which
    // emails are registered.
    if (user) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[forgotPassword] Generated code for ${email}: ${code} (logged only outside production)`);
      }

      user.resetPasswordToken = crypto.createHash('sha256').update(code).digest('hex');
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
      await user.save({ validateBeforeSave: false });
      console.log(`[forgotPassword] Reset code stored for ${email}, expires in 10 minutes`);

      try {
        console.log(`[forgotPassword] Attempting to send reset email to ${email}...`);
        await sendPasswordResetEmail(user.email, code);
        console.log(`[forgotPassword] Reset email sent successfully to ${email}`);
      } catch (emailError) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        console.error(`[forgotPassword] Failed to send reset email to ${email}:`, emailError);
        return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again later.' });
      }
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a reset code has been sent.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password using the emailed code
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email, code, and a new password' });
    }

    // Hash the submitted code to compare against the stored hash
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Find user by email + code and check expiry
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedCode,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    // Set new password & clear reset fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Auto-login after reset
    const token = generateToken(user._id);

    // Check profile
    const profile = await Profile.findOne({ user: user._id });

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token,
        profileComplete: profile ? profile.profileComplete : false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send (or resend) an email verification code
// @route   POST /api/auth/verify-email/send
// @access  Private
const sendEmailVerification = async (req, res) => {
  try {
    if (req.user.emailVerified) {
      return res.status(200).json({ success: true, message: 'Email already verified' });
    }

    await issueVerificationCode(req.user);

    res.status(200).json({ success: true, message: 'A verification code has been sent to your email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again later.' });
  }
};

// @desc    Confirm the emailed verification code
// @route   POST /api/auth/verify-email/confirm
// @access  Private
const confirmEmailVerification = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide the verification code' });
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    if (
      req.user.emailVerificationToken !== hashedCode ||
      !req.user.emailVerificationExpire ||
      req.user.emailVerificationExpire < Date.now()
    ) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    req.user.emailVerified = true;
    req.user.emailVerificationToken = undefined;
    req.user.emailVerificationExpire = undefined;
    await req.user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Email verified' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = req.user;
    const profile = await Profile.findOne({ user: user._id });
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        profileComplete: profile ? profile.profileComplete : false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete current logged in user and all their data
// @route   DELETE /api/auth/delete
// @access  Private
const deleteMe = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Delete user's Profile
    await Profile.findOneAndDelete({ user: userId });

    // 2. Delete user's Replies
    await Reply.deleteMany({ author: userId });

    // 3. Delete user's Posts
    const userPosts = await Post.find({ author: userId });
    const postIds = userPosts.map(post => post._id);
    if (postIds.length > 0) {
      await Reply.deleteMany({ post: { $in: postIds } });
      await Post.deleteMany({ _id: { $in: postIds } });
    }

    // 4. Delete user's messages
    await Message.deleteMany({ senderId: userId });

    // 5. Delete user's Conversations
    const userConvs = await Conversation.find({ participants: userId });
    const convIds = userConvs.map(c => c._id);
    if (convIds.length > 0) {
      await Message.deleteMany({ conversationId: { $in: convIds } });
      await Conversation.deleteMany({ _id: { $in: convIds } });
    }

    // 6. Delete user's Notifications
    await Notification.deleteMany({ recipient: userId });

    // 7. Delete User
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Account and all associated user data deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { signup, login, forgotPassword, resetPassword, getMe, deleteMe, sendEmailVerification, confirmEmailVerification };
