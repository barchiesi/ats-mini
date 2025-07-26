import {Memory} from "./types";
import {formatFrequency, responseToJson} from "./utils";

const populateMemories = (memories: Memory[]) => {
  const memoriesTable = document.getElementById('memoriesTable');
  if (!memoriesTable) return;
  memoriesTable.innerHTML = '';

  memories.forEach((memory, idx) => {
    const slotIsEmpty = memory.freq === undefined;

    const tr = document.createElement('tr');

    const tdIndex = document.createElement('td');
    tdIndex.className = 'LABEL';
    tdIndex.setAttribute('width', '10%');
    if (slotIsEmpty) {
      tdIndex.textContent = (idx + 1).toString().padStart(2, '0');
    } else {
      const tuneLink = document.createElement('a');
      tuneLink.href = '#'
      tuneLink.textContent = (idx + 1).toString().padStart(2, '0');
      tuneLink.addEventListener('click', () => {
        fetch(`/api/memory/${idx}/tune`, {method: 'POST'})
          .catch(error => {
            console.error('Error tuning:', error);
          });
      })
      tdIndex.appendChild(tuneLink)
    }
    tr.appendChild(tdIndex);

    const tdValue = document.createElement('td');
    if (slotIsEmpty) {
      tdValue.innerHTML = '&nbsp;---&nbsp;';
    } else {
      let freqStr = formatFrequency(memory.freq ?? 0, memory.mode);
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
    .then(responseToJson)
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
