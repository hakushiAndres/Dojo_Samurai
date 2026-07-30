const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

console.log('Building static site distribution to dist/...');

// Ensure dist directory exists and is clean
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// List of files and folders to include in dist output
const staticItems = [
    'index.html',
    'styles.css',
    'script.js',
    'robots.txt',
    'sitemap.xml',
    'og-image.jpg',
    'comunicado_oficial_popup.jpg',
    'assets',
    'public'
];

staticItems.forEach(item => {
    const src = path.join(rootDir, item);
    const dest = path.join(distDir, item);

    if (fs.existsSync(src)) {
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
            copyDirSync(src, dest);
        } else {
            fs.copyFileSync(src, dest);
        }
        console.log(`✓ Copied ${item} -> dist/${item}`);
    }
});

function copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log('✅ Static build complete! dist/index.html is ready.');
