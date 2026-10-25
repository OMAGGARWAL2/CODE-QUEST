const fs = require('fs');
let html = fs.readFileSync('pages/comexam-attempt.html', 'utf8');

const oldFeedback = `                <div id="feedbackView">
                    <header class="feedback-header">
                        <div class="feedback-inner-header">
                            <img id="feedbackSuccessIcon"
                                src="https://cdn-icons-png.flaticon.com/512/190/190411.png"
                                class="feedback-icon" alt="Success">
                            <div class="feedback-header-content">
                                <h1>Test submitted successfully :)</h1>
                                <p class="time-took">you took <b id="finalTimeTook">-- mins</b> to finish the test
                                </p>
                                <p>Please take out a minute to submit your feedback. Your feedback helps us improve
                                    the
                                    quality of learning and the services we render to you.</p>
                            </div>
                        </div>
                    </header>

                    <div class="feedback-body">
                        <div class="feedback-inner-body">
                            <div class="feedback-section border-divider">
                                <label>How was the interpretation of questions</label>
                                <div class="feedback-stars" id="starContainer">
                                    <i class="fas fa-star star-opt" onclick="setFeedbackStar(1)" onmouseover="hoverStar(1)" onmouseout="unhoverStar()"></i>
                                    <i class="fas fa-star star-opt" onclick="setFeedbackStar(2)" onmouseover="hoverStar(2)" onmouseout="unhoverStar()"></i>
                                    <i class="fas fa-star star-opt" onclick="setFeedbackStar(3)" onmouseover="hoverStar(3)" onmouseout="unhoverStar()"></i>
                                    <i class="fas fa-star star-opt" onclick="setFeedbackStar(4)" onmouseover="hoverStar(4)" onmouseout="unhoverStar()"></i>
                                    <i class="fas fa-star star-opt" onclick="setFeedbackStar(5)" onmouseover="hoverStar(5)" onmouseout="unhoverStar()"></i>
                                </div>
                            </div>

                            <div class="feedback-section">
                                <label>Any other suggestion or feedback?</label>
                                <textarea class="feedback-text-area" id="finalFeedbackMsg"
                                    placeholder=".enter text here..."></textarea>
                            </div>

                            <div style="display: flex; align-items: center; gap: 0; margin-top: -5px;">
                                <button class="btn-feedback-done" id="feedbackSubmitBtn" onclick="submitFeedback()"
                                    style="font-family: 'Roboto', sans-serif; text-transform: none;">Submit</button>
                                <div id="immediateResultContainer"></div>
                            </div>
                        </div>
                    </div>
                </div>`;

const newFeedback = `                <div id="feedbackView" style="display: none; inset: 0; position: fixed; background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%); z-index: 100000; overflow-y: auto; align-items: center; justify-content: center;">
                    <div style="background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border-radius: 24px; padding: 48px; width: 90%; max-width: 600px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.5); text-align: center; margin: 40px auto;">
                        <i data-lucide="check-circle" style="color: #10b981; width: 80px; height: 80px; margin-bottom: 24px;"></i>
                        <h1 style="font-family: 'Outfit', sans-serif; color: #1a202c; font-size: 2.5rem; margin-top: 0; margin-bottom: 12px; font-weight: 800;">Exam Completed!</h1>
                        <p style="color: #4a5568; font-size: 1.1rem; margin-bottom: 32px; line-height: 1.6;">You took <span id="finalTimeTook" style="font-weight: 700; color: #2b6cb0;">-- mins</span> to finish. We'd love to hear your thoughts to improve future exams.</p>
                        
                        <div style="text-align: left; margin-bottom: 32px;">
                            <label style="display: block; font-family: 'Inter', sans-serif; font-weight: 600; color: #2d3748; margin-bottom: 16px; font-size: 1.1rem;">Rate your exam experience</label>
                            <div class="feedback-stars" id="starContainer" style="display: flex; gap: 12px; justify-content: center; margin-bottom: 16px;">
                                <i class="fas fa-star star-opt" onclick="setFeedbackStar(1)" onmouseover="hoverStar(1)" onmouseout="unhoverStar()" style="font-size: 40px; cursor: pointer; color: #e2e8f0; transition: color 0.2s, transform 0.2s;"></i>
                                <i class="fas fa-star star-opt" onclick="setFeedbackStar(2)" onmouseover="hoverStar(2)" onmouseout="unhoverStar()" style="font-size: 40px; cursor: pointer; color: #e2e8f0; transition: color 0.2s, transform 0.2s;"></i>
                                <i class="fas fa-star star-opt" onclick="setFeedbackStar(3)" onmouseover="hoverStar(3)" onmouseout="unhoverStar()" style="font-size: 40px; cursor: pointer; color: #e2e8f0; transition: color 0.2s, transform 0.2s;"></i>
                                <i class="fas fa-star star-opt" onclick="setFeedbackStar(4)" onmouseover="hoverStar(4)" onmouseout="unhoverStar()" style="font-size: 40px; cursor: pointer; color: #e2e8f0; transition: color 0.2s, transform 0.2s;"></i>
                                <i class="fas fa-star star-opt" onclick="setFeedbackStar(5)" onmouseover="hoverStar(5)" onmouseout="unhoverStar()" style="font-size: 40px; cursor: pointer; color: #e2e8f0; transition: color 0.2s, transform 0.2s;"></i>
                            </div>
                        </div>

                        <div style="text-align: left; margin-bottom: 32px;">
                            <label style="display: block; font-family: 'Inter', sans-serif; font-weight: 600; color: #2d3748; margin-bottom: 12px; font-size: 1.1rem;">Any other suggestions?</label>
                            <textarea id="finalFeedbackMsg" style="width: 100%; height: 120px; background: #f7fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 16px; font-family: 'Inter', sans-serif; font-size: 1rem; color: #4a5568; outline: none; transition: border-color 0.2s; resize: none;" placeholder="Tell us what you think..." onfocus="this.style.borderColor='#3182ce'" onblur="this.style.borderColor='#e2e8f0'"></textarea>
                        </div>

                        <button id="feedbackSubmitBtn" onclick="submitFeedback()" style="background: linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%); color: #fff; border: none; padding: 16px 48px; border-radius: 12px; font-weight: 700; font-size: 1.2rem; cursor: pointer; box-shadow: 0 10px 20px rgba(49,130,206,0.3); transition: all 0.2s; font-family: 'Outfit', sans-serif; width: 100%;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 12px 24px rgba(49,130,206,0.4)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 10px 20px rgba(49,130,206,0.3)'">Submit Feedback</button>
                    </div>
                </div>`;

if (html.includes(oldFeedback)) {
    html = html.replace(oldFeedback, newFeedback);
    fs.writeFileSync('pages/comexam-attempt.html', html, 'utf8');
    console.log('Successfully updated feedback view to glassmorphism style!');
} else {
    // try removing newlines/spaces
    let flatHtml = html.replace(/\s+/g, ' ');
    let flatOld = oldFeedback.replace(/\s+/g, ' ');
    if (flatHtml.includes(flatOld)) {
        // Find index
        let startIdx = flatHtml.indexOf(flatOld);
        // ... well regex replacement is easier
        console.log('Needs fuzzy match');
    } else {
        console.log('Could not find old feedback view block in comexam-attempt.html');
    }
}
