// CourseVerse Login Portal Logic

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       1. FORM TOGGLE (LOGIN VS SIGNUP)
       ========================================== */
    const goToSignupBtn = document.getElementById('go-to-signup-btn');
    const goToLoginBtn = document.getElementById('go-to-login-btn');
    const loginFormBlock = document.getElementById('login-form-block');
    const signupFormBlock = document.getElementById('signup-form-block');

    goToSignupBtn?.addEventListener('click', () => {
        loginFormBlock.classList.remove('active');
        setTimeout(() => {
            signupFormBlock.classList.add('active');
        }, 150);
    });

    goToLoginBtn?.addEventListener('click', () => {
        signupFormBlock.classList.remove('active');
        setTimeout(() => {
            loginFormBlock.classList.add('active');
        }, 150);
    });


    /* ==========================================
       2. ROLE SELECTION TABS
       ========================================== */
    let currentLoginRole = 'student';
    let currentSignupRole = 'student';

    const loginRoleSelector = document.querySelector('#login-form-block .role-selector');
    const signupRoleSelector = document.querySelector('#signup-form-block .role-selector');

    if (loginRoleSelector) {
        const tabs = loginRoleSelector.querySelectorAll('.role-tab');
        const loginSubtitle = document.querySelector('#login-form-block .login-subtitle');
        const loginSubmitBtn = document.querySelector('#portal-login-form .warp-submit-btn');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentLoginRole = tab.getAttribute('data-role');

                if (currentLoginRole === 'instructor') {
                    if (loginSubtitle) loginSubtitle.textContent = 'Secure portal for Academic Commanders and Instructors.';
                    if (loginSubmitBtn) loginSubmitBtn.textContent = 'Initiate Warp as Instructor';
                } else {
                    if (loginSubtitle) loginSubtitle.textContent = 'Identify yourself to enter the learning constellation.';
                    if (loginSubmitBtn) loginSubmitBtn.textContent = 'Initiate Warp as Cadet';
                }
            });
        });
    }

    if (signupRoleSelector) {
        const tabs = signupRoleSelector.querySelectorAll('.role-tab');
        const signupSubtitle = document.querySelector('#signup-form-block .login-subtitle');
        const signupNameLabel = document.getElementById('signup-name-label');
        const signupNameInput = document.getElementById('signup-name');
        const signupSubmitBtn = document.querySelector('#portal-signup-form .warp-submit-btn');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentSignupRole = tab.getAttribute('data-role');

                if (currentSignupRole === 'instructor') {
                    if (signupSubtitle) signupSubtitle.textContent = 'Enter your details to register as a new CourseVerse instructor.';
                    if (signupNameLabel) signupNameLabel.textContent = 'Instructor Name / Callsign';
                    if (signupNameInput) signupNameInput.placeholder = 'Dr. Grayson';
                    if (signupSubmitBtn) signupSubmitBtn.textContent = 'Authorize Instructor';
                } else {
                    if (signupSubtitle) signupSubtitle.textContent = 'Enter your details to register as a new CourseVerse cadet.';
                    if (signupNameLabel) signupNameLabel.textContent = 'Cadet Callsign';
                    if (signupNameInput) signupNameInput.placeholder = 'Alex Grayson';
                    if (signupSubmitBtn) signupSubmitBtn.textContent = 'Authorize Cadet';
                }
            });
        });
    }


    /* ==========================================
       3. PASSWORD EYE VISIBILITY TOGGLE
       ========================================== */
    const toggleBtns = document.querySelectorAll('.password-toggle-btn');

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const icon = btn.querySelector('i');
            
            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            }
        });
    });


    /* ==========================================
       4. DYNAMIC WARP SPEED SUBMISSION ANIMATION
       ========================================== */
    const loginForm = document.getElementById('portal-login-form');
    const signupForm = document.getElementById('portal-signup-form');
    const warpCanvas = document.getElementById('warp-speed-canvas');
    const warpCtx = warpCanvas?.getContext('2d');
    
    let warpActive = false;
    let stars = [];
    const starCount = 300;
    let warpSpeed = 0.5;
    let animationFrameId;

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, role: currentLoginRole })
                });
                
                const data = await response.json();
                if (!response.ok) {
                    alert(data.error || 'Access Denied.');
                    return;
                }
                
                localStorage.setItem('courseverse_token', data.token);
                localStorage.setItem('courseverse_user', JSON.stringify(data.user));
                sessionStorage.setItem('courseverse_role', currentLoginRole);
                initiateWarpSequence();
            } catch (err) {
                console.error(err);
                alert('Connection failure to sector core.');
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, role: currentSignupRole })
                });
                
                const data = await response.json();
                if (!response.ok) {
                    alert(data.error || 'Registration failed.');
                    return;
                }
                
                localStorage.setItem('courseverse_token', data.token);
                localStorage.setItem('courseverse_user', JSON.stringify(data.user));
                sessionStorage.setItem('courseverse_role', currentSignupRole);
                initiateWarpSequence();
            } catch (err) {
                console.error(err);
                alert('Connection failure to registry core.');
            }
        });
    }

    function initiateWarpSequence() {
        if (warpActive) return;
        
        if (!warpCanvas || !warpCtx) {
            window.location.href = 'dashboard.html';
            return;
        }
        
        warpActive = true;
        warpCanvas.classList.add('active');
        resizeWarpCanvas();
        initWarpStars();
        
        // Disable form buttons to prevent double clicks
        const submitButtons = document.querySelectorAll('.warp-submit-btn, .switch-form-btn');
        submitButtons.forEach(btn => btn.disabled = true);

        // Slow acceleration to hyper speed
        animateWarp();

        // Step 1: Max out speed after 1s
        setTimeout(() => {
            warpSpeed = 25;
        }, 700);

        // Step 2: Screen turns glowing white (whiteout) at 1.4s
        setTimeout(() => {
            warpCanvas.style.background = '#ffffff';
            warpCanvas.style.transition = 'background 0.5s ease';
        }, 1300);

        // Step 3: Redirect to cockpit main landing page
        setTimeout(() => {
            cancelAnimationFrame(animationFrameId);
            window.location.href = 'dashboard.html';
        }, 1800);
    }

    function resizeWarpCanvas() {
        warpCanvas.width = window.innerWidth;
        warpCanvas.height = window.innerHeight;
    }

    function initWarpStars() {
        stars = [];
        const cx = warpCanvas.width / 2;
        const cy = warpCanvas.height / 2;
        
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: (Math.random() - 0.5) * warpCanvas.width * 2,
                y: (Math.random() - 0.5) * warpCanvas.height * 2,
                z: Math.random() * warpCanvas.width,
                oX: cx,
                oY: cy
            });
        }
    }

    function animateWarp() {
        warpCtx.fillStyle = 'rgba(4, 7, 18, 0.2)'; // trail transparency
        warpCtx.fillRect(0, 0, warpCanvas.width, warpCanvas.height);
        
        const cx = warpCanvas.width / 2;
        const cy = warpCanvas.height / 2;

        // Accelerate speed gradually
        if (warpSpeed < 20) {
            warpSpeed += 0.25;
        }

        stars.forEach(star => {
            star.z -= warpSpeed;

            if (star.z <= 0) {
                star.z = warpCanvas.width;
                star.x = (Math.random() - 0.5) * warpCanvas.width * 2;
                star.y = (Math.random() - 0.5) * warpCanvas.height * 2;
            }

            // Project coordinates onto 2D viewport
            const k = 128.0 / star.z;
            const px = star.x * k + cx;
            const py = star.y * k + cy;

            if (px >= 0 && px <= warpCanvas.width && py >= 0 && py <= warpCanvas.height) {
                // Draw star line streak (length scales with speed)
                const size = (1 - star.z / warpCanvas.width) * 3 + 1;
                
                // Old position line start
                const oldK = 128.0 / (star.z + warpSpeed * 1.5);
                const opx = star.x * oldK + cx;
                const opy = star.y * oldK + cy;

                warpCtx.strokeStyle = `rgba(167, 139, 250, ${1 - star.z / warpCanvas.width})`; // purple tint streaks
                if (warpSpeed > 10) {
                    warpCtx.strokeStyle = `rgba(6, 240, 255, ${1 - star.z / warpCanvas.width})`; // cyan at high speed
                }
                warpCtx.lineWidth = size;
                
                warpCtx.beginPath();
                warpCtx.moveTo(opx, opy);
                warpCtx.lineTo(px, py);
                warpCtx.stroke();
            }
        });

        animationFrameId = requestAnimationFrame(animateWarp);
    }

    window.addEventListener('resize', () => {
        if (warpActive) resizeWarpCanvas();
    });

});
