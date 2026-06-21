const express = require('express');
const router = express.Router();
const { pool } = require('../../db/db');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 1. AI Chatbot assistant with Gemini integration + Galactic simulation fallback
router.post('/chat', authenticateToken, async (req, res) => {
    const { message, topic } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message input is required.' });
    }

    const currentTopic = topic || 'General Interstellar Studies';

    if (GEMINI_API_KEY) {
        try {
            const systemPrompt = `You are Orion, the advanced AI Learning Assistant on the CourseVerse LMS.
             The student is asking about: "${currentTopic}". 
             Keep your answers helpful, highly scientific, encouraging, and themed around futuristic space academies. 
             Use rich formatting with Markdown. Keep responses concise (under 250 words).`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: `${systemPrompt}\n\nStudent message: ${message}` }] }
                    ]
                })
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                const aiReply = data.candidates[0].content.parts[0].text;
                return res.json({ reply: aiReply, source: 'Gemini 2.5 Flash' });
            }
        } catch (err) {
            console.error('Gemini API call failed, entering simulation mode:', err.message);
        }
    }

    // Galactic Mock Engine fallback
    let reply = `Greetings Cadet ${req.user.name}. Orion AI is analyzing your transmission on **${currentTopic}**.\n\n`;
    const msg = message.toLowerCase();

    if (msg.includes('quantum') || msg.includes('qubit')) {
        reply += `Quantum computation in deep space relies on isolating qubits from cosmic background radiation. If you are struggling with superposition concepts, remember that topological Majorana zero-modes provide a fault-tolerant solution by braiding state parameters across sub-space dimensions. 
        \n\nI suggest checking out **Module 1 of the Quantum Computation track** to review qubit registers.`;
    } else if (msg.includes('ai') || msg.includes('neural') || msg.includes('model') || msg.includes('agent')) {
        reply += `Autonomous neural networks in Sector 7G adapt by utilizing dynamic routing. When training deep space navigation buffers, we avoid gradient explosions by scaling neural sync thresholds based on the proximity to black hole gravity wells.
        \n\nEnsure you have reviewed the **Deep-Space Neural Networks module** in your current objective.`;
    } else if (msg.includes('interface') || msg.includes('hud') || msg.includes('design') || msg.includes('css')) {
        reply += `For zero-gravity HUD design, accessibility is everything. In high-vibration rocket flight or low-gravity orbital laboratories, interfaces should prioritize large tactile triggers and high-contrast color systems like HSL neon greens or cyans. 
        \n\nHave you checked out **Astro-Architectural Interface Design** yet? It has great telemetry layout templates.`;
    } else if (msg.includes('quiz') || msg.includes('exam') || msg.includes('test')) {
        reply += `Preparing for an assessment? I can generate a practice quiz for you instantly! Just use the **AI Quiz Generator** in your command drawer to prepare for your final cadet certifications.`;
    } else {
        reply += `I have registered your signal. To advance your learning velocity, I recommend studying at least 15 minutes daily. The neural sync link is currently stable. Feel free to ask me questions regarding quantum algorithms, bionic neural nodes, or space-grade dashboard designs!`;
    }

    res.json({ reply, source: 'Orion Core Simulation' });
});

// 2. AI Quiz Generator (creates 5 MCQs on a topic)
router.post('/generate-quiz', authenticateToken, async (req, res) => {
    const { topic } = req.body;
    if (!topic) {
        return res.status(400).json({ error: 'Please specify a learning topic to compile questions.' });
    }

    if (GEMINI_API_KEY) {
        try {
            const prompt = `Generate exactly 3 multiple choice questions about "${topic}".
            Return ONLY a valid JSON array of objects with the exact schema:
            [
              {
                "question_text": "question string",
                "option_a": "option A string",
                "option_b": "option B string",
                "option_c": "option C string",
                "option_d": "option D string",
                "correct_option": "A" or "B" or "C" or "D"
              }
            ]
            Do not include any markdown wrap or code fences, just output the raw JSON.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                let cleanJson = data.candidates[0].content.parts[0].text.trim();
                // Strip code block wrappers if any
                cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
                const quizQuestions = JSON.parse(cleanJson);
                return res.json({ questions: quizQuestions, source: 'Gemini 2.5 Flash' });
            }
        } catch (err) {
            console.error('Gemini Quiz Generator failed, using fallback:', err.message);
        }
    }

    // Fallback Mock Questions Database depending on topic
    let mockQuestions = [
        {
            question_text: `In the context of ${topic}, which of the following best describes the core operational bottleneck?`,
            option_a: 'Sub-space particle decay constraints',
            option_b: 'Excessive thermal noise in copper circuits',
            option_c: 'Telemetry signal interference from solar flares',
            option_d: 'Standard buffer capacity overflow',
            correct_option: 'C'
        },
        {
            question_text: `Which architectural framework is considered standard for optimizing ${topic}?`,
            option_a: 'Orion Relational Vector Array',
            option_b: 'Majorana Quantum Teleportation Hub',
            option_c: 'Zero-Gravity Linear Flow Model',
            option_d: 'Milky Way Core Sync Server',
            correct_option: 'A'
        },
        {
            question_text: `What is the principal benefit of implementing bionic accelerators within ${topic} configurations?`,
            option_a: 'Complete immunity to time-dilation offsets',
            option_b: '98% reduction in data entropy logs',
            option_c: 'Sub-light data packet compression',
            option_d: 'Linear expansion of grid velocity',
            correct_option: 'B'
        }
    ];

    res.json({ questions: mockQuestions, source: 'Orion Quiz Compiler' });
});

// 3. AI Performance Insights
router.get('/insights', authenticateToken, async (req, res) => {
    try {
        const enrollments = await pool.query(
            `SELECT c.title, e.progress, e.velocity, e.time_spent
             FROM enrollments e 
             INNER JOIN courses c ON e.course_id = c.id
             WHERE e.student_id = $1`,
            [req.user.id]
        );

        const quizResults = await pool.query(
            'SELECT score, total_questions FROM quiz_results WHERE student_id = $1',
            [req.user.id]
        );

        let totalProgress = 0;
        let avgQuizScore = 0;

        enrollments.rows.forEach(e => totalProgress += e.progress);
        const avgProgress = enrollments.rows.length > 0 ? (totalProgress / enrollments.rows.length).toFixed(1) : 0;

        let totalScore = 0;
        quizResults.rows.forEach(q => totalScore += (q.score / q.total_questions) * 100);
        avgQuizScore = quizResults.rows.length > 0 ? (totalScore / quizResults.rows.length).toFixed(1) : 'N/A';

        // Draft insights based on student telemetry
        let analysis = `**Orion Telemetry Diagnostic Insights for Cadet ${req.user.name}:**\n\n`;
        analysis += `* **Average Curricular Progress:** ${avgProgress}%\n`;
        analysis += `* **Assessment Performance Accuracy:** ${avgQuizScore === 'N/A' ? 'No assessment records' : avgQuizScore + '%'}\n\n`;

        if (enrollments.rows.length === 0) {
            analysis += `**Alert:** You are currently not enrolled in any interstellar sectors. I suggest accessing the **Star Map** to enlist in foundational academies immediately.`;
        } else {
            const lowProgressCourse = enrollments.rows.find(e => e.progress < 50);
            if (lowProgressCourse) {
                analysis += `* **Observation:** Your progress in *${lowProgressCourse.title}* is currently at ${lowProgressCourse.progress}%. Let's lock in focus here. Try dedicated daily slots.\n`;
            }
            
            const velocity = enrollments.rows[0]?.velocity || 1.0;
            if (velocity >= 1.2) {
                analysis += `* **Insight:** Your learning velocity is currently **${velocity}x**, which is outstanding! You are qualifying for the *Warp Speed Learner* badge.\n`;
            } else {
                analysis += `* **Insight:** Your current learning velocity is **${velocity}x**. Increasing study frequency to 15-minute bursts can trigger automatic velocity multipliers.\n`;
            }

            analysis += `\n**Study Tip:** Prioritize assignments due soon. Make sure to complete the Temporal Latency Quiz for active modules.`;
        }

        res.json({ insights: analysis });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error generating insights.' });
    }
});

// 4. AI Study Plan Generator
router.post('/generate-study-plan', authenticateToken, async (req, res) => {
    const { topic, durationWeeks } = req.body;
    if (!topic || !durationWeeks) {
        return res.status(400).json({ error: 'Topic and target duration coordinates are required.' });
    }

    if (GEMINI_API_KEY) {
        try {
            const prompt = `Generate a customized study plan for "${topic}" spanning ${durationWeeks} weeks.
             Format the response as a markdown schedule with bullet points. Include weekly objectives and estimated hours.
             Keep it themed around space navigation and maintain under 250 words.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                return res.json({ studyPlan: data.candidates[0].content.parts[0].text, source: 'Gemini 2.5 Flash' });
            }
        } catch (err) {
            console.error('Gemini Study Plan call failed:', err.message);
        }
    }

    // Fallback Mock Study Plan
    let studyPlan = `### Custom Study Plan: ${topic} (${durationWeeks} Weeks)\n\n`;
    studyPlan += `**Orion AI Generator Sync: Completed.**\n\n`;
    
    for (let w = 1; w <= durationWeeks; w++) {
        studyPlan += `#### Week ${w}: Stellar Core and Foundational Parameters\n`;
        studyPlan += `* **Objective:** Scan core parameters, read notes, and establish baseline calibrations.\n`;
        studyPlan += `* **Tasks:** Review Course Module ${w}, run simulations, and query Orion on outliers.\n`;
        studyPlan += `* **Commitment:** 4.5 Hours / Week\n\n`;
    }
    studyPlan += `*Happy learning! Ensure your sublight shields are active.*`;

    res.json({ studyPlan, source: 'Orion Plan Compiler' });
});

// 5. AI Course Recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
    try {
        // Find categories of courses user is enrolled in
        const userEnrolledRes = await pool.query(
            'SELECT c.category FROM enrollments e INNER JOIN courses c ON e.course_id = c.id WHERE e.student_id = $1',
            [req.user.id]
        );

        const enrolledCategories = userEnrolledRes.rows.map(r => r.category);

        let query = 'SELECT id, title, category, description, image_url FROM courses WHERE is_published = true';
        const params = [];

        // If enrolled in courses, recommend other categories first to expand knowledge base, or recommend same category advanced
        if (enrolledCategories.length > 0) {
            query += ' AND id NOT IN (SELECT course_id FROM enrollments WHERE student_id = $1)';
            params.push(req.user.id);
        }

        query += ' LIMIT 2';

        const recommendRes = await pool.query(query, params);
        res.json(recommendRes.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error compiling recommendations.' });
    }
});

module.exports = router;
