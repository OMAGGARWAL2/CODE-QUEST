<div align="center">
  <img src="https://raw.githubusercontent.com/OMAGGARWAL2/TESTPAD-PORTAL/main/logo.jpg" width="300">
  <h1>TESTPAD PORTAL</h1>
  <h3>An Integrated Enterprise-Grade Examination & ERP Ecosystem</h3>
</div>

<hr>

<div style="text-align: justify;">
TESTPAD is a sophisticated, end-to-end digital examination and academic management system developed for <b>Chitkara University</b>. Unlike standard testing platforms, TESTPAD provides a comprehensive, OS-style environment that integrates robust proctoring, an advanced evaluation engine (OSM), and an ERP-integrated administrative layer. It is engineered to maintain absolute academic integrity while streamlining the entire lifecycle of an assessment, from paper generation to final result secretion.
</div>

---

### Key Modules and Features

#### 1. Security and Advanced Proctoring
<div style="text-align: justify;">
The platform's security architecture is its most critical component, designed to eliminate standard avenues of digital malpractice. It employs low-level browser monitoring to detect tab switches, restricts all clipboard functions (Copy/Paste/Cut), and effectively blocks developer inspection tools such as F12 and Inspect Element. The system ensures a "locked-down" experience, essentially turning the user's browser into a dedicated, secure examination terminal.
</div>

#### 2. OSM-Evaluator (On-Screen Marking)
<div style="text-align: justify;">
TESTPAD includes a specialized <b>OSM-Evaluator</b> module designed for digital answer script correction. This allows faculty to grade subjective and theory-based responses directly on the screen with precision tools. The evaluator integrates seamlessly with the question pool and score management system, reducing the manual overhead of physical script handling and ensuring faster result processing.
</div>

#### 3. Integrated ERP and Chalkpad Framework
<div style="text-align: justify;">
Beyond examinations, the system includes a deep integration with academic ERP functionalities, providing a <b>Chalkpad-style</b> administrative experience. This includes modules for student profiles, seat allocation, admit card generation, and attendance management. The ERP layer ensures that student data flows consistently from the classroom records to the examination hall.
</div>

#### 4. Smart Question Paper (QP) Generator
<div style="text-align: justify;">
The <b>SmartQP</b> engine allows for the automated generation of randomized question papers from a centralized question pool. It supports complex mathematical formulas, subjective theory, and multi-language coding templates, ensuring that every examination set is balanced, unique, and aligned with the curriculum standards.
</div>

#### 5. Technical Assessment Environment
<div style="text-align: justify;">
For technical disciplines, TESTPAD provides a built-in Integrated Development Environment (IDE). Students can write, compile, and execute code in popular languages such as <b>C++, Java, Python, and JavaScript</b>. This module features real-time execution limits and automated test-case validation to ensure objective grading for coding proficiency.
</div>

---

### Backend Engineering I - Rubric Compliance

This project is built to demonstrate core Backend Engineering competencies as per the evaluation rubrics:

#### 1. Client-Server Architecture & Node.js
*   **Structure**: The application employs a **Hybrid Client-Server Architecture**.
    *   **Main Process (`main.js`)**: Serves as the system-level "Server," managing hardware and security.
    *   **Express Server (`server.js`)**: A micro-service handling AI inference.
    *   **The Client**: Renderer processes built with standard Web APIs.
*   **Environment**: Built entirely on **Node.js**, leveraging native modules like `fs`, `path`, and `electron` for OS-level control.

#### 2. Handling Modules & Modularization
*   **Modular API**: Routes are handled in a separate `routes/` directory (e.g., `routes/ai.js`).
*   **Data Logic**: The project uses a dedicated `js/db.js` module for managing persistent storage operations through a structured class interface.

#### 3. Frameworks (Express-JS)
*   **Full Implementation**: An Express.js ecosystem is used for the AI Assistant.
*   **Middleware**: Demonstrates the use of standard middleware like `cors`, `express.json()`, and custom global error-handling logic.

#### 4. Routing & Exception Handling
*   **Dynamic Routing**: Use of `express.Router()` for scalable path management (`/api/ask-ai`).
*   **Robust Exceptions**: Implementation of global exception handlers and `try/catch` blocks across all asynchronous Node.js and IPC operations to ensure system stability.

---

### System Architecture Overview

<div style="text-align: justify;">
The platform is built on a modular, scalable architecture to support high concurrent user loads across various university departments:
</div>

*   **index.html**: The master gateway for user authentication and role-based redirection.
*   **pages/osm-evaluator.html**: The core script evaluation and grading interface.
*   **pages/erp.html**: The administrative ERP dashboard for academic management.
*   **pages/smartqp.html**: The automated question paper generation module.
*   **pages/exam-attempt.html**: The high-security, proctored testing environment.
*   **js/security.js**: The central engine governing the anti-cheat and lock-down protocols.
*   **js/db.js**: The persistent storage management layer for local and cloud data synchronization.

---

### Installation and Usage

#### Web Implementation
<div style="text-align: justify;">
To deploy the TESTPAD portal in a web context, host the directory on any standard static server.
</div>

```bash
# Recommendation: Use Node.js http-server for local environment
npx http-server
```

#### Secure Desktop Packaging
<div style="text-align: justify;">
For high-security examinations, the system is designed to be packaged as a standalone Electron application, effectively bypassing browser-level limitations on system access.
</div>

```bash
# Build and Run
npm install
npm start
```

---

### Development Team

<div style="text-align: justify;">
This ecosystem was conceptualized and developed by:
</div>

*   **YAKSHI BATISH**
*   **PARAS JINDAL**
*   **PIYUSH THAKUR**
*   **OM AGGARWAL**

**Chitkara University**
Department of Computer Science & Engineering
© 2026 TESTPAD Engineering | All Rights Reserved.
