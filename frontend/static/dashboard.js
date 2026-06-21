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
    
    // Header UI nodes
    const headerTitle = document.getElementById('dash-header-title');
    const profileName = document.getElementById('user-profile-name');
    const profileLevel = document.getElementById('user-profile-level');
    const profileAvatar = document.getElementById('user-profile-avatar');

    // Footer UI nodes
    const footerLeftInfo = document.getElementById('footer-left-info');

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


        // Initialize student specific canvas
        initConstellationCanvas();

    } else if (userRole === 'instructor') {
        if (instructorDash) instructorDash.style.display = 'block';
        
        // Dynamic Sidebar Nav for Instructor
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (sidebarNav) {
            sidebarNav.innerHTML = `
                <a href="#" class="sidebar-nav-link active" data-section="main">
                    <i class="fa-solid fa-gauge-high"></i> Command Center
                </a>
                <a href="#" class="sidebar-nav-link" data-section="instructor-courses">
                    <i class="fa-solid fa-folder-open"></i> Manage Courses
                </a>
                <a href="#" class="sidebar-nav-link" data-section="instructor-analytics">
                    <i class="fa-solid fa-users-viewfinder"></i> Student Analytics
                </a>
                <a href="#" class="sidebar-nav-link" data-section="instructor-forum">
                    <i class="fa-solid fa-bullhorn"></i> Announcements
                </a>
            `;
        }
        
        // Populate header details
        if (headerTitle) headerTitle.textContent = "Command Center";
        if (profileName) profileName.textContent = user.name;
        if (profileLevel) profileLevel.textContent = `LEVEL ${user.level} INSTRUCTOR`;
        if (profileAvatar) {
            profileAvatar.style.borderColor = '#ff5c75';
            profileAvatar.innerHTML = `
                <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="#1a0508" stroke="#ff5c75" stroke-width="2"/>
                    <!-- Instructor avatar graphics -->
                    <circle cx="50" cy="38" r="16" fill="none" stroke="#ff5c75" stroke-width="2"/>
                    <line x1="30" y1="72" x2="70" y2="72" stroke="#ff5c75" stroke-width="2"/>
                    <path d="M30,72 Q50,55 70,72" fill="none" stroke="#ff3355" stroke-width="2"/>
                </svg>
            `;
        }

        // Configure footer
        if (footerLeftInfo) {
            footerLeftInfo.innerHTML = `© 2245 COURSEVERSE ACADEMY • GALACTIC STANDARD TIME`;
        }
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
            ctx.strokeStyle = 'rgba(255, 51, 85, 0.15)';
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
            ctx.strokeStyle = 'rgba(255, 92, 117, 0.1)';
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
                let clr = '#ff3355'; // purple
                if (idx % 2 === 0) clr = '#ff5c75'; // cyan
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

    // ─── TOAST NOTIFICATION UTILITY ──────────────────────────────────────────
    window.showToast = function(message, type = 'info') {
        const toast = document.getElementById('glass-toast');
        if (!toast) return;
        toast.className = `glass-toast ${type}`;
        toast.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'circle-check' : type === 'error' ? 'circle-xmark' : 'circle-info'}"></i> ${message}`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    };

    // ─── SLIDE PANEL CLOSE UTILITY ───────────────────────────────────────────
    window.closeSlidePanels = function() {
        document.getElementById('notifications-panel').style.right = '-420px';
        document.getElementById('settings-panel').style.right = '-420px';
        document.getElementById('panel-backdrop').style.display = 'none';
    };

    function openSlidePanel(panelId) {
        closeSlidePanels();
        document.getElementById(panelId).style.right = '0';
        document.getElementById('panel-backdrop').style.display = 'block';
    }

    // ─── SIDEBAR NAVIGATION (full wiring) ────────────────────────────────────
    const allDashPanels = [
        studentDash, 
        instructorDash,
        document.getElementById('courses-panel'),
        document.getElementById('progress-panel'),
        document.getElementById('assignments-panel'),
        document.getElementById('quizzes-panel'),
        document.getElementById('certificates-panel'),
        document.getElementById('notifications-sec-panel'),
        document.getElementById('instructor-courses-panel'),
        document.getElementById('instructor-analytics-panel'),
        document.getElementById('instructor-forum-panel')
    ];

    function showDashPanel(panelEl) {
        allDashPanels.forEach(p => p && (p.style.display = 'none'));
        if (panelEl) panelEl.style.display = 'block';
    }

    function restoreMainDash() {
        allDashPanels.forEach(p => p && (p.style.display = 'none'));
        if (userRole === 'student' && studentDash) studentDash.style.display = 'block';
        if (userRole === 'instructor' && instructorDash) instructorDash.style.display = 'block';
    }

    // Set up navigation listeners (using delegation to handle dynamic sidebar change on load)
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.sidebar-nav-link');
        if (!link) return;
        
        e.preventDefault();
        
        const allLinks = document.querySelectorAll('.sidebar-nav-link');
        allLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const section = link.dataset.section;
        if (section === 'main') {
            restoreMainDash();
        } else if (section === 'courses') {
            showDashPanel(document.getElementById('courses-panel'));
            renderCoursesPanel();
        } else if (section === 'progress') {
            showDashPanel(document.getElementById('progress-panel'));
            renderProgressPanel();
        } else if (section === 'assignments') {
            showDashPanel(document.getElementById('assignments-panel'));
            renderAssignmentsPanel();
        } else if (section === 'quizzes') {
            showDashPanel(document.getElementById('quizzes-panel'));
            renderQuizzesPanel();
        } else if (section === 'certificates') {
            showDashPanel(document.getElementById('certificates-panel'));
            renderCertificatesPanel();
        } else if (section === 'notifications-sec') {
            showDashPanel(document.getElementById('notifications-sec-panel'));
            renderNotificationsSecPanel();
        } else if (section === 'instructor-courses') {
            showDashPanel(document.getElementById('instructor-courses-panel'));
            renderInstructorCoursesPanel();
        } else if (section === 'instructor-analytics') {
            showDashPanel(document.getElementById('instructor-analytics-panel'));
            renderInstructorAnalyticsPanel();
        } else if (section === 'instructor-forum') {
            showDashPanel(document.getElementById('instructor-forum-panel'));
            renderInstructorForumPanel();
        }
    });

    // ─── BELL: Notifications ──────────────────────────────────────────────────
    document.getElementById('bell-btn')?.addEventListener('click', () => {
        openSlidePanel('notifications-panel');
        loadNotifications();
    });
    document.getElementById('close-notif-panel')?.addEventListener('click', closeSlidePanels);

    document.getElementById('mark-all-read-btn')?.addEventListener('click', async () => {
        // Mark all as read via API (best-effort)
        try {
            await fetch('/api/notifications/read-all', { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
        } catch(e) {}
        loadNotifications();
        showToast('All transmissions marked as read.', 'success');
    });

    async function loadNotifications() {
        const list = document.getElementById('notifications-list');
        if (!list) return;
        list.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:40px;"><i class="fa-solid fa-satellite-dish" style="font-size:2rem; display:block; margin-bottom:12px;"></i>Scanning signal bands...</div>';
        try {
            const res = await fetch('/api/notifications', { headers: { 'Authorization': `Bearer ${token}` } });
            const notifs = await res.json();
            if (!res.ok || notifs.length === 0) {
                list.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:40px;"><i class="fa-solid fa-inbox" style="font-size:2rem; display:block; margin-bottom:12px;"></i>No transmissions received.</div>';
                return;
            }
            list.innerHTML = notifs.map(n => `
                <div style="background:${n.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(255, 51, 85,0.08)'}; border:1px solid ${n.is_read ? 'rgba(255,255,255,0.06)' : 'rgba(255, 51, 85,0.2)'}; border-radius:10px; padding:14px 16px;">
                    <p style="font-size:0.88rem; color:${n.is_read ? 'var(--text-secondary)' : '#fff'}; line-height:1.5; margin-bottom:6px;">${n.message}</p>
                    <span style="font-size:0.72rem; color:var(--text-muted);"><i class="fa-regular fa-clock"></i> ${new Date(n.created_at).toLocaleString()}</span>
                </div>
            `).join('');
        } catch(e) {
            list.innerHTML = '<div style="color:var(--clr-pink); text-align:center; padding:20px;">Signal failure.</div>';
        }
    }

    // ─── SETTINGS GEAR ───────────────────────────────────────────────────────
    document.getElementById('settings-btn')?.addEventListener('click', () => openSlidePanel('settings-panel'));
    document.getElementById('close-settings-panel')?.addEventListener('click', closeSlidePanels);
    document.getElementById('settings-theme-btn')?.addEventListener('click', () => {
        document.getElementById('theme-toggle-btn')?.click();
    });

    // ─── SUPPORT LINK ─────────────────────────────────────────────────────────
    document.getElementById('support-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('support-modal')?.classList.add('active');
    });
    document.getElementById('close-support-modal')?.addEventListener('click', () => {
        document.getElementById('support-modal')?.classList.remove('active');
    });


    document.getElementById('close-profile-card')?.addEventListener('click', () => {
        document.getElementById('profile-card-popover').style.display = 'none';
        document.getElementById('profile-card-popover').classList.remove('active');
    });

    // ─── SEARCH (debounced) ──────────────────────────────────────────────────
    const searchInput = document.getElementById('dash-search-input');
    const searchDropdown = document.getElementById('search-dropdown');
    let searchTimer;
    searchInput?.addEventListener('input', () => {
        clearTimeout(searchTimer);
        const q = searchInput.value.trim();
        if (q.length < 2) { searchDropdown.style.display = 'none'; return; }
        searchTimer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.courses.length === 0) {
                    searchDropdown.innerHTML = '<div style="padding:14px 16px; color:var(--text-muted); font-size:0.85rem;">No courses found in sector.</div>';
                } else {
                    searchDropdown.innerHTML = data.courses.map(c => `
                        <div onclick="searchDropdown.style.display=\'none\'; viewEnrolledCourse(${c.id}); openCatalog();" style="padding:12px 16px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.06); transition:background 0.2s;" onmouseover="this.style.background='rgba(255, 51, 85,0.1)'" onmouseout="this.style.background='transparent'">
                            <div style="font-family:var(--font-heading); font-size:0.88rem; color:#fff; margin-bottom:2px;">${c.title}</div>
                            <div style="font-size:0.75rem; color:var(--clr-cyan);">${c.category}</div>
                        </div>
                    `).join('');
                }
                searchDropdown.style.display = 'block';
            } catch(e) {
                searchDropdown.style.display = 'none';
            }
        }, 300);
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) searchDropdown.style.display = 'none';
    });

    // ─── PROFILE CARD POPOVER (Task 4) ───────────────────────────────────────
    document.getElementById('profile-widget')?.addEventListener('click', async () => {
        const popover = document.getElementById('profile-card-popover');
        if (!popover) return;
        try {
            const res = await fetch('/api/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } });
            const profile = await res.json();
            if (!res.ok) return;
            document.getElementById('pc-name').textContent = profile.name;
            document.getElementById('pc-role').textContent = profile.role.toUpperCase();
            document.getElementById('pc-level').textContent = profile.level;
            document.getElementById('pc-xp').textContent = profile.xp;
            document.getElementById('pc-email').textContent = profile.email;
            document.getElementById('pc-edit-name').value = profile.name;
            const avatarEl = document.getElementById('pc-avatar');
            if (profile.avatar_svg) avatarEl.innerHTML = profile.avatar_svg;
        } catch(e) {
            // Still show popover with cached data
        }
        popover.style.display = 'flex';
        popover.classList.add('active');
    });

    document.getElementById('profile-edit-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = document.getElementById('pc-edit-name').value.trim();
        if (!newName) return;
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: newName })
            });
            const data = await res.json();
            if (res.ok) {
                // Update localStorage
                const updatedUser = { ...user, name: data.user.name };
                localStorage.setItem('courseverse_user', JSON.stringify(updatedUser));
                // Update header display
                document.getElementById('user-profile-name').textContent = data.user.name;
                document.getElementById('pc-name').textContent = data.user.name;
                showToast(`Callsign updated to: ${data.user.name}`, 'success');
            } else {
                showToast(data.error || 'Update failed.', 'error');
            }
        } catch(e) {
            showToast('Update transmission failure.', 'error');
        }
    });

    // ─── STAR MAPS PANEL: Enrolled courses as visual cards ───────────────────
    async function loadStarMaps() {
        const grid = document.getElementById('star-maps-grid');
        if (!grid || userRole !== 'student') return;
        grid.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:60px; grid-column:1/-1;"><i class="fa-solid fa-satellite-dish" style="font-size:2rem; margin-bottom:16px; display:block;"></i>Calibrating orbital trajectory maps...</div>';
        try {
            const res = await fetch('/api/courses/enrolled', { headers: { 'Authorization': `Bearer ${token}` } });
            const courses = await res.json();
            if (!res.ok || courses.length === 0) {
                grid.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:60px; grid-column:1/-1;"><i class="fa-solid fa-moon" style="font-size:2rem; margin-bottom:16px; display:block;"></i>No active learning trajectories. Enlist in courses to populate your star map.</div>';
                return;
            }
            grid.innerHTML = courses.map(c => {
                const pct = c.progress || 0;
                const circumference = 2 * Math.PI * 38;
                const offset = circumference * (1 - pct / 100);
                return `
                <div class="dash-card" style="padding:24px; cursor:pointer;" onclick="viewEnrolledCourse(${c.id})">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                        <div>
                            <span style="font-size:0.72rem; color:var(--clr-cyan); font-family:var(--font-heading); letter-spacing:1px;">${c.category}</span>
                            <h3 style="font-family:var(--font-heading); font-size:1rem; margin-top:4px; color:#fff;">${c.title}</h3>
                        </div>
                        <svg width="70" height="70" style="flex-shrink:0;">
                            <circle cx="35" cy="35" r="28" stroke="rgba(255,255,255,0.06)" stroke-width="6" fill="transparent"/>
                            <circle cx="35" cy="35" r="28" stroke="#ff3355" stroke-width="6" fill="transparent"
                                stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
                                stroke-linecap="round" transform="rotate(-90 35 35)"/>
                            <text x="35" y="40" text-anchor="middle" fill="#fff" font-size="12" font-family="Space Grotesk" font-weight="600">${pct}%</text>
                        </svg>
                    </div>
                    <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:16px;"><i class="fa-solid fa-user-astronaut"></i> ${c.instructor_name || 'Academic Core'}</div>
                    <div style="background:rgba(255,255,255,0.06); border-radius:4px; height:4px; overflow:hidden;">
                        <div style="height:100%; width:${pct}%; background:linear-gradient(90deg,var(--clr-purple),var(--clr-cyan)); border-radius:4px;"></div>
                    </div>
                </div>`;
            }).join('');
        } catch(e) {
            grid.innerHTML = '<div style="color:var(--clr-pink); text-align:center; padding:40px; grid-column:1/-1;">Signal failure retrieving trajectories.</div>';
        }
    }

    // ─── ARCHIVES PANEL: Completed courses ───────────────────────────────────
    async function loadArchives() {
        const grid = document.getElementById('archives-grid');
        if (!grid || userRole !== 'student') return;
        grid.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:60px; grid-column:1/-1;"><i class="fa-solid fa-satellite" style="font-size:2rem; margin-bottom:16px; display:block;"></i>Scanning academy records...</div>';
        try {
            const res = await fetch('/api/courses/completed', { headers: { 'Authorization': `Bearer ${token}` } });
            const courses = await res.json();
            if (!res.ok || courses.length === 0) {
                grid.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:60px; grid-column:1/-1;"><i class="fa-solid fa-box-open" style="font-size:2rem; margin-bottom:16px; display:block;"></i>No completed courses yet. Keep learning to fill your archives!</div>';
                return;
            }
            grid.innerHTML = courses.map(c => `
                <div class="dash-card" style="padding:24px;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                        <div style="width:44px; height:44px; border-radius:50%; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); display:flex; align-items:center; justify-content:center; color:#10b981; font-size:1.2rem;"><i class="fa-solid fa-circle-check"></i></div>
                        <div>
                            <h3 style="font-family:var(--font-heading); font-size:0.95rem; color:#fff; margin-bottom:2px;">${c.title}</h3>
                            <span style="font-size:0.72rem; color:var(--clr-cyan);">${c.category}</span>
                        </div>
                    </div>
                    <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:16px;"><i class="fa-solid fa-user-astronaut"></i> ${c.instructor_name || 'Academic Core'}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.72rem; color:#10b981; font-family:var(--font-heading);">✓ COMPLETED</span>
                        <button class="btn btn-secondary" style="padding:5px 14px; font-size:0.75rem;" onclick="generateStellarCertificate('${c.title.replace(/'/g, "\\'")}')"><i class="fa-solid fa-certificate"></i> Certificate</button>
                    </div>
                </div>`).join('');
        } catch(e) {
            grid.innerHTML = '<div style="color:var(--clr-pink); text-align:center; padding:40px; grid-column:1/-1;">Signal failure retrieving archives.</div>';
        }
    }

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
                showToast('Course coordinates locked into your nav-mesh!', 'success');
                loadCourseCatalog();
                fetchTelemetry();
            } else {
                showToast(data.error || 'Enrollment failure.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Warp coupling enrollment failure.', 'error');
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

    // ─── Phase 1: SPA Panel Rendering Engines ──────────────────────────────────
    
    // 1. Courses Panel Engine
    window.renderCoursesPanel = async function(subTab = 'all') {
        const grid = document.getElementById('courses-grid');
        if (!grid) return;

        // Setup sub-tabs event listeners once
        const tabs = document.querySelectorAll('#courses-panel .sub-tab');
        tabs.forEach(tab => {
            // Re-bind to prevent multiple handlers
            tab.onclick = (e) => {
                tabs.forEach(t => {
                    t.classList.remove('active');
                    t.style.color = 'var(--text-secondary)';
                    t.style.fontWeight = 'normal';
                });
                tab.classList.add('active');
                tab.style.color = '#fff';
                tab.style.fontWeight = '600';
                renderCoursesPanel(tab.dataset.tab);
            };
        });

        grid.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:60px; grid-column:1/-1;"><i class="fa-solid fa-satellite-dish" style="font-size:2rem; margin-bottom:16px; display:block;"></i>Scanning sector registry...</div>';

        try {
            // Get enrolled courses
            const enrolledRes = await fetch('/api/courses/enrolled', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const enrolled = enrolledRes.ok ? await enrolledRes.json() : [];
            const enrolledIds = enrolled.map(e => e.id);

            let courses = [];
            if (subTab === 'all') {
                const coursesRes = await fetch('/api/courses', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                courses = coursesRes.ok ? await coursesRes.json() : [];
            } else {
                courses = enrolled;
            }

            if (courses.length === 0) {
                grid.innerHTML = `<div style="color:rgba(255,255,255,0.3); text-align:center; padding:60px; grid-column:1/-1;"><i class="fa-solid fa-moon" style="font-size:2rem; margin-bottom:16px; display:block;"></i>No courses found in this quadrant.</div>`;
                return;
            }

            grid.innerHTML = courses.map(c => {
                const isEnrolled = enrolledIds.includes(c.id);
                const buttonText = isEnrolled ? 'Enrolled' : 'Enroll';
                const buttonDisabled = isEnrolled ? 'disabled style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.3); cursor:not-allowed;"' : `onclick="enrollInCoursesTab(${c.id})"`;
                const actionButton = `<button class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.75rem;" ${buttonDisabled}>${buttonText}</button>`;
                const continueButton = isEnrolled ? `<button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.75rem; background:linear-gradient(135deg, var(--clr-purple), var(--clr-cyan)); border:none;" onclick="viewEnrolledCourse(${c.id})">Continue Learning</button>` : '';

                return `
                    <div class="lms-course-card" style="background:var(--glass-bg-card); border:1px solid var(--glass-border); border-radius:16px; overflow:hidden; display:flex; flex-direction:column; transition: transform 0.3s, box-shadow 0.3s; padding: 0;">
                        <div class="lms-course-img" style="background-image: url('${c.image_url || 'images/hero_space_station.png'}'); height:150px; background-size:cover; background-position:center; position:relative; padding:16px; display:flex; align-items:flex-end;">
                            <span class="lms-course-cat" style="background:rgba(255, 51, 85, 0.85); color:#fff; padding:4px 10px; border-radius:20px; font-size:0.7rem; font-family:var(--font-heading); font-weight:600; letter-spacing:1px; backdrop-filter:blur(4px);">${c.category.toUpperCase()}</span>
                        </div>
                        <div class="lms-course-details" style="padding:20px; display:flex; flex-direction:column; flex-grow:1; justify-content:space-between; gap:16px;">
                            <div>
                                <h3 class="lms-course-title" style="font-family:var(--font-heading); font-size:1.05rem; color:#fff; margin-bottom:8px; line-height:1.3;">${c.title}</h3>
                                <p class="lms-course-desc" style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4;">${c.description}</p>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:14px; font-size:0.75rem; color:var(--text-muted);">
                                <span><i class="fa-solid fa-graduation-cap"></i> ${c.instructor_name || 'Academic Core'}</span>
                                <div style="display:flex; gap:8px;">
                                    ${actionButton}
                                    ${continueButton}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.error(err);
            grid.innerHTML = '<div style="color:var(--clr-pink); text-align:center; padding:40px; grid-column:1/-1;">Telemetry routing linkage failure.</div>';
        }
    };

    window.enrollInCoursesTab = async function(courseId) {
        try {
            const response = await fetch(`/api/courses/${courseId}/enroll`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                showToast('Coordinates locked. Enrolled in course!', 'success');
                renderCoursesPanel();
                fetchTelemetry();
            } else {
                showToast(data.error || 'Enrollment failure.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Enrollment transmission failure.', 'error');
        }
    };

    // 2. Learning Progress Panel Engine
    window.renderProgressPanel = async function() {
        const container = document.getElementById('progress-container');
        if (!container) return;
        container.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:60px;"><i class="fa-solid fa-satellite-dish" style="font-size:2rem; margin-bottom:16px; display:block;"></i>Retrieving progress matrix...</div>';

        try {
            const res = await fetch('/api/analytics/student-progress', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = res.ok ? await res.json() : null;

            if (!res.ok || !data) {
                container.innerHTML = '<div style="color:var(--clr-pink); text-align:center; padding:20px;">Could not retrieve progress telemetry at this time.</div>';
                return;
            }

            let coursesHtml = '';
            if (data.courses && data.courses.length > 0) {
                coursesHtml = data.courses.map(c => {
                    const pct = c.progress || 0;
                    return `
                        <div class="dash-card" style="padding:24px; display:flex; flex-direction:column; gap:16px; background:var(--glass-bg-card); border:1px solid var(--glass-border); border-radius:16px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <span style="font-size:0.7rem; color:var(--clr-cyan); letter-spacing:1px; font-family:var(--font-heading); font-weight:600;">${c.category.toUpperCase()}</span>
                                    <h3 style="font-family:var(--font-heading); font-size:1.1rem; color:#fff; margin-top:4px;">${c.title}</h3>
                                </div>
                                <span style="font-family:var(--font-heading); font-size:1.2rem; color:var(--clr-purple); font-weight:bold;">${pct}%</span>
                            </div>
                            
                            <div style="background:rgba(255,255,255,0.06); border-radius:10px; height:12px; overflow:hidden; position:relative; border:1px solid rgba(255,255,255,0.04);">
                                <div style="height:100%; width:${pct}%; background:linear-gradient(90deg, var(--clr-purple), var(--clr-cyan)); border-radius:10px; transition: width 0.8s ease-out;"></div>
                            </div>

                            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-secondary);">
                                <span>Modules: ${c.completed_modules}/${c.total_modules} Completed</span>
                                <span>Assignments: ${c.submitted_assignments}/${c.total_assignments} Submitted</span>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                coursesHtml = '<p style="color:rgba(255,255,255,0.4); text-align:center; padding:20px;">You are not enrolled in any course telemetry tracks yet.</p>';
            }

            container.innerHTML = `
                <!-- Overview Header Card -->
                <div class="dash-card" style="padding:32px; background:linear-gradient(135deg, rgba(255, 51, 85, 0.1), rgba(255, 92, 117, 0.05)); border:1px solid rgba(255, 51, 85, 0.25); border-radius:20px; display:flex; flex-wrap:wrap; justify-content:space-around; align-items:center; gap:24px; box-shadow: 0 8px 32px 0 rgba(255, 51, 85, 0.1);">
                    <div style="text-align:center;">
                        <span style="font-size:0.75rem; color:var(--text-muted); letter-spacing:1.5px; font-family:var(--font-heading);">OVERALL COMPLETION</span>
                        <h3 style="font-size:2.2rem; font-family:var(--font-heading); color:#fff; margin-top:8px;">${data.overall_completion || 0}%</h3>
                    </div>
                    <div style="text-align:center; border-left:1px solid rgba(255,255,255,0.1); padding-left:24px;">
                        <span style="font-size:0.75rem; color:var(--text-muted); letter-spacing:1.5px; font-family:var(--font-heading);">ASSIGNMENTS GRADED</span>
                        <h3 style="font-size:2.2rem; font-family:var(--font-heading); color:var(--clr-cyan); margin-top:8px;">${data.graded_assignments || 0}/${data.total_submissions || 0}</h3>
                    </div>
                    <div style="text-align:center; border-left:1px solid rgba(255,255,255,0.1); padding-left:24px;">
                        <span style="font-size:0.75rem; color:var(--text-muted); letter-spacing:1.5px; font-family:var(--font-heading);">QUIZZES PASSED</span>
                        <h3 style="font-size:2.2rem; font-family:var(--font-heading); color:var(--clr-purple); margin-top:8px;">${data.passed_quizzes || 0}/${data.total_quizzes_taken || 0}</h3>
                    </div>
                </div>

                <h3 style="font-family:var(--font-heading); color:#fff; font-size:1.15rem; margin-top:10px;">Sector Breakdown</h3>
                ${coursesHtml}
            `;
        } catch(e) {
            console.error(e);
            container.innerHTML = '<div style="color:var(--clr-pink); text-align:center; padding:20px;">Failed to compile progress telemetry logs.</div>';
        }
    };

    // 3. Assignments Panel Engine
    window.renderAssignmentsPanel = async function() {
        const container = document.getElementById('assignments-container');
        if (!container) return;
        container.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:60px;"><i class="fa-solid fa-satellite-dish" style="font-size:2rem; margin-bottom:16px; display:block;"></i>Scanning assignment registries...</div>';

        try {
            const res = await fetch('/api/assignments/student', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const assignments = res.ok ? await res.json() : [];

            if (assignments.length === 0) {
                container.innerHTML = '<div style="color:rgba(255,255,255,0.4); text-align:center; padding:40px;"><i class="fa-solid fa-circle-check" style="font-size:2rem; display:block; margin-bottom:12px; color:var(--clr-cyan);"></i>All assignment missions clear! No outstanding tasks.</div>';
                return;
            }

            container.innerHTML = assignments.map(a => {
                const deadlineDate = new Date(a.deadline);
                const isOverdue = deadlineDate < new Date() && !a.submission_id;
                
                let badgeColor = 'rgba(245, 158, 11, 0.2)'; // yellow (pending)
                let badgeText = 'PENDING';
                let badgeTextColor = '#f59e0b';
                
                if (a.submission_id) {
                    if (a.grade !== null) {
                        badgeColor = 'rgba(16, 185, 129, 0.2)'; // green
                        badgeText = `GRADED: ${a.grade}/100`;
                        badgeTextColor = '#10b981';
                    } else {
                        badgeColor = 'rgba(255, 92, 117, 0.2)'; // cyan
                        badgeText = 'SUBMITTED';
                        badgeTextColor = '#ff5c75';
                    }
                } else if (isOverdue) {
                    badgeColor = 'rgba(255, 92, 117, 0.2)'; // pink
                    badgeText = 'OVERDUE';
                    badgeTextColor = '#ec4899';
                }

                const actionButtonHtml = a.submission_id ? 
                    `<button class="btn btn-secondary" style="padding:6px 16px; font-size:0.75rem; cursor:not-allowed; background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.3); border-color:transparent;" disabled>Submissions Locked</button>` :
                    `<button class="btn btn-primary" style="padding:6px 16px; font-size:0.75rem; background:linear-gradient(135deg, var(--clr-purple), var(--clr-cyan)); border:none;" onclick="openAssignmentUploadModal(${a.id}, '${a.title.replace(/'/g, "\\'")}')">Submit Report</button>`;

                return `
                    <div class="dash-card" style="padding:24px; display:flex; flex-direction:column; gap:16px; background:var(--glass-bg-card); border:1px solid var(--glass-border); border-radius:16px; position:relative;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
                            <div>
                                <span style="font-size:0.7rem; color:var(--clr-cyan); font-family:var(--font-heading); font-weight:600;">${a.course_title.toUpperCase()}</span>
                                <h3 style="font-family:var(--font-heading); font-size:1.15rem; color:#fff; margin-top:4px;">${a.title}</h3>
                            </div>
                            <span style="font-size:0.7rem; font-family:var(--font-heading); font-weight:600; padding:4px 10px; border-radius:20px; background:${badgeColor}; color:${badgeTextColor}; border:1px solid ${badgeTextColor}44;">${badgeText}</span>
                        </div>
                        
                        <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5;">${a.description}</p>
                        
                        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:16px; flex-wrap:wrap; gap:12px;">
                            <span style="font-size:0.75rem; color:var(--clr-pink);"><i class="fa-regular fa-calendar-days"></i> Due: ${deadlineDate.toLocaleString()}</span>
                            ${actionButtonHtml}
                        </div>
                    </div>
                `;
            }).join('');
        } catch(e) {
            console.error(e);
            container.innerHTML = '<div style="color:var(--clr-pink); text-align:center; padding:20px;">Could not retrieve assignments. Connection issue.</div>';
        }
    };

    // Helper: Open dynamic upload file modal
    window.openAssignmentUploadModal = function(assignmentId, title) {
        const modal = document.createElement('div');
        modal.className = 'lms-modal active';
        modal.id = 'dynamic-upload-modal';
        modal.style.zIndex = '99999';
        modal.innerHTML = `
            <div class="lms-modal-content" style="max-width:500px;">
                <div class="lms-modal-header">
                    <h2>Submit Assignment Notes</h2>
                    <button class="lms-modal-close" onclick="this.closest('.lms-modal').remove()">&times;</button>
                </div>
                <div class="lms-modal-body" style="padding:24px; display:flex; flex-direction:column; gap:20px;">
                    <p style="font-size:0.85rem; color:var(--text-secondary);">Submit PDF report logs for <strong>${title}</strong>. Maximum size: 10MB.</p>
                    
                    <form id="assignment-pdf-upload-form" style="display:flex; flex-direction:column; gap:16px;">
                        <div style="border:2px dashed rgba(255, 51, 85, 0.4); border-radius:12px; padding:30px; text-align:center; background:rgba(255, 51, 85, 0.02); cursor:pointer;" onclick="document.getElementById('pdf-file-input').click()">
                            <i class="fa-solid fa-cloud-arrow-up" style="font-size:2.5rem; color:var(--clr-cyan); margin-bottom:12px;"></i>
                            <p style="font-size:0.88rem; font-family:var(--font-heading); color:#fff;">Drag & drop your PDF file or click to browse</p>
                            <span id="file-name-label" style="font-size:0.75rem; color:var(--text-muted); display:block; margin-top:8px;">Only PDF documents allowed</span>
                            <input type="file" id="pdf-file-input" accept="application/pdf" style="display:none;" onchange="document.getElementById('file-name-label').textContent = this.files[0] ? this.files[0].name : 'Only PDF documents allowed'; document.getElementById('file-name-label').style.color = '#fff'">
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="width:100%;"><i class="fa-solid fa-paper-plane"></i> Transmit to Registry</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const form = document.getElementById('assignment-pdf-upload-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('pdf-file-input');
            if (!fileInput.files || fileInput.files.length === 0) {
                alert('Please select a PDF file first.');
                return;
            }

            const file = fileInput.files[0];
            if (file.type !== 'application/pdf') {
                alert('Only PDF files are supported.');
                return;
            }

            const formData = new FormData();
            formData.append('submissionFile', file);

            try {
                const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const data = await response.json();
                if (response.ok) {
                    showToast('PDF report logged and transmitted!', 'success');
                    modal.remove();
                    renderAssignmentsPanel();
                    fetchTelemetry();
                } else {
                    alert(data.error || 'Submission anomaly occurred.');
                }
            } catch(err) {
                console.error(err);
                alert('Warp upload linkage failure.');
            }
        };
    };

    // 4. Quiz Results Panel Engine
    window.renderQuizzesPanel = async function() {
        const tbody = document.getElementById('quiz-results-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:rgba(255,255,255,0.4);"><i class="fa-solid fa-satellite-dish" style="font-size:1.5rem; display:block; margin-bottom:8px;"></i>Querying assessment logs...</td></tr>';

        try {
            const res = await fetch('/api/quizzes/student/results', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const results = res.ok ? await res.json() : [];

            if (results.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:rgba(255,255,255,0.4);">No quiz results recorded. Participate in quizzes inside Course Decks!</td></tr>';
                return;
            }

            tbody.innerHTML = results.map(r => {
                const pct = Math.round((r.score / r.total_questions) * 100);
                const passed = pct >= 60;
                const statusBadge = passed ? 
                    `<span style="color:#10b981; background:rgba(16,185,129,0.15); padding:2px 8px; border-radius:10px; font-size:0.72rem; font-weight:600; border:1px solid rgba(16,185,129,0.3);">PASSED</span>` :
                    `<span style="color:#ec4899; background:rgba(255, 92, 117,0.15); padding:2px 8px; border-radius:10px; font-size:0.72rem; font-weight:600; border:1px solid rgba(255, 92, 117,0.3);">FAILED</span>`;

                return `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.85rem;">
                        <td style="padding:16px; color:#fff; font-weight:600;">${r.quiz_title}</td>
                        <td style="padding:16px; color:var(--text-secondary);">${r.course_title}</td>
                        <td style="padding:16px; color:var(--clr-cyan); font-weight:600;">${r.score}/${r.total_questions} (${pct}%)</td>
                        <td style="padding:16px; color:var(--text-muted);">${new Date(r.created_at).toLocaleDateString()}</td>
                        <td style="padding:16px;">${statusBadge}</td>
                    </tr>
                `;
            }).join('');
        } catch(e) {
            console.error(e);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--clr-pink);">Failed to load quiz results logs.</td></tr>';
        }
    };

    // 5. Certificates Panel Engine
    window.renderCertificatesPanel = async function() {
        const grid = document.getElementById('certificates-grid');
        if (!grid) return;
        grid.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:60px; grid-column:1/-1;"><i class="fa-solid fa-satellite" style="font-size:2rem; margin-bottom:16px; display:block;"></i>Scanning graduation records...</div>';

        try {
            const res = await fetch('/api/certificates/student', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const certs = res.ok ? await res.json() : [];

            if (certs.length === 0) {
                grid.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:60px; grid-column:1/-1;"><i class="fa-solid fa-box-open" style="font-size:2rem; margin-bottom:16px; display:block;"></i>No certificates issued yet. Complete a course to 100% progress parameters!</div>';
                return;
            }

            grid.innerHTML = certs.map(c => `
                <div class="dash-card" style="padding:24px; background:var(--glass-bg-card); border:1px solid rgba(245, 158, 11, 0.35); border-radius:16px; display:flex; flex-direction:column; gap:16px; box-shadow: 0 0 15px rgba(245, 158, 11, 0.05);">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:44px; height:44px; border-radius:50%; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); display:flex; align-items:center; justify-content:center; color:#f59e0b; font-size:1.2rem;"><i class="fa-solid fa-certificate"></i></div>
                        <div>
                            <h3 style="font-family:var(--font-heading); font-size:0.95rem; color:#fff; margin-bottom:2px;">${c.course_title}</h3>
                            <span style="font-size:0.72rem; color:var(--clr-cyan); font-family:monospace;">VERIFY CODE: ${c.certificate_code}</span>
                        </div>
                    </div>
                    
                    <div style="font-size:0.75rem; color:var(--text-secondary);">
                        <i class="fa-regular fa-clock"></i> Issued on: ${new Date(c.issued_at).toLocaleDateString()}
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:14px; margin-top:4px;">
                        <a href="/api/certificates/${c.id}/download?token=${token}" target="_blank" class="btn btn-primary" style="padding:5px 14px; font-size:0.75rem; text-decoration:none; background:linear-gradient(135deg, #f59e0b, #ec4899); border:none; color:#fff; font-weight:600;"><i class="fa-solid fa-download"></i> PDF License</a>
                        <button class="btn btn-secondary" style="padding:5px 14px; font-size:0.75rem;" onclick="navigator.clipboard.writeText(window.location.origin + '/api/certificates/verify/' + '${c.certificate_code}'); showToast('Verification link copied to navigation clipboard!', 'success');"><i class="fa-solid fa-share-nodes"></i> Share Hash</button>
                    </div>
                </div>
            `).join('');
        } catch(e) {
            console.error(e);
            grid.innerHTML = '<div style="color:var(--clr-pink); text-align:center; padding:40px; grid-column:1/-1;">Telemetry certificate linkage breakdown.</div>';
        }
    };

    // 6. Notifications Section Panel Engine
    window.renderNotificationsSecPanel = async function() {
        const list = document.getElementById('notifications-sec-list');
        if (!list) return;
        list.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:40px;"><i class="fa-solid fa-satellite-dish" style="font-size:2rem; display:block; margin-bottom:12px;"></i>Scanning telemetry bands...</div>';

        try {
            const res = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const notifs = res.ok ? await res.json() : [];

            if (notifs.length === 0) {
                list.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:40px;"><i class="fa-solid fa-inbox" style="font-size:2rem; display:block; margin-bottom:12px;"></i>No transmissions recorded.</div>';
                return;
            }

            list.innerHTML = `
                <div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
                    <button class="btn btn-secondary" style="font-size:0.8rem; padding:6px 14px;" onclick="markAllNotificationsRead()"><i class="fa-solid fa-check-double"></i> Mark All as Read</button>
                </div>
                ${notifs.map(n => `
                    <div style="background:${n.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(255, 51, 85,0.07)'}; border:1px solid ${n.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(255, 51, 85,0.2)'}; border-radius:12px; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; gap:20px; transition:all 0.2s;" class="notification-item">
                        <div>
                            <p style="font-size:0.9rem; color:${n.is_read ? 'var(--text-secondary)' : '#fff'}; line-height:1.4; margin-bottom:6px;">${n.message}</p>
                            <span style="font-size:0.72rem; color:var(--text-muted);"><i class="fa-regular fa-clock"></i> ${new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        ${!n.is_read ? `<button class="btn btn-secondary" style="padding:4px 10px; font-size:0.7rem;" onclick="markSingleNotificationRead(${n.id})">Acknowledge</button>` : ''}
                    </div>
                `).join('')}
            `;
        } catch(e) {
            console.error(e);
            list.innerHTML = '<div style="color:var(--clr-pink); text-align:center; padding:20px;">Link linkage failure reading system feeds.</div>';
        }
    };

    window.markSingleNotificationRead = async function(id) {
        try {
            await fetch(`/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showToast('Transmission acknowledged.', 'info');
            renderNotificationsSecPanel();
            fetchTelemetry();
        } catch(e) {}
    };

    window.markAllNotificationsRead = async function() {
        try {
            await fetch('/api/notifications/read-all', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showToast('All telemetry messages acknowledged.', 'success');
            renderNotificationsSecPanel();
            fetchTelemetry();
        } catch(e) {}
    };

    // ─── Phases 8 - 11: Instructor Management Engines ───────────────────────

    // 1. Render Instructor Courses List
    window.renderInstructorCoursesPanel = async function() {
        const grid = document.getElementById('instructor-courses-grid');
        if (!grid) return;
        grid.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:60px; grid-column:1/-1;"><i class="fa-solid fa-satellite-dish" style="font-size:2rem; margin-bottom:16px; display:block;"></i>Scanning instructor registers...</div>';

        try {
            const res = await fetch('/api/courses/instructor', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const courses = res.ok ? await res.json() : [];

            if (courses.length === 0) {
                grid.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:60px; grid-column:1/-1;"><i class="fa-solid fa-folder-open" style="font-size:2rem; margin-bottom:16px; display:block;"></i>No course tracks under your management yet.</div>';
                return;
            }

            grid.innerHTML = courses.map(c => {
                const publishBtnText = c.is_published ? 'Unpublish' : 'Publish';
                const publishBadge = c.is_published ? 
                    `<span style="background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); color:#10b981; padding:3px 10px; border-radius:20px; font-size:0.7rem; font-weight:600; font-family:var(--font-heading);">PUBLISHED</span>` :
                    `<span style="background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); color:#f59e0b; padding:3px 10px; border-radius:20px; font-size:0.7rem; font-weight:600; font-family:var(--font-heading);">DRAFT</span>`;

                return `
                    <div class="lms-course-card" style="background:var(--glass-bg-card); border:1px solid var(--glass-border); border-radius:16px; overflow:hidden; display:flex; flex-direction:column; padding:0;">
                        <div class="lms-course-img" style="background-image: url('${c.image_url || 'images/hero_space_station.png'}'); height:140px; background-size:cover; background-position:center; position:relative; padding:16px; display:flex; justify-content:space-between; align-items:flex-end;">
                            <span class="lms-course-cat" style="background:rgba(255, 92, 117,0.85); color:#fff; padding:4px 10px; border-radius:20px; font-size:0.7rem; font-family:var(--font-heading); font-weight:600; backdrop-filter:blur(4px);">${c.category.toUpperCase()}</span>
                            ${publishBadge}
                        </div>
                        <div style="padding:20px; display:flex; flex-direction:column; flex-grow:1; justify-content:space-between; gap:16px;">
                            <div>
                                <h3 style="font-family:var(--font-heading); font-size:1.05rem; color:#fff; margin-bottom:8px; line-height:1.3;">${c.title}</h3>
                                <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4; margin-bottom:12px;">${c.description}</p>
                                <span style="font-size:0.75rem; color:var(--clr-cyan);"><i class="fa-solid fa-users"></i> Enrolled Cadets: <strong>${c.enrolled_count}</strong></span>
                            </div>
                            
                            <div style="display:flex; flex-direction:column; gap:8px; border-top:1px solid rgba(255,255,255,0.06); padding-top:14px;">
                                <div style="display:flex; gap:8px; width:100%;">
                                    <button class="btn btn-secondary" style="flex:1; padding:6px; font-size:0.75rem;" onclick="openEditCourseModal(${c.id}, '${c.title.replace(/'/g, "\\'")}', '${c.category.replace(/'/g, "\\'")}', '${c.description.replace(/'/g, "\\'")}', '${(c.learning_outcomes || '').replace(/'/g, "\\'")}')"><i class="fa-solid fa-pen"></i> Edit</button>
                                    <button class="btn btn-secondary" style="flex:1; padding:6px; font-size:0.75rem;" onclick="togglePublishCourse(${c.id})"><i class="fa-solid fa-tower-broadcast"></i> ${publishBtnText}</button>
                                </div>
                                <button class="btn btn-primary" style="width:100%; padding:8px; font-size:0.75rem; background:linear-gradient(135deg, var(--clr-purple), var(--clr-cyan)); border:none;" onclick="openManageDeckModal(${c.id}, '${c.title.replace(/'/g, "\\'")}')"><i class="fa-solid fa-list-check"></i> Manage Deck</button>
                                <button class="btn btn-danger" style="width:100%; padding:4px; font-size:0.7rem; background:rgba(255, 92, 117,0.1); border:1px solid rgba(255, 92, 117,0.2); color:var(--clr-pink);" onclick="deleteCourse(${c.id})"><i class="fa-solid fa-trash-can"></i> Soft Delete</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.error(err);
        }
    };

    // 2. Open Create Course Modal
    window.openCreateCourseModal = function() {
        const modal = document.createElement('div');
        modal.className = 'lms-modal active';
        modal.style.zIndex = '99999';
        modal.innerHTML = `
            <div class="lms-modal-content" style="max-width:550px;">
                <div class="lms-modal-header">
                    <h2>Deploy Course Sector</h2>
                    <button class="lms-modal-close" onclick="this.closest('.lms-modal').remove()">&times;</button>
                </div>
                <div class="lms-modal-body" style="padding:24px;">
                    <form id="create-course-form" style="display:flex; flex-direction:column; gap:16px;">
                        <div>
                            <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:6px;">COURSE TITLE</label>
                            <input type="text" id="cc-title" placeholder="e.g. FTL Navigation Theory" style="width:100%; padding:10px 14px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:8px; color:#fff;" required>
                        </div>
                        <div>
                            <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:6px;">CATEGORY</label>
                            <input type="text" id="cc-category" placeholder="e.g. Aerospace Systems" style="width:100%; padding:10px 14px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:8px; color:#fff;" required>
                        </div>
                        <div>
                            <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:6px;">DESCRIPTION</label>
                            <textarea id="cc-desc" placeholder="Broad curriculum summary..." style="width:100%; height:80px; padding:10px 14px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-family:var(--font-body);" required></textarea>
                        </div>
                        <div>
                            <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:6px;">EXPECTED LEARNING OUTCOMES</label>
                            <input type="text" id="cc-outcomes" placeholder="e.g. Master sublight vectoring grids" style="width:100%; padding:10px 14px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:8px; color:#fff;">
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%; background:linear-gradient(135deg, var(--clr-purple), var(--clr-cyan)); border:none; padding:12px;"><i class="fa-solid fa-shuttle-space"></i> Deploy Coordinates</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const form = document.getElementById('create-course-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                title: document.getElementById('cc-title').value.trim(),
                category: document.getElementById('cc-category').value.trim(),
                description: document.getElementById('cc-desc').value.trim(),
                learning_outcomes: document.getElementById('cc-outcomes').value.trim()
            };

            try {
                const res = await fetch('/api/courses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    showToast('New curricular coordinates deployed successfully!', 'success');
                    modal.remove();
                    renderInstructorCoursesPanel();
                } else {
                    alert('Failed to deploy course.');
                }
            } catch(err) {
                console.error(err);
            }
        };
    };

    // 3. Open Edit Course Modal
    window.openEditCourseModal = function(id, title, category, desc, outcomes) {
        const modal = document.createElement('div');
        modal.className = 'lms-modal active';
        modal.style.zIndex = '99999';
        modal.innerHTML = `
            <div class="lms-modal-content" style="max-width:550px;">
                <div class="lms-modal-header">
                    <h2>Edit Curricular Parameters</h2>
                    <button class="lms-modal-close" onclick="this.closest('.lms-modal').remove()">&times;</button>
                </div>
                <div class="lms-modal-body" style="padding:24px;">
                    <form id="edit-course-form" style="display:flex; flex-direction:column; gap:16px;">
                        <div>
                            <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:6px;">COURSE TITLE</label>
                            <input type="text" id="ec-title" value="${title}" style="width:100%; padding:10px 14px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:8px; color:#fff;" required>
                        </div>
                        <div>
                            <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:6px;">CATEGORY</label>
                            <input type="text" id="ec-category" value="${category}" style="width:100%; padding:10px 14px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:8px; color:#fff;" required>
                        </div>
                        <div>
                            <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:6px;">DESCRIPTION</label>
                            <textarea id="ec-desc" style="width:100%; height:80px; padding:10px 14px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-family:var(--font-body);" required>${desc}</textarea>
                        </div>
                        <div>
                            <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:6px;">EXPECTED LEARNING OUTCOMES</label>
                            <input type="text" id="ec-outcomes" value="${outcomes}" style="width:100%; padding:10px 14px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:8px; color:#fff;">
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%; background:linear-gradient(135deg, var(--clr-purple), var(--clr-cyan)); border:none; padding:12px;"><i class="fa-solid fa-floppy-disk"></i> Save Telemetry Adjustments</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const form = document.getElementById('edit-course-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                title: document.getElementById('ec-title').value.trim(),
                category: document.getElementById('ec-category').value.trim(),
                description: document.getElementById('ec-desc').value.trim(),
                learning_outcomes: document.getElementById('ec-outcomes').value.trim()
            };

            try {
                const res = await fetch(`/api/courses/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    showToast('Coordinates adjusted.', 'success');
                    modal.remove();
                    renderInstructorCoursesPanel();
                } else {
                    alert('Adjusting course failed.');
                }
            } catch(err) {
                console.error(err);
            }
        };
    };

    // 4. Toggle Publish Course
    window.togglePublishCourse = async function(id) {
        try {
            const res = await fetch(`/api/courses/${id}/publish`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast('Broadcast publish status toggled!', 'success');
                renderInstructorCoursesPanel();
            } else {
                alert('Toggling broadcast registry failed.');
            }
        } catch(e) {
            console.error(e);
        }
    };

    // 5. Delete Course
    window.deleteCourse = async function(id) {
        if (!confirm('Are you sure you want to soft-delete this curricular quadrant?')) return;
        try {
            const res = await fetch(`/api/courses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast('Curriculum quadrant deleted.', 'success');
                renderInstructorCoursesPanel();
            }
        } catch(e) {}
    };

    // 6. Manage Course Deck Modal (Modules, Assignments, Quizzes builder)
    window.openManageDeckModal = async function(courseId, courseTitle) {
        const modal = document.createElement('div');
        modal.className = 'lms-modal active';
        modal.style.zIndex = '99998';
        modal.innerHTML = `
            <div class="lms-modal-content" style="max-width:850px; width:90%; height:85%; display:flex; flex-direction:column;">
                <div class="lms-modal-header" style="flex-shrink:0;">
                    <h2>Curriculum Deck Builder: ${courseTitle}</h2>
                    <button class="lms-modal-close" onclick="this.closest('.lms-modal').remove()">&times;</button>
                </div>
                <div class="lms-modal-body" style="padding:24px; flex-grow:1; overflow-y:auto; display:flex; flex-direction:column; gap:20px;">
                    <div class="deck-tabs" style="display:flex; gap:12px; border-bottom:1px solid var(--glass-border); padding-bottom:10px;">
                        <button class="sub-tab active" data-tab="modules" style="background:none; border:none; color:#fff; font-family:var(--font-heading); cursor:pointer;">1. Modules</button>
                        <button class="sub-tab" data-tab="assignments" style="background:none; border:none; color:var(--text-secondary); font-family:var(--font-heading); cursor:pointer;">2. Assignments</button>
                        <button class="sub-tab" data-tab="quizzes" style="background:none; border:none; color:var(--text-secondary); font-family:var(--font-heading); cursor:pointer;">3. Assessments</button>
                    </div>

                    <!-- TAB CONTENTS -->
                    <div id="deck-modules-tab" class="deck-tab-content">
                        <!-- Add Module Form -->
                        <h4 style="color:#fff; font-family:var(--font-heading); margin-bottom:12px;">Add Learning Module</h4>
                        <form id="add-module-form" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; background:rgba(255,255,255,0.02); padding:16px; border-radius:12px; border:1px solid var(--glass-border);">
                            <input type="text" id="mod-title" placeholder="Module Title (e.g. Warp Field Vectors)" style="grid-column:1/-1; padding:8px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;" required>
                            <textarea id="mod-desc" placeholder="Module Description details..." style="grid-column:1/-1; height:60px; padding:8px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff; font-family:var(--font-body);" required></textarea>
                            <input type="text" id="mod-video" placeholder="Video URL (e.g. /uploads/vector.mp4)" style="padding:8px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;">
                            <input type="text" id="mod-pdf" placeholder="Notes PDF URL" style="padding:8px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;">
                            <input type="text" id="mod-resources" placeholder="Downloadable Resources Name" style="grid-column:1/-1; padding:8px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;">
                            <button type="submit" class="btn btn-primary" style="grid-column:1/-1; background:var(--clr-cyan); color:#000; border:none; padding:8px; font-weight:600;"><i class="fa-solid fa-paperclip"></i> Attach Learning Module</button>
                        </form>
                        <h4 style="color:#fff; font-family:var(--font-heading); margin-top:20px; margin-bottom:12px;">Module Outline</h4>
                        <div id="deck-modules-list" style="display:flex; flex-direction:column; gap:10px;"></div>
                    </div>

                    <div id="deck-assignments-tab" class="deck-tab-content" style="display:none;">
                        <!-- Add Assignment Form -->
                        <h4 style="color:#fff; font-family:var(--font-heading); margin-bottom:12px;">Publish New Task Assignment</h4>
                        <form id="add-assignment-form" style="display:flex; flex-direction:column; gap:12px; background:rgba(255,255,255,0.02); padding:16px; border-radius:12px; border:1px solid var(--glass-border);">
                            <input type="text" id="asg-title" placeholder="Assignment Name" style="padding:8px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;" required>
                            <textarea id="asg-desc" placeholder="Instruction parameters..." style="height:60px; padding:8px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff; font-family:var(--font-body);" required></textarea>
                            <div>
                                <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">DEADLINE</label>
                                <input type="datetime-local" id="asg-deadline" style="width:100%; padding:8px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;" required>
                            </div>
                            <button type="submit" class="btn btn-primary" style="background:var(--clr-cyan); color:#000; border:none; padding:8px; font-weight:600;"><i class="fa-solid fa-file-invoice"></i> Deploy Task to Sector</button>
                        </form>
                        <h4 style="color:#fff; font-family:var(--font-heading); margin-top:20px; margin-bottom:12px;">Existing Assignments</h4>
                        <div id="deck-assignments-list" style="display:flex; flex-direction:column; gap:10px;"></div>
                    </div>

                    <div id="deck-quizzes-tab" class="deck-tab-content" style="display:none;">
                        <!-- Add Quiz Builder -->
                        <h4 style="color:#fff; font-family:var(--font-heading); margin-bottom:12px;">Build Quiz Assessment</h4>
                        <form id="add-quiz-form" style="display:flex; flex-direction:column; gap:12px; background:rgba(255,255,255,0.02); padding:16px; border-radius:12px; border:1px solid var(--glass-border);">
                            <div style="display:flex; gap:10px;">
                                <input type="text" id="qz-title" placeholder="Assessment Title" style="flex-grow:1; padding:8px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;" required>
                                <input type="number" id="qz-limit" placeholder="Limit (Mins)" style="width:120px; padding:8px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;" value="15" required>
                            </div>
                            
                            <h5 style="color:var(--clr-cyan); font-family:var(--font-heading); margin:8px 0 2px 0;">Question 1 Builder</h5>
                            <input type="text" class="qz-q-text" placeholder="Question Text" style="padding:8px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;" required>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                                <input type="text" class="qz-q-a" placeholder="Option A" style="padding:6px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;" required>
                                <input type="text" class="qz-q-b" placeholder="Option B" style="padding:6px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;" required>
                                <input type="text" class="qz-q-c" placeholder="Option C" style="padding:6px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;" required>
                                <input type="text" class="qz-q-d" placeholder="Option D" style="padding:6px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;" required>
                            </div>
                            <div>
                                <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:4px;">CORRECT OPTION</label>
                                <select class="qz-q-correct" style="width:100%; padding:8px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;">
                                    <option value="A">Option A</option>
                                    <option value="B">Option B</option>
                                    <option value="C">Option C</option>
                                    <option value="D">Option D</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary" style="background:var(--clr-cyan); color:#000; border:none; padding:8px; font-weight:600;"><i class="fa-solid fa-circle-question"></i> Compile Quiz Structure</button>
                        </form>
                        <h4 style="color:#fff; font-family:var(--font-heading); margin-top:20px; margin-bottom:12px;">Active Quiz Structures</h4>
                        <div id="deck-quizzes-list" style="display:flex; flex-direction:column; gap:10px;"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Wire tabs
        const tabBtns = modal.querySelectorAll('.deck-tabs .sub-tab');
        tabBtns.forEach(btn => {
            btn.onclick = () => {
                tabBtns.forEach(b => {
                    b.classList.remove('active');
                    b.style.color = 'var(--text-secondary)';
                });
                btn.classList.add('active');
                btn.style.color = '#fff';
                
                modal.querySelectorAll('.deck-tab-content').forEach(c => c.style.display = 'none');
                modal.querySelector(`#deck-${btn.dataset.tab}-tab`).style.display = 'block';
            };
        });

        // Load modules, assignments, and quizzes list
        const refreshDeckLists = async () => {
            try {
                const res = await fetch(`/api/courses/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (!res.ok) return;

                // Render modules list
                const modContainer = modal.querySelector('#deck-modules-list');
                modContainer.innerHTML = data.modules.map(m => `
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong style="color:#fff; font-size:0.9rem;">${m.title}</strong>
                            <p style="font-size:0.75rem; color:var(--text-secondary); margin:4px 0 0 0;">${m.description || ''}</p>
                        </div>
                    </div>
                `).join('') || '<p style="color:var(--text-muted); font-size:0.8rem;">No modules added.</p>';

                // Render assignments list
                const asgContainer = modal.querySelector('#deck-assignments-list');
                asgContainer.innerHTML = data.assignments.map(a => `
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong style="color:#fff; font-size:0.9rem;">${a.title}</strong>
                            <span style="font-size:0.7rem; color:var(--clr-pink); display:block; margin-top:4px;"><i class="fa-regular fa-calendar-days"></i> Due: ${new Date(a.deadline).toLocaleString()}</span>
                        </div>
                    </div>
                `).join('') || '<p style="color:var(--text-muted); font-size:0.8rem;">No assignments deployed.</p>';

                // Render quizzes list
                const qzContainer = modal.querySelector('#deck-quizzes-list');
                qzContainer.innerHTML = data.quizzes.map(q => `
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong style="color:#fff; font-size:0.9rem;">${q.title}</strong>
                            <span style="font-size:0.72rem; color:var(--clr-cyan); display:block; margin-top:4px;"><i class="fa-regular fa-clock"></i> Limit: ${q.time_limit} Mins</span>
                        </div>
                    </div>
                `).join('') || '<p style="color:var(--text-muted); font-size:0.8rem;">No quizzes compiled.</p>';

            } catch(e) {}
        };

        // Form bindings
        const moduleForm = modal.querySelector('#add-module-form');
        moduleForm.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                title: modal.querySelector('#mod-title').value.trim(),
                description: modal.querySelector('#mod-desc').value.trim(),
                video_url: modal.querySelector('#mod-video').value.trim(),
                pdf_url: modal.querySelector('#mod-pdf').value.trim(),
                downloadable_resources: modal.querySelector('#mod-resources').value.trim()
            };
            try {
                const r = await fetch(`/api/courses/${courseId}/modules`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if (r.ok) {
                    showToast('Module attached to starmap!', 'success');
                    moduleForm.reset();
                    refreshDeckLists();
                }
            } catch(err) {}
        };

        const assignmentForm = modal.querySelector('#add-assignment-form');
        assignmentForm.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                course_id: courseId,
                title: modal.querySelector('#asg-title').value.trim(),
                description: modal.querySelector('#asg-desc').value.trim(),
                deadline: modal.querySelector('#asg-deadline').value
            };
            try {
                const r = await fetch('/api/assignments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if (r.ok) {
                    showToast('New task deployed to student registers!', 'success');
                    assignmentForm.reset();
                    refreshDeckLists();
                }
            } catch(err) {}
        };

        const quizForm = modal.querySelector('#add-quiz-form');
        quizForm.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                course_id: courseId,
                title: modal.querySelector('#qz-title').value.trim(),
                time_limit: parseInt(modal.querySelector('#qz-limit').value || 15),
                questions: [{
                    question_text: modal.querySelector('.qz-q-text').value.trim(),
                    option_a: modal.querySelector('.qz-q-a').value.trim(),
                    option_b: modal.querySelector('.qz-q-b').value.trim(),
                    option_c: modal.querySelector('.qz-q-c').value.trim(),
                    option_d: modal.querySelector('.qz-q-d').value.trim(),
                    correct_option: modal.querySelector('.qz-q-correct').value
                }]
            };
            try {
                const r = await fetch('/api/quizzes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if (r.ok) {
                    showToast('Quiz structure deployed successfully.', 'success');
                    quizForm.reset();
                    refreshDeckLists();
                }
            } catch(err) {}
        };

        refreshDeckLists();
    };

    // 7. Render Instructor Student Telemetry & Grading queue
    window.renderInstructorAnalyticsPanel = async function() {
        const container = document.getElementById('instructor-analytics-container');
        if (!container) return;
        container.innerHTML = '<div style="color:rgba(255,255,255,0.3); text-align:center; padding:60px;"><i class="fa-solid fa-satellite-dish" style="font-size:2rem; margin-bottom:16px; display:block;"></i>Scanning student telemetry matrices...</div>';

        try {
            // Load instructor's managed courses
            const coursesRes = await fetch('/api/courses/instructor', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const courses = coursesRes.ok ? await coursesRes.json() : [];

            if (courses.length === 0) {
                container.innerHTML = '<p style="color:rgba(255,255,255,0.4); text-align:center; padding:20px;">No course tracks active yet.</p>';
                return;
            }

            // Gather submissions to grade across all courses
            let submissionsToGrade = [];
            for (const c of courses) {
                // Fetch assignments
                const courseDetailsRes = await fetch(`/api/courses/${c.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!courseDetailsRes.ok) continue;
                const courseDetails = await courseDetailsRes.json();
                
                for (const a of courseDetails.assignments) {
                    const subRes = await fetch(`/api/assignments/${a.id}/submissions`, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (!subRes.ok) continue;
                    const subs = await subRes.json();
                    
                    const pending = subs.filter(s => s.status === 'submitted');
                    pending.forEach(s => {
                        s.course_title = c.title;
                        s.assignment_title = a.title;
                        submissionsToGrade.push(s);
                    });
                }
            }

            // Renders Submissions list
            let gradingQueueHtml = '';
            if (submissionsToGrade.length > 0) {
                gradingQueueHtml = submissionsToGrade.map(s => `
                    <div style="background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <span style="font-size:0.7rem; color:var(--clr-cyan); font-family:var(--font-heading); font-weight:600;">${s.course_title.toUpperCase()}</span>
                                <h4 style="color:#fff; font-size:0.95rem; margin-top:2px;">${s.assignment_title}: Submission by ${s.student_name}</h4>
                            </div>
                            <span style="font-size:0.72rem; color:var(--text-muted);"><i class="fa-regular fa-clock"></i> ${new Date(s.submitted_at).toLocaleDateString()}</span>
                        </div>
                        
                        <p style="font-size:0.82rem; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px; color:var(--text-secondary); line-height:1.4;">${s.content || 'No text content provided.'}</p>
                        ${s.file_url ? `<a href="${s.file_url}" target="_blank" style="color:var(--clr-cyan); font-size:0.8rem; text-decoration:none;"><i class="fa-solid fa-file-pdf"></i> View Attached PDF Document</a>` : ''}

                        <!-- Grade Form -->
                        <form onsubmit="gradeSubmissionDirect(event, ${s.id})" style="display:flex; gap:10px; align-items:center;">
                            <input type="number" name="grade" placeholder="Grade (0-100)" min="0" max="100" style="width:120px; padding:8px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;" required>
                            <input type="text" name="feedback" placeholder="Instructor feedback notes..." style="flex-grow:1; padding:8px; background:var(--glass-bg-input); border:1px solid var(--glass-border); border-radius:6px; color:#fff;" required>
                            <button type="submit" class="btn btn-primary" style="padding:8px 16px; background:linear-gradient(135deg, var(--clr-purple), var(--clr-cyan)); border:none; font-size:0.8rem;"><i class="fa-solid fa-check"></i> Submit Grade</button>
                        </form>
                    </div>
                `).join('');
            } else {
                gradingQueueHtml = '<p style="color:rgba(255,255,255,0.4); text-align:center; padding:16px;">All cadet submissions have been successfully graded. Outstanding clear!</p>';
            }

            container.innerHTML = `
                <div class="dash-card" style="padding:24px;">
                    <h3 style="font-family:var(--font-heading); color:#fff; font-size:1.1rem; margin-bottom:16px;"><i class="fa-solid fa-clipboard-list" style="color:var(--clr-cyan);"></i> Telemetry Grading Queue</h3>
                    <div style="display:flex; flex-direction:column; gap:16px;">
                        ${gradingQueueHtml}
                    </div>
                </div>
            `;
        } catch(e) {
            console.error(e);
        }
    };

    window.gradeSubmissionDirect = async function(e, submissionId) {
        e.preventDefault();
        const form = e.target;
        const grade = form.elements.grade.value;
        const feedback = form.elements.feedback.value;

        try {
            const res = await fetch(`/api/assignments/submissions/${submissionId}/grade`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ grade, feedback })
            });
            if (res.ok) {
                showToast('Cadet submission graded and progress updated.', 'success');
                renderInstructorAnalyticsPanel();
            } else {
                alert('Grading coordinate failed to compile.');
            }
        } catch(err) {}
    };

    // 8. Render announcements forum broadcaster
    window.renderInstructorForumPanel = async function() {
        const select = document.getElementById('broadcast-course-select');
        const list = document.getElementById('recent-broadcasts-list');
        if (!select || !list) return;

        select.innerHTML = '<option>Loading target courses...</option>';
        list.innerHTML = '';

        try {
            // Load instructor's managed courses
            const coursesRes = await fetch('/api/courses/instructor', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const courses = coursesRes.ok ? await coursesRes.json() : [];

            if (courses.length === 0) {
                select.innerHTML = '<option>No courses managed.</option>';
                return;
            }

            select.innerHTML = courses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');

            // Fetch recent broadcasts (from forum logs)
            // Instructor announcements can simply post a top-level forum thread!
            let announcements = [];
            for (const c of courses) {
                const fRes = await fetch(`/api/forum/course/${c.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!fRes.ok) continue;
                const threads = await fRes.json();
                threads.forEach(t => {
                    if (t.author_role === 'instructor') {
                        t.course_title = c.title;
                        announcements.push(t);
                    }
                });
            }

            if (announcements.length === 0) {
                list.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:20px;">No broadcast logs recorded in sector registries.</p>';
                return;
            }

            list.innerHTML = announcements.map(a => `
                <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:14px 16px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--clr-cyan); font-family:var(--font-heading); margin-bottom:6px;">
                        <span>Target: <strong>${a.course_title}</strong></span>
                        <span>${new Date(a.created_at).toLocaleString()}</span>
                    </div>
                    <p style="font-size:0.88rem; color:#fff; line-height:1.4;">${a.content}</p>
                </div>
            `).join('');

        } catch(e) {}
    };

    // Bind Announcement Broadcast submit
    const broadcastForm = document.getElementById('instructor-broadcast-form');
    if (broadcastForm) {
        broadcastForm.onsubmit = async (e) => {
            e.preventDefault();
            const courseId = document.getElementById('broadcast-course-select').value;
            const message = document.getElementById('broadcast-message-input').value.trim();

            if (!courseId || !message) return;

            try {
                // Post announcement to forum
                const res = await fetch('/api/forum', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ course_id: parseInt(courseId), content: message })
                });

                if (res.ok) {
                    showToast('Fleet-wide broadcast transmitted to course sector forum!', 'success');
                    broadcastForm.reset();
                    renderInstructorForumPanel();
                } else {
                    alert('Broadcast transmission anomaly.');
                }
            } catch(err) {
                console.error(err);
            }
        };
    }

});
