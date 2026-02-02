// ============================================
// MATCH CARD AND SCORING FUNCTIONS
// ============================================

// Generate match card HTML
function generateMatchCard(session) {
    const matchTypeBadgeClass = session.matchType || 'friendly';
    const matchTypeLabel = session.matchType === 'cup' ? 'Cup Match' : session.matchType === 'league' ? 'League Match' : 'Friendly Match';
    
    // Calculate match number (count only matches up to this one)
    const matchesUpToThis = sessions.filter(s => s.type === 'match' && !s.deleted && s.id <= session.id).length;
    
    return `
        <article class="session-card match-card ${session.deleted ? 'deleted' : ''}" data-session="${session.id}" onclick="handleMatchCardClick(event, parseInt(${session.id}))">
            <div class="session-card-front">
                <div class="session-header">
                    <span class="session-number">M${String(matchesUpToThis).padStart(2, '0')}</span>
                    <div class="match-type-badge ${matchTypeBadgeClass}">${matchTypeLabel}</div>
                    ${editMode ? `
                        <div class="session-date-edit">
                            <label>Date:</label>
                            <input type="date" class="session-date-input" value="${session.date ? new Date(session.date).toISOString().split('T')[0] : ''}" data-session="${session.id}" data-field="date" onclick="event.stopPropagation()" />
                        </div>
                    ` : `
                        <h2 class="session-date">${formatDate(session.date)} <button class="copy-info-btn" onclick="event.stopPropagation(); copySessionInfoToClipboard(${session.id})" title="Copy session info to clipboard">📋</button></h2>
                    `}
                    ${session.cupStage && !editMode ? `<div class="cup-stage">${session.cupStage}</div>` : ''}
                </div>
                ${editMode ? `
                    <div class="match-input-group">
                        <label class="match-input-label">Opponent Team</label>
                        <input type="text" class="match-input" value="${session.opponent || ''}" data-session="${session.id}" data-field="opponent" placeholder="Enter opponent team name" onclick="event.stopPropagation()" />
                    </div>
                    <div class="match-input-group">
                        <label class="match-input-label">Match Type</label>
                        <select class="match-type-select" data-session="${session.id}" data-field="matchType" onclick="event.stopPropagation()" onchange="handleMatchTypeChange(${session.id}, this.value)">
                            <option value="friendly" ${session.matchType === 'friendly' ? 'selected' : ''}>Friendly</option>
                            <option value="league" ${session.matchType === 'league' ? 'selected' : ''}>League</option>
                            <option value="cup" ${session.matchType === 'cup' ? 'selected' : ''}>Cup</option>
                        </select>
                    </div>
                    <div class="match-input-group ${session.matchType === 'cup' ? '' : 'hidden'}" id="match-cup-stage-${session.id}">
                        <label class="match-input-label">Cup Stage</label>
                        <input type="text" class="match-input" value="${session.cupStage || ''}" data-session="${session.id}" data-field="cupStage" placeholder="e.g., Quarter-finals, Semi-final, Final" onclick="event.stopPropagation()" />
                    </div>
                ` : `
                    <div class="opponent-name">vs ${session.opponent || defaults.opponent}</div>
                `}
                <div class="session-meta">
                    ${editMode ? `
                        <div class="meta-item meta-item-edit">
                            <span class="meta-icon">📍</span>
                            <input type="text" class="meta-input" value="${session.location || 'The Aura'}" data-session="${session.id}" data-field="location" placeholder="Location" onclick="event.stopPropagation()" />
                        </div>
                        <div class="meta-item meta-item-edit">
                            <span class="meta-icon">🕢</span>
                            <input type="text" class="meta-input" value="${session.time || '7:30 PM - 8:30 PM'}" data-session="${session.id}" data-field="time" placeholder="Time" onclick="event.stopPropagation()" />
                        </div>
                        <div class="meta-item meta-item-edit">
                            <span class="meta-icon">⏱️</span>
                            <input type="time" class="meta-input" value="${session.kickOffTime || ''}" data-session="${session.id}" data-field="kickOffTime" placeholder="Kick-off Time" onclick="event.stopPropagation()" />
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
                        ${session.kickOffTime ? `
                        <div class="meta-item">
                            <span class="meta-icon">⏱️</span>
                            <span>${session.kickOffTime} Kick Off</span>
                        </div>
                        ` : ''}
                    `}
                </div>
                <div class="match-score-section" style="padding: 10px 20px; margin-top: 10px;">
                    ${editMode ? `
                        <div class="score-inputs" style="display: flex; gap: 10px; align-items: center; justify-content: center;">
                            <span style="font-size: 14px; color: var(--text-secondary);">Score:</span>
                            <input type="number" 
                                   class="score-input" 
                                   value="${session.teamScore || ''}" 
                                   placeholder="0"
                                   min="0"
                                   style="width: 50px; text-align: center; font-size: 18px; font-weight: bold; padding: 8px; border: 2px solid var(--border-color); border-radius: 6px; background: var(--bg-card); color: var(--text-primary);"
                                   onclick="event.stopPropagation()"
                                   onchange="updateMatchScore('${session.id}', this.value, document.getElementById('opponent-score-${session.id}').value)"
                                   id="team-score-${session.id}">
                            <span style="font-size: 20px; font-weight: bold; color: var(--text-secondary);">-</span>
                            <input type="number" 
                                   class="score-input" 
                                   value="${session.opponentScore || ''}" 
                                   placeholder="0"
                                   min="0"
                                   style="width: 50px; text-align: center; font-size: 18px; font-weight: bold; padding: 8px; border: 2px solid var(--border-color); border-radius: 6px; background: var(--bg-card); color: var(--text-primary);"
                                   onclick="event.stopPropagation()"
                                   onchange="updateMatchScore('${session.id}', document.getElementById('team-score-${session.id}').value, this.value)"
                                   id="opponent-score-${session.id}">
                        </div>
                    ` : (session.teamScore !== undefined && session.teamScore !== '') ? `
                        <div class="match-result-display" style="text-align: center; margin: 8px 0;">
                            <div class="score-display" style="font-size: 28px; font-weight: bold; color: var(--accent);">
                                ${session.teamScore} - ${session.opponentScore}
                            </div>
                            ${session.result ? `
                                <div class="result-badge ${session.result}" style="display: inline-block; margin-top: 5px; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
                                    ${session.result === 'win' ? 'background: rgba(0, 255, 100, 0.2); color: #00ff64;' : ''}
                                    ${session.result === 'draw' ? 'background: rgba(255, 200, 0, 0.2); color: #ffc800;' : ''}
                                    ${session.result === 'loss' ? 'background: rgba(255, 50, 50, 0.2); color: #ff3232;' : ''}">
                                    ${session.result}
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                ${session.cancelled && !editMode ? `
                    <div style="padding: 12px 20px; background: rgba(239, 68, 68, 0.1); border-top: 1px solid var(--border-color); display: flex; align-items: center; gap: 10px; margin-top: 16px;">
                        <span style="font-size: 18px;">🚫</span>
                        <div style="flex: 1;">
                            <div style="font-size: 12px; font-weight: 700; color: #ef4444; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Match Cancelled</div>
                            <div style="font-size: 14px; color: var(--text-secondary);">${session.cancelReason || 'No reason provided'}</div>
                        </div>
                    </div>
                ` : ''}
                ${editMode ? `
                    <div class="session-cancel-controls" style="margin-top: 16px;">
                        <div class="cancel-toggle-group">
                            <label for="cancel-${session.id}" class="cancel-toggle-label">Cancel this match</label>
                            <div class="cancel-toggle-switch">
                                <input type="checkbox" id="cancel-${session.id}" ${session.cancelled ? 'checked' : ''} data-session="${session.id}" onclick="event.stopPropagation()" />
                                <span class="cancel-toggle-slider"></span>
                            </div>
                        </div>
                        <input type="text" class="cancel-reason-input" id="cancel-reason-${session.id}" placeholder="Reason for cancellation..." value="${session.cancelReason || ''}" data-session="${session.id}" ${!session.cancelled ? 'disabled' : ''} onclick="event.stopPropagation()" />
                        <button class="delete-session-btn" onclick="event.stopPropagation(); handleDeleteSession(parseInt(${session.id}))" data-session="${session.id}">
                            <span class="delete-icon">🗑️</span>
                            <span>Delete Match</span>
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="session-card-back">
                ${generateMatchBackContent(session)}
            </div>
        </article>
    `;
}

// Generate match back content (attendance and goal scorers)
function generateMatchBackContent(session) {
    const attendance = session.attendance || [];
    const captain = session.captain || '';
    const matchGoals = session.matchGoals || {};
    
    // Get all active players
    const activePlayers = players.filter(p => {
        const returning = (p.returning || '').toString().toLowerCase().trim();
        const playerName = (p.player || '').toString().toLowerCase();
        return p.player && 
               p.player !== '?' && 
               !playerName.includes('child') &&
               returning !== 'no' &&
               !p.deleted;
    }).sort((a, b) => (a.player || '').localeCompare(b.player || ''));
    
    const attendingPlayers = activePlayers.filter(p => attendance.includes(p.player));
    
    return `
        <div class="attendance-section">
            <h3 class="attendance-section-title">Match Attendance</h3>
            <div class="attendance-header">
                <span class="attendance-header-label">✓</span>
                <span class="attendance-header-player">Player</span>
                <span class="attendance-header-captain">Captain</span>
            </div>
            <div class="attendance-checklist" id="attendance-list-${session.id}">
                ${activePlayers.map(p => `
                    <div class="attendance-item">
                        <input type="checkbox" 
                               class="attendance-checkbox" 
                               data-session="${session.id}" 
                               data-player="${p.player}"
                               ${attendance.includes(p.player) ? 'checked' : ''}
                               onclick="event.stopPropagation(); handleAttendanceChange(${session.id}, '${p.player}', this.checked)">
                        <span class="attendance-player-name">${p.player}</span>
                        <input type="checkbox" 
                               class="captain-checkbox" 
                               data-session="${session.id}" 
                               data-player="${p.player}"
                               ${captain === p.player ? 'checked' : ''}
                               ${!attendance.includes(p.player) ? 'disabled' : ''}
                               onclick="event.stopPropagation(); handleCaptainCheckbox(${session.id}, '${p.player}', this.checked)"
                               title="Captain">
                    </div>
                `).join('')}
            </div>
            
            <div class="goal-scorers-section">
                <h3 class="attendance-section-title">Goal Scorers</h3>
                <div id="goal-scorers-${session.id}">
                    ${attendingPlayers.length > 0 ? attendingPlayers.map(p => `
                        <div class="goal-scorer-item">
                            <span class="goal-scorer-name">${p.player}</span>
                            <div class="goal-scorer-controls">
                                <button class="goal-btn" onclick="event.stopPropagation(); updateGoals(${session.id}, '${p.player}', -1)" ${(matchGoals[p.player] || 0) === 0 ? 'disabled' : ''}>−</button>
                                <span class="goal-count">${matchGoals[p.player] || 0}</span>
                                <button class="goal-btn" onclick="event.stopPropagation(); updateGoals(${session.id}, '${p.player}', 1)">+</button>
                            </div>
                        </div>
                    `).join('') : '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No players attending yet</p>'}
                </div>
            </div>
        </div>
    `;
}

// Handle match type change in edit mode
window.handleMatchTypeChange = function(sessionId, matchType) {
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (session) {
        session.matchType = matchType;
        
        // Show/hide cup stage field
        const cupStageGroup = document.getElementById(`match-cup-stage-${sessionId}`);
        if (cupStageGroup) {
            if (matchType === 'cup') {
                cupStageGroup.classList.remove('hidden');
            } else {
                cupStageGroup.classList.add('hidden');
                // Clear cup stage if not a cup match
                session.cupStage = '';
                const cupStageInput = cupStageGroup.querySelector('input');
                if (cupStageInput) cupStageInput.value = '';
            }
        }
    }
};

// Handle match card click for flipping
window.handleMatchCardClick = function(event, sessionId) {
    // Don't flip if clicking on interactive elements
    const target = event.target;
    if (target.closest('input, button, select, .attendance-checkbox, .captain-checkbox, .goal-btn, .captain-selector')) {
        return; // Don't stop propagation here, let the event bubble to the specific handlers
    }
    
    const card = event.currentTarget;
    card.classList.toggle('flipped');
};

// Handle attendance checkbox change
window.handleAttendanceChange = function(sessionId, playerName, isChecked) {
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (!session) return;
    
    if (!session.attendance) {
        session.attendance = [];
    }
    
    if (isChecked) {
        if (!session.attendance.includes(playerName)) {
            session.attendance.push(playerName);
        }
        // Enable captain checkbox
        const captainCheckbox = document.querySelector(`.captain-checkbox[data-session="${sessionId}"][data-player="${playerName}"]`);
        if (captainCheckbox) {
            captainCheckbox.disabled = false;
        }
    } else {
        session.attendance = session.attendance.filter(p => p !== playerName);
        // If unchecked player was captain, clear captain
        if (session.captain === playerName) {
            session.captain = '';
        }
        // Disable and uncheck captain checkbox
        const captainCheckbox = document.querySelector(`.captain-checkbox[data-session="${sessionId}"][data-player="${playerName}"]`);
        if (captainCheckbox) {
            captainCheckbox.checked = false;
            captainCheckbox.disabled = true;
        }
        // Clear any goals for this player
        if (session.matchGoals && session.matchGoals[playerName]) {
            delete session.matchGoals[playerName];
        }
    }
    
    // Update goal scorers display
    updateGoalScorersDisplay(sessionId);
    
    // Auto-save
    saveMatchData(sessionId);

    // Re-render the back of the card to update attendance display
    const card = document.querySelector(`.session-card[data-session="${sessionId}"]`);
    if (card) {
        const backContentDiv = card.querySelector('.session-card-back');
        if (backContentDiv) {
            // Use appropriate back content generator based on session type
            if (session.type === 'match') {
                backContentDiv.innerHTML = generateMatchBackContent(session);
            } else {
                backContentDiv.innerHTML = generateTrainingBackContent(session);
            }
        }
    }
};

// Handle captain selection change
window.handleCaptainChange = function(sessionId, playerName) {
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (!session) return;
    
    session.captain = playerName;
};

// Handle captain checkbox change
window.handleCaptainCheckbox = function(sessionId, playerName, isChecked) {
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (!session) return;
    
    // Only one captain at a time - uncheck all others
    if (isChecked) {
        session.captain = playerName;
        // Uncheck all other captain checkboxes
        document.querySelectorAll(`.captain-checkbox[data-session="${sessionId}"]`).forEach(cb => {
            if (cb.dataset.player !== playerName) {
                cb.checked = false;
            }
        });
    } else {
        // If unchecking the current captain, clear it
        if (session.captain === playerName) {
            session.captain = '';
        }
    }
    
    // Auto-save
    saveMatchData(sessionId);
};

// Update goals for a player
window.updateGoals = function(sessionId, playerName, delta) {
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (!session) return;
    
    if (!session.matchGoals) {
        session.matchGoals = {};
    }
    
    const currentGoals = session.matchGoals[playerName] || 0;
    const newGoals = Math.max(0, currentGoals + delta);
    
    if (newGoals === 0) {
        delete session.matchGoals[playerName];
    } else {
        session.matchGoals[playerName] = newGoals;
    }
    
    // Update the specific goal count display - find by matching text content
    const goalScorerItems = document.querySelectorAll(`#goal-scorers-${sessionId} .goal-scorer-item`);
    goalScorerItems.forEach(item => {
        const nameEl = item.querySelector('.goal-scorer-name');
        if (nameEl && nameEl.textContent.trim() === playerName) {
            const countEl = item.querySelector('.goal-count');
            const minusBtn = item.querySelector('.goal-btn:first-child');
            if (countEl) countEl.textContent = newGoals;
            if (minusBtn) minusBtn.disabled = newGoals === 0;
        }
    });
    
    // Auto-save
    saveMatchData(sessionId);
};

// Update captain selector options based on attendance
function updateCaptainSelector(sessionId) {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const captainSelector = document.querySelector(`.captain-selector[data-session="${sessionId}"]`);
    if (!captainSelector) return;
    
    const attendance = session.attendance || [];
    const currentCaptain = session.captain || '';
    
    // Get all active players
    const activePlayers = players.filter(p => {
        const returning = (p.returning || '').toString().toLowerCase().trim();
        const playerName = (p.player || '').toString().toLowerCase();
        return p.player && 
               p.player !== '?' && 
               !playerName.includes('child') &&
               returning !== 'no' &&
               !p.deleted;
    }).filter(p => attendance.includes(p.player)).sort((a, b) => (a.player || '').localeCompare(b.player || ''));
    
    // Rebuild options
    captainSelector.innerHTML = '<option value="">Select captain...</option>' +
        activePlayers.map(p => `<option value="${p.player}" ${currentCaptain === p.player ? 'selected' : ''}>${p.player}</option>`).join('');
}

// Update match score
window.updateMatchScore = function(sessionId, teamScore, opponentScore) {
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (!session) return;
    
    session.teamScore = teamScore;
    session.opponentScore = opponentScore;
    
    // Auto-calculate result
    const team = parseInt(teamScore) || 0;
    const opponent = parseInt(opponentScore) || 0;
    
    if (teamScore !== '' && opponentScore !== '') {
        if (team > opponent) {
            session.result = 'win';
        } else if (team < opponent) {
            session.result = 'loss';
        } else {
            session.result = 'draw';
        }
    } else {
        session.result = '';
    }
    
    saveData();
};

// Update goal scorers display based on attendance
function updateGoalScorersDisplay(sessionId) {
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (!session) return;
    
    const goalScorersContainer = document.getElementById(`goal-scorers-${sessionId}`);
    if (!goalScorersContainer) return;
    
    const attendance = session.attendance || [];
    const matchGoals = session.matchGoals || {};
    
    // Get all active players who are attending
    const activePlayers = players.filter(p => {
        const returning = (p.returning || '').toString().toLowerCase().trim();
        const playerName = (p.player || '').toString().toLowerCase();
        return p.player && 
               p.player !== '?' && 
               !playerName.includes('child') &&
               returning !== 'no' &&
               !p.deleted &&
               attendance.includes(p.player);
    }).sort((a, b) => (a.player || '').localeCompare(b.player || ''));
    
    if (activePlayers.length === 0) {
        goalScorersContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No players attending yet</p>';
        return;
    }
    
    goalScorersContainer.innerHTML = activePlayers.map(p => {
        const goals = matchGoals[p.player] || 0;
        return `
            <div class="goal-scorer-item">
                <span class="goal-scorer-name">${p.player}</span>
                <div class="goal-scorer-controls">
                    <button class="goal-btn" onclick="event.stopPropagation(); updateGoals(${sessionId}, '${p.player}', -1)" ${goals === 0 ? 'disabled' : ''}>−</button>
                    <span class="goal-count">${goals}</span>
                    <button class="goal-btn" onclick="event.stopPropagation(); updateGoals(${sessionId}, '${p.player}', 1)">+</button>
                </div>
            </div>
        `;
    }).join('');
}

// Save match data
window.saveMatchData = async function(sessionId) {
    console.log(`Entering saveMatchData for session ${sessionId}`);
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (!session) {
        console.warn(`Session ${sessionId} not found in saveMatchData.`);
        return;
    }
    
    // Integrate match goals with player goals
    const matchDate = session.date ? new Date(session.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const matchGoals = session.matchGoals || {};
        const attendingPlayers = session.attendance || [];
        const kickOffTime = session.kickOffTime || '';
    
    // Set goals for each player's record (not add, to avoid duplicates)
    for (const [playerName, goalCount] of Object.entries(matchGoals)) {
        if (goalCount > 0) {
            setGoals(playerName, matchDate, goalCount);
        } else {
            // If goals were removed, delete the entry
            deleteGoal(playerName, matchDate);
        }
    }
    
    // Clear goals for any player who is not attending but has goals for this match date
    // This handles cases where a player was removed from attendance after scoring
    players.forEach(player => {
        const playerName = player.player;
        if (!playerName) return;
        
        // If player is not attending and not in matchGoals, check if they have goals for this date
        if (!attendingPlayers.includes(playerName)) {
            const goals = getPlayerGoals(playerName);
            if (goals[matchDate]) {
                deleteGoal(playerName, matchDate);
            }
        }
    });
    
    // Save session data
    await saveData();
    await saveSessionsList();
    
    showSaveIndicator();
    
    // Always refresh player display if on players tab
    const playersTab = document.getElementById('players-tab');
    if (playersTab && playersTab.classList.contains('active')) {
        renderPlayers();
    }
};
