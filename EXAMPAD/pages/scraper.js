const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const targetDir = path.resolve(__dirname);
const indexFile = path.join(targetDir, 'index.html');
const domain = 'https://cuiet.codebrigade.in';

async function download(url, filePath) {
    return new Promise((resolve) => {
        const dir = path.dirname(filePath);
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        } catch (e) {
            console.error(`Error creating dir ${dir}: ${e.message}`);
            return resolve();
        }

        const file = fs.createWriteStream(filePath);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    // console.log(`Downloaded: ${url}`);
                    resolve();
                });
            } else {
                // console.error(`Failed ${url}: ${response.statusCode}`);
                file.close();
                fs.unlink(filePath, () => {});
                resolve();
            }
        }).on('error', (err) => {
            console.error(`Error ${url}: ${err.message}`);
            fs.unlink(filePath, () => {});
            resolve();
        });
    });
}

function extractUrls(content) {
    const regex = /https:\/\/cuiet\.codebrigade\.in\/[\w\/\.\-\?\=\&\%]+/g;
    return [...new Set(content.match(regex) || [])];
}

async function run() {
    if (!fs.existsSync(indexFile)) {
        console.error("index.html not found!");
        return;
    }
    const html = fs.readFileSync(indexFile, 'utf8');
    let allUrls = new Set(extractUrls(html));
    console.log(`Found ${allUrls.size} distinct URLs in index.html.`);

    const processedUrls = new Set();
    const urlsToProcess = Array.from(allUrls);

    while (urlsToProcess.length > 0) {
        const url = urlsToProcess.shift();
        if (processedUrls.has(url)) continue;
        processedUrls.add(url);

        if (url.includes('logout') || url.includes('/load') || url.includes('checkInactive')) continue;

        const urlObj = new URL(url);
        const relativePath = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
        const localPath = path.join(targetDir, relativePath);

        await download(url, localPath);

        if (localPath.endsWith('.css') && fs.existsSync(localPath)) {
            const cssContent = fs.readFileSync(localPath, 'utf8');
            const cssRegex = /url\(["']?([^"']+)["']?\)/g;
            let match;
            while ((match = cssRegex.exec(cssContent)) !== null) {
                let assetPath = match[1];
                if (!assetPath.startsWith('http') && !assetPath.startsWith('data:')) {
                    try {
                        const absoluteUrl = new URL(assetPath, url).toString();
                        if (absoluteUrl.startsWith(domain) && !processedUrls.has(absoluteUrl)) {
                            urlsToProcess.push(absoluteUrl);
                            allUrls.add(absoluteUrl);
                        }
                    } catch (e) {}
                }
            }
        }
    }

    console.log(`Total assets processed: ${processedUrls.size}`);

    let newHtml = html;
    // Sort URLs by length descending to avoid partial replacements
    const sortedUrls = Array.from(allUrls).sort((a, b) => b.length - a.length);
    for (const url of sortedUrls) {
        const urlObj = new URL(url);
        const relativePath = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
        newHtml = newHtml.split(url).join(relativePath);
    }
    fs.writeFileSync(indexFile, newHtml);
    // Also save as ChitkaraUniversity.html as requested in the buffer name
    fs.writeFileSync(path.join(targetDir, 'ChitkaraUniversity.html'), newHtml);
    console.log('Localization complete.');
}

run();
