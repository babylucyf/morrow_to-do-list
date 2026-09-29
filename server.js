const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
http.createServer((request, response) => {
  const requested = request.url === '/' ? '/index.html' : request.url.split('?')[0];
  const file = path.resolve(root, `.${requested}`);
  if (!file.startsWith(root)) { response.writeHead(403); return response.end('Forbidden'); }
  fs.readFile(file, (error, content) => { if (error) { response.writeHead(404); return response.end('Not found'); } response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'text/plain' }); response.end(content); });
}).listen(3000, () => console.log('Morrow is running at http://localhost:3000'));
