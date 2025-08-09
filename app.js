<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZippUp - Your All-in-One Service Platform</title>
    <meta name="description" content="ZippUp: Rides, Services, Emergency Help, and More">
    <meta name="theme-color" content="#2563EB">
    
    <!-- PWA Meta Tags -->
    <link rel="manifest" href="manifest.json">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="ZippUp">
    <link rel="apple-touch-icon" href="icons/icon-192.png">

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

    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="icons/favicon-16x16.png">
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    
    <!-- CSS -->
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Splash Screen -->
    <div id="splash-screen" class="splash-screen">
        <div class="splash-content">
            <div class="logo-container">
                <div class="logo">⚡</div>
                <h1>ZippUp</h1>
            </div>
            <div class="loading-spinner"></div>
        </div>
    </div>

    <!-- App Container -->
    <div id="app" class="app-container" style="display: none;">
        <!-- Header -->
        <header class="header">
            <div class="header-content">
                <div class="user-greeting">
                    <span class="greeting-text">Hello, <span id="user-name">User</span>!</span>
                    <span class="location-text">📍 <span id="user-location">Current Location</span></span>
                </div>
                <div class="header-actions">
                    <button class="icon-btn" id="notifications-btn">
                        <span class="material-icons">notifications</span>
                        <span class="badge">3</span>
                    </button>
                    <button class="icon-btn" id="profile-btn">
                        <span class="material-icons">account_circle</span>
                    </button>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Search Section -->
            <section class="search-section">
                <div class="search-container">
                    <div class="search-input-container">
                        <span class="material-icons search-icon">search</span>
                        <input type="text" id="search-input" placeholder="What service do you need?" autocomplete="off">
                        <button class="voice-btn" id="voice-search-btn">
                            <span class="material-icons">mic</span>
                        </button>
                    </div>
                    <div id="search-suggestions" class="search-suggestions" style="display: none;">
                        <!-- AI-powered suggestions will appear here -->
                    </div>
                </div>
            </section>

            <!-- Emergency Button -->
            <section class="emergency-section">
                <button class="emergency-btn" id="emergency-btn">
                    <span class="emergency-icon">🚨</span>
                    <span class="emergency-text">Emergency</span>
                </button>
            </section>

            <!-- Quick Actions -->
            <section class="quick-actions">
                <h2>Quick Actions</h2>
                <div class="quick-actions-grid">
                    <button class="quick-action-card" data-action="ride">
                        <span class="action-icon">🚗</span>
                        <span class="action-text">Book Ride</span>
                    </button>
                    <button class="quick-action-card" data-action="emergency">
                        <span class="action-icon">🚨</span>
                        <span class="action-text">Emergency</span>
                    </button>
                    <button class="quick-action-card" data-action="wallet">
                        <span class="action-icon">💰</span>
                        <span class="action-text">Wallet</span>
                    </button>
                    <button class="quick-action-card" data-action="marketplace">
                        <span class="action-icon">🛒</span>
                        <span class="action-text">Shop</span>
                    </button>
                </div>
            </section>

            <!-- Services Categories -->
            <section class="services-section">
                <h2>All Services</h2>
                <div class="services-grid" id="services-grid">
                    <!-- Services will be populated dynamically -->
                </div>
            </section>

            <!-- Recent Bookings -->
            <section class="recent-section">
                <h2>Recent Activity</h2>
                <div class="recent-list" id="recent-list">
                    <!-- Recent bookings will appear here -->
                </div>
            </section>
        </main>

        <!-- Bottom Navigation -->
        <nav class="bottom-nav">
            <button class="nav-item active" data-page="home">
                <span class="material-icons">home</span>
                <span class="nav-label">Home</span>
            </button>
            <button class="nav-item" data-page="services">
                <span class="material-icons">grid_view</span>
                <span class="nav-label">Services</span>
            </button>
            <button class="nav-item" data-page="bookings">
                <span class="material-icons">event_note</span>
                <span class="nav-label">Bookings</span>
            </button>
            <button class="nav-item" data-page="chat">
                <span class="material-icons">chat</span>
                <span class="nav-label">Chat</span>
            </button>
            <button class="nav-item" data-page="profile">
                <span class="material-icons">person</span>
                <span class="nav-label">Profile</span>
            </button>
        </nav>
    </div>

    <!-- Modals -->
    
    <!-- Authentication Modal -->
    <div id="auth-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="auth-title">Welcome to ZippUp</h3>
                <button class="close-btn" id="close-auth-modal">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="modal-body">
                <!-- Login Form -->
                <form id="login-form" class="auth-form">
                    <div class="form-group">
                        <label for="login-email">Email or Phone</label>
                        <input type="text" id="login-email" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <input type="password" id="login-password" required>
                    </div>
                    <button type="submit" class="primary-btn">Login</button>
                    <button type="button" class="secondary-btn" id="request-otp-btn">Login with OTP</button>
                </form>

                <!-- Register Form -->
                <form id="register-form" class="auth-form" style="display: none;">
                    <div class="form-group">
                        <label for="register-name">Full Name</label>
                        <input type="text" id="register-name" required>
                    </div>
                    <div class="form-group">
                        <label for="register-email">Email</label>
                        <input type="email" id="register-email" required>
                    </div>
                    <div class="form-group">
                        <label for="register-phone">Phone Number</label>
                        <input type="tel" id="register-phone" required>
                    </div>
                    <div class="form-group">
                        <label for="register-password">Password</label>
                        <input type="password" id="register-password" required>
                    </div>
                    <button type="submit" class="primary-btn">Register</button>
                </form>

                <!-- OTP Verification Form -->
                <form id="otp-form" class="auth-form" style="display: none;">
                    <div class="otp-info">
                        <p>Enter the verification codes sent to your email and phone:</p>
                    </div>
                    <div class="form-group">
                        <label for="email-otp">Email OTP</label>
                        <input type="text" id="email-otp" maxlength="6" required>
                    </div>
                    <div class="form-group">
                        <label for="phone-otp">Phone OTP</label>
                        <input type="text" id="phone-otp" maxlength="6" required>
                    </div>
                    <button type="submit" class="primary-btn">Verify</button>
                </form>

                <div class="auth-switch">
                    <p id="auth-switch-text">Don't have an account? <a href="#" id="auth-switch-link">Register here</a></p>
                </div>
            </div>
        </div>
    </div>

    <!-- Service Detail Modal -->
    <div id="service-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="service-title">Service Details</h3>
                <button class="close-btn" id="close-service-modal">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="modal-body">
                <div id="service-details">
                    <!-- Service details will be populated here -->
                </div>
            </div>
        </div>
    </div>

    <!-- Emergency Modal -->
    <div id="emergency-modal" class="modal">
        <div class="modal-content emergency-modal-content">
            <div class="emergency-header">
                <h3>🚨 Emergency Alert</h3>
                <p>Are you sure you want to send an emergency alert?</p>
            </div>
            <div class="emergency-actions">
                <button class="emergency-confirm-btn" id="confirm-emergency">Yes, Send Alert</button>
                <button class="emergency-cancel-btn" id="cancel-emergency">Cancel</button>
            </div>
        </div>
    </div>

    <!-- Install Prompt -->
    <div id="install-prompt" class="install-prompt" style="display: none;">
        <div class="install-content">
            <div class="install-info">
                <span class="install-icon">📱</span>
                <div class="install-text">
                    <h4>Install ZippUp</h4>
                    <p>Add to your home screen for easy access</p>
                </div>
            </div>
            <div class="install-actions">
                <button class="install-btn" id="install-btn">Install</button>
                <button class="dismiss-btn" id="dismiss-install">Later</button>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="app.js"></script>
    <script>
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => console.log('SW registered'))
                    .catch(error => console.log('SW registration failed'));
            });
        }
    </script>
</body>
</html>
Now let me get the next essential file - the CSS:

/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    /* Colors */
    --primary: #2563EB;
    --primary-light: #3B82F6;
    --primary-dark: #1E40AF;
    --secondary: #10B981;
    --secondary-light: #34D399;
    --secondary-dark: #059669;
    --accent: #F59E0B;
    --accent-light: #FBBF24;
    --accent-dark: #D97706;
    --emergency: #DC2626;
    --emergency-light: #F87171;
    --emergency-dark: #B91C1C;
    
    /* Status Colors */
    --success: #10B981;
    --warning: #F59E0B;
    --error: #EF4444;
    --info: #3B82F6;
    
    /* Text Colors */
    --text-primary: #111827;
    --text-secondary: #6B7280;
    --text-tertiary: #9CA3AF;
    --text-light: #F9FAFB;
    
    /* Background Colors */
    --background: #F9FAFB;
    --background-secondary: #F3F4F6;
    --card-background: #FFFFFF;
    --modal-background: rgba(0, 0, 0, 0.5);
    
    /* Border Colors */
    --border: #E5E7EB;
    --border-light: #F3F4F6;
    --border-dark: #D1D5DB;
    
    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --spacing-2xl: 3rem;
    
    /* Border Radius */
    --radius-sm: 6px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --radius-full: 50%;
    
    /* Shadows */
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
    
    /* Transitions */
    --transition-fast: 0.15s ease;
    --transition-normal: 0.3s ease;
    --transition-slow: 0.5s ease;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: var(--text-primary);
    background-color: var(--background);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Splash Screen */
.splash-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeOut 0.5s ease 2s forwards;
}

.splash-content {
    text-align: center;
    color: white;
}

.logo-container {
    margin-bottom: var(--spacing-xl);
}

.logo {
    font-size: 4rem;
    margin-bottom: var(--spacing-sm);
    animation: bounce 1s ease infinite;
}

.splash-content h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: var(--spacing-lg);
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: var(--radius-full);
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

@keyframes fadeOut {
    to {
        opacity: 0;
        visibility: hidden;
    }
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-10px);
    }
    60% {
        transform: translateY(-5px);
    }
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* App Container */
.app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding-bottom: 80px;
}

/* Header */
.header {
    background: white;
    padding: var(--spacing-md) var(--spacing-lg);
    box-shadow: var(--shadow-sm);
    position: sticky;
    top: 0;
    z-index: 100;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
}

.user-greeting {
    flex: 1;
}

.greeting-text {
    display: block;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
}

.location-text {
    display: block;
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-top: var(--spacing-xs);
}

.header-actions {
    display: flex;
    gap: var(--spacing-sm);
}

.icon-btn {
    position: relative;
    width: 44px;
    height: 44px;
    border: none;
    background: var(--background-secondary);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.icon-btn:hover {
    background: var(--border);
    transform: scale(1.05);
}

.icon-btn .material-icons {
    font-size: 20px;
    color: var(--text-primary);
}

.badge {
    position: absolute;
    top: -2px;
    right: -2px;
    background: var(--error);
    color: white;
    border-radius: var(--radius-full);
    min-width: 18px;
    height: 18px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

/* Main Content */
.main-content {
    flex: 1;
    padding: var(--spacing-lg);
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}

/* Search Section */
.search-section {
    margin-bottom: var(--spacing-xl);
}

.search-container {
    position: relative;
}

.search-input-container {
    position: relative;
    display: flex;
    align-items: center;
    background: white;
    border: 2px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-sm);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-fast);
}

.search-input-container:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.search-icon {
    color: var(--text-secondary);
    margin-right: var(--spacing-sm);
}

#search-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 1rem;
    padding: var(--spacing-sm);
    background: transparent;
}

#search-input::placeholder {
    color: var(--text-tertiary);
}

.voice-btn {
    background: var(--primary);
    border: none;
    border-radius: var(--radius-md);
    padding: var(--spacing-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
}

.voice-btn:hover {
    background: var(--primary-dark);
    transform: scale(1.05);
}

.voice-btn .material-icons {
    color: white;
    font-size: 20px;
}

.voice-btn.recording {
    background: var(--error);
    animation: pulse 1s infinite;
}

/* Emergency Button */
.emergency-section {
    margin-bottom: var(--spacing-xl);
    display: flex;
    justify-content: center;
}

.emergency-btn {
    background: linear-gradient(135deg, var(--emergency) 0%, var(--emergency-dark) 100%);
    border: none;
    border-radius: var(--radius-full);
    padding: var(--spacing-lg) var(--spacing-xl);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    box-shadow: var(--shadow-lg);
}

.emergency-btn:hover {
    transform: scale(1.05);
    box-shadow: var(--shadow-xl);
}

.emergency-btn:active {
    transform: scale(0.95);
}

.emergency-icon {
    font-size: 1.5rem;
}

.emergency-text {
    color: white;
    font-weight: 600;
    font-size: 1.125rem;
}

/* Services and Cards */
.services-section, .quick-actions {
    margin-bottom: var(--spacing-xl);
}

.services-section h2, .quick-actions h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: var(--spacing-lg);
    color: var(--text-primary);
}

.quick-actions-grid, .services-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
}

.quick-action-card, .service-card {
    background: white;
    border: none;
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    cursor: pointer;
    transition: all var(--transition-fast);
    box-shadow: var(--shadow-sm);
}

.quick-action-card:hover, .service-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.action-icon, .service-icon {
    font-size: 2rem;
    margin-bottom: var(--spacing-sm);
}

.action-text, .service-name {
    font-weight: 600;
    color: var(--text-primary);
}

.service-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: var(--spacing-xs) 0;
}

.service-examples {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    margin-bottom: var(--spacing-sm);
}

.service-price {
    font-size: 0.875rem;
    color: var(--primary);
    font-weight: 600;
}

/* Bottom Navigation */
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-around;
    padding: var(--spacing-sm) 0;
    z-index: 100;
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    border: none;
    background: transparent;
    padding: var(--spacing-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    color: var(--text-secondary);
    min-width: 60px;
}

.nav-item.active {
    color: var(--primary);
}

.nav-item:hover {
    color: var(--primary);
    transform: scale(1.1);
}

.nav-item .material-icons {
    font-size: 24px;
}

.nav-label {
    font-size: 0.75rem;
    font-weight: 500;
}

/* Modals */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--modal-background);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all var(--transition-normal);
}

.modal.active {
    opacity: 1;
    visibility: visible;
}

.modal-content {
    background: white;
    border-radius: var(--radius-lg);
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-xl);
    transform: scale(0.9);
    transition: all var(--transition-normal);
}

.modal.active .modal-content {
    transform: scale(1);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--border);
}

.modal-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
}

.close-btn {
    background: var(--background-secondary);
    border: none;
    border-radius: var(--radius-full);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.close-btn:hover {
    background: var(--border);
}

.modal-body {
    padding: var(--spacing-lg);
}

/* Forms */
.auth-form {
    max-width: 400px;
}

.form-group {
    margin-bottom: var(--spacing-lg);
}

.form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
    color: var(--text-primary);
}

.form-group input {
    width: 100%;
    padding: var(--spacing-md);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 1rem;
    transition: all var(--transition-fast);
}

.form-group input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.primary-btn, .secondary-btn {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    border: none;
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-bottom: var(--spacing-sm);
}

.primary-btn {
    background: var(--primary);
    color: white;
}

.primary-btn:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
}

.secondary-btn {
    background: var(--background-secondary);
    color: var(--text-primary);
}

.secondary-btn:hover {
    background: var(--border);
}

/* Responsive Design */
@media (max-width: 768px) {
    .services-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .quick-actions-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .modal-content {
        max-width: 95vw;
        margin: var(--spacing-md);
    }
    
    .main-content {
        padding: var(--spacing-md);
    }
}

@media (max-width: 480px) {
    .services-grid {
        grid-template-columns: 1fr;
    }
    
    .service-card {
        flex-direction: row;
        text-align: left;
        gap: var(--spacing-md);
    }
    
    .service-icon {
        font-size: 2rem;
        margin-bottom: 0;
    }
}

/* Utility Classes */
.hidden {
    display: none !important;
}

.no-scroll {
    overflow: hidden;
}

// ZippUp PWA - Main Application Logic
class ZippUpApp {
    constructor() {
        this.baseUrl = 'https://zippup-backend-v3.onrender.com';
        this.currentUser = null;
        this.authToken = null;
        this.currentPage = 'home';
        this.services = [];
        this.sessionId = null;
        this.deferredPrompt = null;
        this.isListening = false;
        this.recognition = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing ZippUp PWA...');
        
        // Show splash screen for 2 seconds
        setTimeout(() => {
            this.hideSplashScreen();
        }, 2000);

        // Initialize components
        this.initializeAuth();
        this.initializeEventListeners();
        this.initializeVoiceRecognition();
        this.initializePWA();
        
        // Load data
        await this.loadServices();
        this.initializeLocation();
        
        console.log('✅ ZippUp PWA initialized successfully');
    }

    hideSplashScreen() {
        const splashScreen = document.getElementById('splash-screen');
        const app = document.getElementById('app');
        
        splashScreen.style.opacity = '0';
        setTimeout(() => {
            splashScreen.style.display = 'none';
            app.style.display = 'flex';
            
            // Check if user is authenticated
            if (!this.authToken) {
                this.showAuthModal();
            }
        }, 500);
    }

    initializeAuth() {
        // Check for saved auth token
        this.authToken = localStorage.getItem('zippup_token');
        const userData = localStorage.getItem('zippup_user');
        
        if (this.authToken && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.updateUserUI();
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
            }
        }
    }

    initializeEventListeners() {
        // Auth modal events
        document.getElementById('close-auth-modal').addEventListener('click', () => {
            this.hideAuthModal();
        });

        document.getElementById('auth-switch-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthMode();
        });

        // Form submissions
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e);
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister(e);
        });

        document.getElementById('otp-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleOTPVerification(e);
        });

        document.getElementById('request-otp-btn').addEventListener('click', () => {
            this.handleOTPLogin();
        });

        // Emergency button
        document.getElementById('emergency-btn').addEventListener('click', () => {
            this.showEmergencyModal();
        });

        document.getElementById('confirm-emergency').addEventListener('click', () => {
            this.triggerEmergency();
        });

        document.getElementById('cancel-emergency').addEventListener('click', () => {
            this.hideEmergencyModal();
        });

        // Voice search
        document.getElementById('voice-search-btn').addEventListener('click', () => {
            this.toggleVoiceSearch();
        });

        // Search input
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Quick actions
        document.querySelectorAll('.quick-action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Profile button
        document.getElementById('profile-btn').addEventListener('click', () => {
            this.navigateToPage('profile');
        });

        // Install prompt
        document.getElementById('install-btn').addEventListener('click', () => {
            this.installPWA();
        });

        document.getElementById('dismiss-install').addEventListener('click', () => {
            this.hideInstallPrompt();
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
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
                document.getElementById('voice-search-btn').classList.add('recording');
                console.log('🎤 Voice recognition started');
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('search-input').value = transcript;
                this.handleSearch(transcript);
                console.log('🎤 Voice input:', transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                this.stopVoiceSearch();
            };

            this.recognition.onend = () => {
                this.stopVoiceSearch();
            };
        }
    }

    initializePWA() {
        // Handle PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        // Handle PWA installation
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA installed successfully');
            this.hideInstallPrompt();
        });
    }

    async initializeLocation() {
        if ('geolocation' in navigator) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                
                const { latitude, longitude } = position.coords;
                
                // Reverse geocoding to get location name
                const locationName = await this.reverseGeocode(latitude, longitude);
                document.getElementById('user-location').textContent = locationName || 'Unknown Location';
            } catch (error) {
                console.error('Error getting location:', error);
                document.getElementById('user-location').textContent = 'Location unavailable';
            }
        }
    }

    async reverseGeocode(lat, lng) {
        try {
            // Using a simple reverse geocoding service
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
            const data = await response.json();
            return `${data.city}, ${data.countryName}`;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    }

    // Authentication Methods
    showAuthModal() {
        document.getElementById('auth-modal').classList.add('active');
        document.body.classList.add('no-scroll');
    }

    hideAuthModal() {
        document.getElementById('auth-modal').classList.remove('active');
        document.body.classList.remove('no-scroll');
    }

    toggleAuthMode() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const authTitle = document.getElementById('auth-title');
        const authSwitchText = document.getElementById('auth-switch-text');

        if (loginForm.style.display === 'none') {
            // Switch to login
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            authTitle.textContent = 'Welcome Back';
            authSwitchText.innerHTML = 'Don\'t have an account? <a href="#" id="auth-switch-link">Register here</a>';
        } else {
            // Switch to register
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            authTitle.textContent = 'Join ZippUp';
            authSwitchText.innerHTML = 'Already have an account? <a href="#" id="auth-switch-link">Login here</a>';
        }

        // Re-attach event listener
        document.getElementById('auth-switch-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthMode();
        });
    }

    async handleLogin(event) {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            this.setLoading(event.target, true);
            
            const response = await fetch(`${this.baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.includes('@') ? email : null,
                    phone: !email.includes('@') ? email : null,
                    password,
                    loginType: 'password'
                }),
            });

            const data = await response.json();

            if (data.success) {
                this.authToken = data.token;
                this.currentUser = data.user;
                
                localStorage.setItem('zippup_token', this.authToken);
                localStorage.setItem('zippup_user', JSON.stringify(this.currentUser));
                
                this.updateUserUI();
                this.hideAuthModal();
                this.showNotification('Login successful!', 'success');
            } else {
                this.showNotification(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(event.target, false);
        }
    }

    async handleRegister(event) {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('register-phone').value;
        const password = document.getElementById('register-password').value;

        if (!name || !email || !phone || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            this.setLoading(event.target, true);
            
            const response = await fetch(`${this.baseUrl}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, phone, password }),
            });

            const data = await response.json();

            if (data.success) {
                this.sessionId = data.sessionId;
                this.showOTPForm();
                this.showNotification(`OTPs sent! Email: ${data.demo.emailOtp}, Phone: ${data.demo.phoneOtp}`, 'info');
            } else {
                this.showNotification(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(event.target, false);
        }
    }

    async handleOTPVerification(event) {
        const emailOtp = document.getElementById('email-otp').value;
        const phoneOtp = document.getElementById('phone-otp').value;

        if (!emailOtp || !phoneOtp || !this.sessionId) {
            this.showNotification('Please enter both OTP codes', 'error');
            return;
        }

        try {
            this.setLoading(event.target, true);
            
            const response = await fetch(`${this.baseUrl}/api/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    emailOtp,
                    phoneOtp
                }),
            });

            const data = await response.json();

            if (data.success) {
                this.authToken = data.token;
                this.currentUser = data.user;
                
                localStorage.setItem('zippup_token', this.authToken);
                localStorage.setItem('zippup_user', JSON.stringify(this.currentUser));
                
                this.updateUserUI();
                this.hideAuthModal();
                this.showNotification('Account created successfully!', 'success');
            } else {
                this.showNotification(data.error || 'Verification failed', 'error');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(event.target, false);
        }
    }

    async handleOTPLogin() {
        const phone = document.getElementById('login-email').value;
        
        if (!phone) {
            this.showNotification('Please enter your phone number', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone,
                    loginType: 'otp_request'
                }),
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification(`OTP sent to ${phone}! Demo OTP: ${data.demo.otp}`, 'info');
            } else {
                this.showNotification(data.error || 'Failed to send OTP', 'error');
            }
        } catch (error) {
            console.error('OTP request error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        }
    }

    showOTPForm() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('otp-form').style.display = 'block';
        document.getElementById('auth-title').textContent = 'Verify Your Account';
    }

    updateUserUI() {
        if (this.currentUser) {
            document.getElementById('user-name').textContent = this.currentUser.name;
        }
    }

    logout() {
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('zippup_token');
        localStorage.removeItem('zippup_user');
        
        document.getElementById('user-name').textContent = 'User';
        this.showAuthModal();
    }

    // Services Methods
    async loadServices() {
        try {
            const response = await fetch(`${this.baseUrl}/api/services`);
            const data = await response.json();
            
            if (data.success) {
                this.services = data.services;
                this.renderServices();
            }
        } catch (error) {
            console.error('Error loading services:', error);
            this.loadDemoServices();
        }
    }

    loadDemoServices() {
        this.services = [
            { id: '1', name: 'Ride & Moving', category: 'TRANSPORT', icon: '🚗', description: 'Taxi, bike rides, delivery, moving services', examples: ['Taxi', 'Bike rides', 'Delivery', 'Moving trucks'], basePrice: 50 },
            { id: '2', name: 'Personal Care', category: 'PERSONAL_CARE', icon: '💅', description: 'Hair, massage, beauty services', examples: ['Hair styling', 'Massage', 'Manicure', 'Beauty treatments'], basePrice: 30 },
            { id: '3', name: 'Tech Services', category: 'TECH', icon: '🔧', description: 'Phone repair, computer fixing, electronics', examples: ['Phone repair', 'Computer fixing', 'TV repair', 'Electronics'], basePrice: 40 },
            { id: '4', name: 'Construction', category: 'CONSTRUCTION', icon: '🏗️', description: 'Builders, carpenters, electricians', examples: ['Builders', 'Carpenters', 'Electricians', 'Plumbers'], basePrice: 80 },
            { id: '5', name: 'Home Services', category: 'HOME', icon: '🏠', description: 'Cleaning, gardening, maintenance', examples: ['House cleaning', 'Gardening', 'Maintenance', 'Painting'], basePrice: 35 },
            { id: '6', name: 'Emergency Services', category: 'EMERGENCY', icon: '🚨', description: 'Ambulance, fire, roadside assistance', examples: ['Ambulance', 'Fire services', 'Roadside assistance', 'Emergency repair'], basePrice: 100 },
            { id: '7', name: 'Automobile', category: 'AUTOMOBILE', icon: '🔧', description: 'Car repair, mechanics, tire services', examples: ['Mechanics', 'Vulcanizer', 'Car wash', 'Auto repair'], basePrice: 60 },
            { id: '8', name: 'Others', category: 'OTHERS', icon: '🎉', description: 'Events, catering, general services', examples: ['Events', 'Catering', 'General services', 'Photography'], basePrice: 45 }
        ];
        this.renderServices();
    }

    renderServices() {
        const servicesGrid = document.getElementById('services-grid');
        servicesGrid.innerHTML = '';

        this.services.forEach(service => {
            const serviceCard = document.createElement('button');
            serviceCard.className = 'service-card';
            serviceCard.innerHTML = `
                <div class="service-icon">${service.icon}</div>
                <div class="service-name">${service.name}</div>
                <div class="service-description">${service.description}</div>
                <div class="service-examples">${service.examples ? service.examples.join(', ') : ''}</div>
                <div class="service-price">From $${service.basePrice}</div>
            `;
            
            serviceCard.addEventListener('click', () => {
                this.showServiceDetail(service);
            });
            
            servicesGrid.appendChild(serviceCard);
        });

        // Render recent activities
        this.renderRecentActivity();
    }

    renderRecentActivity() {
        const recentList = document.getElementById('recent-list');
        recentList.innerHTML = '';

        // Demo recent activities
        const recentActivities = [
            { id: '1', title: 'Taxi to Airport', subtitle: 'Completed 2 hours ago', status: 'completed', icon: '🚗' },
            { id: '2', title: 'House Cleaning', subtitle: 'Scheduled for tomorrow', status: 'pending', icon: '🏠' },
            { id: '3', title: 'Phone Repair', subtitle: 'Cancelled yesterday', status: 'cancelled', icon: '🔧' }
        ];

        recentActivities.forEach(activity => {
            const recentItem = document.createElement('div');
            recentItem.className = 'recent-item';
            recentItem.innerHTML = `
                <div class="recent-icon">${activity.icon}</div>
                <div class="recent-details">
                    <div class="recent-title">${activity.title}</div>
                    <div class="recent-subtitle">${activity.subtitle}</div>
                </div>
                <div class="recent-status status-${activity.status}">${activity.status}</div>
            `;
            recentList.appendChild(recentItem);
        });
    }

    showServiceDetail(service) {
        const modal = document.getElementById('service-modal');
        const title = document.getElementById('service-title');
        const details = document.getElementById('service-details');
        
        title.textContent = service.name;
        details.innerHTML = `
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 4rem; margin-bottom: 16px;">${service.icon}</div>
                <h3>${service.name}</h3>
                <p style="color: var(--text-secondary); margin: 8px 0;">${service.description}</p>
                <p style="color: var(--primary); font-weight: 600;">Starting from $${service.basePrice}</p>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h4 style="margin-bottom: 12px;">Available Services:</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${service.examples ? service.examples.map(example => 
                        `<span style="background: var(--background-secondary); padding: 4px 8px; border-radius: 6px; font-size: 0.875rem;">${example}</span>`
                    ).join('') : ''}
                </div>
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button class="primary-btn" onclick="app.bookService('${service.id}')" style="flex: 1;">Book Now</button>
                <button class="secondary-btn" onclick="app.hideServiceModal()" style="flex: 1;">Close</button>
            </div>
        `;
        
        modal.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    hideServiceModal() {
        document.getElementById('service-modal').classList.remove('active');
        document.body.classList.remove('no-scroll');
    }

    async bookService(serviceId) {
        if (!this.authToken) {
            this.showAuthModal();
            return;
        }

        try {
            const service = this.services.find(s => s.id === serviceId);
            this.showNotification(`Booking ${service.name}... (Demo mode)`, 'info');
            this.hideServiceModal();
            
            // In a real app, this would create a booking
            setTimeout(() => {
                this.showNotification('Booking created successfully!', 'success');
            }, 1500);
        } catch (error) {
            console.error('Booking error:', error);
            this.showNotification('Failed to create booking', 'error');
        }
    }

    // Search Methods
  async handleSearch(query) {
    if (!query.trim()) {
      this.hideSuggestions();
      return;
    }

    // Local filtering first
    const localSuggestions = this.services.filter(service =>
      service.name.toLowerCase().includes(query.toLowerCase()) ||
      service.description.toLowerCase().includes(query.toLowerCase()) ||
      (service.examples && service.examples.some(example =>
        example.toLowerCase().includes(query.toLowerCase())
      ))
    );

    // Show local suggestions immediately
    this.showSuggestions(localSuggestions);

    // Try to fetch AI suggestions from backend and merge
    try {
      const resp = await this.api('/api/search/suggestions', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });
      const apiData = await resp.json();
      const apiSuggestions = Array.isArray(apiData?.suggestions) ? apiData.suggestions : [];

      if (apiSuggestions.length > 0) {
        const aiList = apiSuggestions.map((text) => ({
          id: `sugg-${text}`,
          name: text,
          icon: '🔎',
          description: 'Suggested',
          examples: [],
          basePrice: '',
        }));

        // AI suggestions first, then local
        this.showSuggestions([
          ...aiList,
          ...localSuggestions
        ]);
      }
    } catch {
      // If backend suggestions fail, local suggestions are already shown
    }
  }

    // Voice Search Methods
    toggleVoiceSearch() {
        if (!this.recognition) {
            this.showNotification('Voice search not supported in this browser', 'error');
            return;
        }

        if (this.isListening) {
            this.stopVoiceSearch();
        } else {
            this.startVoiceSearch();
        }
    }

    startVoiceSearch() {
        if (this.recognition) {
            this.recognition.start();
        }
    }

    stopVoiceSearch() {
        this.isListening = false;
        document.getElementById('voice-search-btn').classList.remove('recording');
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    // Emergency Methods
    showEmergencyModal() {
        document.getElementById('emergency-modal').classList.add('active');
        document.body.classList.add('no-scroll');
    }

    hideEmergencyModal() {
        document.getElementById('emergency-modal').classList.remove('active');
        document.body.classList.remove('no-scroll');
    }

    async triggerEmergency() {
    this.hideEmergencyModal();

    try {
      let latitude = null, longitude = null;

      if ('geolocation' in navigator) {
        try {
          const position = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
          );
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch {
          // continue without location
        }
      }

      const body = {
        latitude,
        longitude,
        message: 'Emergency alert from ZippUp PWA',
        userId: this.currentUser?.id || null,
      };

      const data = await this.apiJson('/api/emergency/alert', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      this.showNotification('🚨 Emergency alert sent! Help is on the way.', 'error');

      const trackingPath = data.trackingUrl || (data.alertId ? `/emergency/track/${data.alertId}` : null);
      if (trackingPath) {
        const full = `${this.baseUrl}${trackingPath.startsWith('/') ? trackingPath : `/${trackingPath}`}`;
        setTimeout(() => { window.location.href = full; }, 500);
      }
    } catch (error) {
      console.error('Emergency error:', error);
      this.showNotification('Failed to send emergency alert. Please call local services.', 'error');
    }
  }

    // Navigation Methods
    navigateToPage(page) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
        
        this.currentPage = page;
        
        
        switch (page) {
            case 'home':
                this.showNotification('Home page', 'info');
                break;
            case 'services':
                this.showNotification('Services page', 'info');
                break;
            case 'bookings':
                this.showNotification('Bookings page', 'info');
                break;
            case 'chat':
                this.showNotification('Chat page', 'info');
                break;
            case 'profile':
                this.showNotification('Profile page', 'info');
                break;
        }
    }

   handleQuickAction(action) {
    switch (action) {
      case 'ride':
        this.showNotification('Opening ride booking...', 'info');
        break;
      case 'emergency':
        this.showEmergencyModal();
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
    if (!this.currentUser?.id) {
      this.showAuthModal();
      return;
    }
    try {
      const wallet = await this.apiJson(`/api/wallet/${this.currentUser.id}`);
      const amount = wallet.balance?.toFixed ? wallet.balance.toFixed(2) : wallet.balance;
      this.showNotification(`Wallet: ${wallet.currency || 'USD'} ${amount}`, 'info');

      // Optional: fetch transactions
      try {
        const tx = await this.apiJson(`/api/wallet/${this.currentUser.id}/transactions`);
        if (Array.isArray(tx) && tx.length) {
          this.showNotification(`Recent transactions: ${tx.length}`, 'info');
        }
      } catch {}
    } catch {
      this.showNotification('Unable to load wallet. Please try again.', 'error');
    }
  }
    
    // PWA Methods
    showInstallPrompt() {
        document.getElementById('install-prompt').style.display = 'block';
        setTimeout(() => {
            document.getElementById('install-prompt').classList.add('show');
        }, 100);
    }

    hideInstallPrompt() {
        document.getElementById('install-prompt').classList.remove('show');
        setTimeout(() => {
            document.getElementById('install-prompt').style.display = 'none';
        }, 300);
    }

    async installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            
            this.deferredPrompt = null;
            this.hideInstallPrompt();
        }
    }

    // Utility Methods
    setLoading(element, isLoading) {
        if (isLoading) {
            element.classList.add('loading');
            element.disabled = true;
        } else {
            element.classList.remove('loading');
            element.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? 'var(--error)' : type === 'success' ? 'var(--success)' : 'var(--info)'};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            max-width: 300px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.classList.remove('no-scroll');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ZippUpApp();
});

// Global functions for inline event handlers
window.bookService = (serviceId) => window.app.bookService(serviceId);
window.hideServiceModal = () => window.app.hideServiceModal();

{
  "name": "ZippUp - Your All-in-One Service Platform",
  "short_name": "ZippUp",
  "description": "Book rides, services, emergency help, and more with ZippUp - your complete service platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F9FAFB",
  "theme_color": "#2563EB",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "en",
  "categories": ["productivity", "business", "travel", "utilities"],
  "icons": [
    {
      "src": "icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Emergency",
      "short_name": "Emergency",
      "description": "Quick access to emergency services",
      "url": "/?action=emergency"
    },
    {
      "name": "Book Ride",
      "short_name": "Ride",
      "description": "Book a ride quickly",
      "url": "/?action=ride"
    },
    {
      "name": "Services",
      "short_name": "Services",
      "description": "Browse all services",
      "url": "/?page=services"
    }
  ]
}
