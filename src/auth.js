// Authentication Module
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';
import { i18n } from './languages.js';
import { showToast } from './utils.js';

let onLoginSuccess = null;
let onLogoutSuccess = null;

export function initAuth(callbacks = {}) {
    onLoginSuccess = callbacks.onLogin || (() => { });
    onLogoutSuccess = callbacks.onLogout || (() => { });

    setupLoginForm();
    setupLogout();
    setupPasswordToggle();
    watchAuthState();
}

function setupLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        const btn = document.getElementById('loginBtn');
        const errEl = document.getElementById('loginError');

        if (!email || !password) return;

        // Set loading state
        btn?.classList.add('loading');
        btn.disabled = true;
        if (errEl) errEl.textContent = '';

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onLoginSuccess called by watchAuthState
        } catch (err) {
            if (errEl) errEl.textContent = getErrorMessage(err.code);
        } finally {
            btn?.classList.remove('loading');
            btn.disabled = false;
        }
    });
}

function setupLogout() {
    const btn = document.getElementById('logoutBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            showToast('Sesión cerrada correctamente.', 'info');
        } catch (err) {
            showToast('Error al cerrar sesión.', 'error');
        }
    });
}

function setupPasswordToggle() {
    const toggleBtn = document.getElementById('togglePassword');
    const pwdInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    if (!toggleBtn || !pwdInput) return;
    toggleBtn.addEventListener('click', () => {
        const isPassword = pwdInput.type === 'password';
        pwdInput.type = isPassword ? 'text' : 'password';
        if (eyeIcon) eyeIcon.className = `fas fa-eye${isPassword ? '-slash' : ''}`;
    });
}

function watchAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            showApp(user);
            onLoginSuccess(user);
        } else {
            showLogin();
            onLogoutSuccess();
        }
    });
}

function showLogin() {
    const loginContainer = document.getElementById('loginContainer');
    const appContainer = document.getElementById('appContainer');
    if (loginContainer) loginContainer.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
    // Clear fields
    const emailEl = document.getElementById('email');
    const pwdEl = document.getElementById('password');
    if (emailEl) emailEl.value = '';
    if (pwdEl) pwdEl.value = '';
}

function showApp(user) {
    const loginContainer = document.getElementById('loginContainer');
    const appContainer = document.getElementById('appContainer');
    if (loginContainer) loginContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'grid';

    // Set user info
    const emailEl = document.getElementById('userEmail');
    const emailSidebarEl = document.getElementById('userEmailSidebar');
    if (emailEl) emailEl.textContent = user.email;
    if (emailSidebarEl) emailSidebarEl.textContent = user.email;
}

function getErrorMessage(code) {
    const map = {
        'auth/user-not-found': i18n.t('error_user_not_found'),
        'auth/wrong-password': i18n.t('error_wrong_password'),
        'auth/invalid-credential': i18n.t('error_wrong_password'),
        'auth/invalid-email': i18n.t('error_invalid_email'),
        'auth/too-many-requests': i18n.t('error_too_many_requests'),
        'auth/user-disabled': i18n.t('error_user_disabled'),
    };
    return map[code] || i18n.t('error_login_failed');
}
