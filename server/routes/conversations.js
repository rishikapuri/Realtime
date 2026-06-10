const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getConversations,
  createConversation,
  addMemberToConversation
} = require('../controllers/conversationController');

const router = express.Router();

router.get('/', protect, getConversations);
router.post('/', protect, createConversation);
router.post('/:conversationId/members', protect, addMemberToConversation);

module.exports = router;
