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

// 2. Mark all as read (Supports POST, PUT, PATCH to be fully robust)
router.all('/read-all', authenticateToken, async (req, res) => {
    if (req.method !== 'PATCH' && req.method !== 'PUT' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
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

// 3. Mark single notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
    const notifId = req.params.id;
    try {
        const result = await pool.query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
            [notifId, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Alert coordinate not found.' });
        }
        res.json({ message: 'Alert acknowledged.', notification: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating notification.' });
    }
});

module.exports = router;
