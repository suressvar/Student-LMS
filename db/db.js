const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_DATABASE || 'student_lms'
});

// Check database connection and run schema migrations + seed data
async function initDb() {
    try {
        const client = await pool.connect();
        console.log('Connected to PostgreSQL successfully.');
        
        // Read and run schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('Database tables successfully verified/created.');

        // ─── GOOGLE OAUTH MIGRATIONS ────────────────────────────────────────
        // Make password_hash nullable (for Google-only accounts)
        await client.query(`
            ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL
        `).catch(() => {}); // Ignore if already nullable

        // Add google_id column
        await client.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE
        `).catch(() => {});

        // Add auth_provider column
        await client.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local'
        `).catch(() => {});
        // ─────────────────────────────────────────────────────────────────────


        // Seed Default Users
        const userCountRes = await client.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCountRes.rows[0].count) === 0) {
            console.log('Seeding default users...');
            const salt = bcrypt.genSaltSync(10);
            
            const adminPass = bcrypt.hashSync('admin123', salt);
            const instructorPass = bcrypt.hashSync('instructor123', salt);
            const studentPass = bcrypt.hashSync('student123', salt);

            // Insert admin
            const adminRes = await client.query(
                `INSERT INTO users (name, email, password_hash, role, level, xp) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                ['Cmdr. Stardust', 'admin@galaxy.edu', adminPass, 'admin', 84, 8400]
            );
            const adminId = adminRes.rows[0].id;

            // Insert instructor
            const instructorRes = await client.query(
                `INSERT INTO users (name, email, password_hash, role, level, xp) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                ['Academic Commander', 'instructor@galaxy.edu', instructorPass, 'instructor', 9, 1200]
            );
            const instructorId = instructorRes.rows[0].id;

            // Insert student
            const studentRes = await client.query(
                `INSERT INTO users (name, email, password_hash, role, level, xp) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                ['Cmdr. Astro', 'student@galaxy.edu', studentPass, 'student', 42, 4200]
            );
            const studentId = studentRes.rows[0].id;

            console.log('Seeding default courses...');
            // Insert Courses
            const aiCourseRes = await client.query(
                `INSERT INTO courses (title, category, description, learning_outcomes, instructor_id, is_published)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [
                    'Artificial Intelligence Systems', 
                    'Artificial Intelligence', 
                    'Learn deep-space neural networks, generative AI modules, autonomous agents, and ethics of synth intelligences in the Andromeda quadrants.',
                    'Master neural configurations; Deploy real-time decision units; Assess synthetic intelligence behavior.',
                    instructorId,
                    true
                ]
            );
            const aiCourseId = aiCourseRes.rows[0].id;

            const quantumCourseRes = await client.query(
                `INSERT INTO courses (title, category, description, learning_outcomes, instructor_id, is_published)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [
                    'Quantum Computation & FTL Networks',
                    'Quantum Computing',
                    'Explore qubit scaling, error correction arrays, cryptographic teleportation links, and sub-space data sync systems.',
                    'Deploy quantum registers; Code fault-tolerant programs; Interface with FTL hardware controllers.',
                    instructorId,
                    true
                ]
            );
            const quantumCourseId = quantumCourseRes.rows[0].id;

            const astroCourseRes = await client.query(
                `INSERT INTO courses (title, category, description, learning_outcomes, instructor_id, is_published)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [
                    'Astro-Architectural Interface Design',
                    'Astro-Design',
                    'Study HUD layout styling, low-gravity display responsiveness, life support visualizers, and spatial dashboard elements.',
                    'Build zero-G compatible HUD layouts; Stylize holographic visualizers; Optimize responsive interfaces.',
                    instructorId,
                    true
                ]
            );
            const astroCourseId = astroCourseRes.rows[0].id;

            console.log('Seeding learning modules...');
            // Insert Modules for AI
            await client.query(
                `INSERT INTO learning_modules (course_id, title, description, video_url, pdf_url, downloadable_resources, order_index)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    aiCourseId,
                    'Module 1: Deep-Space Neural Networks',
                    'Introduction to multi-layered artificial synapses in low-latency spacecraft networks.',
                    'https://www.w3schools.com/html/mov_bbb.mp4',
                    '/downloads/notes_m1.pdf',
                    'neural_config_schematic.json',
                    1
                ]
            );
            await client.query(
                `INSERT INTO learning_modules (course_id, title, description, video_url, pdf_url, downloadable_resources, order_index)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    aiCourseId,
                    'Module 2: Generative Autonomous Agents',
                    'Setting up generative decision pipelines for automated rover repairs and telemetry logging.',
                    'https://www.w3schools.com/html/mov_bbb.mp4',
                    '/downloads/notes_m2.pdf',
                    'agent_autonomy_script.py',
                    2
                ]
            );

            // Seed Modules for Quantum Computing
            await client.query(
                `INSERT INTO learning_modules (course_id, title, description, video_url, pdf_url, downloadable_resources, order_index)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    quantumCourseId,
                    'Module 1: Qubit Architecture Foundations',
                    'Understanding spin-qubit registers and orbital superposition principles.',
                    'https://www.w3schools.com/html/mov_bbb.mp4',
                    '/downloads/quantum_notes.pdf',
                    'qubit_superposition_simulation.ipynb',
                    1
                ]
            );

            console.log('Seeding student enrollments...');
            // Student Enrollments
            // Enroll in AI Course with 85% progress
            await client.query(
                `INSERT INTO enrollments (student_id, course_id, progress, velocity, time_spent)
                 VALUES ($1, $2, $3, $4, $5)`,
                [studentId, aiCourseId, 85, 1.4, 724]
            );
            // Enroll in Quantum Course with 10% progress
            await client.query(
                `INSERT INTO enrollments (student_id, course_id, progress, velocity, time_spent)
                 VALUES ($1, $2, $3, $4, $5)`,
                [studentId, quantumCourseId, 10, 1.1, 80]
            );

            console.log('Seeding assignments...');
            // Assignments
            const assign1Res = await client.query(
                `INSERT INTO assignments (course_id, title, description, deadline)
                 VALUES ($1, $2, $3, NOW() + INTERVAL '2 hours') RETURNING id`,
                [aiCourseId, 'Temporal Latency Quiz', 'Complete calculations on orbital clock offsets and time dilations in AI sync buffers. Submit your JSON log.']
            );
            const assign1Id = assign1Res.rows[0].id;

            const assign2Res = await client.query(
                `INSERT INTO assignments (course_id, title, description, deadline)
                 VALUES ($1, $2, $3, NOW() + INTERVAL '1 day') RETURNING id`,
                [aiCourseId, 'Galaxy Lab Report', 'Write a formal analysis detailing generative routing throughput inside nebula radiation shields. PDF format required.']
            );

            console.log('Seeding quizzes...');
            // Quizzes
            const quizRes = await client.query(
                `INSERT INTO quizzes (course_id, title, time_limit)
                 VALUES ($1, $2, $3) RETURNING id`,
                [aiCourseId, 'Quantum Core AI Assessment', 10]
            );
            const quizId = quizRes.rows[0].id;

            // Quiz questions
            await client.query(
                `INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    quizId,
                    'Which qubits configuration is immune to sub-space radiation alignment distortions?',
                    'Superconducting Josephson Arrays',
                    'Topological Majorana Zero-Modes',
                    'Spin-Polarized Electron Quantum Dots',
                    'Helium-Isolated Josephson Junctions',
                    'B'
                ]
            );
            await client.query(
                `INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    quizId,
                    'What is the theoretical maximum latency of a secured FTL relay between Earth and Sector 7G?',
                    '12 Milliseconds',
                    '4 Seconds',
                    '0 Milliseconds (Instantaneous Entanglement)',
                    '42 Microseconds',
                    'C'
                ]
            );
            await client.query(
                `INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    quizId,
                    'In Orion Neural Architectures, what happens when a node reaches maximum entropy?',
                    'Automatic kernel purge and baseline flash reboot',
                    'Gradient expansion into multi-dimensional space-time channels',
                    'It triggers a sub-space transmission loop warning',
                    'None of the above',
                    'C'
                ]
            );

            console.log('Seeding discussions...');
            // Forums
            await client.query(
                `INSERT INTO discussion_posts (course_id, user_id, title, content)
                 VALUES ($1, $2, $3, $4)`,
                [aiCourseId, instructorId, 'Interstellar AI Protocols', 'Welcome everyone! Please use this board to discuss the integration rules of bionic systems and deep space navigation buffers. Keep telemetry standard!']
            );

            console.log('Database successfully seeded with CourseVerse defaults.');
        } else {
            console.log('Database already contains seed data. Seeding skipped.');
        }

        client.release();
    } catch (err) {
        console.error('Error initializing PostgreSQL Database:', err);
    }
}

module.exports = {
    pool,
    initDb
};
