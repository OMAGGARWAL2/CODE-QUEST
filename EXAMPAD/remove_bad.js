const fs = require('fs');
let text = fs.readFileSync('pages/comexam-attempt.html', 'utf8');
let lines = text.split('\n');
// We want to delete lines 1604 to 1743 (1-indexed).
// Array is 0-indexed, so index 1603 to 1742.
// Wait, the line numbers from view_file might have counted \n or \r\n differently?
// view_file splits by \n.
lines.splice(1603, 1743 - 1604 + 1);
fs.writeFileSync('pages/comexam-attempt.html', lines.join('\n'), 'utf8');
console.log('Removed duplicate block');
