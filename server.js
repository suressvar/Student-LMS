const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and parsing requests
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file uploads securely
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Serve static frontend files from workspace root
app.use(express.static(path.join(__dirname)));

// Initialize database tables and relations
initDb();

// Setup API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notifications', require('./routes/notifications'));

// Fallback to index.html for undefined requests
app.get('/:path*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start listening
app.listen(PORT, () => {
    console.log(`CourseVerse Server running on port ${PORT}`);
    console.log(`Interface available at http://localhost:${PORT}`);
});
