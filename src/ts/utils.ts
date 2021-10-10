export function secondsToHms(seconds: number) {
    if (isNaN(seconds) || seconds === undefined)
        return '0:00';

    seconds = Math.round(seconds);
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = seconds % 60;
    let hs = h.toString();
    let ms = m.toString();
    let ss = s.toString();
    if (hs !== '0') {
        ms = ms.padStart(2, '0');
        ss = ss.padStart(2, '0');
    }
    ss = ss.padStart(2, '0');

    if (hs === '0')
        return `${ms}:${ss}`;
    else return `${hs}:${ms}:${ss}`;
}
