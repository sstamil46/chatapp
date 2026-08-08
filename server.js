require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const path = require('path');

const User = require('./models/User');
const Message = require('./models/Message');
const authMiddleware = require('./middleware/auth');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
})
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('👉 Fix: Go to Atlas > Network Access > Add IP > Allow 0.0.0.0/0');
    process.exit(1);
  });
// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Auth Routes ────────────────────────────────────────────────────────────

// Serve register page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// POST /api/register
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields are required.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ error: 'Invalid email address.' });

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, name: user.name, email: user.email });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, name: user.name, email: user.email });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// ─── Chat Routes (protected) ─────────────────────────────────────────────────

// POST /api/chat
app.post('/api/chat', authMiddleware, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim())
    return res.status(400).json({ error: 'Message is required.' });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(message);
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

// GET /api/chat — fetch current user's messages only
app.get('/api/chat', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// ─── Static fallback ─────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use. Trying port ${PORT + 1}...`);
    server.close();
    app.listen(PORT + 1, () => console.log(`Server running on http://localhost:${PORT + 1}`));
  } else {
    console.error('Server error:', err.message);
  }
});
