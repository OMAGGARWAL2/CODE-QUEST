const fs = require('fs');
let content = fs.readFileSync('c:/Users/omagg/OneDrive/Desktop/C - 01/TESTPAD/pages/course-creator.html', 'utf8');

// 1. Fix the duplicate tabs and structure
// First, extract the course-dash-header
let headerMatch = content.match(/<div class="course-dash-header">[\s\S]*?<\/div>\s*<\/div>\s*<div id="moduleCarousel"/);
if (headerMatch) {
    // We will restructure welcomeState
    // Replace the malformed tabs
    content = content.replace(/<div class="dash-tabs">[\s\S]*?<div class="dash-tab">Digital Library<\/div>\s*<\/div>\s*<div class="dash-tab">Assignments<\/div>\s*<div class="dash-tab">Attempts<\/div>\s*<div class="dash-tab">Digital Library<\/div>\s*<\/div>/, 
    `<div class="dash-tabs">
        <div class="dash-tab active" onclick="switchDashboardTab('modules', this)">Learning Content</div>
        <div class="dash-tab" onclick="switchDashboardTab('assignments', this)">Assignments</div>
        <div class="dash-tab" onclick="switchDashboardTab('attempts', this)">Attempts</div>
        <div class="dash-tab" onclick="switchDashboardTab('digital_library', this)">Digital Library</div>
    </div>
</div>`);

    // Add Montserrat and Hind
    if (!content.includes('Montserrat')) {
        content = content.replace('family=Outfit:wght@300', 'family=Montserrat:wght@400;500;600;700&family=Hind:wght@400;500;600;700&family=Outfit:wght@300');
    }

    // Wrap modules in modulesContainer
    content = content.replace(/<div id="moduleCarousel" class="module-carousel">/, '<div id="modulesContainer">\n<div id="moduleCarousel" class="module-carousel">');
    // Find where welcomeState ends
    // Looking for </div> right before <div id="attemptsView"
    content = content.replace(/<\/div>\s*<!-- Attempts View -->/, '</div>\n</div>\n<!-- Attempts View -->');
}

// Ensure attemptsView is INSIDE welcomeState so tabs remain visible
content = content.replace(/<!-- Attempts View -->/, '</div>\n<!-- Attempts View -->'); // Close modulesContainer
// Actually it's better to just manually place attemptsView and digitalLibraryView inside welcomeState.
// Let's do a reliable string replace by rewriting the whole welcomeState structure up to lessonEditor
