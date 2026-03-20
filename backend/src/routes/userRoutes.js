const express = require('express');
const router = express.Router();

// Placeholder routes — wire up controllers as needed
router.get('/', (req, res) => {
  res.json({ message: 'User routes working' });
});

module.exports = router;
