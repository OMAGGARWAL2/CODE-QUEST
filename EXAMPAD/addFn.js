const fs = require('fs');
let dbPath = 'c:/Users/omagg/OneDrive/Desktop/C - 01/TESTPAD/js/db.js';
let file = fs.readFileSync(dbPath, 'utf8');

if (!file.includes('removeCourseProgressItem')) {
    const fn = 
    removeCourseProgressItem(courseId, studentId, itemId) {
        const progresses = JSON.parse(localStorage.getItem('TESTPAD_course_progress')) || [];
        let pIndex = progresses.findIndex(p => p.courseId === courseId && p.studentId === studentId);
        
        if (pIndex !== -1) {
            progresses[pIndex].completedItems = progresses[pIndex].completedItems.filter(id => id !== itemId);
            progresses[pIndex].lastActivity = new Date().toISOString();
            localStorage.setItem('TESTPAD_course_progress', JSON.stringify(progresses));
        }
    },
;
    // Insert it before updateCourseProgress
    file = file.replace('updateCourseProgress(courseId, studentId, itemId, status = \\'completed\\') {', fn + '    updateCourseProgress(courseId, studentId, itemId, status = \\'completed\\') {');
    fs.writeFileSync(dbPath, file);
    console.log('Added removeCourseProgressItem to db.js');
}
