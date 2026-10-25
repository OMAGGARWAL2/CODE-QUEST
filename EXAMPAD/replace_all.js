const fs = require('fs');
const path = require('path');

function replaceEverything(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    if (content.includes('TESTPAD')) {
        content = content.replace(/TESTPAD/g, 'TESTPAD');
        changed = true;
    }

    if (content.includes('testpad')) {
        content = content.replace(/testpad/g, 'TESTPAD');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Reverted all in ${filePath}`);
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'package.json' || file === 'package-lock.json') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
            if (file === 'replace_text.js' || file === 'replace_words.js' || file === 'replace_title.js' || file === 'revert_testpad.js' || file === 'replace_all.js') continue;
            replaceEverything(fullPath);
        }
    }
}

traverseDir(__dirname);
