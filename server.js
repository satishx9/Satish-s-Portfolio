import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, resolve, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

function loadEnvFile() {
  const envPath = join(__dirname, '.env');
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const { default: contactHandler } = await import('./api/contact.js');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
};

function adaptResponse(nodeRes) {
  let statusCode = 200;
  const api = {
    setHeader(name, value) {
      nodeRes.setHeader(name, value);
      return api;
    },
    status(code) {
      statusCode = code;
      return api;
    },
    end(chunk) {
      if (!nodeRes.headersSent) nodeRes.writeHead(statusCode);
      nodeRes.end(chunk ?? '');
    },
    json(obj) {
      if (!nodeRes.headersSent) {
        nodeRes.setHeader('Content-Type', 'application/json; charset=utf-8');
        nodeRes.writeHead(statusCode);
      }
      nodeRes.end(JSON.stringify(obj));
    },
  };
  return api;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function safePath(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  if (!p) p = 'index.html';
  const full = resolve(__dirname, p);
  const relToRoot = relative(__dirname, full);
  if (relToRoot.startsWith('..') || relToRoot === '..') return null;
  return full;
}

const server = createServer(async (req, res) => {
  const urlPath = req.url || '/';

  if (req.method === 'POST' && urlPath === '/api/contact') {
    const adapted = adaptResponse(res);
    try {
      const body = await readBody(req);
      const fauxReq = { method: req.method, body };
      await contactHandler(fauxReq, adapted);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    }
    return;
  }

  let file = safePath(urlPath === '/' ? '/index.html' : urlPath);
  if (!file || !existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  try {
    if (!statSync(file).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  res.end(readFileSync(file));
});

function startServer(port) {
  server.listen(port, '0.0.0.0', () => {
    console.log(`Open http://localhost:${port} or http://127.0.0.1:${port}`);
    if (!process.env.RESEND_API_KEY) {
      console.warn(
        'RESEND_API_KEY is not set. Add it to a .env file in this folder for the contact form to send email.'
      );
    }
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
