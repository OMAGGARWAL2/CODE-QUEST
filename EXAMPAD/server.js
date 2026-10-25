/**
 * TESTPAD BACKEND SERVER
 * Architecture: Client-Server
 * Platform: Node.js + Express
 */

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

// Load Environment Variables (Demonstrates use of Node.js modules like 'dotenv' and 'path')
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Configuration (Demonstrates framework usage)
app.use(cors());
app.use(express.json());

// Modular Routing Strategy
const aiRoutes = require("./routes/ai");

// Register Routes
app.use("/api", aiRoutes);

// Explicit route handlers for TESTVIEW & COURSETRAY
app.get(['/TESTVIEW.html', '/testview.html', '/pages/TESTVIEW.html', '/pages/testview.html', '/TESTVIEW', '/testview'], (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'TESTVIEW.html'));
});

app.get(['/COURSETRAY.html', '/coursetray.html', '/pages/COURSETRAY.html', '/pages/coursetray.html', '/COURSETRAY', '/coursetray'], (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'COURSETRAY.html'));
});

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// --- Backend Architecture Overview ---
// This Express application serves as a dedicated microservice for AI processing,
// demonstrating a separation of concerns between the desktop client (Electron)
// and the specialized backend services.

// Root Endpoint for Health Check
app.get("/health", (req, res) => {
    res.json({ status: "active", architecture: "client-server", platform: "node-express" });
});

// Globally handling exceptions
app.use((err, req, res, next) => {
    console.error("Critical Backend Error:", err.stack);
    res.status(500).json({ error: "A server exception occurred!" });
});

// Export the app for Vercel's serverless environment
module.exports = app;

app.listen(PORT, () => {
    console.log(`TESTPAD Backend System operational on port ${PORT}`);
});
