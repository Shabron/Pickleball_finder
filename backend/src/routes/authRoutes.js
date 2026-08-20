const express = require('express');
const router = express.Router();
const { signup, login, forgotPassword, resetPassword, getMe, deleteMe, sendEmailVerification, confirmEmailVerification } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me — validate token & return current user
router.get('/me', protect, getMe);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// DELETE /api/auth/delete — delete account and data
router.delete('/delete', protect, deleteMe);

// POST /api/auth/verify-email/send — send (or resend) an email verification code
router.post('/verify-email/send', protect, sendEmailVerification);

// POST /api/auth/verify-email/confirm — confirm the emailed verification code
router.post('/verify-email/confirm', protect, confirmEmailVerification);

module.exports = router;
