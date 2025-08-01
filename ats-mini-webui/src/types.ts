export interface Status {
  ip: string;
  ssid: string;
  mac: string;
  version: string;
  bandIdx: number;
  freq: number;
  modeIdx: number;
  rssi: number;
  snr: number;
  battery: number;
  stepIdx: number;
  bandwidthIdx: number;
  agc: boolean;
  attenuation?: number;
  time?: string;
  volume: number;
  squelch: number;
  softMuteMaxAttIdx?: number;
  avc?: number;
  rds?: {
    piCode?: string;
    stationName?: string;
    radioText?: string;
    programInfo?: string;
  }
}

export interface Memory {
  id?: number;
  freq?: number;
  band?: string;
  mode?: string;
  name?: string;
}

export interface UTCOffset {
  id: number;
  offset: number;
  desc: string;
  city: string;
}

export interface Theme {
  id: number;
  name: string;
}

export interface RdsMode {
  id: number;
  mode: number;
  desc: string;
}

export interface FmRegion {
  id: number;
  value: number;
  desc: string;
}

export interface UiLayout {
  id: number;
  name: string;
}

export interface SleepMode {
  id: number;
  name: string;
}

export interface ConfigOptions {
  rdsModes: RdsMode[];
  UTCOffsets: UTCOffset[];
  fmRegions: FmRegion[];
  themes: Theme[];
  uiLayouts: UiLayout[];
  sleepModes: SleepMode[];
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
  brightness: number;
  calibration: number;
  rdsModeIdx: number;
  utcOffsetIdx: number;
  fmRegionIdx: number;
  themeIdx: number;
  uiLayoutIdx: number;
  zoomMenu: boolean;
  scrollDirection: number;
  sleepModeIdx: number;
}

interface Band {
  id: number;
  name: string;
  type: number;
  modeIdx: number;
  minimumFreq: number;
  maximumFreq: number;
  currentFreq: number;
  currentStepIdx: number;
  bandwidthIdx: number;
  bandCal: number;
}

export interface Step {
  id: number;
  step: number;
  desc: string;
  spacing: number;
}

export interface Bandwidth {
  id: number;
  idx: number;
  desc: string;
}

export interface Mode {
  id: number;
  mode: string;
}

export interface StatusOptions {
  bands: Band[]
  steps: {
    fm: Step[]
    ssb: Step[]
    am: Step[]
  }
  bandwidths: {
    fm: Bandwidth[]
    ssb: Bandwidth[]
    am: Bandwidth[]
  }
  modes: Mode[]
}
