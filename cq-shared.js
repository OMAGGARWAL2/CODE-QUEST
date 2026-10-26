// ===== CODEQUEST SHARED RESULT / EVALUATION HELPERS =====
// Used by statsteachuni.html, interviewteststats.html, Resultsforjobs.html,
// university-hub.html and university-setup.html. Requires EXAMPAD/js/db.js
// (the `db` global) to be loaded BEFORE this file on evaluation pages.

const CQ = {

    readJSON(k, d) {
        try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; }
        catch (e) { return d; }
    },
    session() {
        return this.readJSON('CodeQuest_active_session', null) || this.readJSON('TESTPAD_current_user', {});
    },
    getTests() { return this.readJSON('CodeQuest_teacher_tests', []); },
    getJobs() { return this.readJSON('CodeQuest_job_postings', []); },
    getUniversities() { return this.readJSON('CodeQuest_universities', []); },

    categories: { practice: 'Practice Test', university: 'University / College Exam', interview: 'Interview Test', selection: 'Selection Test' },
    categoryLabel(c) { return this.categories[c] || 'Practice Test'; },

    // ---- INSTANT APPROVAL: recruiter / university head / superadmin signups need
    // NO ALPHAWINNERS approval — account is live the moment they register ----
    instantRoleFor(roleText) {
        const r = (roleText || '').toLowerCase();
        if (/recruiter|\bhr\b|employer/.test(r)) return 'recruiter';
        if (/university\s*head|head\s*of\s*(the\s*)?university|vice\s*chancellor|pro\s*vice\s*chancellor|registrar|dean\s*university|university\s*dean/.test(r)) return 'university_head';
        if (/super\s*admin/.test(r)) return 'superadmin';
        return '';
    },
    isInstantRole(roleText) { return !!this.instantRoleFor(roleText); },
    // Create/patch the TESTPAD_users account for an approved official application
    upsertOfficialUser(app) {
        const users = this.readJSON('TESTPAD_users', []);
        const uname = String(app.username || '').toLowerCase();
        const uid = String(app.officialId || '').toLowerCase();
        let u = users.find(x =>
            (x.email && String(x.email).toLowerCase() === uname) ||
            (x.rollNo && String(x.rollNo).toLowerCase() === uid));
        if (!u) {
            u = { id: 'cq_off_' + Date.now() };
            users.push(u);
        }
        u.name = app.fullName;
        u.email = app.username;
        u.rollNo = app.officialId;
        u.role = this.instantRoleFor(app.role) || u.role || 'teacher';
        u.designation = app.role || '';
        u.password = app.password;
        u.revoked = false;
        localStorage.setItem('TESTPAD_users', JSON.stringify(users));
        return u;
    },
    // Approve an instant-role application and light up its login account immediately
    instantApproveApp(app) {
        const role = this.instantRoleFor(app.role);
        if (!role || (app.status || 'Pending') !== 'Pending') return false;
        app.status = 'Approved';
        app.approvedAt = new Date().toLocaleString('en-US');
        app.instantApproved = true;
        this.upsertOfficialUser(app);
        return true;
    },
    // Sweep all pending instant-role applications (used at login as a safety net)
    instantApprovePending() {
        const apps = this.readJSON('CodeQuest_official_applications', []);
        let changed = false;
        apps.forEach(a => { if (this.instantApproveApp(a)) changed = true; });
        if (changed) localStorage.setItem('CodeQuest_official_applications', JSON.stringify(apps));
        return changed;
    },

    // ---- FORM NUMBERS: auto-assigned per job role (legacy postings backfilled lazily) ----
    ensureFormNumbers() {
        const jobs = this.getJobs();
        let changed = false;
        jobs.forEach(j => {
            if (!j.formNumber) {
                const initials = (j.title || 'JOB').split(/\s+/).map(w => w.charAt(0)).join('').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4) || 'JOB';
                const year = new Date().getFullYear();
                let seq = 1;
                jobs.forEach(o => {
                    const m = /^FORM-([A-Z]+)-(\d{4})-(\d{3})$/.exec(o.formNumber || '');
                    if (m && m[1] === initials && parseInt(m[3]) >= seq) seq = parseInt(m[3]) + 1;
                });
                j.formNumber = 'FORM-' + initials + '-' + year + '-' + String(seq).padStart(3, '0');
                changed = true;
            }
        });
        if (changed) { try { localStorage.setItem('CodeQuest_job_postings', JSON.stringify(jobs)); } catch (e) {} }
        return jobs;
    },
    jobFor(jobId) {
        if (!jobId) return null;
        return this.ensureFormNumbers().find(j => String(j.id) === String(jobId)) || null;
    },

    // ---- EXAM RESOLUTION: a CodeQuest_teacher_tests record id may be the db id or the human testId ----
    examFor(testKey) {
        testKey = String(testKey || '');
        if (typeof db === 'undefined' || !testKey) return null;
        return db.getExamById(testKey) || null;
    },
    // Every db exam matching a dashboard record (covers both id and testId conventions)
    examForTest(t) {
        if (!t) return null;
        return this.examFor(t.id) || this.examFor(t.code) || null;
    },

    gradeFor(pct) {
        if (pct >= 90) return { letter: 'A+', color: '#059669', bg: '#ECFDF5' };
        if (pct >= 80) return { letter: 'A', color: '#059669', bg: '#ECFDF5' };
        if (pct >= 70) return { letter: 'B', color: '#2563EB', bg: '#EFF6FF' };
        if (pct >= 60) return { letter: 'C', color: '#D97706', bg: '#FEF3C7' };
        if (pct >= 50) return { letter: 'D', color: '#D97706', bg: '#FEF3C7' };
        return { letter: 'F', color: '#DC2626', bg: '#FEF2F2' };
    },

    formatTimeTaken(a) {
        if (!a) return '--';
        let startMs = a.startTime;
        if (typeof startMs === 'string') startMs = new Date(startMs).getTime();
        if (!startMs || isNaN(startMs)) return '--';
        let endMs = a.submitTime || a.endTime || Date.now();
        if (typeof endMs === 'string') endMs = new Date(endMs).getTime();
        if (!endMs || isNaN(endMs)) endMs = Date.now();
        const diffMs = Math.max(0, endMs - startMs);
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        if (isNaN(mins) || isNaN(secs)) return '--';
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    },

    // ---- EVALUATION ROWS: same scoring pipeline as exam-evaluation.html ----
    resultRows(exam) {
        if (typeof db === 'undefined' || !exam) return [];
        const raw = (db.getExamAttempts ? db.getExamAttempts(exam.id) : []) || [];
        const attempts = raw.filter(a => a && ['submitted', 'reviewed', 'graded', 'completed'].includes(a.status));
        const questions = exam.questions || [];

        return attempts.map(a => {
            const user = (db.getUserById && a.studentId) ? db.getUserById(a.studentId) : null;
            let scoreObj = { score: 0, totalMarks: 0, percentage: 0 };
            try { scoreObj = db.calculateScore(a) || scoreObj; } catch (e) {}
            const pct = parseFloat(scoreObj.percentage) || 0;

            const studentQs = db.getAttemptQuestions ? db.getAttemptQuestions(a, exam) : questions;
            const assignedIds = new Set((studentQs || []).map(q => String(q.id)));

            let correct = 0, wrong = 0, skipped = 0;
            const perQuestion = [];

            questions.forEach(q => {
                if (!assignedIds.has(String(q.id))) { perQuestion.push(null); return; }
                let resp = null;
                if (a && a.responses) {
                    if (Array.isArray(a.responses)) resp = a.responses.find(r => r && (r.questionId === q.id || r.id === q.id));
                    else resp = a.responses[q.id];
                }
                let attempted = false;
                if (resp) {
                    if (typeof resp === 'string' && resp.trim() !== '') attempted = true;
                    else if (typeof resp === 'object' && resp !== null) {
                        if (resp.value !== undefined && resp.value !== null && String(resp.value).trim() !== '') attempted = true;
                        if (resp.manualMark !== undefined && resp.manualMark !== null) attempted = true;
                    }
                }
                let qMark = 0;
                if (!attempted || !resp) { skipped++; }
                else if (typeof resp === 'object' && resp.manualMark !== undefined && resp.manualMark !== null) {
                    qMark = parseFloat(resp.manualMark) || 0;
                    if (qMark > 0) correct++; else wrong++;
                } else if (!['subjective', 'coding', 'file_upload', 'drawing'].includes(q.type)) {
                    let isCorrect = false;
                    try { isCorrect = db.checkAnswer(q, resp); } catch (e) { isCorrect = false; }
                    if (isCorrect) { qMark = parseFloat(q.marks) || 1; correct++; } else wrong++;
                }
                // Answered subjective/coding questions stay neutral (manual review) - not skipped, not correct/wrong
                perQuestion.push(qMark);
            });

            const rollNo = (user && (user.rollNo || user.rollNumber)) || a.studentRollNo || a.studentId || 'N/A';
            return {
                attemptId: a.id,
                studentId: a.studentId || '',
                name: (user && user.name) || a.studentName || 'Student',
                rollNo: String(rollNo),
                email: (user && user.email) || '',
                correct, wrong, skipped,
                perQuestion,
                score: scoreObj.score || 0,
                totalMarks: scoreObj.totalMarks || 0,
                percentage: pct,
                grade: this.gradeFor(pct),
                startTime: a.startTime || '',
                endTime: a.endTime || a.submitTime || '',
                timeTaken: this.formatTimeTaken(a)
            };
        });
    },

    // ---- PUBLISHED RESULTS STORE ----
    publishedStore() { return this.readJSON('CodeQuest_published_results', {}); },
    getPublished(testKey) { return this.publishedStore()[String(testKey)] || null; },
    publishResults(testKey, payload) {
        const store = this.publishedStore();
        payload.publishedAt = new Date().toISOString();
        store[String(testKey)] = payload;
        localStorage.setItem('CodeQuest_published_results', JSON.stringify(store));
        // Flag the dashboard record too so lists can show a "Published" chip
        const tests = this.getTests();
        const t = tests.find(x => String(x.id || x.code) === String(testKey));
        if (t) {
            t.resultsPublished = true;
            t.publishedAt = payload.publishedAt;
            localStorage.setItem('CodeQuest_teacher_tests', JSON.stringify(tests));
        }
        return payload;
    },

    // ---- STUDENT-SIDE IDENTITY MATCHING ----
    isMyResult(r) {
        if (!r) return false;
        const s = this.session();
        const myIds = [s.userId, s.id, s.rollNo, s.regNo, s.roll, s.email]
            .filter(Boolean).map(x => String(x).toLowerCase());
        if (!myIds.length) return false;
        return myIds.includes(String(r.studentId || '').toLowerCase())
            || myIds.includes(String(r.rollNo || '').toLowerCase())
            || (r.email && myIds.includes(String(r.email).toLowerCase()));
    },

    // My attempt rows for a test (used on student pages to show "attempted, awaiting publication")
    myAttemptFor(examKey) {
        if (typeof db === 'undefined' || !examKey) return null;
        const exam = this.examFor(examKey);
        if (!exam) return null;
        const attempts = (db.getExamAttempts ? db.getExamAttempts(exam.id) : []) || [];
        const s = this.session();
        const myIds = [s.userId, s.id, s.rollNo, s.regNo, s.roll, s.email]
            .filter(Boolean).map(x => String(x).toLowerCase());
        return attempts.find(a => a && ['submitted', 'reviewed', 'graded', 'completed'].includes(a.status) && (
            myIds.includes(String(a.studentId || '').toLowerCase()) ||
            myIds.includes(String(a.studentRollNo || '').toLowerCase())
        )) || null;
    }
};
