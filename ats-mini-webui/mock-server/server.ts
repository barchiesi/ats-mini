import {ServerResponse} from "node:http";
import {Connect} from "vite";

import initialStatus from "./status.json";
import memory from "./memory.json";
import initialConfig from "./config.json";
import configOptions from "./configOptions.json";

let config = initialConfig;

export const mockApi = (req: Connect.IncomingMessage, res: ServerResponse<Connect.IncomingMessage>) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET' && req.url === '/status') {
    res.end(JSON.stringify(initialStatus));

  } else if (req.method === 'GET' && req.url === '/memory') {
    res.end(JSON.stringify(memory));

  } else if (req.url === '/config') {
    if (req.method === 'GET') {
      res.end(JSON.stringify(config));

    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          config = JSON.parse(body);
          res.end(JSON.stringify(config));
        } catch (error) {
          console.error(error)
          res.statusCode = 400;
          res.end(JSON.stringify({status: 'error', message: 'Invalid JSON format'}));
        }
      });
    }

  } else if (req.method === 'GET' && req.url === '/configOptions') {
    res.end(JSON.stringify(configOptions));

  } else {
    res.statusCode = 404;
    res.end();
  }
}
