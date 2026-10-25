const OpenAI = require("openai");

let defaultOpenai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().startsWith("sk-")) {
    try {
        defaultOpenai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY.trim()
        });
    } catch (e) {
        console.warn("Failed to initialize default OpenAI instance:", e.message);
    }
}

/**
 * Resilient fetch with explicit timeout & AbortController
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort(new Error(`API request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
        const fetchOptions = {
            ...options,
            signal: controller.signal
        };
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        return response;
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError' || controller.signal.aborted) {
            throw new Error(`API request timed out after ${timeoutMs}ms`);
        }
        throw err;
    }
}

/**
 * Direct chat interaction with AI Model (Gemini, Groq, Cerebras, OpenRouter, or OpenAI)
 */
exports.askAI = async (req, res) => {
    try {
        const userMessage = req.body?.message;
        const customApiKey = req.headers?.['x-openai-key'] || req.body?.apiKey;
        const geminiKey = req.headers?.['x-gemini-key'] || req.body?.geminiKey || process.env.GEMINI_API_KEY;
        const groqKey = req.headers?.['x-groq-key'] || req.body?.groqKey || (customApiKey && customApiKey.startsWith('gsk_') ? customApiKey : process.env.GROQ_API_KEY);
        const cerebrasKey = req.headers?.['x-cerebras-key'] || req.body?.cerebrasKey || (customApiKey && customApiKey.startsWith('csk-') ? customApiKey : process.env.CEREBRAS_API_KEY);
        const openRouterKey = req.headers?.['x-openrouter-key'] || req.body?.openRouterKey || (customApiKey && customApiKey.startsWith('sk-or-') ? customApiKey : process.env.OPENROUTER_API_KEY);

        if (!userMessage) {
            return res.status(400).json({ error: "Message content is required." });
        }

        // Check if user explicitly requested local Ollama
        if (customApiKey && (customApiKey.toLowerCase() === 'ollama' || customApiKey.toLowerCase() === 'local' || customApiKey.includes('localhost'))) {
            try {
                const ollamaResp = await callOllamaChat(userMessage);
                if (ollamaResp) {
                    return res.json({
                        reply: ollamaResp,
                        source: "local-ollama",
                        processing_time: new Date().toISOString()
                    });
                }
            } catch (ollErr) {
                console.warn("Ollama askAI error:", ollErr.message);
            }
        }

        // 1. Try Gemini if configured
        if (geminiKey && geminiKey.trim()) {
            try {
                const geminiResp = await callGeminiChat(geminiKey.trim(), userMessage);
                if (geminiResp) {
                    return res.json({
                        reply: geminiResp,
                        source: "gemini",
                        processing_time: new Date().toISOString()
                    });
                }
            } catch (gemErr) {
                console.warn("Gemini askAI error:", gemErr.message);
            }
        }

        // 2. Try Groq AI (Ultra Fast)
        if (groqKey && groqKey.trim()) {
            try {
                const groqResp = await callGroqChat(groqKey.trim(), userMessage);
                if (groqResp) {
                    return res.json({
                        reply: groqResp,
                        source: "groq",
                        processing_time: new Date().toISOString()
                    });
                }
            } catch (groqErr) {
                console.warn("Groq askAI error:", groqErr.message);
            }
        }

        // 3. Try Cerebras AI
        if (cerebrasKey && cerebrasKey.trim()) {
            try {
                const cerResp = await callCerebrasChat(cerebrasKey.trim(), userMessage);
                if (cerResp) {
                    return res.json({
                        reply: cerResp,
                        source: "cerebras",
                        processing_time: new Date().toISOString()
                    });
                }
            } catch (cerErr) {
                console.warn("Cerebras askAI error:", cerErr.message);
            }
        }

        // 4. Try OpenRouter AI
        if (openRouterKey && openRouterKey.trim()) {
            try {
                const orResp = await callOpenRouterChat(openRouterKey.trim(), userMessage);
                if (orResp) {
                    return res.json({
                        reply: orResp,
                        source: "openrouter",
                        processing_time: new Date().toISOString()
                    });
                }
            } catch (orErr) {
                console.warn("OpenRouter askAI error:", orErr.message);
            }
        }

        // 5. Try OpenAI
        let client = defaultOpenai;
        if (customApiKey && customApiKey.trim().startsWith('sk-') && !customApiKey.startsWith('sk-or-') && !customApiKey.startsWith('sk_')) {
            client = new OpenAI({ apiKey: customApiKey.trim() });
        }

        if (client) {
            try {
                const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";
                const response = await client.chat.completions.create({
                    model: modelName,
                    messages: [{ role: "user", content: userMessage }]
                });

                return res.json({
                    reply: response.choices[0].message.content,
                    source: "openai",
                    processing_time: new Date().toISOString()
                });
            } catch (openAiErr) {
                console.warn("OpenAI askAI error:", openAiErr.message);
                return res.status(500).json({
                    error: `OpenAI API Error: ${openAiErr.message}. Check your API key or quota in settings.`
                });
            }
        }

        return res.status(400).json({
            error: "No AI API key configured. Please provide your Google Gemini, Groq, Cerebras, OpenRouter, or OpenAI API Key in settings."
        });

    } catch (err) {
        console.error("AI askAI general error:", err.message);
        res.status(500).json({ error: "AI Error: " + err.message });
    }
};

/**
 * AI Controller - generateQuestions
 * 100% Real Live AI Question Generation (Gemini -> Groq -> Cerebras -> OpenRouter -> OpenAI)
 * Strictly NO hardcoded fallbacks: uses live multi-provider failover.
 */
exports.generateQuestions = async (req, res) => {
    try {
        try {
            require('dotenv').config();
        } catch (e) { }

        const {
            topic,
            prompt,
            type,
            count,
            optionsCount,
            sampleTestCasesCount,
            hiddenTestCasesCount,
            marks,
            difficulty,
            preferredLanguage,
            includeDiagram,
            apiKey,
            geminiKey,
            groqKey,
            cerebrasKey,
            openRouterKey
        } = req.body || {};

        // Smart key assignment across providers
        let customGeminiKey = (geminiKey || req.headers?.['x-gemini-key'] || process.env.GEMINI_API_KEY || '').trim();
        let customGroqKey = (groqKey || req.headers?.['x-groq-key'] || process.env.GROQ_API_KEY || '').trim();
        let customCerebrasKey = (cerebrasKey || req.headers?.['x-cerebras-key'] || process.env.CEREBRAS_API_KEY || '').trim();
        let customOpenRouterKey = (openRouterKey || req.headers?.['x-openrouter-key'] || process.env.OPENROUTER_API_KEY || '').trim();
        let customOpenAIKey = (req.headers?.['x-openai-key'] || process.env.OPENAI_API_KEY || '').trim();

        const incomingKey = (apiKey || '').trim();
        let requestedProvider = null;
        if (incomingKey) {
            if (incomingKey.toLowerCase() === 'ollama' || incomingKey.toLowerCase() === 'local' || incomingKey.includes('localhost') || incomingKey.includes('11434')) {
                requestedProvider = 'ollama';
            } else if (incomingKey.startsWith('gsk_')) {
                customGroqKey = incomingKey;
                requestedProvider = 'groq';
            } else if (incomingKey.startsWith('csk-')) {
                customCerebrasKey = incomingKey;
                requestedProvider = 'cerebras';
            } else if (incomingKey.startsWith('sk-or-')) {
                customOpenRouterKey = incomingKey;
                requestedProvider = 'openrouter';
            } else if (incomingKey.startsWith('sk-') && !incomingKey.startsWith('sk_')) {
                customOpenAIKey = incomingKey;
                requestedProvider = 'openai';
            } else {
                customGeminiKey = incomingKey;
                requestedProvider = 'gemini';
            }
        }

        if (!topic && !prompt) {
            return res.status(400).json({ success: false, error: "Topic or prompt is required for AI question generation." });
        }

        const safeTopic = (topic || prompt || "General Knowledge").trim();
        const safePrompt = (prompt || "").trim();
        const combinedText = `${safeTopic} ${safePrompt}`.toLowerCase();

        const rawTypeStr = String(type || 'mcq').toLowerCase().trim();
        let normalizedType = 'mcq';

        if (rawTypeStr === 'coding') {
            normalizedType = 'coding';
        } else if (rawTypeStr === 'numeric' || rawTypeStr === 'numerical' || rawTypeStr === 'single_integer') {
            normalizedType = 'numeric';
        } else if (rawTypeStr === 'assertion_reason' || rawTypeStr === 'assertion-reason') {
            normalizedType = 'assertion_reason';
        } else if (rawTypeStr === 'subjective' || rawTypeStr === 'theory' || rawTypeStr === 'descriptive') {
            normalizedType = 'subjective';
        } else {
            normalizedType = 'mcq';
        }

        const safeType = normalizedType;

        const numCount = Math.min(Math.max(parseInt(count) || 1, 1), 20);
        const numOpts = Math.min(Math.max(parseInt(optionsCount) || 4, 2), 6);
        const numSample = Math.min(Math.max(parseInt(sampleTestCasesCount) || 2, 1), 5);
        const numHidden = Math.min(Math.max(parseInt(hiddenTestCasesCount) || 3, 1), 10);
        const itemMarks = parseInt(marks) || (safeType === 'coding' ? 10 : (safeType === 'subjective' ? 5 : (safeType === 'assertion_reason' ? 2 : 1)));
        const diff = difficulty || 'Medium';

        // Parse and standardize target programming languages
        let reqLangs = req.body.languages;
        if (typeof reqLangs === 'string') {
            reqLangs = reqLangs.split(',').map(s => s.trim()).filter(Boolean);
        }
        let targetLangs = (Array.isArray(reqLangs) && reqLangs.length > 0)
            ? reqLangs
            : (req.body.preferredLanguage ? [req.body.preferredLanguage] : ['Python', 'Java', 'C++', 'JavaScript', 'C']);

        const standardLangMap = {
            'python': 'Python', 'python 3': 'Python', 'py': 'Python',
            'java': 'Java',
            'c++': 'C++', 'cpp': 'C++', 'c_cpp': 'C++', 'g++': 'C++',
            'javascript': 'JavaScript', 'js': 'JavaScript', 'node': 'JavaScript', 'node.js': 'JavaScript',
            'c': 'C', 'gcc': 'C'
        };
        targetLangs = [...new Set(targetLangs.map(l => standardLangMap[String(l).toLowerCase().trim()] || l))];
        if (targetLangs.includes('All Languages') || targetLangs.includes('all')) {
            targetLangs = ['Python', 'Java', 'C++', 'JavaScript', 'C'];
        }
        if (targetLangs.length === 0) targetLangs = ['Python'];
        const prefLang = targetLangs[0];

        const needDiagram = (includeDiagram === true || includeDiagram === 'yes' || includeDiagram === 'true' ||
            safePrompt.toLowerCase().includes('diagram') || safePrompt.toLowerCase().includes('figure') || safePrompt.toLowerCase().includes('image based') || safePrompt.toLowerCase().includes('image-based'));

        // Construct high-precision pedagogical system prompt tailored dynamically to safeType
        let systemPrompt = '';
        let userPromptText = '';

        if (safeType === 'coding') {
            systemPrompt = `You are a distinguished university professor, expert computer science educator, and master competitive programming problem architect (similar to LeetCode, Codeforces, HackerRank).
You are tasked with generating EXACTLY ${numCount} NEW, ORIGINAL, HIGH-QUALITY, AND PEDAGOGICALLY RIGOROUS CODING / PROGRAMMING PROBLEMS.

CRITICAL ASSESSMENT PARAMETERS:
- Main Topic / Concept: "${safeTopic}"
- User Instructions / Focus: "${safePrompt ? safePrompt : 'Standard algorithmic problem solving'}"
- Question Type: "coding" (MANDATORY: Practical Hands-On Programming Challenge)
- Target Question Count: ${numCount}
- Target Difficulty Level: "${diff}" (Adjust algorithmic complexity, constraints, and edge cases to match this level)
- Selected Programming Language(s): [${targetLangs.join(', ')}] (MANDATORY: Generate starter boilerplate code ONLY for these selected languages: ${targetLangs.join(', ')})
- Marks per Question: ${itemMarks}

STRICT CODING PROBLEM RULES (MANDATORY):
1. ABSOLUTELY NO MULTIPLE CHOICE OPTIONS:
   - DO NOT generate multiple choice options (MCQ), choices A/B/C/D, or "options" array with strings.
   - Set "options": [] and "correctAnswer": "".
   - This MUST be a real coding problem where the student writes an algorithm.

2. PROBLEM STATEMENT ("title"):
   - Formatted in clean HTML containing:
     * <strong>Problem Description:</strong> Clear explanation of the algorithmic task and scenario in complete paragraphs.
     * <strong>Input Format:</strong> Clear explanation of how standard input (stdin) is provided.
     * <strong>Output Format:</strong> Clear explanation of how standard output (stdout) should be printed.
     * <strong>Constraints:</strong> Concrete mathematical/algorithmic constraints using LaTeX ($1 \\le N \\le 10^5$, $-10^9 \\le arr[i] \\le 10^9$).

3. MATHEMATICAL & ALGORITHMIC NOTATION:
   - Wrap all mathematical formulas, algebraic variables, bounds, and equations in standard LaTeX delimiters $ ... $ or $$ ... $$.

4. TEST CASES ("testCases"):
   - You MUST generate at least ${numSample} sample test cases ("isSample": true) with explanation, and at least ${numHidden} hidden test cases ("isSample": false).
   - Total test cases MUST be at least ${numSample + numHidden}.
   - Each test case MUST have "input" (raw stdin string, use \\n for newlines), "output" (raw stdout string), "marks" (integer), "isSample" (boolean), "explanation" (string).

5. CODE BOILERPLATES ("code"):
   - Provide complete, syntactically correct boilerplate code objects ONLY for the selected language(s): [${targetLangs.join(', ')}].
   - Each selected language MUST have:
     * "prefix": driver / imports / headers
     * "middle": student solution function stub with helpful comments
     * "suffix": stdin runner reading input and printing function result to stdout

6. EXPLANATION ("explanation"):
   - Optimal algorithmic approach and Time & Space Complexity analysis using LaTeX notation (e.g. Time: $O(N \\log N)$, Space: $O(1)$).

STRICT OUTPUT FORMAT:
Output MUST be a single, valid raw JSON array containing exactly ${numCount} coding question objects. Pure JSON only (no markdown, no \`\`\`json).

JSON Schema:
[
  {
    "heading": "${safeTopic} Challenge Title",
    "title": "<p><strong>Problem Description:</strong> ...</p><p><strong>Input Format:</strong> ...</p><p><strong>Output Format:</strong> ...</p><p><strong>Constraints:</strong> ...</p>",
    "type": "coding",
    "languages": ${JSON.stringify(targetLangs)},
    "testCases": [
      { "input": "5\\n1 2 3 4 5", "output": "15", "marks": 2, "isSample": true, "explanation": "Sum of elements is 15." },
      { "input": "3\\n10 20 30", "output": "60", "marks": 2, "isSample": false }
    ],
    "code": {
      ${targetLangs.map(l => `"${l}": { "prefix": "...", "middle": "...", "suffix": "..." }`).join(',\n      ')}
    },
    "marks": ${itemMarks},
    "difficulty": "${diff}",
    "explanation": "Optimal algorithmic approach and time/space complexity with LaTeX $O(N)$."
  }
]`;

            userPromptText = `MANDATORY: Generate ${numCount} real CODING / ALGORITHM programming challenge(s) for:
Topic: ${safeTopic}
${safePrompt ? `Custom Instructions / Focus: ${safePrompt}` : ''}
Question Type: coding (NOT multiple choice / MCQ)
Difficulty Level: ${diff}
Target Count: ${numCount}
Target Languages: ${targetLangs.join(', ')}
Marks per Question: ${itemMarks}
Requirements: Each question MUST include comprehensive Problem Statement with Input/Output/Constraints, starter boilerplate code ONLY for ${targetLangs.join(', ')}, and at least ${numSample + numHidden} test cases. Do NOT include options or MCQ choices.`;

        } else if (safeType === 'numeric') {
            systemPrompt = `You are a distinguished university professor and expert examiner in STEM disciplines (Mathematics, Physics, Chemistry, Engineering).
You are tasked with generating EXACTLY ${numCount} NEW, ORIGINAL, HIGH-QUALITY NUMERICAL CALCULATION examination questions.

CRITICAL ASSESSMENT PARAMETERS:
- Main Subject / Topic: "${safeTopic}"
- User Instructions / Focus: "${safePrompt ? safePrompt : 'Standard numerical calculation problem'}"
- Question Type: "numeric"
- Target Question Count: ${numCount}
- Target Difficulty Level: "${diff}"
- Marks per Question: ${itemMarks}
- Include Figure / Diagram: ${needDiagram ? "YES (MANDATORY - EVERY question MUST have an authentic, responsive vector SVG diagram)" : "NO"}

STRICT NUMERIC, CHEMISTRY & PROPER LATEX RULES (MANDATORY):
1. PROBLEM STATEMENT ("title"):
   - Provide a concrete, rigorous numerical problem with explicit given numbers, chemical quantities (moles, molar masses, equilibrium constants $K_c$, concentrations $[\\text{A}]$, pH, oxidation states), or physical units in cohesive HTML paragraphs <p>...</p>.
   - When diagram is included, reference the figure clearly (e.g., "As shown in the accompanying schematic diagram...").
2. MATHEMATICAL & CHEMICAL NOTATION (MANDATORY):
   - Wrap EVERY mathematical variable, chemical formula, fraction, root, integral, vector, and physical constant/unit in proper LaTeX delimiters $...$ or $$...$$ (e.g., $u = 5\\hat{i} + 12\\hat{j}\\text{ m/s}$, $g = 9.8\\text{ m/s}^2$, $K_p = \\frac{P_{\\text{SO}_3}^2}{P_{\\text{SO}_2}^2 P_{\\text{O}_2}}$, $\\text{pH} = 3.50$, $\\theta = 30^\\circ$).
   - NEVER use pseudo-math or plain text like "1/2*m*v^2" or "H2SO4". ALWAYS write proper LaTeX: "$\\frac{1}{2}mv^2$", "$\\text{H}_2\\text{SO}_4$".
3. "correctNumeric": MUST be an exact clean numerical value (float or integer, e.g. 15.4 or 42).
4. "tolerance": Allowed margin of error (e.g. 0.05).
5. "explanation": Complete, rigorous step-by-step mathematical/chemical derivation with full LaTeX formulas (Formula $\\rightarrow$ Given values $\\rightarrow$ Algebraic substitution $\\rightarrow$ Final calculation).
${needDiagram ? `6. MANDATORY VECTOR SVG DIAGRAM IN "diagram" FIELD:
   - Provide an authentic, high-precision, responsive vector SVG diagram string:
     \`<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffffff"/><!-- geometric shapes, chemical apparatus, axes, molecular bonds, labels with clear dimensions --></svg>\`
   - Include crisp lines, coordinate axes, force arrows, molecular bonds, circuit components, or geometric figures with legible labels.
   - Provide a descriptive "diagramCaption" with relevant parameters enclosed in LaTeX $...$.` : ''}

STRICT OUTPUT FORMAT:
Output MUST be a single, valid raw JSON array containing exactly ${numCount} numeric question objects. Pure JSON only (no markdown, no \`\`\`json).

JSON Schema:
[
  {
    "heading": "${safeTopic} Calculation Title",
    "title": "<p>Numerical problem statement in clean HTML with LaTeX $...$</p>"${needDiagram ? ',\n    "diagram": "<svg viewBox=\\"0 0 460 260\\" xmlns=\\"http://www.w3.org/2000/svg\\"><rect width=\\"100%\\" height=\\"100%\\" fill=\\"#ffffff\\"/><!-- shapes, labels --></svg>",\n    "diagramCaption": "Figure 1: Schematic diagram with parameters $m_1$, $m_2$, and angle $\\\\theta$"' : ''},
    "type": "numeric",
    "correctNumeric": 15.4,
    "tolerance": 0.05,
    "explanation": "<p><strong>Given:</strong> $m = 2\\text{ kg}$, $v = 10\\text{ m/s}$</p><p><strong>Formula:</strong> $E_k = \\frac{1}{2}mv^2$</p><p><strong>Substitution:</strong> $E_k = \\frac{1}{2}(2)(10)^2 = 100\\text{ J}$</p>",
    "marks": ${itemMarks},
    "difficulty": "${diff}"
  }
]`;

            userPromptText = `Generate ${numCount} NUMERIC CALCULATION question(s) for:
Topic: ${safeTopic}
${safePrompt ? `Custom Instructions / Focus: ${safePrompt}` : ''}
Question Type: numeric
Difficulty Level: ${diff}
Target Count: ${numCount}
Marks per Question: ${itemMarks}
LaTeX Requirement: Ensure all formulas, chemical species, variables, and calculations in title, explanation, and diagramCaption are enclosed in proper LaTeX $...$ or $$...$$ delimiters.
${needDiagram ? 'Generate Image / Diagram based question with full vector SVG diagram in "diagram" field and descriptive "diagramCaption".' : ''}`;

        } else if (safeType === 'assertion_reason') {
            systemPrompt = `You are a distinguished university professor and expert assessment architect across STEM disciplines (Physics, Chemistry, Biology, Mathematics).
You are tasked with generating EXACTLY ${numCount} NEW Assertion & Reason examination questions.

CRITICAL ASSESSMENT PARAMETERS:
- Main Subject / Topic: "${safeTopic}"
- User Instructions / Focus: "${safePrompt ? safePrompt : 'Standard curriculum'}"
- Question Type: "assertion_reason"
- Target Question Count: ${numCount}
- Target Difficulty Level: "${diff}"
- Marks per Question: ${itemMarks}
- Include Figure / Diagram: ${needDiagram ? "YES (MANDATORY vector SVG diagram)" : "NO"}

STRICT ASSERTION & REASON RULES (MANDATORY):
1. "title": Must contain clear HTML paragraphs:
   <p><strong>Assertion (A):</strong> Statement with all scientific/chemical/mathematical formulas in LaTeX $...$.</p>
   <p><strong>Reason (R):</strong> Statement with all scientific/chemical/mathematical formulas in LaTeX $...$.</p>
2. "options": Standard 4 choices:
   ["Both (A) and (R) are true and (R) is the correct explanation of (A)", "Both (A) and (R) are true but (R) is NOT the correct explanation of (A)", "(A) is true but (R) is false", "(A) is false but (R) is true"]
3. "correctAnswer": Exact matching string from options.
4. "explanation": Comprehensive step-by-step scientific/mathematical justification with proper LaTeX equations in $...$.
${needDiagram ? `5. MANDATORY VECTOR SVG DIAGRAM IN "diagram" FIELD:
   - Provide clean vector SVG diagram: \`<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffffff"/><!-- shapes, chemical structures, labels --></svg>\`
   - Include descriptive "diagramCaption" with relevant variables in LaTeX $...$.` : ''}

STRICT OUTPUT FORMAT:
Output MUST be a single, valid raw JSON array containing exactly ${numCount} assertion_reason question objects. Pure JSON only (no markdown, no \`\`\`json).`;

            userPromptText = `Generate ${numCount} ASSERTION & REASON question(s) for:
Topic: ${safeTopic}
${safePrompt ? `Custom Instructions / Focus: ${safePrompt}` : ''}
Question Type: assertion_reason
Difficulty Level: ${diff}
Target Count: ${numCount}
Marks per Question: ${itemMarks}
LaTeX Requirement: Ensure all formulas, chemical structures, and scientific notation are enclosed in proper LaTeX $...$ delimiters.
${needDiagram ? 'Generate Image / Diagram based question with full vector SVG diagram in "diagram" field.' : ''}`;

        } else if (safeType === 'subjective') {
            systemPrompt = `You are a distinguished university professor and expert assessment architect across STEM and academic disciplines.
You are tasked with generating EXACTLY ${numCount} NEW analytical, conceptual, chemical, physical, or mathematical descriptive examination questions.

CRITICAL ASSESSMENT PARAMETERS:
- Main Subject / Topic: "${safeTopic}"
- User Instructions / Focus: "${safePrompt ? safePrompt : 'Standard curriculum'}"
- Question Type: "subjective"
- Target Question Count: ${numCount}
- Target Difficulty Level: "${diff}"
- Marks per Question: ${itemMarks}
- Include Figure / Diagram: ${needDiagram ? "YES (MANDATORY vector SVG diagram)" : "NO"}

STRICT SUBJECTIVE RULES (MANDATORY):
1. "title": Problem statement in clean HTML paragraphs <p>...</p> with all mathematical/scientific formulas and chemical species enclosed in proper LaTeX $...$ or $$...$$.
2. "keywords": Array of key concepts, chemical formulas, and terminology expected in a student's answer (with LaTeX where appropriate, e.g. ["$\\text{sp}^2\\text{ hybridization}$", "$\\text{resonance energy}$", "$\\text{electrophilic aromatic substitution}$"]).
3. "explanation": Model answer or key grading rubric with complete, proper step-by-step mathematical/scientific/chemical derivations.
${needDiagram ? `4. MANDATORY VECTOR SVG DIAGRAM IN "diagram" FIELD:
   - Provide clean vector SVG diagram: \`<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffffff"/><!-- shapes, chemical molecular bonds, labels --></svg>\`
   - Include descriptive "diagramCaption" with relevant variables in LaTeX $...$.` : ''}

STRICT OUTPUT FORMAT:
Output MUST be a single, valid raw JSON array containing exactly ${numCount} subjective question objects. Pure JSON only (no markdown, no \`\`\`json).`;

            userPromptText = `Generate ${numCount} SUBJECTIVE / DESCRIPTIVE question(s) for:
Topic: ${safeTopic}
${safePrompt ? `Custom Instructions / Focus: ${safePrompt}` : ''}
Question Type: subjective
Difficulty Level: ${diff}
Target Count: ${numCount}
Marks per Question: ${itemMarks}
LaTeX Requirement: Ensure all mathematical equations, scientific laws, chemical compounds, and formulas in title, explanation, and diagramCaption are written in proper LaTeX $...$ or $$...$$ delimiters.
${needDiagram ? 'Generate Image / Diagram based question with full vector SVG diagram in "diagram" field.' : ''}`;

        } else {
            // Default MCQ generator - STRICTLY OBEY MCQ QUESTION TYPE
            systemPrompt = `You are a distinguished university professor, master educator, and expert assessment architect in STEM disciplines (Mathematics, Physics, Chemistry, Engineering, Computer Science).
You are tasked with generating EXACTLY ${numCount} NEW, ORIGINAL, HIGH-QUALITY, AND PEDAGOGICALLY RIGOROUS MULTIPLE CHOICE (MCQ) examination questions.

CRITICAL ASSESSMENT PARAMETERS:
- Main Subject / Topic: "${safeTopic}"
- User Custom Instructions / Focus: "${safePrompt ? safePrompt : 'Standard curriculum'}"
- Academic / Curriculum Scope: If the user specified a grade level or syllabus (e.g. "Class 11 NCERT", "Class 12 CBSE", "AP Chemistry", "AP Physics", "JEE Main", "JEE Advanced", "NEET", "Undergraduate"), STRICTLY restrict all concepts, chemical structures, mathematical operations, and terminology to that exact syllabus.
- Question Type: "mcq" (STRICT MANDATORY REQUIREMENT: EVERY QUESTION MUST BE MULTIPLE CHOICE (MCQ))
- Target Question Count: ${numCount}
- Target Difficulty Level: "${diff}"
- Options Count: ${numOpts}
- Marks per Question: ${itemMarks}
- Include Figure / Diagram: ${needDiagram ? "YES (MANDATORY - EVERY question MUST have an authentic, responsive vector SVG diagram)" : "NO"}

STRICT MCQ, MATHEMATICS, CHEMISTRY & PROPER LATEX RULES (MANDATORY):
1. STRICTLY MULTIPLE CHOICE QUESTIONS (MCQ):
   - Every single question MUST be a Multiple Choice Question (MCQ) with exactly ${numOpts} distinct answer choices in the "options" array.
   - Even if the topic relates to coding or algorithms, create conceptual or code output MCQs with exactly ${numOpts} distinct options.
2. MATHEMATICAL & SCIENTIFIC NOTATION (CRITICAL MANDATORY REQUIREMENT):
   - You MUST wrap EVERY mathematical formula, equation, algebraic variable, fraction, square root, exponent, vector, integral, summation, trigonometric function, and physical unit in standard LaTeX delimiters $...$ for inline math or $$...$$ for display math.
   - Examples of proper LaTeX:
     * Fractions: $\\frac{a}{b}$, $\\frac{m_1 F}{m_1 + m_2 + m_3}$, $\\frac{d^2 x}{dt^2} + \\omega^2 x = 0$
     * Roots & Powers: $\\sqrt{x^2 + y^2}$, $2\\pi \\sqrt{\\frac{L}{g}}$, $e^{-\\lambda t}$
     * Vectors & Units: $\\vec{v} = v_0 \\cos\\theta\\,\\hat{i} + (v_0 \\sin\\theta - gt)\\,\\hat{j}$, $g = 9.8\\text{ m/s}^2$
     * Trigonometry & Greek: $\\theta = 45^\\circ$, $\\sin^2\\theta + \\cos^2\\theta = 1$, $\\lambda = \\frac{h}{p}$, $\\Delta V = IR$
     * Integrals & Calculus: $\\int_0^T f(t)\\,dt$, $\\sum_{k=1}^n k^2 = \\frac{n(n+1)(2n+1)}{6}$
   - NEVER write bare pseudo-math or plain text like "m1*F/(m1+m2)", "sqrt(x)", "theta = 30 deg", "x^2 + y^2 = r^2". ALWAYS write fully-formed LaTeX: "$\\frac{m_1 F}{m_1 + m_2}$", "$\\sqrt{x}$", "$\\theta = 30^\\circ$", "$x^2 + y^2 = r^2$".

3. CHEMISTRY & CHEMICAL COMPOUNDS / STRUCTURES RULES (CRITICAL MANDATORY REQUIREMENT):
   - Whenever generating questions on Chemical Bonding, Chemical Compounds, Lewis Dot Structures, Resonance Structures, Organic Functional Groups/Rings, Isomerism, Coordination Compounds, or Reaction Mechanisms:
   a) MANDATORY VECTOR SVG CHEMICAL STRUCTURE DIAGRAM:
      When needDiagram is true (or when asking to identify, compare, or rank chemical structures or resonance contributors e.g. $\\text{N}_2\\text{O}$, $\\text{CO}_3^{2-}$, Benzene, Carboxylic acids, Alkenes, Coordination complexes, etc.):
      - Generate an authentic, beautifully drawn, high-contrast 2D chemical structure diagram in the "diagram" SVG field (\`<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffffff"/><!-- chemical bonds, lone pairs, atom labels, formal charges --></svg>\`) with:
        * Crisp white background \`<rect width="100%" height="100%" fill="#ffffff"/>\`
        * Clear dark atom symbols (\`<text x="..." y="..." font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="#0f172a">N</text>\`)
        * Precise chemical bonds: single bonds (\`<line ... stroke="#0f172a" stroke-width="2"/>\`), double bonds (two parallel lines), triple bonds (three parallel lines), coordinate/dative arrows, or dashed partial bonds
        * Explicit electron lone pairs represented as crisp solid dots (\`<circle cx="..." cy="..." r="2" fill="#0f172a"/>\`)
        * Formal charges (e.g. \`+\` or \`-\` near atoms or in small circles)
        * For multiple resonance structures (e.g. Structure (I), Structure (II), Structure (III)), arrange them side-by-side or stacked in the SVG with clear labels below each structure ("Structure (I)", "Structure (II)", "Structure (III)").
   b) CHEMICAL FORMULAS & LATEX NOTATION IN TEXT & OPTIONS:
      - ALL chemical formulas, Lewis dot structures, oxidation states, and resonance forms MUST be formatted with proper LaTeX enclosed in $...$ delimiters.
      - Examples:
        * Resonance & Lewis structures: \`"Structure I: $\\\\text{:\\\\!N}\\\\equiv\\\\text{N}^+-\\\\ddot{\\\\text{O}}^-:$"\`, \`"Structure II: $\\\\text{:\\\\!N}=\\\\text{N}^+=\\\\ddot{\\\\text{O}}:"\`, \`"Structure III: $\\\\ddot{\\\\text{N}}^--\\\\text{N}^+\\\\equiv\\\\text{O}^+:"\`
        * Molecular formulas & Ions: \`"$\\\\text{H}_2\\\\text{SO}_4$"\`, \`"$\\\\text{N}_2\\\\text{O}$"\`, \`"$\\\\text{CH}_3\\\\text{COOH}$"\`, \`"$\\\\text{Fe}^{3+}$"\`, \`"$\\\\text{SO}_4^{2-}$"\`
        * Chemical reactions: \`"$\\\\text{N}_2\\\\text{O} \\\\xrightarrow{\\\\Delta} \\\\text{N}_2 + \\\\frac{1}{2}\\\\text{O}_2$"\`
      - IN OPTIONS: If an option contains a label like "Structure I" or "Compound A", ALWAYS format as \`"Structure I: $\\\\text{:\\\\!N}\\\\equiv\\\\text{N}^+-\\\\ddot{\\\\text{O}}^-:"\` or \`"$\\\\text{Structure I}: \\\\text{:\\\\!N}\\\\equiv\\\\text{N}^+-\\\\ddot{\\\\text{O}}^-:"\`. NEVER write raw un-delimited backslashes like \`Structure I (:\\\\text{N}\\\\equiv\\\\text{N}-\\\\ddot{\\\\text{O}}:)\`.

4. "options" ARRAY FORMATTING:
   - In the "options" array, EVERY mathematical/chemical choice MUST be enclosed in $...$ delimiters, e.g.:
     \`"options": ["$\\\\frac{m_1 F}{m_1 + m_2 + m_3}$", "$\\\\frac{(m_1 + m_2)F}{m_1 + m_2 + m_3}$", "$\\\\frac{m_3 F}{m_1 + m_2 + m_3}$", "$\\\\frac{F}{m_1 + m_2 + m_3}$"]\`
   - Never write raw LaTeX commands without dollar sign delimiters.
5. PARAGRAPH FORMATTING:
   - Return problem statements in "title" formatted as continuous, coherent HTML paragraphs <p>...</p>. When referencing diagrams, include context like "In the figure shown below...".
6. "correctAnswer": Exact string matching one of the choices in the "options" array (including its $...$ delimiters if mathematical/chemical).
7. "explanation": Comprehensive, step-by-step mathematical/chemical derivation showing formula $\\rightarrow$ given values $\\rightarrow$ substitution $\\rightarrow$ final result in LaTeX.
${needDiagram ? `8. MANDATORY HIGH-PRECISION VECTOR SVG DIAGRAM IN "diagram" FIELD:
   - You MUST provide an authentic, fully labeled, self-contained SVG diagram in the "diagram" field with:
     \`<svg viewBox="0 0 460 260" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffffff"/><!-- clean geometric elements, axes, components, chemical bonds, labels --></svg>\`
   - Include crisp white background, sharp shapes (rectangles, circles, lines, chemical structures, curves), coordinate axes, vector arrows with arrowheads, circuit components, or physical systems (pulleys, inclined planes, blocks, masses $m_1$, $m_2$, angles $\\theta$).
   - Use clean text labels inside the SVG (<text x="..." y="..." font-family="Arial" font-size="14" font-weight="bold" fill="#0f172a">...</text>).
   - Provide an informative "diagramCaption" (e.g., "Figure 1: Resonance structures of $\\\\text{N}_2\\\\text{O}$ with formal charges").` : ''}

STRICT OUTPUT FORMAT:
Output MUST be a single, valid raw JSON array containing exactly ${numCount} MCQ question objects. Pure JSON only (no markdown, no \`\`\`json).

JSON Schema:
[
  {
    "heading": "${safeTopic} Subtopic Title",
    "title": "<p>Problem statement in clean HTML with full LaTeX equations $...$</p>"${needDiagram ? ',\n    "diagram": "<svg viewBox=\\"0 0 460 260\\" xmlns=\\"http://www.w3.org/2000/svg\\"><rect width=\\"100%\\" height=\\"100%\\" fill=\\"#ffffff\\"/><!-- shapes, vectors, labels --></svg>",\n    "diagramCaption": "Figure 1: Schematic representation for ${safeTopic}"' : ''},
    "type": "mcq",
    "options": ["$Choice A$", "$Choice B$", "$Choice C$", "$Choice D$"],
    "correctAnswer": "$Choice A$",
    "explanation": "<p><strong>Step 1:</strong> Formula: $...$</p><p><strong>Step 2:</strong> Substitution: $...$</p><p><strong>Step 3:</strong> Result: $...$</p>",
    "marks": ${itemMarks},
    "difficulty": "${diff}"
  }
]`;

            userPromptText = `STRICT MANDATORY REQUIREMENT: Generate exactly ${numCount} MULTIPLE CHOICE (MCQ) question(s) for:
Topic: ${safeTopic}
${safePrompt ? `Custom Instructions / Focus: ${safePrompt}` : ''}
Question Type: mcq (MUST be Multiple Choice with ${numOpts} choices in the options array, NOT coding challenge or subjective)
Difficulty Level: ${diff}
Target Count: ${numCount}
Marks per Question: ${itemMarks}
LaTeX & Chemistry Requirement: Ensure ALL formulas, equations, chemical compounds, Lewis structures, and mathematical options are enclosed in proper LaTeX $...$ or $$...$$ delimiters.
${needDiagram ? 'Generate Image / Diagram based question with full vector SVG diagram in "diagram" field and descriptive "diagramCaption" with proper LaTeX equations and chemical structures.' : ''}`;
        }

        let parsedQuestions = null;
        let generatedSource = null;
        const errorLogs = [];

        // Build list of execution tasks
        // Order: requested provider first (if specified), then Gemini -> Groq -> OpenRouter -> Ollama (Local) -> Cerebras -> OpenAI
        const executionPlan = [];

        if (requestedProvider === 'ollama') executionPlan.push('ollama');
        else if (requestedProvider === 'gemini' && customGeminiKey) executionPlan.push('gemini');
        else if (requestedProvider === 'groq' && customGroqKey) executionPlan.push('groq');
        else if (requestedProvider === 'openrouter' && customOpenRouterKey) executionPlan.push('openrouter');
        else if (requestedProvider === 'cerebras' && customCerebrasKey) executionPlan.push('cerebras');
        else if (requestedProvider === 'openai' && customOpenAIKey) executionPlan.push('openai');

        ['gemini', 'groq', 'openrouter', 'ollama', 'cerebras', 'openai'].forEach(p => {
            if (!executionPlan.includes(p)) executionPlan.push(p);
        });

        // Silently loop through all providers until one succeeds
        for (const provider of executionPlan) {
            if (parsedQuestions && parsedQuestions.length > 0) break;

            try {
                if (provider === 'ollama') {
                    const rawOllama = await callOllama(systemPrompt, userPromptText);
                    if (rawOllama) {
                        const valid = safeParseQuestions(rawOllama, safeTopic);
                        if (valid && valid.length > 0) {
                            parsedQuestions = valid;
                            generatedSource = "local-ollama (" + (process.env.OLLAMA_MODEL || "qwen3:8b") + ")";
                            break;
                        }
                    }
                } else if (provider === 'gemini' && customGeminiKey) {
                    const rawGemini = await callGemini(customGeminiKey, systemPrompt, userPromptText, 0);
                    if (rawGemini) {
                        const valid = safeParseQuestions(rawGemini, safeTopic);
                        if (valid && valid.length > 0) {
                            parsedQuestions = valid;
                            generatedSource = "gemini";
                            break;
                        }
                    }
                } else if (provider === 'groq' && customGroqKey) {
                    const rawGroq = await callGroq(customGroqKey, systemPrompt, userPromptText);
                    if (rawGroq) {
                        const valid = safeParseQuestions(rawGroq, safeTopic);
                        if (valid && valid.length > 0) {
                            parsedQuestions = valid;
                            generatedSource = "groq (" + (process.env.GROQ_MODEL || "openai/gpt-oss-120b") + ")";
                            break;
                        }
                    }
                } else if (provider === 'openrouter' && customOpenRouterKey) {
                    const rawOpenRouter = await callOpenRouter(customOpenRouterKey, systemPrompt, userPromptText);
                    if (rawOpenRouter) {
                        const valid = safeParseQuestions(rawOpenRouter, safeTopic);
                        if (valid && valid.length > 0) {
                            parsedQuestions = valid;
                            generatedSource = "openrouter (" + (process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct") + ")";
                            break;
                        }
                    }
                } else if (provider === 'cerebras' && customCerebrasKey) {
                    const rawCerebras = await callCerebras(customCerebrasKey, systemPrompt, userPromptText);
                    if (rawCerebras) {
                        const valid = safeParseQuestions(rawCerebras, safeTopic);
                        if (valid && valid.length > 0) {
                            parsedQuestions = valid;
                            generatedSource = "cerebras (" + (process.env.CEREBRAS_MODEL || "gpt-oss-120b") + ")";
                            break;
                        }
                    }
                } else if (provider === 'openai' && customOpenAIKey) {
                    let client = defaultOpenai;
                    if (customOpenAIKey.startsWith('sk-') && !customOpenAIKey.startsWith('sk-or-') && !customOpenAIKey.startsWith('sk_')) {
                        client = new OpenAI({ apiKey: customOpenAIKey });
                    }
                    if (client) {
                        const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";
                        const completion = await client.chat.completions.create({
                            model: modelName,
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: userPromptText }
                            ],
                            temperature: 0.7
                        });
                        const rawContent = completion.choices[0].message.content;
                        const valid = safeParseQuestions(rawContent, safeTopic);
                        if (valid && valid.length > 0) {
                            parsedQuestions = valid;
                            generatedSource = "openai (" + modelName + ")";
                            break;
                        }
                    }
                }
            } catch (err) {
                console.warn(`Provider [${provider}] failed: ${err.message}. Silently attempting next provider...`);
                errorLogs.push(`${provider}: ${err.message}`);
            }
        }

        // Backup rapid second pass if needed to ensure the paper is ALWAYS synthesized once commanded
        if (!parsedQuestions || !Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
            console.log("Initiating rapid failover secondary pass across available high-speed models...");
            for (const provider of ['groq', 'openrouter', 'cerebras', 'gemini']) {
                if (parsedQuestions && parsedQuestions.length > 0) break;
                try {
                    if (provider === 'groq' && customGroqKey) {
                        const raw = await callGroq(customGroqKey, systemPrompt, userPromptText);
                        if (raw) {
                            const json = JSON.parse(cleanJsonResponse(raw));
                            if (Array.isArray(json) && json.length > 0) {
                                parsedQuestions = json;
                                generatedSource = "groq (failover-pass)";
                                break;
                            }
                        }
                    } else if (provider === 'openrouter' && customOpenRouterKey) {
                        const raw = await callOpenRouter(customOpenRouterKey, systemPrompt, userPromptText);
                        if (raw) {
                            const json = JSON.parse(cleanJsonResponse(raw));
                            if (Array.isArray(json) && json.length > 0) {
                                parsedQuestions = json;
                                generatedSource = "openrouter (failover-pass)";
                                break;
                            }
                        }
                    } else if (provider === 'cerebras' && customCerebrasKey) {
                        const raw = await callCerebras(customCerebrasKey, systemPrompt, userPromptText);
                        if (raw) {
                            const json = JSON.parse(cleanJsonResponse(raw));
                            if (Array.isArray(json) && json.length > 0) {
                                parsedQuestions = json;
                                generatedSource = "cerebras (failover-pass)";
                                break;
                            }
                        }
                    }
                } catch (pass2Err) {
                    console.warn(`Pass 2 [${provider}] failed: ${pass2Err.message}`);
                }
            }
        }

        // Final verification of generated questions
        if (!parsedQuestions || !Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
            const joinedErrors = errorLogs.length > 0 ? errorLogs.join(" | ") : "All AI engines were temporarily busy. Please retry.";
            return res.status(400).json({
                success: false,
                error: joinedErrors,
                rawErrors: errorLogs
            });
        }

        // Format and assign IDs & attributes
        const formatted = parsedQuestions.slice(0, numCount).map((q, idx) => {
            let svgDiagram = q.diagram || q.diagramSvg || q.svg || undefined;
            // If SVG is embedded directly in title, extract it
            if (!svgDiagram && typeof q.title === 'string' && q.title.includes('<svg') && q.title.includes('</svg>')) {
                const match = q.title.match(/<svg[\s\S]*?<\/svg>/i);
                if (match) {
                    svgDiagram = match[0];
                }
            }
            if (svgDiagram) {
                svgDiagram = sanitizeSvgDiagram(svgDiagram);
            }

            // Strictly enforce the requested question type
            const itemType = safeType;

            let normalizedCode = {};
            let normalizedTCs = [];
            let normalizedLangs = undefined;
            let normalizedOptions = [];
            let normalizedCorrectAnswer = '';

            if (itemType === 'coding') {
                normalizedCode = normalizeCodeBoilerplates(q.code, safeTopic, targetLangs);
                normalizedTCs = normalizeTestCases(q.testCases, safeTopic, numSample, numHidden);
                normalizedLangs = targetLangs;
            } else if (itemType === 'mcq' || itemType === 'assertion_reason') {
                if (Array.isArray(q.options) && q.options.length >= 2) {
                    normalizedOptions = q.options.map(opt => autoWrapLatexDelimiters(String(opt).trim()));
                } else if (itemType === 'assertion_reason') {
                    normalizedOptions = [
                        "Both (A) and (R) are true and (R) is the correct explanation of (A)",
                        "Both (A) and (R) are true but (R) is NOT the correct explanation of (A)",
                        "(A) is true but (R) is false",
                        "(A) is false but (R) is true"
                    ];
                } else {
                    // Standard 4 option fallback for MCQ if options were omitted
                    normalizedOptions = ["Option A", "Option B", "Option C", "Option D"];
                }

                let rawAns = q.correctAnswer !== undefined ? String(q.correctAnswer).trim() : '';
                normalizedCorrectAnswer = autoWrapLatexDelimiters(rawAns) || normalizedOptions[0];
                if (!normalizedOptions.includes(normalizedCorrectAnswer)) {
                    const letterMatch = String(rawAns).trim().toUpperCase();
                    if (letterMatch === 'A' && normalizedOptions[0]) normalizedCorrectAnswer = normalizedOptions[0];
                    else if (letterMatch === 'B' && normalizedOptions[1]) normalizedCorrectAnswer = normalizedOptions[1];
                    else if (letterMatch === 'C' && normalizedOptions[2]) normalizedCorrectAnswer = normalizedOptions[2];
                    else if (letterMatch === 'D' && normalizedOptions[3]) normalizedCorrectAnswer = normalizedOptions[3];
                    else {
                        // Check if unescaped version matches
                        const found = normalizedOptions.find(o => o.replace(/\$/g, '').trim() === rawAns.replace(/\$/g, '').trim());
                        normalizedCorrectAnswer = found || normalizedOptions[0];
                    }
                }
            } else if (itemType === 'subjective') {
                normalizedOptions = [];
                normalizedCorrectAnswer = '';
            } else if (itemType === 'numeric') {
                normalizedOptions = [];
                normalizedCorrectAnswer = String(q.correctNumeric !== undefined ? q.correctNumeric : '');
            }

            const cleanTitle = normalizeQuestionParagraphs(q.title || q.question || q.text || q.problem || '');
            const cleanExplanation = q.explanation ? autoWrapLatexDelimiters(normalizeQuestionParagraphs(q.explanation)) : '';

            return {
                id: 'q_ai_' + Date.now() + '_' + idx,
                heading: q.heading || `${safeTopic} - Question ${idx + 1}`,
                title: cleanTitle,
                type: itemType,
                diagram: svgDiagram,
                diagramCaption: q.diagramCaption ? autoWrapLatexDelimiters(q.diagramCaption) : (svgDiagram ? `Figure 1: Schematic diagram for ${safeTopic}` : undefined),
                options: normalizedOptions,
                correctAnswer: normalizedCorrectAnswer,
                correctNumeric: (typeof q.correctNumeric === 'number' || typeof q.correctNumeric === 'string') ? q.correctNumeric : undefined,
                tolerance: q.tolerance !== undefined ? q.tolerance : 0.01,
                languages: normalizedLangs,
                testCases: normalizedTCs,
                code: normalizedCode,
                keywords: q.keywords || [],
                explanation: cleanExplanation,
                marks: itemMarks,
                difficulty: diff
            };
        });

        return res.json({
            success: true,
            questions: formatted,
            source: generatedSource || "ai-model"
        });

    } catch (err) {
        console.error("AI Controller generateQuestions critical error:", err.message);
        return res.status(500).json({
            success: false,
            error: "AI Generation Error: " + err.message
        });
    }
};

/**
 * Normalizes code templates across languages and provides complete fallbacks if needed
 */
function normalizeCodeBoilerplates(rawCode, safeTopic, targetLangs = ['Python', 'Java', 'C++', 'JavaScript', 'C']) {
    const code = rawCode && typeof rawCode === 'object' ? { ...rawCode } : {};

    const getOrGen = (langKey, aliases, genFn) => {
        for (const alias of [langKey, ...aliases]) {
            if (code[alias] && (code[alias].middle || code[alias].prefix || code[alias].suffix)) {
                return {
                    prefix: code[alias].prefix || '',
                    middle: code[alias].middle || '// Write your solution here\n',
                    suffix: code[alias].suffix || '',
                    lockPrefix: true,
                    lockSuffix: true,
                    hidePrefix: false,
                    hideSuffix: false
                };
            }
        }
        return genFn();
    };

    const boilerplates = {
        Python: () => getOrGen('Python', ['python', 'py'], () => ({
            prefix: 'import sys\n\n',
            middle: 'def solve(n, arr):\n    # Write your solution here for ' + safeTopic + '\n    pass\n',
            suffix: '\nif __name__ == "__main__":\n    lines = sys.stdin.read().split()\n    if lines:\n        n = int(lines[0])\n        arr = list(map(int, lines[1:n+1]))\n        print(solve(n, arr))\n',
            lockPrefix: true,
            lockSuffix: true,
            hidePrefix: false,
            hideSuffix: false
        })),
        Java: () => getOrGen('Java', ['java'], () => ({
            prefix: 'import java.util.*;\nimport java.io.*;\n\npublic class Solution {\n',
            middle: '    public static int solve(int n, int[] arr) {\n        // Write your solution here for ' + safeTopic + '\n        return 0;\n    }\n',
            suffix: '    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int[] arr = new int[n];\n            for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n            System.out.println(solve(n, arr));\n        }\n    }\n}\n',
            lockPrefix: true,
            lockSuffix: true,
            hidePrefix: false,
            hideSuffix: false
        })),
        'C++': () => getOrGen('C++', ['cpp', 'c++', 'CPP'], () => ({
            prefix: '#include <iostream>\n#include <vector>\nusing namespace std;\n\n',
            middle: 'int solve(int n, vector<int>& arr) {\n    // Write your solution here for ' + safeTopic + '\n    return 0;\n}\n',
            suffix: '\nint main() {\n    int n;\n    if (cin >> n) {\n        vector<int> arr(n);\n        for (int i = 0; i < n; i++) cin >> arr[i];\n        cout << solve(n, arr) << endl;\n    }\n    return 0;\n}\n',
            lockPrefix: true,
            lockSuffix: true,
            hidePrefix: false,
            hideSuffix: false
        })),
        JavaScript: () => getOrGen('JavaScript', ['javascript', 'js', 'JS'], () => ({
            prefix: "const fs = require('fs');\n\n",
            middle: 'function solve(n, arr) {\n    // Write your solution here for ' + safeTopic + '\n    return 0;\n}\n',
            suffix: "\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nif (input.length > 0 && input[0] !== '') {\n    const n = parseInt(input[0]);\n    const arr = input.slice(1, n + 1).map(Number);\n    console.log(solve(n, arr));\n}\n",
            lockPrefix: true,
            lockSuffix: true,
            hidePrefix: false,
            hideSuffix: false
        })),
        C: () => getOrGen('C', ['c'], () => ({
            prefix: '#include <stdio.h>\n#include <stdlib.h>\n\n',
            middle: 'int solve(int n, int* arr) {\n    // Write your solution here for ' + safeTopic + '\n    return 0;\n}\n',
            suffix: '\nint main() {\n    int n;\n    if (scanf("%d", &n) == 1) {\n        int* arr = (int*)malloc(n * sizeof(int));\n        for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n        printf("%d\\n", solve(n, arr));\n        free(arr);\n    }\n    return 0;\n}\n',
            lockPrefix: true,
            lockSuffix: true,
            hidePrefix: false,
            hideSuffix: false
        }))
    };

    const result = {};
    const langsToPopulate = (Array.isArray(targetLangs) && targetLangs.length > 0) ? targetLangs : ['Python'];
    langsToPopulate.forEach(lang => {
        if (boilerplates[lang]) {
            const bp = boilerplates[lang]();
            result[lang] = bp;
            result[lang.toLowerCase()] = bp;
            if (lang === 'C++') result['cpp'] = bp;
        }
    });
    return result;
}

/**
 * Normalizes test cases array
 */
function normalizeTestCases(rawTestCases, safeTopic, numSample = 2, numHidden = 3) {
    let tcs = Array.isArray(rawTestCases) ? rawTestCases : [];
    if (tcs.length === 0) {
        tcs = [
            { input: '5\n1 2 3 4 5', output: '15', marks: 2, isSample: true, explanation: 'Sample case for ' + safeTopic },
            { input: '4\n10 20 30 40', output: '100', marks: 2, isSample: true, explanation: 'Sample case 2' },
            { input: '1\n42', output: '42', marks: 2, isSample: false },
            { input: '6\n-5 10 -3 20 0 8', output: '30', marks: 2, isSample: false },
            { input: '8\n100 200 300 400 500 600 700 800', output: '3600', marks: 2, isSample: false }
        ];
    } else {
        let sampleCount = 0;
        tcs = tcs.map((tc, idx) => {
            const isSample = tc.isSample === true || (tc.isSample === undefined && idx < numSample);
            if (isSample) sampleCount++;
            return {
                input: String(tc.input !== undefined && tc.input !== null ? tc.input : '').trim(),
                output: String(tc.output !== undefined && tc.output !== null ? tc.output : '').trim(),
                marks: parseInt(tc.marks) || 2,
                isSample: isSample,
                explanation: tc.explanation || (isSample ? `Sample test case ${idx + 1}` : undefined)
            };
        });

        if (sampleCount === 0 && tcs.length > 0) {
            tcs[0].isSample = true;
            tcs[0].explanation = tcs[0].explanation || 'Sample test case 1';
        }
    }
    return tcs;
}

/**
 * Validate question quality and reject generic templated phrases
 */
function validateQuestionQuality(q, topic) {
    if (!q || (!q.title && !q.heading)) return false;
    const text = ((q.heading || '') + ' ' + (q.title || '') + ' ' + ((q.options || []).join(' ')) + ' ' + (q.explanation || '')).toLowerCase();

    // Check for banned generic placeholder phrases
    const bannedPhrases = [
        "primary optimal property",
        "sub-optimal factor",
        "fundamental invariant or optimal behavior",
        "deterministic state transitions and optimal",
        "optimal time complexity and deterministic",
        "key architectural principles",
        "under typical operational constraints"
    ];

    const isCSOrArchTopic = topic.toLowerCase().includes("architecture") || topic.toLowerCase().includes("operating system");
    if (!isCSOrArchTopic) {
        for (const phrase of bannedPhrases) {
            if (text.includes(phrase)) {
                console.warn(`Rejected question matching generic banned phrase: "${phrase}"`);
                return false;
            }
        }
    }

    return true;
}

/**
 * Sanitizes vector SVG diagram string: removes dollar signs ($) and cleans LaTeX symbols inside <text> and <tspan> elements
 */
function sanitizeSvgDiagram(svg) {
    if (!svg || typeof svg !== 'string') return svg;
    let clean = svg.trim();

    const cleanTextContent = (content) => {
        let text = content.replace(/\$/g, '');
        // Replace common LaTeX symbols with clean Unicode characters for SVG text rendering
        text = text.replace(/\\theta/g, 'θ')
                   .replace(/\\alpha/g, 'α')
                   .replace(/\\beta/g, 'β')
                   .replace(/\\gamma/g, 'γ')
                   .replace(/\\delta/g, 'δ')
                   .replace(/\\Delta/g, 'Δ')
                   .replace(/\\lambda/g, 'λ')
                   .replace(/\\mu/g, 'μ')
                   .replace(/\\nu/g, 'ν')
                   .replace(/\\pi/g, 'π')
                   .replace(/\\rho/g, 'ρ')
                   .replace(/\\sigma/g, 'σ')
                   .replace(/\\omega/g, 'ω')
                   .replace(/\\Omega/g, 'Ω')
                   .replace(/\\circ|\\degree|\^\\circ|\^°/g, '°')
                   .replace(/\\rightarrow/g, '→')
                   .replace(/\\leftarrow/g, '←')
                   .replace(/\\leftrightarrow/g, '↔')
                   .replace(/\\approx/g, '≈')
                   .replace(/\\equiv/g, '≡')
                   .replace(/\\pm/g, '±')
                   .replace(/\\times/g, '×')
                   .replace(/\\div/g, '÷')
                   .replace(/\\leq|\\le/g, '≤')
                   .replace(/\\geq|\\ge/g, '≥')
                   .replace(/\\neq/g, '≠')
                   .replace(/\\infty/g, '∞')
                   .replace(/\\cdot/g, '·')
                   .replace(/\\text\{([^{}]+)\}/g, '$1')
                   .replace(/\\mathrm\{([^{}]+)\}/g, '$1')
                   .replace(/\\mathbf\{([^{}]+)\}/g, '$1')
                   .replace(/_\{max\}/g, '_max')
                   .replace(/_\{min\}/g, '_min')
                   .replace(/_\{([^{}]+)\}/g, '_$1')
                   .replace(/\^\{([^{}]+)\}/g, '^$1');
        return text.trim();
    };

    clean = clean.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi, (match, attrs, content) => {
        return `<text${attrs}>${cleanTextContent(content)}</text>`;
    });
    clean = clean.replace(/<tspan\b([^>]*)>([\s\S]*?)<\/tspan>/gi, (match, attrs, content) => {
        return `<tspan${attrs}>${cleanTextContent(content)}</tspan>`;
    });
    return clean;
}

/**
 * Detects if a string contains LaTeX mathematical commands, chemical macros, or scientific expressions
 */
function containsLatex(str) {
    if (!str || typeof str !== 'string') return false;
    return /\\(?:frac|sqrt|hat|vec|bar|dot|ddot|tilde|mathbf|mathrm|mathit|mathbb|mathcal|mathscr|mathfrak|text|textbf|textit|pm|mp|times|div|cdot|circ|bullet|degree|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|pi|varpi|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega|Delta|Gamma|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega|sum|prod|coprod|int|iint|iiint|oint|partial|nabla|approx|equiv|cong|sim|propto|neq|ne|le|ge|leq|geq|ll|gg|in|notin|subset|subseteq|cup|cap|forall|exists|infty|hbar|ell|to|rightarrow|leftarrow|Rightarrow|Leftarrow|leftrightarrow|Leftrightarrow|rightleftharpoons|longleftrightarrow|mapsto|xrightarrow|xleftarrow|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|log|ln|exp|lim|max|min|sup|inf|det|gcd|bmod|pmod|binom|over|matrix|pmatrix|bmatrix|vmatrix|cases|begin|end|left|right|ce|pu|overset|underset|oplus|odot|otimes|ominus|oslash|dagger|ddagger|star|ast|mars|venus|male|female)\b|[_\^]\{|\^[0-9a-zA-Z]|_[0-9a-zA-Z]|\\[()[\]{}]/.test(str);
}

/**
 * Normalizes biological and botanical symbols (e.g. floral formula symmetry and sex)
 */
function normalizeBiologySymbols(str) {
    if (!str || typeof str !== 'string') return str;
    let val = str;
    // Fix common AI hallucinations for floral formula symbols
    // Male symbol (♂): sometimes generated as \sigma^{7}, \sigma^7, \mars, \male
    val = val.replace(/\\sigma\^\{?7\}?/g, '♂');
    val = val.replace(/\\mars\b|\\male\b/g, '♂');
    // Female symbol (♀): sometimes generated as \mathbf{Q}, \venus, \female
    val = val.replace(/\\mathbf\{Q\}/g, '♀');
    val = val.replace(/\\venus\b|\\female\b/g, '♀');
    return val;
}

/**
 * Comprehensive syntax repair engine for AI-generated LaTeX equations
 */
function repairLatexSyntax(latexStr) {
    if (!latexStr || typeof latexStr !== 'string') return latexStr;
    let str = latexStr.trim();

    // 1. Math accent repair: \ddot{\text{O}} -> \ddot{O}, \hat{\text{i}} -> \hat{i}
    str = str.replace(/\\(ddot|dot|hat|vec|bar|tilde)\{\\text\{([^{}]+)\}\}/g, '\\$1{$2}');
    str = str.replace(/\\(ddot|dot|hat|vec|bar|tilde)\{\\mathrm\{([^{}]+)\}\}/g, '\\$1{$2}');

    // 2. Fix unbalanced \left without matching \right
    const leftCount = (str.match(/\\left[\(\[\{\|\.]/g) || []).length;
    const rightCount = (str.match(/\\right[\)\]\}\|\.]/g) || []).length;
    if (leftCount > rightCount) {
        str += '\\right.'.repeat(leftCount - rightCount);
    } else if (rightCount > leftCount) {
        str = '\\left.'.repeat(rightCount - leftCount) + str;
    }

    // 3. Fix double subscripts/superscripts e.g. x_a_b -> x_{a_b} or x^a^b -> x^{a^b}
    str = str.replace(/([a-zA-Z0-9])_([a-zA-Z0-9])_([a-zA-Z0-9])/g, '$1_{$2_$3}');
    str = str.replace(/([a-zA-Z0-9])\^([a-zA-Z0-9])\^([a-zA-Z0-9])/g, '$1^{$2^$3}');

    // 4. Fix missing fraction braces e.g. \frac12 -> \frac{1}{2}
    str = str.replace(/\\frac([0-9a-zA-Z])([0-9a-zA-Z])/g, '\\frac{$1}{$2}');

    // 5. Fix lone pair colons in Lewis structures e.g. :\text{N} -> \text{:\!N} or :\mathrm{N}
    str = str.replace(/^:\s*\\text\{([^{}]+)\}/, '\\text{:\\!$1}');
    str = str.replace(/\\text\{([^{}]+)\}\s*:$/, '\\text{$1\\!:}');

    return str;
}

function sanitizeLatexMathAccents(str) {
    return repairLatexSyntax(str);
}

/**
 * Ensures any bare LaTeX formula, chemical structure, or mathematical expression in a string is enclosed in standard $...$ delimiters
 */
function autoWrapLatexDelimiters(str) {
    if (!str || typeof str !== 'string') return str;
    let val = str.trim();
    if (!val) return val;

    val = normalizeBiologySymbols(val);
    val = repairLatexSyntax(val);

    // Clean dangling unbalanced trailing/leading double dollar signs or single dollar signs
    // e.g. "Actinomorphic-\oplus, Female-\mathbf{Q}$$"
    if ((val.match(/\$/g) || []).length % 2 !== 0) {
        val = val.replace(/(?<!\$)\${1,2}$/, '').trim();
    } else if (val.endsWith('$$') && !val.startsWith('$$')) {
        val = val.slice(0, -2).trim();
    } else if (val.endsWith('$') && !val.startsWith('$')) {
        val = val.slice(0, -1).trim();
    }

    if (val.startsWith('$') && val.endsWith('$') && (val.match(/\$/g) || []).length === 2) {
        return val;
    }
    if (val.startsWith('\\(') || val.startsWith('\\[') || val.startsWith('<span class="ql-formula"')) {
        return val;
    }
    if (!containsLatex(val)) return val;

    // Check for structure/option prefix e.g. 'Structure I (:\text{N}\equiv...:)' or 'Structure I(:\text{N}...)'
    const prefixMatch = val.match(/^((?:Structure\s+[IVX0-9]+|Option\s+[A-D0-9]+|\([A-D0-9]+\)|[A-D]\s*[:.)]|Compound\s+[A-Z0-9]+)\s*[:\-–]?\s*\(?)([\s\S]+?)(\)?)$/i);
    if (prefixMatch) {
        let prefix = prefixMatch[1];
        let inner = prefixMatch[2].trim();
        const suffix = prefixMatch[3];
        // Ensure space before opening parenthesis e.g. "Structure I(" -> "Structure I ("
        prefix = prefix.replace(/([IVX0-9]+)\(/, '$1 (');
        if (containsLatex(inner)) {
            const cleanInner = autoWrapLatexDelimiters(inner);
            return prefix.endsWith('(') && suffix === ')' ? `${prefix.slice(0, -1).trim()} (${cleanInner})` : `${prefix}${cleanInner}${suffix}`;
        }
    }

    // Count regular English words (alphabetic words with >= 2 letters, excluding LaTeX command names)
    const cleanNoLatex = val.replace(/\\(?:[a-zA-Z]+)(?:\{[^{}]*\}|\[[^\[\]]*\])*/g, ' ')
                            .replace(/[_\^]\{[^{}]*\}/g, ' ')
                            .replace(/[_\^][0-9a-zA-Z]/g, ' ');
    const words = cleanNoLatex.match(/\b[a-zA-Z]{2,}\b/g) || [];

    // If there are 2 or more regular English words, this is a natural language sentence containing embedded math/chemical symbols!
    // NEVER wrap the entire sentence in $...$ (which strips spaces and turns English into italic math variables)!
    // Instead wrap ONLY the mathematical/chemical expressions.
    if (words.length >= 2) {
        const tokens = [];
        const protect = (matchText) => {
            const trimmed = matchText.trim();
            if (!trimmed) return matchText;
            tokens.push(trimmed.startsWith('$') ? trimmed : `$${trimmed}$`);
            return `__MATH_TOKEN_${tokens.length - 1}__`;
        };

        // Protect already wrapped formulas
        let res = val.replace(/\$[^$]+\$/g, (m) => protect(m));

        // 1. Inequalities / equations with LaTeX commands e.g. \text{pH} < \text{pI}, \text{pH} = \text{pI}, \text{pH} > \text{pI}
        res = res.replace(/(?<!\$)\\(?:text|math(?:rm|bf))\{[^{}]+\}\s*([<>=≤≥≠~≈]+|\b(?:and|or)\b)\s*\\(?:text|math(?:rm|bf))\{[^{}]+\}(?!\$)/g, (m) => protect(m));

        // 2. Greek linkage formulas e.g. \alpha(1 \rightarrow 4) or \beta(1 \rightarrow 2)
        res = res.replace(/(?<!\$)\\(?:alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|psi|omega|Delta|Omega)\s*\([0-9\s\\rightarrowleftarrow+\-–/]+\)(?!\$)/g, (m) => protect(m));

        // 3. Subscripted/superscripted science/math variables e.g. V_{max}, K_m, K_{eq}, k_1, [\text{S}], \Delta G
        res = res.replace(/(?<!\$)\b([a-zA-Z](?:_\{[^{}]+\}|_[0-9a-zA-Z]|\^\{[^{}]+\}|\^[0-9a-zA-Z])+(?:_\{[^{}]+\}|_[0-9a-zA-Z]|\^\{[^{}]+\}|\^[0-9a-zA-Z])*)/g, (m) => protect(m));

        // 4. Complex fractions, roots, limits, integrals e.g. \frac{\sqrt{a^2+b^2}}{2\left(x+1\right)}, \lim_{...}, \int_{...}
        res = res.replace(/(?<!\$)\\(?:frac|sqrt|hat|vec|dot|ddot|tilde|mathbf|mathrm|mathit|text|ce|pu|overset|underset|lim|int|sum|prod|iint|iiint|oint)\{[^{}]*\}(?:\{[^{}]*\})*(?:[_\^]\{[^{}]*\}|[_\^][0-9a-zA-Z])*(?!\$)/g, (m) => protect(m));

        // 5. Standalone LaTeX symbols / operators e.g. \alpha, \beta, \Delta, \rightarrow, \equiv, \approx, \pm, \oplus, \odot, \otimes
        res = res.replace(/(?<![\\$])\\(?:alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|psi|omega|Delta|Gamma|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega|rightarrow|leftarrow|leftrightarrow|longleftrightarrow|rightleftharpoons|equiv|approx|pm|times|div|cdot|le|ge|leq|geq|neq|infty|hbar|circ|bullet|oplus|odot|otimes|ominus|oslash|dagger|ddagger|star|ast)\b(?!\$)/g, (m) => protect(m));

        // 6. Chemical Lewis / structural formulas: \text{N}\equiv\text{N}-\ddot{\text{O}}
        res = res.replace(/(?<!\$)\\(text\{[^{}]+\}(?:\s*(?:\\equiv|\\approx|[-=~]|\\ddot\{[^{}]+\}|\\text\{[^{}]+\}|[_\^]\{[^{}]+\})\s*)+)(?!\$)/g, (m) => protect(m));

        // Restore all protected tokens
        res = res.replace(/__MATH_TOKEN_(\d+)__/g, (m, idx) => tokens[parseInt(idx)]);

        return res;
    }

    return `$${val}$`;
}

/**
 * Normalizes question problem text into cohesive paragraphs without splitting sentences
 */
function normalizeQuestionParagraphs(title) {
    if (!title || typeof title !== 'string') return '';
    let str = title.trim();

    // Auto-delimit unit vectors if they appear un-delimited (e.g. u = \hat{i} + 2\hat{j} m/s)
    str = str.replace(/(?<!\$)\b([a-zA-Z0-9_]+)\s*=\s*\\hat\{?([ijk])\}?\s*([+-])\s*([0-9a-zA-Z_]+)\s*\\hat\{?([ijk])\}?(?!\$)/g, '$$$1 = \\hat{$2} $3 $4\\hat{$5}$$');

    // Auto-delimit isolated bare fractions e.g. \frac{a}{b}
    str = str.replace(/(?<!\$)\\(frac\{[^{}]+\}\{[^{}]+\})(?!\$)/g, '$$$1$$');

    // Auto-delimit bare square roots e.g. \sqrt{...}
    str = str.replace(/(?<!\$)\\(sqrt\{[^{}]+\})(?!\$)/g, '$$$1$$');

    // Auto-delimit standalone chemical/LaTeX formulas e.g. \text{N}\equiv\text{N}-\ddot{\text{O}}
    str = str.replace(/(?<!\$)\\(text\{[^{}]+\}(?:\s*(?:\\equiv|\\approx|[-=~]|\\ddot\{[^{}]+\}|\\text\{[^{}]+\}|[_\^]\{[^{}]+\})\s*)+)(?!\$)/g, '$$$1$$');

    // If str is plain text without HTML block elements, format into proper paragraphs
    if (!str.includes('<p>') && !str.includes('<div>') && !str.includes('<h') && !str.includes('<ul') && !str.includes('<ol')) {
        const paragraphs = str.split(/\n{2,}/);
        str = paragraphs.map(p => {
            const cleanP = p.replace(/(?<!\n)\n(?!\n)/g, ' ').trim();
            return cleanP ? `<p>${cleanP}</p>` : '';
        }).filter(Boolean).join('');
    } else {
        // Clean empty paragraph tags and excessive breaks
        str = str.replace(/<p>\s*(<br\s*\/?>|&nbsp;|\s*)\s*<\/p>/gi, '');
        str = str.replace(/(<br\s*\/?>\s*){2,}/gi, '<br>');
    }

    return str;
}

function cleanJsonResponse(raw) {
    if (!raw) return "[]";
    let text = raw.trim();
    // Strip reasoning thought traces from models like Qwen or DeepSeek
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    // Find the first '[' or '{' and last ']' or '}'
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        text = text.substring(firstBracket, lastBracket + 1);
    } else {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            text = text.substring(firstBrace, lastBrace + 1);
        }
    }

    // Sanitize unescaped newlines, control characters, and LaTeX backslashes within JSON string literals
    let sanitized = '';
    let inString = false;
    let isEscaped = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (isEscaped) {
            sanitized += char;
            isEscaped = false;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            sanitized += char;
            continue;
        }
        if (inString) {
            if (char === '\\') {
                const next = text[i + 1];
                const next4 = text.substring(i + 1, i + 5);
                // Valid JSON string escape sequences:
                // \" -> quote
                // \\ -> backslash
                // \/ -> forward slash
                // \uXXXX -> 4 hexadecimal digits
                // \n, \r, \t, \b, \f ONLY if not immediately followed by letters (which would be LaTeX like \frac, \text, \times, \theta, \beta, \nu, \rho)
                if (next === '"' || next === '\\' || next === '/') {
                    sanitized += char;
                    isEscaped = true;
                } else if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(next4)) {
                    sanitized += char;
                    isEscaped = true;
                } else if ((next === 'n' || next === 'r' || next === 't' || next === 'b' || next === 'f') && !/^[a-zA-Z]/.test(text[i + 2] || '')) {
                    // Safe JSON whitespace control character escape
                    sanitized += char;
                    isEscaped = true;
                } else {
                    // It is a LaTeX command backslash (e.g. \frac, \text, \times, \theta, \beta, \nu, \rho, \hat, \sqrt, \alpha, \pm, etc.)
                    sanitized += '\\\\';
                }
            } else if (char === '\n') {
                sanitized += '\\n';
            } else if (char === '\r') {
                sanitized += '\\r';
            } else if (char === '\t') {
                sanitized += '\\t';
            } else if (char.charCodeAt(0) < 32) {
                sanitized += ' ';
            } else {
                sanitized += char;
            }
        } else {
            sanitized += char;
        }
    }

    return sanitized;
}

/**
 * Universal safe parser that handles array and object wrapper payloads from any LLM
 */
function safeParseQuestions(raw, safeTopic) {
    if (!raw) return null;
    let text = raw.trim().replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    // 1. Try direct JSON parse
    try {
        const direct = JSON.parse(text);
        if (Array.isArray(direct) && direct.length > 0) {
            const valid = direct.filter(q => validateQuestionQuality(q, safeTopic));
            if (valid.length > 0) return valid;
        } else if (direct && Array.isArray(direct.questions) && direct.questions.length > 0) {
            const valid = direct.questions.filter(q => validateQuestionQuality(q, safeTopic));
            if (valid.length > 0) return valid;
        }
    } catch (e) { }

    // 2. Try sanitized cleanJsonResponse
    try {
        const cleaned = cleanJsonResponse(text);
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed.filter(q => validateQuestionQuality(q, safeTopic));
            if (valid.length > 0) return valid;
        } else if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            const valid = parsed.questions.filter(q => validateQuestionQuality(q, safeTopic));
            if (valid.length > 0) return valid;
        }
    } catch (e) { }

    return null;
}

/**
 * Call Gemini API directly via fetch with timeout
 */
async function callGemini(apiKey, systemPrompt, userContent, thinkingBudget = 0) {
    const candidateModels = [
        process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-3.7-flash",
        "gemini-3.5-flash",
        "gemini-3-flash-preview",
        "gemini-flash-latest"
    ];

    let lastError = null;

    for (const model of candidateModels) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const genConfig = {
                temperature: 0.7,
                responseMimeType: "application/json"
            };

            if (thinkingBudget > 0) {
                genConfig.thinkingConfig = { thinkingBudget: thinkingBudget };
            }

            const body = {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: `${systemPrompt}\n\n${userContent}` }]
                    }
                ],
                generationConfig: genConfig
            };

            const resp = await fetchWithTimeout(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            }, 25000);

            if (resp.ok) {
                const data = await resp.json();
                return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            } else {
                const errText = await resp.text();
                lastError = new Error(`Gemini ${model} Error (${resp.status}): ${errText}`);
                console.warn(`Model ${model} returned status ${resp.status}, attempting next candidate...`);
            }
        } catch (e) {
            lastError = e;
            console.warn(`Model ${model} fetch threw/timed out: ${e.message}, attempting next candidate...`);
        }
    }

    throw lastError || new Error("All Gemini candidate models failed to generate content.");
}

async function callGeminiChat(apiKey, prompt) {
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
    };

    try {
        const resp = await fetchWithTimeout(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }, 15000);

        if (!resp.ok) return null;
        const data = await resp.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (e) {
        console.warn(`Gemini chat timed out/failed: ${e.message}`);
        return null;
    }
}

/**
 * Call Groq Cloud API directly (Ultra-fast LLM inference) with timeout
 */
async function callGroq(apiKey, systemPrompt, userContent) {
    const candidateModels = [
        "qwen/qwen3.6-27b",
        process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "groq/compound",
        "groq/compound-mini"
    ];

    let lastError = null;

    for (const model of candidateModels) {
        try {
            const resp = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userContent }
                    ],
                    temperature: 0.4
                })
            }, 20000);

            if (resp.ok) {
                const data = await resp.json();
                return data?.choices?.[0]?.message?.content || "";
            } else {
                const errText = await resp.text();
                lastError = new Error(`Groq ${model} Error (${resp.status}): ${errText}`);
                console.warn(`Groq Model ${model} returned status ${resp.status}, attempting next candidate...`);
            }
        } catch (e) {
            lastError = e;
            console.warn(`Groq Model ${model} fetch threw/timed out: ${e.message}, attempting next candidate...`);
        }
    }

    throw lastError || new Error("All Groq candidate models failed to generate content.");
}

async function callGroqChat(apiKey, prompt) {
    try {
        const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
        const resp = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        }, 15000);
        if (!resp.ok) return null;
        const data = await resp.json();
        return data?.choices?.[0]?.message?.content || null;
    } catch (e) {
        console.warn(`Groq chat timed out/failed: ${e.message}`);
        return null;
    }
}

/**
 * Call OpenRouter API directly with timeout
 */
async function callOpenRouter(apiKey, systemPrompt, userContent) {
    const candidateModels = [
        "google/gemini-2.0-flash-001",
        process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct",
        "deepseek/deepseek-chat",
        "anthropic/claude-3.5-haiku",
        "openai/gpt-4o-mini"
    ];

    let lastError = null;

    for (const model of candidateModels) {
        try {
            const resp = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://testpad.portal",
                    "X-Title": "TestPad Assessment Engine"
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userContent }
                    ],
                    temperature: 0.4
                })
            }, 25000);

            if (resp.ok) {
                const data = await resp.json();
                return data?.choices?.[0]?.message?.content || "";
            } else {
                const errText = await resp.text();
                lastError = new Error(`OpenRouter ${model} Error (${resp.status}): ${errText}`);
                console.warn(`OpenRouter Model ${model} returned status ${resp.status}, attempting next candidate...`);
            }
        } catch (e) {
            lastError = e;
            console.warn(`OpenRouter Model ${model} fetch threw/timed out: ${e.message}, attempting next candidate...`);
        }
    }

    throw lastError || new Error("All OpenRouter candidate models failed to generate content.");
}

async function callOpenRouterChat(apiKey, prompt) {
    try {
        const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct";
        const resp = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://testpad.portal",
                "X-Title": "TestPad Assessment Engine"
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        }, 15000);
        if (!resp.ok) return null;
        const data = await resp.json();
        return data?.choices?.[0]?.message?.content || null;
    } catch (e) {
        console.warn(`OpenRouter chat timed out/failed: ${e.message}`);
        return null;
    }
}

/**
 * Call Cerebras API directly with timeout
 */
async function callCerebras(apiKey, systemPrompt, userContent) {
    const candidateModels = [
        process.env.CEREBRAS_MODEL || "gpt-oss-120b",
        "gemma-4-31b"
    ];

    let lastError = null;

    for (const model of candidateModels) {
        try {
            const resp = await fetchWithTimeout("https://api.cerebras.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userContent }
                    ],
                    temperature: 0.4
                })
            }, 20000);

            if (resp.ok) {
                const data = await resp.json();
                return data?.choices?.[0]?.message?.content || "";
            } else {
                const errText = await resp.text();
                lastError = new Error(`Cerebras ${model} Error (${resp.status}): ${errText}`);
                console.warn(`Cerebras Model ${model} returned status ${resp.status}, attempting next candidate...`);
            }
        } catch (e) {
            lastError = e;
            console.warn(`Cerebras Model ${model} fetch threw/timed out: ${e.message}, attempting next candidate...`);
        }
    }

    throw lastError || new Error("All Cerebras candidate models failed to generate content.");
}

async function callCerebrasChat(apiKey, prompt) {
    try {
        const model = process.env.CEREBRAS_MODEL || "gpt-oss-120b";
        const resp = await fetchWithTimeout("https://api.cerebras.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        }, 15000);
        if (!resp.ok) return null;
        const data = await resp.json();
        return data?.choices?.[0]?.message?.content || null;
    } catch (e) {
        console.warn(`Cerebras chat timed out/failed: ${e.message}`);
        return null;
    }
}

/**
 * Controller to test user API key (Groq, Cerebras, OpenRouter, ElevenLabs, Gemini, or OpenAI)
 */
exports.testAPIKey = async (req, res) => {
    try {
        const { apiKey } = req.body || {};
        const key = (apiKey || '').trim();

        if (!key) {
            return res.status(400).json({ success: false, error: "API Key cannot be empty." });
        }

        // Test Local Ollama Connection
        if (key.toLowerCase() === 'ollama' || key.toLowerCase() === 'local' || key.includes('localhost') || key.includes('11434')) {
            try {
                const host = process.env.OLLAMA_HOST || "http://localhost:11434";
                const resp = await fetchWithTimeout(`${host}/api/tags`, {}, 5000);
                if (resp.ok) {
                    const data = await resp.json();
                    const modelNames = (data.models || []).map(m => m.name).join(', ');
                    return res.json({
                        success: true,
                        provider: "ollama",
                        message: `✓ Local Ollama AI Connected! Models available: ${modelNames || 'None found'}`
                    });
                } else {
                    return res.status(400).json({ success: false, error: "Ollama returned status " + resp.status });
                }
            } catch (ollErr) {
                return res.status(400).json({ success: false, error: "Local Ollama is not running on localhost:11434: " + ollErr.message });
            }
        }

        // Test Groq Key
        if (key.startsWith('gsk_')) {
            try {
                const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
                const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${key}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [{ role: "user", content: "ping" }],
                        max_tokens: 5
                    })
                });

                if (!resp.ok) {
                    const err = await resp.text();
                    return res.status(400).json({ success: false, error: "Groq Verification Failed: " + err });
                }

                return res.json({ success: true, provider: "groq", message: "✓ Groq AI API Key verified successfully!" });
            } catch (grErr) {
                return res.status(400).json({ success: false, error: "Groq Error: " + grErr.message });
            }
        }

        // Test Cerebras Key
        if (key.startsWith('csk-')) {
            try {
                const model = process.env.CEREBRAS_MODEL || "gpt-oss-120b";
                const resp = await fetch("https://api.cerebras.ai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${key}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [{ role: "user", content: "ping" }],
                        max_tokens: 5
                    })
                });

                if (!resp.ok) {
                    const err = await resp.text();
                    return res.status(400).json({ success: false, error: "Cerebras Verification Failed: " + err });
                }

                return res.json({ success: true, provider: "cerebras", message: "✓ Cerebras AI API Key verified successfully!" });
            } catch (cerErr) {
                return res.status(400).json({ success: false, error: "Cerebras Error: " + cerErr.message });
            }
        }

        // Test OpenRouter Key
        if (key.startsWith('sk-or-')) {
            try {
                const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct";
                const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${key}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://testpad.portal",
                        "X-Title": "TestPad Assessment Engine"
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [{ role: "user", content: "ping" }],
                        max_tokens: 5
                    })
                });

                if (!resp.ok) {
                    const err = await resp.text();
                    return res.status(400).json({ success: false, error: "OpenRouter Verification Failed: " + err });
                }

                return res.json({ success: true, provider: "openrouter", message: "✓ OpenRouter AI API Key verified successfully!" });
            } catch (orErr) {
                return res.status(400).json({ success: false, error: "OpenRouter Error: " + orErr.message });
            }
        }

        // Test OpenAI Key
        if (key.startsWith('sk-') && !key.startsWith('sk_') && !key.startsWith('sk-or-')) {
            const client = new OpenAI({ apiKey: key });
            const response = await client.chat.completions.create({
                model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                messages: [{ role: "user", content: "ping" }],
                max_tokens: 5
            });
            return res.json({ success: true, provider: "openai", message: "✓ OpenAI API Key verified successfully!" });
        }

        // Test ElevenLabs Key (starts with sk_)
        if (key.startsWith('sk_')) {
            try {
                const voice = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
                const model = process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2_5";
                const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
                    method: "POST",
                    headers: {
                        "xi-api-key": key,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ text: "ping", model_id: model })
                });

                if (!resp.ok) {
                    const err = await resp.text();
                    return res.status(400).json({ success: false, error: "ElevenLabs Verification Failed: " + err });
                }

                return res.json({ success: true, provider: "elevenlabs", message: "✓ ElevenLabs Voice AI Key verified successfully!" });
            } catch (elErr) {
                return res.status(400).json({ success: false, error: "ElevenLabs Error: " + elErr.message });
            }
        }

        // Test Google Gemini Key (starts with AIza or AQ. or anything else)
        try {
            const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
            const resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: "ping" }] }],
                    generationConfig: { maxOutputTokens: 5 }
                })
            });

            if (!resp.ok) {
                const err = await resp.text();
                return res.status(400).json({ success: false, error: "Gemini Verification Failed: " + err });
            }

            return res.json({ success: true, provider: "gemini", message: "✓ Google Gemini API Key verified successfully!" });
        } catch (gErr) {
            return res.status(400).json({ success: false, error: "Gemini Error: " + gErr.message });
        }

    } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
};

/**
 * Text-to-Speech via ElevenLabs
 * POST /api/text-to-speech
 */
exports.textToSpeech = async (req, res) => {
    try {
        const { text, voiceId, modelId } = req.body || {};
        const apiKey = req.headers?.['xi-api-key'] || process.env.ELEVENLABS_API_KEY;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ success: false, error: "Text is required for Text-to-Speech." });
        }

        if (!apiKey) {
            return res.status(400).json({ success: false, error: "ElevenLabs API Key is not configured." });
        }

        const voice = voiceId || process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
        const model = modelId || process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2_5";

        const cleanText = text.replace(/<[^>]*>?/gm, '').trim();

        const resp = await fetchWithTimeout(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
            method: "POST",
            headers: {
                "xi-api-key": apiKey.trim(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: cleanText,
                model_id: model,
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        }, 8500);

        if (!resp.ok) {
            const errText = await resp.text();
            return res.status(resp.status).json({ success: false, error: `ElevenLabs TTS Error: ${errText}` });
        }

        const audioBuffer = await resp.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        const dataUri = `data:audio/mp3;base64,${base64Audio}`;

        return res.json({
            success: true,
            audioUrl: dataUri,
            voiceId: voice,
            modelId: model
        });

    } catch (err) {
        console.error("ElevenLabs TTS Error:", err.message);
        return res.status(500).json({ success: false, error: "ElevenLabs TTS Error: " + err.message });
    }
};