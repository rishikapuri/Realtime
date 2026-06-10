const Conversation = require('../models/Conversation');
const User = require('../models/User');

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ members: req.user.id })
      .populate('members', 'name avatar isOnline')
      .populate('lastMessage')
      .sort({ lastMessageTime: -1 });

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const { memberId, isGroup, name } = req.body;

    if (!memberId && !isGroup) {
      return res.status(400).json({ error: 'Member ID or isGroup flag required' });
    }

    // Check if conversation already exists (for 1-on-1)
    if (!isGroup) {
      const existingConversation = await Conversation.findOne({
        isGroup: false,
        members: { $all: [req.user.id, memberId] }
      });

      if (existingConversation) {
        return res.status(200).json({ success: true, conversation: existingConversation });
      }
    }

    const members = isGroup
      ? [req.user.id, ...memberId]
      : [req.user.id, memberId];

    const conversation = await Conversation.create({
      members,
      isGroup,
      name: isGroup ? name : null,
      admin: isGroup ? req.user.id : null
    });

    await conversation.populate('members', 'name avatar');

    res.status(201).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addMemberToConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { memberId } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.admin.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only admin can add members' });
    }

    if (conversation.members.includes(memberId)) {
      return res.status(400).json({ error: 'Member already in conversation' });
    }

    conversation.members.push(memberId);
    await conversation.save();
    await conversation.populate('members', 'name avatar');

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
