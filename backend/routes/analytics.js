const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, async (req, res) => {
    const role = req.user.role;
    try {
        if (role === 'student') {
            // Get student progress metrics
            const enrollRes = await pool.query(
                `SELECT e.progress, e.velocity, e.time_spent, c.title as course_title
                 FROM enrollments e
                 INNER JOIN courses c ON e.course_id = c.id
                 WHERE e.student_id = $1
                 LIMIT 1`,
                [req.user.id]
            );

            // Default mock if none enrolled
            let objective = {
                course_title: 'No Active Objectives',
                progress: 0,
                velocity: 1.0,
                time_spent: 0
            };

            if (enrollRes.rows.length > 0) {
                const active = enrollRes.rows[0];
                objective = {
                    course_title: active.course_title,
                    progress: active.progress,
                    velocity: active.velocity,
                    time_spent: active.time_spent
                };
            }

            // Get pending/urgent assignments
            const urgentTasksRes = await pool.query(
                `SELECT a.id, a.title, a.deadline, c.title as course_title
                 FROM assignments a
                 INNER JOIN courses c ON a.course_id = c.id
                 INNER JOIN enrollments e ON c.id = e.course_id
                 WHERE e.student_id = $1 AND a.id NOT IN (
                     SELECT assignment_id FROM submissions WHERE student_id = $1
                 )
                 ORDER BY a.deadline ASC
                 LIMIT 3`,
                [req.user.id]
            );

            // Fetch activity logs
            const activityRes = await pool.query(
                'SELECT action, timestamp FROM activity_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 3',
                [req.user.id]
            );

            res.json({
                objective,
                urgentTasks: urgentTasksRes.rows,
                recentBroadcasts: activityRes.rows.map(log => ({
                    type: 'purple',
                    text: log.action
                }))
            });

        } else if (role === 'instructor') {
            // Get active courses owned by instructor
            const coursesRes = await pool.query(
                'SELECT id, title FROM courses WHERE instructor_id = $1',
                [req.user.id]
            );
            const courseIds = coursesRes.rows.map(c => c.id);

            let enrollCount = 0;
            let gradingQueueCount = 0;
            let avgCompletion = 0;

            if (courseIds.length > 0) {
                // Total enrolled students
                const enrollCountRes = await pool.query(
                    'SELECT COUNT(*) FROM enrollments WHERE course_id = ANY($1)',
                    [courseIds]
                );
                enrollCount = parseInt(enrollCountRes.rows[0].count);

                // Grading Queue
                const gradingRes = await pool.query(
                    `SELECT COUNT(*) FROM submissions s
                     INNER JOIN assignments a ON s.assignment_id = a.id
                     WHERE a.course_id = ANY($1) AND s.status = 'submitted'`,
                    [courseIds]
                );
                gradingQueueCount = parseInt(gradingRes.rows[0].count);

                // Avg Completion
                const avgProgressRes = await pool.query(
                    'SELECT AVG(progress) FROM enrollments WHERE course_id = ANY($1)',
                    [courseIds]
                );
                avgCompletion = Math.round(parseFloat(avgProgressRes.rows[0].avg || 0));
            }

            // Calculate mock revenue based on student enrollments (e.g. $200 per enrollment + base grant)
            const revenue = 42800 + (enrollCount * 250);

            res.json({
                revenue: `$${(revenue / 1000).toFixed(1)}k`,
                cadetSatisfaction: '4.9/5',
                gradingQueueCount: `${gradingQueueCount} Missions`,
                activeCourse: {
                    title: coursesRes.rows[0]?.title || 'No Active Courses',
                    enrolled: enrollCount,
                    completion: `${avgCompletion}%`,
                    velocity: '+15%'
                }
            });

        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error pulling dashboard metrics.' });
    }
});
// GET /api/analytics/student-progress
router.get('/student-progress', authenticateToken, async (req, res) => {
    try {
        const studentId = req.user.id;

        // Fetch enrolled courses with progress metrics
        const coursesQuery = await pool.query(
            `SELECT c.id, c.title, c.category, e.progress,
                    (SELECT COUNT(*) FROM learning_modules WHERE course_id = c.id) as total_modules,
                    (SELECT COUNT(*) FROM assignments WHERE course_id = c.id) as total_assignments,
                    (SELECT COUNT(*) FROM submissions s INNER JOIN assignments a ON s.assignment_id = a.id WHERE a.course_id = c.id AND s.student_id = $1) as submitted_assignments
             FROM enrollments e
             INNER JOIN courses c ON e.course_id = c.id
             WHERE e.student_id = $1`,
            [studentId]
        );

        const courses = coursesQuery.rows.map(row => {
            const totalModules = parseInt(row.total_modules || 0);
            const progress = parseInt(row.progress || 0);
            const completedModules = Math.round(totalModules * (progress / 100));

            return {
                id: row.id,
                title: row.title,
                category: row.category,
                progress: progress,
                total_modules: totalModules,
                completed_modules: completedModules,
                total_assignments: parseInt(row.total_assignments || 0),
                submitted_assignments: parseInt(row.submitted_assignments || 0)
            };
        });

        // Overall stats
        const overallCompletionQuery = await pool.query(
            'SELECT AVG(progress) as avg_prog FROM enrollments WHERE student_id = $1',
            [studentId]
        );
        const overallCompletion = Math.round(parseFloat(overallCompletionQuery.rows[0].avg_prog || 0));

        const submissionsQuery = await pool.query(
            'SELECT COUNT(*) as total_sub, COUNT(CASE WHEN grade IS NOT NULL THEN 1 END) as graded_sub FROM submissions WHERE student_id = $1',
            [studentId]
        );
        const totalSubmissions = parseInt(submissionsQuery.rows[0].total_sub || 0);
        const gradedSubmissions = parseInt(submissionsQuery.rows[0].graded_sub || 0);

        const quizzesQuery = await pool.query(
            'SELECT COUNT(*) as total_quiz, COUNT(CASE WHEN score >= (total_questions * 0.6) THEN 1 END) as passed_quiz FROM quiz_results WHERE student_id = $1',
            [studentId]
        );
        const totalQuizzesTaken = parseInt(quizzesQuery.rows[0].total_quiz || 0);
        const passedQuizzes = parseInt(quizzesQuery.rows[0].passed_quiz || 0);

        res.json({
            overall_completion: overallCompletion,
            total_submissions: totalSubmissions,
            graded_assignments: gradedSubmissions,
            total_quizzes_taken: totalQuizzesTaken,
            passed_quizzes: passedQuizzes,
            courses: courses
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error retrieving detailed progress telemetry.' });
    }
});

module.exports = router;
