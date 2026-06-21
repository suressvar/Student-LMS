const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// 1. Get all published courses
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.*, u.name as instructor_name 
             FROM courses c 
             LEFT JOIN users u ON c.instructor_id = u.id 
             WHERE c.is_published = true 
             ORDER BY c.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server telemetry error pulling course lists.' });
    }
});

// 2. Get student's enrolled courses with progress
router.get('/enrolled', authenticateToken, authorizeRoles('student'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT e.progress, e.velocity, e.time_spent, e.created_at as enrolled_at,
                    c.id, c.title, c.category, c.description, c.image_url, c.learning_outcomes,
                    u.name as instructor_name
             FROM enrollments e
             INNER JOIN courses c ON e.course_id = c.id
             LEFT JOIN users u ON c.instructor_id = u.id
             WHERE e.student_id = $1
             ORDER BY e.updated_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching enrolled academy tracks.' });
    }
});

// 3. Get student's completed courses (progress = 100)
router.get('/completed', authenticateToken, authorizeRoles('student'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT e.progress, e.velocity, e.time_spent, e.created_at as enrolled_at, e.updated_at as completed_at,
                    c.id, c.title, c.category, c.description, c.image_url, c.learning_outcomes,
                    u.name as instructor_name
             FROM enrollments e
             INNER JOIN courses c ON e.course_id = c.id
             LEFT JOIN users u ON c.instructor_id = u.id
             WHERE e.student_id = $1 AND e.progress = 100
             ORDER BY e.updated_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching completed academy tracks.' });
    }
});

// 4. Get specific course details with modules, assignments, and quizzes
router.get('/:id', authenticateToken, async (req, res) => {
    const courseId = req.params.id;
    try {
        // Fetch course details
        const courseRes = await pool.query(
            `SELECT c.*, u.name as instructor_name 
             FROM courses c 
             LEFT JOIN users u ON c.instructor_id = u.id 
             WHERE c.id = $1`,
            [courseId]
        );

        if (courseRes.rows.length === 0) {
            return res.status(404).json({ error: 'Sector course coordinate not found.' });
        }

        // Fetch modules
        const modulesRes = await pool.query(
            'SELECT * FROM learning_modules WHERE course_id = $1 ORDER BY order_index ASC',
            [courseId]
        );

        // Fetch assignments
        const assignmentsRes = await pool.query(
            'SELECT * FROM assignments WHERE course_id = $1 ORDER BY deadline ASC',
            [courseId]
        );

        // Fetch quizzes
        const quizzesRes = await pool.query(
            'SELECT id, title, time_limit FROM quizzes WHERE course_id = $1',
            [courseId]
        );

        // Check if student is enrolled
        let enrollment = null;
        if (req.user.role === 'student') {
            const enrollRes = await pool.query(
                'SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
                [req.user.id, courseId]
            );
            if (enrollRes.rows.length > 0) {
                enrollment = enrollRes.rows[0];
            }
        }

        res.json({
            course: courseRes.rows[0],
            modules: modulesRes.rows,
            assignments: assignmentsRes.rows,
            quizzes: quizzesRes.rows,
            enrollment
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error retrieving system course details.' });
    }
});

// 4. Enroll in a course (Student only)
router.post('/:id/enroll', authenticateToken, authorizeRoles('student'), async (req, res) => {
    const courseId = req.params.id;
    try {
        // Check if course exists
        const courseCheck = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
        if (courseCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Course doesn\'t exist in database.' });
        }

        // Check if already enrolled
        const checkEnroll = await pool.query(
            'SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
            [req.user.id, courseId]
        );

        if (checkEnroll.rows.length > 0) {
            return res.status(400).json({ error: 'Cadet already enrolled in this sector.' });
        }

        // Enroll
        const insertRes = await pool.query(
            `INSERT INTO enrollments (student_id, course_id, progress, velocity, time_spent) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [req.user.id, courseId, 0, 1.0, 0]
        );

        // Create notification
        await pool.query(
            'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
            [req.user.id, `Successfully locked in coordinates for course: ${courseCheck.rows[0].title}. Happy learning!`]
        );

        res.status(201).json({
            message: 'Coordinates locked. Course enrolled.',
            enrollment: insertRes.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during course enrollment.' });
    }
});

// 4.5. Get all courses managed by this instructor (both published and unpublished)
router.get('/instructor', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.*, 
                    (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrolled_count
             FROM courses c 
             WHERE c.instructor_id = $1 
             ORDER BY c.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error retrieving instructor courses.' });
    }
});

// 5. Create a course (Instructor only)
router.post('/', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const { title, category, description, learning_outcomes, image_url } = req.body;
    if (!title || !category || !description) {
        return res.status(400).json({ error: 'Course Title, Category, and Description are required parameters.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO courses (title, category, description, learning_outcomes, image_url, instructor_id, is_published)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [title, category, description, learning_outcomes, image_url || 'images/hero_space_station.png', req.user.id, true]
        );
        res.status(201).json({
            message: 'New curricular constellation broadcasted.',
            course: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error broadcasting course.' });
    }
});

// 6. Add learning module to course (Instructor only)
router.post('/:id/modules', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const courseId = req.params.id;
    const { title, description, video_url, pdf_url, downloadable_resources, order_index } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Module Title is required.' });
    }

    try {
        // Verify instructor owns the course
        const courseRes = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
        if (courseRes.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found.' });
        }
        if (courseRes.rows[0].instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Unprivileged access. You do not own this course.' });
        }

        const result = await pool.query(
            `INSERT INTO learning_modules (course_id, title, description, video_url, pdf_url, downloadable_resources, order_index)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [courseId, title, description, video_url, pdf_url, downloadable_resources, order_index || 0]
        );

        res.status(201).json({
            message: 'Learning module locked to curriculum.',
            module: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error linking module.' });
    }
});

// 7. Edit Course Details (Instructor Only)
router.put('/:id', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const courseId = req.params.id;
    const { title, category, description, learning_outcomes, is_published } = req.body;
    try {
        const courseRes = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
        if (courseRes.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        if (req.user.role === 'instructor' && courseRes.rows[0].instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied. You do not manage this course.' });
        }

        const result = await pool.query(
            `UPDATE courses 
             SET title = COALESCE($1, title),
                 category = COALESCE($2, category),
                 description = COALESCE($3, description),
                 learning_outcomes = COALESCE($4, learning_outcomes),
                 is_published = COALESCE($5, is_published),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 RETURNING *`,
            [title, category, description, learning_outcomes, is_published, courseId]
        );

        res.json({
            message: 'Course coordinates updated.',
            course: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error saving course adjustments.' });
    }
});

// 8. Delete Course (Instructor Only)
router.delete('/:id', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const courseId = req.params.id;
    try {
        const courseRes = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
        if (courseRes.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        if (req.user.role === 'instructor' && courseRes.rows[0].instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied. You do not manage this course.' });
        }

        await pool.query('DELETE FROM courses WHERE id = $1', [courseId]);
        res.json({ message: 'Course registry purged from orbit successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error purging course.' });
    }
});

// 9. Toggle Publish State (Instructor Only)
router.patch('/:id/publish', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const courseId = req.params.id;
    try {
        const courseRes = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
        if (courseRes.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found.' });
        }
        if (courseRes.rows[0].instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied.' });
        }
        
        const newPublishState = !courseRes.rows[0].is_published;
        const result = await pool.query(
            'UPDATE courses SET is_published = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [newPublishState, courseId]
        );
        res.json({
            message: `Course publish state toggled to: ${newPublishState}`,
            course: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating publish state.' });
    }
});

module.exports = router;
