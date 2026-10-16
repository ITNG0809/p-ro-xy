// Web Proxy Lab - local educational proxy server
// Node.js 18+ recommended (uses the built-in fetch API).

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const HOST = '127.0.0.1';
const PORT = 3000;

// 安全のため、初期状態では学習用の公開サイトだけを許可します。
// 自分のテストサイトを追加したい場合はこの配列を編集してください。
const ALLOWED_HOSTS = new Set([
  'example.com',
  'www.example.com',
  'httpbin.org',
  'www.httpbin.org'
]);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function send(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(body);
}

async function proxyRequest(targetUrl, res) {
  let target;
  try {
    target = new URL(targetUrl);
  } catch {
    return send(res, 400, 'Invalid target URL');
  }

  if (!['http:', 'https:'].includes(target.protocol)) {
    return send(res, 400, 'Only HTTP(S) URLs are supported');
  }

  if (!ALLOWED_HOSTS.has(target.hostname.toLowerCase())) {
    return send(
      res,
      403,
      `This educational proxy only allows: ${[...ALLOWED_HOSTS].join(', ')}\n`
    );
  }

  try {
    const upstream = await fetch(target, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Web-Proxy-Lab/1.0 (educational)'
      }
    });

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await upstream.arrayBuffer());

    res.writeHead(upstream.status, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(buffer);
  } catch (err) {
    send(res, 502, `Upstream request failed: ${err.message}`);
  }
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${HOST}:${PORT}`);

  if (requestUrl.pathname === '/proxy') {
    const target = requestUrl.searchParams.get('url');
    if (!target) return send(res, 400, 'Missing ?url=...');
    return proxyRequest(target, res);
  }

  if (requestUrl.pathname === '/health') {
    return send(res, 200, 'Web Proxy Lab server is running.');
  }

  // Serve the existing single-page UI.
  const requested = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const safePath = path.normalize(requested).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(__dirname, 'public', safePath);

  if (!filePath.startsWith(path.join(__dirname, 'public'))) {
    return send(res, 403, 'Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, 'Not found');
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, MIME[ext] || 'text/html; charset=utf-8');
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Web Proxy Lab: http://${HOST}:${PORT}/`);
  console.log(`Allowed hosts: ${[...ALLOWED_HOSTS].join(', ')}`);
});
