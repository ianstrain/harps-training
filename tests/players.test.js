/**
 * Players Tests
 */

describe('Players', () => {
    beforeEach(() => {
        global.players = [];
    });

    describe('Player Data Structure', () => {
        test('should create a valid player object', () => {
            const player = {
                player: 'John Doe',
                position: 'Midfielder',
                returning: 'yes',
                deleted: false
            };

            expect(player.player).toBe('John Doe');
            expect(player.position).toBe('Midfielder');
            expect(player.returning).toBe('yes');
            expect(player.deleted).toBe(false);
        });
    });

    describe('Player Filtering', () => {
        beforeEach(() => {
            global.players = [
                { player: 'Player 1', returning: 'yes', deleted: false },
                { player: 'Player 2', returning: 'no', deleted: false },
                { player: 'Player 3', returning: 'yes', deleted: true },
                { player: '?', returning: '', deleted: false },
                { player: 'Child 1', returning: 'yes', deleted: false }
            ];
        });

        test('should filter out deleted players', () => {
            const activePlayers = players.filter(p => !p.deleted);
            expect(activePlayers.length).toBe(4);
        });

        test('should filter out players not returning', () => {
            const returningPlayers = players.filter(p => {
                const returning = (p.returning || '').toString().toLowerCase().trim();
                return returning !== 'no';
            });
            expect(returningPlayers.length).toBe(4);
        });

        test('should filter out placeholder players', () => {
            const validPlayers = players.filter(p => {
                return p.player && p.player !== '?';
            });
            expect(validPlayers.length).toBe(4);
        });

        test('should filter out child placeholder players', () => {
            const validPlayers = players.filter(p => {
                const playerName = (p.player || '').toString().toLowerCase();
                return !playerName.includes('child');
            });
            expect(validPlayers.length).toBe(4);
        });

        test('should get active players for attendance', () => {
            const activePlayers = players.filter(p => {
                const returning = (p.returning || '').toString().toLowerCase().trim();
                const playerName = (p.player || '').toString().toLowerCase();
                return p.player && 
                       p.player !== '?' && 
                       !playerName.includes('child') &&
                       returning !== 'no' &&
                       !p.deleted;
            });
            expect(activePlayers.length).toBe(1);
            expect(activePlayers[0].player).toBe('Player 1');
        });
    });

    describe('Player Sorting', () => {
        beforeEach(() => {
            global.players = [
                { player: 'Zack', deleted: false },
                { player: 'Alice', deleted: false },
                { player: 'Mike', deleted: false }
            ];
        });

        test('should sort players alphabetically', () => {
            const sortedPlayers = [...players].sort((a, b) => 
                (a.player || '').localeCompare(b.player || '')
            );
            expect(sortedPlayers[0].player).toBe('Alice');
            expect(sortedPlayers[1].player).toBe('Mike');
            expect(sortedPlayers[2].player).toBe('Zack');
        });
    });

    describe('Player Goals', () => {
        test('should track goals per match date', () => {
            const playerGoals = {
                'Player 1': {
                    '2026-02-01': 2,
                    '2026-02-08': 1
                }
            };

            expect(playerGoals['Player 1']['2026-02-01']).toBe(2);
            expect(playerGoals['Player 1']['2026-02-08']).toBe(1);
        });

        test('should calculate total goals for a player', () => {
            const playerGoals = {
                '2026-02-01': 2,
                '2026-02-08': 1,
                '2026-02-15': 3
            };

            const totalGoals = Object.values(playerGoals).reduce((sum, goals) => sum + goals, 0);
            expect(totalGoals).toBe(6);
        });
    });
    
    describe('Player Information Editing', () => {
        beforeEach(() => {
            global.players = [
                { player: 'Test Player', jersey: '10', parent: 'Parent One', returning: 'yes', deleted: false }
            ];
            global.editMode = true;
            document.body.innerHTML = '<div id="players-container"></div>';
            global.savePlayersList.mockClear();
        });
        
        test('should render jersey and parent as input fields in edit mode', () => {
            global.renderPlayers(); // Call the actual render function
            
            const playerCard = document.querySelector('[data-player="Test Player"]');
            expect(playerCard).not.toBeNull();
            
            const jerseyInput = playerCard.querySelector('.player-jersey-input-edit');
            const parentInput = playerCard.querySelector('.player-parent-input-edit');
            
            expect(jerseyInput).not.toBeNull();
            expect(jerseyInput.value).toBe('10');
            expect(parentInput).not.toBeNull();
            expect(parentInput.value).toBe('Parent One');
        });
        
        test('should update player jersey on input change and save', () => {
            global.renderPlayers();
            
            const jerseyInput = document.querySelector('.player-jersey-input-edit');
            jerseyInput.value = '99';
            jerseyInput.dispatchEvent(new Event('change'));
            
            expect(global.players[0].jersey).toBe('99');
            expect(global.savePlayersList).toHaveBeenCalledTimes(1);
        });
        
        test('should update player parent on input change and save', () => {
            global.renderPlayers();
            
            const parentInput = document.querySelector('.player-parent-input-edit');
            parentInput.value = 'Parent Two';
            parentInput.dispatchEvent(new Event('change'));
            
            expect(global.players[0].parent).toBe('Parent Two');
            expect(global.savePlayersList).toHaveBeenCalledTimes(1);
        });
    });
    
    describe('Player Profile Navigation', () => {
        let originalSwitchToTab;

        beforeAll(() => {
            originalSwitchToTab = global.switchToTab;
            // Mock switchToTab to prevent actual tab switching during tests
            global.switchToTab = jest.fn();
        });

        afterAll(() => {
            global.switchToTab = originalSwitchToTab;
        });

        beforeEach(() => {
            global.players = [
                { player: 'Profile Test', jersey: '7', parent: 'Profile Parent', returning: 'yes', deleted: false }
            ];
            global.switchToTab.mockClear();
            global.currentProfilePlayer = undefined; // Reset before each test
            document.body.innerHTML = '<div id="players-container"></div>';
        });

        test('navigateToPlayerProfile should set currentProfilePlayer and switch tab', () => {
            global.navigateToPlayerProfile('Profile Test');
            expect(global.currentProfilePlayer).toBe('Profile Test');
            expect(global.switchToTab).toHaveBeenCalledWith('player-profile');
        });

        test('clicking player name should call navigateToPlayerProfile', () => {
            // Spy on navigateToPlayerProfile to track calls
            const navigateSpy = jest.spyOn(global, 'navigateToPlayerProfile');
            
            global.renderPlayers(); // Render players with actual function

            const clickablePlayerName = document.querySelector('.clickable-player-name[title="View full profile"]');
            expect(clickablePlayerName).not.toBeNull();

            clickablePlayerName.click();
            expect(navigateSpy).toHaveBeenCalledWith('Profile Test');
            
            navigateSpy.mockRestore();
        });
    });
});
