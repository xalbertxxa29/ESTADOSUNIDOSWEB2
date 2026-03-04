// App Module - Navigation & Sidebar
import { i18n } from './languages.js';

let sidebarOverlay = null;

export function initApp() {
    createSidebarOverlay();
    setupNavigation();
    setupSidebarToggle();
    setupLanguageSelectors();
}

function createSidebarOverlay() {
    sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    sidebarOverlay.id = 'sidebarOverlay';
    document.body.appendChild(sidebarOverlay);
    sidebarOverlay.addEventListener('click', closeSidebar);
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
            closeSidebar();
        });
    });
}

export function navigateTo(page) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

    // Update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`${page}Page`)?.classList.add('active');

    // Update header title
    const titleKey = { dashboard: 'dashboard_title', table: 'table_title' };
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = i18n.t(titleKey[page] || page);
}

function setupSidebarToggle() {
    const toggleBtn = document.getElementById('toggleSidebarHeader');
    toggleBtn?.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar?.classList.toggle('open');
        sidebarOverlay?.classList.toggle('active');
    });
}

function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    sidebarOverlay?.classList.remove('active');
}

function setupLanguageSelectors() {
    ['languageSelector', 'languageSelectorLogin'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        sel.value = i18n.getCurrentLanguage();
        sel.addEventListener('change', (e) => {
            i18n.setLanguage(e.target.value);
        });
    });
}
