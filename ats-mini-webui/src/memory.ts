import type {Memory, StatusOptions} from "./types";
import {byId, formatFrequency, responseToJson} from "./utils";


const toggleHiddenSets = (hideQuery: string, showQuery: string) => {
  document.querySelectorAll(hideQuery).forEach(el => {
    el.classList.add('hidden');
  });
  document.querySelectorAll(showQuery).forEach(el => {
    el.classList.remove('hidden');
  });
}

const resetMemoriesToView = () => toggleHiddenSets('.memory-edit', '.memory-view')

const buildBandSelect = (band: string): string => {
  const options = statusOptions.bands.map(b => `<option ${b.bandName === band ? 'selected' : ''} value="${b.id}">${b.bandName}</option>`)
  return `
    <select class="memory-edit hidden">
      ${options.join('')}
    </select>
  `
}

const buildModeSelect = (mode: string): string => {
  const options = statusOptions.modes.map(m => `<option ${m.mode === mode ? 'selected' : ''} value="${m.id}">${m.mode}</option>`)
  return `
    <select class="memory-edit hidden">
      ${options.join('')}
    </select>
  `
}

const buildMemoryTr = (memory: Memory, idx: number) => {
  const slotIsEmpty = memory.freq === undefined;

  const indexDisplay = (idx + 1).toString().padStart(2, '0');

  const tr = document.createElement('tr');
  tr.id = `memory-tr-${idx}`;
  tr.innerHTML = `
  <td class="CENTER">
    ${slotIsEmpty ?
    `<span>${indexDisplay}</span>` :
    `<button class="tune-btn">${indexDisplay}</button>`}
  </td>
  <td>
    <span class="memory-view">${memory.name ?? ''}</span>
    <input class="memory-edit hidden" maxlength="9" value="${memory.name ?? ''}">
  </td>
  <td>
    <span class="memory-view">${memory.freq ? formatFrequency(memory.freq, memory.mode) : ''}</span>
    <input type="number" step="1.000" class="memory-edit hidden" value="${memory.freq ?? ''}">
  </td>
  <td>
    <span class="memory-view">${memory.band ?? ''}</span>
    ${buildBandSelect(memory.band ?? '')}
  </td>
  <td>
    <span class="memory-view">${memory.mode ?? ''}</span>
    ${buildModeSelect(memory.mode ?? '')}
  </td>
  <td>
    <div class="memory-view">
      ${slotIsEmpty ? `<button class="store-btn">+</button>` : `<button class="clear-btn">␡</button>`}
      <button class="edit-btn">✎</button>
    </div>
    <div class="memory-edit hidden">
      <button class="confirm-edit-btn">✓</button>
      <button class="cancel-edit-btn">🗙</button>
    </div>
  </td>
  `

  tr.querySelector('.tune-btn')?.addEventListener('click', () => {
    fetch(`/api/memory/${memory.id}/tune`, {method: 'POST'})
      .catch(error => {
        console.error('Error tuning:', error);
      });
  })

  tr.querySelector('.store-btn')?.addEventListener('click', () => {
    fetch(`/api/memory/${idx}/storeCurrent`, {method: 'POST'})
      .then(responseToJson)
      .then((memories: Memory[]) => {
        populateMemories(memories);
      })
      .catch(error => {
        console.error('Error storing current memory:', error);
      });
  })

  tr.querySelector('.clear-btn')?.addEventListener('click', () => {
    fetch(`/api/memory/${memory.id}`, {method: 'DELETE'})
      .then(responseToJson)
      .then((memories: Memory[]) => {
        populateMemories(memories);
      })
      .catch(error => {
        console.error('Error clearing memory:', error);
      });
  })

  tr.querySelector('.edit-btn')?.addEventListener('click', () => {
    resetMemoriesToView();
    toggleHiddenSets(`#memory-tr-${idx} .memory-view`, `#memory-tr-${idx} .memory-edit`)
  })

  tr.querySelector('.confirm-edit-btn')?.addEventListener('click', () => {
    resetMemoriesToView();
  })

  tr.querySelector('.cancel-edit-btn')?.addEventListener('click', () => {
    resetMemoriesToView();
  })

  return tr;
}

const populateMemories = (memories: Memory[]) => {
  const memoriesTable = byId('memoriesTable');
  if (!memoriesTable) return;

  memoriesTable.innerHTML = '';
  memories.forEach((memory, idx) => {
    const tr = buildMemoryTr(memory, idx);
    memoriesTable.appendChild(tr);
  });
}

const refreshInterval = 50000; // 5 seconds
const fetchAndPopulateMemories = () => {
  fetch('/api/memory')
    .then(responseToJson)
    .then((memories: Memory[]) => {
      populateMemories(memories);
      setTimeout(fetchAndPopulateMemories, refreshInterval);
    })
    .catch(error => {
      console.error('Error fetching memories:', error);
      setTimeout(fetchAndPopulateMemories, refreshInterval);
    });
}

let statusOptions: StatusOptions;
document.addEventListener('DOMContentLoaded', async () => {
  statusOptions = await fetch('/api/statusOptions')
    .then(responseToJson)
    .catch(error => {
      console.error('Error fetching status options:', error);
    });

  fetchAndPopulateMemories();
});
