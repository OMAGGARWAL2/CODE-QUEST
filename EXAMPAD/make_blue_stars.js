const fs = require('fs');
let c = fs.readFileSync('pages/comexam-attempt.html', 'utf8');

// 1. Replace CSS colors
c = c.replace('background: #FAF6F0;', 'background: #EBF5FF;'); // light blue header
c = c.replace('color: #D35400;', 'color: #1E40AF;'); // dark blue h1
c = c.replace('color: #E67E22;', 'color: #2563EB;'); // bright blue time bold
c = c.replace('background: #C46210;', 'background: #1E40AF;'); // button background
c = c.replace('background: #C46210;', 'background: #1E40AF;'); // button background active
c = c.replace('box-shadow: 0 4px 12px rgba(196, 98, 16, 0.2);', 'box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);'); // button shadow

// 2. Add Star CSS
const oldPillCss = `.pill-opt {
            background: #DDCABD;
            color: #2D3748;
            border: none;
            padding: 10px 45px;
            border-radius: 25px;
            font-weight: 600;
            /* Re-increased font weight */
            /* Decreased font weight */
            font-size: 13px;
            /* Fixed and smaller */
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.2s;
        }

        .pill-opt:hover {
            background: #C4B6A6;
        }

        .pill-opt.active {
            background: #DE6834;
            font-weight: 700;
            color: #fff;
        }`;

const newStarCss = `.feedback-stars {
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
        }`;

c = c.replace(oldPillCss, newStarCss);

// 3. Replace HTML Pills with Stars
const oldPillsHtml = `<div class="feedback-pills">
                                    <button class="pill-opt" onclick="setFeedbackPill(this)">EXCELLENT</button>
                                    <button class="pill-opt" onclick="setFeedbackPill(this)">GOOD</button>
                                    <button class="pill-opt" onclick="setFeedbackPill(this)">AVERAGE</button>
                                    <button class="pill-opt" onclick="setFeedbackPill(this)">POOR</button>
                                </div>`;

const newStarsHtml = `<div class="feedback-stars" id="starContainer">
                                    <i class="fas fa-star star-opt" onclick="setFeedbackStar(1)" onmouseover="hoverStar(1)" onmouseout="unhoverStar()"></i>
                                    <i class="fas fa-star star-opt" onclick="setFeedbackStar(2)" onmouseover="hoverStar(2)" onmouseout="unhoverStar()"></i>
                                    <i class="fas fa-star star-opt" onclick="setFeedbackStar(3)" onmouseover="hoverStar(3)" onmouseout="unhoverStar()"></i>
                                    <i class="fas fa-star star-opt" onclick="setFeedbackStar(4)" onmouseover="hoverStar(4)" onmouseout="unhoverStar()"></i>
                                    <i class="fas fa-star star-opt" onclick="setFeedbackStar(5)" onmouseover="hoverStar(5)" onmouseout="unhoverStar()"></i>
                                </div>`;

c = c.replace(oldPillsHtml, newStarsHtml);

// 4. Replace JS
const oldJs = `        function setFeedbackPill(btn) {
            const container = btn.parentElement;
            container.querySelectorAll(".pill-opt").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        }`;

const newJs = `        let currentStarRating = 0;
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
        }`;

c = c.replace(oldJs, newJs);

// Change icon
c = c.replace('src="https://www.ragadesigners.com/services-images/theater/live.png"', 'src="https://cdn-icons-png.flaticon.com/512/190/190411.png"');

fs.writeFileSync('pages/comexam-attempt.html', c);
console.log('Done!');
