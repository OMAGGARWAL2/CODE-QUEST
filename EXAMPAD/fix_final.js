const fs = require('fs');
let text = fs.readFileSync('pages/comexam-attempt.html', 'utf8');

const targetStr = `        function closeSubmitModal() {\r
            document.getElementById('submitModal').classList.add('hidden');\r
        }\r
\r
\r
                attemptQs[q.id] = {`;

const targetStr2 = `        function closeSubmitModal() {\n            document.getElementById('submitModal').classList.add('hidden');\n        }\n\n\n                attemptQs[q.id] = {`;

const insertCode = `        function finalSubmitTest() {
            document.getElementById('submitModal').classList.add('hidden');
            clearInterval(examTimer);

            let score = 0;
            let attemptQs = {};

            questions.forEach((q, i) => {
                let status = qStatus[i];
                let isAns = status === 'answered' || status === 'marked-answered';
                let isCorrect = responses[i] === q.correctAnswer;

                if (isAns) {
                    if (isCorrect) {
                        score += parseFloat(q.marks || 1);
                    } else {
                        score -= parseFloat(examData.negativeMarking || 0);
                    }
                }`;

let success = false;
if (text.includes(targetStr)) {
    text = text.replace(targetStr, `        function closeSubmitModal() {\r\n            document.getElementById('submitModal').classList.add('hidden');\r\n        }\r\n\r\n` + insertCode + `\r\n                attemptQs[q.id] = {`);
    success = true;
} else if (text.includes(targetStr2)) {
    text = text.replace(targetStr2, `        function closeSubmitModal() {\n            document.getElementById('submitModal').classList.add('hidden');\n        }\n\n` + insertCode + `\n                attemptQs[q.id] = {`);
    success = true;
} else {
    // fuzzy match if whitespace differs
    const parts = text.split('attemptQs[q.id] = {');
    if (parts.length === 2 && parts[0].includes('closeSubmitModal()')) {
        text = parts[0] + insertCode + '\n                attemptQs[q.id] = {' + parts[1];
        success = true;
    }
}

if (success) {
    fs.writeFileSync('pages/comexam-attempt.html', text, 'utf8');
    console.log('Fixed finalSubmitTest syntax error!');
} else {
    console.log('Could not find the target string!');
}
