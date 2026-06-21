// CourseVerse App Logic

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       THEME TOGGLE INITIALIZATION
       ========================================== */
    const currentTheme = localStorage.getItem('courseverse_theme') || 'dark';
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        updateThemeIcon(themeToggleBtn, 'light');
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
       1. STARFIELD BACKGROUND CANVAS
       ========================================== */
    const bgCanvas = document.getElementById('starfield-canvas');
    const bgCtx = bgCanvas?.getContext('2d');
    let stars = [];
    const starCount = 100;
    let mouseX = 0;
    let mouseY = 0;

    if (bgCanvas && bgCtx) {
        resizeBgCanvas();
        initStars();
        animateStars();

        window.addEventListener('resize', resizeBgCanvas);
        window.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX - window.innerWidth / 2) * 0.05;
            mouseY = (e.clientY - window.innerHeight / 2) * 0.05;
        });
    }

    function resizeBgCanvas() {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
    }

    function initStars() {
        stars = [];
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * bgCanvas.width,
                y: Math.random() * bgCanvas.height,
                size: Math.random() * 1.8 + 0.2,
                speedX: (Math.random() - 0.5) * 0.2,
                speedY: (Math.random() - 0.5) * 0.2,
                opacity: Math.random() * 0.8 + 0.2
            });
        }
    }

    function animateStars() {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        
        stars.forEach(star => {
            // Move stars slowly
            star.x += star.speedX;
            star.y += star.speedY;

            // Apply light mouse parallax drift
            const driftX = mouseX * 0.1 * (star.size * 0.5);
            const driftY = mouseY * 0.1 * (star.size * 0.5);

            // Wrap around edges
            if (star.x < 0) star.x = bgCanvas.width;
            if (star.x > bgCanvas.width) star.x = 0;
            if (star.y < 0) star.y = bgCanvas.height;
            if (star.y > bgCanvas.height) star.y = 0;

            // Draw star
            if (document.body.classList.contains('light-theme')) {
                bgCtx.fillStyle = `rgba(139, 92, 246, ${star.opacity * 0.45})`;
            } else {
                bgCtx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            }
            bgCtx.beginPath();
            bgCtx.arc(star.x + driftX, star.y + driftY, star.size, 0, Math.PI * 2);
            bgCtx.fill();
        });

        requestAnimationFrame(animateStars);
    }


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
        if (!terminalModal) return;
        terminalModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        resetTerminal();
        startTerminalSequence();
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
            color: '#06b6d4',
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
       6. SIMULATED CADET ENLISTMENT TERMINAL
       ========================================== */
    const termScreen = document.getElementById('terminal-screen');
    const termOutput = document.getElementById('terminal-output');
    const termInput = document.getElementById('terminal-input');
    const badgeCard = document.getElementById('cadet-badge-card');
    
    let terminalStep = 0;
    let cadetName = "";
    let cadetTrack = "";

    const terminalPrompts = [
        "SYSTEM STATUS: GLOBAL ORBITAL BEACONS SECURED [100%]\n" +
        "CONNECTING TO ORION SYSTEM CORE...\n" +
        "ESTABLISHING HIGH-BANDWIDTH DATA FREQUENCY...\n" +
        "-----------------------------------------------\n" +
        "Welcome to the CourseVerse Galactic Registry.\n" +
        "Orion AI is online. Accessing database parameters...\n\n" +
        "Authentication Protocol: SECURE DIRECT TRANSFER\n" +
        "Please enter your desired CADET CALLSIGN:\n",
        
        "\nCONFIRMED. Custom callsign locked.\n" +
        "Scanning satellite coordinates... Success.\n" +
        "Select your specialized CURRICULUM DIVISION:\n" +
        "  [1] Artificial Intelligence Systems\n" +
        "  [2] Quantum Computation & FTL Networks\n" +
        "  [3] Astro-Architectural Interface Design\n\n" +
        "Enter division number (1, 2, or 3):\n",

        "\nSyncing curriculum credentials...\n" +
        "Compiling digital credentials for cryptographic badge...\n" +
        "Deploying smart badge asset files...\n" +
        "REGISTRATION INSTRUCTIONS FINALIZED.\n" +
        "LOCKED AND ENGAGED. PRESS ENTER TO FINALIZE TRANSCEIVER FREQUENCY.\n"
    ];

    function resetTerminal() {
        terminalStep = 0;
        cadetName = "";
        cadetTrack = "";
        if (termOutput) termOutput.innerHTML = "";
        if (termInput) {
            termInput.value = "";
            termInput.disabled = false;
        }
        if (badgeCard) badgeCard.style.display = 'none';
        if (termScreen) termScreen.style.display = 'flex';
    }

    function startTerminalSequence() {
        typeOutput(terminalPrompts[0], 0, () => {
            termInput.focus();
        });
    }

    function typeOutput(text, index, callback) {
        if (!termOutput) return;

        let charIdx = 0;
        const interval = setInterval(() => {
            if (charIdx < text.length) {
                termOutput.innerHTML += text[charIdx];
                charIdx++;
                termScreen.scrollTop = termScreen.scrollHeight;
            } else {
                clearInterval(interval);
                if (callback) callback();
            }
        }, 12);
    }

    termInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const inputVal = termInput.value.trim();
            termInput.value = "";

            if (!inputVal) return;

            // Echo input in terminal
            termOutput.innerHTML += `<span style="color: #fff;">${inputVal}</span>\n`;

            if (terminalStep === 0) {
                // Name confirmation step
                cadetName = inputVal;
                terminalStep = 1;
                termInput.disabled = true;

                setTimeout(() => {
                    typeOutput(terminalPrompts[1], 0, () => {
                        termInput.disabled = false;
                        termInput.focus();
                    });
                }, 400);
            } else if (terminalStep === 1) {
                // Track selection step
                if (inputVal === '1') {
                    cadetTrack = "ARTIFICIAL INTELLIGENCE DIVISION";
                } else if (inputVal === '2') {
                    cadetTrack = "QUANTUM ARCHITECTURE DIVISION";
                } else if (inputVal === '3') {
                    cadetTrack = "ASTRO-DESIGN & HUMAN HUD DIVISION";
                } else {
                    termOutput.innerHTML += "INVALID PATH SPECIFIED. Enter 1, 2, or 3:\n";
                    return;
                }

                terminalStep = 2;
                termInput.disabled = true;

                setTimeout(() => {
                    typeOutput(terminalPrompts[2], 0, () => {
                        termInput.disabled = false;
                        termInput.focus();
                    });
                }, 400);
            } else if (terminalStep === 2) {
                // Final Badge display
                termInput.disabled = true;
                showCadetBadge();
            }
        }
    });

    function showCadetBadge() {
        if (!termScreen || !badgeCard) return;

        termScreen.style.display = 'none';
        
        // Set Badge parameters
        document.getElementById('badge-name').textContent = cadetName.toUpperCase();
        document.getElementById('badge-track').textContent = cadetTrack;
        
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

        // Coming Soon Modal toggle
        function showComingSoon(e) {
            e.preventDefault();
            document.getElementById('coming-soon-modal')?.classList.add('active');
        }

        document.getElementById('close-coming-soon')?.addEventListener('click', () => {
            document.getElementById('coming-soon-modal')?.classList.remove('active');
        });

        // Pricing Nav Link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === '#pricing') {
                link.addEventListener('click', showComingSoon);
            }
        });

        // Footer links and Social Links
        const footerLinks = document.querySelectorAll('.footer-links-list a, .footer-bottom-links a, .social-links a');
        footerLinks.forEach(link => {
            link.addEventListener('click', showComingSoon);
        });
    }

});
