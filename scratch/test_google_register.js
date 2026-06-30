const { pool } = require('../db/db');

async function testGoogleRegister() {
    const name = 'Google User';
    const email = 'googleuser_' + Date.now() + '@example.com';
    const googleId = 'google-id-' + Date.now();
    const targetRole = 'student';
    const avatarSvg = '<svg></svg>';

    try {
        const insertRes = await pool.query(
            `INSERT INTO users (name, email, google_id, auth_provider, role, level, xp, avatar_svg, password_hash)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id, name, email, role, level, xp`,
            [name, email, googleId, 'google', targetRole, 1, 0, avatarSvg, 'google-auth-locked']
        );
        console.log("Success! Registered Google user:", insertRes.rows[0]);
    } catch (err) {
        console.error("Failed to register Google user:", err);
    } finally {
        await pool.end();
    }
}

testGoogleRegister();
