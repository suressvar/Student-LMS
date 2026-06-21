const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../../db/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${Date.now()}-${name}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 1. Get assignments for a course
router.get('/course/:courseId', authenticateToken, async (req, res) => {
    const courseId = req.params.courseId;
    try {
        const result = await pool.query(
            `SELECT a.*, 
                    s.id as submission_id, s.content as submission_content, s.file_url, s.grade, s.feedback, s.status as submission_status, s.submitted_at
             FROM assignments a
             LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
             WHERE a.course_id = $2
             ORDER BY a.deadline ASC`,
            [req.user.id, courseId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error retrieving assignments.' });
    }
});

// 2. Create an assignment (Instructor only)
router.post('/', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const { course_id, title, description, deadline } = req.body;

    if (!course_id || !title || !description || !deadline) {
        return res.status(400).json({ error: 'Course ID, Title, Description, and Deadline are required.' });
    }

    try {
        // Verify course ownership
        const courseCheck = await pool.query('SELECT * FROM courses WHERE id = $1', [course_id]);
        if (courseCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found.' });
        }
        if (courseCheck.rows[0].instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied. You do not own this course.' });
        }

        const result = await pool.query(
            `INSERT INTO assignments (course_id, title, description, deadline)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [course_id, title, description, deadline]
        );

        // Notify enrolled students
        const enrolledStudents = await pool.query('SELECT student_id FROM enrollments WHERE course_id = $1', [course_id]);
        for (const student of enrolledStudents.rows) {
            await pool.query(
                'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
                [student.student_id, `New mission task uploaded: '${title}' for course: ${courseCheck.rows[0].title}. Check deadlines!`]
            );
        }

        res.status(201).json({
            message: 'New assignment registry published.',
            assignment: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error publishing assignment.' });
    }
});

// 3. Submit an assignment (Student only, supports optional file upload)
router.post('/:id/submit', authenticateToken, authorizeRoles('student'), upload.single('file'), async (req, res) => {
    const assignmentId = req.params.id;
    const { content } = req.body;
    let fileUrl = null;

    if (req.file) {
        // Store path relative to server URL
        fileUrl = `/uploads/${req.file.filename}`;
    }

    try {
        // Verify assignment exists
        const assignCheck = await pool.query(
            `SELECT a.*, c.title as course_title 
             FROM assignments a 
             INNER JOIN courses c ON a.course_id = c.id 
             WHERE a.id = $1`, 
            [assignmentId]
        );
        if (assignCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Assignment not found.' });
        }

        // Verify student is enrolled
        const enrollCheck = await pool.query(
            'SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
            [req.user.id, assignCheck.rows[0].course_id]
        );
        if (enrollCheck.rows.length === 0) {
            return res.status(403).json({ error: 'You must be enrolled in the course to submit assignments.' });
        }

        // Delete previous submission if exists
        await pool.query('DELETE FROM submissions WHERE assignment_id = $1 AND student_id = $2', [assignmentId, req.user.id]);

        // Insert submission
        const result = await pool.query(
            `INSERT INTO submissions (assignment_id, student_id, content, file_url, status)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [assignmentId, req.user.id, content || '', fileUrl, 'submitted']
        );

        // Gain XP for submission
        await pool.query('UPDATE users SET xp = xp + 50 WHERE id = $1', [req.user.id]);
        
        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (user_id, action) VALUES ($1, $2)',
            [req.user.id, `Submitted assignment: ${assignCheck.rows[0].title}`]
        );

        res.status(201).json({
            message: 'Assignment files successfully received by command node. +50 XP gained!',
            submission: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error processing assignment submission.' });
    }
});

// 4. View submissions for an assignment (Instructor only)
router.get('/:id/submissions', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const assignmentId = req.params.id;
    try {
        // Verify ownership
        const assignCheck = await pool.query(
            `SELECT a.*, c.instructor_id 
             FROM assignments a 
             INNER JOIN courses c ON a.course_id = c.id 
             WHERE a.id = $1`, 
            [assignmentId]
        );
        
        if (assignCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Assignment not found.' });
        }
        if (assignCheck.rows[0].instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied. You do not own the parent course.' });
        }

        const result = await pool.query(
            `SELECT s.*, u.name as student_name, u.email as student_email
             FROM submissions s
             INNER JOIN users u ON s.student_id = u.id
             WHERE s.assignment_id = $1
             ORDER BY s.submitted_at DESC`,
            [assignmentId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching submissions.' });
    }
});

// 5. Grade submission (Instructor only)
router.put('/submissions/:submissionId/grade', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const submissionId = req.params.submissionId;
    const { grade, feedback } = req.body;

    if (!grade) {
        return res.status(400).json({ error: 'Grade coordinate must be provided.' });
    }

    try {
        // Verify instructor owns the submission course
        const subCheck = await pool.query(
            `SELECT s.*, a.title as assignment_title, c.instructor_id, c.id as course_id
             FROM submissions s
             INNER JOIN assignments a ON s.assignment_id = a.id
             INNER JOIN courses c ON a.course_id = c.id
             WHERE s.id = $1`,
            [submissionId]
        );

        if (subCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Submission not found.' });
        }
        if (subCheck.rows[0].instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied. You do not manage this course.' });
        }

        // Update submission
        const result = await pool.query(
            `UPDATE submissions 
             SET grade = $1, feedback = $2, status = 'graded'
             WHERE id = $3 RETURNING *`,
            [grade, feedback || '', submissionId]
        );

        // Notify student
        await pool.query(
            'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
            [subCheck.rows[0].student_id, `Your submission for task '${subCheck.rows[0].assignment_title}' has been graded. Result: [${grade}].`]
        );

        // Adjust enrollment course progress based on average grades/completions (simulation)
        const totalAssignments = await pool.query('SELECT COUNT(*) FROM assignments WHERE course_id = $1', [subCheck.rows[0].course_id]);
        const gradedSubmissions = await pool.query(
            `SELECT COUNT(*) FROM submissions s
             INNER JOIN assignments a ON s.assignment_id = a.id
             WHERE a.course_id = $1 AND s.student_id = $2 AND s.status = 'graded'`,
            [subCheck.rows[0].course_id, subCheck.rows[0].student_id]
        );

        const total = parseInt(totalAssignments.rows[0].count);
        const graded = parseInt(gradedSubmissions.rows[0].count);
        const computedProgress = total > 0 ? Math.min(Math.round((graded / total) * 100), 100) : 100;

        await pool.query(
            'UPDATE enrollments SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE student_id = $2 AND course_id = $3',
            [computedProgress, subCheck.rows[0].student_id, subCheck.rows[0].course_id]
        );

        res.json({
            message: 'Submission graded. Progress updated.',
            submission: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error grading submission.' });
    }
});

module.exports = router;
