// backend/routes/instructor.js
const express = require('express');
const router = express.Router();
const { uploadFile, getStudents } = require('../controllers/instructorController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware to ensure user is instructor
router.use(authenticateToken);
router.use(authorizeRoles('instructor'));

// File upload endpoint
router.post('/upload', uploadFile);

// Get list of students for instructor's courses
router.get('/students', getStudents);

module.exports = router;
