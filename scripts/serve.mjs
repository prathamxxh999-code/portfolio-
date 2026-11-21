import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, extname, resolve, sep } from 'node:path';

const source = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const port = Number(process.env.PORT) || 8765;
const types = {
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2'
};

createServer(async (request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  const path = resolve(source, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (path !== source && !path.startsWith(source + sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const file = await stat(path);
    if (!file.isFile()) throw new Error('Not a file');
    const headers = { 'Content-Type': types[extname(path)] || 'application/octet-stream',
      'Accept-Ranges': 'bytes', 'Content-Length': file.size };
    const range = request.headers.range;
    let start = 0, end = file.size - 1;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match && (match[1] || match[2])) {
        start = match[1] ? Number(match[1]) : Math.max(0, file.size - Number(match[2]));
        end = match[1] && match[2] ? Math.min(end, Number(match[2])) : end;
      } else start = file.size;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= file.size) {
        response.writeHead(416, { 'Content-Range': `bytes */${file.size}` }).end();
        return;
      }
      headers['Content-Length'] = end - start + 1;
      headers['Content-Range'] = `bytes ${start}-${end}/${file.size}`;
    }
    response.writeHead(range ? 206 : 200, headers);
    if (request.method === 'HEAD' || file.size === 0) response.end();
    else createReadStream(path, { start, end }).on('error', () => response.destroy()).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Portfolio preview: http://127.0.0.1:${port}`);
});
