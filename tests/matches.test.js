/**
 * Match attendance clipboard tests
 */

describe('Match attendance clipboard', () => {
    describe('copyMatchAttendanceToClipboard', () => {
        let toastSpy;

        beforeEach(() => {
            toastSpy = jest.spyOn(window, 'showToast').mockImplementation(() => {});
            global.players = [
                { player: 'Bob', returning: 'yes', deleted: false },
                { player: 'Alice', returning: 'yes', deleted: false },
                { player: 'Inactive', returning: 'no', deleted: false }
            ];
            global.sessions = [{ id: 1, type: 'match', attendance: ['Bob', 'Alice'] }];
        });

        afterEach(() => {
            toastSpy.mockRestore();
        });

        test('should copy sorted attending active player names, one per line', async () => {
            await window.copyMatchAttendanceToClipboard(1);
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Alice\nBob');
            expect(toastSpy).toHaveBeenCalledWith('Copied 2 player names to clipboard.');
        });

        test('should toast when no players are attending', async () => {
            global.sessions[0].attendance = [];
            await window.copyMatchAttendanceToClipboard(1);
            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
            expect(toastSpy).toHaveBeenCalledWith('No players marked as attending.', true);
        });

        test('should toast when session is missing', async () => {
            await window.copyMatchAttendanceToClipboard(999);
            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
            expect(toastSpy).toHaveBeenCalledWith('Session not found.', true);
        });

        test('should toast on clipboard failure', async () => {
            navigator.clipboard.writeText.mockRejectedValueOnce(new Error('denied'));
            await window.copyMatchAttendanceToClipboard(1);
            expect(toastSpy).toHaveBeenCalledWith('Failed to copy to clipboard.', true);
        });
    });
});
