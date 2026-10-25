const fs = require('fs');
const file = 'c:/Users/omagg/OneDrive/Desktop/C - 01/TESTPAD/pages/exam-creator.html';
let content = fs.readFileSync(file, 'utf8');

// Replace any remaining border-radius inline styles
content = content.replace(/border-radius:\s*20px/g, 'border-radius: 0');
content = content.replace(/border-radius:\s*24px/g, 'border-radius: 0');

// Make the big boxes shorter
content = content.replace(/padding:\s*24px 28px/g, 'padding: 12px 16px');
content = content.replace(/padding:\s*32px/g, 'padding: 16px'); // Some wrappers have 32px padding

fs.writeFileSync(file, content, 'utf8');
console.log('done');
