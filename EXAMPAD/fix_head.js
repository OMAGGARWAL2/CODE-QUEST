const fs = require('fs');
let c = fs.readFileSync('pages/comexam-attempt.html', 'utf8');

c = c.replace(`        function submitFeedback() {
            window.location.replace("./student-dashboard.html");
        }
            background: #f0f4f7;`, `        function submitFeedback() {
            window.location.replace("./student-dashboard.html");
        }
    </script>
    <style>
        * {
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
            scrollbar-width: thin;
            scrollbar-color: #b1ccde transparent;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }

        input,
        textarea,
        select {
            user-select: auto;
            -webkit-user-select: auto;
            -moz-user-select: auto;
            -ms-user-select: auto;
        }

        body {
            margin: 0;
            padding: 0;
            background: #f0f4f7;`);

fs.writeFileSync('pages/comexam-attempt.html', c);
console.log("Fixed head");
