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
        console.log('User logged out!');
    } catch (error) {
        console.error('Logout failed:', error.message);
    }
};

// Auth state listener setup
function setupAuthListener() {
    if (auth) {
        auth.onAuthStateChanged(user => {
            currentUser = user;
            updateUI(); // Function to update UI based on login state
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
        // User is logged out
        console.log('User is logged out.');
        if (mainContainer) mainContainer.style.display = 'block'; // Show main container for This Week tab
        if (loginPage) loginPage.style.display = 'none'; // Hide login page
        if (tabsContainer) tabsContainer.style.display = 'none'; // Hide main navigation tabs
        if (menuToggle) menuToggle.style.display = 'flex'; // Burger menu still visible
        if (saveIndicator) saveIndicator.style.display = 'none';

        // Load data needed for This Week content
        await loadPlayersFromFirebase();
        await loadSessionsFromFirebase();
        await loadGoalsFromFirebase(); // Load goals for players
        await loadData(); // Load detailed session data including attendance

        // Only show This Week content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById('thisweek-tab').classList.add('active');
        renderThisWeek();
        
        // Clear other content
        document.getElementById('sessions').innerHTML = '';
        document.getElementById('calendar-container').innerHTML = '';
        document.getElementById('players-container').innerHTML = '';
        document.getElementById('stats-container').innerHTML = '';
        
        // Update menu content for logged out state
        updateMenuContent();
    }
}
