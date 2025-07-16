export interface Status {
  ip: string;
  ssid: string;
  mac: string;
  version: string;
  band: string;
  freq: number;
  mode: string;
  rssi: number;
  snr: number;
  battery: number;
  step: string;
  bandwidth: string;
  agc: boolean;
  attenuation?: number;
  time?: string;
  volume: number;
  squelch?: number;
  softMuteMaxAttIdx: number;
  avc?: number;
  rds?: {
    piCode?: string;
    stationName?: string;
    radioText?: string;
    programInfo?: string;
  }
}

export interface Memory {
  freq?: number;
  band?: string;
  mode?: string;
}

interface UTCOffset {
  id: number;
  offset: number;
  desc: string;
  city: string;
}

interface Theme {
  id: number;
  name: string;
}

export interface ConfigOptions {
  UTCOffsets: UTCOffset[];
  themes: Theme[];
}

export interface Config {
  username: string;
  password: string;
  wifissid1: string;
  wifipass1: string;
  wifissid2: string;
  wifipass2: string;
  wifissid3: string;
  wifipass3: string;
  utcOffsetIdx: number;
  themeIdx: number;
  scrollDirection: number;
  zoomMenu: boolean;
}
