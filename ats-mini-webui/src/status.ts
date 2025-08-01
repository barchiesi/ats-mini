import type {Bandwidth, Status, StatusOptions, Step} from "./types";
import {byId, formatFrequency, setCellText} from "./utils";
import {statusApi, statusOptionsApi} from "./atsminiApi.ts";


const populateStatus = (status: Status) => {
  const band = statusOptions.bands.find(b => b.id === status.bandIdx)?.name ?? 'N/A';
  const mode = statusOptions.modes.find(m => m.id === status.modeIdx)?.mode ?? 'N/A';
  let modeSteps: Step[];
  if (mode === "FM") {
    modeSteps = statusOptions.steps.fm;
  } else if (mode === "AM") {
    modeSteps = statusOptions.steps.am;
  } else {
    modeSteps = statusOptions.steps.ssb;
  }
  const step = modeSteps.find(m => m.id === status.stepIdx)?.desc ?? 'N/A';

  let modeBandwidths: Bandwidth[];
  if (mode === "FM") {
    modeBandwidths = statusOptions.bandwidths.fm;
  } else if (mode === "AM") {
    modeBandwidths = statusOptions.bandwidths.am;
  } else {
    modeBandwidths = statusOptions.bandwidths.ssb;
  }
  const bandwidth = modeBandwidths.find(m => m.id === status.bandwidthIdx)?.desc ?? 'N/A';


  const ipElement = byId('ip') as HTMLAnchorElement;
  if (ipElement) {
    ipElement.textContent = status.ip;
    ipElement.href = `http://${status.ip}`;
  }

  setCellText('time', status.time ?? 'N/A');
  setCellText('ssid', status.ssid);
  setCellText('mac', status.mac);
  setCellText('version', status.version);
  setCellText('band', band);
  setCellText('frequency', formatFrequency(status.freq, mode));
  setCellText('mode', mode);
  setCellText('rssi', `${status.rssi}dBuV`);
  setCellText('snr', `${status.snr}dB`);
  setCellText('battery', `${status.battery.toFixed(2)}V`);
  setCellText('step', step);
  setCellText('bandwidth', bandwidth);
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
  statusApi()
    .then((status: Status) => {
      setTimeout(fetchAndPopulateStatus, 1000);
      populateStatus(status);
    })
    .catch(() => {
      setTimeout(fetchAndPopulateStatus, 1000);
    });
}

const statusOptions: StatusOptions = await statusOptionsApi()

fetchAndPopulateStatus();
