const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  updateSettings,
  getSettings,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All notification routes are protected
router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.route('/settings')
  .get(getSettings)
  .put(updateSettings);

module.exports = router;
