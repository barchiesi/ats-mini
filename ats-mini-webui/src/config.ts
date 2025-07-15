import {Config, ConfigOptions} from "./types";
import {
  checkboxValue,
  inputValue,
  populateSelect,
  responseToJson,
  setCheckboxValue,
  setInputValue,
  syncValues
} from "./utils";


const saveConfig = () => {
  const config: Config = {
    username: inputValue('username'),
    password: inputValue('password'),
    wifissid1: inputValue('wifissid1'),
    wifipass1: inputValue('wifipass1'),
    wifissid2: inputValue('wifissid2'),
    wifipass2: inputValue('wifipass2'),
    wifissid3: inputValue('wifissid3'),
    wifipass3: inputValue('wifipass3'),
    brightness: parseInt(inputValue('brightness')),
    calibration: parseInt(inputValue('calibration')),
    rdsModeIdx: parseInt(inputValue('rdsModes')),
    utcOffsetIdx: parseInt(inputValue('utcoffset')),
    fmRegionIdx: parseInt(inputValue('fmRegions')),
    themeIdx: parseInt(inputValue('theme')),
    uiLayoutIdx: parseInt(inputValue('uiLayouts')),
    zoomMenu: checkboxValue('zoom'),
    scrollDirection: checkboxValue('scroll') ? -1 : 1,
    sleepModeIdx: parseInt(inputValue('sleepModes')),
  };

  fetch('/api/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config)
  })
    .then(responseToJson)
    .then((updatedConfig: Config) => {
      populateConfig(updatedConfig)
    })
    .catch(error => {
      console.error('Error saving config:', error);
    });
}

const populateConfig = (config: Config) => {
  setInputValue('username', config.username);
  setInputValue('password', config.username);
  setInputValue('wifissid1', config.wifissid1);
  setInputValue('wifipass1', config.wifipass1);
  setInputValue('wifissid2', config.wifissid2);
  setInputValue('wifipass2', config.wifipass2);
  setInputValue('wifissid3', config.wifissid3);
  setInputValue('wifipass3', config.wifipass3);
  setInputValue('wifipass3', config.wifipass3);
  setInputValue('brightness', config.brightness.toString());

  const brightnessValueSpan = document.getElementById('brightnessValue') as HTMLSpanElement;
  if (brightnessValueSpan) brightnessValueSpan.textContent = config.brightness.toString();

  setInputValue('calibration', config.calibration.toString());
  const calibrationValueSpan = document.getElementById('calibrationValue') as HTMLSpanElement;
  if (calibrationValueSpan) calibrationValueSpan.textContent = config.calibration.toString();

  setInputValue('rdsModes', config.rdsModeIdx.toString());
  setInputValue('utcoffset', config.utcOffsetIdx.toString());
  setInputValue('fmRegions', config.fmRegionIdx.toString());
  setInputValue('theme', config.themeIdx.toString());
  setInputValue('uiLayouts', config.uiLayoutIdx.toString());
  setCheckboxValue('zoom', config.zoomMenu);
  setCheckboxValue('scroll', config.scrollDirection === -1);
  setInputValue('sleepModes', config.sleepModeIdx.toString());
}

document.addEventListener('DOMContentLoaded', () => {
  const configForm = document.getElementById('configForm') as HTMLFormElement;
  if (configForm) {
    configForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveConfig();
    });
  }

  syncValues('brightness', 'brightnessValue');
  syncValues('calibration', 'calibrationValue');

  Promise.all([
    fetch('/api/configOptions')
      .then(responseToJson),
    fetch('/api/config')
      .then(responseToJson),
  ])
    .then(([configOptions, config]: [ConfigOptions, Config]) => {
      populateSelect('rdsModes', configOptions.rdsModes.map(t => ({value: t.id.toString(), label: t.desc})));
      populateSelect('utcoffset', configOptions.UTCOffsets.map(o => ({
        value: o.id.toString(),
        label: `${o.city} (${o.desc})`
      })));
      populateSelect('fmRegions', configOptions.fmRegions.map(t => ({value: t.id.toString(), label: t.desc})));
      populateSelect('theme', configOptions.themes.map(t => ({value: t.id.toString(), label: t.name})));
      populateSelect('uiLayouts', configOptions.uiLayouts.map(t => ({value: t.id.toString(), label: t.name})));
      populateSelect('sleepModes', configOptions.sleepModes.map(t => ({value: t.id.toString(), label: t.name})));

      populateConfig(config);
    })
    .catch(error => {
      console.error('Error fetching config:', error);
    });
});
