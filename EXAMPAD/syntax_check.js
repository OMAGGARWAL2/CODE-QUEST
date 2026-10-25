const fs = require('fs');
let html = fs.readFileSync('pages/exam-attempt.html', 'utf8');

// Check style tags
let styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
let match;
let styleIdx = 0;
let errors = 0;

while ((match = styleRegex.exec(html)) !== null) {
    styleIdx++;
    let code = match[1];
    let startLine = html.substring(0, match.index).split('\n').length;
    let endLine = html.substring(0, match.index + match[0].length).split('\n').length;
    
    let stack = [];
    let inComment = false;
    let inString = null;
    
    let codeLines = code.split('\n');
    for (let lineNum = 0; lineNum < codeLines.length; lineNum++) {
        let line = codeLines[lineNum];
        let actualLine = startLine + lineNum;
        
        for (let i = 0; i < line.length; i++) {
            let ch = line[i];
            let next = line[i+1];
            
            if (inComment) {
                if (ch === '*' && next === '/') {
                    inComment = false;
                    i++;
                }
                continue;
            }
            if (inString) {
                if (ch === '\\') {
                    i++;
                    continue;
                }
                if (ch === inString) {
                    inString = null;
                }
                continue;
            }
            if (ch === '/' && next === '*') {
                inComment = true;
                i++;
                continue;
            }
            if (ch === '\'' || ch === '"') {
                inString = ch;
                continue;
            }
            
            if (ch === '{') {
                stack.push({ line: actualLine, content: line.trim() });
            }
            if (ch === '}') {
                if (stack.length > 0) {
                    stack.pop();
                } else {
                    console.log(`Extra closing brace at line ${actualLine}`);
                    errors++;
                }
            }
        }
    }
    
    if (stack.length > 0) {
        console.log(`Style ${styleIdx} (L${startLine}-L${endLine}): unclosed count = ${stack.length}`);
        errors += stack.length;
    }
}

let scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let sCount = 0;
while ((match = scriptRegex.exec(html)) !== null) {
    sCount++;
    try {
        new Function(match[1]);
    } catch(e) {
        console.log(`Script ${sCount} Error:`, e.message);
        errors++;
    }
}

if (errors === 0) {
    console.log(`ALL CLEAR! All ${styleIdx} style blocks and all ${sCount} script blocks have perfectly balanced braces and valid syntax.`);
}
