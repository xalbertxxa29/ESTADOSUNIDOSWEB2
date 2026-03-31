// Toast notification utility
export function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'opacity .3s ease, transform .3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

export function showLoading(message = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    const msg = document.getElementById('loadingMessage');
    if (overlay) { overlay.style.display = 'flex'; }
    if (msg) msg.textContent = message;
}

export function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

export function formatDate(val) {
    if (!val) return '-';
    try {
        const d = val.toDate ? val.toDate() : new Date(val);
        if (isNaN(d)) return '-';
        return d.toLocaleDateString('es-PE', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    } catch { return '-'; }
}

export function pdfFormatDate(val) {
    if (!val) return '-';
    try {
        const d = val.toDate ? val.toDate() : new Date(val);
        if (isNaN(d)) return '-';
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yy} ${hh}:${mi}`;
    } catch { return '-'; }
}
