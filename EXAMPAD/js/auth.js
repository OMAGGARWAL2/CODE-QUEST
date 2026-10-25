// ===== TESTPAD AUTHENTICATION =====

class Auth {
    constructor() {
        this.currentUser = null;
        this.currentSession = null;
        this.loginAttempts = 0;
        this.MAX_ATTEMPTS = 5;
        this.loadSession();
    }

    loadSession() {
        // First check persistent storage if 'Remember Me' was used
        const savedUser = localStorage.getItem('TESTPAD_remembered_user');
        const activeSession = db.getActiveSession();

        if (activeSession) {
            const user = db.getUserById(activeSession.userId);
            if (user) {
                this.currentUser = user;
                this.currentSession = activeSession;
                return;
            }
        }

        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                // Create a fresh session for the remembered user
                const session = db.createSession(user.id, user.role);
                this.currentUser = user;
                this.currentSession = session;
            } catch (e) {
                console.error("Remembered session restoration failed");
            }
        }
    }

    signup(email, name, password, confirmPassword, role, rollNo) {
        if (!name || !password || !role) {
            return { success: false, message: 'Identity parameters incomplete' };
        }

        if (password !== confirmPassword) {
            return { success: false, message: 'Security keys do not match' };
        }

        if (password.length < 6) {
            return { success: false, message: 'Security key too short (min 6 charts)' };
        }

        // Check availability
        if (email && db.getUser(email)) {
            return { success: false, message: 'Email address already integrated' };
        }
        if (rollNo && db.getUserByRollNo(rollNo)) {
            return { success: false, message: 'Enrollment Id already integrated' };
        }

        const user = db.addUser({
            email,
            rollNo,
            name,
            password,
            role,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        });

        const session = db.createSession(user.id, role);
        this.currentUser = user;
        this.currentSession = session;

        // Auto-remember credentials for ease
        this.saveLastCredentials(email || rollNo, password, role);

        return { success: true, message: 'Signup successful', user, session };
    }

    login(identifier, password, remember = false, isBypass = false) {
        if (this.loginAttempts >= this.MAX_ATTEMPTS) {
            return { success: false, message: 'Too many failed attempts. Account locked temporarily.' };
        }

        if (!identifier || (!password && !isBypass)) {
            return { success: false, message: 'Credentials required' };
        }

        const user = isBypass ? (db.getUser(identifier) || db.getUserByRollNo(identifier)) : db.authenticateUser(identifier, password);
        if (!user) {
            if (!isBypass) this.loginAttempts++;
            const remaining = this.MAX_ATTEMPTS - this.loginAttempts;
            return {
                success: false,
                message: isBypass ? "Student identifier not found." : `Invalid credentials. ${remaining} attempts remaining.`
            };
        }

        // Reset attempts on success
        this.loginAttempts = 0;

        const session = db.createSession(user.id, user.role);
        this.currentUser = user;
        this.currentSession = session;

        // Always save last credentials for "easy" login as requested, 
        // regardless of 'remember' session flag
        if (!isBypass) {
            this.saveLastCredentials(identifier, password, user.role);
        }

        if (remember) {
            localStorage.setItem('TESTPAD_remembered_user', JSON.stringify(user));
        }

        return { success: true, message: 'Login successful', user, session };
    }

    saveLastCredentials(email, password, role) {
        try {
            let history = [];
            const raw = localStorage.getItem('TESTPAD_login_history');
            if (raw) {
                history = JSON.parse(raw);
            }

            // Remove if already exists to move to top
            history = history.filter(item => atob(item.e) !== email);

            // Add new entry at start
            history.unshift({
                e: btoa(email),
                p: btoa(password),
                r: role,
                t: Date.now()
            });

            // Limit to 10
            if (history.length > 10) {
                history = history.slice(0, 10);
            }

            localStorage.setItem('TESTPAD_login_history', JSON.stringify(history));
            
            // Keep legacy single entry for backward compatibility if needed
            const legacyData = {
                e: btoa(email),
                p: btoa(password),
                r: role,
                t: Date.now()
            };
            localStorage.setItem('TESTPAD_last_access', JSON.stringify(legacyData));
        } catch (e) {
            console.error("Storage of login history failed", e);
        }
    }

    getSavedCredentials() {
        const raw = localStorage.getItem('TESTPAD_last_access');
        if (!raw) return null;
        try {
            const data = JSON.parse(raw);
            return {
                email: atob(data.e),
                password: atob(data.p),
                role: data.r
            };
        } catch (e) {
            return null;
        }
    }

    getAllSavedCredentials() {
        try {
            const raw = localStorage.getItem('TESTPAD_login_history');
            if (!raw) return [];
            const history = JSON.parse(raw);
            return history.map(data => ({
                email: atob(data.e),
                password: atob(data.p),
                role: data.r,
                timestamp: data.t
            }));
        } catch (e) {
            console.error("Failed to retrieve login history", e);
            return [];
        }
    }

    forgotPassword(email) {
        const user = db.getUser(email);
        if (!user) return { success: false, message: 'System identifier not found' };

        // Simulation of a professional flow
        const otp = Math.floor(100000 + Math.random() * 900000);
        console.log(`[AUTH DEBUG] Password Reset OTP for ${email}: ${otp}`);

        return {
            success: true,
            message: 'A verification pulse with a reset code has been sent to your educational email.'
        };
    }

    logout() {
        if (this.currentSession) {
            db.endSession(this.currentSession.sessionId);
        }
        this.currentUser = null;
        this.currentSession = null;
        localStorage.removeItem('TESTPAD_remembered_user');
        // Note: We intentionally keep 'TESTPAD_last_access' for the auto-fill feature
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentRole() {
        return this.currentUser ? this.currentUser.role : null;
    }

    isTeacher() { return this.getCurrentRole() === 'teacher'; }
    isStudent() { return this.getCurrentRole() === 'student'; }
    isSuperAdmin() { return this.getCurrentRole() === 'superadmin'; }
}

const auth = new Auth();
