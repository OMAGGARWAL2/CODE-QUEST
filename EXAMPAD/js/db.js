// ===== TESTPAD DATABASE (LocalStorage) =====

class TestpadDB {
    constructor() {
        this.initializeDB();
    }

    clearAllData() {
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
        }
        this.initializeDB();
        console.log('[TESTPAD DB] All local data successfully cleared.');
    }

    initializeDB() {
        if (typeof localStorage === 'undefined') return;
        if (!localStorage.getItem('TESTPAD_users')) {
            localStorage.setItem('TESTPAD_users', JSON.stringify([]));
        }
        if (!localStorage.getItem('TESTPAD_exams')) {
            localStorage.setItem('TESTPAD_exams', JSON.stringify([]));
        }
        if (!localStorage.getItem('TESTPAD_attempts')) {
            localStorage.setItem('TESTPAD_attempts', JSON.stringify([]));
        }
        if (!localStorage.getItem('TESTPAD_sessions')) {
            localStorage.setItem('TESTPAD_sessions', JSON.stringify([]));
        }
        if (!localStorage.getItem('TESTPAD_question_pool')) {
            localStorage.setItem('TESTPAD_question_pool', JSON.stringify([]));
        }
        if (!localStorage.getItem('TESTPAD_courses')) {
            localStorage.setItem('TESTPAD_courses', JSON.stringify([]));
        }
        if (!localStorage.getItem('TESTPAD_course_progress')) {
            localStorage.setItem('TESTPAD_course_progress', JSON.stringify([]));
        }
        if (!localStorage.getItem('TESTPAD_transactions')) {
            localStorage.setItem('TESTPAD_transactions', JSON.stringify([]));
        }
        if (!localStorage.getItem('TESTPAD_circulars')) {
            localStorage.setItem('TESTPAD_circulars', JSON.stringify([]));
        }
        if (!localStorage.getItem('TESTPAD_practice_sessions')) {
            localStorage.setItem('TESTPAD_practice_sessions', JSON.stringify({}));
        }
        if (!localStorage.getItem('TESTPAD_bookmarks')) {
            localStorage.setItem('TESTPAD_bookmarks', JSON.stringify({}));
        }
    }

    // ===== CIRCULAR MANAGEMENT =====
    addCircular(circularData) {
        const circulars = JSON.parse(localStorage.getItem('TESTPAD_circulars')) || [];
        const circular = {
            ...circularData,
            id: 'CIRC_' + Date.now(),
            timestamp: new Date().toISOString()
        };
        circulars.push(circular);
        localStorage.setItem('TESTPAD_circulars', JSON.stringify(circulars));
        return circular;
    }

    getCirculars() {
        return JSON.parse(localStorage.getItem('TESTPAD_circulars')) || [];
    }

    // ===== QUESTION POOL =====
    addToQuestionPool(question) {
        const pool = JSON.parse(localStorage.getItem('TESTPAD_question_pool')) || [];

        const poolItem = {
            ...question,
            poolId: 'qpool_' + Date.now(),
            addedAt: new Date().toISOString()
        };
        pool.push(poolItem);
        localStorage.setItem('TESTPAD_question_pool', JSON.stringify(pool));
        return poolItem;
    }

    getQuestionPool() {
        return JSON.parse(localStorage.getItem('TESTPAD_question_pool')) || [];
    }

    getQuestionFromPool(id) {
        const pool = this.getQuestionPool();
        return pool.find(q => q.id === id || q.poolId === id);
    }

    getQuestionById(questionId, examId) {
        // Try pool first
        let q = this.getQuestionFromPool(questionId);
        if (q) return q;

        // Try exam context
        if (examId) {
            const exam = this.getExamById(examId);
            if (exam) {
                return exam.questions.find(q => q.id === questionId);
            }
        }
        return null;
    }

    // ===== USER MANAGEMENT =====
    addUser(userData) {
        const users = JSON.parse(localStorage.getItem('TESTPAD_users')) || [];
        const id = 'user_' + Date.now();
        const user = {
            id,
            email: userData.email || '',
            rollNo: userData.rollNo || (userData.email ? userData.email.split('@')[0] : id.toUpperCase()),
            name: userData.name,
            password: this.hashPassword(userData.password),
            role: userData.role, // 'teacher' or 'student'
            createdAt: new Date().toISOString()
        };
        users.push(user);
        localStorage.setItem('TESTPAD_users', JSON.stringify(users));
        return user;
    }

    updateUser(userId, updateData) {
        const users = JSON.parse(localStorage.getItem('TESTPAD_users')) || [];
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updateData };
            localStorage.setItem('TESTPAD_users', JSON.stringify(users));
            return users[index];
        }
        return null;
    }

    getUser(identifier) {
        if (!identifier) return null;
        const users = JSON.parse(localStorage.getItem('TESTPAD_users')) || [];
        const target = identifier.toLowerCase();
        return users.find(u =>
            (u.email && u.email.toLowerCase() === target) ||
            (u.rollNo && u.rollNo.toString().toLowerCase() === target)
        );
    }

    getUserById(userId) {
        const users = JSON.parse(localStorage.getItem('TESTPAD_users')) || [];
        return users.find(u => u.id === userId);
    }

    getUserByRollNo(roll) {
        const users = JSON.parse(localStorage.getItem('TESTPAD_users')) || [];
        return users.find(u => u.rollNo === roll);
    }

    authenticateUser(identifier, password) {
        const user = this.getUser(identifier);
        if (user && user.password === this.hashPassword(password)) {
            return user;
        }
        return null;
    }

    updatePassword(email, newPassword) {
        const users = JSON.parse(localStorage.getItem('TESTPAD_users')) || [];
        const index = users.findIndex(u => u.email === email);
        if (index !== -1) {
            users[index].password = this.hashPassword(newPassword);
            localStorage.setItem('TESTPAD_users', JSON.stringify(users));
            return true;
        }
        return false;
    }

    // ===== EXAM MANAGEMENT =====
    createExam(examData, teacherId) {
        const exams = JSON.parse(localStorage.getItem('TESTPAD_exams')) || [];
        const id = 'exam_' + Date.now();
        const testId = this.generateTestId();
        const passcode = this.generatePasscode();

        const exam = {
            id,
            testId: examData.testId || this.generateTestId(),
            passcode: (examData.security && examData.security.passcode) || examData.passcode || this.generatePasscode(),
            teacherId,
            title: examData.title,
            description: examData.description,
            duration: examData.duration, // in minutes
            totalMarks: examData.totalMarks,
            negativeMarking: examData.negativeMarking || 0,
            credits: examData.credits || 1,
            questions: examData.questions || [],
            scheduledDate: examData.scheduledDate || null,
            scheduledEndDate: examData.scheduledEndDate || null,
            isUniversalTime: examData.isUniversalTime || false,
            wifiRestriction: examData.wifiRestriction || false,
            allowedWifi: examData.allowedWifi || null,
            sections: examData.sections || [],
            languages: examData.languages || ['JavaScript'],
            pools: examData.pools || {},
            identityFields: examData.identityFields || [],
            theme: examData.theme || { primaryColor: '#D96C33' },
            sectionLockEnabled: examData.sectionLockEnabled || false,
            isCompetitive: examData.isCompetitive || false,
            candidates: examData.candidates || [],
            // CodeQuest publishing metadata (audience, category, job/university linkage)
            audience: examData.audience || 'universal',
            batchIds: examData.batchIds || [],
            jobId: examData.jobId || '',
            registeredOnly: !!examData.registeredOnly,
            passingCriteria: examData.passingCriteria || '',
            testCategory: examData.testCategory || '',
            universityId: examData.universityId || '',
            createdAt: new Date().toISOString(),
            status: examData.status || 'draft',
            security: examData.security || {}
        };

        exams.push(exam);
        localStorage.setItem('TESTPAD_exams', JSON.stringify(exams));
        return exam;
    }

    getAllExams() {
        return JSON.parse(localStorage.getItem('TESTPAD_exams')) || [];
    }

    getExamById(id) {
        const exams = JSON.parse(localStorage.getItem('TESTPAD_exams')) || [];
        return exams.find(e => e.id === id || e.testId === id);
    }

    getExamByJoiningKey(key) {
        const exams = JSON.parse(localStorage.getItem('TESTPAD_exams')) || [];
        return exams.find(e => e.joiningKey === key);
    }

    getExamByTestId(testId) {
        const exams = JSON.parse(localStorage.getItem('TESTPAD_exams')) || [];
        if (!testId) return null;
        const target = testId.trim().toUpperCase();
        return exams.find(e => e.testId && e.testId.toUpperCase() === target);
    }

    getTeacherExams(teacherId) {
        const exams = JSON.parse(localStorage.getItem('TESTPAD_exams')) || [];
        return exams.filter(e => e.teacherId === teacherId);
    }

    updateExam(examId, updateData) {
        const exams = JSON.parse(localStorage.getItem('TESTPAD_exams')) || [];
        const index = exams.findIndex(e => e.id === examId);
        if (index !== -1) {
            exams[index] = { ...exams[index], ...updateData };
            localStorage.setItem('TESTPAD_exams', JSON.stringify(exams));
            return exams[index];
        }
        return null;
    }

    // ===== ATTEMPT/SESSION MANAGEMENT =====
    startAttempt(examId, studentId, isReattempt = false) {
        const attempts = JSON.parse(localStorage.getItem('TESTPAD_attempts')) || [];

        // Check if student already attempted - Return existing if found for seamless resume
        const existingAttempt = attempts.find(a => a.examId === examId && a.studentId === studentId);
        if (existingAttempt) {
            if (isReattempt) {
                console.log("[RE-ATTEMPT] Resetting existing attempt for a fresh start:", existingAttempt.id);
                existingAttempt.status = 'in-progress';
                existingAttempt.responses = {};
                existingAttempt.startTime = new Date().toISOString();
                existingAttempt.endTime = null;
                existingAttempt.score = null;
                existingAttempt.feedback = null;
                existingAttempt.submittedSections = [];
                existingAttempt.tabSwitchCount = 0;
                existingAttempt.examStarted = false;
                existingAttempt.isReattempt = true;

                // Re-run randomization if exam exists
                const exam = this.getExamById(examId);
                if (exam) {
                    const shuffleArray = (array) => {
                        const shuffled = [...array];
                        for (let i = shuffled.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                        }
                        return shuffled;
                    };
                    const allQuestions = exam.questions || [];
                    const sectionsMap = {};
                    allQuestions.forEach(q => {
                        const s = q.section || 'General';
                        if (!sectionsMap[s]) sectionsMap[s] = [];
                        sectionsMap[s].push(q);
                    });
                    const sections = exam.sections && exam.sections.length > 0 ? exam.sections : ['General'];
                    let selectedQuestions = [];
                    sections.forEach(sName => {
                        const secPool = sectionsMap[sName] || [];
                        const poolConfig = exam.pools ? exam.pools[sName] : null;
                        const poolEnabled = poolConfig && (poolConfig.enabled === true || poolConfig.enabled === 'true');
                        const poolSize = poolEnabled ? parseInt(poolConfig.pickCount || 0) : 0;
                        let pickedFromSection = [];
                        if (poolEnabled && poolSize > 0 && poolSize < secPool.length) {
                            pickedFromSection = shuffleArray(secPool).slice(0, poolSize);
                        } else {
                            pickedFromSection = shuffleArray(secPool);
                        }
                        pickedFromSection = pickedFromSection.map(q => {
                            if (q.type === 'mcq' && q.shuffleOptions && q.options) {
                                return { ...q, options: shuffleArray(q.options) };
                            }
                            return q;
                        });
                        selectedQuestions.push(...pickedFromSection);
                    });
                    if (selectedQuestions.length > 0) {
                        existingAttempt.selectedQuestions = selectedQuestions;
                        existingAttempt.selectedQuestionIds = selectedQuestions.map(q => q.id);
                    }
                }

                localStorage.setItem('TESTPAD_attempts', JSON.stringify(attempts));
                return { success: true, attempt: existingAttempt, message: 'Re-started existing attempt' };
            }
            return { success: false, existingAttempt, message: 'Resuming existing attempt' };
        }

        const id = 'attempt_' + Date.now();
        const exam = this.getExamById(examId);

        // --- RANDOMIZATION & SHUFFLING LOGIC ---
        let selectedQuestions = [];

        const shuffleArray = (array) => {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };

        if (exam) {
            const allQuestions = exam.questions || [];
            const sectionsMap = {};
            allQuestions.forEach(q => {
                const s = q.section || 'General';
                if (!sectionsMap[s]) sectionsMap[s] = [];
                sectionsMap[s].push(q);
            });

            const sections = exam.sections && exam.sections.length > 0 ? exam.sections : ['General'];

            sections.forEach(sName => {
                const secPool = sectionsMap[sName] || [];
                const poolConfig = exam.pools ? exam.pools[sName] : null;
                const poolEnabled = poolConfig && (poolConfig.enabled === true || poolConfig.enabled === 'true');
                const poolSize = poolEnabled ? parseInt(poolConfig.pickCount || 0) : 0;

                let pickedFromSection = [];
                if (poolEnabled && poolSize > 0 && poolSize < secPool.length) {
                    pickedFromSection = shuffleArray(secPool).slice(0, poolSize);
                } else {
                    pickedFromSection = shuffleArray(secPool); // Still shuffle order even if picking all
                }

                // Shuffle Options for MCQs if enabled
                pickedFromSection = pickedFromSection.map(q => {
                    if (q.type === 'mcq' && q.shuffleOptions && q.options) {
                        return {
                            ...q,
                            options: shuffleArray(q.options)
                        };
                    }
                    return q;
                });

                selectedQuestions.push(...pickedFromSection);
            });
        }

        const attempt = {
            id,
            examId,
            studentId,
            startTime: new Date().toISOString(),
            endTime: null,
            responses: {}, // questionId -> response
            sectionStatus: {}, // track which sections are locked/completed
            submittedSections: [],
            tabSwitchCount: 0,
            tabInCount: 0,
            fsExitCount: 0,
            fsInCount: 0,
            copyPasteAttempts: 0,
            status: 'in-progress', // in-progress, submitted, reviewed
            score: null,
            feedback: null,
            selectedQuestions: selectedQuestions.length > 0 ? selectedQuestions : null,
            selectedQuestionIds: selectedQuestions.map(q => q.id)
        };

        attempts.push(attempt);
        localStorage.setItem('TESTPAD_attempts', JSON.stringify(attempts));
        return { success: true, attempt };
    }

    getAttempt(attemptId) {
        if (!attemptId) return null;
        const attempts = JSON.parse(localStorage.getItem('TESTPAD_attempts')) || [];
        const attempt = attempts.find(a => a.id === attemptId);
        if (attempt) return attempt;

        // Fallback: Check Practice Sessions
        const sessions = JSON.parse(localStorage.getItem('TESTPAD_practice_sessions')) || {};
        // Practice sessions usually indexed by itemId, so we search all values
        const sessionAttempt = Object.values(sessions).find(s => s.id === attemptId);
        if (sessionAttempt) return sessionAttempt;

        // If attemptId is actually the itemId
        if (sessions[attemptId]) return sessions[attemptId];

        return null;
    }

    getAttemptHistory(studentId, examId) {
        const attempts = JSON.parse(localStorage.getItem('TESTPAD_attempts')) || [];
        const filtered = attempts.filter(a => a.studentId === studentId && a.examId === examId);

        const sessions = JSON.parse(localStorage.getItem('TESTPAD_practice_sessions')) || {};
        const sessionMatches = Object.values(sessions).filter(s => s && s.studentId === studentId && s.examId === examId);

        const combined = [...filtered, ...sessionMatches];
        const unique = {};
        combined.forEach(a => {
            if (a && a.id) {
                if (!unique[a.id] || (a.responses && Object.keys(a.responses).length > Object.keys(unique[a.id].responses || {}).length)) {
                    unique[a.id] = a;
                }
            }
        });

        return Object.values(unique).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    }

    updateAttempt(attemptId, updateData) {
        // 1. Try regular attempts
        const attempts = JSON.parse(localStorage.getItem('TESTPAD_attempts')) || [];
        const index = attempts.findIndex(a => a.id === attemptId);
        if (index !== -1) {
            attempts[index] = { ...attempts[index], ...updateData };
            localStorage.setItem('TESTPAD_attempts', JSON.stringify(attempts));
            return attempts[index];
        }

        // 2. Try practice sessions
        const sessions = JSON.parse(localStorage.getItem('TESTPAD_practice_sessions')) || {};
        let targetKey = null;
        if (sessions[attemptId]) targetKey = attemptId;
        else {
            targetKey = Object.keys(sessions).find(k => sessions[k].id === attemptId);
        }

        if (targetKey) {
            sessions[targetKey] = { ...sessions[targetKey], ...updateData };
            localStorage.setItem('TESTPAD_practice_sessions', JSON.stringify(sessions));
            return sessions[targetKey];
        }
        return null;
    }

    updateAttemptResponse(attemptId, questionId, response) {
        const attempt = this.getAttempt(attemptId);
        if (attempt) {
            attempt.responses[questionId] = response;
            return this.updateAttempt(attemptId, { responses: attempt.responses });
        }
        return false;
    }

    submitAttempt(attemptId) {
        const attempt = this.getAttempt(attemptId);
        if (attempt) {
            const scoreObj = this.calculateScore(attempt);
            const update = {
                endTime: new Date().toISOString(),
                status: 'submitted',
                score: scoreObj.score,
                totalMarks: scoreObj.totalMarks,
                percentage: scoreObj.percentage,
                sectionBreakdown: scoreObj.sectionBreakdown,
                scoreDetails: scoreObj
            };
            return this.updateAttempt(attemptId, update);
        }
        return null;
    }

    getStudentAttempts(studentId) {
        const attempts = JSON.parse(localStorage.getItem('TESTPAD_attempts')) || [];
        const user = this.getUserById(studentId);
        return attempts.filter(a => {
            if (a.studentId === studentId) return true;
            if (user && user.rollNo) {
                if (String(a.rollNo) === String(user.rollNo)) return true;
                if (String(a.studentId) === String(user.rollNo)) return true;
            }
            return false;
        });
    }

    getExamAttempts(examId) {
        const attempts = JSON.parse(localStorage.getItem('TESTPAD_attempts')) || [];
        return attempts.filter(a => a.examId === examId);
    }

    // ===== COURSE MANAGEMENT =====
    createCourse(courseData, teacherId) {
        const courses = JSON.parse(localStorage.getItem('TESTPAD_courses')) || [];
        const id = 'course_' + Date.now();
        const course = {
            id,
            teacherId,
            title: courseData.title,
            description: courseData.description,
            modules: courseData.modules || [], // Array of modules { title, items: [] }
            status: courseData.status || 'published',
            createdAt: new Date().toISOString(),
            studentCount: 0,
            avgProgress: 0
        };
        courses.push(course);
        localStorage.setItem('TESTPAD_courses', JSON.stringify(courses));
        return course;
    }

    getAllCourses() {
        return JSON.parse(localStorage.getItem('TESTPAD_courses')) || [];
    }

    getTeacherCourses(teacherId) {
        const courses = this.getAllCourses();
        return courses.filter(c => c.teacherId === teacherId);
    }

    getCourseById(courseId) {
        const courses = this.getAllCourses();
        return courses.find(c => c.id === courseId);
    }

    updateCourse(courseId, updateData) {
        const courses = this.getAllCourses();
        const index = courses.findIndex(c => c.id === courseId);
        if (index !== -1) {
            courses[index] = { ...courses[index], ...updateData };
            localStorage.setItem('TESTPAD_courses', JSON.stringify(courses));
            return courses[index];
        }
        return null;
    }

    getCourseProgress(courseId, studentId) {
        const progresses = JSON.parse(localStorage.getItem('TESTPAD_course_progress')) || [];
        return progresses.find(p => p.courseId === courseId && p.studentId === studentId);
    }

    removeCourseProgressItem(courseId, studentId, itemId) {
        const progresses = JSON.parse(localStorage.getItem('TESTPAD_course_progress')) || [];
        let pIndex = progresses.findIndex(p => p.courseId === courseId && p.studentId === studentId);

        if (pIndex !== -1) {
            progresses[pIndex].completedItems = progresses[pIndex].completedItems.filter(id => id !== itemId);
            progresses[pIndex].lastActivity = new Date().toISOString();
            localStorage.setItem('TESTPAD_course_progress', JSON.stringify(progresses));
        }
    }

    updateCourseProgress(courseId, studentId, itemId, status = 'completed') {
        const progresses = JSON.parse(localStorage.getItem('TESTPAD_course_progress')) || [];
        let pIndex = progresses.findIndex(p => p.courseId === courseId && p.studentId === studentId);

        if (pIndex === -1) {
            progresses.push({
                courseId,
                studentId,
                completedItems: [itemId],
                lastActivity: new Date().toISOString()
            });
        } else {
            if (!progresses[pIndex].completedItems.includes(itemId)) {
                progresses[pIndex].completedItems.push(itemId);
            }
            progresses[pIndex].lastActivity = new Date().toISOString();
        }

        localStorage.setItem('TESTPAD_course_progress', JSON.stringify(progresses));
        return true;
    }

    // ===== SESSION MANAGEMENT =====
    createSession(userId, role) {
        const sessions = JSON.parse(localStorage.getItem('TESTPAD_sessions')) || [];
        // Deactivate old sessions
        sessions.forEach(s => s.isActive = false);

        const sessionId = 'session_' + Date.now();
        const session = {
            sessionId,
            userId,
            role,
            loginTime: new Date().toISOString(),
            lastActivityTime: new Date().toISOString(),
            isActive: true
        };
        sessions.push(session);
        localStorage.setItem('TESTPAD_sessions', JSON.stringify(sessions));
        return session;
    }

    getActiveSession() {
        const sessions = JSON.parse(localStorage.getItem('TESTPAD_sessions')) || [];
        return sessions.find(s => s.isActive);
    }

    endSession(sessionId) {
        const sessions = JSON.parse(localStorage.getItem('TESTPAD_sessions')) || [];
        const session = sessions.find(s => s.sessionId === sessionId);
        if (session) {
            session.isActive = false;
            localStorage.setItem('TESTPAD_sessions', JSON.stringify(sessions));
        }
    }

    // ===== UTILITY FUNCTIONS =====
    hashPassword(password) {
        // Simple hash for demo (in production use bcrypt or similar)
        return btoa(password);
    }

    generateTestId() {
        return 'TST' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    generatePasscode() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    getAttemptQuestions(attempt, exam) {
        if (!attempt) return (exam && exam.questions) ? exam.questions : [];
        if (attempt.selectedQuestions && Array.isArray(attempt.selectedQuestions) && attempt.selectedQuestions.length > 0) {
            return attempt.selectedQuestions;
        }
        const ex = exam || (attempt.examId ? this.getExamById(attempt.examId) : null);
        const pool = this.getQuestionPool() || [];
        const qIds = attempt.selectedQuestionIds || attempt.questionIds;
        if (qIds && Array.isArray(qIds) && qIds.length > 0) {
            return qIds.map(id => {
                const poolQ = pool.find(p => String(p.id) === String(id) || String(p.poolId) === String(id));
                const localQ = ex?.questions?.find(q => String(q.id) === String(id));
                const merged = { ...(localQ || {}), ...(poolQ || {}) };
                return (merged.id || merged.title) ? merged : null;
            }).filter(Boolean);
        }
        return (ex && ex.questions) ? ex.questions : [];
    }

    calculateScore(attempt) {
        const exam = this.getExamById(attempt.examId);
        if (!exam) return { score: 0, totalMarks: 0, percentage: 0, sectionBreakdown: {} };

        let score = 0;
        let totalMarks = 0;
        let isPendingManualReview = false;

        // Strictly get the questions assigned to this student attempt (e.g. 20 picked questions)
        const questionsToScore = this.getAttemptQuestions(attempt, exam);

        // Section breakdown
        const sectionBreakdown = {};
        if (exam.sections && Array.isArray(exam.sections)) {
            exam.sections.forEach(s => {
                sectionBreakdown[s] = { score: 0, totalMarks: 0, percentage: 0, questionsCount: 0 };
            });
        }

        questionsToScore.forEach(question => {
            const secName = question.section || 'General';
            if (!sectionBreakdown[secName]) {
                sectionBreakdown[secName] = { score: 0, totalMarks: 0, percentage: 0, questionsCount: 0 };
            }
            sectionBreakdown[secName].questionsCount++;

            const response = Array.isArray(attempt.responses)
                ? attempt.responses.find(r => r.questionId === question.id)
                : (attempt.responses ? attempt.responses[question.id] : null);

            const isManualMarking = exam.security?.manualGrading;
            const needsManual = isManualMarking && (question.type === 'subjective' || question.type === 'file_upload');

            let qScore = 0;
            const qMax = (parseFloat(question.marks) !== undefined && !isNaN(parseFloat(question.marks))) ? parseFloat(question.marks) : 1;

            // 1. Check for manual mark first
            if (response && response.manualMark !== undefined && response.manualMark !== null && response.manualMark !== '') {
                qScore = parseFloat(response.manualMark) || 0;
            } else if (response) {
                // 2. Automated scoring
                if (question.type === 'coding' && response.results) {
                    const passedMarks = response.results
                        .filter(r => r.status === 'pass')
                        .reduce((sum, r) => sum + (parseFloat(r.marks) || 0), 0);
                    qScore = passedMarks;
                } else if (!needsManual) {
                    if (this.checkAnswer(question, response)) {
                        qScore = qMax;
                    } else if (exam.negativeMarking && !['subjective', 'coding', 'file_upload', 'drawing'].includes(question.type)) {
                        qScore = - (parseFloat(exam.negativeMarking) / 100) * qMax;
                    }
                } else {
                    isPendingManualReview = true;
                }
            }

            score += qScore;
            totalMarks += qMax;

            sectionBreakdown[secName].score += qScore;
            sectionBreakdown[secName].totalMarks += qMax;
        });

        // Compute percentage for each section
        Object.keys(sectionBreakdown).forEach(sec => {
            const s = sectionBreakdown[sec];
            s.score = Math.max(0, s.score);
            s.percentage = s.totalMarks > 0 ? ((s.score / s.totalMarks) * 100).toFixed(2) : 0;
        });

        const finalScore = Math.max(0, score);
        return {
            score: finalScore,
            totalMarks,
            percentage: totalMarks > 0 ? ((finalScore / totalMarks) * 100).toFixed(2) : 0,
            isPendingManualReview,
            sectionBreakdown,
            assignedQuestions: questionsToScore
        };
    }

    checkAnswer(question, rawResponse) {
        if (!rawResponse) return false;

        let response = rawResponse;
        if (typeof response === 'object' && response !== null) {
            if (response.hasOwnProperty('selectedOption')) response = response.selectedOption;
            else if (response.hasOwnProperty('response')) response = response.response;
            else if (response.hasOwnProperty('value')) response = response.value;
        }
        // Drill down into nested value objects if they exist
        while (response !== null && typeof response === 'object' && response.hasOwnProperty('value')) {
            response = response.value;
        }

        // Final fallback to raw logic if no 'value' key is present but it's still an object
        if (typeof response === 'object' && response !== null && !Array.isArray(response)) {
            // If we are here, something is wrong with the structure, but we'll try to use the first key if relevant
            // For now, let's keep it safe.
        }

        switch (question.type) {
            case 'mcq':
            case 'true_false':
            case 'assertion_reason':
                if (response === null || response === undefined || question.correctAnswer === null || question.correctAnswer === undefined) return false;
                return String(response).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
            case 'subjective':
                if (!question.keywords || question.keywords.length === 0) return true; // Minimal grade if no keywords defined
                return question.keywords.some(kw => response.toLowerCase().includes(kw.toLowerCase()));
            case 'single_integer':
                return parseInt(response) === parseInt(question.correctNumeric);
            case 'numeric':
                const val = parseFloat(response);
                const target = parseFloat(question.correctNumeric);
                const tol = parseFloat(question.tolerance || 0);
                return Math.abs(val - target) <= tol;
            case 'file_upload':
                return !!response; // If file is attached, it's considered "correct" for auto-scoring purposes or pending manual review
            case 'coding':
                return response && response.trim().length > 0;
        }
    }

    // ===== TRANSACTION MANAGEMENT =====
    addTransaction(transactionData) {
        const txs = JSON.parse(localStorage.getItem('TESTPAD_transactions')) || [];
        const tx = {
            ...transactionData,
            id: 'TXN_' + Date.now(),
            timestamp: new Date().toISOString()
        };
        txs.push(tx);
        localStorage.setItem('TESTPAD_transactions', JSON.stringify(txs));
        return tx;
    }

    getStudentTransactions(studentId) {
        const txs = JSON.parse(localStorage.getItem('TESTPAD_transactions')) || [];
        return txs.filter(t => t.studentId === studentId);
    }

    // ===== PRACTICE SESSION PERSISTENCE =====
    savePracticeSession(itemId, attemptData) {
        const sessions = JSON.parse(localStorage.getItem('TESTPAD_practice_sessions')) || {};
        sessions[itemId] = attemptData;
        localStorage.setItem('TESTPAD_practice_sessions', JSON.stringify(sessions));
    }

    getPracticeSession(itemId) {
        const sessions = JSON.parse(localStorage.getItem('TESTPAD_practice_sessions')) || {};
        return sessions[itemId] || null;
    }

    // ===== BOOKMARKS MANAGEMENT ======
    getBookmarks(userId) {
        const bookmarksObj = JSON.parse(localStorage.getItem('TESTPAD_bookmarks')) || {};
        return bookmarksObj[userId] || [];
    }

    saveBookmarks(userId, bookmarks) {
        const bookmarksObj = JSON.parse(localStorage.getItem('TESTPAD_bookmarks')) || {};
        bookmarksObj[userId] = bookmarks;
        localStorage.setItem('TESTPAD_bookmarks', JSON.stringify(bookmarksObj));
    }
}

// Initialize global DB instance
const db = new TestpadDB();
const ExampadDB = TestpadDB;

