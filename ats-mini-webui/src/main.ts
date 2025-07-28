import statusHTML from './fragments/status.html?raw'
import {init as statusInit} from './status'

import memoryHTML from './fragments/memory.html?raw'
import {init as memoryInit} from './memory'
import configHTML from './fragments/config.html?raw'
import {init as configInit} from './config'
import {byId} from "./utils";


let lastDeinit: (() => void) | null = null;

const renderSection = () => {
  const path = location.pathname;
  console.log('Rendering', path)

  if (lastDeinit) {
    console.log('deiniting')
    lastDeinit();
  }

  const content = byId('content');
  if (!content) {
    console.log('no content found');
    return
  }

  if (path == "/") {
    content.innerHTML = statusHTML;
    lastDeinit = statusInit();
  } else if (path.startsWith("/memory")) {
    console.log(memoryHTML)
    content.innerHTML = memoryHTML;
    lastDeinit = memoryInit();
  } else if (path.startsWith("/status")) {
    content.innerHTML = configHTML;
    lastDeinit = configInit();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderSection();
});
