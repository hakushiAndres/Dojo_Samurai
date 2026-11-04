#!/usr/bin/env node
'use strict';

// Local comparison: built V2 at / and committed gallery at /actual/.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT || 4173);
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.ico': 'image/x-icon' };
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('Ejecuta npm.cmd run build antes de iniciar la comparación.');
// Capture only the three committed source files; never change the working tree.
const baseline = Object.fromEntries(['index.html', 'script.js', 'styles.css'].map(file => [file, execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, 'show', `HEAD:${file}`], { cwd: root, maxBuffer: 4 * 1024 * 1024 })]));
const server = http.createServer((request, response) => {
    try {
        if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
        const url = new URL(request.url, 'http://localhost');
        let name = decodeURIComponent(url.pathname);
        const comparison = name.startsWith('/actual/');
        if (comparison) name = name.slice('/actual'.length);
        if (name.endsWith('/')) name += 'index.html';
        const relative = name.replace(/^\/+/, '');
        const file = path.resolve(dist, relative);
        if (!file.startsWith(dist + path.sep) || relative.includes('assets/galeria/web/')) { response.writeHead(404); response.end(); return; }
        const body = comparison && Object.hasOwn(baseline, relative) ? baseline[relative] : fs.readFileSync(file);
        response.writeHead(200, { 'Content-Type': contentTypes[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Content-Length': body.length });
        response.end(request.method === 'HEAD' ? undefined : body);
    } catch { response.writeHead(404); response.end('Not found'); }
});
server.listen(port, '127.0.0.1', () => {
    console.log(`V2: http://127.0.0.1:${port}/#gallery`);
    console.log(`Actual (HEAD): http://127.0.0.1:${port}/actual/#gallery`);
    console.log('Solo local. Ctrl+C para detener.');
});
