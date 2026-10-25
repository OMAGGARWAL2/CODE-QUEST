// ===== TESTPAD UI AUTHENTICATION LOGIC =====

// ADMIN_AUTHORIZATION_CODE removed as per request. Any user can now register as 'teacher'.

function showMessage(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 3000);
}

function togglePass(id, icon) {
    const el = document.getElementById(id);
    if (el.type === 'password') {
        el.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        el.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function checkCaps(e) {
    const warning = document.getElementById(e.target.id === 'loginPassword' ? 'loginCaps' : 'signupCaps');
    if (!warning) return;
    if (e.getModifierState('CapsLock')) {
        warning.style.display = 'block';
    } else {
        warning.style.display = 'none';
    }
}

function toggleAdminCode() {
    // Hidden as per request. Teachers no longer need an authorization code.
}

function showForgotSection(e) {
    if (e) e.preventDefault();
    document.getElementById('loginSection').classList.remove('active');
    document.getElementById('signupSection').classList.remove('active');
    document.getElementById('forgotSection').classList.add('active');
    document.querySelector('.tab-switcher').style.display = 'none';
    document.querySelector('.auth-header h2').innerText = 'Forgot Password';
}

function showLoginSection(e) {
    if (e) e.preventDefault();
    document.getElementById('forgotSection').classList.remove('active');
    document.querySelector('.tab-switcher').style.display = 'flex';
    document.querySelector('.auth-header h2').innerText = 'Log into your account';
    switchTab('login');
}

function switchTab(tab) {
    const slider = document.getElementById('tabSlider');
    const loginSection = document.getElementById('loginSection');
    const signupSection = document.getElementById('signupSection');
    const loginBtn = document.getElementById('loginTab');
    const signupBtn = document.getElementById('signupTab');

    if (tab === 'login') {
        slider.style.transform = 'translateX(0)';
        loginSection.classList.add('active');
        signupSection.classList.remove('active');
        loginBtn.classList.add('active');
        signupBtn.classList.remove('active');
    } else {
        slider.style.transform = 'translateX(100%)';
        loginSection.classList.remove('active');
        signupSection.classList.add('active');
        loginBtn.classList.remove('active');
        signupBtn.classList.add('active');
    }
}

// --- RECENT LOGINS DROPDOWN LOGIC ---
function toggleHistoryMenu(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('historyDropdown');
    if (!dropdown) return;

    const isVisible = dropdown.style.display === 'flex';
    
    if (isVisible) {
        dropdown.style.display = 'none';
    } else {
        renderHistoryDropdown();
    }
}

function renderHistoryDropdown() {
    const users = JSON.parse(localStorage.getItem('TESTPAD_users')) || [];
    const dropdown = document.getElementById('historyDropdown');
    if (!dropdown) return;

    if (users.length === 0) {
        dropdown.style.display = 'none';
        showMessage("No created identities found yet.");
        return;
    }

    dropdown.innerHTML = '';
    dropdown.style.display = 'flex';

    [...users].reverse().forEach(u => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.style.position = 'relative';
        item.innerHTML = `
            <div class="history-item-info">
                <span class="history-item-email">${u.email || u.rollNo}</span>
                <span class="history-item-role">${(u.role || 'user').toUpperCase()}</span>
            </div>
            <i class="fas fa-trash delete-btn" title="Delete ID from database" style="color: #ef4444; font-size: 1rem; cursor: pointer; padding: 5px; z-index: 10;"></i>
        `;
        
        const delBtn = item.querySelector('.delete-btn');
        delBtn.onmousedown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const banner = document.getElementById('deleteConfirmBanner');
            if (banner) {
                const text = document.getElementById('deleteConfirmText');
                const confirmBtn = document.getElementById('confirmDeleteBtn');
                const cancelBtn = document.getElementById('cancelDeleteBtn');
                
                text.textContent = `Delete identity ${u.email || u.rollNo} from records? You can create it again.`;
                banner.style.display = 'flex';
                
                // Close dropdown so it doesn't overlap weirdly
                const dropdown = document.getElementById('historyDropdown');
                if (dropdown) dropdown.style.display = 'none';

                requestAnimationFrame(() => {
                    banner.style.transform = 'translateX(-50%) translateY(0)';
                    banner.style.opacity = '1';
                });
                
                confirmBtn.onclick = () => {
                    banner.style.transform = 'translateX(-50%) translateY(-20px)';
                    banner.style.opacity = '0';
                    setTimeout(() => { banner.style.display = 'none'; }, 300);
                    
                    let currentUsers = JSON.parse(localStorage.getItem('TESTPAD_users')) || [];
                    currentUsers = currentUsers.filter(user => user.id !== u.id);
                    localStorage.setItem('TESTPAD_users', JSON.stringify(currentUsers));
                    
                    let history = JSON.parse(localStorage.getItem('TESTPAD_login_history')) || [];
                    history = history.filter(item => atob(item.e) !== (u.email || u.rollNo));
                    localStorage.setItem('TESTPAD_login_history', JSON.stringify(history));
                    
                    showMessage(`Identity deleted: ${u.email || u.rollNo}`);
                    // Ensure the email field gets cleared if it was the one deleted
                    const emailField = document.getElementById('loginEmail');
                    if (emailField && emailField.value === (u.email || u.rollNo)) {
                        emailField.value = '';
                        const passField = document.getElementById('loginPassword');
                        if (passField) passField.value = '';
                    }
                    renderHistoryDropdown();
                };
                
                cancelBtn.onclick = () => {
                    banner.style.transform = 'translateX(-50%) translateY(-20px)';
                    banner.style.opacity = '0';
                    setTimeout(() => { banner.style.display = 'none'; }, 300);
                };
            } else {
                // Fallback
                if (confirm(`Delete identity ${u.email || u.rollNo} from database? You will be able to create it again.`)) {
                    let currentUsers = JSON.parse(localStorage.getItem('TESTPAD_users')) || [];
                    currentUsers = currentUsers.filter(user => user.id !== u.id);
                    localStorage.setItem('TESTPAD_users', JSON.stringify(currentUsers));
                    
                    let history = JSON.parse(localStorage.getItem('TESTPAD_login_history')) || [];
                    history = history.filter(item => atob(item.e) !== (u.email || u.rollNo));
                    localStorage.setItem('TESTPAD_login_history', JSON.stringify(history));
                    
                    showMessage(`Identity deleted: ${u.email || u.rollNo}`);
                    renderHistoryDropdown();
                }
            }
        };

        item.onmousedown = (e) => {
            if (e.target.classList.contains('delete-btn')) return;
            e.preventDefault();
            e.stopPropagation();
            
            let pass = "";
            try { pass = atob(u.password); } catch(ex) { pass = u.password; }
            
            selectCredential(u.email || u.rollNo, pass);
            dropdown.style.display = 'none';
        };
        dropdown.appendChild(item);
    });
}

function selectCredential(email, pass) {
    const emailField = document.getElementById('loginEmail');
    const passField = document.getElementById('loginPassword');
    
    if (emailField) emailField.value = email;
    if (passField) passField.value = pass;
    
    // Switch to login tab
    switchTab('login');
    
    showMessage(`Identity restored: ${email}`);
    
    // Visual cue
    const btn = document.getElementById('loginSubmitBtn');
    if (btn) {
        btn.classList.add('pulse');
        setTimeout(() => btn.classList.remove('pulse'), 1000);
        btn.focus();
    }
}

function renderRecentLogins() {
    const container = document.getElementById('recentLogins');
    const list = document.getElementById('recentList');
    if (!container || !list) return;

    const history = auth.getAllSavedCredentials();
    if (!history || history.length < 1) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    list.innerHTML = '';

    history.forEach(cred => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.innerHTML = `
            <div class="recent-info">
                <div class="recent-email">${cred.email}</div>
                <div class="recent-role">${cred.role} Access</div>
            </div>
            <i class="fas fa-chevron-right"></i>
        `;
        item.onmousedown = (e) => {
            e.preventDefault();
            selectCredential(cred.email, cred.password);
            // Switch to login tab if on signup
            switchTab('login');
        };
        list.appendChild(item);
    });
}

// Event Listeners initialization
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // --- DETECT INBOUND TEST LINK (User Request) ---
    const urlParams = new URLSearchParams(window.location.search);
    const urlTestId = urlParams.get('testId') || urlParams.get('invite');
    const urlPasscode = urlParams.get('passcode');

    const testField = document.getElementById('loginTestCode');
    const testLabel = testField?.parentElement.querySelector('label');

    if (urlTestId) {
        if (testField) testField.value = urlTestId;
        if (testLabel) testLabel.innerHTML = 'ENTRY PASSCODE <i class="fas fa-lock" style="margin-left:4px; font-size:0.7rem;"></i>';
        if (testField) testField.placeholder = "Enter passcode for this link";
        if (urlPasscode && testField) testField.value = urlPasscode;
        console.log(`[SECURE LINK] Detected Test: ${urlTestId}`);
    }

    // --- TAB PRE-SWITCH (New User Request) ---
    const urlTab = urlParams.get('tab');
    const urlRole = urlParams.get('role');
    if (urlTab === 'signup') {
        switchTab('signup');
    }
    if (urlRole && document.getElementById('signupRole')) {
        document.getElementById('signupRole').value = urlRole;
    }

    // Close dropdown on outside click
    document.addEventListener('click', () => {
        const dropdown = document.getElementById('historyDropdown');
        if (dropdown) dropdown.style.display = 'none';
    });

    // --- AUTO-FILL SAVED IDENTITY ---
    const allSaved = auth.getAllSavedCredentials();
    let targetSaved = null;
    
    if (urlRole && allSaved.length > 0) {
        targetSaved = allSaved.find(c => c.role === urlRole);
    } 
    
    if (!targetSaved && auth.getSavedCredentials()) {
        targetSaved = auth.getSavedCredentials();
    }

    if (targetSaved && loginForm) {
        // Only auto-fill if nothing is there or if it's the very last one
        if (!document.getElementById('loginEmail').value) {
            document.getElementById('loginEmail').value = targetSaved.email;
            document.getElementById('loginPassword').value = targetSaved.password;
            
            if (!urlTestId && urlTab !== 'signup') {
                switchTab('login');
            }
            if (urlTab !== 'signup') {
                showMessage(`Identity restored for: ${targetSaved.email}`);
            }
        }
        
        if (urlTab !== 'signup') {
            const btn = document.getElementById('loginSubmitBtn');
            if (btn) btn.focus();
        }
    }

    renderRecentLogins();



    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginSubmitBtn');
            const email = document.getElementById('loginEmail').value.trim();
            const pass = document.getElementById('loginPassword').value;
            const testCodeField = document.getElementById('loginTestCode');
            const testCode = testCodeField ? testCodeField.value.trim() : '';
            const remember = false;

            if (!email || !pass) return showMessage('Missing credentials');

            btn.disabled = true;
            btn.innerHTML = '<span><i class="fas fa-spinner fa-spin"></i> VERIFYING...</span>';

            await new Promise(r => setTimeout(r, 800));

            const res = auth.login(email, pass, remember);

            if (res.success) {
                const suffix = testCode ? `?testId=${testCode}` : '';

                setTimeout(() => {
                    let target = `./student-dashboard.html${suffix}`;
                    if (res.user.role === 'teacher') target = './teacher-dashboard.html';
                    else if (res.user.role === 'superadmin') target = './admin-dashboard.html';
                    window.location.assign(target);
                }, 1000);
            } else {
                showMessage(res.message);
                btn.disabled = false;
                btn.innerHTML = '<span>sign in</span>';
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('signupSubmitBtn');
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const role = document.getElementById('signupRole').value;
            const pass = document.getElementById('signupPassword').value;
            const confirm = document.getElementById('confirmPassword').value;
            // --- ADMIN CODE RETRIEVED ONLY IF EXIST (Legacy Support) ---
            const adminCodeEl = document.getElementById('adminCode');
            const adminCode = adminCodeEl ? adminCodeEl.value : '';

            // --- VALIDATION ---
            if (!name || name.length < 2) return showMessage('Enter your full assigned name');
            
            const isEmail = email.includes('@');
            if (isEmail && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return showMessage('Invalid email format');
            
            const signupEmail = isEmail ? email : '';
            const enrollmentId = isEmail ? '' : email;

            // --- ADMIN AUTHORIZATION CHECK REMOVED ---

            if (pass.length < 6) return showMessage('Security Key must be 6+ characters');
            if (pass !== confirm) return showMessage('Security Keys do not match');

            btn.disabled = true;
            btn.innerHTML = '<span><i class="fas fa-spinner fa-spin"></i> INITIALIZING...</span>';

            await new Promise(r => setTimeout(r, 1200));

            const res = auth.signup(signupEmail, name, pass, confirm, role, enrollmentId);

            if (res.success) {
                // Preserve invite parameters for the dashboard
                const urlParams = new URLSearchParams(window.location.search);
                const invite = urlParams.get('invite') || urlParams.get('testId');
                const suffix = invite ? `?invite=${invite}` : '';

                setTimeout(() => {
                    let target = `./student-dashboard.html${suffix}`;
                    if (role === 'teacher') target = './teacher-dashboard.html';
                    else if (role === 'superadmin') target = './admin-dashboard.html';
                    window.location.assign(target);
                }, 1200);
            } else {
                showMessage(res.message);
                btn.disabled = false;
                btn.innerHTML = '<span>GENERATE IDENTITY</span>';
            }
        });
    }

    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value.trim();
            const hcaptcha = document.getElementById('hcaptchaCheck').checked;

            if (!email) return showMessage('Missing identifier');
            if (!hcaptcha) return showMessage('Please verify you are human');

            const btn = forgotForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<span><i class="fas fa-spinner fa-spin"></i> LOGGING IN...</span>';

            await new Promise(r => setTimeout(r, 800));

            const res = auth.login(email, null, false, true);

            if (res.success) {
                const urlParams = new URLSearchParams(window.location.search);
                const testCode = urlParams.get('testId') || urlParams.get('invite') || '';
                const suffix = testCode ? `?testId=${testCode}` : '';

                setTimeout(() => {
                    let target = `./student-dashboard.html${suffix}`;
                    if (res.user.role === 'teacher') target = './teacher-dashboard.html';
                    else if (res.user.role === 'superadmin') target = './admin-dashboard.html';
                    window.location.assign(target);
                }, 1000);
            } else {
                showMessage(res.message);
                btn.disabled = false;
                btn.innerHTML = '<span>Login</span>';
            }
        });
    }
});
// --- DIRECT JOIN LOGIC ---
function showJoinModal(e) {
    if (e) e.preventDefault();
    document.getElementById('joinModal').style.display = 'flex';
}

function closeJoinModal() {
    document.getElementById('joinModal').style.display = 'none';
}

function handleDirectJoin() {
    const testId = document.getElementById('directTestId').value.trim();
    const passcode = document.getElementById('directPasscode').value.trim();

    if (!testId) return showMessage('Test ID is required');

    // Store in session to carry over if login is needed
    sessionStorage.setItem('pending_test_id', testId);
    sessionStorage.setItem('pending_passcode', passcode);

    if (auth.isLoggedIn()) {
        const user = auth.getCurrentUser();
        if (user.role === 'teacher') {
            showMessage('Teachers cannot join exams as students');
            return;
        }
        // Redirect to dashboard with parameters
        window.location.href = `./student-dashboard.html?invite=${testId}&passcode=${passcode}`;
    } else {
        showMessage('Identity required. Please Sign In first.');
        closeJoinModal();
        // The student-dashboard will auto-populate these later
    }
}
/**
 * ERP AI ASSISTANT - UI INTEGRATION
 * Communicates directly with Electron Main Process via secure IPC bridge
 */
async function askAI(promptMessage) {
    try {
        if (!window.proctorBridge || typeof window.proctorBridge.askAI !== 'function') {
            throw new Error("ProctorBridge IPC (askAI) is not exposed or running outside Electron.");
        }

        const response = await window.proctorBridge.askAI(promptMessage);

        if (!response.success) {
            throw new Error(response.error || "Unknown Inference Error");
        }

        return response.reply;

    } catch (error) {
        console.error("AI Assistant IPC Failure:", error);
        return "ERROR: AI Inference Engine offline. Please ensure credentials are valid and you are running within the secure Electron environment.";
    }
}