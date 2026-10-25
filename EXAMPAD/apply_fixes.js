const fs = require('fs');
let content = fs.readFileSync('pages/exam-creator.html', 'utf8');

// 1. Fix RailHtml
const fullRegex = / \/\/ Rail View \(Grid numbers\)[\s\S]*?\/\/ Sidebar View \(Detailed cards as per user request\)/;
const newRail = ` // Rail View (Grid numbers)
                railHtml += \`
                    <div style="text-align: center; font-size: 0.65rem; font-weight: 700; color: #888; text-transform: uppercase; margin: 10px 0 4px 0;">\${secName}</div>
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                \`;
                secQuestions.forEach((q, i) => {
                    railHtml += \`
                        <div class="q-nav-item \${editingQIndex === q.globalIdx ? 'active' : ''}" onclick="editQuestion(\${q.globalIdx})" draggable="true" ondragstart="dragQ(event, \${q.globalIdx})" ondrop="dropQ(event, \${q.globalIdx})" ondragover="allowDrop(event)" ondragenter="dragEnter(event)" ondragleave="dragLeave(event)" ondragend="dragEndQ(event)" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; background: \${editingQIndex === q.globalIdx ? 'var(--primary)' : '#fcfcfc'}; color: \${editingQIndex === q.globalIdx ? '#fff' : '#666'}; border: 1px solid \${editingQIndex === q.globalIdx ? 'var(--primary)' : '#eee'}; border-radius: 0;">
                            \${i + 1}
                        </div>
                    \`;
                });
                railHtml += \`
                    </div>
                \`;
`;
content = content.replace(fullRegex, newRail + "                // Sidebar View (Detailed cards as per user request)");

// 2. Fix Quill initialization
const quillRegex = /quill = new Quill\('#editor-container', \{[\s\S]*?\}\);/;
const quillReplace = `quill = new Quill('#editor-container', {
            theme: 'snow',
            placeholder: 'Craft your question prompt or problem statement here...',
            modules: {
                toolbar: [
                    [{ 'font': Font.whitelist }, { 'size': Size.whitelist }, { 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'script': 'sub' }, { 'script': 'super' }],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'align': [] }],
                    ['link', 'image', 'video'],
                    ['code-block', 'clean']
                ]
            }
        });`;
content = content.replace(quillRegex, quillReplace);

// 3. Update Quill CSS for .ql-toolbar.ql-snow
// We replace the exact existing block, to avoid matching too much.
const cssRegex = /\.ql-toolbar\.ql-snow\s*\{[\s\S]*?padding:\s*12px\s*16px\s*!important;\s*\}/;
const cssReplace = `.ql-toolbar.ql-snow {
            border: 1px solid #eee !important;
            border-bottom: 2px solid var(--primary) !important;
            background: #fff !important;
            border-radius: 0 !important;
            padding: 12px 16px !important;
        }
        .ql-toolbar.ql-snow .ql-formats {
            margin-right: 15px !important;
            margin-bottom: 8px !important;
            display: inline-block;
        }`;
content = content.replace(cssRegex, cssReplace);

fs.writeFileSync('pages/exam-creator.html', content, 'utf8');
console.log("Fixes applied successfully.");
