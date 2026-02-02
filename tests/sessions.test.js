/**
 * Sessions Tests
 */

describe('Sessions', () => {
    beforeEach(() => {
        global.sessions = [];
        global.players = [
            { player: 'Player 1', deleted: false },
            { player: 'Player 2', deleted: false },
            { player: 'Player 3', deleted: true }
        ];
    });

    describe('Session Data Structure', () => {
        test('should create a valid training session object', () => {
            const session = {
                id: 1,
                date: new Date('2026-02-03'),
                type: 'training',
                location: 'The Aura',
                time: '7:30 PM - 8:30 PM',
                cancelled: false,
                deleted: false,
                attendance: [],
                desc: '',
                warmup: '',
                drills: '',
                game: ''
            };

            expect(session.id).toBe(1);
            expect(session.type).toBe('training');
            expect(session.cancelled).toBe(false);
            expect(session.attendance).toEqual([]);
        });

        test('should create a valid match session object', () => {
            const session = {
                id: 2,
                date: new Date('2026-02-08'),
                type: 'match',
                location: 'Cappry',
                time: '12:00 PM',
                kickOffTime: '13:00',
                opponent: 'Rival FC',
                matchType: 'league',
                cancelled: false,
                deleted: false,
                attendance: [],
                captain: '',
                matchGoals: {},
                teamScore: '',
                opponentScore: ''
            };

            expect(session.id).toBe(2);
            expect(session.type).toBe('match');
            expect(session.opponent).toBe('Rival FC');
            expect(session.matchType).toBe('league');
            expect(session.kickOffTime).toBe('13:00');
        });
    });

    describe('Session Filtering', () => {
        beforeEach(() => {
            global.sessions = [
                { id: 1, date: new Date('2026-01-01'), type: 'training', deleted: false, cancelled: false },
                { id: 2, date: new Date('2026-02-01'), type: 'match', deleted: false, cancelled: false },
                { id: 3, date: new Date('2026-02-15'), type: 'training', deleted: true, cancelled: false },
                { id: 4, date: new Date('2026-03-01'), type: 'match', deleted: false, cancelled: true }
            ];
        });

        test('should filter out deleted sessions', () => {
            const activeSessions = sessions.filter(s => !s.deleted);
            expect(activeSessions.length).toBe(3);
            expect(activeSessions.find(s => s.id === 3)).toBeUndefined();
        });

        test('should filter training sessions only', () => {
            const trainingSessions = sessions.filter(s => s.type === 'training');
            expect(trainingSessions.length).toBe(2);
        });

        test('should filter match sessions only', () => {
            const matchSessions = sessions.filter(s => s.type === 'match');
            expect(matchSessions.length).toBe(2);
        });

        test('should filter future sessions', () => {
            const now = new Date('2026-02-02');
            const futureSessions = sessions.filter(s => new Date(s.date) >= now);
            // Sessions on 2026-02-15 and 2026-03-01 are future sessions (2 total)
            expect(futureSessions.length).toBe(2);
        });
    });

    describe('Attendance Management', () => {
        let session;

        beforeEach(() => {
            session = {
                id: 1,
                attendance: []
            };
        });

        test('should add player to attendance', () => {
            const playerName = 'Player 1';
            if (!session.attendance.includes(playerName)) {
                session.attendance.push(playerName);
            }
            expect(session.attendance).toContain('Player 1');
            expect(session.attendance.length).toBe(1);
        });

        test('should remove player from attendance', () => {
            session.attendance = ['Player 1', 'Player 2'];
            session.attendance = session.attendance.filter(p => p !== 'Player 1');
            expect(session.attendance).not.toContain('Player 1');
            expect(session.attendance.length).toBe(1);
        });

        test('should not add duplicate players', () => {
            session.attendance = ['Player 1'];
            const playerName = 'Player 1';
            if (!session.attendance.includes(playerName)) {
                session.attendance.push(playerName);
            }
            expect(session.attendance.length).toBe(1);
        });
    });

    describe('Match Scoring', () => {
        let matchSession;

        beforeEach(() => {
            matchSession = {
                id: 1,
                type: 'match',
                teamScore: '',
                opponentScore: '',
                result: ''
            };
        });

        test('should calculate win result', () => {
            matchSession.teamScore = '3';
            matchSession.opponentScore = '1';
            
            const teamScore = parseInt(matchSession.teamScore) || 0;
            const opponentScore = parseInt(matchSession.opponentScore) || 0;
            
            if (teamScore > opponentScore) {
                matchSession.result = 'win';
            } else if (teamScore < opponentScore) {
                matchSession.result = 'loss';
            } else {
                matchSession.result = 'draw';
            }
            
            expect(matchSession.result).toBe('win');
        });

        test('should calculate loss result', () => {
            matchSession.teamScore = '1';
            matchSession.opponentScore = '3';
            
            const teamScore = parseInt(matchSession.teamScore) || 0;
            const opponentScore = parseInt(matchSession.opponentScore) || 0;
            
            if (teamScore > opponentScore) {
                matchSession.result = 'win';
            } else if (teamScore < opponentScore) {
                matchSession.result = 'loss';
            } else {
                matchSession.result = 'draw';
            }
            
            expect(matchSession.result).toBe('loss');
        });

        test('should calculate draw result', () => {
            matchSession.teamScore = '2';
            matchSession.opponentScore = '2';
            
            const teamScore = parseInt(matchSession.teamScore) || 0;
            const opponentScore = parseInt(matchSession.opponentScore) || 0;
            
            if (teamScore > opponentScore) {
                matchSession.result = 'win';
            } else if (teamScore < opponentScore) {
                matchSession.result = 'loss';
            } else {
                matchSession.result = 'draw';
            }
            
            expect(matchSession.result).toBe('draw');
        });
    });
});
