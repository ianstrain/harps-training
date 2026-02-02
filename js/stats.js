// ============================================
// STATISTICS AND CHARTS
// ============================================

// Sort state for charts
let goalsSortBy = 'goals-desc'; // Default: sort by goals descending
let matchAttendanceSortBy = 'attended-desc'; // Default: sort by attended descending
let trainingAttendanceSortBy = 'attended-desc'; // Default: sort by attended descending

// Sorting functions
function sortPlayerData(data, sortBy, valueKey = 'total') {
    const sorted = [...data];
    switch(sortBy) {
        case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name));
        case 'goals-asc':
        case 'attended-asc':
            return sorted.sort((a, b) => a[valueKey] - b[valueKey]);
        case 'goals-desc':
        case 'attended-desc':
        default:
            return sorted.sort((a, b) => b[valueKey] - a[valueKey]);
    }
}

// Generate sort controls HTML
function generateSortControls(chartId, currentSort, isAttendance = false) {
    const sortOptions = isAttendance ? [
        { value: 'attended-desc', label: 'Attendance (High to Low)' },
        { value: 'attended-asc', label: 'Attendance (Low to High)' },
        { value: 'name-asc', label: 'Name (A-Z)' },
        { value: 'name-desc', label: 'Name (Z-A)' }
    ] : [
        { value: 'goals-desc', label: 'Goals (High to Low)' },
        { value: 'goals-asc', label: 'Goals (Low to High)' },
        { value: 'name-asc', label: 'Name (A-Z)' },
        { value: 'name-desc', label: 'Name (Z-A)' }
    ];
    
    return `
        <div class="chart-sort-controls" style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px;">
            <label style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">Sort by:</label>
            <select id="${chartId}-sort" onchange="handleChartSort('${chartId}', this.value)" 
                    style="padding: 6px 12px; background: var(--bg-section); border: 1px solid var(--border-color); 
                           border-radius: 6px; color: var(--text-primary); font-size: 12px; cursor: pointer;
                           font-family: 'Inter', sans-serif;">
                ${sortOptions.map(opt => `
                    <option value="${opt.value}" ${currentSort === opt.value ? 'selected' : ''}>${opt.label}</option>
                `).join('')}
            </select>
        </div>
    `;
}

// Handle chart sort change
window.handleChartSort = function(chartId, sortValue) {
    switch(chartId) {
        case 'goals':
            goalsSortBy = sortValue;
            break;
        case 'match-attendance':
            matchAttendanceSortBy = sortValue;
            break;
        case 'training-attendance':
            trainingAttendanceSortBy = sortValue;
            break;
    }
    renderStats();
};

// Render statistics
function renderStats() {
    const container = document.getElementById('stats-container');
    
    if (players.length === 0) {
        container.innerHTML = `
            <div class="stats-empty">
                <p>No players found</p>
                <small>Run <code style="background: var(--bg-section); padding: 4px 8px; border-radius: 4px;">migratePlayersToFirebase()</code> in the browser console to migrate players to Firebase.</small>
            </div>
        `;
        return;
    }
    
    // Filter players (same logic as renderPlayers)
    const filteredPlayers = players.filter(p => {
        const returning = (p.returning || '').toString().toLowerCase().trim();
        const playerName = (p.player || '').toString().toLowerCase();
        return p.player && 
               p.player !== '?' && 
               !playerName.includes('child') &&
               returning !== 'no';
    });
    
    // Get goals for each player and calculate totals
    const playerGoals = filteredPlayers.map(p => {
        const playerName = p.player || '';
        const goals = getPlayerGoals(playerName);
        const total = getTotalGoals(goals);
        return {
            name: playerName,
            total: total,
            goals: goals
        };
    });
    
    // Filter out players with 0 goals and apply sorting
    const playersWithGoals = sortPlayerData(
        playerGoals.filter(p => p.total > 0),
        goalsSortBy,
        'total'
    );
    
    // Find the longest player name to calculate proper spacing for goals chart
    const longestNameGoals = playersWithGoals.reduce((longest, player) => 
        player.name.length > longest.length ? player.name : longest, '');
    const longestNameLengthGoals = longestNameGoals.length;
    const fontSize = 28; // Current font size for player labels
    const nameSpaceNeededGoals = (fontSize * longestNameLengthGoals * 0.6) + 20;

    if (playersWithGoals.length === 0) {
        container.innerHTML = `
            <div class="stats-empty">
                <p>No goals recorded yet</p>
                <small>Goals will appear here once players start scoring.</small>
            </div>
        `;
        // If no goals, still render other charts
        const seasonStats = generateSeasonStats();
        const attendanceChart = generateAttendanceChart(filteredPlayers);
        const trainingAttendanceChart = generateTrainingAttendanceChart(filteredPlayers);
        const captainHistory = generateCaptainHistoryChart();
        container.innerHTML = seasonStats + attendanceChart + trainingAttendanceChart + captainHistory;
        return;
    }
    
    // Chart dimensions for goals
    const chartWidth = 800;
    const chartHeight = 600; // Increased overall height for longer bars
    const paddingGoals = { 
        top: 40, 
        right: 40, 
        bottom: Math.max(200, nameSpaceNeededGoals + 10), // Dynamic bottom padding based on longest name, minimal buffer
        left: 80 // Increased left padding to prevent Goals text from being cut off
    };
    const barWidth = (chartWidth - paddingGoals.left - paddingGoals.right) / playersWithGoals.length - 10;
    const maxGoals = Math.max(...playersWithGoals.map(p => p.total), 1);
    const barHeight = chartHeight - paddingGoals.top - paddingGoals.bottom;
    
    let goalsSvg = `
        <div class="stats-chart-container">
            <div class="stats-chart-title">Goals Scored by Player</div>
            ${generateSortControls('goals', goalsSortBy, false)}
            <div class="stats-chart-svg-container">
                <svg viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="xMidYMid meet">
                    <!-- Y-axis label -->
                    <text class="stats-chart-axis-label" 
                          x="20" 
                          y="${(paddingGoals.top + (barHeight / 2) )}" 
                          transform="rotate(-90, 20, ${paddingGoals.top + (barHeight / 2)})"
                          text-anchor="middle"
                          dominant-baseline="middle">Goals</text>
                    
                    <!-- X-axis label -->
                    <text class="stats-chart-axis-label" 
                          x="${chartWidth / 2}" 
                          y="${(chartHeight - paddingGoals.bottom + 5) + 30}" 
                          text-anchor="middle">Players</text>
                    
                    <!-- Y-axis grid lines and labels -->
                    ${Array.from({ length: 6 }, (_, i) => {
                        const value = Math.ceil(maxGoals / 5) * i;
                        const y = chartHeight - paddingGoals.bottom - (value / maxGoals) * barHeight;
                        return `
                            <line x1="${paddingGoals.left}" 
                                  y1="${y}" 
                                  x2="${chartWidth - paddingGoals.right}" 
                                  y2="${y}" 
                                  stroke="var(--border-color)" 
                                  stroke-width="0.5" 
                                  opacity="0.3"/>
                            <text class="stats-chart-axis-label" 
                                  x="${paddingGoals.left - 10}" 
                                  y="${y + 4}" 
                                  text-anchor="end">${value}</text>
                        `;
                    }).join('')}
                    
                    <!-- Bars -->
                    ${playersWithGoals.map((player, index) => {
                        const barHeightValue = (player.total / maxGoals) * barHeight;
                        const x = paddingGoals.left + index * (barWidth + 10);
                        const y = chartHeight - paddingGoals.bottom - barHeightValue;
                        
                        // Truncate player name if too long
                        const displayName = player.name.length > 12 
                            ? player.name.substring(0, 10) + '...' 
                            : player.name;
                        
                        return `
                            <g>
                                <rect class="stats-chart-bar" 
                                      x="${x}" 
                                      y="${y}" 
                                      width="${barWidth}" 
                                      height="${barHeightValue}"
                                      rx="4">
                                    <title>${player.name}: ${player.total} ${player.total === 1 ? 'goal' : 'goals'}</title>
                                </rect>
                                <text class="stats-chart-goal-value" 
                                      x="${x + barWidth / 2}" 
                                      y="${y - 8}">${player.total}</text>
                                <text class="stats-chart-player-label" 
                                      x="${(x + barWidth / 2) - 40}" 
                                      y="${chartHeight - paddingGoals.bottom + (nameSpaceNeededGoals * 0.4)}"\
                                      transform="rotate(-90, ${x + barWidth / 2}, ${chartHeight - paddingGoals.bottom + (nameSpaceNeededGoals * 0.4)})"
                                      text-anchor="middle">${player.name}</text>
                            </g>
                        `;
                    }).join('')}
                </svg>
            </div>
        </div>
    `;
    
    // Generate attendance chart for matches and training
    const attendanceChart = generateAttendanceChart(filteredPlayers);
    const trainingAttendanceChart = generateTrainingAttendanceChart(filteredPlayers); 
    const captainHistory = generateCaptainHistoryChart();
    
    // Generate season stats
    const seasonStats = generateSeasonStats();
    
    container.innerHTML = seasonStats + attendanceChart + trainingAttendanceChart + captainHistory + goalsSvg;
}

// Generate season statistics
function generateSeasonStats() {
    // Calculate match statistics
    const matchSessions = sessions.filter(s => s.type === 'match' && !s.deleted);
    const completedMatches = matchSessions.filter(s => s.result);
    const wins = completedMatches.filter(s => s.result === 'win').length;
    const draws = completedMatches.filter(s => s.result === 'draw').length;
    const losses = completedMatches.filter(s => s.result === 'loss').length;
    const totalGoalsScored = completedMatches.reduce((sum, s) => sum + (parseInt(s.teamScore) || 0), 0);
    const totalGoalsConceded = completedMatches.reduce((sum, s) => sum + (parseInt(s.opponentScore) || 0), 0);
    const goalDiff = totalGoalsScored - totalGoalsConceded;

    return `
        <div class="season-stats-section" style="margin-bottom: 30px; padding: 20px; background: var(--bg-section); border-radius: 12px; border: 1px solid var(--border-color);">
            <h3 style="margin: 0 0 15px 0; color: var(--accent); font-size: 18px; text-align: center;">Season Match Statistics</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px;">
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: var(--accent);">
                        ${completedMatches.length}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Played</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: #00ff64;">
                        ${wins}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Wins</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: #ffc800;">
                        ${draws}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Draws</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: #ff3232;">
                        ${losses}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Losses</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: var(--accent);">
                        ${totalGoalsScored}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Goals For</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: var(--text-secondary);">
                        ${totalGoalsConceded}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Goals Against</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px; grid-column: span 1;">
                    <div style="font-size: 28px; font-weight: bold; color: ${goalDiff > 0 ? '#00ff64' : goalDiff < 0 ? '#ff3232' : 'var(--accent)'};">
                        ${goalDiff > 0 ? '+' : ''}${goalDiff}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Goal Diff</div>
                </div>
            </div>
            ${completedMatches.length > 0 ? `
                <div style="margin-top: 15px; text-align: center; font-size: 18px; font-weight: bold; color: var(--text-primary);">
                    Record: ${wins}W - ${draws}D - ${losses}L
                </div>
            ` : `
                <div style="margin-top: 15px; text-align: center; font-size: 14px; color: var(--text-secondary);">
                    No completed matches yet
                </div>
            `}
        </div>
    `;
}

// Generate attendance chart
function generateAttendanceChart(filteredPlayers) {
    // Get all matches
    const matches = sessions.filter(s => s.type === 'match' && !s.deleted);
    
    if (matches.length === 0) {
        return `
            <div class="stats-chart-container">
                <div class="stats-chart-title">Match Attendance</div>
                <div class="stats-empty" style="padding: 40px;">
                    <p>No matches recorded yet</p>
                    <small>Match attendance will appear here once matches are added.</small>
                </div>
            </div>
        `;
    }
    
    // Calculate attendance stats for each player
    const playerAttendance = filteredPlayers.map(p => {
        const playerName = p.player || '';
        let attended = 0;
        let captainCount = 0;
        
        matches.forEach(match => {
            if (match.attendance && match.attendance.includes(playerName)) {
                attended++;
            }
            if (match.captain === playerName) {
                captainCount++;
            }
        });
        
        return {
            name: playerName,
            attended: attended,
            captainCount: captainCount,
            percentage: matches.length > 0 ? (attended / matches.length * 100).toFixed(0) : 0
        };
    }).filter(p => p.attended > 0);
    
    // Apply sorting
    const sortedPlayerAttendance = sortPlayerData(playerAttendance, matchAttendanceSortBy, 'attended');
    
    if (sortedPlayerAttendance.length === 0) {
        return `
            <div class="stats-chart-container">
                <div class="stats-chart-title">Match Attendance</div>
                <div class="stats-empty" style="padding: 40px;">
                    <p>No attendance recorded yet</p>
                    <small>Mark attendance in match cards to see stats here.</small>
                </div>
            </div>
        `;
    }
    
    // Find the longest player name to calculate proper spacing (same as goals chart)
    const longestName = sortedPlayerAttendance.reduce((longest, player) => 
        player.name.length > longest.length ? player.name : longest, '');
    const longestNameLength = longestName.length;
    const fontSize = 28; // Same as goals chart
    const nameSpaceNeeded = (fontSize * longestNameLength * 0.6) + 20;
    
    // Chart dimensions - match goals chart exactly
    const chartWidth = 800;
    const chartHeight = 600;
    const padding = { 
        top: 40, 
        right: 40, 
        bottom: Math.max(200, nameSpaceNeeded + 10),
        left: 80
    };
    const barWidth = (chartWidth - padding.left - padding.right) / sortedPlayerAttendance.length - 10;
    const maxAttended = Math.max(...sortedPlayerAttendance.map(p => p.attended), 1);
    const barHeight = chartHeight - padding.top - padding.bottom;
    
    let svg = `
        <div class="stats-chart-container">
            <div class="stats-chart-title">Match Attendance (${matches.length} ${matches.length === 1 ? 'match' : 'matches'})</div>
            ${generateSortControls('match-attendance', matchAttendanceSortBy, true)}
            <div class="stats-chart-svg-container">
                <svg viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="xMidYMid meet">
                    <!-- Y-axis label -->
                    <text class="stats-chart-axis-label" 
                          x="20" 
                          y="${padding.top + (barHeight / 2)}" 
                          transform="rotate(-90, 20, ${padding.top + (barHeight / 2)})"
                          text-anchor="middle"
                          dominant-baseline="middle">Matches Attended</text>
                    
                    <!-- X-axis label -->
                    <text class="stats-chart-axis-label" 
                          x="${chartWidth / 2}" 
                          y="${(chartHeight - padding.bottom + 5) + 30}" 
                          text-anchor="middle">Players</text>
                    
                    <!-- Y-axis grid lines and labels -->
                    ${Array.from({ length: 6 }, (_, i) => {
                        const value = Math.ceil(maxAttended / 5) * i;
                        const y = chartHeight - padding.bottom - (value / maxAttended) * barHeight;
                        return `
                            <line x1="${padding.left}" 
                                  y1="${y}" 
                                  x2="${chartWidth - padding.right}" 
                                  y2="${y}" 
                                  stroke="var(--border-color)" 
                                  stroke-width="0.5" 
                                  opacity="0.3"/>
                            <text class="stats-chart-axis-label" 
                                  x="${padding.left - 10}" 
                                  y="${y + 4}" 
                                  text-anchor="end">${value}</text>
                        `;
                    }).join('')}
                    
                    <!-- Bars -->
                    ${sortedPlayerAttendance.map((player, index) => {
                        const barHeightValue = (player.attended / maxAttended) * barHeight;
                        const x = padding.left + index * (barWidth + 10);
                        const y = chartHeight - padding.bottom - barHeightValue;
                        
                        return `
                            <g>
                                <rect class="stats-chart-bar" 
                                      x="${x}" 
                                      y="${y}" 
                                      width="${barWidth}" 
                                      height="${barHeightValue}"
                                      rx="4">
                                    <title>${player.name}: ${player.attended}/${matches.length} matches (${player.percentage}%)</title>
                                </rect>
                                <text class="stats-chart-goal-value" 
                                      x="${x + barWidth / 2}" 
                                      y="${y - 8}">${player.attended}</text>
                                <text class="stats-chart-player-label" 
                                      x="${(x + barWidth / 2) - 40}" 
                                      y="${chartHeight - padding.bottom + (nameSpaceNeeded * 0.4)}"\
                                      transform="rotate(-90, ${x + barWidth / 2}, ${chartHeight - padding.bottom + (nameSpaceNeeded * 0.4)})"
                                      text-anchor="middle">${player.name}</text>
                            </g>
                        `;
                    }).join('')}
                </svg>
            </div>
        </div>
    `;
    
    return svg;
}

// Generate training attendance chart
function generateTrainingAttendanceChart(filteredPlayers) {
    const trainingSessions = sessions.filter(s => s.type === 'training' && !s.deleted);
    
    if (trainingSessions.length === 0) {
        return `
            <div class="stats-chart-container">
                <div class="stats-chart-title">Training Attendance</div>
                <div class="stats-empty" style="padding: 40px;">
                    <p>No training sessions recorded yet</p>
                    <small>Training attendance will appear here once training sessions are added.</small>
                </div>
            </div>
        `;
    }
    
    // Calculate attendance stats for each player for training sessions
    const playerTrainingAttendance = filteredPlayers.map(p => {
        const playerName = p.player || '';
        let attended = 0;
        
        trainingSessions.forEach(session => {
            if (session.attendance && session.attendance.includes(playerName)) {
                attended++;
            }
        });
        
        return {
            name: playerName,
            attended: attended,
            percentage: trainingSessions.length > 0 ? (attended / trainingSessions.length * 100).toFixed(0) : 0
        };
    }).filter(p => p.attended > 0);
    
    // Apply sorting
    const sortedTrainingAttendance = sortPlayerData(playerTrainingAttendance, trainingAttendanceSortBy, 'attended');
    
    if (sortedTrainingAttendance.length === 0) {
        return `
            <div class="stats-chart-container">
                <div class="stats-chart-title">Training Attendance</div>
                <div class="stats-empty" style="padding: 40px;">
                    <p>No attendance recorded yet</p>
                    <small>Mark attendance in training session cards to see stats here.</small>
                </div>
            </div>
        `;
    }
    
    // Find the longest player name to calculate proper spacing
    const longestName = sortedTrainingAttendance.reduce((longest, player) => 
        player.name.length > longest.length ? player.name : longest, '');
    const longestNameLength = longestName.length;
    const fontSize = 28; // Current font size for player labels
    const nameSpaceNeeded = (fontSize * longestNameLength * 0.6) + 20;

    // Chart dimensions
    const chartWidth = 800;
    const chartHeight = 600;
    const padding = { 
        top: 40, 
        right: 40, 
        bottom: Math.max(200, nameSpaceNeeded + 10), 
        left: 80
    };
    const barWidth = (chartWidth - padding.left - padding.right) / sortedTrainingAttendance.length - 10;
    const maxAttended = Math.max(...sortedTrainingAttendance.map(p => p.attended), 1);
    const barHeight = chartHeight - padding.top - padding.bottom;
    
    let svg = `
        <div class="stats-chart-container">
            <div class="stats-chart-title">Training Attendance (${trainingSessions.length} ${trainingSessions.length === 1 ? 'session' : 'sessions'})</div>
            ${generateSortControls('training-attendance', trainingAttendanceSortBy, true)}
            <div class="stats-chart-svg-container">
                <svg viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="xMidYMid meet">
                    <!-- Y-axis label -->
                    <text class="stats-chart-axis-label" 
                          x="20" 
                          y="${padding.top + (barHeight / 2)}" 
                          transform="rotate(-90, 20, ${padding.top + (barHeight / 2)})"
                          text-anchor="middle"
                          dominant-baseline="middle">Sessions Attended</text>
                    
                    <!-- X-axis label -->
                    <text class="stats-chart-axis-label" 
                          x="${chartWidth / 2}" 
                          y="${(chartHeight - padding.bottom + 5) + 30}" 
                          text-anchor="middle">Players</text>
                    
                    <!-- Y-axis grid lines and labels -->
                    ${Array.from({ length: 6 }, (_, i) => {
                        const value = Math.ceil(maxAttended / 5) * i;
                        const y = chartHeight - padding.bottom - (value / maxAttended) * barHeight;
                        return `
                            <line x1="${padding.left}" 
                                  y1="${y}" 
                                  x2="${chartWidth - padding.right}" 
                                  y2="${y}" 
                                  stroke="var(--border-color)" 
                                  stroke-width="0.5" 
                                  opacity="0.3"/>
                            <text class="stats-chart-axis-label" 
                                  x="${padding.left - 10}" 
                                  y="${y + 4}" 
                                  text-anchor="end">${value}</text>
                        `;
                    }).join('')}
                    
                    <!-- Bars -->
                    ${sortedTrainingAttendance.map((player, index) => {
                        const barHeightValue = (player.attended / maxAttended) * barHeight;
                        const x = padding.left + index * (barWidth + 10);
                        const y = chartHeight - padding.bottom - barHeightValue;
                        
                        return `
                            <g>
                                <rect class="stats-chart-bar" 
                                      x="${x}" 
                                      y="${y}" 
                                      width="${barWidth}" 
                                      height="${barHeightValue}"
                                      rx="4">
                                    <title>${player.name}: ${player.attended}/${trainingSessions.length} sessions (${player.percentage}%)</title>
                                </rect>
                                <text class="stats-chart-goal-value" 
                                      x="${x + barWidth / 2}" 
                                      y="${y - 8}">${player.attended}</text>
                                <text class="stats-chart-player-label" 
                                      x="${(x + barWidth / 2) - 40}" 
                                      y="${chartHeight - padding.bottom + (nameSpaceNeeded * 0.4)}"\
                                      transform="rotate(-90, ${x + barWidth / 2}, ${chartHeight - padding.bottom + (nameSpaceNeeded * 0.4)})"
                                      text-anchor="middle">${player.name}</text>
                            </g>
                        `;
                    }).join('')}
                </svg>
            </div>
        </div>
    `;
    
    return svg;
}

// Navigate to player profile
window.navigateToPlayerProfile = function(playerName) {
    // Store the current player name for the profile view
    window.currentProfilePlayer = playerName;
    switchToTab('player-profile');
};

// Render player profile page
function renderPlayerProfile() {
    const container = document.getElementById('player-profile-container');
    const playerName = window.currentProfilePlayer;
    
    if (!playerName) {
        container.innerHTML = `
            <div class="player-profile-no-data">
                <p>No player selected</p>
                <button onclick="switchToTab('players')" style="margin-top: 15px; padding: 10px 20px; background: var(--accent-primary); color: var(--bg-dark); border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    View All Players
                </button>
            </div>
        `;
        return;
    }
    
    // Find the player data
    const player = players.find(p => p.player === playerName);
    if (!player) {
        container.innerHTML = `
            <div class="player-profile-no-data">
                <p>Player not found</p>
                <button onclick="switchToTab('players')" style="margin-top: 15px; padding: 10px 20px; background: var(--accent-primary); color: var(--bg-dark); border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    View All Players
                </button>
            </div>
        `;
        return;
    }
    
    // Get player goals
    const goals = getPlayerGoals(playerName);
    const totalGoals = getTotalGoals(goals);
    
    // Get attendance data
    const allSessions = sessions.filter(s => !s.deleted);
    const matchSessions = allSessions.filter(s => s.type === 'match');
    const trainingSessions = allSessions.filter(s => s.type === 'training');
    
    // Calculate match attendance
    let matchesAttended = 0;
    let captainCount = 0;
    const matchAttendanceRecords = [];
    matchSessions.forEach(match => {
        if (match.attendance && match.attendance.includes(playerName)) {
            matchesAttended++;
            const wasCaptain = match.captain === playerName;
            if (wasCaptain) captainCount++;
            matchAttendanceRecords.push({
                date: match.date,
                opponent: match.opponent || 'Unknown',
                wasCaptain: wasCaptain,
                type: 'match'
            });
        }
    });
    
    // Calculate training attendance
    let trainingsAttended = 0;
    const trainingAttendanceRecords = [];
    trainingSessions.forEach(session => {
        if (session.attendance && session.attendance.includes(playerName)) {
            trainingsAttended++;
            trainingAttendanceRecords.push({
                date: session.date,
                location: session.location || 'The Aura',
                type: 'training'
            });
        }
    });
    
    // Calculate percentages
    const matchAttendancePercent = matchSessions.length > 0 ? Math.round((matchesAttended / matchSessions.length) * 100) : 0;
    const trainingAttendancePercent = trainingSessions.length > 0 ? Math.round((trainingsAttended / trainingSessions.length) * 100) : 0;
    
    // Get goal records sorted by date (most recent first)
    const goalRecords = Object.entries(goals)
        .map(([date, count]) => ({ date, count: parseInt(count) || 0 }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Get captain history
    const captainHistory = matchSessions
        .filter(m => m.captain === playerName)
        .map(m => ({
            date: m.date,
            opponent: m.opponent || 'Unknown'
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Combined attendance records sorted by date
    const allAttendanceRecords = [...matchAttendanceRecords, ...trainingAttendanceRecords]
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Get initials for avatar
    const initials = playerName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    container.innerHTML = `
        <div class="player-profile-header">
            <button class="player-profile-back-btn" onclick="switchToTab('players')" title="Back to Players">←</button>
            <div class="player-profile-avatar">${initials}</div>
            <h1 class="player-profile-name">${playerName}</h1>
            ${player.jersey ? `
                <div class="player-profile-jersey">
                    <span style="filter: hue-rotate(120deg) saturate(2) brightness(0.6);">👕</span>
                    #${player.jersey}
                </div>
            ` : ''}
        </div>
        
        <div class="player-profile-stats-grid">
            <div class="player-profile-stat-card">
                <div class="player-profile-stat-value">${totalGoals}</div>
                <div class="player-profile-stat-label">Total Goals</div>
            </div>
            <div class="player-profile-stat-card">
                <div class="player-profile-stat-value">${captainCount}</div>
                <div class="player-profile-stat-label">Times Captain</div>
            </div>
            <div class="player-profile-stat-card">
                <div class="player-profile-stat-value">${matchAttendancePercent}%</div>
                <div class="player-profile-stat-label">Match Attendance</div>
            </div>
            <div class="player-profile-stat-card">
                <div class="player-profile-stat-value">${trainingAttendancePercent}%</div>
                <div class="player-profile-stat-label">Training Attendance</div>
            </div>
        </div>
        
        ${player.parent ? `
            <div class="player-profile-section">
                <div class="player-profile-section-title">👤 Player Information</div>
                <div class="player-profile-section-content">
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                        <span style="color: var(--text-secondary);">Parent/Guardian</span>
                        <span style="color: var(--text-primary); font-weight: 500;">${player.parent}</span>
                    </div>
                    ${player.year ? `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid var(--border-color);">
                            <span style="color: var(--text-secondary);">Year</span>
                            <span style="color: var(--text-primary); font-weight: 500;">${player.year}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        ` : ''}
        
        <div class="player-profile-section">
            <div class="player-profile-section-title">⚽ Goals Scored (${totalGoals})</div>
            <div class="player-profile-section-content">
                ${goalRecords.length > 0 ? goalRecords.map(record => `
                    <div class="player-profile-goal-item">
                        <span class="player-profile-goal-date">${formatDate(new Date(record.date))}</span>
                        <span class="player-profile-goal-count">${record.count} ${record.count === 1 ? 'goal' : 'goals'}</span>
                    </div>
                `).join('') : `
                    <div class="player-profile-no-data">No goals recorded yet</div>
                `}
            </div>
        </div>
        
        <div class="player-profile-section">
            <div class="player-profile-section-title">⭐ Captain History (${captainCount})</div>
            <div class="player-profile-section-content">
                ${captainHistory.length > 0 ? captainHistory.map(record => `
                    <div class="player-profile-attendance-item">
                        <span class="player-profile-attendance-date">${formatDate(new Date(record.date))}</span>
                        <span class="player-profile-captain-badge">⭐ vs ${record.opponent}</span>
                    </div>
                `).join('') : `
                    <div class="player-profile-no-data">No captaincy records yet</div>
                `}
            </div>
        </div>
        
        <div class="player-profile-section">
            <div class="player-profile-section-title">📅 Attendance Record (${matchesAttended + trainingsAttended})</div>
            <div class="player-profile-section-content" style="max-height: 400px; overflow-y: auto;">
                ${allAttendanceRecords.length > 0 ? allAttendanceRecords.map(record => `
                    <div class="player-profile-attendance-item">
                        <div>
                            <span class="player-profile-attendance-date">${formatDate(new Date(record.date))}</span>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                                ${record.type === 'match' ? `vs ${record.opponent}` : record.location}
                            </div>
                        </div>
                        <span class="player-profile-attendance-type ${record.type}">
                            ${record.type === 'match' ? '🏆 Match' : '⚽ Training'}
                            ${record.wasCaptain ? ' ⭐' : ''}
                        </span>
                    </div>
                `).join('') : `
                    <div class="player-profile-no-data">No attendance records yet</div>
                `}
            </div>
        </div>
    `;
}

// Generate captain history chart
function generateCaptainHistoryChart() {
    // Get all matches that have a captain
    const matches = sessions.filter(s => s.type === 'match' && !s.deleted && s.captain);
    
    if (matches.length === 0) {
        return `
            <div class="stats-chart-container">
                <div class="stats-chart-title">Captain History</div>
                <div class="stats-empty" style="padding: 40px;">
                    <p>No captains recorded yet</p>
                    <small>Assign captains in match cards to see history here.</small>
                </div>
            </div>
        `;
    }
    
    // Sort matches by date (most recent first for display)
    const sortedMatches = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return `
        <div class="stats-chart-container">
            <div class="stats-chart-title">Captain History (${matches.length} ${matches.length === 1 ? 'match' : 'matches'})</div>
            <div style="padding: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 2fr 2fr; gap: 12px; font-size: 13px; font-weight: 700; color: var(--text-secondary); padding-bottom: 12px; border-bottom: 2px solid var(--border-color); text-transform: uppercase; letter-spacing: 0.5px;">
                    <div style="text-align: center;">Date</div>
                    <div>Opponent</div>
                    <div style="display: flex; align-items: center; gap: 6px;"><span style="color: var(--accent-warm);">⭐</span> Captain</div>
                </div>
                ${sortedMatches.map(match => {
                    const matchDate = new Date(match.date);
                    const formattedDate = matchDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                    return `
                        <div style="display: grid; grid-template-columns: 1fr 2fr 2fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border-color); font-size: 14px; color: var(--text-primary); transition: all 0.2s ease;">
                            <div style="text-align: center; color: var(--text-secondary); font-weight: 500;">${formattedDate}</div>
                            <div style="font-weight: 500;">${match.opponent || 'Unknown'}</div>
                            <div style="color: var(--accent-primary); font-weight: 600;">${match.captain}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}
