# DriMon Site URL Parameters

Live site: <https://drimon.rodland.no/>

Every parameter is optional and combinable. Defaults render the standard multi-chart dashboard.

| Param | Values | Purpose |
|---|---|---|
| `range` | see [range values below](#range-values) | Time range for chart data. Ignored when `start`/`end` are given. |
| `start` | `YYYY-MM-DD` or `YYYY-MM-DD HH:mm:ss` | Explicit start date/time (overrides `range`) |
| `end` | `YYYY-MM-DD` or `YYYY-MM-DD HH:mm:ss` | Explicit end date/time (overrides `range`) |
| `results` | integer up to 8000 | Max entries per chart |
| `chart` | short chart name, e.g. `battery` | Show only ONE chart, full viewport |
| `dashboard` | `true` | Enable dashboard/kiosk mode (2×2 fixed grid, auto-refresh, Pi-friendly). Also auto-activated on ~800×480 screens. |
| `trend` | `1` / `true` / `yes` | Enable trend mode (opt-in charts only, aggregated data) |
| `trendHour` | integer 0-23 | Only meaningful with `trend=1`; samples at this local hour instead of daily average |

## `range` values

Complete list, resolved by `docs/js/date-utils.js`:

| Value | Behavior |
|---|---|
| `default` | Uses each chart's own `defaultRange` (varies per chart, typically 3 or 7) |
| `<N>` (any positive integer, e.g. `1`, `2`, `3`, `7`, `14`, `30`) | For N ≤ 30: **last N days** (start = N days ago, end = now). For N > 30: quirky — actually renders a **30-day slice ending (N-30) days ago** (e.g. `range=60` shows days 60→30 ago, `range=90` shows days 90→60 ago). Known issue; fix pending. |
| `today` | From midnight today to now (partial day) |
| `yesterday` | Full previous day, 00:00–23:59 |
| `this-week` | From Monday 00:00 (of this week) to now (partial week) |
| `last-week` | Full previous week, Mon–Sun |
| `this-month` | From 1st of current month to now (partial month) |
| `last-month` | Full previous calendar month |
| `start` | From `2024-07-15` (data-collection start) to now — the "all data" view |

For predictable long-window views, prefer explicit `start`/`end` dates until the `range=N` (N>30) behavior is fixed.

## Explicit dates (`start` / `end`)

```
https://drimon.rodland.no/?start=2026-06-01&end=2026-07-01
https://drimon.rodland.no/?chart=out-temp&start=2024-08-01&end=2024-09-01
https://drimon.rodland.no/?trend=1&chart=out-temp&start=2024-07-15
```

- Only `start` set → 30-day window starting at that date
- Only `end` set → 30-day window ending at that date
- Both → explicit window
- The x-axis format adapts to the actual date span (hourly for one day, daily for a week, `D/M` for a month, month names for longer)

## Single-chart view (`chart`)

Renders one chart full-viewport instead of the grid.

```
https://drimon.rodland.no/?chart=battery&range=7
```

`chart` accepts either the short name (`battery`) or the full ID (`chart-battery`). Unknown names fall back to showing all charts.

Available short names (any chart in `docs/js/chart-config.js` without the `chart-` prefix): `temp`, `window`, `light`, `battery`, `out-temp`, `temp-diff`, `plants-temp`, `sensors-temp`, `humidity`, `temperature`, `wind`, `rain`, `soil-moisture`, `wifi`, `time-used`, `uv-index`, `overview`, etc.

### Hidden charts (accessible only via `?chart=X`)

Any chart-config entry with `hidden: true` is excluded from the main site grid but remains reachable via `?chart=<name>`. Useful for debug/utility charts you don't want on the dashboard.

```js
{
    id: 'chart-termo3-raw',
    hidden: true,                    // ← doesn't show on main site
    titleKey: 'Termo 3 (raw)',
    series: [{ ... }],
    row: 99,                         // row doesn't matter — not in the grid
    category: 'debug',
    unit: '°C'
}
```

## Trend mode (`trend`)

Renders only charts marked `trendCapable: true` in `chart-config.js`, using server-side aggregation to smooth out per-wake spikes and reveal long-period trends.

- **Path A — default** (no `trendHour`): fetches with `average=1440` — **one data point per day**, whole-day mean. Fast, small payload.
- **Path B — hour-specific** (`trendHour=13`): fetches with `timescale=60` (one point per hour) and client-filters to the specified local hour. Honors "what was it at 13:00 each day" specifically.

```
https://drimon.rodland.no/?trend=1&range=60                 # daily avg, 60 days, all trend-capable charts
https://drimon.rodland.no/?trend=1&trendHour=13&range=60    # 13:00 sample per day, 60 days
https://drimon.rodland.no/?trend=1&chart=out-temp&range=90  # combined with single-chart mode
```

To opt a chart into trend mode, add `trendCapable: true` to its config entry in `docs/js/chart-config.js`. Non-opt-in charts are hidden while trend mode is active.
