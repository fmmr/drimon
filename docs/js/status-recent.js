// Shared status-string parsing + two table renderers (parsed 20-col + raw 3-col). Loaded by
// status.html which handles all four modes (default | showOnlyStatus | raw | raw+showOnlyStatus)
// via URL params. Must precede status.js in the script tag order — top-level symbols are used
// by status.js directly.

const MERGE_WINDOW_MS = 60000;
const TZ = 'Europe/Oslo';

// BSSID bytes 1-4 (8 hex chars, lowercase) → node name. Source: documentation/MESH_NODES.md.
const MESH_NODES = {
    '918294f9': 'SOV_MF',
    '91828f5f': 'EXTRA_UTE',
    '91828f6c': 'STUE',
    '91829500': 'TV_ROM'
};

const RESET_REASON_NAMES = {
    1: 'POWERON', 2: 'EXT', 3: 'SW', 4: 'PANIC', 5: 'INT_WDT',
    6: 'TASK_WDT', 7: 'WDT', 8: 'DEEPSLEEP', 9: 'BROWNOUT', 10: 'SDIO'
};
const WAKEUP_CAUSE_NAMES = {
    0: 'UNDEFINED', 2: 'EXT0', 4: 'TIMER'
};

const LIGHT_TOKENS = new Set(['NIGHT', 'DUSK', 'SHADE', 'SUN']);

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
    { prefix: 'LS-', key: 'LS', parse: v => {
        const dot = v.indexOf('.');
        if (dot < 0) return { n: null, stage: v };
        return { n: parseInt(v.slice(0, dot), 10), stage: v.slice(dot + 1) };
    }},
    { prefix: 'V-',  key: 'V',  parse: v => v },
    { prefix: 'SD-', key: 'SD', parse: v => parseInt(v, 10) }
];

function parseStatus(s) {
    const out = {};
    if (!s) return out;
    for (const p of s.split('_')) {
        if (!p) continue;
        if (LIGHT_TOKENS.has(p)) { out.LIGHT = p; continue; }
        const t = STATUS_TOKENS.find(tk => p.startsWith(tk.prefix));
        if (t) out[t.key] = t.parse(p.slice(t.prefix.length));
    }
    return out;
}

function mergeAcrossChannels(byChannel, statusChannels) {
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
    const clean = hash.replace(/\+$/, '');
    const dirtySuffix = hash.endsWith('+') ? '+' : '';
    return `<a class="version-link" href="https://github.com/fmmr/drimon/commit/${clean}" target="_blank" rel="noopener noreferrer" title="Open commit ${hash} on GitHub">${clean}${dirtySuffix}</a>`;
}

function channelBadges(channels, statusChannels) {
    return statusChannels.map(c => channels.has(c.num)
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

function wrEntry(e) {
    return Array.isArray(e.s.WR) && e.s.WR.length === 2 && Number.isFinite(e.s.WR[0]) && Number.isFinite(e.s.WR[1])
        ? e.s.WR
        : null;
}

function isColdBoot(e) {
    const wr = wrEntry(e);
    return wr !== null && wr[0] !== 8;
}

function anomalyReasons(e, statusChannels) {
    const reasons = [];
    const wr = wrEntry(e);
    if (wr && !(wr[0] === 8 && (wr[1] === 4 || wr[1] === 2))) {
        const rr = RESET_REASON_NAMES[wr[0]] || wr[0];
        const wc = WAKEUP_CAUSE_NAMES[wr[1]] || wr[1];
        reasons.push(`WR-${wr[0]}.${wr[1]} (${rr}/${wc})`);
    }
    if (e.channels && e.channels.size < statusChannels.length) {
        const missing = statusChannels.filter(c => !e.channels.has(c.num)).map(c => c.num).join(',');
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
    if (e.s.LS && typeof e.s.LS.stage === 'string' && e.s.LS.stage !== 'OK' && e.s.LS.stage !== '??') {
        const nPart = Number.isFinite(e.s.LS.n) ? `${e.s.LS.n}.` : '';
        reasons.push(`LS=${nPart}${e.s.LS.stage}`);
    }
    return reasons;
}

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

// Render the "recent statuses" table into the given tbody. entries is the merged wake list
// (ascending), n is the max rows to show (newest last N, then reversed for newest-first display).
// statusChannels is the [{id,num,label}, ...] list used for channel badges + anomaly heuristics.
// headingEl (optional) receives a "Siste N statuser" hyperlink to the raw ThingSpeak feed.
function renderRecentTable(tbody, entries, n, statusChannels, headingEl) {
    const rows = entries.slice(-n).reverse();
    if (headingEl) {
        const ch1Id = statusChannels[0].id;
        const url = `https://api.thingspeak.com/channels/${ch1Id}/status.json?results=20&days=1`;
        headingEl.innerHTML =
            `<a href="${url}" target="_blank" rel="noopener noreferrer">Siste ${rows.length} statuser</a>`;
    }
    tbody.innerHTML = rows.map(e => {
        const wf = e.s.WF || '—';
        const wfCls = wf === '—' ? '' : ` class="wf-${wf.toLowerCase()}"`;
        const rawEscaped = e.raw ? e.raw.replace(/"/g, '&quot;') : '';
        const reasons = anomalyReasons(e, statusChannels);
        const trClass = reasons.length ? ' class="anomaly"' : '';
        const titlePrefix = reasons.length ? `⚠ Uvanlig: ${reasons.join(' · ')} — ` : '';
        const rawAttrs = e.raw ? ` title="${titlePrefix}Klikk for å kopiere: ${rawEscaped}" data-raw="${rawEscaped}"` : '';
        return `<tr${trClass}${rawAttrs}>
            <td>${e.t.format('D. MMM HH:mm')}</td>
            <td class="ch-cell">${channelBadges(e.channels, statusChannels)}</td>
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
            <td${e.s.LS && e.s.LS.stage && e.s.LS.stage !== 'OK' && e.s.LS.stage !== '??' ? ' class="ls-anomaly"' : ''}>${
                e.s.LS
                    ? `${e.s.LS.stage}${Number.isFinite(e.s.LS.n) ? ` <span class="raw-value">#${e.s.LS.n}</span>` : ''}`
                    : '—'
            }</td>
            <td>${githubCommitLink(e.s.V)}</td>
        </tr>`;
    }).join('');

    tbody.onclick = (evt) => {
        if (evt.target.closest('a')) return;
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

// Render the raw-string table into the given tbody. 3 columns: timestamp, channel badges, raw string.
// Rows are click-to-copy the whole status string. Same data + merge + N-cap as renderRecentTable —
// only the projection differs (raw string vs parsed columns).
function renderRawTable(tbody, entries, n, statusChannels) {
    const sorted = [...entries].sort((a, b) => b.t.diff(a.t)).slice(0, n);
    tbody.innerHTML = sorted.map(e => {
        const rawEscaped = e.raw.replace(/"/g, '&quot;');
        return `<tr data-raw="${rawEscaped}" title="Klikk for å kopiere">
            <td class="ts">${e.t.format('YYYY-MM-DD HH:mm:ss')}</td>
            <td class="ch-cell">${channelBadges(e.channels, statusChannels)}</td>
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
}
