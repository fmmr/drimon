const CHANNEL_ID = 2568299;
const FIELD = 4;
const WINDOW_SHIFT = -63;
const TZ = 'Europe/Oslo';

const params = new URLSearchParams(location.search);
const DAYS = Math.max(1, Math.min(30, parseInt(params.get('days') || '14', 10)));
const MIN_EVENTS = Math.max(2, parseInt(params.get('minEvents') || '4', 10));
const WINDOW_THRESHOLD_RAW = Math.max(0, parseInt(params.get('threshold') || '80', 10));
const LOW_MAX_DISPLAYED = Math.max(0, parseInt(params.get('lowMax') || '100', 10));
const RAINY_MAX_DISPLAYED = Math.max(0, parseInt(params.get('rainyMax') || '55', 10));

moment.locale('nb');

document.getElementById('controls').textContent =
    `Siste ${DAYS} dager · åpen ≥ ${WINDOW_THRESHOLD_RAW + WINDOW_SHIFT} mm (sensor ${WINDOW_THRESHOLD_RAW}) · flapping ≥ ${MIN_EVENTS} åpninger · 🌧️ < ${RAINY_MAX_DISPLAYED} mm · ☁️ < ${LOW_MAX_DISPLAYED} mm`;

fetch(`https://api.thingspeak.com/channels/${CHANNEL_ID}/fields/${FIELD}.json?days=${DAYS}`)
    .then(r => r.json())
    .then(render)
    .catch(err => {
        document.getElementById('status').textContent = 'Feil ved henting: ' + err.message;
    });

function render(data) {
    const feeds = data.feeds
        .map(f => ({
            t: moment.tz(f.created_at, TZ),
            raw: parseFloat(f[`field${FIELD}`])
        }))
        .filter(f => Number.isFinite(f.raw));

    const rows = computeDayStats(feeds);

    renderStats(rows);

    const tbody = document.querySelector('#windows-table tbody');
    tbody.innerHTML = rows.map(renderRow).join('');
    document.getElementById('windows-table').hidden = false;
    document.getElementById('status').hidden = true;
}

function renderStats(rows) {
    const withOpen = rows.filter(r => r.events > 0);
    const noOpen = rows.length - withOpen.length;

    const pickMax = (list, key) =>
        list.reduce((best, r) => (best === null || r[key] > best[key]) ? r : best, null);

    const pickByTimeOfDay = (list, key, cmp) =>
        list.filter(r => r[key]).reduce((best, r) => {
            if (best === null) return r;
            const rMin = r[key].hours() * 60 + r[key].minutes();
            const bMin = best[key].hours() * 60 + best[key].minutes();
            return cmp(rMin, bMin) ? r : best;
        }, null);

    const maxOpening = pickMax(withOpen, 'maxRaw');
    const maxDuration = pickMax(withOpen, 'openDurationMs');
    const earliestOpen = pickByTimeOfDay(withOpen, 'firstOpen', (a, b) => a < b);
    const latestClose = pickByTimeOfDay(withOpen, 'lastClose', (a, b) => a > b);
    const flappingDays = withOpen.filter(r => r.flapping).length;

    const dayFmt = 'D. MMM';
    const cell = (label, value, sub) =>
        `<div><span class="stat-label">${label}</span><span class="stat-value">${value}</span>${sub ? `<span class="stat-sub">${sub}</span>` : ''}</div>`;

    const el = document.getElementById('stats');
    el.innerHTML = [
        cell('Dager totalt', rows.length),
        cell('Med åpning', withOpen.length),
        cell('Uten åpning', noOpen),
        cell('Flapping-dager', flappingDays),
        cell('Største åpning',
            maxOpening ? `${Math.round(maxOpening.maxRaw + WINDOW_SHIFT)} mm` : '—',
            maxOpening ? maxOpening.day.format(dayFmt) : ''),
        cell('Lengst åpen',
            maxDuration ? formatDuration(maxDuration.openDurationMs) : '—',
            maxDuration ? maxDuration.day.format(dayFmt) : ''),
        cell('Tidligst åpnet',
            earliestOpen ? earliestOpen.firstOpen.format('HH:mm') : '—',
            earliestOpen ? earliestOpen.day.format(dayFmt) : ''),
        cell('Senest lukket',
            latestClose ? latestClose.lastClose.format('HH:mm') : '—',
            latestClose ? latestClose.day.format(dayFmt) : '')
    ].join('');
    el.hidden = false;
}

function computeDayStats(feeds) {
    const days = new Map();

    function ensureDay(key) {
        if (!days.has(key)) {
            days.set(key, {
                key,
                day: moment.tz(key, TZ),
                firstOpen: null,
                lastClose: null,
                events: 0,
                openDurationMs: 0,
                stillOpen: false,
                maxRaw: -Infinity
            });
        }
        return days.get(key);
    }

    let prevState = null;

    for (let i = 0; i < feeds.length; i++) {
        const r = feeds[i];
        const isOpen = r.raw >= WINDOW_THRESHOLD_RAW;
        const dayKey = r.t.clone().startOf('day').format('YYYY-MM-DD');
        const day = ensureDay(dayKey);

        if (r.raw > day.maxRaw) day.maxRaw = r.raw;

        if (isOpen && day.firstOpen === null) day.firstOpen = r.t;

        if (isOpen && prevState === false) day.events++;
        if (isOpen && prevState === null) day.events++;

        if (!isOpen && prevState === true) day.lastClose = r.t;

        if (isOpen && i < feeds.length - 1) {
            day.openDurationMs += feeds[i + 1].t.diff(r.t);
        }

        prevState = isOpen;
    }

    const sorted = Array.from(days.values()).sort((a, b) => b.key.localeCompare(a.key));

    if (prevState === true && sorted.length > 0) {
        sorted[0].stillOpen = true;
    }

    for (const day of sorted) {
        day.flapping = day.events >= MIN_EVENTS;
        day.weather = classifyWeather(day);
    }

    return sorted;
}

function classifyWeather(day) {
    if (day.events === 0) return { label: '—', cls: '' };
    const maxDisplayed = day.maxRaw + WINDOW_SHIFT;
    if (maxDisplayed < RAINY_MAX_DISPLAYED) return { label: '🌧️', cls: 'w-rainy' };
    if (maxDisplayed < LOW_MAX_DISPLAYED) return { label: '☁️', cls: 'w-cloudy' };
    if (day.flapping) return { label: '⛅', cls: 'w-mixed' };
    return { label: '☀️', cls: 'w-sunny' };
}

function renderRow(s) {
    const dayLabel = s.day.format('ddd D. MMM');
    const opened = s.firstOpen ? s.firstOpen.format('HH:mm') : '—';
    const closed = s.stillOpen
        ? '<em>fortsatt åpent</em>'
        : s.lastClose
            ? s.lastClose.format('HH:mm')
            : s.firstOpen
                ? '<em>etter midnatt</em>'
                : '—';
    const duration = formatDuration(s.openDurationMs);
    const events = s.events || '—';
    const flapping = s.flapping ? '⚠️ ja' : 'nei';
    const peak = Number.isFinite(s.maxRaw)
        ? `${Math.round(s.maxRaw + WINDOW_SHIFT)} mm`
        : '—';
    const cls = s.flapping ? ' class="flapping"' : '';
    return `<tr${cls}>
        <td>${dayLabel}</td>
        <td>${opened}</td>
        <td>${closed}</td>
        <td>${duration}</td>
        <td>${events}</td>
        <td>${peak}</td>
        <td>${flapping}</td>
        <td class="${s.weather.cls}">${s.weather.label}</td>
    </tr>`;
}

function formatDuration(ms) {
    if (!ms) return '—';
    const totalMin = Math.round(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}t ${m}m`;
}
