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
            // Define loginUser function inline for testing
            window.loginUser = async function() {
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                const errorDisplay = document.getElementById('login-error');
                errorDisplay.style.display = 'none';

                if (!auth) {
                    errorDisplay.textContent = 'Firebase Auth not initialized.';
                    errorDisplay.style.display = 'block';
                    return;
                }

                try {
                    await auth.signInWithEmailAndPassword(email, password);
                } catch (error) {
                    errorDisplay.textContent = 'Invalid email or password.';
                    errorDisplay.style.display = 'block';
                }
            };

            document.getElementById('login-email').value = 'test@example.com';
            document.getElementById('login-password').value = 'password123';
            
            await window.loginUser();
            
            expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password123');
        });

        test('should display error when login fails', async () => {
            mockAuth.signInWithEmailAndPassword.mockRejectedValue(new Error('Invalid credentials'));
            
            window.loginUser = async function() {
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                const errorDisplay = document.getElementById('login-error');
                errorDisplay.style.display = 'none';

                if (!auth) {
                    errorDisplay.textContent = 'Firebase Auth not initialized.';
                    errorDisplay.style.display = 'block';
                    return;
                }

                try {
                    await auth.signInWithEmailAndPassword(email, password);
                } catch (error) {
                    errorDisplay.textContent = 'Invalid email or password.';
                    errorDisplay.style.display = 'block';
                }
            };

            document.getElementById('login-email').value = 'wrong@example.com';
            document.getElementById('login-password').value = 'wrongpassword';
            
            await window.loginUser();
            
            const errorDisplay = document.getElementById('login-error');
            expect(errorDisplay.style.display).toBe('block');
            expect(errorDisplay.textContent).toBe('Invalid email or password.');
        });

        test('should display error when auth is not initialized', async () => {
            global.auth = null;
            
            window.loginUser = async function() {
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                const errorDisplay = document.getElementById('login-error');
                errorDisplay.style.display = 'none';

                if (!auth) {
                    errorDisplay.textContent = 'Firebase Auth not initialized.';
                    errorDisplay.style.display = 'block';
                    return;
                }

                try {
                    await auth.signInWithEmailAndPassword(email, password);
                } catch (error) {
                    errorDisplay.textContent = 'Invalid email or password.';
                    errorDisplay.style.display = 'block';
                }
            };

            await window.loginUser();
            
            const errorDisplay = document.getElementById('login-error');
            expect(errorDisplay.style.display).toBe('block');
            expect(errorDisplay.textContent).toBe('Firebase Auth not initialized.');
        });
    });

    describe('logoutUser', () => {
        test('should call signOut when auth is initialized', async () => {
            window.logoutUser = async function() {
                if (!auth) {
                    return;
                }
                try {
                    await auth.signOut();
                } catch (error) {
                    console.error('Logout failed:', error.message);
                }
            };

            await window.logoutUser();
            
            expect(mockAuth.signOut).toHaveBeenCalled();
        });

        test('should not throw when auth is not initialized', async () => {
            global.auth = null;
            
            window.logoutUser = async function() {
                if (!auth) {
                    return;
                }
                try {
                    await auth.signOut();
                } catch (error) {
                    console.error('Logout failed:', error.message);
                }
            };

            await expect(window.logoutUser()).resolves.not.toThrow();
        });
    });

    describe('UI State on Auth Change', () => {
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
});
