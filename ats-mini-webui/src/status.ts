import type {Status} from "./types";
import {byId, formatFrequency, setCellText} from "./utils";
import {statusApi} from "./atsminiApi.ts";


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
  statusApi()
    .then((status: Status) => {
      setTimeout(fetchAndPopulateStatus, 1000);
      populateStatus(status);
    })
    .catch(() => {
      setTimeout(fetchAndPopulateStatus, 1000);
    });
}

fetchAndPopulateStatus();
