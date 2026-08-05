#!/usr/bin/env python3
"""
Analyzes ThingSpeak status timestamps for the ESP32 snap-to-round-minute sleep design.

Goals (prioritized):
  a. Posts should display in the intended minute (seconds 0-59 of :XX)
  b. Posts should land as close to :XX:XX as possible without breaking (a)

Fetches recent timer-wake statuses (SD-0 only — skips button/fresh wakes with display delay),
computes drift distribution, and recommends an optimal SNAP_BOUNDARY_BUFFER_SEC value.

Usage:
    ./analyze_snap_timing.py                     # last 1 day, buffer 30
    ./analyze_snap_timing.py --days 7            # last week
    ./analyze_snap_timing.py --buffer 20         # if you've changed SNAP_BOUNDARY_BUFFER_SEC in firmware
"""
import argparse
import json
import sys
import urllib.request
from datetime import datetime, timezone, timedelta

CHANNELS = [2568299, 2584548, 2584547]   # Drimon, Detaljer, Tech — status written to all three per wake
MERGE_WINDOW_SEC = 60                     # entries with identical status within this window = same wake
OSLO = timezone(timedelta(hours=2))       # CEST — adjust to +1 outside DST if needed

# Statuses from before this cutoff used older snap logic (pre-NTP-every-wake, etc.) — don't mix them in.
CUTOFF = datetime(2026, 8, 5, 17, 17, 0, tzinfo=OSLO)

TOKEN_PREFIXES = [
    ('WF-', 'WF'), ('BS-', 'BS'), ('WT-', 'WT'), ('FC-', 'FC'), ('PF-', 'PF'),
    ('BV-', 'BV'), ('TU-', 'TU'), ('TV-', 'TV'), ('LX-', 'LX'), ('WD-', 'WD'),
    ('LR-', 'LR'), ('V-', 'V'), ('SD-', 'SD'),
    ('T-', 'T'), ('W-', 'W'), ('B-', 'B'), ('P-', 'P'),
]


def parse_status(s):
    """Parse status string into a dict of tokens. Longer prefixes first (V- must come after all X-V-Y matches)."""
    if not s:
        return {}
    out = {}
    for part in s.split('_'):
        if not part:
            continue
        matched = False
        for prefix, key in TOKEN_PREFIXES:
            if part.startswith(prefix) and key not in out:
                out[key] = part[len(prefix):]
                matched = True
                break
        if not matched and part in ('NIGHT', 'DUSK', 'SHADE', 'SUN'):
            out['LIGHT'] = part
    return out


def fetch_all_channels(days):
    """Fetch statuses from every channel; returns a flat list of (channel, feed) tuples."""
    all_feeds = []
    for ch in CHANNELS:
        url = f"https://api.thingspeak.com/channels/{ch}/status.json?results=8000&days={days}"
        with urllib.request.urlopen(url) as r:
            for f in json.load(r).get('feeds', []):
                all_feeds.append((ch, f))
    return all_feeds


def collect_timer_wakes(ch_feeds):
    """Deduplicate the same wake seen from multiple channels: match by identical status string within MERGE_WINDOW_SEC.
    Enforces the hard-coded CUTOFF — statuses before the current-snap-logic-was-live moment are always dropped."""
    raw = []
    for ch, f in ch_feeds:
        ts = datetime.fromisoformat(f['created_at'].replace('Z', '+00:00')).astimezone(OSLO)
        if ts < CUTOFF:
            continue
        status_str = f.get('status') or ''
        if not status_str:
            continue
        raw.append({'t': ts, 'raw': status_str, 'ch': ch})
    raw.sort(key=lambda x: x['t'])

    wakes = []
    for r in raw:
        matched = False
        # Look back for an existing wake with same status string within the merge window
        for w in reversed(wakes):
            if (r['t'] - w['t']).total_seconds() > MERGE_WINDOW_SEC:
                break
            if w['raw'] == r['raw']:
                w['channels'].add(r['ch'])
                matched = True
                break
        if not matched:
            s = parse_status(r['raw'])
            if s.get('SD') != '0':   # skip button/fresh wakes (SD 8000/10000/12000)
                continue
            # Use the EARLIEST timestamp we saw for this wake — closest to actual post moment
            wakes.append({
                't': r['t'],
                'raw': r['raw'],
                'sec': r['t'].second,
                'wt': int(s.get('WT', '0') or 0),
                'tu': int(s.get('TU', '0') or 0),
                'v': s.get('V', '?'),
                'channels': {r['ch']},
            })
    return sorted(wakes, key=lambda x: x['t'])


def stdev(vals):
    n = len(vals)
    if n < 2:
        return 0.0
    m = sum(vals) / n
    return (sum((x - m) ** 2 for x in vals) / (n - 1)) ** 0.5


def report(wakes, current_buffer):
    n = len(wakes)
    if n == 0:
        print("No timer-wake statuses found in the window.")
        return

    secs = [w['sec'] for w in wakes]
    wts = [w['wt'] for w in wakes]
    tus = [w['tu'] for w in wakes]
    versions = sorted(set(w['v'] for w in wakes))

    print(f"=== Timer-wake analysis ({n} wakes) ===")
    print(f"First:    {wakes[0]['t']}")
    print(f"Last:     {wakes[-1]['t']}")
    print(f"Versions: {', '.join(versions)}")
    print()

    # Seconds-in-minute distribution
    print("Seconds within minute (0-59):")
    print(f"  min = {min(secs)}")
    print(f"  max = {max(secs)}")
    print(f"  mean = {sum(secs)/n:.1f}")
    print(f"  median = {sorted(secs)[n//2]}")
    print(f"  stdev = {stdev(secs):.1f}")
    print()

    # Bucket histogram
    print("Distribution (5-second buckets):")
    for lo in range(0, 60, 5):
        hi = lo + 5
        count = sum(1 for s in secs if lo <= s < hi)
        marker = ' ← target' if lo <= current_buffer < hi else ''
        bar = '█' * (count * 40 // max(1, n))
        print(f"  :{lo:02d}-:{hi-1:02d}  {count:3d}  {bar}{marker}")
    print()

    # Goal (a) check: all in intended minute?
    in_minute = sum(1 for s in secs if 0 <= s < 60)
    print(f"Goal (a): all posts in intended minute → {in_minute}/{n} ({100*in_minute/n:.0f}%)")
    if in_minute < n:
        outliers = [w for w in wakes if not (0 <= w['sec'] < 60)]
        for w in outliers:
            print(f"  MISS: {w['t']} sec={w['sec']}")
    print()

    # Drift analysis relative to current buffer
    deltas = [s - current_buffer for s in secs]
    print(f"Delta from current target (:XX:{current_buffer:02d}):")
    print(f"  min = {min(deltas):+d} (worst early)")
    print(f"  max = {max(deltas):+d} (worst late)")
    print(f"  mean = {sum(deltas)/n:+.1f}")
    print()

    # Wake work stats
    print(f"WT (WiFi connect ms):  min={min(wts)}  max={max(wts)}  mean={sum(wts)/n:.0f}")
    print(f"TU (measure ms):       min={min(tus)}  max={max(tus)}  mean={sum(tus)/n:.0f}")
    print()

    # === Recommendation ===
    print("=== Recommendation ===")

    # Observed drift envelope, padded by a safety margin that shrinks as sample size grows.
    # Small samples get a bigger safety pad (we haven't seen the true worst-case yet).
    if n < 20:
        safety = 5
    elif n < 100:
        safety = 3
    else:
        safety = 2
    observed_early = min(deltas)          # negative or small = wake late; large negative = wake early
    observed_late = max(deltas)           # positive = wake late
    padded_early = observed_early - safety
    padded_late = observed_late + safety

    print(f"Observed drift envelope (delta from current target :XX:{current_buffer:02d}):")
    print(f"  worst early: {observed_early:+d} s   worst late: {observed_late:+d} s")
    print(f"  safety margin (n={n}): ±{safety} s → padded envelope [{padded_early:+d}, {padded_late:+d}]")
    print()

    # Shift target: predicted_sec = new_buffer + observed_delta
    # For goal (a), predicted must always stay in [0, 60) even at padded worst cases
    # For goal (b), maximize mean (closer to :XX:60 = tighter to boundary)
    best_buffer = None
    best_mean_sec = -1
    for candidate in range(-5, 61):
        worst_early_predicted = candidate + padded_early
        worst_late_predicted  = candidate + padded_late
        if 0 <= worst_early_predicted and worst_late_predicted < 60:
            mean_pred = sum(d + candidate for d in deltas) / n
            if mean_pred > best_mean_sec:
                best_mean_sec = mean_pred
                best_buffer = candidate

    if best_buffer is not None:
        predicted = [d + best_buffer for d in deltas]
        print(f"Current buffer: SNAP_BOUNDARY_BUFFER_SEC = {current_buffer}")
        print(f"  observed posts landed at :XX:{min(secs):02d} to :XX:{max(secs):02d} (mean {sum(secs)/n:.1f})")
        print()
        print(f"Optimal buffer: {best_buffer}")
        print(f"  predicted posts would land at :XX:{min(predicted):02d} to :XX:{max(predicted):02d} (mean {sum(predicted)/n:.1f})")
        print(f"  goal (a) preserved even at padded worst-case ±{safety} s")
        print(f"  goal (b): mean shifts {sum(secs)/n:.1f} → {sum(predicted)/n:.1f}")
        print()

        if best_buffer != current_buffer:
            print(f"  → suggest: SNAP_BOUNDARY_BUFFER_SEC {current_buffer} → {best_buffer}")
        else:
            print(f"  → current setting is already optimal")
    else:
        drift_span = padded_late - padded_early
        print(f"⚠  No buffer keeps posts safely in the intended minute (padded drift span = {drift_span} s > 60).")
        print(f"   Consider: enable ESP32 external 32.768 kHz RTC crystal, or accept occasional minute-off displays.")
        print()

    # NTP-sync recommendation based on observed drift
    print()
    print("On NTP-sync frequency:")
    obs_drift = max(secs) - min(secs)
    if obs_drift <= 15:
        print(f"  Current (every wake) is working well — drift span only {obs_drift} s.")
        print(f"  Could try every-other-wake or hourly to save 0.5s of WiFi per skipped wake.")
    elif obs_drift <= 30:
        print(f"  Every-wake NTP is keeping drift bounded at {obs_drift} s — keep as is.")
    else:
        print(f"  Drift span is large ({obs_drift} s). NTP-every-wake helps but per-sleep RC oscillator drift is significant.")
        print(f"  Consider: enable external 32.768 kHz RTC crystal in ESP32 config (hardware feature).")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--days', type=int, default=1, help='days of history to fetch (default: 1, max 400)')
    p.add_argument('--buffer', type=int, default=30, help='current SNAP_BOUNDARY_BUFFER_SEC in firmware (default: 30)')
    args = p.parse_args()

    days = max(1, min(400, args.days))

    print(f"Fetching last {days} day(s) of statuses from channels {CHANNELS}...")
    ch_feeds = fetch_all_channels(days)
    print(f"Got {len(ch_feeds)} raw status entries across all 3 channels")
    print(f"Hard-coded cutoff: filtering to entries at or after {CUTOFF}")

    wakes = collect_timer_wakes(ch_feeds)
    print(f"After merging & filtering to timer-wakes only (SD-0): {len(wakes)} unique wakes")
    print()

    report(wakes, current_buffer=args.buffer)


if __name__ == '__main__':
    main()
