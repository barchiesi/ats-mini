import type {Memory} from "./types";
import {byId, formatFrequency, responseToJson} from "./utils";


const populateMemories = (memories: Memory[]) => {
  const memoriesTable = byId('memoriesTable');
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
        fetch(`/api/memory/${memory.id}/tune`, {method: 'POST'})
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
      let memoryDisplay = '';
      if (memory.name) memoryDisplay = memory.name + ' - ';
      if (memory.mode) memoryDisplay += memory.mode + ' ';
      memoryDisplay += formatFrequency(memory.freq ?? 0, memory.mode);
      tdValue.textContent = memoryDisplay;
    }
    tr.appendChild(tdValue);

    const tdActions = document.createElement('td');
    if (slotIsEmpty) {
      const storeBtn = document.createElement('button');
      storeBtn.textContent = '+';
      storeBtn.addEventListener('click', () => {
        fetch(`/api/memory/${idx}/storeCurrent`, {method: 'POST'})
          .then(responseToJson)
          .then((memories: Memory[]) => {
            populateMemories(memories);
          })
          .catch(error => {
            console.error('Error storing current memory:', error);
          });
      })
      tdActions.appendChild(storeBtn)
    } else {
      const cleaBtn = document.createElement('button');
      cleaBtn.textContent = 'X';
      cleaBtn.addEventListener('click', () => {
        fetch(`/api/memory/${memory.id}`, {method: 'DELETE'})
          .then(responseToJson)
          .then((memories: Memory[]) => {
            populateMemories(memories);
          })
          .catch(error => {
            console.error('Error clearing memory:', error);
          });
      })
      tdActions.appendChild(cleaBtn)
    }
    tr.appendChild(tdActions);

    memoriesTable.appendChild(tr);
  });
}

const fetchAndPopulateMemories = () => {
  // Fetch info from API
  fetch('/api/memory')
    .then(responseToJson)
    .then((memories: Memory[]) => {
      setTimeout(fetchAndPopulateMemories, 5000);
      populateMemories(memories);
    })
    .catch(error => {
      console.error('Error fetching memories:', error);
      setTimeout(fetchAndPopulateMemories, 5000);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAndPopulateMemories();
});
