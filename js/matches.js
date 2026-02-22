// ============================================
// MATCH CARD AND SCORING FUNCTIONS
// ============================================

// Generate match card HTML
window.generateMatchCard = function(session) {
    const matchTypeBadgeClass = session.matchType || 'friendly';
    const matchTypeLabel = session.matchType === 'cup' ? 'Cup Match' : session.matchType === 'league' ? 'League Match' : 'Friendly Match';
    
    // Calculate match number (count only matches up to this one)
    const matchesUpToThis = sessions.filter(s => s.type === 'match' && !s.deleted && s.id <= session.id).length;
    
    // Check if this is the next upcoming session
    const isNextSession = window.currentNextSessionId === session.id;
    
    return `
        <article class="session-card match-card ${session.deleted ? 'deleted' : ''} ${isNextSession ? 'next-session' : ''}" data-session="${session.id}" onclick="handleMatchCardClick(event, parseInt(${session.id}))">
            ${isNextSession ? '<span class="next-session-badge">Next Up</span>' : ''}
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
                    ${typeof window.renderLineupIndicator === 'function' ? window.renderLineupIndicator(session) : ''}
                    ${!session.cancelled && !editMode ? `
                        <button onclick="event.stopPropagation(); showLineupBuilder(${session.id})" style="width: 100%; margin-top: 12px; padding: 10px; background: rgba(0, 212, 170, 0.1); color: var(--accent-primary); border: 2px solid var(--accent-primary); border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                            ⚽ Set Lineup
                        </button>
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

// Equal playing time: 9-a-side, 60 min. GK = 60 min; 8 outfield slots × 60 min = 480 min shared by outfield players.
const MATCH_LENGTH_MIN = 60;
const OUTFIELD_SLOTS = 8;

window.getEqualTimeSuggestions = function(attendance, goalkeeper) {
    const n = (attendance || []).length;
    if (n === 0) return { gkMinutes: MATCH_LENGTH_MIN, outfieldMinutes: 0, outfieldCount: 0 };
    const hasGK = !!(goalkeeper && attendance.includes(goalkeeper));
    const outfieldCount = hasGK ? n - 1 : n;
    const totalOutfieldMinutes = OUTFIELD_SLOTS * MATCH_LENGTH_MIN;
    const outfieldMinutes = outfieldCount > 0 ? Math.round(totalOutfieldMinutes / outfieldCount) : 0;
    return {
        gkMinutes: MATCH_LENGTH_MIN,
        outfieldMinutes,
        outfieldCount,
        hasGK
    };
};

/**
 * Build a rotation schedule that minimizes the number of substitutions.
 * 9-a-side, 60 min; GK stays on. Outfield: 8 slots. Uses 2 segments (30 min) for N=9..16, 3 segments (20 min) for N=17..24.
 * Returns { segments: [ { startMin, endMin, playerNames, playerNamesOff }, ... ], totalChanges, outfield } or null if no rotation needed.
 */
window.getRotationScheduleLeastChanges = function(attendance, goalkeeper) {
    const list = (attendance || []).slice();
    const hasGK = goalkeeper && list.includes(goalkeeper);
    const outfield = hasGK ? list.filter(p => p !== goalkeeper).sort((a, b) => String(a).localeCompare(b)) : list.slice().sort((a, b) => String(a).localeCompare(b));
    const N = outfield.length;
    const addOff = (segments) => {
        segments.forEach(seg => {
            seg.playerNamesOff = outfield.filter(p => !seg.playerNames.includes(p));
        });
        return segments;
    };
    if (N <= 0) return null;
    if (N <= 8) {
        const segs = [{ startMin: 0, endMin: MATCH_LENGTH_MIN, playerNames: outfield.slice(0, 8) }];
        addOff(segs);
        return { segments: segs, totalChanges: 0 };
    }
    if (N <= 16) {
        const segLen = MATCH_LENGTH_MIN / 2;
        const stayersCount = 16 - N;
        const seg1 = outfield.slice(0, 8);
        const seg2 = outfield.slice(0, stayersCount).concat(outfield.slice(8, N));
        const segs = [
            { startMin: 0, endMin: segLen, playerNames: seg1 },
            { startMin: segLen, endMin: MATCH_LENGTH_MIN, playerNames: seg2 }
        ];
        addOff(segs);
        return { segments: segs, totalChanges: 8 - stayersCount };
    }
    if (N <= 24) {
        const K = 3;
        const segLen = MATCH_LENGTH_MIN / K;
        const stayersCount = Math.max(0, 24 - N);
        const rot = 8 - stayersCount;
        const seg1 = outfield.slice(0, 8);
        const seg2 = outfield.slice(0, stayersCount).concat(outfield.slice(8, 8 + rot));
        const seg3 = outfield.slice(0, stayersCount).concat(outfield.slice(8 + rot, 8 + 2 * rot));
        const segs = [
            { startMin: 0, endMin: segLen, playerNames: seg1 },
            { startMin: segLen, endMin: 2 * segLen, playerNames: seg2 },
            { startMin: 2 * segLen, endMin: MATCH_LENGTH_MIN, playerNames: seg3 }
        ];
        addOff(segs);
        return { segments: segs, totalChanges: rot * 2 };
    }
    return null;
};

// Generate match back content (attendance and goal scorers)
window.generateMatchBackContent = function(session) {
    const attendance = session.attendance || [];
    const captain = session.captain || '';
    const goalkeeper = session.goalkeeper || '';
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
    const timeSuggestions = window.getEqualTimeSuggestions(attendance, goalkeeper);
    const rotationSchedule = window.getRotationScheduleLeastChanges(attendance, goalkeeper);
    
    const equalTimeLabel = attendance.length === 0
        ? ''
        : timeSuggestions.hasGK
            ? `Equal time (9-a-side, ${MATCH_LENGTH_MIN} min): GK ${timeSuggestions.gkMinutes} min • Outfield ${timeSuggestions.outfieldMinutes} min each`
            : `Equal time (9-a-side, ${MATCH_LENGTH_MIN} min): Pick a goalkeeper to see suggested outfield minutes`;
    
    const rotationHtml = rotationSchedule && rotationSchedule.segments.length > 0
        ? `
            <div class="rotation-schedule" style="margin-bottom: 12px; padding: 10px 12px; background: var(--bg-section); border-radius: 8px; border: 1px solid var(--border-color); font-size: 12px; color: var(--text-secondary);">
                <div style="font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">Rotation (least changes)${rotationSchedule.totalChanges > 0 ? ' · ' + rotationSchedule.totalChanges + ' sub' + (rotationSchedule.totalChanges !== 1 ? 's' : '') + ' total' : ''}</div>
                ${rotationSchedule.segments.map((seg, i) => {
                    const onList = goalkeeper ? [goalkeeper + ' (GK)', ...seg.playerNames] : seg.playerNames;
                    const prevSeg = i > 0 ? rotationSchedule.segments[i - 1] : null;
                    const comingOn = prevSeg ? seg.playerNames.filter(p => !prevSeg.playerNames.includes(p)) : [];
                    const goingOff = prevSeg ? prevSeg.playerNames.filter(p => !seg.playerNames.includes(p)) : [];
                    const rotationLine = (comingOn.length > 0 || goingOff.length > 0) ? `<div style="margin-bottom: 4px; font-size: 11px;"><div style="margin-bottom: 2px;"><span style="color: var(--success); font-weight: 600;">Coming on:</span> ${comingOn.length ? comingOn.join(', ') : '—'}</div><div><span style="color: var(--text-muted); font-weight: 600;">Going off:</span> ${goingOff.length ? goingOff.join(', ') : '—'}</div></div>` : '';
                    return `
                    <div style="margin-bottom: ${i < rotationSchedule.segments.length - 1 ? '10px' : '0'}; padding-bottom: ${i < rotationSchedule.segments.length - 1 ? '8px' : '0'}; border-bottom: ${i < rotationSchedule.segments.length - 1 ? '1px solid var(--border-color)' : 'none'};">
                        <div style="font-weight: 600; color: var(--accent-primary); margin-bottom: 4px;">${seg.startMin}–${seg.endMin} min</div>
                        ${rotationLine}
                        <div style="margin-bottom: 2px;"><span style="font-weight: 600; color: var(--text-primary);">On:</span> <span>${onList.join(', ')}</span></div>
                        ${seg.playerNamesOff && seg.playerNamesOff.length > 0 ? `<div><span style="font-weight: 600; color: var(--text-muted);">Off:</span> <span style="color: var(--text-muted);">${seg.playerNamesOff.join(', ')}</span></div>` : ''}
                    </div>
                `;
                }).join('')}
            </div>
        `
        : '';
    
    return `
        <div class="attendance-section">
            <h3 class="attendance-section-title">Match Attendance</h3>
            <div class="attendance-summary" style="text-align: center; margin-bottom: 15px; font-size: 16px; color: var(--text-secondary);">
                <span style="font-size: 24px; font-weight: bold; color: var(--accent-primary);">${attendance.length}</span> of ${activePlayers.length} players attending
            </div>
            ${equalTimeLabel ? `
            <div class="equal-time-formula" style="text-align: center; margin-bottom: 12px; padding: 10px 12px; background: var(--bg-section); border-radius: 8px; border: 1px solid var(--border-color); font-size: 13px; color: var(--text-secondary);">
                ${equalTimeLabel}
            </div>
            ` : ''}
            ${rotationHtml}
            <div class="attendance-header">
                <span class="attendance-header-label">✓</span>
                <span class="attendance-header-player">Player</span>
                <span class="attendance-header-gk" title="Goalkeeper (full game)">GK</span>
                <span class="attendance-header-captain">Captain</span>
            </div>
            <div class="attendance-checklist" id="attendance-list-${session.id}">
                ${activePlayers.map(p => {
                    const isAttending = attendance.includes(p.player);
                    const isGK = goalkeeper === p.player;
                    const suggestedMin = isGK ? timeSuggestions.gkMinutes : (isAttending && timeSuggestions.hasGK ? timeSuggestions.outfieldMinutes : null);
                    return `
                    <div class="attendance-item">
                        <input type="checkbox" 
                               class="attendance-checkbox" 
                               data-session="${session.id}" 
                               data-player="${p.player}"
                               ${isAttending ? 'checked' : ''}
                               onclick="event.stopPropagation(); handleAttendanceChange(${session.id}, '${p.player}', this.checked)">
                        <span class="attendance-player-name">${p.player}</span>
                        <input type="checkbox" 
                               class="goalkeeper-checkbox" 
                               data-session="${session.id}" 
                               data-player="${p.player}"
                               ${isGK ? 'checked' : ''}
                               ${!isAttending ? 'disabled' : ''}
                               onclick="event.stopPropagation(); handleGoalkeeperCheckbox(${session.id}, '${p.player}', this.checked)"
                               title="Goalkeeper (plays full game)">
                        <input type="checkbox" 
                               class="captain-checkbox" 
                               data-session="${session.id}" 
                               data-player="${p.player}"
                               ${captain === p.player ? 'checked' : ''}
                               ${!isAttending ? 'disabled' : ''}
                               onclick="event.stopPropagation(); handleCaptainCheckbox(${session.id}, '${p.player}', this.checked)"
                               title="Captain">
                        ${suggestedMin !== null ? `<span class="attendance-suggested-min" style="font-size: 12px; color: var(--text-muted); margin-left: 6px;">${suggestedMin} min</span>` : ''}
                    </div>
                `;
                }).join('')}
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
    if (target.closest('input, button, select, .attendance-checkbox, .goalkeeper-checkbox, .captain-checkbox, .goal-btn, .captain-selector')) {
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
        // Enable captain and goalkeeper checkboxes
        const captainCheckbox = document.querySelector(`.captain-checkbox[data-session="${sessionId}"][data-player="${playerName}"]`);
        if (captainCheckbox) captainCheckbox.disabled = false;
        const goalkeeperCheckbox = document.querySelector(`.goalkeeper-checkbox[data-session="${sessionId}"][data-player="${playerName}"]`);
        if (goalkeeperCheckbox) goalkeeperCheckbox.disabled = false;
    } else {
        session.attendance = session.attendance.filter(p => p !== playerName);
        // If unchecked player was captain, clear captain
        if (session.captain === playerName) {
            session.captain = '';
        }
        // If unchecked player was goalkeeper, clear goalkeeper
        if (session.goalkeeper === playerName) {
            session.goalkeeper = '';
        }
        // Disable and uncheck captain and goalkeeper checkboxes
        const captainCheckbox = document.querySelector(`.captain-checkbox[data-session="${sessionId}"][data-player="${playerName}"]`);
        if (captainCheckbox) {
            captainCheckbox.checked = false;
            captainCheckbox.disabled = true;
        }
        const goalkeeperCheckbox = document.querySelector(`.goalkeeper-checkbox[data-session="${sessionId}"][data-player="${playerName}"]`);
        if (goalkeeperCheckbox) {
            goalkeeperCheckbox.checked = false;
            goalkeeperCheckbox.disabled = true;
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

// Handle goalkeeper checkbox change
window.handleGoalkeeperCheckbox = function(sessionId, playerName, isChecked) {
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (!session) return;
    
    if (isChecked) {
        session.goalkeeper = playerName;
        document.querySelectorAll(`.goalkeeper-checkbox[data-session="${sessionId}"]`).forEach(cb => {
            if (cb.dataset.player !== playerName) cb.checked = false;
        });
    } else {
        if (session.goalkeeper === playerName) session.goalkeeper = '';
    }
    saveMatchData(sessionId);
    // Re-render back to update suggested minutes
    const card = document.querySelector(`.session-card[data-session="${sessionId}"]`);
    if (card && card.classList.contains('flipped')) {
        const backContentDiv = card.querySelector('.session-card-back-content');
        if (backContentDiv) backContentDiv.innerHTML = generateMatchBackContent(session);
    }
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
window.updateCaptainSelector = function(sessionId) {
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
        
        // Track clean sheet (opponent scored 0)
        session.cleanSheet = (opponent === 0);
    } else {
        session.result = '';
        session.cleanSheet = false;
    }
    
    saveData();
};

// Get clean sheets for a player (they must have attended)
window.getPlayerCleanSheets = function(playerName) {
    let cleanSheetCount = 0;
    let totalMatches = 0;
    
    sessions.forEach(session => {
        if (session.type === 'match' && !session.deleted && session.attendance) {
            // Only count if player attended and score was recorded
            if (session.attendance.includes(playerName) && 
                session.teamScore !== undefined && session.teamScore !== '' &&
                session.opponentScore !== undefined && session.opponentScore !== '') {
                totalMatches++;
                if (session.cleanSheet || parseInt(session.opponentScore) === 0) {
                    cleanSheetCount++;
                }
            }
        }
    });
    
    return {
        cleanSheets: cleanSheetCount,
        totalMatches: totalMatches,
        percentage: totalMatches > 0 ? Math.round((cleanSheetCount / totalMatches) * 100) : 0
    };
};

// Update goal scorers display based on attendance
window.updateGoalScorersDisplay = function(sessionId) {
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
