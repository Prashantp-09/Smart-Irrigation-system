// Smart Irrigation System - JavaScript
// Uses OpenWeatherMap API for weather data

// Configuration
const CONFIG = {
    // OpenWeatherMap API Key - Replace with your own key for live data
    // Get free API key at: https://openweathermap.org/api
    apiKey: '', // Leave empty for demo mode with simulated data
    
    // API Base URLs
    currentWeatherUrl: 'https://api.openweathermap.org/data/2.5/weather',
    forecastUrl: 'https://api.openweathermap.org/data/2.5/forecast',
    
    // Irrigation thresholds
    thresholds: {
        highMoisture: 70,
        mediumMoisture: 40,
        lowMoisture: 20,
        highRainChance: 60,
        highTemp: 35,
        lowTemp: 10,
    }
};

// State management
let state = {
    currentWeather: null,
    forecast: null,
    soilMoisture: 65,
    irrigationOn: false,
    lastIrrigation: null,
    isDemoMode: true
};

// DOM Elements
const elements = {
    citySelect: document.getElementById('citySelect'),
    geoBtn: document.getElementById('geoBtn'),
    temp: document.getElementById('temp'),
    weatherIcon: document.getElementById('weatherIcon'),
    weatherDesc: document.getElementById('weatherDesc'),
    locationName: document.getElementById('locationName'),
    humidity: document.getElementById('humidity'),
    wind: document.getElementById('wind'),
    rainfall: document.getElementById('rainfall'),
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    soilMoisture: document.getElementById('soilMoisture'),
    moistureFill: document.getElementById('moistureFill'),
    rainChance: document.getElementById('rainChance'),
    evapotranspiration: document.getElementById('evapotranspiration'),
    recommendation: document.getElementById('recommendation'),
    lastIrrigation: document.getElementById('lastIrrigation'),
    nextIrrigation: document.getElementById('nextIrrigation'),
    forecastGrid: document.getElementById('forecastGrid'),
    irrigationOn: document.getElementById('irrigationOn'),
    irrigationOff: document.getElementById('irrigationOff')
};

// Weather icon mapping
const weatherIcons = {
    '01d': '<i class="fas fa-sun"></i>',
    '01n': '<i class="fas fa-moon"></i>',
    '02d': '<i class="fas fa-cloud-sun"></i>',
    '02n': '<i class="fas fa-cloud-moon"></i>',
    '03d': '<i class="fas fa-cloud"></i>',
    '03n': '<i class="fas fa-cloud"></i>',
    '04d': '<i class="fas fa-clouds"></i>',
    '04n': '<i class="fas fa-clouds"></i>',
    '09d': '<i class="fas fa-cloud-showers-heavy"></i>',
    '09n': '<i class="fas fa-cloud-showers-heavy"></i>',
    '10d': '<i class="fas fa-cloud-rain"></i>',
    '10n': '<i class="fas fa-cloud-rain"></i>',
    '11d': '<i class="fas fa-bolt"></i>',
    '11n': '<i class="fas fa-bolt"></i>',
    '13d': '<i class="fas fa-snowflake"></i>',
    '13n': '<i class="fas fa-snowflake"></i>',
    '50d': '<i class="fas fa-smog"></i>',
    '50n': '<i class="fas fa-smog"></i>'
};

// Initialize application
function init() {
    setupEventListeners();
    // Try to get device location automatically on page load
    if (navigator.geolocation) {
        getDeviceLocation();
    } else {
        loadWeatherData();
    }
}

// Setup event listeners
function setupEventListeners() {
    elements.citySelect.addEventListener('change', () => {
        loadWeatherData();
    });

    elements.irrigationOn.addEventListener('click', () => {
        turnIrrigationOn();
    });

    elements.irrigationOff.addEventListener('click', () => {
        turnIrrigationOff();
    });
    
    elements.geoBtn.addEventListener('click', () => {
        getDeviceLocation();
    });
}

function getDeviceLocation() {
    if (!navigator.geolocation) {
        showNotification('Geolocation not supported', 'error');
        return;
    }
    elements.geoBtn.classList.add('active');
    elements.weatherDesc.textContent = 'Getting location...';
    navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
        (err) => {
            elements.geoBtn.classList.remove('active');
            showNotification('Location error', 'error');
        }
    );
}

async function fetchWeatherByCoords(lat, lon) {
    setLoadingState(true);
    try {
        let cityName = 'Your Location';
        if (CONFIG.apiKey) {
            const gr = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&appid=${CONFIG.apiKey}`);
            if (gr.ok) { const gd = await gr.json(); if (gd[0]) cityName = gd[0].name; }
        }
        if (CONFIG.apiKey) {
            const wr = await fetch(`${CONFIG.currentWeatherUrl}?lat=${lat}&lon=${lon}&appid=${CONFIG.apiKey}&units=metric`);
            if (wr.ok) { const wd = await wr.json(); wd.name = cityName; state.currentWeather = wd; }
            const fr = await fetch(`${CONFIG.forecastUrl}?lat=${lat}&lon=${lon}&appid=${CONFIG.apiKey}&units=metric`);
            if (fr.ok) state.forecast = await fr.json();
            state.isDemoMode = false;
        } else {
            await simDataByCoords(lat, lon, cityName);
            state.isDemoMode = true;
        }
    } catch(e) { await simDataByCoords(lat, lon, 'Your Location'); state.isDemoMode = true; }
    elements.geoBtn.classList.remove('active');
    updateUI(); setLoadingState(false);
}

async function simDataByCoords(lat, lon, city) {
    await new Promise(r => setTimeout(r, 800));
    const rnd = (mn,mx) => Math.floor(Math.random()*(mx-mn)+mn);
    const baseT = 30 - Math.abs(lat)*0.5;
    state.currentWeather = { main:{temp:rnd(baseT-5,baseT+10), humidity:rnd(30,90), pressure:rnd(1000,1020)}, wind:{speed:rnd(1,15)}, weather:[{main:getRandomWeatherType(),description:getWeatherDescription(),icon:getRandomWeatherIcon()}], rain:{'1h':rnd(0,10)}, name:city };
    const fl=[]; for(let i=0;i<40;i++){ fl.push({dt:Math.floor((new Date().getTime()+i*3*60*60*1000)/1000), main:{temp:rnd(baseT-5,baseT+10), humidity:rnd(30,90)}, weather:[{main:getRandomWeatherType(),icon:getRandomWeatherIcon()}], pop:rnd(0,100)/100 }); }
    state.forecast = {list:fl};
}

// Load weather data
async function loadWeatherData() {
    const city = elements.citySelect.value;
    setLoadingState(true);

    try {
        if (CONFIG.apiKey && CONFIG.apiKey.trim() !== '') {
            await fetchWeatherFromAPI(city);
            state.isDemoMode = false;
        } else {
            await fetchSimulatedData(city);
            state.isDemoMode = true;
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        await fetchSimulatedData(city);
        state.isDemoMode = true;
    }

    updateUI();
    setLoadingState(false);
}

// Fetch weather from OpenWeatherMap API
async function fetchWeatherFromAPI(city) {
    const currentResponse = await fetch(
        `${CONFIG.currentWeatherUrl}?q=${city}&appid=${CONFIG.apiKey}&units=metric`
    );
    
    if (!currentResponse.ok) {
        throw new Error('Failed to fetch current weather');
    }
    
    const currentData = await currentResponse.json();
    state.currentWeather = currentData;

    const forecastResponse = await fetch(
        `${CONFIG.forecastUrl}?q=${city}&appid=${CONFIG.apiKey}&units=metric`
    );
    
    if (!forecastResponse.ok) {
        throw new Error('Failed to fetch forecast');
    }
    
    const forecastData = await forecastResponse.json();
    state.forecast = forecastData;
}

// Fetch simulated data for demo
async function fetchSimulatedData(city) {
    await new Promise(resolve => setTimeout(resolve, 800));

    const seed = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (min, max) => Math.floor((seed * 9301 + 49297) % 233280 / 233280 * (max - min) + min);

    state.currentWeather = {
        main: {
            temp: random(15, 35),
            humidity: random(30, 90),
            pressure: random(1000, 1020)
        },
        wind: {
            speed: random(1, 15)
        },
        weather: [
            {
                id: random(200, 800),
                main: getRandomWeatherType(),
                description: getWeatherDescription(),
                icon: getRandomWeatherIcon()
            }
        ],
        rain: {
            '1h': random(0, 10)
        },
        name: city
    };

    const forecastList = [];
    const now = new Date();
    
    for (let i = 0; i < 40; i++) {
        const forecastTime = new Date(now.getTime() + i * 3 * 60 * 60 * 1000);
        forecastList.push({
            dt: Math.floor(forecastTime.getTime() / 1000),
            main: {
                temp: random(15, 35),
                humidity: random(30, 90)
            },
            weather: [
                {
                    main: getRandomWeatherType(),
                    icon: getRandomWeatherIcon()
                }
            ],
            pop: random(0, 100) / 100
        });
    }

    state.forecast = {
        list: forecastList
    };
}

function getRandomWeatherType() {
    const types = ['Clear', 'Clouds', 'Rain', 'Drizzle', 'Thunderstorm'];
    return types[Math.floor(Math.random() * types.length)];
}

function getWeatherDescription() {
    const descriptions = [
        'clear sky', 'few clouds', 'scattered clouds',
        'broken clouds', 'shower rain', 'rain',
        'thunderstorm', 'light rain', 'moderate rain'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function getRandomWeatherIcon() {
    const icons = ['01d', '02d', '03d', '04d', '09d', '10d', '01n', '02n', '03n'];
    return icons[Math.floor(Math.random() * icons.length)];
}

function calculateSoilMoisture(weather, forecast) {
    let moisture = 65;

    if (weather.main.humidity > 70) moisture += 15;
    else if (weather.main.humidity > 50) moisture += 5;
    else moisture -= 10;

    const rainChance = forecast ? calculateRainChance(forecast) : 0;
    if (rainChance > 60) moisture += 20;
    else if (rainChance > 30) moisture += 10;

    if (weather.main.temp > 30) moisture -= 10;
    else if (weather.main.temp > 25) moisture -= 5;

    if (weather.wind.speed > 10) moisture -= 5;

    return Math.max(0, Math.min(100, moisture));
}

function calculateRainChance(forecast) {
    if (!forecast || !forecast.list) return 0;
    
    let totalPop = 0;
    let count = 0;
    
    forecast.list.slice(0, 8).forEach(item => {
        totalPop += (item.pop || 0) * 100;
        count++;
    });
    
    return count > 0 ? Math.round(totalPop / count) : 0;
}

function calculateEvapotranspiration(weather) {
    const temp = weather.main.temp;
    const humidity = weather.main.humidity;
    const wind = weather.wind.speed;
    
    let et0 = 0.0023 * (temp + 17.8) * Math.sqrt(temp - 10) * (wind + 2);
    
    if (humidity < 30) et0 *= 1.2;
    else if (humidity > 70) et0 *= 0.8;
    
    return Math.max(0.5, Math.min(15, et0)).toFixed(1);
}

function generateRecommendation(weather, forecast) {
    const moisture = state.soilMoisture;
    const rainChance = forecast ? calculateRainChance(forecast) : 0;
    const temp = weather.main.temp;

    let recommendation = {
        icon: '',
        text: '',
        status: 'neutral'
    };

    if (rainChance > CONFIG.thresholds.highRainChance) {
        recommendation = {
            icon: '<i class="fas fa-cloud-rain"></i>',
            text: `Rain expected (${rainChance}% chance). Skip irrigation today to conserve water.`,
            status: 'skip'
        };
    } else if (moisture > CONFIG.thresholds.highMoisture) {
        recommendation = {
            icon: '<i class="fas fa-check-circle"></i>',
            text: `Soil moisture is good (${Math.round(moisture)}%). No irrigation needed today.`,
            status: 'ok'
        };
    } else if (moisture < CONFIG.thresholds.lowMoisture) {
        recommendation = {
            icon: '<i class="fas fa-exclamation-triangle"></i>',
            text: `Low soil moisture (${Math.round(moisture)}%). Irrigation strongly recommended!`,
            status: 'required'
        };
    } else if (temp > CONFIG.thresholds.highTemp) {
        recommendation = {
            icon: '<i class="fas fa-fire"></i>',
            text: `High temperature (${temp}°C) increasing water demand. Consider light irrigation.`,
            status: 'suggested'
        };
    } else if (moisture < CONFIG.thresholds.mediumMoisture) {
        recommendation = {
            icon: '<i class="fas fa-info-circle"></i>',
            text: `Moderate soil moisture (${Math.round(moisture)}%). Light irrigation recommended.`,
            status: 'suggested'
        };
    } else {
        recommendation = {
            icon: '<i class="fas fa-check"></i>',
            text: `Conditions are optimal. Regular irrigation schedule maintained.`,
            status: 'ok'
        };
    }

    return recommendation;
}

function updateUI() {
    const weather = state.currentWeather;
    const forecast = state.forecast;

    if (!weather) return;

    elements.temp.textContent = Math.round(weather.main.temp);
    elements.weatherDesc.textContent = weather.weather[0].description;
    elements.locationName.textContent = weather.name;
    elements.humidity.textContent = `${weather.main.humidity}%`;
    elements.wind.textContent = `${weather.wind.speed} m/s`;
    elements.rainfall.textContent = `${weather.rain?.['1h'] || 0} mm`;
    
    const iconCode = weather.weather[0].icon;
    elements.weatherIcon.innerHTML = weatherIcons[iconCode] || '<i class="fas fa-sun"></i>';

    state.soilMoisture = calculateSoilMoisture(weather, forecast);
    const rainChance = forecast ? calculateRainChance(forecast) : 0;
    const evap = calculateEvapotranspiration(weather);
    const recommendation = generateRecommendation(weather, forecast);

    elements.soilMoisture.textContent = `${Math.round(state.soilMoisture)}%`;
    elements.moistureFill.style.width = `${state.soilMoisture}%`;
    elements.rainChance.textContent = `${rainChance}%`;
    elements.evapotranspiration.textContent = `${evap} mm/day`;

    if (state.irrigationOn) {
        elements.statusIndicator.className = 'status-indicator on';
        elements.statusText.textContent = 'Irrigation ON';
    } else if (recommendation.status === 'required' || recommendation.status === 'suggested') {
        elements.statusIndicator.className = 'status-indicator off';
        elements.statusText.textContent = 'Recommendation: ON';
    } else {
        elements.statusIndicator.className = 'status-indicator';
        elements.statusText.textContent = 'Recommendation: OFF';
    }

    elements.recommendation.innerHTML = `
        <div class="rec-icon">${recommendation.icon}</div>
        <p class="rec-text">${recommendation.text}</p>
    `;

    updateForecast(forecast);
    updateNextIrrigation(recommendation);
}

function updateForecast(forecast) {
    if (!forecast || !forecast.list) {
        elements.forecastGrid.innerHTML = '<p class="error-message">Forecast data unavailable</p>';
        return;
    }

    const dailyForecasts = [];
    const seenDays = new Set();

    forecast.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (!seenDays.has(day) && dailyForecasts.length < 7) {
            seenDays.add(day);
            dailyForecasts.push({
                day: day,
                temp: Math.round(item.main.temp),
                icon: weatherIcons[item.weather[0].icon] || '<i class="fas fa-sun"></i>',
                rain: Math.round((item.pop || 0) * 100)
            });
        }
    });

    elements.forecastGrid.innerHTML = dailyForecasts.map(fc => `
        <div class="forecast-card">
            <div class="forecast-day">${fc.day}</div>
            <div class="forecast-icon">${fc.icon}</div>
            <div class="forecast-temp">${fc.temp}°C</div>
            <div class="forecast-rain"><i class="fas fa-tint"></i> ${fc.rain}%</div>
        </div>
    `).join('');
}

function updateNextIrrigation(recommendation) {
    const now = new Date();
    
    if (state.irrigationOn) {
        elements.lastIrrigation.textContent = 'Just now';
    } else {
        elements.lastIrrigation.textContent = state.lastIrrigation || 'Never';
    }

    if (recommendation.status === 'required' || recommendation.status === 'suggested') {
        elements.nextIrrigation.textContent = 'Now';
    } else if (recommendation.status === 'skip') {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(6, 0, 0, 0);
        elements.nextIrrigation.textContent = tomorrow.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } else {
        const nextTime = new Date(now);
        nextTime.setHours(nextTime.getHours() + 6);
        elements.nextIrrigation.textContent = nextTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

function turnIrrigationOn() {
    state.irrigationOn = true;
    state.lastIrrigation = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    elements.statusIndicator.className = 'status-indicator on';
    elements.statusText.textContent = 'Irrigation ON';
    
    state.soilMoisture = Math.min(100, state.soilMoisture + 15);
    elements.soilMoisture.textContent = `${Math.round(state.soilMoisture)}%`;
    elements.moistureFill.style.width = `${state.soilMoisture}%`;
    
    elements.lastIrrigation.textContent = 'Just now';
    
    showNotification('Irrigation turned ON', 'success');
}

function turnIrrigationOff() {
    state.irrigationOn = false;
    
    elements.statusIndicator.className = 'status-indicator off';
    elements.statusText.textContent = 'Irrigation OFF';
    
    showNotification('Irrigation turned OFF', 'info');
}

function showNotification(message, type) {
    console.log(`[${type.toUpperCase()}] ${message}`);
}

function setLoadingState(isLoading) {
    const elementsToUpdate = [
        elements.temp,
        elements.humidity,
        elements.wind,
        elements.rainfall,
        elements.soilMoisture,
        elements.rainChance,
        elements.evapotranspiration
    ];

    elementsToUpdate.forEach(el => {
        if (isLoading) {
            el.classList.add('loading');
        } else {
            el.classList.remove('loading');
        }
    });

    if (isLoading) {
        elements.weatherDesc.textContent = 'Loading weather data...';
    }
}

setInterval(() => {
    loadWeatherData();
}, 10 * 60 * 1000);

document.addEventListener('DOMContentLoaded', init);
