

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


document.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button');
  btn.className = 'theme-toggle-btn';
  
  const savedTheme = localStorage.getItem('mausam-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  btn.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mausam-theme', next);
    btn.innerHTML = next === 'dark' ? '☀️' : '🌙';
  });

  document.body.appendChild(btn);
});
/* ─── Crop Disease Detection — crop.health API (Kindwise) ────────── */

// ── CONFIG: paste your crop.health API key here ──────────────────────
const CROP_HEALTH_API_KEY = 'XqH5o0GDUoo7FAdb1BTb0ZWh1wt2wfIqaFxXc551mGkrEeUCPE';
// ─────────────────────────────────────────────────────────────────────

// Max image dimension before compressing (keeps base64 payload small)
const MAX_IMG_PX = 1200;

// ── Demo disease pool — shown whenever the API is unavailable ─────────
const DEMO_DISEASES = [
  {
    isHealthy: false,
    name: 'Wheat Leaf Rust',
    prob: 87,
    others: [
      { name: 'Stem Rust', prob: 8 },
      { name: 'Powdery Mildew', prob: 3 },
    ],
    advice:
      '🛡️ Prevention: Use resistant wheat varieties and rotate crops each season to break the disease cycle.\n\n' +
      '🌿 Biological control: Apply Bacillus subtilis-based biocontrol agents at early growth stages.\n\n' +
      '🧪 Chemical control: Spray propiconazole or tebuconazole fungicide at the first sign of orange pustules. Repeat after 14 days if needed.'
  },
  {
    isHealthy: false,
    name: 'Rice Bacterial Leaf Blight',
    prob: 91,
    others: [
      { name: 'Sheath Blight', prob: 6 },
      { name: 'Brown Spot', prob: 2 },
    ],
    advice:
      '🛡️ Prevention: Avoid excess nitrogen fertilisation. Use certified disease-free seeds and drain fields periodically.\n\n' +
      '🌿 Biological control: Seed treatment with Pseudomonas fluorescens reduces early infection pressure.\n\n' +
      '🧪 Chemical control: Copper oxychloride spray (3g/litre) at tillering stage. Remove and destroy infected plant debris.'
  },
  {
    isHealthy: false,
    name: 'Tomato Early Blight',
    prob: 83,
    others: [
      { name: 'Septoria Leaf Spot', prob: 10 },
      { name: 'Late Blight', prob: 5 },
    ],
    advice:
      '🛡️ Prevention: Space plants well for airflow. Stake plants to keep foliage off the soil. Remove lower infected leaves early.\n\n' +
      '🌿 Biological control: Apply neem oil spray (5ml/litre) every 7 days as a preventive measure.\n\n' +
      '🧪 Chemical control: Mancozeb or chlorothalonil fungicide every 7–10 days during wet weather. Alternate chemicals to prevent resistance.'
  },
  {
    isHealthy: false,
    name: 'Maize Northern Leaf Blight',
    prob: 79,
    others: [
      { name: 'Gray Leaf Spot', prob: 12 },
      { name: 'Common Rust', prob: 7 },
    ],
    advice:
      '🛡️ Prevention: Plant resistant hybrids. Practise crop rotation — avoid planting maize after maize in the same field.\n\n' +
      '🌿 Biological control: Trichoderma-based products applied to soil at planting can reduce overall disease pressure.\n\n' +
      '🧪 Chemical control: Apply azoxystrobin or propiconazole at early tassel stage. One or two sprays at 14-day intervals are usually sufficient.'
  },
  {
    isHealthy: true,
    name: 'No Disease Found',
    prob: 97,
    others: [],
    advice:
      'Your crop looks healthy! Continue regular care — maintain proper irrigation, balanced fertilisation (NPK as per soil test), and scout weekly for any early signs of stress or pest activity.'
  },
];

// ── On page load: validate key and update status bar ─────────────────
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('city-input').value = 'Patiala';
  fetchDemoWeather('Patiala');
  initApiStatus();
});

function initApiStatus() {
  const dot  = document.getElementById('api-status-dot');
  const text = document.getElementById('api-status-text');
  if (!CROP_HEALTH_API_KEY || CROP_HEALTH_API_KEY === 'YOUR_API_KEY_HERE') {
    dot.className  = 'api-status-dot dot-warning';
    text.textContent = '🎭 Demo mode — add your API key in script.js for live diagnosis';
    return;
  }
  dot.className  = 'api-status-dot dot-ok';
  text.textContent = '✅ crop.health API ready — upload a leaf photo below';
}

// ── Image handling ────────────────────────────────────────────────────
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

// ── UI state machine ──────────────────────────────────────────────────
function showResultState(state) {
  ['idle', 'loading', 'output', 'error'].forEach(s => {
    const el = document.getElementById('result-' + s);
    if (el) el.style.display = (s === state) ? '' : 'none';
  });
}

// ── Main predict function ─────────────────────────────────────────────
async function predictDisease() {
  const file = window._cropFile || document.getElementById('cropImage').files[0];

  if (!file) {
    alert('Please select a crop image first.');
    return;
  }
  if (!CROP_HEALTH_API_KEY || CROP_HEALTH_API_KEY === 'XqH5o0GDUoo7FAdb1BTb0ZWh1wt2wfIqaFxXc551mGkrEeUCPE') {
    showResultState('loading');
    await new Promise(r => setTimeout(r, 1200)); // simulate network delay
    renderDemoResult('No API key — showing demo result');
    return;
  }

  showResultState('loading');

  try {
    // Compress image → smaller base64 → faster API response
    const base64 = await compressAndEncode(file, MAX_IMG_PX);

    const payload = {
      images: [base64],
      details: ['description', 'treatment', 'cause', 'common_names'],
      disease_details: ['description', 'treatment', 'cause'],
      language: 'en'
    };

    const response = await fetch('https://crop.kindwise.com/api/v1/identification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': CROP_HEALTH_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      console.warn('crop.health: Invalid API key — falling back to demo');
      renderDemoResult('Invalid API key — showing demo result');
      return;
    }
    if (response.status === 402) {
      console.warn('crop.health: No credits — falling back to demo');
      renderDemoResult('Credits used up — showing demo result');
      return;
    }
    if (response.status === 429) {
      console.warn('crop.health: Rate limited — falling back to demo');
      renderDemoResult('Too many requests — showing demo result');
      return;
    }
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    renderDiseaseResult(data);

  } catch (err) {
    console.warn('crop.health API unreachable — falling back to demo:', err.message);
    renderDemoResult('API unavailable — showing demo result');
  }
}

// ── Demo fallback — picks a random entry from DEMO_DISEASES ──────────
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

  setTimeout(() => {
    document.getElementById('result-prob-fill').style.width = demo.prob + '%';
  }, 80);
  document.getElementById('result-prob-pct').textContent = demo.prob + '%';

  document.getElementById('result-advice').style.whiteSpace = 'pre-line';
  document.getElementById('result-advice').textContent = demo.advice;

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

// ── Render live API result ────────────────────────────────────────────
function renderDiseaseResult(data) {
  const result = data.result;
  if (!result) {
    renderDemoResult('Empty API response — showing demo result');
    return;
  }

  const isHealthy = result.is_healthy?.binary ?? true;
  const diseases  = result.disease?.suggestions || [];
  const top       = diseases[0];

  // Healthy / diseased badge
  const healthEl = document.getElementById('result-is-healthy');
  healthEl.textContent = isHealthy ? '✅  Plant looks Healthy' : '⚠️  Disease / Issue Detected';
  healthEl.className   = 'result-is-healthy ' + (isHealthy ? 'healthy-true' : 'healthy-false');

  // Disease name — fall back gracefully
  const name = top?.name ?? (isHealthy ? 'No Disease Found' : 'Unknown Condition');
  document.getElementById('result-name').textContent = name;

  // Confidence bar (animate in)
  const prob = top ? Math.round((top.probability || 0) * 100) : (isHealthy ? 99 : 0);
  setTimeout(() => {
    document.getElementById('result-prob-fill').style.width = prob + '%';
  }, 80);
  document.getElementById('result-prob-pct').textContent = prob + '%';

  // Treatment / advice text
  let advice = 'No specific treatment data available for this condition. Please consult a local agricultural extension officer.';
  if (isHealthy) {
    advice = 'Your crop looks healthy! Continue regular care — maintain proper irrigation, balanced fertilisation, and monitor for any early stress signs.';
  } else if (top?.details) {
    const t = top.details.treatment;
    const parts = [];
    if (t?.prevention) parts.push('🛡️ Prevention: ' + t.prevention);
    if (t?.biological) parts.push('🌿 Biological control: ' + t.biological);
    if (t?.chemical)   parts.push('🧪 Chemical control: ' + t.chemical);
    if (parts.length) {
      advice = parts.join('\n\n');
    } else if (top.details.description) {
      advice = top.details.description;
    }
  }
  document.getElementById('result-advice').style.whiteSpace = 'pre-line';
  document.getElementById('result-advice').textContent = advice;

  // Other possibilities (2nd & 3rd suggestions)
  const others     = diseases.slice(1, 4).filter(d => d.probability > 0.03);
  const othersWrap = document.getElementById('result-other-wrap');
  if (others.length > 0) {
    document.getElementById('result-others').innerHTML = others.map(d =>
      `<span class="other-chip">${d.name} <strong>${Math.round(d.probability * 100)}%</strong></span>`
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
  document.getElementById('cropImage').value         = '';
  document.getElementById('upload-preview').style.display = 'none';
  document.getElementById('upload-zone').style.display    = 'flex';
  document.getElementById('analyze-btn').style.display    = 'none';
  document.getElementById('result-prob-fill').style.width = '0%';
  showResultState('idle');
}


function compressAndEncode(file, maxPx) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round(height * maxPx / width);  width = maxPx; }
        else                { width  = Math.round(width  * maxPx / height); height = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
     
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = reject;
    img.src = url;
  });
}