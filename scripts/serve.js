import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('app/src/main/assets/web');
http.createServer((req,res) => {
 const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
 const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
 if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
 fs.readFile(file, (err,data) => {
  res.writeHead(err ? 404 : 200, { 'Content-Type': file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html' });
  res.end(err ? 'Not found' : data);
 });
}).listen(4173, '127.0.0.1', () => console.log('Inkoku: http://127.0.0.1:4173'));