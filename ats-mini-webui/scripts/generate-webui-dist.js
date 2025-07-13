#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '..', 'dist');
const outputFile = path.join(distDir, 'webui_dist.cpp');

// MIME type mapping
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function escapeString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function generateWebuiDist() {
  // Read all files in dist directory (excluding the webui_dist.cpp file itself)
  const files = fs.readdirSync(distDir)
    .filter(file => file !== 'webui_dist.cpp' && !fs.statSync(path.join(distDir, file)).isDirectory())
    .sort();

  let cppContent = '#include "webui_dist.h"\n\n';
  cppContent += 'WebUiFile webui_files[] =\n{\n';

  let totalContentLength = 0;
  files.forEach((filename, index) => {
    const filePath = path.join(distDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const mimeType = getMimeType(filename);
    const escapedContent = escapeString(content);

    cppContent += `  {"${filename}", "${mimeType}", "${escapedContent}"}`;

    if (index < files.length - 1) {
      cppContent += ',';
    }
    cppContent += '\n';

    console.log(`Processed: ${filename} (${mimeType}) - content ${content.length} bytes`);
    totalContentLength += content.length;
  });

  cppContent += '};\n\n';
  cppContent += `const int webui_files_count = ${files.length};\n`;

  // Write the generated content to the output file
  fs.writeFileSync(outputFile, cppContent);
  console.log(`Generated ${outputFile} from ${files.length} files - total content ${totalContentLength} bytes, total file ${cppContent.length} bytes.`);
}

try {
  generateWebuiDist();
} catch (error) {
  console.error('Error generating webui_dist.cpp:', error.message);
  process.exit(1);
}
