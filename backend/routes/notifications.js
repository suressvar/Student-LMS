const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const { authenticateToken } = require('../middleware/auth');

// 1. Get notifications
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 15',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error pulling notifications list.' });
    }
});

// 2. Mark all as read
router.post('/read', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = true WHERE user_id = $1',
            [req.user.id]
        );
        res.json({ message: 'All telemetry alerts acknowledged.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error flagging read updates.' });
    }
});

module.exports = router;
