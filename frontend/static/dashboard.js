// CourseVerse Dashboard Page Logic

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       1. ROUTE CONTROL & ROLE DOM SWITCHING
       ========================================== */
    const token = localStorage.getItem('courseverse_token');
    const userJson = localStorage.getItem('courseverse_user');
    if (!token || !userJson) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(userJson);
    const userRole = user.role || 'student';
    
    // Select dashboard wrappers
    const studentDash = document.getElementById('student-dash');
    const instructorDash = document.getElementById('instructor-dash');
    const adminDash = document.getElementById('admin-dash');
    
    // Header UI nodes
    const headerTitle = document.getElementById('dash-header-title');
    const profileName = document.getElementById('user-profile-name');
    const profileLevel = document.getElementById('user-profile-level');
    const profileAvatar = document.getElementById('user-profile-avatar');

    // Footer UI nodes
    const footerLeftInfo = document.getElementById('footer-left-info');
    const footerRightLinks = document.getElementById('footer-right-links');

    // Display correct dashboard and configure details
    if (userRole === 'student') {
        if (studentDash) studentDash.style.display = 'block';
        
        // Populate header details
        if (headerTitle) headerTitle.textContent = "Mission Control";
        if (profileName) profileName.textContent = user.name;
        if (profileLevel) profileLevel.textContent = `LEVEL ${user.level} CADET`;
        if (profileAvatar && user.avatar_svg) {
            profileAvatar.innerHTML = user.avatar_svg;
        }

        // Configure footer
        if (footerLeftInfo) {
            footerLeftInfo.innerHTML = `COURSEVERSE COMMAND CENTER v2.8.4 <span class="footer-sync-time">LAST SYNC: 14:02 STARDATE:442.1</span>`;
        }
        if (footerRightLinks) {
            footerRightLinks.innerHTML = `
                <a href="#">Privacy Protocol</a>
                <a href="#">Safety Systems</a>
            `;
        }

        // Initialize student specific canvas
        initConstellationCanvas();

    } else if (userRole === 'instructor') {
        if (instructorDash) instructorDash.style.display = 'block';
        
        // Populate header details
        if (headerTitle) headerTitle.textContent = "Command Center";
        if (profileName) profileName.textContent = user.name;
        if (profileLevel) profileLevel.textContent = `LEVEL ${user.level} INSTRUCTOR`;
        if (profileAvatar) {
            profileAvatar.style.borderColor = '#06b6d4';
            profileAvatar.innerHTML = `
                <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="#0d1f2d" stroke="#06b6d4" stroke-width="2"/>
                    <!-- Instructor avatar graphics -->
                    <circle cx="50" cy="38" r="16" fill="none" stroke="#06b6d4" stroke-width="2"/>
                    <line x1="30" y1="72" x2="70" y2="72" stroke="#06b6d4" stroke-width="2"/>
                    <path d="M30,72 Q50,55 70,72" fill="none" stroke="#8b5cf6" stroke-width="2"/>
                </svg>
            `;
        }

        // Configure footer
        if (footerLeftInfo) {
            footerLeftInfo.innerHTML = `© 2245 COURSEVERSE ACADEMY • GALACTIC STANDARD TIME`;
        }
        if (footerRightLinks) {
            footerRightLinks.innerHTML = `
                <a href="#">Mission Logs</a>
                <a href="#">Privacy Nebula</a>
                <a href="#">Comm-Link</a>
            `;
        }

    } else if (userRole === 'admin') {
        if (adminDash) adminDash.style.display = 'block';
        
        // Populate header details
        if (headerTitle) headerTitle.textContent = "Intelligence Center";
        if (profileName) profileName.textContent = user.name;
        if (profileLevel) profileLevel.textContent = `Lvl ${user.level} Explorer`;
        if (profileAvatar) {
            profileAvatar.style.borderColor = '#ec4899';
            profileAvatar.innerHTML = `
                <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="#201224" stroke="#ec4899" stroke-width="2"/>
                    <!-- Admin specific graphics -->
                    <rect x="42" y="28" width="16" height="16" fill="none" stroke="#ec4899" stroke-width="2" transform="rotate(45 50 36)"/>
                    <circle cx="50" cy="36" r="4" fill="#00f0ff"/>
                    <path d="M25,76 C25,60 75,60 75,76" fill="none" stroke="#ec4899" stroke-width="2"/>
                </svg>
            `;
        }

        // Configure footer
        if (footerLeftInfo) {
            footerLeftInfo.innerHTML = `COURSEVERSE INTEL CENTER v8.2.1 <span class="footer-sync-time">LAST SYNC: 14:02 STARDATE:442.1</span>`;
        }
        if (footerRightLinks) {
            footerRightLinks.innerHTML = `
                <a href="#">Security Logs</a>
                <a href="#">System Logs</a>
                <a href="#">Network Terminal</a>
            `;
        }

        // Initialize admin specific canvases
        initGalaxyMapCanvas();
        initDataVelocityCanvas();
    }


    /* ==========================================
       2. LOGOUT LOGIC
       ========================================== */
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', () => {
        localStorage.removeItem('courseverse_token');
        localStorage.removeItem('courseverse_user');
        sessionStorage.removeItem('courseverse_role');
    });

    // Fetch telemetry data from analytics endpoint
    async function fetchTelemetry() {
        try {
            const response = await fetch('/api/analytics/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) return;

            if (userRole === 'student') {
                const obj = data.objective;
                
                // Update current objective title
                const objTitle = document.querySelector('.current-objective-card .objective-title');
                if (objTitle) objTitle.textContent = obj.course_title;
                
                // Update radial progress circle
                const progressRing = document.querySelector('.progress-ring-circle');
                const progressText = document.querySelector('.progress-text-overlay strong');
                if (progressText) {
                    progressText.textContent = `${obj.progress}%`;
                }
                if (progressRing) {
                    const radius = 54;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (obj.progress / 100) * circumference;
                    progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
                    progressRing.style.strokeDashoffset = offset;
                }

                // Update velocity
                const velocityVal = document.querySelector('.velocity-value');
                if (velocityVal) velocityVal.textContent = `${obj.velocity}x`;

                // Update time spent
                const timeSpentVal = document.querySelector('.time-value');
                if (timeSpentVal) {
                    const hrs = Math.floor(obj.time_spent / 60);
                    const mins = obj.time_spent % 60;
                    timeSpentVal.textContent = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                }

                // Update urgent tasks list
                const tasksList = document.querySelector('.tasks-list');
                if (tasksList) {
                    if (data.urgentTasks && data.urgentTasks.length > 0) {
                        tasksList.innerHTML = data.urgentTasks.map(t => `
                            <div class="task-item" style="cursor: pointer" onclick="viewEnrolledCourse(${t.course_id || ''})">
                                <div class="task-icon"><i class="fa-solid fa-clipboard-question"></i></div>
                                <div class="task-info">
                                    <h4>${t.title}</h4>
                                    <span><i class="fa-regular fa-calendar-days"></i> Due: ${new Date(t.deadline).toLocaleDateString()}</span>
                                </div>
                            </div>
                        `).join('');
                        const tasksBadge = document.querySelector('.tasks-badge');
                        if (tasksBadge) tasksBadge.textContent = `${data.urgentTasks.length} PENDING`;
                    } else {
                        tasksList.innerHTML = '<p class="no-tasks" style="color: rgba(255,255,255,0.4); text-align: center; padding: 20px 0;">No pending assignment tasks.</p>';
                        const tasksBadge = document.querySelector('.tasks-badge');
                        if (tasksBadge) tasksBadge.textContent = `0 PENDING`;
                    }
                }

                // Update recent broadcasts/logs list
                const broadcastList = document.querySelector('.broadcasts-list');
                if (broadcastList && data.recentBroadcasts) {
                    broadcastList.innerHTML = data.recentBroadcasts.map(b => `
                        <li>
                            <span class="bullet ${b.type}"></span>
                            <p>${b.text}</p>
                        </li>
                    `).join('');
                }

                // Change Resume Session button to Claim Certificate if 100%
                const resumeBtn = document.querySelector('.current-objective-card .resume-btn');
                if (resumeBtn) {
                    if (obj.progress === 100) {
                        resumeBtn.textContent = "Claim Stellar Certificate";
                        resumeBtn.style.background = "linear-gradient(135deg, #f59e0b, #ec4899)";
                        resumeBtn.style.boxShadow = "0 0 15px rgba(245, 158, 11, 0.4)";
                        resumeBtn.style.color = "#fff";
                        resumeBtn.onclick = (e) => {
                            e.preventDefault();
                            generateStellarCertificate(obj.course_title);
                        };
                    } else {
                        resumeBtn.textContent = "Resume Session";
                        resumeBtn.style.background = "";
                        resumeBtn.style.boxShadow = "";
                        resumeBtn.onclick = (e) => {
                            e.preventDefault();
                            openCatalog();
                        };
                    }
                }

            } else if (userRole === 'instructor') {
                const revVal = document.querySelector('.revenue-card .rev-value');
                if (revVal) revVal.innerHTML = `${data.revenue} <span class="rev-trend"><i class="fa-solid fa-arrow-trend-up"></i> +12%</span>`;

                const satVal = document.querySelector('.satisfaction-card .sat-value');
                if (satVal) satVal.textContent = data.cadetSatisfaction;

                const gradVal = document.querySelector('.grading-card .grad-value');
                if (gradVal) gradVal.textContent = data.gradingQueueCount;

                const moduleTitle = document.querySelector('.active-module-card .module-name');
                if (moduleTitle) moduleTitle.textContent = data.activeCourse.title;

                const stats = document.querySelectorAll('.active-module-card .m-stat strong');
                if (stats.length >= 3) {
                    stats[0].textContent = data.activeCourse.enrolled.toLocaleString();
                    stats[1].textContent = data.activeCourse.completion;
                    stats[2].textContent = data.activeCourse.velocity;
                }
            } else if (userRole === 'admin') {
                const counters = document.querySelectorAll('.telemetry-counters .tel-counter strong');
                if (counters.length >= 1) {
                    counters[0].textContent = data.totalNodes.toLocaleString();
                }

                const tableBody = document.querySelector('.logs-table tbody');
                if (tableBody && data.logs) {
                    tableBody.innerHTML = data.logs.map(log => `
                        <tr>
                            <td><strong>${log.operation}</strong></td>
                            <td>${log.source}</td>
                            <td>${log.time}</td>
                            <td><span class="status-pill status-success"><span class="dot"></span> ${log.status}</span></td>
                            <td>${log.latency}</td>
                        </tr>
                    `).join('');
                }
            }
        } catch (err) {
            console.error('Error fetching dashboard telemetry:', err);
        }
    }

    fetchTelemetry();


    /* ==========================================
       3. CONSTELLATION GRAPHICS (STUDENT VIEW)
       ========================================== */
    function initConstellationCanvas() {
        const canvas = document.getElementById('constellation-canvas');
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        let width = canvas.width = canvas.parentElement.clientWidth;
        let height = canvas.height = canvas.parentElement.clientHeight;

        window.addEventListener('resize', () => {
            if (canvas.parentElement) {
                width = canvas.width = canvas.parentElement.clientWidth;
                height = canvas.height = canvas.parentElement.clientHeight;
            }
        });

        // 3D Star points coords
        const nodes = [
            { x: 0, y: -80, z: 0 },   // Top point
            { x: 75, y: -25, z: 0 },  // Top-right
            { x: 45, y: 60, z: 0 },   // Bottom-right
            { x: -45, y: 60, z: 0 },  // Bottom-left
            { x: -75, y: -25, z: 0 }, // Top-left
            { x: 0, y: 15, z: 0 }     // Center point
        ];

        let angleY = 0.01;
        let angleX = 0.005;

        function rotateX(node, angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const y1 = node.y * cos - node.z * sin;
            const z1 = node.z * cos + node.y * sin;
            node.y = y1;
            node.z = z1;
        }

        function rotateY(node, angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const x1 = node.x * cos - node.z * sin;
            const z1 = node.z * cos + node.x * sin;
            node.x = x1;
            node.z = z1;
        }

        function drawConstellation() {
            ctx.clearRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;

            // Update node rotations
            nodes.forEach(node => {
                rotateY(node, angleY);
                rotateX(node, angleX);
            });

            // Project 3D nodes to 2D
            const projected = nodes.map(node => {
                const scale = 250 / (250 + node.z); // Perspective scale
                return {
                    x: node.x * scale + cx,
                    y: node.y * scale + cy,
                    z: node.z,
                    scale: scale
                };
            });

            // Draw connecting lines
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            // Draw star outline connections
            ctx.moveTo(projected[0].x, projected[0].y);
            ctx.lineTo(projected[2].x, projected[2].y);
            ctx.lineTo(projected[4].x, projected[4].y);
            ctx.lineTo(projected[1].x, projected[1].y);
            ctx.lineTo(projected[3].x, projected[3].y);
            ctx.closePath();
            ctx.stroke();

            // Draw outer border links
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            for(let i=0; i<5; i++) {
                ctx.moveTo(projected[i].x, projected[i].y);
                ctx.lineTo(projected[(i+1)%5].x, projected[(i+1)%5].y);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw center connections
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.beginPath();
            for(let i=0; i<5; i++) {
                ctx.moveTo(projected[5].x, projected[5].y);
                ctx.lineTo(projected[i].x, projected[i].y);
            }
            ctx.stroke();

            // Draw nodes
            projected.forEach((p, idx) => {
                const radius = (idx === 5 ? 5 : 6) * p.scale;
                
                // Color configuration
                let clr = '#8b5cf6'; // purple
                if (idx % 2 === 0) clr = '#06b6d4'; // cyan
                if (idx === 5) clr = document.body.classList.contains('light-theme') ? '#1e293b' : '#ffffff'; // center node

                // Glow radial fill
                const glowGrad = ctx.createRadialGradient(p.x, p.y, radius*0.2, p.x, p.y, radius*4);
                glowGrad.addColorStop(0, clr);
                glowGrad.addColorStop(0.3, clr + '22');
                glowGrad.addColorStop(1, 'transparent');

                ctx.fillStyle = glowGrad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius * 4, 0, Math.PI * 2);
                ctx.fill();

                // Solid center dot
                ctx.fillStyle = clr;
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                ctx.fill();
            });

            requestAnimationFrame(drawConstellation);
        }

        drawConstellation();
    }


    /* ==========================================
       4. TELEMETRY GALAXY MAP (ADMIN VIEW)
       ========================================== */
    function initGalaxyMapCanvas() {
        const canvas = document.getElementById('galaxy-map-canvas');
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        let width = canvas.width = canvas.parentElement.clientWidth;
        let height = canvas.height = canvas.parentElement.clientHeight;

        window.addEventListener('resize', () => {
            if (canvas.parentElement) {
                width = canvas.width = canvas.parentElement.clientWidth;
                height = canvas.height = canvas.parentElement.clientHeight;
            }
        });

        // Generate spiral arm stars
        const stars = [];
        const armCount = 2;
        const starCount = 380;
        
        for (let i = 0; i < starCount; i++) {
            // Distance from center
            const r = Math.pow(Math.random(), 2.5) * 160 + 5;
            // Angle spread along arm spiral
            const armAngle = (i % armCount) * (2 * Math.PI / armCount);
            const theta = r * 0.035 + armAngle + (Math.random() - 0.5) * 0.45;
            
            stars.push({
                r: r,
                theta: theta,
                speed: 0.002 + (1 - r/180) * 0.003,
                size: Math.random() * 1.5 + 0.3,
                opacity: Math.random() * 0.6 + 0.4
            });
        }

        // Blinking system anchor points
        const bases = [
            { name: 'Orion Ring Base', r: 45, theta: 1.5, size: 6, color: '#8b5cf6', blink: true },
            { name: 'Andromeda Gateway', r: 95, theta: 4.2, size: 6, color: '#06b6d4', blink: true },
            { name: 'Alpha Core Signal', r: 135, theta: 2.8, size: 4, color: '#ec4899', blink: true }
        ];

        let hoverNode = null;
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - width/2;
            const mouseY = e.clientY - rect.top - height/2;
            
            let found = null;
            bases.forEach(base => {
                const bx = base.r * Math.cos(base.theta);
                const by = base.r * Math.sin(base.theta);
                const dist = Math.hypot(mouseX - bx, mouseY - by);
                if (dist < 12) {
                    found = base;
                }
            });
            hoverNode = found;
        });

        function animateGalaxy() {
            ctx.fillStyle = document.body.classList.contains('light-theme') ? '#f8fafc' : '#060812';
            ctx.fillRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;

            // Draw core grid circular metrics
            ctx.strokeStyle = document.body.classList.contains('light-theme') ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.015)';
            ctx.lineWidth = 1;
            for(let radius = 50; radius <= 200; radius += 50) {
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Draw galaxy core glow
            const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 35);
            coreGrad.addColorStop(0, document.body.classList.contains('light-theme') ? '#7c3aed' : '#ffffff');
            coreGrad.addColorStop(0.2, '#c084fc');
            coreGrad.addColorStop(0.5, document.body.classList.contains('light-theme') ? 'rgba(124, 58, 237, 0.15)' : 'rgba(139, 92, 246, 0.25)');
            coreGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, 35, 0, Math.PI*2);
            ctx.fill();

            // Draw stars
            stars.forEach(star => {
                // Spin star
                star.theta += star.speed;
                
                // Polar to cartesian
                const x = star.r * Math.cos(star.theta) + cx;
                const y = star.r * Math.sin(star.theta) + cy;

                ctx.fillStyle = document.body.classList.contains('light-theme') ? `rgba(109, 40, 217, ${star.opacity * 0.3})` : `rgba(255, 255, 255, ${star.opacity})`;
                ctx.beginPath();
                ctx.arc(x, y, star.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw base nodes
            bases.forEach(base => {
                base.theta += 0.0015; // rotate slow
                
                const bx = base.r * Math.cos(base.theta) + cx;
                const by = base.r * Math.sin(base.theta) + cy;

                // Pulsing outer ring
                const time = Date.now() * 0.004;
                const ringScale = Math.sin(time) * 4 + 8;
                
                ctx.strokeStyle = base.color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(bx, by, ringScale, 0, Math.PI * 2);
                ctx.stroke();

                // Inner core
                ctx.fillStyle = base.color;
                ctx.beginPath();
                ctx.arc(bx, by, base.size / 2, 0, Math.PI * 2);
                ctx.fill();

                // Text labels
                ctx.fillStyle = document.body.classList.contains('light-theme') ? '#1e293b' : '#ffffff';
                ctx.font = '500 10px var(--font-heading)';
                ctx.textAlign = 'left';
                ctx.fillText(base.name, bx + 12, by + 4);
            });

            // Draw hover tooltip HUD
            if (hoverNode) {
                const bx = hoverNode.r * Math.cos(hoverNode.theta) + cx;
                const by = hoverNode.r * Math.sin(hoverNode.theta) + cy;

                ctx.fillStyle = document.body.classList.contains('light-theme') ? 'rgba(255, 255, 255, 0.95)' : 'rgba(13, 19, 41, 0.95)';
                ctx.strokeStyle = varColorHex(hoverNode.color);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(bx + 15, by - 40, 150, 50, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = document.body.classList.contains('light-theme') ? '#0f172a' : '#ffffff';
                ctx.font = 'bold 10px monospace';
                ctx.fillText(`SYSTEM: ${hoverNode.name.toUpperCase()}`, bx + 22, by - 26);
                
                ctx.fillStyle = document.body.classList.contains('light-theme') ? 'rgba(109, 40, 217, 0.9)' : 'rgba(6, 240, 255, 0.8)';
                ctx.fillText(`STATUS: LINK STABLE`, bx + 22, by - 12);
            }

            requestAnimationFrame(animateGalaxy);
        }

        function varColorHex(col) {
            if(col === '#8b5cf6') return '#8b5cf6';
            if(col === '#06b6d4') return '#06b6d4';
            return '#ec4899';
        }

        animateGalaxy();
    }


    /* ==========================================
       5. DATA VELOCITY SPLINE (ADMIN VIEW)
       ========================================== */
    function initDataVelocityCanvas() {
        const canvas = document.getElementById('data-velocity-canvas');
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        let width = canvas.width = canvas.parentElement.clientWidth;
        let height = canvas.height = canvas.parentElement.clientHeight;

        window.addEventListener('resize', () => {
            if (canvas.parentElement) {
                width = canvas.width = canvas.parentElement.clientWidth;
                height = canvas.height = canvas.parentElement.clientHeight;
            }
        });

        let offset = 0;

        function drawWave() {
            ctx.clearRect(0, 0, width, height);

            const cy = height / 2 + 10;
            
            // Draw Wave 1 (Muted, background)
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const y = cy + Math.sin(x * 0.01 + offset) * 20 + Math.cos(x * 0.005 - offset) * 10;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Draw Wave 2 (Active, glowing)
            const mainGrad = ctx.createLinearGradient(0, 0, width, 0);
            mainGrad.addColorStop(0, '#8b5cf6');
            mainGrad.addColorStop(0.5, '#ec4899');
            mainGrad.addColorStop(1, '#06b6d4');

            ctx.strokeStyle = mainGrad;
            ctx.lineWidth = 3;
            
            // Setup gradient area fill path
            const fillPath = new Path2D();
            fillPath.moveTo(0, height);

            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const y = cy + Math.sin(x * 0.012 - offset * 1.2) * 25 + Math.cos(x * 0.008 + offset * 0.8) * 12;
                if (x === 0) {
                    ctx.moveTo(x, y);
                    fillPath.lineTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                    fillPath.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            // Finish fill path
            fillPath.lineTo(width, height);
            fillPath.closePath();

            // Semi-transparent area fill
            const areaGrad = ctx.createLinearGradient(0, 0, 0, height);
            areaGrad.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
            areaGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = areaGrad;
            ctx.fill(fillPath);

            // Animate offset
            offset += 0.035;

            requestAnimationFrame(drawWave);
        }

        drawWave();
    }


    /* ========================================================
       6. AI ORION CHATBOT & UTILITIES INTERACTION
       ======================================================== */
    const openAiBtn = document.getElementById('open-ai-btn');
    const closeAiBtn = document.getElementById('close-ai-btn');
    const aiDrawer = document.getElementById('ai-drawer');
    const aiChatBody = document.getElementById('ai-chat-body');
    const aiChatInput = document.getElementById('ai-chat-input');
    const aiChatSend = document.getElementById('ai-chat-send');

    // Toggle Chat Drawer
    openAiBtn?.addEventListener('click', () => {
        aiDrawer.classList.toggle('active');
        if (aiDrawer.classList.contains('active')) {
            aiChatInput?.focus();
        }
    });

    closeAiBtn?.addEventListener('click', () => {
        aiDrawer.classList.remove('active');
    });

    // Helper: Append Chat Message Bubble
    function appendChatMessage(sender, text, source = '') {
        if (!aiChatBody) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-message ${sender}`;
        
        // Simple markdown parsing for bolding and bullets
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
            
        msgDiv.innerHTML = formattedText;
        if (source) {
            msgDiv.innerHTML += `<span class="msg-src">Source: ${source}</span>`;
        }
        
        aiChatBody.appendChild(msgDiv);
        aiChatBody.scrollTop = aiChatBody.scrollHeight;
    }

    // Send chat text to backend
    async function sendChat(text) {
        if (!text.trim()) return;
        appendChatMessage('user', text);
        aiChatInput.value = '';

        try {
            // Get active course name as topic if viewing a course
            const activeCourseTitle = document.getElementById('course-view-title')?.textContent;
            const topic = activeCourseTitle && activeCourseTitle !== 'Course Title' ? activeCourseTitle : 'General Curricula';

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: text, topic })
            });

            const data = await response.json();
            if (response.ok) {
                appendChatMessage('assistant', data.reply, data.source);
            } else {
                appendChatMessage('assistant', `Outpost connection error: ${data.error}`);
            }
        } catch (err) {
            console.error(err);
            appendChatMessage('assistant', 'Error: Transmission failure. Link unstable.');
        }
    }

    aiChatSend?.addEventListener('click', () => sendChat(aiChatInput.value));
    aiChatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChat(aiChatInput.value);
    });

    // Chat Action: Practice Quiz
    document.getElementById('ai-btn-quiz')?.addEventListener('click', async () => {
        const topic = prompt("Enter a curriculum topic to generate quiz questions (e.g., Quantum Computing, Neural Networks):", "Artificial Intelligence");
        if (!topic) return;

        appendChatMessage('user', `Generate a practice quiz about: "${topic}"`);
        appendChatMessage('assistant', `Initiating compiler... Orion is structuring practice questions for ${topic}. Please stand by.`);

        try {
            const response = await fetch('/api/ai/generate-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ topic })
            });

            const data = await response.json();
            if (response.ok && data.questions) {
                let quizText = `**Orion Generated practice quiz for: ${topic}**\n\n`;
                data.questions.forEach((q, idx) => {
                    quizText += `**Q${idx + 1}: ${q.question_text}**\n`;
                    quizText += `* A: ${q.option_a}\n`;
                    quizText += `* B: ${q.option_b}\n`;
                    quizText += `* C: ${q.option_c}\n`;
                    quizText += `* D: ${q.option_d}\n`;
                    quizText += `* **Correct Option:** ${q.correct_option}\n\n`;
                });
                appendChatMessage('assistant', quizText, data.source);
            } else {
                appendChatMessage('assistant', 'Failed to generate questions. Verify parameters.');
            }
        } catch (err) {
            console.error(err);
            appendChatMessage('assistant', 'Registry link timing anomaly.');
        }
    });

    // Chat Action: Performance Insights
    document.getElementById('ai-btn-insights')?.addEventListener('click', async () => {
        appendChatMessage('user', 'Fetch Performance Telemetry Insights.');
        appendChatMessage('assistant', 'Querying academic database metrics... Synapse logs updating.');

        try {
            const response = await fetch('/api/ai/insights', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                appendChatMessage('assistant', data.insights, 'Orion Performance Engine');
            } else {
                appendChatMessage('assistant', 'Insights compilation failed.');
            }
        } catch (err) {
            console.error(err);
            appendChatMessage('assistant', 'Error reading metrics.');
        }
    });

    // Chat Action: Study Plan
    document.getElementById('ai-btn-plan')?.addEventListener('click', async () => {
        const topic = prompt("Enter a subject topic for custom study plan calendars (e.g. FTL Cryptography):", "Deep Space AI");
        if (!topic) return;

        appendChatMessage('user', `Compile a custom study plan for: "${topic}"`);
        appendChatMessage('assistant', `Syncing study calendars... Designing weekly objectives.`);

        try {
            const response = await fetch('/api/ai/generate-study-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ topic, durationWeeks: 4 })
            });

            const data = await response.json();
            if (response.ok) {
                appendChatMessage('assistant', data.studyPlan, data.source);
            } else {
                appendChatMessage('assistant', 'Study plan compilation aborted.');
            }
        } catch (err) {
            console.error(err);
            appendChatMessage('assistant', 'Starmap calendar synchronization failure.');
        }
    });


    /* ========================================================
       7. CURRICULUM CATALOG & COURSE MODULER VIEW (STUDENT)
       ======================================================== */
    const catalogModal = document.getElementById('catalog-modal');
    const closeCatalogBtn = document.getElementById('close-catalog-btn');
    const courseCatalogGrid = document.getElementById('course-catalog-grid');
    const courseViewModal = document.getElementById('course-view-modal');
    const closeCourseViewBtn = document.getElementById('close-course-view-btn');

    // Sidebar Tab link configurations
    const sidebarLinks = document.querySelectorAll('.sidebar-nav-link');
    sidebarLinks.forEach((link, idx) => {
        // We bind the second link (Learning Modules) to open the course catalog!
        if (idx === 1) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                openCatalog();
            });
        }
    });

    // Enlist / New Mission buttons open the catalog as well
    document.querySelector('.sidebar-action-btn')?.addEventListener('click', openCatalog);
    document.querySelector('.resume-btn')?.addEventListener('click', openCatalog);

    function openCatalog() {
        catalogModal?.classList.add('active');
        loadCourseCatalog();
    }

    function closeCatalog() {
        catalogModal?.classList.remove('active');
    }

    closeCatalogBtn?.addEventListener('click', closeCatalog);

    // Fetch and render courses list
    async function loadCourseCatalog() {
        if (!courseCatalogGrid) return;
        courseCatalogGrid.innerHTML = '<div style="color:rgba(255,255,255,0.4); text-align:center; width:100%; padding:40px;">Calibrating curriculum sensors...</div>';

        try {
            // Get all published courses
            const coursesRes = await fetch('/api/courses', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const courses = await coursesRes.json();

            // Get enrolled courses
            const enrolledRes = await fetch('/api/courses/enrolled', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const enrolled = await enrolledRes.json();
            const enrolledIds = enrolled.map(e => e.id);

            if (!coursesRes.ok || !enrolledRes.ok) {
                courseCatalogGrid.innerHTML = '<div style="color:var(--clr-pink); text-align:center; width:100%; padding:40px;">Signal failure pulling courses.</div>';
                return;
            }

            if (courses.length === 0) {
                courseCatalogGrid.innerHTML = '<div style="color:rgba(255,255,255,0.4); text-align:center; width:100%; padding:40px;">No published courses found in Sector registers.</div>';
                return;
            }

            courseCatalogGrid.innerHTML = courses.map(c => {
                const isEnrolled = enrolledIds.includes(c.id);
                const buttonText = isEnrolled ? 'Access Deck' : 'Enlist in Sector';
                const buttonClass = isEnrolled ? 'btn-secondary' : 'btn-primary';
                const actionOnClick = isEnrolled ? `viewEnrolledCourse(${c.id})` : `enrollInCourse(${c.id})`;

                return `
                    <div class="lms-course-card">
                        <div class="lms-course-img" style="background-image: url('${c.image_url || 'images/hero_space_station.png'}')">
                            <span class="lms-course-cat">${c.category}</span>
                        </div>
                        <div class="lms-course-details">
                            <h3 class="lms-course-title">${c.title}</h3>
                            <p class="lms-course-desc">${c.description}</p>
                            <div class="lms-course-footer">
                                <span><i class="fa-solid fa-graduation-cap"></i> ${c.instructor_name || 'Academic Core'}</span>
                                <button class="btn ${buttonClass}" style="padding: 6px 14px; font-size: 0.75rem;" onclick="${actionOnClick}">${buttonText}</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.error(err);
            courseCatalogGrid.innerHTML = '<div style="color:var(--clr-pink); text-align:center; width:100%; padding:40px;">Failed to parse starmap catalog.</div>';
        }
    }

    // Enroll Action
    window.enrollInCourse = async function(courseId) {
        try {
            const response = await fetch(`/api/courses/${courseId}/enroll`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                alert('Course coordinates successfully locked into your nav-mesh!');
                loadCourseCatalog();
                fetchTelemetry();
            } else {
                alert(data.error || 'Enrollment failure.');
            }
        } catch (err) {
            console.error(err);
            alert('Warp coupling enrollment failure.');
        }
    };

    // View Course Deck (Modules list)
    window.viewEnrolledCourse = async function(courseId) {
        closeCatalog();
        courseViewModal?.classList.add('active');

        const titleEl = document.getElementById('course-view-title');
        const descEl = document.getElementById('course-view-desc');
        const outcomesEl = document.getElementById('course-view-outcomes');
        const accordionEl = document.getElementById('modules-accordion');
        const assignList = document.getElementById('course-assignments-list');
        const quizList = document.getElementById('course-quizzes-list');

        if (titleEl) titleEl.textContent = 'Loading Course Deck...';
        if (accordionEl) accordionEl.innerHTML = '';
        if (assignList) assignList.innerHTML = '';
        if (quizList) quizList.innerHTML = '';

        try {
            const response = await fetch(`/api/courses/${courseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (!response.ok) {
                if (titleEl) titleEl.textContent = 'Error Loading Deck';
                return;
            }

            const c = data.course;
            if (titleEl) titleEl.textContent = c.title;
            if (descEl) descEl.textContent = c.description;
            if (outcomesEl) outcomesEl.innerHTML = `<strong>EXPECTED TELEMETRY OUTCOMES:</strong> ${c.learning_outcomes || 'N/A'}`;

            // Populate Modules Accordion
            if (accordionEl) {
                if (data.modules && data.modules.length > 0) {
                    accordionEl.innerHTML = data.modules.map((m, idx) => `
                        <div class="module-accordion-item">
                            <div class="module-accordion-header" onclick="this.nextElementSibling.style.display = (this.nextElementSibling.style.display === 'none' ? 'flex' : 'none')">
                                <span>${m.title}</span>
                                <i class="fa-solid fa-chevron-down"></i>
                            </div>
                            <div class="module-accordion-body" style="display: ${idx === 0 ? 'flex' : 'none'}; flex-direction: column;">
                                <p style="font-size:0.82rem; color:var(--text-secondary); line-height:1.4; margin-bottom:12px;">${m.description || ''}</p>
                                ${m.video_url ? `
                                    <video class="lesson-video-frame" controls>
                                        <source src="${m.video_url}" type="video/mp4">
                                        Your cockpit scanner doesn't support HTML video format.
                                    </video>
                                ` : ''}
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; font-size:0.75rem;">
                                    ${m.pdf_url ? `<a href="#" onclick="alert('Downloading notes PDF from starmap buffer: ${m.pdf_url}')" style="color:var(--clr-cyan); text-decoration:none;"><i class="fa-regular fa-file-pdf"></i> Download PDF Notes</a>` : ''}
                                    ${m.downloadable_resources ? `<a href="#" onclick="alert('Saving asset resource pack: ${m.downloadable_resources}')" style="color:var(--clr-purple); text-decoration:none;"><i class="fa-solid fa-download"></i> Resource: ${m.downloadable_resources}</a>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('');
                } else {
                    accordionEl.innerHTML = '<p style="color:rgba(255,255,255,0.4); font-size:0.85rem; padding:10px 0;">No learning modules uploaded in this sector registry yet.</p>';
                }
            }

            // Populate Assignments
            if (assignList) {
                if (data.assignments && data.assignments.length > 0) {
                    assignList.innerHTML = data.assignments.map(a => {
                        // Check if student has submission in details payload
                        const isSubmitted = data.enrollment ? false : false; // fallback check
                        return `
                            <div class="task-item" style="border-color: rgba(255,255,255,0.05); background: rgba(255,255,255,0.01);">
                                <div class="task-icon"><i class="fa-solid fa-clipboard-list"></i></div>
                                <div class="task-info">
                                    <h4 style="color:#fff; font-size:0.9rem;">${a.title}</h4>
                                    <p style="font-size:0.78rem; color:var(--text-secondary); margin:4px 0;">${a.description}</p>
                                    <span style="font-size:0.7rem; color:var(--clr-pink);"><i class="fa-regular fa-calendar-days"></i> Due: ${new Date(a.deadline).toLocaleString()}</span>
                                </div>
                                <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.75rem;" onclick="submitAssignmentMock(${a.id}, '${a.title.replace(/'/g, "\\'")}')">Submit Log</button>
                            </div>
                        `;
                    }).join('');
                } else {
                    assignList.innerHTML = '<p style="color:rgba(255,255,255,0.4); font-size:0.85rem;">No assignments mapped to this course.</p>';
                }
            }

            // Populate Quizzes
            if (quizList) {
                if (data.quizzes && data.quizzes.length > 0) {
                    quizList.innerHTML = data.quizzes.map(q => `
                        <div class="task-item" style="border-color: rgba(255,255,255,0.05); background: rgba(255,255,255,0.01);">
                            <div class="task-icon" style="color:var(--clr-cyan);"><i class="fa-solid fa-circle-question"></i></div>
                            <div class="task-info">
                                <h4 style="color:#fff; font-size:0.9rem;">${q.title}</h4>
                                <span style="font-size:0.7rem;"><i class="fa-regular fa-clock"></i> Duration Limit: ${q.time_limit} Minutes</span>
                            </div>
                            <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.75rem; background:var(--clr-cyan); color:#000; border-color:transparent; box-shadow:0 0 5px var(--clr-cyan-glow);" onclick="startQuiz(${q.id})">Interface Exam</button>
                        </div>
                    `).join('');
                } else {
                    quizList.innerHTML = '<p style="color:rgba(255,255,255,0.4); font-size:0.85rem;">No examinations scheduled.</p>';
                }
            }

            // Populate Forums / Discussions
            const forumContainer = document.getElementById('forum-posts-container');
            const forumSendBtn = document.getElementById('forum-post-send');
            const forumInput = document.getElementById('forum-post-input');

            if (forumContainer) {
                forumContainer.innerHTML = '<p style="color:rgba(255,255,255,0.4); font-size:0.82rem;">Retrieving board transcripts...</p>';
                try {
                    const fResponse = await fetch(`/api/forum/course/${courseId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const threads = await fResponse.json();
                    if (fResponse.ok) {
                        if (threads.length > 0) {
                            forumContainer.innerHTML = threads.map(t => `
                                <div style="border-bottom:1px solid rgba(255,255,255,0.04); padding-bottom:12px; margin-bottom:12px; width:100%; text-align:left;">
                                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--clr-cyan); font-family:var(--font-heading); margin-bottom:6px;">
                                        <span><strong>${t.author_name}</strong> (${t.author_role.toUpperCase()})</span>
                                        <span>${new Date(t.created_at).toLocaleString()}</span>
                                    </div>
                                    <p style="font-size:0.85rem; color:#fff; line-height:1.4; margin: 4px 0;">${t.content}</p>
                                    ${t.replies.map(r => `
                                        <div style="margin-left: 20px; border-left: 2px solid rgba(255,255,255,0.08); padding-left: 12px; margin-top: 8px;">
                                            <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--clr-purple); font-family:var(--font-heading);">
                                                <span><strong>${r.author_name}</strong> (${r.author_role.toUpperCase()})</span>
                                                <span>${new Date(r.created_at).toLocaleString()}</span>
                                            </div>
                                            <p style="font-size:0.8rem; color:var(--text-secondary); margin:4px 0 0 0;">${r.content}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            `).join('');
                        } else {
                            forumContainer.innerHTML = '<p style="color:rgba(255,255,255,0.4); font-size:0.82rem; text-align:center; padding:10px 0;">Board static. No transmissions active.</p>';
                        }
                    }
                } catch (fErr) {
                    console.error(fErr);
                }
            }

            // Register Post button callback
            if (forumSendBtn && forumInput) {
                // Remove previous listener to avoid double posts
                const newSendBtn = forumSendBtn.cloneNode(true);
                forumSendBtn.parentNode.replaceChild(newSendBtn, forumSendBtn);
                
                newSendBtn.onclick = async () => {
                    const text = forumInput.value.trim();
                    if (!text) return;
                    try {
                        const postRes = await fetch('/api/forum', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ course_id: courseId, content: text })
                        });
                        if (postRes.ok) {
                            forumInput.value = '';
                            // Refresh course deck view
                            viewEnrolledCourse(courseId);
                        } else {
                            alert('Forum transmission failed.');
                        }
                    } catch (err) {
                        console.error(err);
                    }
                };
            }

        } catch (err) {
            console.error(err);
            if (titleEl) titleEl.textContent = 'Error connecting to deck';
        }
    };

    closeCourseViewBtn?.addEventListener('click', () => {
        courseViewModal?.classList.remove('active');
    });

    // Mock Assignment upload interface
    window.submitAssignmentMock = async function(assignmentId, title) {
        const fileContent = prompt(`Submit your cadet report log for: "${title}". Enter content response:`, "Calibration parameters stabilized. Grid latency calculated at 14ms.");
        if (fileContent === null) return;

        try {
            const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: fileContent })
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message || 'Report log transmitted successfully!');
                fetchTelemetry();
            } else {
                alert(data.error || 'Submission anomaly.');
            }
        } catch (err) {
            console.error(err);
            alert('Warp buffer submit failure.');
        }
    };


    /* ========================================================
       8. EXAMINATIONS & AUTO-GRADING SYSTEM
       ======================================================== */
    const quizModal = document.getElementById('quiz-modal');
    const quizForm = document.getElementById('quiz-form');
    const quizQuestionsContainer = document.getElementById('quiz-questions-container');
    const quizTimer = document.getElementById('quiz-timer');
    const quizTitle = document.getElementById('quiz-modal-title');

    let currentQuizId = null;
    let quizInterval = null;
    let quizTimeRemaining = 0; // seconds

    window.startQuiz = async function(quizId) {
        courseViewModal?.classList.remove('active');
        quizModal?.classList.add('active');
        currentQuizId = quizId;

        if (quizQuestionsContainer) quizQuestionsContainer.innerHTML = '<p style="color:rgba(255,255,255,0.4); text-align:center;">Syncing questions matrix...</p>';

        try {
            const response = await fetch(`/api/quizzes/${quizId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (!response.ok) {
                alert('Quiz validation failure.');
                closeQuiz();
                return;
            }

            if (quizTitle) quizTitle.textContent = data.quiz.title;
            
            // Start Quiz Timer
            quizTimeRemaining = data.quiz.time_limit * 60;
            updateTimerDisplay();
            clearInterval(quizInterval);
            quizInterval = setInterval(() => {
                quizTimeRemaining--;
                updateTimerDisplay();
                if (quizTimeRemaining <= 0) {
                    clearInterval(quizInterval);
                    alert('Orbital exam time limit reached! Auto-transmitting current answers.');
                    quizForm?.requestSubmit();
                }
            }, 1000);

            // Render Questions
            if (quizQuestionsContainer) {
                quizQuestionsContainer.innerHTML = data.questions.map((q, idx) => `
                    <div class="quiz-question" data-question-id="${q.id}">
                        <p><strong>Q${idx + 1}:</strong> ${q.question_text}</p>
                        <div class="quiz-options">
                            <label class="quiz-option-label">
                                <input type="radio" name="question_${q.id}" value="A">
                                <span><strong>A.</strong> ${q.option_a}</span>
                            </label>
                            <label class="quiz-option-label">
                                <input type="radio" name="question_${q.id}" value="B">
                                <span><strong>B.</strong> ${q.option_b}</span>
                            </label>
                            <label class="quiz-option-label">
                                <input type="radio" name="question_${q.id}" value="C">
                                <span><strong>C.</strong> ${q.option_c}</span>
                            </label>
                            <label class="quiz-option-label">
                                <input type="radio" name="question_${q.id}" value="D">
                                <span><strong>D.</strong> ${q.option_d}</span>
                            </label>
                        </div>
                    </div>
                `).join('');
            }

        } catch (err) {
            console.error(err);
            alert('Failed to load questions.');
            closeQuiz();
        }
    };

    function updateTimerDisplay() {
        if (!quizTimer) return;
        const mins = Math.floor(quizTimeRemaining / 60);
        const secs = quizTimeRemaining % 60;
        quizTimer.textContent = `Time Remaining: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function closeQuiz() {
        clearInterval(quizInterval);
        quizModal?.classList.remove('active');
        currentQuizId = null;
    }

    // Submit Quiz Answers
    quizForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearInterval(quizInterval);

        const answers = {};
        const questions = quizQuestionsContainer?.querySelectorAll('.quiz-question');
        questions?.forEach(q => {
            const qId = q.getAttribute('data-question-id');
            const selectedOpt = q.querySelector(`input[name="question_${qId}"]:checked`);
            answers[qId] = selectedOpt ? selectedOpt.value : '';
        });

        try {
            const response = await fetch(`/api/quizzes/${currentQuizId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ answers })
            });

            const data = await response.json();
            if (response.ok) {
                alert(`Assessment Grading Verified!\nScore: ${data.result.score}/${data.result.total_questions}\nResult logged successfully.`);
                closeQuiz();
                fetchTelemetry();
            } else {
                alert(data.error || 'Submitting grading parameters failed.');
                closeQuiz();
            }
        } catch (err) {
            console.error(err);
            alert('Exam compile transmission failure.');
            closeQuiz();
        }
    });

    // 9. CERTIFICATES DISPLAY ENGINE
    window.generateStellarCertificate = function(courseTitle) {
        const hash = 'CV-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        const dateStr = new Date().toLocaleDateString();
        
        const certModal = document.createElement('div');
        certModal.className = 'lms-modal active';
        certModal.style.zIndex = '99999';
        certModal.innerHTML = `
            <div class="lms-modal-content" style="max-width: 650px; text-align: center; border: 2px solid #f59e0b; box-shadow: 0 0 30px rgba(245, 158, 11, 0.3);">
                <div class="lms-modal-header" style="border-bottom: none;">
                    <h2>COURSEVERSE GRADUATION DECK</h2>
                    <button class="lms-modal-close" onclick="this.closest('.lms-modal').remove()">&times;</button>
                </div>
                <div class="lms-modal-body" style="padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 20px;">
                    <div style="font-size: 3rem; color: #f59e0b; filter: drop-shadow(0 0 10px rgba(245,158,11,0.5))">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>
                    <span style="font-family: monospace; font-size: 0.8rem; color: var(--clr-cyan); letter-spacing: 2px;">INTERSTELLAR REGISTRY CERTIFICATE</span>
                    <h3 style="font-family: var(--font-heading); color: #fff; font-size: 1.6rem; margin: 10px 0;">\${user.name.toUpperCase()}</h3>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 80%; line-height: 1.6;">
                        has successfully completed the orbital curriculum parameters and demonstrated proficiency in the sector of
                    </p>
                    <h4 style="font-family: var(--font-heading); color: var(--clr-cyan); font-size: 1.25rem; margin: 10px 0;">\${courseTitle.toUpperCase()}</h4>
                    <div style="border-top: 1px solid rgba(255,255,255,0.08); width: 100%; padding-top: 20px; display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">
                        <div>
                            <span>ISSUE DATE</span><br>
                            <strong style="color:#fff">\${dateStr}</strong>
                        </div>
                        <div>
                            <span>VERIFICATION SIGNATURE HASH</span><br>
                            <strong style="color:var(--clr-purple)">\${hash}</strong>
                        </div>
                    </div>
                    <button class="btn btn-primary" style="margin-top: 20px; width: 100%; background: linear-gradient(135deg, #f59e0b, #ec4899); border:none;" onclick="window.print()">Print Digital Cadet License</button>
                </div>
            </div>
        `;
        document.body.appendChild(certModal);
    };

});
