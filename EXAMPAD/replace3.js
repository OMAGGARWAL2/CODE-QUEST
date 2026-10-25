const fs = require('fs');
let file = fs.readFileSync('c:/Users/omagg/OneDrive/Desktop/C - 01/TESTPAD/pages/course-creator.html', 'utf8');

// Fix Tabs HTML
file = file.replace(/<div class="dash-tabs">[\s\S]*?<div class="dash-tab">Digital Library<\/div>\s*<\/div>/, 
`<div class="dash-tabs">
                            <div class="dash-tab active" onclick="switchDashboardTab('modules', this)">Learning Content</div>
                            <div class="dash-tab" onclick="switchDashboardTab('assignments', this)">Assignments</div>
                            <div class="dash-tab" onclick="switchDashboardTab('attempts', this)">Attempts</div>
                            <div class="dash-tab" onclick="switchDashboardTab('digital_library', this)">Digital Library</div>
                        </div>`);

// Add Montserrat and Hind fonts to Google Fonts link
file = file.replace(/family=Outfit:wght@300;400;500;600;700;800&family=Inter/, 'family=Montserrat:wght@400;500;600;700;800&family=Hind:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=Inter');

// Wrap modules content in modulesContainer
file = file.replace(/<div id="moduleCarousel" class="module-carousel">/, '<div id="modulesContainer">\n                        <div id="moduleCarousel" class="module-carousel">');
file = file.replace(/manage lessons and assessments\.<\/p>\s*<\/div>/, 'manage lessons and assessments.</p>\n                        </div>\n                    </div>');

// Update attemptsView styling
file = file.replace(/<h2 style="font-family: 'Outfit';(.*?)>Student Attempts<\/h2>/, '<h2 style="font-family: \'Montserrat\', sans-serif;$1>Student Attempts</h2>');
file = file.replace(/<p style="color: #666; font-size: 0.9rem;">Overview of student performance and time spent\.<\/p>/, '<p style="font-family: \'Montserrat\', sans-serif; color: #666; font-size: 0.9rem;">Overview of student performance and time spent.</p>');
file = file.replace(/<h3 style="font-family: 'Outfit';(.*?)>Performance Overview<\/h3>/, '<h3 style="font-family: \'Montserrat\', sans-serif;$1>Performance Overview</h3>');
file = file.replace(/<table style="width: 100%; border-collapse: collapse; text-align: left;">/, '<table style="width: 100%; border-collapse: collapse; text-align: left; font-family: \'Hind\', sans-serif;">');

// Add Digital Library View after attemptsView
const digitalLibraryHtml = `
        <!-- Digital Library View -->
        <div id="digitalLibraryView" style="display: none; padding-top: 20px;">
            <div class="course-dash-header" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="font-family: 'Outfit'; font-size: 1.8rem; font-weight: 800; color: #202124;">Digital Library</h2>
                    <p style="color: #666; font-size: 0.9rem;">Add reference links, instructions, and PDF resources.</p>
                </div>
                <button class="btn btn-primary" onclick="addLibraryItem()"><i class="fas fa-plus"></i> Add Resource</button>
            </div>
            
            <div id="libraryItemsContainer" style="display: flex; flex-direction: column; gap: 16px;">
            </div>
        </div>
`;
if (!file.includes('id="digitalLibraryView"')) {
    file = file.replace(/(<\/div>\s*)(<!-- Lesson Editor -->)/, `$1${digitalLibraryHtml}\n        $2`);
}

// Ensure welcomeState encapsulates attemptsView and digitalLibraryView
// The </div> for welcomeState is currently right before <!-- Attempts View -->.
// Let's remove that </div> and put it after <!-- Digital Library View --> ends.
if (file.includes('</div>\n        \n        <!-- Attempts View -->')) {
    file = file.replace(/<\/div>\n        \n        <!-- Attempts View -->/, '\n        <!-- Attempts View -->');
    file = file.replace(/(<!-- Lesson Editor -->)/, '</div>\n        $1');
} else if (file.includes('</div>\n        <!-- Attempts View -->')) {
    file = file.replace(/<\/div>\n        <!-- Attempts View -->/, '\n        <!-- Attempts View -->');
    file = file.replace(/(<!-- Lesson Editor -->)/, '</div>\n        $1');
}

// Update switchDashboardTab
const oldSwitch = `        function switchDashboardTab(tab, el) {
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
        }`;

const newSwitch = `        function switchDashboardTab(tab, el) {
            if (tab === currentActiveTab) return;
            currentActiveTab = tab;
            
            document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
            el.classList.add('active');
            
            document.getElementById('welcomeState').style.display = 'block';
            document.getElementById('lessonEditor').style.display = 'none';
            
            document.getElementById('modulesContainer').style.display = 'none';
            document.getElementById('attemptsView').style.display = 'none';
            document.getElementById('digitalLibraryView').style.display = 'none';

            if (tab === 'attempts') {
                document.getElementById('attemptsView').style.display = 'block';
                renderAttempts();
            } else if (tab === 'digital_library') {
                document.getElementById('digitalLibraryView').style.display = 'block';
                renderLibrary();
            } else {
                currentModuleIndex = -1;
                document.getElementById('modulesContainer').style.display = 'block';
                renderCurriculum();
            }
        }`;
if (file.includes('function switchDashboardTab')) {
    // Replace the function by matching its body roughly
    file = file.replace(/function switchDashboardTab\(tab, el\) \{[\s\S]*?renderCurriculum\(\);\s*\}/, newSwitch);
}

// Add renderLibrary and addLibraryItem functions
const libraryFunctions = `
        function renderLibrary() {
            const container = document.getElementById('libraryItemsContainer');
            if (!courseData.library || courseData.library.length === 0) {
                container.innerHTML = \`
                    <div style="text-align: center; padding: 60px 40px; background: #fff; border-radius: 20px; border: 1px dashed #eee;">
                        <i class="fas fa-book-open" style="font-size: 3rem; color: #ddd; margin-bottom: 16px;"></i>
                        <h3 style="font-family: 'Outfit'; color: #888;">No resources added yet</h3>
                        <p style="color: #aaa; font-size: 0.9rem;">Click "Add Resource" to enrich your course with external materials.</p>
                    </div>\`;
                return;
            }
            
            container.innerHTML = courseData.library.map((item, idx) => \`
                <div style="background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: flex-start; transition: all 0.2s;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="background: \${item.type === 'pdf' ? '#fee2e2' : '#e0e7ff'}; color: \${item.type === 'pdf' ? '#ef4444' : '#3b82f6'}; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">
                                \${item.type}
                            </span>
                            <h4 style="font-family: 'Outfit'; font-size: 1.1rem; color: #202124; margin: 0;">\${item.title}</h4>
                        </div>
                        <p style="color: #666; font-size: 0.9rem; margin-bottom: 12px; max-width: 600px;">\${item.desc || 'No description provided.'}</p>
                        <a href="\${item.url}" target="_blank" style="color: var(--primary); font-size: 0.85rem; font-weight: 600; text-decoration: none;"><i class="fas fa-external-link-alt"></i> Access Resource</a>
                    </div>
                    <button class="btn btn-ghost" style="color: #ef4444;" onclick="deleteLibraryItem(\${idx})"><i class="fas fa-trash"></i></button>
                </div>
            \`).join('');
        }

        function addLibraryItem() {
            showModal({
                title: "Add Digital Resource",
                desc: "Provide a link to a PDF, external tool, or reference document.",
                body: \`
                    <div class="field-group">
                        <label class="field-label">Resource Title</label>
                        <input type="text" id="libTitle" class="standard-input" placeholder="e.g. Course Syllabus">
                    </div>
                    <div class="field-group">
                        <label class="field-label">Resource URL</label>
                        <input type="text" id="libUrl" class="standard-input" placeholder="https://...">
                    </div>
                    <div class="field-group">
                        <label class="field-label">Description / Instructions</label>
                        <textarea id="libDesc" class="standard-input" rows="3" placeholder="Brief context..."></textarea>
                    </div>
                    <div class="field-group">
                        <label class="field-label">Type</label>
                        <select id="libType" class="standard-input">
                            <option value="link">External Link</option>
                            <option value="pdf">PDF Document</option>
                        </select>
                    </div>
                \`,
                confirmText: "Add Resource",
                onConfirm: () => {
                    const title = document.getElementById('libTitle').value;
                    const url = document.getElementById('libUrl').value;
                    if (!title || !url) return showToast("Title and URL are required");
                    
                    if (!courseData.library) courseData.library = [];
                    courseData.library.push({
                        title: title,
                        url: url,
                        desc: document.getElementById('libDesc').value,
                        type: document.getElementById('libType').value
                    });
                    
                    saveToLocal();
                    renderLibrary();
                    closeModal();
                    showToast("Resource added successfully");
                }
            });
        }

        function deleteLibraryItem(idx) {
            if (confirm("Remove this resource?")) {
                courseData.library.splice(idx, 1);
                saveToLocal();
                renderLibrary();
            }
        }
`;
if (!file.includes('function renderLibrary()')) {
    file = file.replace(/function renderAttempts\(\) \{/, libraryFunctions + '\n        function renderAttempts() {');
}

// Make sure courseData initialization has library
if (file.includes("let courseData = { title: '', summary: '', category: 'Engineering & Technology', modules: [], assignments: [] };")) {
    file = file.replace("let courseData = { title: '', summary: '', category: 'Engineering & Technology', modules: [], assignments: [] };", "let courseData = { title: '', summary: '', category: 'Engineering & Technology', modules: [], assignments: [], library: [] };");
}

fs.writeFileSync('c:/Users/omagg/OneDrive/Desktop/C - 01/TESTPAD/pages/course-creator.html', file);
console.log('Modified 3 successfully');
