interface Info {
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
}

function populateInfo(info: Info): void {
    const ipElement = document.getElementById('ip') as HTMLAnchorElement;
    if (ipElement) {
        ipElement.textContent = info.ip;
        ipElement.href = `http://${info.ip}`;
    }

    const ssidElement = document.getElementById('ssid');
    if (ssidElement) ssidElement.textContent = info.ssid;

    const macElement = document.getElementById('mac');
    if (macElement) macElement.textContent = info.mac;

    const versionElement = document.getElementById('version');
    if (versionElement) versionElement.textContent = info.version;

    const bandElement = document.getElementById('band');
    if (bandElement) bandElement.textContent = info.band;

    const frequencyElement = document.getElementById('frequency');
    const frequency = info.mode === "FM" ? `${(info.freq / 100).toFixed(2)}MHz` : `${info.freq.toFixed(2)}kHz`
    if (frequencyElement) frequencyElement.textContent = `${frequency} ${info.mode}`

    const rssiElement = document.getElementById('rssi');
    if (rssiElement) rssiElement.textContent = `${info.rssi}dBuV`;

    const snrElement = document.getElementById('snr');
    if (snrElement) snrElement.textContent = `${info.snr}dB`;

    const batteryElement = document.getElementById('battery');
    if (batteryElement) batteryElement.textContent = `${info.battery.toFixed(2)}V`;
}

document.addEventListener('DOMContentLoaded', () => {
    function fetchAndPopulate() {
        // Fetch info from API
        fetch('/api/info')
            .then(response => response.json())
            .then((info: Info) => {
                populateInfo(info);
            })
            .catch(error => {
                console.error('Error fetching device info:', error);
            });
    }

    // Initial fetch
    fetchAndPopulate();

    // Repeat every 1 second
    setInterval(fetchAndPopulate, 1000);
});
