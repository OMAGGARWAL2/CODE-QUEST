import json

base_html = """
<h4 style="margin-bottom:10px; font-size:1.05rem;">{t_genInst}</h4>
<ol style="margin-top:0;">
    <li style="margin-bottom:10px;">{t_1}</li>
    <li style="margin-bottom:10px;">{t_2}
        <ul style="list-style:none; padding-left:10px; margin-top:10px;">
            <li style="margin-bottom:8px; display:flex; align-items:center; gap:10px;"><div style="width:24px; height:24px; border:1px solid #ccc; background:#fff;"></div> {t_3}</li>
            <li style="margin-bottom:8px; display:flex; align-items:center; gap:10px;"><div style="width:24px; height:24px; background:#c0392b; border-radius: 0 0 50% 50%;"></div> {t_4}</li>
            <li style="margin-bottom:8px; display:flex; align-items:center; gap:10px;"><div style="width:24px; height:24px; background:#27ae60; border-radius: 50% 50% 0 0;"></div> {t_5}</li>
            <li style="margin-bottom:8px; display:flex; align-items:center; gap:10px;"><div style="width:24px; height:24px; background:#9b59b6; border-radius: 50%;"></div> {t_6}</li>
            <li style="margin-bottom:8px; display:flex; align-items:center; gap:10px;"><div style="width:24px; height:24px; background:#9b59b6; border-radius: 50%; position:relative;"><div style="position:absolute; bottom:-2px; right:-2px; width:12px; height:12px; background:#27ae60; border-radius:50%; font-size:8px; color:white; display:flex; align-items:center; justify-content:center;">✔</div></div> {t_7}</li>
        </ul>
        <p style="margin-top:10px; margin-bottom:0;">{t_8}</p>
    </li>
</ol>
<h4 style="margin-bottom:10px; margin-top:20px; font-size:1.05rem;">{t_navQ}</h4>
<ol start="3" style="margin-top:0;">
    <li style="margin-bottom:10px;">{t_9}
        <ol style="margin-top:10px;">
            <li style="margin-bottom:5px;">{t_10}</li>
            <li style="margin-bottom:5px;">{t_11}</li>
            <li style="margin-bottom:5px;">{t_12}</li>
        </ol>
    </li>
</ol>
<p style="margin-top:10px;">{t_13}</p>
<p style="margin-bottom:20px;">{t_14}</p>
<h4 style="margin-bottom:10px; font-size:1.05rem;">{t_ansQ}</h4>
<ol start="4" style="margin-top:0;">
    <li style="margin-bottom:10px;">{t_15}
        <ol style="margin-top:10px;">
            <li style="margin-bottom:5px;">{t_16}</li>
            <li style="margin-bottom:5px;">{t_17}</li>
            <li style="margin-bottom:5px;">{t_18}</li>
            <li style="margin-bottom:5px;">{t_19}</li>
        </ol>
    </li>
    <li style="margin-bottom:10px;">{t_20}
        <ol style="margin-top:10px;">
            <li style="margin-bottom:5px;">{t_21}</li>
            <li style="margin-bottom:5px;">{t_22}</li>
            <li style="margin-bottom:5px;">{t_23}</li>
            <li style="margin-bottom:5px;">{t_24}</li>
        </ol>
    </li>
    <li style="margin-bottom:10px;">{t_25}</li>
    <li style="margin-bottom:10px;">{t_26}</li>
    <li style="margin-bottom:10px;">{t_27}</li>
    <li style="margin-bottom:10px;">{t_28}</li>
    <li style="margin-bottom:10px;">{t_29}</li>
    <li style="margin-bottom:10px;">{t_30}</li>
</ol>
"""

langs = {
    "English": {
        "t_genInst": "General Instructions:",
        "t_navQ": "Navigating to a Question :",
        "t_ansQ": "Answering a Question :",
        "t_1": "The clock will be set at the server. The countdown timer at the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You need not terminate the examination or submit your paper.",
        "t_2": "The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:",
        "t_3": "You have not visited the question yet.",
        "t_4": "You have not answered the question.",
        "t_5": "You have answered the question.",
        "t_6": "You have NOT answered the question, but have marked the question for review.",
        "t_7": "You have answered the question, but marked it for review.",
        "t_8": "The <strong>Mark For Review</strong> status for a question simply indicates that you would like to look at that question again. If a question is answered, but marked for review, then the answer will be considered for evaluation unless the status is modified by the candidate.",
        "t_9": "To answer a question, do the following:",
        "t_10": "Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.",
        "t_11": "Click on <strong>Save & Next</strong> to save your answer for the current question and then go to the next question.",
        "t_12": "Click on <strong>Mark for Review & Next</strong> to save your answer for the current question and also mark it for review , and then go to the next question.",
        "t_13": "Note that your answer for the current question will not be saved, if you navigate to another question directly by clicking on a question number without saving the answer to the previous question.",
        "t_14": "You can view all the questions by clicking on the <strong>Question Paper</strong> button. <span style=\"color:red;\">This feature is provided, so that if you want you can just see the entire question paper at a glance.</span>",
        "t_15": "Procedure for answering a multiple choice (MCQ) type question:",
        "t_16": "Choose one answer from the 4 options (A,B,C,D) given below the question, click on the bubble placed before the chosen option.",
        "t_17": "To deselect your chosen answer, click on the bubble of the chosen option again or click on the <strong>Clear Response</strong> button",
        "t_18": "To change your chosen answer, click on the bubble of another option.",
        "t_19": "To save your answer, you MUST click on the <strong>Save & Next</strong>",
        "t_20": "Procedure for answering a numerical answer type question :",
        "t_21": "To enter a number as your answer, use the virtual numerical keypad.",
        "t_22": "A fraction (e.g. -0.3 or -.3) can be entered as an answer with or without \"0\" before the decimal point. <span style=\"color:red;\">As many as four decimal points, e.g. 12.5435 or 0.003 or -932.6711 or 12.82 can be entered.</span>",
        "t_23": "To clear your answer, click on the <strong>Clear Response</strong> button",
        "t_24": "To save your answer, you MUST click on the <strong>Save & Next</strong>",
        "t_25": "To mark a question for review, click on the <strong>Mark for Review & Next</strong> button. If an answer is selected (for MCQ/MCAQ) entered (for numerical answer type) for a question that is <strong>Marked for Review</strong> , that answer will be considered in the evaluation unless the status is modified by the candidate.",
        "t_26": "To change your answer to a question that has already been answered, first select that question for answering and then follow the procedure for answering that type of question.",
        "t_27": "Note that ONLY Questions for which answers are <strong>saved</strong> or <strong>marked for review after answering</strong> will be considered for evaluation.",
        "t_28": "Sections in this question paper are displayed on the top bar of the screen. Questions in a Section can be viewed by clicking on the name of that Section. The Section you are currently viewing will be highlighted.",
        "t_29": "After clicking the <strong>Save & Next</strong> button for the last question in a Section, you will automatically be taken to the first question of the next Section in sequence.",
        "t_30": "You can move the mouse cursor over the name of a Section to view the answering status for that Section."
    },
    "Hindi": {
        "t_genInst": "सामान्य निर्देश:",
        "t_navQ": "प्रश्न पर जाना :",
        "t_ansQ": "प्रश्न का उत्तर देना :",
        "t_1": "सर्वर पर घड़ी सेट की जाएगी। स्क्रीन के शीर्ष दाएँ कोने पर उलटी गिनती टाइमर परीक्षा पूरी करने के लिए आपके पास शेष समय प्रदर्शित करेगा। जब टाइमर शून्य पर पहुंच जाएगा, तो परीक्षा अपने आप समाप्त हो जाएगी। आपको परीक्षा समाप्त करने या अपना पेपर जमा करने की आवश्यकता नहीं है।",
        "t_2": "स्क्रीन के दाईं ओर प्रदर्शित प्रश्न पैलेट निम्नलिखित प्रतीकों में से एक का उपयोग करके प्रत्येक प्रश्न की स्थिति दिखाएगा:",
        "t_3": "आपने अभी तक प्रश्न नहीं देखा है।",
        "t_4": "आपने प्रश्न का उत्तर नहीं दिया है।",
        "t_5": "आपने प्रश्न का उत्तर दे दिया है।",
        "t_6": "आपने प्रश्न का उत्तर नहीं दिया है, लेकिन समीक्षा के लिए प्रश्न को चिह्नित किया है।",
        "t_7": "आपने प्रश्न का उत्तर दे दिया है, लेकिन इसे समीक्षा के लिए चिह्नित किया है।",
        "t_8": "किसी प्रश्न के लिए <strong>समीक्षा के लिए चिह्नित</strong> स्थिति का सीधा सा अर्थ है कि आप उस प्रश्न को दोबारा देखना चाहेंगे। यदि किसी प्रश्न का उत्तर दिया गया है, लेकिन समीक्षा के लिए चिह्नित किया गया है, तो उत्तर को मूल्यांकन के लिए माना जाएगा जब तक कि उम्मीदवार द्वारा स्थिति को संशोधित नहीं किया जाता है।",
        "t_9": "किसी प्रश्न का उत्तर देने के लिए, निम्नलिखित कार्य करें:",
        "t_10": "सीधे उस क्रमांकित प्रश्न पर जाने के लिए अपनी स्क्रीन के दाईं ओर प्रश्न पैलेट में प्रश्न संख्या पर क्लिक करें। ध्यान दें कि इस विकल्प का उपयोग करने से वर्तमान प्रश्न का आपका उत्तर सहेजा नहीं जाता है।",
        "t_11": "वर्तमान प्रश्न के लिए अपना उत्तर सहेजने के लिए <strong>सहेजें और अगला</strong> पर क्लिक करें और फिर अगले प्रश्न पर जाएं।",
        "t_12": "वर्तमान प्रश्न के लिए अपना उत्तर सहेजने के लिए <strong>समीक्षा और अगला चिह्नित करें</strong> पर क्लिक करें और इसे समीक्षा के लिए भी चिह्नित करें, और फिर अगले प्रश्न पर जाएं।",
        "t_13": "ध्यान दें कि यदि आप पिछले प्रश्न का उत्तर सहेजे बिना सीधे किसी प्रश्न संख्या पर क्लिक करके किसी अन्य प्रश्न पर जाते हैं तो वर्तमान प्रश्न का आपका उत्तर सहेजा नहीं जाएगा।",
        "t_14": "आप <strong>प्रश्न पत्र</strong> बटन पर क्लिक करके सभी प्रश्न देख सकते हैं। <span style=\"color:red;\">यह सुविधा इसलिए दी गई है, ताकि यदि आप चाहें तो पूरा प्रश्न पत्र एक नजर में देख सकें।</span>",
        "t_15": "बहुविकल्पीय (MCQ) प्रकार के प्रश्न का उत्तर देने की प्रक्रिया:",
        "t_16": "प्रश्न के नीचे दिए गए 4 विकल्पों (ए, बी, सी, डी) में से एक उत्तर चुनें, चुने गए विकल्प से पहले रखे गए बुलबुले पर क्लिक करें।",
        "t_17": "अपना चुना हुआ उत्तर अचयनित करने के लिए, चुने गए विकल्प के बुलबुले पर दोबारा क्लिक करें या <strong>स्पष्ट प्रतिक्रिया</strong> बटन पर क्लिक करें",
        "t_18": "अपना चुना हुआ उत्तर बदलने के लिए, दूसरे विकल्प के बुलबुले पर क्लिक करें।",
        "t_19": "अपना उत्तर सहेजने के लिए, आपको <strong>सहेजें और अगला</strong> पर क्लिक करना होगा",
        "t_20": "संख्यात्मक उत्तर प्रकार के प्रश्न का उत्तर देने की प्रक्रिया:",
        "t_21": "अपना उत्तर एक संख्या के रूप में दर्ज करने के लिए, वर्चुअल न्यूमेरिकल कीपैड का उपयोग करें।",
        "t_22": "एक अंश (उदा. -0.3 या -.3) को दशमलव बिंदु से पहले '0' के साथ या उसके बिना उत्तर के रूप में दर्ज किया जा सकता है। <span style=\"color:red;\">चार दशमलव बिंदु तक, उदा. 12.5435 या 0.003 या -932.6711 या 12.82 दर्ज किया जा सकता है।</span>",
        "t_23": "अपना उत्तर साफ़ करने के लिए, <strong>स्पष्ट प्रतिक्रिया</strong> बटन पर क्लिक करें",
        "t_24": "अपना उत्तर सहेजने के लिए, आपको <strong>सहेजें और अगला</strong> पर क्लिक करना होगा",
        "t_25": "समीक्षा के लिए किसी प्रश्न को चिह्नित करने के लिए, <strong>समीक्षा और अगला के लिए चिह्नित करें</strong> बटन पर क्लिक करें। यदि <strong>समीक्षा के लिए चिह्नित</strong> प्रश्न के लिए कोई उत्तर (MCQ/MCAQ के लिए) (संख्यात्मक उत्तर प्रकार के लिए दर्ज किया गया) चुना जाता है, तो उस उत्तर पर मूल्यांकन में तब तक विचार किया जाएगा जब तक कि उम्मीदवार द्वारा स्थिति को संशोधित नहीं किया जाता है।",
        "t_26": "किसी ऐसे प्रश्न का उत्तर बदलने के लिए जिसका उत्तर पहले ही दिया जा चुका है, पहले उस प्रश्न को उत्तर देने के लिए चुनें और फिर उस प्रकार के प्रश्न का उत्तर देने की प्रक्रिया का पालन करें।",
        "t_27": "ध्यान दें कि मूल्यांकन के लिए केवल उन प्रश्नों पर विचार किया जाएगा जिनके उत्तर <strong>सहेजे गए</strong> हैं या <strong>उत्तर देने के बाद समीक्षा के लिए चिह्नित</strong> हैं।",
        "t_28": "इस प्रश्न पत्र के अनुभाग स्क्रीन के शीर्ष बार पर प्रदर्शित होते हैं। किसी अनुभाग के प्रश्नों को उस अनुभाग के नाम पर क्लिक करके देखा जा सकता है। आप वर्तमान में जिस अनुभाग को देख रहे हैं उसे हाइलाइट किया जाएगा।",
        "t_29": "किसी अनुभाग में अंतिम प्रश्न के लिए <strong>सहेजें और अगला</strong> बटन पर क्लिक करने के बाद, आपको अनुक्रम में अगले अनुभाग के पहले प्रश्न पर स्वचालित रूप से ले जाया जाएगा।",
        "t_30": "आप उस अनुभाग की उत्तर देने की स्थिति देखने के लिए माउस कर्सर को किसी अनुभाग के नाम पर ले जा सकते हैं।"
    },
    "Punjabi": {
        "t_genInst": "ਆਮ ਹਦਾਇਤਾਂ:", "t_navQ": "ਪ੍ਰਸ਼ਨ 'ਤੇ ਜਾਣਾ :", "t_ansQ": "ਪ੍ਰਸ਼ਨ ਦਾ ਉੱਤਰ ਦੇਣਾ :",
        "t_1": "ਸਰਵਰ ਉੱਤੇ ਘੜੀ ਸੈੱਟ ਕੀਤੀ ਜਾਵੇਗੀ। ਸਕਰੀਨ ਦੇ ਉੱਪਰ ਸੱਜੇ ਕੋਨੇ 'ਤੇ ਕਾਊਂਟਡਾਊਨ ਟਾਈਮਰ ਬਚਿਆ ਹੋਇਆ ਸਮਾਂ ਦਿਖਾਏਗਾ। ਸਮਾਂ ਜ਼ੀਰੋ ਹੋਣ 'ਤੇ ਪ੍ਰੀਖਿਆ ਆਪਣੇ ਆਪ ਖਤਮ ਹੋ ਜਾਵੇਗੀ।",
        "t_2": "ਸਕਰੀਨ ਦੇ ਸੱਜੇ ਪਾਸੇ ਪ੍ਰਦਰਸ਼ਿਤ ਪ੍ਰਸ਼ਨ ਪੈਲੇਟ ਇਹਨਾਂ ਚਿੰਨ੍ਹਾਂ ਰਾਹੀਂ ਸਥਿਤੀ ਦਿਖਾਏਗਾ:",
        "t_3": "ਤੁਸੀਂ ਅਜੇ ਤੱਕ ਪ੍ਰਸ਼ਨ ਨਹੀਂ ਦੇਖਿਆ।", "t_4": "ਤੁਸੀਂ ਪ੍ਰਸ਼ਨ ਦਾ ਉੱਤਰ ਨਹੀਂ ਦਿੱਤਾ।", "t_5": "ਤੁਸੀਂ ਪ੍ਰਸ਼ਨ ਦਾ ਉੱਤਰ ਦਿੱਤਾ ਹੈ।",
        "t_6": "ਤੁਸੀਂ ਪ੍ਰਸ਼ਨ ਦਾ ਉੱਤਰ ਨਹੀਂ ਦਿੱਤਾ, ਪਰ ਸਮੀਖਿਆ ਲਈ ਨਿਸ਼ਾਨਬੱਧ ਕੀਤਾ ਹੈ।", "t_7": "ਤੁਸੀਂ ਪ੍ਰਸ਼ਨ ਦਾ ਉੱਤਰ ਦਿੱਤਾ ਹੈ, ਪਰ ਸਮੀਖਿਆ ਲਈ ਨਿਸ਼ਾਨਬੱਧ ਕੀਤਾ ਹੈ।",
        "t_8": "<strong>ਸਮੀਖਿਆ ਲਈ ਮਾਰਕ</strong> ਦਾ ਅਰਥ ਹੈ ਕਿ ਤੁਸੀਂ ਪ੍ਰਸ਼ਨ ਦੁਬਾਰਾ ਦੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ। ਉੱਤਰ ਦਿੱਤੇ ਜਾਣ 'ਤੇ ਵੀ ਇਸਦਾ ਮੁਲਾਂਕਣ ਕੀਤਾ ਜਾਵੇਗਾ।", "t_9": "ਪ੍ਰਸ਼ਨ ਦਾ ਉੱਤਰ ਦੇਣ ਲਈ, ਹੇਠ ਲਿਖੇ ਅਨੁਸਾਰ ਕਰੋ:",
        "t_10": "ਸਿੱਧੇ ਉਸ ਪ੍ਰਸ਼ਨ ਤੇ ਜਾਣ ਲਈ ਨੰਬਰ 'ਤੇ ਕਲਿੱਕ ਕਰੋ। ਇਸ ਨਾਲ ਤੁਹਾਡਾ ਉੱਤਰ ਸੇਵ ਨਹੀਂ ਹੋਵੇਗਾ।", "t_11": "ਉੱਤਰ ਸੇਵ ਕਰਨ ਲਈ <strong>ਸੇਵ ਅਤੇ ਅੱਗੇ</strong> 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
        "t_12": "<strong>ਸਮੀਖਿਆ ਲਈ ਮਾਰਕ ਅਤੇ ਅੱਗੇ</strong> 'ਤੇ ਕਲਿੱਕ ਕਰੋ ਜੇਕਰ ਤੁਸੀਂ ਸਮੀਖਿਆ ਕਰਨੀ ਹੈ।", "t_13": "ਜੇਕਰ ਤੁਸੀਂ ਸਿੱਧਾ ਅਗਲੇ ਪ੍ਰਸ਼ਨ 'ਤੇ ਜਾਂਦੇ ਹੋ ਤਾਂ ਉੱਤਰ ਸੇਵ ਨਹੀਂ ਹੋਵੇਗਾ।", "t_14": "ਤੁਸੀਂ <strong>ਪ੍ਰਸ਼ਨ ਪੱਤਰ</strong> ਬਟਨ 'ਤੇ ਕਲਿੱਕ ਕਰਕੇ ਪੂਰਾ ਪੇਪਰ ਦੇਖ ਸਕਦੇ ਹੋ।",
        "t_15": "ਬਹੁ-ਵਿਕਲਪੀ (MCQ) ਪ੍ਰਸ਼ਨ ਦਾ ਉੱਤਰ ਦੇਣ ਦੀ ਪ੍ਰਕਿਰਿਆ:", "t_16": "4 ਵਿਕਲਪਾਂ ਵਿੱਚੋਂ ਇੱਕ ਉੱਤਰ ਚੁਣੋ।",
        "t_17": "ਉੱਤਰ ਹਟਾਉਣ ਲਈ <strong>Clear Response</strong> ਬਟਨ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।", "t_18": "ਉੱਤਰ ਬਦਲਣ ਲਈ ਦੂਜੇ ਵਿਕਲਪ 'ਤੇ ਕਲਿੱਕ ਕਰੋ।", "t_19": "ਸੇਵ ਕਰਨ ਲਈ <strong>ਸੇਵ ਅਤੇ ਅੱਗੇ</strong> 'ਤੇ ਕਲਿੱਕ ਕਰੋ।",
        "t_20": "ਸੰਖਿਆਤਮਕ ਉੱਤਰ ਪ੍ਰਕਾਰ ਦੇ ਪ੍ਰਸ਼ਨ ਦੀ ਪ੍ਰਕਿਰਿਆ:", "t_21": "ਵਰਚੁਅਲ ਕੀਪੈਡ ਦੀ ਵਰਤੋਂ ਕਰੋ।", "t_22": "ਦਸ਼ਮਲਵ ਤੋਂ ਪਹਿਲਾਂ 0 ਨਾਲ ਜਾਂ ਬਿਨਾਂ ਅੰਕ ਪਾਓ।",
        "t_23": "ਉੱਤਰ ਮਿਟਾਉਣ ਲਈ <strong>Clear Response</strong> 'ਤੇ ਕਲਿੱਕ ਕਰੋ।", "t_24": "<strong>ਸੇਵ ਅਤੇ ਅੱਗੇ</strong> 'ਤੇ ਕਲਿੱਕ ਕਰੋ।", "t_25": "<strong>ਸਮੀਖਿਆ ਲਈ ਮਾਰਕ</strong> ਦੀ ਵਰਤੋਂ ਕਰੋ।",
        "t_26": "ਉੱਤਰ ਬਦਲਣ ਲਈ ਪਹਿਲਾਂ ਪ੍ਰਸ਼ਨ ਚੁਣੋ ਅਤੇ ਫਿਰ ਪ੍ਰਕਿਰਿਆ ਦਾ ਪਾਲਣ ਕਰੋ।", "t_27": "ਕੇਵਲ ਸੇਵ ਕੀਤੇ ਜਾਂ ਸਮੀਖਿਆ ਲਈ ਮਾਰਕ ਕੀਤੇ ਉੱਤਰ ਹੀ ਮੁਲਾਂਕਣ ਲਈ ਵਿਚਾਰੇ ਜਾਣਗੇ।",
        "t_28": "ਸੈਕਸ਼ਨ ਉੱਪਰਲੇ ਬਾਰ ਤੇ ਦਿਖਾਏ ਗਏ ਹਨ।", "t_29": "ਅਗਲੇ ਸੈਕਸ਼ਨ ਦੇ ਪਹਿਲੇ ਪ੍ਰਸ਼ਨ 'ਤੇ ਆਪਣੇ ਆਪ ਪਹੁੰਚ ਜਾਵੋਗੇ।", "t_30": "ਸੈਕਸ਼ਨ ਦਾ ਸਟੇਟਸ ਦੇਖਣ ਲਈ ਮਾਊਸ ਨੂੰ ਉੱਪਰ ਲੈ ਜਾਓ।"
    },
    "Odissi": {
        "t_genInst": "ସାଧାରଣ ନିର୍ଦ୍ଦେଶାବଳୀ:", "t_navQ": "ପ୍ରଶ୍ନକୁ ଯିବା :", "t_ansQ": "ପ୍ରଶ୍ନର ଉତ୍ତର ଦେବା :",
        "t_1": "ସର୍ଭରରେ ଘଣ୍ଟା ସେଟ୍ ହେବ। ଉପର ଡାହାଣ କୋଣରେ ଥିବା ଟାଇମର୍ ବଳକା ସମୟ ଦେଖାଇବ। ସମୟ ଶୂନ୍ୟ ହେଲେ ପରୀକ୍ଷା ଆପେ ଆପେ ଶେଷ ହେବ।", "t_2": "ଡାହାଣ ପାର୍ଶ୍ୱରେ ଥିବା ପ୍ରଶ୍ନ ପ୍ୟାଲେଟ୍ ସ୍ଥିତି ଦେଖାଇବ:", "t_3": "ଆପଣ ଏପର୍ଯ୍ୟନ୍ତ ପ୍ରଶ୍ନ ଦେଖିନାହାଁନ୍ତି |",
        "t_4": "ଆପଣ ପ୍ରଶ୍ନର ଉତ୍ତର ଦେଇନାହାଁନ୍ତି |", "t_5": "ଆପଣ ପ୍ରଶ୍ନର ଉତ୍ତର ଦେଇଛନ୍ତି |", "t_6": "ଆପଣ ଉତ୍ତର ଦେଇନାହାଁନ୍ତି, କିନ୍ତୁ ସମୀକ୍ଷା ପାଇଁ ମାର୍କ କରିଛନ୍ତି |",
        "t_7": "ଆପଣ ଉତ୍ତର ଦେଇଛନ୍ତି, କିନ୍ତୁ ସମୀକ୍ଷା ପାଇଁ ମାର୍କ କରିଛନ୍ତି |", "t_8": "<strong>ସମୀକ୍ଷା ପାଇଁ ମାର୍କ</strong> ଅର୍ଥ ଆପଣ ପୁଣି ଦେଖିବାକୁ ଚାହାଁନ୍ତି |", "t_9": "ପ୍ରଶ୍ନର ଉତ୍ତର ଦେବାକୁ ନିମ୍ନଲିଖିତ କରନ୍ତୁ:",
        "t_10": "ସିଧାସଳଖ ଯିବାକୁ ପ୍ରଶ୍ନ ନମ୍ବରରେ କ୍ଲିକ୍ କରନ୍ତୁ | ଏହା ଉତ୍ତର ସେଭ୍ କରେ ନାହିଁ |", "t_11": "ସେଭ୍ କରିବାକୁ <strong>ସେଭ୍ ଏବଂ ପରବର୍ତ୍ତୀ</strong> କ୍ଲିକ୍ କରନ୍ତୁ |",
        "t_12": "<strong>ସମୀକ୍ଷା ପାଇଁ ମାର୍କ ଏବଂ ପରବର୍ତ୍ତୀ</strong> କ୍ଲିକ୍ କରନ୍ତୁ |", "t_13": "ଧ୍ୟାନ ଦିଅନ୍ତୁ ଯେ ଉତ୍ତର ସେଭ୍ ହେବ ନାହିଁ ଯଦି ଆପଣ ସିଧା ଅନ୍ୟ ପ୍ରଶ୍ନକୁ ଯାଆନ୍ତି |", "t_14": "ଆପଣ <strong>ପ୍ରଶ୍ନପତ୍ର</strong> ବଟନ୍ କ୍ଲିକ୍ କରି ସବୁ ଦେଖିପାରିବେ |",
        "t_15": "MCQ ପ୍ରଶ୍ନର ଉତ୍ତର ପ୍ରକ୍ରିୟା:", "t_16": "୪ଟି ବିକଳ୍ପରୁ ଗୋଟିଏ ବାଛନ୍ତୁ |", "t_17": "ଉତ୍ତର ବାତିଲ କରିବାକୁ <strong>Clear Response</strong> କ୍ଲିକ୍ କରନ୍ତୁ |",
        "t_18": "ଉତ୍ତର ବଦଳାଇବାକୁ ଅନ୍ୟ ବିକଳ୍ପରେ କ୍ଲିକ୍ କରନ୍ତୁ |", "t_19": "ସେଭ୍ କରିବାକୁ <strong>ସେଭ୍ ଏବଂ ପରବର୍ତ୍ତୀ</strong> କ୍ଲିକ୍ କରନ୍ତୁ |", "t_20": "ସାଂଖ୍ୟିକ ଉତ୍ତର ପ୍ରକ୍ରିୟା:", "t_21": "ଭର୍ଚୁଆଲ୍ କିପ୍ୟାଡ୍ ବ୍ୟବହାର କରନ୍ତୁ |",
        "t_22": "ଦଶମିକ ପୂର୍ବରୁ '0' ଦେଇ ପାରିବେ |", "t_23": "ଉତ୍ତର ସଫା କରିବାକୁ <strong>Clear Response</strong> |", "t_24": "<strong>ସେଭ୍ ଏବଂ ପରବର୍ତ୍ତୀ</strong> |",
        "t_25": "<strong>ସମୀକ୍ଷା ପାଇଁ ମାର୍କ</strong> କ୍ଲିକ୍ କରନ୍ତୁ |", "t_26": "ଉତ୍ତର ପରିବର୍ତ୍ତନ କରିବାକୁ ପ୍ରଥମେ ପ୍ରଶ୍ନ ବାଛନ୍ତୁ |", "t_27": "କେବଳ ସେଭ୍ ବା ମାର୍କ ହୋଇଥିବା ଉତ୍ତର ମୂଲ୍ୟାୟନ ହେବ |",
        "t_28": "ବିଭାଗଗୁଡ଼ିକ ଉପରେ ଦର୍ଶାଯାଇଛି |", "t_29": "ଆପଣ ପରବର୍ତ୍ତୀ ବିଭାଗକୁ ଆପେ ଯିବେ |", "t_30": "ସ୍ଥିତି ଦେଖିବାକୁ କର୍ସର୍ ନିଅନ୍ତୁ |"
    },
    "Tamil": {
        "t_genInst": "பொதுவான வழிமுறைகள்:", "t_navQ": "கேள்விக்குச் செல்வது :", "t_ansQ": "கேள்விக்கு பதிலளிப்பது :",
        "t_1": "கடிகாரம் சர்வருக்கு அமைக்கப்படும். நேரம் முடிந்ததும் தேர்வு தானாகவே முடிவடையும்.", "t_2": "கேள்வி தட்டு பின்வரும் சின்னங்களை காட்டும்:", "t_3": "நீங்கள் கேள்வியை இன்னும் பார்க்கவில்லை.",
        "t_4": "நீங்கள் கேள்விக்கு பதிலளிக்கவில்லை.", "t_5": "நீங்கள் கேள்விக்கு பதிலளித்துள்ளீர்கள்.", "t_6": "நீங்கள் பதிலளிக்கவில்லை, ஆனால் மதிப்பாய்வுக்கு குறித்துள்ளீர்கள்.",
        "t_7": "நீங்கள் பதிலளித்துள்ளீர்கள், ஆனால் மதிப்பாய்வுக்கு குறித்துள்ளீர்கள்.", "t_8": "<strong>மதிப்பாய்வுக்கு குறி</strong> என்பது நீங்கள் மீண்டும் பார்க்க விரும்புகிறீர்கள் என்பதை குறிக்கும்.", "t_9": "பதிலளிக்க இதை செய்யவும்:",
        "t_10": "நேரடியாக செல்ல எண்ணைக் கிளிக் செய்யவும். இது பதிலை சேமிக்காது.", "t_11": "சேமிக்க <strong>சேமி & அடுத்து</strong> பட்டனை அழுத்தவும்.", "t_12": "<strong>மதிப்பாய்வுக்கு குறி & அடுத்து</strong> பட்டனை அழுத்தவும்.",
        "t_13": "நீங்கள் சேமிக்காமல் சென்றால் பதில் சேமிக்கப்படாது.", "t_14": "<strong>கேள்வித் தாள்</strong> பட்டனை அழுத்தி அனைத்து கேள்விகளையும் காணலாம்.", "t_15": "MCQ கேள்விக்கு பதிலளிக்கும் முறை:",
        "t_16": "4 விருப்பங்களில் ஒன்றை தேர்வு செய்யவும்.", "t_17": "நீக்க <strong>Clear Response</strong> பட்டனை அழுத்தவும்.", "t_18": "பதிலை மாற்ற மற்றொரு விருப்பத்தை கிளிக் செய்யவும்.",
        "t_19": "<strong>சேமி & அடுத்து</strong> பட்டனை கட்டாயம் அழுத்தவும்.", "t_20": "எண் வகை பதில் முறை:", "t_21": "மெய்நிகர் விசைப்பலகையை பயன்படுத்தவும்.",
        "t_22": "தசமத்திற்கு முன் '0' சேர்க்கலாம்.", "t_23": "<strong>Clear Response</strong> பட்டனை அழுத்தவும்.", "t_24": "<strong>சேமி & அடுத்து</strong> பட்டனை அழுத்தவும்.",
        "t_25": "<strong>மதிப்பாய்வுக்கு குறி</strong> பட்டனை அழுத்தவும்.", "t_26": "பதிலை மாற்ற மீண்டும் கேள்வியை தேர்வு செய்யவும்.", "t_27": "சேமிக்கப்பட்ட பதில்கள் மட்டுமே மதிப்பிடப்படும்.",
        "t_28": "பிரிவுகள் மேலே காட்டப்படும்.", "t_29": "அடுத்த பிரிவுக்கு தானாகவே செல்லும்.", "t_30": "நிலையை பார்க்க கர்சரை நகர்த்தவும்."
    },
    "Sanskrit": {
        "t_genInst": "सामान्यनिर्देशाः:", "t_navQ": "प्रश्नं प्रति गमनम् :", "t_ansQ": "प्रश्नस्य उत्तरं दातुम् :",
        "t_1": "सर्वरमध्ये समयः स्थापितः भविष्यति। समयः समाप्तः चेत् परीक्षा स्वयमेव समाप्ता भविष्यति।", "t_2": "प्रश्नफलकं एतानि चिह्नानि दर्शयिष्यति:", "t_3": "भवता प्रश्नः न दृष्टः।",
        "t_4": "भवता उत्तरं न दत्तम्।", "t_5": "भवता उत्तरं दत्तम्।", "t_6": "उत्तरं न दत्तं, परन्तु पुनरीक्षणाय चिह्नितम्।",
        "t_7": "उत्तरं दत्तं, परन्तु पुनरीक्षणाय चिह्नितम्।", "t_8": "<strong>पुनरीक्षणाय चिह्नितम्</strong> इत्यस्य अर्थः अस्ति यत् भवान् पुनः द्रष्टुम् इच्छति।", "t_9": "उत्तरं दातुं एतत् कुर्वन्तु:",
        "t_10": "साक्षात् गन्तुं सङ्ख्यायां नुदन्तु। एतेन उत्तरं न रक्ष्यते।", "t_11": "रक्षितुं <strong>रक्षन्तु & अग्रे</strong> नुदन्तु।", "t_12": "<strong>पुनरीक्षणाय चिह्नितम् & अग्रे</strong> नुदन्तु।",
        "t_13": "अवधानं कुर्वन्तु यत् विना रक्षणेन अग्रे गच्छति चेत् उत्तरं न रक्ष्यते।", "t_14": "<strong>प्रश्नपत्रम्</strong> नोदनेन सर्वं द्रष्टुं शक्यते।", "t_15": "MCQ उत्तरदानप्रक्रिया:",
        "t_16": "४ विकल्पेषु एकं चिनोतु।", "t_17": "निष्कासयितुं <strong>Clear Response</strong> नुदन्तु।", "t_18": "उत्तरं परिवर्तयितुम् अन्यं चिनोतु।",
        "t_19": "<strong>रक्षन्तु & अग्रे</strong> नुदन्तु।", "t_20": "सङ्ख्यात्मक-उत्तरप्रक्रिया:", "t_21": "सङ्ख्यापटलस्य उपयोगं कुर्वन्तु।",
        "t_22": "दशमलवात् पूर्वं '0' योजयितुं शक्यते।", "t_23": "<strong>Clear Response</strong> नुदन्तु।", "t_24": "<strong>रक्षन्तु & अग्रे</strong> नुदन्तु।",
        "t_25": "<strong>पुनरीक्षणाय चिह्नितम्</strong> नुदन्तु।", "t_26": "उत्तरं परिवर्तयितुम् प्रथमं प्रश्नं चिनोतु।", "t_27": "रक्षितानि उत्तराणि एव मूल्याङ्कनाय स्वीक्रियन्ते।",
        "t_28": "विभागाः उपरि सन्ति।", "t_29": "अग्रिमे विभागे स्वयमेव गमिष्यति।", "t_30": "स्थितिं द्रष्टुं कर्सरं उपरि नयन्तु।"
    }
}

out_data = {}
for lang, texts in langs.items():
    html = base_html.format(**texts)
    out_data[lang] = html

with open('translations.js', 'w', encoding='utf-8') as f:
    f.write('const page1Translations = ' + json.dumps(out_data, ensure_ascii=False, indent=4) + ';\n')

