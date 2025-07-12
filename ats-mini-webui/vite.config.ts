import {defineConfig} from 'vite';
import path from 'path';

export default defineConfig({
    root: 'src',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        minify: 'esbuild',
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'src/index.html'),
                memory: path.resolve(__dirname, 'src/memory.html'),
                config: path.resolve(__dirname, 'src/config.html')
            },
        },
    },
    /*
    server: {
        proxy: {
            '/api/info': {
                target: 'http://10.1.1.1',
                changeOrigin: true,
                secure: false
            }
        }
    },
    */
    plugins: [
        {
            name: 'mock-api',
            configureServer(server) {
                server.middlewares.use('/api', (req, res, next) => {
                    console.log(req.url)
                    if (req.method === 'GET' && req.url === '/info') {
                        res.setHeader('Content-Type', 'application/json');
                        res.end("{\"ip\":\"10.1.1.1\",\"ssid\":\"ATS-Mini\",\"mac\":\"98:A3:16:C1:DA:9C\",\"version\":\"F/W: v2.28 Jul 12 2025\",\"band\":\"VHF\",\"frequency\":10400,\"mode\":\"FM\",\"rssi\":32,\"snr\":12,\"battery\":3.83}");
                    } else if (req.method === 'GET' && req.url === '/memory') {
                        res.setHeader('Content-Type', 'application/json');
                        res.end("[{\"freq\":10390,\"band\":\"VHF\",\"mode\":\"FM\"},{},{},{},{},{\"freq\":28500,\"band\":\"10M\",\"mode\":\"USB\"},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]");
                    } else {
                        next();
                    }
                });
            }
        }
    ]
});
