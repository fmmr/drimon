const MAIN_CHANNEL = 2568299;
const EXT_CHANNEL = 2626867;
const TEMP_FIELD = 1;
const EXT_TEMP_FIELD = 1;
const TZ = 'Europe/Oslo';

const params = new URLSearchParams(location.search);
const DAYS = Math.max(1, Math.min(400, parseInt(params.get('days') || '90', 10)));
const FROST_THRESHOLD = parseFloat(params.get('frost') || '5');
const HEAT_THRESHOLD = parseFloat(params.get('heat') || '35');
const SHOW_ALL = params.get('all') === '1' || params.get('all') === 'true';
const AGG = ['raw', 'timescale', 'median'].includes(params.get('agg')) ? params.get('agg') : 'raw';

moment.locale('nb');

const aggLabel = AGG === 'raw' ? 'rådata' : AGG === 'timescale' ? 'timescale=60' : 'median=60';
document.getElementById('controls').textContent =
    `Siste ${DAYS} dager · frost ≤ ${FROST_THRESHOLD} °C · varme ≥ ${HEAT_THRESHOLD} °C · aggregering: ${aggLabel}` +
    (SHOW_ALL ? ' · viser alle dager' : ' · viser kun kritiske dager');

Promise.all([
    fetchField(MAIN_CHANNEL, TEMP_FIELD),
    fetchField(EXT_CHANNEL, EXT_TEMP_FIELD)
])
    .then(([inside, outside]) => render(inside, outside))
    .catch(err => {
        document.getElementById('status').textContent = 'Feil ved henting: ' + err.message;
    });

function fetchField(channel, field) {
    const aggParam = AGG === 'raw' ? '' : `&${AGG}=60`;
    return fetch(`https://api.thingspeak.com/channels/${channel}/fields/${field}.json?days=${DAYS}${aggParam}`)
        .then(r => r.json())
        .then(d => d.feeds
            .map(f => ({ t: moment.tz(f.created_at, TZ), v: parseFloat(f[`field${field}`]) }))
            .filter(f => Number.isFinite(f.v)));
}

function render(insideFeeds, outsideFeeds) {
    const insideByDay = perDayMinMax(insideFeeds);
    const outsideByDay = perDayMinMax(outsideFeeds);

    const allKeys = [...insideByDay.keys()].sort().reverse();
    const rows = allKeys.map(key => ({
        key,
        day: moment.tz(key, TZ),
        inside: insideByDay.get(key),
        outside: outsideByDay.get(key) || null
    }));

    for (const r of rows) {
        r.isFrost = r.inside.min <= FROST_THRESHOLD;
        r.isHeat = r.inside.max >= HEAT_THRESHOLD;
    }

    const critical = rows.filter(r => r.isFrost || r.isHeat);

    renderStats(rows, critical);

    const shown = SHOW_ALL ? rows : critical;
    const tbody = document.querySelector('#events-table tbody');
    tbody.innerHTML = shown.map(renderRow).join('');

    document.getElementById('status').hidden = true;
    if (shown.length === 0) {
        document.getElementById('empty').hidden = false;
    } else {
        document.getElementById('events-table').hidden = false;
    }
}

function perDayMinMax(feeds) {
    const days = new Map();
    for (const f of feeds) {
        const key = f.t.clone().startOf('day').format('YYYY-MM-DD');
        const cur = days.get(key);
        if (!cur) {
            days.set(key, { min: f.v, max: f.v, minAt: f.t, maxAt: f.t });
        } else {
            if (f.v < cur.min) { cur.min = f.v; cur.minAt = f.t; }
            if (f.v > cur.max) { cur.max = f.v; cur.maxAt = f.t; }
        }
    }
    return days;
}

function renderStats(rows, critical) {
    const frostDays = rows.filter(r => r.isFrost);
    const heatDays = rows.filter(r => r.isHeat);

    const coldest = rows.reduce((best, r) => (!best || r.inside.min < best.inside.min) ? r : best, null);
    const hottest = rows.reduce((best, r) => (!best || r.inside.max > best.inside.max) ? r : best, null);

    const dayFmt = 'D. MMM';
    const cell = (label, value, sub) =>
        `<div><span class="stat-label">${label}</span><span class="stat-value">${value}</span>${sub ? `<span class="stat-sub">${sub}</span>` : ''}</div>`;

    const el = document.getElementById('stats');
    el.innerHTML = [
        cell('Dager totalt', rows.length),
        cell('Frostnetter', frostDays.length, `≤ ${FROST_THRESHOLD} °C`),
        cell('Varmedager', heatDays.length, `≥ ${HEAT_THRESHOLD} °C`),
        cell('Kritiske', critical.length),
        cell('Kaldest',
            coldest ? `${coldest.inside.min.toFixed(1)} °C` : '—',
            coldest ? `${coldest.day.format(dayFmt)} · ${coldest.inside.minAt.format('HH:mm')}` : ''),
        cell('Varmest',
            hottest ? `${hottest.inside.max.toFixed(1)} °C` : '—',
            hottest ? `${hottest.day.format(dayFmt)} · ${hottest.inside.maxAt.format('HH:mm')}` : '')
    ].join('');
    el.hidden = false;
}

function renderRow(r) {
    const dayLabel = r.day.format('ddd D. MMM');
    const minCell = `<span class="min-val">${r.inside.min.toFixed(1)} °C</span><span class="time-sub">${r.inside.minAt.format('HH:mm')}</span>`;
    const maxCell = `<span class="max-val">${r.inside.max.toFixed(1)} °C</span><span class="time-sub">${r.inside.maxAt.format('HH:mm')}</span>`;
    const outCell = r.outside
        ? `${r.outside.min.toFixed(1)} / ${r.outside.max.toFixed(1)} °C`
        : '—';

    const badges = [];
    if (r.isFrost) badges.push('<span class="type-badge" title="Frost">🥶</span>');
    if (r.isHeat) badges.push('<span class="type-badge" title="Varme">🥵</span>');
    if (!badges.length) badges.push('—');

    const cls = r.isFrost && r.isHeat ? 'both' : r.isFrost ? 'frost' : r.isHeat ? 'heat' : '';

    return `<tr${cls ? ` class="${cls}"` : ''}>
        <td>${dayLabel}</td>
        <td>${minCell}</td>
        <td>${maxCell}</td>
        <td>${outCell}</td>
        <td>${badges.join('')}</td>
    </tr>`;
}
