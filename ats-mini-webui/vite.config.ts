import {Connect, defineConfig} from 'vite';
import path from 'path';
import http from 'http';
import {mockApi} from "./mock-server/server";

const FORWARD_API_HOST = 'http://10.1.1.1'


const forwardRequest: Connect.NextHandleFunction = async (req, res) => {
  const targetUrl = `${FORWARD_API_HOST}${req.originalUrl}`;
  const proxyReq = http.request(targetUrl, {
    method: req.method,
    headers: req.headers
  }, (httpRes) => {
    res.writeHead(httpRes.statusCode ?? 200, httpRes.headers);
    httpRes.pipe(res, {end: true});
  });
  req.pipe(proxyReq, {end: true});
  proxyReq.on('error', () => {
    res.statusCode = 502;
    res.end('Proxy error');
  });
}

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        status: path.resolve(__dirname, 'src/index.html'),
        memory: path.resolve(__dirname, 'src/memory.html'),
        config: path.resolve(__dirname, 'src/config.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        dir: path.resolve(__dirname, 'dist'),
      }
    },
  },
  plugins: [
    {
      name: 'html-rewrite',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/memory') {
            req.url = '/memory.html';
          } else if (req.url === '/config') {
            req.url = '/config.html';
          }
          next();
        });
      }
    },
    {
      name: 'mock-api',
      configureServer(server) {
        if (process.env.MOCK_API_MODE !== '1') {
          server.middlewares.use('/api', forwardRequest);
        } else {
          server.middlewares.use('/api', mockApi);
        }
      }
    },
  ]
});
