// ============================================
// DASHBOARD QUICK STATS WIDGET
// ============================================

function getDashboardMatchKind(session) {
    const t = session.matchType || 'friendly';
    if (t === 'league') return 'league';
    if (t === 'cup') return 'cup';
    return 'friendly';
}

function recordFromScores(matches) {
    let wins = 0, draws = 0, losses = 0;
    matches.forEach(match => {
        const team = parseInt(match.teamScore) || 0;
        const opponent = parseInt(match.opponentScore) || 0;
        if (team > opponent) wins++;
        else if (team < opponent) losses++;
        else draws++;
    });
    return { wins, draws, losses };
}

function formStringFromScores(matches) {
    const sorted = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));
    const last5 = sorted.slice(-5);
    if (last5.length === 0) return '—';
    return last5.map(match => {
        const team = parseInt(match.teamScore) || 0;
        const opponent = parseInt(match.opponentScore) || 0;
        if (team > opponent) return 'W';
        if (team < opponent) return 'L';
        return 'D';
    }).join('-');
}

function formatRecordHtml(w, d, l) {
    if (w + d + l === 0) return '<span class="record-empty">—</span>';
    return `<span class="record-wins">${w}</span>-<span class="record-draws">${d}</span>-<span class="record-losses">${l}</span>`;
}

// Render quick stats widget
window.renderQuickStats = function() {
    const container = document.getElementById('quick-stats-widget');
    if (!container) return;
    
    const completedMatches = sessions.filter(s =>
        s.type === 'match' &&
        !s.deleted &&
        s.teamScore !== undefined && s.teamScore !== '' &&
        s.opponentScore !== undefined && s.opponentScore !== ''
    );

    const leagueCompleted = completedMatches.filter(s => getDashboardMatchKind(s) === 'league');
    const friendlyCompleted = completedMatches.filter(s => getDashboardMatchKind(s) === 'friendly');
    const cupCompleted = completedMatches.filter(s => getDashboardMatchKind(s) === 'cup');
    const hasCupScheduled = sessions.some(s => s.type === 'match' && !s.deleted && getDashboardMatchKind(s) === 'cup');

    const leagueRec = recordFromScores(leagueCompleted);
    const friendlyRec = recordFromScores(friendlyCompleted);
    const cupRec = recordFromScores(cupCompleted);

    const formLines = [];
    if (leagueCompleted.length) formLines.push(`League form: ${formStringFromScores(leagueCompleted)}`);
    if (friendlyCompleted.length) formLines.push(`Friendly form: ${formStringFromScores(friendlyCompleted)}`);
    if (cupCompleted.length) formLines.push(`Cup form: ${formStringFromScores(cupCompleted)}`);
    const formBlock = formLines.length ? formLines.join('<br>') : (completedMatches.length ? '' : 'No matches yet');
    
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
    
    container.innerHTML = `
        <div class="quick-stats-widget">
            <div class="quick-stat-card record-card">
                <div class="quick-stat-label">Team Record</div>
                <div class="record-breakdown">
                    <div class="record-breakdown-row">
                        <span class="record-breakdown-label">League</span>
                        <span class="record-breakdown-value">${formatRecordHtml(leagueRec.wins, leagueRec.draws, leagueRec.losses)}</span>
                    </div>
                    <div class="record-breakdown-row">
                        <span class="record-breakdown-label">Friendly</span>
                        <span class="record-breakdown-value">${formatRecordHtml(friendlyRec.wins, friendlyRec.draws, friendlyRec.losses)}</span>
                    </div>
                    ${hasCupScheduled ? `
                    <div class="record-breakdown-row">
                        <span class="record-breakdown-label">Cup</span>
                        <span class="record-breakdown-value">${formatRecordHtml(cupRec.wins, cupRec.draws, cupRec.losses)}</span>
                    </div>` : ''}
                </div>
                <div class="quick-stat-sublabel record-form-sublabel">${formBlock}</div>
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
