const fs = require('fs');
let html = fs.readFileSync('pages/comexam-attempt.html', 'utf8');
let fixCode = fs.readFileSync('fix_code.txt', 'utf8');

// The pattern right before the missing block
const startPattern = 'normalizeDate(c.dob) === normalizeDate(dob)\r\n            );\r\n';
const startIdx = html.indexOf(startPattern);

// The pattern right after the missing block
const endPattern = 'attemptQs[q.id] = {\r\n                    questionId: q.id,';
const endIdx = html.indexOf(endPattern);

if (startIdx !== -1 && endIdx !== -1) {
    const endOfStart = startIdx + startPattern.length;
    // Keep everything before the missing block, add the fixed code, and everything after
    const newHtml = html.substring(0, endOfStart) + '\n' + fixCode + '\n\n                ' + html.substring(endIdx);
    fs.writeFileSync('pages/comexam-attempt.html', newHtml, 'utf8');
    console.log('Successfully repaired comexam-attempt.html');
} else {
    console.log('Could not find patterns.', startIdx, endIdx);
    
    // Fallback if line endings are different
    const startPattern2 = 'normalizeDate(c.dob) === normalizeDate(dob)\n            );\n';
    const endPattern2 = 'attemptQs[q.id] = {\n                    questionId: q.id,';
    
    const startIdx2 = html.indexOf(startPattern2);
    const endIdx2 = html.indexOf(endPattern2);
    
    if (startIdx2 !== -1 && endIdx2 !== -1) {
        const endOfStart = startIdx2 + startPattern2.length;
        const newHtml = html.substring(0, endOfStart) + '\n' + fixCode + '\n\n                ' + html.substring(endIdx2);
        fs.writeFileSync('pages/comexam-attempt.html', newHtml, 'utf8');
        console.log('Successfully repaired comexam-attempt.html (LF)');
    } else {
        console.log('Still could not find patterns.', startIdx2, endIdx2);
    }
}
