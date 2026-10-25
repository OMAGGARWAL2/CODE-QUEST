const fs = require('fs');
const path = require('path');

function revertToTestpad(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Replace whole word testpad with TESTPAD
    const regex = /\btestpad\b/g;
    if (regex.test(content)) {
        content = content.replace(regex, 'TESTPAD');
        changed = true;
    }
    // Handle cases where case matters or it was part of a tag
    const regex2 = /<title>testpad<\/title>/ig;
    if (regex2.test(content)) {
        content = content.replace(regex2, '<title>TESTPAD</title>');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Reverted in ${filePath}`);
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
        } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js')) {
            // Ignore the script files themselves so we don't break them or just let them run
            if (file === 'replace_text.js' || file === 'replace_words.js' || file === 'replace_title.js' || file === 'revert_testpad.js') continue;
            revertToTestpad(fullPath);
        }
    }
}

traverseDir(__dirname);
