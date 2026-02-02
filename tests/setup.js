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

// Global variables that the app expects
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

// Mock DOM elements
document.body.innerHTML = `
    <div id="main-container"></div>
    <div id="login-page" style="display: none;"></div>
    <div class="tabs"></div>
    <div id="menuToggle"></div>
    <div id="menuDrawer"></div>
    <div id="menuOverlay"></div>
    <div id="saveIndicator"></div>
    <div id="sessions"></div>
    <div id="calendar-container"></div>
    <div id="players-container"></div>
    <div id="stats-container"></div>
    <div id="thisweek-tab" class="tab-content"></div>
    <div id="schedule-tab" class="tab-content"></div>
    <div id="calendar-tab" class="tab-content"></div>
    <div id="players-tab" class="tab-content"></div>
    <div id="stats-tab" class="tab-content"></div>
    <div id="menuContent"></div>
    <div id="menuTitle"></div>
    <input id="login-email" />
    <input id="login-password" />
    <div id="login-error" style="display: none;"></div>
    <div id="toast-container"></div>
`;

// Helper to reset mocks between tests
beforeEach(() => {
    jest.clearAllMocks();
    global.sessions = [];
    global.players = [];
    global.currentUser = null;
    global.editMode = false;
});
