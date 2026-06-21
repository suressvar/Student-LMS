/**
 * CourseVerse 3D Lilac Graphics Engine - Realistic Shaded Planets
 * Renders photorealistic 3D planets, atmospheric glows, and depth-sorted rings/moons.
 * Uses advanced canvas gradients and depth sorting instead of wireframes or dots.
 */
(function () {
    'use strict';

    // Helper: Draw a realistically shaded 3D sphere
    function drawShadedSphere(ctx, cx, cy, radius, lightAngle, baseColor, highlightColor, shadowColor) {
        // Light source offset based on angle
        const lx = cx + Math.cos(lightAngle) * radius * 0.35;
        const ly = cy + Math.sin(lightAngle) * radius * 0.35;

        // 1. Atmosphere/Glow Layer (Behind)
        const glow = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.25);
        glow.addColorStop(0, 'rgba(216, 180, 254, 0.45)');
        glow.addColorStop(0.6, 'rgba(167, 139, 250, 0.15)');
        glow.addColorStop(1, 'rgba(167, 139, 250, 0)');
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // 2. Shaded Planet Body
        const bodyGrad = ctx.createRadialGradient(lx, ly, radius * 0.05, cx, cy, radius);
        bodyGrad.addColorStop(0, highlightColor);
        bodyGrad.addColorStop(0.3, baseColor);
        bodyGrad.addColorStop(0.85, shadowColor);
        bodyGrad.addColorStop(1, '#07040e'); // darkest shadow edge

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // 3. Rim Lighting Accent (gives 3D depth)
        const rimGrad = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius);
        rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        rimGrad.addColorStop(1, 'rgba(216, 180, 254, 0.35)');
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = rimGrad;
        ctx.fill();
    }

    // Helper: Draw a realistic 3D flat planet ring segment
    function drawRingSegment(ctx, cx, cy, rx, ry, tiltAngle, startAngle, endAngle, innerScale, baseColor, isLight) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tiltAngle);

        const ringGrad = ctx.createLinearGradient(-rx, 0, rx, 0);
        if (isLight) {
            ringGrad.addColorStop(0, 'rgba(139, 92, 246, 0)');
            ringGrad.addColorStop(0.2, 'rgba(167, 139, 250, 0.7)');
            ringGrad.addColorStop(0.5, 'rgba(216, 180, 254, 0.85)');
            ringGrad.addColorStop(0.8, 'rgba(167, 139, 250, 0.7)');
            ringGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
        } else {
            ringGrad.addColorStop(0, 'rgba(139, 92, 246, 0)');
            ringGrad.addColorStop(0.2, 'rgba(139, 92, 246, 0.65)');
            ringGrad.addColorStop(0.5, 'rgba(216, 180, 254, 0.75)');
            ringGrad.addColorStop(0.8, 'rgba(167, 139, 250, 0.65)');
            ringGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
        }

        ctx.strokeStyle = ringGrad;
        ctx.lineWidth = rx * (1 - innerScale);

        ctx.beginPath();
        // Scale vertical axis to represent ellipse perspective
        ctx.scale(1, ry / rx);
        ctx.arc(0, 0, rx - ctx.lineWidth / 2, startAngle, endAngle);
        ctx.stroke();

        ctx.restore();
    }

    // =========================================================================
    // 1. BRAND 3D CANVAS (Login Page Side Panel Planet)
    // =========================================================================
    function initBrand3D() {
        const canvas = document.getElementById('brand-3d-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = canvas.clientWidth || 500;
        let height = canvas.height = canvas.clientHeight || 600;
        let time = 0;

        function animate() {
            const cw = canvas.clientWidth || 500;
            const ch = canvas.clientHeight || 600;
            if (width !== cw || height !== ch) {
                width = canvas.width = cw;
                height = canvas.height = ch;
            }

            ctx.clearRect(0, 0, width, height);
            time += 0.006;

            const isLight = document.body.classList.contains('light-theme');
            const cx = width / 2;
            const cy = height / 2;
            const radius = 95;

            // Background space glow
            const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, Math.max(width, height) * 0.6);
            if (isLight) {
                bgGrad.addColorStop(0, 'rgba(235, 215, 255, 0.4)');
                bgGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            } else {
                bgGrad.addColorStop(0, 'rgba(28, 14, 48, 0.5)');
                bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            }
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            const rx = 185;
            const ry = 48;
            const tilt = 0.35 + Math.sin(time * 0.5) * 0.05;

            // A: Draw Back of Saturn Rings (drawn behind planet)
            drawRingSegment(ctx, cx, cy, rx, ry, tilt, Math.PI, 2 * Math.PI, 0.72, '#a78bfa', isLight);

            // B: Draw Shaded Planet Body
            drawShadedSphere(
                ctx, cx, cy, radius, 
                -Math.PI / 4, // light angle
                isLight ? '#c084fc' : '#8b5cf6', // base
                '#ffffff',                       // highlight
                isLight ? '#3b185f' : '#1b082e'  // shadow
            );

            // C: Draw Front of Saturn Rings (drawn in front of planet for overlap)
            drawRingSegment(ctx, cx, cy, rx, ry, tilt, 0, Math.PI, 0.72, '#a78bfa', isLight);

            requestAnimationFrame(animate);
        }

        animate();
    }

    // =========================================================================
    // 2. HERO 3D CANVAS (Index Hero Section - Giant Planet with Orbital Systems)
    // =========================================================================
    function initHero3D() {
        const canvas = document.getElementById('hero-3d-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = canvas.clientWidth || 500;
        let height = canvas.height = canvas.clientHeight || 380;
        let time = 0;

        function animate() {
            const cw = canvas.clientWidth || 500;
            const ch = canvas.clientHeight || 380;
            if (width !== cw || height !== ch) {
                width = canvas.width = cw;
                height = canvas.height = ch;
            }

            ctx.clearRect(0, 0, width, height);
            time += 0.008;

            const isLight = document.body.classList.contains('light-theme');
            const cx = width / 2;
            const cy = height / 2;
            const radius = 100;

            // Ambient background core planetary nebula
            const coreGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 130);
            coreGrad.addColorStop(0, isLight ? 'rgba(167, 139, 250, 0.28)' : 'rgba(216, 180, 254, 0.25)');
            coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, 130, 0, Math.PI * 2);
            ctx.fill();

            const rx = 160;
            const ry = 30;
            const tilt = -0.22;

            // A: Draw Back of rings
            drawRingSegment(ctx, cx, cy, rx, ry, tilt, Math.PI, 2 * Math.PI, 0.88, '#dfb4f2', isLight);
            // Secondary inner ring
            drawRingSegment(ctx, cx, cy, rx - 20, ry - 4, tilt, Math.PI, 2 * Math.PI, 0.9, '#ffffff', isLight);

            // B: Draw Shaded Planet Body
            drawShadedSphere(
                ctx, cx, cy, radius, 
                -Math.PI / 3, 
                isLight ? '#d8b4fe' : '#7c3aed',
                '#ffffff', 
                isLight ? '#2e104e' : '#120224'
            );

            // C: Draw Front of rings
            drawRingSegment(ctx, cx, cy, rx, ry, tilt, 0, Math.PI, 0.88, '#dfb4f2', isLight);
            drawRingSegment(ctx, cx, cy, rx - 20, ry - 4, tilt, 0, Math.PI, 0.9, '#ffffff', isLight);

            requestAnimationFrame(animate);
        }

        animate();
    }

    // =========================================================================
    // 3. COMMUNITY 3D CANVAS (Index Community Section - Planet with Orbiting Moons)
    // =========================================================================
    function initCommunity3D() {
        const canvas = document.getElementById('community-3d-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = canvas.clientWidth || 500;
        let height = canvas.height = canvas.clientHeight || 320;
        let time = 0;

        function animate() {
            const cw = canvas.clientWidth || 500;
            const ch = canvas.clientHeight || 320;
            if (width !== cw || height !== ch) {
                width = canvas.width = cw;
                height = canvas.height = ch;
            }

            ctx.clearRect(0, 0, width, height);
            time += 0.007;

            const isLight = document.body.classList.contains('light-theme');
            const cx = width / 2;
            const cy = height / 2;
            const radius = 65;

            // Ambient background glow
            const coreGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 95);
            coreGrad.addColorStop(0, isLight ? 'rgba(167, 139, 250, 0.2)' : 'rgba(216, 180, 254, 0.2)');
            coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, 95, 0, Math.PI * 2);
            ctx.fill();

            // Calculate moon orbit details (3D depth sorting)
            // Moon 1
            const m1Radius = 115;
            const m1Angle = time * 1.5;
            const m1X = Math.cos(m1Angle) * m1Radius;
            const m1Z = Math.sin(m1Angle) * m1Radius;
            const m1Y = Math.sin(m1Angle) * m1Radius * 0.25; // tilted plane

            // Moon 2
            const m2Radius = 135;
            const m2Angle = -time * 1.1 + 2.5; // counter rotating
            const m2X = Math.cos(m2Angle) * m2Radius;
            const m2Z = Math.sin(m2Angle) * m2Radius;
            const m2Y = Math.cos(m2Angle) * m2Radius * -0.2; // tilted plane

            const drawQueue = [];

            // Add main planet to draw queue
            drawQueue.push({
                z: 0,
                draw: () => {
                    drawShadedSphere(
                        ctx, cx, cy, radius, 
                        -Math.PI / 4, 
                        isLight ? '#a385e0' : '#6d28d9',
                        '#ffffff', 
                        isLight ? '#270c4c' : '#0f021f'
                    );
                }
            });

            // Add Moon 1 to draw queue
            drawQueue.push({
                z: m1Z,
                draw: () => {
                    // Draw moon body
                    const m1Size = 13;
                    const mcX = cx + m1X;
                    const mcY = cy + m1Y;
                    drawShadedSphere(
                        ctx, mcX, mcY, m1Size, 
                        -Math.PI / 4, 
                        '#ebdcf5', 
                        '#ffffff', 
                        '#4c1d95'
                    );
                }
            });

            // Add Moon 2 to draw queue
            drawQueue.push({
                z: m2Z,
                draw: () => {
                    const m2Size = 10;
                    const mcX = cx + m2X;
                    const mcY = cy + m2Y;
                    drawShadedSphere(
                        ctx, mcX, mcY, m2Size, 
                        -Math.PI / 4, 
                        '#a78bfa', 
                        '#ffffff', 
                        '#1e1b4b'
                    );
                }
            });

            // Draw orbit paths (faint background circles)
            ctx.lineWidth = 0.8;
            ctx.strokeStyle = isLight ? 'rgba(139, 92, 246, 0.08)' : 'rgba(223, 180, 242, 0.12)';
            
            // Orbit 1 path
            ctx.beginPath();
            ctx.ellipse(cx, cy, m1Radius, m1Radius * 0.25, 0.15, 0, Math.PI * 2);
            ctx.stroke();

            // Orbit 2 path
            ctx.beginPath();
            ctx.ellipse(cx, cy, m2Radius, m2Radius * 0.2, -0.15, 0, Math.PI * 2);
            ctx.stroke();

            // Depth Sort back to front (Painter's Algorithm)
            drawQueue.sort((a, b) => b.z - a.z);
            drawQueue.forEach(item => item.draw());

            requestAnimationFrame(animate);
        }

        animate();
    }

    // Initialize all canvas listeners on DOM Load
    function initAll() {
        initBrand3D();
        initHero3D();
        initCommunity3D();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
})();
