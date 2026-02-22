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

        test('should count match and training attendance for past sessions', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            global.sessions = [
                { id: 1, date: pastDate.toISOString(), type: 'match', deleted: false, attendance: ['Player 1', 'Player 2'] },
                { id: 2, date: pastDate.toISOString(), type: 'match', deleted: false, attendance: ['Player 2'] },
                { id: 3, date: pastDate.toISOString(), type: 'training', deleted: false, attendance: ['Player 1'] }
            ];
            const stats = window.getPlayerAttendanceStats('Player 1');
            expect(stats.matchesAttended).toBe(1);
            expect(stats.trainingsAttended).toBe(1);
            expect(stats.matchAttendancePercent).toBe(50);
            expect(stats.trainingAttendancePercent).toBe(100);
        });

        test('should exclude deleted sessions', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            global.sessions = [
                { id: 1, date: pastDate.toISOString(), type: 'match', deleted: true, attendance: ['Player 1'] }
            ];
            const stats = window.getPlayerAttendanceStats('Player 1');
            expect(stats.matchesAttended).toBe(0);
            expect(stats.totalMatches).toBe(0);
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
