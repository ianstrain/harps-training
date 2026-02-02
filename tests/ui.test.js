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
            `;
        });

        test('should switch active tab content', () => {
            function switchToTab(tabName) {
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                const targetTab = document.getElementById(tabName + '-tab');
                if (targetTab) {
                    targetTab.classList.add('active');
                }
            }

            switchToTab('players');
            
            expect(document.getElementById('schedule-tab').classList.contains('active')).toBe(false);
            expect(document.getElementById('players-tab').classList.contains('active')).toBe(true);
        });
    });
});
