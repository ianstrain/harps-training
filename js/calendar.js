// ============================================
// CALENDAR AND THIS WEEK VIEWS
// ============================================

// Change calendar month
window.changeMonth = function(direction) {
    currentCalendarMonth += direction;
    if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    } else if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    }
    renderCalendar();
};

// Render This Week view
function renderThisWeek() {
    const container = document.getElementById('thisweek-container');
    
    // Get the start of this week (Monday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days from Monday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    // Get the end of this week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // Find upcoming sessions this week (from today onwards)
    const upcomingSessions = sessions
        .filter(s => !s.deleted && !s.cancelled)
        .filter(s => {
            const sessionDate = new Date(s.date);
            sessionDate.setHours(0, 0, 0, 0);
            return sessionDate >= today && sessionDate >= weekStart && sessionDate <= weekEnd;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (upcomingSessions.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                <div style="font-size: 48px; margin-bottom: 10px;">📅</div>
                <h3 style="margin: 0 0 10px 0; color: var(--text-primary);">No Upcoming Events This Week</h3>
                <p style="margin: 0;">Check back Monday for next week's schedule</p>
            </div>
        `;
        return;
    }
    
    // Get all active players (needed for attendance lists)
    const activePlayers = players.filter(p => {
        const returning = (p.returning || '').toString().toLowerCase().trim();
        const playerName = (p.player || '').toString().toLowerCase();
        return p.player && 
               p.player !== '?' &&
               !p.deleted &&
               (returning === 'yes' || returning === '1' || returning === 'true') &&
               !playerName.includes('child');
    }).sort((a, b) => a.player.localeCompare(b.player));

    let html = upcomingSessions.map(session => createThisWeekSessionCardHtml(session, activePlayers)).join('');

    container.innerHTML = html;
}

function createThisWeekSessionCardHtml(session, activePlayers) {
    const sessionDate = new Date(session.date);
    
    const attendance = session.attendance || [];
    
    const eventType = session.type === 'match' ? 'Match' : 'Training';
    const eventTitle = session.type === 'match' 
        ? `vs ${session.opponent}` 
        : 'Training Session';
    
    const eventBadgeColor = session.type === 'match' ? '#ef4444' : 'var(--accent)'; // Changed color for matches

    const matchScoreHtml = session.type === 'match' && session.teamScore !== undefined && session.teamScore !== '' 
        ? `
            <div class="match-result-display" style="text-align: center; margin: 15px 0 0;">
                <div class="score-display" style="font-size: 32px; font-weight: bold; color: var(--accent);">
                    ${session.teamScore} - ${session.opponentScore}
                </div>
                ${session.result ? `
                    <div class="result-badge ${session.result}" style="display: inline-block; margin-top: 8px; padding: 6px 16px; border-radius: 16px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
                        ${session.result === 'win' ? 'background: rgba(0, 255, 100, 0.2); color: #00ff64;' : ''}
                        ${session.result === 'draw' ? 'background: rgba(255, 200, 0, 0.2); color: #ffc800;' : ''}
                        ${session.result === 'loss' ? 'background: rgba(255, 50, 50, 0.2); color: #ff3232;' : ''}">
                        ${session.result}
                    </div>
                ` : ''}
            </div>
          `
        : '';
    
    return `
        <div class="thisweek-card" style="max-width: 600px; margin: 0 auto 30px; padding: 20px;">
            <div class="event-header" style="text-align: center; margin-bottom: 30px; padding: 20px; background: var(--bg-section); border-radius: 12px; border: 1px solid var(--border-color);">
                <div class="event-type-badge" style="display: inline-block; padding: 6px 16px; background: ${eventBadgeColor}; color: var(--bg-dark); border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                    ${eventType} ${session.type === 'match' && session.matchType ? `(${session.matchType})` : ''}
                </div>
                <h2 style="margin: 10px 0; font-size: 28px; color: var(--text-primary);">${eventTitle}</h2>
                ${session.type === 'match' && session.cupStage ? `<div class="cup-stage" style="font-size: 16px; color: var(--text-secondary);">${session.cupStage}</div>` : ''}
                <div style="font-size: 18px; color: var(--text-secondary); margin: 12px 0;">
                    📅 ${formatDate(sessionDate)}
                </div>
                <div style="font-size: 20px; color: var(--accent); margin: 8px 0; font-weight: 600;">
                    📍 ${session.location || 'The Aura'}
                </div>
                <div style="font-size: 20px; color: var(--accent); margin: 8px 0; font-weight: 600;">
                    🕐 ${session.time || '7:30 PM - 8:30 PM'}
                </div>
                ${matchScoreHtml}
            </div>
            
            <div class="attendance-section" style="background: var(--bg-section); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color);">
                <h3 style="margin: 0 0 15px 0; color: var(--text-primary); text-align: center;">Player Attendance</h3>
                <div class="attendance-summary" style="text-align: center; margin-bottom: 20px; font-size: 16px; color: var(--text-secondary);">
                    <span style="font-size: 24px; font-weight: bold; color: var(--accent);">${attendance.length}</span> of ${activePlayers.length} players attending
                </div>
                <div class="player-list">
                    ${activePlayers.map(player => {
                        const isAttending = attendance.includes(player.player);
                        return `
                            <div class="player-attendance-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; margin-bottom: 8px; background: var(--bg-card); border-radius: 8px; border: 1px solid ${isAttending ? 'var(--accent)' : 'var(--border-color)'}; transition: all 0.2s ease;">
                                <span style="font-size: 16px; color: var(--text-primary); font-weight: ${isAttending ? '600' : '400'};">${player.player}</span>
                                <label class="attendance-toggle" style="display: flex; align-items: center; cursor: pointer; user-select: none;">
                                    <div class="toggle-switch" style="position: relative; width: 50px; height: 26px;">
                                        <input type="checkbox" 
                                               ${isAttending ? 'checked' : ''}
                                               onchange="handleThisWeekAttendance('${session.id}', '${player.player.replace(/\'/g, "\\'")}', this.checked)"
                                               style="opacity: 0; width: 0; height: 0; position: absolute;">
                                        <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${isAttending ? 'var(--accent)' : 'var(--border-color)'}; transition: 0.3s; border-radius: 26px;">
                                            <span style="position: absolute; content: ''; height: 20px; width: 20px; left: ${isAttending ? '27px' : '3px'}; bottom: 3px; background-color: white; transition: 0.3s; border-radius: 50%;"></span>
                                        </span>
                                    </div>
                                </label>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

// Handle This Week attendance change
window.handleThisWeekAttendance = function(sessionId, playerName, isChecked) {
    console.log(`handleThisWeekAttendance called for session ${sessionId}, player ${playerName}, checked: ${isChecked}`);
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (!session) return;
    
    if (!session.attendance) session.attendance = [];
    
    if (isChecked) {
        if (!session.attendance.includes(playerName)) {
            session.attendance.push(playerName);
        }
    } else {
        session.attendance = session.attendance.filter(name => name !== playerName);
        // Also clear captain if they're not attending
        if (session.captain === playerName) {
            session.captain = '';
        }
        // Clear match goals if they had any
        if (session.matchGoals && session.matchGoals[playerName]) {
            delete session.matchGoals[playerName];
        }
    }
    
    saveMatchData(sessionId);
    renderThisWeek();
    renderSessions();
};

// Render calendar
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    const title = document.getElementById('calendarTitle');
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    title.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    // Get days from previous month
    const prevMonthLastDay = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();
    const prevMonthDays = startDayOfWeek;
    
    // Get days for next month
    const totalCells = Math.ceil((daysInMonth + startDayOfWeek) / 7) * 7;
    const nextMonthDays = totalCells - daysInMonth - startDayOfWeek;
    
    // Build calendar HTML with legend
    let html = `
        <div class="calendar-legend">
            <div class="calendar-legend-item">
                <span class="calendar-legend-dot training"></span>
                <span>Training</span>
            </div>
            <div class="calendar-legend-item">
                <span class="calendar-legend-dot match"></span>
                <span>Match</span>
            </div>
        </div>
    `;
    
    html += '<div class="calendar">';
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Previous month days
    for (let i = prevMonthDays; i > 0; i--) {
        const day = prevMonthLastDay - i + 1;
        html += `<div class="calendar-day other-month"><div class="calendar-day-number">${day}</div></div>`;
    }
    
    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentCalendarYear, currentCalendarMonth, day);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = date.toDateString() === today.toDateString();
        
        // Get events for this day
        const dayEvents = sessions.filter(s => {
            if (s.deleted) return false;
            const sessionDate = new Date(s.date);
            return sessionDate.toDateString() === date.toDateString();
        }).sort((a, b) => {
            // Sort by time if available
            const timeA = a.time || '';
            const timeB = b.time || '';
            return timeA.localeCompare(timeB);
        });
        
        // Determine day type classes for visual indicator
        const hasTraining = dayEvents.some(e => (e.type || 'training') === 'training' && !e.cancelled);
        const hasMatch = dayEvents.some(e => e.type === 'match' && !e.cancelled);
        let dayTypeClass = '';
        if (hasTraining && hasMatch) {
            dayTypeClass = 'has-both';
        } else if (hasMatch) {
            dayTypeClass = 'has-match';
        } else if (hasTraining) {
            dayTypeClass = 'has-training';
        }
        
        html += `<div class="calendar-day ${isToday ? 'today' : ''} ${dayTypeClass}">`;
        html += `<div class="calendar-day-number">${day}</div>`;
        
        // Add session button (only show when logged in and edit mode is potentially available)
        html += `<button class="calendar-day-add-btn" onclick="event.stopPropagation(); addSessionFromCalendar('${dateStr}')" title="Add session on this date">+</button>`;
        
        html += `<div class="calendar-events">`;
        
        dayEvents.forEach(event => {
            const type = event.type || 'training';
            const cancelled = event.cancelled ? 'cancelled' : '';
            let label = '';
            if (type === 'match') {
                label = event.opponent || 'Match';
            } else {
                label = event.time || 'Training';
            }
            html += `<div class="calendar-event ${type} ${cancelled}" onclick="scrollToSession(${event.id})" title="${label}">${label}</div>`;
        });
        
        html += `</div></div>`;
    }
    
    // Next month days
    for (let day = 1; day <= nextMonthDays; day++) {
        html += `<div class="calendar-day other-month"><div class="calendar-day-number">${day}</div></div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Add session from calendar view
window.addSessionFromCalendar = function(dateStr) {
    // Parse the date
    const selectedDate = new Date(dateStr);
    
    // Create a temporary new session with the selected date
    const tempId = 'new-session-' + Date.now();
    
    const newSession = {
        id: null,
        date: selectedDate,
        type: 'training',
        cancelled: false,
        cancelReason: '',
        location: 'The Aura',
        time: '7:30 PM - 8:30 PM',
        desc: '',
        warmup: '',
        drills: '',
        game: '',
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
    
    // Switch to schedule tab to show the new session form
    switchToTab('schedule');
    
    // Scroll to the new session card after a short delay
    setTimeout(() => {
        const newSessionCard = document.querySelector(`.session-card[data-temp-id="${tempId}"]`);
        if (newSessionCard) {
            newSessionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 300);
};

// Scroll to session from calendar
window.scrollToSession = function(sessionId) {
    // Switch to schedule tab
    const scheduleButton = document.querySelector('.tab-button[data-tab="schedule"]');
    if (scheduleButton) {
        scheduleButton.click();
    }
    
    // Scroll to the session
    setTimeout(() => {
        const sessionCard = document.querySelector(`.session-card[data-session="${sessionId}"]`);
        if (sessionCard) {
            sessionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Briefly highlight the card
            sessionCard.style.boxShadow = '0 0 30px rgba(0, 212, 170, 0.5)';
            setTimeout(() => {
                sessionCard.style.boxShadow = '';
            }, 2000);
        }
    }, 300);
};
