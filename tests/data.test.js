/**
 * Data Management Tests
 */

describe('Data Management', () => {
    beforeEach(() => {
        global.sessions = [];
        global.players = [];
        localStorage.clear();
        jest.clearAllMocks();
    });

    describe('Session Data Serialization', () => {
        test('should serialize session for localStorage', () => {
            const session = {
                id: 1,
                desc: 'Test session',
                warmup: 'Warm up drills',
                drills: 'Passing drills',
                game: 'Small sided game',
                attendance: ['Player 1', 'Player 2'],
                captain: 'Player 1'
            };

            const data = {};
            data[session.id + '_desc'] = session.desc;
            data[session.id + '_warmup'] = session.warmup;
            data[session.id + '_drills'] = session.drills;
            data[session.id + '_game'] = session.game;
            data[session.id + '_attendance'] = JSON.stringify(session.attendance);
            data[session.id + '_captain'] = session.captain;

            expect(data['1_desc']).toBe('Test session');
            expect(data['1_attendance']).toBe('["Player 1","Player 2"]');
        });

        test('should deserialize attendance from JSON string', () => {
            const attendanceJson = '["Player 1","Player 2"]';
            const attendance = JSON.parse(attendanceJson);
            
            expect(attendance).toEqual(['Player 1', 'Player 2']);
            expect(attendance.length).toBe(2);
        });
    });

    describe('Session List Data', () => {
        test('should create session list data object', () => {
            const session = {
                id: 1,
                date: new Date('2026-02-03'),
                cancelled: false,
                cancelReason: '',
                location: 'The Aura',
                time: '7:30 PM - 8:30 PM',
                kickOffTime: '',
                deleted: false,
                type: 'training'
            };

            const sessionsListData = {
                [session.id]: {
                    id: session.id,
                    date: session.date.toISOString(),
                    cancelled: session.cancelled,
                    cancelReason: session.cancelReason,
                    location: session.location,
                    time: session.time,
                    kickOffTime: session.kickOffTime,
                    deleted: session.deleted,
                    type: session.type
                }
            };

            expect(sessionsListData[1].id).toBe(1);
            expect(sessionsListData[1].type).toBe('training');
            expect(sessionsListData[1].location).toBe('The Aura');
        });

        test('should include match-specific fields for match sessions', () => {
            const matchSession = {
                id: 2,
                date: new Date('2026-02-08'),
                type: 'match',
                opponent: 'Rival FC',
                matchType: 'league',
                cupStage: ''
            };

            const sessionsListData = {
                [matchSession.id]: {
                    id: matchSession.id,
                    type: matchSession.type,
                    opponent: matchSession.opponent,
                    matchType: matchSession.matchType,
                    cupStage: matchSession.cupStage
                }
            };

            expect(sessionsListData[2].opponent).toBe('Rival FC');
            expect(sessionsListData[2].matchType).toBe('league');
        });
    });

    describe('Player Data', () => {
        test('should create player list data object', () => {
            const player = {
                player: 'John Doe',
                position: 'Midfielder',
                returning: 'yes',
                deleted: false
            };

            const playersListData = {
                [player.player]: {
                    player: player.player,
                    position: player.position,
                    returning: player.returning,
                    deleted: player.deleted
                }
            };

            expect(playersListData['John Doe'].player).toBe('John Doe');
            expect(playersListData['John Doe'].position).toBe('Midfielder');
        });

        test('player save payload should include clubRegistration and faiConnectRegistration for Firebase', () => {
            const player = {
                player: 'Jane Doe',
                jersey: '7',
                parent: 'Guardian',
                year: '2013',
                returning: 'yes',
                deleted: false,
                clubRegistration: true,
                faiConnectRegistration: false
            };
            const payload = {
                player: player.player,
                jersey: player.jersey || '',
                parent: player.parent || '',
                year: player.year || '',
                returning: player.returning || '',
                deleted: player.deleted || false,
                clubRegistration: player.clubRegistration === true,
                faiConnectRegistration: player.faiConnectRegistration === true
            };
            expect(payload.clubRegistration).toBe(true);
            expect(payload.faiConnectRegistration).toBe(false);
        });
    });

    describe('Goals Data', () => {
        test('should structure goals data correctly', () => {
            const goalsData = {
                'Player 1': {
                    '2026-02-01': 2,
                    '2026-02-08': 1
                },
                'Player 2': {
                    '2026-02-01': 1
                }
            };

            expect(goalsData['Player 1']['2026-02-01']).toBe(2);
            expect(goalsData['Player 2']['2026-02-01']).toBe(1);
        });

        test('should calculate total goals across all matches', () => {
            const goalsData = {
                'Player 1': { '2026-02-01': 2, '2026-02-08': 1 },
                'Player 2': { '2026-02-01': 1 }
            };

            let totalGoals = 0;
            Object.values(goalsData).forEach(playerGoals => {
                totalGoals += Object.values(playerGoals).reduce((sum, g) => sum + g, 0);
            });

            expect(totalGoals).toBe(4);
        });
    });

    describe('Data Validation', () => {
        test('should handle missing session fields with defaults', () => {
            const rawSession = { id: 1 };
            
            const session = {
                id: rawSession.id,
                date: rawSession.date ? new Date(rawSession.date) : new Date(),
                type: rawSession.type || 'training',
                location: rawSession.location || 'The Aura',
                time: rawSession.time || '7:30 PM - 8:30 PM',
                cancelled: rawSession.cancelled || false,
                deleted: rawSession.deleted || false,
                attendance: rawSession.attendance || []
            };

            expect(session.type).toBe('training');
            expect(session.location).toBe('The Aura');
            expect(session.attendance).toEqual([]);
        });

        test('should parse session ID as integer', () => {
            const sessionIdString = '123';
            const sessionIdInt = parseInt(sessionIdString);
            
            expect(typeof sessionIdInt).toBe('number');
            expect(sessionIdInt).toBe(123);
        });
    });
});
