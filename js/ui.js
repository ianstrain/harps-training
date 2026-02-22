// ============================================
// UI HELPERS, TABS, MENU, AND EDIT MODE
// ============================================

// Apply edit mode to UI elements
window.applyEditMode = function() {
    // Apply edit mode to activity inputs and displays (skip new session cards)
    document.querySelectorAll('.activity-input').forEach(el => {
        if (el.closest('.new-session-card')) return; // Skip new session cards
        el.classList.toggle('hidden', !editMode);
    });
    document.querySelectorAll('.activity-display').forEach(el => {
        if (el.closest('.new-session-card')) return; // Skip new session cards
        el.classList.toggle('hidden', editMode);
    });
    document.querySelectorAll('.session-cancel-controls').forEach(el => {
        if (el.closest('.new-session-card')) return; // Skip new session cards
        el.classList.toggle('hidden', !editMode);
    });
}

// Setup edit mode toggle
window.setupEditMode = function() {
    const toggle = document.getElementById('editMode');
    
    if (!toggle) return;
    
    // Setup show past sessions toggle
    const showPastToggle = document.getElementById('showPastSessions');
    if (showPastToggle) {
        showPastToggle.addEventListener('change', () => {
            showPastSessions = showPastToggle.checked;
            renderSessions();
        });
    }
    
    // Setup show deleted sessions toggle
    const showDeletedToggle = document.getElementById('showDeletedSessions');
    if (showDeletedToggle) {
        showDeletedToggle.addEventListener('change', () => {
            showDeletedSessions = showDeletedToggle.checked;
            renderSessions();
        });
    }

    toggle.addEventListener('change', () => {
        if (!toggle.checked && editMode) {
            document.querySelectorAll('.activity-input').forEach(input => {
                const session = sessions.find(s => s.id === parseInt(input.dataset.session));
                const field = input.dataset.field;
                if (session && field) session[field] = input.value;
                
                const display = document.querySelector(`.activity-display[data-session="${input.dataset.session}"][data-field="${field}"]`);
                if (display) {
                    display.innerHTML = session[field] ? parseContent(session[field]) : defaults[field];
                    display.classList.toggle('placeholder', !session[field]);
                }
            });
            
            // Save date, location, and time
            document.querySelectorAll('.session-date-input, .meta-input').forEach(input => {
                const session = sessions.find(s => s.id === parseInt(input.dataset.session));
                const field = input.dataset.field;
                if (session && field) {
                    if (field === 'date') {
                        session.date = new Date(input.value);
                    } else {
                        session[field] = input.value;
                    }
                }
            });
            
            // Save cancelled status and reason
            document.querySelectorAll('.cancel-toggle-switch input').forEach(toggle => {
                const session = sessions.find(s => s.id === parseInt(toggle.dataset.session));
                if (session) {
                    session.cancelled = toggle.checked;
                }
            });
            
            document.querySelectorAll('.cancel-reason-input').forEach(input => {
                const session = sessions.find(s => s.id === parseInt(input.dataset.session));
                if (session) {
                    session.cancelReason = input.value.trim();
                }
            });
            
            // Save match-specific fields (opponent, matchType, cupStage)
            document.querySelectorAll('.match-input, .match-type-select').forEach(input => {
                const session = sessions.find(s => s.id === parseInt(input.dataset.session));
                const field = input.dataset.field;
                if (session && field) {
                    session[field] = input.value;
                }
            });
            
            saveData();
            saveSessionsList();
        }
        
        editMode = toggle.checked;
        
        // Determine which tab is active
        const activeContent = document.querySelector('.tab-content.active');
        const activeTab = activeContent ? activeContent.id.replace('-tab', '') : 'schedule';
        
        // Re-render based on active tab
        if (activeTab === 'schedule') {
            renderSessions();
            // Setup cancel checkbox handlers when entering edit mode
            if (editMode) {
                setupCancelControls();
            }
        } else if (activeTab === 'players') {
            renderPlayers();
        }
    });
}

// Setup filter toggles
window.setupFilterToggles = function() {
    const showTrainingToggle = document.getElementById('showTraining');
    const showMatchesToggle = document.getElementById('showMatches');
    
    if (showTrainingToggle) {
        showTrainingToggle.addEventListener('change', () => {
            showTraining = showTrainingToggle.checked;
            renderSessions();
        });
    }
    
    if (showMatchesToggle) {
        showMatchesToggle.addEventListener('change', () => {
            showMatches = showMatchesToggle.checked;
            renderSessions();
        });
    }
}

// Setup cancel controls
window.setupCancelControls = function() {
    // Handle cancel toggle changes
    document.querySelectorAll('.cancel-toggle-switch input').forEach(toggle => {
        toggle.addEventListener('change', function() {
            const sessionId = parseInt(this.dataset.session);
            const reasonInput = document.getElementById(`cancel-reason-${sessionId}`);
            if (reasonInput) {
                reasonInput.disabled = !this.checked;
                if (!this.checked) {
                    reasonInput.value = '';
                }
            }
        });
    });
}

// Setup tabs
window.setupTabs = function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            switchToTab(targetTab);
        });
    });
    
    // Setup players controls on initial load if players tab is active
    if (document.getElementById('players-tab').classList.contains('active')) {
        setupPlayersControls();
    }
}

// Setup players controls
window.setupPlayersControls = function() {
    const showDeletedToggle = document.getElementById('showDeletedPlayers');
    if (showDeletedToggle) {
        // Remove existing listeners to avoid duplicates
        const newToggle = showDeletedToggle.cloneNode(true);
        showDeletedToggle.parentNode.replaceChild(newToggle, showDeletedToggle);
        
        newToggle.addEventListener('change', () => {
            showDeletedPlayers = newToggle.checked;
            renderPlayers();
        });
    }
    
    // Tabs are now fixed at the top via CSS, no JavaScript manipulation needed
}

// Toggle menu
window.toggleMenu = function() {
    const menuToggle = document.getElementById('menuToggle');
    const menuOverlay = document.getElementById('menuOverlay');
    const menuDrawer = document.getElementById('menuDrawer');
    
    menuToggle.classList.toggle('active');
    menuOverlay.classList.toggle('active');
    menuDrawer.classList.toggle('active');
    
    if (menuDrawer.classList.contains('active')) {
        updateMenuContent();
    }
}

// Close menu
window.closeMenu = function() {
    const menuToggle = document.getElementById('menuToggle');
    const menuOverlay = document.getElementById('menuOverlay');
    const menuDrawer = document.getElementById('menuDrawer');
    
    menuToggle.classList.remove('active');
    menuOverlay.classList.remove('active');
    menuDrawer.classList.remove('active');
}

// Switch to tab
window.switchToTab = function(tabName) {
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + '-tab').classList.add('active');

    // Update buttons only if the tab exists as a button
    document.querySelectorAll('.tab-button').forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Render specific content
    if (tabName === 'schedule') {
        if (typeof renderQuickStats === 'function') renderQuickStats();
        renderSessions();
        scrollToClosestSession();
    } else if (tabName === 'calendar') {
        currentCalendarMonth = new Date().getMonth();
        currentCalendarYear = new Date().getFullYear();
        renderCalendar();
    } else if (tabName === 'players') {
        renderPlayers();
    } else if (tabName === 'stats') {
        renderStats();
    } else if (tabName === 'thisweek') {
        renderThisWeek();
    } else if (tabName === 'player-profile') {
        renderPlayerProfile();
    }
};

// Update menu content
window.updateMenuContent = function() {
    const menuContent = document.getElementById('menuContent');
    const menuTitle = document.getElementById('menuTitle');
    
    // Determine which tab content is active, default to 'thisweek' for logged out
    let activeTab = 'thisweek'; 
    if (currentUser) {
        const activeContent = document.querySelector('.tab-content.active');
        if (activeContent) {
            activeTab = activeContent.id.replace('-tab', '');
        }
    }
    
    let html = '';
    
    if (!currentUser) {
        menuTitle.textContent = 'Login';
        html = `
            <div class="menu-section">
                <p style="color: var(--text-secondary); font-size: 14px; margin: 0 0 15px 0;">
                    You must be logged in to access full features.
                </p>
                <button class="login-menu-btn" onclick="document.getElementById('login-page').style.display='flex'; closeMenu();" style="width: 100%; padding: 12px; background: var(--accent-primary); color: var(--bg-dark); border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background 0.2s ease;">
                    🔑 Login
                </button>
            </div>
        `;
    } else if (activeTab === 'schedule') {
        menuTitle.textContent = 'Schedule Options';
        html = `
            <div class="menu-section">
                <div class="edit-toggle">
                    <label for="editMode">Edit Mode</label>
                    <div class="toggle-switch">
                        <input type="checkbox" id="editMode">
                        <span class="toggle-slider"></span>
                    </div>
                </div>
            </div>
            <div class="menu-section">
                <div class="menu-section-title">Filter</div>
                <div class="view-toggles">
                    <div class="view-toggle">
                        <label for="showTraining">Show Training</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="showTraining">
                            <span class="toggle-slider"></span>
                        </div>
                    </div>
                    <div class="view-toggle">
                        <label for="showMatches">Show Matches</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="showMatches">
                            <span class="toggle-slider"></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="menu-section">
                <div class="menu-section-title">View Options</div>
                <div class="view-toggles">
                    <div class="view-toggle">
                        <label for="showPastSessions">Show Past Sessions</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="showPastSessions">
                            <span class="toggle-slider"></span>
                        </div>
                    </div>
                    <div class="view-toggle">
                        <label for="showDeletedSessions">Show Deleted Sessions</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="showDeletedSessions">
                            <span class="toggle-slider"></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="menu-section">
                <div class="menu-section-title">Actions</div>
                <button class="cleanup-btn" onclick="cleanupDeletedSessions(); closeMenu();" title="Permanently remove all deleted sessions">
                    🗑️ Clean Up Deleted
                </button>
                <button class="add-session-btn-bottom" onclick="handleAddSession(); closeMenu();" title="Add a new session">
                    ➕ New Session
                </button>
                <button class="add-session-btn-bottom" onclick="showBulkCreateDialog(); closeMenu();" title="Create multiple sessions at once" style="background: rgba(14, 165, 233, 0.1); border-color: var(--accent-secondary); color: var(--accent-secondary);">
                    📅 Bulk Create Sessions
                </button>
            </div>
            <div class="menu-section">
                <button class="add-player-btn" onclick="switchToTab('thisweek'); closeMenu();" title="View this week's event">
                    📅 This Week
                </button>
            </div>
            <div class="menu-section">
                <button class="add-player-btn" onclick="switchToTab('stats'); closeMenu();" title="View goal statistics">
                    📊 View Stats
                </button>
            </div>
            <div class="menu-section">
                <button class="logout-btn" onclick="logoutUser(); closeMenu();" title="Log out">
                    🚪 Logout
                </button>
            </div>
        `;
    } else if (activeTab === 'calendar') {
        menuTitle.textContent = 'Calendar Options';
        html = `
            <div class="menu-section">
                <button class="add-player-btn" onclick="switchToTab('thisweek'); closeMenu();" title="View this week's event">
                    📅 This Week
                </button>
            </div>
            <div class="menu-section">
                <button class="add-player-btn" onclick="switchToTab('stats'); closeMenu();" title="View goal statistics">
                    📊 View Stats
                </button>
            </div>
            <div class="menu-section">
                <button class="logout-btn" onclick="logoutUser(); closeMenu();" title="Log out">
                    🚪 Logout
                </button>
            </div>
        `;
    } else if (activeTab === 'players') {
        menuTitle.textContent = 'Player Options';
        html = `
            <div class="menu-section">
                <div class="menu-section-title">Edit Mode</div>
                <div class="view-toggles">
                    <div class="edit-toggle">
                        <label for="editMode">Edit Mode</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="editMode">
                            <span class="toggle-slider"></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="menu-section">
                <div class="menu-section-title">View Options</div>
                <div class="view-toggles">
                    <div class="view-toggle">
                        <label for="showDeletedPlayers">Show Deleted Players</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="showDeletedPlayers">
                            <span class="toggle-slider"></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="menu-section">
                <div class="menu-section-title">Actions</div>
                <button class="cleanup-btn" onclick="cleanupDeletedPlayers(); closeMenu();" title="Permanently remove all deleted players">
                    🗑️ Clean Up Deleted
                </button>
                <button class="add-player-btn" onclick="handleAddPlayer(); closeMenu();" title="Add a new player">
                    ➕ Add Player
                </button>
                <button class="add-player-btn" onclick="exportPlayersToSpreadsheet(); closeMenu();" title="Export player data to a spreadsheet">
                    ⬇️ Export to Spreadsheet
                </button>
            </div>
            <div class="menu-section">
                <button class="add-player-btn" onclick="switchToTab('thisweek'); closeMenu();" title="View this week's event">
                    📅 This Week
                </button>
            </div>
            <div class="menu-section">
                <button class="add-player-btn" onclick="switchToTab('stats'); closeMenu();" title="View goal statistics">
                    📊 View Stats
                </button>
            </div>
            <div class="menu-section">
                <button class="logout-btn" onclick="logoutUser(); closeMenu();" title="Log out">
                    🚪 Logout
                </button>
            </div>
        `;
    } else if (activeTab === 'stats') {
        menuTitle.textContent = 'Statistics';
        html = `
            <div class="menu-section">
                <p style="color: var(--text-secondary); font-size: 14px; margin: 0;">
                    Viewing statistics for all players including goals and attendance.
                </p>
            </div>
            <div class="menu-section">
                <button class="add-player-btn" onclick="switchToTab('thisweek'); closeMenu();" title="View this week's event">
                    📅 This Week
                </button>
            </div>
            <div class="menu-section">
                <button class="logout-btn" onclick="logoutUser(); closeMenu();" title="Log out">
                    🚪 Logout
                </button>
            </div>
        `;
    } else if (activeTab === 'thisweek') {
        menuTitle.textContent = 'This Week';
        html = `
            <div class="menu-section">
                <p style="color: var(--text-secondary); font-size: 14px; margin: 0;">
                    View and manage attendance for this week's upcoming event.
                </p>
            </div>
            <div class="menu-section">
                <button class="add-player-btn" onclick="switchToTab('stats'); closeMenu();" title="View goal statistics">
                    📊 View Stats
                </button>
            </div>
            <div class="menu-section">
                <button class="logout-btn" onclick="logoutUser(); closeMenu();" title="Log out">
                    🚪 Logout
                </button>
            </div>
        `;
    } else {
        menuTitle.textContent = 'Options';
        html = `
            <div class="menu-section">
                <p style="color: var(--text-secondary); font-size: 14px; margin: 0;">
                    No options available.
                </p>
            </div>
            <div class="menu-section">
                <button class="logout-btn" onclick="logoutUser(); closeMenu();" title="Log out">
                    🚪 Logout
                </button>
            </div>
        `;
    }
    
    menuContent.innerHTML = html;
    
    // Restore toggle states
    if (activeTab === 'schedule') {
        const editModeToggle = document.getElementById('editMode');
        const showPastToggle = document.getElementById('showPastSessions');
        const showDeletedToggle = document.getElementById('showDeletedSessions');
        const showTrainingToggle = document.getElementById('showTraining');
        const showMatchesToggle = document.getElementById('showMatches');
        if (editModeToggle) editModeToggle.checked = editMode;
        if (showPastToggle) showPastToggle.checked = showPastSessions;
        if (showDeletedToggle) showDeletedToggle.checked = showDeletedSessions;
        if (showTrainingToggle) showTrainingToggle.checked = showTraining;
        if (showMatchesToggle) showMatchesToggle.checked = showMatches;
        setupEditMode();
        setupFilterToggles();
    } else if (activeTab === 'players') {
        const editModeToggle = document.getElementById('editMode');
        const showDeletedToggle = document.getElementById('showDeletedPlayers');
        if (editModeToggle) editModeToggle.checked = editMode;
        if (showDeletedToggle) showDeletedToggle.checked = showDeletedPlayers;
        setupEditMode();
        setupPlayersControls();
    }
}

// Initialize app on DOM content loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Only setup the tab button listeners, which will then call switchToTab, and updateUI
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            switchToTab(targetTab);
        });
    });
    
    // Setup auth listener
    setupAuthListener();
    
    // Initial UI update based on auth state
    // This will trigger initial data loading and rendering as well
    if (!auth) {
        // If auth is not initialized (e.g., Firebase config missing), call updateUI directly
        updateUI();
    }
    // If auth is initialized, the onAuthStateChanged listener will call updateUI()
});

// Helper to format date for clipboard
window.formatDateForClipboard = function(date) {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.getMonth() + 1; // Month is 0-indexed
    const year = d.getFullYear();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
    return `${dayOfWeek} - ${day}/${month}/${year}`;
}

// Copy session info to clipboard
window.copySessionInfoToClipboard = async function(sessionId) {
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (!session) {
        console.error('Session not found for clipboard copy:', sessionId);
        return;
    }

    let clipboardText = '';
    const formattedDate = formatDateForClipboard(session.date);
    const location = session.location || 'The Aura';
    const time = session.time || '7:30 PM - 8:30 PM';
    const kickOffTime = session.kickOffTime || '';

    if (session.type === 'match') {
        // Calculate match day number
        const matchesUpToThis = sessions.filter(s => s.type === 'match' && !s.deleted && s.id <= session.id).length;
        const opponent = session.opponent || 'Opponent';

        clipboardText = `🏆 Matchday #${String(matchesUpToThis).padStart(2, '0')} - ${opponent}

📅 ${formattedDate}
⌚ Meet up ${time.split('-')[0].trim()} at ${location}, Kickoff ${kickOffTime || 'TBD'}
🏟 ${location}
👕 Shinguards, Black shorts and socks`;
    } else {
        // Training session
        clipboardText = `⚽ Training Session

📅 ${formattedDate}
⌚ ${time}
🏟 ${location}`;
    }

    try {
        await navigator.clipboard.writeText(clipboardText);
        showToast('Session information copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy session information: ', err);
        showToast('Failed to copy session information to clipboard.', true);
    }
};

// Show a toast message
window.showToast = function(message, isError = false) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast-message ${isError ? 'error' : ''}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Force reflow to ensure CSS transition works
    toast.offsetHeight; 

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}
