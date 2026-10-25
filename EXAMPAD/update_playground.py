import re

# Read course-player.html
with open('pages/course-player.html', 'r', encoding='utf-8') as f:
    course_html = f.read()

# Extract header HTML
header_html = re.search(r'<header>.*?</header>', course_html, re.DOTALL).group(0)

# Extract CSS blocks
css_part1 = re.search(r'\s*\.header-left-icons \{.*?(?=\s*/\* HIGH FIDELITY IDE)', course_html, re.DOTALL).group(0)
css_part2 = re.search(r'\s*\.popover \{.*?(?=\s*/\* FONT SIZER STYLES)', course_html, re.DOTALL).group(0)
header_css = f"\n<style>\n{css_part1}\n{css_part2}\n</style>\n"

# Extract JS
js_part = re.search(r'document\.getElementById\(\'plusBtn\'\)\.onclick = \(e\) => \{.*?if \(profileMenu\) profileMenu\.style\.display = \'none\';\s*\}\s*\}\);', course_html, re.DOTALL).group(0)
header_js = f"\n<script>\ndocument.addEventListener('DOMContentLoaded', () => {{\n{js_part}\n}});\n</script>\n"

# Read playground.html
with open('pages/playground.html', 'r', encoding='utf-8') as f:
    playground_html = f.read()

# Replace header in playground.html
playground_html = re.sub(r'<header>.*?</header>', header_css + header_html + header_js, playground_html, flags=re.DOTALL)

# Add Alt+F4 logic
alt_f4_logic = '''
            // Add Alt+F4 globally for run
            document.addEventListener('keydown', function(e) {
                if (e.altKey && e.key === 'F4') {
                    e.preventDefault();
                    if(document.getElementById('runBtn') && !document.getElementById('runBtn').disabled) {
                        document.getElementById('runBtn').click();
                    } else if (typeof uiManager !== 'undefined' && uiManager.runCode) {
                        uiManager.runCode();
                    }
                }
            });
'''
playground_html = playground_html.replace('// Initialize UI Manager', alt_f4_logic + '\n            // Initialize UI Manager')

with open('pages/playground.html', 'w', encoding='utf-8') as f:
    f.write(playground_html)

print("Successfully updated playground.html")
