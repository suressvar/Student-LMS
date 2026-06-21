const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// 1. Get quizzes for a course
router.get('/course/:courseId', authenticateToken, async (req, res) => {
    const courseId = req.params.courseId;
    try {
        const quizzes = await pool.query(
            `SELECT q.*, 
                    qr.score, qr.total_questions, qr.completed_at as attempt_date
             FROM quizzes q
             LEFT JOIN quiz_results qr ON q.id = qr.quiz_id AND qr.student_id = $1
             WHERE q.course_id = $2
             ORDER BY q.created_at ASC`,
            [req.user.id, courseId]
        );
        res.json(quizzes.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error retrieving quizzes list.' });
    }
});

// 2. Get specific quiz detail with questions (Hiding correct option for students unless graded)
router.get('/:id', authenticateToken, async (req, res) => {
    const quizId = req.params.id;
    try {
        const quizRes = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
        if (quizRes.rows.length === 0) {
            return res.status(404).json({ error: 'Quiz system not found.' });
        }

        let query = 'SELECT id, quiz_id, question_text, option_a, option_b, option_c, option_d';
        if (req.user.role === 'instructor' || req.user.role === 'admin') {
            query += ', correct_option';
        }
        query += ' FROM quiz_questions WHERE quiz_id = $1 ORDER BY id ASC';

        const questionsRes = await pool.query(query, [quizId]);

        res.json({
            quiz: quizRes.rows[0],
            questions: questionsRes.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error loading quiz parameters.' });
    }
});

// 3. Create a quiz (Instructor only)
router.post('/', authenticateToken, authorizeRoles('instructor'), async (req, res) => {
    const { course_id, title, time_limit, questions } = req.body;

    if (!course_id || !title || !questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'Course ID, Title, and at least one Question are required.' });
    }

    try {
        // Verify ownership
        const courseRes = await pool.query('SELECT * FROM courses WHERE id = $1', [course_id]);
        if (courseRes.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found.' });
        }
        if (courseRes.rows[0].instructor_id !== req.user.id) {
            return res.status(403).json({ error: 'Unprivileged access.' });
        }

        // Insert Quiz
        const quizRes = await pool.query(
            'INSERT INTO quizzes (course_id, title, time_limit) VALUES ($1, $2, $3) RETURNING *',
            [course_id, title, time_limit || 15]
        );
        const quizId = quizRes.rows[0].id;

        // Insert Questions
        for (const q of questions) {
            await pool.query(
                `INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [quizId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option]
            );
        }

        res.status(201).json({
            message: 'Quiz structure and question bank successfully deployed.',
            quiz: quizRes.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error creating quiz.' });
    }
});

// 4. Submit Quiz Answers (Auto-Grading)
router.post('/:id/submit', authenticateToken, authorizeRoles('student'), async (req, res) => {
    const quizId = req.params.id;
    const { answers } = req.body; // Map: { question_id: 'A', ... }

    if (!answers) {
        return res.status(400).json({ error: 'Answers must be submitted.' });
    }

    try {
        // Verify quiz exists
        const quizRes = await pool.query(
            `SELECT q.*, c.title as course_title 
             FROM quizzes q 
             INNER JOIN courses c ON q.course_id = c.id 
             WHERE q.id = $1`, 
            [quizId]
        );
        if (quizRes.rows.length === 0) {
            return res.status(404).json({ error: 'Quiz not found.' });
        }

        const questions = await pool.query('SELECT * FROM quiz_questions WHERE quiz_id = $1', [quizId]);
        const total = questions.rows.length;
        let score = 0;

        // Auto grade
        for (const q of questions.rows) {
            const studentAnswer = answers[q.id];
            if (studentAnswer && studentAnswer.toUpperCase() === q.correct_option.toUpperCase()) {
                score++;
            }
        }

        // Delete previous attempts
        await pool.query('DELETE FROM quiz_results WHERE quiz_id = $1 AND student_id = $2', [quizId, req.user.id]);

        // Insert results
        const insertRes = await pool.query(
            `INSERT INTO quiz_results (quiz_id, student_id, score, total_questions)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [quizId, req.user.id, score, total]
        );

        // Grant XP: 30 XP per correct answer + 50 XP bonus for completion
        const gainedXp = (score * 30) + 50;
        await pool.query('UPDATE users SET xp = xp + $1 WHERE id = $2', [gainedXp, req.user.id]);

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (user_id, action) VALUES ($1, $2)',
            [req.user.id, `Completed quiz: ${quizRes.rows[0].title}. Score: ${score}/${total}`]
        );

        // Notify student
        await pool.query(
            'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
            [req.user.id, `Quiz Completed! You scored ${score}/${total} on '${quizRes.rows[0].title}' (+${gainedXp} XP gained!).`]
        );

        res.json({
            message: `Quiz compiled. Auto-graded: ${score}/${total} correct. Gained +${gainedXp} XP!`,
            result: insertRes.rows[0],
            correctAnswers: questions.rows.reduce((map, obj) => {
                map[obj.id] = obj.correct_option;
                return map;
            }, {})
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error auto-grading quiz.' });
    }
});

module.exports = router;
