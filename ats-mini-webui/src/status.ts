import {Status, StatusOptions} from "./types";
import {
  byId,
  debounce,
  formatFrequency,
  populateSelect,
  responseToJson,
  setCellText,
  setInputValue,
  syncValues
} from "./utils";


const populateStatus = (status: Status) => {
  const ipElement = byId('ip') as HTMLAnchorElement;
  if (ipElement) {
    ipElement.textContent = status.ip;
    ipElement.href = `http://${status.ip}`;
  }

  setCellText('time', status.time ?? 'N/A');
  setCellText('ssid', status.ssid);
  setCellText('mac', status.mac);
  setCellText('version', status.version);
  setInputValue('bands', status.bandIdx.toString());

  const frequencyDisplay = byId('frequencyDisplay') as HTMLSpanElement;
  const freqSpan = byId('frequencyUnit') as HTMLSpanElement;
  if (frequencyDisplay && freqSpan) {
    frequencyDisplay.textContent = formatFrequency(status.freq, status.mode).slice(0, -3);
    freqSpan.textContent = status.mode === "FM" ? `MHz` : `kHz`;
  }

  setCellText('rssi', `${status.rssi}dBuV`);
  setCellText('snr', `${status.snr}dB`);
  setCellText('battery', `${status.battery.toFixed(2)}V`);
  setCellText('step', status.step);
  setCellText('bandwidth', status.bandwidth);

  const agcAttenuationInput = byId('agcAttenuation') as HTMLInputElement;
  const agcAttenuationSpan = byId('agcAttenuationValue') as HTMLSpanElement;
  if (agcAttenuationInput && agcAttenuationSpan) {
    agcAttenuationInput.value = status.agc ? '-1' : (status.attenuation ?? 0).toString();
    if (status.mode === "FM") {
      agcAttenuationInput.max = '26';
    } else if (status.mode in ["LSB", "USB"]) {
      agcAttenuationInput.max = '0';
    } else {
      agcAttenuationInput.max = '36';
    }

    agcAttenuationSpan.textContent = status.agc ? 'AGC On' : (status.attenuation ?? 0).toString().padStart(2, '0');
  }

  setInputValue('volume', String(status.volume));
  const volumeSpan = byId('volumeValue') as HTMLSpanElement;
  if (volumeSpan) volumeSpan.textContent = status.volume.toString().padStart(2, '0');

  setCellText('squelch', status.squelch ? `${status.squelch}dBuV` : 'N/A');
  setCellText('softMuteMaxAttIdx', String(status.softMuteMaxAttIdx).padStart(2, '0'));
  setCellText('avc', status.avc !== undefined ? `${status.avc}` : "N/A");
  setCellText('piCode', status.rds?.piCode ?? "N/A");
  setCellText('stationName', status.rds?.stationName ?? "N/A");
  setCellText('radioText', status.rds?.radioText ?? "N/A");
  setCellText('programInfo', status.rds?.programInfo ?? "N/A");
}

let isPaused = false;

const fetchAndPopulateStatus = () => {
  if (isPaused) {
    return
  }

  // Fetch status from API
  fetch('/api/status')
    .then(responseToJson)
    .then((status: Status) => {
      populateStatus(status);
    })
    .catch(error => {
      console.error('Error fetching status:', error);
    });
}

export const init = (): (() => void) => {
  const bandSelect = byId('bands') as HTMLInputElement;
  if (bandSelect) {
    bandSelect.addEventListener('change', () => {
      const bandIdx = parseInt(bandSelect.value);
      fetch('/api/status', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({bandIdx})
      })
        .catch(error => {
          console.error('Error updating band:', error);
        });
    });
  }

  const frequencyInput = byId('frequency') as HTMLInputElement;
  const frequencyDisplay = byId('frequencyDisplay') as HTMLInputElement;
  const frequencyEditButton = byId('frequencyEditButton') as HTMLInputElement;
  const frequencyConfirmButton = byId('frequencyConfirmButton') as HTMLInputElement;
  const frequencyCancelButton = byId('frequencyCancelButton') as HTMLInputElement;
  const frequencyUnitSpan = byId('frequencyUnit') as HTMLSpanElement;
  if (frequencyInput && frequencyDisplay && frequencyEditButton && frequencyConfirmButton && frequencyCancelButton && frequencyUnitSpan) {
    frequencyEditButton.addEventListener('click', () => {
      frequencyInput.value = frequencyDisplay.textContent ?? '';
      frequencyInput.classList.remove('hidden');
      frequencyDisplay.classList.add('hidden');
      frequencyEditButton.classList.add('hidden');
      frequencyConfirmButton.classList.remove('hidden');
      frequencyCancelButton.classList.remove('hidden');
    });

    frequencyConfirmButton.addEventListener('click', () => {
      const freq = parseFloat(frequencyInput.value) * (frequencyUnitSpan.textContent === "MHz" ? 1000 * 1000 : 1000);
      isPaused = false;
      fetch('/api/status', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({freq})
      })
        .catch(error => {
          console.error('Error updating frequency:', error);
        });

      frequencyInput.classList.add('hidden');
      frequencyDisplay.classList.remove('hidden');
      frequencyEditButton.classList.remove('hidden');
      frequencyConfirmButton.classList.add('hidden');
      frequencyCancelButton.classList.add('hidden');
    });

    frequencyCancelButton.addEventListener('click', () => {
      frequencyInput.classList.add('hidden');
      frequencyDisplay.classList.remove('hidden');
      frequencyEditButton.classList.remove('hidden');
      frequencyConfirmButton.classList.add('hidden');
      frequencyCancelButton.classList.add('hidden');
    });
  }

  const agcAttenuationInput = byId('agcAttenuation') as HTMLInputElement;
  const agcAttenuationSpan = byId('agcAttenuationValue') as HTMLSpanElement;
  if (agcAttenuationInput && agcAttenuationSpan) {
    const debouncedAGCAttnChange = debounce(() => {
      const agcAttenuation = parseInt(agcAttenuationInput.value);
      isPaused = false;
      fetch('/api/status', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(agcAttenuation === -1 ? {agc: true} : {attenuation: agcAttenuation})
      })
        .catch(error => {
          console.error('Error updating agc/attenuation:', error);
        });
    });

    agcAttenuationInput.addEventListener('input', () => {
      isPaused = true;
      agcAttenuationSpan.textContent = agcAttenuationInput.value === '-1' ? 'AGC On' : agcAttenuationInput.value.padStart(2, '0')
      debouncedAGCAttnChange();
    });
  }

  syncValues('volume', 'volumeValue');
  const volumeInput = byId('volume') as HTMLInputElement;
  if (volumeInput) {
    const debouncedVolumeChange = debounce(() => {
      const volume = parseInt(volumeInput.value);
      isPaused = false;
      fetch('/api/status', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({volume})
      })
        .catch(error => {
          console.error('Error updating volume:', error);
        });
    });

    volumeInput.addEventListener('input', () => {
      isPaused = true;
      debouncedVolumeChange();
    });
  }

  fetch('/api/statusOptions')
    .then(responseToJson)
    .then((statusOptions: StatusOptions) => {
      populateSelect('bands', statusOptions.bands.map(b => ({
        value: b.id.toString(),
        label: `${b.bandName} | ${formatFrequency(b.minimumFreq, b.bandMode === 0 ? "FM" : undefined, true)} - ${formatFrequency(b.maximumFreq, b.bandMode === 0 ? "FM" : undefined, true)}`
      })));

      // Initial fetch and repeat
      fetchAndPopulateStatus();
    })
    .catch(error => {
      console.error('Error fetching status options:', error);
    });

  // Repeat every 1 second
  const interval = setInterval(fetchAndPopulateStatus, 1000);
  return () => {
    console.log('deinit status')
    clearInterval(interval)
  }
}
