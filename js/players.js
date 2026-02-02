// ============================================
// PLAYER MANAGEMENT AND RENDERING
// ============================================

// Get player goals from localStorage
function getPlayerGoals(playerName) {
    const goalsKey = `goals_${playerName}`;
    const stored = localStorage.getItem(goalsKey);
    return stored ? JSON.parse(stored) : {}; // Changed to object: { date: count }
}

// Save player goals to localStorage
function savePlayerGoals(playerName, goals) {
    const goalsKey = `goals_${playerName}`;
    localStorage.setItem(goalsKey, JSON.stringify(goals));
    
    // Save to Firebase
    saveGoalsToFirebase(playerName, goals);
}

// Get player notes from localStorage
function getPlayerNotes(playerName) {
    const notesKey = `notes_${playerName}`;
    const stored = localStorage.getItem(notesKey);
    return stored || '';
}

// Save player notes to localStorage
function savePlayerNotes(playerName, notes) {
    const notesKey = `notes_${playerName}`;
    localStorage.setItem(notesKey, notes);
    
    // Save to Firebase
    saveNotesToFirebase(playerName, notes);
}

// Get total goals
function getTotalGoals(goals) {
    return Object.values(goals).reduce((sum, count) => sum + (parseInt(count) || 0), 0);
}

// Get goals per game
function getGoalsPerGame(goals) {
    const uniqueDates = Object.keys(goals).length;
    if (uniqueDates === 0) return 0;
    const totalGoals = getTotalGoals(goals);
    return (totalGoals / uniqueDates).toFixed(2);
}

// Get recent goals
function getRecentGoals(goals, count = 3) {
    const goalEntries = Object.entries(goals)
        .sort((a, b) => new Date(b[0]) - new Date(a[0]))
        .slice(0, count);
    return goalEntries.map(([date, goalCount]) => ({
        date,
        count: parseInt(goalCount) || 0
    }));
}

// Get goals this month
function getGoalsThisMonth(goals) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return Object.entries(goals).reduce((sum, [date, count]) => {
        const goalDate = new Date(date);
        if (goalDate.getMonth() === currentMonth && goalDate.getFullYear() === currentYear) {
            return sum + (parseInt(count) || 0);
        }
        return sum;
    }, 0);
}

// Get goals by month
function getGoalsByMonth(goals) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthlyGoals = {};
    
    // Initialize all months from February (1) to October (9) with 0 goals
    for (let month = 1; month <= 9; month++) {
        const monthKey = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
        const monthDate = new Date(currentYear, month, 1);
        const monthLabel = monthDate.toLocaleDateString('en-IE', { month: 'short', year: 'numeric' });
        
        monthlyGoals[monthKey] = {
            label: monthLabel,
            count: 0
        };
    }
    
    // Add actual goal data for months in the range (February to October)
    Object.entries(goals).forEach(([date, count]) => {
        const goalDate = new Date(date);
        const goalMonth = goalDate.getMonth(); // 0-indexed (0 = Jan, 1 = Feb, ..., 9 = Oct)
        const goalYear = goalDate.getFullYear();
        
        // Only include goals from February (month 1) to October (month 9) in the current year
        if (goalYear === currentYear && goalMonth >= 1 && goalMonth <= 9) {
            const monthKey = `${goalYear}-${String(goalMonth + 1).padStart(2, '0')}`;
            if (monthlyGoals[monthKey]) {
                monthlyGoals[monthKey].count += parseInt(count) || 0;
            }
        }
    });
    
    // Return all months from February to October, sorted by date
    return Object.entries(monthlyGoals)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, data]) => data);
}

// Add goals for a player
function addGoals(playerName, date, count) {
    const goals = getPlayerGoals(playerName);
    const currentCount = goals[date] || 0;
    goals[date] = currentCount + parseInt(count);
    savePlayerGoals(playerName, goals);
    return goals;
}

// Set goals for a player (replace existing)
function setGoals(playerName, date, count) {
    const goals = getPlayerGoals(playerName);
    goals[date] = parseInt(count);
    savePlayerGoals(playerName, goals);
    return goals;
}

// Delete goal for a player
function deleteGoal(playerName, date) {
    const goals = getPlayerGoals(playerName);
    delete goals[date];
    savePlayerGoals(playerName, goals);
    return goals;
}

// Format goal date
function formatGoalDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IE', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Render goals chart for a player
function renderGoalsChart(goals) {
    const monthlyData = getGoalsByMonth(goals);
    
    if (monthlyData.length === 0) {
        return '';
    }
    
    const maxGoals = Math.max(...monthlyData.map(m => m.count), 1);
    const chartWidth = 100;
    const chartHeight = 90;
    const padding = 8;
    const barWidth = 2;
    const topPadding = 15; // Space for goal count text above bars
    const bottomPadding = 35; // Space for rotated month labels
    const maxBarHeight = chartHeight - topPadding - bottomPadding;
    
    let svg = `<div class="goals-chart">
        <div class="goals-chart-title">Goals by Month</div>
        <div class="goals-chart-container">
            <svg class="goals-chart-svg" viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="none">
    `;
    
    monthlyData.forEach((month, index) => {
        const barHeight = maxGoals > 0 ? (month.count / maxGoals) * maxBarHeight : 0;
        const x = padding + index * (barWidth + padding);
        const barY = chartHeight - bottomPadding - barHeight;
        const monthName = month.label.split(' ')[0];
        const labelX = x + barWidth / 2;
        const labelY = chartHeight - 10;
        
        svg += `
            <g>
                <!-- Single color bar -->
                <rect class="goals-chart-bar" 
                      x="${x}" 
                      y="${barY}" 
                      width="${barWidth}" 
                      height="${barHeight}"
                      rx="1">
                    <title>${month.label}: ${month.count} ${month.count === 1 ? 'goal' : 'goals'}</title>
                </rect>
                ${month.count > 0 ? `
                    <text class="goals-chart-value" 
                          x="${x + barWidth / 2}" 
                          y="${barY - 6}">${month.count}</text>
                ` : ''}
                <!-- Rotated month label (90 degrees) - positioned under each bar -->
                <g transform="translate(${labelX}, ${labelY}) rotate(-90)">
                    <text class="goals-chart-label-rotated" 
                          x="0" 
                          y="0"
                          text-anchor="middle"
                          dominant-baseline="central"
                          style="letter-spacing: 6px;">${monthName}</text>
                </g>
            </g>
        `;
    });
    
    svg += `
            </svg>
        </div>
    </div>`;
    
    return svg;
}

// Render players
window.renderPlayers = function() {
    const container = document.getElementById('players-container');
    
    // Show message if no players loaded
    if (players.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <p style="font-size: 16px; margin-bottom: 12px;">No players found</p>
                <p style="font-size: 14px; color: var(--text-muted);">Click "Add Player" to create a new player.</p>
            </div>
        `;
        return;
    }
    
    // Filter: exclude players where returning = "No" (case-insensitive), exclude invalid entries, and filter by deleted status
    // Always include new players (_isNew)
    let filteredPlayers = players.filter(p => {
        // Always show new players
        if (p._isNew) {
            return true;
        }
        
        const returning = (p.returning || '').toString().toLowerCase().trim();
        const playerName = (p.player || '').toString().toLowerCase();
        return p.player && 
               p.player !== '?' && 
               !playerName.includes('child') &&
               returning !== 'no';
    });
    
    // Filter by deleted status (but always show new players)
    if (!showDeletedPlayers) {
        filteredPlayers = filteredPlayers.filter(p => !p.deleted || p._isNew);
    }
    
    container.innerHTML = filteredPlayers.map((p, index) => {
        const playerName = p.player || '';
        const goals = getPlayerGoals(playerName);
        const isDeleted = p.deleted || false;
        const isNew = p._isNew || false;
        const tempId = p._tempId || '';
        
        // If it's a new player, show an editable card
        if (isNew) {
        return `
            <div class="player-card-wrapper">
                    <div class="player-card new-player-card" data-temp-id="${tempId}" data-index="${index}">
                        <div class="player-card-front">
                            <div class="player-name">
                                <input type="text" class="player-name-input" placeholder="Player Name" value="${playerName}" />
                            </div>
                            <div class="player-details">
                                <div class="player-detail-item">
                                    <span class="player-detail-label">Jersey #</span>
                                    <input type="text" class="player-jersey-input" placeholder="Jersey Number" value="${p.jersey || ''}" />
                                </div>
                                <div class="player-detail-item">
                                    <span class="player-detail-label">Parent</span>
                                    <input type="text" class="player-parent-input" placeholder="Parent Name" value="${p.parent || ''}" />
                                </div>
                            </div>
                            <div class="new-player-actions">
                                <button class="save-player-btn" onclick="handleSavePlayer('${tempId}')">Save</button>
                                <button class="cancel-player-btn" onclick="handleCancelNewPlayer('${tempId}')">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="player-card-wrapper">
                <div class="player-card ${isDeleted ? 'deleted' : ''}" data-player="${playerName}" data-index="${index}">
                    ${isDeleted ? '<div class="deleted-indicator">Deleted</div>' : ''}
                    <div class="player-card-front">
                        <div class="player-name">
                            <span class="clickable-player-name" onclick="event.stopPropagation(); navigateToPlayerProfile('${playerName.replace(/'/g, "\\'")}')" title="View full profile">${playerName}</span>
                            <div class="player-name-actions">
                            ${editMode ? `<input type="text" class="player-jersey-input-edit" value="${p.jersey || ''}" data-player="${playerName}" data-field="jersey" placeholder="Jersey #" onclick="event.stopPropagation()">` : (p.jersey ? `<span class="jersey-number"><span class="jersey-icon">👕</span>${p.jersey}</span>` : '')}
                                <button class="delete-player-btn" onclick="handleDeletePlayer('${playerName}')" title="Delete player">🗑️</button>
                            </div>
                        </div>
                        <div class="player-details">
                            ${editMode ? `
                                <div class="player-detail-item">
                                    <span class="player-detail-label">Parent</span>
                                    <input type="text" class="player-parent-input-edit" value="${p.parent || ''}" data-player="${playerName}" data-field="parent" placeholder="Parent Name" onclick="event.stopPropagation()">
                                </div>
                            ` : (p.parent ? `
                                <div class="player-detail-item">
                                    <span class="player-detail-label">Parent</span>
                                    <span class="player-detail-value">${p.parent}</span>
                                </div>
                            ` : '')}
                            <div class="player-detail-item">
                                <span class="player-detail-label">Year</span>
                                <span class="player-detail-value">${p.year || ''}</span>
                            </div>
                            ${Object.keys(goals).length > 0 ? `
                                <div class="player-detail-item" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                                    <span class="player-detail-label">Total Goals</span>
                                    <span class="player-detail-value" style="color: var(--accent-primary); font-weight: 600;">${getTotalGoals(goals)}</span>
                                </div>
                            ` : ''}
                            ${Object.keys(goals).length > 0 ? `
                                <div class="player-statistics" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                                    <div class="stat-item">
                                        <span class="stat-label">Goals/Game</span>
                                        <span class="stat-value">${getGoalsPerGame(goals)}</span>
                                    </div>
                                    ${getGoalsThisMonth(goals) > 0 ? `
                                        <div class="stat-item">
                                            <span class="stat-label">This Month</span>
                                            <span class="stat-value">${getGoalsThisMonth(goals)}</span>
                                        </div>
                                    ` : ''}
                                    ${getRecentGoals(goals, 3).length > 0 ? `
                                        <div class="recent-goals">
                                            <span class="stat-label">Recent:</span>
                                            <div class="recent-goals-list">
                                                ${getRecentGoals(goals, 3).map(recent => `
                                                    <span class="recent-goal-item">${formatGoalDate(recent.date)} (${recent.count})</span>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                                ${renderGoalsChart(goals)}
                            ` : ''}
                        </div>
                    </div>
                    <div class="player-card-back">
                        <div class="notes-section">
                            <div class="notes-label">Notes - ${playerName}</div>
                            <textarea class="notes-textarea" id="notes-${index}" placeholder="Add notes about this player...">${getPlayerNotes(playerName)}</textarea>
                            <button class="save-notes-btn" onclick="handleSaveNotes('${playerName}', ${index})">Save Notes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add click handlers for card flipping
    container.querySelectorAll('.player-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't flip if clicking on input, button, textarea, or any element within them
            // Check the entire event path to catch nested elements
            const path = e.composedPath ? e.composedPath() : (e.path || []);
            const clickedElement = e.target;
            
            const cardBack = this.querySelector('.player-card-back');
            const cardFront = this.querySelector('.player-card-front');
            const isCardFlipped = this.classList.contains('flipped');
            const isClickingOnBack = cardBack && (cardBack === clickedElement || cardBack.contains(clickedElement));
            const isClickingOnFront = cardFront && (cardFront === clickedElement || cardFront.contains(clickedElement));
            
            // If card is flipped:
            // - Allow flip back when clicking on the front side
            // - Allow flip back when clicking on empty space on the back (not on interactive elements)
            // - Don't flip back when clicking on interactive elements on the back
            if (isCardFlipped) {
                if (isClickingOnFront) {
                    // Clicking on front when flipped - allow flip back, continue with normal flip logic
                    // Don't return here, let it proceed to flip
                } else if (isClickingOnBack) {
                    // Check if clicking on interactive elements - if so, don't flip
                    const isClickingOnInteractive = clickedElement.closest('input, button, textarea') !== null;
                    if (isClickingOnInteractive) {
                        e.stopPropagation();
                        return;
                    }
                    // Clicking on empty space on the back - allow flip back
                    // Continue with normal flip logic
                }
            }
            
            // Early check for buttons - let onclick handlers work
            if (clickedElement.tagName === 'BUTTON' || clickedElement.closest('button') !== null) {
                // Don't stop propagation here - let the onclick handler fire
                // Just return early to prevent card flip
                return;
            }
            
            // Check if any element in the path is an input, button, textarea
            const isInteractiveElement = path.some(el => {
                if (!el || !el.tagName) return false;
                const tag = el.tagName.toUpperCase();
                return tag === 'INPUT' || 
                       tag === 'BUTTON' || 
                       tag === 'TEXTAREA';
            }) || clickedElement.tagName === 'INPUT' || 
                clickedElement.tagName === 'BUTTON' || 
                clickedElement.tagName === 'TEXTAREA' ||
                clickedElement.closest('input, button, textarea') !== null;
            
            if (isInteractiveElement) {
                e.stopPropagation();
                // Only prevent default for inputs, not buttons (buttons need their onclick to work)
                if (clickedElement.tagName !== 'BUTTON') {
                    e.preventDefault();
                }
                return;
            }
            
            const wrapper = this.closest('.player-card-wrapper');
            const isFlipping = !this.classList.contains('flipped');
            
            // Flip back any other flipped cards
            if (isFlipping) {
                container.querySelectorAll('.player-card.flipped').forEach(flippedCard => {
                    if (flippedCard !== this) {
                        flippedCard.classList.remove('flipped');
                        const flippedWrapper = flippedCard.closest('.player-card-wrapper');
                        if (flippedWrapper) {
                            flippedWrapper.style.height = 'auto';
                            flippedWrapper.style.overflow = 'visible';
                        }
                    }
                });
            }
            
            if (isFlipping) {
                // Measure the back content height before flipping
                const back = this.querySelector('.player-card-back');
                const front = this.querySelector('.player-card-front');
                const frontHeight = front.offsetHeight;
                
                // Temporarily make back visible and positioned to measure
                const originalStyles = {
                    transform: back.style.transform,
                    position: back.style.position,
                    visibility: back.style.visibility,
                    opacity: back.style.opacity,
                    zIndex: back.style.zIndex
                };
                
                back.style.transform = 'scale(1)';
                back.style.position = 'relative';
                back.style.visibility = 'visible';
                back.style.opacity = '1';
                back.style.zIndex = '2';
                
                // Force reflow
                void back.offsetHeight;
                
                const backHeight = back.offsetHeight;
                
                // Restore original styles
                Object.keys(originalStyles).forEach(key => {
                    back.style[key] = originalStyles[key] || '';
                });
                
                // Set wrapper height to the larger of the two, with some padding
                const targetHeight = Math.max(frontHeight, backHeight);
                wrapper.style.height = targetHeight + 'px';
                wrapper.style.overflow = 'visible';
            } else {
                // Reset to auto height when flipping back
                wrapper.style.height = 'auto';
                wrapper.style.overflow = 'visible';
            }
            
            this.classList.toggle('flipped');
            
            // Set default date when card is flipped to show back
            if (this.classList.contains('flipped')) {
                const dateInput = this.querySelector('.goal-date-input');
                if (dateInput && !dateInput.value) {
                    const today = new Date();
                    dateInput.value = today.toISOString().split('T')[0];
                }
            }
        });
    });

    // Add event listeners for editing player info fields
    container.querySelectorAll('.player-name-input, .player-jersey-input-edit, .player-parent-input-edit').forEach(input => {
        input.addEventListener('change', e => {
            const playerName = e.target.dataset.player;
            const field = e.target.dataset.field;
            const player = players.find(p => p.player === playerName);
            if (player && field) {
                player[field] = e.target.value.trim();
                savePlayersList(); // Save changes immediately
            }
        });
    });
    
    // Set default date to today for all date inputs and prevent card flip on click
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    container.querySelectorAll('.notes-textarea').forEach(input => {
        // Prevent card flip when clicking on interactive elements
        // Use capture phase to stop propagation early
        input.addEventListener('click', function(e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, true);
        input.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, true);
        input.addEventListener('focus', function(e) {
            e.stopPropagation();
        }, true);
        input.addEventListener('focusin', function(e) {
            e.stopPropagation();
        }, true);
    });
    
    // Don't add event listeners to buttons - let onclick handlers work normally
    // The card's click handler will check for buttons and not flip
}

// Handle save notes
window.handleSaveNotes = function(playerName, index) {
    const notesTextarea = document.getElementById(`notes-${index}`);
    const notes = notesTextarea.value.trim();
    savePlayerNotes(playerName, notes);
    
    // Show feedback
    const saveBtn = notesTextarea.nextElementSibling;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saved!';
    saveBtn.style.backgroundColor = 'var(--accent-secondary)';
    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.backgroundColor = '';
    }, 1500);
}

// Add player handler (first definition)
window.handleAddPlayer = function() {
    // Create a temporary new player with a unique ID
    const tempId = 'new-' + Date.now();
    const newPlayer = {
        player: '',
        jersey: '',
        parent: '',
        year: '',
        returning: 'Yes',
        deleted: false,
        _tempId: tempId,
        _isNew: true
    };
    
    // Add to players array
    players.push(newPlayer);
    
    // Re-render to show the empty card
    renderPlayers();
    
    // Scroll to the new player card
    setTimeout(() => {
        const newPlayerCard = document.querySelector(`.player-card[data-temp-id="${tempId}"]`);
        if (newPlayerCard) {
            newPlayerCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Focus on the name input
            const nameInput = newPlayerCard.querySelector('.player-name-input');
            if (nameInput) {
                nameInput.focus();
            }
        }
    }, 100);
};

// Delete player handler
window.handleDeletePlayer = async function(playerName) {
    if (!confirm(`Are you sure you want to delete ${playerName}? They will be hidden but can be restored by showing deleted players.`)) {
        return;
    }
    
    const player = players.find(p => p.player === playerName);
    if (player) {
        player.deleted = true;
        await savePlayersList();
        renderPlayers();
    }
};

// Cleanup deleted players
window.cleanupDeletedPlayers = async function() {
    const deletedPlayers = players.filter(p => p.deleted);
    const deletedCount = deletedPlayers.length;
    
    if (deletedCount === 0) {
        alert('No deleted players to clean up.');
        return;
    }
    
    if (!confirm(`Are you sure you want to permanently delete ${deletedCount} player(s)? This action cannot be undone.`)) {
        return;
    }
    
    // Get names of deleted players before removing them
    const deletedPlayerNames = deletedPlayers.map(p => p.player);
    
    // Remove deleted players from the array
    const originalLength = players.length;
    players = players.filter(p => !p.deleted);
    
    // Also remove their data from Firebase players node
    if (database) {
        try {
            // Remove player data from Firebase
            const playersRef = database.ref('players');
            for (const playerName of deletedPlayerNames) {
                await playersRef.child(encodeURIComponent(playerName)).remove();
            }
        } catch (e) {
            console.error('Failed to remove player data from Firebase:', e);
        }
    }
    
    // Save updated players list
    await savePlayersList();
    
    // Re-render
    renderPlayers();
    
    alert(`Successfully removed ${originalLength - players.length} deleted player(s).`);
};

// Save player handler
window.handleSavePlayer = async function(tempId) {
    const playerCard = document.querySelector(`.player-card[data-temp-id="${tempId}"]`);
    if (!playerCard) return;
    
    const nameInput = playerCard.querySelector('.player-name-input');
    const jerseyInput = playerCard.querySelector('.player-jersey-input');
    const parentInput = playerCard.querySelector('.player-parent-input');
    
    const playerName = nameInput ? nameInput.value.trim() : '';
    const jersey = jerseyInput ? jerseyInput.value.trim() : '';
    const parent = parentInput ? parentInput.value.trim() : '';
    
    if (!playerName) {
        alert('Please enter a player name.');
        if (nameInput) nameInput.focus();
        return;
    }
    
    // Check if player already exists (excluding the current temp player)
    const existingPlayer = players.find(p => p.player === playerName && !p._isNew);
    if (existingPlayer) {
        alert('A player with this name already exists.');
        if (nameInput) nameInput.focus();
        return;
    }
    
    // Find and update the player
    const playerIndex = players.findIndex(p => p._tempId === tempId);
    if (playerIndex !== -1) {
        const player = players[playerIndex];
        player.player = playerName;
        player.jersey = jersey;
        player.parent = parent;
        delete player._tempId;
        delete player._isNew;
    }
    
    // Save to Firebase
    await savePlayersList();
    
    // Re-render
    renderPlayers();
};

// Cancel new player handler
window.handleCancelNewPlayer = async function(tempId) {
    // Remove the temporary player from the array
    const playerIndex = players.findIndex(p => p._tempId === tempId);
    if (playerIndex !== -1) {
        players.splice(playerIndex, 1);
    }
    
    // Re-render
    renderPlayers();
};
