import type {Status} from "./types";
import {byId, formatFrequency, responseToJson, setCellText} from "./utils";


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
  setCellText('band', status.band);
  setCellText('frequency', formatFrequency(status.freq, status.mode));
  setCellText('rssi', `${status.rssi}dBuV`);
  setCellText('snr', `${status.snr}dB`);
  setCellText('battery', `${status.battery.toFixed(2)}V`);
  setCellText('step', status.step);
  setCellText('bandwidth', status.bandwidth);
  setCellText('agc', status.agc ? "On" : "Off");
  setCellText('attenuation', status.attenuation !== undefined ? String(status.attenuation).padStart(2, '0') : "N/A");
  setCellText('volume', String(status.volume).padStart(2, '0'));
  setCellText('squelch', status.squelch ? `${status.squelch}dBuV` : 'N/A');
  setCellText('softMuteMaxAttIdx', status.softMuteMaxAttIdx !== undefined ? `${status.softMuteMaxAttIdx}dB` : "N/A");
  setCellText('avc', status.avc !== undefined ? `${status.avc}dB` : "N/A");
  setCellText('piCode', status.rds?.piCode ?? "N/A");
  setCellText('stationName', status.rds?.stationName ?? "N/A");
  setCellText('radioText', status.rds?.radioText ?? "N/A");
  setCellText('programInfo', status.rds?.programInfo ?? "N/A");
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
