const http = require('http');
const fs = require('fs');
const path = require('path');
const port = process.env.PORT || 4173;
const dist = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  let filePath = path.join(dist, req.url === '/' ? 'index.html' : req.url);

  fs.stat(filePath, (err, stat) => {
    if (err || stat.isDirectory()) {
      fs.readFile(path.join(dist, 'index.html'), (err2, content) => {
        if (err2) { res.writeHead(500); res.end('Error'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      });
      return;
    }
    const ext = path.extname(filePath);
    fs.readFile(filePath, (err, content) => {
      if (err) { res.writeHead(500); res.end('Error'); return; }
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(content);
    });
  });
}).listen(port, () => {
  console.log(`Frontend running on port ${port}`);
});
