const express = require("express");
const router = express.Router();

/**
 * @route   POST /ask-ai
 * @desc    Handles AI chat requests via the AI Controller
 * @access  Internal
 */
router.post("/ask-ai", (req, res, next) => {
    delete require.cache[require.resolve("../controllers/aiController")];
    require("../controllers/aiController").askAI(req, res, next);
});
router.post("/generate-questions", (req, res, next) => {
    delete require.cache[require.resolve("../controllers/aiController")];
    require("../controllers/aiController").generateQuestions(req, res, next);
});
router.post("/test-api-key", (req, res, next) => {
    delete require.cache[require.resolve("../controllers/aiController")];
    require("../controllers/aiController").testAPIKey(req, res, next);
});
router.post("/text-to-speech", (req, res, next) => {
    delete require.cache[require.resolve("../controllers/aiController")];
    require("../controllers/aiController").textToSpeech(req, res, next);
});

module.exports = router;


