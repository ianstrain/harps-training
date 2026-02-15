// ============================================
// MATCH LINEUP BUILDER
// ============================================

// Formation templates for 9-a-side football
const FORMATIONS = {
    '3-3-2': {
        name: '3-3-2',
        positions: [
            { id: 'GK', x: 50, y: 90, label: 'GK' },
            { id: 'LCB', x: 30, y: 70, label: 'LB' },
            { id: 'CB', x: 50, y: 70, label: 'CB' },
            { id: 'RCB', x: 70, y: 70, label: 'RB' },
            { id: 'LM', x: 25, y: 45, label: 'LM' },
            { id: 'CM', x: 50, y: 45, label: 'CM' },
            { id: 'RM', x: 75, y: 45, label: 'RM' },
            { id: 'LST', x: 40, y: 15, label: 'ST' },
            { id: 'RST', x: 60, y: 15, label: 'ST' }
        ]
    },
    '3-2-3': {
        name: '3-2-3',
        positions: [
            { id: 'GK', x: 50, y: 90, label: 'GK' },
            { id: 'LCB', x: 30, y: 70, label: 'LB' },
            { id: 'CB', x: 50, y: 70, label: 'CB' },
            { id: 'RCB', x: 70, y: 70, label: 'RB' },
            { id: 'LCM', x: 37, y: 50, label: 'CM' },
            { id: 'RCM', x: 63, y: 50, label: 'CM' },
            { id: 'LW', x: 25, y: 15, label: 'LW' },
            { id: 'ST', x: 50, y: 15, label: 'ST' },
            { id: 'RW', x: 75, y: 15, label: 'RW' }
        ]
    },
    '2-3-3': {
        name: '2-3-3',
        positions: [
            { id: 'GK', x: 50, y: 90, label: 'GK' },
            { id: 'LCB', x: 37, y: 70, label: 'LB' },
            { id: 'RCB', x: 63, y: 70, label: 'RB' },
            { id: 'LM', x: 25, y: 50, label: 'LM' },
            { id: 'CM', x: 50, y: 50, label: 'CM' },
            { id: 'RM', x: 75, y: 50, label: 'RM' },
            { id: 'LW', x: 25, y: 15, label: 'LW' },
            { id: 'ST', x: 50, y: 15, label: 'ST' },
            { id: 'RW', x: 75, y: 15, label: 'RW' }
        ]
    },
    '3-4-1': {
        name: '3-4-1',
        positions: [
            { id: 'GK', x: 50, y: 90, label: 'GK' },
            { id: 'LCB', x: 30, y: 70, label: 'LB' },
            { id: 'CB', x: 50, y: 70, label: 'CB' },
            { id: 'RCB', x: 70, y: 70, label: 'RB' },
            { id: 'LM', x: 20, y: 45, label: 'LM' },
            { id: 'LCM', x: 40, y: 45, label: 'CM' },
            { id: 'RCM', x: 60, y: 45, label: 'CM' },
            { id: 'RM', x: 80, y: 45, label: 'RM' },
            { id: 'ST', x: 50, y: 15, label: 'ST' }
        ]
    }
};

// Show lineup builder for a match
window.showLineupBuilder = function(sessionId) {
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (!session || session.type !== 'match') {
        showToast('Lineup builder is only available for matches', true);
        return;
    }
    
    // Initialize lineup if not exists
    if (!session.lineup) {
        session.lineup = {
            formation: '3-3-2',
            positions: {}
        };
    }
    
    const formation = FORMATIONS[session.lineup.formation || '3-3-2'];
    const attendingPlayers = players.filter(p => 
        !p.deleted && 
        session.attendance && 
        session.attendance.includes(p.player)
    );
    
    const dialogHtml = `
        <div class="lineup-overlay" onclick="closeLineupBuilder()" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <div class="lineup-dialog" onclick="event.stopPropagation()" style="background: var(--bg-card); border-radius: 16px; padding: 24px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: var(--text-primary); font-size: 20px;">⚽ Match Lineup</h3>
                    <button onclick="closeLineupBuilder()" style="background: none; border: none; color: var(--text-secondary); font-size: 24px; cursor: pointer; padding: 0; width: 32px; height: 32px;">×</button>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Formation</label>
                    <select id="formation-selector" onchange="changeFormation(${sessionId}, this.value)" style="width: 100%; padding: 10px; background: var(--bg-section); border: 2px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 14px; cursor: pointer;">
                        ${Object.keys(FORMATIONS).map(key => `
                            <option value="${key}" ${session.lineup.formation === key ? 'selected' : ''}>${key}</option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="lineup-pitch" style="position: relative; width: 100%; height: 500px; background: linear-gradient(180deg, #16a34a 0%, #15803d 100%); border-radius: 8px; margin-bottom: 16px; border: 3px solid #ffffff;">
                    <!-- Pitch markings -->
                    <div style="position: absolute; top: 50%; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.4);"></div>
                    <div style="position: absolute; top: 50%; left: 50%; width: 80px; height: 80px; border: 2px solid rgba(255,255,255,0.4); border-radius: 50%; transform: translate(-50%, -50%);"></div>
                    <div style="position: absolute; top: 0; left: 20%; right: 20%; height: 80px; border: 2px solid rgba(255,255,255,0.4); border-top: none;"></div>
                    <div style="position: absolute; bottom: 0; left: 20%; right: 20%; height: 80px; border: 2px solid rgba(255,255,255,0.4); border-bottom: none;"></div>
                    
                    <!-- Player positions -->
                    ${formation.positions.map(pos => {
                        const assignedPlayer = session.lineup.positions[pos.id] || null;
                        return `
                            <div class="lineup-position" data-position="${pos.id}" style="position: absolute; left: ${pos.x}%; top: ${pos.y}%; transform: translate(-50%, -50%); text-align: center;">
                                <select onchange="assignPlayer(${sessionId}, '${pos.id}', this.value)" style="padding: 6px 8px; background: var(--bg-card); border: 2px solid var(--accent-primary); border-radius: 6px; color: var(--text-primary); font-size: 11px; font-weight: 600; cursor: pointer; min-width: 80px;">
                                    <option value="">${pos.label}</option>
                                    ${attendingPlayers.map(p => `
                                        <option value="${p.player}" ${assignedPlayer === p.player ? 'selected' : ''}>${p.player}</option>
                                    `).join('')}
                                </select>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px; text-align: center;">
                    ${attendingPlayers.length} players attending
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button onclick="saveLineup(${sessionId})" style="flex: 1; padding: 12px; background: var(--accent-primary); color: var(--bg-dark); border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                        Save Lineup
                    </button>
                    <button onclick="copyLineupImage(${sessionId})" style="flex: 1; padding: 12px; background: rgba(14, 165, 233, 0.1); color: var(--accent-secondary); border: 2px solid var(--accent-secondary); border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                        📋 Copy Image
                    </button>
                    <button onclick="downloadLineupImage(${sessionId})" style="flex: 1; padding: 12px; background: rgba(245, 158, 11, 0.1); color: var(--accent-warm); border: 2px solid var(--accent-warm); border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
                        ⬇️ Download
                    </button>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 8px;">
                    <button onclick="clearLineup(${sessionId})" style="flex: 1; padding: 10px; background: transparent; color: var(--text-secondary); border: 2px solid var(--border-color); border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">
                        Clear All
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', dialogHtml);
};

// Change formation
window.changeFormation = function(sessionId, formationKey) {
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (session && session.lineup) {
        session.lineup.formation = formationKey;
        session.lineup.positions = {}; // Clear positions when changing formation
    }
    
    // Refresh the dialog
    closeLineupBuilder();
    setTimeout(() => showLineupBuilder(sessionId), 100);
};

// Assign player to position
window.assignPlayer = function(sessionId, positionId, playerName) {
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (session && session.lineup) {
        if (playerName) {
            // Remove player from any other position first
            Object.keys(session.lineup.positions).forEach(key => {
                if (session.lineup.positions[key] === playerName) {
                    delete session.lineup.positions[key];
                }
            });
            session.lineup.positions[positionId] = playerName;
        } else {
            delete session.lineup.positions[positionId];
        }
    }
};

// Save lineup
window.saveLineup = async function(sessionId) {
    await saveSessionsList();
    showToast('Lineup saved successfully!');
    closeLineupBuilder();
    renderSessions();
};

// Clear lineup
window.clearLineup = function(sessionId) {
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (session && session.lineup) {
        session.lineup.positions = {};
    }
    closeLineupBuilder();
    setTimeout(() => showLineupBuilder(sessionId), 100);
};

// Close lineup builder
window.closeLineupBuilder = function() {
    const overlay = document.querySelector('.lineup-overlay');
    if (overlay) {
        overlay.remove();
    }
};

// Convert lineup to canvas and copy/download
window.generateLineupCanvas = async function(sessionId) {
    const session = sessions.find(s => s.id === parseInt(sessionId));
    if (!session || !session.lineup) {
        showToast('No lineup to export', true);
        return null;
    }
    
    const formation = FORMATIONS[session.lineup.formation || '3-3-2'];
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size (higher for better quality)
    canvas.width = 800;
    canvas.height = 1000;
    
    // Draw pitch background (gradient green)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#16a34a');
    gradient.addColorStop(1, '#15803d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pitch border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
    
    // Draw pitch markings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    
    // Center line
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Center circle
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, Math.PI * 2);
    ctx.stroke();
    
    // Top penalty area
    ctx.strokeRect(canvas.width * 0.2, 0, canvas.width * 0.6, 100);
    
    // Bottom penalty area
    ctx.strokeRect(canvas.width * 0.2, canvas.height - 100, canvas.width * 0.6, 100);
    
    // Draw header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.textAlign = 'center';
    const opponent = session.opponent || 'Match';
    ctx.fillText(`vs ${opponent}`, canvas.width / 2, 50);
    
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText(session.lineup.formation, canvas.width / 2, 85);
    
    // Draw positions and players
    ctx.font = 'bold 18px Inter, sans-serif';
    
    formation.positions.forEach(pos => {
        const x = (pos.x / 100) * canvas.width;
        const y = (pos.y / 100) * canvas.height;
        const playerName = session.lineup.positions[pos.id] || pos.label;
        
        // Draw circle background
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(x, y, 45, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw circle border
        ctx.strokeStyle = '#00d4aa';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Draw player name/position
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Split long names
        if (playerName.length > 12) {
            const words = playerName.split(' ');
            if (words.length > 1) {
                ctx.font = 'bold 14px Inter, sans-serif';
                ctx.fillText(words[0], x, y - 8);
                ctx.fillText(words[words.length - 1], x, y + 8);
            } else {
                ctx.font = 'bold 14px Inter, sans-serif';
                ctx.fillText(playerName.substring(0, 10), x, y - 8);
                ctx.fillText(playerName.substring(10), x, y + 8);
            }
        } else {
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.fillText(playerName, x, y);
        }
    });
    
    // Draw footer with date
    const matchDate = new Date(session.date);
    const dateStr = matchDate.toLocaleDateString('en-IE', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dateStr, canvas.width / 2, canvas.height - 30);
    
    return canvas;
};

// Copy lineup image to clipboard
window.copyLineupImage = async function(sessionId) {
    try {
        const canvas = await generateLineupCanvas(sessionId);
        if (!canvas) return;
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
            try {
                // Copy to clipboard (modern browsers)
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'image/png': blob
                    })
                ]);
                showToast('✅ Lineup copied! Paste into WhatsApp/Messages');
            } catch (err) {
                // Fallback: download if clipboard doesn't work
                console.error('Clipboard failed:', err);
                showToast('Clipboard not supported - downloading instead', true);
                downloadLineupImage(sessionId);
            }
        }, 'image/png');
    } catch (error) {
        console.error('Failed to copy lineup:', error);
        showToast('Failed to copy lineup image', true);
    }
};

// Download lineup image
window.downloadLineupImage = async function(sessionId) {
    try {
        const canvas = await generateLineupCanvas(sessionId);
        if (!canvas) return;
        
        const session = sessions.find(s => s.id === parseInt(sessionId));
        const opponent = session.opponent || 'Match';
        const filename = `lineup-vs-${opponent.replace(/\s+/g, '-')}.png`;
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showToast('✅ Lineup downloaded!');
        }, 'image/png');
    } catch (error) {
        console.error('Failed to download lineup:', error);
        showToast('Failed to download lineup image', true);
    }
};

// Render lineup indicator on match cards
window.renderLineupIndicator = function(session) {
    if (!session.lineup || Object.keys(session.lineup.positions).length === 0) {
        return '';
    }
    
    const assignedCount = Object.keys(session.lineup.positions).length;
    const totalPositions = FORMATIONS[session.lineup.formation || '3-3-2'].positions.length;
    
    return `
        <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(0, 212, 170, 0.15); color: var(--accent-primary); border-radius: 12px; font-size: 11px; font-weight: 600; margin-top: 8px;">
            ⚽ Lineup: ${assignedCount}/${totalPositions} (${session.lineup.formation})
        </div>
    `;
};
