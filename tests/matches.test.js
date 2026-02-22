/**
 * Match and rotation schedule tests
 */

describe('Match equal time and rotation', () => {
    describe('getEqualTimeSuggestions', () => {
        test('should return gk 60 and zero outfield when no attendance', () => {
            const result = window.getEqualTimeSuggestions([], 'Anyone');
            expect(result.gkMinutes).toBe(60);
            expect(result.outfieldMinutes).toBe(0);
            expect(result.outfieldCount).toBe(0);
        });

        test('should treat all as outfield when no goalkeeper set', () => {
            const result = window.getEqualTimeSuggestions(['A', 'B', 'C'], null);
            expect(result.hasGK).toBe(false);
            expect(result.outfieldCount).toBe(3);
            expect(result.outfieldMinutes).toBe(160); // 480/3
        });

        test('should exclude goalkeeper from outfield count when set', () => {
            const result = window.getEqualTimeSuggestions(['A', 'B', 'C', 'GK'], 'GK');
            expect(result.hasGK).toBe(true);
            expect(result.outfieldCount).toBe(3);
            expect(result.outfieldMinutes).toBe(160);
        });

        test('should not treat as GK when name not in attendance', () => {
            const result = window.getEqualTimeSuggestions(['A', 'B'], 'GK');
            expect(result.hasGK).toBe(false);
            expect(result.outfieldCount).toBe(2);
        });
    });

    describe('getRotationScheduleLeastChanges', () => {
        test('should return null for empty attendance', () => {
            expect(window.getRotationScheduleLeastChanges([], null)).toBeNull();
            expect(window.getRotationScheduleLeastChanges([], 'GK')).toBeNull();
        });

        test('should return one segment and zero changes when 8 or fewer outfield', () => {
            const outfield = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
            const result = window.getRotationScheduleLeastChanges(outfield, null);
            expect(result).not.toBeNull();
            expect(result.segments.length).toBe(1);
            expect(result.segments[0].startMin).toBe(0);
            expect(result.segments[0].endMin).toBe(60);
            expect(result.segments[0].playerNames).toEqual(outfield);
            expect(result.segments[0].playerNamesOff).toEqual([]);
            expect(result.totalChanges).toBe(0);
        });

        test('should exclude goalkeeper from outfield in rotation', () => {
            const list = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'GK'];
            const result = window.getRotationScheduleLeastChanges(list, 'GK');
            expect(result.segments[0].playerNames).not.toContain('GK');
            expect(result.segments[0].playerNames.length).toBe(8);
        });

        test('should return two segments for 10 outfield with correct coming on/going off', () => {
            const outfield = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
            const result = window.getRotationScheduleLeastChanges(outfield, null);
            expect(result.segments.length).toBe(2);
            expect(result.segments[0].startMin).toBe(0);
            expect(result.segments[0].endMin).toBe(30);
            expect(result.segments[1].startMin).toBe(30);
            expect(result.segments[1].endMin).toBe(60);
            expect(result.segments[0].playerNames).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
            expect(result.segments[1].playerNames).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'I', 'J']);
            expect(result.totalChanges).toBe(2);
            expect(result.segments[0].playerNamesOff).toEqual(['I', 'J']);
            expect(result.segments[1].playerNamesOff).toEqual(['G', 'H']);
        });

        test('should return three segments for 18 outfield', () => {
            const outfield = Array.from({ length: 18 }, (_, i) => `P${i + 1}`);
            const result = window.getRotationScheduleLeastChanges(outfield, null);
            expect(result.segments.length).toBe(3);
            expect(result.segments[0].endMin).toBe(20);
            expect(result.segments[1].endMin).toBe(40);
            expect(result.segments[2].endMin).toBe(60);
            result.segments.forEach(seg => {
                expect(seg.playerNames.length).toBe(8);
                expect(seg.playerNamesOff).toBeDefined();
                expect(seg.playerNamesOff.length).toBe(10);
            });
        });

        test('should return null for more than 24 outfield', () => {
            const outfield = Array.from({ length: 25 }, (_, i) => `P${i}`);
            expect(window.getRotationScheduleLeastChanges(outfield, null)).toBeNull();
        });
    });
});
