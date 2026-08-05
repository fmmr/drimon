const STATUS_CHANNELS = [
    { id: 2568299, num: 1, label: 'Drimon' },
    { id: 2584548, num: 2, label: 'Detaljer' },
    { id: 2584547, num: 3, label: 'Tech' }
];
const TECH_CHANNEL = 2584547;
const TECH_VOLT_FIELD = 2;
const TU_FIELD = 4;
const MERGE_WINDOW_MS = 60000;
const TZ = 'Europe/Oslo';

const params = new URLSearchParams(location.search);
const DAYS = Math.max(1, Math.min(400, parseInt(params.get('days') || '14', 10)));
const RESULTS = Math.max(1, Math.min(8000, parseInt(params.get('results') || '8000', 10)));
const RECENT = Math.max(1, Math.min(2000, parseInt(params.get('recent') || '20', 10)));

moment.locale('nb');

document.getElementById('controls').textContent =
    `Siste ${DAYS} dager · henter opptil ${RESULTS} status-entries`;

Promise.all([
    ...STATUS_CHANNELS.map(c =>
        fetch(`https://api.thingspeak.com/channels/${c.id}/status.json?results=${RESULTS}&days=${DAYS}`)
            .then(r => r.json())
            .then(d => ({ num: c.num, feeds: d.feeds || [] }))
    ),
    fetch(`https://api.thingspeak.com/channels/${TECH_CHANNEL}/feeds.json?results=${RESULTS}&days=${DAYS}`).then(r => r.json())
])
    .then(results => {
        const byChannel = results.slice(0, STATUS_CHANNELS.length);
        const tech = results[STATUS_CHANNELS.length];
        render(byChannel, tech);
    })
    .catch(err => {
        document.getElementById('loading').textContent = 'Feil ved henting: ' + err.message;
    });

function mergeAcrossChannels(byChannel) {
    const raw = [];
    for (const { num, feeds } of byChannel) {
        for (const f of feeds) {
            if (!f.status) continue;
            raw.push({
                t: moment.tz(f.created_at, TZ),
                raw: f.status,
                s: parseStatus(f.status),
                ch: num
            });
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
        if (matched) {
            matched.channels.add(e.ch);
        } else if (Object.keys(e.s).length > 0) {
            wakes.push({ t: e.t, s: e.s, raw: e.raw, channels: new Set([e.ch]) });
        }
    }
    wakes.sort((a, b) => a.t.diff(b.t));
    return wakes;
}

function channelBadges(channels) {
    return STATUS_CHANNELS.map(c => channels.has(c.num)
        ? `<span class="ch-ok" title="${c.label}">${c.num}</span>`
        : `<span class="ch-missing" title="${c.label} — mangler">·</span>`
    ).join(' ');
}

function lrBadges(lr) {
    if (!Array.isArray(lr) || lr.length !== 3) return '—';
    return lr.map(code => {
        const cls = code === 200 ? 'ch-ok' : (code === 0 ? 'ch-missing' : 'ch-missing');
        const label = code === 200 ? 'OK' : (code === 0 ? 'ingen respons' : `HTTP ${code}`);
        return `<span class="${cls}" title="${label}">${code}</span>`;
    }).join(' ');
}

const STATUS_TOKENS = [
    { prefix: 'T-',  key: 'T',  parse: v => v },
    { prefix: 'W-',  key: 'W',  parse: v => v },
    { prefix: 'B-',  key: 'B',  parse: v => v },
    { prefix: 'P-',  key: 'P',  parse: v => v },
    { prefix: 'WF-', key: 'WF', parse: v => v },
    { prefix: 'BS-', key: 'BS', parse: v => v },
    { prefix: 'WT-', key: 'WT', parse: v => parseInt(v, 10) },
    { prefix: 'FC-', key: 'FC', parse: v => parseInt(v, 10) },
    { prefix: 'PF-', key: 'PF', parse: v => parseInt(v, 10) },
    { prefix: 'BV-', key: 'BV', parse: v => parseFloat(v) },
    { prefix: 'TU-', key: 'TU', parse: v => parseInt(v, 10) },
    { prefix: 'LR-', key: 'LR', parse: v => v.split('.').map(x => parseInt(x, 10)) },
    { prefix: 'SD-', key: 'SD', parse: v => parseInt(v, 10) }
];
const LIGHT_TOKENS = new Set(['NIGHT', 'DUSK', 'SHADE', 'SUN']);

function parseStatus(s) {
    const out = {};
    if (!s) return out;
    for (const p of s.split('_')) {
        if (!p) continue;
        if (LIGHT_TOKENS.has(p)) { out.LIGHT = p; continue; }
        const t = STATUS_TOKENS.find(tk => p.startsWith(tk.prefix));
        if (t) out[t.key] = t.parse(p.slice(t.prefix.length));
        // unknown tokens are silently ignored — never pollute another field
    }
    return out;
}

function render(byChannel, tech) {
    const entries = mergeAcrossChannels(byChannel);

    if (!entries.length) {
        document.getElementById('loading').textContent = 'Ingen status-data.';
        return;
    }

    const wifiEntries = entries.filter(e => e.s.WF || Number.isFinite(e.s.WT));
    const fcEntries = entries.filter(e => Number.isFinite(e.s.FC));
    const pfEntries = entries.filter(e => Number.isFinite(e.s.PF));

    const techFeeds = (tech && tech.feeds) || [];
    const techEntries = techFeeds.map(f => ({
        t: moment.tz(f.created_at, TZ),
        v: parseFloat(f[`field${TECH_VOLT_FIELD}`]),
        tu: parseFloat(f[`field${TU_FIELD}`])
    }));
    const tuEntries = techEntries.filter(e => Number.isFinite(e.tu)).map(e => ({ t: e.t, v: e.tu }));
    const voltEntries = techEntries.filter(e => Number.isFinite(e.v));

    renderStats(entries, wifiEntries, tuEntries, fcEntries, voltEntries, pfEntries);
    renderWifiPerDay(wifiEntries);
    renderTimingPerDay(document.getElementById('wt-days'), wifiEntries, e => e.s.WT);
    renderRangePerDay(document.getElementById('batt-v-days'), document.getElementById('batt-v-scale'), voltEntries, e => e.v, 'V', v => v.toFixed(2));
    renderTimingPerDay(document.getElementById('tu-days'), tuEntries, e => e.v);
    renderFcPerDay(fcEntries);
    renderHttpPerDay(entries);
    renderDistributions(entries);
    renderRecent(entries);

    document.getElementById('loading').hidden = true;
    for (const id of ['stats', 'wifi-section', 'wt-section', 'battery-section', 'tu-section', 'fc-section', 'http-section', 'dists-section', 'recent-section']) {
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

function httpBucket(code) {
    if (code === 200) return 'hit';
    if (code === -304) return 'fbk';
    if (code === -301) return 'fail';
    return 'miss';
}

function renderHttpPerDay(entries) {
    const el = document.getElementById('http-days');
    const withLR = entries.filter(e => Array.isArray(e.s.LR));
    if (!withLR.length) {
        el.innerHTML = '<div class="day-label">Ingen HTTP-data — venter på firmware med LR-token.</div>';
        return;
    }

    const days = groupByDay(withLR);
    const perDay = days.map(d => {
        const codes = d.list.flatMap(e => e.s.LR).filter(c => c !== 0);  // 0 = "never attempted"
        const counts = { hit: 0, fbk: 0, fail: 0, miss: 0 };
        for (const c of codes) counts[httpBucket(c)]++;
        return { d, codes, counts };
    });

    const maxN = perDay.reduce((m, x) => Math.max(m, x.codes.length), 0) || 1;

    el.innerHTML = perDay.map(({ d, codes, counts }) => {
        const n = codes.length;
        if (!n) {
            return `<span class="day-label">${d.day.format('ddd D. MMM')}</span><span class="stack-bar"></span><span class="day-count">—</span>`;
        }
        const widthPct = (n / maxN * 100).toFixed(2);
        const seg = key => counts[key]
            ? `<span class="${key}" style="width:${(counts[key] / n * 100).toFixed(2)}%" title="${key}: ${counts[key]}"></span>`
            : '';
        return `<span class="day-label">${d.day.format('ddd D. MMM')}</span>` +
            `<span class="stack-bar" style="width:${widthPct}%" title="${n} HTTP-forsøk">${seg('hit')}${seg('fbk')}${seg('fail')}${seg('miss')}</span>` +
            `<span class="day-count">${n}</span>`;
    }).join('');
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

function renderStats(entries, wifiEntries, tuEntries, fcEntries, voltEntries, pfEntries) {
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

    const partial = entries.filter(e => e.channels.size < STATUS_CHANNELS.length).length;

    const allLR = entries.flatMap(e => Array.isArray(e.s.LR) ? e.s.LR : []);
    const lrCounts = {};
    for (const code of allLR) lrCounts[code] = (lrCounts[code] || 0) + 1;
    const lrOk = lrCounts[200] || 0;
    const lrZero = lrCounts[0] || 0;
    const lrAttempted = allLR.length - lrZero;
    const lrOkPct = lrAttempted ? Math.round(lrOk / lrAttempted * 100) : 0;
    const lrErrBreakdown = Object.entries(lrCounts)
        .filter(([code]) => code !== '200' && code !== '0')
        .sort((a, b) => b[1] - a[1])
        .map(([code, n]) => `${code}:${n}`)
        .join(' · ');

    document.getElementById('stats').innerHTML = [
        cell('Antall poster', total, `${days.length} dager · snitt ${avgCycles}/dag`),
        cell('Delvise poster', partial, partial ? `av ${total} m/ min. 1 kanal-feil` : 'alle kanaler ok'),
        cell('HTTP OK-rate', lrAttempted ? `${lrOkPct}%` : '—', lrAttempted ? `${lrOk}/${lrAttempted} forsøk${lrErrBreakdown ? ' · ' + lrErrBreakdown : ''}` : 'venter på firmware m/ LR-token'),
        cell('WF-telemetri', wfTotal, `${groupByDay(wifiEntries).length} dager m/ WF-token`),
        cell('WF-HIT', wfTotal ? `${hitPct}%` : '—', `HIT ${wfCounts.HIT || 0}`),
        cell('Ikke-HIT', wfTotal ? `${failPct}%` : '—', `FBK ${wfCounts.FBK || 0} · MISS ${wfCounts.MISS || 0} · FAIL ${wfCounts.FAIL || 0}`),
        cell('WT p50 / p95', wts.length ? `${wtP50} / ${wtP95} ms` : '—'),
        cell('TU p50 / p95', tus.length ? `${tuP50} / ${tuP95} ms` : '—', `n=${tus.length}`),
        cell('Batteri lavest', voltEntries?.length ? `${voltEntries.reduce((m, e) => Math.min(m, e.v), Infinity).toFixed(2)} V` : '—', voltEntries?.length ? `n=${voltEntries.length}` : ''),
        cell('Feilede wakes', fcEntries.length ? sumConfirmedFails(fcEntries.map(e => e.s.FC)) : '—', fcEntries.length ? `n=${fcEntries.length} m/ FC` : 'venter på firmware'),
        cell('Stille post-feil', pfEntries.length ? sumConfirmedFails(pfEntries.map(e => e.s.PF)) : '—', pfEntries.length ? `n=${pfEntries.length} m/ PF` : 'venter på firmware'),
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
        { key: 'BS',    title: 'BSSID (mesh-node)', sortByCount: true },
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
        const keys = g.sortByCount
            ? Object.keys(counts).sort((a, b) => counts[b] - counts[a])
            : [...new Set([...(g.order || []), ...Object.keys(counts)])].filter(k => counts[k]);
        const rows = keys.map(k => {
            const n = counts[k];
            const raw = n / total * 100;
            const barWidth = Math.max(0.5, raw).toFixed(2);
            const label = raw >= 1 ? `${Math.round(raw)}%` : '<1%';
            return `<div class="dist-row" title="${k}: ${n} av ${total}"><span>${k}</span><span class="dist-bar" style="width:${barWidth}%"></span><span class="dist-pct">${label}</span></div>`;
        }).join('');
        return `<div class="dist-group"><div class="dist-title">${g.title} · n=${total}</div>${rows}</div>`;
    }).join('');
}

function renderRecent(entries) {
    const tbody = document.querySelector('#recent-table tbody');
    const rows = entries.slice(-RECENT).reverse();
    const heading = document.querySelector('#recent-section h2');
    if (heading) heading.textContent = `Siste ${rows.length} statuser`;
    tbody.innerHTML = rows.map(e => {
        const wf = e.s.WF || '—';
        const wfCls = wf === '—' ? '' : ` class="wf-${wf.toLowerCase()}"`;
        const rawTitle = e.raw ? ` title="${e.raw.replace(/"/g, '&quot;')}"` : '';
        return `<tr${rawTitle}>
            <td>${e.t.format('D. MMM HH:mm')}</td>
            <td class="ch-cell">${channelBadges(e.channels)}</td>
            <td${wfCls}>${wf}</td>
            <td>${e.s.BS || '—'}</td>
            <td>${Number.isFinite(e.s.WT) ? e.s.WT : '—'}</td>
            <td class="ch-cell">${lrBadges(e.s.LR)}</td>
            <td>${Number.isFinite(e.s.FC) ? e.s.FC : '—'}</td>
            <td>${Number.isFinite(e.s.PF) ? e.s.PF : '—'}</td>
            <td>${e.s.LIGHT || '—'}</td>
            <td>${e.s.W || '—'}</td>
            <td>${e.s.T || '—'}</td>
            <td>${e.s.B || '—'}</td>
            <td>${Number.isFinite(e.s.BV) ? e.s.BV.toFixed(2) : '—'}</td>
            <td>${e.s.P || '—'}</td>
            <td>${Number.isFinite(e.s.TU) ? e.s.TU : '—'}</td>
            <td>${Number.isFinite(e.s.SD) ? (e.s.SD > 0 ? 'JA' : 'NEI') : '—'}</td>
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
