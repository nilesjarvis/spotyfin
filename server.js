// Minimal production static server for the Jelly Spotify SPA (with SPA fallback).
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, 'build');
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 5173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json'
};

function send(req, res, filePath, status = 200, cache = true) {
  const ext = path.extname(filePath).toLowerCase();
  const html = ext === '.html' || filePath.endsWith('index.html');
  res.writeHead(status, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': html ? 'no-cache' : (cache ? 'public, max-age=3600' : 'no-cache'),
    'X-Content-Type-Options': 'nosniff'
  });
  createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  // CORS (so a client on the LAN can hit Jellyfin on this host is NOT needed here,
  // but allow it harmlessly for flexibility)
  res.setHeader('Access-Control-Allow-Origin', '*');

  let urlPath;
  try { urlPath = decodeURIComponent((req.url || '/').split('?')[0]); }
  catch { urlPath = '/'; }

  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  let filePath = path.resolve(ROOT, rel);

  // Security: never allow escaping the build directory
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403); return res.end('Forbidden');
  }

  let isFile = false;
  try { isFile = statSync(filePath).isFile(); } catch { isFile = false; }

  if (isFile) {
    return send(req, res, filePath);
  }

  // If it looks like an asset request with an extension, it's a real 404.
  if (path.extname(rel)) {
    res.writeHead(404); return res.end('Not Found');
  }

  // Otherwise: SPA fallback to index.html (deep links + client-side routing)
  const index = path.join(ROOT, 'index.html');
  if (existsSync(index)) return send(req, res, index);
  res.writeHead(404); return res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`[jelly-spotify] serving ${ROOT}`);
  console.log(`[jelly-spotify] http://localhost:${PORT}`);
  console.log(`[jelly-spotify] LAN: http://${lanHosts() || '?.'}:${PORT}`);
});

function lanHosts() {
  const ifs = os.networkInterfaces();
  const list = [];
  for (const name of Object.keys(ifs)) {
    for (const a of ifs[name] || []) {
      if (a.family === 'IPv4' && !a.internal) list.push(a.address);
    }
  }
  return list.length ? [...new Set(list)].join(', ') : '?';
}
