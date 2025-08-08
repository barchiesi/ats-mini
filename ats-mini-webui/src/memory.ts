import type {Memory, MemoryOptions, StatusOptions} from "./types";
import {byId, downloadContent, formatFrequency} from "./utils";
import {
  clearMemoryApi,
  memoriesApi,
  memoriesOptionsApi,
  saveMemoriesApi,
  saveMemoryApi,
  statusOptionsApi,
  storeMemoryApi,
  tuneMemoryApi
} from "./atsminiApi.ts";


const toggleHiddenSets = (hideQuery: string, showQuery: string) => {
  document.querySelectorAll(hideQuery).forEach(el => {
    el.classList.add('hidden');
  });
  document.querySelectorAll(showQuery).forEach(el => {
    el.classList.remove('hidden');
  });
}

const resetMemoriesToView = () => toggleHiddenSets('.memory-edit', '.memory-view')

const buildBandSelect = (bandIdx: number): string => {
  const options = statusOptions.bands.map(b => `<option ${b.id === bandIdx ? 'selected' : ''} value="${b.id}">${b.name}</option>`)
  return `
    <select class="memory-band">
      ${options.join('')}
    </select>
  `
}

const buildModeSelect = (modeIdx: number): string => {
  const options = statusOptions.modes.map(m => `<option ${m.id === modeIdx ? 'selected' : ''} value="${m.id}">${m.mode}</option>`)
  return `
    <select class="memory-mode">
      ${options.join('')}
    </select>
  `
}

const buildMemoryTr = (memory: Partial<Memory>, idx: number): HTMLTableRowElement => {
  const tr = document.createElement('tr');
  tr.id = `memory-tr-${idx}`;

  const slotIsEmpty = memory.freq === undefined;
  const bandIdx = memory.bandIdx ?? 0;
  const band = statusOptions.bands.find(b => b.id === (bandIdx));
  const modeIdx = memory.modeIdx ?? 0;
  const mode = statusOptions.modes.find(m => m.id === (modeIdx));
  if (!band || !mode) return tr;
  const indexDisplay = (idx + 1).toString().padStart(2, '0');
  const modeDisplay = mode.mode ?? 'N/A';
  let memoryDisplay = slotIsEmpty ? '' : `${band.name} - ${modeDisplay} ${formatFrequency(memory.freq ?? 0, modeDisplay)}`;
  if (memory.name) {
    memoryDisplay = memory.name + ' - ' + memoryDisplay;
  }

  tr.innerHTML = `
  <td class="CENTER">
    <div class="memory-view">
      ${slotIsEmpty ? `<span>${indexDisplay}</span>` :
    `<button class="tune-btn">${indexDisplay}</button>`}
    </div>
    <div class="memory-edit hidden">
      <span style="font-weight: bold">${indexDisplay}</span>
    </div>
  </td>
  <td>
    <span class="memory-view">${memoryDisplay}</span>
    <div class="memory-edit-div memory-edit hidden">
      <div>
        <label>Name</label>
        <input class="memory-name" type="text" maxlength="9" value="${memory.name ?? ''}">
      </div>
      <div>
        <label>Frequency</label>
        <input class="memory-freq" type="number" step="1.000" value="${memory.freq ? memory.freq / 1000 : ''}" min="${(band.minimumFreq ?? 0) / 1000}" max="${(band.maximumFreq ?? 0) / 1000}"> kHz
      </div>
      <div>
        <label>Band</label>
        ${buildBandSelect(bandIdx)}
      </div>
      <div>
        <label>Mode</label>
        ${buildModeSelect(modeIdx)}
      </div>
      <span class="error-msg hidden" style="color: red"></span>
    </div>
  </td>
  <td class="memory-actions">
    ${slotIsEmpty ? `<button class="store-btn memory-view">+</button>` : `<button class="clear-btn memory-view">␡</button>`}
    <button class="edit-btn memory-view">✎</button>
    <button data-idx="${idx}" class="confirm-edit-btn memory-edit hidden">✓</button>
    <button class="cancel-edit-btn memory-edit hidden">X</button>
  </td>
  `

  tr.querySelector('.tune-btn')?.addEventListener('click', () => {
    tuneMemoryApi(idx)
      .catch(error => {
        console.error('Error tuning:', error);
      });
  })

  tr.querySelector('.store-btn')?.addEventListener('click', () => {
    storeMemoryApi(idx)
      .then((memories: Memory[]) => {
        populateMemories(memories);
      })
  })

  tr.querySelector('.clear-btn')?.addEventListener('click', () => {
    clearMemoryApi(idx)
      .then((memories: Memory[]) => {
        populateMemories(memories);
      })
  })

  tr.querySelector('.edit-btn')?.addEventListener('click', () => {
    refreshPaused = true;
    resetMemoriesToView();
    toggleHiddenSets(`#memory-tr-${idx} .memory-view`, `#memory-tr-${idx} .memory-edit`)
  })

  tr.querySelector('.memory-band')?.addEventListener('change', (event) => {
    const newBandIdx = (event.target as HTMLSelectElement).value;
    const newBand = statusOptions.bands.find(b => b.id === parseInt(newBandIdx));
    const freqInput = tr.querySelector<HTMLInputElement>('.memory-freq');
    if (!newBand || !freqInput) return;

    freqInput.min = (newBand.minimumFreq / 1000).toString();
    freqInput.max = (newBand.maximumFreq / 1000).toString();
  })

  tr.querySelector('.confirm-edit-btn')?.addEventListener('click', (event) => {
    const btn = event.target;
    const errorMsg = tr.querySelector<HTMLSpanElement>('.error-msg');
    if (!btn || !(btn instanceof HTMLButtonElement) || !errorMsg) return;

    const idx = parseInt(btn.dataset.idx ?? '');
    const freq = parseFloat(tr.querySelector<HTMLInputElement>('.memory-freq')?.value ?? '') * 1000;
    const bandIdx = parseInt(tr.querySelector<HTMLInputElement>('.memory-band')?.value ?? '');
    const modeIdx = parseInt(tr.querySelector<HTMLInputElement>('.memory-mode')?.value ?? '');
    const name = tr.querySelector<HTMLInputElement>('.memory-name')?.value ?? '';

    if (isNaN(idx) || isNaN(freq) || isNaN(bandIdx) || isNaN(modeIdx)) {
      errorMsg.textContent = 'Please fill in all fields.';
      errorMsg.classList.remove('hidden')
      return;
    }

    const band = statusOptions.bands.find(b => b.id === bandIdx);
    if (!band) {
      errorMsg.textContent = 'Invalid band selected.';
      errorMsg.classList.remove('hidden')
      return;
    }

    if (band.minimumFreq > freq || band.maximumFreq < freq) {
      errorMsg.textContent = `Frequency must be between ${band.minimumFreq / 1000} and ${band.maximumFreq / 1000} kHz for ${band.name}.`;
      errorMsg.classList.remove('hidden')
      return;
    }

    const updatedMemory: Memory = {
      id: idx,
      freq,
      bandIdx,
      modeIdx,
      name,
    }

    saveMemoryApi(updatedMemory)
      .then((memories: Memory[]) => {
        populateMemories(memories);
        refreshPaused = false;
      })
  })

  tr.querySelector('.cancel-edit-btn')?.addEventListener('click', () => {
    resetMemoriesToView();
    refreshPaused = false;
  })

  return tr;
}

const populateMemories = (memories: Memory[]) => {
  const memoriesTable = byId('memoriesTable');
  if (!memoriesTable) return;

  memoriesTable.innerHTML = '';
  Array.from({length: memoryOptions.size},
    (_, id) => memories.find(m => m.id === id) || {})
    .forEach((memory, idx) => {
      const tr = buildMemoryTr(memory, idx);
      memoriesTable.appendChild(tr);
    });
}

let refreshPaused = false;
const refreshInterval = 5000; // 5 seconds
const fetchAndPopulateMemories = () => {
  if (refreshPaused) {
    setTimeout(fetchAndPopulateMemories, refreshInterval);
    return
  }

  memoriesApi()
    .then((memories: Memory[]) => {
      populateMemories(memories);
      setTimeout(fetchAndPopulateMemories, refreshInterval);
    })
    .catch(() => {
      setTimeout(fetchAndPopulateMemories, refreshInterval);
    });
}

const memoryOptions: MemoryOptions = await memoriesOptionsApi()
const statusOptions: StatusOptions = await statusOptionsApi()

const importButton = byId('import') as HTMLButtonElement;
const importFile = byId('importFile') as HTMLInputElement;
if (importButton && importFile) {
  importFile.addEventListener('change', () => {
    importButton.disabled = importFile.files?.length === 0;
  })

  importButton.addEventListener('click', () => {
    const file = (importFile.files ?? [])[0];

    // Validate file existence and type
    if (!file) {
      console.log("No file selected. Please choose a file.");
      return;
    }

    if (file.type !== 'application/json') {
      console.log("Unsupported file type. Please select a text file.");
      return;
    }

    // Read the file
    const reader = new FileReader();
    reader.onload = () => {
      const rawJson = String(reader.result);
      importFile.value = '';

      saveMemoriesApi(JSON.parse(rawJson))
        .then((memories: Memory[]) => {
          window.scrollTo({top: 0, behavior: 'smooth'});
          populateMemories(memories);
        })
    };
    reader.onerror = () => {
      console.log("Error reading the file. Please try again.");
    };
    reader.readAsText(file);
    return
  })
}

const exportButton = byId('export');
if (exportButton) {
  exportButton.addEventListener('click', () => {
    memoriesApi()
      .then((memories: Memory[]) => {
        downloadContent(JSON.stringify(memories, null, 2), `${new Date().toISOString()}_atsmini_memories.json`)
      });
  })
}

fetchAndPopulateMemories();
