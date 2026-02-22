/**
 * Calendar Tests
 */

describe('Calendar', () => {
    let originalRenderCalendar;

    beforeEach(() => {
        global.sessions = [];
        global.players = [
            { player: 'Player 1', returning: 'yes', deleted: false },
            { player: 'Player 2', returning: 'yes', deleted: false }
        ];
        originalRenderCalendar = window.renderCalendar;
        window.renderCalendar = jest.fn();
        document.body.innerHTML = `
            <div id="calendar-container"></div>
            <div id="calendarTitle"></div>
            <div id="thisweek-container"></div>
        `;
    });

    afterEach(() => {
        window.renderCalendar = originalRenderCalendar;
    });

    describe('changeMonth', () => {
        test('should increment month and call renderCalendar', () => {
            global.currentCalendarMonth = 5;
            global.currentCalendarYear = 2026;
            window.changeMonth(1);
            expect(global.currentCalendarMonth).toBe(6);
            expect(global.currentCalendarYear).toBe(2026);
            expect(window.renderCalendar).toHaveBeenCalled();
        });

        test('should decrement month and call renderCalendar', () => {
            global.currentCalendarMonth = 5;
            global.currentCalendarYear = 2026;
            window.changeMonth(-1);
            expect(global.currentCalendarMonth).toBe(4);
            expect(global.currentCalendarYear).toBe(2026);
            expect(window.renderCalendar).toHaveBeenCalled();
        });

        test('should wrap from December to January and increment year', () => {
            global.currentCalendarMonth = 11;
            global.currentCalendarYear = 2026;
            window.changeMonth(1);
            expect(global.currentCalendarMonth).toBe(0);
            expect(global.currentCalendarYear).toBe(2027);
        });

        test('should wrap from January to December and decrement year', () => {
            global.currentCalendarMonth = 0;
            global.currentCalendarYear = 2026;
            window.changeMonth(-1);
            expect(global.currentCalendarMonth).toBe(11);
            expect(global.currentCalendarYear).toBe(2025);
        });
    });

    describe('renderThisWeek', () => {
        beforeEach(() => {
            window.renderCalendar = originalRenderCalendar;
        });

        test('should render empty state when no sessions this week', () => {
            global.sessions = [];
            window.renderThisWeek();
            const container = document.getElementById('thisweek-container');
            expect(container.innerHTML).toContain('No Upcoming Events');
        });

        test('should render session cards when sessions exist this week', () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            global.sessions = [
                {
                    id: 1,
                    date: today.toISOString(),
                    type: 'training',
                    deleted: false,
                    cancelled: false,
                    location: 'The Aura',
                    time: '7:30 PM',
                    attendance: []
                }
            ];
            window.renderThisWeek();
            const container = document.getElementById('thisweek-container');
            expect(container.innerHTML).not.toContain('No Upcoming Events');
            expect(container.innerHTML).toContain('Training');
        });
    });
});
