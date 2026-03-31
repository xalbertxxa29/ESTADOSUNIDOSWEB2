// Dashboard Module - Charts (Chart.js) + Maps (Leaflet)
import { i18n } from './languages.js';
import { db } from './firebase.js';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// leaflet.heat loaded via CDN

Chart.register(ChartDataLabels);
// Global Chart defaults
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#6b7280';
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15,23,42,0.95)';
Chart.defaults.plugins.tooltip.padding = 14;
Chart.defaults.plugins.tooltip.cornerRadius = 10;
Chart.defaults.plugins.tooltip.titleFont = { size: 12, weight: '700' };
Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
Chart.defaults.plugins.datalabels.display = false; // off by default, enabled per chart

const RICH_PALETTE = [
    '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#a855f7', '#0ea5e9', '#22c55e', '#fb923c',
    '#e879f9', '#34d399', '#60a5fa', '#fbbf24', '#c084fc'
];

let allData = [];
let currentFacilityData = [];
let currentSecurityData = [];

// Chart instances
const charts = {};

// Map instances
let mapFac = null, mapSec = null;
let heatFac = null, heatSec = null;
let markersFac = null, markersSec = null;

// Pending map data (for deferred init when tab is hidden)
const pendingMap = { facility: null, security: null };

export async function initDashboard() {
    await fetchData();
    setupTabListeners();
    setupDateFilters();
}

async function fetchData() {
    try {
        // Default to last 15 days
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        
        const q = query(
            collection(db, 'IncidenciasEU'),
            where('createdAt', '>=', fifteenDaysAgo),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        processData(allData);
    } catch (err) {
        console.error('Dashboard fetch error:', err);
    }
}

function processData(data) {
    currentFacilityData = data.filter(d => !d.tipoServicio || d.tipoServicio === 'Facility');
    currentSecurityData = data.filter(d => d.tipoServicio === 'Security');
    renderFacility(currentFacilityData);
    renderSecurity(currentSecurityData);
}

// ─── Tab Listeners ──────────────────────────────────────
function setupTabListeners() {
    const dashPage = document.getElementById('dashboardPage');
    if (!dashPage) return;
    dashPage.querySelectorAll('.tabs-bar .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            dashPage.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            dashPage.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab + 'Content';
            const content = document.getElementById(tabId);
            if (content) content.classList.add('active');

            // Wait for CSS to make tab visible, then init/refresh maps
            setTimeout(() => {
                if (mapFac) mapFac.invalidateSize();

                if (mapSec) {
                    mapSec.invalidateSize();
                } else if (pendingMap.security) {
                    // Security map was skipped because its container was hidden — init now
                    const { data, elementId, type } = pendingMap.security;
                    updateMap(data, elementId, type);
                    pendingMap.security = null;
                }
            }, 150);
        });
    });
}


// ─── Date Filter ─────────────────────────────────────────
function setupDateFilters() {
    const container = document.getElementById('dashboardFilterContainer');
    if (!container || container.innerHTML.trim()) return;
    container.innerHTML = `
    <div class="dash-filter-bar">
      <div>
        <label data-i18n="from_date">${i18n.t('from_date')}</label>
        <input type="date" id="dashFrom" />
      </div>
      <div>
        <label data-i18n="to_date">${i18n.t('to_date')}</label>
        <input type="date" id="dashTo" />
      </div>
      <button id="dashFilterBtn" class="btn-filter" style="margin-top:0">
        <i class="fas fa-search"></i> <span data-i18n="filter_button">${i18n.t('filter_button')}</span>
      </button>
      <button id="dashResetBtn" class="btn-reset" style="margin-top:0">
        <i class="fas fa-times"></i> <span data-i18n="clear_button">${i18n.t('clear_button')}</span>
      </button>
    </div>
  `;
    document.getElementById('dashFilterBtn').addEventListener('click', applyFilter);
    document.getElementById('dashResetBtn').addEventListener('click', resetFilter);
}

function applyFilter() {
    const f = document.getElementById('dashFrom')?.value;
    const t = document.getElementById('dashTo')?.value;
    if (!f || !t) return alert(i18n.t('select_dates'));
    // Fix: parse as LOCAL time (new Date(ISO string) treats it as UTC → timezone shift)
    const [fy, fm, fd] = f.split('-').map(Number);
    const from = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
    const [ty, tm, td] = t.split('-').map(Number);
    const to = new Date(ty, tm - 1, td, 23, 59, 59, 999);
    const filtered = allData.filter(d => {
        const date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
        return !isNaN(date) && date >= from && date <= to;
    });
    processData(filtered);
}

function resetFilter() {
    const f = document.getElementById('dashFrom');
    const t = document.getElementById('dashTo');
    if (f) f.value = '';
    if (t) t.value = '';
    processData(allData);
}

// ─── Animated counter ────────────────────────────────────────
function animateCount(el, target) {
    if (!el) return;
    const start = parseInt(el.textContent.replace(/,/g, '')) || 0;
    const diff = target - start;
    if (diff === 0) { el.textContent = target.toLocaleString(); return; }
    const steps = 28;
    let step = 0;
    const timer = setInterval(() => {
        step++;
        el.textContent = Math.round(start + diff * (step / steps)).toLocaleString();
        if (step >= steps) clearInterval(timer);
    }, 16);
}

// ─── Render Facility ─────────────────────────────────────
function renderFacility(data) {
    animateCount(document.getElementById('totalRecords'), data.length);
    updateLineChart('lineChartDate', getDateCounts(data), '#dc2626');
    updateBarChart('barChartAgent', getAgentCounts(data));
    updateDoughnutChart('pieChartPoints', getPointCounts(data));
    scheduleMap(data, 'map', 'facility');
}

// ─── Render Security ─────────────────────────────────────
function renderSecurity(data) {
    animateCount(document.getElementById('totalRecordsSec'), data.length);
    updateLineChart('lineChartDateSec', getDateCounts(data), '#4f46e5');
    updateBarChart('barChartAgentSec', getAgentCounts(data));
    updateDoughnutChart('pieChartPointsSec', getPointCounts(data));
    scheduleMap(data, 'mapSec', 'security');
}

// ─── Chart Builders ──────────────────────────────────────
function destroyChart(id) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function updateLineChart(id, dataMap, color) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    destroyChart(id);
    const ctx = canvas.getContext('2d');
    const values = Object.values(dataMap);
    const maxVal = Math.max(...values, 1);
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    const grad = ctx.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, color + 'a0');
    grad.addColorStop(0.65, color + '25');
    grad.addColorStop(1, color + '00');

    charts[id] = new Chart(canvas, {
        type: 'line',
        data: {
            labels: Object.keys(dataMap),
            datasets: [{
                label: i18n.t('incidents'),
                data: values,
                borderColor: color,
                backgroundColor: grad,
                borderWidth: 2.5,
                pointBackgroundColor: (ctx2) => ctx2.raw === maxVal ? color : '#fff',
                pointBorderColor: color,
                pointBorderWidth: 2,
                pointRadius: (ctx2) => ctx2.raw >= avg * 1.3 ? 5 : 3,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 30, right: 10 } },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `📅 ${items[0].label}`,
                        label: (item) => `  ${i18n.t('records_label')}: ${item.raw}`,
                    }
                },
                datalabels: {
                    display: (ctx2) => {
                        const v = ctx2.dataset.data[ctx2.dataIndex];
                        return v === maxVal || v >= avg * 2;
                    },
                    color: color,
                    font: { size: 11, weight: '800' },
                    anchor: 'end',
                    align: 'top',
                    offset: 3,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    borderRadius: 4,
                    padding: { top: 2, bottom: 2, left: 5, right: 5 },
                    borderColor: color,
                    borderWidth: 1,
                    formatter: (v) => v,
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxRotation: 45, font: { size: 10 }, color: '#9ca3af', maxTicksLimit: 12 }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#f3f4f6' },
                    ticks: { font: { size: 11 }, color: '#9ca3af', precision: 0 }
                }
            },
            interaction: { mode: 'index', intersect: false },
        }
    });
}

function updateBarChart(id, dataMap) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    destroyChart(id);
    // Sort descending
    const sorted = Object.entries(dataMap).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(e => e[0]);
    const values = sorted.map(e => e[1]);
    const maxVal = Math.max(...values, 1);
    const bgColors = values.map((v, i) =>
        v === maxVal ? RICH_PALETTE[0] : RICH_PALETTE[(i + 1) % RICH_PALETTE.length]
    );
    charts[id] = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: i18n.t('records_label'),
                data: values,
                backgroundColor: bgColors,
                borderRadius: 6,
                barPercentage: 0.7,
                categoryPercentage: 0.85,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { right: 52 } },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: { label: (item) => `  ${i18n.t('records_label')}: ${item.raw.toLocaleString()}` }
                },
                datalabels: {
                    display: true,
                    anchor: 'end',
                    align: 'end',
                    offset: 5,
                    color: (ctx2) => bgColors[ctx2.dataIndex],
                    font: { size: 11, weight: '700' },
                    formatter: v => v.toLocaleString(),
                }
            },
            scales: {
                x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, color: '#9ca3af' } },
                y: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#374151' } }
            },
            interaction: { mode: 'index', intersect: false },
        }
    });
}

function updateDoughnutChart(id, dataMap) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    destroyChart(id);
    const sorted = Object.entries(dataMap).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(e => e[0]);
    const values = sorted.map(e => e[1]);
    const total = values.reduce((a, b) => a + b, 0);
    charts[id] = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: RICH_PALETTE,
                borderWidth: 3,
                borderColor: '#fff',
                hoverOffset: 14,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '64%',
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 11 },
                        padding: 10,
                        generateLabels: (chart) => {
                            const ds = chart.data.datasets[0];
                            return chart.data.labels.map((label, i) => ({
                                text: `${label}  (${ds.data[i].toLocaleString()})`,
                                fillStyle: ds.backgroundColor[i % ds.backgroundColor.length],
                                strokeStyle: '#fff',
                                lineWidth: 2,
                                pointStyle: 'circle',
                                hidden: false,
                                index: i,
                            }));
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (item) => {
                            const pct = total > 0 ? ((item.raw / total) * 100).toFixed(1) : 0;
                            return `  ${item.label}: ${item.raw.toLocaleString()} (${pct}%)`;
                        }
                    }
                },
                datalabels: {
                    display: (ctx2) => {
                        const pct = (ctx2.dataset.data[ctx2.dataIndex] / total) * 100;
                        return pct >= 5;
                    },
                    color: '#fff',
                    font: { weight: '800', size: 11 },
                    textShadowBlur: 4,
                    textShadowColor: 'rgba(0,0,0,0.4)',
                    formatter: (value) => {
                        const pct = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                        return `${pct}%`;
                    },
                }
            }
        }
    });
}

// ─── Leaflet Map ─────────────────────────────────────────
function scheduleMap(data, elementId, type) {
    // Always save the latest data so a deferred init can use it
    pendingMap[type] = { data, elementId, type };
    // Try to init after paint; will no-op if container is hidden
    setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
            updateMap(data, elementId, type);
            pendingMap[type] = null; // cleared: map initialized
        }
        // else: remains in pendingMap, will be picked up on tab switch
    }, 250);
}

function updateMap(data, elementId, type) {
    const el = document.getElementById(elementId);
    if (!el) return;
    // Don't bail if hidden — Leaflet can init, we just force invalidate after
    let map = type === 'facility' ? mapFac : mapSec;
    if (!map) {
        map = L.map(elementId, { zoomControl: true }).setView([39.5, -98.35], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
            maxZoom: 18,
        }).addTo(map);
        new ResizeObserver(() => map.invalidateSize()).observe(el);
        if (type === 'facility') mapFac = map; else mapSec = map;
    }

    // Clear old layers
    let heat = type === 'facility' ? heatFac : heatSec;
    let markers = type === 'facility' ? markersFac : markersSec;
    if (heat) { map.removeLayer(heat); heat = null; }
    if (markers) { map.removeLayer(markers); markers = null; }

    const heatPoints = [];
    const markerList = [];
    const validCoords = [];
    const markerColor = type === 'facility' ? '#dc2626' : '#4f46e5';

    data.forEach(item => {
        const lat = parseFloat(item.ubicacion?.lat);
        const lng = parseFloat(item.ubicacion?.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
            heatPoints.push([lat, lng, 0.8]);
            validCoords.push([lat, lng]);
            const m = L.circleMarker([lat, lng], {
                radius: 7, fillColor: markerColor, color: '#fff',
                weight: 2, opacity: 1, fillOpacity: 0.85,
            }).bindPopup(`
        <div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.6">
          <strong>${item.nombreAgente || 'Agente'}</strong><br/>
          ${item.punto || ''}<br/>
          <small style="color:#6b7280">${fmtDate(item.createdAt)}</small>
        </div>
      `);
            markerList.push(m);
        }
    });

    if (typeof L.heatLayer === 'function' && heatPoints.length > 0) {
        const gradient = type === 'facility'
            ? { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
            : { 0.4: 'cyan', 0.65: 'blue', 1: 'purple' };
        const newHeat = L.heatLayer(heatPoints, { radius: 25, blur: 15, gradient }).addTo(map);
        if (type === 'facility') heatFac = newHeat; else heatSec = newHeat;
    }

    if (markerList.length > 0) {
        const layer = L.layerGroup(markerList).addTo(map);
        if (type === 'facility') markersFac = layer; else markersSec = layer;
    }

    if (validCoords.length === 1) {
        map.setView(validCoords[0], 14);
    } else if (validCoords.length > 1) {
        map.fitBounds(L.latLngBounds(validCoords), { padding: [40, 40] });
    }

    map.invalidateSize();
}

// ─── Aggregation helpers ──────────────────────────────────
function getDateCounts(data) {
    const c = {};
    data.forEach(x => {
        const d = x.createdAt?.toDate ? x.createdAt.toDate() : new Date(x.createdAt);
        if (!isNaN(d)) { 
            const locale = i18n.getCurrentLanguage() === 'es' ? 'es-PE' : 'en-US';
            const k = d.toLocaleDateString(locale); 
            c[k] = (c[k] || 0) + 1; 
        }
    });
    return c;
}
function getAgentCounts(data) {
    const c = {};
    data.forEach(x => { const n = x.nombreAgente || 'N/A'; c[n] = (c[n] || 0) + 1; });
    return c;
}
function getPointCounts(data) {
    const c = {};
    data.forEach(x => { const p = x.punto || 'N/A'; c[p] = (c[p] || 0) + 1; });
    return c;
}
function fmtDate(v) {
    try { 
        const locale = i18n.getCurrentLanguage() === 'es' ? 'es-PE' : 'en-US';
        return (v?.toDate ? v.toDate() : new Date(v)).toLocaleDateString(locale); 
    } catch { return ''; }
}
