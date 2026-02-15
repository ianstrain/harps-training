// ============================================
// WEATHER INTEGRATION
// ============================================

// Weather API configuration
// Note: User should add their own API key from https://openweathermap.org/api
const WEATHER_API_KEY = '324b9efe75ea65abff586cedbc7f9248'; // Replace with actual API key
const WEATHER_CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Get weather data for a session
window.getWeatherForSession = async function(sessionDate, location = 'Letterkenny, IE') {
    // Check if API key is set
    if (WEATHER_API_KEY === 'YOUR_API_KEY_HERE') {
        console.warn('Weather API key not configured');
        return null;
    }
    
    // Check cache first
    const cacheKey = `weather_${sessionDate}_${location}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
        const cachedData = JSON.parse(cached);
        const now = Date.now();
        
        // Return cached data if less than 1 hour old
        if (now - cachedData.timestamp < WEATHER_CACHE_DURATION) {
            return cachedData.weather;
        }
    }
    
    try {
        // Fetch weather forecast
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${WEATHER_API_KEY}&units=metric`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error('Weather API error:', response.status);
            return null;
        }
        
        const data = await response.json();
        
        // Find the forecast closest to the session date/time
        const sessionDateTime = new Date(sessionDate).getTime();
        let closestForecast = null;
        let smallestDiff = Infinity;
        
        data.list.forEach(forecast => {
            const forecastTime = forecast.dt * 1000; // Convert to milliseconds
            const diff = Math.abs(forecastTime - sessionDateTime);
            
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestForecast = forecast;
            }
        });
        
        if (closestForecast) {
            const weather = {
                temp: Math.round(closestForecast.main.temp),
                feelsLike: Math.round(closestForecast.main.feels_like),
                condition: closestForecast.weather[0].main,
                description: closestForecast.weather[0].description,
                icon: closestForecast.weather[0].icon,
                humidity: closestForecast.main.humidity,
                windSpeed: Math.round(closestForecast.wind.speed * 3.6), // Convert m/s to km/h
                rain: closestForecast.rain ? closestForecast.rain['3h'] || 0 : 0
            };
            
            // Cache the weather data
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                weather: weather
            }));
            
            return weather;
        }
    } catch (error) {
        console.error('Failed to fetch weather:', error);
    }
    
    return null;
};

// Get weather icon emoji
function getWeatherEmoji(condition) {
    const emojiMap = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Fog': '🌫️',
        'Haze': '🌫️'
    };
    
    return emojiMap[condition] || '🌤️';
}

// Render weather widget for session
window.renderWeatherWidget = function(weather) {
    if (!weather) {
        return '';
    }
    
    const emoji = getWeatherEmoji(weather.condition);
    const tempColor = weather.temp < 5 ? '#60a5fa' : weather.temp > 20 ? '#f59e0b' : '#10b981';
    
    return `
        <div class="weather-widget" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-section); border-radius: 8px; margin-top: 8px;">
            <span style="font-size: 24px;">${emoji}</span>
            <div style="flex: 1;">
                <div style="font-size: 14px; font-weight: 600; color: var(--text-primary);">
                    ${weather.temp}°C
                </div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: capitalize;">
                    ${weather.description}
                </div>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); text-align: right;">
                <div>Feels ${weather.feelsLike}°C</div>
                ${weather.rain > 0 ? `<div style="color: #60a5fa;">💧 ${weather.rain}mm</div>` : ''}
            </div>
        </div>
    `;
};

// Add weather to session cards (call this when rendering sessions)
window.addWeatherToSessions = async function() {
    // Only fetch weather for future sessions within next 5 days
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    
    sessions.forEach(async session => {
        const sessionDate = new Date(session.date);
        
        if (sessionDate >= now && sessionDate <= fiveDaysFromNow && !session.deleted) {
            const weather = await getWeatherForSession(sessionDate, session.location);
            
            if (weather) {
                const sessionCard = document.querySelector(`.session-card[data-session="${session.id}"]`);
                if (sessionCard) {
                    const metaSection = sessionCard.querySelector('.session-meta');
                    if (metaSection && !metaSection.querySelector('.weather-widget')) {
                        metaSection.insertAdjacentHTML('beforeend', renderWeatherWidget(weather));
                    }
                }
            }
        }
    });
};
