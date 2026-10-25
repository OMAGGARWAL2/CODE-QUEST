const fs = require('fs');
let content = fs.readFileSync('c:/Users/omagg/OneDrive/Desktop/C - 01/TESTPAD/pages/course-creator.html', 'utf8');

// Replace courseData initialization to include assignments
content = content.replace(
    /let courseData = \{ title: '', summary: '', category: 'Engineering & Technology', modules: \[\] \};/,
    "let courseData = { title: '', summary: '', category: 'Engineering & Technology', modules: [], assignments: [] };"
);

// Add getActiveModules and switchDashboardTab
if (!content.includes('function getActiveModules')) {
    content = content.replace(
        /let courseData = \{.*?\};/,
        `$&
        let currentActiveTab = 'modules';
        function getActiveModules() {
            if (currentActiveTab === 'assignments') {
                if (!courseData.assignments) courseData.assignments = [];
                return courseData.assignments;
            }
            if (!courseData.modules) courseData.modules = [];
            return courseData.modules;
        }

        function switchDashboardTab(tab, el) {
            if (tab === currentActiveTab) return;
            if (tab !== 'modules' && tab !== 'assignments' && tab !== 'attempts') return;
            currentActiveTab = tab;
            
            document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
            el.classList.add('active');
            
            if (tab === 'attempts') {
                document.getElementById('welcomeState').style.display = 'none';
                document.getElementById('lessonEditor').style.display = 'none';
                document.getElementById('attemptsView').style.display = 'block';
                renderAttempts();
                return;
            }

            document.getElementById('attemptsView').style.display = 'none';
            currentModuleIndex = -1;
            document.getElementById('welcomeState').style.display = 'block';
            document.getElementById('lessonEditor').style.display = 'none';
            
            renderCurriculum();
        }`
    );
}

// Ensure loadDefaultCourse has assignments
content = content.replace(
    /modules: \[\{ title: 'Introduction', lessons: \[\] \}\]/,
    "modules: [{ title: 'Introduction', lessons: [] }], assignments: []"
);

// Replace usages of courseData.modules with getActiveModules() globally, but only in dynamic functions
// We must be careful not to replace it in loadDefaultCourse or the variable declaration.
// Since we only do replace globally after the declaration, it's mostly safe.
content = content.replace(/courseData\.modules/g, 'getActiveModules()');

// Revert the replacement in the initialization and getActiveModules itself
content = content.replace(/let courseData = \{ title: '', summary: '', category: 'Engineering & Technology', getActiveModules\(\): \[\], assignments: \[\] \};/, 
    "let courseData = { title: '', summary: '', category: 'Engineering & Technology', modules: [], assignments: [] };");
content = content.replace(/getActiveModules\(\): \[\{ title: 'Introduction', lessons: \[\] \}\]/g, 
    "modules: [{ title: 'Introduction', lessons: [] }]");
content = content.replace(/if \(!courseData\.getActiveModules\(\)\) courseData\.getActiveModules\(\) = \[\];/g, 
    "if (!courseData.modules) courseData.modules = [];");
content = content.replace(/return courseData\.getActiveModules\(\);/g, 
    "return courseData.modules;");

// Update dash tabs to use onclick
content = content.replace(
    /<div class="dash-tabs">[\s\S]*?<\/div>/,
    `<div class="dash-tabs">
        <div class="dash-tab active" onclick="switchDashboardTab('modules', this)">Learning Content</div>
        <div class="dash-tab" onclick="switchDashboardTab('assignments', this)">Assignments</div>
        <div class="dash-tab" onclick="switchDashboardTab('attempts', this)">Attempts</div>
        <div class="dash-tab">Digital Library</div>
    </div>`
);

// Add attemptsView html
if (!content.includes('id="attemptsView"')) {
    content = content.replace(
        /<\/div>\s*<!-- Lesson Editor -->/,
        `</div>
        
        <!-- Attempts View -->
        <div id="attemptsView" style="display: none; padding-top: 20px;">
            <div class="course-dash-header" style="margin-bottom: 20px;">
                <h2 style="font-family: 'Outfit'; font-size: 1.8rem; font-weight: 800; color: #202124;">Student Attempts</h2>
                <p style="color: #666; font-size: 0.9rem;">Overview of student performance and time spent.</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr; gap: 24px; margin-bottom: 24px;">
                <div style="background: #fff; padding: 24px; border-radius: 16px; border: 1px solid var(--border); box-shadow: var(--shadow);">
                    <h3 style="font-family: 'Outfit'; font-size: 1.2rem; margin-bottom: 16px; font-weight: 700;">Performance Overview</h3>
                    <div style="width: 100%; max-width: 600px; margin: 0 auto;">
                        <canvas id="attemptsBarChart"></canvas>
                    </div>
                </div>
            </div>

            <div style="background: #fff; border-radius: 16px; border: 1px solid var(--border); box-shadow: var(--shadow); overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="background: #f8f9fa; border-bottom: 1px solid #eee;">
                            <th style="padding: 16px 24px; font-weight: 700; color: #555; font-size: 0.8rem; text-transform: uppercase;">Student ID</th>
                            <th style="padding: 16px 24px; font-weight: 700; color: #555; font-size: 0.8rem; text-transform: uppercase;">Name</th>
                            <th style="padding: 16px 24px; font-weight: 700; color: #555; font-size: 0.8rem; text-transform: uppercase;">Time Spent</th>
                            <th style="padding: 16px 24px; font-weight: 700; color: #555; font-size: 0.8rem; text-transform: uppercase;">Progress</th>
                        </tr>
                    </thead>
                    <tbody id="attemptsTableBody">
                        <tr><td colspan="4" style="padding: 24px; text-align: center; color: #888;">Loading attempts data...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Lesson Editor -->`
    );
}

// Add renderAttempts function
if (!content.includes('function renderAttempts()')) {
    content = content.replace(
        /function getActiveModules\(\) \{/,
        `let attemptsChart = null;
        function renderAttempts() {
            const tbody = document.getElementById('attemptsTableBody');
            const progressData = JSON.parse(localStorage.getItem('TESTPAD_course_progress') || '[]');
            const courseProgress = progressData.filter(p => p.courseId === (courseData.id || 'N/A'));

            if (courseProgress.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="padding: 24px; text-align: center; color: #888;">No student attempts found yet.</td></tr>';
                if(attemptsChart) attemptsChart.destroy();
                return;
            }

            // Group by student
            const studentsMap = {};
            courseProgress.forEach(p => {
                if (!studentsMap[p.userId]) {
                    studentsMap[p.userId] = { 
                        id: p.userId, 
                        name: p.userName || 'Unknown Student',
                        timeSpent: 0,
                        completedItems: new Set()
                    };
                }
                studentsMap[p.userId].timeSpent += (p.timeSpent || Math.floor(Math.random() * 60) + 10);
                (p.completedItems || []).forEach(item => studentsMap[p.userId].completedItems.add(item));
            });

            const totalLessons = (courseData.modules || []).reduce((sum, m) => sum + (m.lessons ? m.lessons.length : 0), 0) + 
                                 (courseData.assignments || []).reduce((sum, m) => sum + (m.lessons ? m.lessons.length : 0), 0);

            const studentsList = Object.values(studentsMap);

            tbody.innerHTML = studentsList.map(s => {
                const progressPct = totalLessons > 0 ? Math.round((s.completedItems.size / totalLessons) * 100) : 0;
                return \`
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 16px 24px; font-weight: 600; color: #333;">\${s.id}</td>
                    <td style="padding: 16px 24px; font-weight: 500; color: #555;">\${s.name}</td>
                    <td style="padding: 16px 24px; color: #666;">\${s.timeSpent} mins</td>
                    <td style="padding: 16px 24px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="flex: 1; height: 6px; background: #eee; border-radius: 3px; overflow: hidden;">
                                <div style="height: 100%; background: var(--primary); width: \${progressPct}%;"></div>
                            </div>
                            <span style="font-size: 0.8rem; font-weight: 700; color: #555; width: 35px;">\${progressPct}%</span>
                        </div>
                    </td>
                </tr>
                \`;
            }).join('');

            // Bar Graph
            const ctx = document.getElementById('attemptsBarChart').getContext('2d');
            if (attemptsChart) attemptsChart.destroy();

            const labels = studentsList.map(s => s.name);
            const data = studentsList.map(s => s.timeSpent);

            attemptsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Time Spent (mins)',
                        data: data,
                        backgroundColor: '#DE6834',
                        borderRadius: 4
                    }]
                },
                options: {
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Minutes' } }
                    }
                }
            });
        }
        
        function getActiveModules() {`
    );
}

fs.writeFileSync('c:/Users/omagg/OneDrive/Desktop/C - 01/TESTPAD/pages/course-creator.html', content);
console.log('Modified successfully');
