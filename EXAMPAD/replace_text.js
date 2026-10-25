const fs = require('fs');
const path = require('path');

function replaceTextInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    if (content.includes('>testpad<') || content.includes('>testpad<')) {
        content = content.replace(/>testpad</g, '>testpad<');
        content = content.replace(/>testpad</g, '>testpad<');
        changed = true;
    }
    // Also replace testpad with testpad if it's the brand name or logo text
    // as it might be prefixed with space or newline
    const regex1 = />\s*testpad\s*</g;
    const regex2 = />\s*testpad\s*</g;
    if (regex1.test(content) || regex2.test(content)) {
        content = content.replace(regex1, '>testpad<');
        content = content.replace(regex2, '>testpad<');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Replaced text in ${filePath}`);
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.html')) {
            replaceTextInFile(fullPath);
        }
    }
}

traverseDir(__dirname);
