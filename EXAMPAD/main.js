/**
 * TESTPAD MAIN PROCESS
 * Environment: Node.js (Electron Main)
 * Role: Desktop Controller / Secure Server
 */

const { app, BrowserWindow, ipcMain, globalShortcut, dialog, Menu, desktopCapturer, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');

// AI Integration and Backend Server imports
if (app.isPackaged) {
    require('dotenv').config({ path: path.join(process.resourcesPath, '.env') });
} else {
    require('dotenv').config();
}

// Automatically start the embedded backend Express API server
try {
    require('./server');
} catch (e) {
    console.warn('[SERVER] Express server initialization notice:', e.message);
}

let mainWindow;
let appInKiosk = false;
let appInFullscreen = false;

// --- DEEP LINKING SUPPORT ---
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('TESTPAD', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('TESTPAD');
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            // Handle the URL from the command line (for Windows)
            const url = commandLine.pop();
            if (url && url.startsWith('TESTPAD://')) {
                handleIncomingURL(url);
            }
        }
    });

    app.whenReady().then(() => {
        Menu.setApplicationMenu(null); // Remove default menu bar
        createWindow();
        registerSecurityShortcuts();

        // Check if app was opened via protocol (on startup)
        const url = process.argv.find(arg => arg.startsWith('TESTPAD://'));
        if (url) {
            setTimeout(() => handleIncomingURL(url), 1500);
        }

        app.on('activate', function () {
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });
}

function handleIncomingURL(url) {
    try {
        const fullUrl = new URL(url);
        const examId = fullUrl.searchParams.get('id');
        if (examId && mainWindow) {
            // Signal renderer to navigate to this exam
            mainWindow.webContents.send('open-exam-intent', { examId });
        }
    } catch (e) {
        console.error('Failed to parse deep link URL:', url, e);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        backgroundColor: '#f4f5f7',
        title: "TESPAD COMMAND CENTER",
        icon: path.join(__dirname, 'icon.png'), // Official Chitkara Logo (Resized)
        frame: false, // Ensure no title bar or taskbar for premium "Command Center" feel
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
            plugins: true,
            devTools: false // Disable DevTools internally
        },
        show: false
    });

    mainWindow.loadFile('pages/joinvialink.html'); // Start on the Join via Link portal as default

    // --- CUSTOM ZOOM CONTROLS ---
    // Ctrl+I to Zoom In, Ctrl+D to Zoom Out
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.control || input.meta) {
            const key = input.key.toLowerCase();
            if (key === 'i') {
                const currentFactor = mainWindow.webContents.getZoomFactor();
                if (currentFactor < 1.5) mainWindow.webContents.setZoomFactor(Math.min(1.5, currentFactor + 0.1));
                event.preventDefault();
            } else if (key === 'd') {
                const currentFactor = mainWindow.webContents.getZoomFactor();
                if (currentFactor > 0.5) mainWindow.webContents.setZoomFactor(Math.max(0.5, currentFactor - 0.1));
                event.preventDefault();
            } else if (key === '0') {
                mainWindow.webContents.setZoomFactor(1.0);
                event.preventDefault();
            }
        }
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
    });

    mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
        // Always ask the user where to download / save the file
        const defaultPath = path.join(app.getPath('downloads'), item.getFilename());
        const filePath = dialog.showSaveDialogSync(mainWindow, {
            title: 'Save File',
            defaultPath: defaultPath,
            filters: [
                { name: 'PDF Documents (*.pdf)', extensions: ['pdf'] },
                { name: 'All Files (*.*)', extensions: ['*'] }
            ]
        });
        if (filePath) {
            item.setSavePath(filePath);
        } else {
            item.cancel();
        }
    });

    mainWindow.webContents.on('did-finish-load', () => {
        if (appInFullscreen && mainWindow) {
            if (!mainWindow.isFullScreen()) mainWindow.setFullScreen(true);

            // If it's a real exam (appInKiosk), apply additional lockdown
            if (appInKiosk) {
                if (!mainWindow.isKiosk()) mainWindow.setKiosk(true);
                mainWindow.setAlwaysOnTop(true, 'screen-saver');
            }
        } else if (mainWindow) {
            // Ensure framing logic is consistent
            mainWindow.setMenuBarVisibility(false);
        }
    });

    // SILENTLY close devtools if they try to open (secondary guard)
    mainWindow.webContents.on('devtools-opened', () => {
        mainWindow.webContents.closeDevTools();
    });

    // Prevent window closing during session if in kiosk
    mainWindow.on('close', (e) => {
        if (mainWindow && mainWindow.isKiosk()) {
            e.preventDefault();
        }
    });

    // Prevent minimizing during exams
    mainWindow.on('minimize', (e) => {
        if (appInFullscreen || appInKiosk) {
            e.preventDefault();
            mainWindow.restore();
            if (appInFullscreen) mainWindow.setFullScreen(true);
        }
    });

    // --- TAB SWITCHING CONTROL ---
    mainWindow.on('blur', () => {
        mainWindow.webContents.send('proctor-event', {
            type: 'FOCUS_LOST',
            severity: 'CRITICAL',
            message: 'User navigated away from the application workspace.'
        });

        if (appInKiosk) {
            mainWindow.focus();
            mainWindow.setAlwaysOnTop(true, 'screen-saver');
        }
    });

    mainWindow.on('focus', () => {
        mainWindow.webContents.send('proctor-event', {
            type: 'FOCUS_REGAINED',
            message: 'Session resumed.'
        });
    });

    // AGGRESSIVE DESKTOP LOCK: Prevent escape via Virtual Desktops (Win+Tab / Touchpad Swipes)
    mainWindow.on('visibility-change', (event, state) => {
        if (state === 'hidden' && mainWindow.isKiosk()) {
            mainWindow.show();
            mainWindow.focus();
        }
    });

    mainWindow.on('leave-full-screen', () => {
        if (appInFullscreen && mainWindow) {
            mainWindow.setFullScreen(true);
        }
    });
}

function registerSecurityShortcuts(isPractice = false) {
    globalShortcut.unregisterAll(); // Clear previous before re-registering

    const blockedKeys = [
        'Escape',
        'PrintScreen',
        'CommandOrControl+Shift+4',
        'CommandOrControl+Shift+3',
        'Alt+F4',
        'Alt+Space',
        'CommandOrControl+H',
        'CommandOrControl+Q',
        'CommandOrControl+W',
        'CommandOrControl+R',
        'CommandOrControl+Shift+I',
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    ];

    blockedKeys.push('Control+Esc');
    blockedKeys.push('Super+Control+Left');
    blockedKeys.push('Super+Control+Right');

    // Shortcuts that allow switching apps - only block if NOT practice
    if (!isPractice) {
        blockedKeys.push('Alt+Tab');
        blockedKeys.push('Alt+Shift+Tab');
        blockedKeys.push('Alt+Esc');
        blockedKeys.push('CommandOrControl+Tab');
        blockedKeys.push('Super+D');
        blockedKeys.push('Super+Tab');
        blockedKeys.push('Super+L');
        blockedKeys.push('Super+I');
        blockedKeys.push('Super+A');
        blockedKeys.push('Super+S');
        blockedKeys.push('Super+Control+D');
    }

    blockedKeys.forEach(key => {
        try {
            globalShortcut.register(key, () => {
                // SILENT BLOCKING: Sends event for counting, but clears clipboard for PrintScreen.
                if (mainWindow) {
                    mainWindow.webContents.send('proctor-event', {
                        type: 'ILLEGAL_INPUT',
                        message: `Action blocked: ${key}`
                    });

                    if (key === 'PrintScreen') {
                        clipboard.clear();
                    }
                }
            });
        } catch (e) {
            console.error(`Error registering ${key}:`, e.message);
        }
    });
}

// --- IPC HANDLERS ---
ipcMain.on('window-control', (event, action) => {
    switch (action) {
        case 'maximize':
            // Only allow if not in an active exam session
            if (!appInFullscreen) {
                if (mainWindow.isMaximized()) {
                    mainWindow.unmaximize();
                } else {
                    mainWindow.maximize();
                }
            }
            break;
        case 'minimize':
            // Only allow if not in an active exam session
            if (mainWindow && !appInFullscreen && !appInKiosk) {
                mainWindow.minimize();
            }
            break;
        case 'close':
            console.log("[SYSTEM] Hard close requested. Terminating all processes.");
            if (mainWindow) {
                try {
                    // Set closable true first to ensure destroy works without conflict
                    mainWindow.setClosable(true);
                    mainWindow.destroy();
                } catch (e) {
                    console.error("Error during window destruction:", e);
                }
                mainWindow = null;
            }
            // Aggressive process kill to ensure exit to desktop
            setTimeout(() => {
                app.exit(0);
            }, 100);
            break;
    }
});

ipcMain.on('kiosk-mode', (event, data) => {
    let enable = false;
    let isPractice = false;

    // Handle both old (direct boolean) and new (object) IPC calls for backward compatibility
    if (typeof data === 'object') {
        enable = data.enable;
        isPractice = data.isPractice;
    } else {
        enable = data;
    }

    if (mainWindow) {
        if (enable) {
            appInFullscreen = true;
            appInKiosk = !isPractice; // Set persistence flag only for real exams

            if (isPractice) {
                // Practice Mode: Mandatory Fullscreen but NOT kiosk, allow switching
                mainWindow.setKiosk(false);
                mainWindow.setAlwaysOnTop(false);
                mainWindow.setFullScreen(true);
                mainWindow.setSkipTaskbar(false);
                mainWindow.setResizable(true);
                mainWindow.setClosable(true);
                mainWindow.setVisibleOnAllWorkspaces(false);
                console.log("[SYSTEM] Practice Mode: Mandatory Fullscreen, switching allowed.");
            } else {
                // Real Exam: Total Lockdown
                mainWindow.setKiosk(true);
                mainWindow.setAlwaysOnTop(true, 'screen-saver');
                mainWindow.setFullScreen(true);
                mainWindow.setSkipTaskbar(true); // Hide from taskbar to block swipe-up/Win+Tab
                mainWindow.setResizable(false);
                mainWindow.setClosable(false);
                // STICKY WINDOW: The window follows the user to any virtual desktop
                mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
                console.log("[SYSTEM] Secure Exam Mode: Kiosk enabled, total lockdown.");
            }

            // Re-register shortcuts based on mode
            registerSecurityShortcuts(isPractice);
        } else {
            appInFullscreen = false;
            appInKiosk = false;
            mainWindow.setKiosk(false);
            mainWindow.setAlwaysOnTop(false);
            mainWindow.setFullScreen(false);
            mainWindow.setSkipTaskbar(false);
            mainWindow.setResizable(true);
            mainWindow.setClosable(true);
            mainWindow.setVisibleOnAllWorkspaces(false);

            globalShortcut.unregisterAll();
            console.log("[SYSTEM] Security features disabled.");
        }
    }
});

ipcMain.handle('take-forced-screenshot', async (event, filename) => {
    try {
        const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } });
        const primary = sources[0];
        const screenshotPath = path.join(app.getPath('userData'), 'audit', filename);

        if (!fs.existsSync(path.dirname(screenshotPath))) {
            fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
        }

        fs.writeFileSync(screenshotPath, primary.thumbnail.toPNG());
        return { success: true, path: screenshotPath };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// Network Information Bridge
const os = require('os');
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

// AI Controller Bridge
const aiController = require('./controllers/aiController');
ipcMain.handle('ask-ai', async (event, prompt) => {
    return await aiController.generateAIResponse(prompt);
});

// PDF Save Dialog Bridge
ipcMain.handle('save-pdf-dialog', async (event, { defaultFilename, pdfBase64 }) => {
    try {
        const defaultPath = path.join(app.getPath('downloads'), defaultFilename || 'Exam_Question_Paper.pdf');
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Save Question Paper PDF',
            defaultPath: defaultPath,
            filters: [
                { name: 'PDF Documents (*.pdf)', extensions: ['pdf'] },
                { name: 'All Files (*.*)', extensions: ['*'] }
            ]
        });
        if (canceled || !filePath) {
            return { success: false, canceled: true };
        }
        const cleanBase64 = (pdfBase64 || '').replace(/^data:application\/pdf;filename=[^;]+;base64,/, '').replace(/^data:application\/pdf;base64,/, '').replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        fs.writeFileSync(filePath, buffer);
        return { success: true, filePath };
    } catch (err) {
        console.error('[MAIN] Error saving PDF file via dialog:', err);
        return { success: false, error: err.message };
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
