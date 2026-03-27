/**
 * Statistics Tests
 */

describe('Statistics', () => {
    beforeEach(() => {
        global.players = [];
        global.sessions = [];
        global.goalsSortBy = 'goals-desc';
        global.matchAttendanceSortBy = 'attended-desc';
        global.trainingAttendanceSortBy = 'attended-desc';
    });

    describe('sortPlayerData', () => {
        const mockData = [
            { name: 'Alice', total: 5, attended: 8 },
            { name: 'Bob', total: 12, attended: 10 },
            { name: 'Charlie', total: 3, attended: 5 }
        ];

        test('should sort by goals descending by default', () => {
            const sorted = window.sortPlayerData(mockData, 'goals-desc', 'total');
            expect(sorted[0].name).toBe('Bob');
            expect(sorted[1].name).toBe('Alice');
            expect(sorted[2].name).toBe('Charlie');
        });

        test('should sort by goals ascending', () => {
            const sorted = window.sortPlayerData(mockData, 'goals-asc', 'total');
            expect(sorted[0].name).toBe('Charlie');
            expect(sorted[2].name).toBe('Bob');
        });

        test('should sort by name A-Z', () => {
            const sorted = window.sortPlayerData(mockData, 'name-asc');
            expect(sorted[0].name).toBe('Alice');
            expect(sorted[1].name).toBe('Bob');
            expect(sorted[2].name).toBe('Charlie');
        });

        test('should sort by name Z-A', () => {
            const sorted = window.sortPlayerData(mockData, 'name-desc');
            expect(sorted[0].name).toBe('Charlie');
            expect(sorted[2].name).toBe('Alice');
        });

        test('should sort by attendance value when valueKey is used', () => {
            const sorted = window.sortPlayerData(mockData, 'attended-desc', 'attended');
            expect(sorted[0].name).toBe('Bob');
            expect(sorted[1].name).toBe('Alice');
        });
    });

    describe('getPlayerAttendanceStats', () => {
        test('should return zero stats when no sessions', () => {
            global.sessions = [];
            const stats = window.getPlayerAttendanceStats('Player 1');
            expect(stats.matchesAttended).toBe(0);
            expect(stats.matchAttendancePercent).toBe(0);
            expect(stats.trainingsAttended).toBe(0);
            expect(stats.trainingAttendancePercent).toBe(0);
        });

        test('should count match and training attendance for played matches and past training', () => {
            const pastDate = '2024-06-01T12:00:00.000Z';
            global.sessions = [
                { id: 1, date: pastDate, type: 'match', deleted: false, result: 'win', attendance: ['Player 1', 'Player 2'] },
                { id: 2, date: pastDate, type: 'match', deleted: false, result: 'loss', attendance: ['Player 2'] },
                { id: 3, date: pastDate, type: 'training', deleted: false, attendance: ['Player 1'] }
            ];
            const stats = window.getPlayerAttendanceStats('Player 1');
            expect(stats.matchesAttended).toBe(1);
            expect(stats.trainingsAttended).toBe(1);
            expect(stats.matchAttendancePercent).toBe(50);
            expect(stats.trainingAttendancePercent).toBe(100);
        });

        test('should not count matches without a result toward match attendance', () => {
            const pastDate = '2024-06-01T12:00:00.000Z';
            global.sessions = [
                { id: 1, date: pastDate, type: 'match', deleted: false, result: '', attendance: ['Player 1'] },
                { id: 2, date: pastDate, type: 'match', deleted: false, result: 'draw', attendance: ['Player 1'] }
            ];
            const stats = window.getPlayerAttendanceStats('Player 1');
            expect(stats.totalMatches).toBe(1);
            expect(stats.matchesAttended).toBe(1);
            expect(stats.matchAttendancePercent).toBe(100);
        });

        test('should exclude deleted sessions', () => {
            const pastDate = '2024-06-01T12:00:00.000Z';
            global.sessions = [
                { id: 1, date: pastDate, type: 'match', deleted: true, result: 'win', attendance: ['Player 1'] }
            ];
            const stats = window.getPlayerAttendanceStats('Player 1');
            expect(stats.matchesAttended).toBe(0);
            expect(stats.totalMatches).toBe(0);
        });
    });

    describe('aggregatePlayerMatchGoalsByMatchKind', () => {
        test('sums match card goals by league, friendly, and cup', () => {
            global.sessions = [
                {
                    id: 1,
                    type: 'match',
                    deleted: false,
                    matchType: 'league',
                    matchGoals: { Alice: 2, Bob: 1 }
                },
                {
                    id: 2,
                    type: 'match',
                    deleted: false,
                    matchType: 'friendly',
                    matchGoals: { Alice: 3 }
                },
                {
                    id: 3,
                    type: 'match',
                    deleted: false,
                    matchType: 'cup',
                    matchGoals: { Alice: 1 }
                }
            ];
            expect(window.aggregatePlayerMatchGoalsByMatchKind('Alice')).toEqual({
                league: 2,
                friendly: 3,
                cup: 1
            });
            expect(window.aggregatePlayerMatchGoalsByMatchKind('Bob')).toEqual({
                league: 1,
                friendly: 0,
                cup: 0
            });
        });

        test('ignores deleted matches and non-match sessions', () => {
            global.sessions = [
                { id: 1, type: 'match', deleted: true, matchType: 'league', matchGoals: { Alice: 9 } },
                { id: 2, type: 'training', deleted: false, matchGoals: { Alice: 9 } }
            ];
            expect(window.aggregatePlayerMatchGoalsByMatchKind('Alice')).toEqual({
                league: 0,
                friendly: 0,
                cup: 0
            });
        });
    });

    describe('buildPlayerGoalChartSegments', () => {
        test('assigns remainder to Other when stored total exceeds match sums', () => {
            const segs = window.buildPlayerGoalChartSegments(10, { league: 4, friendly: 2, cup: 1 });
            const byKey = Object.fromEntries(segs.map(s => [s.key, s.value]));
            expect(byKey.league).toBe(4);
            expect(byKey.friendly).toBe(2);
            expect(byKey.cup).toBe(1);
            expect(byKey.other).toBe(3);
        });

        test('scales match segments when match sums exceed stored total', () => {
            const segs = window.buildPlayerGoalChartSegments(10, { league: 8, friendly: 8, cup: 4 });
            const sum = segs.reduce((a, s) => a + s.value, 0);
            expect(sum).toBeCloseTo(10, 5);
            expect(segs.find(s => s.key === 'other')).toBeUndefined();
        });
    });

    describe('aggregatePlayerMatchAttendanceByMatchKind', () => {
        const matches = [
            { id: 1, matchType: 'league', attendance: ['Alice', 'Bob'] },
            { id: 2, matchType: 'friendly', attendance: ['Alice'] },
            { id: 3, matchType: 'cup', attendance: ['Alice', 'Bob'] },
            { id: 4, matchType: 'league', attendance: ['Bob'] }
        ];

        test('counts attended matches by type', () => {
            expect(window.aggregatePlayerMatchAttendanceByMatchKind('Alice', matches)).toEqual({
                league: 1,
                friendly: 1,
                cup: 1
            });
            expect(window.aggregatePlayerMatchAttendanceByMatchKind('Bob', matches)).toEqual({
                league: 2,
                friendly: 0,
                cup: 1
            });
        });

        test('treats missing matchType as friendly', () => {
            const m = [{ id: 1, attendance: ['Zed'] }];
            expect(window.aggregatePlayerMatchAttendanceByMatchKind('Zed', m)).toEqual({
                league: 0,
                friendly: 1,
                cup: 0
            });
        });
    });

    describe('buildMatchAttendanceChartSegments', () => {
        test('returns only non-zero segments in league, friendly, cup order', () => {
            const segs = window.buildMatchAttendanceChartSegments({ league: 2, friendly: 0, cup: 1 });
            expect(segs.map(s => s.key)).toEqual(['league', 'cup']);
            expect(segs.map(s => s.value)).toEqual([2, 1]);
        });
    });

    describe('handleChartSort', () => {
        beforeEach(() => {
            global.renderStats = jest.fn();
        });

        test('should set goalsSortBy and call renderStats for goals chart', () => {
            window.handleChartSort('goals', 'goals-asc');
            expect(global.goalsSortBy).toBe('goals-asc');
            expect(global.renderStats).toHaveBeenCalled();
        });

        test('should set matchAttendanceSortBy for match-attendance chart', () => {
            window.handleChartSort('match-attendance', 'name-asc');
            expect(global.matchAttendanceSortBy).toBe('name-asc');
        });

        test('should set trainingAttendanceSortBy for training-attendance chart', () => {
            window.handleChartSort('training-attendance', 'attended-asc');
            expect(global.trainingAttendanceSortBy).toBe('attended-asc');
        });
    });
});
