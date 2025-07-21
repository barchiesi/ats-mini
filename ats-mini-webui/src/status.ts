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
  setCellText('frequency', formatFrequency(status.freq, status.mode));
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
