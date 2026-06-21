// CourseVerse App Logic

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       QUANTUM PRELOADER SESSION (SUPER ULTRA 3D)
       ========================================== */
    const preloader = document.getElementById('preloader');
    const preloaderBar = document.getElementById('preloader-bar');
    const preloaderPct = document.getElementById('preloader-pct');
    const pCanvas = document.getElementById('preloader-canvas');

    if (preloader && preloaderBar && preloaderPct && pCanvas) {
        const pCtx = pCanvas.getContext('2d');
        const pW = pCanvas.width = 200;
        const pH = pCanvas.height = 200;
        const pCx = pW / 2;
        const pCy = pH / 2;

        // Generate 3D sphere particles
        const pCount = 80;
        const pPoints = [];
        for (let i = 0; i < pCount; i++) {
            const theta = Math.acos(Math.random() * 2 - 1);
            const phi = Math.random() * Math.PI * 2;
            pPoints.push({
                x: Math.sin(theta) * Math.cos(phi),
                y: Math.sin(theta) * Math.sin(phi),
                z: Math.cos(theta),
                ox: Math.sin(theta) * Math.cos(phi), // original coords
                oy: Math.sin(theta) * Math.sin(phi),
                oz: Math.cos(theta)
            });
        }

        let progress = 0;
        let rotX = 0, rotY = 0, rotZ = 0;
        let expl = false;
        let explProgress = 0;
        let isPloaderLight = document.body.classList.contains('light-theme');

        // Render loop for 3D preloader
        function drawPreloader3D() {
            if (progress >= 100 && explProgress >= 1) {
                return;
            }

            pCtx.clearRect(0, 0, pW, pH);

            // Speeds up as progress increases
            const speedFactor = 1 + (progress / 100) * 4.5;
            rotX += 0.012 * speedFactor;
            rotY += 0.018 * speedFactor;
            rotZ += 0.008 * speedFactor;

            // Sphere contracts as progress increases, then explodes
            let radius = 65 * (1 - (progress / 100) * 0.35);
            if (expl) {
                explProgress += 0.04;
                radius = 65 * 0.65 + (explProgress * 300); // rapidly expand
            }

            // Project 3D points
            const projected = pPoints.map(p => {
                // Rotate X
                const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
                let y1 = p.oy * cosX - p.oz * sinX;
                let z1 = p.oz * cosX + p.oy * sinX;

                // Rotate Y
                const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
                let x2 = p.ox * cosY - z1 * sinY;
                let z2 = z1 * cosY + p.ox * sinY;

                // Rotate Z
                const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);
                let x3 = x2 * cosZ - y1 * sinZ;
                let y3 = y1 * cosZ + x2 * sinZ;

                // Perspective projection
                const fov = 200;
                const scale = fov / (fov + (z2 * radius));
                const sx = pCx + x3 * radius * scale;
                const sy = pCy + y3 * radius * scale;

                return { sx, sy, scale, z: z2 };
            });

            // Draw connecting web lines (constellation)
            const colorHue = 265;
            let lineAlpha = expl ? (1 - explProgress) * 0.15 : 0.22;
            pCtx.strokeStyle = isPloaderLight ? `hsla(${colorHue}, 80%, 45%, ${lineAlpha})` : `hsla(${colorHue}, 80%, 75%, ${lineAlpha})`;
            pCtx.lineWidth = 0.8;
            for (let i = 0; i < projected.length; i++) {
                for (let j = i + 1; j < projected.length; j++) {
                    const dx = projected[i].sx - projected[j].sx;
                    const dy = projected[i].sy - projected[j].sy;
                    const dist = Math.hypot(dx, dy);
                    if (dist < 40) {
                        pCtx.beginPath();
                        pCtx.moveTo(projected[i].sx, projected[i].sy);
                        pCtx.lineTo(projected[j].sx, projected[j].sy);
                        pCtx.stroke();
                    }
                }
            }

            // Draw glowing points
            projected.forEach(p => {
                const dotSize = Math.max(0.8, (p.z + 1.2) * 2.2);
                let dotAlpha = expl ? (1 - explProgress) * 0.9 : 0.85;
                const grad = pCtx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, dotSize * 3);
                const color = isPloaderLight ? `hsla(${colorHue}, 90%, 50%, ${dotAlpha})` : `hsla(${colorHue}, 90%, 80%, ${dotAlpha})`;
                grad.addColorStop(0, color);
                grad.addColorStop(1, 'transparent');

                pCtx.beginPath();
                pCtx.arc(p.sx, p.sy, dotSize * 3, 0, Math.PI * 2);
                pCtx.fillStyle = grad;
                pCtx.fill();

                pCtx.beginPath();
                pCtx.arc(p.sx, p.sy, dotSize, 0, Math.PI * 2);
                pCtx.fillStyle = isPloaderLight ? `hsla(${colorHue}, 95%, 45%, ${dotAlpha})` : `#ffffff`;
                pCtx.fill();
            });

            requestAnimationFrame(drawPreloader3D);
        }

        // Animate progress values
        const duration = 1600; // 1.6s
        const intervalTime = 16;
        const step = 100 / (duration / intervalTime);

        const progressInterval = setInterval(() => {
            progress += step;
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                preloaderBar.style.width = '100%';
                preloaderPct.textContent = '100%';

                // Trigger 3D explosion
                expl = true;

                setTimeout(() => {
                    preloader.style.opacity = '0';
                    preloader.style.visibility = 'hidden';
                }, 400);
            } else {
                preloaderBar.style.width = `${Math.floor(progress)}%`;
                preloaderPct.textContent = `${Math.floor(progress)}%`;
            }
        }, intervalTime);

        // Start 3D rendering
        drawPreloader3D();
    }

    /* ==========================================
       THEME TOGGLE INITIALIZATION
       ========================================== */
    const currentTheme = localStorage.getItem('courseverse_theme') || 'light';
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        updateThemeIcon(themeToggleBtn, 'light');
    } else {
        document.body.classList.remove('light-theme');
        updateThemeIcon(themeToggleBtn, 'dark');
    }

    themeToggleBtn?.addEventListener('click', () => {
        if (document.body.classList.contains('light-theme')) {
            document.body.classList.remove('light-theme');
            localStorage.setItem('courseverse_theme', 'dark');
            updateThemeIcon(themeToggleBtn, 'dark');
        } else {
            document.body.classList.add('light-theme');
            localStorage.setItem('courseverse_theme', 'light');
            updateThemeIcon(themeToggleBtn, 'light');
        }
    });

    function updateThemeIcon(btn, theme) {
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (!icon) return;
        if (theme === 'light') {
            icon.className = 'fa-solid fa-sun';
        } else {
            icon.className = 'fa-solid fa-moon';
        }
    }

    /* ==========================================
       1. 3D BACKGROUND — Handled by bg3d.js
       ========================================== */
    // bg3d.js is loaded as a standalone script and auto-initialises
    // the deep-space 3D starfield, nebula, aurora, and rings on all pages.


    /* ==========================================
       2. SCROLL REVEAL OBSERVER
       ========================================== */
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));


    /* ==========================================
       PRICING BILLING TOGGLE
       ========================================== */
    (function initPricingToggle() {
        const toggle = document.getElementById('billing-toggle');
        const monthlyLabel = document.getElementById('monthly-label');
        const annualLabel  = document.getElementById('annual-label');
        if (!toggle) return;

        let isAnnual = false;

        function updatePrices() {
            document.querySelectorAll('.pricing-amount').forEach(el => {
                const newVal = isAnnual
                    ? el.getAttribute('data-annual')
                    : el.getAttribute('data-monthly');

                // Flip animation
                el.classList.add('flip');
                setTimeout(() => {
                    el.textContent = newVal;
                    el.classList.remove('flip');
                }, 180);
            });

            toggle.classList.toggle('on', isAnnual);
            toggle.setAttribute('aria-checked', String(isAnnual));
            monthlyLabel?.classList.toggle('active', !isAnnual);
            annualLabel?.classList.toggle('active', isAnnual);
        }

        // Initialise state
        monthlyLabel?.classList.add('active');

        toggle.addEventListener('click', () => {
            isAnnual = !isAnnual;
            updatePrices();
        });

        // Also let labels act as toggle targets
        monthlyLabel?.addEventListener('click', () => { if (isAnnual)  { isAnnual = false; updatePrices(); } });
        annualLabel?.addEventListener('click',  () => { if (!isAnnual) { isAnnual = true;  updatePrices(); } });
    })();


    /* ==========================================
       3. ANIMATED COUNTERS FOR STATS
       ========================================== */
    const statCards = document.querySelectorAll('.stat-card');
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetCard = entry.target;
                const numberEl = targetCard.querySelector('.stat-number');
                const targetValue = parseInt(targetCard.getAttribute('data-target'), 10);
                const suffix = targetCard.getAttribute('data-suffix') || '';
                
                animateCount(numberEl, targetValue, suffix);
                counterObserver.unobserve(targetCard);
            }
        });
    }, { threshold: 0.2 });

    statCards.forEach(card => counterObserver.observe(card));

    function animateCount(element, target, suffix) {
        let start = 0;
        const duration = 2000; // 2 seconds
        const startTime = performance.now();

        function updateNumber(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(easeProgress * target);

            // Format number (e.g. 5,000,000 -> 5M+, 10,000 -> 10k+)
            if (suffix === 'M+' && target >= 1000000) {
                element.textContent = (currentValue / 1000000).toFixed(1).replace('.0', '') + suffix;
            } else if (suffix === 'k+' && target >= 1000) {
                element.textContent = (currentValue / 1000).toFixed(1).replace('.0', '') + suffix;
            } else {
                element.textContent = currentValue.toLocaleString() + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                // Ensure precise target match at the end
                if (suffix === 'M+') {
                    element.textContent = (target / 1000000).toFixed(1).replace('.0', '') + suffix;
                } else if (suffix === 'k+') {
                    element.textContent = (target / 1000).toFixed(1).replace('.0', '') + suffix;
                } else {
                    element.textContent = target.toLocaleString() + suffix;
                }
            }
        }

        requestAnimationFrame(updateNumber);
    }


    /* ==========================================
       4. MODAL MANAGEMENT
       ========================================== */
    const terminalModal = document.getElementById('terminal-modal');
    const starMapModal = document.getElementById('star-map-modal');
    
    const enlistTriggers = document.querySelectorAll('.enlist-btn-trigger');
    const starMapTriggers = document.querySelectorAll('.map-btn-trigger');
    
    const closeTerminalBtn = document.getElementById('close-terminal-btn');
    const closeMapBtn = document.getElementById('close-map-btn');

    // Trigger Enlist Modal
    enlistTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openTerminal();
        });
    });

    // Trigger Star Map Modal
    starMapTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openStarMap();
        });
    });

    closeTerminalBtn?.addEventListener('click', closeTerminal);
    closeMapBtn?.addEventListener('click', closeStarMap);

    // Escape closes modals
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (terminalModal) closeTerminal();
            if (starMapModal) closeStarMap();
        }
    });

    function openTerminal() {
        window.location.href = 'login.html';
    }

    function closeTerminal() {
        if (!terminalModal) return;
        terminalModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function openStarMap() {
        if (!starMapModal) return;
        starMapModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(initStarMapCanvas, 100); // Wait for styling/sizing
    }

    function closeStarMap() {
        if (!starMapModal) return;
        starMapModal.classList.remove('active');
        document.body.style.overflow = '';
    }


    /* ==========================================
       5. INTERACTIVE STAR MAP CANVAS
       ========================================== */
    const mapCanvas = document.getElementById('star-map-canvas');
    const mapCtx = mapCanvas?.getContext('2d');
    const nodeCard = document.getElementById('node-details-card');
    
    // Nodes Data
    const mapNodes = [
        {
            id: 'ai',
            name: 'Artificial Intelligence System',
            level: 'Core Pillar',
            desc: 'Neural networks, cosmic agent reasoning, and autonomous deep-space decision frameworks.',
            modules: '12',
            duration: '48 Hours',
            x: 220,
            y: 180,
            r: 16,
            color: '#8b5cf6',
            glowClass: 'glow-purple'
        },
        {
            id: 'quantum',
            name: 'Quantum Computing Academy',
            level: 'Advanced Track',
            desc: 'Qubit architecture, multi-dimensional error codes, and cryptographically secure galactic relays.',
            modules: '8',
            duration: '36 Hours',
            x: 520,
            y: 280,
            r: 16,
            color: '#c084fc',
            glowClass: 'glow-cyan'
        },
        {
            id: 'astro',
            name: 'Astro-Design & Interfaces',
            level: 'Specialized Track',
            desc: 'Gravity-isolated UI design, life support monitoring telemetry, and low-gravity structural design.',
            modules: '10',
            duration: '40 Hours',
            x: 820,
            y: 200,
            r: 16,
            color: '#ec4899',
            glowClass: 'glow-pink'
        },
        {
            id: 'cosmo',
            name: 'Cosmological Foundations',
            level: 'Introductory Track',
            desc: 'Basic orbital physics, cosmic radiation spectroscopy, and mapping wormhole coordinates.',
            modules: '6',
            duration: '18 Hours',
            x: 350,
            y: 420,
            r: 12,
            color: '#3b82f6',
            glowClass: 'glow-blue'
        },
        {
            id: 'cyber',
            name: 'Cybernetic Engineering',
            level: 'Specialized Track',
            desc: 'Bionic integration guidelines, automated orbital builders, and android behavior validation.',
            modules: '9',
            duration: '32 Hours',
            x: 680,
            y: 400,
            r: 12,
            color: '#e11d48',
            glowClass: 'glow-pink'
        }
    ];

    let hoverNode = null;
    let selectedNode = null;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let startDragX = 0;
    let startDragY = 0;

    function initStarMapCanvas() {
        if (!mapCanvas || !mapCtx) return;
        
        // Size canvas based on parent width/height
        const container = mapCanvas.parentElement;
        mapCanvas.width = container.clientWidth;
        mapCanvas.height = container.clientHeight;
        
        // Reset pan center
        panX = 0;
        panY = 0;

        // Register interactive events
        mapCanvas.addEventListener('mousedown', startPan);
        mapCanvas.addEventListener('mousemove', handleMapMove);
        window.addEventListener('mouseup', endPan);
        mapCanvas.addEventListener('click', handleMapClick);

        // Render loop
        renderMap();
    }

    function startPan(e) {
        isDragging = true;
        startDragX = e.clientX - panX;
        startDragY = e.clientY - panY;
    }

    function endPan() {
        isDragging = false;
    }

    function handleMapMove(e) {
        const rect = mapCanvas.getBoundingClientRect();
        
        if (isDragging) {
            panX = e.clientX - startDragX;
            panY = e.clientY - startDragY;
            renderMap();
            return;
        }

        // Get coordinates relative to canvas center including pan
        const cursorX = e.clientX - rect.left - panX;
        const cursorY = e.clientY - rect.top - panY;

        // Check if cursor is over any node
        let currentHover = null;
        for (const node of mapNodes) {
            const dist = Math.hypot(cursorX - node.x, cursorY - node.y);
            if (dist < node.r + 10) {
                currentHover = node;
                break;
            }
        }

        if (currentHover !== hoverNode) {
            hoverNode = currentHover;
            mapCanvas.style.cursor = hoverNode ? 'pointer' : (isDragging ? 'grabbing' : 'grab');
            renderMap();
        }
    }

    function handleMapClick(e) {
        if (hoverNode) {
            selectedNode = hoverNode;
            updateDetailsCard(selectedNode);
            renderMap();
        }
    }

    function updateDetailsCard(node) {
        if (!nodeCard) return;

        // Animate detail card changes
        nodeCard.style.opacity = 0;
        nodeCard.style.transform = 'translateY(10px)';

        setTimeout(() => {
            document.getElementById('node-title').textContent = node.name;
            document.getElementById('node-level').textContent = node.level;
            document.getElementById('node-desc').textContent = node.desc;
            document.getElementById('node-modules').textContent = node.modules;
            document.getElementById('node-duration').textContent = node.duration;

            // Update border glow color
            nodeCard.className = 'map-details-card'; // reset
            nodeCard.classList.add(node.glowClass);

            nodeCard.style.opacity = 1;
            nodeCard.style.transform = 'translateY(0)';
        }, 150);
    }

    function renderMap() {
        if (!mapCtx) return;

        // Clean Canvas
        mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

        mapCtx.save();
        mapCtx.translate(panX, panY);

        // 1. Draw Grid Lines
        mapCtx.strokeStyle = document.body.classList.contains('light-theme') ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.02)';
        mapCtx.lineWidth = 1;
        const gridSpacing = 60;
        
        // Draw grid within a large region centered on screen
        const startX = -1000;
        const endX = 2000;
        const startY = -1000;
        const endY = 2000;

        for (let x = startX; x < endX; x += gridSpacing) {
            mapCtx.beginPath();
            mapCtx.moveTo(x, startY);
            mapCtx.lineTo(x, endY);
            mapCtx.stroke();
        }
        for (let y = startY; y < endY; y += gridSpacing) {
            mapCtx.beginPath();
            mapCtx.moveTo(startX, y);
            mapCtx.lineTo(endX, y);
            mapCtx.stroke();
        }

        // 2. Draw Constellation Constellation Connectors
        mapCtx.strokeStyle = document.body.classList.contains('light-theme') ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.1)';
        mapCtx.setLineDash([5, 5]);
        mapCtx.lineWidth = 2;

        // Connect cosmology to AI and Cybernetics
        drawConnector(mapNodes[3], mapNodes[0]); // Cosmo -> AI
        drawConnector(mapNodes[3], mapNodes[1]); // Cosmo -> Quantum
        drawConnector(mapNodes[0], mapNodes[1]); // AI -> Quantum
        drawConnector(mapNodes[1], mapNodes[2]); // Quantum -> Astro
        drawConnector(mapNodes[4], mapNodes[1]); // Cyber -> Quantum
        drawConnector(mapNodes[4], mapNodes[2]); // Cyber -> Astro

        mapCtx.setLineDash([]); // Reset line dash

        // 3. Draw Nodes
        mapNodes.forEach(node => {
            const isHovered = hoverNode && hoverNode.id === node.id;
            const isSelected = selectedNode && selectedNode.id === node.id;

            // Radial Glow Gradient
            const glowRad = node.r * (isHovered || isSelected ? 3.5 : 2);
            const grad = mapCtx.createRadialGradient(node.x, node.y, node.r * 0.2, node.x, node.y, glowRad);
            grad.addColorStop(0, node.color);
            grad.addColorStop(0.3, node.color + '33');
            grad.addColorStop(1, 'transparent');

            mapCtx.fillStyle = grad;
            mapCtx.beginPath();
            mapCtx.arc(node.x, node.y, glowRad, 0, Math.PI * 2);
            mapCtx.fill();

            // Inner circle
            mapCtx.fillStyle = node.color;
            mapCtx.beginPath();
            mapCtx.arc(node.x, node.y, node.r * (isHovered ? 0.7 : 0.6), 0, Math.PI * 2);
            mapCtx.fill();

            // Outer ring
            mapCtx.strokeStyle = isSelected ? (document.body.classList.contains('light-theme') ? '#0f172a' : '#ffffff') : node.color;
            mapCtx.lineWidth = isSelected ? 3 : 2;
            mapCtx.beginPath();
            mapCtx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
            mapCtx.stroke();

            // Inner design detail for hovered nodes
            if (isHovered || isSelected) {
                mapCtx.strokeStyle = document.body.classList.contains('light-theme') ? '#0f172a' : '#ffffff';
                mapCtx.lineWidth = 1;
                mapCtx.beginPath();
                mapCtx.arc(node.x, node.y, node.r + 6, 0, Math.PI * 2);
                mapCtx.stroke();
            }

            // Labels
            mapCtx.font = "bold 13px 'Space Grotesk', sans-serif";
            mapCtx.fillStyle = document.body.classList.contains('light-theme') ? '#0f172a' : '#ffffff';
            mapCtx.textAlign = 'center';
            mapCtx.fillText(node.name.split(' ')[0], node.x, node.y - node.r - 12);
        });

        mapCtx.restore();
    }

    function drawConnector(n1, n2) {
        mapCtx.beginPath();
        mapCtx.moveTo(n1.x, n1.y);
        mapCtx.lineTo(n2.x, n2.y);
        mapCtx.stroke();
    }

    // Modal Enlist buttons on Star Map click
    document.getElementById('node-enlist-btn')?.addEventListener('click', () => {
        closeStarMap();
        setTimeout(openTerminal, 300);
    });
    /* ==========================================
       6. SIMULATED CADET ENLISTMENT REGISTRY FORM
       ========================================== */
    const enlistFormCard = document.getElementById('enlist-form-card');
    const cadetNameInput = document.getElementById('cadet-name-input');
    const enlistSubmitBtn = document.getElementById('enlist-submit-btn');
    const badgeCard = document.getElementById('cadet-badge-card');

    function resetTerminal() {
        if (cadetNameInput) cadetNameInput.value = "";
        const firstRadio = document.querySelector('input[name="cadet-track-select"][value="1"]');
        if (firstRadio) firstRadio.checked = true;
        if (badgeCard) badgeCard.style.display = 'none';
        if (enlistFormCard) enlistFormCard.style.display = 'flex';
    }

    enlistSubmitBtn?.addEventListener('click', () => {
        let cadetName = cadetNameInput?.value.trim() || "COMMANDER ALEX";
        
        let cadetTrack = "ARTIFICIAL INTELLIGENCE DIVISION";
        const selectedRadio = document.querySelector('input[name="cadet-track-select"]:checked');
        if (selectedRadio) {
            const val = selectedRadio.value;
            if (val === '1') {
                cadetTrack = "ARTIFICIAL INTELLIGENCE DIVISION";
            } else if (val === '2') {
                cadetTrack = "QUANTUM ARCHITECTURE DIVISION";
            } else if (val === '3') {
                cadetTrack = "ASTRO-DESIGN & HUMAN HUD DIVISION";
            }
        }

        showCadetBadge(cadetName, cadetTrack);
    });

    function showCadetBadge(name, track) {
        if (!enlistFormCard || !badgeCard) return;

        enlistFormCard.style.display = 'none';
        
        // Set Badge parameters
        document.getElementById('badge-name').textContent = name.toUpperCase();
        document.getElementById('badge-track').textContent = track;
        
        // Format timestamp
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('badge-time').textContent = `${year}.${month}.${date}.${hours}:${mins}`;

        badgeCard.style.display = 'flex';
    }

    // Acknowledge Cadet Badge trigger
    document.getElementById('badge-print-btn')?.addEventListener('click', () => {
        closeTerminal();
    });


    /* ==========================================
       7. TRANSMISSION FORM (NEWSLETTER SIGNUP)
       ========================================== */
    const newsletterForm = document.getElementById('newsletter-form');
    const successFeedback = document.getElementById('newsletter-success');

    newsletterForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('newsletter-email');
        
        if (emailInput && emailInput.value) {
            // Simulated transceiver sending
            const submitBtn = newsletterForm.querySelector('.newsletter-submit-btn');
            const originalHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            setTimeout(() => {
                submitBtn.innerHTML = originalHtml;
                submitBtn.disabled = false;
                emailInput.value = "";
                
                if (successFeedback) {
                    successFeedback.style.display = 'block';
                    successFeedback.style.opacity = '1';
                    
                    // Fade out success notification after 5s
                    setTimeout(() => {
                        successFeedback.style.opacity = '0';
                        setTimeout(() => {
                            successFeedback.style.display = 'none';
                        }, 500);
                    }, 5000);
                }
            }, 1200);
        }
    });


    /* ==========================================
       8. ORION AI INTERACTIVE PATH PREVIEWER
       ========================================== */
    const pathCard = document.getElementById('personalized-path-interactive');
    const analyzedCount = document.getElementById('analyzed-points');

    if (pathCard && analyzedCount) {
        pathCard.addEventListener('click', () => {
            // Animate data analyzing point increases
            let currentPoints = parseInt(analyzedCount.textContent.replace(',', ''), 10);
            const targetPoints = currentPoints + Math.floor(Math.random() * 800 + 200);
            const progressBar = pathCard.querySelector('.progress-bar-fill');
            
            // Randomize progress value slightly
            const randomProgress = Math.floor(Math.random() * 20 + 75);
            if (progressBar) progressBar.style.width = `${randomProgress}%`;
            
            // Text optimization percentage badge
            const optLabel = pathCard.querySelector('.progress-label');
            if (optLabel) optLabel.textContent = `${randomProgress}% PATH OPTIMIZATION`;

            const startVal = currentPoints;
            const stepDuration = 800;
            const startTime = performance.now();

            function updatePoints(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / stepDuration, 1);
                const current = Math.floor(startVal + progress * (targetPoints - startVal));
                
                analyzedCount.textContent = current.toLocaleString();

                if (progress < 1) {
                    requestAnimationFrame(updatePoints);
                }
            }
            requestAnimationFrame(updatePoints);
        });
    }

    /* ==========================================
       9. LANDING PAGE DEAD LINKS WIRING (Task 3)
       ========================================== */
    if (!window.showToast) {
        window.showToast = function(message, type = 'info') {
            const toast = document.getElementById('glass-toast');
            if (!toast) return;
            toast.className = `glass-toast ${type}`;
            toast.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'circle-check' : type === 'error' ? 'circle-xmark' : 'circle-info'}"></i> ${message}`;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3500);
        };
    }

    const isLandingPage = document.querySelector('.hero-section') !== null;

    if (isLandingPage) {
        // Bell and Settings Buttons
        document.getElementById('bell-btn')?.addEventListener('click', () => {
            showToast('Please login to view transmissions.', 'info');
        });
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            showToast('Please login to access settings.', 'info');
        });

        // Search Input on Landing Page
        const searchInput = document.getElementById('search-constellations');
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                showToast('Login required to search the galaxy.', 'info');
            }
        });
        // Coming Soon Modal replacement (Toast alerts)
        function showComingSoonToast(e) {
            e.preventDefault();
            showToast('Coming soon to the CourseVerse constellation!', 'info');
        }

        // Footer links and Social Links
        const footerLinks = document.querySelectorAll('.footer-links-list a, .footer-bottom-links a, .social-links a');
        footerLinks.forEach(link => {
            link.addEventListener('click', showComingSoonToast);
        });
    }

    /* ==========================================
       10. CUSTOM COSMIC CURSOR INITIALIZATION
       ========================================== */
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (!isTouchDevice) {
        const dot = document.createElement('div');
        const outline = document.createElement('div');
        dot.className = 'custom-cursor-dot';
        outline.className = 'custom-cursor-outline';
        document.body.appendChild(dot);
        document.body.appendChild(outline);
        document.body.classList.add('custom-cursor-active');

        let mouseX = -100;
        let mouseY = -100;
        let outlineX = -100;
        let outlineY = -100;
        let isHovering = false;
        let isClicked = false;
        let hasMoved = false;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            if (!hasMoved) {
                hasMoved = true;
                dot.style.opacity = '1';
                outline.style.opacity = '1';
            }
        });

        // Smooth outline physics animation
        function updateCursorPhysics() {
            const ease = 0.15;
            outlineX += (mouseX - outlineX) * ease;
            outlineY += (mouseY - outlineY) * ease;

            // Apply translate3d for max render performance (GPU accelerated)
            dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;

            let scale = 1.0;
            if (isClicked) {
                scale = 0.55;
            } else if (isHovering) {
                scale = 1.55;
            }
            outline.style.transform = `translate3d(${outlineX}px, ${outlineY}px, 0) scale(${scale})`;

            requestAnimationFrame(updateCursorPhysics);
        }
        requestAnimationFrame(updateCursorPhysics);

        // Click state interactions
        window.addEventListener('mousedown', () => {
            isClicked = true;
        });
        window.addEventListener('mouseup', () => {
            isClicked = false;
        });

        // Hover delegation over interactive anchors
        document.addEventListener('mouseover', (e) => {
            const target = e.target;
            if (!target) return;
            const isClickable = target.closest('a, button, input, select, textarea, .role-tab, [role="button"], .interactive-node, .switch-form-btn, .action-btn, .nav-link, .social-links a');
            if (isClickable) {
                isHovering = true;
                dot.classList.add('hover');
                outline.classList.add('hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target;
            if (!target) return;
            const isClickable = target.closest('a, button, input, select, textarea, .role-tab, [role="button"], .interactive-node, .switch-form-btn, .action-btn, .nav-link, .social-links a');
            if (isClickable) {
                isHovering = false;
                dot.classList.remove('hover');
                outline.classList.remove('hover');
            }
        });

        // Window boundary handling
        document.addEventListener('mouseleave', () => {
            dot.style.opacity = '0';
            outline.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            if (hasMoved) {
                dot.style.opacity = '1';
                outline.style.opacity = '1';
            }
        });
    }

    /* ==========================================
       AURA AI COPILOT INTERACTION & ANIMATION
       ========================================== */
    const auraSection = document.getElementById('aura-ai');
    if (auraSection) {
        const textLine = auraSection.querySelector('.cursor-typing');
        const successLine = auraSection.querySelector('.success-line');
        const summaryQuote = auraSection.querySelector('.summary-quote');
        const scorePercentage = auraSection.querySelector('.score-percentage');
        const fgCircle = auraSection.querySelector('.score-fg-circle');
        const scoreStatus = auraSection.querySelector('.score-status');

        // Initial hidden states
        if (successLine) {
            successLine.style.opacity = '0';
            successLine.style.transform = 'translateY(10px)';
        }
        if (summaryQuote) {
            summaryQuote.style.opacity = '0';
            summaryQuote.style.transform = 'translateY(10px)';
        }
        if (scorePercentage) scorePercentage.textContent = '0%';
        if (scoreStatus) scoreStatus.style.opacity = '0';

        const auraObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startAuraAnimation();
                    auraObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        auraObserver.observe(auraSection);

        function startAuraAnimation() {
            // 1. Text typing animation
            const fullText = "> Analyzing your spending patterns for this month...";
            if (textLine) {
                textLine.textContent = "";
                textLine.style.width = "0";
                let i = 0;
                
                textLine.style.animation = "none"; // clear animation class style if any
                textLine.offsetHeight; // trigger reflow
                textLine.style.borderRight = "2px solid var(--clr-cyan)";
                textLine.style.width = "auto";
                
                const typingInterval = setInterval(() => {
                    if (i < fullText.length) {
                        textLine.textContent += fullText.charAt(i);
                        i++;
                    } else {
                        clearInterval(typingInterval);
                        setTimeout(() => {
                            textLine.style.borderRight = "none";
                            showSummary();
                        }, 500);
                    }
                }, 30);
            } else {
                showSummary();
            }
        }

        function showSummary() {
            if (successLine) {
                successLine.style.transition = "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
                successLine.style.opacity = "1";
                successLine.style.transform = "translateY(0)";
            }
            
            setTimeout(() => {
                if (summaryQuote) {
                    summaryQuote.style.transition = "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
                    summaryQuote.style.opacity = "1";
                    summaryQuote.style.transform = "translateY(0)";
                }
                
                animateHealthScore();
            }, 500);
        }

        function animateHealthScore() {
            const targetScore = 94;
            const circumference = 251.2;
            const offset = circumference - (targetScore / 100) * circumference;

            if (fgCircle) {
                fgCircle.style.strokeDasharray = circumference;
                fgCircle.style.strokeDashoffset = circumference;
                fgCircle.getBoundingClientRect(); // trigger reflow
                fgCircle.style.transition = "stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)";
                fgCircle.style.strokeDashoffset = offset;
            }

            let current = 0;
            if (scorePercentage) {
                scorePercentage.style.transition = "opacity 0.4s ease";
                scorePercentage.style.opacity = "1";
                const countInterval = setInterval(() => {
                    if (current <= targetScore) {
                        scorePercentage.textContent = current + "%";
                        current++;
                    } else {
                        clearInterval(countInterval);
                        if (scoreStatus) {
                            scoreStatus.style.transition = "opacity 0.5s ease";
                            scoreStatus.style.opacity = "1";
                        }
                    }
                }, 15);
            }
        }
    }

});
