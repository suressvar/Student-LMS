/**
 * CourseVerse – Enhanced 3D Galactic Backdrop Engine
 * True 3D projection, depth sorting, mouse pitch/yaw, and lilac/white space nebula.
 * Supports dynamic light/dark theme adaptation.
 */
(function () {
    'use strict';

    const canvas = document.getElementById('starfield-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W, H, cx, cy;
    let raf;
    let mouseX = 0, mouseY = 0;
    let targetMX = 0, targetMY = 0;
    let time = 0;

    // ─── Resize Handler ────────────────────────────────────────────────────────
    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
        cx = W / 2;
        cy = H / 2;
    }

    // ─── Interactive Parallax coordinates ──────────────────────────────────────
    window.addEventListener('mousemove', e => {
        targetMX = (e.clientX - cx) / cx;   // -1 … 1
        targetMY = (e.clientY - cy) / cy;
    });

    // ─── Particle Configurations ────────────────────────────────────────────────
    const STAR_COUNT    = 500;  // High density stars
    const CLUSTER_COUNT = 100;  // High density dust particles
    const RING_COUNT    = 5;
    const NEBULA_COUNT  = 8;

    const stars = [];
    const clusters = [];
    const rings = [];
    const nebulas = [];

    // Initialize 3D Stars
    function initStars() {
        stars.length = 0;
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: (Math.random() - 0.5) * 2.5,
                y: (Math.random() - 0.5) * 2.5,
                z: Math.random() * 2,  // Extended Z depth
                speed: Math.random() * 0.002 + 0.0005,
                hue: Math.random() < 0.7 ? 250 + Math.random() * 45 : 0, // Lilac hues or white stars
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 0.05 + 0.01,
                size: Math.random() * 1.5 + 0.5
            });
        }
    }

    // Initialize Dust Clusters
    function initClusters() {
        clusters.length = 0;
        for (let i = 0; i < CLUSTER_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r     = 0.2 + Math.random() * 1.2;
            clusters.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r,
                z: Math.random() * 2,
                vx: (Math.random() - 0.5) * 0.0006,
                vy: (Math.random() - 0.5) * 0.0006,
                size: Math.random() * 8 + 3,
                hue: 250 + Math.random() * 45,
                alpha: Math.random() * 0.35 + 0.15
            });
        }
    }

    // Initialize Pulse Rings
    function initRings() {
        rings.length = 0;
        for (let i = 0; i < RING_COUNT; i++) {
            rings.push(newRing(i * (1 / RING_COUNT)));
        }
    }

    function newRing(progress) {
        return {
            cx: (Math.random() - 0.5) * 0.6,
            cy: (Math.random() - 0.5) * 0.6,
            progress,
            speed: Math.random() * 0.0008 + 0.0003,
            hue: 250 + Math.random() * 45,
            maxR: 0.3 + Math.random() * 0.4
        };
    }

    // Initialize Nebula blobs
    function initNebulas() {
        nebulas.length = 0;
        for (let i = 0; i < NEBULA_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r     = Math.random() * 0.8;
            nebulas.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r,
                radius: 0.35 + Math.random() * 0.55,
                hue: [250, 265, 280, 295][Math.floor(Math.random() * 4)],
                alpha: 0.05 + Math.random() * 0.06,
                driftX: (Math.random() - 0.5) * 0.0002,
                driftY: (Math.random() - 0.5) * 0.0002,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    // ─── Projection with pitch, yaw 3D rotation ─────────────────────────────
    function project3D(x, y, z, parallaxStrength) {
        // Yaw & pitch rotations based on mouse parallax
        const yaw = mouseX * 0.35;
        const pitch = mouseY * -0.35;

        // Translate Z back relative to camera perspective
        const zTrans = z - 1.0; 

        // 3D rotation around Y axis (Yaw)
        const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
        const x1 = x * cosY - zTrans * sinY;
        const z1 = zTrans * cosY + x * sinY;

        // 3D rotation around X axis (Pitch)
        const cosX = Math.cos(pitch), sinX = Math.sin(pitch);
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        // Perspective scaling
        const fov = 1.6;
        const depth = z2 + 1.2; // avoid divide by zero, scale depth range
        const scale = fov / Math.max(0.1, depth);

        // Add additional mouse translation offset (parallax)
        const sx = cx + (x1 + mouseX * parallaxStrength) * cx * scale;
        const sy = cy + (y2 + mouseY * parallaxStrength) * cy * scale;

        return { sx, sy, scale, depth };
    }

    // ─── Aurora Background strip ───────────────────────────────────────────────
    function drawAurora(isLight) {
        const bands = 3;
        for (let b = 0; b < bands; b++) {
            const freq   = 0.7 + b * 0.3;
            const offset = (b / bands) * H;
            const waveY  = cy * 0.35 + offset + Math.sin(time * freq * 0.35 + b * 2) * cy * 0.15;
            const bandH  = H * (0.15 + b * 0.06);
            const hue    = b === 0 ? 250 : b === 1 ? 270 : 290;
            const alpha  = isLight ? (0.045 - b * 0.01) : (0.075 - b * 0.015);

            const grad = ctx.createLinearGradient(0, waveY, 0, waveY + bandH);
            grad.addColorStop(0,   `hsla(${hue}, 85%, 65%, 0)`);
            grad.addColorStop(0.4, `hsla(${hue}, 85%, 65%, ${alpha})`);
            grad.addColorStop(1,   `hsla(${hue}, 85%, 65%, 0)`);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, waveY);
            for (let x = 0; x <= W; x += 15) {
                const y = waveY + Math.sin(x * 0.006 + time * 0.5 + b) * 35;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(W, waveY + bandH);
            ctx.lineTo(0, waveY + bandH);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();
        }
    }

    // ─── Draw Nebula Blobs ─────────────────────────────────────────────────────
    function drawNebulas(isLight) {
        nebulas.forEach(n => {
            n.x += n.driftX;
            n.y += n.driftY;
            if (Math.abs(n.x) > 1.2) n.driftX *= -1;
            if (Math.abs(n.y) > 1.2) n.driftY *= -1;

            const px = cx + n.x * cx * 0.9 + mouseX * cx * 0.06;
            const py = cy + n.y * cy * 0.9 + mouseY * cy * 0.06;
            const r  = n.radius * Math.min(W, H) * 0.65;
            const pulse = 1 + Math.sin(time * 0.3 + n.phase) * 0.1;

            const grad = ctx.createRadialGradient(px, py, 0, px, py, r * pulse);
            const alphaMultiplier = isLight ? 0.7 : 1.8;
            grad.addColorStop(0, `hsla(${n.hue}, 85%, ${isLight ? '85%' : '55%'}, ${n.alpha * alphaMultiplier})`);
            grad.addColorStop(0.5, `hsla(${n.hue}, 70%, ${isLight ? '88%' : '45%'}, ${n.alpha * 0.6})`);
            grad.addColorStop(1, `hsla(${n.hue}, 70%, 45%, 0)`);

            ctx.beginPath();
            ctx.arc(px, py, r * pulse, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        });
    }

    // ─── Draw 3D Stars ──────────────────────────────────────────────────────────
    function drawStars(isLight) {
        // Sort stars by depth (painter's algorithm)
        stars.sort((a, b) => b.z - a.z);

        stars.forEach(s => {
            // Forward depth travel
            s.z -= s.speed;
            if (s.z < 0.1) {
                s.z = 2.0;
                s.x = (Math.random() - 0.5) * 2.5;
                s.y = (Math.random() - 0.5) * 2.5;
            }

            s.twinkle += s.twinkleSpeed;
            const twinkleAlpha = 0.5 + Math.sin(s.twinkle) * 0.5;

            const { sx, sy, scale, depth } = project3D(s.x, s.y, s.z, 0.06);

            // Bounds check
            if (sx < -15 || sx > W + 15 || sy < -15 || sy > H + 15) return;

            const size = Math.max(0.4, s.size * scale);
            const maxOpacity = isLight ? 0.6 : 0.95;
            const opacity = Math.min(maxOpacity, twinkleAlpha * scale * 0.7);

            let color;
            if (s.hue === 0) {
                color = isLight ? `rgba(90, 80, 120, ${opacity})` : `rgba(255,255,255,${opacity})`;
            } else {
                color = `hsla(${s.hue}, 95%, ${isLight ? '50%' : '78%'}, ${opacity})`;
            }

            // Glow aura for near stars
            if (scale > 0.8) {
                const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 4.5);
                glow.addColorStop(0, color);
                glow.addColorStop(1, 'transparent');
                ctx.beginPath();
                ctx.arc(sx, sy, size * 4.5, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(sx, sy, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // Warp streaks for extremely close stars
            if (scale > 1.25) {
                const prevZ = s.z + s.speed * 2.5;
                const { sx: ox, sy: oy } = project3D(s.x, s.y, prevZ, 0.06);
                ctx.beginPath();
                ctx.moveTo(ox, oy);
                ctx.lineTo(sx, sy);
                ctx.strokeStyle = color;
                ctx.lineWidth = size * 0.35;
                ctx.stroke();
            }
        });
    }

    // ─── Draw Dust Clusters ─────────────────────────────────────────────────────
    function drawClusters(isLight) {
        clusters.forEach(c => {
            c.x += c.vx;
            c.y += c.vy;
            if (Math.abs(c.x) > 1.3) c.vx *= -1;
            if (Math.abs(c.y) > 1.3) c.vy *= -1;

            const { sx, sy, scale } = project3D(c.x, c.y, c.z, 0.04);
            if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) return;

            const r = c.size * scale * 1.5;
            const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
            const alphaMultiplier = isLight ? 0.3 : 0.9;
            grad.addColorStop(0, `hsla(${c.hue}, 90%, ${isLight ? '65%' : '75%'}, ${c.alpha * scale * alphaMultiplier})`);
            grad.addColorStop(1, 'transparent');

            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(1.5, r), 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        });
    }

    // ─── Draw Gravitational pulse rings ──────────────────────────────────────────
    function drawRings() {
        rings.forEach((ring, i) => {
            ring.progress += ring.speed;
            if (ring.progress > 1) {
                rings[i] = newRing(0);
                return;
            }

            const eased = 1 - Math.pow(1 - ring.progress, 3);
            const r     = eased * ring.maxR * Math.min(W, H) * 0.55;
            const alpha = (1 - eased) * 0.28;

            const px = cx + ring.cx * cx * 0.6 + mouseX * cx * 0.03;
            const py = cy + ring.cy * cy * 0.6 + mouseY * cy * 0.03;

            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${ring.hue}, 90%, 65%, ${alpha})`;
            ctx.lineWidth   = (1 - eased) * 2.2 + 0.4;
            ctx.stroke();
        });
    }

    // ─── Main Render loop ────────────────────────────────────────────────────────
    function render() {
        time += 0.016;

        // Smooth mouse updates
        mouseX += (targetMX - mouseX) * 0.06;
        mouseY += (targetMY - mouseY) * 0.06;

        // Detect light theme state
        const isLight = document.body.classList.contains('light-theme');

        // Draw background gradient
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.9);
        if (isLight) {
            bg.addColorStop(0, '#f9f6fc');
            bg.addColorStop(0.5, '#f0e8f8');
            bg.addColorStop(1, '#e5d9f2');
        } else {
            bg.addColorStop(0, '#170e28');
            bg.addColorStop(0.5, '#0e081a');
            bg.addColorStop(1, '#07040e');
        }
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Render layers back to front
        drawNebulas(isLight);
        drawAurora(isLight);
        drawRings();
        drawClusters(isLight);
        drawStars(isLight);

        raf = requestAnimationFrame(render);
    }

    // ─── Initialization ──────────────────────────────────────────────────────────
    function init() {
        resize();
        initStars();
        initClusters();
        initRings();
        initNebulas();
        if (raf) cancelAnimationFrame(raf);
        render();
    }

    window.addEventListener('resize', resize);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
