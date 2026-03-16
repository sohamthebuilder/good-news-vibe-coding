import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function rssProxyPlugin(): Plugin {
  return {
    name: 'rss-proxy',
    configureServer(server) {
      server.middlewares.use('/api/rss-proxy', async (req, res) => {
        const parsed = new URL(req.url ?? '', 'http://localhost');
        const target = parsed.searchParams.get('url');
        if (!target) {
          res.statusCode = 400;
          res.end('Missing url parameter');
          return;
        }
        try {
          const upstream = await fetch(target);
          const body = await upstream.text();
          res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'text/xml');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.statusCode = upstream.status;
          res.end(body);
        } catch (err: unknown) {
          res.statusCode = 502;
          res.end('Proxy error: ' + (err instanceof Error ? err.message : String(err)));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), rssProxyPlugin()],
})
