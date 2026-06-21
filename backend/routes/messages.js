const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const { authenticateToken } = require('../middleware/auth');

// 1. Get chats list (recent contacts list for messaging tab)
router.get('/chats', authenticateToken, async (req, res) => {
    try {
        // Query to find users whom the current user has exchanged messages with
        const result = await pool.query(
            `SELECT DISTINCT u.id, u.name, u.role, u.level
             FROM users u
             INNER JOIN messages m ON (m.sender_id = u.id AND m.receiver_id = $1) 
                                   OR (m.receiver_id = u.id AND m.sender_id = $1)
             WHERE u.id != $1`,
            [req.user.id]
        );

        // If no message records exist, suggest seeding/loading instructor for student, or student list for instructor
        let list = result.rows;
        if (list.length === 0) {
            if (req.user.role === 'student') {
                const instructors = await pool.query("SELECT id, name, role, level FROM users WHERE role = 'instructor'");
                list = instructors.rows;
            } else {
                const students = await pool.query("SELECT id, name, role, level FROM users WHERE role = 'student' LIMIT 5");
                list = students.rows;
            }
        }
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error pulling chat contact index.' });
    }
});

// 2. Get chat history with a specific contact
router.get('/:otherUserId', authenticateToken, async (req, res) => {
    const otherUserId = req.params.otherUserId;
    try {
        const result = await pool.query(
            `SELECT m.*, 
                    s.name as sender_name, r.name as receiver_name
             FROM messages m
             INNER JOIN users s ON m.sender_id = s.id
             INNER JOIN users r ON m.receiver_id = r.id
             WHERE (m.sender_id = $1 AND m.receiver_id = $2)
                OR (m.sender_id = $2 AND m.receiver_id = $1)
             ORDER BY m.sent_at ASC`,
            [req.user.id, otherUserId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error retrieving chat history.' });
    }
});

// 3. Send a message
router.post('/', authenticateToken, async (req, res) => {
    const { receiver_id, content } = req.body;
    if (!receiver_id || !content) {
        return res.status(400).json({ error: 'Receiver ID and content parameters are required.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, receiver_id, content]
        );

        // Create notification for receiver
        await pool.query(
            'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
            [receiver_id, `New transmission envelope from Cadet/Commander ${req.user.name}: "${content.substring(0, 30)}..."`]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server transmission error uploading message.' });
    }
});

module.exports = router;
