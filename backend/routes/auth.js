const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../../db/db');
const { authenticateToken } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'courseverse_galactic_secret_2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// 1. Student / Instructor Registration
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All coordinate inputs (name, email, password, role) are required.' });
    }

    if (!['student', 'instructor'].includes(role)) {
        return res.status(400).json({ error: 'Invalid registry role. Must be student or instructor.' });
    }

    try {
        // Check if user already exists
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'This orbital email is already registered.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Assign default levels and avatars
        const level = 1;
        const xp = 0;
        const avatarSvg = `
            <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="#131b35" stroke="#8b5cf6" stroke-width="2"/>
                <polygon points="50,22 64,40 50,58 36,40" fill="none" stroke="#8b5cf6" stroke-width="2"/>
                <circle cx="50" cy="40" r="6" fill="#8b5cf6"/>
                <path d="M25,78 L75,78 A 25 25 0 0 0 25 78" fill="none" stroke="#00f0ff" stroke-width="2" stroke-dasharray="2,2"/>
            </svg>
        `;

        // Insert new user
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role, level, xp, avatar_svg) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, level, xp`,
            [name, email, hashedPassword, role, level, xp, avatarSvg]
        );

        const user = result.rows[0];

        // Create JWT Token
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Cadet registry authorized successfully.',
            token,
            user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server signal distortion during registration.' });
    }
});

// 2. User Authentication
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Orbital email, Access key, and Role selector are required.' });
    }

    try {
        // Fetch user
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Incorrect credentials or role credentials. Access Denied.' });
        }

        const user = result.rows[0];

        // Validate role matches
        if (user.role !== role) {
            return res.status(401).json({ error: 'Role credential mismatch for this profile.' });
        }

        // Validate password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Incorrect credentials or role credentials. Access Denied.' });
        }

        // Create JWT Token
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Initiating warp drive... Access Granted.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                level: user.level,
                xp: user.xp,
                avatar_svg: user.avatar_svg
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server signal distortion during login sequence.' });
    }
});

// 3. Get profile details
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, level, xp, avatar_svg, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cadet profile not found in system registers.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Telemetry error pulling profile data.' });
    }
});

// 4. Update profile details
router.put('/profile', authenticateToken, async (req, res) => {
    const { name, avatar_svg } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Profile callsign cannot be left blank.' });
    }

    try {
        let query = 'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP';
        const params = [name];

        if (avatar_svg) {
            query += ', avatar_svg = $2';
            params.push(avatar_svg);
        }

        query += ` WHERE id = $${params.length + 1} RETURNING id, name, email, role, level, xp, avatar_svg`;
        params.push(req.user.id);

        const result = await pool.query(query, params);
        res.json({
            message: 'Cadet telemetry registers updated.',
            user: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating profile data.' });
    }
});

// 5. Password Reset
router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and new password coordinates are required.' });
    }

    try {
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length === 0) {
            return res.status(404).json({ error: 'No profile matches this email.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
            [hashedPassword, email]
        );

        res.json({ message: 'Security access code successfully reset. Initiate login.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during security key reset.' });
    }
});

// 5.5 Get Google Client ID for Frontend
router.get('/google/client-id', (req, res) => {
    res.json({ clientId: GOOGLE_CLIENT_ID });
});

// 6. Google Sign-In
router.post('/google', async (req, res) => {
    const { credential, role } = req.body;
    if (!credential) {
        return res.status(400).json({ error: 'Google credential token is required.' });
    }

    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
        return res.status(503).json({ error: 'Google Sign-In is not configured. Please set GOOGLE_CLIENT_ID in .env.' });
    }

    try {
        // Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        // Verify/Sanitize role
        const targetRole = ['student', 'instructor'].includes(role) ? role : 'student';

        // Look up user by google_id first, then email
        let result = await pool.query(
            'SELECT * FROM users WHERE google_id = $1 OR email = $2',
            [googleId, email]
        );

        let user;
        if (result.rows.length > 0) {
            user = result.rows[0];
            // If found by email but google_id not linked yet, link it
            if (!user.google_id) {
                await pool.query(
                    'UPDATE users SET google_id = $1, auth_provider = $2 WHERE id = $3',
                    [googleId, 'google', user.id]
                );
            }
        } else {
            // Auto-register new Google user with selected role
            let avatarSvg;
            if (targetRole === 'instructor') {
                avatarSvg = `
                    <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="#1a0a2e" stroke="#c084fc" stroke-width="2"/>
                        <circle cx="50" cy="38" r="16" fill="none" stroke="#c084fc" stroke-width="2"/>
                        <line x1="30" y1="72" x2="70" y2="72" stroke="#c084fc" stroke-width="2"/>
                        <path d="M30,72 Q50,55 70,72" fill="none" stroke="#8b5cf6" stroke-width="2"/>
                    </svg>
                `;
            } else {
                avatarSvg = `
                    <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="#131b35" stroke="#8b5cf6" stroke-width="2"/>
                        <circle cx="50" cy="38" r="14" fill="none" stroke="#8b5cf6" stroke-width="2"/>
                        <path d="M25,78 Q50,60 75,78" fill="none" stroke="#06b6d4" stroke-width="2"/>
                    </svg>
                `;
            }
            const insertRes = await pool.query(
                `INSERT INTO users (name, email, google_id, auth_provider, role, level, xp, avatar_svg, password_hash)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL)
                 RETURNING id, name, email, role, level, xp`,
                [name, email, googleId, 'google', targetRole, 1, 0, avatarSvg]
            );
            user = insertRes.rows[0];
        }

        // Issue JWT
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Google warp-link verified. Access Granted.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                level: user.level,
                xp: user.xp,
                avatar_svg: user.avatar_svg
            }
        });
    } catch (err) {
        console.error('Google auth error:', err);
        res.status(401).json({ error: 'Invalid Google credential. Access denied.' });
    }
});

module.exports = router;
