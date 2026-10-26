/**
 * CodeQuest Local Development & App Server
 * Zero-dependency, ultra-fast static server with live reload and auto-browser launch.
 * Run with: npm start (or node server.js)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

let PORT = parseInt(process.env.PORT, 10) || 3000;
const ROOT_DIR = __dirname;

// MIME types dictionary
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8'
};

// Connected Live-Reload Clients (SSE)
const sseClients = new Set();

function broadcastReload() {
    for (const client of sseClients) {
        try {
            client.write('data: reload\n\n');
        } catch (e) {
            sseClients.delete(client);
        }
    }
}

// Watch project directory for changes with debouncing (only in browser/web mode, not Electron)
let reloadDebounceTimer = null;
if (process.env.ELECTRON_APP !== 'true') {
    try {
        fs.watch(ROOT_DIR, { recursive: true }, (eventType, filename) => {
            if (!filename) return;
            // Ignore git, node_modules, temp files
            if (filename.includes('.git') || filename.includes('node_modules') || filename.includes('.system_generated') || filename.includes('brain') || filename.startsWith('.')) return;
            const ext = path.extname(filename).toLowerCase();
            if (['.html', '.css', '.js', '.svg', '.png', '.jpg', '.json'].includes(ext)) {
                clearTimeout(reloadDebounceTimer);
                reloadDebounceTimer = setTimeout(() => {
                    console.log(`\x1b[36m[LiveReload]\x1b[0m File changed: ${filename} -> Reloading browser...`);
                    broadcastReload();
                }, 120);
            }
        });
    } catch (e) {
        console.warn('Directory watcher notice:', e.message);
    }
}

// Live-reload script to inject into HTML responses
const LIVE_RELOAD_SNIPPET = `
<!-- CodeQuest App Live-Reload -->
<script>
(function() {
    if (!window.EventSource) return;
    try {
        const ev = new EventSource('/__cq_live_reload__');
        ev.onmessage = function(e) {
            if (e.data === 'reload') {
                console.log('[CodeQuest] Reloading updated page...');
                window.location.reload();
            }
        };
    } catch(e) {}
})();
</script>
</body>
`;

// Helper: Get local network IP
function getNetworkAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// Helper: Open default browser
function openBrowser(url) {
    const platform = process.platform;
    let cmd = '';
    if (platform === 'win32') {
        cmd = `start "" "${url}"`;
    } else if (platform === 'darwin') {
        cmd = `open "${url}"`;
    } else {
        cmd = `xdg-open "${url}"`;
    }
    exec(cmd, (err) => {
        if (err) {
            // Non-fatal, user can click link in terminal
        }
    });
}

// Request Handler
function handleRequest(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // SSE Endpoint for Live Reload
    if (req.url === '/__cq_live_reload__') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        res.write('retry: 1000\n\n');
        sseClients.add(res);
        req.on('close', () => sseClients.delete(res));
        return;
    }

    // Resolve URL path
    let reqUrl = req.url.split('?')[0].split('#')[0];
    reqUrl = decodeURIComponent(reqUrl);

    // Map root to index.html
    if (reqUrl === '/' || reqUrl === '') {
        reqUrl = '/index.html';
    }

    let filePath = path.join(ROOT_DIR, reqUrl);

    // Security check: ensure within ROOT_DIR
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Check if adding .html helps (clean urls support)
            const htmlCandidate = filePath + '.html';
            if (fs.existsSync(htmlCandidate)) {
                filePath = htmlCandidate;
            } else {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <div style="font-family: sans-serif; text-align: center; padding: 60px;">
                        <h2 style="color: #DE5B2B;">404 - Page Not Found</h2>
                        <p style="color: #64748B;">Could not find: <code>${escapeHtml(reqUrl)}</code></p>
                        <p><a href="/" style="color: #DE5B2B; font-weight: 600;">Return to CodeQuest Home</a></p>
                    </div>
                `);
                return;
            }
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        // HTML files get live-reload snippet injected
        if (ext === '.html') {
            fs.readFile(filePath, 'utf8', (readErr, content) => {
                if (readErr) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('500 Internal Server Error');
                    return;
                }

                let finalHtml = content;
                if (process.env.ELECTRON_APP !== 'true') {
                    if (content.includes('</body>')) {
                        finalHtml = content.replace('</body>', LIVE_RELOAD_SNIPPET);
                    } else {
                        finalHtml += LIVE_RELOAD_SNIPPET;
                    }
                }

                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Cache-Control': 'no-cache'
                });
                res.end(finalHtml);
            });
            return;
        }

        // Static binary or text stream
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600'
        });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
}

function escapeHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function startServer(portToTry, onReady) {
    const server = http.createServer(handleRequest);

    server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${portToTry} in use, trying port ${portToTry + 1}...`);
            startServer(portToTry + 1, onReady);
        } else {
            console.error('Server error:', err);
        }
    });

    server.listen(portToTry, () => {
        PORT = portToTry;
        const localUrl = `http://localhost:${PORT}/`;
        const netIp = getNetworkAddress();
        const networkUrl = `http://${netIp}:${PORT}/`;

        console.log('');
        console.log('\x1b[38;2;222;91;43m  ╔════════════════════════════════════════════════════════════════════╗\x1b[0m');
        console.log('\x1b[38;2;222;91;43m  ║                                                                    ║\x1b[0m');
        console.log('\x1b[38;2;222;91;43m  ║   🚀  CodeQuest App Server is Running!                             ║\x1b[0m');
        console.log('\x1b[38;2;222;91;43m  ║                                                                    ║\x1b[0m');
        console.log(`\x1b[38;2;222;91;43m  ║\x1b[0m   ➜  \x1b[1mLocal:\x1b[0m    \x1b[36m${localUrl.padEnd(46)}\x1b[0m\x1b[38;2;222;91;43m║\x1b[0m`);
        console.log(`\x1b[38;2;222;91;43m  ║\x1b[0m   ➜  \x1b[1mNetwork:\x1b[0m  \x1b[36m${networkUrl.padEnd(46)}\x1b[0m\x1b[38;2;222;91;43m║\x1b[0m`);
        console.log('\x1b[38;2;222;91;43m  ║                                                                    ║\x1b[0m');
        console.log('\x1b[38;2;222;91;43m  ║   ⚡  Live Reload: Active (Edits will auto-refresh browser)         ║\x1b[0m');
        if (process.env.OPEN_BROWSER !== 'false') {
            console.log('\x1b[38;2;222;91;43m  ║   💻  Browser opening automatically... Press Ctrl+C to quit        ║\x1b[0m');
        } else {
            console.log('\x1b[38;2;222;91;43m  ║   💻  Running in Electron Desktop App mode...                      ║\x1b[0m');
        }
        console.log('\x1b[38;2;222;91;43m  ║                                                                    ║\x1b[0m');
        console.log('\x1b[38;2;222;91;43m  ╚════════════════════════════════════════════════════════════════════╝\x1b[0m');
        console.log('');

        // Automatically open browser in development if not disabled
        if (process.env.OPEN_BROWSER !== 'false') {
            setTimeout(() => {
                openBrowser(localUrl);
            }, 400);
        }

        if (typeof onReady === 'function') {
            onReady(PORT, server);
        }
    });
}

if (require.main === module) {
    startServer(PORT);
}

module.exports = { startServer };

