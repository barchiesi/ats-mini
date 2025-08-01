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

        let status = JSON.parse("{\"ip\":\"10.1.1.1\",\"ssid\":\"ATS-Mini\",\"mac\":\"98:A3:16:C1:DA:9C\",\"version\":\"F/W: v2.28d Jul 27 2025\",\"bandIdx\":0,\"freq\":94200000,\"mode\":\"FM\",\"rssi\":52,\"snr\":24,\"battery\":3.937066,\"stepIdx\":2,\"bandwidthIdx\":0,\"agc\":true,\"volume\":35,\"squelch\":0,\"rds\":{\"piCode\":\"5241\",\"stationName\":\" VIRGIN \",\"radioText\":\"Virgin Radio \\\"Style Rock\\\"\",\"programInfo\":\"Rock Music\"}}")
        const memory = JSON.parse("[{\"id\":0,\"freq\":9.42e7,\"band\":\"VHF\",\"mode\":\"FM\",\"name\":\" VIRGIN \"},{\"id\":1,\"freq\":9.96e7,\"band\":\"VHF\",\"mode\":\"FM\",\"name\":\"\"},{},{\"id\":3,\"freq\":7350,\"band\":\"40M\",\"mode\":\"LSB\",\"name\":\"\"},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]");
        let config = JSON.parse("{\"username\":\"\",\"password\":\"\",\"wifissid1\":\"\",\"wifipass1\":\"\",\"wifissid2\":\"\",\"wifipass2\":\"\",\"wifissid3\":\"\",\"wifipass3\":\"\",\"brightness\":130,\"calibration\":0,\"rdsModeIdx\":6,\"utcOffsetIdx\":10,\"fmRegionIdx\":0,\"themeIdx\":0,\"uiLayoutIdx\":0,\"zoomMenu\":false,\"scrollDirection\":1,\"sleepModeIdx\":0,\"wifiModeIdx\":3}")
        server.middlewares.use('/api', (req, res, next) => {
          if (!req.url) {
            return;
          }

          if (req.url === '/status') {
            if (req.method === 'GET') {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(status));

            } else if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  const jsonBody = JSON.parse(body);
                  status = {...status, ...jsonBody};
                  if (!jsonBody.agc && 'attenuation' in jsonBody) {
                    status.agc = false;
                    status.attenuation = jsonBody.attenuation;
                  } else if (jsonBody.agc) {
                    status.agc = true;
                    delete status.attenuation
                  }
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(status));
                } catch (error) {
                  console.error(error)
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({status: 'error', message: 'Invalid JSON format'}));
                }
              });
            }

          } else if (req.method === 'GET' && req.url === '/statusOptions') {
            res.setHeader('Content-Type', 'application/json');
            res.end("{\"bands\":[{\"id\":0,\"bandName\":\"VHF\",\"bandType\":0,\"bandMode\":0,\"minimumFreq\":64000000,\"maximumFreq\":108000000,\"currentFreq\":94200000,\"currentStepIdx\":2,\"bandwidthIdx\":0,\"bandCal\":0},{\"id\":1,\"bandName\":\"ALL\",\"bandType\":2,\"bandMode\":3,\"minimumFreq\":150000,\"maximumFreq\":30000000,\"currentFreq\":15000000,\"currentStepIdx\":1,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":2,\"bandName\":\"11M\",\"bandType\":2,\"bandMode\":3,\"minimumFreq\":25600000,\"maximumFreq\":26100000,\"currentFreq\":25850000,\"currentStepIdx\":1,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":3,\"bandName\":\"13M\",\"bandType\":2,\"bandMode\":3,\"minimumFreq\":21500000,\"maximumFreq\":21900000,\"currentFreq\":21650000,\"currentStepIdx\":1,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":4,\"bandName\":\"15M\",\"bandType\":2,\"bandMode\":3,\"minimumFreq\":18900000,\"maximumFreq\":19100000,\"currentFreq\":18950000,\"currentStepIdx\":1,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":5,\"bandName\":\"16M\",\"bandType\":2,\"bandMode\":3,\"minimumFreq\":17400000,\"maximumFreq\":18100000,\"currentFreq\":17650000,\"currentStepIdx\":1,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":6,\"bandName\":\"19M\",\"bandType\":2,\"bandMode\":3,\"minimumFreq\":15100000,\"maximumFreq\":15900000,\"currentFreq\":15450000,\"currentStepIdx\":1,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":7,\"bandName\":\"22M\",\"bandType\":2,\"bandMode\":3,\"minimumFreq\":13500000,\"maximumFreq\":13900000,\"currentFreq\":13650000,\"currentStepIdx\":1,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":8,\"bandName\":\"25M\",\"bandType\":2,\"bandMode\":3,\"minimumFreq\":11000000,\"maximumFreq\":13000000,\"currentFreq\":11850000,\"currentStepIdx\":1,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":9,\"bandName\":\"31M\",\"bandType\":2,\"bandMode\":3,\"minimumFreq\":9000000,\"maximumFreq\":11000000,\"currentFreq\":9650000,\"currentStepIdx\":1,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":10,\"bandName\":\"41M\",\"bandType\":2,\"bandMode\":3,\"minimumFreq\":7000000,\"maximumFreq\":9000000,\"currentFreq\":7300000,\"currentStepIdx\":1,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":11,\"bandName\":\"49M\",\"bandType\":2,\"bandMode\":3,\"minimumFreq\":5000000,\"maximumFreq\":7000000,\"currentFreq\":6000000,\"currentStepIdx\":1,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":12,\"bandName\":\"60M\",\"bandType\":2,\"bandMode\":3,\"minimumFreq\":4000000,\"maximumFreq\":5100000,\"currentFreq\":4950000,\"currentStepIdx\":1,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":13,\"bandName\":\"75M\",\"bandType\":2,\"bandMode\":3,\"minimumFreq\":3500000,\"maximumFreq\":4000000,\"currentFreq\":3950000,\"currentStepIdx\":1,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":14,\"bandName\":\"90M\",\"bandType\":2,\"bandMode\":3,\"minimumFreq\":3000000,\"maximumFreq\":3500000,\"currentFreq\":3300000,\"currentStepIdx\":1,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":15,\"bandName\":\"MW3\",\"bandType\":1,\"bandMode\":3,\"minimumFreq\":1700000,\"maximumFreq\":3500000,\"currentFreq\":2500000,\"currentStepIdx\":1,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":16,\"bandName\":\"MW2\",\"bandType\":1,\"bandMode\":3,\"minimumFreq\":495000,\"maximumFreq\":1701000,\"currentFreq\":783000,\"currentStepIdx\":2,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":17,\"bandName\":\"MW1\",\"bandType\":1,\"bandMode\":3,\"minimumFreq\":150000,\"maximumFreq\":1800000,\"currentFreq\":810000,\"currentStepIdx\":3,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":18,\"bandName\":\"160M\",\"bandType\":1,\"bandMode\":1,\"minimumFreq\":1800000,\"maximumFreq\":2000000,\"currentFreq\":1900000,\"currentStepIdx\":5,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":19,\"bandName\":\"80M\",\"bandType\":2,\"bandMode\":1,\"minimumFreq\":3500000,\"maximumFreq\":4000000,\"currentFreq\":3800000,\"currentStepIdx\":5,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":20,\"bandName\":\"40M\",\"bandType\":2,\"bandMode\":1,\"minimumFreq\":7000000,\"maximumFreq\":7300000,\"currentFreq\":7150000,\"currentStepIdx\":5,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":21,\"bandName\":\"30M\",\"bandType\":2,\"bandMode\":1,\"minimumFreq\":10000000,\"maximumFreq\":10200000,\"currentFreq\":10125000,\"currentStepIdx\":5,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":22,\"bandName\":\"20M\",\"bandType\":2,\"bandMode\":2,\"minimumFreq\":14000000,\"maximumFreq\":14400000,\"currentFreq\":14100000,\"currentStepIdx\":5,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":23,\"bandName\":\"17M\",\"bandType\":2,\"bandMode\":2,\"minimumFreq\":18000000,\"maximumFreq\":18200000,\"currentFreq\":18115000,\"currentStepIdx\":5,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":24,\"bandName\":\"15M\",\"bandType\":2,\"bandMode\":2,\"minimumFreq\":21000000,\"maximumFreq\":21500000,\"currentFreq\":21225000,\"currentStepIdx\":5,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":25,\"bandName\":\"12M\",\"bandType\":2,\"bandMode\":2,\"minimumFreq\":24800000,\"maximumFreq\":25000000,\"currentFreq\":24940000,\"currentStepIdx\":5,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":26,\"bandName\":\"10M\",\"bandType\":2,\"bandMode\":2,\"minimumFreq\":28000000,\"maximumFreq\":29700000,\"currentFreq\":28500000,\"currentStepIdx\":5,\"bandwidthIdx\":4,\"bandCal\":0},{\"id\":27,\"bandName\":\"CB\",\"bandType\":2,\"bandMode\":3,\"minimumFreq\":25000000,\"maximumFreq\":30000000,\"currentFreq\":27135000,\"currentStepIdx\":0,\"bandwidthIdx\":4,\"bandCal\":0}],\"steps\":{\"fm\":[{\"id\":0,\"step\":1,\"desc\":\"10k\",\"spacing\":1},{\"id\":1,\"step\":5,\"desc\":\"50k\",\"spacing\":5},{\"id\":2,\"step\":10,\"desc\":\"100k\",\"spacing\":10},{\"id\":3,\"step\":20,\"desc\":\"200k\",\"spacing\":20},{\"id\":4,\"step\":100,\"desc\":\"1M\",\"spacing\":10}],\"ssb\":[{\"id\":0,\"step\":10,\"desc\":\"10\",\"spacing\":1},{\"id\":1,\"step\":25,\"desc\":\"25\",\"spacing\":1},{\"id\":2,\"step\":50,\"desc\":\"50\",\"spacing\":1},{\"id\":3,\"step\":100,\"desc\":\"100\",\"spacing\":1},{\"id\":4,\"step\":500,\"desc\":\"500\",\"spacing\":1},{\"id\":5,\"step\":1000,\"desc\":\"1k\",\"spacing\":1},{\"id\":6,\"step\":5000,\"desc\":\"5k\",\"spacing\":5},{\"id\":7,\"step\":9000,\"desc\":\"9k\",\"spacing\":9},{\"id\":8,\"step\":10000,\"desc\":\"10k\",\"spacing\":10}],\"am\":[{\"id\":0,\"step\":1,\"desc\":\"1k\",\"spacing\":1},{\"id\":1,\"step\":5,\"desc\":\"5k\",\"spacing\":5},{\"id\":2,\"step\":9,\"desc\":\"9k\",\"spacing\":9},{\"id\":3,\"step\":10,\"desc\":\"10k\",\"spacing\":10},{\"id\":4,\"step\":50,\"desc\":\"50k\",\"spacing\":10},{\"id\":5,\"step\":100,\"desc\":\"100k\",\"spacing\":10},{\"id\":6,\"step\":1000,\"desc\":\"1M\",\"spacing\":10}]},\"bandwidths\":{\"fm\":[{\"id\":0,\"idx\":0,\"desc\":\"Auto\"},{\"id\":1,\"idx\":1,\"desc\":\"110k\"},{\"id\":2,\"idx\":2,\"desc\":\"84k\"},{\"id\":3,\"idx\":3,\"desc\":\"60k\"},{\"id\":4,\"idx\":4,\"desc\":\"40k\"}],\"ssb\":[{\"id\":0,\"idx\":4,\"desc\":\"0.5k\"},{\"id\":1,\"idx\":5,\"desc\":\"1.0k\"},{\"id\":2,\"idx\":0,\"desc\":\"1.2k\"},{\"id\":3,\"idx\":1,\"desc\":\"2.2k\"},{\"id\":4,\"idx\":2,\"desc\":\"3.0k\"},{\"id\":5,\"idx\":3,\"desc\":\"4.0k\"}],\"am\":[{\"id\":0,\"idx\":4,\"desc\":\"1.0k\"},{\"id\":1,\"idx\":5,\"desc\":\"1.8k\"},{\"id\":2,\"idx\":3,\"desc\":\"2.0k\"},{\"id\":3,\"idx\":6,\"desc\":\"2.5k\"},{\"id\":4,\"idx\":2,\"desc\":\"3.0k\"},{\"id\":5,\"idx\":1,\"desc\":\"4.0k\"},{\"id\":6,\"idx\":0,\"desc\":\"6.0k\"}]}}");

          } else if (req.url.startsWith('/memory')) {
            if (req.method === 'GET') {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(memory));
            } else if (req.method === 'POST') {
              if (req.url?.endsWith('/tune')) {
                res.end()
              } else if (req.url?.endsWith('/storeCurrent')) {
                let memoryIdxStr = req.url.substring(8) ;
                memoryIdxStr = memoryIdxStr.substring(0, memoryIdxStr.length - 5)
                const memoryIdx = parseInt(memoryIdxStr);
                memory[memoryIdx].id = memoryIdx;
                memory[memoryIdx].freq = status.freq;
                memory[memoryIdx].mode = status.mode;
                memory[memoryIdx].name = (status.rds?.stationName ?? '').substring(0, 9)
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(memory));
              }
            } else if (req.method === 'DELETE') {
              const memoryIdx = Number(req.url.substring(8));
              memory[memoryIdx] = {}
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(memory));
            }

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
            res.end("{\"rdsModes\":[{\"id\":0,\"mode\":1,\"desc\":\"PS\"},{\"id\":1,\"mode\":3,\"desc\":\"PS+CT\"},{\"id\":2,\"mode\":5,\"desc\":\"PS+PI\"},{\"id\":3,\"mode\":7,\"desc\":\"PS+PI+CT\"},{\"id\":4,\"mode\":29,\"desc\":\"ALL-CT (EU)\"},{\"id\":5,\"mode\":61,\"desc\":\"ALL-CT (US)\"},{\"id\":6,\"mode\":31,\"desc\":\"ALL (EU)\"},{\"id\":7,\"mode\":63,\"desc\":\"ALL (US)\"}],\"UTCOffsets\":[{\"id\":0,\"offset\":-32,\"desc\":\"UTC-8\",\"city\":\"Fairbanks\"},{\"id\":1,\"offset\":-28,\"desc\":\"UTC-7\",\"city\":\"San Francisco\"},{\"id\":2,\"offset\":-24,\"desc\":\"UTC-6\",\"city\":\"Denver\"},{\"id\":3,\"offset\":-20,\"desc\":\"UTC-5\",\"city\":\"Houston\"},{\"id\":4,\"offset\":-16,\"desc\":\"UTC-4\",\"city\":\"New York\"},{\"id\":5,\"offset\":-12,\"desc\":\"UTC-3\",\"city\":\"Rio de Janeiro\"},{\"id\":6,\"offset\":-8,\"desc\":\"UTC-2\",\"city\":\"Sandwich Islands\"},{\"id\":7,\"offset\":-4,\"desc\":\"UTC-1\",\"city\":\"Nuuk\"},{\"id\":8,\"offset\":0,\"desc\":\"UTC+0\",\"city\":\"Reykjavik\"},{\"id\":9,\"offset\":4,\"desc\":\"UTC+1\",\"city\":\"London\"},{\"id\":10,\"offset\":8,\"desc\":\"UTC+2\",\"city\":\"Berlin\"},{\"id\":11,\"offset\":12,\"desc\":\"UTC+3\",\"city\":\"Moscow\"},{\"id\":12,\"offset\":16,\"desc\":\"UTC+4\",\"city\":\"Yerevan\"},{\"id\":13,\"offset\":20,\"desc\":\"UTC+5\",\"city\":\"Astana\"},{\"id\":14,\"offset\":22,\"desc\":\"UTC+5:30\",\"city\":\"Kolkata\"},{\"id\":15,\"offset\":24,\"desc\":\"UTC+6\",\"city\":\"Omsk\"},{\"id\":16,\"offset\":28,\"desc\":\"UTC+7\",\"city\":\"Novosibirsk\"},{\"id\":17,\"offset\":32,\"desc\":\"UTC+8\",\"city\":\"Beijing\"},{\"id\":18,\"offset\":36,\"desc\":\"UTC+9\",\"city\":\"Yakutsk\"},{\"id\":19,\"offset\":40,\"desc\":\"UTC+10\",\"city\":\"Vladivostok\"}],\"fmRegions\":[{\"id\":0,\"value\":1,\"desc\":\"EU/JP/AU\"},{\"id\":1,\"value\":2,\"desc\":\"US\"}],\"themes\":[{\"id\":0,\"name\":\"Default\"},{\"id\":1,\"name\":\"Bluesky\"},{\"id\":2,\"name\":\"eInk\"},{\"id\":3,\"name\":\"Pager\"},{\"id\":4,\"name\":\"Orange\"},{\"id\":5,\"name\":\"Night\"},{\"id\":6,\"name\":\"Phosphor\"},{\"id\":7,\"name\":\"Space\"},{\"id\":8,\"name\":\"Magenta\"}],\"uiLayouts\":[{\"id\":0,\"name\":\"Default\"},{\"id\":1,\"name\":\"S-Meter\"}],\"sleepModes\":[{\"id\":0,\"name\":\"Locked\"},{\"id\":1,\"name\":\"Unlocked\"},{\"id\":2,\"name\":\"CPU Sleep\"}],\"wifiModes\":[{\"id\":0,\"name\":\"Off\"},{\"id\":1,\"name\":\"AP Only\"},{\"id\":2,\"name\":\"AP+Connect\"},{\"id\":3,\"name\":\"Connect\"},{\"id\":4,\"name\":\"Sync Only\"}]}");

          } else {
            next();
          }
        });
      }
    },
  ]
});
