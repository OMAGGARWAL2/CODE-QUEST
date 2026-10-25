const fs = require('fs');
const file = 'c:/Users/omagg/OneDrive/Desktop/C - 01/TESTPAD/pages/exam-creator.html';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/padding:20px; border-radius:14px;/g, 'padding:12px 16px; border-radius:0;');
content = content.replace(/padding:16px; border-radius:14px;/g, 'padding:12px 16px; border-radius:0;');

fs.writeFileSync(file, content, 'utf8');
console.log('done');
