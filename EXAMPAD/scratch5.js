const fs = require('fs');
const file = 'c:/Users/omagg/OneDrive/Desktop/C - 01/TESTPAD/pages/exam-creator.html';
let content = fs.readFileSync(file, 'utf8');

// Function to process specific step content
function processStep(stepId, html) {
    const regex = new RegExp(`<div id="${stepId}" class="wizard-step">([\\s\\S]*?)<div id="step-`, 'g');
    
    // Find the step
    return html.replace(regex, (match, stepContent) => {
        // Lower font weights
        let modified = stepContent.replace(/font-weight:\s*800/g, 'font-weight: 600');
        modified = modified.replace(/font-weight:\s*900/g, 'font-weight: 600');
        
        // Lower large fonts for titles
        modified = modified.replace(/font-size:\s*1\.3rem/g, 'font-size: 1.1rem');
        modified = modified.replace(/font-size:\s*1\.25rem/g, 'font-size: 1.1rem');
        
        return `<div id="${stepId}" class="wizard-step">${modified}<div id="step-`;
    });
}

content = processStep('step-1', content);
content = processStep('step-3', content);

fs.writeFileSync(file, content, 'utf8');
console.log('done');
