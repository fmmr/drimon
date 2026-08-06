# Status Field Telemetry — Querying and Analysis

The ESP32 sets a `status` string on every ThingSpeak write, on all three channels. This doc is for **analyzing historical status data** via the ThingSpeak API. For the quick decoder table (what does `WF-HIT` mean at a glance), see [QUICK_REFERENCE.md](QUICK_REFERENCE.md#status-field-decoder).

## Querying status history

Dedicated endpoint (only returns entries where `status` was set):

```
https://api.thingspeak.com/channels/2568299/status.json?results=1000&days=100
```

- `results=` caps at 8000
- `days=` defaults to 1 (24 h); increase to fetch further back
- Both parameters are ANDed — increasing one without the other still caps at the smaller window

Alternative: `feeds.json?results=8000&days=100&status=true` returns status alongside field values in one response.

## Example analysis pipelines

WiFi connect time over time:

```bash
curl -s 'https://api.thingspeak.com/channels/2568299/status.json?results=1000&days=100' \
  | jq -r '.feeds[] | select(.status? and (.status | test("WT-"))) | [.created_at, (.status | capture("WT-(?<t>[0-9]+)").t)] | @tsv'
```

WiFi cache-hit histogram:

```bash
curl -s 'https://api.thingspeak.com/channels/2568299/status.json?results=1000&days=100' \
  | jq -r '.feeds[].status // empty' \
  | grep -oE 'WF-[A-Z]+' \
  | sort | uniq -c
```

Display-pause per entry (SD):

```bash
curl -s 'https://api.thingspeak.com/channels/2568299/status.json?results=1000&days=100' \
  | jq -r '.feeds[] | select(.status? and (.status | test("SD-"))) | [.created_at, (.status | capture("SD-(?<t>[0-9]+)").t)] | @tsv'
```

BSD-awk equivalent (macOS default) using `substr` + POSIX `match`:

```bash
curl -s 'https://api.thingspeak.com/channels/2568299/status.json?results=1000&days=100' \
  | jq -r '.feeds[] | [.created_at, .status] | @tsv' \
  | awk -F'\t' 'match($2, /WT-[0-9]+/) { print $1, substr($2, RSTART+3, RLENGTH-3) }'
```

Same regex principle for any other prefix — swap `WT-` for `WF-`, `SD-`, `T-`, `B-`, `P-`, `W-`, `WR-`, `LR-`, `PR-`, `FC-`, `PF-`, `BV-`, `TU-`, `TV-`, `LX-`, `WD-`.

## Ideas for future analytics

- Window-open duration per day (`W-OPEN` vs `W-CLOSE` transitions)
- Time spent in each light classification (`NIGHT` / `DUSK` / `SHADE` / `SUN`)
- WiFi reliability trend (`WF-HIT` rate, `WT-` p95 over rolling windows)
- Battery-low events per day (`B-LOW` count)
- Correlation between weather pressure state (`P-*`) and other events
- Cache-miss root cause analysis: correlate `WF-FBK` / `WF-MISS` with the same-day RSSI / weather
