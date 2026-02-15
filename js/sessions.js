// ============================================
// SESSION RENDERING AND MANAGEMENT
// ============================================

// Generate training back content (attendance)
window.generateTrainingBackContent = function(session) {
    const attendance = session.attendance || [];
    
    const activePlayers = players.filter(p => {
        const returning = (p.returning || '').toString().toLowerCase().trim();
        const playerName = (p.player || '').toString().toLowerCase();
        return p.player && 
               p.player !== '?' && 
               !playerName.includes('child') &&
               returning !== 'no' &&
               !p.deleted;
    }).sort((a, b) => (a.player || '').localeCompare(b.player || ''));
    
    return `
        <div class="attendance-section">
            <h3 class="attendance-section-title">Training Attendance</h3>
            <div class="attendance-summary" style="text-align: center; margin-bottom: 15px; font-size: 16px; color: var(--text-secondary);">
                <span style="font-size: 24px; font-weight: bold; color: var(--accent-primary);">${attendance.length}</span> of ${activePlayers.length} players attending
            </div>
            <div class="attendance-header">
                <span class="attendance-header-label">✓</span>
                <span class="attendance-header-player">Player</span>
            </div>
            <div class="attendance-checklist" id="attendance-list-${session.id}">
                ${activePlayers.map(p => `
                    <div class="attendance-item">
                        <input type="checkbox" 
                               class="attendance-checkbox" 
                               data-session="${session.id}" 
                               data-player="${p.player}"
                               ${attendance.includes(p.player) ? 'checked' : ''}
                               onclick="event.stopPropagation(); handleAttendanceChange(${session.id}, '${p.player.replace(/'/g, "\\'")}', this.checked)">
                        <span class="attendance-player-name">${p.player}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Generate session card HTML
window.generateSessionCard = function(session) {
    // If it's a new session, show an editable card
    if (session._isNew) {
        const tempId = session._tempId || '';
        const defaultDateStr = session.date ? new Date(session.date).toISOString().split('T')[0] : '';
        const sessionType = session.type || 'training';
        
        return `
            <article class="session-card new-session-card" data-temp-id="${tempId}">
                <div class="session-header">
                    <span class="session-number">New</span>
                    <div class="session-type-selector">
                        <div class="type-option ${sessionType === 'training' ? 'selected' : ''}" data-type="training" onclick="selectSessionType('${tempId}', 'training')">Training</div>
                        <div class="type-option ${sessionType === 'match' ? 'selected' : ''}" data-type="match" onclick="selectSessionType('${tempId}', 'match')">Match</div>
                    </div>
                    <div class="session-date-edit">
                        <label>Date:</label>
                        <input type="date" class="new-session-date-input" value="${defaultDateStr}" />
                    </div>
                </div>
                <div class="session-meta">
                    <div class="meta-item meta-item-edit">
                        <span class="meta-icon">📍</span>
                        <input type="text" class="new-session-location-input" value="${session.location || 'The Aura'}" placeholder="Location" />
                    </div>
                    <div class="meta-item meta-item-edit">
                        <span class="meta-icon">🕢</span>
                        <input type="text" class="new-session-time-input" value="${session.time || '7:30 PM - 8:30 PM'}" placeholder="Time" />
                    </div>
                </div>
                <div class="match-fields ${sessionType === 'match' ? 'active' : ''}">
                    <div class="match-input-group">
                        <label class="match-input-label">Opponent Team</label>
                        <input type="text" class="match-input new-session-opponent-input" placeholder="Enter opponent team name" value="${session.opponent || ''}" />
                    </div>
                    <div class="match-input-group">
                        <label class="match-input-label">Match Type</label>
                        <select class="match-type-select new-session-matchtype-select">
                            <option value="friendly" ${session.matchType === 'friendly' ? 'selected' : ''}>Friendly</option>
                            <option value="league" ${session.matchType === 'league' ? 'selected' : ''}>League</option>
                            <option value="cup" ${session.matchType === 'cup' ? 'selected' : ''}>Cup</option>
                        </select>
                    </div>
                    <div class="match-input-group ${session.matchType === 'cup' ? '' : 'hidden'}" id="cup-stage-group-${tempId}">
                        <label class="match-input-label">Cup Stage</label>
                        <input type="text" class="match-input new-session-cupstage-input" placeholder="e.g., Quarter-finals, Semi-final, Final" value="${session.cupStage || ''}" />
                    </div>
                </div>
                <div class="new-session-actions">
                    <button class="save-session-btn" onclick="handleSaveSession('${tempId}')">Save</button>
                    <button class="cancel-session-btn" onclick="handleCancelNewSession()">Cancel</button>
                </div>
            </article>
        `;
    }
    
    // Handle cancelled sessions (only show cancelled notice when NOT in edit mode)
    if (session.cancelled && !editMode) {
        return `
            <article class="session-card cancelled" data-session="${session.id}">
                <div class="session-header">
                    <span class="session-number">${String(session.id).padStart(2, '0')}</span>
                    <h2 class="session-date">${formatDate(session.date)}</h2>
                </div>
                <div class="cancelled-notice">
                    <span class="cancelled-badge">No Training</span>
                    <span class="cancelled-reason">${session.cancelReason || 'Session cancelled'}</span>
                </div>
            </article>
        `;
    }

    // Check if it's a match
    const isMatch = session.type === 'match';
    
    if (isMatch) {
        // Generate match card
        return generateMatchCard(session);
    }

    // Generate training session card
    const descContent = session.desc ? parseContent(session.desc) : defaults.desc;
    const warmupContent = session.warmup ? parseContent(session.warmup) : defaults.warmup;
    const drillsContent = session.drills ? parseContent(session.drills) : defaults.drills;
    const gameContent = session.game ? parseContent(session.game) : defaults.game;
    
    // Check if this is the next upcoming session
    const isNextSession = window.currentNextSessionId === session.id;

    return `
        <article class="session-card ${session.cancelled ? 'cancelled' : ''} ${session.deleted ? 'deleted' : ''} ${isNextSession ? 'next-session' : ''}" data-session="${session.id}" onclick="handleMatchCardClick(event, ${session.id})">
            ${isNextSession ? '<span class="next-session-badge">Next Up</span>' : ''}
            <div class="session-card-front">
                <div class="session-header">
                    <span class="session-number">${String(session.id).padStart(2, '0')}</span>
                    ${editMode ? `
                        <div class="session-date-edit">
                            <label>Date:</label>
                            <input type="date" class="session-date-input" value="${session.date ? new Date(session.date).toISOString().split('T')[0] : ''}" data-session="${session.id}" data-field="date" />
                        </div>
                    ` : `
                        <h2 class="session-date">${formatDate(session.date)} <button class="copy-info-btn" onclick="event.stopPropagation(); copySessionInfoToClipboard(${session.id})" title="Copy session info to clipboard">📋</button></h2>
                    `}
                    <div class="session-meta">
                        ${editMode ? `
                            <div class="meta-item meta-item-edit">
                                <span class="meta-icon">📍</span>
                                <input type="text" class="meta-input" value="${session.location || 'The Aura'}" data-session="${session.id}" data-field="location" placeholder="Location" />
                            </div>
                            <div class="meta-item meta-item-edit">
                                <span class="meta-icon">🕢</span>
                                <input type="text" class="meta-input" value="${session.time || '7:30 PM - 8:30 PM'}" data-session="${session.id}" data-field="time" placeholder="Time" />
                            </div>
                        ` : `
                            <div class="meta-item">
                                <span class="meta-icon">📍</span>
                                <span>${session.location || 'The Aura'}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-icon">🕢</span>
                                <span>${session.time || '7:30 PM - 8:30 PM'}</span>
                            </div>
                        `}
                    </div>
                    <div class="session-description">
                        <div class="activity-content activity-display ${!session.desc ? 'placeholder' : ''}" data-session="${session.id}" data-field="desc">${descContent}</div>
                        <textarea class="activity-input hidden" data-session="${session.id}" data-field="desc" placeholder="Add a description or focus for this session...">${session.desc}</textarea>
                    </div>
                </div>
                <div class="session-activities">
                    <div class="activity-block warmup">
                        <div class="activity-header">
                            <span class="activity-title">Warm-up</span>
                            <span class="activity-duration">10 mins</span>
                        </div>
                        <div class="activity-content activity-display ${!session.warmup ? 'placeholder' : ''}" data-session="${session.id}" data-field="warmup">${warmupContent}</div>
                        <textarea class="activity-input hidden" data-session="${session.id}" data-field="warmup" placeholder="Enter warm-up activities...">${session.warmup}</textarea>
                    </div>
                    <div class="activity-block drills">
                        <div class="activity-header">
                            <span class="activity-title">Drills</span>
                            <span class="activity-duration">20 mins</span>
                        </div>
                        <div class="activity-content activity-display ${!session.drills ? 'placeholder' : ''}" data-session="${session.id}" data-field="drills">${drillsContent}</div>
                        <textarea class="activity-input hidden" data-session="${session.id}" data-field="drills" placeholder="Enter drills for this session...">${session.drills}</textarea>
                    </div>
                    <div class="activity-block match">
                        <div class="activity-header">
                            <span class="activity-title">Match</span>
                            <span class="activity-duration">30 mins</span>
                        </div>
                        <div class="activity-content activity-display ${!session.game ? 'placeholder' : ''}" data-session="${session.id}" data-field="game">${gameContent}</div>
                        <textarea class="activity-input hidden" data-session="${session.id}" data-field="game" placeholder="Enter match details...">${session.game}</textarea>
                    </div>
                </div>
                ${session.cancelled && !editMode ? `
                    <div style="padding: 12px 20px; background: rgba(239, 68, 68, 0.1); border-top: 1px solid var(--border-color); display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 18px;">🚫</span>
                        <div style="flex: 1;">
                            <div style="font-size: 12px; font-weight: 700; color: #ef4444; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Session Cancelled</div>
                            <div style="font-size: 14px; color: var(--text-secondary);">${session.cancelReason || 'No reason provided'}</div>
                        </div>
                    </div>
                ` : ''}
                <div class="session-cancel-controls hidden">
                    <div class="cancel-toggle-group">
                        <label for="cancel-${session.id}" class="cancel-toggle-label">Cancel this session</label>
                        <div class="cancel-toggle-switch">
                            <input type="checkbox" id="cancel-${session.id}" ${session.cancelled ? 'checked' : ''} data-session="${session.id}" />
                            <span class="cancel-toggle-slider"></span>
                        </div>
                    </div>
                    <input type="text" class="cancel-reason-input" id="cancel-reason-${session.id}" placeholder="Reason for cancellation..." value="${session.cancelReason || ''}" data-session="${session.id}" ${!session.cancelled ? 'disabled' : ''} />
                    <button class="delete-session-btn" onclick="handleDeleteSession(${session.id})" data-session="${session.id}">
                        <span class="delete-icon">🗑️</span>
                        <span>Delete Session</span>
                    </button>
                </div>
            </div>
            <div class="session-card-back">
                ${generateTrainingBackContent(session)}
            </div>
        </article>
    `;
}

// Find the next upcoming session ID
window.findNextSessionId = function() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Find upcoming sessions
    const upcomingSessions = sessions.filter(s => {
        if (s.deleted || s.cancelled || s._isNew) return false;
        const sessionDate = new Date(s.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate >= now;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return upcomingSessions.length > 0 ? upcomingSessions[0].id : null;
}

// Generate countdown HTML
window.generateCountdownHtml = function(sessionDate) {
    const now = new Date();
    const target = new Date(sessionDate);
    const diff = target - now;
    
    if (diff <= 0) return ''; // Session is today or past
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `
        <div class="next-session-countdown">
            <div class="countdown-item">
                <div class="countdown-value">${days}</div>
                <div class="countdown-label">${days === 1 ? 'Day' : 'Days'}</div>
            </div>
            <div class="countdown-item">
                <div class="countdown-value">${hours}</div>
                <div class="countdown-label">${hours === 1 ? 'Hour' : 'Hours'}</div>
            </div>
            <div class="countdown-item">
                <div class="countdown-value">${minutes}</div>
                <div class="countdown-label">${minutes === 1 ? 'Min' : 'Mins'}</div>
            </div>
        </div>
    `;
}

// Render all sessions
window.renderSessions = async function() {
    const sessionsContainer = document.getElementById('sessions');
    
    // Update quick stats widget if it exists
    if (typeof renderQuickStats === 'function' && document.getElementById('quick-stats-widget')) {
        renderQuickStats();
    }
    
    // Find the next upcoming session
    const nextSessionId = findNextSessionId();
    
    // Filter sessions based on showPastSessions and showDeletedSessions flags
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const filteredSessions = sessions.filter(session => {
        // Always show new sessions
        if (session._isNew) {
            return true;
        }
        
        // Hide deleted sessions unless showDeletedSessions is true
        if (session.deleted && !showDeletedSessions) {
            return false;
        }
        
        // Hide past sessions unless showPastSessions is true
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        if (sessionDate < today && !showPastSessions) {
            return false;
        }
        
        // Filter by session type
        const sessionType = session.type || 'training';
        if (sessionType === 'training' && !showTraining) {
            return false;
        }
        if (sessionType === 'match' && !showMatches) {
            return false;
        }
        
        return true;
    }).sort((a, b) => {
        // Sort by date (ascending - earliest first)
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });
    
    // Store the next session ID globally for use in card generation
    window.currentNextSessionId = nextSessionId;
    
    let html = filteredSessions.map(generateSessionCard).join('');
    
    // Add "Add Session" button in edit mode
    if (editMode) {
        html += `
            <div class="add-session-container">
                <div class="add-session-form">
                    <input type="date" class="new-session-date-input" id="newSessionDate" />
                    <button class="add-session-btn" onclick="handleAddSession()">
                        <span class="add-session-icon">+</span>
                        <span class="add-session-text">Add New Session</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    sessionsContainer.innerHTML = html;
    
    document.querySelectorAll('.activity-input').forEach(input => {
        input.addEventListener('input', e => {
            const session = sessions.find(s => s.id === parseInt(e.target.dataset.session));
            const field = e.target.dataset.field;
            if (session && field) session[field] = e.target.value;
        });
    });
    
    // Handle date, location, and time inputs
    document.querySelectorAll('.session-date-input, .meta-input').forEach(input => {
        input.addEventListener('change', e => {
            const session = sessions.find(s => s.id === parseInt(e.target.dataset.session));
            const field = e.target.dataset.field;
            if (session && field) {
                if (field === 'date') {
                    session.date = new Date(e.target.value);
                } else {
                    session[field] = e.target.value;
                }
                saveSessionsList();
            }
        });
    });
    
    // Handle match-specific field inputs (opponent, matchType, cupStage)
    document.querySelectorAll('.match-input, .match-type-select').forEach(input => {
        input.addEventListener('change', e => {
            const session = sessions.find(s => s.id === parseInt(e.target.dataset.session));
            const field = e.target.dataset.field;
            if (session && field) {
                session[field] = e.target.value;
                saveSessionsList();
            }
        });
    });
    
    applyEditMode();
    
    // Setup cancel controls if in edit mode
    if (editMode) {
        setupCancelControls();
        
        // Set default date for new session date picker
        const newSessionDateInput = document.getElementById('newSessionDate');
        if (newSessionDateInput && !newSessionDateInput.value) {
            // Default to 7 days after the last session, or today if no sessions
            let defaultDate = new Date();
            if (sessions.length > 0) {
                const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
                const lastSession = sortedSessions[0];
                defaultDate = new Date(lastSession.date);
                defaultDate.setDate(defaultDate.getDate() + 7);
            }
            newSessionDateInput.value = defaultDate.toISOString().split('T')[0];
        }
    }
}

// Delete session handler
window.handleDeleteSession = async function(sessionId) {
    if (!confirm('Are you sure you want to delete this session? It will be hidden but can be restored by showing past & deleted sessions.')) {
        return;
    }
    
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
        session.deleted = true;
        await saveSessionsList();
        renderSessions();
    }
};

// Cleanup deleted sessions
window.cleanupDeletedSessions = async function() {
    const deletedSessions = sessions.filter(s => s.deleted);
    const deletedCount = deletedSessions.length;
    
    if (deletedCount === 0) {
        alert('No deleted sessions to clean up.');
        return;
    }
    
    if (!confirm(`Are you sure you want to permanently delete ${deletedCount} session(s)? This action cannot be undone.`)) {
        return;
    }
    
    // Get IDs of deleted sessions before removing them
    const deletedSessionIds = deletedSessions.map(s => s.id);
    
    // Remove deleted sessions from the array
    const originalLength = sessions.length;
    sessions = sessions.filter(s => !s.deleted);
    
    // Also remove their data from Firebase sessions node
    if (database) {
        try {
            // Remove session content from Firebase
            const sessionsRef = database.ref('sessions');
            for (const sessionId of deletedSessionIds) {
                await sessionsRef.child(sessionId).remove();
            }
        } catch (e) {
            console.error('Failed to remove session data from Firebase:', e);
        }
    }
    
    // Save updated sessions list
    await saveSessionsList();
    
    // Re-render
    renderSessions();
    
    alert(`Successfully removed ${originalLength - sessions.length} deleted session(s).`);
};

// Add new session handler
window.handleAddSession = function() {
    // Create a temporary new session with a unique ID
    const tempId = 'new-session-' + Date.now();
    
    // Default date: 7 days after the last session, or today if no sessions
    let defaultDate = new Date();
    if (sessions.length > 0) {
        const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastSession = sortedSessions[0];
        defaultDate = new Date(lastSession.date);
        defaultDate.setDate(defaultDate.getDate() + 7);
    }
    
    const newSession = {
        id: null, // Will be assigned when saved
        date: defaultDate,
        type: 'training', // Default to training
        cancelled: false,
        cancelReason: '',
        location: 'The Aura',
        time: '7:30 PM - 8:30 PM',
        // Training fields
        desc: '',
        warmup: '',
        drills: '',
        game: '',
        // Match fields
        opponent: '',
        matchType: 'friendly',
        cupStage: '',
        attendance: [],
        captain: '',
        matchGoals: {},
        deleted: false,
        _tempId: tempId,
        _isNew: true
    };
    
    // Add to sessions array
    sessions.push(newSession);
    
    // Re-render to show the empty card
    renderSessions();
    
    // Scroll to the new session card
    setTimeout(() => {
        const newSessionCard = document.querySelector(`.session-card[data-temp-id="${tempId}"]`);
        if (newSessionCard) {
            newSessionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
};

// Save new session handler
window.handleSaveSession = async function(tempId) {
    const sessionCard = document.querySelector(`.session-card[data-temp-id="${tempId}"]`);
    if (!sessionCard) return;
    
    const dateInput = sessionCard.querySelector('.new-session-date-input');
    const locationInput = sessionCard.querySelector('.new-session-location-input');
    const timeInput = sessionCard.querySelector('.new-session-time-input');
    
    const dateStr = dateInput ? dateInput.value : '';
    const location = locationInput ? locationInput.value.trim() : '';
    const time = timeInput ? timeInput.value.trim() : '';
    
    if (!dateStr) {
        alert('Please enter a session date.');
        if (dateInput) dateInput.focus();
        return;
    }
    
    const newDate = new Date(dateStr);
    if (isNaN(newDate.getTime())) {
        alert('Invalid date format.');
        if (dateInput) dateInput.focus();
        return;
    }
    
    // Find and update the session
    const sessionIndex = sessions.findIndex(s => s._tempId === tempId);
    if (sessionIndex !== -1) {
        const session = sessions[sessionIndex];
        
        // Determine session type
        const selectedType = sessionCard.querySelector('.type-option.selected');
        const sessionType = selectedType ? selectedType.dataset.type : 'training';
        
        // Get match-specific fields if it's a match
        if (sessionType === 'match') {
            const opponentInput = sessionCard.querySelector('.new-session-opponent-input');
            const matchTypeSelect = sessionCard.querySelector('.new-session-matchtype-select');
            const cupStageInput = sessionCard.querySelector('.new-session-cupstage-input');
            
            const opponent = opponentInput ? opponentInput.value.trim() : '';
            const matchType = matchTypeSelect ? matchTypeSelect.value : 'friendly';
            const cupStage = cupStageInput ? cupStageInput.value.trim() : '';
            
            if (!opponent) {
                alert('Please enter the opponent team name.');
                if (opponentInput) opponentInput.focus();
                return;
            }
            
            session.opponent = opponent;
            session.matchType = matchType;
            session.cupStage = matchType === 'cup' ? cupStage : '';
            session.attendance = [];
            session.captain = '';
            session.matchGoals = {};
        }
        
        // Find the next available ID
        const deletedSessions = sessions.filter(s => s.deleted && !s._isNew).sort((a, b) => a.id - b.id);
        let newId;
        
        if (deletedSessions.length > 0) {
            newId = deletedSessions[0].id;
            const indexToRemove = sessions.findIndex(s => s.id === newId && !s._isNew);
            if (indexToRemove !== -1) {
                sessions.splice(indexToRemove, 1);
            }
        } else {
            const activeSessions = sessions.filter(s => !s.deleted && !s._isNew);
            const maxId = activeSessions.length > 0 ? Math.max(...activeSessions.map(s => s.id)) : 0;
            newId = maxId + 1;
        }
        
        session.id = newId;
        session.date = newDate;
        session.location = location || 'The Aura';
        session.time = time || '7:30 PM - 8:30 PM';
        session.type = sessionType;
        delete session._tempId;
        delete session._isNew;
    }
    
    // Sort sessions by ID
    sessions.sort((a, b) => {
        if (a.id === null) return 1;
        if (b.id === null) return -1;
        return a.id - b.id;
    });
    
    // Save to Firebase
    await saveSessionsList();
    await saveData();
    
    // Re-render
    renderSessions();
};

// Cancel new session handler
window.handleCancelNewSession = function() {
    // Remove the temporary session from the array
    const sessionIndex = sessions.findIndex(s => s._isNew);
    if (sessionIndex !== -1) {
        sessions.splice(sessionIndex, 1);
    }
    
    // Re-render
    renderSessions();
};

// Helper function to select session type for new sessions
window.selectSessionType = function(tempId, type) {
    const card = document.querySelector(`.session-card[data-temp-id="${tempId}"]`);
    if (!card) return;
    
    // Update button states
    card.querySelectorAll('.type-option').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.type === type) {
            btn.classList.add('selected');
        }
    });
    
    // Show/hide match fields
    const matchFields = card.querySelector('.match-fields');
    if (matchFields) {
        if (type === 'match') {
            matchFields.classList.add('active');
        } else {
            matchFields.classList.remove('active');
        }
    }
    
    // Update session in array
    const session = sessions.find(s => s._tempId === tempId);
    if (session) {
        session.type = type;
    }
    
    // Handle match type select change to show/hide cup stage
    const matchTypeSelect = card.querySelector('.new-session-matchtype-select');
    if (matchTypeSelect) {
        matchTypeSelect.addEventListener('change', function() {
            const cupStageGroup = document.getElementById(`cup-stage-group-${tempId}`);
            if (cupStageGroup) {
                if (this.value === 'cup') {
                    cupStageGroup.classList.remove('hidden');
                } else {
                    cupStageGroup.classList.add('hidden');
                }
            }
        });
    }
};

// Scroll to closest session
window.scrollToClosestSession = function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find the closest session (prefer upcoming, fallback to most recent past)
    let closestSession = null;
    let smallestDiff = Infinity;
    
    // First try to find the next upcoming session
    for (const session of sessions) {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        const diff = sessionDate - today;
        
        if (diff >= 0 && diff < smallestDiff) {
            smallestDiff = diff;
            closestSession = session;
        }
    }
    
    // If no upcoming session, find the most recent past session
    if (!closestSession) {
        smallestDiff = Infinity;
        for (const session of sessions) {
            const sessionDate = new Date(session.date);
            sessionDate.setHours(0, 0, 0, 0);
            const diff = today - sessionDate;
            
            if (diff >= 0 && diff < smallestDiff) {
                smallestDiff = diff;
                closestSession = session;
            }
        }
    }
    
    // Scroll to the closest session
    if (closestSession) {
        const card = document.querySelector(`.session-card[data-session="${closestSession.id}"]`);
        if (card) {
            setTimeout(() => {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 600); // Wait for animations to complete
        }
    }
}
