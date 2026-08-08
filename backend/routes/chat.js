const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Message      = require('../../database/models/Message');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/chat
router.post('/', authMiddleware, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim())
    return res.status(400).json({ error: 'Message is required.' });

  try {
    const model     = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result    = await model.generateContent(message);
    const aiResponse = result.response.text();

    const saved = await Message.create({
      userId: req.user.id,
      userMessage: message,
      aiResponse
    });

    res.json({ aiResponse, id: saved._id });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Failed to get AI response.' });
  }
});

// GET /api/chat
router.get('/', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

module.exports = router;
