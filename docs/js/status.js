// STATUS_CHANNELS and TZ/MERGE_WINDOW_MS/parser/helpers/renderRecentTable come from status-recent.js
// (must be loaded before this script). Only the systemstatus-specific bits live here.
const STATUS_CHANNELS = [
    { id: 2568299, num: 1, label: 'Drimon' },
    { id: 2584548, num: 2, label: 'Detaljer' },
    { id: 2584547, num: 3, label: 'Tech' }
];
const TECH_CHANNEL = 2584547;
const TECH_VOLT_FIELD = 2;
const TU_FIELD = 4;

const params = new URLSearchParams(location.search);
const DAYS = Math.max(1, Math.min(400, parseInt(params.get('days') || '14', 10)));
const RESULTS = Math.max(1, Math.min(8000, parseInt(params.get('results') || '8000', 10)));
const N = Math.max(1, Math.min(8000, parseInt(params.get('n') || '20', 10)));
// Two switches on top of the same data pipeline:
//   ?showOnlyStatus=true — skip charts / per-day breakdowns / distributions, show only the table
//   ?raw=true            — render the table as raw status strings (3 cols) instead of the parsed
//                          20-column projection. Implies showOnlyStatus=true (raw + summary charts
//                          isn't a useful combination — nobody wants charts above a string dump).
const RAW = params.get('raw') === 'true';
const SHOW_ONLY_STATUS = RAW || params.get('showOnlyStatus') === 'true';

moment.locale('nb');

document.getElementById('controls').textContent =
    `Siste ${DAYS} dager · henter opptil ${RESULTS} status-entries${SHOW_ONLY_STATUS ? ' · kun statuser-tabell' : ''}${RAW ? ' · rå-modus' : ''}`;

const techFetch = SHOW_ONLY_STATUS
    ? Promise.resolve({ feeds: [] })
    : fetch(`https://api.thingspeak.com/channels/${TECH_CHANNEL}/feeds.json?results=${RESULTS}&days=${DAYS}`).then(r => r.json());

Promise.all([
    ...STATUS_CHANNELS.map(c =>
        fetch(`https://api.thingspeak.com/channels/${c.id}/status.json?results=${RESULTS}&days=${DAYS}`)
            .then(r => r.json())
            .then(d => ({ num: c.num, feeds: d.feeds || [] }))
    ),
    techFetch
])
    .then(results => {
        const byChannel = results.slice(0, STATUS_CHANNELS.length);
        const tech = results[STATUS_CHANNELS.length];
        render(byChannel, tech);
    })
    .catch(err => {
        document.getElementById('loading').textContent = 'Feil ved henting: ' + err.message;
    });

function render(byChannel, tech) {
    const entries = mergeAcrossChannels(byChannel, STATUS_CHANNELS);

    if (!entries.length) {
        document.getElementById('loading').textContent = 'Ingen status-data.';
        return;
    }

    if (RAW) {
        renderRawTable(document.querySelector('#raw-table tbody'), entries, N, STATUS_CHANNELS);
        document.getElementById('raw-section').hidden = false;
    } else {
        renderRecentTable(document.querySelector('#recent-table tbody'), entries, N, STATUS_CHANNELS, document.querySelector('#recent-section h2'));
        document.getElementById('recent-section').hidden = false;
    }
    document.getElementById('loading').hidden = true;

    if (SHOW_ONLY_STATUS) return;

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

    for (const id of ['stats', 'wifi-section', 'lt-section', 'tu-section', 'lp-section', 'wt-section', 'battery-section', 'fc-section', 'http-section', 'dists-section']) {
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

    // Distribution tile: two-line body with p50/p95 slightly more prominent than min/max, both on
    // single lines (nowrap). Count moves into the label. Accepts any numeric array (sorts
    // internally). Assumes ms-integer values (rounds). `emptyMsg` shown as sub when no samples.
    const distTile = (label, values, emptyMsg = 'ingen data') => {
        if (!values.length) return `<div><span class="stat-label">${label}</span><span class="stat-value">—</span><span class="stat-sub">${emptyMsg}</span></div>`;
        const sorted = [...values].sort((a, b) => a - b);
        const p50 = Math.round(percentile(sorted, 0.5));
        const p95 = Math.round(percentile(sorted, 0.95));
        const min = Math.round(sorted[0]);
        const max = Math.round(sorted[sorted.length - 1]);
        return `<div><span class="stat-label">${label} (${sorted.length})</span>` +
            `<span class="dist-primary"><span class="dist-prefix">p50/p95:</span>${p50} / ${p95}</span>` +
            `<span class="stat-sub dist-secondary"><span class="dist-prefix">min/max:</span>${min} / ${max}</span></div>`;
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
        distTile('WT', wts),
        distTile('TU', tus),
        distTile('Post-tid', entries.map(e => e.s.LP).filter(v => Number.isFinite(v) && v > 0), 'venter på firmware m/ LP-token'),
        distTile('Total-tid', entries.map(e => e.s.LT).filter(v => Number.isFinite(v) && v > 0), 'venter på firmware m/ LT-token'),
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
    const channelGroups = STATUS_CHANNELS.map(ch => {
        const idx = ch.num - 1;
        // Count wakes where this channel used exactly N retries (final code doesn't matter — the
        // point is showing how often this channel needed retries per attempt level).
        const retry1 = entries.filter(e => Array.isArray(e.s.PR) && e.s.PR[idx] === 1).length;
        const retry2 = entries.filter(e => Array.isArray(e.s.PR) && e.s.PR[idx] === 2).length;
        // Rescue rate: wakes where retries fired AND ended in 200 (data preserved) vs all wakes
        // where retries fired. Answers "how often does the retry mechanism earn its keep on this
        // channel". Silent-wake rows count as attempts that failed (their LR is a non-200 code).
        const retryAttempts = entries.filter(e => Array.isArray(e.s.PR) && e.s.PR[idx] > 0).length;
        const retryRescues = entries.filter(e =>
            Array.isArray(e.s.PR) && e.s.PR[idx] > 0 &&
            Array.isArray(e.s.LR) && e.s.LR[idx] === 200
        ).length;
        const footerLines = [];
        if (retry1 || retry2) {
            if (retry1) footerLines.push(`+1&nbsp;&nbsp;${retry1}`);
            if (retry2) footerLines.push(`+2&nbsp;&nbsp;${retry2}`);
            if (retryAttempts > 0) {
                const pct = Math.round(retryRescues / retryAttempts * 100);
                footerLines.push(`reddet&nbsp;&nbsp;${retryRescues}/${retryAttempts}&nbsp;(${pct}%)`);
            }
        }
        return {
            key: `LR_CH${ch.num}`,
            title: `Ch${ch.num} (${ch.label}) — HTTP`,
            order: lrChannelOrder,
            getValue: e => {
                if (!Array.isArray(e.s.LR) || e.s.LR.length !== 3) return null;
                if (Number.isFinite(e.s.PF) && e.s.PF > 0) return null;   // silent-wake LR → 'FEIL' bucket handles it
                return lrBucket(e.s.LR[idx]);
            },
            extraCounts: silentCount > 0 ? { FEIL: silentCount } : null,
            footerLines
        };
    });

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
        const footer = Array.isArray(g.footerLines) && g.footerLines.length
            ? `<div class="dist-footer">${g.footerLines.map(l => `<span>${l}</span>`).join('')}</div>`
            : '';
        return `<div class="dist-group"><div class="dist-title">${g.title} · n=${total}</div>${rows}${footer}</div>`;
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
