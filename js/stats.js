// ============================================
// STATISTICS AND CHARTS
// ============================================

// Sort state for charts (global for testability)
window.goalsSortBy = 'goals-desc'; // Default: sort by goals descending
window.matchAttendanceSortBy = 'attended-desc'; // Default: sort by attended descending
window.trainingAttendanceSortBy = 'attended-desc'; // Default: sort by attended descending

// Sorting functions (global for testability)
window.sortPlayerData = function(data, sortBy, valueKey = 'total') {
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

// Generate sort controls HTML (global for testability)
window.generateSortControls = function(chartId, currentSort, isAttendance = false) {
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
            window.goalsSortBy = sortValue;
            break;
        case 'match-attendance':
            window.matchAttendanceSortBy = sortValue;
            break;
        case 'training-attendance':
            window.trainingAttendanceSortBy = sortValue;
            break;
    }
    renderStats();
};

// Render statistics (global for testability)
window.renderStats = function() {
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
    
    // Get goals for each player and calculate totals (plus league / friendly / cup / other split)
    const playerGoals = filteredPlayers.map(p => {
        const playerName = p.player || '';
        const goals = getPlayerGoals(playerName);
        const total = getTotalGoals(goals);
        const matchKindTotals = aggregatePlayerMatchGoalsByMatchKind(playerName);
        const segments = buildPlayerGoalChartSegments(total, matchKindTotals);
        return {
            name: playerName,
            total,
            goals,
            matchKindTotals,
            segments
        };
    });

    const hasCupMatches = sessions.some(
        s => s.type === 'match' && !s.deleted && getStatsMatchKind(s) === 'cup'
    );
    
    // Filter out players with 0 goals and apply sorting
    const playersWithGoals = window.sortPlayerData(
        playerGoals.filter(p => p.total > 0),
        window.goalsSortBy,
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
    const yGoalsBaseline = chartHeight - paddingGoals.bottom;

    const goalsLegendItems = [
        { fill: '#10b981', label: 'League' },
        { fill: '#0ea5e9', label: 'Friendly' },
        ...(hasCupMatches ? [{ fill: '#f59e0b', label: 'Cup' }] : []),
        { fill: '#64748b', label: 'Other (e.g. manual log)' }
    ];
    const goalsLegendHtml = `
        <div class="stats-goals-legend" style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 14px; margin-bottom: 10px; font-size: 12px; color: var(--text-secondary);">
            ${goalsLegendItems.map(
                item => `<span style="display: inline-flex; align-items: center; gap: 6px;">
                    <span style="width: 12px; height: 12px; border-radius: 3px; background: ${item.fill}; flex-shrink: 0;"></span>${item.label}
                </span>`
            ).join('')}
        </div>`;

    let goalsSvg = `
        <div class="stats-chart-container">
            <div class="stats-chart-title">Goals Scored by Player</div>
            ${goalsLegendHtml}
            ${window.generateSortControls('goals', window.goalsSortBy, false)}
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
                    
                    <!-- Bars (stacked: league → friendly → cup → other) -->
                    ${playersWithGoals.map((player, index) => {
                        const x = paddingGoals.left + index * (barWidth + 10);
                        const mk = player.matchKindTotals;
                        const otherRaw = Math.max(0, player.total - mk.league - mk.friendly - mk.cup);
                        const tipParts = [];
                        if (mk.league) tipParts.push(`League ${mk.league}`);
                        if (mk.friendly) tipParts.push(`Friendly ${mk.friendly}`);
                        if (mk.cup) tipParts.push(`Cup ${mk.cup}`);
                        if (otherRaw) tipParts.push(`Other ${otherRaw}`);
                        const tipDetail = tipParts.length ? tipParts.join(', ') : '—';
                        const barTip = `${player.name}: ${player.total} ${player.total === 1 ? 'goal' : 'goals'} (${tipDetail})`;

                        let cumFromBottom = 0;
                        const stackRects = player.segments.map(seg => {
                            const segH = (seg.value / maxGoals) * barHeight;
                            cumFromBottom += segH;
                            const segY = yGoalsBaseline - cumFromBottom;
                            return `
                                <rect class="stats-chart-bar-segment"
                                      x="${x}" 
                                      y="${segY}" 
                                      width="${barWidth}" 
                                      height="${segH}"
                                      rx="2"
                                      fill="${seg.fill}"
                                      stroke="var(--bg-section)"
                                      stroke-width="1">
                                    <title>${barTip}</title>
                                </rect>`;
                        }).join('');

                        const fullBarH = (player.total / maxGoals) * barHeight;
                        const topY = yGoalsBaseline - fullBarH;

                        return `
                            <g>
                                ${stackRects}
                                <text class="stats-chart-goal-value" 
                                      x="${x + barWidth / 2}" 
                                      y="${topY - 8}">${player.total}</text>
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

function getStatsMatchKind(session) {
    const t = session.matchType || 'friendly';
    if (t === 'league') return 'league';
    if (t === 'cup') return 'cup';
    return 'friendly';
}

/** Matches that count for attendance stats: played games (result entered), same as season "Played". */
function getPlayedMatchesForAttendance() {
    return sessions.filter(s => s.type === 'match' && !s.deleted && s.result);
}

/** Sum goals credited on match cards for this player, split by competition type. */
function aggregatePlayerMatchGoalsByMatchKind(playerName) {
    let league = 0;
    let friendly = 0;
    let cup = 0;
    for (const s of sessions) {
        if (s.type !== 'match' || s.deleted) continue;
        const g = parseInt((s.matchGoals && s.matchGoals[playerName]) || 0, 10) || 0;
        if (!g) continue;
        const kind = getStatsMatchKind(s);
        if (kind === 'league') league += g;
        else if (kind === 'cup') cup += g;
        else friendly += g;
    }
    return { league, friendly, cup };
}

/**
 * Build segment sizes for the goals chart (stacked bar). Totals match `total` (stored goals).
 * If match-card sums exceed stored total (e.g. same calendar date overwritten), segments scale down.
 */
function buildPlayerGoalChartSegments(total, matchKindTotals) {
    let L = matchKindTotals.league;
    let F = matchKindTotals.friendly;
    let C = matchKindTotals.cup;
    const sumMatch = L + F + C;
    let other = Math.max(0, total - sumMatch);
    if (sumMatch > total && sumMatch > 0) {
        const scale = total / sumMatch;
        L *= scale;
        F *= scale;
        C *= scale;
        other = 0;
    }
    const segments = [
        { key: 'league', value: L, fill: '#10b981', label: 'League' },
        { key: 'friendly', value: F, fill: '#0ea5e9', label: 'Friendly' },
        { key: 'cup', value: C, fill: '#f59e0b', label: 'Cup' },
        { key: 'other', value: other, fill: '#64748b', label: 'Other' }
    ];
    return segments.filter(seg => seg.value > 0);
}

/** Count matches attended on the schedule, split by competition type. */
function aggregatePlayerMatchAttendanceByMatchKind(playerName, matchList) {
    let league = 0;
    let friendly = 0;
    let cup = 0;
    for (const m of matchList) {
        if (!m.attendance || !m.attendance.includes(playerName)) continue;
        const kind = getStatsMatchKind(m);
        if (kind === 'league') league++;
        else if (kind === 'cup') cup++;
        else friendly++;
    }
    return { league, friendly, cup };
}

function buildMatchAttendanceChartSegments(kindTotals) {
    return [
        { key: 'league', value: kindTotals.league, fill: '#10b981', label: 'League' },
        { key: 'friendly', value: kindTotals.friendly, fill: '#0ea5e9', label: 'Friendly' },
        { key: 'cup', value: kindTotals.cup, fill: '#f59e0b', label: 'Cup' }
    ].filter(s => s.value > 0);
}

if (typeof window !== 'undefined') {
    window.aggregatePlayerMatchGoalsByMatchKind = aggregatePlayerMatchGoalsByMatchKind;
    window.buildPlayerGoalChartSegments = buildPlayerGoalChartSegments;
    window.aggregatePlayerMatchAttendanceByMatchKind = aggregatePlayerMatchAttendanceByMatchKind;
    window.buildMatchAttendanceChartSegments = buildMatchAttendanceChartSegments;
    window.buildSeasonMatchMetrics = buildSeasonMatchMetrics;
}

function buildSeasonMatchMetrics(completedMatches) {
    const wins = completedMatches.filter(s => s.result === 'win').length;
    const draws = completedMatches.filter(s => s.result === 'draw').length;
    const losses = completedMatches.filter(s => s.result === 'loss').length;
    const totalGoalsScored = completedMatches.reduce((sum, s) => sum + (parseInt(s.teamScore) || 0), 0);
    const totalGoalsConceded = completedMatches.reduce((sum, s) => sum + (parseInt(s.opponentScore) || 0), 0);
    const goalDiff = totalGoalsScored - totalGoalsConceded;
    const cleanSheets = completedMatches.filter(s => (parseInt(s.opponentScore, 10) || 0) === 0).length;
    return {
        played: completedMatches.length,
        wins,
        draws,
        losses,
        totalGoalsScored,
        totalGoalsConceded,
        cleanSheets,
        goalDiff
    };
}

function seasonMatchStatsGridHtml(m) {
    const goalDiffColor = m.goalDiff > 0 ? '#00ff64' : m.goalDiff < 0 ? '#ff3232' : 'var(--accent)';
    return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px;">
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: var(--accent);">
                        ${m.played}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Played</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: #00ff64;">
                        ${m.wins}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Wins</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: #ffc800;">
                        ${m.draws}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Draws</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: #ff3232;">
                        ${m.losses}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Losses</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: var(--accent);">
                        ${m.totalGoalsScored}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Goals For</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: var(--text-secondary);">
                        ${m.totalGoalsConceded}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Goals Against</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px;">
                    <div style="font-size: 28px; font-weight: bold; color: #34d399;">
                        ${m.cleanSheets}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Clean Sheets</div>
                </div>
                <div class="stat-box" style="text-align: center; padding: 15px; background: var(--bg-card); border-radius: 8px; grid-column: span 1;">
                    <div style="font-size: 28px; font-weight: bold; color: ${goalDiffColor};">
                        ${m.goalDiff > 0 ? '+' : ''}${m.goalDiff}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Goal Diff</div>
                </div>
            </div>
            ${m.played > 0 ? `
                <div style="margin-top: 15px; text-align: center; font-size: 18px; font-weight: bold; color: var(--text-primary);">
                    Record: ${m.wins}W - ${m.draws}D - ${m.losses}L
                </div>
            ` : `
                <div style="margin-top: 15px; text-align: center; font-size: 14px; color: var(--text-secondary);">
                    No completed matches yet
                </div>
            `}
    `;
}

function seasonStatsSubsection(title, completedSubset, marginTop) {
    const metrics = buildSeasonMatchMetrics(completedSubset);
    return `
        <div style="margin-top: ${marginTop}px;">
            <h4 style="margin: 0 0 12px 0; color: var(--text-primary); font-size: 15px; text-align: center; font-weight: 600;">${title}</h4>
            ${seasonMatchStatsGridHtml(metrics)}
        </div>
    `;
}

// Generate season statistics
function generateSeasonStats() {
    const matchSessions = sessions.filter(s => s.type === 'match' && !s.deleted);
    const completedMatches = matchSessions.filter(s => s.result);
    const leagueCompleted = completedMatches.filter(s => getStatsMatchKind(s) === 'league');
    const friendlyCompleted = completedMatches.filter(s => getStatsMatchKind(s) === 'friendly');
    const cupCompleted = completedMatches.filter(s => getStatsMatchKind(s) === 'cup');
    const hasCupMatches = matchSessions.some(s => getStatsMatchKind(s) === 'cup');

    let body = seasonStatsSubsection('League matches', leagueCompleted, 0);
    body += seasonStatsSubsection('Friendly matches', friendlyCompleted, 20);
    if (hasCupMatches) {
        body += seasonStatsSubsection('Cup matches', cupCompleted, 20);
    }

    return `
        <div class="season-stats-section" style="margin-bottom: 30px; padding: 20px; background: var(--bg-section); border-radius: 12px; border: 1px solid var(--border-color);">
            <h3 style="margin: 0 0 15px 0; color: var(--accent); font-size: 18px; text-align: center;">Season Match Statistics</h3>
            ${body}
        </div>
    `;
}

// Generate attendance chart
function generateAttendanceChart(filteredPlayers) {
    const allMatches = sessions.filter(s => s.type === 'match' && !s.deleted);
    const matches = getPlayedMatchesForAttendance();

    if (allMatches.length === 0) {
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

    if (matches.length === 0) {
        return `
            <div class="stats-chart-container">
                <div class="stats-chart-title">Match Attendance</div>
                <div class="stats-empty" style="padding: 40px;">
                    <p>No completed matches yet</p>
                    <small>Enter a result (win, draw, or loss) on each match card to count it as played for attendance stats.</small>
                </div>
            </div>
        `;
    }

    const hasCupMatchesAttendance = matches.some(m => getStatsMatchKind(m) === 'cup');

    // Calculate attendance stats for each player (totals + league / friendly / cup breakdown)
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

        const matchKindTotals = aggregatePlayerMatchAttendanceByMatchKind(playerName, matches);
        const segments = buildMatchAttendanceChartSegments(matchKindTotals);

        return {
            name: playerName,
            attended,
            captainCount,
            matchKindTotals,
            segments,
            percentage: matches.length > 0 ? (attended / matches.length * 100).toFixed(0) : 0
        };
    }).filter(p => p.attended > 0);
    
    // Apply sorting
    const sortedPlayerAttendance = window.sortPlayerData(playerAttendance, window.matchAttendanceSortBy, 'attended');
    
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
    const yAttendanceBaseline = chartHeight - padding.bottom;

    const attendanceLegendItems = [
        { fill: '#10b981', label: 'League' },
        { fill: '#0ea5e9', label: 'Friendly' },
        ...(hasCupMatchesAttendance ? [{ fill: '#f59e0b', label: 'Cup' }] : [])
    ];
    const attendanceLegendHtml = `
        <div class="stats-attendance-legend" style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 14px; margin-bottom: 10px; font-size: 12px; color: var(--text-secondary);">
            ${attendanceLegendItems.map(
                item => `<span style="display: inline-flex; align-items: center; gap: 6px;">
                    <span style="width: 12px; height: 12px; border-radius: 3px; background: ${item.fill}; flex-shrink: 0;"></span>${item.label}
                </span>`
            ).join('')}
        </div>`;

    let svg = `
        <div class="stats-chart-container">
            <div class="stats-chart-title">Match Attendance (${matches.length} ${matches.length === 1 ? 'match' : 'matches'})</div>
            ${attendanceLegendHtml}
            ${window.generateSortControls('match-attendance', window.matchAttendanceSortBy, true)}
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
                    
                    <!-- Bars (stacked: league → friendly → cup) -->
                    ${sortedPlayerAttendance.map((player, index) => {
                        const x = padding.left + index * (barWidth + 10);
                        const mk = player.matchKindTotals;
                        const tipParts = [];
                        if (mk.league) tipParts.push(`League ${mk.league}`);
                        if (mk.friendly) tipParts.push(`Friendly ${mk.friendly}`);
                        if (mk.cup) tipParts.push(`Cup ${mk.cup}`);
                        const tipDetail = tipParts.length ? tipParts.join(', ') : '—';
                        const barTip = `${player.name}: ${player.attended}/${matches.length} matches (${player.percentage}%) — ${tipDetail}`;

                        let cumFromBottom = 0;
                        const stackRects = player.segments.map(seg => {
                            const segH = (seg.value / maxAttended) * barHeight;
                            cumFromBottom += segH;
                            const segY = yAttendanceBaseline - cumFromBottom;
                            return `
                                <rect class="stats-chart-bar-segment"
                                      x="${x}" 
                                      y="${segY}" 
                                      width="${barWidth}" 
                                      height="${segH}"
                                      rx="2"
                                      fill="${seg.fill}"
                                      stroke="var(--bg-section)"
                                      stroke-width="1">
                                    <title>${barTip}</title>
                                </rect>`;
                        }).join('');

                        const fullBarH = (player.attended / maxAttended) * barHeight;
                        const topY = yAttendanceBaseline - fullBarH;

                        return `
                            <g>
                                ${stackRects}
                                <text class="stats-chart-goal-value" 
                                      x="${x + barWidth / 2}" 
                                      y="${topY - 8}">${player.attended}</text>
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
    const sortedTrainingAttendance = window.sortPlayerData(playerTrainingAttendance, window.trainingAttendanceSortBy, 'attended');
    
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
            ${window.generateSortControls('training-attendance', window.trainingAttendanceSortBy, true)}
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
window.renderPlayerProfile = function() {
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
    
    // Get clean sheets
    const cleanSheetData = window.getPlayerCleanSheets(playerName);
    
    // Get attendance data
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const allPastSessions = sessions.filter(s => {
        if (s.deleted) return false;
        const sessionDate = new Date(s.date);
        sessionDate.setHours(0, 0, 0, 0); // Normalize to start of day
        return sessionDate <= now;
    });
    const pastMatchSessions = allPastSessions.filter(s => s.type === 'match');
    const playedMatchSessions = getPlayedMatchesForAttendance();
    const pastTrainingSessions = allPastSessions.filter(s => s.type === 'training');
    
    // Calculate match attendance (games played only — matches with a result)
    let matchesAttended = 0;
    let captainCount = 0;
    let viceCaptainCount = 0;
    const matchAttendanceRecords = [];
    playedMatchSessions.forEach(match => {
        if (match.attendance && match.attendance.includes(playerName)) {
            matchesAttended++;
            const wasCaptain = match.captain === playerName;
            const wasViceCaptain = match.viceCaptain === playerName;
            if (wasCaptain) captainCount++;
            if (wasViceCaptain) viceCaptainCount++;
            matchAttendanceRecords.push({
                date: match.date,
                opponent: match.opponent || 'Unknown',
                wasCaptain: wasCaptain,
                wasViceCaptain: wasViceCaptain,
                type: 'match'
            });
        }
    });
    
    // Calculate training attendance
    let trainingsAttended = 0;
    const trainingAttendanceRecords = [];
    pastTrainingSessions.forEach(session => {
        if (session.attendance && session.attendance.includes(playerName)) {
            trainingsAttended++;
            trainingAttendanceRecords.push({
                date: session.date,
                location: session.location || defaults.location,
                type: 'training'
            });
        }
    });
    
    // Calculate percentages
    const matchAttendancePercent = playedMatchSessions.length > 0 ? Math.round((matchesAttended / playedMatchSessions.length) * 100) : 0;
    const trainingAttendancePercent = pastTrainingSessions.length > 0 ? Math.round((trainingsAttended / pastTrainingSessions.length) * 100) : 0;
    
    // Get goal records sorted by date (most recent first)
    const goalRecords = Object.entries(goals)
        .map(([date, count]) => ({ date, count: parseInt(count) || 0 }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Get captain history
    const captainHistory = pastMatchSessions
        .filter(m => m.captain === playerName)
        .map(m => ({
            date: m.date,
            opponent: m.opponent || 'Unknown'
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const viceCaptainHistory = pastMatchSessions
        .filter(m => m.viceCaptain === playerName)
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
                <div class="player-profile-stat-value">${viceCaptainCount}</div>
                <div class="player-profile-stat-label">Times Vice Captain</div>
            </div>
            <div class="player-profile-stat-card">
                <div class="player-profile-stat-value">${cleanSheetData.cleanSheets}</div>
                <div class="player-profile-stat-label">Clean Sheets</div>
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
        
        ${typeof window.renderPlayerBadges === 'function' ? `
            <div class="player-profile-section">
                <div class="player-profile-section-title">🏅 Achievements</div>
                <div class="player-profile-section-content">
                    ${window.renderPlayerBadges(playerName) || '<div class="player-profile-no-data">No badges earned yet. Keep attending training!</div>'}
                </div>
            </div>
        ` : ''}
        
        ${(player.parent || player.year !== undefined || player.clubRegistration !== undefined || player.faiConnectRegistration !== undefined) ? `
            <div class="player-profile-section">
                <div class="player-profile-section-title">👤 Player Information</div>
                <div class="player-profile-section-content">
                    ${player.parent ? `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                            <span style="color: var(--text-secondary);">Parent/Guardian</span>
                            <span style="color: var(--text-primary); font-weight: 500;">${player.parent}</span>
                        </div>
                    ` : ''}
                    ${player.year ? `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; ${player.parent ? 'border-top: 1px solid var(--border-color);' : ''}">
                            <span style="color: var(--text-secondary);">Year</span>
                            <span style="color: var(--text-primary); font-weight: 500;">${player.year}</span>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; ${(player.parent || player.year) ? 'border-top: 1px solid var(--border-color);' : ''}">
                        <span style="color: var(--text-secondary);">Club Registration</span>
                        <div class="toggle-switch read-only"><span class="toggle-slider${player.clubRegistration ? ' on' : ''}"></span></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-top: 1px solid var(--border-color);">
                        <span style="color: var(--text-secondary);">FAI Connect Registration</span>
                        <div class="toggle-switch read-only"><span class="toggle-slider${player.faiConnectRegistration ? ' on' : ''}"></span></div>
                    </div>
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
            <div class="player-profile-section-title">Vice Captain History (${viceCaptainCount})</div>
            <div class="player-profile-section-content">
                ${viceCaptainHistory.length > 0 ? viceCaptainHistory.map(record => `
                    <div class="player-profile-attendance-item">
                        <span class="player-profile-attendance-date">${formatDate(new Date(record.date))}</span>
                        <span class="player-profile-vice-captain-badge">VC vs ${record.opponent}</span>
                    </div>
                `).join('') : `
                    <div class="player-profile-no-data">No vice captaincy records yet</div>
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
                            ${record.wasCaptain ? ' ⭐' : ''}${record.wasViceCaptain ? ' VC' : ''}
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
    const matches = sessions.filter(s => s.type === 'match' && !s.deleted && (s.captain || s.viceCaptain));
    
    if (matches.length === 0) {
        return `
            <div class="stats-chart-container">
                <div class="stats-chart-title">Captain & Vice Captain History</div>
                <div class="stats-empty" style="padding: 40px;">
                    <p>No captains or vice captains recorded yet</p>
                    <small>Assign captains and vice captains in match cards to see history here.</small>
                </div>
            </div>
        `;
    }
    
    const sortedMatches = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));
    const dash = '—';
    
    return `
        <div class="stats-chart-container">
            <div class="stats-chart-title">Captain & Vice Captain History (${matches.length} ${matches.length === 1 ? 'match' : 'matches'})</div>
            <div style="padding: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 2fr 2fr 2fr; gap: 12px; font-size: 13px; font-weight: 700; color: var(--text-secondary); padding-bottom: 12px; border-bottom: 2px solid var(--border-color); text-transform: uppercase; letter-spacing: 0.5px;">
                    <div style="text-align: center;">Date</div>
                    <div>Opponent</div>
                    <div style="display: flex; align-items: center; gap: 6px;"><span style="color: var(--accent-warm);">⭐</span> Captain</div>
                    <div style="display: flex; align-items: center; gap: 6px;"><span style="color: var(--accent-primary);">VC</span> Vice Captain</div>
                </div>
                ${sortedMatches.map(match => {
                    const matchDate = new Date(match.date);
                    const formattedDate = matchDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                    const captainCell = match.captain
                        ? `<div style="color: var(--accent-primary); font-weight: 600;">${match.captain}</div>`
                        : `<div style="color: var(--text-muted); font-weight: 500;">${dash}</div>`;
                    const viceCell = match.viceCaptain
                        ? `<div style="color: var(--accent-primary); font-weight: 600;">${match.viceCaptain}</div>`
                        : `<div style="color: var(--text-muted); font-weight: 500;">${dash}</div>`;
                    return `
                        <div style="display: grid; grid-template-columns: 1fr 2fr 2fr 2fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border-color); font-size: 14px; color: var(--text-primary); transition: all 0.2s ease;">
                            <div style="text-align: center; color: var(--text-secondary); font-weight: 500;">${formattedDate}</div>
                            <div style="font-weight: 500;">${match.opponent || 'Unknown'}</div>
                            ${captainCell}
                            ${viceCell}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Get player attendance stats
window.getPlayerAttendanceStats = function(playerName) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const allPastSessions = sessions.filter(s => {
        if (s.deleted) return false;
        const sessionDate = new Date(s.date);
        sessionDate.setHours(0, 0, 0, 0); // Normalize to start of day
        return sessionDate <= now;
    });

    const playedMatchSessions = getPlayedMatchesForAttendance();
    const pastTrainingSessions = allPastSessions.filter(s => s.type === 'training');

    let matchesAttended = 0;
    playedMatchSessions.forEach(match => {
        if (match.attendance && match.attendance.includes(playerName)) {
            matchesAttended++;
        }
    });

    let trainingsAttended = 0;
    pastTrainingSessions.forEach(session => {
        if (session.attendance && session.attendance.includes(playerName)) {
            trainingsAttended++;
        }
    });

    const matchAttendancePercent = playedMatchSessions.length > 0 ? Math.round((matchesAttended / playedMatchSessions.length) * 100) : 0;
    const trainingAttendancePercent = pastTrainingSessions.length > 0 ? Math.round((trainingsAttended / pastTrainingSessions.length) * 100) : 0;

    return {
        matchesAttended,
        matchAttendancePercent,
        trainingsAttended,
        trainingAttendancePercent,
        totalMatches: playedMatchSessions.length,
        totalTrainings: pastTrainingSessions.length
    };
};

/** Players included on the Stats tab (same filter as renderStats). */
function getFilteredPlayersForStatsExport() {
    return players.filter(p => {
        const returning = (p.returning || '').toString().toLowerCase().trim();
        const playerName = (p.player || '').toString().toLowerCase();
        return p.player &&
            p.player !== '?' &&
            !playerName.includes('child') &&
            returning !== 'no';
    });
}

window.exportStatsToExcel = function() {
    if (typeof XLSX === 'undefined') {
        if (typeof showToast === 'function') {
            showToast('Excel export is unavailable. Refresh the page and try again.', true);
        }
        return;
    }

    const filteredPlayers = getFilteredPlayersForStatsExport();
    if (filteredPlayers.length === 0) {
        if (typeof showToast === 'function') {
            showToast('No players to include in stats export.', true);
        }
        return;
    }

    const wb = XLSX.utils.book_new();

    const matchSessions = sessions.filter(s => s.type === 'match' && !s.deleted);
    const completedMatches = matchSessions.filter(s => s.result);
    const leagueCompleted = completedMatches.filter(s => getStatsMatchKind(s) === 'league');
    const friendlyCompleted = completedMatches.filter(s => getStatsMatchKind(s) === 'friendly');
    const cupCompleted = completedMatches.filter(s => getStatsMatchKind(s) === 'cup');
    const hasCupMatches = matchSessions.some(s => getStatsMatchKind(s) === 'cup');

    function appendMetricBlock(aoa, title, m) {
        aoa.push([title], ['Metric', 'Value']);
        aoa.push(['Played', m.played], ['Wins', m.wins], ['Draws', m.draws], ['Losses', m.losses]);
        aoa.push(['Goals for', m.totalGoalsScored], ['Goals against', m.totalGoalsConceded]);
        aoa.push(['Clean sheets', m.cleanSheets], ['Goal difference', m.goalDiff], []);
    }

    const seasonAoa = [
        ['Season match statistics'],
        ['Exported', new Date().toISOString().slice(0, 10)],
        []
    ];
    appendMetricBlock(seasonAoa, 'League matches', buildSeasonMatchMetrics(leagueCompleted));
    appendMetricBlock(seasonAoa, 'Friendly matches', buildSeasonMatchMetrics(friendlyCompleted));
    if (hasCupMatches) {
        appendMetricBlock(seasonAoa, 'Cup matches', buildSeasonMatchMetrics(cupCompleted));
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(seasonAoa), 'Season');

    const gp = globalThis.getPlayerGoals;
    const gt = globalThis.getTotalGoals;

    const playedMatches = getPlayedMatchesForAttendance();
    const trainingSessions = sessions.filter(s => s.type === 'training' && !s.deleted);

    function isoDate(d) {
        return d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '';
    }

    // —— Goals Scored by Player (summary + per-date log) ——
    const goalsAoa = [
        ['Goals Scored by Player'],
        ['Totals combine match-card goals by competition type; "Other" is goals not tied to a match card.'],
        ['Goals by date lists each stored log entry per player.'],
        [],
        ['Player summary'],
        ['Player', 'Total goals', 'League', 'Friendly', 'Cup', 'Other']
    ];
    const goalsByDateRows = [];
    for (const p of filteredPlayers) {
        const name = p.player || '';
        const goalsObj = typeof gp === 'function' ? gp(name) : {};
        const total = typeof gt === 'function' ? gt(goalsObj) : 0;
        const mk = aggregatePlayerMatchGoalsByMatchKind(name);
        const sumMatch = mk.league + mk.friendly + mk.cup;
        const other = Math.max(0, total - sumMatch);
        goalsAoa.push([name, total, mk.league, mk.friendly, mk.cup, other]);
        if (goalsObj && typeof goalsObj === 'object') {
            for (const [dateKey, count] of Object.entries(goalsObj)) {
                const n = parseInt(count, 10) || 0;
                if (n) goalsByDateRows.push([name, dateKey, n]);
            }
        }
    }
    goalsByDateRows.sort((a, b) => String(a[1]).localeCompare(String(b[1])) || String(a[0]).localeCompare(String(b[0])));
    goalsAoa.push([], ['Goals by date'], ['Player', 'Date', 'Goals logged'], ...goalsByDateRows);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(goalsAoa), 'Goals Scored by Player');

    // —— Match Attendance (per player + per match) ——
    const matchLabel = playedMatches.length === 1 ? 'match' : 'matches';
    const matchAoa = [
        ['Match Attendance'],
        [`Played matches with a result entered: ${playedMatches.length} ${matchLabel} (same basis as the stats chart).`],
        [],
        ['Player summary'],
        [
            'Player',
            'Matches attended',
            'League attended',
            'Friendly attended',
            'Cup attended',
            'Captain selections',
            'Attendance %',
            'Played matches (denominator)'
        ]
    ];
    for (const p of filteredPlayers) {
        const name = p.player || '';
        let attended = 0;
        let captainCount = 0;
        playedMatches.forEach(match => {
            if (match.attendance && match.attendance.includes(name)) attended++;
            if (match.captain === name) captainCount++;
        });
        const mk = aggregatePlayerMatchAttendanceByMatchKind(name, playedMatches);
        const pct = playedMatches.length > 0 ? Math.round((attended / playedMatches.length) * 100) : 0;
        matchAoa.push([name, attended, mk.league, mk.friendly, mk.cup, captainCount, pct, playedMatches.length]);
    }
    const sortedPlayed = [...playedMatches].sort((a, b) => new Date(b.date) - new Date(a.date));
    matchAoa.push(
        [],
        ['By match'],
        ['Date', 'Opponent', 'Type', 'Result', 'Team score', 'Opp. score', 'Attendees', 'Captain', 'Vice captain']
    );
    for (const m of sortedPlayed) {
        const d = m.date ? new Date(m.date) : null;
        const attendees = Array.isArray(m.attendance) ? m.attendance.join(', ') : '';
        matchAoa.push([
            isoDate(d),
            m.opponent || '',
            getStatsMatchKind(m),
            m.result || '',
            m.teamScore != null && m.teamScore !== '' ? m.teamScore : '',
            m.opponentScore != null && m.opponentScore !== '' ? m.opponentScore : '',
            attendees,
            m.captain || '',
            m.viceCaptain || ''
        ]);
    }
    if (sortedPlayed.length === 0) {
        matchAoa.push(['—', 'No played matches yet (enter a result on each match to count toward attendance).', '', '', '', '', '', '', '']);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(matchAoa), 'Match Attendance');

    // —— Training Attendance (per player + per session) ——
    const trainLabel = trainingSessions.length === 1 ? 'session' : 'sessions';
    const trainingAoa = [
        ['Training Attendance'],
        [`Training sessions on schedule: ${trainingSessions.length} ${trainLabel}.`],
        [],
        ['Player summary'],
        ['Player', 'Sessions attended', 'Total sessions', 'Attendance %']
    ];
    for (const p of filteredPlayers) {
        const name = p.player || '';
        let attended = 0;
        trainingSessions.forEach(session => {
            if (session.attendance && session.attendance.includes(name)) attended++;
        });
        const pct = trainingSessions.length > 0 ? Math.round((attended / trainingSessions.length) * 100) : 0;
        trainingAoa.push([name, attended, trainingSessions.length, pct]);
    }
    const sortedTraining = [...trainingSessions].sort((a, b) => new Date(b.date) - new Date(a.date));
    trainingAoa.push([], ['By session'], ['Date', 'Location', 'Attendees']);
    for (const s of sortedTraining) {
        const d = s.date ? new Date(s.date) : null;
        const attendees = Array.isArray(s.attendance) ? s.attendance.join(', ') : '';
        trainingAoa.push([isoDate(d), s.location || '', attendees]);
    }
    if (sortedTraining.length === 0) {
        trainingAoa.push(['—', 'No training sessions on the schedule.', '']);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trainingAoa), 'Training Attendance');

    // —— Captain & Vice Captain History ——
    const capMatches = sessions.filter(s => s.type === 'match' && !s.deleted && (s.captain || s.viceCaptain));
    const sortedCaps = [...capMatches].sort((a, b) => new Date(b.date) - new Date(a.date));
    const capAoa = [
        ['Captain & Vice Captain History'],
        [`Matches with a captain or vice captain set: ${sortedCaps.length}.`],
        [],
        ['Date', 'Opponent', 'Captain', 'Vice captain']
    ];
    for (const m of sortedCaps) {
        const d = m.date ? new Date(m.date) : null;
        capAoa.push([isoDate(d), m.opponent || '', m.captain || '', m.viceCaptain || '']);
    }
    if (sortedCaps.length === 0) {
        capAoa.push(['—', 'No captains or vice captains recorded yet.', '', '']);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(capAoa), 'Captain & Vice Captain History');

    const fname = `team-stats-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fname);
    if (typeof showToast === 'function') {
        showToast('Stats exported to Excel.');
    }
};