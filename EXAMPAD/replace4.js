const fs = require('fs');
let file = fs.readFileSync('c:/Users/omagg/OneDrive/Desktop/C - 01/TESTPAD/pages/course-creator.html', 'utf8');

// Fix getActiveModules bug
file = file.replace(/if \(!getActiveModules\(\)\) getActiveModules\(\) = \[\];\s*return getActiveModules\(\);/g, `if (!courseData.modules) courseData.modules = [];\n            return courseData.modules;`);

// Add Enter key event listener to showPrompt
const oldShowPrompt = `btn.onclick = () => {
                const val = document.getElementById('promptInput').value;
                if (val) {
                    onConfirm(val);
                    closeModal();
                }
            };`;

const newShowPrompt = `btn.onclick = () => {
                const val = document.getElementById('promptInput').value;
                if (val) {
                    onConfirm(val);
                    closeModal();
                }
            };
            
            // Add enter key support
            const inputField = document.getElementById('promptInput');
            if (inputField) {
                inputField.focus();
                inputField.addEventListener('keypress', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        btn.click();
                    }
                });
            }`;

if (file.includes(oldShowPrompt) && !file.includes('e.key === \'Enter\'')) {
    file = file.replace(oldShowPrompt, newShowPrompt);
}

fs.writeFileSync('c:/Users/omagg/OneDrive/Desktop/C - 01/TESTPAD/pages/course-creator.html', file);
console.log('Modified 4 successfully');
