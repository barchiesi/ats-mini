import type {Memory} from "./types";
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

const buildMemoryTr = (memory: Memory, idx: number) => {
  const slotIsEmpty = memory.freq === undefined;

  const tr = document.createElement('tr');
  tr.id = `memory-tr-${idx}`;

  const indexDisplay = (idx + 1).toString().padStart(2, '0');
  const indexTd = document.createElement('td');
  indexTd.className = 'CENTER';
  if (slotIsEmpty) {
    indexTd.textContent = indexDisplay;
  } else {
    const tuneLink = document.createElement('a');
    tuneLink.href = '#'
    tuneLink.textContent = indexDisplay;
    tuneLink.addEventListener('click', () => {
      fetch(`/api/memory/${memory.id}/tune`, {method: 'POST'})
        .catch(error => {
          console.error('Error tuning:', error);
        });
    })
    indexTd.appendChild(tuneLink)
  }
  tr.appendChild(indexTd);

  const nameTd = document.createElement('td');
  const nameDiv = document.createElement('div');
  if (!slotIsEmpty && memory.name) {
    const nameSpan = document.createElement('span');
    nameSpan.className = 'memory-view'
    nameSpan.textContent = memory.name;
    nameDiv.appendChild(nameSpan);
  }
  const nameInput = document.createElement('input');
  nameInput.className = 'memory-edit hidden'
  nameInput.maxLength = 9;
  nameInput.value = memory.name ?? '';
  nameDiv.appendChild(nameInput);
  nameTd.appendChild(nameDiv);
  tr.appendChild(nameTd);

  const freqTd = document.createElement('td');
  const freqDiv = document.createElement('div');
  if (!slotIsEmpty && memory.freq) {
    const freqSpan = document.createElement('span');
    freqSpan.className = 'memory-view'
    freqSpan.textContent = formatFrequency(memory.freq, memory.mode);
    freqDiv.appendChild(freqSpan);
  }
  const frequencyInput = document.createElement('input');
  frequencyInput.type = 'number';
  frequencyInput.className = 'memory-edit hidden'
  frequencyInput.value = memory.freq?.toString() ?? '';
  freqDiv.appendChild(frequencyInput);
  freqTd.appendChild(freqDiv);
  tr.appendChild(freqTd);

  const bandTd = document.createElement('td');
  const bandDiv = document.createElement('div');
  if (!slotIsEmpty && memory.band) {
    const bandSpan = document.createElement('span');
    bandSpan.className = 'memory-view'
    bandSpan.textContent = memory.band;
    bandDiv.appendChild(bandSpan);
  }
  const bandSelect = document.createElement('select');
  bandSelect.innerHTML = `
    <option value="VHF">VHF</option>
    <option value="160M">160M</option>
    <option value="80M">80M</option>
    <option value="60M">60M</option>
    <option value="40M">40M</option>
    <option value="30M">30M</option>
    <option value="20M">20M</option>
    <option value="17M">17M</option>
    <option value="15M">15M</option>
    <option value="12M">12M</option>
    <option value="10M">10M</option>
    <option value="6M">6M</option>
    <option value="2M">2M</option>
  `;
  bandSelect.className = 'memory-edit hidden'
  bandSelect.value = memory.band ?? '';
  bandDiv.appendChild(bandSelect);
  bandTd.appendChild(bandDiv);
  tr.appendChild(bandTd);

  const modeTd = document.createElement('td');
  const modeDiv = document.createElement('div');
  if (!slotIsEmpty && memory.mode) {
    const modeSpan = document.createElement('span');
    modeSpan.className = 'memory-view'
    modeSpan.textContent = memory.mode;
    modeDiv.appendChild(modeSpan);
  }
  const modeSelect = document.createElement('select');
  modeSelect.innerHTML = `
    <option value="LSB">LSB</option>
    <option value="USB">USB</option>
    <option value="AM">AM</option>
    <option value="FM">FM</option>
  `;
  modeSelect.className = 'memory-edit hidden'
  modeSelect.value = memory.mode ?? '';
  modeDiv.appendChild(modeSelect);
  modeTd.appendChild(modeDiv);
  tr.appendChild(modeTd);

  const actionsTd = document.createElement('td');
  const divViewActions = document.createElement('div');
  divViewActions.className = 'view-memory-actions-div'
  const editBtn = document.createElement('button');
  editBtn.textContent = '✎';
  editBtn.addEventListener('click', () => {
    resetMemoriesToView();
    toggleHiddenSets(`#memory-tr-${idx} .memory-view`, `#memory-tr-${idx} .memory-edit`)
  })
  divViewActions.appendChild(editBtn)
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
    divViewActions.appendChild(storeBtn)
  } else {
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '␡';
    clearBtn.addEventListener('click', () => {
      fetch(`/api/memory/${memory.id}`, {method: 'DELETE'})
        .then(responseToJson)
        .then((memories: Memory[]) => {
          populateMemories(memories);
        })
        .catch(error => {
          console.error('Error clearing memory:', error);
        });
    })
    divViewActions.appendChild(clearBtn)
  }
  actionsTd.appendChild(divViewActions)


  const divEditActions = document.createElement('div');
  divEditActions.className = 'edit-memory-actions-div hidden'
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = '✓';
  confirmBtn.addEventListener('click', () => {
    console.log('confirm')
    document.querySelectorAll('.edit-memory-div').forEach(el => {
      el.classList.add('hidden');
    });
    document.querySelectorAll('.edit-memory-actions-div').forEach(el => {
      el.classList.add('hidden');
    });
    document.querySelectorAll('.view-memory-div').forEach(el => {
      el.classList.remove('hidden');
    });
    document.querySelectorAll('.view-memory-actions-div').forEach(el => {
      el.classList.remove('hidden');
    });
  })
  divEditActions.appendChild(confirmBtn)
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '🗙';
  cancelBtn.addEventListener('click', () => {
    console.log('cancel')
    document.querySelectorAll('.edit-memory-div').forEach(el => {
      el.classList.add('hidden');
    });
    document.querySelectorAll('.edit-memory-actions-div').forEach(el => {
      el.classList.add('hidden');
    });
    document.querySelectorAll('.view-memory-div').forEach(el => {
      el.classList.remove('hidden');
    });
    document.querySelectorAll('.view-memory-actions-div').forEach(el => {
      el.classList.remove('hidden');
    });
  })
  divEditActions.appendChild(cancelBtn)
  actionsTd.appendChild(divEditActions)
  tr.appendChild(actionsTd);

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

const fetchAndPopulateMemories = () => {
  // Fetch info from API
  fetch('/api/memory')
    .then(responseToJson)
    .then((memories: Memory[]) => {
      setTimeout(fetchAndPopulateMemories, 50000);
      populateMemories(memories);
    })
    .catch(error => {
      console.error('Error fetching memories:', error);
      setTimeout(fetchAndPopulateMemories, 50000);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAndPopulateMemories();
});
