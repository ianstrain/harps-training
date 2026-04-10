require('../js/kickoffTime');

describe('kickoffTime', () => {
    test('normalizeKickOffTime converts 24h to canonical 12h', () => {
        expect(normalizeKickOffTime('13:00')).toBe('1:00 PM');
        expect(normalizeKickOffTime('00:00')).toBe('12:00 AM');
        expect(normalizeKickOffTime('12:00')).toBe('12:00 PM');
    });

    test('normalizeKickOffTime normalizes 12h input', () => {
        expect(normalizeKickOffTime('1:30 pm')).toBe('1:30 PM');
        expect(normalizeKickOffTime('1:30PM')).toBe('1:30 PM');
    });

    test('formatKickOffTimeDisplay migrates legacy 24h for display', () => {
        expect(formatKickOffTimeDisplay('13:05')).toBe('1:05 PM');
        expect(formatKickOffTimeDisplay('1:05 PM')).toBe('1:05 PM');
    });

    test('empty input', () => {
        expect(normalizeKickOffTime('')).toBe('');
        expect(normalizeKickOffTime('   ')).toBe('');
        expect(formatKickOffTimeDisplay('')).toBe('');
    });
});
