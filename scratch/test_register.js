const { pool } = require('../db/db');
const bcrypt = require('bcryptjs');

async function test() {
    const name = 'Test User';
    const email = 'testuser_' + Date.now() + '@example.com';
    const password = 'password123';
    const role = 'student';
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

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role, level, xp, avatar_svg) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, level, xp`,
            [name, email, hashedPassword, role, level, xp, avatarSvg]
        );
        console.log("Success! Registered user:", result.rows[0]);
    } catch (err) {
        console.error("Failed to register:", err);
    } finally {
        await pool.end();
    }
}

test();
