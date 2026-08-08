require('dotenv').config({ path: '../.env' });

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const connectDB = require('../database/db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cors());

// ── Serve frontend static files ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api/chat', chatRoutes);

// ── Page Routes ───────────────────────────────────────────────────────────────
app.get('/', (_req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/login.html')));

app.get('/register', (_req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/register.html')));

app.get('/dashboard', (_req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html')));

// ── Connect DB & Start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  const server = app.listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`));

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} in use, trying ${PORT + 1}...`);
      app.listen(PORT + 1, () =>
        console.log(`Server running on http://localhost:${PORT + 1}`));
    } else {
      console.error('Server error:', err.message);
    }
  });
});
