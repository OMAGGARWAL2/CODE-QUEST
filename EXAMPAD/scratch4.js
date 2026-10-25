const fs = require('fs');
const file = 'c:/Users/omagg/OneDrive/Desktop/C - 01/TESTPAD/pages/exam-creator.html';
let content = fs.readFileSync(file, 'utf8');

// Replace all border-radius: 12px, 14px, 16px, 8px, 20px, 10px inline styles with 0 to make them all perfectly rectangular
content = content.replace(/border-radius:\s*16px/g, 'border-radius: 0');
content = content.replace(/border-radius:\s*14px/g, 'border-radius: 0');
content = content.replace(/border-radius:\s*12px/g, 'border-radius: 0');
content = content.replace(/border-radius:\s*10px/g, 'border-radius: 0');
content = content.replace(/border-radius:\s*8px/g, 'border-radius: 0');
content = content.replace(/border-radius:\s*6px/g, 'border-radius: 0');

// Fix step 1 form-card style specifically to ensure it's rectangular
content = content.replace(/border-radius: 16px;/g, 'border-radius: 0;');

fs.writeFileSync(file, content, 'utf8');
console.log('done');
