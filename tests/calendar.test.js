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
            const fixedDate = new Date('2026-02-22T12:00:00.000Z');
            jest.useFakeTimers({ now: fixedDate.getTime() });
            global.sessions = [
                {
                    id: 1,
                    date: '2026-02-22T12:00:00.000Z',
                    type: 'training',
                    deleted: false,
                    cancelled: false,
                    location: 'Orchard Grove',
                    time: '7:30 PM',
                    attendance: []
                }
            ];
            window.renderThisWeek();
            const container = document.getElementById('thisweek-container');
            expect(container.innerHTML).not.toContain('No Upcoming Events');
            expect(container.innerHTML).toContain('Training');
            jest.useRealTimers();
        });
    });

    describe('copyCalendarMonthMatchesToClipboard', () => {
        beforeEach(() => {
            window.renderCalendar = originalRenderCalendar;
            global.currentCalendarMonth = 1;
            global.currentCalendarYear = 2026;
            jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
            jest.spyOn(window, 'showToast').mockImplementation(() => {});
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        test('copies non-cancelled matches in the displayed month', async () => {
            global.sessions = [
                {
                    id: 1,
                    type: 'match',
                    opponent: 'Rivals FC',
                    date: new Date(2026, 1, 10),
                    deleted: false,
                    cancelled: false,
                    location: 'Orchard Grove',
                    time: '6:00 PM - 8:00 PM',
                    kickOffTime: '6:00 PM'
                },
                {
                    id: 2,
                    type: 'match',
                    opponent: 'Other Month',
                    date: new Date(2026, 2, 5),
                    deleted: false,
                    cancelled: false
                }
            ];
            await window.copyCalendarMonthMatchesToClipboard();
            expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
            const text = navigator.clipboard.writeText.mock.calls[0][0];
            expect(text).toContain('February 2026');
            expect(text).toContain('Rivals FC');
            expect(text).not.toContain('Other Month');
            expect(text).not.toContain('Shinguards');
            expect(window.showToast).toHaveBeenCalledWith('1 match copied to clipboard.');
        });

        test('shows toast when no matches in month', async () => {
            global.sessions = [];
            await window.copyCalendarMonthMatchesToClipboard();
            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
            expect(window.showToast).toHaveBeenCalledWith(
                'No matches scheduled in February 2026.',
                true
            );
        });
    });
});
