import {Status} from "./types";
import {formatFrequency, responsetoJson} from "./utils";

const setCellText = (id: string, text: string) => {
  const cell = document.getElementById(id);
  if (cell) cell.textContent = text;
}

const populateStatus = (status: Status) => {
  const ipElement = document.getElementById('ip') as HTMLAnchorElement;
  if (ipElement) {
    ipElement.textContent = status.ip;
    ipElement.href = `http://${status.ip}`;
  }

  setCellText('ssid', status.ssid);
  setCellText('mac', status.mac);
  setCellText('version', status.version);
  setCellText('band', status.band);
  setCellText('frequency', formatFrequency(status.freq, status.mode));
  setCellText('rssi', `${status.rssi}dBuV`);
  setCellText('snr', `${status.snr}dB`);
  setCellText('battery', `${status.battery.toFixed(2)}V`);
}

const fetchAndPopulateStatus = () => {
  // Fetch status from API
  fetch('/api/status')
    .then(responsetoJson)
    .then((status: Status) => {
      populateStatus(status);
    })
    .catch(error => {
      console.error('Error fetching status:', error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  // Initial fetch
  fetchAndPopulateStatus();

  // Repeat every 1 second
  setInterval(fetchAndPopulateStatus, 1000);
});
