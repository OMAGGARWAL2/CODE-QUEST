const fs = require('fs');
let c = fs.readFileSync('pages/comexam-attempt.html', 'utf8');

c = c.replace(/background:\s*#FAF6F0;/g, 'background: #E0F2FE;');
c = c.replace(/color:\s*#D35400;/g, 'color: #1E40AF;');
c = c.replace(/color:\s*#E67E22;/g, 'color: #2563EB;');
c = c.replace(/background:\s*#C46210;/g, 'background: #1E40AF;');
c = c.replace(/box-shadow:\s*0\s+4px\s+12px\s+rgba\(196,\s*98,\s*16,\s*0\.2\);/g, 'box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);');

c = c.replace(/\.pill-opt\s*\{[\s\S]*?\.pill-opt\.active\s*\{[\s\S]*?\}/g, `.feedback-stars {
            display: flex;
            gap: 15px;
            font-size: 35px;
            color: #CBD5E1;
            cursor: pointer;
        }

        .star-opt {
            transition: color 0.2s, transform 0.2s;
        }

        .star-opt:hover, .star-opt.hovered {
            color: #60A5FA;
            transform: scale(1.1);
        }

        .star-opt.active {
            color: #3B82F6;
        }`);

c = c.replace(/<div\s+class="feedback-pills">[\s\S]*?<\/div>/, `<div class="feedback-stars" id="starContainer">
                                    <i class="fas fa-star star-opt" onclick="setFeedbackStar(1)" onmouseover="hoverStar(1)" onmouseout="unhoverStar()"></i>
                                    <i class="fas fa-star star-opt" onclick="setFeedbackStar(2)" onmouseover="hoverStar(2)" onmouseout="unhoverStar()"></i>
                                    <i class="fas fa-star star-opt" onclick="setFeedbackStar(3)" onmouseover="hoverStar(3)" onmouseout="unhoverStar()"></i>
                                    <i class="fas fa-star star-opt" onclick="setFeedbackStar(4)" onmouseover="hoverStar(4)" onmouseout="unhoverStar()"></i>
                                    <i class="fas fa-star star-opt" onclick="setFeedbackStar(5)" onmouseover="hoverStar(5)" onmouseout="unhoverStar()"></i>
                                </div>`);

c = c.replace(/function\s+setFeedbackPill\(btn\)\s*\{[\s\S]*?btn\.classList\.add\("active"\);\s*\}/, `let currentStarRating = 0;
        function setFeedbackStar(rating) {
            currentStarRating = rating;
            updateStars(rating);
        }
        function hoverStar(rating) {
            updateStars(rating, true);
        }
        function unhoverStar() {
            updateStars(currentStarRating);
        }
        function updateStars(rating, isHover = false) {
            const stars = document.querySelectorAll('.star-opt');
            stars.forEach((star, idx) => {
                if (idx < rating) {
                    star.classList.add(isHover ? 'hovered' : 'active');
                    if (!isHover) star.classList.remove('hovered');
                } else {
                    star.classList.remove('active', 'hovered');
                }
            });
        }`);

c = c.replace(/src="https:\/\/www\.ragadesigners\.com\/services-images\/theater\/live\.png"/g, 'src="https://cdn-icons-png.flaticon.com/512/190/190411.png"');

fs.writeFileSync('pages/comexam-attempt.html', c);
console.log("Regex replace done");
