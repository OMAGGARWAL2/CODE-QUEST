const fs = require('fs');
let text = fs.readFileSync('pages/comexam-attempt.html', 'utf8');
text = text.replace(/\ufeff/g, '');
fs.writeFileSync('pages/comexam-attempt.html', text, 'utf8');
console.log('Removed BOM/ZWNBSP');
