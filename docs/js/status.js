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

function shortBS(bs) {
    return typeof bs === 'string' && bs.length >= 6 ? bs.slice(-6) : (bs || '—');
}

// BSSID bytes 1-4 (8 hex chars, lowercase) → node name. Source: documentation/MESH_NODES.md.
// Match strategy: drop byte 0 (varies with LA-bit interface variants: `14` LAN OUI, `1A`/`1E`/`26`
// locally-administered radios) and byte 5 (varies with per-interface offset LAN+1, LAN+2, …). Bytes
// 1-2 = `91:82` are the Linksys OUI (kept as a safety check against non-Linksys APs collision-matching
// on bytes 3-4 alone). Bytes 3-4 are the unique-per-node bytes.
const MESH_NODES = {
    '918294f9': 'SOV_MF',
    '91828f5f': 'EXTRA_UTE',
    '91828f6c': 'STUE',
    '91829500': 'TV_ROM'
};

function nodePrefix(bs) {
    return typeof bs === 'string' && bs.length >= 12 ? bs.slice(2, -2).toLowerCase() : null;
}

function nodeName(bs) {
    const prefix = nodePrefix(bs);
    return prefix ? (MESH_NODES[prefix] || null) : null;
}

function nodeLabel(bs) {
    return nodeName(bs) || shortBS(bs);
}

function githubCommitLink(hash) {
    if (!hash || hash === 'template' || hash === 'unknown') return hash || '—';
    const clean = hash.replace(/\+$/, '');   // strip the dirty '+' before linking
    const dirtySuffix = hash.endsWith('+') ? '+' : '';
    return `<a class="version-link" href="https://github.com/fmmr/drimon/commit/${clean}" target="_blank" rel="noopener noreferrer" title="Open commit ${hash} on GitHub">${clean}${dirtySuffix}</a>`;
}

function channelBadges(channels) {
    return STATUS_CHANNELS.map(c => channels.has(c.num)
        ? `<span class="ch-ok" title="${c.label}">${c.num}</span>`
        : `<span class="ch-missing" title="${c.label} — mangler">·</span>`
    ).join(' ');
}

function lrBadges(lr, pr) {
    if (!Array.isArray(lr) || lr.length !== 3) return '—';
    const prArr = Array.isArray(pr) && pr.length === 3 ? pr : [0, 0, 0];
    return lr.map((code, i) => {
        const cls = code === 200 ? 'ch-ok' : 'ch-missing';
        const label = code === 200 ? 'OK' : (code === 0 ? 'ingen respons' : `HTTP ${code}`);
        const retries = Number.isFinite(prArr[i]) ? prArr[i] : 0;
        const retrySuffix = retries > 0 ? `<sup class="retry-count">+${retries}</sup>` : '';
        const fullLabel = retries > 0 ? `${label} · ${retries} ekstra forsøk` : label;
        return `<span class="${cls}" title="${fullLabel}">${code}${retrySuffix}</span>`;
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
    { prefix: 'TV-', key: 'TV', parse: v => parseFloat(v) },
    { prefix: 'LX-', key: 'LX', parse: v => parseInt(v, 10) },
    { prefix: 'WD-', key: 'WD', parse: v => parseInt(v, 10) },
    { prefix: 'LR-', key: 'LR', parse: v => v.split('.').map(x => parseInt(x, 10)) },
    { prefix: 'PR-', key: 'PR', parse: v => v.split('.').map(x => parseInt(x, 10)) },
    { prefix: 'LTU-', key: 'LTU', parse: v => parseInt(v, 10) },
    { prefix: 'LP-', key: 'LP', parse: v => parseInt(v, 10) },
    { prefix: 'LT-', key: 'LT', parse: v => parseInt(v, 10) },
    { prefix: 'WR-', key: 'WR', parse: v => v.split('.').map(x => parseInt(x, 10)) },
    { prefix: 'V-',  key: 'V',  parse: v => v },
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
    // LT/LP are previous-wake timings from status tokens. Filter > 0 skips the initial-zero rows
    // that follow a cold boot (RTC wiped, no previous wake yet).
    const ltEntries = entries.filter(e => Number.isFinite(e.s.LT) && e.s.LT > 0).map(e => ({ t: e.t, v: e.s.LT }));
    const lpEntries = entries.filter(e => Number.isFinite(e.s.LP) && e.s.LP > 0).map(e => ({ t: e.t, v: e.s.LP }));

    renderStats(entries, wifiEntries, tuEntries, fcEntries, voltEntries, pfEntries);
    renderWifiPerDay(wifiEntries);
    renderRangePerDay(document.getElementById('lt-days'), document.querySelector('#lt-section .scale-label'), ltEntries, e => e.v, 'ms', v => Math.round(v));
    renderRangePerDay(document.getElementById('tu-days'), document.querySelector('#tu-section .scale-label'), tuEntries, e => e.v, 'ms', v => Math.round(v));
    renderRangePerDay(document.getElementById('lp-days'), document.querySelector('#lp-section .scale-label'), lpEntries, e => e.v, 'ms', v => Math.round(v));
    renderRangePerDay(document.getElementById('wt-days'), document.querySelector('#wt-section .scale-label'), wifiEntries.map(e => ({ t: e.t, v: e.s.WT })), e => e.v, 'ms', v => Math.round(v));
    renderRangePerDay(document.getElementById('batt-v-days'), document.getElementById('batt-v-scale'), voltEntries, e => e.v, 'V', v => v.toFixed(2), 3.5, 4.20);
    renderFcPerDay(fcEntries);
    renderHttpPerDay(entries);
    renderDistributions(entries);
    renderRecent(entries);

    document.getElementById('loading').hidden = true;
    for (const id of ['stats', 'wifi-section', 'lt-section', 'tu-section', 'lp-section', 'wt-section', 'battery-section', 'fc-section', 'http-section', 'dists-section', 'recent-section']) {
        document.getElementById(id).hidden = false;
    }
}

function renderRangePerDay(el, scaleEl, entries, valFn, unit, fmt, fixedMin, fixedMax) {
    if (!entries.length) { el.innerHTML = '<div class="day-label">Ingen data.</div>'; if (scaleEl) scaleEl.textContent = ''; return; }
    const allVals = entries.map(valFn).filter(Number.isFinite);
    if (!allVals.length) { el.innerHTML = '<div class="day-label">Ingen data.</div>'; if (scaleEl) scaleEl.textContent = ''; return; }
    const dataMin = allVals.reduce((a, b) => Math.min(a, b), Infinity);
    const dataMax = allVals.reduce((a, b) => Math.max(a, b), -Infinity);
    const globalMin = Number.isFinite(fixedMin) ? fixedMin : dataMin;
    const globalMax = Number.isFinite(fixedMax) ? fixedMax : dataMax;
    const span = globalMax - globalMin || 1;
    const rangeSource = (Number.isFinite(fixedMin) && Number.isFinite(fixedMax)) ? 'fast skala' : 'min → maks i data';

    if (scaleEl) scaleEl.textContent = `Skala: ${fmt(globalMin)} → ${fmt(globalMax)} ${unit} (${rangeSource})`;

    const clamp = v => Math.max(0, Math.min(100, v));
    const days = groupByDay(entries);
    el.innerHTML = days.map(d => {
        const vals = d.list.map(valFn).filter(Number.isFinite).sort((a, b) => a - b);
        if (!vals.length) return `<span class="day-label">${d.day.format('ddd D. MMM')}</span><span class="wt-bar"></span><span class="day-count">—</span>`;
        const dMin = vals[0];
        const dMax = vals[vals.length - 1];
        const dMed = percentile(vals, 0.5);
        const dP95 = percentile(vals, 0.95);
        const leftPct = clamp((dMin - globalMin) / span * 100);
        const rightPct = clamp((dMax - globalMin) / span * 100);
        const widthPct = Math.max(1, rightPct - leftPct);
        const medianPct = clamp((dMed - globalMin) / span * 100);
        const p95Pct = clamp((dP95 - globalMin) / span * 100);
        return `<span class="day-label">${d.day.format('ddd D. MMM')}</span>` +
            `<span class="wt-bar" title="min ${fmt(dMin)} · median ${fmt(dMed)} · p95 ${fmt(dP95)} · maks ${fmt(dMax)} ${unit} · n=${vals.length}">` +
                `<span class="fill" style="left:${leftPct.toFixed(2)}%;width:${widthPct.toFixed(2)}%"></span>` +
                `<span class="median" style="left:${medianPct.toFixed(2)}%"></span>` +
                `<span class="p95" style="left:${p95Pct.toFixed(2)}%"></span>` +
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

const RESET_REASON_NAMES = {
    1: 'POWERON',
    2: 'EXT',
    3: 'SW',
    4: 'PANIC',
    5: 'INT_WDT',
    6: 'TASK_WDT',
    7: 'WDT',
    8: 'DEEPSLEEP',
    9: 'BROWNOUT',
    10: 'SDIO'
};
const WAKEUP_CAUSE_NAMES = {
    0: 'UNDEFINED',
    2: 'EXT0',
    4: 'TIMER'
};

function wrEntry(e) {
    return Array.isArray(e.s.WR) && e.s.WR.length === 2 && Number.isFinite(e.s.WR[0]) && Number.isFinite(e.s.WR[1])
        ? e.s.WR
        : null;
}

function isColdBoot(e) {
    const wr = wrEntry(e);
    return wr !== null && wr[0] !== 8;
}

function anomalyReasons(e) {
    const reasons = [];
    const wr = wrEntry(e);
    if (wr && !(wr[0] === 8 && (wr[1] === 4 || wr[1] === 2))) {
        const rr = RESET_REASON_NAMES[wr[0]] || wr[0];
        const wc = WAKEUP_CAUSE_NAMES[wr[1]] || wr[1];
        reasons.push(`WR-${wr[0]}.${wr[1]} (${rr}/${wc})`);
    }
    if (e.channels && e.channels.size < STATUS_CHANNELS.length) {
        const missing = STATUS_CHANNELS.filter(c => !e.channels.has(c.num)).map(c => c.num).join(',');
        reasons.push(`kanal-tap: ${missing}`);
    }
    if (Array.isArray(e.s.PR) && e.s.PR.some(v => Number.isFinite(v) && v > 0)) {
        reasons.push(`retries=${e.s.PR.join('.')}`);
    }
    if (Number.isFinite(e.s.FC) && e.s.FC > 0) reasons.push(`FC=${e.s.FC}`);
    if (Number.isFinite(e.s.PF) && e.s.PF > 0) reasons.push(`PF=${e.s.PF}`);
    if (Array.isArray(e.s.LR) && e.s.LR.some(c => c !== 200 && c !== 0)) {
        reasons.push(`LR=${e.s.LR.join('.')}`);
    }
    return reasons;
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

    const wts = wifiEntries.map(e => e.s.WT).filter(Number.isFinite);
    const tus = tuEntries.map(e => e.v).filter(Number.isFinite);

    const cell = (label, value, sub) =>
        `<div><span class="stat-label">${label}</span><span class="stat-value">${value}</span>${sub ? `<span class="stat-sub">${sub}</span>` : ''}</div>`;

    // Distribution tile: value = "p50 / p95", sub = "min X · maks Y · n=Z". Accepts any numeric array
    // (sorts internally). Assumes ms-integer values (rounds). `emptyMsg` shown as sub when no samples.
    const distTile = (label, values, emptyMsg = 'ingen data') => {
        if (!values.length) return cell(label, '—', emptyMsg);
        const sorted = [...values].sort((a, b) => a - b);
        const p50 = Math.round(percentile(sorted, 0.5));
        const p95 = Math.round(percentile(sorted, 0.95));
        const min = Math.round(sorted[0]);
        const max = Math.round(sorted[sorted.length - 1]);
        return cell(label, `${p50} / ${p95}`, `min ${min} · maks ${max} · n=${sorted.length}`);
    };

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
        distTile('WT p50 / p95', wts),
        distTile('TU p50 / p95', tus),
        distTile('Post-tid p50 / p95', entries.map(e => e.s.LP).filter(v => Number.isFinite(v) && v > 0), 'venter på firmware m/ LP-token'),
        distTile('Total-tid p50 / p95', entries.map(e => e.s.LT).filter(v => Number.isFinite(v) && v > 0), 'venter på firmware m/ LT-token'),
        cell('Batteri lavest', voltEntries?.length ? `${voltEntries.reduce((m, e) => Math.min(m, e.v), Infinity).toFixed(2)} V` : '—', voltEntries?.length ? `n=${voltEntries.length}` : ''),
        cell('Feilede wakes', fcEntries.length ? sumConfirmedFails(fcEntries.map(e => e.s.FC)) : '—', fcEntries.length ? `n=${fcEntries.length} m/ FC` : 'venter på firmware'),
        cell('Stille post-feil', pfEntries.length ? pfEntries.reduce((s, e) => s + e.s.PF, 0) : '—', pfEntries.length ? `n=${pfEntries.length} m/ PF` : 'venter på firmware'),
        (() => {
            const prEntries = entries.filter(e => Array.isArray(e.s.PR) && e.s.PR.length === 3);
            if (!prEntries.length) return cell('Retries brukt', '—', 'venter på firmware m/ PR-token');
            const totalRetries = prEntries.reduce((s, e) => s + e.s.PR.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0), 0);
            const wakesWithRetry = prEntries.filter(e => e.s.PR.some(v => v > 0)).length;
            return cell('Retries brukt', totalRetries, `${wakesWithRetry}/${prEntries.length} wakes trengte retry`);
        })(),
        (() => {
            const wrEntries = entries.filter(e => wrEntry(e) !== null);
            if (!wrEntries.length) return cell('Kald-boot', '—', 'venter på firmware m/ WR-token');
            const coldBoots = wrEntries.filter(isColdBoot);
            const byReason = {};
            for (const e of coldBoots) byReason[e.s.WR[0]] = (byReason[e.s.WR[0]] || 0) + 1;
            const breakdown = Object.entries(byReason)
                .sort((a, b) => b[1] - a[1])
                .map(([rr, n]) => `${RESET_REASON_NAMES[rr] || rr}:${n}`)
                .join(' · ');
            return cell('Kald-boot', coldBoots.length, coldBoots.length ? breakdown : `n=${wrEntries.length} m/ WR — ingen kald-boot`);
        })(),
        cell('Sist inne', last.t.format('D. MMM HH:mm'), last.s.WF ? `${last.s.WF} · ${last.s.WT} ms` : ''),
        cell('Firmware', githubCommitLink(last.s.V), last.s.V ? 'siste post sin versjon' : 'venter på firmware m/ V-token')
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
    // Buckets a raw HTTP code into short codes (no parenthetical text — was wrapping ugly).
    // Returns null for 0 (never attempted — cold-boot RTC init) so it's excluded from the counts.
    const lrBucket = code => {
        if (code === 0 || !Number.isFinite(code)) return null;
        if (code === 200) return '200';
        if (code === -304) return '-304';
        if (code === -301) return '-301';
        return `${code}`;
    };
    const lrChannelOrder = ['200', '-304', '-301', 'FEIL'];
    // Silent (PF) wakes = all 3 channels failed at once. To avoid double-counting: LR on rows where
    // PF>0 IS the last silent wake's codes, so we skip those from the per-channel LR counts and
    // route the silent wakes to a dedicated 'FEIL' bucket via Σ PF across visible rows.
    const silentCount = entries.reduce((sum, e) => sum + (Number.isFinite(e.s.PF) ? e.s.PF : 0), 0);
    const channelGroups = STATUS_CHANNELS.map(ch => ({
        key: `LR_CH${ch.num}`,
        title: `Ch${ch.num} (${ch.label}) — HTTP`,
        order: lrChannelOrder,
        getValue: e => {
            if (!Array.isArray(e.s.LR) || e.s.LR.length !== 3) return null;
            if (Number.isFinite(e.s.PF) && e.s.PF > 0) return null;   // silent-wake LR → 'FEIL' bucket handles it
            return lrBucket(e.s.LR[ch.num - 1]);
        },
        extraCounts: silentCount > 0 ? { FEIL: silentCount } : null
    }));

    const groups = [
        { key: 'WF',    title: 'WiFi-outcome', order: ['HIT', 'FBK', 'MISS', 'FAIL'] },
        { key: 'BS',    title: 'BSSID (mesh-node)', sortByCount: true },
        { key: 'LIGHT', title: 'Lys',          order: ['NIGHT', 'DUSK', 'SHADE', 'SUN'] },
        ...channelGroups,
        { key: 'T',     title: 'Temp-klasse',  order: ['COLD', 'OK', 'HOT'] },
        { key: 'W',     title: 'Vindu',        order: ['CLOSE', 'OPEN'] },
        { key: 'B',     title: 'Batteri',      order: ['OK', 'LOW'] },
        { key: 'P',     title: 'Trykk',        order: ['LOW', 'OK', 'HIGH'] }
    ];

    const el = document.getElementById('dists');
    el.innerHTML = groups.map(g => {
        const rawCounts = countBy(entries, g.getValue || (e => e.s[g.key]));
        if (g.extraCounts) {
            for (const [k, v] of Object.entries(g.extraCounts)) rawCounts[k] = (rawCounts[k] || 0) + v;
        }
        // For BSSID, merge full-BSSID entries that share the same visible short suffix
        let counts, fullByShort;
        if (g.key === 'BS') {
            counts = {};
            fullByShort = {};
            for (const [full, n] of Object.entries(rawCounts)) {
                const short = shortBS(full);
                counts[short] = (counts[short] || 0) + n;
                (fullByShort[short] = fullByShort[short] || []).push(full);
            }
        } else {
            counts = rawCounts;
        }
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
            let bsName = null;
            let display = k;
            let tooltip = `${k}: ${n} av ${total}`;
            if (g.key === 'BS' && fullByShort && fullByShort[k] && fullByShort[k].length) {
                // Older firmware stored BS as a 6-char short; newer stores the full 12-char BSSID.
                // Prefer any full-length variant so nodeName's byte-slice actually matches.
                const fullBs = fullByShort[k].find(bs => bs.length >= 12) || fullByShort[k][0];
                bsName = nodeName(fullBs);
                display = bsName || k;
                tooltip = `${fullByShort[k].join(' + ')}${bsName ? ` — ${bsName}` : ''}: ${n} av ${total}`;
            }
            return `<div class="dist-row" title="${tooltip}"><span>${display}</span><span class="dist-bar" style="width:${barWidth}%"></span><span class="dist-pct">${label}</span></div>`;
        }).join('');
        return `<div class="dist-group"><div class="dist-title">${g.title} · n=${total}</div>${rows}</div>`;
    }).join('');
}

function renderRecent(entries) {
    const tbody = document.querySelector('#recent-table tbody');
    const rows = entries.slice(-RECENT).reverse();
    const heading = document.querySelector('#recent-section h2');
    if (heading) {
        const ch1Id = STATUS_CHANNELS[0].id;
        const url = `https://api.thingspeak.com/channels/${ch1Id}/status.json?results=20&days=1`;
        heading.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">Siste ${rows.length} statuser</a>`;
    }
    tbody.innerHTML = rows.map(e => {
        const wf = e.s.WF || '—';
        const wfCls = wf === '—' ? '' : ` class="wf-${wf.toLowerCase()}"`;
        const rawEscaped = e.raw ? e.raw.replace(/"/g, '&quot;') : '';
        const reasons = anomalyReasons(e);
        const trClass = reasons.length ? ' class="anomaly"' : '';
        const titlePrefix = reasons.length ? `⚠ Uvanlig: ${reasons.join(' · ')} — ` : '';
        const rawAttrs = e.raw ? ` title="${titlePrefix}Klikk for å kopiere: ${rawEscaped}" data-raw="${rawEscaped}"` : '';
        return `<tr${trClass}${rawAttrs}>
            <td>${e.t.format('D. MMM HH:mm')}</td>
            <td class="ch-cell">${channelBadges(e.channels)}</td>
            <td class="ch-cell prev-wake-col">${lrBadges(e.s.LR, e.s.PR)}</td>
            <td class="prev-wake-col">${Number.isFinite(e.s.FC) ? e.s.FC : '—'}</td>
            <td class="prev-wake-col">${Number.isFinite(e.s.PF) ? e.s.PF : '—'}</td>
            <td class="prev-wake-col">${Number.isFinite(e.s.LTU) ? e.s.LTU : '—'}</td>
            <td class="prev-wake-col">${Number.isFinite(e.s.LP) ? e.s.LP : '—'}</td>
            <td class="prev-wake-col">${Number.isFinite(e.s.LT) ? e.s.LT : '—'}</td>
            <td>${Number.isFinite(e.s.TU) ? e.s.TU : '—'}</td>
            <td>${Number.isFinite(e.s.WT) ? e.s.WT : '—'}</td>
            <td${wfCls}>${wf}</td>
            <td title="${e.s.BS || ''}${nodeName(e.s.BS) ? ` — ${nodeName(e.s.BS)}` : ''}">${e.s.BS ? nodeLabel(e.s.BS) : '—'}</td>
            <td>${e.s.LIGHT || '—'}${Number.isFinite(e.s.LX) ? ` <span class="raw-value">${e.s.LX}</span>` : ''}</td>
            <td>${e.s.W || '—'}${Number.isFinite(e.s.WD) ? ` <span class="raw-value">${e.s.WD}</span>` : ''}</td>
            <td>${e.s.T || '—'}${Number.isFinite(e.s.TV) ? ` <span class="raw-value">${e.s.TV.toFixed(1)}</span>` : ''}</td>
            <td>${e.s.B || '—'}${Number.isFinite(e.s.BV) ? ` <span class="raw-value">${e.s.BV.toFixed(2)}</span>` : ''}</td>
            <td>${e.s.P || '—'}</td>
            <td${isColdBoot(e) ? ' class="cold-boot"' : ''}>${(() => {
                const wr = wrEntry(e);
                const sdSuffix = Number.isFinite(e.s.SD) && e.s.SD > 0
                    ? ` <span class="raw-value">${e.s.SD / 1000}s</span>`
                    : '';
                if (!wr) return `—${sdSuffix}`;
                const rrName = RESET_REASON_NAMES[wr[0]] || String(wr[0]);
                const wcName = WAKEUP_CAUSE_NAMES[wr[1]] || String(wr[1]);
                const title = `WR-${wr[0]}.${wr[1]} — ${rrName} · ${wcName}`;
                let label;
                if (wr[0] !== 8) label = `<span title="${title}">${rrName}</span>`;
                else if (wr[1] === 2) label = `<span class="wr-button" title="${title}">BUTTON</span>`;
                else if (wr[1] === 4) label = `<span class="wr-timer" title="${title}">TIMER</span>`;
                else label = `<span title="${title}">${wcName}</span>`;
                return `${label}${sdSuffix}`;
            })()}</td>
            <td>${githubCommitLink(e.s.V)}</td>
        </tr>`;
    }).join('');

    tbody.onclick = (evt) => {
        if (evt.target.closest('a')) return;   // let commit-hash / other links work normally
        const tr = evt.target.closest('tr[data-raw]');
        if (!tr) return;
        const raw = tr.dataset.raw;
        if (!raw) return;
        copyToClipboard(raw).then(ok => {
            if (!ok) return;
            tr.classList.add('copied');
            setTimeout(() => tr.classList.remove('copied'), 600);
        });
    };
}

// navigator.clipboard requires a secure context (HTTPS/localhost). Falls back to the deprecated
// execCommand('copy') via a hidden textarea for plain-HTTP dev URLs like http://local.finn.no:8000.
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
    // Linear interpolation (R type 7 / Excel PERCENTILE). Previously used Math.floor(N * p) which
    // collapsed p95 to max for any N ≤ 20, hiding the p95 marker at the bar's right edge and making
    // the stat tile useless on small samples.
    if (!sortedArr.length) return 0;
    if (sortedArr.length === 1) return sortedArr[0];
    const pos = (sortedArr.length - 1) * p;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    if (lo === hi) return sortedArr[lo];
    return sortedArr[lo] + (pos - lo) * (sortedArr[hi] - sortedArr[lo]);
}
