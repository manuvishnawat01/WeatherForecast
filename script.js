
const API_KEY = '86ac1d2915c082784671577a1d486651'; 
let currentUnit = 'metric'; 

const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const celsiusBtn = document.getElementById('celsius-btn');
const fahrenheitBtn = document.getElementById('fahrenheit-btn');

const locationName = document.getElementById('location-name');
const weatherIcon = document.getElementById('weather-icon');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weather-description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const forecastContainer = document.getElementById('forecast');

const iconMap = {
    '01d': 'fas fa-sun',
    '01n': 'fas fa-moon',
    '02d': 'fas fa-cloud-sun',   
    '02n': 'fas fa-cloud-moon',  
    '03d': 'fas fa-cloud',       
    '03n': 'fas fa-cloud',
    '04d': 'fas fa-cloud',       
    '04n': 'fas fa-cloud',
    '09d': 'fas fa-cloud-rain',  
    '09n': 'fas fa-cloud-rain',
    '10d': 'fas fa-cloud-sun-rain', 
    '10n': 'fas fa-cloud-moon-rain', 
    '11d': 'fas fa-bolt',        
    '11n': 'fas fa-bolt',
    '13d': 'fas fa-snowflake',   
    '13n': 'fas fa-snowflake',
    '50d': 'fas fa-smog',      
    '50n': 'fas fa-smog'
};

searchBtn.addEventListener('click', searchWeather);
locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});
locationBtn.addEventListener('click', getLocationWeather);
celsiusBtn.addEventListener('click', toggleUnit);
fahrenheitBtn.addEventListener('click', toggleUnit);


function searchWeather() {
    const location = locationInput.value.trim();
    if (location) {
        getWeatherData(location);
    } else {
        alert('Please enter a location');
    }
}

function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                getWeatherDataByCoords(latitude, longitude);
            },
            (error) => {
                showError('Unable to retrieve your location. Please enable location services or search manually.');
                console.error('Geolocation error:', error);
            }
        );
    } else {
        showError('Geolocation is not supported by your browser. Please search manually.');
    }
}

function toggleUnit(e) {
    if ((e.target.id === 'celsius-btn' && currentUnit !== 'metric') || 
        (e.target.id === 'fahrenheit-btn' && currentUnit !== 'imperial')) {
        
        currentUnit = e.target.id === 'celsius-btn' ? 'metric' : 'imperial';
        celsiusBtn.classList.toggle('active', currentUnit === 'metric');
        fahrenheitBtn.classList.toggle('active', currentUnit === 'imperial');
        
        if (locationName.textContent !== 'Search for a location') {
            const location = locationName.textContent.split(',')[0].trim();
            getWeatherData(location);
        }
    }
}

async function getWeatherData(location) {
    try {
        showLoading(true);
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=${currentUnit}&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Location not found');
        }
        
        const data = await response.json();
        displayCurrentWeather(data);
        getForecastData(data.coord.lat, data.coord.lon);
    } catch (error) {
        showError(`Error: ${error.message}. Please check the location and try again.`);
        console.error('Fetch error:', error);
    } finally {
        showLoading(false);
    }
}


async function getWeatherDataByCoords(lat, lon) {
    try {
        showLoading(true);
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Weather data not available for this location');
        }
        
        const data = await response.json();
        displayCurrentWeather(data);
        getForecastData(lat, lon);
    } catch (error) {
        showError('Error fetching weather data for your location.');
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}


async function getForecastData(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Forecast data not available');
        }
        
        const data = await response.json();
        displayForecast(data);
    } catch (error) {
        console.error('Error fetching forecast:', error);
        forecastContainer.innerHTML = '<p>Forecast not available</p>';
    }
}


function displayCurrentWeather(data) {
    locationName.textContent = `${data.name}, ${data.sys.country || ''}`;
    
    const iconCode = data.weather[0].icon;
    weatherIcon.className = iconMap[iconCode] || 'fas fa-question';
    
    temperature.textContent = `${Math.round(data.main.temp)}°`;
    weatherDescription.textContent = data.weather[0].description;
    humidity.textContent = `${data.main.humidity}%`;
    
    
    const windUnit = currentUnit === 'metric' ? 'km/h' : 'mph';
    const speed = currentUnit === 'metric' ? data.wind.speed * 3.6 : data.wind.speed * 2.237;
    windSpeed.textContent = `${Math.round(speed)} ${windUnit}`;
}

function displayForecast(data) {
    forecastContainer.innerHTML = '';

    const dailyForecasts = [];
    const daysAdded = new Set();
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const hour = date.getHours();
        if (!daysAdded.has(day)) {
            daysAdded.add(day);
            dailyForecasts.push({
                day,
                temp: item.main.temp,
                icon: item.weather[0].icon,
                description: item.weather[0].description
            });
        }
    });

    dailyForecasts.slice(0, 5).forEach(forecast => {
        const iconClass = iconMap[forecast.icon] || 'fas fa-question';
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-day">${forecast.day}</div>
            <div class="forecast-icon"><i class="${iconClass}"></i></div>
            <div class="forecast-temp">${Math.round(forecast.temp)}°</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
}

function showLoading(isLoading) {
    if (isLoading) {
        locationName.textContent = 'Loading...';
        temperature.textContent = '--°';
        weatherDescription.textContent = '';
        humidity.textContent = '--%';
        windSpeed.textContent = '-- km/h';
        weatherIcon.className = 'fas fa-spinner fa-spin';
    }
}

function showError(message) {
    alert(message); 
    locationName.textContent = 'Search for a location';
    temperature.textContent = '--°';
    weatherDescription.textContent = '';
    humidity.textContent = '--%';
    windSpeed.textContent = '-- km/h';
    weatherIcon.className = 'fas fa-question';
    forecastContainer.innerHTML = '';
}

getWeatherData('London');