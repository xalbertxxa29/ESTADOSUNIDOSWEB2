// Table Module - Dual tabs (Facility & Security) with pagination, Excel & PDF export
import { db } from './firebase.js';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, pdfFormatDate, showLoading, hideLoading, showToast } from './utils.js';

const PER_PAGE = 10;
let allData = [];
let facilityData = [], facilityFiltered = [], facilityPage = 1;
let securityData = [], securityFiltered = [], securityPage = 1;
let listenersReady = false;

export async function initTable() {
    await fetchData();
    setupListeners();
    setupImageModal();
}

async function fetchData() {
    try {
        const q = query(collection(db, 'IncidenciasEU'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        allData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        facilityData = allData.filter(d => !d.tipoServicio || d.tipoServicio === 'Facility');
        securityData = allData.filter(d => d.tipoServicio === 'Security');
        facilityFiltered = [...facilityData];
        securityFiltered = [...securityData];
        render('facility');
        render('security');
    } catch (err) {
        console.error('Table fetch error:', err);
        showToast('Error al cargar los datos.', 'error');
    }
}

function setupListeners() {
    if (listenersReady) return;
    listenersReady = true;

    // Tab switching within table page
    const tablePage = document.getElementById('tablePage');
    tablePage?.querySelectorAll('.tabs-bar .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            tablePage.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            tablePage.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab; // 'facility-table' | 'security-table'
            const cat = tab.startsWith('facility') ? 'facility' : 'security';
            const contentId = cat === 'facility' ? 'facilityTableContent' : 'securityTableContent';
            document.getElementById(contentId)?.classList.add('active');
            render(cat);
        });
    });

    // Facility
    bind('filterBtn', () => applyFilter('facility'));
    bind('resetFilterBtn', () => resetFilter('facility'));
    bind('exportExcelBtn', () => exportExcel('facility'));
    bind('exportPdfBtn', () => exportPdf('facility'));

    // Security
    bind('filterBtnSec', () => applyFilter('security'));
    bind('resetFilterBtnSec', () => resetFilter('security'));
    bind('exportExcelBtnSec', () => exportExcel('security'));
    bind('exportPdfBtnSec', () => exportPdf('security'));
}

function bind(id, fn) {
    document.getElementById(id)?.addEventListener('click', fn);
}

// ─── Render Table ────────────────────────────────────────
function render(cat) {
    const isSec = cat === 'security';
    const suffix = isSec ? 'Sec' : '';
    const tbodyId = `tableBody${suffix}`;
    const infoId = isSec ? 'tableInfoSec' : 'tableInfoFac';
    const pagId = `paginationControls${suffix}`;

    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const filtered = isSec ? securityFiltered : facilityFiltered;
    const page = isSec ? securityPage : facilityPage;
    const start = (page - 1) * PER_PAGE;
    const end = start + PER_PAGE;
    const pageData = filtered.slice(start, end);

    // Info label
    const infoEl = document.getElementById(infoId);
    if (infoEl) {
        if (filtered.length === 0) {
            infoEl.textContent = 'No hay registros para mostrar.';
        } else {
            infoEl.textContent = `Mostrando ${start + 1} – ${Math.min(end, filtered.length)} de ${filtered.length} registros`;
        }
    }

    // Rows
    tbody.innerHTML = '';
    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:#9ca3af">
      <i class="fas fa-inbox" style="font-size:28px;display:block;margin-bottom:10px;color:#d1d5db"></i>
      No se encontraron registros
    </td></tr>`;
        renderPagination(cat);
        return;
    }

    pageData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td style="white-space:nowrap">${formatDate(item.createdAt)}</td>
      <td>${item.nombreAgente || '-'}</td>
      <td>${item.punto || '-'}</td>
      <td style="max-width:260px">${item.observacion || '-'}</td>
      <td>
        ${item.evidenciaDataUrl
                ? `<img src="${item.evidenciaDataUrl}" class="thumbnail-img" data-full="${item.evidenciaDataUrl}" alt="foto" />`
                : '<span style="color:#d1d5db">—</span>'}
      </td>
    `;
        tbody.appendChild(tr);
    });

    // Re-attach thumb listeners
    tbody.querySelectorAll('.thumbnail-img').forEach(img => {
        img.addEventListener('click', openImageModal);
    });

    renderPagination(cat);
}

// ─── Pagination ──────────────────────────────────────────
function renderPagination(cat) {
    const isSec = cat === 'security';
    const suffix = isSec ? 'Sec' : '';
    const bar = document.getElementById(`paginationControls${suffix}`);
    if (!bar) return;

    const filtered = isSec ? securityFiltered : facilityFiltered;
    const page = isSec ? securityPage : facilityPage;
    const totalPages = Math.ceil(filtered.length / PER_PAGE);

    bar.innerHTML = '';
    if (totalPages <= 1) return;

    const mkBtn = (label, disabled, onClick, active = false) => {
        const btn = document.createElement('button');
        btn.className = `pag-btn${active ? ' active' : ''}`;
        btn.innerHTML = label;
        btn.disabled = disabled;
        btn.addEventListener('click', onClick);
        return btn;
    };

    bar.appendChild(mkBtn('<i class="fas fa-chevron-left"></i>', page === 1, () => {
        if (isSec) securityPage--; else facilityPage--;
        render(cat);
    }));

    // Page numbers (show up to 5 around current)
    const range = getPaginationRange(page, totalPages);
    range.forEach(p => {
        if (p === '...') {
            const dots = document.createElement('span');
            dots.className = 'pag-indicator';
            dots.textContent = '…';
            bar.appendChild(dots);
        } else {
            bar.appendChild(mkBtn(p, false, () => {
                if (isSec) securityPage = p; else facilityPage = p;
                render(cat);
            }, p === page));
        }
    });

    bar.appendChild(mkBtn('<i class="fas fa-chevron-right"></i>', page === totalPages, () => {
        if (isSec) securityPage++; else facilityPage++;
        render(cat);
    }));
}

function getPaginationRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
}

// ─── Filters ─────────────────────────────────────────────
function applyFilter(cat) {
    const isSec = cat === 'security';
    const suffix = isSec ? 'Sec' : '';
    const from = document.getElementById(`filterFromDate${suffix}`)?.value;
    const to = document.getElementById(`filterToDate${suffix}`)?.value;
    if (!from || !to) { showToast('Selecciona ambas fechas.', 'info'); return; }

    // Fix: parse as LOCAL time using multi-arg constructor (new Date(str) parses ISO as UTC causing timezone shift)
    const [fy, fm, fd] = from.split('-').map(Number);
    const fromD = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
    const [ty, tm, td] = to.split('-').map(Number);
    const toD = new Date(ty, tm - 1, td, 23, 59, 59, 999);

    const source = isSec ? securityData : facilityData;
    const filtered = source.filter(item => {
        const d = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        return d >= fromD && d <= toD;
    });

    if (isSec) { securityFiltered = filtered; securityPage = 1; }
    else { facilityFiltered = filtered; facilityPage = 1; }
    render(cat);
    showToast(`${filtered.length} registros encontrados.`, 'success');
}

function resetFilter(cat) {
    const isSec = cat === 'security';
    const suffix = isSec ? 'Sec' : '';
    const f = document.getElementById(`filterFromDate${suffix}`);
    const t = document.getElementById(`filterToDate${suffix}`);
    if (f) f.value = '';
    if (t) t.value = '';
    if (isSec) { securityFiltered = [...securityData]; securityPage = 1; }
    else { facilityFiltered = [...facilityData]; facilityPage = 1; }
    render(cat);
}

// ─── Image Modal ─────────────────────────────────────────
function openImageModal(e) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('modalImage');
    if (!modal || !img) return;
    img.src = e.target.getAttribute('data-full');
    modal.classList.add('active');
}

function setupImageModal() {
    const modal = document.getElementById('imageModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    if (!modal) return;
    closeBtn?.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
}

// ─── Excel Export ────────────────────────────────────────
function exportExcel(cat) {
    const isSec = cat === 'security';
    const data = isSec ? securityFiltered : facilityFiltered;
    if (!data.length) { showToast('No hay datos para exportar.', 'info'); return; }

    const rows = [['Fecha', 'Nombre', 'Punto de Marcación', 'Observación']];
    data.forEach(item => rows.push([
        formatDate(item.createdAt),
        item.nombreAgente || '-',
        item.punto || '-',
        item.observacion || '-',
    ]));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 20 }, { wch: 22 }, { wch: 30 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `Reporte_${cat.toUpperCase()}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Excel exportado correctamente.', 'success');
}

// ─── PDF Export ──────────────────────────────────────────
async function exportPdf(cat) {
    const isSec = cat === 'security';
    const data = isSec ? securityFiltered : facilityFiltered;
    if (!data.length) { showToast('No data to export.', 'info'); return; }

    showLoading('Generating PDF...');
    try {
        const suffix = isSec ? 'Sec' : '';
        const fromRaw = document.getElementById(`filterFromDate${suffix}`)?.value;
        const toRaw = document.getElementById(`filterToDate${suffix}`)?.value;
        const dateRangeText = (fromRaw && toRaw)
            ? `${fmtInput(fromRaw)} – ${fmtInput(toRaw)}`
            : 'All records';
        const genDate = new Date().toLocaleString('en-US');
        const label = isSec ? 'SECURITY' : 'FACILITY';
        const ac = isSec ? { r: 79, g: 70, b: 229, light: [238, 242, 255] }
            : { r: 220, g: 38, b: 38, light: [255, 241, 242] };
        const filename = `Report_${label}_${new Date().toISOString().split('T')[0]}.pdf`;

        // Logo
        let logoDataUrl = null;
        try {
            const res = await fetch('/logo.png');
            if (res.ok) {
                const blob = await res.blob();
                logoDataUrl = await new Promise(res => {
                    const r = new FileReader();
                    r.onload = () => res(r.result);
                    r.readAsDataURL(blob);
                });
            }
        } catch { /* logo optional */ }

        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        const PW = doc.internal.pageSize.getWidth();
        const PH = doc.internal.pageSize.getHeight();
        const ML = 10, MR = 10, CW = PW - ML - MR;

        // ── Cover header ──
        doc.setFillColor(ac.r, ac.g, ac.b);
        doc.roundedRect(ML, 10, CW, 28, 3, 3, 'F');
        let lx = ML + 4;
        if (logoDataUrl) {
            try { doc.addImage(logoDataUrl, 'PNG', lx, 13, 22, 22); lx += 26; } catch { }
        }
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5); doc.text('REPORTING SYSTEM · LIDERMAN', lx, 17);
        doc.setFontSize(14); doc.text('INCIDENT REPORT', lx, 25);
        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
        doc.text('United States Operations', lx, 31);
        // Badge
        const bW = 30, bX = PW - MR - bW;
        doc.roundedRect(bX, 13, bW, 18, 2, 2, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11); doc.text(label, bX + bW / 2, 23, { align: 'center' });
        doc.setFontSize(6); doc.setFont('helvetica', 'normal');
        doc.text('Categoría', bX + bW / 2, 28, { align: 'center' });

        // ── Meta boxes ──
        const bw = (CW - 8) / 3;
        const metaLabels = ['DATE RANGE', 'TOTAL RECORDS', 'GENERATED ON'];
        const metaVals = [dateRangeText, `${data.length} records`, genDate];
        metaLabels.forEach((lbl, i) => {
            const bx = ML + i * (bw + 4);
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(bx, 42, bw, 14, 2, 2, 'F');
            doc.setFillColor(ac.r, ac.g, ac.b);
            doc.rect(bx, 42, 1.5, 14, 'F');
            doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'bold'); doc.setFontSize(5);
            doc.text(lbl, bx + 4, 47);
            doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
            doc.text(String(metaVals[i]), bx + 4, 52, { maxWidth: bw - 6 });
        });

        // ── autoTable ──
        const rows = data.map(item => [
            pdfFormatDate(item.createdAt),
            item.nombreAgente || '-',
            item.punto || '-',
            item.observacion || '-',
        ]);

        autoTable(doc, {
            head: [['DATE', 'NAME', 'MARKING POINT', 'OBSERVATION']],
            body: rows,
            startY: 60,
            margin: { left: ML, right: MR, top: 22, bottom: 14 },
            styles: {
                fontSize: 7.5, cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
                overflow: 'linebreak', textColor: [30, 41, 59],
                lineColor: [226, 232, 240], lineWidth: 0.15,
            },
            headStyles: {
                fillColor: [ac.r, ac.g, ac.b], textColor: [255, 255, 255],
                fontStyle: 'bold', fontSize: 7,
            },
            alternateRowStyles: { fillColor: ac.light },
            columnStyles: {
                0: { cellWidth: 32 }, 1: { cellWidth: 32 },
                2: { cellWidth: 50 }, 3: { cellWidth: 'auto' },
            },
            didDrawPage: (hook) => {
                const pg = doc.internal.getCurrentPageInfo().pageNumber;
                if (pg > 1) {
                    // Continuation header
                    doc.setFillColor(ac.r, ac.g, ac.b);
                    doc.roundedRect(ML, 8, CW, 10, 2, 2, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
                    doc.text(`INCIDENT REPORT — ${label}`, ML + 3, 14);
                    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
                    doc.text(dateRangeText, PW - MR, 14, { align: 'right' });
                }
                // Footer placeholder
                const y = PH - 7;
                doc.setFillColor(ac.r, ac.g, ac.b); doc.rect(ML, y - 1, CW, 0.5, 'F');
                doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
                doc.text(`© ${new Date().getFullYear()} Liderman · LiderControl System`, ML, y + 3);
                doc.setTextColor(ac.r, ac.g, ac.b); doc.setFont('helvetica', 'bold');
                doc.text(`Page ${pg} / ?`, PW - MR, y + 3, { align: 'right' });
            },
            showHead: 'everyPage',
        });

        // Fix page numbers
        const total = doc.internal.getNumberOfPages();
        for (let p = 1; p <= total; p++) {
            doc.setPage(p);
            doc.setFillColor(255, 255, 255);
            doc.rect(PW - MR - 28, PH - 10, 32, 6, 'F');
            doc.setTextColor(ac.r, ac.g, ac.b);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(6);
            doc.text(`Page ${p} / ${total}`, PW - MR, PH - 7 + 3, { align: 'right' });
        }

        doc.save(filename);
        showToast('PDF generated successfully.', 'success');
    } catch (err) {
        console.error(err);
        showToast('Error generating PDF.', 'error');
    } finally {
        hideLoading();
    }
}

function fmtInput(iso) {
    const parts = iso.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iso;
}
