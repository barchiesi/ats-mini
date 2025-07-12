import {Memory} from "./types";
import {formatFrequency, responsetoJson} from "./utils";

const populateMemories = (memories: Memory[]) => {
  const memoriesTable = document.getElementById('memoriesTable');
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
  // Fetch info from API
  fetch('/api/memory')
    .then(responsetoJson)
    .then((memories: Memory[]) => {
      populateMemories(memories);
    })
    .catch(error => {
      console.error('Error fetching memories:', error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  // Initial fetch
  fetchAndPopulateMemories();

  // Repeat every 5 seconds
  setInterval(fetchAndPopulateMemories, 5000);
});
