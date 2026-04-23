const API_KEY = "bf17a9f15d84870e4a892abf79f59cd5";

async function fetchWeather() {
  const cityInput = document.getElementById('city-input');
  const weatherDisplay = document.getElementById('weather-display');
  if (!cityInput || !weatherDisplay) return;

  const city = cityInput.value.trim();
  if (!city) {
    weatherDisplay.innerHTML = '<div class="weather-loading"><p>⚠️ Enter a city name.</p></div>';
    return;
  }

  weatherDisplay.innerHTML = '<div class="weather-loading"><div class="spinner"></div></div>';

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error('City not found');
    const data = await response.json();

    weatherDisplay.innerHTML = `
      <div class="weather-result-card">
        <div class="weather-main-info">
          <div class="weather-city">${data.name}, ${data.sys.country}</div>
          <div class="weather-temp-large">${Math.round(data.main.temp)}°C</div>
          <div class="weather-condition">${data.weather[0].main}</div>
        </div>
        <div class="weather-stats-grid">
          <div class="w-stat"><span>💧 Humidity</span><strong>${data.main.humidity}%</strong></div>
          <div class="w-stat"><span>🌬️ Wind</span><strong>${data.wind.speed} m/s</strong></div>
        </div>
      </div>
    `;
  } catch (error) {
    weatherDisplay.innerHTML = `<div class="weather-loading"><p>❌ Not found.</p></div>`;
  }
}

/* ─── Crop Disease Detection — Teachable Machine (TensorFlow.js) ─── */

// ✅ Your Teachable Machine model URL (single trailing slash, no double //)
const TM_MODEL_URL = 'https://teachablemachine.withgoogle.com/models/f2OsNrtUE/';

// Sentinel used to detect "not configured yet"
const TM_PLACEHOLDER = 'YOUR_TEACHABLE_MACHINE_MODEL_URL/';

let tmModel = null;

/* ─── Per-class advice lookup ─────────────────────────────────────── */
const DISEASE_ADVICE = {

  // ── Tomato ──────────────────────────────────────────────────────
  'tomatao healthy':
    `✅ Your tomato plant looks healthy!\n\n` +
    `🛡️ Keep it up: Water at the base (avoid wetting leaves), maintain consistent moisture, and stake plants for good airflow.\n\n` +
    `🌿 Weekly care: Scout for early spots or curling leaves. Apply neem oil spray (5ml/litre) fortnightly as a preventive measure.`,

  'tomato blight':
    `⚠️ Tomato Blight detected — act quickly to prevent spread.\n\n` +
    `🛡️ Prevention: Remove and destroy all infected leaves immediately. Avoid overhead watering. Ensure wide spacing between plants for airflow.\n\n` +
    `🌿 Biological control: Spray neem oil (5ml/litre) every 7 days. Bacillus subtilis-based biosprays help suppress early infection.\n\n` +
    `🧪 Chemical control: Apply Mancozeb or Chlorothalonil fungicide every 7–10 days during wet weather. Alternate between two fungicides to prevent resistance. Remove severely infected plants entirely.`,

  // ── Rice ────────────────────────────────────────────────────────
  'rice healthy':
    `✅ Your rice crop looks healthy!\n\n` +
    `🛡️ Keep it up: Maintain proper water levels, avoid excess nitrogen, and drain fields periodically to reduce disease pressure.\n\n` +
    `🌿 Weekly care: Scout for yellowing, water-soaked lesions, or unusual spots at the leaf margins. Early detection is key.`,

  'rice rust':
    `⚠️ Rice Rust detected on your crop.\n\n` +
    `🛡️ Prevention: Use certified disease-resistant seed varieties. Avoid high-density planting and excess nitrogen fertilisation which promote rust spread.\n\n` +
    `🌿 Biological control: Seed treatment with Pseudomonas fluorescens or Trichoderma viride reduces early rust infection pressure.\n\n` +
    `🧪 Chemical control: Spray propiconazole (1ml/litre) or hexaconazole at first sign of reddish-brown pustules on leaves. Repeat after 14 days if needed.`,

  // ── Corn / Maize ────────────────────────────────────────────────
  'corn healty':
    `✅ Your corn crop looks healthy!\n\n` +
    `🛡️ Keep it up: Ensure balanced NPK fertilisation based on soil test, maintain adequate spacing, and rotate crops each season.\n\n` +
    `🌿 Weekly care: Check lower leaves for any grey or tan lesions — early blight typically starts from the bottom of the plant upwards.`,

  'corn blight':
    `⚠️ Corn Blight detected — take action before it spreads to the entire field.\n\n` +
    `🛡️ Prevention: Plant resistant hybrid varieties. Avoid planting corn after corn in the same field — rotate with legumes or other crops.\n\n` +
    `🌿 Biological control: Trichoderma-based soil treatment at planting reduces overall disease pressure. Remove and destroy infected lower leaves early.\n\n` +
    `🧪 Chemical control: Apply azoxystrobin or propiconazole fungicide at early tassel stage. One or two sprays at 14-day intervals are usually sufficient.`,

  // ── Potato ──────────────────────────────────────────────────────
  'potato healhty':
    `✅ Your potato crop looks healthy!\n\n` +
    `🛡️ Keep it up: Hill soil around stems, maintain consistent irrigation, and avoid waterlogging which encourages blight.\n\n` +
    `🌿 Weekly care: Check the undersides of leaves for water-soaked spots or white mould — early and late blight can appear quickly in humid conditions.`,

  'potato blight':
    `⚠️ Potato Blight detected — this spreads rapidly in wet conditions.\n\n` +
    `🛡️ Prevention: Use certified disease-free seed potatoes. Avoid overhead irrigation. Destroy all crop debris after harvest to break the disease cycle.\n\n` +
    `🌿 Biological control: Apply copper-based biosprays or Bacillus subtilis products as a preventive spray during humid weather.\n\n` +
    `🧪 Chemical control: Spray Mancozeb (2.5g/litre) or Cymoxanil+Mancozeb at the first sign of brown lesions. Spray every 7 days in wet weather. Remove and bag heavily infected plants — do not compost them.`,
};

function getGenericAdvice(isHealthy, className) {
  if (isHealthy) {
    return `Your crop appears healthy. Continue regular monitoring, irrigation, and balanced fertilisation.`;
  }
  return (
    `⚠️ ${className} detected on your crop.\n\n` +
    `🛡️ Prevention: Isolate affected plants, avoid overhead watering, and ensure good airflow.\n\n` +
    `🌿 Biological control: Apply neem-based or Trichoderma biocontrol products as a first line of defence.\n\n` +
    `🧪 Chemical control: Consult your local agricultural extension officer for the most appropriate fungicide or pesticide for this specific condition.`
  );
}

/* ─── Demo fallback data ─────────────────────────────────────────── */
const DEMO_DISEASES = [
  { isHealthy: true,  name: 'tomatao healthy', prob: 95, others: [{ name: 'tomato blight', prob: 4 }],  advice: DISEASE_ADVICE['tomatao healthy'] },
  { isHealthy: false, name: 'tomato blight',   prob: 88, others: [{ name: 'tomatao healthy', prob: 10 }], advice: DISEASE_ADVICE['tomato blight'] },
  { isHealthy: true,  name: 'rice healthy',    prob: 96, others: [{ name: 'rice rust', prob: 3 }],       advice: DISEASE_ADVICE['rice healthy'] },
  { isHealthy: false, name: 'rice rust',        prob: 84, others: [{ name: 'rice healthy', prob: 14 }],  advice: DISEASE_ADVICE['rice rust'] },
  { isHealthy: true,  name: 'corn healty',      prob: 93, others: [{ name: 'corn blight', prob: 6 }],    advice: DISEASE_ADVICE['corn healty'] },
  { isHealthy: false, name: 'corn blight',      prob: 81, others: [{ name: 'corn healty', prob: 17 }],   advice: DISEASE_ADVICE['corn blight'] },
  { isHealthy: true,  name: 'potato healhty',   prob: 94, others: [{ name: 'potato blight', prob: 5 }],  advice: DISEASE_ADVICE['potato healhty'] },
  { isHealthy: false, name: 'potato blight',    prob: 89, others: [{ name: 'potato healhty', prob: 9 }], advice: DISEASE_ADVICE['potato blight'] },
];

/* ─── Model loading ──────────────────────────────────────────────── */
async function loadTMModel() {
  // Only skip if URL is literally the placeholder text
  if (!TM_MODEL_URL || TM_MODEL_URL === TM_PLACEHOLDER) return false;
  try {
    // Normalise: strip any trailing slashes, then add exactly one
    const base = TM_MODEL_URL.replace(/\/+$/, '') + '/';
    tmModel = await window.tmImage.load(base + 'model.json', base + 'metadata.json');
    return true;
  } catch (e) {
    console.warn('Teachable Machine model failed to load:', e);
    return false;
  }
}

function initApiStatus() {
  const dot  = document.getElementById('api-status-dot');
  const text = document.getElementById('api-status-text');

  if (!TM_MODEL_URL || TM_MODEL_URL === TM_PLACEHOLDER) {
    dot.className    = 'api-status-dot dot-warning';
    text.textContent = '🎭 Demo mode — paste your Teachable Machine URL in script.js to enable live diagnosis';
    return;
  }

  dot.className    = 'api-status-dot dot-warning';
  text.textContent = '⏳ Loading Teachable Machine model…';

  loadTMModel().then(ok => {
    dot.className    = ok ? 'api-status-dot dot-ok' : 'api-status-dot dot-warning';
    text.textContent = ok
      ? '✅ Model ready — upload a leaf photo below'
      : '⚠️ Could not load model — running in demo mode';
  });
}

/* ─── Image handling ─────────────────────────────────────────────── */
function handleImageSelect(event) {
  const file = event.target.files[0];
  if (file) showPreview(file);
}

function handleDrop(event) {
  event.preventDefault();
  document.getElementById('upload-zone').classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) showPreview(file);
}

function showPreview(file) {
  window._cropFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('preview-img').src = e.target.result;
    document.getElementById('upload-preview').style.display = 'block';
    document.getElementById('upload-zone').style.display    = 'none';
    document.getElementById('analyze-btn').style.display    = 'flex';
  };
  reader.readAsDataURL(file);
  showResultState('idle');
}

function showResultState(state) {
  ['idle', 'loading', 'output', 'error'].forEach(s => {
    const el = document.getElementById('result-' + s);
    if (el) el.style.display = (s === state) ? '' : 'none';
  });
}

/* ─── Main prediction function ───────────────────────────────────── */
async function predictDisease() {
  const file = window._cropFile || document.getElementById('cropImage').files[0];
  if (!file) { alert('Please select a crop image first.'); return; }

  showResultState('loading');

  if (!tmModel) {
    await new Promise(r => setTimeout(r, 1000));
    renderDemoResult(
      (!TM_MODEL_URL || TM_MODEL_URL === TM_PLACEHOLDER)
        ? 'No model URL set — showing demo result'
        : 'Model not loaded yet — showing demo result'
    );
    return;
  }

  try {
    const imgEl  = document.getElementById('preview-img');
    const canvas = document.createElement('canvas');
    canvas.width  = imgEl.naturalWidth  || imgEl.width;
    canvas.height = imgEl.naturalHeight || imgEl.height;
    canvas.getContext('2d').drawImage(imgEl, 0, 0, canvas.width, canvas.height);
    const predictions = await tmModel.predict(canvas);
    renderTMResult(predictions);
  } catch (err) {
    console.warn('Prediction error:', err);
    renderDemoResult('Prediction failed — showing demo result');
  }
}

/* ─── Render live TM result ──────────────────────────────────────── */
function renderTMResult(predictions) {
  predictions.sort((a, b) => b.probability - a.probability);
  const top    = predictions[0];
  const others = predictions.slice(1).filter(p => p.probability > 0.05);
  const isHealthy = top.className.toLowerCase().includes('health');
  const prob      = Math.round(top.probability * 100);

  const healthEl = document.getElementById('result-is-healthy');
  healthEl.textContent = isHealthy ? '✅  Plant looks Healthy' : '⚠️  Disease / Issue Detected';
  healthEl.className   = 'result-is-healthy ' + (isHealthy ? 'healthy-true' : 'healthy-false');

  document.getElementById('result-name').textContent = top.className;
  setTimeout(() => { document.getElementById('result-prob-fill').style.width = prob + '%'; }, 80);
  document.getElementById('result-prob-pct').textContent = prob + '%';

  const advice = DISEASE_ADVICE[top.className] || getGenericAdvice(isHealthy, top.className);
  document.getElementById('result-advice').style.whiteSpace = 'pre-line';
  document.getElementById('result-advice').textContent      = advice;

  const othersWrap = document.getElementById('result-other-wrap');
  if (others.length > 0) {
    document.getElementById('result-others').innerHTML = others.map(d =>
      `<span class="other-chip">${d.className} <strong>${Math.round(d.probability * 100)}%</strong></span>`
    ).join('');
    othersWrap.style.display = '';
  } else {
    othersWrap.style.display = 'none';
  }

  showResultState('output');
}

/* ─── Demo result renderer ───────────────────────────────────────── */
function renderDemoResult(statusMsg) {
  const dot  = document.getElementById('api-status-dot');
  const text = document.getElementById('api-status-text');
  dot.className    = 'api-status-dot dot-warning';
  text.textContent = '🎭 ' + statusMsg;

  const demo = DEMO_DISEASES[Math.floor(Math.random() * DEMO_DISEASES.length)];

  const healthEl = document.getElementById('result-is-healthy');
  healthEl.textContent = demo.isHealthy ? '✅  Plant looks Healthy  •  Demo' : '⚠️  Disease Detected  •  Demo';
  healthEl.className   = 'result-is-healthy ' + (demo.isHealthy ? 'healthy-true' : 'healthy-false');

  document.getElementById('result-name').textContent = demo.name;
  setTimeout(() => { document.getElementById('result-prob-fill').style.width = demo.prob + '%'; }, 80);
  document.getElementById('result-prob-pct').textContent = demo.prob + '%';

  document.getElementById('result-advice').style.whiteSpace = 'pre-line';
  document.getElementById('result-advice').textContent      = demo.advice;

  const othersWrap = document.getElementById('result-other-wrap');
  if (demo.others.length > 0) {
    document.getElementById('result-others').innerHTML = demo.others.map(d =>
      `<span class="other-chip">${d.name} <strong>${d.prob}%</strong></span>`
    ).join('');
    othersWrap.style.display = '';
  } else {
    othersWrap.style.display = 'none';
  }

  showResultState('output');
}

function showDiseaseError(title, msg, note) {
  document.getElementById('error-title').textContent = title;
  document.getElementById('error-msg').textContent   = msg;
  document.getElementById('error-note').textContent  = note;
  document.getElementById('error-note').style.display = note ? '' : 'none';
  showResultState('error');
}

function resetDisease() {
  window._cropFile = null;
  document.getElementById('cropImage').value               = '';
  document.getElementById('upload-preview').style.display  = 'none';
  document.getElementById('upload-zone').style.display     = 'flex';
  document.getElementById('analyze-btn').style.display     = 'none';
  document.getElementById('result-prob-fill').style.width  = '0%';
  showResultState('idle');
}

/* ─── DOMContentLoaded ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  const btn = document.createElement('button');
  btn.className = 'theme-toggle-btn';
  const savedTheme = localStorage.getItem('mausam-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  btn.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mausam-theme', next);
    btn.innerHTML = next === 'dark' ? '☀️' : '🌙';
  });
  document.body.appendChild(btn);

  document.getElementById('city-input').value = 'Patiala';
  fetchWeather();
  initApiStatus();
});
