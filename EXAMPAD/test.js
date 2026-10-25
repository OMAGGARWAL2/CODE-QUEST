



                                document.addEventListener('DOMContentLoaded', () => {
                                    flatpickr("#entryDeadline", {
                                        enableTime: true,
                                        dateFormat: "Y-m-d H:i",
                                        time_24hr: false
                                    });
                                });
                            

                function toggleTimeTakenAccordion() {
                    const content = document.getElementById('timeTakenAccordionContent');
                    const icon = document.getElementById('timeTakenAccordionIcon');
                    if (content.style.display === 'none') {
                        content.style.display = 'block';
                        icon.style.transform = 'rotate(180deg)';
                    } else {
                        content.style.display = 'none';
                        icon.style.transform = 'rotate(0deg)';
                    }
                }

                // Simple logging mechanism
                function loadLogs() {
                    const logsList = document.getElementById('activityLogsList');
                    let logs = JSON.parse(localStorage.getItem('testPad_creatorLogs') || '[]');

                    if (!window.logInitialized) {
                        window.logInitialized = true;
                        if (logs.length === 0) {
                            logs.push({ action: 'Creator Session Started', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
                        } else {
                            logs.push({ action: 'Page Refreshed', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
                        }
                        if (logs.length > 20) logs = logs.slice(logs.length - 20);
                        localStorage.setItem('testPad_creatorLogs', JSON.stringify(logs));
                    }

                    if (logsList) {
                        logsList.innerHTML = logs.map(l => `<li style="background: #fff; padding: 8px 12px; border-radius: 0; border: 1px solid #ffe8dd; display: flex; justify-content: space-between;"><span style="font-weight: 700; color:#444;"><i class="fas fa-bolt" style="color:#d96c33; margin-right: 6px; font-size: 0.8rem;"></i>${l.action}</span> <span style="color: #888;">${l.time}</span></li>`).reverse().join('');
                    }
                }
                loadLogs();

                // Load time from localStorage
                let timeTakenSeconds = localStorage.getItem('testPad_timeTaken')
                    ? parseInt(localStorage.getItem('testPad_timeTaken'))
                    : 0;

                setInterval(() => {
                    timeTakenSeconds++;
                    localStorage.setItem('testPad_timeTaken', timeTakenSeconds);

                    const hrs = String(Math.floor(timeTakenSeconds / 3600)).padStart(2, '0');
                    const mins = String(Math.floor((timeTakenSeconds % 3600) / 60)).padStart(2, '0');
                    const secs = String(timeTakenSeconds % 60).padStart(2, '0');
                    const el = document.getElementById('realtimeClock');
                    if (el) el.textContent = `${hrs}:${mins}:${secs}`;
                }, 1000);
            

                function toggleQuestionsAccordion() {
                    const content = document.getElementById('questionsAccordionContent');
                    const icon = document.getElementById('questionsAccordionIcon');
                    if (content.style.display === 'none') {
                        content.style.display = 'block';
                        icon.style.transform = 'rotate(180deg)';
                    } else {
                        content.style.display = 'none';
                        icon.style.transform = 'rotate(0deg)';
                    }
                }
            

                function toggleTimelineAccordion() {
                    const content = document.getElementById('timelineAccordionContent');
                    const icon = document.getElementById('timelineAccordionIcon');
                    if (content.style.display === 'none') {
                        content.style.display = 'block';
                        icon.style.transform = 'rotate(180deg)';
                    } else {
                        content.style.display = 'none';
                        icon.style.transform = 'rotate(0deg)';
                    }
                }
            








    // Custom Font & Size registration for Quill
    const Font = Quill.import('attributors/style/font');
    Font.whitelist = ['Inter', 'Outfit', 'Roboto', 'Arial', 'Times New Roman', 'Georgia', 'Garamond', 'Tex Gyre Schola', 'Century Schoolbook', 'JetBrains Mono'];
    Quill.register(Font, true);

    const Size = Quill.import('attributors/style/size');
    Size.whitelist = ['10px', '12px', '13px', '14px', '16px', '18px', '20px', '22px', '24px', '28px', '32px', '36px', '48px', '64px'];
    Quill.register(Size, true);

    // Ace State Management
    let activeAceEditor = null;
    let aceTargetId = null;
    let inlineAceEditors = {}; // Storage for inline editors by DIV ID
    let editingQIndex = -1; // Track which question is being edited

    // State management for Undo/Redo
    let history = [];
    let historyStep = -1;

    function saveToHistory() {
        if (historyStep < history.length - 1) {
            history = history.slice(0, historyStep + 1);
        }
        history.push(JSON.stringify(exams));
        if (history.length > 50) history.shift();
        historyStep = history.length - 1;
    }

    function undo() {
        if (historyStep > 0) {
            historyStep--;
            exams = JSON.parse(history[historyStep]);
            updateQuestionsList();
            updateSectionsList();
            showToast('Undo performed (Ctrl+Z)');
        }
    }

    function redo() {
        if (historyStep < history.length - 1) {
            historyStep++;
            exams = JSON.parse(history[historyStep]);
            updateQuestionsList();
            updateSectionsList();
            showToast('Redo performed (Ctrl+Shift+Z)');
        }
    }

    function showVersionHistory() {
        if (history.length === 0) { showToast('No history available yet'); return; }
        let versions = history.map((h, i) => `Option ${i + 1}: ${JSON.parse(h).questions.length} questions`).join('\n');
        let choice = prompt(`Select version to restore (1 to ${history.length}):\n${versions}`);
        if (choice && choice > 0 && choice <= history.length) {
            historyStep = choice - 1;
            exams = JSON.parse(history[historyStep]);
            updateQuestionsList();
            updateSectionsList();
            showToast('Version Restored');
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
            e.preventDefault();
            redo();
        }
        if (e.ctrlKey && e.key === 'n') {
            if (currentStep === 2) {
                e.preventDefault();
                promptAddSection();
            }
        }
        if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            if (currentStep === 4) {
                addQuestion();
            } else {
                saveDraft();
            }
        }
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && !e.target.isContentEditable && !e.target.closest('.ql-editor')) {
            if (e.key === 'q' || e.key === 'Q') navigateBuilder(-1);
            if (e.key === 'a' || e.key === 'A') navigateBuilder(1);
            if (currentQuestionType === 'mcq' && ['1', '2', '3', '4'].includes(e.key)) {
                const rows = document.querySelectorAll('.option-row');
                const idx = parseInt(e.key) - 1;
                if (rows[idx]) {
                    setCorrectOption(rows[idx].id);
                }
            }
        }
    });

    // Context Menu Logic
    document.addEventListener('contextmenu', (e) => {
        if (currentStep === 2) {
            e.preventDefault();
            const menu = document.getElementById('customContextMenu');
            menu.style.display = 'flex';
            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';

            // Adjust position if it goes off screen
            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                menu.style.left = (e.clientX - rect.width) + 'px';
            }
            if (rect.bottom > window.innerHeight) {
                menu.style.top = (e.clientY - rect.height) + 'px';
            }
        }
    });

    document.addEventListener('click', () => {
        const menu = document.getElementById('customContextMenu');
        if (menu) menu.style.display = 'none';
    });

    function toggleRightPanel(panel) {
        document.getElementById('logicPanel').style.display = panel === 'logic' ? 'block' : 'none';
        document.getElementById('previewPanel').style.display = panel === 'preview' ? 'block' : 'none';

        document.getElementById('panel-btn-logic').classList.toggle('active', panel === 'logic');
        document.getElementById('panel-btn-preview').classList.toggle('active', panel === 'preview');

        if (panel === 'preview') updateLivePreview();
    }

    function updateLivePreview() {
        const heading = document.getElementById('questionHeading').value || 'Question Heading';
        const content = quill ? quill.root.innerHTML : '';
        const type = currentQuestionType;

        document.getElementById('livePreviewTitle').textContent = heading;
        document.getElementById('livePreviewContent').innerHTML = content;

        let interactionHtml = '';
        if (type === 'mcq' || type === 'true_false') {
            const options = Array.from(document.querySelectorAll('.option-row .ql-editor')).map(i => i.innerHTML).filter(v => v !== '<p><br></p>' && v.trim() !== '');
            interactionHtml = options.map((opt, i) => `
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; padding: 12px; border: 1px solid #eee; border-radius: 0; background: #fafafa;">
                    <div style="width: 20px; height: 20px; border: 2px solid #ddd; border-radius: 50%;"></div>
                    <div style="flex:1; font-size: 0.9rem;">${opt || 'Option ' + (i + 1)}</div>
                </div>
            `).join('');
        } else if (type === 'subjective') {
            interactionHtml = `<textarea class="clean-textarea" style="height: 120px;" placeholder="Student response area..."></textarea>`;
        } else if (type === 'coding') {
            const selectedLangs = Array.from(document.querySelectorAll('#langSelectorGrid input:checked')).map(c => c.value.toUpperCase());
            const displayLang = selectedLangs.length > 0 ? selectedLangs[0] : 'PYTHON';

            interactionHtml = `
                <div style="margin-bottom:10px; font-size:0.7rem; font-weight:700; color:#666;">PREVIEWING AS: <span style="color:var(--primary);">${displayLang}</span></div>
                <div style="background: #ffffff; color: #333; border: 1px solid #ccc; padding: 12px; border-radius: 0; font-family: 'Consolas', monospace; font-size: 0.95rem; height: 150px; overflow: hidden; position: relative;">
                    <div style="color: #008000;">// Student Writes ${displayLang} Code Here...</div>
                    <div style="margin-top: 10px; color:#888;">[ Ace Editor Interface Mock ]</div>
                    
                    <div style="position: absolute; bottom: 10px; right: 10px;">
                        <button onclick="simulateExecution()" class="btn-run" style="height: 32px; font-size: 0.75rem; padding: 0 15px;">RUN CODE</button>
                    </div>
                </div>
                <div id="executionConsole" style="display: none; margin-top: 10px; background: #000; color: #0f0; font-family: 'Consolas', monospace; font-size: 0.8rem; padding: 10px; border-radius: 0; min-height: 80px;">
                </div>
            `;
        }
        document.getElementById('livePreviewInteraction').innerHTML = interactionHtml;
    }

    function simulateExecution() {
        const console = document.getElementById('executionConsole');
        console.style.display = 'block';
        console.innerHTML = '> Initializing Sandbox...<br>> Loading Python Interpreter...<br>> Running Test Cases...<br>';

        setTimeout(() => {
            console.innerHTML += '<span style="color: #fbbf24;">[WAITING]</span> Case 1: Checking constraints...<br>';
        }, 1000);

        setTimeout(() => {
            console.innerHTML += '<span style="color: #10b981;">[PASSED]</span> Case 1: Basic functionality<br>';
            console.innerHTML += '<span style="color: #10b981;">[PASSED]</span> Case 2: Edge cases<br>';
            console.innerHTML += '<br><strong style="color: #fff;">SCORE: 100/100</strong>';
            showToast('Simulation: Execution Success!');
        }, 2500);
    }

    function initAceInline(divId, lang, initialValue = '') {
        const mlang = lang.toLowerCase() === 'c++' ? 'c_cpp' : lang.toLowerCase();
        const editor = ace.edit(divId);
        editor.setTheme("ace/theme/textmate");
        editor.session.setMode("ace/mode/" + mlang);
        editor.setValue(initialValue, -1);
        editor.setOptions({
            fontSize: "16px",
            fontFamily: "Consolas",
            showPrintMargin: false,
            highlightActiveLine: true,
            wrap: true,
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true
        });
        inlineAceEditors[divId] = editor;
    }

    function openEditorOverlay(sourceId, lang, title) {
        aceTargetId = sourceId;
        document.getElementById('overlayTitle').textContent = `${lang.toUpperCase()} ARCHITECT - ${title}`;
        document.getElementById('editorOverlay').style.display = 'flex';

        const initialValue = inlineAceEditors[sourceId] ? inlineAceEditors[sourceId].getValue() : '';
        const aceLang = lang.toLowerCase() === 'c++' ? 'c_cpp' : lang.toLowerCase();

        if (!activeAceEditor) {
            activeAceEditor = ace.edit('monaco-container');
            activeAceEditor.setTheme("ace/theme/textmate");
            activeAceEditor.setOptions({
                fontSize: "18px",
                fontFamily: "Consolas",
                showPrintMargin: false,
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true
            });
        }
        activeAceEditor.session.setMode("ace/mode/" + aceLang);
        activeAceEditor.setValue(initialValue, -1);
    }

    function closeEditorOverlay() {
        if (activeAceEditor && aceTargetId) {
            if (inlineAceEditors[aceTargetId]) {
                inlineAceEditors[aceTargetId].setValue(activeAceEditor.getValue(), -1);
            }
        }
        document.getElementById('editorOverlay').style.display = 'none';
        aceTargetId = null;
    }

    // State & Quill init
    let quill;
    let examStatus = 'Draft';

    window.addEventListener('load', () => {
        quill = new Quill('#editor-container', {
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
        });

        // Hide Loader
        hideLoader();

        // Initialize SortableJS
        if (typeof Sortable !== 'undefined') {
            const el = document.getElementById('questionsList');
            if (el) {
                Sortable.create(el, {
                    animation: 150,
                    onEnd: function (evt) {
                        const itemEl = evt.item;
                        // Logic to reorder exams.questions based on DOM order
                        reorderQuestionsFromUI();
                    }
                });
            }
        }
    });

    function reorderQuestionsFromUI() {
        const listItems = document.querySelectorAll('#questionsList .q-item');
        const newOrder = [];
        listItems.forEach(item => {
            const idx = parseInt(item.getAttribute('data-global-idx'));
            newOrder.push(exams.questions[idx]);
        });
        exams.questions = newOrder;
        updateQuestionsList();
        showToast('Sequence updated via Drag & Drop');
    }

    function filterQuestions() {
        const query = document.getElementById('sidebarSearch').value.toLowerCase();
        const items = document.querySelectorAll('#questionsList .q-item');
        items.forEach(item => {
            const text = item.innerText.toLowerCase();
            item.style.display = text.includes(query) ? 'block' : 'none';
        });
    }

    function showProcessing() {
        const loader = document.getElementById('pageLoader');
        loader.style.display = 'flex';
        loader.style.opacity = '1';
    }

    function toggleRandomization(sectionName, enabled, index) {
        if (!exams.pools) exams.pools = {};
        if (!exams.pools[sectionName]) exams.pools[sectionName] = { enabled: false, pickCount: 0, totalGoal: 0 };

        // If it was just a number from old format, convert it
        if (typeof exams.pools[sectionName] !== 'object') {
            exams.pools[sectionName] = { enabled: true, pickCount: parseInt(exams.pools[sectionName]) || 0, totalGoal: 0 };
        }

        exams.pools[sectionName].enabled = enabled;
        const configArea = document.getElementById(`randConfig_${index}`);
        if (configArea) configArea.style.display = enabled ? 'flex' : 'none';

        autoSave();
        showToast(`Randomization ${enabled ? 'Enabled' : 'Disabled'} for ${sectionName}`);
    }

    function updatePoolMeta(sectionName, key, value) {
        if (!exams.pools) exams.pools = {};
        if (!exams.pools[sectionName] || typeof exams.pools[sectionName] !== 'object') {
            exams.pools[sectionName] = { enabled: true, pickCount: 0, totalGoal: 0 };
        }

        exams.pools[sectionName][key] = parseInt(value) || 0;
        autoSave();
    }

    function updatePool(section, size) {
        // Legacy support
        updatePoolMeta(section, 'pickCount', size);
    }

    function generateJoiningKey() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const gen = (len) => Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
        return `${gen(3)}-${gen(5)}-${gen(3)}`;
    }

    function regenJoiningKey() {
        const newKey = generateJoiningKey();
        document.getElementById('joiningKey').value = newKey;
        exams.joiningKey = newKey;
        showToast('New Joining Key generated');
    }

    function generateAIQuestion() {
        const topic = prompt("Enter topic for AI generation (e.g. Binary Search Tree):");
        if (!topic) return;

        showProcessing();
        setTimeout(() => {
            document.getElementById('questionHeading').value = `Advanced ${topic} Analysis`;
            quill.root.innerHTML = `<p>Implement a solution for <strong>${topic}</strong> that optimizes for time complexity O(log n). Ensure you handle edge cases such as empty inputs.</p>`;
            selectQuestionType('coding');
            const pyCheck = document.querySelector('#langSelectorGrid input[value="python"]');
            if (pyCheck) pyCheck.checked = true;
            updateLanguages();
            hideLoader();
            showToast(`AI Generated ${topic} template!`);
        }, 1200);
    }

    window.openPoolModal = function () {
        try {
            if (typeof db === 'undefined') {
                showToast('Error: Database module not loaded');
                return;
            }
            if (typeof showModal === 'undefined') {
                showToast('Error: Modal system not loaded');
                return;
            }

            const pool = db.getQuestionPool();
            if (!pool || pool.length === 0) {
                showToast('Question Pool is currently empty');
                return;
            }

            const sections = exams.sections || ['General'];
            const sectionOptions = sections.map(sec => `<option value="${sec}">${sec}</option>`).join('');

            const html = `
                <div style="margin-bottom: 20px; display: flex; gap: 12px; align-items: center; background: #fffcfaf2; padding: 12px; border-radius: 0; border: 2px solid rgba(217,108,51,0.15);">
                    <div style="flex: 1; position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--primary); opacity: 0.6;"></i>
                        <input type="text" id="poolSearchInput" placeholder="Search by title (e.g. cn/)..." 
                               style="width: 100%; box-sizing: border-box; padding: 12px 12px 12px 45px; border-radius: 0; border: 1.5px solid #eee; font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 0.95rem; outline: none; transition: all 0.2s;"
                               oninput="filterPoolModalItems(this.value)">
                    </div>
                    <select id="poolTargetSection" style="padding: 12px 16px; border-radius: 0; border: 1.5px solid #eee; font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 0.85rem; color: #333; outline: none; cursor: pointer; background: #fff;">
                        <option value="">Default (Last Section)</option>
                        ${sectionOptions}
                    </select>
                    <button class="btn btn-ghost" onclick="importAllFilteredFromPool()" id="importAllPoolBtn" style="height: 44px; border-radius: 0; border: 2px solid var(--primary); color: var(--primary); font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 0.85rem;">IMPORT ALL</button>
                    <button class="btn btn-run" onclick="importSelectedFromPool()" id="importSelectedPoolBtn" style="height: 44px; border-radius: 0; padding: 0 24px; font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 0.85rem;">IMPORT SELECTED (0)</button>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding: 0 10px;">
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-family: 'Montserrat', sans-serif; font-weight: 700; color: #666; cursor: pointer;">
                        <input type="checkbox" id="poolSelectAll" onchange="togglePoolSelectAll(this.checked)" style="width: 18px; height: 18px; accent-color: var(--primary);">
                        SELECT ALL
                    </label>
                    <span id="poolMatchCount" style="font-size: 0.75rem; color: #999; font-family: 'Montserrat', sans-serif; font-weight: 600;">Showing ${pool.length} questions</span>
                </div>
                <div id="poolModalList" style="max-height: 450px; overflow-y: auto; border: 1px solid #d4d4d4; border-radius: 0; background: #fcfcfc;">
                    ${pool.map(q => {
                const heading = q.heading || q.title || 'Untitled Question';
                const dateStr = q.addedAt ? new Date(q.addedAt).toDateString() : '';
                return `
                        <div class="pool-item" data-heading="${heading.toLowerCase()}" data-id="${q.poolId}" style="padding: 20px 24px; border-bottom: 1px solid #d4d4d4; display: flex; gap: 20px; align-items: center; background: #fff; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#fafafa'" onmouseout="this.style.backgroundColor='#fff'">
                            <input type="checkbox" class="pool-item-check" value="${q.poolId}" onchange="updatePoolSelectedCount()" style="width: 22px; height: 22px; cursor: pointer; accent-color: var(--primary);">
                            <div style="flex:1;">
                                <div style="font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 1rem; color: #111; letter-spacing: 0.3px;">${heading}</div>
                                <div style="font-family: 'Montserrat', sans-serif; font-size: 0.7rem; text-transform: uppercase; font-weight: 800; margin-top: 10px; display: flex; align-items: center; gap: 10px;">
                                    <span style="color: var(--primary); background: #fff5f0; padding: 4px 12px; border-radius: 0; border: 1px solid rgba(217,108,51,0.3); display: inline-block;">${q.type || 'MCQ'}</span>
                                    <span style="color: #333; background: #f4f4f4; padding: 4px 12px; border-radius: 0; border: 1px solid #ccc; display: flex; align-items: center; gap: 6px;"><i class="fas fa-star" style="color: #fbbf24;"></i> ${q.marks || 0} MARKS</span>
                                </div>
                                <div style="font-family: 'Montserrat', sans-serif; font-size: 0.75rem; color: #666; margin-top: 12px; font-weight: 600; display: flex; align-items: center; gap: 18px;">
                                    ${dateStr ? `<span><i class="far fa-calendar-alt" style="margin-right: 6px; color: #999;"></i>Stored: ${dateStr}</span>` : ''}
                                    <span><i class="fas fa-layer-group" style="margin-right: 6px; color: #999;"></i>Level: ${q.difficulty ? q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1) : 'Medium'}</span>
                                </div>
                            </div>
                            <button class="btn btn-ghost" onclick="importQuestionFromPool('${q.poolId}')" style="height: 40px; font-family: 'Montserrat', sans-serif; font-size: 0.75rem; font-weight: 700; padding: 0 24px; width:auto; border-radius: 0; border: 2px solid var(--primary); color: var(--primary); background: transparent; transition: all 0.2s;" onmouseover="this.style.background='var(--primary)'; this.style.color='#fff';" onmouseout="this.style.background='transparent'; this.style.color='var(--primary)';">IMPORT</button>
                        </div>
                    `;
            }).join('')}
                </div>
            `;

            showModal({
                title: 'Global Question Pool',
                desc: 'Search and select multiple questions to instantly architect your assessment timeline.',
                content: html,
                confirmText: 'Close',
                onConfirm: () => { },
                hideCancel: true
            });
        } catch (err) {
            console.error('Pool Modal Error:', err);
            showToast('Error opening pool: ' + err.message);
        }
    };

    window.filterPoolModalItems = (query) => {
        const q = query.toLowerCase();
        const items = document.querySelectorAll('.pool-item');
        let count = 0;
        items.forEach(item => {
            const heading = item.getAttribute('data-heading');
            const isVisible = heading.includes(q);
            item.style.display = isVisible ? 'flex' : 'none';
            if (isVisible) count++;
        });
        document.getElementById('poolMatchCount').textContent = `Showing ${count} questions`;
        document.getElementById('importAllPoolBtn').textContent = q ? `IMPORT ALL MATCHING` : 'IMPORT ALL';
    };

    window.togglePoolSelectAll = (checked) => {
        const visibleChecks = Array.from(document.querySelectorAll('.pool-item')).filter(i => i.style.display !== 'none').map(i => i.querySelector('.pool-item-check'));
        visibleChecks.forEach(c => c.checked = checked);
        updatePoolSelectedCount();
    };

    window.updatePoolSelectedCount = () => {
        const checked = document.querySelectorAll('.pool-item-check:checked').length;
        const btn = document.getElementById('importSelectedPoolBtn');
        if (btn) btn.textContent = `IMPORT SELECTED (${checked})`;
    };

    window.importSelectedFromPool = () => {
        const checked = Array.from(document.querySelectorAll('.pool-item-check:checked')).map(c => c.value);
        if (checked.length === 0) return showToast('No questions selected');

        checked.forEach(id => importQuestionFromPool(id, true));
        showToast(`Bulk imported ${checked.length} questions`);

        const overlay = document.getElementById('customModalOverlay');
        if (overlay) overlay.style.display = 'none';
    };

    window.importAllFilteredFromPool = () => {
        const visibleItems = Array.from(document.querySelectorAll('.pool-item')).filter(i => i.style.display !== 'none');
        const ids = visibleItems.map(i => i.getAttribute('data-id'));

        if (ids.length === 0) return showToast('No matching questions to import');

        ids.forEach(id => importQuestionFromPool(id, true));
        showToast(`Imported all ${ids.length} matching questions`);

        const overlay = document.getElementById('customModalOverlay');
        if (overlay) overlay.style.display = 'none';
    };

    window.importQuestionFromPool = function (poolId, isSilent = false) {
        const pool = db.getQuestionPool();
        const sourceQ = pool.find(q => q.poolId === poolId);
        if (sourceQ) {
            const newQ = JSON.parse(JSON.stringify(sourceQ));
            newQ.id = 'q_' + Date.now() + Math.random();
            delete newQ.poolId;
            delete newQ.addedAt;

            let targetSec = '';
            const secDropdown = document.getElementById('poolTargetSection');
            if (secDropdown && secDropdown.value) {
                targetSec = secDropdown.value;
            } else {
                targetSec = exams.sections && exams.sections.length > 0
                    ? exams.sections[exams.sections.length - 1]
                    : 'General';
            }
            newQ.section = targetSec;

            exams.questions.push(newQ);
            updateQuestionsList();
            if (!isSilent) showToast(`Imported: ${newQ.heading}`);
        }
    };

    function applyTemplate(type) {
        if (type === 'coding') {
            document.getElementById('questionHeading').value = "Coding Challenge Template";
            quill.root.innerHTML = "<p>Problem Description here...</p><h3>Input Format</h3><p>...</p><h3>Output Format</h3><p>...</p>";
            selectQuestionType('coding');
            document.querySelector('#codingContainer input[value="python"]').checked = true;
            updateLanguages();
        }
        showToast("Template Applied");
    }

    function hideLoader() {
        const loader = document.getElementById('pageLoader');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }

    function triggerSecurityBlackout() {
        document.getElementById('securityBlackout').style.display = 'flex';
        setTimeout(() => document.getElementById('securityBlackout').style.display = 'none', 3000);
    }

    // --- ADVANCED DESIGNER LOGIC ---
    function updateEditorStyle(prop, val) {
        const editor = document.querySelector('.ql-editor');
        if (editor) {
            editor.style[prop] = val;
            showToast(`Applied ${prop}: ${val}`);
        }
    }

    function toggleArchitectTheme() {
        const step3 = document.getElementById('step-3');
        step3.classList.toggle('architect-dark-mode');
        showToast('Architect Theme Toggled');
    }

    function insertWebHero(type) {
        const range = quill.getSelection();
        if (!range) {
            showToast('Please click inside the editor first.');
            return;
        }

        let html = '';
        switch (type) {
            case 'h1':
                html = '<h1 style="color:var(--primary); border-left: 5px solid var(--primary); padding-left:15px; margin: 20px 0;">Premium Heading Title</h1>';
                break;
            case 'button':
                html = '<a href="#" style="display:inline-block; background:var(--primary); color:#fff; padding:12px 30px; border-radius:30px; text-decoration:none; font-weight:700; box-shadow: 0 4px 15px rgba(217,108,51,0.3); margin: 10px 0;">ACTION BUTTON</a>';
                break;
            case 'divider':
                html = '<hr style="border:none; height:1px; background:linear-gradient(to right, transparent, #eee, transparent); margin: 30px 0;">';
                break;
            case 'icon':
                html = '<i class="fas fa-rocket" style="color:var(--primary); font-size:1.5rem; margin-right:10px;"></i>';
                break;
        }

        if (html) {
            quill.clipboard.dangerouslyPasteHTML(range.index, html);
            showToast(`Inserted ${type.toUpperCase()}`);
        }
    }

    // Custom Modal System
    function showModal({ title, desc, content, confirmText = 'Confirm', onConfirm, hideCancel = false }) {
        const overlay = document.getElementById('customModalOverlay');
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalDesc').textContent = desc;
        document.getElementById('modalContent').innerHTML = content || '';
        const confirmBtn = document.getElementById('modalConfirm');
        const cancelBtn = document.getElementById('modalCancel');

        if (cancelBtn) cancelBtn.style.display = hideCancel ? 'none' : 'inline-block';
        confirmBtn.textContent = confirmText;

        overlay.style.display = 'flex';

        const cleanup = () => {
            overlay.style.display = 'none';
            document.removeEventListener('keydown', modalKeyHandler);
        };

        const modalKeyHandler = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmBtn.click();
            } else if (e.key === 'Escape') {
                cleanup();
            }
        };

        document.addEventListener('keydown', modalKeyHandler);

        cancelBtn.onclick = cleanup;
        confirmBtn.onclick = () => { onConfirm(); cleanup(); };
    }

    function promptAddSection() {
        showModal({
            title: 'New Section Architecture',
            desc: 'Enter a conceptual name for this assessment portion.',
            content: `<input type="text" id="modalPromptInput" class="clean-input" placeholder="e.g. Cognitive Logic" style="border-bottom: 2px solid var(--primary);">`,
            confirmText: 'Create Section',
            onConfirm: () => {
                const name = document.getElementById('modalPromptInput').value;
                if (name && name.trim()) {
                    exams.sections.push(name.trim());
                    updateSectionsList();
                }
            }
        });

        // Add Enter key listener to the input
        setTimeout(() => {
            const input = document.getElementById('modalPromptInput');
            if (input) {
                input.focus();
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('modalConfirm').click();
                    }
                });
            }
        }, 100);
    }

    // Check auth
    if (!auth.isLoggedIn() || !auth.isTeacher()) {
        window.location.href = '../pages/login.html?role=teacher';
    }

    const urlParams = new URLSearchParams(window.location.search);
    const editExamId = urlParams.get('examId');
    let exam = editExamId ? db.getExamById(editExamId) : null;

    let currentStep = 1;
    let currentQuestionType = 'mcq';
    let exams = exam ? JSON.parse(JSON.stringify(exam)) : {
        title: '',
        description: '',
        duration: 60,
        totalMarks: 100,
        negativeMarking: 0,
        scheduledDate: null,
        wifiRestriction: false,
        allowedWifi: null,
        sections: ['General'],
        questions: [],
        languages: [],
        pools: {},
        identityFields: [],
        theme: { primaryColor: '#D96C33', font: 'Outfit', darkMode: false },
        sectionLockEnabled: false,
        security: {
            blockCopyPaste: false,
            blockScreenshot: false,
            shuffleQuestions: false,
            fullScreenRequired: false,
            webcamEnabled: false,
            micEnabled: false,
            vpnBlocked: false,
            passcode: '',
            entryDeadline: null,
            maxTabSwitches: 3,
        }
    };

    function showCloneModal() {
        const examsList = db.getAllExams();
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return showToast('User session not found');

        const myExams = examsList.filter(e => e.teacherId === currentUser.id);

        if (myExams.length === 0) {
            showToast('No existing tests found to clone');
            return;
        }

        const content = `
            <div style="max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; margin-top: 20px;">
                ${myExams.map(e => `
                    <div style="padding: 16px; border: 1px solid #eee; border-radius: 0; display: flex; justify-content: space-between; align-items: center; background: #fff; transition: all 0.2s;" 
                         onmouseenter="this.style.borderColor='var(--primary)'; this.style.background='#fdf8f5'" 
                         onmouseleave="this.style.borderColor='#eee'; this.style.background='#fff'">
                        <div style="flex:1;">
                            <div style="font-weight: 700; color: #1a1a1b;">${e.title}</div>
                            <div style="font-size: 0.75rem; color: #666; margin-top: 4px;">ID: ${e.testId} Ã¢â‚¬Â¢ ${e.questions.length} Questions Ã¢â‚¬Â¢ ${e.status.toUpperCase()}</div>
                        </div>
                        <button class="btn btn-run" onclick="selectExamToClone('${e.id}')" style="height: 32px; font-size: 0.75rem; padding: 0 15px; width:auto; background:var(--primary); color:#fff; border-radius: 0; border:none; cursor:pointer;">IMPORT</button>
                    </div>
                `).join('')}
            </div>
        `;

        showModal({
            title: 'Clone Existing Test',
            desc: 'Select a test to copy all its questions and settings. You can modify them before publishing as a new test.',
            content: content,
            confirmText: 'Close',
            onConfirm: () => { },
            hideCancel: true
        });
    }

    function selectExamToClone(examId) {
        const sourceExam = db.getExamById(examId);
        if (!sourceExam) return;

        const performClone = () => {
            const clone = JSON.parse(JSON.stringify(sourceExam));

            // Reset IDs and Status for a fresh clone
            delete clone.id;
            delete clone.testId;
            delete clone.passcode;
            clone.status = 'draft';
            clone.title = clone.title + ' (Copy)';
            clone.createdAt = new Date().toISOString();
            clone.joiningKey = generateJoiningKey();

            exams = clone;
            editExamId = null;
            // Clear edit param from URL without refreshing
            window.history.replaceState({}, document.title, window.location.pathname);

            loadExamIntoUI();

            if (typeof closeModal === 'function') closeModal();
            else {
                const overlay = document.querySelector('.custom-modal-overlay') || document.getElementById('customModalOverlay');
                if (overlay) overlay.style.display = 'none';
            }

            showToast('Exam contents loaded! You are now working on a copy.');
        };

        if (exams.questions.length > 0 || (exams.title && exams.title !== '')) {
            showModal({
                title: 'Confirm Architecture Overwrite',
                desc: 'Cloning this test will replace your current architectural progress. This action cannot be undone.',
                content: `
                    <div style="background: #fdf8f5; border: 1px solid #ffe8dd; padding: 20px; border-radius: 0; display: flex; align-items: flex-start; gap: 15px; margin-top: 15px;">
                        <i class="fas fa-exclamation-triangle" style="color: var(--primary); font-size: 1.2rem; margin-top: 2px;"></i>
                        <div style="font-size: 0.9rem; color: #333; line-height: 1.5;">
                            You have an active draft with <strong style="color:var(--primary)">${exams.questions.length} questions</strong>. Are you sure you want to discard your current work and import this assessment?
                        </div>
                    </div>
                `,
                confirmText: 'Overwrite and Clone',
                onConfirm: performClone
            });
        } else {
            performClone();
        }
    }

    function loadExamIntoUI() {
        if (document.getElementById('examTitle')) document.getElementById('examTitle').value = exams.title || '';
        if (document.getElementById('examDescription')) document.getElementById('examDescription').value = exams.description || '';
        if (document.getElementById('examDuration')) document.getElementById('examDuration').value = exams.duration || 60;
        if (document.getElementById('examTotalMarks')) document.getElementById('examTotalMarks').value = exams.totalMarks || 100;
        if (document.getElementById('negativeMarking')) document.getElementById('negativeMarking').value = exams.negativeMarking || 0;
        if (document.getElementById('scheduleDate')) document.getElementById('scheduleDate').value = exams.scheduledDate || '';
        if (document.getElementById('scheduleEndDate')) document.getElementById('scheduleEndDate').value = exams.scheduledEndDate || '';
        if (document.getElementById('isUniversalTime')) document.getElementById('isUniversalTime').checked = exams.isUniversalTime || false;
        if (document.getElementById('joiningKey')) document.getElementById('joiningKey').value = exams.joiningKey || '';

        if (exams.theme) {
            if (document.getElementById('themePrimaryColor')) document.getElementById('themePrimaryColor').value = exams.theme.primaryColor || '#D96C33';
            if (document.getElementById('themeFont')) document.getElementById('themeFont').value = exams.theme.font || 'Outfit';
            if (document.getElementById('themeDarkMode')) document.getElementById('themeDarkMode').checked = exams.theme.darkMode || false;
        }

        if (document.getElementById('sectionLockEnabled')) document.getElementById('sectionLockEnabled').checked = exams.sectionLockEnabled || false;
        if (document.getElementById('lockSections')) document.getElementById('lockSections').checked = exams.sectionLockEnabled || false;
        if (document.getElementById('isPracticeTest')) document.getElementById('isPracticeTest').checked = exams.isPracticeTest || false;
        if (document.getElementById('allowCtrlE')) document.getElementById('allowCtrlE').checked = exams.allowCtrlE || false;

        if (exams.negativeMarking > 0) {
            if (document.getElementById('enableNegativeMarking')) document.getElementById('enableNegativeMarking').checked = true;
            if (document.getElementById('negativeMarking')) {
                document.getElementById('negativeMarking').disabled = false;
                document.getElementById('negativeMarking').value = exams.negativeMarking;
            }
        }

        if (exams.security) {
            if (document.getElementById('blockCopyPaste')) document.getElementById('blockCopyPaste').checked = exams.security.blockCopyPaste;
            if (document.getElementById('blockScreenshot')) document.getElementById('blockScreenshot').checked = exams.security.blockScreenshot;
            if (document.getElementById('shuffleQuestions')) document.getElementById('shuffleQuestions').checked = exams.security.shuffleQuestions;
            if (document.getElementById('fullScreenRequired')) document.getElementById('fullScreenRequired').checked = exams.security.fullScreenRequired;
            if (document.getElementById('desktopOnly')) document.getElementById('desktopOnly').checked = exams.security.desktopOnly || false;
            if (document.getElementById('webcamEnabled')) document.getElementById('webcamEnabled').checked = exams.security.webcamEnabled;
            if (document.getElementById('micEnabled')) document.getElementById('micEnabled').checked = exams.security.micEnabled;
            if (document.getElementById('vpnBlocked')) document.getElementById('vpnBlocked').checked = exams.security.vpnBlocked;
            if (document.getElementById('examPasscode')) document.getElementById('examPasscode').value = exams.security.passcode || '';
            if (document.getElementById('strictPasscode')) document.getElementById('strictPasscode').checked = exams.security.strictPasscode !== false;
            if (document.getElementById('entryDeadline')) document.getElementById('entryDeadline').value = exams.security.entryDeadline || '';
            if (document.getElementById('maxTabSwitches')) document.getElementById('maxTabSwitches').value = exams.security.maxTabSwitches || 3;
            if (document.getElementById('showResults')) document.getElementById('showResults').checked = exams.security.showResults !== false;
            if (document.getElementById('manualGrading')) document.getElementById('manualGrading').checked = exams.security.manualGrading || false;
        }

        if (!exams.testId) {
            exams.testId = 'ping' + Math.floor(100 + Math.random() * 900) + 'net' + Math.floor(100 + Math.random() * 900);
        }
        if (document.getElementById('customTestId')) {
            document.getElementById('customTestId').value = exams.testId;
        }

        updateSectionsList();
        updateQuestionsList();
        updateIdentityFieldsList();
    }
    function initPage() {
        lucide.createIcons();
        if (typeof populateSavedClasses === 'function') populateSavedClasses();

        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');

        if (editId) {
            editExamId = editId;
            const existing = db.getExamById(editId);
            if (existing) {
                exams = existing;
            }
        }

        loadExamIntoUI();
        hideLoader();

        // Initialize Joining Key for new exams
        if (!editExamId && !exams.joiningKey) {
            exams.joiningKey = generateJoiningKey();
            if (document.getElementById('joiningKey')) document.getElementById('joiningKey').value = exams.joiningKey;
        }

        const savedStep = localStorage.getItem('exam_step_' + (editExamId || 'new'));
        if (savedStep) {
            goToStep(parseInt(savedStep), true);
        } else {
            goToStep(1, true);
        }

        if (!editExamId) {
            const temp = localStorage.getItem('TESTPAD_creator_temp');
            if (temp) {
                const recovered = JSON.parse(temp);
                showModal({
                    title: 'Draft Recovery',
                    desc: 'We found an in-progress architectural draft. Would you like to continue building it?',
                    confirmText: 'Restore Draft',
                    onConfirm: () => {
                        exams = recovered;
                        loadExamIntoUI();
                        showToast('Draft restored successfully');
                    }
                });
            }
        }

        // Periodic Autosave every 20 seconds
        setInterval(autoSave, 20000);

        // Header Widget Logic
        const profileToggle = document.getElementById('profileToggle');
        const profileMenu = document.getElementById('profileMenu');

        if (profileToggle && profileMenu) {
            profileToggle.onclick = (e) => {
                e.stopPropagation();
                profileMenu.classList.toggle('active');
            };
        }

        window.onclick = (e) => {
            if (profileMenu && profileMenu.classList.contains('active')) {
                profileMenu.classList.remove('active');
            }
        };
    }

    function updateIdentityFieldsList() {
        const container = document.getElementById('identityFieldsList');
        if (!container) return;

        if (!exams.identityFields || exams.identityFields.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:20px; color:#999; font-size:0.8rem; background:#fcfcfc; border:1px dashed #eee; border-radius: 0;">No identity verification questions defined.</div>';
            return;
        }

        container.innerHTML = exams.identityFields.map((f, i) => `
            <div style="display:grid; grid-template-columns: 1.5fr 1fr 1.5fr 80px 40px; gap:16px; align-items:end; background:#fff; border:1px solid #eee; padding:16px; border-radius: 0;">
                <div class="input-group" style="margin:0;">
                    <label class="label" style="font-size:0.65rem;">FIELD LABEL / QUESTION</label>
                    <input type="text" value="${f.label}" onchange="updateIdentityField(${i}, 'label', this.value)" class="clean-input" style="font-size:0.85rem;" placeholder="e.g. Blind Roll Number">
                </div>
                <div class="input-group" style="margin:0;">
                    <label class="label" style="font-size:0.65rem;">INPUT TYPE</label>
                    <select onchange="updateIdentityField(${i}, 'type', this.value)" class="clean-input" style="font-size:0.85rem;">
                        <option value="text" ${f.type === 'text' ? 'selected' : ''}>Subjective Text</option>
                        <option value="dropdown" ${f.type === 'dropdown' ? 'selected' : ''}>Dropdown Selection</option>
                        <option value="testcode" ${f.type === 'testcode' ? 'selected' : ''}>Test Code (Match Exactly)</option>
                    </select>
                </div>
                <div class="input-group" style="margin:0;">
                    <label class="label" style="font-size:0.65rem;">${f.type === 'dropdown' ? 'OPTIONS (COMMA SEPARATED)' : (f.type === 'testcode' ? 'REQUIRED CODE' : 'PLACEHOLDER')}</label>
                    <input type="text" value="${f.value || ''}" onchange="updateIdentityField(${i}, 'value', this.value)" class="clean-input" style="font-size:0.85rem;" placeholder="${f.type === 'dropdown' ? 'A, B, C' : ''}">
                </div>
                <div class="input-group" style="margin:0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; padding-bottom:8px;">
                    <label class="label" style="font-size:0.65rem;">MANDATORY</label>
                    <input type="checkbox" onchange="updateIdentityField(${i}, 'required', this.checked)" ${f.required !== false ? 'checked' : ''} style="width:18px; height:18px; margin-top:8px; cursor:pointer;">
                </div>
                <button onclick="removeIdentityField(${i})" style="width:40px; height:40px; background:#FEF3F2; color:#F04438; border:1px solid #FEE4E2; border-radius: 0; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');
    }

    function addIdentityField() {
        if (!exams.identityFields) exams.identityFields = [];
        exams.identityFields.push({ label: '', type: 'text', value: '', required: true });
        updateIdentityFieldsList();
        autoSave();
    }

    function updateIdentityField(index, key, val) {
        exams.identityFields[index][key] = val;
        updateIdentityFieldsList(); // Refresh to update labels if type changed
        autoSave();
    }

    function removeIdentityField(index) {
        exams.identityFields.splice(index, 1);
        updateIdentityFieldsList();
        autoSave();
    }

    function selectQuestionType(type) {
        currentQuestionType = type;
        document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
        const tab = document.getElementById(`type-${type}`);
        if (tab) tab.classList.add('active');

        // Toggle containers
        document.getElementById('optionsContainer').style.display = (type === 'mcq' || type === 'true_false' || type === 'assertion_reason') ? 'block' : 'none';
        document.getElementById('subjectiveContainer').style.display = (type === 'subjective' || type === 'drawing') ? 'block' : 'none';
        document.getElementById('numericContainer').style.display = (type === 'numeric' || type === 'single_integer') ? 'block' : 'none';
        document.getElementById('fileUploadContainer').style.display = type === 'file_upload' ? 'block' : 'none';
        document.getElementById('codingContainer').style.display = type === 'coding' ? 'block' : 'none';

        const shuffleGrp = document.getElementById('shuffleOptionsGroup');
        if (shuffleGrp) shuffleGrp.style.display = (type === 'mcq') ? 'block' : 'none';

        document.getElementById('optionsList').innerHTML = '';
        if (type === 'true_false') {
            addOptionWithValue('True');
            addOptionWithValue('False');
        } else if (type === 'assertion_reason') {
            addOptionWithValue('Both Assertion (A) and Reason (R) are true and R is the correct explanation of A');
            addOptionWithValue('Both Assertion (A) and Reason (R) are true but R is not the correct explanation of A');
            addOptionWithValue('Assertion (A) is true but Reason (R) is false');
            addOptionWithValue('Assertion (A) is false but Reason (R) is true');
        } else if (type === 'mcq') {
            addOption(); addOption(); addOption(); addOption();
        }

        if (type === 'coding') {
            populateLanguages();
            if (document.getElementById('testCasesContainer').children.length === 0) {
                addTestCaseRow('// Sample Input', '// Sample Output', 2, true);
            }
        }
    }

    function populateLanguages() {
        const langGrid = document.getElementById('langSelectorGrid');
        if (!langGrid) return;
        const langs = [
            { id: 'python', name: 'Python' },
            { id: 'javascript', name: 'JavaScript' },
            { id: 'java', name: 'Java' },
            { id: 'cpp', name: 'C++' },
            { id: 'c', name: 'C' }
        ];

        langGrid.innerHTML = langs.map(l => `
            <label class="lang-check" style="display:flex; align-items:center; gap:8px; background:#fff; padding:10px; border-radius: 0; border:1px solid #eee; cursor:pointer; font-size:0.85rem; font-weight:600;">
                <input type="checkbox" value="${l.id}" onchange="updateLanguages()" style="width:16px; height:16px;">
                ${l.name}
            </label>
        `).join('');

        // Add "Add Test Case" action row if not exists
        if (!document.getElementById('testCaseActionsRow')) {
            const row = document.createElement('div');
            row.id = 'testCaseActionsRow';
            row.style = 'display: flex; gap: 12px; margin-top: 16px;';

            const addBtn = document.createElement('button');
            addBtn.id = 'addTestCaseBtn';
            addBtn.className = 'btn btn-ghost';
            addBtn.style = 'flex: 1; border:1px dashed #ddd; background:#fff; height: 40px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; cursor: pointer;';
            addBtn.innerHTML = '+ Add Hidden Test Case';
            addBtn.onclick = () => addTestCaseRow();

            const pasteBtn = document.createElement('button');
            pasteBtn.id = 'pasteTestCaseBtn';
            pasteBtn.className = 'btn btn-ghost';
            pasteBtn.style = 'border:1px dashed #ddd; background:#fff; display: none; height: 40px; align-items: center; justify-content: center; gap: 8px; font-weight: 600; cursor: pointer; padding: 0 16px;';
            pasteBtn.innerHTML = '<i class="far fa-clipboard"></i> Paste Test Case';
            pasteBtn.onclick = () => pasteTestCase();

            row.appendChild(addBtn);
            row.appendChild(pasteBtn);
            document.getElementById('codingContainer').appendChild(row);
        }
        updatePasteButtonVisibility();
    }

    function updatePasteButtonVisibility() {
        const pasteBtn = document.getElementById('pasteTestCaseBtn');
        if (pasteBtn) {
            const hasCopied = !!localStorage.getItem('TESTPAD_copied_testcase');
            pasteBtn.style.display = hasCopied ? 'inline-flex' : 'none';
            if (hasCopied) {
                pasteBtn.style.alignItems = 'center';
                pasteBtn.style.justifyContent = 'center';
                pasteBtn.style.gap = '8px';
            }
        }
    }

    function pasteTestCase() {
        try {
            const dataStr = localStorage.getItem('TESTPAD_copied_testcase');
            if (!dataStr) {
                showToast('No test case found in clipboard');
                return;
            }
            const tc = JSON.parse(dataStr);
            const marks = tc.isSample ? 0 : (tc.marks || 2);
            addTestCaseRow(tc.input || '', tc.output || '', marks, tc.isSample || false);
            showToast('Test Case Pasted');
        } catch (e) {
            showToast('Failed to paste test case', 'error');
        }
    }

    function addOption() { addOptionWithValue(''); }

    function addOptionWithValue(val, isCorrect = false) {
        const list = document.getElementById('optionsList');
        const id = 'opt_' + Math.random().toString(36).substr(2, 9);
        const editorId = 'editor_' + id;
        const div = document.createElement('div');
        div.className = `option-row ${isCorrect ? 'is-correct' : ''}`;
        div.id = id;
        div.style.padding = '16px';
        div.style.borderWidth = '2px';
        div.innerHTML = `
                <div class="option-selector" onclick="setCorrectOption('${id}')" style="width:28px; height:28px;"></div>
                <div style="flex:1; border:1px solid #eee; border-radius: 0; overflow:hidden; background:#fff;">
                    <div id="${editorId}" class="option-editor" style="min-height:60px; font-size:1rem; border:none;"></div>
                </div>
                <button onclick="this.parentElement.remove()" style="background:none; border:none; cursor:pointer; color:#ef4444; font-size: 1.1rem; display:flex; align-items:center; padding:8px;">&times;</button>
            `;
        list.appendChild(div);

        const quillOpt = new Quill('#' + editorId, {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['image', 'code-block']
                ]
            }
        });

        const tb = div.querySelector('.ql-toolbar');
        if (tb) {
            tb.style.border = 'none';
            tb.style.borderBottom = '1px solid #eee';
            tb.style.background = '#fafafa';
        }

        if (val) {
            if (String(val).trim().startsWith('<')) {
                quillOpt.clipboard.dangerouslyPasteHTML(0, val);
            } else {
                quillOpt.setText(val);
            }
        }
    }

    function autofillOptions() {
        const list = document.getElementById('optionsList');
        if (!list) return;
        const type = document.getElementById('autofillType') ? document.getElementById('autofillType').value : 'numeric';
        const rows = list.querySelectorAll('.option-row');
        const alphabets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        rows.forEach((row, index) => {
            const qlEditor = row.querySelector('.ql-editor');
            if (qlEditor) {
                if (type === 'alphabetic') {
                    qlEditor.innerHTML = `<p>${alphabets[index] || String.fromCharCode(65 + index)}</p>`;
                } else {
                    qlEditor.innerHTML = `<p>${index + 1}</p>`;
                }
            }
        });
        showToast('Options auto-filled');
    }

    function setCorrectOption(id) {
        document.querySelectorAll('.option-row').forEach(r => r.classList.remove('is-correct'));
        document.getElementById(id).classList.add('is-correct');
    }

    function getCorrectAnswer() {
        const correctRow = document.querySelector('.option-row.is-correct');
        if (!correctRow) return null;
        const editor = correctRow.querySelector('.ql-editor');
        return editor ? editor.innerHTML : null;
    }

    function addTestCaseRow(input = '', output = '', marks = 2, isSample = false) {
        const container = document.getElementById('testCasesContainer');
        const div = document.createElement('div');
        div.className = 'test-case-card';
        div.innerHTML = `
                <div style="position: absolute; top: 20px; right: 20px; display: flex; gap: 10px;">
                    <button class="nav-icon-btn" onclick="copyTestCase(this)" title="Copy Test Case" style="color: var(--primary); background: #fff5f0; border: 1px solid #ffe8dd; width: 32px; height: 32px; border-radius: 0; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <i class="far fa-copy"></i>
                    </button>
                    <button class="nav-icon-btn" onclick="cloneTestCase(this)" title="Clone Test Case" style="color: var(--primary); background: #fff5f0; border: 1px solid #ffe8dd; width: 32px; height: 32px; border-radius: 0; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <i class="far fa-clone"></i>
                    </button>
                    <button class="nav-icon-btn" onclick="this.closest('.test-case-card').remove()" title="Delete" style="color: #F04438; background: #FEF3F2; border: 1px solid #FEE4E2; width: 32px; height: 32px; border-radius: 0; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                
                <div class="test-case-input-group">
                    <label class="label" style="font-weight:700; color:#333;">INPUT FORMAT / SAMPLE INPUT</label>
                    <textarea class="clean-textarea t-input" style="height:100px; min-height:100px; border:none; background:#f2f2f2; border-radius: 0; padding:15px; font-family:'JetBrains Mono'; font-size:0.9rem;" placeholder="Enter input content...">${input}</textarea>
                </div>

                <div class="test-case-input-group">
                    <label class="label" style="font-weight:700; color:#333;">OUTPUT FORMAT / SAMPLE OUTPUT</label>
                    <textarea class="clean-textarea t-output" style="height:100px; min-height:100px; border:none; background:#f2f2f2; border-radius: 0; padding:15px; font-family:'JetBrains Mono'; font-size:0.9rem;" placeholder="Enter output content...">${output}</textarea>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px; padding-top:16px; border-top:1px solid #f5f5f5;">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <label style="font-size:0.65rem; font-weight:700; color:#999; letter-spacing:0.5px;">WIEGHT (MARKS)</label>
                            <input type="number" class="clean-input t-marks" value="${isSample ? 0 : marks}" ${isSample ? 'disabled style="opacity: 0.5;"' : ''} style="width:120px; font-weight:700; font-size:1.1rem; color:var(--primary);" placeholder="Marks">
                        </div>
                    </div>
                    <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.85rem; font-weight:600; color:#555; background:#f9f9f9; padding:8px 16px; border-radius:30px; border:1px solid #eee;">
                        <input type="checkbox" class="t-sample" ${isSample ? 'checked' : ''} onchange="toggleTestCaseSample(this)"> 
                        <span>Mark as Sample Case</span>
                    </label>
                </div>
            `;
        container.appendChild(div);
    }

    window.copyTestCase = (btn) => {
        const card = btn.closest('.test-case-card');
        const input = card.querySelector('.t-input').value;
        const output = card.querySelector('.t-output').value;
        const marks = card.querySelector('.t-marks').value;
        const isSample = card.querySelector('.t-sample').checked;

        const tc = { input, output, marks: parseInt(marks) || 0, isSample };
        localStorage.setItem('TESTPAD_copied_testcase', JSON.stringify(tc));

        navigator.clipboard.writeText(JSON.stringify(tc, null, 2))
            .then(() => {
                showToast('Test Case copied to clipboard');
                updatePasteButtonVisibility();
            })
            .catch(err => {
                showToast('Test Case copied to internal clipboard');
                updatePasteButtonVisibility();
            });
    };

    window.cloneTestCase = (btn) => {
        const card = btn.closest('.test-case-card');
        const input = card.querySelector('.t-input').value;
        const output = card.querySelector('.t-output').value;
        const marks = card.querySelector('.t-marks').value;
        const isSample = card.querySelector('.t-sample').checked;

        addTestCaseRow(input, output, marks, isSample);
        showToast('Test Case Cloned');
    };

    function toggleTestCaseSample(cb) {
        const marksInput = cb.parentElement.parentElement.querySelector('.t-marks');
        if (cb.checked) {
            marksInput.value = 0;
            marksInput.disabled = true;
            marksInput.style.opacity = '0.5';
        } else {
            marksInput.value = 2;
            marksInput.disabled = false;
            marksInput.style.opacity = '1';
        }
    }

    function addQuestion() {
        const headingInput = document.getElementById('questionHeading');
        const htmlContent = quill.root.innerHTML;

        if (!headingInput.value.trim()) {
            showToast('Question Heading identifies your question');
            headingInput.focus();
            return;
        }
        if (quill.getText().trim().length === 0) {
            showToast('Problem statement cannot be empty');
            return;
        }

        const q = {
            id: 'q_' + Date.now(),
            source: 'exam',
            type: currentQuestionType,
            heading: headingInput.value.trim(),
            title: htmlContent, // Rich text content
            marks: parseInt(document.getElementById('questionMarks').value),
            section: document.getElementById('questionSection').value || 'General',
            timer: parseInt(document.getElementById('questionTimer').value) || 0,
            teacherNotes: document.getElementById('teacherNotes').value.trim(),
            difficulty: document.getElementById('questionDifficulty').value || 'medium',
            shuffleOptions: document.getElementById('shuffleOptions')?.checked || false
        };

        if (currentQuestionType === 'mcq' || currentQuestionType === 'true_false' || currentQuestionType === 'assertion_reason') {
            q.options = Array.from(document.querySelectorAll('.option-row .ql-editor')).map(i => i.innerHTML).filter(v => v !== '<p><br></p>' && v.trim() !== '');
            if (q.options.length < 2) { showToast('Add at least 2 options'); return; }
            q.correctAnswer = getCorrectAnswer();
            if (!q.correctAnswer) { showToast('Select the correct option (orange circle)'); return; }
        }
        else if (currentQuestionType === 'subjective' || currentQuestionType === 'drawing') {
            q.keywords = document.getElementById('keywords').value.split(',').map(k => k.trim()).filter(k => k);
        } else if (currentQuestionType === 'numeric' || currentQuestionType === 'single_integer') {
            q.correctNumeric = parseFloat(document.getElementById('correctNumeric').value);
            q.tolerance = parseFloat(document.getElementById('numericTolerance').value) || 0;
            if (isNaN(q.correctNumeric)) { showToast('Enter a valid numeric answer'); return; }
        } else if (currentQuestionType === 'file_upload') {
            q.allowedExtensions = document.getElementById('allowedExtensions').value.split(',').map(e => e.trim()).filter(e => e);
            q.maxFileSize = parseInt(document.getElementById('maxFileSize').value) || 10;
        } else if (currentQuestionType === 'coding') {
            q.languages = Array.from(document.querySelectorAll('#langSelectorGrid input:checked')).map(c => c.value);
            if (q.languages.length === 0) { showToast('Select at least one language'); return; }
            q.code = {};
            q.languages.forEach(l => {
                q.code[l] = {
                    prefix: inlineAceEditors[`code_prefix_${l}`]?.getValue() || '',
                    middle: inlineAceEditors[`code_middle_${l}`]?.getValue() || '',
                    suffix: inlineAceEditors[`code_suffix_${l}`]?.getValue() || '',
                    lockPrefix: document.getElementById(`lock_prefix_${l}`).checked,
                    lockSuffix: document.getElementById(`lock_suffix_${l}`).checked,
                    hidePrefix: document.getElementById(`hide_prefix_${l}`).checked,
                    hideSuffix: document.getElementById(`hide_suffix_${l}`).checked
                };
            });

            q.testCases = Array.from(document.querySelectorAll('.test-case-card')).map(card => ({
                input: card.querySelector('.t-input').value,
                output: card.querySelector('.t-output').value,
                marks: parseInt(card.querySelector('.t-marks').value) || 0,
                isSample: card.querySelector('.t-sample').checked
            }));

            // Sum up marks of test cases for coding questions
            q.marks = q.testCases.reduce((sum, tc) => sum + tc.marks, 0);
        }

        if (editingQIndex !== -1) {
            exams.questions[editingQIndex] = q;
            showToast('Question synchronized');
        } else {
            exams.questions.push(q);
            db.addToQuestionPool(q);
            showToast('Question added to timeline');
        }

        editingQIndex = -1;
        updateQuestionsList();
        updateSectionsList();
        resetBuilder();
        autoSave();
    }

    function updateSectionsList() {
        const list = document.getElementById('sectionsList');
        if (!list) return;
        list.innerHTML = exams.sections.map((s, i) => {
            let secQuestions = exams.questions ? exams.questions.filter(q => q.section === s) : [];
            let totalGoal = (exams.pools && exams.pools[s] && exams.pools[s].totalGoal) ? exams.pools[s].totalGoal : secQuestions.length;

            return `
                <div class="accordion-card" style="margin-bottom: 24px; border-radius: 0; border: 1px solid #e0e0e0; background: #fff; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03); padding: 0 !important;">
                    <!-- Accordion Header with ALL Options -->
                    <div style="background: var(--primary); color: white; padding: 20px 32px; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; gap: 20px;">
                        
                        <!-- Left: Title & Rename -->
                        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                            <div style="font-weight: 800; font-size: 1.4rem;">
                                ${s} - Section ${i + 1}
                            </div>
                            <button onclick="renameSectionPrompt('${s}', ${i})" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: white; width: 32px; height: 32px; border-radius: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Rename Section" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                        
                        <!-- Middle: Randomize Config -->
                        <div style="display: flex; align-items: center; gap: 15px; background: rgba(0,0,0,0.1); padding: 6px 16px; border-radius: 0; border: 1px solid rgba(255,255,255,0.1);">
                            <label style="font-size:0.8rem; font-weight:700; color:white; display:flex; align-items:center; gap:8px; cursor:pointer; margin:0; letter-spacing: 0.5px;">
                                <input type="checkbox" id="randEnabled_${i}" ${(exams.pools && exams.pools[s] && exams.pools[s].enabled) ? 'checked' : ''} 
                                    onchange="toggleRandomization('${s}', this.checked, ${i})" style="width:16px; height:16px; cursor:pointer;">
                                RANDOMIZE
                            </label>
                            
                            <div id="randConfig_${i}" style="display:${(exams.pools && exams.pools[s] && exams.pools[s].enabled) ? 'flex' : 'none'}; align-items:center; gap:12px; padding-left: 15px; border-left: 1px solid rgba(255,255,255,0.2);">
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <span style="font-size:0.75rem; font-weight:700; opacity: 0.9;">POOL:</span>
                                    <input type="number" value="${(exams.pools && exams.pools[s] && exams.pools[s].totalGoal) || 0}" 
                                        style="width:40px; height:24px; border-radius:4px; border:none; font-weight:800; text-align:center; color:#cf8469; background:#fff; font-size: 0.8rem; outline: none;" 
                                        onchange="updatePoolMeta('${s}', 'totalGoal', this.value)">
                                </div>
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <span style="font-size:0.75rem; font-weight:700; opacity: 0.9;">PICK:</span>
                                    <input type="number" value="${(exams.pools && exams.pools[s] && (exams.pools[s].pickCount !== undefined ? exams.pools[s].pickCount : exams.pools[s])) || 0}" 
                                        style="width:40px; height:24px; border-radius:4px; border:none; font-weight:800; text-align:center; color:#cf8469; background:#fff; font-size: 0.8rem; outline: none;" 
                                        onchange="updatePoolMeta('${s}', 'pickCount', this.value)">
                                </div>
                            </div>
                        </div>

                        <!-- Right: Actions & Expand -->
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1; justify-content: flex-end;">
                            <button onclick="duplicateSection(${i})" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: white; width: 36px; height: 36px; border-radius: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Duplicate Section" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
                                <i class="far fa-copy"></i>
                            </button>
                            ${exams.sections.length > 1 ? `
                                <button onclick="removeSection(${i})" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: white; width: 36px; height: 36px; border-radius: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Remove Section" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            ` : ''}
                            
                            <div onclick="toggleSectionActions(${i})" style="cursor: pointer; display: flex; align-items: center; gap: 10px; margin-left: 10px; padding: 8px 16px; background: rgba(0,0,0,0.15); border-radius: 0; border: 1px solid rgba(0,0,0,0.1); transition: all 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.25)'" onmouseout="this.style.background='rgba(0,0,0,0.15)'">
                                <span style="font-size: 0.95rem; font-weight: 600;">${secQuestions.length}/${totalGoal > 0 ? totalGoal : secQuestions.length} Questions</span>
                                <i class="fas fa-chevron-down" id="secActionIcon_${i}" style="transition: transform 0.3s ease;"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Accordion Body (Initially Hidden) - ONLY CONTAINS TABLE NOW -->
                    <div id="secActions_${i}" style="display: none; background: #fff;">
                        <!-- Questions Table -->
                        <div style="padding: 24px; overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                                <thead>
                                    <tr>
                                        <th style="padding: 0 12px 16px 12px; text-align: left; color: #111; font-weight: 700; border-bottom: 1px solid #eee; width: 80px;">Sr. no.</th>
                                        <th style="padding: 0 12px 16px 12px; text-align: left; color: #111; font-weight: 700; border-bottom: 1px solid #eee;">Question</th>
                                        <th style="padding: 0 12px 16px 12px; text-align: left; color: #111; font-weight: 700; border-bottom: 1px solid #eee; width: 100px;">Type</th>
                                        <th style="padding: 0 12px 16px 12px; text-align: left; color: #111; font-weight: 700; border-bottom: 1px solid #eee; width: 100px;">Status</th>
                                        <th style="padding: 0 12px 16px 12px; text-align: left; color: #111; font-weight: 700; border-bottom: 1px solid #eee; width: 150px;">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${secQuestions.length > 0 ? secQuestions.map((q, qIndex) => `
                                    <tr>
                                        <td style="padding: 20px 12px; color: #333; font-weight: 500; border-bottom: 1px solid #f5f5f5;">${qIndex + 1}.</td>
                                        <td style="padding: 20px 12px; color: #333; font-weight: 500; border-bottom: 1px solid #f5f5f5;">${q.heading || q.title || 'Untitled'}</td>
                                        <td style="padding: 20px 12px; color: #666; border-bottom: 1px solid #f5f5f5; text-transform: capitalize;">${q.type || 'Mcq'}</td>
                                        <td style="padding: 20px 12px; color: #444; border-bottom: 1px solid #f5f5f5; font-weight: 500;">Saved</td>
                                        <td style="padding: 20px 12px; border-bottom: 1px solid #f5f5f5;">
                                            <button onclick="goToStep(4); document.getElementById('questionSection').value = '${s}'; renderQuestions(); editQuestion('${q.id}');" style="background: none; border: none; color: #cf8469; cursor: pointer; font-size: 0.95rem; text-align: left; padding: 0;">
                                                Modify<br>Question
                                            </button>
                                        </td>
                                    </tr>
                                    `).join('') : `
                                    <tr>
                                        <td colspan="5" style="padding: 40px 12px; text-align: center; color: #999; font-style: italic;">No questions added to this section yet. Add them in Step 4.</td>
                                    </tr>
                                    `}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        lucide.createIcons();
        document.getElementById('questionSection').innerHTML = exams.sections.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    function toggleSectionActions(i) {
        let panel = document.getElementById('secActions_' + i);
        let icon = document.getElementById('secActionIcon_' + i);
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            icon.className = 'fas fa-chevron-up';
        } else {
            panel.style.display = 'none';
            icon.className = 'fas fa-chevron-down';
        }
    }

    function renameSectionPrompt(oldName, index) {
        let newName = prompt("Enter new name for section:", oldName);
        if (newName && newName.trim() !== '' && newName !== oldName) {
            newName = newName.trim().toUpperCase().replace(/\s+/g, '_');
            exams.sections[index] = newName;

            if (exams.questions) {
                exams.questions.forEach(q => {
                    if (q.section === oldName) q.section = newName;
                });
            }
            if (exams.pools && exams.pools[oldName]) {
                exams.pools[newName] = exams.pools[oldName];
                delete exams.pools[oldName];
            }
            updateSectionsList();
            saveDraft();
        }
    }

    function removeSection(index) {
        showModal({
            title: 'Confirm Deletion',
            desc: `Are you sure you want to remove the section "${exams.sections[index]}" and all its logic?`,
            onConfirm: () => {
                exams.sections.splice(index, 1);
                updateSectionsList();
            }
        });
    }

    function duplicateSection(index) {
        const sourceSec = exams.sections[index];
        const newSec = sourceSec + ' (Copy)';
        exams.sections.push(newSec);

        // Duplicate questions in this section
        const secQuestions = exams.questions.filter(q => q.section === sourceSec);
        secQuestions.forEach(q => {
            const newQ = JSON.parse(JSON.stringify(q));
            newQ.id = 'q_' + Date.now() + Math.random();
            newQ.section = newSec;
            exams.questions.push(newQ);
        });

        updateSectionsList();
        updateQuestionsList();
        showToast('Section and questions duplicated');
    }

    function updateQuestionsList() {
        lucide.createIcons();

        let totalMarks = 0;
        let codingCount = 0;
        let subjectiveCount = 0;
        let objectiveCount = 0;

        exams.questions.forEach(q => {
            totalMarks += parseInt(q.marks || 0);
            if (q.type === 'coding') codingCount++;
            else if (q.type === 'subjective') subjectiveCount++;
            else objectiveCount++;
        });

        const statsEl = document.getElementById('examStatsSummary');
        if (statsEl) {
            statsEl.innerHTML = `
                <div style="background: #fff; border: 2px solid var(--primary); border-radius: 0; margin-bottom: 24px; font-family: 'Montserrat', sans-serif; overflow: hidden; box-shadow: 0 4px 15px rgba(217, 108, 51, 0.1);">
                    <div id="testSummaryHeader" style="background: var(--primary); color: #fff; padding: 12px 16px; font-size: 1.1rem; font-weight: 700; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s;">
                        <span style="display: flex; align-items: center; gap: 10px;"><i class="fas fa-clipboard-check"></i> Test Details & Summary</span>
                        <i id="testSummaryIcon" class="fas fa-chevron-down" style="transition: transform 0.3s;"></i>
                    </div>
                    <div id="testSummaryContent" style="display: none; padding: 20px; font-size: 0.95rem; color: #444; background: #ffffff; max-height: 250px; overflow: auto; white-space: nowrap;">
                        <div style="display: flex; flex-direction: column; gap: 16px; font-weight: 500;">
                            <div style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-user-circle" style="color:var(--primary); font-size: 1.2rem; width: 24px; text-align: center;"></i> <strong>Created By:</strong> <span style="margin-left: auto;">${(typeof auth !== 'undefined' && auth.getCurrentUser()) ? auth.getCurrentUser().name : (exams.createdBy || 'Admin')}</span></div>
                            <div style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-building" style="color:var(--primary); font-size: 1.2rem; width: 24px; text-align: center;"></i> <strong>Department:</strong> <span style="margin-left: auto;">${exams.department || 'Computer Science'}</span></div>
                            <div style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-clock" style="color:var(--primary); font-size: 1.2rem; width: 24px; text-align: center;"></i> <strong>Time Started:</strong> <span style="margin-left: auto;">${exams.timeStarted || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                            <div style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-hourglass-half" style="color:var(--primary); font-size: 1.2rem; width: 24px; text-align: center;"></i> <strong>Duration:</strong> <span style="margin-left: auto;">${exams.duration || 60} Mins</span></div>
                            <div style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-sync-alt" style="color:var(--primary); font-size: 1.2rem; width: 24px; text-align: center;"></i> <strong>Refreshes:</strong> <span style="margin-left: auto;">${exams.allowedRefreshes || 'Unlimited'}</span></div>
                            <div style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-minus-circle" style="color:var(--primary); font-size: 1.2rem; width: 24px; text-align: center;"></i> <strong>Negative Mark:</strong> <span style="margin-left: auto;">${exams.negativeMarking || 0}</span></div>
                        </div>
                        <div style="margin-top: 20px; padding-top: 16px; border-top: 2px dashed rgba(217,108,51,0.2); display: flex; flex-direction: column; gap: 16px; font-weight: 500;">
                            <div style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-star" style="color:var(--primary); font-size: 1.2rem; width: 24px; text-align: center;"></i> <strong>Total Marks:</strong> <span style="color: var(--primary); font-weight: 800; margin-left: auto;">${totalMarks}</span></div>
                            <div style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-check-circle" style="color:var(--primary); font-size: 1.2rem; width: 24px; text-align: center;"></i> <strong>Objective:</strong> <span style="color: var(--primary); font-weight: 800; margin-left: auto;">${objectiveCount}</span></div>
                            <div style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-pen-fancy" style="color:var(--primary); font-size: 1.2rem; width: 24px; text-align: center;"></i> <strong>Subjective:</strong> <span style="color: var(--primary); font-weight: 800; margin-left: auto;">${subjectiveCount}</span></div>
                            <div style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-code" style="color:var(--primary); font-size: 1.2rem; width: 24px; text-align: center;"></i> <strong>Coding:</strong> <span style="color: var(--primary); font-weight: 800; margin-left: auto;">${codingCount}</span></div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('testSummaryHeader').onclick = function () {
                const content = document.getElementById('testSummaryContent');
                const icon = document.getElementById('testSummaryIcon');
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    content.style.display = 'none';
                    icon.style.transform = 'rotate(0deg)';
                }
            };
        }

        // Sync both sidebar and architect rail if they exist
        const sidebarList = document.getElementById('questionsList');
        const railList = document.getElementById('questionsListArchitect');

        if (!exams.questions || exams.questions.length === 0) {
            const empty = '<div style="text-align:center; padding:40px; color:#999; font-size:0.85rem; background:#fcfcfc; border:1px dashed #eee; border-radius: 0; margin:20px;">Empty Timeline. Architect some questions to begin.</div>';
            if (sidebarList) sidebarList.innerHTML = empty;
            if (railList) railList.innerHTML = empty;
            updatePreviewList();
            return;
        }

        let railHtml = '';
        let sidebarHtml = '';

        exams.sections.forEach((secName, secIdx) => {
            const secQuestions = exams.questions.map((q, idx) => ({ ...q, globalIdx: idx })).filter(q => q.section === secName);
            if (secQuestions.length > 0) {
                // Rail View (Grid numbers)
                railHtml += `
                    <div style="text-align: center; font-size: 0.65rem; font-weight: 700; color: #888; text-transform: uppercase; margin: 10px 0 4px 0;">${secName}</div>
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                `;
                secQuestions.forEach((q, i) => {
                    railHtml += `
                        <div class="q-nav-item ${editingQIndex === q.globalIdx ? 'active' : ''}" onclick="editQuestion(${q.globalIdx})" draggable="true" ondragstart="dragQ(event, ${q.globalIdx})" ondrop="dropQ(event, ${q.globalIdx})" ondragover="allowDrop(event)" ondragenter="dragEnter(event)" ondragleave="dragLeave(event)" ondragend="dragEndQ(event)" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; background: ${editingQIndex === q.globalIdx ? 'var(--primary)' : '#fcfcfc'}; color: ${editingQIndex === q.globalIdx ? '#fff' : '#666'}; border: 1px solid ${editingQIndex === q.globalIdx ? 'var(--primary)' : '#eee'}; border-radius: 0;">
                            ${i + 1}
                        </div>
                    `;
                });
                railHtml += `
                    </div>
                `;


                // Sidebar View (Detailed cards as per user request)
                sidebarHtml += `
                    <div class="sidebar-sec-header" ondrop="dropOnSection(event, '${secName.replace(/'/g, "\\'")}')" ondragover="allowDrop(event)" style="font-size: 0.75rem; font-weight: 800; color: #fff; background: var(--primary); padding: 8px 16px; border-radius: 0; text-transform: uppercase; margin-top: 16px; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between; border-left: 4px solid #b75727; cursor: default;">
                        <span>${secName}</span>
                        <i class="fas fa-layer-group" style="opacity: 0.5;"></i>
                    </div>
                `;
                secQuestions.forEach((q, i) => {
                    sidebarHtml += `
                        <div class="q-item ${editingQIndex === q.globalIdx ? 'active' : ''}" draggable="true" ondragstart="dragQ(event, ${q.globalIdx})" ondrop="dropQ(event, ${q.globalIdx})" ondragover="allowDrop(event)" ondragenter="dragEnter(event)" ondragleave="dragLeave(event)" ondragend="dragEndQ(event)" onclick="editQuestion(${q.globalIdx})" data-global-idx="${q.globalIdx}" style="padding: 12px 16px; border-bottom: 1px solid #eee; background: ${editingQIndex === q.globalIdx ? '#fff9f5' : '#fff'}; display: flex; align-items: center; gap: 16px; cursor: pointer; transition: all 0.2s;">
                            
                            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 40px; border-right: 2px solid #f0f0f0; padding-right: 16px;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <div class="drag-circle" style="width: 24px; height: 24px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; cursor: grab; transition: background 0.2s, color 0.2s;" onmouseover="this.style.background='var(--primary)'; this.style.color='#fff';" onmouseout="this.style.background='#f0f0f0'; this.style.color='#ccc';">
                                        <i class="fas fa-grip-vertical" style="font-size: 0.8rem; color: inherit;"></i>
                                    </div>
                                    <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">Q${i + 1}</div>
                                </div>
                                <div style="font-size: 0.75rem; font-weight: 700; color: var(--primary); margin-top: 4px;">${q.marks}M</div>
                            </div>
                            
                            <div style="flex: 1; overflow: hidden;">
                                <div style="font-weight: 600; font-size: 0.9rem; color: #333; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${q.heading || 'Untitled Question'}
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <span style="font-size: 0.65rem; font-weight: 700; color: #666; background: #f0f0f0; padding: 3px 6px; border-radius: 0; text-transform: uppercase; letter-spacing: 0.5px;">${q.type.replace('_', ' ')}</span>
                                </div>
                            </div>
                            
                            <div style="display: flex; align-items: center;">
                                <div class="q-action-btn delete-btn" onclick="event.stopPropagation(); deleteQuestion(${q.globalIdx})" title="Delete" style="color: #ef4444; padding: 6px; cursor: pointer;"><i class="far fa-trash-alt"></i></div>
                            </div>
                        </div>
                    `;
                });
            }
        });

        if (railList) railList.innerHTML = railHtml;
        if (sidebarList) {
            sidebarList.innerHTML = sidebarHtml;
            sidebarList.style.display = 'block'; // Ensure block layout
        }

        const totalQ = exams.questions.length;
        const totalM = exams.questions.reduce((s, q) => s + q.marks, 0);
        if (document.getElementById('totalQuestionsCount')) document.getElementById('totalQuestionsCount').textContent = totalQ;
        if (document.getElementById('headerQCount')) document.getElementById('headerQCount').textContent = `${totalQ} Questions`;
        if (document.getElementById('totalMarksCount')) document.getElementById('totalMarksCount').textContent = totalM;

        updateAnalytics();
        saveToHistory();

        // Update Prerequisite Dropdown
        const prereqSelect = document.getElementById('prereqQuestion');
        if (prereqSelect) {
            const currentVal = prereqSelect.value;
            prereqSelect.innerHTML = '<option value="">None</option>' +
                exams.questions.map((q, idx) => idx !== editingQIndex ? `<option value="${q.id}">${q.heading || 'Q' + (idx + 1)}</option>` : '').join('');
            prereqSelect.value = currentVal;
        }

        // Show/Hide Current Status actions
        const statusInd = document.getElementById('qStatusIndicator');
        if (statusInd) statusInd.style.display = editingQIndex !== -1 ? 'flex' : 'none';

        updatePreviewList();
    }

    function updateAnalytics() {
        const chart = document.getElementById('marksChart');
        if (!chart) return;

        const types = ['mcq', 'coding', 'subjective'];
        const totals = { mcq: 0, coding: 0, subjective: 0 };
        exams.questions.forEach(q => {
            if (totals[q.type] !== undefined) totals[q.type] += q.marks;
        });

        const maxMarks = Math.max(...Object.values(totals), 1);
        chart.innerHTML = Object.entries(totals).map(([type, marks]) => {
            const heightPct = (marks / maxMarks) * 100;
            const displayNames = { mcq: 'MCQ', coding: 'CODE', subjective: 'TEXT' };
            const displayName = displayNames[type] || type.substring(0, 4);
            return `
            <div style="position: relative; width: 40px; height: 100%; display: flex; align-items: flex-end; justify-content: center;">
                <div style="font-size: 0.85rem; font-weight: 800; color: #333; position: absolute; top: -25px;">${marks}</div>
                <div style="width: 32px; height: ${heightPct}%; background: var(--primary); border: 1px solid #d96c33; box-sizing: border-box; transition: height 0.3s ease;"></div>
                <div style="font-size: 0.65rem; font-weight: 800; color: #666; text-transform: uppercase; position: absolute; bottom: -25px;">${displayName}</div>
            </div>
            `;
        }).join('');
    }

    function deleteCurrent() {
        if (editingQIndex === -1) return;
        deleteQuestion(editingQIndex);
        resetBuilder();
    }

    function duplicateCurrent() {
        if (editingQIndex === -1) return;
        duplicateQuestion(editingQIndex);
    }

    function navigateBuilder(dir) {
        if (exams.questions.length === 0) return;
        let nextIdx = editingQIndex + dir;
        if (nextIdx < 0) nextIdx = 0;
        if (nextIdx >= exams.questions.length) nextIdx = exams.questions.length - 1;
        editQuestion(nextIdx);
    }


    // --- DRAG AND DROP LOGIC FOR SIDEBAR ---
    let draggedQuestionIdx = null;

    window.dragQ = function (ev, idx) {
        draggedQuestionIdx = idx;
        ev.dataTransfer.effectAllowed = 'move';
        ev.target.style.opacity = '0.5';
    };

    window.allowDrop = function (ev) {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'move';
    };

    window.dragEnter = function (ev) {
        ev.preventDefault();
        let target = ev.target.closest('.q-item');
        if (target) {
            target.style.borderTop = '2px solid var(--primary)';
        }
        let targetNav = ev.target.closest('.q-nav-item');
        if (targetNav) {
            targetNav.style.transform = 'scale(1.2)';
            targetNav.style.boxShadow = '0 0 10px rgba(217,108,51,0.5)';
        }
    };

    window.dragLeave = function (ev) {
        let target = ev.target.closest('.q-item');
        if (target) {
            target.style.borderTop = 'none';
        }
        let targetNav = ev.target.closest('.q-nav-item');
        if (targetNav) {
            targetNav.style.transform = '';
            targetNav.style.boxShadow = '';
        }
    };

    window.dropQ = function (ev, targetIdx) {
        ev.preventDefault();
        let targetNode = ev.target.closest('.q-item');
        if (targetNode) {
            targetNode.style.borderTop = 'none';
        }
        let targetNav = ev.target.closest('.q-nav-item');
        if (targetNav) {
            targetNav.style.transform = '';
            targetNav.style.boxShadow = '';
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

    window.dropOnSection = function (ev, sectionName) {
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

    window.dragEndQ = function (ev) {
        ev.target.style.opacity = '1';
        document.querySelectorAll('.q-item').forEach(el => el.style.borderTop = 'none');
        document.querySelectorAll('.q-nav-item').forEach(el => {
            el.style.transform = '';
            el.style.boxShadow = '';
        });
    };


    function deleteQuestion(index) {
        showModal({
            title: 'Confirm Deletion',
            desc: 'This question will be removed from the current assessment timeline. This action cannot be undone.',
            onConfirm: () => {
                exams.questions.splice(index, 1);
                if (editingQIndex === index) {
                    resetBuilder();
                } else if (editingQIndex > index) {
                    editingQIndex--;
                }
                updateQuestionsList();
                showToast('Question removed from timeline');
            }
        });
    }



    function duplicateQuestion(index) {
        const q = JSON.parse(JSON.stringify(exams.questions[index]));
        q.id = 'q_' + Date.now();
        q.heading += ' (Copy)';
        exams.questions.splice(index + 1, 0, q);

        if (editingQIndex > index) {
            editingQIndex++;
        }

        updateQuestionsList();
        showToast('Question logic duplicated');
    }

    function moveQuestion(index, direction) {
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < exams.questions.length) {
            const arr = exams.questions;
            [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
            updateQuestionsList();
        }
    }

    // DEPRECATED dropdown update, logic moved to inline setCorrectOption
    function updateCorrectAnswerOptions() { }

    function goToStep(step, silent = false) {
        lucide.createIcons();
        if (step < 1 || step > 5) return;

        if (currentStep === 1 && step > 1) {
            const isUniv = document.getElementById('isUniversalTime').checked;
            const sDate = document.getElementById('scheduleDate').value;
            const eDate = document.getElementById('scheduleEndDate').value;
            if (!isUniv && (!sDate || !eDate)) {
                showToast('Start and End time are strictly required unless Universal Time Frame is enabled.');
                return;
            }
        }

        currentStep = step;
        localStorage.setItem('exam_step_' + (editExamId || 'new'), step);

        document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.step-indicator').forEach(i => {
            i.classList.remove('active');
            i.classList.remove('completed');
        });

        const targetStep = document.getElementById('step-' + step);
        const targetInd = document.getElementById('ind' + step);
        if (targetStep) targetStep.classList.add('active');
        if (targetInd) targetInd.classList.add('active');

        for (let i = 1; i < step; i++) {
            const ind = document.getElementById('ind' + i);
            if (ind) ind.classList.add('completed');
        }

        if (!silent) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            syncState();
            showToast('Step ' + step + ' Auto-Synced');
        }

        if (step === 4) {
            updatePreviewList();
        }
    }

    function nextStep() {
        if (currentStep === 2) {
            const needsNetwork = document.getElementById('requireNetworkConfig').checked;
            if (needsNetwork) goToStep(3);
            else goToStep(4);
        } else if (currentStep === 4) {
            // Validate Randomization Goals before going to Step 5
            for (const section of exams.sections) {
                const config = exams.pools ? exams.pools[section] : null;
                if (config && config.enabled && config.totalGoal > 0) {
                    const actualCount = exams.questions.filter(q => q.section === section).length;
                    if (actualCount < config.totalGoal) {
                        const missing = config.totalGoal - actualCount;
                        showToast(`Section "${section}" needs ${missing} more question(s) to meet your goal of ${config.totalGoal}.`, 'error');
                        return; // Block progression
                    }
                }
            }
            goToStep(5);
        } else {
            goToStep(currentStep + 1);
        }
    }

    function prevStep() {
        if (currentStep === 4) {
            const needsNetwork = document.getElementById('requireNetworkConfig').checked;
            if (needsNetwork) goToStep(3);
            else goToStep(2);
        } else {
            goToStep(currentStep - 1);
        }
    }

    function toggleIPConfig(show) {
        const area = document.getElementById('ipConfigArea');
        if (area) area.style.display = show ? 'flex' : 'none';
    }

    async function detectIP() {
        try {
            const networks = await window.proctorBridge.getNetworkInfo();
            const ips = networks.map(n => n.address).join(', ');
            if (ips) {
                document.getElementById('allowedIPAddress').value = ips;
                showToast('Detected IP: ' + ips);
            } else {
                showToast('Could not detect any active network IP', 'error');
            }
        } catch (e) {
            console.error("IP Detection failed:", e);
        }
    }

    // Toggle IP Config Area Visibility
    document.addEventListener('change', (e) => {
        if (e.target.id === 'ipRestrictionEnabled') {
            const area = document.getElementById('ipConfigArea');
            if (area) area.style.display = e.target.checked ? 'flex' : 'none';
        }
    });

    function updateLanguages(savedCodes = null) {
        const langs = Array.from(document.querySelectorAll('#langSelectorGrid input:checked')).map(c => c.value);

        // Clean up old editors to prevent memory leak
        Object.values(inlineAceEditors).forEach(ed => ed.destroy());
        inlineAceEditors = {};

        document.getElementById('languageCodeTemplates').innerHTML = langs.map(l => {
            const prefixId = `code_prefix_${l}`;
            const middleId = `code_middle_${l}`;
            const suffixId = `code_suffix_${l}`;

            return `
                <div class="code-workspace-block">
                    <div class="workspace-lang-title">${l} WORKSPACE</div>
                    
                    <div class="code-sub-container">
                        <div class="code-header-row">
                            <span class="code-label-main">HEADER (HIDDEN FROM STUDENT)</span>
                            <div class="code-controls">
                                <button class="btn-fullscreen-toggle" onclick="openEditorOverlay('${prefixId}', '${l}', 'HEADER')">[ FULLSCREEN ]</button>
                                <label style="font-size:0.75rem; color:#666; display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="lock_prefix_${l}" checked> Locked</label>
                                <label style="font-size:0.75rem; color:#666; display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="hide_prefix_${l}"> Visible to student</label>
                            </div>
                        </div>
                        <div id="${prefixId}" class="monaco-inline-wrapper"></div>
                    </div>

                    <div class="code-sub-container">
                        <div class="code-header-row">
                            <span class="code-label-main">CODE TEMPLATE (STUDENT EDITOR)</span>
                            <div class="code-controls">
                                <button class="btn-fullscreen-toggle" onclick="openEditorOverlay('${middleId}', '${l}', 'TEMPLATE')">[ FULLSCREEN ]</button>
                            </div>
                        </div>
                        <div id="${middleId}" class="monaco-inline-wrapper" style="height:280px;"></div>
                    </div>

                    <div class="code-sub-container" style="margin-bottom:0;">
                        <div class="code-header-row">
                            <span class="code-label-main">FOOTER (READ-ONLY)</span>
                            <div class="code-controls">
                                <button class="btn-fullscreen-toggle" onclick="openEditorOverlay('${suffixId}', '${l}', 'FOOTER')">[ FULLSCREEN ]</button>
                                <label style="font-size:0.75rem; color:#666; display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="lock_suffix_${l}" checked> Locked</label>
                                <label style="font-size:0.75rem; color:#666; display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="hide_suffix_${l}"> Visible to student</label>
                            </div>
                        </div>
                        <div id="${suffixId}" class="monaco-inline-wrapper"></div>
                    </div>
                </div>`;
        }).join('');

        // Init Ace for each new div after DOM update
        langs.forEach(l => {
            const code = savedCodes ? savedCodes[l] : null;
            initAceInline(`code_prefix_${l}`, l, code ? code.prefix : '// Global declarations...');
            initAceInline(`code_middle_${l}`, l, code ? code.middle : '// User implementation...');
            initAceInline(`code_suffix_${l}`, l, code ? code.suffix : '// Execution drivers...');

            if (code) {
                document.getElementById(`lock_prefix_${l}`).checked = code.lockPrefix;
                document.getElementById(`lock_suffix_${l}`).checked = code.lockSuffix;
                document.getElementById(`hide_prefix_${l}`).checked = code.hidePrefix;
                document.getElementById(`hide_suffix_${l}`).checked = code.hideSuffix;
            }
        });
    }

    function syncState() {
        const titleEl = document.getElementById('examTitle');
        const descEl = document.getElementById('examDescription');
        const durEl = document.getElementById('examDuration');
        const mkEl = document.getElementById('examTotalMarks');
        const negEl = document.getElementById('negativeMarking');
        const dateEl = document.getElementById('scheduleDate');

        if (titleEl) exams.title = titleEl.value;
        if (descEl) exams.description = descEl.value;
        if (durEl) exams.duration = parseInt(durEl.value) || 60;
        if (mkEl) exams.totalMarks = parseInt(mkEl.value) || 100;
        if (negEl) exams.negativeMarking = parseFloat(negEl.value) || 0;
        const credEl = document.getElementById('examCredits');
        if (credEl) exams.credits = parseFloat(credEl.value) || 1;
        if (dateEl) exams.scheduledDate = dateEl.value;
        const endDateEl = document.getElementById('scheduleEndDate');
        if (endDateEl) exams.scheduledEndDate = endDateEl.value;
        const universalTimeEl = document.getElementById('isUniversalTime');
        if (universalTimeEl) exams.isUniversalTime = universalTimeEl.checked;

        // Security & Step 4 Fields
        const cp = document.getElementById('blockCopyPaste');
        const ss = document.getElementById('blockScreenshot');
        const sq = document.getElementById('shuffleQuestions');
        const fs = document.getElementById('fullScreenRequired');
        const wc = document.getElementById('webcamEnabled');
        const mc = document.getElementById('micEnabled');
        const vpn = document.getElementById('vpnBlocked');
        const psc = document.getElementById('examPasscode');
        const dln = document.getElementById('entryDeadline');
        const mts = document.getElementById('maxTabSwitches');
        const shr = document.getElementById('showResults');
        const mgr = document.getElementById('manualGrading');
        const lks = document.getElementById('lockSections') || document.getElementById('sectionLockEnabled');
        const prac = document.getElementById('isPracticeTest');
        const ctrlE = document.getElementById('allowCtrlE');

        exams.sectionLockEnabled = lks ? lks.checked : false;
        exams.security = {
            desktopOnly: document.getElementById('desktopOnly') ? document.getElementById('desktopOnly').checked : false,
            blockCopyPaste: cp ? cp.checked : false,
            blockScreenshot: ss ? ss.checked : false,
            shuffleQuestions: sq ? sq.checked : false,
            fullScreenRequired: fs ? fs.checked : false,
            webcamEnabled: wc ? wc.checked : false,
            micEnabled: mc ? mc.checked : false,
            vpnBlocked: vpn ? vpn.checked : false,
            lockSections: lks ? lks.checked : false,
            isPracticeTest: prac ? prac.checked : false,
            allowCtrlE: ctrlE ? ctrlE.checked : false,
            passcode: psc ? psc.value : '',
            strictPasscode: document.getElementById('strictPasscode') ? document.getElementById('strictPasscode').checked : true,
            entryDeadline: dln ? dln.value : null,
            maxTabSwitches: mts ? parseInt(mts.value) : 3,
            showResults: shr ? shr.checked : true,
            autoPublishResults: document.getElementById('autoPublishResults') ? document.getElementById('autoPublishResults').checked : true,
            manualGrading: mgr ? mgr.checked : false,
            ipRestriction: document.getElementById('ipRestrictionEnabled') ? document.getElementById('ipRestrictionEnabled').checked : false,
            allowedIP: document.getElementById('allowedIPAddress') ? document.getElementById('allowedIPAddress').value : '',
            blockWifiSwitching: document.getElementById('blockWifiSwitching') ? document.getElementById('blockWifiSwitching').checked : false,
            finalValidation: {
                points: document.getElementById('val_points') ? document.getElementById('val_points').checked : false,
                security: document.getElementById('val_security') ? document.getElementById('val_security').checked : false
            }
        };

        const jk = document.getElementById('joiningKey');
        if (jk) exams.joiningKey = jk.value;

        // Theme sync
        const prime = document.getElementById('themePrimaryColor');
        const font = document.getElementById('themeFont');
        const dark = document.getElementById('themeDarkMode');
        exams.theme = {
            primaryColor: prime ? prime.value : '#D96C33',
            font: font ? font.value : 'Outfit',
            darkMode: dark ? dark.checked : false
        };

        // Root level sync for easier access in engine
        exams.sectionLockEnabled = lks ? lks.checked : false;
        exams.isPracticeTest = prac ? prac.checked : false;
        exams.allowCtrlE = ctrlE ? ctrlE.checked : false;
    }

    function autoSave() {
        if (exams.questions.length === 0 && !exams.title) return; // Don't save empty
        syncState();
        localStorage.setItem('TESTPAD_creator_temp', JSON.stringify(exams));
        if (editExamId) {
            db.updateExam(editExamId, exams);
        }

        const indicator = document.getElementById('autoSaveIndicator');
        if (indicator) {
            indicator.innerHTML = '<div style="width: 8px; height: 8px; background: #2ecc71; border-radius: 50%;"></div><span>Saved Just Now</span>';
            setTimeout(() => {
                indicator.innerHTML = '<div style="width: 8px; height: 8px; background: #ccc; border-radius: 50%;"></div><span>Changes Saved</span>';
            }, 5000);
        }
    }

    function updatePreviewList() {
        const container = document.getElementById('previewQuestionsList');
        if (!container) return;

        // Ensure we have current sections even if none defined
        const sections = (exams.sections && exams.sections.length) ? exams.sections : ['General'];

        if (!exams.questions || exams.questions.length === 0) {
            container.innerHTML = '<div style="padding:40px; text-align:center; color:#999; font-size:0.9rem; border:1px dashed #eee; border-radius: 0; margin:20px;">No questions architected yet. Click "Architect Questions" to begin.</div>';
            return;
        }

        let html = '';
        sections.forEach((sec, sIdx) => {
            const qs = exams.questions.filter(q => String(q.section || 'General').toLowerCase().trim() === String(sec).toLowerCase().trim());
            if (qs.length > 0) {
                html += `
                    <div style="background:#fffaf8; padding:12px 20px; font-size:0.75rem; font-weight:800; color:var(--primary); text-transform:uppercase; letter-spacing:1px; border-bottom:2px solid #ffe8dd; display:flex; justify-content:space-between; align-items:center; border-radius: 0; margin-top: ${sIdx > 0 ? '20px' : '0'};">
                        <span style="display:flex; align-items:center; gap:8px;"><i class="fas fa-layer-group"></i> SECTION ${sIdx + 1}: ${sec}</span>
                        <span style="background:var(--primary); color:#fff; padding:4px 10px; border-radius:0; font-size:0.65rem;">${qs.length} Qs</span>
                    </div>
                `;
                html += qs.map((q, i) => `
                    <div style="padding:16px 20px; border-bottom:1px solid #f0f0f0; display:flex; justify-content:space-between; align-items:center; background:#fff; transition: all 0.2s; border-left: 3px solid transparent;" onmouseover="this.style.background='#fafafa'; this.style.borderLeft='3px solid var(--primary)';" onmouseout="this.style.background='#fff'; this.style.borderLeft='3px solid transparent';">
                        <div style="display:flex; align-items:center; gap:16px; flex:1;">
                            <div style="width:36px; height:36px; border:2px solid #f0f0f0; display:flex; align-items:center; justify-content:center; border-radius:0; font-weight:800; font-size:0.85rem; background:#fff; color:var(--text-main); font-family: 'Montserrat', sans-serif; flex-shrink: 0;">${i + 1}</div>
                            <div style="flex:1; display:flex; align-items:center; gap:12px; overflow:hidden;">
                                <div style="font-weight:700; font-size:0.95rem; color:var(--text-main); font-family: 'Montserrat', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 400px;">${q.heading || 'Untitled Question'}</div>
                                <div style="display:flex; gap:8px; align-items:center; flex-shrink: 0;">
                                    <span style="font-size:0.65rem; color:#fff; background:var(--primary); padding:4px 8px; border-radius:0; text-transform:uppercase; font-weight:700; font-family: 'Montserrat', sans-serif;"><i class="fas fa-tag"></i> ${q.type}</span>
                                    <span style="font-size:0.65rem; color:#fff; background:#c25821; padding:4px 8px; border-radius:0; text-transform:uppercase; font-weight:700; font-family: 'Montserrat', sans-serif;"><i class="fas fa-star"></i> ${q.marks} MARKS</span>
                                </div>
                            </div>
                        </div>
                        <button class="nav-icon-btn" onclick="goToStep(4); editQuestion(${exams.questions.indexOf(q)});" title="Edit Question" style="width:36px; height:36px; border-radius:0; border:1px solid #eee; background:#fff; color:#666; cursor:pointer; transition:all 0.2s; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-left: 16px;" onmouseover="this.style.background='var(--primary)'; this.style.color='#fff'; this.style.borderColor='var(--primary)';" onmouseout="this.style.background='#fff'; this.style.color='#666'; this.style.borderColor='#eee';">
                            <i class="fas fa-pen"></i>
                        </button>
                    </div>
                `).join('');
            }
        });

        if (html === '' && exams.questions.length > 0) {
            // Fallback for orphaned questions
            html = `<div style="background:#fff5f5; padding:12px 20px; font-size:0.7rem; font-weight:800; color:#e53e3e; text-transform:uppercase; border-bottom:1px solid #fed7d7;">Orphaned Questions (Missing Section)</div>`;
            html += exams.questions.filter(q => !sections.some(s => s.toLowerCase().trim() === String(q.section || '').toLowerCase().trim())).map((q, i) => `
                 <div style="padding:16px 20px; border-bottom:1px solid #f5f5f5; display:flex; justify-content:space-between; align-items:center; background:#fff;">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <div style="width:32px; height:32px; border:1px solid #eee; display:flex; align-items:center; justify-content:center; border-radius: 0; font-weight:700; font-size:0.8rem;">?</div>
                        <div>
                            <div style="font-weight:700; font-size:0.9rem;">${q.heading || 'Untitled'}</div>
                            <div style="font-size:0.65rem; color:#999;">Section: ${q.section || 'None'}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        container.innerHTML = html || '<div style="padding:40px; text-align:center; color:#999;">No questions found.</div>';
    }



    function toggleAllLanguages() {
        const checks = document.querySelectorAll('#langSelectorGrid input[type="checkbox"]');
        const anyUnchecked = Array.from(checks).some(c => !c.checked);
        checks.forEach(c => c.checked = anyUnchecked);
        updateLanguages();
    }

    function saveDraft() {
        syncState();
        localStorage.setItem('exam_step_' + (editExamId || 'new'), 1); // Reset step on final save? Actually keep it.
        showProcessing();
        setTimeout(() => {
            exams.status = 'draft';
            if (editExamId) db.updateExam(editExamId, exams);
            else db.createExam(exams, auth.getCurrentUser().id);
            hideLoader();
            showToast('Progress Synced to Database');
            setTimeout(goBack, 800);
        }, 1000);
    }

    function publishExam() {
        // Final validation check
        const checks = document.querySelectorAll('#step-4 input[type="checkbox"][required]');
        const allChecked = Array.from(checks).every(c => c.checked);
        if (!allChecked) {
            showToast('Please confirm all final validation points');
            return;
        }

        syncState();
        if (exams.questions.length === 0) {
            showToast('Add at least one question before deploying');
            return;
        }

        if (!exams.isUniversalTime && (!exams.scheduledDate || !exams.scheduledEndDate)) {
            showToast('Start and End time are strictly required unless Universal Time Frame is enabled.');
            goToStep(1);
            return;
        }

        const customTestId = document.getElementById('customTestId')?.value.trim();
        if (customTestId) {
            exams.testId = customTestId;
            exams.joiningKey = customTestId;
        } else if (!exams.testId) {
            showToast('Please enter a custom TEST IDENTITY before deploying', 'error');
            return;
        }


        showProcessing();
        setTimeout(() => {
            exams.status = 'published';
            let savedExam;
            if (editExamId) {
                savedExam = db.updateExam(editExamId, exams);
            } else {
                savedExam = db.createExam(exams, auth.getCurrentUser().id);
            }

            hideLoader();
            const testId = savedExam.testId || 'PENDING';
            const passcode = savedExam.passcode || 'NONE';

            showModal({
                title: 'Ã°Å¸Å¡â‚¬ ARCHITECTURE DEPLOYED',
                desc: 'Your assessment is now live on the Testpad neural network. Give these credentials to your students.',
                content: `
                    <div style="background:#f9f9f9; padding:24px; border-radius: 0; border:1px solid #eee; margin-top:10px; display:flex; flex-direction:column; gap:16px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.75rem; font-weight:800; color:#666;">TEST IDENTITY</span>
                            <span style="font-family:'JetBrains Mono'; color:var(--primary); font-size:1.2rem; font-weight:800; background:#fff; padding:6px 14px; border-radius: 0; border:1px solid #eee;">${testId}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.75rem; font-weight:800; color:#666;">PASSCODE</span>
                            <span style="font-family:'JetBrains Mono'; color:#333; font-size:1.2rem; font-weight:800;">${passcode}</span>
                        </div>
                        <div style="margin-top:8px; padding:12px; background:var(--primary-soft); border-radius: 0; border:1px solid #ffe8dd;">
                             <label style="font-size:0.6rem; font-weight:800; color:var(--primary); display:block; margin-bottom:4px; text-transform:uppercase;">Direct Assessment URL</label>
                             <div style="display:flex; gap:8px; align-items:center;">
                                <input type="text" readonly value="https://exam.testpad.chitpara.edu.in/test/${testId}" style="flex:1; background:transparent; border:none; font-size:0.75rem; color:#d96c33; font-weight:600; text-overflow:ellipsis;" id="finalLink">
                                <button onclick="navigator.clipboard.writeText(document.getElementById('finalLink').value); showToast('Link Copied!')" style="background:var(--primary); color:#fff; border:none; padding:4px 10px; border-radius: 0; font-size:0.7rem; cursor:pointer;"><i class="fas fa-copy"></i></button>
                             </div>
                        </div>
                        <p style="font-size:0.75rem; color:#999; text-align:center; border-top:1px solid #eee; padding-top:12px; margin:0;">Students can join via simulation or the Universal Gateway.</p>
                    </div>
                `,
                confirmText: 'Return to Command Center',
                onConfirm: goBack
            });
        }, 1500);
    }

    function previewAsStudent() {
        syncState();
        if (exams.questions.length === 0) {
            showToast('Add questions before previewing');
            return;
        }

        // Save to specific preview slot
        localStorage.setItem('TESTPAD_preview_data', JSON.stringify(exams));

        showToast('Entering Simulation Mode...');
        setTimeout(() => {
            window.open('./exam-attempt.html?mode=preview', '_blank');
        }, 800);
    }

    // --- Session Timer Logic ---
    let sessionSeconds = parseInt(localStorage.getItem('TESTPAD_creator_timer')) || 0;
    function startSessionTimer() {
        setInterval(() => {
            sessionSeconds++;
            localStorage.setItem('TESTPAD_creator_timer', sessionSeconds);
            const h = Math.floor(sessionSeconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((sessionSeconds % 3600) / 60).toString().padStart(2, '0');
            const s = (sessionSeconds % 60).toString().padStart(2, '0');
            const timerEl = document.getElementById('sessionTimer');
            if (timerEl) timerEl.textContent = `${h}:${m}:${s}`;
        }, 1000);
    }

    function editQuestion(index) {
        editingQIndex = index;
        const q = exams.questions[index];
        selectQuestionType(q.type);
        document.getElementById('questionHeading').value = q.heading || '';
        quill.root.innerHTML = q.title;
        document.getElementById('questionMarks').value = q.marks;
        document.getElementById('questionSection').value = q.section;
        document.getElementById('questionTimer').value = q.timer || 0;
        document.getElementById('teacherNotes').value = q.teacherNotes || '';
        document.getElementById('questionDifficulty').value = q.difficulty || 'medium';
        if (document.getElementById('shuffleOptions')) document.getElementById('shuffleOptions').checked = q.shuffleOptions || false;

        // Toggle shuffle options visibility
        const shuffleGrp = document.getElementById('shuffleOptionsGroup');
        if (shuffleGrp) shuffleGrp.style.display = (q.type === 'mcq') ? 'block' : 'none';

        if (q.options) {
            document.getElementById('optionsList').innerHTML = '';
            q.options.forEach(o => addOptionWithValue(o, o === q.correctAnswer));
        }

        if (q.type === 'coding') {
            const checkBoxes = document.querySelectorAll('#langSelectorGrid input[type="checkbox"]');
            checkBoxes.forEach(cb => cb.checked = q.languages.includes(cb.value));
            updateLanguages(q.code);
            if (q.testCases) {
                document.getElementById('testCasesContainer').innerHTML = '';
                q.testCases.forEach(tc => addTestCaseRow(tc.input, tc.output, tc.marks, tc.isSample));
            }
        }

        if (q.type === 'subjective') {
            document.getElementById('keywords').value = (q.keywords || []).join(', ');
        }

        if (q.type === 'numeric' || q.type === 'single_integer') {
            document.getElementById('correctNumeric').value = q.correctNumeric || '';
            document.getElementById('numericTolerance').value = q.tolerance || 0;
        }

        if (q.type === 'file_upload') {
            document.getElementById('allowedExtensions').value = (q.allowedExtensions || []).join(', ');
            document.getElementById('maxFileSize').value = q.maxFileSize || 10;
        }

        updateQuestionsList();
        document.getElementById('builder-anchor').scrollIntoView({ behavior: 'smooth' });
    }

    let persistentHeadingText = '';
    let persistentSectionVal = '';
    let persistentMarksVal = '';

    window.togglePersistentHeadingPopup = function () {
        const popup = document.getElementById('persistentHeadingPopup');
        popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
        if (popup.style.display === 'block') {
            document.getElementById('persistentHeadingInput').value = persistentHeadingText;

            const sectionSelect = document.getElementById('persistentSectionInput');
            if (sectionSelect) {
                sectionSelect.innerHTML = '<option value="">-- No Persistent Section --</option>' + exams.sections.map(s => `<option value="${s}">${s}</option>`).join('');
                sectionSelect.value = persistentSectionVal;
            }

            const marksInput = document.getElementById('persistentMarksInput');
            if (marksInput) {
                marksInput.value = persistentMarksVal;
            }

            document.getElementById('persistentHeadingInput').focus();
        }
    };

    window.setPersistentHeading = function () {
        persistentHeadingText = document.getElementById('persistentHeadingInput').value;
        const sectionSelect = document.getElementById('persistentSectionInput');
        const marksInput = document.getElementById('persistentMarksInput');

        persistentSectionVal = sectionSelect ? sectionSelect.value : '';
        persistentMarksVal = marksInput ? marksInput.value : '';

        if (persistentHeadingText) {
            document.getElementById('questionHeading').value = persistentHeadingText;
        }
        if (persistentSectionVal) {
            document.getElementById('questionSection').value = persistentSectionVal;
        }
        if (persistentMarksVal) {
            document.getElementById('questionMarks').value = persistentMarksVal;
        }

        if (persistentHeadingText || persistentSectionVal || persistentMarksVal) {
            showToast('Persistent settings saved for new questions!');
        }

        document.getElementById('persistentHeadingPopup').style.display = 'none';
    };

    window.clearPersistentHeading = function () {
        persistentHeadingText = '';
        persistentSectionVal = '';
        persistentMarksVal = '';

        document.getElementById('persistentHeadingInput').value = '';
        if (document.getElementById('persistentSectionInput')) document.getElementById('persistentSectionInput').value = '';
        if (document.getElementById('persistentMarksInput')) document.getElementById('persistentMarksInput').value = '';

        document.getElementById('persistentHeadingPopup').style.display = 'none';
        showToast('Persistent settings cleared');
    };

    function resetBuilder() {
        editingQIndex = -1;
        if (document.getElementById('questionHeading')) {
            document.getElementById('questionHeading').value = persistentHeadingText || '';
        }
        if (quill) quill.setContents([]);
        if (document.getElementById('questionMarks')) document.getElementById('questionMarks').value = persistentMarksVal || 1;

        if (document.getElementById('questionSection') && persistentSectionVal) {
            document.getElementById('questionSection').value = persistentSectionVal;
        }

        if (document.getElementById('questionTimer')) document.getElementById('questionTimer').value = 0;
        if (document.getElementById('teacherNotes')) document.getElementById('teacherNotes').value = '';
        if (document.getElementById('optionsList')) document.getElementById('optionsList').innerHTML = '';
        if (document.getElementById('testCasesContainer')) document.getElementById('testCasesContainer').innerHTML = '';
        if (document.getElementById('keywords')) document.getElementById('keywords').value = '';
        if (document.getElementById('correctNumeric')) document.getElementById('correctNumeric').value = '';
        if (document.getElementById('numericTolerance')) document.getElementById('numericTolerance').value = '0';
        if (document.getElementById('allowedExtensions')) document.getElementById('allowedExtensions').value = '';
        if (document.getElementById('maxFileSize')) document.getElementById('maxFileSize').value = '10';

        selectQuestionType('mcq');
        updateQuestionsList();
    }

    function handleExcelUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    showToast('The excel file appears to be empty');
                    return;
                }

                let addedCount = 0;
                json.forEach(row => {
                    // Normalize keys to handle minor formatting differences (trim and lowercase)
                    const getVal = (patterns) => {
                        const key = Object.keys(row).find(k => patterns.some(p => k.toLowerCase().trim().includes(p)));
                        return key ? row[key] : null;
                    };

                    const heading = getVal(['question title']) || getVal(['title']);
                    const qText = getVal(['question text']) || getVal(['text']) || getVal(['question']);
                    const choice1 = getVal(['ans choice 1']) || getVal(['choice 1']) || getVal(['option 1']);
                    const choice2 = getVal(['ans choice 2']) || getVal(['choice 2']) || getVal(['option 2']);
                    const choice3 = getVal(['ans choice 3']) || getVal(['choice 3']) || getVal(['option 3']);
                    const choice4 = getVal(['ans choice 4']) || getVal(['choice 4']) || getVal(['option 4']);
                    const correctChoice = getVal(['correct option']) || getVal(['answer']) || getVal(['correct ans']);
                    const section = getVal(['section to add in']) || getVal(['section']) || 'General';
                    const marks = parseInt(getVal(['marks'])) || 1;

                    if (heading && qText && choice1 && choice2) {
                        const options = [choice1, choice2, choice3, choice4].filter(o => o !== null && o !== undefined && o !== '');

                        // Handle correct option mapping (text, letter A-D, or number 1-4)
                        let correctAnswer = correctChoice;
                        if (correctChoice !== null) {
                            const ccStr = String(correctChoice).trim().toUpperCase();
                            if (ccStr === 'A' || ccStr === '1') correctAnswer = choice1;
                            else if (ccStr === 'B' || ccStr === '2') correctAnswer = choice2;
                            else if (ccStr === 'C' || ccStr === '3') correctAnswer = choice3;
                            else if (ccStr === 'D' || ccStr === '4') correctAnswer = choice4;
                        }

                        const q = {
                            id: 'q_' + Date.now() + Math.random().toString(36).substr(2, 5),
                            source: 'exam',
                            type: 'mcq',
                            heading: String(heading).trim(),
                            title: `<p>${String(qText).trim()}</p>`,
                            marks: marks,
                            section: String(section).trim(),
                            options: options.map(o => String(o).trim()),
                            correctAnswer: String(correctAnswer).trim(),
                            timer: 0,
                            teacherNotes: 'Imported via Excel Bulk Upload'
                        };

                        // Add section if it doesn't exist
                        if (!exams.sections.includes(q.section)) {
                            exams.sections.push(q.section);
                        }

                        exams.questions.push(q);
                        db.addToQuestionPool(q);
                        addedCount++;
                    }
                });

                if (addedCount > 0) {
                    updateQuestionsList();
                    updateSectionsList();
                    autoSave();
                    showToast(`Successfully imported ${addedCount} MCQs!`);
                } else {
                    showToast('No valid MCQs found. Check format: question title, question text, choices 1-4, correct option, marks, section.');
                }
            } catch (err) {
                console.error('Excel Parsing Error:', err);
                showToast('Error parsing Excel file. Please ensure it is a valid .xlsx or .xls file.');
            }
            // Clear input for next upload
            event.target.value = '';
        };
        reader.readAsArrayBuffer(file);
    }

    function showExcelFormat() {
        const columns = [
            'Question Title',
            'Question Text',
            'Ans Choice 1',
            'Ans Choice 2',
            'Ans Choice 3',
            'Ans Choice 4',
            'Correct Option (Text or 1-4)',
            'Section',
            'Marks'
        ];

        const html = `
            <div style="padding: 10px;">
                <p style="font-size: 0.85rem; color: #666; margin-bottom: 15px;">Your spreadsheet should have these exact column headers in the first row:</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f9f9f9; padding: 20px; border-radius: 0; border: 1px solid #eee;">
                    ${columns.map(c => `<div style="font-family:'JetBrains Mono'; font-size: 0.75rem; background:#fff; padding:6px 12px; border-radius: 0; border:1px solid #eee;">${c}</div>`).join('')}
                </div>
                <div style="margin-top: 20px; padding: 15px; background: #fff8e1; border-radius: 0; border: 1px solid #ffe082; font-size: 0.8rem; color: #795548;">
                    <strong>Tip:</strong> The 'Correct Option' can be the text of the answer or just the number (1-4).
                </div>
            </div>
        `;

        showModal({
            title: 'Excel MCQ Format Guide',
            desc: 'Follow this structure to ensure successful auto-population.',
            content: html,
            confirmText: 'I Understand',
            onConfirm: () => { }
        });
    }

    function downloadExcelTemplate() {
        const data = [
            ["Question Title", "Question Text", "Ans Choice 1", "Ans Choice 2", "Ans Choice 3", "Ans Choice 4", "Correct Option", "Section", "Marks"],
            ["OOP Basics", "What is encapsulation?", "Data Hiding", "Inheritance", "Polymorphism", "Abstraction", "Data Hiding", "Technical", 2],
            ["Logic Check", "Is Java an OOP language?", "Yes", "No", "Maybe", "Partially", "1", "General", 1]
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "MCQ Template");

        XLSX.writeFile(workbook, "Testpad_MCQ_Template.xlsx");
        showToast('Template downloaded!');
    }

    function showPdfOptionsModal() {
        const content = `
            <style>
                .template-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    border: 2px solid #eee;
                    border-radius: 0;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 12px;
                    background: #fff;
                }
                .template-card:hover {
                    border-color: #ffd8c4;
                    background: #fffafa;
                }
                .template-input:checked + .template-card {
                    border-color: var(--primary);
                    background: #fff5f0;
                }
                .template-input:checked + .template-card .radio-inner {
                    background: var(--primary);
                }
                .template-input:checked + .template-card .radio-outer {
                    border-color: var(--primary);
                }
                .radio-outer {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 2px solid #ccc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }
                .radio-inner {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: transparent;
                    transition: all 0.2s;
                }
                .pdf-input-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-top: 24px;
                    padding-top: 24px;
                    border-top: 1px dashed #eee;
                }
            </style>
            
            <div style="font-weight: 700; margin-bottom: 16px; color: #1a1a1b;">Select Template Architecture</div>
            <div style="max-height: 320px; overflow-y: auto; padding-right: 8px;">
                <label style="display: block; margin: 0;">
                    <input type="radio" name="pdfLayout" value="3" class="template-input" style="display:none;" checked>
                    <div class="template-card">
                        <div class="radio-outer"><div class="radio-inner"></div></div>
                        <div>
                            <div style="font-weight: 700; color: #1a1a1b; font-size: 0.95rem;">Modern Default Template</div>
                            <div style="font-size: 0.8rem; color: #666; margin-top: 2px;">Standard English-style layout with default components.</div>
                        </div>
                    </div>
                </label>
                
                <label style="display: block; margin: 0;">
                    <input type="radio" name="pdfLayout" value="4" class="template-input" style="display:none;">
                    <div class="template-card">
                        <div class="radio-outer"><div class="radio-inner"></div></div>
                        <div>
                            <div style="font-weight: 700; color: #1a1a1b; font-size: 0.95rem;">Classic Academic Template</div>
                            <div style="font-size: 0.8rem; color: #666; margin-top: 2px;">Strict Times New Roman font with a traditional structure.</div>
                        </div>
                    </div>
                </label>
                
                <label style="display: block; margin: 0;">
                    <input type="radio" name="pdfLayout" value="1" class="template-input" style="display:none;">
                    <div class="template-card">
                        <div class="radio-outer"><div class="radio-inner"></div></div>
                        <div>
                            <div style="font-weight: 700; color: #1a1a1b; font-size: 0.95rem;">Scientific Template (Physics)</div>
                            <div style="font-size: 0.8rem; color: #666; margin-top: 2px;">Includes OMR-style elements and barcode headers.</div>
                        </div>
                    </div>
                </label>
                
                <label style="display: block; margin: 0;">
                    <input type="radio" name="pdfLayout" value="2" class="template-input" style="display:none;">
                    <div class="template-card">
                        <div class="radio-outer"><div class="radio-inner"></div></div>
                        <div>
                            <div style="font-weight: 700; color: #1a1a1b; font-size: 0.95rem;">Standard Template (Front Office)</div>
                            <div style="font-size: 0.8rem; color: #666; margin-top: 2px;">Simplified structural layout with Hindi/English instructions.</div>
                        </div>
                    </div>
                </label>
            </div>

            <div class="pdf-input-grid">
                <div>
                    <label class="label">Series</label>
                    <input type="text" id="pdfSeries" value="WYXZ1/1" class="clean-input" style="padding:8px;">
                </div>
                <div>
                    <label class="label">Set Number</label>
                    <input type="text" id="pdfSet" value="1" class="clean-input" style="padding:8px;">
                </div>
                <div>
                    <label class="label">Q.P. Code</label>
                    <input type="text" id="pdfQpCode" value="2/1/1" class="clean-input" style="padding:8px;">
                </div>
                <div>
                    <label class="label">Subject Name</label>
                    <input type="text" id="pdfSubject" value="ENGLISH" class="clean-input" style="padding:8px;">
                </div>
            </div>
        `;

        showModal({
            title: 'PDF Generation Settings',
            desc: 'Configure layout and metadata for the finalized exam document.',
            content: content,
            confirmText: 'Generate PDF',
            onConfirm: () => {
                const layoutStyle = document.querySelector('input[name="pdfLayout"]:checked').value;
                const series = document.getElementById('pdfSeries').value;
                const setNum = document.getElementById('pdfSet').value;
                const qpCode = document.getElementById('pdfQpCode').value;
                const subject = document.getElementById('pdfSubject').value;

                generateExamPDF(series, setNum, qpCode, subject, layoutStyle);
            }
        });
    }

    function downloadExamPDF() {
        showPdfOptionsModal();
    }

    function generateExamPDF(series, setNum, qpCode, subject, layoutStyle) {
        const exam = exams;
        if (!exam) return;

        const container = document.createElement('div');
        container.style.padding = '0';
        container.style.fontFamily = '"Century Schoolbook", "Times New Roman", Times, serif';
        container.style.color = '#000';
        container.style.background = '#fff';

        const barcodeHTML = `<div style="height: 30px; width: 120px; background: repeating-linear-gradient(to right, #000, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 8px, #fff 8px, #fff 10px); display: inline-block;"></div>`;

        const fontStyle = layoutStyle === '4' ? "font-family: 'Times New Roman', Times, serif !important;" : "font-family: 'Tex Gyre Schola', 'Century Schoolbook', 'Times New Roman', Times, serif;";
        const strokeStyle = layoutStyle === '4' ? "0px" : "0.2px #000";

        let htmlContent = `
            <div class="pdf-content">
            <style>
                .pdf-content { 
                    ${fontStyle}
                    color: #000 !important; 
                    font-weight: normal; 
                    text-align: justify;
                    -webkit-text-stroke: ${strokeStyle}; /* Subtle stroke for darker ink without bloating the weight */
                }
                .pdf-content pre, .pdf-content code {
                    font-family: Consolas, monospace !important;
                    white-space: pre-wrap !important;
                    font-size: 13px !important;
                    -webkit-text-stroke: 0px;
                }
                .pdf-content pre { display: block !important; margin: 10px 0 !important; }
                .top-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                .series-text { font-size: 20px; font-weight: bold; }
                .set-text { font-size: 20px; font-weight: bold; }
                .qp-box { border: 2px dashed #000; padding: 10px 20px; text-align: center; margin-top: 10px; display: inline-block; }
                .qp-label { font-size: 14px; font-weight: bold; }
                .qp-value { font-size: 24px; font-weight: bold; }
                
                .roll-boxes { display: flex; gap: 5px; margin-top: 5px; }
                .roll-box { width: 30px; height: 35px; border: 2px dashed #000; }
                
                .instruction-box { border: 2px dashed #000; padding: 10px; margin-top: 20px; width: 270px; font-size: 14px; }
                
                .subject-title { text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 10px 0; }
                
                .time-marks { display: flex; justify-content: space-between; font-size: 16px; font-style: italic; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                
                .instructions-list { width: 100%; display: flex; gap: 20px;}
                .instructions-half { width: 50%; font-size: 13.5px; text-align: justify; }
                
                .mcq-options { display: flex; flex-wrap: wrap; margin-bottom: 10px; }
                .mcq-option { width: 50%; margin-bottom: 10px; }
            </style>
        `;

        if (layoutStyle === '3') {
            htmlContent += `
            <!-- First Page Layout 3 -->
            <div style="position: relative; width: 100%; box-sizing: border-box; min-height: 900px;">
                <div style="position:absolute; top:0; left:0; right:0; overflow:hidden; font-family: monospace; font-size:22px; line-height: 1; letter-spacing: 1px;">****************************************************************************************************************************************************************</div>
                <div style="position:absolute; bottom:0; left:0; right:0; overflow:hidden; font-family: monospace; font-size:22px; line-height: 1; letter-spacing: 1px;">****************************************************************************************************************************************************************</div>
                <div style="position:absolute; top:0; bottom:0; left:0; width:20px; overflow:hidden; font-family: monospace; font-size:22px; line-height: 1; word-wrap: break-word; text-align: center; padding-top:10px;">*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br></div>
                <div style="position:absolute; top:0; bottom:0; right:0; width:20px; overflow:hidden; font-family: monospace; font-size:22px; line-height: 1; word-wrap: break-word; text-align: center; padding-top:10px;">*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br>*<br></div>
                
                <div style="padding: 30px 40px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                        <div style="font-size: 18px; font-weight: bold;">Series : ${series}</div>
                        <div style="text-align: center;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=TESTPAD" style="width: 60px; height: 60px; margin-bottom: 5px;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=TESTPAD" style="width: 60px; height: 60px;">
                        </div>
                        <div style="font-size: 18px; font-weight: bold;">SET ~ ${setNum}</div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px;">
                        <div>
                            <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">Roll No.</div>
                            <div style="display: flex; gap: 5px;">
                                <div style="width: 25px; height: 35px; border: 2px dashed #000;"></div>
                                <div style="width: 25px; height: 35px; border: 2px dashed #000;"></div>
                                <div style="width: 25px; height: 35px; border: 2px dashed #000;"></div>
                                <div style="width: 25px; height: 35px; border: 2px dashed #000;"></div>
                                <div style="width: 25px; height: 35px; border: 2px dashed #000;"></div>
                                <div style="width: 25px; height: 35px; border: 2px dashed #000;"></div>
                                <div style="width: 25px; height: 35px; border: 2px dashed #000;"></div>
                                <div style="width: 25px; height: 35px; border: 2px dashed #000;"></div>
                            </div>
                        </div>
                        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
                            <div style="border: 2px dashed #000; padding: 10px 20px; display: inline-flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                                <div style="font-size: 14px; font-weight: bold; text-align: left;">Q.P. Code</div>
                                <div style="font-size: 26px; font-weight: bold;">${qpCode}</div>
                            </div>
                            <div style="border: 2px dashed #000; padding: 10px 15px; width: 260px; font-size: 13px; text-align: left; font-weight: normal;">
                                Candidates must write the Q.P. Code on the title page of the answer-book.
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">${subject.toUpperCase()}</div>
                        <div style="font-size: 20px; font-weight: bold;">(Language and Literature)</div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; font-size: 15px; font-style: italic; margin-bottom: 25px; border-bottom: 2px solid #000; padding-bottom: 12px;">
                        <div>Time allowed : ${exam.duration || 180} hours</div>
                        <div style="text-align: right;">Maximum Marks : ${exam.totalMarks || 80}</div>
                    </div>
                    
                    <div style="padding: 0 5px;">
                        <div style="text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 15px;">NOTE</div>
                        <ol type="I" style="padding-left: 20px; font-size: 13.5px; line-height: 1.6; text-align: justify; margin: 0;">
                            <li style="margin-bottom: 12px;">Please check that this question paper contains 15 printed pages.</li>
                            <li style="margin-bottom: 12px;">Q.P. Code given on the right hand side of the question paper should be written on the title page of the answer-book by the candidate.</li>
                            <li style="margin-bottom: 12px;">Please check that this question paper contains ${exam.questions ? exam.questions.length : 0} questions.</li>
                            <li style="margin-bottom: 12px;"><strong>Please write down the Serial Number of the question in the answer-book before attempting it.</strong></li>
                            <li style="margin-bottom: 12px;">15 minute time has been allotted to read this question paper. The question paper will be distributed at 10.15 a.m. From 10.15 a.m. to 10.30 a.m., the candidates will read the question paper only and will not write any answer on the answer-book during this period.</li>
                        </ol>
                    </div>
                </div>
            </div>
            `;
        } else if (layoutStyle === '2') {
            htmlContent += `
            <!-- First Page Layout 2 -->
            <div style="padding: 20px 40px; position: relative;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=TESTPAD" style="width: 50px; height: 50px;">
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
                    <div>
                        <div style="border: 1px solid #000; padding: 5px 10px; font-weight: bold; font-size: 18px; display: inline-block;">Series ${series}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="background: #000; color: #fff; padding: 5px 15px; font-weight: bold; font-size: 18px; display: inline-block;">SET-${setNum}</div>
                        <div style="margin-top: 10px; font-size: 14px; font-weight: bold; display: flex; justify-content: flex-end; align-items: center; gap: 15px;">
                            <div style="text-align:left;">Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤â€¢Ã Â¥â€¹Ã Â¤Â¡<br>Q.P. Code</div> 
                            <span style="font-size: 32px;">${qpCode}</span>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="font-size: 14px; font-weight: bold;">Ã Â¤Â°Ã Â¥â€¹Ã Â¤Â² Ã Â¤Â¨Ã Â¤â€š.<br>Roll No.</div>
                            <div class="roll-boxes" style="margin-top:0;">
                                <div class="roll-box" style="border: 1px solid #000; width: 25px; height: 30px;"></div><div class="roll-box" style="border: 1px solid #000; width: 25px; height: 30px;"></div><div class="roll-box" style="border: 1px solid #000; width: 25px; height: 30px;"></div>
                                <div class="roll-box" style="border: 1px solid #000; width: 25px; height: 30px;"></div><div class="roll-box" style="border: 1px solid #000; width: 25px; height: 30px;"></div><div class="roll-box" style="border: 1px solid #000; width: 25px; height: 30px;"></div>
                                <div class="roll-box" style="border: 1px solid #000; width: 25px; height: 30px;"></div>
                            </div>
                        </div>
                    </div>
                    <div style="border: 1px solid #000; padding: 8px 12px; font-size: 13px; width: 320px;">
                        Ã Â¤ÂªÃ Â¤Â°Ã Â¥â‚¬Ã Â¤â€¢Ã Â¥ÂÃ Â¤Â·Ã Â¤Â¾Ã Â¤Â°Ã Â¥ÂÃ Â¤Â¥Ã Â¥â‚¬ Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤â€¢Ã Â¥â€¹Ã Â¤Â¡ Ã Â¤â€¢Ã Â¥â€¹ Ã Â¤â€°Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â°-Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â¸Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â¿Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤Â®Ã Â¥ÂÃ Â¤â€“-Ã Â¤ÂªÃ Â¥Æ’Ã Â¤Â·Ã Â¥ÂÃ Â¤Â  Ã Â¤ÂªÃ Â¤Â° Ã Â¤â€¦Ã Â¤ÂµÃ Â¤Â¶Ã Â¥ÂÃ Â¤Â¯ Ã Â¤Â²Ã Â¤Â¿Ã Â¤â€“Ã Â¥â€¡Ã Â¤â€šÃ Â¥Â¤<br>
                        Candidates must write the Q.P. Code on the title page of the answer-book.
                    </div>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <ul style="list-style-type: disc; padding-left: 20px; font-size: 13px; margin: 0; line-height: 1.6;">
                        <li>Ã Â¤â€¢Ã Â¥Æ’Ã Â¤ÂªÃ Â¤Â¯Ã Â¤Â¾ Ã Â¤Å“Ã Â¤Â¾Ã Â¤ÂÃ Â¤Å¡ Ã Â¤â€¢Ã Â¤Â° Ã Â¤Â²Ã Â¥â€¡Ã Â¤â€š Ã Â¤â€¢Ã Â¤Â¿ Ã Â¤â€¡Ã Â¤Â¸ Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š Ã Â¤Â®Ã Â¥ÂÃ Â¤Â¦Ã Â¥ÂÃ Â¤Â°Ã Â¤Â¿Ã Â¤Â¤ Ã Â¤ÂªÃ Â¥Æ’Ã Â¤Â·Ã Â¥ÂÃ Â¤Â  23 Ã Â¤Â¹Ã Â¥Ë†Ã Â¤â€šÃ Â¥Â¤</li>
                        <li>Ã Â¤â€¢Ã Â¥Æ’Ã Â¤ÂªÃ Â¤Â¯Ã Â¤Â¾ Ã Â¤Å“Ã Â¤Â¾Ã Â¤ÂÃ Â¤Å¡ Ã Â¤â€¢Ã Â¤Â° Ã Â¤Â²Ã Â¥â€¡Ã Â¤â€š Ã Â¤â€¢Ã Â¤Â¿ Ã Â¤â€¡Ã Â¤Â¸ Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š ${exam.questions ? exam.questions.length : 0} Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨ Ã Â¤Â¹Ã Â¥Ë†Ã Â¤â€šÃ Â¥Â¤</li>
                        <li>Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š Ã Â¤Â¦Ã Â¤Â¾Ã Â¤Â¹Ã Â¤Â¿Ã Â¤Â¨Ã Â¥â€¡ Ã Â¤Â¹Ã Â¤Â¾Ã Â¤Â¥ Ã Â¤â€¢Ã Â¥â‚¬ Ã Â¤â€œÃ Â¤Â° Ã Â¤Â¦Ã Â¤Â¿Ã Â¤Â Ã Â¤â€”Ã Â¤Â Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤â€¢Ã Â¥â€¹Ã Â¤Â¡ Ã Â¤â€¢Ã Â¥â€¹ Ã Â¤ÂªÃ Â¤Â°Ã Â¥â‚¬Ã Â¤â€¢Ã Â¥ÂÃ Â¤Â·Ã Â¤Â¾Ã Â¤Â°Ã Â¥ÂÃ Â¤Â¥Ã Â¥â‚¬ Ã Â¤â€°Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â°-Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â¸Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â¿Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤Â®Ã Â¥ÂÃ Â¤â€“-Ã Â¤ÂªÃ Â¥Æ’Ã Â¤Â·Ã Â¥ÂÃ Â¤Â  Ã Â¤ÂªÃ Â¤Â° Ã Â¤Â²Ã Â¤Â¿Ã Â¤â€“Ã Â¥â€¡Ã Â¤â€šÃ Â¥Â¤</li>
                        <li><strong>Ã Â¤â€¢Ã Â¥Æ’Ã Â¤ÂªÃ Â¤Â¯Ã Â¤Â¾ Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨ Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤â€°Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â° Ã Â¤Â²Ã Â¤Â¿Ã Â¤â€“Ã Â¤Â¨Ã Â¤Â¾ Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â°Ã Â¥â€š Ã Â¤â€¢Ã Â¤Â°Ã Â¤Â¨Ã Â¥â€¡ Ã Â¤Â¸Ã Â¥â€¡ Ã Â¤ÂªÃ Â¤Â¹Ã Â¤Â²Ã Â¥â€¡, Ã Â¤â€°Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â°-Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â¸Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â¿Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨ Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤â€¢Ã Â¥ÂÃ Â¤Â°Ã Â¤Â®Ã Â¤Â¾Ã Â¤â€šÃ Â¤â€¢ Ã Â¤â€¦Ã Â¤ÂµÃ Â¤Â¶Ã Â¥ÂÃ Â¤Â¯ Ã Â¤Â²Ã Â¤Â¿Ã Â¤â€“Ã Â¥â€¡Ã Â¤â€šÃ Â¥Â¤</strong></li>
                        <li>Ã Â¤â€¡Ã Â¤Â¸ Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤â€¢Ã Â¥â€¹ Ã Â¤ÂªÃ Â¤Â¢Ã Â¤Â¼Ã Â¤Â¨Ã Â¥â€¡ Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤Â²Ã Â¤Â¿Ã Â¤Â 15 Ã Â¤Â®Ã Â¤Â¿Ã Â¤Â¨Ã Â¤Å¸ Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤Â¸Ã Â¤Â®Ã Â¤Â¯ Ã Â¤Â¦Ã Â¤Â¿Ã Â¤Â¯Ã Â¤Â¾ Ã Â¤â€”Ã Â¤Â¯Ã Â¤Â¾ Ã Â¤Â¹Ã Â¥Ë†Ã Â¥Â¤ Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤ÂµÃ Â¤Â¿Ã Â¤Â¤Ã Â¤Â°Ã Â¤Â£ Ã Â¤ÂªÃ Â¥â€šÃ Â¤Â°Ã Â¥ÂÃ Â¤ÂµÃ Â¤Â¾Ã Â¤Â¹Ã Â¥ÂÃ Â¤Â¨ Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š 10.15 Ã Â¤Â¬Ã Â¤Å“Ã Â¥â€¡ Ã Â¤â€¢Ã Â¤Â¿Ã Â¤Â¯Ã Â¤Â¾ Ã Â¤Å“Ã Â¤Â¾Ã Â¤ÂÃ Â¤â€”Ã Â¤Â¾Ã Â¥Â¤ 10.15 Ã Â¤Â¬Ã Â¤Å“Ã Â¥â€¡ Ã Â¤Â¸Ã Â¥â€¡ 10.30 Ã Â¤Â¬Ã Â¤Å“Ã Â¥â€¡ Ã Â¤Â¤Ã Â¤â€¢ Ã Â¤ÂªÃ Â¤Â°Ã Â¥â‚¬Ã Â¤â€¢Ã Â¥ÂÃ Â¤Â·Ã Â¤Â¾Ã Â¤Â°Ã Â¥ÂÃ Â¤Â¥Ã Â¥â‚¬ Ã Â¤â€¢Ã Â¥â€¡Ã Â¤ÂµÃ Â¤Â² Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤â€¢Ã Â¥â€¹ Ã Â¤ÂªÃ Â¤Â¢Ã Â¤Â¼Ã Â¥â€¡Ã Â¤â€šÃ Â¤â€”Ã Â¥â€¡ Ã Â¤â€Ã Â¤Â° Ã Â¤â€¡Ã Â¤Â¸ Ã Â¤â€¦Ã Â¤ÂµÃ Â¤Â§Ã Â¤Â¿ Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤Â¦Ã Â¥Å’Ã Â¤Â°Ã Â¤Â¾Ã Â¤Â¨ Ã Â¤ÂµÃ Â¥â€¡ Ã Â¤â€°Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â°-Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â¸Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â¿Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤ÂªÃ Â¤Â° Ã Â¤â€¢Ã Â¥â€¹Ã Â¤Ë† Ã Â¤â€°Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â° Ã Â¤Â¨Ã Â¤Â¹Ã Â¥â‚¬Ã Â¤â€š Ã Â¤Â²Ã Â¤Â¿Ã Â¤â€“Ã Â¥â€¡Ã Â¤â€šÃ Â¤â€”Ã Â¥â€¡Ã Â¥Â¤</li>
                        <li>Please check that this question paper contains 23 printed pages.</li>
                        <li>Please check that this question paper contains ${exam.questions ? exam.questions.length : 0} questions.</li>
                        <li>Q.P. Code given on the right hand side of the question paper should be written on the title page of the answer-book by the candidate.</li>
                        <li><strong>Please write down the serial number of the question in the answer-book before attempting it.</strong></li>
                        <li>15 minute time has been allotted to read this question paper. The question paper will be distributed at 10.15 a.m. From 10.15 a.m. to 10.30 a.m., the candidates will read the question paper only and will not write any answer on the answer-book during this period.</li>
                    </ul>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    ${barcodeHTML}
                    <div style="text-align: center; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 15px 0; flex: 1; margin: 0 40px;">
                        <div style="font-weight: bold; font-size: 20px; margin-bottom: 5px;">Ã Â¤Â«Ã Â¥ÂÃ Â¤Â°Ã Â¤â€šÃ Â¤Å¸ Ã Â¤â€˜Ã Â¤Â«Ã Â¤Â¿Ã Â¤Â¸ Ã Â¤Â¸Ã Â¤â€šÃ Â¤Å¡Ã Â¤Â¾Ã Â¤Â²Ã Â¤Â¨</div>
                        <div style="font-weight: bold; font-size: 24px;">${subject.toUpperCase()}</div>
                    </div>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=TESTPAD" style="width: 60px; height: 60px;">
                </div>
                
                <div style="display: flex; justify-content: space-between; font-size: 14px; font-style: italic; margin-bottom: 40px;">
                    <div>Ã Â¤Â¨Ã Â¤Â¿Ã Â¤Â°Ã Â¥ÂÃ Â¤Â§Ã Â¤Â¾Ã Â¤Â°Ã Â¤Â¿Ã Â¤Â¤ Ã Â¤Â¸Ã Â¤Â®Ã Â¤Â¯ : 2 Ã Â¤ËœÃ Â¤Â£Ã Â¥ÂÃ Â¤Å¸Ã Â¥â€¡<br>Time allowed : ${exam.duration || 120} hours</div>
                    <div style="text-align:right;">Ã Â¤â€¦Ã Â¤Â§Ã Â¤Â¿Ã Â¤â€¢Ã Â¤Â¤Ã Â¤Â® Ã Â¤â€¦Ã Â¤â€šÃ Â¤â€¢ : 50<br>Maximum Marks : ${exam.totalMarks || 50}</div>
                </div>
            </div>
            `;
        } else if (layoutStyle === '4') {
            htmlContent += `
            <!-- First Page Layout 4 - Classic Times New Roman -->
            <div style="padding: 40px; color: #000;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px;">
                    <div style="font-size: 20px; font-weight: bold;">Series : ${series}</div>
                    <div style="text-align: right; font-size: 20px; font-weight: bold;">SET ~ ${setNum}</div>
                </div>
                <div style="text-align: right; margin-bottom: 50px;">
                    <div style="border: 2px solid #000; padding: 15px 25px; display: inline-block;">
                        <div style="font-size: 16px; font-weight: bold; text-align: left;">Q.P. Code</div>
                        <div style="font-size: 28px; font-weight: bold; margin-top: 5px;">${qpCode}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 80px;">
                    <div style="font-size: 20px; font-weight: bold;">Roll No.</div>
                    <div style="display: flex; gap: 8px;">
                        <div style="width: 35px; height: 45px; border: 2px solid #000;"></div>
                        <div style="width: 35px; height: 45px; border: 2px solid #000;"></div>
                        <div style="width: 35px; height: 45px; border: 2px solid #000;"></div>
                        <div style="width: 35px; height: 45px; border: 2px solid #000;"></div>
                        <div style="width: 35px; height: 45px; border: 2px solid #000;"></div>
                        <div style="width: 35px; height: 45px; border: 2px solid #000;"></div>
                        <div style="width: 35px; height: 45px; border: 2px solid #000;"></div>
                        <div style="width: 35px; height: 45px; border: 2px solid #000;"></div>
                    </div>
                </div>
                <div style="text-align: center; margin-bottom: 80px;">
                    <div style="font-size: 36px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">${subject}</div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 20px; margin-bottom: 50px; border-bottom: 2px solid #000; padding-bottom: 20px;">
                    <div><strong>Time Allowed :</strong> ${exam.duration || 180} hours</div>
                    <div><strong>Maximum Marks :</strong> ${exam.totalMarks || 80}</div>
                </div>
                <div style="text-align: center; font-size: 18px; font-style: italic;">
                    Candidates must write the Q.P. Code on the title page of the answer-book.
                </div>
            </div>
            `;
        } else {
            htmlContent += `
            <!-- First Page Layout 1 -->
            <div style="padding: 20px 40px; position: relative;">
                <div style="position: absolute; left: 10px; top: 10px; bottom: 10px; width: 25px; border-right: 1px solid #000; display: flex; flex-direction: column; align-items: center; padding-top: 20px; gap: 5px;">
                    <div style="width:12px; height:12px; border-radius:50%; border:2px solid #000; box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 4px #000;"></div>
                    <div style="width:12px; height:12px; border-radius:50%; border:2px solid #000; box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 4px #000;"></div>
                    <div style="width:12px; height:12px; border-radius:50%; border:2px solid #000; box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 4px #000;"></div>
                    <div style="width:12px; height:12px; border-radius:50%; border:2px solid #000; box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 4px #000;"></div>
                    <div style="width:12px; height:12px; border-radius:50%; border:2px solid #000; box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 4px #000;"></div>
                </div>

                <div class="top-header">
                    <div>
                        <div class="series-text">Series : ${series}</div>
                        <div style="margin-top: 50px;">
                            <div style="font-size: 16px;">Ã Â¤Â°Ã Â¥â€¹Ã Â¤Â² Ã Â¤Â¨Ã Â¤â€š.<br>Roll No.</div>
                            <div class="roll-boxes">
                                <div class="roll-box"></div><div class="roll-box"></div><div class="roll-box"></div>
                                <div class="roll-box"></div><div class="roll-box"></div><div class="roll-box"></div>
                                <div class="roll-box"></div><div class="roll-box"></div>
                            </div>
                        </div>
                    </div>
                    <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 30px;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=TESTPAD" style="width: 60px; height: 60px;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=TESTPAD" style="width: 60px; height: 60px;">
                    </div>
                    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
                        <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-start;">
                            ${barcodeHTML}
                            <div class="set-text">SET~${setNum}</div>
                        </div>
                        
                        <div class="qp-box">
                            <div style="display:flex; gap:15px; align-items:center;">
                                <div class="qp-label" style="text-align:left;">Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤â€¢Ã Â¥â€¹Ã Â¤Â¡<br>Q.P. Code</div>
                                <div class="qp-value">${qpCode}</div>
                            </div>
                        </div>
                        <div class="instruction-box" style="text-align: left;">
                            Ã Â¤ÂªÃ Â¤Â°Ã Â¥â‚¬Ã Â¤â€¢Ã Â¥ÂÃ Â¤Â·Ã Â¤Â¾Ã Â¤Â°Ã Â¥ÂÃ Â¤Â¥Ã Â¥â‚¬ Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤â€¢Ã Â¥â€¹Ã Â¤Â¡ Ã Â¤â€¢Ã Â¥â€¹ Ã Â¤â€°Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â°-Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â¸Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â¿Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤Â®Ã Â¥ÂÃ Â¤â€“-Ã Â¤ÂªÃ Â¥Æ’Ã Â¤Â·Ã Â¥ÂÃ Â¤Â  Ã Â¤ÂªÃ Â¤Â° Ã Â¤â€¦Ã Â¤ÂµÃ Â¤Â¶Ã Â¥ÂÃ Â¤Â¯ Ã Â¤Â²Ã Â¤Â¿Ã Â¤â€“Ã Â¥â€¡Ã Â¤â€šÃ Â¥Â¤<br>
                            Candidates must write the Q.P. Code on the title page of the answer-book.
                        </div>
                    </div>
                </div>

                <div class="subject-title">
                    ${subject}
                </div>

                <div class="time-marks">
                    <div>Ã Â¤Â¨Ã Â¤Â¿Ã Â¤Â°Ã Â¥ÂÃ Â¤Â§Ã Â¤Â¾Ã Â¤Â°Ã Â¤Â¿Ã Â¤Â¤ Ã Â¤Â¸Ã Â¤Â®Ã Â¤Â¯ : 3 Ã Â¤ËœÃ Â¤Â£Ã Â¥ÂÃ Â¤Å¸Ã Â¥â€¡<br>Time allowed : ${exam.duration || 180} hours</div>
                    <div style="text-align:right;">Ã Â¤â€¦Ã Â¤Â§Ã Â¤Â¿Ã Â¤â€¢Ã Â¤Â¤Ã Â¤Â® Ã Â¤â€¦Ã Â¤â€šÃ Â¤â€¢ : 70<br>Maximum Marks : ${exam.totalMarks || 70}</div>
                </div>

                <div class="instructions-list">
                    <div class="instructions-half">
                        <div style="text-align: center; font-weight: bold; margin-bottom: 10px; font-size:16px;">Ã Â¤Â¨Ã Â¥â€¹Ã Â¤Å¸</div>
                        <ol type="I" style="padding-left: 20px; margin: 0;">
                            <li style="margin-bottom: 12px;">Ã Â¤â€¢Ã Â¥Æ’Ã Â¤ÂªÃ Â¤Â¯Ã Â¤Â¾ Ã Â¤Å“Ã Â¤Â¾Ã Â¤ÂÃ Â¤Å¡ Ã Â¤â€¢Ã Â¤Â° Ã Â¤Â²Ã Â¥â€¡Ã Â¤â€š Ã Â¤â€¢Ã Â¤Â¿ Ã Â¤â€¡Ã Â¤Â¸ Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š Ã Â¤Â®Ã Â¥ÂÃ Â¤Â¦Ã Â¥ÂÃ Â¤Â°Ã Â¤Â¿Ã Â¤Â¤ Ã Â¤ÂªÃ Â¥Æ’Ã Â¤Â·Ã Â¥ÂÃ Â¤Â  27 Ã Â¤Â¹Ã Â¥Ë†Ã Â¤â€šÃ Â¥Â¤</li>
                            <li style="margin-bottom: 12px;">Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š Ã Â¤Â¦Ã Â¤Â¾Ã Â¤Â¹Ã Â¤Â¿Ã Â¤Â¨Ã Â¥â€¡ Ã Â¤Â¹Ã Â¤Â¾Ã Â¤Â¥ Ã Â¤â€¢Ã Â¥â‚¬ Ã Â¤â€œÃ Â¤Â° Ã Â¤Â¦Ã Â¤Â¿Ã Â¤Â Ã Â¤â€”Ã Â¤Â Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤â€¢Ã Â¥â€¹Ã Â¤Â¡ Ã Â¤â€¢Ã Â¥â€¹ Ã Â¤ÂªÃ Â¤Â°Ã Â¥â‚¬Ã Â¤â€¢Ã Â¥ÂÃ Â¤Â·Ã Â¤Â¾Ã Â¤Â°Ã Â¥ÂÃ Â¤Â¥Ã Â¥â‚¬ Ã Â¤â€°Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â°-Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â¸Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â¿Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤Â®Ã Â¥ÂÃ Â¤â€“-Ã Â¤ÂªÃ Â¥Æ’Ã Â¤Â·Ã Â¥ÂÃ Â¤Â  Ã Â¤ÂªÃ Â¤Â° Ã Â¤Â²Ã Â¤Â¿Ã Â¤â€“Ã Â¥â€¡Ã Â¤â€šÃ Â¥Â¤</li>
                            <li style="margin-bottom: 12px;">Ã Â¤â€¢Ã Â¥Æ’Ã Â¤ÂªÃ Â¤Â¯Ã Â¤Â¾ Ã Â¤Å“Ã Â¤Â¾Ã Â¤ÂÃ Â¤Å¡ Ã Â¤â€¢Ã Â¤Â° Ã Â¤Â²Ã Â¥â€¡Ã Â¤â€š Ã Â¤â€¢Ã Â¤Â¿ Ã Â¤â€¡Ã Â¤Â¸ Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š ${exam.questions ? exam.questions.length : 0} Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨ Ã Â¤Â¹Ã Â¥Ë†Ã Â¤â€šÃ Â¥Â¤</li>
                            <li style="margin-bottom: 12px;"><strong>Ã Â¤â€¢Ã Â¥Æ’Ã Â¤ÂªÃ Â¤Â¯Ã Â¤Â¾ Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨ Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤â€°Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â° Ã Â¤Â²Ã Â¤Â¿Ã Â¤â€“Ã Â¤Â¨Ã Â¤Â¾ Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â°Ã Â¥â€š Ã Â¤â€¢Ã Â¤Â°Ã Â¤Â¨Ã Â¥â€¡ Ã Â¤Â¸Ã Â¥â€¡ Ã Â¤ÂªÃ Â¤Â¹Ã Â¤Â²Ã Â¥â€¡, Ã Â¤â€°Ã Â¤Â¤Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â°-Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â¸Ã Â¥ÂÃ Â¤Â¤Ã Â¤Â¿Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤Â®Ã Â¥â€¡Ã Â¤â€š Ã Â¤Â¯Ã Â¤Â¥Ã Â¤Â¾ Ã Â¤Â¸Ã Â¥ÂÃ Â¤Â¥Ã Â¤Â¾Ã Â¤Â¨ Ã Â¤ÂªÃ Â¤Â° Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨ Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤â€¢Ã Â¥ÂÃ Â¤Â°Ã Â¤Â®Ã Â¤Â¾Ã Â¤â€šÃ Â¤â€¢ Ã Â¤â€¦Ã Â¤ÂµÃ Â¤Â¶Ã Â¥ÂÃ Â¤Â¯ Ã Â¤Â²Ã Â¤Â¿Ã Â¤â€“Ã Â¥â€¡Ã Â¤â€šÃ Â¥Â¤</strong></li>
                            <li style="margin-bottom: 12px;">Ã Â¤â€¡Ã Â¤Â¸ Ã Â¤ÂªÃ Â¥ÂÃ Â¤Â°Ã Â¤Â¶Ã Â¥ÂÃ Â¤Â¨-Ã Â¤ÂªÃ Â¤Â¤Ã Â¥ÂÃ Â¤Â° Ã Â¤â€¢Ã Â¥â€¹ Ã Â¤ÂªÃ Â¤Â¢Ã Â¤Â¼Ã Â¤Â¨Ã Â¥â€¡ Ã Â¤â€¢Ã Â¥â€¡ Ã Â¤Â²Ã Â¤Â¿Ã Â¤Â 15 Ã Â¤Â®Ã Â¤Â¿Ã Â¤Â¨Ã Â¤Å¸ Ã Â¤â€¢Ã Â¤Â¾ Ã Â¤Â¸Ã Â¤Â®Ã Â¤Â¯ Ã Â¤Â¦Ã Â¤Â¿Ã Â¤Â¯Ã Â¤Â¾ Ã Â¤â€”Ã Â¤Â¯Ã Â¤Â¾ Ã Â¤Â¹Ã Â¥Ë†Ã Â¥Â¤</li>
                        </ol>
                    </div>
                    <div class="instructions-half">
                        <div style="text-align: center; font-weight: bold; margin-bottom: 10px; font-size:16px;">NOTE</div>
                        <ol type="I" style="padding-left: 20px; margin: 0;">
                            <li style="margin-bottom: 12px;">Please check that this question paper contains 27 printed pages.</li>
                            <li style="margin-bottom: 12px;">Q.P. Code given on the right hand side of the question paper should be written on the title page of the answer-book by the candidate.</li>
                            <li style="margin-bottom: 12px;">Please check that this question paper contains ${exam.questions ? exam.questions.length : 0} questions.</li>
                            <li style="margin-bottom: 12px;"><em>Please write down the Serial Number of the question in the answer-book at the given place before attempting it.</em></li>
                            <li style="margin-bottom: 12px;">15 minute time has been allotted to read this question paper.</li>
                        </ol>
                    </div>
                </div>
            </div>
            `;
        }

        htmlContent += `
            <div class="html2pdf__page-break"></div>

            <!-- General Instructions Page (Page 2) -->
            <div style="padding: 30px 40px; font-size: 15px; line-height: 1.5;">
                <div style="font-weight: bold; font-style: italic; margin-bottom: 10px; font-size: 16px;">General Instructions :</div>
                <div style="font-style: italic; margin-bottom: 15px;">Read the following instructions carefully and follow them :</div>
            `;

        let totalQuestions = exam.questions ? exam.questions.length : 0;
        let sectionStats = [];
        let currentSecName = null;
        let startIdx = 1;
        let currentMarks = 1;

        if (exam.questions && totalQuestions > 0) {
            exam.questions.forEach((q, idx) => {
                let sec = String(q.section || 'General').trim();
                if (sec !== currentSecName) {
                    if (currentSecName !== null) {
                        sectionStats.push({ name: currentSecName, start: startIdx, end: idx, marks: currentMarks });
                    }
                    currentSecName = sec;
                    startIdx = idx + 1;
                    currentMarks = q.marks || 1;
                }
            });
            if (currentSecName !== null) {
                sectionStats.push({ name: currentSecName, start: startIdx, end: totalQuestions, marks: currentMarks });
            }
        }

        let instructionsList = [];
        if (totalQuestions > 0) {
            instructionsList.push(`This question paper contains <strong>${totalQuestions}</strong> questions. <strong>All</strong> questions are <strong>compulsory</strong>.`);

            if (sectionStats.length > 0) {
                let sectionNames = sectionStats.map(s => `<strong>Section ${s.name}</strong>`).join(', ');
                if (sectionStats.length > 1) {
                    let last = sectionStats[sectionStats.length - 1];
                    let allButLast = sectionStats.slice(0, -1).map(s => `<strong>Section ${s.name}</strong>`).join(', ');
                    sectionNames = `${allButLast} and <strong>Section ${last.name}</strong>`;
                }
                let sectionsCountWord = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][sectionStats.length - 1] || sectionStats.length;
                instructionsList.push(`This question paper is divided into <strong>${sectionsCountWord}</strong> sections &ndash; ${sectionNames}.`);
            }

            sectionStats.forEach(s => {
                let qText = s.start === s.end ? `Question no. <strong>${s.start}</strong> is a` : `Questions no. <strong>${s.start}</strong> to <strong>${s.end}</strong> are`;
                let mText = s.marks == 1 ? '<strong>1</strong> mark' : `<strong>${s.marks}</strong> marks`;
                instructionsList.push(`In <strong>Section ${s.name}</strong> &ndash; ${qText} question carrying ${mText} each.`);
            });

            instructionsList.push(`There is no overall choice given in the question paper. However, an internal choice has been provided in few questions.`);
            instructionsList.push(`Kindly note that there is a separate question paper for Visually Impaired candidates.`);
            instructionsList.push(`Use of calculators is <strong>not</strong> allowed.`);
        } else {
            instructionsList.push(`This question paper contains 0 questions.`);
        }

        let romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv'];
        instructionsList.forEach((inst, idx) => {
            let roman = romanNumerals[idx] || (idx + 1);
            htmlContent += `
                <div style="display: flex; gap: 15px; margin-bottom: 8px;">
                    <div style="font-style: italic;">(${roman})</div>
                    <div style="font-style: italic; flex: 1;">${inst}</div>
                </div>`;
        });

        htmlContent += `
            </div>

            <div class="html2pdf__page-break"></div>

            <!-- Third Page & Questions -->
            <div style="padding: 20px 40px;">
                <div style="text-align: right; margin-bottom: 10px;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=40x40&data=TESTPAD" style="width: 40px; height: 40px;">
                </div>
        `;

        if (exam.questions && exam.questions.length > 0) {
            let lastPrintedSection = null;

            exam.questions.forEach((q, i) => {
                let sec = String(q.section || 'General').trim();
                if (sec !== lastPrintedSection) {
                    htmlContent += `<div style="text-align: center; font-weight: bold; font-size: 18px; margin: 20px 0 35px 0; text-transform: uppercase;">SECTION ${sec}</div>`;
                    lastPrintedSection = sec;
                }

                htmlContent += `
                <div style="margin-bottom: 25px; page-break-inside: avoid; display: flex; font-size: 13.5px;">
                    <div style="margin-right: 12px; width: 22px;">${i + 1}.</div>
                    <div style="flex: 1;">
                        <div style="text-align: justify; margin-bottom: 15px; line-height: 1.5;">${q.title || q.text || q.questionText || ''}</div>
                `;

                if (q.type === 'coding') {
                    if (q.prefilledCode) {
                        htmlContent += `
                            <div style="margin-bottom: 15px;">
                                <strong>Prefixed Code:</strong>
                                <pre style="background: #f8f9fa; border: 1px solid #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; white-space: pre-wrap;">${q.prefilledCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                            </div>
                        `;
                    }
                    if (q.testCases && q.testCases.length > 0) {
                        htmlContent += `<div style="margin-bottom: 15px;">`;
                        q.testCases.forEach((tc, idx) => {
                            htmlContent += `
                                <div style="margin-bottom: 15px; font-family: Consolas, monospace; font-size: 13px;">
                                    <div style="font-family: 'Century Schoolbook', 'Times New Roman', Times, serif; margin-bottom: 8px;"><strong>Test Case ${idx + 1}:</strong></div>
                                    <strong>Input:</strong><br>
                                    ${(tc.input || '').replace(/\n/g, '<br>')}<br><br>
                                    <strong>Output:</strong><br>
                                    ${(tc.output || '').replace(/\n/g, '<br>')}
                                </div>
                            `;
                        });
                        htmlContent += `</div>`;
                    }
                } else if (q.type === 'mcq' && q.options) {
                    htmlContent += `<div class="mcq-options">`;
                    q.options.forEach((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        htmlContent += `<div class="mcq-option">(${letter}) &nbsp;&nbsp;&nbsp; ${opt}</div>`;
                    });
                    htmlContent += `</div>`;
                }

                if (q.image || q.diag) {
                    htmlContent += `<div style="margin-top: 15px; text-align: center;"><img src="${q.image || q.diag}" style="max-width: 80%; max-height: 200px; border: 1px solid #ddd;"></div>`;
                }

                htmlContent += `
                    </div>
                </div>`;
            });
        } else {
            htmlContent += `<div style="text-align: center; color: #666; font-style: italic;">No questions found in this assessment.</div>`;
        }

        htmlContent += `
            </div>
            </div>
        `;

        container.innerHTML = htmlContent;

        const opt = {
            margin: [15, 15, 25, 15],
            filename: `${series}_${qpCode.replace(/\//g, '-')}_Question_Paper.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast('Generating PDF, please wait...');

        html2pdf().set(opt).from(container).toPdf().get('pdf').then(function (pdf) {
            var totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(12);
                pdf.setFont("times", "normal");

                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                // Bottom margin starts at pageHeight - 25, we draw footer at pageHeight - 12
                pdf.text('~' + qpCode + '~[]', 15, pageHeight - 12);
                pdf.text('v v v v v v v v v v v', pageWidth / 2 - 35, pageHeight - 12);
                pdf.text(i.toString(), pageWidth / 2 + 15, pageHeight - 12);
                pdf.text('\u2022', pageWidth / 2 + 35, pageHeight - 12);
                pdf.text('P.T.O.', pageWidth - 30, pageHeight - 12);
            }
        }).save().then(() => {
            showToast('PDF downloaded successfully!');
        });
    }

    function showToast(msg) {
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '80px';
        toast.style.right = '40px';
        toast.style.background = '#333';
        toast.style.color = '#fff';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.fontFamily = 'Inter';
        toast.style.fontSize = '0.9rem';
        toast.style.zIndex = '11000';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function createNewExam() {
        localStorage.removeItem('exam_step_new');
        localStorage.removeItem('TESTPAD_creator_temp');
        localStorage.removeItem('TESTPAD_creator_timer');
        window.location.href = './exam-creator.html';
    }



    function goBack() { window.location.href = './teacher-dashboard.html'; }

    // --- SPLIT PANE RESIZER LOGIC ---
    function initResizer() {
        const resizer = document.getElementById('splitResizer');
        const sidebar = document.getElementById('rightSidebar');
        let isResizing = false;

        if (!resizer || !sidebar) return;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            resizer.classList.add('resizing');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newWidth = document.body.clientWidth - e.clientX;
            if (newWidth >= 250 && newWidth <= 800) {
                sidebar.style.width = newWidth + 'px';
                document.querySelector('.workspace').style.gridTemplateColumns = `1fr 10px ${newWidth}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
                resizer.classList.remove('resizing');
            }
        });
    }

    function toggleSidebar() {
        const workspace = document.querySelector('.workspace');
        const icon = document.getElementById('sidebarToggleIcon');
        if (workspace.classList.contains('sidebar-open')) {
            workspace.classList.remove('sidebar-open');
            icon.className = 'fas fa-chevron-left';
        } else {
            workspace.classList.add('sidebar-open');
            icon.className = 'fas fa-chevron-right';
        }
    }

    // --- Teacher Wellness Popup Logic ---
    const wellnessMessages = [
        "Thank you for your hard work! Please take a sip of water.",
        "You are doing selflessly great! Don't forget to stretch your legs.",
        "Your dedication is inspiring. Take a deep breath!",
        "A gentle reminder to rest your eyes for a moment.",
        "You've been working hard. Remember to stay hydrated!",
        "Your effort shapes the future. Take a quick 1-minute break.",
        "We appreciate your selfless work. Grab a cup of tea or coffee!",
        "You're making a huge impact. Don't forget to smile today!",
        "Teaching is a work of heart. Remember to take care of yours!",
        "Thank you for your continuous dedication. Please blink a few times and relax.",
        "You are a superstar! Ensure you're sitting comfortably.",
        "Your work matters immensely. Take a sip of water and refresh.",
        "Awesome progress! Maybe time for a quick posture check?",
        "Selfless heroes need breaks too. Relax your shoulders.",
        "Your commitment is truly appreciated. Take a moment to breathe.",
        "You are doing fantastic. A quick stretch might feel great!",
        "Thank you for going above and beyond. Drink some water!",
        "You're making a difference. Please remember your own well-being.",
        "Incredible effort! Rest your eyes on something distant for 20 seconds.",
        "Your hard work doesn't go unnoticed. Have a refreshing sip of water!"
    ];

    let wellnessTimeout;
    window.dismissWellnessMsg = function () {
        const popup = document.getElementById('teacherWellnessPopup');
        if (popup) {
            popup.style.transform = 'translateX(-50%) translateY(-100px)';
            popup.style.opacity = '0';
            setTimeout(() => { popup.style.pointerEvents = 'none'; }, 500);
        }
        if (wellnessTimeout) clearTimeout(wellnessTimeout);
    };

    setInterval(() => {
        const popup = document.getElementById('teacherWellnessPopup');
        const msgText = document.getElementById('wellnessMsgText');
        if (popup && msgText) {
            const randomMsg = wellnessMessages[Math.floor(Math.random() * wellnessMessages.length)];
            msgText.textContent = randomMsg;
            popup.style.transform = 'translateX(-50%) translateY(0)';
            popup.style.opacity = '1';
            popup.style.pointerEvents = 'auto'; // allow clicking the tick

            if (wellnessTimeout) clearTimeout(wellnessTimeout);
            wellnessTimeout = setTimeout(() => {
                window.dismissWellnessMsg();
            }, 5 * 60 * 1000); // 5 minutes
        }
    }, 5 * 60 * 1000); // 5 minutes

    window.generateStudentRows = function () {
        const num = parseInt(document.getElementById('numStudentsNotify').value) || 0;
        const container = document.getElementById('studentRowsContainer');
        const existing = [];
        const rows = container.querySelectorAll('.student-row');
        rows.forEach(r => {
            existing.push({
                roll: r.querySelector('.r-roll').value,
                email: r.querySelector('.r-email').value
            });
        });

        let html = '';
        for (let i = 0; i < num; i++) {
            const rollVal = existing[i] ? existing[i].roll : '';
            const emailVal = existing[i] ? existing[i].email : '';
            html += `
            <div class="student-row" style="display:flex; gap:12px;">
                <input type="text" class="clean-input r-roll" placeholder="Roll Number" style="flex:1; font-family: 'Montserrat', sans-serif;" value="${rollVal}">
                <input type="email" class="clean-input r-email" placeholder="Email Address" style="flex:2; font-family: 'Montserrat', sans-serif;" value="${emailVal}">
            </div>
            `;
        }
        container.innerHTML = html;
    };

    window.saveClassList = function () {
        const className = document.getElementById('newClassName').value.trim();
        if (!className) { showToast('Enter a class name to save'); return; }

        const rows = document.querySelectorAll('.student-row');
        if (rows.length === 0) { showToast('Add at least one student to save'); return; }

        const students = Array.from(rows).map(r => ({
            roll: r.querySelector('.r-roll').value,
            email: r.querySelector('.r-email').value
        }));

        let classes = JSON.parse(localStorage.getItem('TESTPAD_saved_classes') || '{}');
        classes[className] = students;
        localStorage.setItem('TESTPAD_saved_classes', JSON.stringify(classes));

        showToast('Class saved successfully!');
        populateSavedClasses();
        document.getElementById('savedClassSelect').value = className;
    };

    window.populateSavedClasses = function () {
        const select = document.getElementById('savedClassSelect');
        if (!select) return;
        let classes = JSON.parse(localStorage.getItem('TESTPAD_saved_classes') || '{}');
        let html = '<option value="">-- Create New Class --</option>';
        for (const c in classes) {
            html += `<option value="${c}">${c} (${classes[c].length} Students)</option>`;
        }
        select.innerHTML = html;
    };

    window.loadSavedClass = function () {
        const className = document.getElementById('savedClassSelect').value;
        if (!className) {
            document.getElementById('numStudentsNotify').value = '';
            document.getElementById('newClassName').value = '';
            generateStudentRows();
            return;
        }

        let classes = JSON.parse(localStorage.getItem('TESTPAD_saved_classes') || '{}');
        const students = classes[className];
        if (students) {
            document.getElementById('numStudentsNotify').value = students.length;
            const container = document.getElementById('studentRowsContainer');
            let html = '';
            students.forEach(s => {
                html += `
                <div class="student-row" style="display:flex; gap:12px;">
                    <input type="text" class="clean-input r-roll" placeholder="Roll Number" style="flex:1; font-family: 'Montserrat', sans-serif;" value="${s.roll}">
                    <input type="email" class="clean-input r-email" placeholder="Email Address" style="flex:2; font-family: 'Montserrat', sans-serif;" value="${s.email}">
                </div>
                `;
            });
            container.innerHTML = html;
            document.getElementById('newClassName').value = className;
        }
    };

    window.sendEmailsViaGmail = function () {
        const rows = document.querySelectorAll('.student-row');
        const emails = [];
        rows.forEach(r => {
            const email = r.querySelector('.r-email').value.trim();
            if (email) emails.push(email);
        });

        if (emails.length === 0) {
            showToast('Please add at least one student email address.', 'error');
            return;
        }

        const bccList = emails.join(',');
        const subject = encodeURIComponent(exams.title || 'Assessment Invitation from TESTPAD');

        let bodyText = `Hello Student,\n\nYou have been invited to an assessment on TESTPAD.\n\n`;
        bodyText += `Assessment: ${exams.title || 'Untitled Assessment'}\n`;
        if (exams.duration) bodyText += `Duration: ${exams.duration} Minutes\n`;
        if (exams.joiningKey) bodyText += `Joining Key: ${exams.joiningKey}\n`;
        bodyText += `\nPlease log in to your dashboard to begin.\n\nBest regards,\nTESTPAD Administration`;

        const body = encodeURIComponent(bodyText);

        const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&bcc=${bccList}&su=${subject}&body=${body}`;

        showToast('Opening Gmail to send invitations...');
        window.open(mailtoLink, '_blank');
    };

    initPage();
    startSessionTimer();
    initResizer();
    selectQuestionType('mcq');
    lucide.createIcons();


