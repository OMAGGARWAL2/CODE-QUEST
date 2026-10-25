const fs = require('fs');
const file = 'c:/Users/omagg/OneDrive/Desktop/C - 01/TESTPAD/pages/exam-creator.html';
let content = fs.readFileSync(file, 'utf8');

// The Final Validation boxes have spacing around the CSS properties, so a loose regex is best
content = content.replace(/padding:\s*16px;\s*border-radius:\s*14px;/g, 'padding: 12px 16px; border-radius: 0;');
// Just in case any others had 20px
content = content.replace(/padding:\s*20px;\s*border-radius:\s*14px;/g, 'padding: 12px 16px; border-radius: 0;');

fs.writeFileSync(file, content, 'utf8');
console.log('done');
