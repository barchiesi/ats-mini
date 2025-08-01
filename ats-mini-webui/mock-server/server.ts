import {ServerResponse} from "node:http";
import {Connect} from "vite";

import initialStatus from "./status.json";
import statusOptions from "./statusOptions.json";
import memory from "./memory.json";
import memoryOptions from "./memoryOptions.json";
import initialConfig from "./config.json";
import configOptions from "./configOptions.json";

let status = initialStatus;
let config = initialConfig;

export const mockApi = (req: Connect.IncomingMessage, res: ServerResponse<Connect.IncomingMessage>) => {
  if (!req.url) {
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/status') {
    if (req.method === 'GET') {
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
          res.end(JSON.stringify(status));
        } catch (error) {
          console.error(error)
          res.statusCode = 400;
          res.end(JSON.stringify({status: 'error', message: 'Invalid JSON format'}));
        }
      });
    }

  } else if (req.method === 'GET' && req.url === '/statusOptions') {
    res.end(JSON.stringify(statusOptions));

  } else if (req.url.startsWith('/memory')) {
    if (req.method === 'GET') {
      if (req.url === '/memory') {
        res.end(JSON.stringify(memory));

      } else if (req.url === '/memoryOptions') {
        res.end(JSON.stringify(memoryOptions));
      }

    } else if (req.method === 'POST') {
      if (req.url?.endsWith('/tune')) {
        res.end()

      } else if (req.url?.endsWith('/storeCurrent')) {
        let memoryIdxStr = req.url.substring(8);
        memoryIdxStr = memoryIdxStr.substring(0, memoryIdxStr.length - 5)
        const memoryIdx = parseInt(memoryIdxStr);
        memory[memoryIdx].id = memoryIdx;
        memory[memoryIdx].freq = status.freq;
        memory[memoryIdx].modeIdx = status.modeIdx;
        memory[memoryIdx].bandIdx = status.bandIdx;
        memory[memoryIdx].name = (status.rds?.stationName ?? '').substring(0, 9)
        res.end(JSON.stringify(memory));

      } else if (req.url?.match(/\/memory\/\d+$/)) {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const updatedMemory = JSON.parse(body);
            memory[updatedMemory.id] = updatedMemory;
            res.end(JSON.stringify(memory));
          } catch (error) {
            console.error(error)
            res.statusCode = 400;
            res.end(JSON.stringify({status: 'error', message: 'Invalid JSON format'}));
          }
        });
      }

    } else if (req.method === 'DELETE') {
      const memoryIdx = Number(req.url.substring(8));
      memory[memoryIdx] = {}
      res.end(JSON.stringify(memory));
    }

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
