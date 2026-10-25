const fs = require('fs');
let c = fs.readFileSync('pages/comexam-attempt.html', 'utf8');
const css = fs.readFileSync('temp_css.txt', 'utf8');
const html = fs.readFileSync('temp_html.txt', 'utf8');

c = c.replace('</style>', css + '\n    </style>');
c = c.replace('<!-- VIEW 4: QUESTION PAPER -->', html + '\n    <!-- VIEW 4: QUESTION PAPER -->');

const oldSubmit = `alert("Test Submitted Successfully! Your score is " + score);
            window.location.href = "student-dashboard.html";`;
const newSubmit = `const start = new Date(attempt.startTime).getTime();
            const end = new Date().getTime();
            const mins = Math.max(1, Math.round((end - start) / 60000));
            const ft = document.getElementById("finalTimeTook");
            if(ft) ft.textContent = mins + " mins";
            document.getElementById("exam-view").classList.add("hidden");
            document.getElementById("instruction-view").classList.add("hidden");
            document.getElementById("feedbackView").style.display = "flex";`;

c = c.replace(oldSubmit, newSubmit);

const jsFunctions = `
        function setFeedbackPill(btn) {
            const container = btn.parentElement;
            container.querySelectorAll(".pill-opt").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        }

        function submitFeedback() {
            window.location.replace("./student-dashboard.html");
        }

    </script>`;

c = c.replace('</script>', jsFunctions);
fs.writeFileSync('pages/comexam-attempt.html', c);
console.log("Successfully patched comexam-attempt.html");
