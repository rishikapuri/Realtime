const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  updateUser,
  getUserStatus
} = require('../controllers/userController');

const router = express.Router();

router.get('/', protect, getAllUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.get('/:id/status', protect, getUserStatus);

module.exports = router;
