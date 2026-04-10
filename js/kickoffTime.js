// Kick-off times: display and store as 12-hour with AM/PM (e.g. "1:30 PM").
// Legacy data may still use "HH:mm" 24-hour; it is shown and migrated on edit.

function looksLike24HourOnly(str) {
    const s = String(str).trim();
    return /^\d{1,2}:\d{2}$/.test(s) && !/am|pm/i.test(s);
}

function format24hTo12h(hhmm) {
    const m = String(hhmm).trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return String(hhmm).trim();
    let h = parseInt(m[1], 10);
    const min = m[2];
    const mi = parseInt(min, 10);
    if (h > 23 || h < 0 || mi > 59 || mi < 0) return String(hhmm).trim();
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${min} ${period}`;
}

/** Normalize user input to canonical "h:mm AM/PM", or "" if empty. */
window.normalizeKickOffTime = function(str) {
    if (str == null || String(str).trim() === '') return '';
    const s = String(str).trim();
    if (looksLike24HourOnly(s)) return format24hTo12h(s);
    let m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/);
    if (!m) m = s.match(/^(\d{1,2}):(\d{2})(AM|PM|am|pm)$/);
    if (m) {
        const h = parseInt(m[1], 10);
        const min = m[2];
        const mi = parseInt(min, 10);
        const p = m[3].toUpperCase();
        if (h < 1 || h > 12 || mi > 59 || mi < 0) return s;
        return `${h}:${min} ${p}`;
    }
    return s;
};

/** For card display, clipboard, and edit field value (migrates legacy 24h). */
window.formatKickOffTimeDisplay = function(stored) {
    if (stored == null || String(stored).trim() === '') return '';
    const s = String(stored).trim();
    if (looksLike24HourOnly(s)) return format24hTo12h(s);
    return window.normalizeKickOffTime(s);
};
