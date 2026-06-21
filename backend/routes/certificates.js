const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { pool } = require('../../db/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// 1. Get all certificates for student
router.get('/student', authenticateToken, authorizeRoles('student'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.id, c.certificate_hash as certificate_code, c.issued_at,
                    co.title as course_title
             FROM certificates c
             INNER JOIN courses co ON c.course_id = co.id
             WHERE c.student_id = $1
             ORDER BY c.issued_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error retrieving certificates.' });
    }
});

// 2. Download Certificate PDF (dark lilac themed)
router.get('/:id/download', async (req, res) => {
    const certId = req.params.id;
    // We can pass token in query param because standard browser open downloads won't send auth headers easily
    const token = req.query.token;
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication token required.' });
    }

    try {
        // Simple manual verification of token to get user context
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        
        const certQuery = await pool.query(
            `SELECT c.certificate_hash, c.issued_at,
                    u.name as student_name,
                    co.title as course_title
             FROM certificates c
             INNER JOIN users u ON c.student_id = u.id
             INNER JOIN courses co ON c.course_id = co.id
             WHERE c.id = $1 AND c.student_id = $2`,
            [certId, decoded.id]
        );

        if (certQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Certificate not found or unauthorized access.' });
        }

        const cert = certQuery.rows[0];

        // Create PDF Document (landscape orientation is typical for certificates)
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margin: 40
        });

        // Set response headers to prompt download or view in browser
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Certificate_${cert.certificate_hash}.pdf`);
        doc.pipe(res);

        // Styling Variables
        const bgClor = '#080b1c';
        const accentColor = '#8b5cf6'; // purple
        const secondaryAccent = '#06b6d4'; // cyan
        const goldColor = '#f59e0b'; // gold
        const textColor = '#ffffff';
        const mutedTextColor = '#94a3b8';

        // Draw Dark Background
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(bgClor);

        // Draw Double Outer Border (lilac and cyan)
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
           .lineWidth(3)
           .stroke(accentColor);
           
        doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56)
           .lineWidth(1)
           .stroke(secondaryAccent);

        // Title Header
        doc.fillColor(goldColor)
           .fontSize(14)
           .font('Courier-Bold')
           .text('COURSEVERSE ACADEMY OF DEEP SPACE LEARNING', 0, 80, { align: 'center', letterSpacing: 2 });

        doc.fillColor(textColor)
           .fontSize(36)
           .font('Helvetica-Bold')
           .text('STELLAR GRADUATION LICENSE', 0, 120, { align: 'center' });

        doc.fillColor(mutedTextColor)
           .fontSize(14)
           .font('Helvetica')
           .text('This is to certify that cadet', 0, 180, { align: 'center' });

        // Student Name
        doc.fillColor(secondaryAccent)
           .fontSize(28)
           .font('Helvetica-Bold')
           .text(cert.student_name.toUpperCase(), 0, 210, { align: 'center' });

        doc.fillColor(mutedTextColor)
           .fontSize(14)
           .font('Helvetica')
           .text('has successfully completed the orbital curriculum parameters in the sector of', 0, 255, { align: 'center' });

        // Course Title
        doc.fillColor(accentColor)
           .fontSize(24)
           .font('Helvetica-Bold')
           .text(cert.course_title.toUpperCase(), 0, 285, { align: 'center' });

        doc.fillColor(mutedTextColor)
           .fontSize(11)
           .font('Helvetica')
           .text('demonstrating proficient mastery and stabilization of all telemetric data grids.', 0, 325, { align: 'center' });

        // Signatures & Verification details
        const lineY = 380;
        
        // Left Signature (Dean)
        doc.moveTo(100, lineY).lineTo(280, lineY).lineWidth(1).stroke(mutedTextColor);
        doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text('ACADEMY COMMAND DEAN', 100, lineY + 6, { width: 180, align: 'center' });
        doc.fillColor(mutedTextColor).fontSize(9).font('Courier').text('Stardate Dean-4819', 100, lineY + 18, { width: 180, align: 'center' });

        // Center Gold Seal (Vector Art style representation)
        doc.circle(doc.page.width / 2, lineY - 10, 25).lineWidth(2).stroke(goldColor);
        doc.fillColor(goldColor).fontSize(10).font('Helvetica-Bold').text('SEAL', (doc.page.width / 2) - 20, lineY - 14, { width: 40, align: 'center' });

        // Right Signature (Instructor)
        doc.moveTo(doc.page.width - 280, lineY).lineTo(doc.page.width - 100, lineY).lineWidth(1).stroke(mutedTextColor);
        doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text('SECTOR LEAD INSTRUCTOR', doc.page.width - 280, lineY + 6, { width: 180, align: 'center' });
        doc.fillColor(mutedTextColor).fontSize(9).font('Courier').text('Stardate Core-091A', doc.page.width - 280, lineY + 18, { width: 180, align: 'center' });

        // Issue Date and Verification Hash Footer
        doc.fillColor(mutedTextColor).fontSize(9).font('Courier')
           .text(`ISSUE DATE: ${new Date(cert.issued_at).toLocaleDateString()}`, 40, doc.page.height - 70);
           
        doc.fillColor(mutedTextColor).fontSize(9).font('Courier')
           .text(`VERIFICATION HASH: ${cert.certificate_hash}`, doc.page.width - 320, doc.page.height - 70, { width: 280, align: 'right' });

        // End document
        doc.end();

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error generating certificate file.' });
    }
});

// 3. Public Verification Endpoint (no auth needed)
router.get('/verify/:code', async (req, res) => {
    const code = req.params.code;
    try {
        const result = await pool.query(
            `SELECT c.issued_at, c.certificate_hash as certificate_code,
                    u.name as student_name,
                    co.title as course_title
             FROM certificates c
             INNER JOIN users u ON c.student_id = u.id
             INNER JOIN courses co ON c.course_id = co.id
             WHERE c.certificate_hash = $1`,
            [code]
        );

        if (result.rows.length === 0) {
            return res.json({ valid: false });
        }

        const cert = result.rows[0];
        res.json({
            valid: true,
            student_name: cert.student_name,
            course_title: cert.course_title,
            issued_at: cert.issued_at,
            certificate_code: cert.certificate_code
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Verification systems offline.' });
    }
});

module.exports = router;
