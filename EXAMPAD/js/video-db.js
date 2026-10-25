// IndexedDB wrapper for saving and loading large video blobs locally
window.VideoDB = {
    db: null,
    init: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("TestpadVideosDB", 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if(!db.objectStoreNames.contains("videos")) {
                    db.createObjectStore("videos");
                }
            };
            request.onsuccess = (e) => {
                window.VideoDB.db = e.target.result;
                resolve();
            };
            request.onerror = (e) => reject(e);
        });
    },
    saveVideo: function(id, blob) {
        return new Promise((resolve, reject) => {
            if(!window.VideoDB.db) return reject("DB not initialized");
            const tx = window.VideoDB.db.transaction("videos", "readwrite");
            const store = tx.objectStore("videos");
            const request = store.put(blob, id);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e);
        });
    },
    getVideo: function(id) {
        return new Promise((resolve, reject) => {
            if(!window.VideoDB.db) return reject("DB not initialized");
            const tx = window.VideoDB.db.transaction("videos", "readonly");
            const store = tx.objectStore("videos");
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e);
        });
    }
};

// Auto-initialize
window.VideoDB.init().catch(console.error);
