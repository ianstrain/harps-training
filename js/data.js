// ============================================
// DATA LOADING AND SAVING FUNCTIONS
// ============================================

// Helper function to format dates
function formatDate(date) {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const formatted = date.toLocaleDateString('en-IE', options);
    const day = date.getDate();
    const suffix = day > 3 && day < 21 ? 'th' : ['th','st','nd','rd','th','th','th','th','th','th'][day % 10];
    return formatted.replace(day, day + suffix);
}

// Convert YouTube URLs to embedded videos
function parseContent(text) {
    if (!text) return text;
    
    // YouTube URL patterns (including Shorts)
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})(?:\S*)?/g;
    
    // Replace YouTube URLs with embedded players
    const parsed = text.replace(youtubeRegex, function(match, videoId) {
        return '<div class="video-embed"><iframe src="https://www.youtube.com/embed/' + videoId + '" allowfullscreen></iframe></div>';
    });
    
    return parsed;
}

// Load sessions from Firebase
async function loadSessionsFromFirebase() {
    if (!database) {
        console.log('Firebase not configured - using empty sessions array');
        return;
    }
    
    try {
        const sessionsRef = database.ref('sessionsList');
        const snapshot = await sessionsRef.once('value');
        const sessionsData = snapshot.val();
        
        if (sessionsData) {
            // Convert Firebase object to array and parse dates
            sessions = Object.values(sessionsData).map(s => ({
                ...s,
                date: new Date(s.date),
                type: s.type || 'training' // Default to training if not specified
            }));
            console.log('Sessions loaded from Firebase:', sessions.length);
        } else {
            console.log('No sessions found in Firebase');
            sessions = [];
        }
    } catch (e) {
        console.error('Failed to load sessions from Firebase:', e);
        sessions = [];
    }
}

// Load session data (descriptions, warmups, drills, etc.)
async function loadData() {
    // First try to load from Firebase
    if (database) {
        try {
            const sessionsRef = database.ref('sessions');
            const snapshot = await sessionsRef.once('value');
            const firebaseData = snapshot.val();
            
            if (firebaseData) {
                // Merge Firebase data with sessions
                sessions.forEach(s => {
                    const sessionData = firebaseData[s.id];
                    if (sessionData) {
                        s.desc = sessionData.desc || '';
                        s.warmup = sessionData.warmup || '';
                        s.drills = sessionData.drills || '';
                        s.game = sessionData.game || '';
                        s.attendance = sessionData.attendance || [];
                        s.captain = sessionData.captain || '';
                        s.matchGoals = sessionData.matchGoals || {};
                        s.teamScore = sessionData.teamScore || '';
                        s.opponentScore = sessionData.opponentScore || '';
                        s.result = sessionData.result || '';
                    }
                });
                console.log('Session data loaded from Firebase');
                renderSessions();
                return;
            }
        } catch (e) {
            console.error('Failed to load from Firebase:', e);
        }
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem('trainingData');
    if (stored) {
        const data = JSON.parse(stored);
        sessions.forEach(s => {
            s.desc = data[s.id + '_desc'] || '';
            s.warmup = data[s.id + '_warmup'] || '';
            s.drills = data[s.id + '_drills'] || '';
            s.game = data[s.id + '_game'] || '';
            s.attendance = data[s.id + '_attendance'] ? JSON.parse(data[s.id + '_attendance']) : [];
            s.captain = data[s.id + '_captain'] || '';
            s.matchGoals = data[s.id + '_matchGoals'] ? JSON.parse(data[s.id + '_matchGoals']) : {};
            s.teamScore = data[s.id + '_teamScore'] || '';
            s.opponentScore = data[s.id + '_opponentScore'] || '';
            s.result = data[s.id + '_result'] || '';
        });
        renderSessions();
    }
}

// Save sessions list to Firebase
async function saveSessionsList() {
    if (!database) {
        return;
    }
    
    try {
        const sessionsListRef = database.ref('sessionsList');
        const sessionsListData = {};
        
        sessions.forEach(s => {
            sessionsListData[s.id] = {
                id: s.id,
                date: s.date ? s.date.toISOString() : new Date().toISOString(),
                cancelled: s.cancelled || false,
                cancelReason: s.cancelReason || '',
                location: s.location || 'The Aura',
                time: s.time || '7:30 PM - 8:30 PM',
                deleted: s.deleted || false,
                // Match-specific fields
                type: s.type || 'training',
                opponent: s.opponent || '',
                matchType: s.matchType || 'friendly',
                cupStage: s.cupStage || '',
                kickOffTime: s.kickOffTime || ''
            };
        });
        
        await sessionsListRef.set(sessionsListData);
        console.log('Sessions list saved to Firebase');
    } catch (e) {
        console.error('Failed to save sessions list to Firebase:', e);
    }
}

// Save session data to Firebase and localStorage
async function saveData() {
    console.log('Entering saveData function');
    const data = {};
    sessions.forEach(s => {
        data[s.id + '_desc'] = s.desc;
        data[s.id + '_warmup'] = s.warmup;
        data[s.id + '_drills'] = s.drills;
        data[s.id + '_game'] = s.game;
        data[s.id + '_attendance'] = JSON.stringify(s.attendance || []);
        data[s.id + '_captain'] = s.captain || '';
        data[s.id + '_matchGoals'] = JSON.stringify(s.matchGoals || {});
        data[s.id + '_teamScore'] = s.teamScore || '';
        data[s.id + '_opponentScore'] = s.opponentScore || '';
        data[s.id + '_result'] = s.result || '';
    });
    
    // Save to localStorage
    localStorage.setItem('trainingData', JSON.stringify(data));
    
    // Save to Firebase
    if (database) {
        try {
            const sessionsRef = database.ref('sessions');
            const sessionsData = {};
            
            sessions.forEach(s => {
                sessionsData[s.id] = {
                    id: s.id,
                    desc: s.desc || '',
                    warmup: s.warmup || '',
                    drills: s.drills || '',
                    game: s.game || '',
                    // Match-specific fields
                    attendance: s.attendance || [],
                    captain: s.captain || '',
                    matchGoals: s.matchGoals || {},
                    teamScore: s.teamScore || '',
                    opponentScore: s.opponentScore || '',
                    result: s.result || '',
                    kickOffTime: s.kickOffTime || '',
                    lastUpdated: new Date().toISOString()
                };
            });
            
            await sessionsRef.set(sessionsData);
            console.log('Data saved to Firebase');
        } catch (e) {
            console.error('Failed to save to Firebase:', e);
            console.log('Data saved locally only');
        }
    }
    
    showSaveIndicator();
}

// Show save indicator
let saveTimeout = null;
function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    // Clear any existing timeout
    if (saveTimeout) clearTimeout(saveTimeout);
    // Show the indicator
    indicator.classList.add('show');
    // Hide after 2 seconds
    saveTimeout = setTimeout(function() {
        indicator.classList.remove('show');
    }, 2000);
}

// Load players from Firebase
async function loadPlayersFromFirebase() {
    if (!database) {
        console.log('Firebase not configured - using empty players array');
        return;
    }
    
    try {
        const playersRef = database.ref('playersList');
        const snapshot = await playersRef.once('value');
        const playersData = snapshot.val();
        
        if (playersData) {
            // Convert Firebase object to array
            players = Object.values(playersData);
            console.log('Players loaded from Firebase:', players.length);
        } else {
            console.log('No players found in Firebase. Run migratePlayersToFirebase() in console to migrate players.');
            players = [];
        }
    } catch (e) {
        console.error('Failed to load players from Firebase:', e);
        players = [];
    }
}

// Load goals from Firebase
async function loadGoalsFromFirebase() {
    if (!database) {
        console.log('Firebase not configured - loading from localStorage only');
        return;
    }
    
    try {
        // First, clear all existing goal and notes data from localStorage to ensure Firebase is source of truth
        players.forEach(p => {
            const playerName = p.player;
            if (playerName) {
                const goalsKey = `goals_${playerName}`;
                const notesKey = `notes_${playerName}`;
                localStorage.removeItem(goalsKey);
                localStorage.removeItem(notesKey);
            }
        });
        
        const playersRef = database.ref('players');
        const snapshot = await playersRef.once('value');
        const playersData = snapshot.val();
        
        if (playersData) {
            // Use Firebase data as source of truth (don't merge with localStorage)
            Object.keys(playersData).forEach(playerName => {
                const decodedName = decodeURIComponent(playerName);
                const firebaseGoals = playersData[playerName].goals || {};
                const firebaseNotes = playersData[playerName].notes || '';
                
                // Use Firebase data directly - it's the source of truth
                // This ensures deletions are properly reflected
                const goalsKey = `goals_${decodedName}`;
                const notesKey = `notes_${decodedName}`;
                localStorage.setItem(goalsKey, JSON.stringify(firebaseGoals));
                localStorage.setItem(notesKey, firebaseNotes);
            });
            
            console.log('Goals and notes loaded from Firebase');
        }
    } catch (e) {
        console.error('Failed to load from Firebase:', e);
    }
}

// Save players list to Firebase
async function savePlayersList() {
    if (!database) {
        return;
    }
    
    try {
        const playersRef = database.ref('playersList');
        const playersData = {};
        
        players.forEach(p => {
            // Skip temporary/new players that haven't been saved yet
            if (p._isNew || !p.player) {
                return;
            }
            playersData[p.player] = {
                player: p.player,
                jersey: p.jersey || '',
                parent: p.parent || '',
                year: p.year || '',
                returning: p.returning || '',
                deleted: p.deleted || false
            };
        });
        
        await playersRef.set(playersData);
        console.log('Players list saved to Firebase');
    } catch (e) {
        console.error('Failed to save players list to Firebase:', e);
    }
}

// Save goals to Firebase
async function saveGoalsToFirebase(playerName, goals) {
    if (!database) {
        console.log('Firebase not configured - data saved to localStorage only');
        return;
    }
    
    try {
        const total = getTotalGoals(goals);
        const playerRef = database.ref('players/' + encodeURIComponent(playerName));
        
        // Get existing notes if any
        const existingData = await playerRef.once('value');
        const existingNotes = existingData.val()?.notes || '';
        
        // If goals object is empty and no notes, remove the entire node from Firebase
        if (Object.keys(goals).length === 0 && !existingNotes) {
            console.log('Removing empty player data from Firebase for', playerName);
            await playerRef.remove();
            console.log('Empty player data removed successfully from Firebase for', playerName);
        } else {
            const data = {
                player: playerName,
                goals: goals,
                total: total,
                notes: existingNotes,
                lastUpdated: new Date().toISOString()
            };
            
            console.log('Saving goals to Firebase:', data);
            
            // Save to Firebase Realtime Database
            await playerRef.set(data);
            
            console.log('Goals saved successfully to Firebase for', playerName);
        }
    } catch (e) {
        console.error('Failed to save to Firebase:', e);
        // Still saved locally even if Firebase fails
    }
}

// Save notes to Firebase
async function saveNotesToFirebase(playerName, notes) {
    if (!database) {
        console.log('Firebase not configured - data saved to localStorage only');
        return;
    }
    
    try {
        const playerRef = database.ref('players/' + encodeURIComponent(playerName));
        
        // Get existing goals if any
        const existingData = await playerRef.once('value');
        const existingGoals = existingData.val()?.goals || {};
        const existingTotal = existingData.val()?.total || 0;
        
        // If notes is empty and no goals, remove the entire node from Firebase
        if (!notes && Object.keys(existingGoals).length === 0) {
            console.log('Removing empty player data from Firebase for', playerName);
            await playerRef.remove();
            console.log('Empty player data removed successfully from Firebase for', playerName);
        } else {
            const data = {
                player: playerName,
                goals: existingGoals,
                total: existingTotal,
                notes: notes,
                lastUpdated: new Date().toISOString()
            };
            
            console.log('Saving notes to Firebase:', data);
            
            // Save to Firebase Realtime Database
            await playerRef.set(data);
            
            console.log('Notes saved successfully to Firebase for', playerName);
        }
    } catch (e) {
        console.error('Failed to save notes to Firebase:', e);
        // Still saved locally even if Firebase fails
    }
}

// Migration function to add sessions structure to Firebase
window.migrateSessionsToFirebase = async function() {
    if (!database) {
        console.error('Firebase not initialized - cannot migrate');
        return;
    }

    const sessionsData = [
        { id: 1, date: new Date(2026, 1, 3), desc: '', warmup: '', drills: '', game: '' },
        { id: 2, date: new Date(2026, 1, 10), desc: '', warmup: '', drills: '', game: '' },
        { id: 3, date: new Date(2026, 1, 17), desc: '', warmup: '', drills: '', game: '' },
        { id: 4, date: new Date(2026, 1, 24), desc: '', warmup: '', drills: '', game: '' },
        { id: 5, date: new Date(2026, 2, 3), desc: '', warmup: '', drills: '', game: '' },
        { id: 6, date: new Date(2026, 2, 10), desc: '', warmup: '', drills: '', game: '' },
        { id: 7, date: new Date(2026, 2, 17), cancelled: true, cancelReason: "St. Patrick's Day 🍀" },
        { id: 8, date: new Date(2026, 2, 24), desc: '', warmup: '', drills: '', game: '' },
    ];
    
    try {
        console.log('Starting sessions structure migration to Firebase...');
        
        // Convert array to object with id as key, and convert dates to ISO strings
        const sessionsObject = {};
        sessionsData.forEach(session => {
            sessionsObject[session.id] = {
                id: session.id,
                date: session.date.toISOString(),
                cancelled: session.cancelled || false,
                cancelReason: session.cancelReason || ''
            };
        });
        
        // Save to Firebase
        const sessionsListRef = database.ref('sessionsList');
        await sessionsListRef.set(sessionsObject);
        
        console.log('Sessions structure migration completed successfully!');
        console.log('Migrated sessions:', sessionsData.length);
        
        alert('Sessions structure migration completed! Data has been transferred to Firebase.');
        
    } catch (error) {
        console.error('Sessions migration failed:', error);
        alert('Sessions migration failed: ' + error.message);
    }
};

// Migration function to add players to Firebase
