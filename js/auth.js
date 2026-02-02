// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

// Login function
window.loginUser = async function() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDisplay = document.getElementById('login-error');
    errorDisplay.style.display = 'none';

    if (!auth) {
        errorDisplay.textContent = 'Firebase Auth not initialized.';
        errorDisplay.style.display = 'block';
        console.error('Firebase Auth not initialized.');
        return;
    }

    try {
        await auth.signInWithEmailAndPassword(email, password);
        localStorage.setItem('lastLoginTime', Date.now().toString()); // Store login timestamp
        console.log('User logged in!');
    } catch (error) {
        console.error('Login failed:', error.message);
        errorDisplay.textContent = 'Invalid email or password.';
        errorDisplay.style.display = 'block';
    }
};

// Logout function
window.logoutUser = async function() {
    if (!auth) {
        console.error('Firebase Auth not initialized. Cannot log out.');
        return;
    }
    try {
        await auth.signOut();
        localStorage.removeItem('lastLoginTime'); // Clear login timestamp
        console.log('User logged out!');
    } catch (error) {
        console.error('Logout failed:', error.message);
    }
};

// Auth state listener setup
window.setupAuthListener = function() {
    if (auth) {
        auth.onAuthStateChanged(user => {
            currentUser = user;

            if (currentUser) {
                const lastLoginTime = localStorage.getItem('lastLoginTime');
                if (lastLoginTime) {
                    const loginTimestamp = parseInt(lastLoginTime, 10);
                    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
                    if (Date.now() - loginTimestamp > oneHour) {
                        console.log('Session expired, logging out...');
                        window.logoutUser();
                        localStorage.removeItem('lastLoginTime'); // Clear timestamp
                    } else {
                        updateUI();
                    }
                } else {
                    // If no timestamp, assume session is fresh for now but will enforce on next login
                    localStorage.setItem('lastLoginTime', Date.now().toString());
                    updateUI();
                }
            } else {
                // User is logged out - clear any stored timestamp
                localStorage.removeItem('lastLoginTime');
                updateUI();
            }
        });
    } else {
        // If Firebase Auth is not initialized, assume logged out and render minimal UI
        currentUser = null;
        updateUI();
    }
}

// Function to update UI based on authentication state
async function updateUI() {
    mainContainer = document.getElementById('main-container');
    loginPage = document.getElementById('login-page');
    tabsContainer = document.querySelector('.tabs');
    menuToggle = document.getElementById('menuToggle');
    menuDrawer = document.getElementById('menuDrawer');
    menuOverlay = document.getElementById('menuOverlay');
    saveIndicator = document.getElementById('saveIndicator');

    if (currentUser) {
        // User is logged in
        console.log('User is logged in:', currentUser.email);
        if (mainContainer) mainContainer.style.display = 'block';
        if (loginPage) loginPage.style.display = 'none';
        if (tabsContainer) tabsContainer.style.display = 'flex';
        if (menuToggle) menuToggle.style.display = 'flex';
        if (saveIndicator) saveIndicator.style.display = 'flex';

        // Load all data and render everything
        sessions = []; // Clear existing sessions to ensure fresh load
        players = []; // Clear existing players to ensure fresh load
        await loadPlayersFromFirebase();
        await loadGoalsFromFirebase();
        await loadSessionsFromFirebase();
        await loadData();
        switchToTab('schedule'); // Default to schedule tab after login
        setupEditMode();
        scrollToClosestSession();
        setupTabs();
        renderPlayers();
        setupPlayersControls();
        updateMenuContent(); // Populate menu with full options
    } else {
        // User is logged out - show login page only
        console.log('User is logged out.');
        if (mainContainer) mainContainer.style.display = 'none'; // Hide main container
        if (loginPage) loginPage.style.display = 'flex'; // Show login page
        if (tabsContainer) tabsContainer.style.display = 'none'; // Hide main navigation tabs
        if (menuToggle) menuToggle.style.display = 'none'; // Hide burger menu
        if (saveIndicator) saveIndicator.style.display = 'none';
        
        // Clear all content
        document.getElementById('sessions').innerHTML = '';
        document.getElementById('calendar-container').innerHTML = '';
        document.getElementById('players-container').innerHTML = '';
        document.getElementById('stats-container').innerHTML = '';
        document.getElementById('thisweek-tab').innerHTML = '';
    }
}
