// ============================================
// FIREBASE CONFIGURATION
// ============================================
// To set up Firebase:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (or use existing)
// 3. Enable Realtime Database
// 4. Go to Project Settings > Your apps > Web app
// 5. Copy the config object and replace the values below
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyDxnXltlxrvj7XaplM21IJqvW-7SPI0C60",
    authDomain: "ballyraine-harps.firebaseapp.com",
    databaseURL: "https://ballyraine-harps-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "ballyraine-harps",
    storageBucket: "ballyraine-harps.firebasestorage.app",
    messagingSenderId: "150301654173",
    appId: "1:150301654173:web:3dfc661d09a5421e5f2874",
    measurementId: "G-W9P5F8E1X3"
};

// Initialize Firebase (only if config is provided and Firebase is loaded)
let database = null;
let auth = null;

if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        auth = firebase.auth();
        console.log('Firebase initialized');
    } catch (e) {
        console.error('Failed to initialize Firebase:', e);
        console.log('Using localStorage only');
    }
}

// Global state variables
let currentUser = null;
let mainContainer = null;
let loginPage = null;
let tabsContainer = null;
let menuToggle = null;
let menuDrawer = null;
let menuOverlay = null;
let saveIndicator = null;

// Sessions array - loaded from Firebase
let sessions = [];

// Players array - loaded from Firebase
let players = [];

// UI state
let editMode = false;
let showPastSessions = false;
let showDeletedSessions = false;
let showDeletedPlayers = false;
let showTraining = true;
let showMatches = true;
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

// Default values for sessions
const defaults = {
    desc: 'Add a description for this session...',
    warmup: 'General warm-up & stretching',
    drills: 'Tap edit mode to add drills...',
    game: 'Full game play',
    // Match defaults
    opponent: 'Enter opponent team name',
    matchType: 'friendly',
    cupStage: '',
    teamScore: '',
    opponentScore: '',
    result: '' // 'win', 'draw', 'loss', or ''
};
