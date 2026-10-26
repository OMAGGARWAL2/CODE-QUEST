const { app, BrowserWindow, Menu, shell, ipcMain, session, dialog, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Ensure server doesn't launch default OS browser
process.env.OPEN_BROWSER = 'false';
process.env.ELECTRON_APP = 'true';

const { startServer } = require('./server');

let mainWindow = null;
let appServer = null;
let activePort = 3000;

function resolveAppIcon() {
    const candidates = [
        path.join(__dirname, 'CQAI(MAIN).png'),
        path.join(__dirname, 'CQAI.png'),
        path.join(__dirname, 'CQLOGO.jpg'),
        path.join(__dirname, 'BGNEW01.png')
    ];
    for (const iconPath of candidates) {
        if (fs.existsSync(iconPath)) return iconPath;
    }
    return undefined;
}

function checkFullscreenForUrl(url) {
    if (!mainWindow) return;
    const isInteroundAttempt = /interound-attempt/i.test(url);

    if (isInteroundAttempt) {
        // True Fullscreen for Exam/Round Attempt: covers entire screen, taskbar and titlebar hidden like in ExamPad
        if (!mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(true);
        }
    } else {
        // All other pages: Maximize window with top titlebar and system taskbar visible
        if (mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(false);
        }
        if (!mainWindow.isMaximized()) {
            mainWindow.maximize();
        }
    }
}

function createMainWindow(port) {
    const icon = resolveAppIcon();

    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: 'CodeQuest',
        icon: icon,
        backgroundColor: '#FFFFFF',
        show: false,
        frame: false, // Frameless window like ExamPad (removes native OS titlebar)
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            spellcheck: true,
            webSecurity: true
        }
    });

    // Remove clunky Alt menus for a clean, modern app look like ExamPad
    Menu.setApplicationMenu(null);

    // Auto-grant permissions needed by CodeQuest (Camera/Mic for interview proctoring, notifications, screen capture)
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        callback(true);
    });

    // When ready to show, open MAXIMIZED so it fills the screen with top bar and taskbar visible
    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
    });

    // Dynamic fullscreen detection based on current page URL
    mainWindow.webContents.on('did-navigate', (event, url) => {
        checkFullscreenForUrl(url);
    });

    mainWindow.webContents.on('did-navigate-in-page', (event, url) => {
        checkFullscreenForUrl(url);
    });

    // Keyboard shortcuts: F12 for DevTools, F5/Ctrl+R for reload
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12' && input.type === 'keyDown') {
            mainWindow.webContents.toggleDevTools();
            event.preventDefault();
        } else if ((input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) && input.type === 'keyDown') {
            mainWindow.reload();
            event.preventDefault();
        }
    });

    // Load CodeQuest gateway
    const targetUrl = `http://localhost:${port}/index.html`;
    mainWindow.loadURL(targetUrl).catch((err) => {
        if (err.code !== 'ERR_ABORTED' && !String(err.message || '').includes('ERR_ABORTED')) {
            console.warn('Failed to load via local server, falling back to local file:', err.message);
            mainWindow.loadFile(path.join(__dirname, 'index.html'));
        }
    });

    // Handle external links (open in external OS browser)
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
            return { action: 'allow' };
        }
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// IPC Handlers
ipcMain.on('window-control', (event, action) => {
    if (!mainWindow) return;
    switch (action) {
        case 'maximize':
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
            break;
        case 'minimize':
            mainWindow.minimize();
            break;
        case 'close':
            mainWindow.close();
            break;
    }
});

// Kiosk / Fullscreen IPC trigger from interound-attempt.html / proctorBridge
ipcMain.on('kiosk-mode', (event, data) => {
    let enable = false;
    if (typeof data === 'object' && data !== null) {
        enable = !!data.enable;
    } else {
        enable = !!data;
    }

    if (mainWindow) {
        if (enable) {
            mainWindow.setFullScreen(true);
        } else {
            mainWindow.setFullScreen(false);
            mainWindow.maximize();
        }
    }
});

// Network information for exam proctoring / connectivity checks
ipcMain.handle('get-network-info', async () => {
    const interfaces = os.networkInterfaces();
    const results = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                results.push({ name, address: iface.address });
            }
        }
    }
    return results;
});

// Audit screenshot handler
ipcMain.handle('take-forced-screenshot', async (event, filename) => {
    try {
        const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } });
        const primary = sources[0];
        const screenshotPath = path.join(app.getPath('userData'), 'audit', filename || 'screenshot.png');
        if (!fs.existsSync(path.dirname(screenshotPath))) {
            fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
        }
        fs.writeFileSync(screenshotPath, primary.thumbnail.toPNG());
        return { success: true, path: screenshotPath };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// Native save PDF file dialog
ipcMain.handle('save-pdf-dialog', async (event, { defaultFilename, pdfBase64 }) => {
    try {
        const defaultPath = path.join(app.getPath('downloads'), defaultFilename || 'CodeQuest_Document.pdf');
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Save PDF Document',
            defaultPath: defaultPath,
            filters: [
                { name: 'PDF Documents (*.pdf)', extensions: ['pdf'] },
                { name: 'All Files (*.*)', extensions: ['*'] }
            ]
        });
        if (canceled || !filePath) return { success: false, canceled: true };
        const cleanBase64 = (pdfBase64 || '').replace(/^data:application\/pdf;base64,/, '').replace(/^data:[^;]+;base64,/, '');
        fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));
        return { success: true, filePath };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// App Lifecycle
app.whenReady().then(() => {
    startServer(activePort, (port, server) => {
        activePort = port;
        appServer = server;
        createMainWindow(port);
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow(activePort);
        }
    });
});

app.on('window-all-closed', () => {
    if (appServer && typeof appServer.close === 'function') {
        try {
            appServer.close();
        } catch (e) {}
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
