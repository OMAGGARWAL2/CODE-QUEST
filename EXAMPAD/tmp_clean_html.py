import re

input_file = r"c:\Users\omagg\OneDrive\Desktop\C - 01\EXAMPAD\pages\exam-attempt.html"
output_file = r"c:\Users\omagg\OneDrive\Desktop\C - 01\EXAMPAD\pages\exam-attempt.html"

with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

clean_lines = []
for line in lines:
    # Remove lines that look like search results: "filename:LXXX: content"
    if re.match(r'^[a-zA-Z0-9_\-\.]+\.html:\d+:', line.strip()):
        continue
    # Remove fragments like "    </div>pt.html:5606:"
    if re.search(r'\.html:\d+:', line):
        continue
    clean_lines.append(line)

with open(output_file, 'w', encoding='utf-8') as f:
    f.writelines(clean_lines)
