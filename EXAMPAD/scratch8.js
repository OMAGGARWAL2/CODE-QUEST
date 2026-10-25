const fs = require('fs');
const file = 'c:/Users/omagg/OneDrive/Desktop/C - 01/TESTPAD/pages/exam-creator.html';
let content = fs.readFileSync(file, 'utf8');

const sidebarHtmlReplaceStr = `
                // Sidebar View (Detailed cards as per user request)
                sidebarHtml += \`
                    <div class="sidebar-sec-header" ondrop="dropOnSection(event, '\${secName.replace(/'/g, "\\\\'")}')" ondragover="allowDrop(event)" style="font-size: 0.75rem; font-weight: 800; color: #fff; background: var(--primary); padding: 8px 16px; border-radius: 0; text-transform: uppercase; margin-top: 16px; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between; border-left: 4px solid #b75727; cursor: default;">
                        <span>\${secName}</span>
                        <i class="fas fa-layer-group" style="opacity: 0.5;"></i>
                    </div>
                \`;
                secQuestions.forEach((q, i) => {
                    sidebarHtml += \`
                        <div class="q-item \${editingQIndex === q.globalIdx ? 'active' : ''}" draggable="true" ondragstart="dragQ(event, \${q.globalIdx})" ondrop="dropQ(event, \${q.globalIdx})" ondragover="allowDrop(event)" ondragenter="dragEnter(event)" ondragleave="dragLeave(event)" ondragend="dragEndQ(event)" onclick="editQuestion(\${q.globalIdx})" data-global-idx="\${q.globalIdx}" style="padding: 12px 16px; border-bottom: 1px solid #eee; background: \${editingQIndex === q.globalIdx ? '#fff9f5' : '#fff'}; display: flex; align-items: center; gap: 16px; cursor: grab; transition: all 0.2s;">
                            
                            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 40px; border-right: 2px solid #f0f0f0; padding-right: 16px;">
                                <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-grip-vertical" style="font-size: 0.8rem; color: #ccc;"></i>
                                    Q\${i + 1}
                                </div>
                                <div style="font-size: 0.75rem; font-weight: 700; color: var(--primary); margin-top: 2px;">\${q.marks}M</div>
                            </div>`;

content = content.replace(/\/\/\s*Sidebar View[\s\S]*?<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 40px; border-right: 2px solid #f0f0f0; padding-right: 16px;">[\s\S]*?<div style="font-size: 1\.1rem; font-weight: 800; color: var\(--text-main\);">Q\$\{i \+ 1\}<\/div>[\s\S]*?<div style="font-size: 0\.75rem; font-weight: 700; color: var\(--primary\); margin-top: 2px;">\$\{q\.marks\}M<\/div>[\s\S]*?<\/div>/, sidebarHtmlReplaceStr);

const dragDropJS = `
    // --- DRAG AND DROP LOGIC FOR SIDEBAR ---
    let draggedQuestionIdx = null;

    window.dragQ = function(ev, idx) {
        draggedQuestionIdx = idx;
        ev.dataTransfer.effectAllowed = 'move';
        ev.target.style.opacity = '0.5';
    };
    
    window.allowDrop = function(ev) {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'move';
    };
    
    window.dragEnter = function(ev) {
        ev.preventDefault();
        let target = ev.target.closest('.q-item');
        if (target) {
            target.style.borderTop = '2px solid var(--primary)';
        }
    };
    
    window.dragLeave = function(ev) {
        let target = ev.target.closest('.q-item');
        if (target) {
            target.style.borderTop = 'none';
        }
    };
    
    window.dropQ = function(ev, targetIdx) {
        ev.preventDefault();
        let targetNode = ev.target.closest('.q-item');
        if (targetNode) {
            targetNode.style.borderTop = 'none';
        }
        if (draggedQuestionIdx !== null && draggedQuestionIdx !== targetIdx) {
            let targetSection = exams.questions[targetIdx].section;
            let itemToMove = exams.questions.splice(draggedQuestionIdx, 1)[0];
            itemToMove.section = targetSection;
            
            if (draggedQuestionIdx < targetIdx) {
                targetIdx--;
            }
            exams.questions.splice(targetIdx, 0, itemToMove);
            
            if (editingQIndex === draggedQuestionIdx) {
                editingQIndex = targetIdx;
            } else if (editingQIndex > draggedQuestionIdx && editingQIndex <= targetIdx) {
                editingQIndex--;
            } else if (editingQIndex < draggedQuestionIdx && editingQIndex >= targetIdx) {
                editingQIndex++;
            }
            
            updateQuestionsList();
        }
        draggedQuestionIdx = null;
    };
    
    window.dropOnSection = function(ev, sectionName) {
        ev.preventDefault();
        ev.target.style.background = 'var(--primary)';
        if (draggedQuestionIdx !== null) {
            let itemToMove = exams.questions.splice(draggedQuestionIdx, 1)[0];
            itemToMove.section = sectionName;
            exams.questions.push(itemToMove); 
            
            if (editingQIndex === draggedQuestionIdx) {
                editingQIndex = exams.questions.length - 1;
            } else if (editingQIndex > draggedQuestionIdx) {
                editingQIndex--;
            }
            
            updateQuestionsList();
        }
        draggedQuestionIdx = null;
    };
    
    window.dragEndQ = function(ev) {
        ev.target.style.opacity = '1';
        document.querySelectorAll('.q-item').forEach(el => el.style.borderTop = 'none');
    };

    function deleteQuestion(index) {`;

content = content.replace(/function deleteQuestion\(index\) {/, dragDropJS);

fs.writeFileSync(file, content, 'utf8');
console.log('done');
