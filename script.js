
const DEMO_DATA = {
  "Patiala":   { temp:22, feels:20, desc:"partly cloudy", icon:"⛅", humidity:62, wind:14, pressure:1012, uv:5 },
  "Delhi":     { temp:28, feels:31, desc:"haze", icon:"🌫️", humidity:55, wind:11, pressure:1008, uv:7 },
  "Mumbai":    { temp:32, feels:37, desc:"humid & warm", icon:"🌤️", humidity:82, wind:18, pressure:1005, uv:8 },
  "Bengaluru": { temp:24, feels:23, desc:"pleasant", icon:"🌤️", humidity:58, wind:12, pressure:1015, uv:6 },
  "Chennai":   { temp:34, feels:39, desc:"hot & sunny", icon:"☀️", humidity:70, wind:20, pressure:1004, uv:9 },
  "Kolkata":   { temp:30, feels:34, desc:"muggy", icon:"🌥️", humidity:78, wind:9, pressure:1007, uv:6 },
};
const DEMO_FORECAST = [
  { day:"Mon", icon:"⛅", temp:"21°" },
  { day:"Tue", icon:"🌧️", temp:"18°" },
  { day:"Wed", icon:"🌩️", temp:"16°" },
  { day:"Thu", icon:"🌤️", temp:"23°" },
  { day:"Fri", icon:"☀️", temp:"25°" },
];

async function fetchWeather() {
  const city   = document.getElementById('city-input').value.trim();
  const apiKey = document.getElementById('api-key-input').value.trim();
  if (!city) return;

  showLoading();
  try {
    if (apiKey) {
      await fetchLiveWeather(city, apiKey);
    } else {
      await fetchDemoWeather(city);
    }
  } catch(e) {
    showError(e.message);
  }
}

async function fetchLiveWeather(city, apiKey) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
  );
  if (!res.ok) throw new Error('City not found or invalid API key.');
  const d = await res.json();

  const wData = {
    temp:     Math.round(d.main.temp),
    feels:    Math.round(d.main.feels_like),
    desc:     d.weather[0].description,
    icon:     owmIconToEmoji(d.weather[0].icon),
    humidity: d.main.humidity,
    wind:     Math.round(d.wind.speed * 3.6),
    pressure: d.main.pressure,
    uv:       '--',
  };
  renderWeather(city, wData);
  fetchForecast(city, apiKey);
}

async function fetchDemoWeather(city) {
  await new Promise(r => setTimeout(r, 700));
  const key = Object.keys(DEMO_DATA).find(k => city.toLowerCase().includes(k.toLowerCase())) || Object.keys(DEMO_DATA)[0];
  renderWeather(city || key, DEMO_DATA[key]);
  renderForecast(DEMO_FORECAST);
}

async function fetchForecast(city, apiKey) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&cnt=5`
    );
    if (!res.ok) return renderForecast(DEMO_FORECAST);
    const d = await res.json();
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const forecast = d.list.slice(0,5).map(item => ({
      day:  days[new Date(item.dt_txt).getDay()],
      icon: owmIconToEmoji(item.weather[0].icon),
      temp: Math.round(item.main.temp) + '°',
    }));
    renderForecast(forecast);
  } catch { renderForecast(DEMO_FORECAST); }
}

function owmIconToEmoji(icon) {
  const map = {
    '01d':'☀️','01n':'🌙','02d':'⛅','02n':'🌥️',
    '03d':'🌥️','03n':'🌥️','04d':'☁️','04n':'☁️',
    '09d':'🌧️','09n':'🌧️','10d':'🌦️','10n':'🌧️',
    '11d':'⛈️','11n':'⛈️','13d':'🌨️','13n':'🌨️',
    '50d':'🌫️','50n':'🌫️',
  };
  return map[icon] || '🌤️';
}

function showLoading() {
  document.getElementById('weather-display').innerHTML = `<div class="weather-loading"><div class="spinner"></div><p>Fetching live weather…</p></div>`;
  document.getElementById('forecast-display').innerHTML = '';
}

function showError(msg) {
  document.getElementById('weather-display').innerHTML = `<div class="weather-error">⚠️ ${msg}</div>`;
}

function renderWeather(city, d) {
  const now = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  document.getElementById('weather-display').innerHTML = `
    <div class="weather-header">
      <div>
        <div class="weather-location">📍 ${city}</div>
        <div class="weather-time">Updated ${now}</div>
      </div>
    </div>
    <div class="weather-main">
      <div class="weather-icon">${d.icon}</div>
      <div>
        <div class="weather-temp">${d.temp}<sup>°C</sup></div>
        <div class="weather-desc">${d.desc}</div>
      </div>
    </div>
    <div class="weather-grid">
      <div class="weather-stat"><div class="label">Feels Like</div><div class="value">${d.feels}°C</div></div>
      <div class="weather-stat"><div class="label">Humidity</div><div class="value">${d.humidity}%</div></div>
      <div class="weather-stat"><div class="label">Wind</div><div class="value">${d.wind} km/h</div></div>
      <div class="weather-stat"><div class="label">Pressure</div><div class="value">${d.pressure} hPa</div></div>
      <div class="weather-stat"><div class="label">UV Index</div><div class="value">${d.uv}</div></div>
      <div class="weather-stat"><div class="label">Visibility</div><div class="value">Good</div></div>
    </div>`;
}

function renderForecast(forecast) {
  const days = forecast.map(f => `
    <div class="forecast-day">
      <div class="day">${f.day}</div>
      <div class="ico">${f.icon}</div>
      <div class="tmp">${f.temp}</div>
    </div>`).join('');
  document.getElementById('forecast-display').innerHTML = `
    <div class="forecast-title">5-Day Outlook</div>
    <div class="forecast-row">${days}</div>`;
}


function filterSchemes(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.scheme-card').forEach(card => {
    card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
  });
}



document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('city-input').value = 'Patiala';
  fetchDemoWeather('Patiala');
});