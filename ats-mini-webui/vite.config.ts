import {Connect, defineConfig} from 'vite';
import path from 'path';
import http from 'http';

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
          server.middlewares.use('/writeeeprom', forwardRequest);
          server.middlewares.use('/ats-mini-eeprom.bin', forwardRequest);
          return;
        }

        let config = JSON.parse("{\"username\":\"\",\"password\":\"\",\"wifissid1\":\"\",\"wifipass1\":\"\",\"wifissid2\":\"\",\"wifipass2\":\"\",\"wifissid3\":\"\",\"wifipass3\":\"\",\"utcOffsetIdx\":8,\"themeIdx\":0,\"scrollDirection\":1,\"zoomMenu\":false}")
        server.middlewares.use('/api', (req, res, next) => {
          if (req.method === 'GET' && req.url === '/status') {
            res.setHeader('Content-Type', 'application/json');
            res.end("{\"ip\":\"10.1.1.1\",\"ssid\":\"ATS-Mini\",\"mac\":\"98:A3:16:C1:DA:9C\",\"version\":\"F/W: v2.28d Jul 14 2025\",\"band\":\"VHF\",\"freq\":9420,\"mode\":\"FM\",\"rssi\":48,\"snr\":31,\"battery\":3.98234,\"step\":\"100k\",\"bandwidth\":\"Auto\",\"agc\":true,\"time\":\"15:49\",\"volume\":13,\"softMuteMaxAttIdx\":4,\"rds\":{\"piCode\":\"5241\",\"stationName\":\" VIRGIN \",\"radioText\":\"In onda MGK con CLICHE'\",\"programInfo\":\"Rock Music\"}}");

          } else if (req.method === 'GET' && req.url === '/memory') {
            res.setHeader('Content-Type', 'application/json');
            res.end("[{\"id\":0,\"freq\":10400,\"band\":\"VHF\",\"mode\":\"FM\"},{},{\"id\":2,\"freq\":21650,\"band\":\"13M\",\"mode\":\"AM\"},{},{\"id\":4,\"freq\":3950,\"band\":\"75M\",\"mode\":\"AM\"},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]");

          } else if (req.url === '/config') {
            if (req.method === 'GET') {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(config));
            } else if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  config = JSON.parse(body);
                  // Here you would typically save the newConfig to a database or file
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(config));
                } catch (error) {
                  console.error(error)
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({status: 'error', message: 'Invalid JSON format'}));
                }
              });
            }

          } else if (req.method === 'GET' && req.url === '/configOptions') {
            res.setHeader('Content-Type', 'application/json');
            res.end("{\"themes\":[{\"id\":0,\"name\":\"Default\"},{\"id\":1,\"name\":\"Bluesky\"},{\"id\":2,\"name\":\"eInk\"},{\"id\":3,\"name\":\"Pager\"},{\"id\":4,\"name\":\"Orange\"},{\"id\":5,\"name\":\"Night\"},{\"id\":6,\"name\":\"Phosphor\"},{\"id\":7,\"name\":\"Space\"},{\"id\":8,\"name\":\"Magenta\"}],\"UTCOffsets\":[{\"id\":0,\"offset\":-32,\"desc\":\"UTC-8\",\"city\":\"Fairbanks\"},{\"id\":1,\"offset\":-28,\"desc\":\"UTC-7\",\"city\":\"San Francisco\"},{\"id\":2,\"offset\":-24,\"desc\":\"UTC-6\",\"city\":\"Denver\"},{\"id\":3,\"offset\":-20,\"desc\":\"UTC-5\",\"city\":\"Houston\"},{\"id\":4,\"offset\":-16,\"desc\":\"UTC-4\",\"city\":\"New York\"},{\"id\":5,\"offset\":-12,\"desc\":\"UTC-3\",\"city\":\"Rio de Janeiro\"},{\"id\":6,\"offset\":-8,\"desc\":\"UTC-2\",\"city\":\"Sandwich Islands\"},{\"id\":7,\"offset\":-4,\"desc\":\"UTC-1\",\"city\":\"Nuuk\"},{\"id\":8,\"offset\":0,\"desc\":\"UTC+0\",\"city\":\"Reykjavik\"},{\"id\":9,\"offset\":4,\"desc\":\"UTC+1\",\"city\":\"London\"},{\"id\":10,\"offset\":8,\"desc\":\"UTC+2\",\"city\":\"Berlin\"},{\"id\":11,\"offset\":12,\"desc\":\"UTC+3\",\"city\":\"Moscow\"},{\"id\":12,\"offset\":16,\"desc\":\"UTC+4\",\"city\":\"Yerevan\"},{\"id\":13,\"offset\":20,\"desc\":\"UTC+5\",\"city\":\"Astana\"},{\"id\":14,\"offset\":22,\"desc\":\"UTC+5:30\",\"city\":\"Kolkata\"},{\"id\":15,\"offset\":24,\"desc\":\"UTC+6\",\"city\":\"Omsk\"},{\"id\":16,\"offset\":28,\"desc\":\"UTC+7\",\"city\":\"Novosibirsk\"},{\"id\":17,\"offset\":32,\"desc\":\"UTC+8\",\"city\":\"Beijing\"},{\"id\":18,\"offset\":36,\"desc\":\"UTC+9\",\"city\":\"Yakutsk\"},{\"id\":19,\"offset\":40,\"desc\":\"UTC+10\",\"city\":\"Vladivostok\"}]}");
          } else {
            next();
          }
        });
      }
    },
  ]
});
