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
    
    // Show only the next upcoming session
    const nextSession = upcomingSessions[0];
    const sessionDate = new Date(nextSession.date);
    
    // Get all active players
    const activePlayers = players.filter(p => {
        const returning = (p.returning || '').toString().toLowerCase().trim();
        const playerName = (p.player || '').toString().toLowerCase();
        return p.player && 
               p.player !== '?' &&
               !p.deleted &&
               (returning === 'yes' || returning === '1' || returning === 'true') &&
               !playerName.includes('child');
    }).sort((a, b) => a.player.localeCompare(b.player));
    
    const attendance = nextSession.attendance || [];
    
    const eventType = nextSession.type === 'match' ? 'Match' : 'Training';
    const eventTitle = nextSession.type === 'match' 
        ? `vs ${nextSession.opponent}` 
        : 'Training Session';
    
    const eventBadgeColor = nextSession.type === 'match' ? '#ff6b6b' : 'var(--accent)';
    
    container.innerHTML = `
        <div class="thisweek-card" style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div class="event-header" style="text-align: center; margin-bottom: 30px; padding: 20px; background: var(--bg-section); border-radius: 12px; border: 1px solid var(--border-color);">
                <div class="event-type-badge" style="display: inline-block; padding: 6px 16px; background: ${eventBadgeColor}; color: var(--bg-primary); border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                    ${eventType}
                </div>
                <h2 style="margin: 10px 0; font-size: 28px; color: var(--text-primary);">${eventTitle}</h2>
                <div style="font-size: 18px; color: var(--text-secondary); margin: 12px 0;">
                    📅 ${formatDate(sessionDate)}
                </div>
                <div style="font-size: 20px; color: var(--accent); margin: 8px 0; font-weight: 600;">
                    📍 ${nextSession.location || 'The Aura'}
                </div>
                <div style="font-size: 20px; color: var(--accent); margin: 8px 0; font-weight: 600;">
                    🕐 ${nextSession.time || '7:30 PM - 8:30 PM'}
                </div>
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
                                               onchange="handleThisWeekAttendance('${nextSession.id}', '${player.player.replace(/'/g, "\\'")}', this.checked)"
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
    const session = sessions.find(s => s.id == sessionId);
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
    
    // Build calendar HTML
    let html = '<div class="calendar">';
    
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
        
        html += `<div class="calendar-day ${isToday ? 'today' : ''}">`;
        html += `<div class="calendar-day-number">${day}</div>`;
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
