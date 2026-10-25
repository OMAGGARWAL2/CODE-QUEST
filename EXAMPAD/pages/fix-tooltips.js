const fs = require('fs');
const file = 'c:\\\\Users\\\\omagg\\\\OneDrive\\\\Desktop\\\\C - 01\\\\TESTPAD\\\\pages\\\\exam-creator.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Add CSS for tooltips and hide native toolbar
const cssToAdd = `
        /* ======= TOOLTIPS & NATIVE TOOLBAR ======= */
        .ql-toolbar { display: none !important; }
        .ql-container { border-top: 1px solid #f0f0f0 !important; }
        [data-tooltip] { position: relative; }
        [data-tooltip]:hover::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #111;
            color: #fff;
            padding: 4px 8px;
            font-size: 0.65rem;
            white-space: nowrap;
            border-radius: 2px;
            z-index: 1000;
            pointer-events: none;
            font-family: 'Montserrat', sans-serif;
            margin-bottom: 4px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
`;
if(!content.includes('[data-tooltip]')) {
    content = content.replace('/* ======= TABBED SMART TOOLBAR STYLES ======= */', cssToAdd + '\n        /* ======= TABBED SMART TOOLBAR STYLES ======= */');
}

// 2. Replace title with data-tooltip in the toolbar area
const startStr = '<div id="smart-toolbar-container"';
const endStr = '<!-- Accessory Panels';
const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);
if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex);
    let middle = content.substring(startIndex, endIndex);
    const after = content.substring(endIndex);
    middle = middle.replace(/title="/g, 'data-tooltip="');
    content = before + middle + after;
}

fs.writeFileSync(file, content);
console.log('Update successful');
