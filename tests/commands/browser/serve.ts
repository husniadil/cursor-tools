import { join } from 'node:path';

const port = process.env['PORT'] || 3000;
Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    const filePath = url.pathname === '/' ? 'console-log.html' : url.pathname.slice(1);
    const fullPath = join(import.meta.dir, filePath);
    const file = Bun.file(fullPath);
    
    try {
      if (await file.exists()) {
        return new Response(file);
      }
      return new Response('404 Not Found', { status: 404 });
    } catch (error) {
      console.error(`Error serving ${filePath}:`, error);
      return new Response('500 Internal Server Error', { status: 500 });
    }
  }
});

console.log(`Server is running on http://localhost:${port}`);