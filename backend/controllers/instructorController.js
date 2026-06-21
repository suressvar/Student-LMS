// backend/controllers/instructorController.js
const path = require('path');
const fs = require('fs');
const { pool } = require('../db/db');
const multer = require('multer');

// Configure Multer storage for instructor uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'instructor');
    // Ensure directory exists
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Preserve original name with timestamp to avoid collisions
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});

// Accept limited file types (PDF, image, zip) – can be extended later
const fileFilter = (req, file, cb) => {
  const allowed = /\.(pdf|png|jpg|jpeg|gif|zip)$/i;
  if (allowed.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } }).single('file');

// Controller to handle file upload
exports.uploadFile = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    // Respond with file metadata
    const fileMeta = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: `/uploads/instructor/${req.file.filename}`
    };
    res.json({ success: true, file: fileMeta });
  });
};

// Controller to retrieve students for the logged‑in instructor
exports.getStudents = async (req, res) => {
  const instructorId = req.user.id; // assume JWT contains user id
  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.email, s.level, s.avatar_svg
       FROM users s
       JOIN enrollments e ON e.student_id = s.id
       JOIN courses c ON c.id = e.course_id
       WHERE c.instructor_id = $1
       GROUP BY s.id`
      , [instructorId]
    );
    res.json({ students: result.rows });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to retrieve students' });
  }
};
