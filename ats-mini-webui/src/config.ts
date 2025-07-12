import type {Config, ConfigOptions} from "./types";
import {
  byId,
  checkboxValue,
  inputValue,
  populateSelect,
  responseToJson,
  setCheckboxValue,
  setInputValue
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
    utcOffsetIdx: parseInt(inputValue('utcoffset')),
    themeIdx: parseInt(inputValue('theme')),
    scrollDirection: checkboxValue('scroll') ? -1 : 1,
    zoomMenu: checkboxValue('zoom'),
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
  setInputValue('utcoffset', config.utcOffsetIdx.toString());
  setInputValue('theme', config.themeIdx.toString());
  setCheckboxValue('scroll', config.scrollDirection === -1);
  setCheckboxValue('zoom', config.zoomMenu);
}

document.addEventListener('DOMContentLoaded', () => {
  const configForm = byId('configForm') as HTMLFormElement;
  if (configForm) {
    configForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveConfig();
    });
  }

  Promise.all([
    fetch('/api/configOptions')
      .then(responseToJson),
    fetch('/api/config')
      .then(responseToJson),
  ])
    .then(([configOptions, config]: [ConfigOptions, Config]) => {
      populateSelect('utcoffset', configOptions.UTCOffsets.map(o => ({
        value: o.id.toString(),
        label: `${o.city} (${o.desc})`
      })));
      populateSelect('theme', configOptions.themes.map(t => ({value: t.id.toString(), label: t.name})));
      populateConfig(config);
    })
    .catch(error => {
      console.error('Error fetching config:', error);
    });
});
