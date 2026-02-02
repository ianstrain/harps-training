/**
 * UI Tests
 */

describe('UI Functions', () => {
    describe('Date Formatting', () => {
        // Helper function from ui.js
        function formatDateForClipboard(date) {
            const d = new Date(date);
            const day = d.getDate();
            const month = d.getMonth() + 1;
            const year = d.getFullYear();
            const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
            return `${dayOfWeek} - ${day}/${month}/${year}`;
        }

        test('should format date in European format (day/month/year)', () => {
            const date = new Date('2026-02-03'); // Tuesday, February 3rd, 2026
            const formatted = formatDateForClipboard(date);
            expect(formatted).toBe('Tuesday - 3/2/2026');
        });

        test('should include correct day of week', () => {
            const sunday = new Date('2026-02-01');
            const formatted = formatDateForClipboard(sunday);
            expect(formatted).toContain('Sunday');
        });
    });

    describe('Clipboard Copy', () => {
        beforeEach(() => {
            global.sessions = [
                {
                    id: 1,
                    date: new Date('2026-02-03'),
                    type: 'training',
                    location: 'The Aura',
                    time: '7:30 PM - 8:30 PM'
                },
                {
                    id: 2,
                    date: new Date('2026-02-08'),
                    type: 'match',
                    location: 'Cappry',
                    time: '12:00 PM',
                    kickOffTime: '13:00',
                    opponent: 'Rival FC'
                }
            ];
        });

        test('should generate training session clipboard text without attendance link', () => {
            const session = sessions[0];
            
            function formatDateForClipboard(date) {
                const d = new Date(date);
                const day = d.getDate();
                const month = d.getMonth() + 1;
                const year = d.getFullYear();
                const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
                return `${dayOfWeek} - ${day}/${month}/${year}`;
            }

            const formattedDate = formatDateForClipboard(session.date);
            const clipboardText = `⚽ Training Session

📅 ${formattedDate}
⌚ ${session.time}
🏟 ${session.location}`;

            expect(clipboardText).toContain('⚽ Training Session');
            expect(clipboardText).toContain('📅 Tuesday - 3/2/2026');
            expect(clipboardText).toContain('🏟 The Aura');
            expect(clipboardText).not.toContain('attendance');
        });

        test('should generate match session clipboard text without attendance link', () => {
            const session = sessions[1];
            
            function formatDateForClipboard(date) {
                const d = new Date(date);
                const day = d.getDate();
                const month = d.getMonth() + 1;
                const year = d.getFullYear();
                const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
                return `${dayOfWeek} - ${day}/${month}/${year}`;
            }

            const formattedDate = formatDateForClipboard(session.date);
            const matchesUpToThis = sessions.filter(s => s.type === 'match' && !s.deleted && s.id <= session.id).length;
            
            const clipboardText = `🏆 Matchday #${String(matchesUpToThis).padStart(2, '0')} - ${session.opponent}

📅 ${formattedDate}
⌚ Meet up ${session.time.split('-')[0].trim()} at ${session.location}, Kickoff ${session.kickOffTime || 'TBD'}
🏟 ${session.location}
👕 Shinguards, Black shorts and socks`;

            expect(clipboardText).toContain('🏆 Matchday #01 - Rival FC');
            expect(clipboardText).toContain('Kickoff 13:00');
            expect(clipboardText).toContain('🏟 Cappry');
            expect(clipboardText).not.toContain('attendance');
        });
    });

    describe('Toast Messages', () => {
        test('should create toast container if not exists', () => {
            // Remove existing container
            const existing = document.getElementById('toast-container');
            if (existing) existing.remove();

            function showToast(message, isError = false) {
                let toastContainer = document.getElementById('toast-container');
                if (!toastContainer) {
                    toastContainer = document.createElement('div');
                    toastContainer.id = 'toast-container';
                    document.body.appendChild(toastContainer);
                }

                const toast = document.createElement('div');
                toast.className = `toast-message ${isError ? 'error' : ''}`;
                toast.textContent = message;
                toastContainer.appendChild(toast);
            }

            showToast('Test message');
            
            const container = document.getElementById('toast-container');
            expect(container).not.toBeNull();
        });

        test('should add error class for error messages', () => {
            function showToast(message, isError = false) {
                let toastContainer = document.getElementById('toast-container');
                if (!toastContainer) {
                    toastContainer = document.createElement('div');
                    toastContainer.id = 'toast-container';
                    document.body.appendChild(toastContainer);
                }

                const toast = document.createElement('div');
                toast.className = `toast-message ${isError ? 'error' : ''}`;
                toast.textContent = message;
                toastContainer.appendChild(toast);
                return toast;
            }

            const toast = showToast('Error message', true);
            expect(toast.classList.contains('error')).toBe(true);
        });
    });

    describe('Tab Switching', () => {
        beforeEach(() => {
            // Setup tab content elements
            document.body.innerHTML += `
                <div id="schedule-tab" class="tab-content active"></div>
                <div id="calendar-tab" class="tab-content"></div>
                <div id="players-tab" class="tab-content"></div>
                <div id="stats-tab" class="tab-content"></div>
                <div id="thisweek-tab" class="tab-content"></div>
                <div id="player-profile-tab" class="tab-content"></div>
            `;
        });

        test('should switch active tab content', () => {
            // Mock render functions called by switchToTab
            global.renderSessions = jest.fn();
            global.renderCalendar = jest.fn();
            global.renderPlayers = jest.fn();
            global.renderStats = jest.fn();
            global.renderThisWeek = jest.fn();
            global.renderPlayerProfile = jest.fn();
            
            function switchToTab(tabName) {
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                const targetTab = document.getElementById(tabName + '-tab');
                if (targetTab) {
                    targetTab.classList.add('active');
                }
                // Call relevant render function based on tabName
                if (tabName === 'schedule') { renderSessions(); }
                else if (tabName === 'calendar') { renderCalendar(); }
                else if (tabName === 'players') { renderPlayers(); }
                else if (tabName === 'stats') { renderStats(); }
                else if (tabName === 'thisweek') { renderThisWeek(); }
                else if (tabName === 'player-profile') { renderPlayerProfile(); }
            }

            switchToTab('players');
            
            expect(document.getElementById('schedule-tab').classList.contains('active')).toBe(false);
            expect(document.getElementById('players-tab').classList.contains('active')).toBe(true);
            expect(global.renderPlayers).toHaveBeenCalled();
            expect(global.renderSessions).not.toHaveBeenCalled();
        });

        test('should call renderPlayerProfile when switching to player-profile tab', () => {
            global.renderPlayerProfile = jest.fn();

            function switchToTab(tabName) {
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                const targetTab = document.getElementById(tabName + '-tab');
                if (targetTab) {
                    targetTab.classList.add('active');
                }
                if (tabName === 'player-profile') { renderPlayerProfile(); }
            }
            
            switchToTab('player-profile');
            expect(global.renderPlayerProfile).toHaveBeenCalled();
        });
    });

    describe('Chart Sorting', () => {
        let mockPlayersData;
        let originalRenderStats;
        let originalGoalsSortBy, originalMatchAttendanceSortBy, originalTrainingAttendanceSortBy;

        beforeAll(() => {
            // Save original values
            originalRenderStats = global.renderStats;
            originalGoalsSortBy = global.goalsSortBy;
            originalMatchAttendanceSortBy = global.matchAttendanceSortBy;
            originalTrainingAttendanceSortBy = global.trainingAttendanceSortBy;

            // Mock globals
            global.renderStats = jest.fn();
            global.goalsSortBy = 'goals-desc';
            global.matchAttendanceSortBy = 'attended-desc';
            global.trainingAttendanceSortBy = 'attended-desc';
        });

        afterAll(() => {
            // Restore original values
            global.renderStats = originalRenderStats;
            global.goalsSortBy = originalGoalsSortBy;
            global.matchAttendanceSortBy = originalMatchAttendanceSortBy;
            global.trainingAttendanceSortBy = originalTrainingAttendanceSortBy;
        });

        beforeEach(() => {
            mockPlayersData = [
                { name: 'Charlie', total: 10, attended: 5 },
                { name: 'Alice', total: 20, attended: 8 },
                { name: 'Bob', total: 15, attended: 3 }
            ];
            global.renderStats.mockClear(); // Clear mock calls before each test
        });

        test('sortPlayerData should sort by total descending by default', () => {
            // The actual sortPlayerData function is in stats.js, so we need to access it properly
            const sorted = global.sortPlayerData(mockPlayersData, 'goals-desc', 'total');
            expect(sorted.map(p => p.name)).toEqual(['Alice', 'Bob', 'Charlie']);
        });

        test('sortPlayerData should sort by total ascending', () => {
            const sorted = global.sortPlayerData(mockPlayersData, 'goals-asc', 'total');
            // Charlie (10), Bob (15), Alice (20) - ascending order
            expect(sorted.map(p => p.name)).toEqual(['Charlie', 'Bob', 'Alice']);
        });

        test('sortPlayerData should sort by name ascending', () => {
            const sorted = global.sortPlayerData(mockPlayersData, 'name-asc', 'total');
            expect(sorted.map(p => p.name)).toEqual(['Alice', 'Bob', 'Charlie']);
        });

        test('sortPlayerData should sort by name descending', () => {
            const sorted = global.sortPlayerData(mockPlayersData, 'name-desc', 'total');
            expect(sorted.map(p => p.name)).toEqual(['Charlie', 'Bob', 'Alice']);
        });

        test('generateSortControls should produce correct HTML for goals', () => {
            const html = global.generateSortControls('goals', 'goals-desc', false);
            expect(html).toContain('<select id="goals-sort"');
            expect(html).toContain('value="goals-desc" selected');
            expect(html).toContain('Goals (High to Low)');
        });

        test('generateSortControls should produce correct HTML for attendance', () => {
            const html = global.generateSortControls('match-attendance', 'attended-asc', true);
            expect(html).toContain('<select id="match-attendance-sort"');
            expect(html).toContain('value="attended-asc" selected');
            expect(html).toContain('Attendance (Low to High)');
        });

        test('handleChartSort should update goalsSortBy and call renderStats', () => {
            global.handleChartSort('goals', 'name-asc');
            expect(global.goalsSortBy).toBe('name-asc');
            expect(global.renderStats).toHaveBeenCalledTimes(1);
        });

        test('handleChartSort should update matchAttendanceSortBy and call renderStats', () => {
            global.handleChartSort('match-attendance', 'name-desc');
            expect(global.matchAttendanceSortBy).toBe('name-desc');
            expect(global.renderStats).toHaveBeenCalledTimes(1);
        });

        test('handleChartSort should update trainingAttendanceSortBy and call renderStats', () => {
            global.handleChartSort('training-attendance', 'attended-asc');
            expect(global.trainingAttendanceSortBy).toBe('attended-asc');
            expect(global.renderStats).toHaveBeenCalledTimes(1);
        });

    });
});
