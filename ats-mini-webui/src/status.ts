import type {Status} from "./types";
import {byId, formatFrequency, responseToJson, setCellText} from "./utils";


const populateStatus = (status: Status) => {
  const ipElement = byId('ip') as HTMLAnchorElement;
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

document.addEventListener('DOMContentLoaded', () => {
  fetchAndPopulateStatus();
});
