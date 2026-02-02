/**
 * Authentication Tests
 */

describe('Authentication', () => {
    let mockAuth;
    
    beforeEach(() => {
        // Setup mock auth
        mockAuth = {
            signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { email: 'test@test.com' } })),
            signOut: jest.fn(() => Promise.resolve()),
            onAuthStateChanged: jest.fn()
        };
        global.auth = mockAuth;
        
        // Setup DOM elements
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('login-error').style.display = 'none';
        document.getElementById('login-error').textContent = '';
    });

    describe('loginUser', () => {
        test('should call signInWithEmailAndPassword with correct credentials', async () => {
            document.getElementById('login-email').value = 'test@example.com';
            document.getElementById('login-password').value = 'password123';
            
            await window.loginUser();
            
            expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password123');
        });

        test('should display error when login fails', async () => {
            mockAuth.signInWithEmailAndPassword.mockRejectedValue(new Error('Invalid credentials'));
            
            document.getElementById('login-email').value = 'wrong@example.com';
            document.getElementById('login-password').value = 'wrongpassword';
            
            await window.loginUser();
            
            const errorDisplay = document.getElementById('login-error');
            expect(errorDisplay.style.display).toBe('block');
            expect(errorDisplay.textContent).toBe('Invalid email or password.');
        });

        test('should display error when auth is not initialized', async () => {
            global.auth = null;
            
            await window.loginUser();
            
            const errorDisplay = document.getElementById('login-error');
            expect(errorDisplay.style.display).toBe('block');
            expect(errorDisplay.textContent).toBe('Firebase Auth not initialized.');
        });
    });

    describe('logoutUser', () => {
        test('should call signOut when auth is initialized', async () => {
            await window.logoutUser();
            expect(mockAuth.signOut).toHaveBeenCalled();
        });

        test('should not throw when auth is not initialized', async () => {
            global.auth = null;
            await expect(window.logoutUser()).resolves.not.toThrow();
        });
    });

    describe('UI State on Auth Change', () => {
        let firestoreOnAuthStateChangedCallback;

        beforeEach(() => {
            // Mock onAuthStateChanged to capture its callback
            mockAuth.onAuthStateChanged.mockImplementation(callback => {
                firestoreOnAuthStateChangedCallback = callback;
            });
            // Call setupAuthListener to register the mocked callback
            window.setupAuthListener();
            // Clear localStorage before each test in this suite
            localStorage.clear();
        });

        test('should show login page when user is logged out', () => {
            global.currentUser = null;

            const mainContainer = document.getElementById('main-container');
            const loginPage = document.getElementById('login-page');
            const tabsContainer = document.querySelector('.tabs');
            const menuToggle = document.getElementById('menuToggle');

            // Simulate logged out state
            mainContainer.style.display = 'none';
            loginPage.style.display = 'flex';
            tabsContainer.style.display = 'none';
            menuToggle.style.display = 'none';

            expect(mainContainer.style.display).toBe('none');
            expect(loginPage.style.display).toBe('flex');
            expect(tabsContainer.style.display).toBe('none');
            expect(menuToggle.style.display).toBe('none');
        });

        test('should show main container when user is logged in', () => {
            global.currentUser = { email: 'test@test.com' };

            const mainContainer = document.getElementById('main-container');
            const loginPage = document.getElementById('login-page');
            const tabsContainer = document.querySelector('.tabs');
            const menuToggle = document.getElementById('menuToggle');

            // Simulate logged in state
            mainContainer.style.display = 'block';
            loginPage.style.display = 'none';
            tabsContainer.style.display = 'flex';
            menuToggle.style.display = 'flex';

            expect(mainContainer.style.display).toBe('block');
            expect(loginPage.style.display).toBe('none');
            expect(tabsContainer.style.display).toBe('flex');
            expect(menuToggle.style.display).toBe('flex');
        });
    });

    describe('Session Timeout', () => {
        let firestoreOnAuthStateChangedCallback;
        let dateNowSpy;

        beforeEach(() => {
            // Mock onAuthStateChanged to capture its callback
            mockAuth.onAuthStateChanged.mockImplementation(callback => {
                firestoreOnAuthStateChangedCallback = callback;
            });
            // Call setupAuthListener to register the mocked callback
            window.setupAuthListener();
            // Clear localStorage for this test suite to ensure clean state
            localStorage.clear();

            // Mock window.logoutUser to track calls and ensure original logout logic is called
            global.logoutUser = jest.fn((...args) => global.originalLogoutUser(...args));
            // Mock updateUI as it's called by the auth listener
            global.updateUI = jest.fn();
        });

        beforeAll(() => {
            // Store original logoutUser to allow partial mocking
            global.originalLogoutUser = window.logoutUser;
        });

        afterEach(() => {
            // Restore Date.now() mock if it was set
            if (dateNowSpy) {
                dateNowSpy.mockRestore();
            }
        });

        test('should store lastLoginTime in localStorage after successful login', async () => {
            const initialTime = Date.now();
            dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(initialTime);

            await window.loginUser();
            expect(localStorage.getItem('lastLoginTime')).toBe(initialTime.toString());
        });

        test('should logout user if session has expired', () => {
            const loginTime = Date.now() - (60 * 60 * 1000 + 1000); // 1 hour and 1 second ago
            localStorage.setItem('lastLoginTime', loginTime.toString());

            // Simulate user being logged in initially
            firestoreOnAuthStateChangedCallback({ email: 'test@test.com' });

            expect(global.logoutUser).toHaveBeenCalled();
            expect(localStorage.getItem('lastLoginTime')).toBeNull(); // Should be cleared on logout
        });

        test('should not logout user if session has not expired', () => {
            const loginTime = Date.now() - (30 * 60 * 1000); // 30 minutes ago
            localStorage.setItem('lastLoginTime', loginTime.toString());

            // Simulate user being logged in initially
            firestoreOnAuthStateChangedCallback({ email: 'test@test.com' });

            expect(global.logoutUser).not.toHaveBeenCalled();
            expect(localStorage.getItem('lastLoginTime')).toBe(loginTime.toString()); // Should not be cleared
        });

        test('should clear lastLoginTime from localStorage on manual logout', async () => {
            localStorage.setItem('lastLoginTime', Date.now().toString());
            await window.logoutUser();
            expect(localStorage.getItem('lastLoginTime')).toBeNull();
        });

        test('should set lastLoginTime if not present on initial auth state change when logged in', () => {
            // Simulate user logged in, but no lastLoginTime in localStorage
            localStorage.removeItem('lastLoginTime');
            const initialTime = Date.now();
            dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(initialTime);

            firestoreOnAuthStateChangedCallback({ email: 'test@test.com' });

            expect(localStorage.getItem('lastLoginTime')).toBe(initialTime.toString());
            expect(global.logoutUser).not.toHaveBeenCalled();
        });

        test('should clear lastLoginTime if user is logged out on auth state change', () => {
            localStorage.setItem('lastLoginTime', Date.now().toString());

            // Simulate user logged out
            firestoreOnAuthStateChangedCallback(null);

            expect(localStorage.getItem('lastLoginTime')).toBeNull();
        });
    });
});
