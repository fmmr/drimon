const MAIN_CHANNEL = 2568299;
const EXT_CHANNEL = 2626867;
const WINDOW_FIELD = 4;
const TEMP_FIELD = 1;
const LUX_FIELD = 8;
const WIND_FIELD = 5;
const WINDOW_SHIFT = -63;
const TZ = 'Europe/Oslo';

const params = new URLSearchParams(location.search);
const DAYS = Math.max(30, parseInt(params.get('days') || '800', 10));
const MIN_GAP_WEEKS = Math.max(2, parseInt(params.get('gapWeeks') || '4', 10));

const WINDOW_BUCKETS = [
    { max: 5,        label: '< 5',    cls: 'lvl-0' },
    { max: 30,       label: '5–30',   cls: 'lvl-1' },
    { max: 80,       label: '30–80',  cls: 'lvl-2' },
    { max: 150,      label: '80–150', cls: 'lvl-3' },
    { max: Infinity, label: '> 150',  cls: 'lvl-4' }
];

const TEMP_BUCKETS = [
    { max: 0,        label: '< 0',   cls: 't-lvl-0' },
    { max: 5,        label: '0–5',   cls: 't-lvl-1' },
    { max: 10,       label: '5–10',  cls: 't-lvl-2' },
    { max: 15,       label: '10–15', cls: 't-lvl-3' },
    { max: 20,       label: '15–20', cls: 't-lvl-4' },
    { max: 25,       label: '20–25', cls: 't-lvl-5' },
    { max: 30,       label: '25–30', cls: 't-lvl-6' },
    { max: Infinity, label: '> 30',  cls: 't-lvl-7' }
];

const LUX_BUCKETS = [
    { max: 10,       label: '< 10',        cls: 'l-lvl-0' },
    { max: 100,      label: '10–100',      cls: 'l-lvl-1' },
    { max: 1000,     label: '100–1k',      cls: 'l-lvl-2' },
    { max: 5000,     label: '1k–5k',       cls: 'l-lvl-3' },
    { max: 15000,    label: '5k–15k',      cls: 'l-lvl-4' },
    { max: Infinity, label: '> 15k',       cls: 'l-lvl-5' }
];

const WIND_BUCKETS = [
    { max: 1,        label: '< 1',   cls: 'w-lvl-0' },
    { max: 3,        label: '1–3',   cls: 'w-lvl-1' },
    { max: 6,        label: '3–6',   cls: 'w-lvl-2' },
    { max: 10,       label: '6–10',  cls: 'w-lvl-3' },
    { max: Infinity, label: '> 10',  cls: 'w-lvl-4' }
];

moment.locale('nb');

Promise.all([
    fetchDailyMedian(MAIN_CHANNEL, WINDOW_FIELD),
    fetchDailyMedian(MAIN_CHANNEL, TEMP_FIELD),
    fetchDailyMedian(MAIN_CHANNEL, LUX_FIELD),
    fetchDailyMedian(EXT_CHANNEL, WIND_FIELD)
])
    .then(([winRaw, tempRaw, luxRaw, windRaw]) => {
        renderAll({
            window: mapReadings(winRaw, v => v + WINDOW_SHIFT),
            temp: mapReadings(tempRaw, v => v),
            lux: mapReadings(luxRaw, v => v),
            wind: mapReadings(windRaw, v => v)
        });
    })
    .catch(err => {
        document.getElementById('status').textContent = 'Feil ved henting: ' + err.message;
    });

function fetchDailyMedian(channel, field) {
    return fetch(`https://api.thingspeak.com/channels/${channel}/fields/${field}.json?days=${DAYS}&median=1440`)
        .then(r => r.json())
        .then(d => d.feeds.map(f => ({ t: f.created_at, v: parseFloat(f[`field${field}`]) })));
}

function mapReadings(rows, transform) {
    const m = new Map();
    for (const r of rows) {
        if (!Number.isFinite(r.v)) continue;
        const key = moment.tz(r.t, TZ).startOf('day').format('YYYY-MM-DD');
        m.set(key, transform(r.v));
    }
    return m;
}

function renderAll(byDay) {
    const allKeys = [
        ...byDay.window.keys(),
        ...byDay.temp.keys(),
        ...byDay.lux.keys(),
        ...byDay.wind.keys()
    ].sort();
    if (!allKeys.length) {
        document.getElementById('status').textContent = 'Ingen data.';
        return;
    }
    const firstDay = moment.tz(allKeys[0], TZ);
    const lastDay = moment.tz().tz(TZ).startOf('day');
    const gridStart = firstDay.clone().isoWeekday(1);
    if (gridStart.isAfter(firstDay)) gridStart.subtract(7, 'days');
    const totalDays = lastDay.diff(gridStart, 'days') + 1;

    const visible = computeVisibleWeeks(gridStart, totalDays, byDay, MIN_GAP_WEEKS);

    const heatmaps = [
        { key: 'window', label: 'Vindusåpning', unit: 'mm',  buckets: WINDOW_BUCKETS },
        { key: 'temp',   label: 'Temperatur',  unit: '°C',   buckets: TEMP_BUCKETS },
        { key: 'lux',    label: 'Lys',         unit: 'lux',  buckets: LUX_BUCKETS },
        { key: 'wind',   label: 'Vind',        unit: 'm/s',  buckets: WIND_BUCKETS }
    ];

    for (const h of heatmaps) {
        buildHeatmap(`calendar-${h.key}`, gridStart, visible, byDay[h.key], h.buckets, h.unit);
        buildLegend(`legend-${h.key}`, h.buckets, h.unit);
    }

    document.getElementById('status').hidden = true;
    document.getElementById('calendar-wrapper').hidden = false;
}

function computeVisibleWeeks(gridStart, totalDays, byDay, minGapWeeks) {
    const totalWeeks = Math.ceil(totalDays / 7);
    const weekHasData = new Array(totalWeeks).fill(false);
    const datasets = Object.values(byDay);
    for (let d = 0; d < totalDays; d++) {
        const key = gridStart.clone().add(d, 'days').format('YYYY-MM-DD');
        if (datasets.some(m => m.has(key))) {
            weekHasData[Math.floor(d / 7)] = true;
        }
    }

    const visible = [];
    let i = 0;
    while (i < totalWeeks) {
        if (weekHasData[i]) {
            visible.push({ type: 'data', weekIdx: i });
            i++;
        } else {
            let j = i;
            while (j < totalWeeks && !weekHasData[j]) j++;
            const runLen = j - i;
            if (runLen >= minGapWeeks) {
                visible.push({ type: 'gap', startWeek: i, endWeek: j - 1 });
            } else {
                for (let k = i; k < j; k++) visible.push({ type: 'data', weekIdx: k });
            }
            i = j;
        }
    }
    return visible;
}

function buildHeatmap(elId, gridStart, visible, byDay, buckets, unit) {
    const cal = document.getElementById(elId);
    cal.innerHTML = '';

    const dow = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'];
    for (let i = 0; i < 7; i++) {
        const label = document.createElement('div');
        label.className = 'dow-label';
        label.style.gridRow = i + 2;
        label.style.gridColumn = 1;
        label.textContent = dow[i];
        cal.appendChild(label);
    }

    const cols = visible.map(v => v.type === 'data' ? 'var(--cell)' : '2.5rem').join(' ');
    cal.style.gridTemplateColumns = `auto ${cols}`;

    const today = moment.tz().tz(TZ).endOf('day');
    let prevMonth = -1;

    visible.forEach((v, visIdx) => {
        const col = visIdx + 2;

        if (v.type === 'gap') {
            const gapStart = gridStart.clone().add(v.startWeek * 7, 'days');
            const gapEnd = gridStart.clone().add((v.endWeek + 1) * 7 - 1, 'days');
            const days = gapEnd.diff(gapStart, 'days') + 1;
            const months = Math.round(days / 30);
            const gap = document.createElement('div');
            gap.className = 'gap-marker';
            gap.style.gridRow = '2 / span 7';
            gap.style.gridColumn = col;
            gap.textContent = `${months} mnd`;
            gap.title = `Ingen data · ${gapStart.format('D. MMM YY')} – ${gapEnd.format('D. MMM YY')} (${days} dager)`;
            cal.appendChild(gap);
            prevMonth = -1;
            return;
        }

        for (let dowIdx = 0; dowIdx < 7; dowIdx++) {
            const cursor = gridStart.clone().add(v.weekIdx * 7 + dowIdx, 'days');
            const key = cursor.format('YYYY-MM-DD');
            const value = byDay.get(key);
            const inRange = !cursor.isAfter(today);
            const cell = document.createElement('div');
            cell.className = 'cal-cell ' + (inRange ? bucketFor(value, buckets) : 'lvl-future');
            cell.style.gridRow = dowIdx + 2;
            cell.style.gridColumn = col;
            cell.title = tooltipFor(cursor, value, unit);
            cal.appendChild(cell);
        }

        const weekStart = gridStart.clone().add(v.weekIdx * 7, 'days');
        const m = weekStart.month();
        if (m !== prevMonth) {
            const monthLabel = document.createElement('div');
            monthLabel.className = 'month-label';
            monthLabel.style.gridRow = 1;
            monthLabel.style.gridColumn = col;
            monthLabel.textContent = weekStart.format(m === 0 ? 'MMM YY' : 'MMM');
            cal.appendChild(monthLabel);
            prevMonth = m;
        }
    });
}

function bucketFor(value, buckets) {
    if (!Number.isFinite(value)) return 'lvl-none';
    for (const b of buckets) {
        if (value < b.max) return b.cls;
    }
    return buckets[buckets.length - 1].cls;
}

function tooltipFor(day, value, unit) {
    const dateStr = day.format('ddd D. MMM YYYY');
    if (!Number.isFinite(value)) return `${dateStr} — ingen data`;
    let rounded;
    if (unit === '°C' || unit === 'm/s') rounded = value.toFixed(1);
    else if (unit === 'lux' && value >= 1000) rounded = (value / 1000).toFixed(1) + 'k';
    else rounded = Math.round(value);
    const unitStr = (typeof rounded === 'string' && rounded.endsWith('k')) ? 'lux' : unit;
    return `${dateStr} — median ${rounded} ${unitStr}`;
}

function buildLegend(elId, buckets, unit) {
    const el = document.getElementById(elId);
    el.innerHTML = buckets.map(b =>
        `<span class="legend-item"><span class="legend-swatch ${b.cls}"></span><span class="legend-range">${b.label}</span></span>`
    ).join('') + `<span class="legend-unit">${unit}</span>`;
}
