// Main entry point - LiderControl EU (Vite + Firebase Modular SDK v9)
import './style.css';
import { i18n } from './languages.js';
import { initAuth } from './auth.js';
import { initApp, navigateTo } from './app.js';
import { initDashboard } from './dashboard.js';
import { initTable } from './table.js';
import { showLoading, hideLoading } from './utils.js';

// ── Init i18n immediately ──
i18n.init();

// ── Init Auth with callbacks ──
initAuth({
  onLogin: async (user) => {
    // Show premium transition overlay
    showLoading('Initialising your dashboard...');

    // Init app navigation
    initApp();

    // Navigate to dashboard by default
    navigateTo('dashboard');

    // Load dashboard & table data
    await Promise.all([
      initDashboard(),
      initTable(),
    ]);

    // Hide once data is ready
    hideLoading();
  },
  onLogout: () => {
    // Reset to dashboard view for next login
    // Already handled by auth module showing login page
  },
});
