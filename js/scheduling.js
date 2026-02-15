// ============================================
// SMART SCHEDULING FEATURES
// ============================================

// Check for scheduling conflicts
window.checkScheduleConflicts = function(sessionDate, excludeSessionId = null) {
    const conflicts = [];
    const checkDate = new Date(sessionDate);
    checkDate.setHours(0, 0, 0, 0);
    
    sessions.forEach(session => {
        if (session.deleted || (excludeSessionId && session.id === excludeSessionId)) {
            return;
        }
        
        const sessionDateObj = new Date(session.date);
        sessionDateObj.setHours(0, 0, 0, 0);
        
        if (checkDate.getTime() === sessionDateObj.getTime()) {
            conflicts.push({
                id: session.id,
                type: session.type,
                location: session.location,
                opponent: session.opponent,
                time: session.time
            });
        }
    });
    
    return conflicts;
};

// Copy session as template
window.copySessionAsTemplate = function(sessionId) {
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (!session) {
        showToast('Session not found', true);
        return null;
    }
    
    return {
        type: session.type,
        location: session.location || 'The Aura',
        time: session.time || '7:30 PM',
        warmup: session.warmup || '',
        drills: session.drills || '',
        game: session.game || '',
        opponent: session.opponent || '',
        matchType: session.matchType || '',
        cupStage: session.cupStage || ''
    };
};

// Bulk create sessions
window.bulkCreateSessions = function(startDate, endDate, dayOfWeek, template) {
    const newSessions = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    // Find the first occurrence of the target day of week
    while (currentDate.getDay() !== dayOfWeek && currentDate <= end) {
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    let sessionCounter = sessions.length > 0 ? Math.max(...sessions.map(s => s.id)) + 1 : 1;
    
    // Create sessions for each occurrence
    while (currentDate <= end) {
        // Check for conflicts
        const conflicts = checkScheduleConflicts(currentDate);
        
        if (conflicts.length === 0) {
            const newSession = {
                id: sessionCounter++,
                date: new Date(currentDate),
                type: template.type || 'training',
                location: template.location || 'The Aura',
                time: template.time || '7:30 PM',
                warmup: template.warmup || '',
                drills: template.drills || '',
                game: template.game || '',
                desc: template.desc || '',
                opponent: template.opponent || '',
                matchType: template.matchType || '',
                cupStage: template.cupStage || '',
                kickOffTime: template.kickOffTime || '',
                attendance: [],
                captain: '',
                matchGoals: {},
                teamScore: '',
                opponentScore: '',
                result: '',
                cleanSheet: false,
                cancelled: false,
                cancelReason: '',
                deleted: false
            };
            
            newSessions.push(newSession);
        }
        
        // Move to next week
        currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return newSessions;
};

// Show conflict warning
window.showConflictWarning = function(conflicts) {
    if (conflicts.length === 0) return '';
    
    return `
        <div class="conflict-warning" style="background: rgba(239, 68, 68, 0.1); border: 2px solid #ef4444; border-radius: 8px; padding: 12px; margin: 12px 0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 18px;">⚠️</span>
                <strong style="color: #ef4444;">Scheduling Conflict Detected!</strong>
            </div>
            <div style="font-size: 13px; color: var(--text-secondary);">
                ${conflicts.length} session(s) already scheduled on this date:
            </div>
            <ul style="margin: 8px 0 0 24px; font-size: 12px; color: var(--text-secondary);">
                ${conflicts.map(c => `
                    <li>${c.type === 'match' ? `Match vs ${c.opponent}` : `Training at ${c.location}`} - ${c.time}</li>
                `).join('')}
            </ul>
        </div>
    `;
};

// Handle bulk create dialog
window.showBulkCreateDialog = function() {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const dialogHtml = `
        <div class="bulk-create-overlay" onclick="closeBulkCreateDialog()" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center;">
            <div class="bulk-create-dialog" onclick="event.stopPropagation()" style="background: var(--bg-card); border-radius: 16px; padding: 24px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h3 style="margin: 0 0 20px 0; color: var(--text-primary); font-size: 20px;">Bulk Create Sessions</h3>
                
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Start Date</label>
                        <input type="date" id="bulk-start-date" value="${today.toISOString().split('T')[0]}" style="width: 100%; padding: 10px; background: var(--bg-section); border: 2px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px;">
                    </div>
                    
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">End Date</label>
                        <input type="date" id="bulk-end-date" value="${nextMonth.toISOString().split('T')[0]}" style="width: 100%; padding: 10px; background: var(--bg-section); border: 2px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px;">
                    </div>
                    
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Day of Week</label>
                        <select id="bulk-day-of-week" style="width: 100%; padding: 10px; background: var(--bg-section); border: 2px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; cursor: pointer;">
                            <option value="0">Sunday</option>
                            <option value="1">Monday</option>
                            <option value="2" selected>Tuesday</option>
                            <option value="3">Wednesday</option>
                            <option value="4">Thursday</option>
                            <option value="5">Friday</option>
                            <option value="6">Saturday</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Session Type</label>
                        <select id="bulk-session-type" style="width: 100%; padding: 10px; background: var(--bg-section); border: 2px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; cursor: pointer;">
                            <option value="training">Training</option>
                            <option value="match">Match</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Location</label>
                        <input type="text" id="bulk-location" value="The Aura" style="width: 100%; padding: 10px; background: var(--bg-section); border: 2px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px;">
                    </div>
                    
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Time</label>
                        <input type="text" id="bulk-time" value="7:30 PM" style="width: 100%; padding: 10px; background: var(--bg-section); border: 2px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px;">
                    </div>
                    
                    <div id="bulk-preview" style="background: var(--bg-section); border-radius: 8px; padding: 12px; display: none;">
                        <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">Preview:</div>
                        <div id="bulk-preview-content" style="font-size: 13px; color: var(--text-primary);"></div>
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin-top: 8px;">
                        <button onclick="executeBulkCreate()" style="flex: 1; padding: 12px; background: var(--accent-primary); color: var(--bg-dark); border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                            Create Sessions
                        </button>
                        <button onclick="closeBulkCreateDialog()" style="flex: 1; padding: 12px; background: transparent; color: var(--text-primary); border: 2px solid var(--border-color); border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', dialogHtml);
    
    // Add preview update listener
    ['bulk-start-date', 'bulk-end-date', 'bulk-day-of-week'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', updateBulkPreview);
    });
    updateBulkPreview();
};

function updateBulkPreview() {
    const startDate = new Date(document.getElementById('bulk-start-date').value);
    const endDate = new Date(document.getElementById('bulk-end-date').value);
    const dayOfWeek = parseInt(document.getElementById('bulk-day-of-week').value);
    
    let count = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate.getDay() !== dayOfWeek && currentDate <= endDate) {
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    while (currentDate <= endDate) {
        count++;
        currentDate.setDate(currentDate.getDate() + 7);
    }
    
    const preview = document.getElementById('bulk-preview');
    const previewContent = document.getElementById('bulk-preview-content');
    
    if (count > 0) {
        preview.style.display = 'block';
        previewContent.textContent = `Will create ${count} session(s)`;
    } else {
        preview.style.display = 'none';
    }
}

window.updateBulkPreview = updateBulkPreview;

window.executeBulkCreate = async function() {
    const startDate = new Date(document.getElementById('bulk-start-date').value);
    const endDate = new Date(document.getElementById('bulk-end-date').value);
    const dayOfWeek = parseInt(document.getElementById('bulk-day-of-week').value);
    const template = {
        type: document.getElementById('bulk-session-type').value,
        location: document.getElementById('bulk-location').value,
        time: document.getElementById('bulk-time').value
    };
    
    const newSessions = bulkCreateSessions(startDate, endDate, dayOfWeek, template);
    
    if (newSessions.length === 0) {
        showToast('No sessions created - check for conflicts or date range', true);
        return;
    }
    
    // Add new sessions to the sessions array
    sessions.push(...newSessions);
    
    // Save to Firebase
    await saveSessionsList();
    
    showToast(`Created ${newSessions.length} sessions successfully!`);
    closeBulkCreateDialog();
    renderSessions();
};

window.closeBulkCreateDialog = function() {
    const overlay = document.querySelector('.bulk-create-overlay');
    if (overlay) {
        overlay.remove();
    }
};
