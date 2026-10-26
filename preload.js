const { contextBridge, ipcRenderer } = require('electron');

const proctorBridge = {
    // Listen for events from the system (focus lost, keyboard blocks)
    onSystemEvent: (callback) => ipcRenderer.on('proctor-event', (event, data) => callback(data)),

    // Command the system to take a screenshot
    triggerAuditShot: (filename) => ipcRenderer.invoke('take-forced-screenshot', filename),

    // Window Controls
    minimize: () => ipcRenderer.send('window-control', 'minimize'),
    maximize: () => ipcRenderer.send('window-control', 'maximize'),
    close: () => ipcRenderer.send('window-control', 'close'),
    setKioskMode: (enable) => ipcRenderer.send('kiosk-mode', enable),

    // AI Communication via IPC
    askAI: (prompt) => ipcRenderer.invoke('ask-ai', prompt),

    // Deep Linking: Handlers for opening specific exams from browser
    onOpenExam: (callback) => ipcRenderer.on('open-exam-intent', (event, data) => callback(data)),

    // Network & IP Access
    getNetworkInfo: () => ipcRenderer.invoke('get-network-info'),

    // Save PDF File Dialog
    savePdfDialog: (defaultFilename, pdfBase64) => ipcRenderer.invoke('save-pdf-dialog', { defaultFilename, pdfBase64 }),

    // Version Check
    getAppVersion: () => '1.0.0-PROCTOR-CORE'
};

const electronAPI = {
    isElectron: true,
    platform: process.platform,
    versions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron
    },
    minimize: () => ipcRenderer.send('window-control', 'minimize'),
    maximize: () => ipcRenderer.send('window-control', 'maximize'),
    close: () => ipcRenderer.send('window-control', 'close'),
    setKioskMode: (enable) => ipcRenderer.send('kiosk-mode', enable)
};

contextBridge.exposeInMainWorld('proctorBridge', proctorBridge);
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
