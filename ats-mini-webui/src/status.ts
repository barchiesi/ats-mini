import {Status} from "./types";
import {debounce, formatFrequency, responseToJson, setCellText, setInputValue, syncValues} from "./utils";


const populateStatus = (status: Status) => {
  const ipElement = document.getElementById('ip') as HTMLAnchorElement;
  if (ipElement) {
    ipElement.textContent = status.ip;
    ipElement.href = `http://${status.ip}`;
  }

  setCellText('time', status.time ?? 'N/A');
  setCellText('ssid', status.ssid);
  setCellText('mac', status.mac);
  setCellText('version', status.version);
  setCellText('band', status.band);

  const frequencyDisplay = document.getElementById('frequencyDisplay') as HTMLSpanElement;
  const freqSpan = document.getElementById('frequencyUnit') as HTMLSpanElement;
  if (frequencyDisplay && freqSpan) {
    frequencyDisplay.textContent = formatFrequency(status.freq, status.mode).slice(0, -3);
    freqSpan.textContent = status.mode === "FM" ? `MHz` : `kHz`;
  }

  setCellText('rssi', `${status.rssi}dBuV`);
  setCellText('snr', `${status.snr}dB`);
  setCellText('battery', `${status.battery.toFixed(2)}V`);
  setCellText('step', status.step);
  setCellText('bandwidth', status.bandwidth);
  setCellText('agc', status.agc ? "On" : "Off");
  setCellText('attenuation', status.attenuation !== undefined ? String(status.attenuation).padStart(2, '0') : "N/A");

  setInputValue('volume', String(status.volume));
  const volumeSpan = document.getElementById('volumeValue') as HTMLSpanElement;
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

document.addEventListener('DOMContentLoaded', () => {
  syncValues('volume', 'volumeValue');

  const frequencyInput = document.getElementById('frequency') as HTMLInputElement;
  const frequencyDisplay = document.getElementById('frequencyDisplay') as HTMLInputElement;
  const frequencyEditButton = document.getElementById('frequencyEditButton') as HTMLInputElement;
  const frequencyConfirmButton = document.getElementById('frequencyConfirmButton') as HTMLInputElement;
  const frequencyCancelButton = document.getElementById('frequencyCancelButton') as HTMLInputElement;
  const frequencyUnitSpan = document.getElementById('frequencyUnit') as HTMLSpanElement;
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
          console.error('Error fetching status:', error);
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

  const volumeInput = document.getElementById('volume') as HTMLInputElement;
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
          console.error('Error fetching status:', error);
        });
    });

    volumeInput.addEventListener('input', () => {
      isPaused = true;
      debouncedVolumeChange();
    });
  }

  // Initial fetch
  fetchAndPopulateStatus();

  // Repeat every 1 second
  setInterval(fetchAndPopulateStatus, 1000);
});
