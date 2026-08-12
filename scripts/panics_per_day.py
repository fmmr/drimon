#!/usr/bin/env python3
"""
Per-day panic summary — count of PANIC/WDT/BROWNOUT wakes, battery min/max/med, and the timestamp
+ battery voltage at the first panic of each day. Uses the WR- token (added 2026-08-06); rows
without WR are counted as "no-WR-token".

Usage:
    ./panics_per_day.py                # last 14 days (default)
    ./panics_per_day.py --days 30      # wider window
    ./panics_per_day.py --results 2000 # cap per-channel fetch (default 8000)
"""
import argparse
import json
import sys
import urllib.request
from collections import defaultdict

CHANNELS = [2568299, 2584548, 2584547]   # Drimon, Detaljer, Tech — status written to all three per wake
MERGE_WINDOW_SEC = 60                     # entries with identical status within this window = same wake

# Reset reasons that indicate a code-crash (not POWERON/EXT/DEEPSLEEP). Matches CB check in firmware.
# See CLAUDE.md § Status string format for the full WR- decoder.
CRASH_RESET_REASONS = {'0', '3', '4', '5', '6', '7', '9', '10'}


def parse_status(s):
    """Extract every _KEY-VALUE_ token that this script cares about."""
    out = {}
    for tok in s.split('_'):
        for prefix in ('WR-', 'BV-', 'LS-', 'V-'):
            if tok.startswith(prefix):
                out[prefix.rstrip('-')] = tok[len(prefix):]
    return out


def fetch(channel, days, results):
    url = f'https://api.thingspeak.com/channels/{channel}/status.json?results={results}&days={days}'
    with urllib.request.urlopen(url) as r:
        return json.load(r).get('feeds', [])


def merge_across_channels(days, results):
    """Deduplicate identical status strings observed within MERGE_WINDOW_SEC across 3 channels."""
    raw = []
    for ch in CHANNELS:
        for f in fetch(ch, days, results):
            if not f.get('status'):
                continue
            raw.append((f['created_at'], f['status']))
    raw.sort()
    wakes = []
    for ts, status in raw:
        for i in range(len(wakes) - 1, -1, -1):
            if wakes[i]['status'] == status:
                wakes[i]['channels'] += 1
                break
        else:
            wakes.append({'ts': ts, 'status': status, 'channels': 1})
    return wakes


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[1])
    ap.add_argument('--days', type=int, default=14)
    ap.add_argument('--results', type=int, default=8000)
    args = ap.parse_args()

    wakes = merge_across_channels(args.days, args.results)
    print(f'{len(wakes)} merged wakes over the last {args.days} days')
    print()

    per_day = defaultdict(lambda: {'bv': [], 'panic': 0, 'ok': 0, 'no_wr': 0,
                                    'first_panic_ts': None, 'first_panic_bv': None})
    for w in wakes:
        day = w['ts'][:10]
        s = parse_status(w['status'])
        wr = s.get('WR', '')
        bv_str = s.get('BV')
        try:
            bv = float(bv_str) if bv_str else None
        except ValueError:
            bv = None
        if bv is not None:
            per_day[day]['bv'].append(bv)
        if not wr:
            per_day[day]['no_wr'] += 1
        elif wr.split('.')[0] in CRASH_RESET_REASONS:
            per_day[day]['panic'] += 1
            if per_day[day]['first_panic_ts'] is None:
                per_day[day]['first_panic_ts'] = w['ts']
                per_day[day]['first_panic_bv'] = bv
        else:
            per_day[day]['ok'] += 1

    print(f'{"Day":12s} {"BVmin":6s} {"BVmax":6s} {"BVmed":6s}  panics/ok/no-WR   first-panic-time         first-panic-BV')
    print('-' * 110)
    for day in sorted(per_day.keys()):
        r = per_day[day]
        bvs = sorted(r['bv'])
        bvmin = f'{bvs[0]:5.2f}' if bvs else '  —  '
        bvmax = f'{bvs[-1]:5.2f}' if bvs else '  —  '
        bvmed = f'{bvs[len(bvs)//2]:5.2f}' if bvs else '  —  '
        fp = r['first_panic_ts'] or ''
        fpbv = f'{r["first_panic_bv"]:.2f}' if r['first_panic_bv'] else '—'
        print(f'{day}   {bvmin}  {bvmax}  {bvmed}   {r["panic"]:4d}/{r["ok"]:4d}/{r["no_wr"]:4d}   {fp:24s} {fpbv}')


if __name__ == '__main__':
    main()
