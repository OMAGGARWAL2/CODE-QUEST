// ===== TESTPAD SECURITY MODULE =====
/**
 * Professional-Grade Silent Proctoring Engine
 * This module manages low-level security violations silently to ensure 
 * assessment integrity without disrupting honest candidates.
 */
class ExamSecurity {
    constructor(attemptId, isPractice = false) {
        this.attemptId = attemptId;
        this.isPractice = isPractice;
        this.tabSwitchCount = 0;
        this.copyPasteCount = 0;
        this.init();
    }

    init() {
        this.disableCopyPaste();
        this.detectTabSwitch();
        this.detectWindowFocus();
        this.disableInspectElement();
        this.startSecurityMonitoring();
    }

    // ===== PRE-EXAM SYSTEM CHECKS =====
    async runPreExamChecks(options = { video: true, audio: true }) {
        const results = { vpn: false, media: false, error: null };
        try {
            results.vpn = await this.detectVPN();
            if (options.video || options.audio) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: options.video,
                    audio: options.audio
                });
                this.currentMediaStream = stream;
                results.media = true;
            } else {
                results.media = true;
            }
            return results;
        } catch (err) {
            results.error = err.message || "Permission Denied";
            return results;
        }
    }

    // ===== COPY-PASTE PREVENTION =====
    disableCopyPaste() {
        // Silent blocking of all clipboard operations
        document.addEventListener('copy', (e) => {
            if (this.isPractice) return;
            e.preventDefault();
            this.recordCopyPasteAttempt();
        });

        document.addEventListener('cut', (e) => {
            if (this.isPractice) return;
            e.preventDefault();
            this.recordCopyPasteAttempt();
        });

        document.addEventListener('paste', (e) => {
            if (this.isPractice) return;
            e.preventDefault();
            this.recordCopyPasteAttempt();
        });

        // GLOBAL: Disable right-click context menu (SILENT)
        document.addEventListener('contextmenu', (e) => {
            if (this.isPractice) return;
            e.preventDefault();
            return false;
        });

        document.addEventListener('dragstart', (e) => {
            if (this.isPractice) return;
            e.preventDefault();
        });
    }

    // ===== TAB SWITCH DETECTION =====
    detectTabSwitch() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.tabSwitchCount++;
                this.recordTabSwitch();
                // SILENT: No alert/overlay shown. Just logging and counting.
                this.logWarning('Student switched tabs/windows');
            }
        });

        if (window.proctorBridge) {
            window.proctorBridge.onSystemEvent((data) => {
                if (data.type === 'FOCUS_LOST') {
                    this.tabSwitchCount++;
                    this.recordTabSwitch();
                    // SILENT: NO LOCKSCREEN SHOWN
                    console.warn(`[SECURE] Focus lost event captured silently.`);
                } else if (data.type === 'ILLEGAL_INPUT') {
                    // SILENT: Action was already blocked in main process
                    console.warn(`[SECURE] Illegal input blocked: ${data.message}`);
                }
            });
        }
    }

    // ===== WINDOW FOCUS DETECTION =====
    detectWindowFocus() {
        window.addEventListener('beforeunload', (e) => {
            if (document.querySelector('[data-exam-active="true"]')) {
                e.preventDefault();
                e.returnValue = 'Secure session active. Exit via dashboard only.';
                return e.returnValue;
            }
        });
    }

    // ===== DISABLE DEVELOPER TOOLS & NAVIGATION =====
    disableInspectElement() {
        document.addEventListener('keydown', (e) => {
            // SILENT BLOCKING: No alerts, just preventDefault

            // F12 (DevTools)
            if (e.key === 'F12') e.preventDefault();

            // F5 / Command+R (Refresh)
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')) {
                e.preventDefault();
            }

            // Ctrl+Shift+I / Ctrl+Shift+J (Inspect / Console)
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) {
                e.preventDefault();
            }

            // Ctrl+S (Save Page)
            if (e.ctrlKey && e.key === 's') e.preventDefault();

            // Ctrl+W (Close Tab)
            if (e.ctrlKey && e.key === 'w') e.preventDefault();
        });
    }

    // ===== MONITORING & LOGGING =====
    recordTabSwitch() {
        if (this.isPractice) return; // Silent skip for practice tests
        if (typeof db !== 'undefined' && this.attemptId) {
            const attempt = db.getAttempt(this.attemptId);
            if (attempt) {
                attempt.tabSwitchCount = (attempt.tabSwitchCount || 0) + 1;
                db.updateAttempt(this.attemptId, { tabSwitchCount: attempt.tabSwitchCount });

                // Signal any UI listeners (like header counters)
                window.dispatchEvent(new CustomEvent('proctorViolation', {
                    detail: { type: 'TAB_SWITCH', count: attempt.tabSwitchCount }
                }));
            }
        }
    }

    recordCopyPasteAttempt() {
        if (this.isPractice) return; // Silent skip for practice tests
        if (typeof db !== 'undefined' && this.attemptId) {
            const attempt = db.getAttempt(this.attemptId);
            if (attempt) {
                attempt.copyPasteAttempts = (attempt.copyPasteAttempts || 0) + 1;
                db.updateAttempt(this.attemptId, { copyPasteAttempts: attempt.copyPasteAttempts });
            }
        }
    }

    startSecurityMonitoring() {
        setInterval(() => {
            this.checkConnectionStatus();
        }, 30000);
    }

    checkConnectionStatus() {
        if (!navigator.onLine) {
            // We keep this one as it's critical infrastructure, not a cheating violation
            console.warn('Network connectivity is offline.');
        }
    }

    // ALERTS: SILENCED for proctoring violations
    showAlert(message) {
        console.warn(`[SILENT-ALERT] ${message}`);
        // We do not show UI toasts for security blocking anymore as per UX requirements.
    }

    async detectVPN() {
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const isSuspicious = browserTimezone.includes('Etc/GMT') || browserTimezone.includes('UTC');
        return isSuspicious;
    }

    logWarning(message) {
        console.warn('[SILENT-BLOCK]', message);
    }
}

/**
 * Note: Sticky lockscreens and intrusive popups have been removed 
 * for a more professional and seamless "Secure Browser" experience.
 */