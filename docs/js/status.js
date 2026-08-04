const CHANNEL = 2568299;
const TECH_CHANNEL = 2584547;
const TECH_VOLT_FIELD = 2;
const TU_FIELD = 4;
const TZ = 'Europe/Oslo';

const params = new URLSearchParams(location.search);
const DAYS = Math.max(1, Math.min(400, parseInt(params.get('days') || '14', 10)));
const RESULTS = Math.max(1, Math.min(8000, parseInt(params.get('results') || '8000', 10)));

moment.locale('nb');

document.getElementById('controls').textContent =
    `Siste ${DAYS} dager · henter opptil ${RESULTS} status-entries`;

Promise.all([
    fetch(`https://api.thingspeak.com/channels/${CHANNEL}/status.json?results=${RESULTS}&days=${DAYS}`).then(r => r.json()),
    fetch(`https://api.thingspeak.com/channels/${TECH_CHANNEL}/feeds.json?results=${RESULTS}&days=${DAYS}`).then(r => r.json())
])
    .then(([main, tech]) => render(main, tech))
    .catch(err => {
        document.getElementById('loading').textContent = 'Feil ved henting: ' + err.message;
    });

function parseStatus(s) {
    const out = {};
    if (!s) return out;
    for (const p of s.split('_')) {
        if (p.startsWith('T-'))       out.T = p.slice(2);
        else if (p.startsWith('W-'))  out.W = p.slice(2);
        else if (p.startsWith('B-'))  out.B = p.slice(2);
        else if (p.startsWith('P-'))  out.P = p.slice(2);
        else if (p.startsWith('WF-')) out.WF = p.slice(3);
        else if (p.startsWith('WT-')) out.WT = parseInt(p.slice(3), 10);
        else if (p.startsWith('FC-')) out.FC = parseInt(p.slice(3), 10);
        else if (p.startsWith('SD-')) out.SD = parseInt(p.slice(3), 10);
        else if (p)                   out.LIGHT = p;
    }
    return out;
}

function render(main, tech) {
    const entries = (main.feeds || [])
        .map(f => ({ t: moment.tz(f.created_at, TZ), s: parseStatus(f.status) }))
        .filter(e => Object.keys(e.s).length > 0);

    if (!entries.length) {
        document.getElementById('loading').textContent = 'Ingen status-data.';
        return;
    }

    const wifiEntries = entries.filter(e => e.s.WF || Number.isFinite(e.s.WT));
    const fcEntries = entries.filter(e => Number.isFinite(e.s.FC));

    const techFeeds = (tech && tech.feeds) || [];
    const techEntries = techFeeds.map(f => ({
        t: moment.tz(f.created_at, TZ),
        v: parseFloat(f[`field${TECH_VOLT_FIELD}`]),
        tu: parseFloat(f[`field${TU_FIELD}`])
    }));
    const tuEntries = techEntries.filter(e => Number.isFinite(e.tu)).map(e => ({ t: e.t, v: e.tu }));
    const voltEntries = techEntries.filter(e => Number.isFinite(e.v));

    renderStats(entries, wifiEntries, tuEntries, fcEntries, voltEntries);
    renderWifiPerDay(wifiEntries);
    renderTimingPerDay(document.getElementById('wt-days'), wifiEntries, e => e.s.WT);
    renderRangePerDay(document.getElementById('batt-v-days'), document.getElementById('batt-v-scale'), voltEntries, e => e.v, 'V', v => v.toFixed(2));
    renderTimingPerDay(document.getElementById('tu-days'), tuEntries, e => e.v);
    renderFcPerDay(fcEntries);
    renderDistributions(entries);
    renderRecent(entries);

    document.getElementById('loading').hidden = true;
    for (const id of ['stats', 'wifi-section', 'wt-section', 'battery-section', 'tu-section', 'fc-section', 'dists-section', 'recent-section']) {
        document.getElementById(id).hidden = false;
    }
}

function renderRangePerDay(el, scaleEl, entries, valFn, unit, fmt) {
    if (!entries.length) { el.innerHTML = '<div class="day-label">Ingen data.</div>'; if (scaleEl) scaleEl.textContent = ''; return; }
    const allVals = entries.map(valFn).filter(Number.isFinite);
    if (!allVals.length) { el.innerHTML = '<div class="day-label">Ingen data.</div>'; if (scaleEl) scaleEl.textContent = ''; return; }
    const globalMin = allVals.reduce((a, b) => Math.min(a, b), Infinity);
    const globalMax = allVals.reduce((a, b) => Math.max(a, b), -Infinity);
    const span = globalMax - globalMin || 1;

    if (scaleEl) scaleEl.textContent = `Skala: ${fmt(globalMin)} → ${fmt(globalMax)} ${unit} (min → maks i data)`;

    const days = groupByDay(entries);
    el.innerHTML = days.map(d => {
        const vals = d.list.map(valFn).filter(Number.isFinite).sort((a, b) => a - b);
        if (!vals.length) return `<span class="day-label">${d.day.format('ddd D. MMM')}</span><span class="wt-bar"></span><span class="day-count">—</span>`;
        const dMin = vals[0];
        const dMax = vals[vals.length - 1];
        const dMed = percentile(vals, 0.5);
        const leftPct = (dMin - globalMin) / span * 100;
        const widthPct = Math.max(1, (dMax - dMin) / span * 100);
        const medianPct = (dMed - globalMin) / span * 100;
        return `<span class="day-label">${d.day.format('ddd D. MMM')}</span>` +
            `<span class="wt-bar" title="min ${fmt(dMin)} · median ${fmt(dMed)} · maks ${fmt(dMax)} ${unit} · n=${vals.length}">` +
                `<span class="fill" style="left:${leftPct.toFixed(2)}%;width:${widthPct.toFixed(2)}%"></span>` +
                `<span class="median" style="left:${medianPct.toFixed(2)}%"></span>` +
            `</span>` +
            `<span class="day-count">${fmt(dMin)}/${fmt(dMax)}</span>`;
    }).join('');
}

function sumConfirmedFails(fcValues) {
    let sum = 0;
    for (let i = 0; i < fcValues.length - 1; i++) {
        if (fcValues[i + 1] < fcValues[i]) sum += fcValues[i];
    }
    return sum;
}

function renderFcPerDay(entries) {
    const el = document.getElementById('fc-days');
    const scaleEl = el.closest('section')?.querySelector('.scale-label');

    if (!entries.length) {
        el.innerHTML = '<div class="day-label">Ingen FC-data — venter på firmware med FC-token.</div>';
        if (scaleEl) scaleEl.textContent = '';
        return;
    }

    const days = groupByDay(entries);
    const perDay = days.map(d => {
        const sorted = [...d.list].sort((a, b) => a.t.diff(b.t));
        const fcs = sorted.map(e => e.s.FC);
        const fails = sumConfirmedFails(fcs);
        const lastFc = fcs[fcs.length - 1];
        return { d, fails, lastFc, n: sorted.length };
    });

    const scaleMax = perDay.reduce((m, x) => Math.max(m, x.fails), 0) || 1;
    const totalFails = perDay.reduce((s, x) => s + x.fails, 0);
    const currentStreak = perDay[0]?.lastFc || 0;

    if (scaleEl) {
        scaleEl.textContent = `Total i data: ${totalFails} feilede wakes · nåværende streak: ${currentStreak}`;
    }

    el.innerHTML = perDay.map(({ d, fails, lastFc }) => {
        const widthPct = fails / scaleMax * 100;
        const label = fails > 0
            ? `${fails} feil · siste FC=${lastFc}`
            : `siste FC=${lastFc}`;
        return `<span class="day-label">${d.day.format('ddd D. MMM')}</span>` +
            `<span class="stack-bar" title="${label}">` +
                (fails > 0 ? `<span class="fail" style="width:${widthPct.toFixed(2)}%"></span>` : '') +
            `</span>` +
            `<span class="day-count">${fails}</span>`;
    }).join('');
}

function groupByDay(entries) {
    const days = new Map();
    for (const e of entries) {
        const key = e.t.clone().startOf('day').format('YYYY-MM-DD');
        if (!days.has(key)) days.set(key, []);
        days.get(key).push(e);
    }
    return [...days.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([key, list]) => ({ key, day: moment.tz(key, TZ), list }));
}

function renderStats(entries, wifiEntries, tuEntries, fcEntries, voltEntries) {
    const total = entries.length;
    const days = groupByDay(entries);
    const avgCycles = Math.round(total / days.length);
    const last = entries[entries.length - 1];

    const wfCounts = countBy(wifiEntries, e => e.s.WF);
    const wfTotal = wifiEntries.length;
    const hitPct = pct(wfCounts.HIT || 0, wfTotal);
    const failPct = pct((wfCounts.FAIL || 0) + (wfCounts.FBK || 0) + (wfCounts.MISS || 0), wfTotal);

    const wts = wifiEntries.map(e => e.s.WT).filter(Number.isFinite).sort((a, b) => a - b);
    const wtP50 = percentile(wts, 0.5);
    const wtP95 = percentile(wts, 0.95);

    const tus = tuEntries.map(e => e.v).filter(Number.isFinite).sort((a, b) => a - b);
    const tuP50 = percentile(tus, 0.5);
    const tuP95 = percentile(tus, 0.95);

    const cell = (label, value, sub) =>
        `<div><span class="stat-label">${label}</span><span class="stat-value">${value}</span>${sub ? `<span class="stat-sub">${sub}</span>` : ''}</div>`;

    document.getElementById('stats').innerHTML = [
        cell('Antall poster', total, `${days.length} dager · snitt ${avgCycles}/dag`),
        cell('WF-telemetri', wfTotal, `${groupByDay(wifiEntries).length} dager m/ WF-token`),
        cell('WF-HIT', wfTotal ? `${hitPct}%` : '—', `HIT ${wfCounts.HIT || 0}`),
        cell('Ikke-HIT', wfTotal ? `${failPct}%` : '—', `FBK ${wfCounts.FBK || 0} · MISS ${wfCounts.MISS || 0} · FAIL ${wfCounts.FAIL || 0}`),
        cell('WT p50 / p95', wts.length ? `${wtP50} / ${wtP95} ms` : '—'),
        cell('TU p50 / p95', tus.length ? `${tuP50} / ${tuP95} ms` : '—', `n=${tus.length}`),
        cell('Batteri lavest', voltEntries?.length ? `${voltEntries.reduce((m, e) => Math.min(m, e.v), Infinity).toFixed(2)} V` : '—', voltEntries?.length ? `n=${voltEntries.length}` : ''),
        cell('Feilede wakes', fcEntries.length ? sumConfirmedFails(fcEntries.map(e => e.s.FC)) : '—', fcEntries.length ? `n=${fcEntries.length} m/ FC` : 'venter på firmware'),
        cell('Sist inne', last.t.format('D. MMM HH:mm'), last.s.WF ? `${last.s.WF} · ${last.s.WT} ms` : '')
    ].join('');
}

function renderWifiPerDay(entries) {
    const el = document.getElementById('wifi-days');
    if (!entries.length) {
        el.innerHTML = '<div class="day-label">Ingen WF-data i denne perioden.</div>';
        return;
    }
    const days = groupByDay(entries);
    const maxN = Math.max(...days.map(d => d.list.length), 1);
    el.innerHTML = days.map(d => {
        const c = countBy(d.list, e => e.s.WF || 'unknown');
        const n = d.list.length;
        const widthPct = (n / maxN * 100).toFixed(2);
        const seg = key => {
            const v = c[key] || 0;
            return v ? `<span class="${key.toLowerCase()}" style="width:${(v / n * 100).toFixed(2)}%" title="${key}: ${v} (${pct(v, n)}%)"></span>` : '';
        };
        return `<span class="day-label">${d.day.format('ddd D. MMM')}</span>` +
            `<span class="stack-bar" style="width:${widthPct}%" title="${n} poster">${seg('HIT')}${seg('FBK')}${seg('MISS')}${seg('FAIL')}</span>` +
            `<span class="day-count">${n}</span>`;
    }).join('');
}

function renderTimingPerDay(el, entries, valFn) {
    if (!entries.length) { el.innerHTML = '<div class="day-label">Ingen data.</div>'; return; }
    const allVals = entries.map(valFn).filter(Number.isFinite);
    if (!allVals.length) { el.innerHTML = '<div class="day-label">Ingen data.</div>'; return; }
    const days = groupByDay(entries);

    const perDay = days.map(d => {
        const vals = d.list.map(valFn).filter(Number.isFinite).sort((a, b) => a - b);
        return {
            d,
            vals,
            p50: vals.length ? percentile(vals, 0.5)  : null,
            p95: vals.length ? percentile(vals, 0.95) : null
        };
    });

    const scaleMax = perDay.reduce((m, x) => x.p95 !== null && x.p95 > m ? x.p95 : m, 0) || 1;
    const absMax = allVals.reduce((a, b) => Math.max(a, b), 0);

    const scaleEl = el.closest('section')?.querySelector('.scale-label');
    if (scaleEl) scaleEl.textContent = `Skala: 0 → ${scaleMax} ms (største dags P95) · maks enkeltmåling: ${absMax} ms`;

    el.innerHTML = perDay.map(({ d, vals, p50, p95 }) => {
        if (!vals.length) {
            return `<span class="day-label">${d.day.format('ddd D. MMM')}</span><span class="wt-bar"></span><span class="day-count">—</span>`;
        }
        const widthPct = p95 / scaleMax * 100;
        const medianPct = p50 / scaleMax * 100;
        return `<span class="day-label">${d.day.format('ddd D. MMM')}</span>` +
            `<span class="wt-bar" title="p50 ${p50} · p95 ${p95} · n=${vals.length}">` +
                `<span class="fill" style="left:0%;width:${widthPct.toFixed(2)}%"></span>` +
                `<span class="median" style="left:${medianPct.toFixed(2)}%"></span>` +
            `</span>` +
            `<span class="day-count">${p50}/${p95}</span>`;
    }).join('');
}

function renderDistributions(entries) {
    const groups = [
        { key: 'WF',    title: 'WiFi-outcome', order: ['HIT', 'FBK', 'MISS', 'FAIL'] },
        { key: 'LIGHT', title: 'Lys',          order: ['NIGHT', 'DUSK', 'SHADE', 'SUN'] },
        { key: 'T',     title: 'Temp-klasse',  order: ['COLD', 'OK', 'HOT'] },
        { key: 'W',     title: 'Vindu',        order: ['CLOSE', 'OPEN'] },
        { key: 'B',     title: 'Batteri',      order: ['OK', 'LOW'] },
        { key: 'P',     title: 'Trykk',        order: ['LOW', 'OK', 'HIGH'] }
    ];

    const el = document.getElementById('dists');
    el.innerHTML = groups.map(g => {
        const counts = countBy(entries, e => e.s[g.key]);
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        if (!total) return '';
        const keys = [...new Set([...g.order, ...Object.keys(counts)])].filter(k => counts[k]);
        const rows = keys.map(k => {
            const p = pct(counts[k], total);
            return `<div class="dist-row"><span>${k}</span><span class="dist-bar" style="width:${p}%"></span><span class="dist-pct">${p}%</span></div>`;
        }).join('');
        return `<div class="dist-group"><div class="dist-title">${g.title} · n=${total}</div>${rows}</div>`;
    }).join('');
}

function renderRecent(entries) {
    const tbody = document.querySelector('#recent-table tbody');
    const rows = entries.slice(-20).reverse();
    tbody.innerHTML = rows.map(e => {
        const wf = e.s.WF || '—';
        const wfCls = wf === '—' ? '' : ` class="wf-${wf.toLowerCase()}"`;
        return `<tr>
            <td>${e.t.format('D. MMM HH:mm')}</td>
            <td${wfCls}>${wf}</td>
            <td>${Number.isFinite(e.s.WT) ? e.s.WT : '—'}</td>
            <td>${e.s.LIGHT || '—'}</td>
            <td>${e.s.W || '—'}</td>
            <td>${e.s.T || '—'}</td>
            <td>${e.s.B || '—'}</td>
            <td>${e.s.P || '—'}</td>
        </tr>`;
    }).join('');
}

function countBy(list, fn) {
    const c = {};
    for (const x of list) {
        const k = fn(x);
        if (k == null) continue;
        c[k] = (c[k] || 0) + 1;
    }
    return c;
}

function pct(n, total) {
    return total ? Math.round(n / total * 100) : 0;
}

function percentile(sortedArr, p) {
    if (!sortedArr.length) return 0;
    const idx = Math.min(sortedArr.length - 1, Math.floor(sortedArr.length * p));
    return sortedArr[idx];
}
