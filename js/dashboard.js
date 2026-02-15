// ============================================
// DASHBOARD QUICK STATS WIDGET
// ============================================

// Render quick stats widget
window.renderQuickStats = function() {
    const container = document.getElementById('quick-stats-widget');
    if (!container) return;
    
    // Calculate team record (W-D-L)
    const completedMatches = sessions.filter(s => 
        s.type === 'match' && 
        !s.deleted && 
        s.teamScore !== undefined && s.teamScore !== '' &&
        s.opponentScore !== undefined && s.opponentScore !== ''
    );
    
    let wins = 0, draws = 0, losses = 0;
    completedMatches.forEach(match => {
        const team = parseInt(match.teamScore) || 0;
        const opponent = parseInt(match.opponentScore) || 0;
        if (team > opponent) wins++;
        else if (team < opponent) losses++;
        else draws++;
    });
    
    // Find next session
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const futureSessions = sessions.filter(s => {
        if (s.deleted || s.cancelled) return false;
        const sessionDate = new Date(s.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate >= now;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const nextSession = futureSessions[0];
    
    // Find top scorer
    let topScorer = { name: 'N/A', goals: 0 };
    players.forEach(p => {
        if (!p.player || p.deleted) return;
        const goals = getPlayerGoals(p.player);
        const totalGoals = getTotalGoals(goals);
        if (totalGoals > topScorer.goals) {
            topScorer = { name: p.player, goals: totalGoals };
        }
    });
    
    // Calculate days until next session
    let daysUntil = 0;
    let nextSessionType = 'Session';
    let nextSessionDetails = 'No upcoming sessions';
    if (nextSession) {
        const sessionDate = new Date(nextSession.date);
        sessionDate.setHours(0, 0, 0, 0);
        daysUntil = Math.ceil((sessionDate - now) / (1000 * 60 * 60 * 24));
        nextSessionType = nextSession.type === 'match' ? 'Match' : 'Training';
        const dateStr = sessionDate.toLocaleDateString('en-IE', { weekday: 'short', month: 'short', day: 'numeric' });
        if (nextSession.type === 'match' && nextSession.opponent) {
            nextSessionDetails = `vs ${nextSession.opponent} - ${dateStr}`;
        } else {
            nextSessionDetails = `${nextSession.location} - ${dateStr}`;
        }
    }
    
    // Recent form (last 5 matches)
    const recentMatches = completedMatches.slice(-5);
    const formString = recentMatches.map(match => {
        const team = parseInt(match.teamScore) || 0;
        const opponent = parseInt(match.opponentScore) || 0;
        if (team > opponent) return 'W';
        if (team < opponent) return 'L';
        return 'D';
    }).join('-') || 'No matches yet';
    
    container.innerHTML = `
        <div class="quick-stats-widget">
            <div class="quick-stat-card record-card">
                <div class="quick-stat-label">Team Record</div>
                <div class="quick-stat-value">
                    <span class="record-wins">${wins}</span>-<span class="record-draws">${draws}</span>-<span class="record-losses">${losses}</span>
                </div>
                <div class="quick-stat-sublabel">Form: ${formString}</div>
            </div>
            
            <div class="quick-stat-card next-session-card">
                <div class="quick-stat-label">Next ${nextSessionType}</div>
                <div class="quick-stat-value countdown-days">${daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}</div>
                <div class="quick-stat-sublabel">${nextSessionDetails}</div>
            </div>
            
            <div class="quick-stat-card top-scorer-card">
                <div class="quick-stat-label">⚽ Top Scorer</div>
                <div class="quick-stat-value">${topScorer.name}</div>
                <div class="quick-stat-sublabel">${topScorer.goals} ${topScorer.goals === 1 ? 'goal' : 'goals'}</div>
            </div>
        </div>
    `;
};
