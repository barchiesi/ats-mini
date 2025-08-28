import type {Memory} from "./types";
import {byId, formatFrequency} from "./utils";
import {memoriesApi} from "./atsminiApi.ts";


const populateMemories = (memories: Memory[]) => {
  const memoriesTable = byId('memoriesTable');
  if (!memoriesTable) return;
  memoriesTable.innerHTML = '';

  memories.forEach((memory, idx) => {
    const tr = document.createElement('tr');

    const tdIndex = document.createElement('td');
    tdIndex.className = 'LABEL';
    tdIndex.setAttribute('width', '10%');
    tdIndex.textContent = (idx + 1).toString().padStart(2, '0');
    tr.appendChild(tdIndex);

    const tdValue = document.createElement('td');
    if (!memory.freq) {
      tdValue.innerHTML = '&nbsp;---&nbsp;';
    } else {
      let freqStr = formatFrequency(memory.freq, memory.mode);
      if (memory.mode) freqStr += ' ' + memory.mode;
      tdValue.textContent = freqStr;
    }
    tr.appendChild(tdValue);
    memoriesTable.appendChild(tr);
  });
}

const fetchAndPopulateMemories = () => {
  memoriesApi()
    .then((memories: Memory[]) => {
      setTimeout(fetchAndPopulateMemories, 5000);
      populateMemories(memories);
    })
    .catch(() => {
      setTimeout(fetchAndPopulateMemories, 5000);
    });
}

fetchAndPopulateMemories();
