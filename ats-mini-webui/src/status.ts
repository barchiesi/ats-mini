import type {Bandwidth, Status, StatusOptions, Step} from "./types";
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
  const mode = statusOptions.modes.find(m => m.id === status.modeIdx)?.mode ?? 'N/A';

  let steps: Step[];
  if (mode === "FM") {
    steps = statusOptions.steps.fm;
  } else if (mode === "AM") {
    steps = statusOptions.steps.am;
  } else {
    steps = statusOptions.steps.ssb;
  }
  populateSelect('steps', steps.map(b => ({
    value: b.id.toString(),
    label: `${b.desc}`
  })));

  let bandwidths: Bandwidth[];
  if (mode === "FM") {
    bandwidths = statusOptions.bandwidths.fm;
  } else if (mode === "AM") {
    bandwidths = statusOptions.bandwidths.am;
  } else {
    bandwidths = statusOptions.bandwidths.ssb;
  }
  populateSelect('bandwidths', bandwidths.map(b => ({
    value: b.id.toString(),
    label: `${b.desc}`
  })));

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
    frequencyDisplay.textContent = formatFrequency(status.freq, mode).slice(0, -3);
    freqSpan.textContent = mode === "FM" ? `MHz` : `kHz`;
  }

  setCellText('mode', mode);
  setCellText('rssi', `${status.rssi}dBuV`);
  setCellText('snr', `${status.snr}dB`);
  setCellText('battery', `${status.battery.toFixed(2)}V`);

  setInputValue('steps', status.stepIdx.toString());
  setInputValue('bandwidths', status.bandwidthIdx.toString());

  const agcAttenuationInput = byId('agcAttenuation') as HTMLInputElement;
  const agcAttenuationSpan = byId('agcAttenuationValue') as HTMLSpanElement;
  if (agcAttenuationInput && agcAttenuationSpan) {
    agcAttenuationInput.value = status.agc ? '-1' : (status.attenuation ?? 0).toString();
    if (mode === "FM") {
      agcAttenuationInput.max = '26';
    } else if (mode in ["LSB", "USB"]) {
      agcAttenuationInput.max = '0';
    } else {
      agcAttenuationInput.max = '36';
    }

    agcAttenuationSpan.textContent = status.agc ? 'AGC On' : (status.attenuation ?? 0).toString().padStart(2, '0');
  }

  setInputValue('volume', String(status.volume));
  const volumeSpan = byId('volumeValue') as HTMLSpanElement;
  if (volumeSpan) volumeSpan.textContent = status.volume.toString().padStart(2, '0');

  const squelchInput = byId('squelch') as HTMLInputElement;
  const squelchSpan = byId('squelchValue') as HTMLSpanElement;
  if (squelchInput && squelchSpan) {
    squelchInput.value = status.squelch.toString();
    squelchSpan.textContent = status.squelch !== 0 ? `${status.squelch}dBuV` : 'Off';
  }

  const softMuteMaxAttIdxInput = byId('softMuteMaxAttIdx') as HTMLInputElement;
  const softMuteMaxAttIdxSpan = byId('softMuteMaxAttIdxValue') as HTMLSpanElement;
  if (softMuteMaxAttIdxInput && softMuteMaxAttIdxSpan) {
    softMuteMaxAttIdxInput.disabled = status.softMuteMaxAttIdx === undefined;
    if (status.softMuteMaxAttIdx !== undefined) {
      softMuteMaxAttIdxInput.value = status.softMuteMaxAttIdx.toString();
      softMuteMaxAttIdxSpan.textContent = `${status.softMuteMaxAttIdx}dB`;
    } else {
      softMuteMaxAttIdxInput.value = '0';
      softMuteMaxAttIdxSpan.textContent = "N/A";
    }
  }

  const avcInput = byId('avc') as HTMLInputElement;
  const avcSpan = byId('avcValue') as HTMLSpanElement;
  if (avcInput && avcSpan) {
    avcInput.disabled = status.avc === undefined;
    if (status.avc !== undefined) {
      avcInput.value = status.avc.toString();
      avcSpan.textContent = `${status.avc}dB`;
    } else {
      avcInput.value = '0';
      avcSpan.textContent = "N/A";
    }
  }

  setCellText('piCode', status.rds?.piCode ?? "N/A");
  setCellText('stationName', status.rds?.stationName ?? "N/A");
  setCellText('radioText', status.rds?.radioText ?? "N/A");
  setCellText('programInfo', status.rds?.programInfo ?? "N/A");
}

let isPaused = false;

const fetchAndPopulateStatus = () => {
  if (isPaused) {
    setTimeout(fetchAndPopulateStatus, 1000);
    return
  }

  // Fetch status from API
  fetch('/api/status')
    .then(responseToJson)
    .then((status: Status) => {
      setTimeout(fetchAndPopulateStatus, 1000);
      populateStatus(status);
    })
    .catch(error => {
      console.error('Error fetching status:', error);
      setTimeout(fetchAndPopulateStatus, 1000);
    });
}

let statusOptions: StatusOptions;
document.addEventListener('DOMContentLoaded', async () => {
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
      if (isNaN(freq)) return;
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

  const stepSelect = byId('steps') as HTMLInputElement;
  if (stepSelect) {
    stepSelect.addEventListener('change', () => {
      const stepIdx = parseInt(stepSelect.value);
      isPaused = false;
      stepSelect.blur();
      fetch('/api/status', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({stepIdx})
      })
        .catch(error => {
          console.error('Error updating step:', error);
        });
    });

    stepSelect.addEventListener('focus', () => {
      isPaused = true;
    });
    stepSelect.addEventListener('blur', () => {
      isPaused = false;
    });
  }

  const bandwidthSelect = byId('bandwidths') as HTMLInputElement;
  if (bandwidthSelect) {
    bandwidthSelect.addEventListener('change', () => {
      const bandwidthIdx = parseInt(bandwidthSelect.value);
      isPaused = false;
      bandwidthSelect.blur();
      fetch('/api/status', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({bandwidthIdx})
      })
        .catch(error => {
          console.error('Error updating bandwidth:', error);
        });
    });

    bandwidthSelect.addEventListener('focus', () => {
      isPaused = true;
    });
    bandwidthSelect.addEventListener('blur', () => {
      isPaused = false;
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

  const squelchInput = byId('squelch') as HTMLInputElement;
  const squelchSpan = byId('squelchValue') as HTMLSpanElement;
  if (squelchInput && squelchSpan) {
    const debouncedSquelchChange = debounce(() => {
      const squelch = parseInt(squelchInput.value);
      isPaused = false;
      fetch('/api/status', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({squelch})
      })
        .catch(error => {
          console.error('Error updating squelch:', error);
        });
    });

    squelchInput.addEventListener('input', () => {
      isPaused = true;
      squelchSpan.textContent = squelchInput.value !== '0' ? `${squelchInput.value}dBuV` : 'Off';
      debouncedSquelchChange();
    });
  }

  const softMuteMaxAttIdxInput = byId('softMuteMaxAttIdx') as HTMLInputElement;
  const softMuteMaxAttIdxSpan = byId('softMuteMaxAttIdxValue') as HTMLSpanElement;
  if (softMuteMaxAttIdxInput && softMuteMaxAttIdxSpan) {
    const debouncedSoftMuteChange = debounce(() => {
      const softMuteMaxAttIdx = parseInt(softMuteMaxAttIdxInput.value);
      isPaused = false;
      fetch('/api/status', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({softMuteMaxAttIdx})
      })
        .catch(error => {
          console.error('Error updating soft mute:', error);
        });
    });

    softMuteMaxAttIdxInput.addEventListener('input', () => {
      isPaused = true;
      softMuteMaxAttIdxSpan.textContent = `${softMuteMaxAttIdxInput.value}dB`;
      debouncedSoftMuteChange();
    });
  }

  const avcInput = byId('avc') as HTMLInputElement;
  const avcSpan = byId('avcValue') as HTMLSpanElement;
  if (avcInput && avcSpan) {
    const debouncedAVCChange = debounce(() => {
      const avc = parseInt(avcInput.value);
      isPaused = false;
      fetch('/api/status', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({avc})
      })
        .catch(error => {
          console.error('Error updating avc:', error);
        });
    });

    avcInput.addEventListener('input', () => {
      isPaused = true;
      avcSpan.textContent = `${avcInput.value}dB`;
      debouncedAVCChange();
    });
  }

  statusOptions = await fetch('/api/statusOptions')
    .then(responseToJson)
    .catch(error => {
      console.error('Error fetching status options:', error);
    });

  populateSelect('bands', statusOptions.bands.map(b => ({
    value: b.id.toString(),
    label: `${b.name} | ${statusOptions.modes.find(m => m.id === b.modeIdx)?.mode} |  ${formatFrequency(b.minimumFreq, b.modeIdx === 0 ? "FM" : "AM", true)} - ${formatFrequency(b.maximumFreq, b.modeIdx === 0 ? "FM" : "AM", true)}`
  })));

  // Initial fetch and repeat
  fetchAndPopulateStatus();
})
