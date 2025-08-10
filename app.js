const FUNCTIONS_BASE = 'https://<https://xxrtlkyqjqdhkenpkwll>.functions.supabase.co';

// ZippUp PWA - Main Application Logic (updated)
class ZippUpApp {
  constructor() {
    this.baseUrl = '';
    this.currentUser = null;
    this.authToken = null;
    this.currentPage = 'home';
    this.services = [];
    this.sessionId = null;
    this.deferredPrompt = null;
    this.isListening = false;
    this.recognition = null;
    this.selectedEmergencyType = null;

    this.init();
  }

  async init() {
    // Splash
    setTimeout(() => this.hideSplashScreen(), 800);

    // Core
    this.initializeAuth();
    this.initializeEventListeners();
    this.initializeVoiceRecognition();
    this.initializePWA();

    // Data
    await this.loadServices();
    this.initializeLocation();
  }

  hideSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const app = document.getElementById('app');
    if (!splashScreen || !app) return;
    splashScreen.style.opacity = '0';
    setTimeout(() => {
      splashScreen.style.display = 'none';
      app.style.display = 'flex';
      if (!this.authToken) this.showAuthModal();
    }, 250);
  }

  initializeAuth() {
    this.authToken = localStorage.getItem('zippup_token');
    const userData = localStorage.getItem('zippup_user');
    if (this.authToken && userData) {
      try {
        this.currentUser = JSON.parse(userData);
        this.updateUserUI();
      } catch {
        this.logout();
      }
    }
  }

  updateUserUI() {
    if (this.currentUser) {
      const el = document.getElementById('user-name');
      if (el) el.textContent = this.currentUser.name || 'User';
    }
  }

  logout() {
    this.authToken = null;
    this.currentUser = null;
    localStorage.removeItem('zippup_token');
    localStorage.removeItem('zippup_user');
    const el = document.getElementById('user-name');
    if (el) el.textContent = 'User';
    this.showAuthModal();
  }

  initializeEventListeners() {
    // Auth modal switches
    const closeAuth = document.getElementById('close-auth-modal');
    if (closeAuth) closeAuth.addEventListener('click', () => this.hideAuthModal());
    const aswitch = document.getElementById('auth-switch-link');
    if (aswitch) aswitch.addEventListener('click', (e) => { e.preventDefault(); this.toggleAuthMode(); });

    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); this.handleLogin(e); });

    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', (e) => { e.preventDefault(); this.handleRegister(e); });

    const otpForm = document.getElementById('otp-form');
    if (otpForm) otpForm.addEventListener('submit', (e) => { e.preventDefault(); this.handleOTPVerification(e); });

    const otpBtn = document.getElementById('request-otp-btn');
    if (otpBtn) otpBtn.addEventListener('click', () => this.handleOTPLogin());

    // Panic (emergency button is panic-only)
    const panicBtn = document.getElementById('emergency-btn');
    if (panicBtn) panicBtn.addEventListener('click', () => this.showEmergencyModal());
    const confirmEmergency = document.getElementById('confirm-emergency');
    if (confirmEmergency) confirmEmergency.addEventListener('click', () => this.triggerEmergency());
    const cancelEmergency = document.getElementById('cancel-emergency');
    if (cancelEmergency) cancelEmergency.addEventListener('click', () => this.hideEmergencyModal());

    // Voice
    const voiceBtn = document.getElementById('voice-search-btn');
    if (voiceBtn) voiceBtn.addEventListener('click', () => this.toggleVoiceSearch());

    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value || ''));

    // Bottom nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => this.navigateToPage(e.currentTarget.dataset.page));
    });

    // Quick actions
    document.querySelectorAll('.quick-action-card').forEach(card => {
      card.addEventListener('click', (e) => this.handleQuickAction(e.currentTarget.dataset.action));
    });

    // Close modals when clicking backdrop
    document.addEventListener('click', (e) => {
      if (e.target.classList && e.target.classList.contains('modal')) {
        this.hideAllModals();
      }
    });
  }

  initializeVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.onstart = () => {
        this.isListening = true;
        const v = document.getElementById('voice-search-btn');
        if (v) v.classList.add('recording');
      };
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById('search-input');
        if (input) input.value = transcript;
        this.handleSearch(transcript);
      };
      this.recognition.onerror = () => this.stopVoiceSearch();
      this.recognition.onend = () => this.stopVoiceSearch();
    }
  }

  initializePWA() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });
    window.addEventListener('appinstalled', () => this.hideInstallPrompt());
  }

  async initializeLocation() {
    const el = document.getElementById('user-location');
    if (!el) return;
    if (!('geolocation' in navigator)) {
      el.textContent = 'Location not available';
      return;
    }
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const { latitude, longitude } = position.coords;
      const locationName = await this.reverseGeocode(latitude, longitude);
      el.textContent = locationName || 'Unknown Location';
    } catch {
      el.textContent = 'Location not available';
    }
  }

  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const data = await response.json();
      return `${data.city || data.locality || 'Your Area'}, ${data.countryName || ''}`.trim();
    } catch {
      return null;
    }
  }

  // API helpers
  api(path, init = {}) {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
      ...(init.headers || {}),
    };
    return fetch(url, { ...init, headers });
  }

  async apiJson(path, init = {}) {
    const res = await this.api(path, init);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'Request failed');
    return data;
  }

  async getCurrentPositionSafe() {
    if (!('geolocation' in navigator)) return { lat: null, lng: null };
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      );
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      return { lat: null, lng: null };
    }
  }

  computeDistanceKm(lat1, lon1, lat2, lon2) {
    if ([lat1, lon1, lat2, lon2].some(v => v == null)) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
              Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
    }

  formatCurrency(amount, currency = 'USD') {
    try {
      return new Intl.NumberFormat(navigator.language || 'en-US', { style: 'currency', currency }).format(amount);
    } catch {
      return `$${amount}`;
    }
  }

  async getUserCountry(lat, lng) {
    try {
      if (lat != null && lng != null) {
        const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        const d = await r.json();
        return d.countryCode || 'US';
      }
      return 'US';
    } catch {
      return 'US';
    }
  }

  async fetchEmergencyContacts() {
    try {
      if (Array.isArray(this.currentUser?.emergencyContacts)) {
        return this.currentUser.emergencyContacts.slice(0, 5);
      }
      const res = await this.api('/api/profile', { method: 'GET' });
      const data = await res.json().catch(() => ({}));
      const contacts = Array.isArray(data?.emergencyContacts) ? data.emergencyContacts : [];
      return contacts.slice(0, 5);
    } catch {
      return [];
    }
  }

  async fetchProvidersForCategory(categoryKey, lat, lng) {
  const params = new URLSearchParams({
    category: categoryKey || '',
    ...(lat != null && lng != null ? { lat: String(lat), lng: String(lng) } : {}),
  });
  try {
    const resp = await fetch(`${FUNCTIONS_BASE}/providers-nearby?` + params.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const out = await resp.json().catch(() => ({}));
    const list = Array.isArray(out?.providers) ? out.providers : (Array.isArray(out) ? out : []);
    return list;
  } catch {
    return [];
  }
}

  // Panic only
  showEmergencyModal() {
    const modal = document.getElementById('emergency-modal');
    if (!modal) return;
    modal.classList.add('active');
    document.body.classList.add('no-scroll');
  }

  hideEmergencyModal() {
    const modal = document.getElementById('emergency-modal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

  async triggerEmergency() {
    this.hideEmergencyModal();
    try {
      const emergencyType = 'PANIC';
      let latitude = null, longitude = null;
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
          );
          latitude = position.coords.latitude; longitude = position.coords.longitude;
        } catch {}
      }
      const contacts = await this.fetchEmergencyContacts();
      const country = await this.getUserCountry(latitude, longitude);
      const body = {
        emergencyType,
        latitude, longitude,
        message: 'Emergency alert from ZippUp PWA',
        userId: this.currentUser?.id || null,
        notifyContacts: true,
        contacts,
        country
      };
      const resp = await fetch(`${FUNCTIONS_BASE}/emergency-alert`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const data = await resp.json();
if (!resp.ok || !data?.success) throw new Error(data?.error || 'alert_failed');
      }
    } catch {
      this.showNotification('Failed to send emergency alert. Please call local services.', 'error');
    }
  }

  // Services
  async loadServices() {
    try {
      const response = await fetch(`${this.baseUrl}/api/services`);
      const data = await response.json();
      if (data.success) {
        this.services = data.services || [];
        this.ensureEmergencyTypes();
        this.renderServices();
      } else {
        this.loadDemoServices();
        this.ensureEmergencyTypes();
        this.renderServices();
      }
    } catch {
      this.loadDemoServices();
      this.ensureEmergencyTypes();
      this.renderServices();
    }
  }

  ensureEmergencyTypes() {
    const names = this.services.map(s => s.name);
    const add = (svc) => { this.services.push(svc); };
    if (!names.includes('Police Service')) {
      add({ id: 'emg-police', name: 'Police Service', category: 'POLICE', icon: '🚔', description: 'Security and law enforcement', examples: ['Police'], basePrice: 0 });
    }
    if (!names.includes('Fire Service')) {
      add({ id: 'emg-fire', name: 'Fire Service', category: 'FIRE', icon: '🔥', description: 'Fire and rescue services', examples: ['Fire response'], basePrice: 0 });
    }
    if (!names.includes('Ambulance Service')) {
      add({ id: 'emg-ambulance', name: 'Ambulance Service', category: 'AMBULANCE', icon: '🚑', description: 'Medical emergency transport', examples: ['Ambulance'], basePrice: 0 });
    }
    if (!names.includes('Roadside Assistance')) {
      add({ id: 'emg-roadside', name: 'Roadside Assistance', category: 'ROADSIDE', icon: '🛞', description: 'Breakdown & towing support', examples: ['Tow', 'Battery', 'Tire'], basePrice: 0 });
    }
    if (!names.includes('Automobile Repair')) {
      add({ id: 'auto-repair', name: 'Automobile Repair', category: 'AUTOMOBILE_REPAIR', icon: '🔧', description: 'Car repair & maintenance', examples: ['Mechanic', 'Diagnostics'], basePrice: 60 });
    }
  }

  loadDemoServices() {
    this.services = [
      { id: '1', name: 'Ride & Moving', category: 'TRANSPORT', icon: '🚗', description: 'Taxi, bike rides, delivery, moving services', examples: ['Taxi','Bike rides','Delivery','Moving'], basePrice: 50 },
      { id: '2', name: 'Personal Care', category: 'PERSONAL_CARE', icon: '💅', description: 'Hair, massage, beauty', examples: ['Hair styling','Massage','Manicure'], basePrice: 30 },
      { id: '3', name: 'Tech Services', category: 'TECH', icon: '🔧', description: 'Phone/Computer repair', examples: ['Phone','Computer','Electronics'], basePrice: 40 },
      { id: '4', name: 'Construction', category: 'CONSTRUCTION', icon: '🏗️', description: 'Builders, carpenters, electricians', examples: ['Builders','Carpenters','Electricians'], basePrice: 80 },
      { id: '5', name: 'Home Services', category: 'HOME', icon: '🏠', description: 'Cleaning, gardening, maintenance', examples: ['Cleaning','Gardening','Painting'], basePrice: 35 },
      { id: '6', name: 'Emergency Services', category: 'EMERGENCY', icon: '🚨', description: 'Ambulance, fire, roadside assistance', examples: ['Ambulance','Fire','Roadside'], basePrice: 100 },
      { id: '7', name: 'Automobile', category: 'AUTOMOBILE', icon: '🛠️', description: 'Car wash & maintenance', examples: ['Wash','Detailing'], basePrice: 25 },
      { id: '8', name: 'Others', category: 'OTHERS', icon: '🎉', description: 'Events, catering, general', examples: ['Events','Catering'], basePrice: 45 }
    ];
  }

  renderServices() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;
    grid.innerHTML = '';
    this.services.forEach(service => {
      const card = document.createElement('button');
      card.className = 'service-card';
      card.innerHTML = `
        <div class="service-icon">${service.icon}</div>
        <div class="service-name">${service.name}</div>
        <div class="service-description">${service.description || ''}</div>
        <div class="service-examples">${service.examples ? service.examples.join(', ') : ''}</div>
        <div class="service-price">${this.formatCurrency(service.basePrice || 0)}</div>
      `;
      card.addEventListener('click', () => this.showServiceDetail(service));
      grid.appendChild(card);
    });
  }

openBookingForm(providerId, category) {
  document.getElementById('bf-provider-id').value = providerId || '';
  document.getElementById('bf-category').value = category || '';
  document.getElementById('booking-form-modal').classList.add('active');
  document.body.classList.add('no-scroll');
}
closeBookingForm() {
  document.getElementById('booking-form-modal').classList.remove('active');
  document.body.classList.remove('no-scroll');
}
initBookingUI() {
  const closeBtn = document.getElementById('close-booking-form');
  if (closeBtn) closeBtn.onclick = () => this.closeBookingForm();
  const form = document.getElementById('booking-form');
  if (form) form.onsubmit = async (e) => {
    e.preventDefault();
    const providerId = document.getElementById('bf-provider-id').value;
    const category = document.getElementById('bf-category').value;
    const date = document.getElementById('bf-date').value;
    const time = document.getElementById('bf-time').value;
    const address = document.getElementById('bf-address').value || null;
    const meeting = document.getElementById('bf-meeting').value || 'at_user';
    const notes = document.getElementById('bf-notes').value || '';
    const when = date && time ? `${date} ${time}` : null;
    const { lat, lng } = await this.getCurrentPositionSafe();
    try {
      const payload = { providerId, category, when, address, latitude: lat, longitude: lng, notes, meeting };
      const data = await this.apiJson('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });
      this.showNotification('Booking created. Waiting for provider...', 'success');
      this.closeBookingForm();
      if (data?.bookingId) this.pollBookingStatus(data.bookingId, 90);
    } catch {
      this.showNotification('Failed to create booking', 'error');
    }
  };
}
openManageBookings() {
  document.getElementById('manage-bookings-modal').classList.add('active');
  document.body.classList.add('no-scroll');
  this.loadMyBookings();
}
closeManageBookings() {
  document.getElementById('manage-bookings-modal').classList.remove('active');
  document.body.classList.remove('no-scroll');
}
async loadMyBookings() {
  const list = document.getElementById('bookings-list');
  list.innerHTML = 'Loading...';
  try {
    const resp = await this.api('/api/bookings?role=customer', { method: 'GET' });
    const data = await resp.json();
    const bookings = Array.isArray(data?.bookings) ? data.bookings : (Array.isArray(data) ? data : []);
    if (!bookings.length) { list.innerHTML = '<div>No bookings yet</div>'; return; }
    list.innerHTML = bookings.map(b => `
      <div style="border:1px solid var(--border);border-radius:8px;padding:12px;">
        <div><strong>${b.category || 'Service'}</strong> • ${b.status}</div>
        <div style="font-size:0.9rem;color:var(--text-secondary);">${b.address || ''}</div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          ${b.status === 'PENDING' ? `<button class="secondary-btn" onclick="app.cancelBooking('${b.id}')">Cancel</button>` : ''}
          <button class="secondary-btn" onclick="app.openTracking('${b.id}')">Track</button>
        </div>
      </div>
    `).join('');
  } catch {
    list.innerHTML = '<div>Failed to load bookings</div>';
  }
}
async cancelBooking(bookingId) {
  try {
    await this.apiJson(`/api/bookings/${bookingId}`, { method: 'PATCH', body: JSON.stringify({ status: 'CANCELLED' }) });
    this.showNotification('Booking cancelled', 'success');
    this.loadMyBookings();
  } catch {
    this.showNotification('Failed to cancel booking', 'error');
  }
}

async openTracking(bookingId) {
  if (!bookingId) return;
  const modal = document.getElementById('tracking-modal');
  const mapEl = document.getElementById('tracking-map');
  const statusEl = document.getElementById('tracking-status');
  const etaEl = document.getElementById('tracking-eta');
  modal.classList.add('active'); document.body.classList.add('no-scroll');

  const booking = await this.fetchBooking(bookingId);
  if (!booking) { statusEl.textContent = 'Status: not found'; return; }

  if (!this._tracking) this._tracking = {};
  const centerLat = booking.provider_lat ?? booking.latitude ?? 6.5244;
  const centerLng = booking.provider_lng ?? booking.longitude ?? 3.3792;
  if (this._tracking.map) this._tracking.map.remove();
  const map = L.map(mapEl).setView([centerLat, centerLng], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution:'© OpenStreetMap' }).addTo(map);

  const userMarker = (booking.latitude && booking.longitude) ? L.marker([booking.latitude, booking.longitude], { title: 'You' }).addTo(map) : null;
  const providerMarker = L.marker([centerLat, centerLng], { title: 'Provider' }).addTo(map);
  const bounds = []; if (userMarker) bounds.push(userMarker.getLatLng()); bounds.push(providerMarker.getLatLng());
  if (bounds.length) map.fitBounds(bounds, { padding: [40,40] });

  this._tracking = { bookingId, map, markers: { userMarker, providerMarker }, intervalId: null };

  const closeBtn = document.getElementById('close-tracking');
  if (closeBtn) closeBtn.onclick = () => this.closeTracking();
  const cancelBtn = document.getElementById('tracking-cancel');
  if (cancelBtn) cancelBtn.onclick = () => this.cancelBooking(bookingId);
  const recenterBtn = document.getElementById('tracking-recenter');
  if (recenterBtn) recenterBtn.onclick = () => {
    const pts = []; const m = this._tracking.markers;
    if (m.userMarker) pts.push(m.userMarker.getLatLng()); pts.push(m.providerMarker.getLatLng());
    if (pts.length) this._tracking.map.fitBounds(L.latLngBounds(pts), { padding: [40,40] });
  };

  const update = async () => {
    const b = await this.fetchBooking(bookingId); if (!b) return;
    statusEl.textContent = `Status: ${b.status || '—'}`; etaEl.textContent = `ETA: ${b.eta_min != null ? `${b.eta_min} min` : '—'}`;
    if (b.provider_lat != null && b.provider_lng != null) this._tracking.markers.providerMarker.setLatLng([b.provider_lat, b.provider_lng]);
    if (b.status === 'COMPLETED' || b.status === 'CANCELLED') { this.showNotification(`Booking ${b.status.toLowerCase()}`,(b.status==='COMPLETED')?'success':'error'); this.closeTracking(); }
  };
  await update(); this._tracking.intervalId = setInterval(update, 4000);
}
closeTracking() {
  const modal = document.getElementById('tracking-modal');
  modal.classList.remove('active'); document.body.classList.remove('no-scroll');
  if (this._tracking?.intervalId) clearInterval(this._tracking.intervalId);
  if (this._tracking?.map) this._tracking.map.remove();
  this._tracking = null;
}
async fetchBooking(bookingId) {
  try {
    const resp = await this.api(`/api/bookings/${bookingId}`, { method: 'GET' });
    const d = await resp.json();
    return {
      id: d.id || d.bookingId || bookingId,
      status: d.status || 'PENDING',
      address: d.address || null,
      latitude: d.latitude ?? d.user_lat ?? null,
      longitude: d.longitude ?? d.user_lng ?? null,
      provider_lat: d.provider_lat ?? null,
      provider_lng: d.provider_lng ?? null,
      eta_min: d.eta_min ?? null,
      tracking_url: d.trackingUrl || d.tracking_url || null
    };
  } catch { return null; }
}

  showServiceDetail(service) {
  const modal = document.getElementById('service-modal');
  const title = document.getElementById('service-title');
  const details = document.getElementById('service-details');
  title.textContent = service.name;

  const isEmergencyType = ['POLICE','FIRE','AMBULANCE','ROADSIDE'].includes(service.category);
  if (isEmergencyType) {
    details.innerHTML = `
      <div style="text-align:center; margin-bottom:16px;">
        <div style="font-size:3rem; margin-bottom:8px;">${service.icon}</div>
        <h3>${service.name}</h3>
        <p style="color: var(--text-secondary); margin: 8px 0;">${service.description || 'Emergency service'}</p>
      </div>
      <div style="margin-bottom: 16px;"><p>We’ll find nearest providers. You can request instantly (90s acceptance) or schedule.</p></div>
      <div style="display:flex; gap:12px;">
        <button class="primary-btn" id="find-providers-btn" style="flex:1;">Find Nearest Providers</button>
        <button class="secondary-btn" id="close-service-btn" style="flex:1;">Close</button>
      </div>
    `;
    modal.classList.add('active'); document.body.classList.add('no-scroll');
    document.getElementById('find-providers-btn').onclick = async () => {
      const { lat, lng } = await this.getCurrentPositionSafe();
      const providers = await this.fetchProvidersForCategory(service.category, lat, lng);
      this.showProvidersModal(service, providers, lat, lng);
    };
    document.getElementById('close-service-btn').onclick = () => this.hideServiceModal();
    return;
  }

async getCurrentPositionSafe(){ /* as provided earlier */ }
computeDistanceKm(lat1,lon1,lat2,lon2){ /* as provided earlier */ }
formatCurrency(amount,currency='USD'){ /* as provided earlier */ }

this.initBookingUI();
const mbClose = document.getElementById('close-manage-bookings');
if (mbClose) mbClose.onclick = () => this.closeManageBookings();
const bookingsNav = document.querySelector('[data-page="bookings"]');
if (bookingsNav) bookingsNav.addEventListener('click', () => this.openManageBookings());
    
  // Non-emergency layout
  details.innerHTML = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 4rem; margin-bottom: 16px;">${service.icon}</div>
      <h3>${service.name}</h3>
      <p style="color: var(--text-secondary); margin: 8px 0;">${service.description || ''}</p>
      <p style="color: var(--primary); font-weight: 600;">${this.formatCurrency(service.basePrice || 0)}</p>
    </div>
    <div style="margin-bottom: 24px;">
      <h4 style="margin-bottom: 12px;">Available Services:</h4>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${(service.examples || []).map(example =>
          `<span style="background: var(--background-secondary); padding: 4px 8px; border-radius: 6px; font-size: 0.875rem;">${example}</span>`
        ).join('')}
      </div>
    </div>
    <div style="display: flex; gap: 12px;">
      <button class="primary-btn" onclick="app.bookService('${service.id}')" style="flex: 1;">Book Now</button>
      <button class="secondary-btn" id="close-service-btn2" style="flex: 1;">Close</button>
    </div>
  `;
  modal.classList.add('active'); document.body.classList.add('no-scroll');
  document.getElementById('close-service-btn2').onclick = () => this.hideServiceModal();
}

  hideServiceModal() {
    const modal = document.getElementById('service-modal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

<!-- Booking Form Modal -->
<div id="booking-form-modal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Book Service</h3>
      <button class="close-btn" id="close-booking-form"><span class="material-icons">close</span></button>
    </div>
    <div class="modal-body">
      <form id="booking-form" class="auth-form">
        <input type="hidden" id="bf-provider-id">
        <input type="hidden" id="bf-category">
        <div class="form-group"><label>Date</label><input type="date" id="bf-date" required></div>
        <div class="form-group"><label>Time</label><input type="time" id="bf-time" required></div>
        <div class="form-group"><label>Address (optional)</label><input type="text" id="bf-address" placeholder="Enter address or leave blank to use GPS"></div>
        <div class="form-group"><label>Meeting preference</label>
          <select id="bf-meeting"><option value="at_user">Meet at my address</option><option value="at_provider">I will come to provider</option></select>
        </div>
        <div class="form-group"><label>Notes (optional)</label><input type="text" id="bf-notes" placeholder="Extra info for provider"></div>
        <button type="submit" class="primary-btn">Submit Booking</button>
      </form>
    </div>
  </div>
</div>

<!-- Manage Bookings Modal -->
<div id="manage-bookings-modal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3>My Bookings</h3>
      <button class="close-btn" id="close-manage-bookings"><span class="material-icons">close</span></button>
    </div>
    <div class="modal-body"><div id="bookings-list" style="display:flex;flex-direction:column;gap:12px;"></div></div>
  </div>
</div>

<!-- Tracking Modal -->
<div id="tracking-modal" class="modal">
  <div class="modal-content" style="max-width: 95vw; width: 100%; height: 85vh;">
    <div class="modal-header">
      <h3>Live Tracking</h3>
      <button class="close-btn" id="close-tracking"><span class="material-icons">close</span></button>
    </div>
    <div class="modal-body" style="display:flex; flex-direction:column; gap:12px; height: calc(85vh - 64px);">
      <div id="tracking-map" style="flex:1; width:100%; border-radius:12px; border:1px solid var(--border);"></div>
      <div id="tracking-info" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div id="tracking-status" style="font-weight:600;">Status: —</div>
          <div id="tracking-eta" style="font-size:0.9rem; color:var(--text-secondary);">ETA: —</div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="secondary-btn" id="tracking-cancel">Cancel</button>
          <button class="secondary-btn" id="tracking-recenter">Recenter</button>
        </div>
      </div>
    </div>
  </div>
</div>

  showProvidersModal(service, providers, userLat, userLng) {
  const modal = document.getElementById('service-modal');
  const title = document.getElementById('service-title');
  const details = document.getElementById('service-details');
  title.textContent = `${service.name} - Providers`;
  if (!providers.length) {
    details.innerHTML = `
      <p>No providers found near you. Please try again or schedule.</p>
      <div style="display:flex; gap:12px; margin-top:12px;"><button class="secondary-btn" onclick="app.hideServiceModal()">Close</button></div>`;
    return;
  }
  const sorted = providers.map(p => ({...p, distance: this.computeDistanceKm(userLat, userLng, p.lat, p.lng)}))
                          .sort((a,b)=>(a.distance ?? 9999)-(b.distance ?? 9999)).slice(0,10);
  const rows = sorted.map(p => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border:1px solid var(--border); border-radius:8px;">
      <div>
        <div style="font-weight:600;">${p.name || 'Provider'}</div>
        <div style="font-size:0.9rem; color:var(--text-secondary);">
          ${p.distance != null ? `${p.distance} km` : ''} • ⭐ ${p.rating || '—'} • ${p.jobs || 0} jobs
        </div>
        <div style="font-size:0.9rem; color:var(--primary);">
          ${this.formatCurrency(p.basePrice || 0, p.currency || 'USD')}
        </div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="secondary-btn" onclick="app.requestProvider('${p.id}','${service.category}','instant')">Instant Request</button>
        <button class="secondary-btn" onclick="app.openBookingForm('${p.id}','${service.category}')">Schedule</button>
      </div>
    </div>
  `).join('');
  details.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px; max-height:50vh; overflow:auto;">${rows}</div>
    <div style="display:flex; gap:12px; margin-top:12px;"><button class="secondary-btn" onclick="app.hideServiceModal()">Close</button></div>`;
  modal.classList.add('active'); document.body.classList.add('no-scroll');
}

async requestProvider(providerId, category, mode) {
  try {
    const { lat, lng } = await this.getCurrentPositionSafe();
    let when = null, address = '', notes = '';
    if (mode === 'schedule') {
      when = prompt('Enter date/time (e.g., 2025-08-12 18:00):', '');
      address = prompt('Enter address (optional):', '') || '';
    } else {
      address = prompt('Enter address (optional, leave blank to use current location):', '') || '';
    }
    notes = prompt('Notes for provider (optional):', '') || '';
    const payload = { providerId, category, when, address: address || null, latitude: lat, longitude: lng, notes, acceptanceTimeoutSec: 90 };
    const data = await this.apiJson('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });
    this.showNotification('Request sent. Waiting for provider (90s)...', 'info');
    if (data?.bookingId) this.pollBookingStatus(data.bookingId, 90);
  } catch {
    this.showNotification('Failed to create request. Please try again.', 'error');
  }
}

async pollBookingStatus(bookingId, timeoutSec = 90) {
  const deadline = Date.now() + timeoutSec * 1000;
  const interval = setInterval(async () => {
    if (Date.now() > deadline) {
      clearInterval(interval);
      this.showNotification('Provider delayed. Try others.', 'error');
      return;
    }
    try {
      const resp = await this.api(`/api/bookings/${bookingId}`, { method: 'GET' });
      const data = await resp.json();
      if (data?.status === 'ACCEPTED') {
        clearInterval(interval);
        this.showNotification('Provider accepted. They are on the way!', 'success');
        this.openTracking(bookingId);
      } else if (data?.status === 'DECLINED') {
        clearInterval(interval);
        this.showNotification('Provider declined. Showing similar options...', 'error');
      }
    } catch {}
  }, 3000);
}

  async promptRating(bookingId) {
    const r = prompt('Rate your provider (1-5):', '');
    if (!r) return;
    const rating = Number(r);
    if (!(rating >= 1 && rating <= 5)) return;
    const comment = prompt('Comments (optional):', '') || '';
    try {
      await this.apiJson('/api/reviews', { method: 'POST', body: JSON.stringify({ bookingId, rating, comment }) });
      this.showNotification('Thanks for your rating!', 'success');
    } catch {
      this.showNotification('Failed to submit rating.', 'error');
    }
  }

  // Search with AI suggestions
  async handleSearch(query) {
    if (!query.trim()) {
      this.hideSuggestions();
      return;
    }
    const local = this.services.filter(service =>
      service.name.toLowerCase().includes(query.toLowerCase()) ||
      (service.description || '').toLowerCase().includes(query.toLowerCase()) ||
      (service.examples && service.examples.some(example => example.toLowerCase().includes(query.toLowerCase())))
    );
    this.showSuggestions(local);
    try {
      const resp = await this.api('/api/search/suggestions', { method: 'POST', body: JSON.stringify({ query }) });
      const apiData = await resp.json().catch(() => ({}));
      const apiSuggestions = Array.isArray(apiData?.suggestions) ? apiData.suggestions : [];
      if (apiSuggestions.length > 0) {
        const aiList = apiSuggestions.map((text) => ({
          id: `sugg-${text}`, name: text, icon: '🔎', description: 'Suggested', examples: [], basePrice: ''
        }));
        this.showSuggestions([...aiList, ...local]);
      }
    } catch {}
  }

  showSuggestions(suggestions) {
    const box = document.getElementById('search-suggestions');
    if (!box) return;
    box.innerHTML = '';
    if (!suggestions.length) {
      box.innerHTML = '<div class="suggestion-item">No services found</div>';
    } else {
      suggestions.forEach(service => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
          <div class="suggestion-title">${service.icon || '🔎'} ${service.name || service}</div>
          <div class="suggestion-description">${service.description || ''}</div>
          <div class="suggestion-price">${service.basePrice !== '' && service.basePrice != null ? this.formatCurrency(service.basePrice || 0) : ''}</div>
        `;
        item.addEventListener('click', () => { if (service.id) this.showServiceDetail(service); this.hideSuggestions(); });
        box.appendChild(item);
      });
    }
    box.style.display = 'block';
  }

  hideSuggestions() {
    const box = document.getElementById('search-suggestions');
    if (box) box.style.display = 'none';
  }

  // Quick actions
  handleQuickAction(action) {
    switch (action) {
      case 'ride':
        this.showNotification('Opening ride booking...', 'info');
        break;
      case 'emergency':
        this.showEmergencyModal(); // PANIC only
        break;
      case 'wallet':
        this.showWallet();
        break;
      case 'marketplace':
        this.showNotification('Opening marketplace...', 'info');
        break;
    }
  }

  async showWallet() {
    if (!this.currentUser?.id) { this.showAuthModal(); return; }
    try {
      const wallet = await this.apiJson(`/api/wallet/${this.currentUser.id}`);
      const amount = wallet.balance?.toFixed ? wallet.balance.toFixed(2) : wallet.balance;
      this.showNotification(`Wallet: ${wallet.currency || 'USD'} ${amount}`, 'info');
      try {
        const tx = await this.apiJson(`/api/wallet/${this.currentUser.id}/transactions`);
        if (Array.isArray(tx) && tx.length) this.showNotification(`Recent transactions: ${tx.length}`, 'info');
      } catch {}
    } catch {
      this.showNotification('Unable to load wallet. Please try again.', 'error');
    }
  }

  // Auth modal UI
  showAuthModal() {
    const m = document.getElementById('auth-modal');
    if (!m) return;
    m.classList.add('active'); document.body.classList.add('no-scroll');
  }
  hideAuthModal() {
    const m = document.getElementById('auth-modal');
    if (!m) return;
    m.classList.remove('active'); document.body.classList.remove('no-scroll');
  }
  toggleAuthMode() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');
    const authSwitchText = document.getElementById('auth-switch-text');
    if (!loginForm || !registerForm || !authTitle || !authSwitchText) return;
    if (loginForm.style.display === 'none') {
      loginForm.style.display = 'block'; registerForm.style.display = 'none';
      authTitle.textContent = 'Welcome Back';
      authSwitchText.innerHTML = 'Don\'t have an account? <a href="#" id="auth-switch-link">Register here</a>';
    } else {
      loginForm.style.display = 'none'; registerForm.style.display = 'block';
      authTitle.textContent = 'Join ZippUp';
      authSwitchText.innerHTML = 'Already have an account? <a href="#" id="auth-switch-link">Login here</a>';
    }
    const link = document.getElementById('auth-switch-link');
    if (link) link.addEventListener('click', (e) => { e.preventDefault(); this.toggleAuthMode(); });
  }

  // Auth flows (password + OTP)
  async handleLogin(event) {
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    if (!email || !password) { this.showNotification('Please fill in all fields', 'error'); return; }
    try {
      this.setLoading(event.target, true);
      const res = await this.api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.includes('@') ? email : null, phone: !email.includes('@') ? email : null, password, loginType: 'password' })
      });
      const data = await res.json();
      if (data.success) {
        this.authToken = data.token; this.currentUser = data.user;
        localStorage.setItem('zippup_token', this.authToken);
        localStorage.setItem('zippup_user', JSON.stringify(this.currentUser));
        this.updateUserUI(); this.hideAuthModal();
        this.showNotification('Login successful!', 'success');
      } else this.showNotification(data.error || 'Login failed', 'error');
    } catch {
      this.showNotification('Network error. Please try again.', 'error');
    } finally { this.setLoading(event.target, false); }
  }

  async handleRegister(event) {
    const name = document.getElementById('register-name')?.value;
    const email = document.getElementById('register-email')?.value;
    const phone = document.getElementById('register-phone')?.value;
    const password = document.getElementById('register-password')?.value;
    if (!name || !email || !phone || !password) { this.showNotification('Please fill in all fields', 'error'); return; }
    try {
      this.setLoading(event.target, true);
      const res = await this.api('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, phone, password }) });
      const data = await res.json();
      if (data.success) {
        this.sessionId = data.sessionId;
        this.showOTPForm();
        this.showNotification('Verification codes sent (demo).', 'info');
      } else this.showNotification(data.error || 'Registration failed', 'error');
    } catch {
      this.showNotification('Network error. Please try again.', 'error');
    } finally { this.setLoading(event.target, false); }
  }

  async handleOTPVerification(event) {
    const emailOtp = document.getElementById('email-otp')?.value;
    const phoneOtp = document.getElementById('phone-otp')?.value;
    if (!emailOtp || !phoneOtp || !this.sessionId) { this.showNotification('Enter both OTP codes', 'error'); return; }
    try {
      this.setLoading(event.target, true);
      const res = await this.api('/api/auth/verify', { method: 'POST', body: JSON.stringify({ sessionId: this.sessionId, emailOtp, phoneOtp }) });
      const data = await res.json();
      if (data.success) {
        this.authToken = data.token; this.currentUser = data.user;
        localStorage.setItem('zippup_token', this.authToken);
        localStorage.setItem('zippup_user', JSON.stringify(this.currentUser));
        this.updateUserUI(); this.hideAuthModal();
        this.showNotification('Account created successfully!', 'success');
      } else this.showNotification(data.error || 'Verification failed', 'error');
    } catch {
      this.showNotification('Network error. Please try again.', 'error');
    } finally { this.setLoading(event.target, false); }
  }

  async handleOTPLogin() {
    const phone = document.getElementById('login-email')?.value;
    if (!phone) { this.showNotification('Enter your phone number', 'error'); return; }
    try {
      const res = await this.api('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone, loginType: 'otp_request' }) });
      const data = await res.json();
      if (data.success) this.showNotification('OTP sent (demo).', 'info');
      else this.showNotification(data.error || 'Failed to send OTP', 'error');
    } catch {
      this.showNotification('Network error. Please try again.', 'error');
    }
  }

  showOTPForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const otpForm = document.getElementById('otp-form');
    const title = document.getElementById('auth-title');
    if (!loginForm || !registerForm || !otpForm || !title) return;
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    otpForm.style.display = 'block';
    title.textContent = 'Verify Your Account';
  }

  // UI helpers
  setLoading(element, isLoading) {
    if (!element) return;
    if (isLoading) { element.classList.add('loading'); element.disabled = true; }
    else { element.classList.remove('loading'); element.disabled = false; }
  }
  showNotification(message, type = 'info') {
    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    n.style.cssText = `
      position: fixed; top: 20px; right: 20px; background: ${type==='error' ? '#EF4444' : type==='success' ? '#10B981' : '#3B82F6'};
      color: white; padding: 16px 20px; border-radius: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.25); z-index: 10000; max-width: 320px; transform: translateX(100%); transition: transform .3s ease;
    `;
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => n.style.transform = 'translateX(0)', 50);
    setTimeout(() => { n.style.transform = 'translateX(100%)'; setTimeout(() => n.remove(), 300); }, 4500);
  }
  showInstallPrompt() {
    const el = document.getElementById('install-prompt');
    if (!el) return;
    el.style.display = 'block';
    setTimeout(() => el.classList.add('show'), 100);
  }
  hideInstallPrompt() {
    const el = document.getElementById('install-prompt');
    if (!el) return;
    el.classList.remove('show'); setTimeout(() => el.style.display = 'none', 300);
  }
  navigateToPage(page) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const target = document.querySelector(`[data-page="${page}"]`);
    if (target) target.classList.add('active');
    this.currentPage = page;
  }
  hideAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.body.classList.remove('no-scroll');
  }

  // Placeholder
  async bookService() {
    this.showNotification('Booking created (demo).', 'success');
    this.hideServiceModal();
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ZippUpApp();
});
window.bookService = (serviceId) => window.app.bookService(serviceId);
window.hideServiceModal = () => window.app.hideServiceModal();
