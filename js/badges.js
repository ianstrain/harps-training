// ============================================
// ATTENDANCE BADGES AND REWARDS
// ============================================

// Get player attendance badges
window.getPlayerBadges = function(playerName) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Get all past sessions (training only for badges)
    const pastTrainingSessions = sessions.filter(s => {
        if (s.deleted || s.type !== 'training') return false;
        const sessionDate = new Date(s.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate < now;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const badges = [];
    let totalAttended = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let lastAttended = false;
    
    // Calculate attendance stats
    pastTrainingSessions.forEach(session => {
        const attended = session.attendance && session.attendance.includes(playerName);
        if (attended) {
            totalAttended++;
            if (lastAttended) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
            maxStreak = Math.max(maxStreak, currentStreak);
            lastAttended = true;
        } else {
            lastAttended = false;
            currentStreak = 0;
        }
    });
    
    // Award badges based on milestones
    
    // Streak badges
    if (currentStreak >= 10) {
        badges.push({ 
            name: 'Perfect Streak 🔥', 
            description: `${currentStreak} sessions in a row!`,
            tier: 'gold'
        });
    } else if (currentStreak >= 5) {
        badges.push({ 
            name: 'On Fire 🔥', 
            description: `${currentStreak} sessions streak`,
            tier: 'silver'
        });
    } else if (currentStreak >= 3) {
        badges.push({ 
            name: 'Committed 💪', 
            description: `${currentStreak} sessions streak`,
            tier: 'bronze'
        });
    }
    
    // Total attendance badges
    if (totalAttended >= 50) {
        badges.push({ 
            name: 'Legend ⭐', 
            description: '50+ trainings attended',
            tier: 'gold'
        });
    } else if (totalAttended >= 25) {
        badges.push({ 
            name: 'Dedicated 🎖️', 
            description: '25+ trainings attended',
            tier: 'silver'
        });
    } else if (totalAttended >= 10) {
        badges.push({ 
            name: 'Regular 🏅', 
            description: '10+ trainings attended',
            tier: 'bronze'
        });
    }
    
    // Perfect attendance (attended all available sessions)
    if (totalAttended === pastTrainingSessions.length && pastTrainingSessions.length >= 5) {
        badges.push({ 
            name: 'Perfect Attendance 💯', 
            description: 'Never missed a training!',
            tier: 'platinum'
        });
    }
    
    // Attendance percentage badges
    const attendancePercent = pastTrainingSessions.length > 0 
        ? (totalAttended / pastTrainingSessions.length) * 100 
        : 0;
    
    if (attendancePercent >= 90 && pastTrainingSessions.length >= 5) {
        badges.push({ 
            name: 'Always There ⚡', 
            description: '90%+ attendance',
            tier: 'gold'
        });
    }
    
    return {
        badges: badges,
        totalAttended: totalAttended,
        currentStreak: currentStreak,
        maxStreak: maxStreak,
        attendancePercent: Math.round(attendancePercent)
    };
};

// Render badges on player card (HTML snippet)
window.renderPlayerBadges = function(playerName) {
    const badgeData = window.getPlayerBadges(playerName);
    
    if (badgeData.badges.length === 0) {
        return '';
    }
    
    const badgeColors = {
        platinum: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
        gold: 'linear-gradient(135deg, #fde047 0%, #facc15 100%)',
        silver: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
        bronze: 'linear-gradient(135deg, #fdba74 0%, #fb923c 100%)'
    };
    
    return `
        <div class="player-badges" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
            <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                Badges Earned
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${badgeData.badges.map(badge => `
                    <div class="player-badge ${badge.tier}" 
                         style="background: ${badgeColors[badge.tier]}; 
                                color: #1f2937; 
                                padding: 4px 8px; 
                                border-radius: 12px; 
                                font-size: 10px; 
                                font-weight: 700; 
                                display: flex; 
                                align-items: center; 
                                gap: 4px;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                         title="${badge.description}">
                        ${badge.name}
                    </div>
                `).join('')}
            </div>
            ${badgeData.currentStreak > 0 ? `
                <div style="margin-top: 8px; font-size: 10px; color: var(--text-muted); text-align: center;">
                    Current Streak: ${badgeData.currentStreak} 🔥
                </div>
            ` : ''}
        </div>
    `;
};
