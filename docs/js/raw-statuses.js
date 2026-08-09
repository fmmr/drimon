const STATUS_CHANNELS = [
    { id: 2568299, num: 1, label: 'Drimon' },
    { id: 2584548, num: 2, label: 'Detaljer' },
    { id: 2584547, num: 3, label: 'Tech' }
];
const MERGE_WINDOW_MS = 60000;
const TZ = 'Europe/Oslo';

const params = new URLSearchParams(location.search);
const N = Math.max(1, Math.min(8000, parseInt(params.get('n') || '100', 10)));

moment.locale('nb');

document.getElementById('controls').textContent =
    `Siste ${N} mergede statuser · henter fra alle 3 kanaler (?n=NNN, maks 8000)`;

Promise.all(STATUS_CHANNELS.map(c =>
    fetch(`https://api.thingspeak.com/channels/${c.id}/status.json?results=${N}&days=400`)
        .then(r => r.json())
        .then(d => ({ num: c.num, feeds: d.feeds || [] }))
))
    .then(byChannel => render(byChannel))
    .catch(err => {
        document.getElementById('loading').textContent = 'Feil ved henting: ' + err.message;
    });

// Merge identical status strings observed within 60 s across the 3 channels (same wake → one row).
// Mirror of status.js:mergeAcrossChannels. Sorted ascending during merge, then reversed for display.
function mergeAcrossChannels(byChannel) {
    const raw = [];
    for (const { feeds } of byChannel) {
        for (const f of feeds) {
            if (!f.status) continue;
            raw.push({ t: moment.tz(f.created_at, TZ), raw: f.status });
        }
    }
    raw.sort((a, b) => a.t.diff(b.t));

    const wakes = [];
    for (const e of raw) {
        let matched = null;
        for (let i = wakes.length - 1; i >= 0; i--) {
            if (Math.abs(wakes[i].t.diff(e.t)) > MERGE_WINDOW_MS) break;
            if (wakes[i].raw === e.raw) { matched = wakes[i]; break; }
        }
        if (!matched) wakes.push({ t: e.t, raw: e.raw });
    }
    return wakes;
}

function render(byChannel) {
    const merged = mergeAcrossChannels(byChannel);
    if (!merged.length) {
        document.getElementById('loading').textContent = 'Ingen status-data.';
        return;
    }
    // Desc: newest first. Cap at N so ?n=NNN limits both the fetch and the display.
    merged.sort((a, b) => b.t.diff(a.t));
    const rows = merged.slice(0, N);

    const tbody = document.querySelector('#raw-table tbody');
    tbody.innerHTML = rows.map(e => {
        const rawEscaped = e.raw.replace(/"/g, '&quot;');
        return `<tr data-raw="${rawEscaped}" title="Klikk for å kopiere">
            <td class="ts">${e.t.format('YYYY-MM-DD HH:mm:ss')}</td>
            <td class="status-cell">${e.raw}</td>
        </tr>`;
    }).join('');

    tbody.onclick = (evt) => {
        const tr = evt.target.closest('tr[data-raw]');
        if (!tr) return;
        copyToClipboard(tr.dataset.raw).then(ok => {
            if (!ok) return;
            tr.classList.add('copied');
            setTimeout(() => tr.classList.remove('copied'), 600);
        });
    };

    document.getElementById('loading').hidden = true;
    document.getElementById('table-section').hidden = false;
}

// Same fallback pattern as status.js — navigator.clipboard needs a secure context.
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return Promise.resolve(ok);
}
