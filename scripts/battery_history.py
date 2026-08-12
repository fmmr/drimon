#!/usr/bin/env python3
"""
Long-term battery voltage history — reads TECH_CHANNEL field 2 (battery V, written on every wake).
Works back to the very first firmware version because field 2 predates all status-string tokens.

Prints per-day BVmin / BVmax / BVmedian and also lists the N days with the lowest BVmin (useful
for comparing current levels to historical lows — the panic loops of 2026-08 dropped BV to ~3.84 V,
but May 2026 hit 3.53 V without any panics, so voltage alone doesn't explain panics).

Usage:
    ./battery_history.py                   # all available data (default: 8000 rows, 400 days)
    ./battery_history.py --results 4000    # smaller fetch
    ./battery_history.py --lowest 20       # show 20 worst days (default 15)
"""
import argparse
import json
import urllib.request
from collections import defaultdict

TECH_CHANNEL = 2584547
BV_FIELD = 'field2'


def fetch(days, results):
    url = f'https://api.thingspeak.com/channels/{TECH_CHANNEL}/feeds.json?results={results}&days={days}'
    with urllib.request.urlopen(url) as r:
        return json.load(r).get('feeds', [])


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[1])
    ap.add_argument('--days', type=int, default=400)
    ap.add_argument('--results', type=int, default=8000)
    ap.add_argument('--lowest', type=int, default=15, help='how many worst-BVmin days to list')
    args = ap.parse_args()

    feeds = fetch(args.days, args.results)
    if not feeds:
        print('no data')
        return
    print(f'{len(feeds)} entries, range: {feeds[0]["created_at"]} to {feeds[-1]["created_at"]}')
    print()

    per_day = defaultdict(list)
    for f in feeds:
        day = f['created_at'][:10]
        try:
            bv = float(f.get(BV_FIELD) or 'nan')
            if bv > 0:
                per_day[day].append(bv)
        except (TypeError, ValueError):
            pass

    print(f'{"Day":12s} {"BVmin":6s} {"BVmax":6s} {"BVmed":6s} n')
    print('-' * 45)
    for day in sorted(per_day.keys()):
        bvs = sorted(per_day[day])
        print(f'{day}   {bvs[0]:5.2f}  {bvs[-1]:5.2f}  {bvs[len(bvs)//2]:5.2f}  {len(bvs)}')

    print()
    print(f'{args.lowest} DAYS WITH LOWEST BVmin:')
    by_min = sorted([(min(v), d, len(v)) for d, v in per_day.items() if v])
    for bvmin, day, n in by_min[:args.lowest]:
        print(f'  {day}  BVmin={bvmin:.2f}  n={n}')


if __name__ == '__main__':
    main()
