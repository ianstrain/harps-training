// ============================================
// STATISTICS AND CHARTS
// ============================================

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
    
    // Filter out players with 0 goals and sort by total (descending)
    const playersWithGoals = playerGoals
        .filter(p => p.total > 0)
        .sort((a, b) => b.total - a.total);
    
    if (playersWithGoals.length === 0) {
        container.innerHTML = `
            <div class="stats-empty">
                <p>No goals recorded yet</p>
                <small>Goals will appear here once players start scoring.</small>
            </div>
        `;
        return;
    }
    
    // Find the longest player name to calculate proper spacing
    const longestName = playersWithGoals.reduce((longest, player) => 
        player.name.length > longest.length ? player.name : longest, '');
    const longestNameLength = longestName.length;
    const fontSize = 28; // Current font size for player labels
    // Calculate space needed: font size * number of characters + some padding
    // When rotated -90 degrees, the text width becomes the height
    const nameSpaceNeeded = (fontSize * longestNameLength * 0.6) + 20; // 0.6 is approximate character width ratio, +20 for padding (reduced)
    
    // Chart dimensions
    const chartWidth = 800;
    const chartHeight = 600; // Increased overall height for longer bars
    const padding = { 
        top: 40, 
        right: 40, 
        bottom: Math.max(200, nameSpaceNeeded + 10), // Dynamic bottom padding based on longest name, minimal buffer
        left: 80 // Increased left padding to prevent Goals text from being cut off
    };
    const barWidth = (chartWidth - padding.left - padding.right) / playersWithGoals.length - 10;
    const maxGoals = Math.max(...playersWithGoals.map(p => p.total), 1);
    const barHeight = chartHeight - padding.top - padding.bottom;
    
    let svg = `
        <div class="stats-chart-container">
            <div class="stats-chart-title">Goals Scored by Player</div>
            <div class="stats-chart-svg-container">
                <svg viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="xMidYMid meet">
                    <!-- Y-axis label -->
                    <text class="stats-chart-axis-label" 
                          x="20" 
                          y="${(padding.top + (barHeight / 2) )}" 
                          transform="rotate(-90, 20, ${padding.top + (barHeight / 2)})"
                          text-anchor="middle"
                          dominant-baseline="middle">Goals</text>
                    
                    <!-- X-axis label -->
                    <text class="stats-chart-axis-label" 
                          x="${chartWidth / 2}" 
                          y="${(chartHeight - padding.bottom + 5) + 30}" 
                          text-anchor="middle">Players</text>
                    
                    <!-- Y-axis grid lines and labels -->
                    ${Array.from({ length: 6 }, (_, i) => {
                        const value = Math.ceil(maxGoals / 5) * i;
                        const y = chartHeight - padding.bottom - (value / maxGoals) * barHeight;
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
                    ${playersWithGoals.map((player, index) => {
                        const barHeightValue = (player.total / maxGoals) * barHeight;
                        const x = padding.left + index * (barWidth + 10);
                        const y = chartHeight - padding.bottom - barHeightValue;
                        
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
                                      y="${chartHeight - padding.bottom + (nameSpaceNeeded * 0.4)}"
                                      transform="rotate(-90, ${x + barWidth / 2}, ${chartHeight - padding.bottom + (nameSpaceNeeded * 0.4)})"
                                      text-anchor="middle">${player.name}</text>
                            </g>
                        `;
                    }).join('')}
                </svg>
            </div>
        </div>
    `;
    
    // Generate attendance chart and captain history
    const attendanceChart = generateAttendanceChart(filteredPlayers);
    const captainHistory = generateCaptainHistoryChart();
    
    // Generate season stats
    const seasonStats = generateSeasonStats();
    
    container.innerHTML = seasonStats + attendanceChart + captainHistory + svg;
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
                    <div style="font-size: 28px; font-weight: bold; color: var(--accent);">${completedMatches.length}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Played</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: #00ff64;">${wins}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Wins</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: #ffc800;">${draws}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Draws</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: #ff3232;">${losses}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Losses</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: var(--accent);">${totalGoalsScored}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Goals For</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: var(--text-secondary);">${totalGoalsConceded}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Goals Against</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px; grid-column: span 1;">
                    <div style="font-size: 28px; font-weight: bold; color: ${goalDiff > 0 ? '#00ff64' : goalDiff < 0 ? '#ff3232' : 'var(--accent)'};">${goalDiff > 0 ? '+' : ''}${goalDiff}</div>
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
    }).filter(p => p.attended > 0).sort((a, b) => b.attended - a.attended);
    
    if (playerAttendance.length === 0) {
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
    const longestName = playerAttendance.reduce((longest, player) => 
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
    const barWidth = (chartWidth - padding.left - padding.right) / playerAttendance.length - 10;
    const maxAttended = Math.max(...playerAttendance.map(p => p.attended), 1);
    const barHeight = chartHeight - padding.top - padding.bottom;
    
    let svg = `
        <div class="stats-chart-container">
            <div class="stats-chart-title">Match Attendance (${matches.length} ${matches.length === 1 ? 'match' : 'matches'})</div>
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
                    ${playerAttendance.map((player, index) => {
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
                                      y="${chartHeight - padding.bottom + (nameSpaceNeeded * 0.4)}"
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
