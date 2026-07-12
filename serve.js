const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const port = 4173;
const host = '127.0.0.1';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '');
    let filePath = path.join(root, safePath === '/' ? 'index.html' : safePath);

    if (!path.extname(filePath)) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        const fallback = path.join(root, 'index.html');
        fs.readFile(fallback, (fallbackErr, fallbackData) => {
          if (fallbackErr) {
            send(res, 404, 'Not found');
            return;
          }
          send(res, 200, fallbackData, 'text/html; charset=utf-8');
        });
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      send(res, 200, data, contentTypes[ext] || 'application/octet-stream');
    });
  })
  .listen(port, host, () => {
    console.log(`Preview running at http://${host}:${port}/`);
  });
