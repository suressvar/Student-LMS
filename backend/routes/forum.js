const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const { authenticateToken } = require('../middleware/auth');

// 1. Get discussion posts for a course
router.get('/course/:courseId', authenticateToken, async (req, res) => {
    const courseId = req.params.courseId;
    try {
        // Fetch posts with author name (nested queries can aggregate replies, or we can pull all and assemble)
        const result = await pool.query(
            `SELECT p.*, u.name as author_name, u.role as author_role
             FROM discussion_posts p
             INNER JOIN users u ON p.user_id = u.id
             WHERE p.course_id = $1
             ORDER BY p.created_at ASC`,
            [courseId]
        );

        // Map list into threads
        const posts = result.rows;
        const threadMap = {};
        const roots = [];

        posts.forEach(post => {
            post.replies = [];
            threadMap[post.id] = post;
            if (post.parent_id === null) {
                roots.push(post);
            }
        });

        posts.forEach(post => {
            if (post.parent_id !== null && threadMap[post.parent_id]) {
                threadMap[post.parent_id].replies.push(post);
            }
        });

        res.json(roots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error pulling forum index.' });
    }
});

// 2. Create post or reply
router.post('/', authenticateToken, async (req, res) => {
    const { course_id, title, content, parent_id } = req.body;

    if (!course_id || !content) {
        return res.status(400).json({ error: 'Course ID and message content are required.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO discussion_posts (course_id, user_id, title, content, parent_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [course_id, req.user.id, title || null, content, parent_id || null]
        );

        // Fetch author name to send back
        const post = result.rows[0];
        post.author_name = req.user.name;
        post.author_role = req.user.role;
        post.replies = [];

        res.status(201).json({
            message: 'Forum transmission uploaded.',
            post
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error uploading forum post.' });
    }
});

module.exports = router;
