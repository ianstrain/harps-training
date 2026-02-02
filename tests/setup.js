// Jest setup file

// Mock Firebase
global.firebase = {
    initializeApp: jest.fn(),
    database: jest.fn(() => ({
        ref: jest.fn(() => ({
            set: jest.fn(() => Promise.resolve()),
            once: jest.fn(() => Promise.resolve({ val: () => null })),
            on: jest.fn(),
            off: jest.fn()
        }))
    })),
    auth: jest.fn(() => ({
        signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { email: 'test@test.com' } })),
        signOut: jest.fn(() => Promise.resolve()),
        onAuthStateChanged: jest.fn((callback) => {
            callback(null); // Default to logged out
            return jest.fn(); // Return unsubscribe function
        })
    }))
};

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn(() => Promise.resolve())
    }
});

// Load all application JavaScript files to make their globals available
require('../js/data');
require('../js/auth');
require('../js/ui');
require('../js/players');
require('../js/sessions');
require('../js/matches');
require('../js/stats');
require('../js/calendar');
require('../js/config');

// Re-initialize global variables and mocks after loading all scripts
global.sessions = [];
global.players = [];
global.currentUser = null;
global.editMode = false;
global.showPastSessions = false;
global.showDeletedSessions = false;
global.showDeletedPlayers = false;
global.showTraining = true;
global.showMatches = true;
global.database = null;
global.auth = null;
global.currentProfilePlayer = null;

// Set initial sort states (from stats.js)
global.goalsSortBy = 'goals-desc';
global.matchAttendanceSortBy = 'attended-desc';
global.trainingAttendanceSortBy = 'attended-desc';

// Mock only the data-saving functions and functions that interact with external resources
// Let render functions and navigation functions use their real implementations from loaded scripts
// so that tests can inspect rendered HTML. Tests that need to verify calls to render functions
// should use jest.spyOn() locally.
global.savePlayersList = jest.fn();
global.saveData = jest.fn();
global.saveGoalsToFirebase = jest.fn();
global.saveNotesToFirebase = jest.fn();
global.saveSessionsList = jest.fn();

// Mock DOM elements (updated to include all necessary divs for the app's current state)
document.body.innerHTML = `
    <div id="main-container"></div>
    <div id="login-page" style="display: none;"></div>
    <div class="tabs"></div>
    <div id="menuToggle"></div>
    <div id="menuDrawer"></div>
    <div id="menuOverlay"></div>
    <div id="saveIndicator"></div>
    <div id="sessions-container"></div>
    <div id="calendar-container"></div>
    <div id="players-container"></div>
    <div id="stats-container"></div>
    <div id="thisweek-tab" class="tab-content"></div>
    <div id="schedule-tab" class="tab-content"></div>
    <div id="calendar-tab" class="tab-content"></div>
    <div id="players-tab" class="tab-content"></div>
    <div id="stats-tab" class="tab-content"></div>
    <div id="player-profile-tab" class="tab-content"></div>
    <div id="menuContent"></div>
    <div id="menuTitle"></div>
    <input id="login-email" />
    <input id="login-password" />
    <div id="login-error" style="display: none;"></div>
    <div id="toast-container"></div>
`;

// Helper to reset mocks and global state between tests
beforeEach(() => {
    jest.clearAllMocks();
    global.sessions = [];
    global.players = [];
    global.currentUser = null;
    global.editMode = false;
    global.showPastSessions = false;
    global.showDeletedSessions = false;
    global.showDeletedPlayers = false;
    global.showTraining = true;
    global.showMatches = true;
    global.currentProfilePlayer = null;

    // Reset global sort states
    global.goalsSortBy = 'goals-desc';
    global.matchAttendanceSortBy = 'attended-desc';
    global.trainingAttendanceSortBy = 'attended-desc';
});
