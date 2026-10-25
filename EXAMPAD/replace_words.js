const fs = require('fs');
const path = require('path');

function replaceWordsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    const regex1 = /\bTESTPAD\b/g;
    const regex2 = /\bTESTPAD\b/g;
    
    if (regex1.test(content) || regex2.test(content)) {
        content = content.replace(regex1, 'testpad');
        content = content.replace(regex2, 'testpad');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Replaced word in ${filePath}`);
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
            // Also replacing in .js in case it appears in strings or alerts
            replaceWordsInFile(fullPath);
        }
    }
}

traverseDir(__dirname);
