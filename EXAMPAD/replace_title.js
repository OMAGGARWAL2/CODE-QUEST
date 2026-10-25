const fs = require('fs');
const path = require('path');

function replaceTitleInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (/<title>.*?<\/title>/i.test(content)) {
        content = content.replace(/<title>.*?<\/title>/ig, '<title>testpad</title>');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Replaced in ${filePath}`);
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
            replaceTitleInFile(fullPath);
        }
    }
}

traverseDir(__dirname);
