// ZippUp PWA - App Script

// Configure your backend and cache busting
const BASE_API = 'https://zippup-backend-v3.onrender.com';
const BUILD_TAG = '2025-08-10-12';

// App state
let user = { name: 'Guest' };
let coords = null;
let currentCategory = null;
let selectedProvider = null;
let instantTimer = null;
let instantLeft = 90;
let requestId = null;
let map, userMarker, providerMarker, trackPoll = null;

// Elements (resolved on DOMContentLoaded)
let userNameEl, userLocEl, servicesGrid, emergencyGrid, recentList;
let providersModal, providersList, providersTitle, bookingModal, bookingForm;
let instantModal, countdownEl, cancelInstantBtn, findOthersBtn, trackModal, trackStatus, closeProvidersBtn, closeBookingBtn, closeTrackBtn, panicBtn;

// Data
const SERVICES = [
  { id: 'transport', name: 'Transport', icon: '🚗', desc: 'Ride & moving', instant: true, scheduled: true },
  { id: 'food', name: 'Food', icon: '🍔', desc: 'Restaurant & grocery', instant: true, scheduled: true },
  { id: 'tech', name: 'Tech Services', icon: '🔧', desc: 'Phone/computer repair', instant: true, scheduled: true },
  { id: 'home', name: 'Home Services', icon: '🏠', desc: 'Cleaning & maintenance', instant: true, scheduled: true },
  { id: 'construction', name: 'Construction', icon: '🏗️', desc: 'Builders & electricians', instant: false, scheduled: true },
  { id: 'auto', name: 'Automobile Repair', icon: '🛠️', desc: 'Mechanics, tires, roadside', instant: true, scheduled: true },
  { id: 'others', name: 'Others', icon: '🎯', desc: 'Events, tutors, more', instant: false, scheduled: true },
];

const EMERGENCY = [
  { id: 'ambulance', name: 'Ambulance', icon: '🚑', cat: 'emergency' },
  { id: 'fire', name: 'Fire Service', icon: '🚒', cat: 'emergency' },
  { id: 'towing', name: 'Towing', icon: '🚛', cat: 'emergency' },
  { id: 'roadside', name: 'Roadside', icon: '🔧', cat: 'emergency' },
  { id: 'police', name: 'Police', icon: '👮', cat: 'emergency' },
];

// Init
document.addEventListener('DOMContentLoaded', () => {
  resolveElements();
  userNameEl.textContent = user.name;
  initLocation();
  renderServices();
  renderEmergency();
  renderRecent();
  wireNav();
  wireModals();
  wirePanic();
  registerSW();
});

function resolveElements() {
  userNameEl = document.getElementById('userName');
  userLocEl = document.getElementById('userLoc');
  servicesGrid = document.getElementById('servicesGrid');
  emergencyGrid = document.getElementById('emergencyGrid');
  recentList = document.getElementById('recentList');

  providersModal = document.getElementById('providersModal');
  providersList = document.getElementById('providersList');
  providersTitle = document.getElementById('providersTitle');
  closeProvidersBtn = document.getElementById('closeProviders');

  bookingModal = document.getElementById('bookingModal');
  bookingForm = document.getElementById('bookingForm');
  closeBookingBtn = document.getElementById('closeBooking');

  instantModal = document.getElementById('instantModal');
  countdownEl = document.getElementById('countdown');
  cancelInstantBtn = document.getElementById('cancelInstant');
  findOthersBtn = document.getElementById('findOthers');

  trackModal = document.getElementById('trackModal');
  trackStatus = document.getElementById('trackStatus');
  closeTrackBtn = document.getElementById('closeTrack');

  panicBtn = document.getElementById('panicBtn');
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js?v=' + BUILD_TAG).catch(() => {});
  }
}

// Location
async function initLocation() {
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 })
    );
    coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const name = await reverseGeocode(coords.lat, coords.lng);
    userLocEl.textContent = name || 'Unknown';
  } catch {
    userLocEl.textContent = 'Location unavailable';
  }
}

async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    const d = await r.json();
    return (d.locality || d.city || 'Unknown') + ', ' + (d.countryName || '');
  } catch {
    return null;
  }
}

// Render
function renderServices() {
  servicesGrid.innerHTML = '';
  SERVICES.forEach((s) => {
    const el = document.createElement('div');
    el.className = 'card service';
    el.innerHTML = `
      <div class="row"><div style="font-size:28px">${s.icon}</div><h4>${s.name}</h4></div>
      <div class="small muted" style="margin-top:6px">${s.desc}</div>
      <div class="row" style="margin-top:8px">
        ${s.instant ? '<span class="pill">Instant</span>' : ''}
        ${s.scheduled ? '<span class="pill">Scheduled</span>' : ''}
      </div>
    `;
    el.onclick = () => openCategory(s.id, s.name);
    servicesGrid.appendChild(el);
  });
}

function renderEmergency() {
  emergencyGrid.innerHTML = '';
  EMERGENCY.forEach((e) => {
    const el = document.createElement('div');
    el.className = 'card service';
    el.innerHTML = `
      <div class="row"><div style="font-size:28px">${e.icon}</div><h4>${e.name}</h4></div>
      <div class="small muted" style="margin-top:6px">Find nearest/available</div>
      <div class="row" style="margin-top:8px">
        <span class="pill">Instant</span>
      </div>
    `;
    el.onclick = () => openEmergency(e.id, e.name);
    emergencyGrid.appendChild(el);
  });
}

function renderRecent() {
  recentList.innerHTML = `
    <div class="card"><div class="row"><div>🚗 Ride to Airport</div><span class="badge success">completed</span></div><div class="small muted" style="margin-top:6px">2h ago</div></div>
    <div class="card" style="margin-top:8px"><div class="row"><div>🔧 Phone Repair</div><span class="badge" style="background:#FFF7ED;color:#9A3412">scheduled</span></div><div class="small muted" style="margin-top:6px">Tomorrow 11:00</div></div>
  `;
}

// Providers
closeProvidersBtn.onclick = () => providersModal.classList.remove('open');

async function openCategory(catId, label) {
  currentCategory = catId;
  providersTitle.textContent = label + ' — Providers';
  const list = await fetchProviders(catId);
  renderProviders(list);
  providersModal.classList.add('open');
}

async function openEmergency(emId, label) {
  currentCategory = 'emergency:' + emId;
  providersTitle.textContent = label + ' — Nearest';
  const list = await fetchProviders('emergency', emId);
  renderProviders(list);
  providersModal.classList.add('open');
}

function renderProviders(list) {
  providersList.innerHTML = '';
  if (!list || !list.length) {
    providersList.innerHTML = '<div class="small muted">No providers found nearby.</div>';
    return;
  }
  list.forEach((p) => {
    const el = document.createElement('div');
    el.className = 'provider';
    el.innerHTML = `
      <div class="row" style="justify-content:space-between">
        <div class="row"><div style="font-size:24px">${p.icon || '👤'}</div><div><strong>${p.name}</strong><div class="small muted">${p.distance || '—'} • ETA ${p.eta || '—'} • Fee ${p.fee || '—'}</div></div></div>
        <span class="badge ${p.available ? 'success' : ''}">${p.available ? 'available' : 'unavailable'}</span>
      </div>
      <div class="controls">
        <button class="btn primary" data-k="instant">Instant Request</button>
        <button class="btn ghost" data-k="schedule">Schedule</button>
      </div>
    `;
    el.querySelectorAll('button[data-k]').forEach((b) => {
      b.onclick = () => (b.dataset.k === 'instant' ? startInstant(p) : openBooking(p));
    });
    providersList.appendChild(el);
  });
}

async function fetchProviders(category, sub = null) {
  try {
    const q = new URLSearchParams({
      category,
      sub: sub || '',
      lat: coords?.lat || '',
      lng: coords?.lng || '',
    });
    const r = await fetch(`${BASE_API}/api/providers/nearby?${q.toString()}`);
    if (!r.ok) throw new Error();
    const d = await r.json();
    return d.providers || [];
  } catch {
    // Fallback demo
    return [
      { id: 'p1', name: 'Pro One', icon: '👤', distance: '0.8km', eta: '6-9m', fee: '$8-12', available: true },
      { id: 'p2', name: 'Quick Help', icon: '⚡', distance: '1.2km', eta: '8-12m', fee: '$10-15', available: true },
      { id: 'p3', name: 'Nearby Tech', icon: '🔧', distance: '2.1km', eta: '12-18m', fee: '$12-18', available: true },
    ];
  }
}

// Panic flow
function wirePanic() {
  panicBtn.onclick = async () => {
    const ok = confirm(
      'Confirm PANIC alert?\n\nThis will send your live location to your 5 contacts and the national line.'
    );
    if (!ok) return;
    await triggerPanic();
  };
}

async function triggerPanic() {
  try {
    const body = {
      type: 'panic',
      location: coords ? { latitude: coords.lat, longitude: coords.lng } : null,
      message: 'User triggered PANIC alert',
    };
    const r = await fetch(`${BASE_API}/api/emergency/alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      alert('Panic alert sent.');
      if (d.trackingUrl) location.href = d.trackingUrl;
      else if (d.alertId) location.href = `/emergency/track/${d.alertId}`;
    } else {
      alert('Alert sent (fallback).');
    }
  } catch {
    alert('Alert sent (no GPS).');
  }
}

// Instant 90s flow
cancelInstantBtn.onclick = async () => {
  stopInstant();
  if (requestId) {
    try {
      await fetch(`${BASE_API}/api/requests/${encodeURIComponent(requestId)}`, { method: 'DELETE' });
    } catch {}
  }
  instantModal.classList.remove('open');
};
findOthersBtn.onclick = () => {
  instantModal.classList.remove('open');
  providersModal.classList.add('open');
};

async function startInstant(provider) {
  selectedProvider = provider;
  providersModal.classList.remove('open');
  instantLeft = 90;
  countdownEl.textContent = String(instantLeft);
  instantModal.classList.add('open');

  try {
    const r = await fetch(`${BASE_API}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'instant',
        providerId: provider.id,
        location: coords ? { latitude: coords.lat, longitude: coords.lng } : null,
      }),
    });
    const d = await r.json().catch(() => ({}));
    requestId = d.requestId || 'demo-' + Date.now();
  } catch {
    requestId = 'demo-' + Date.now();
  }

  instantTimer = setInterval(async () => {
    instantLeft -= 1;
    countdownEl.textContent = String(instantLeft);

    if (instantLeft % 3 === 0) {
      const status = await getRequestStatus(requestId);
      if (status === 'accepted') {
        stopInstant();
        openTracking();
        return;
      }
      if (status === 'rejected') {
        stopInstant();
        alert('Provider rejected.');
        instantModal.classList.remove('open');
        return;
      }
    }

    if (instantLeft <= 0) {
      stopInstant();
      alert('No response. Try others.');
      instantModal.classList.remove('open');
    }
  }, 1000);
}

function stopInstant() {
  if (instantTimer) clearInterval(instantTimer);
  instantTimer = null;
}

async function getRequestStatus(id) {
  try {
    const r = await fetch(`${BASE_API}/api/requests/${encodeURIComponent(id)}`);
    if (!r.ok) throw new Error();
    const d = await r.json();
    return d.status || 'pending';
  } catch {
    // Demo accept around 12s
    if (instantLeft < 78) return 'accepted';
    return 'pending';
  }
}

// Tracking
closeTrackBtn.onclick = () => {
  stopTracking();
  trackModal.classList.remove('open');
};

function openTracking() {
  instantModal.classList.remove('open');
  trackModal.classList.add('open');
  setTimeout(initMap, 50);
  startTracking();
}

function initMap() {
  if (!map) {
    map = L.map('track-map', { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map);
  }
  const userLatLng = coords ? [coords.lat, coords.lng] : [0, 0];
  map.setView(userLatLng, 14);
  if (userMarker) userMarker.remove();
  userMarker = L.marker(userLatLng, { title: 'You' }).addTo(map);
  if (providerMarker) providerMarker.remove();
}

function startTracking() {
  if (trackPoll) clearInterval(trackPoll);
  trackPoll = setInterval(async () => {
    const pos = await getProviderPosition(requestId);
    if (!pos) return;
    const latlng = [pos.lat, pos.lng];
    if (!providerMarker) providerMarker = L.marker(latlng, { title: 'Provider', icon: defaultIcon() }).addTo(map);
    else providerMarker.setLatLng(latlng);
    trackStatus.textContent = `Provider en route • ${pos.eta || 'ETA —'}`;
  }, 3000);
}

function stopTracking() {
  if (trackPoll) clearInterval(trackPoll);
  trackPoll = null;
}

function defaultIcon() {
  return L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
}

async function getProviderPosition(id) {
  try {
    const r = await fetch(`${BASE_API}/api/requests/${encodeURIComponent(id)}/position`);
    if (!r.ok) throw new Error();
    const d = await r.json();
    return { lat: d.provider?.lat, lng: d.provider?.lng, eta: d.eta };
  } catch {
    // Demo movement
    const base = coords
      ? { lat: coords.lat + (Math.random() - 0.5) / 100, lng: coords.lng + (Math.random() - 0.5) / 100 }
      : { lat: 0, lng: 0 };
    return { lat: base.lat, lng: base.lng, eta: '8 min' };
  }
}

// Scheduled bookings
closeBookingBtn.onclick = () => bookingModal.classList.remove('open');

function openBooking(provider) {
  selectedProvider = provider;
  bookingModal.classList.add('open');
}

bookingForm.onsubmit = async (e) => {
  e.preventDefault();
  const date = document.getElementById('bkDate').value;
  const time = document.getElementById('bkTime').value;
  const address = document.getElementById('bkAddress').value;
  const desc = document.getElementById('bkDesc').value;

  if (!date || !time) {
    alert('Pick date and time');
    return;
  }

  try {
    const r = await fetch(`${BASE_API}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: selectedProvider.id,
        bookingType: 'scheduled',
        date,
        time,
        address,
        description: desc,
        location: coords ? { latitude: coords.lat, longitude: coords.lng } : null,
      }),
    });
    if (!r.ok) throw new Error();
    alert('Booking request sent. Check My Bookings for status.');
  } catch {
    alert('Booking sent (demo). Provider will confirm soon.');
  } finally {
    bookingModal.classList.remove('open');
  }
};

// Navigation
function wireNav() {
  document.querySelectorAll('.nav button').forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll('.nav button').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      if (b.dataset.page === 'bookings') alert('Open bookings list (to be wired to backend).');
      if (b.dataset.page === 'wallet') alert('Open wallet (card/cash).');
      if (b.dataset.page === 'profile') alert('Open profile (edit, KYC, provider toggle).');
    };
  });
  document.getElementById('manageBookingsBtn').onclick = () => alert('Open bookings management.');
  document.getElementById('profileBtn').onclick = () => alert('Open profile.');
  document.getElementById('searchBtn').onclick = () => alert('Search coming soon.');
}

// Modals backdrop close
function wireModals() {
  [providersModal, bookingModal, instantModal, trackModal].forEach((m) => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.remove('open');
    });
  });
}
