#!/usr/bin/env python3
"""
Recent-wake detailed dump — one row per merged wake, showing the fields most useful for tracing a
panic. Filter to specific reset reasons with --only (e.g. `--only PS` for wakes whose PREVIOUS
died in the post block, or `--only PANIC` for wakes booted from a code-crash reset).

Columns:
  ts       — UTC timestamp of the wake
  WR       — reset.wakeup cause (this wake's boot cause)
  WF       — WiFi cache outcome (HIT/FBK/MISS/FAIL)
  WT       — WiFi connect time (ms, this wake)
  TU       — measure time (ms, this wake)
  LR       — previous wake's 3 HTTP result codes (comma-sep, 200 = OK, negatives = errors)
  PR       — previous wake's per-channel retry counts
  LP       — previous wake's post-cycle time (ms)
  BV       — battery voltage (V)
  LS       — previous wake's serial + last stage (e.g. 27484.PS = wake #27484 died at post)

Usage:
    ./wake_details.py                              # last 100 wakes
    ./wake_details.py --n 500                      # more rows
    ./wake_details.py --days 3                     # only last 3 days
    ./wake_details.py --only PS                    # only rows where LS.stage starts with 'P'
    ./wake_details.py --only PANIC                 # only PANIC-reset boots
    ./wake_details.py --only PANIC --n 500
"""
import argparse
import json
import urllib.request

CHANNELS = [2568299, 2584548, 2584547]

RESET_REASON_NAMES = {
    '1': 'POWERON', '2': 'EXT', '3': 'SW', '4': 'PANIC', '5': 'INT_WDT',
    '6': 'TASK_WDT', '7': 'WDT', '8': 'DEEPSLEEP', '9': 'BROWNOUT', '10': 'SDIO'
}


def parse_status(s):
    out = {}
    for tok in s.split('_'):
        for prefix in ('WR-', 'WF-', 'WT-', 'TU-', 'LR-', 'PR-', 'LP-', 'BV-', 'LS-'):
            if tok.startswith(prefix):
                out[prefix.rstrip('-')] = tok[len(prefix):]
    return out


def fetch(channel, days, results):
    url = f'https://api.thingspeak.com/channels/{channel}/status.json?results={results}&days={days}'
    with urllib.request.urlopen(url) as r:
        return json.load(r).get('feeds', [])


def merge_across_channels(days, results):
    raw = []
    for ch in CHANNELS:
        for f in fetch(ch, days, results):
            if not f.get('status'):
                continue
            raw.append((f['created_at'], f['status']))
    raw.sort()
    seen = set()
    wakes = []
    for ts, status in raw:
        if status in seen:
            continue
        seen.add(status)
        wakes.append({'ts': ts, 'status': status})
    return wakes


def wr_label(wr):
    if not wr or '.' not in wr:
        return wr or '—'
    rr, wc = wr.split('.', 1)
    return RESET_REASON_NAMES.get(rr, rr)


def matches_filter(s, only):
    if not only:
        return True
    ls = s.get('LS', '')
    stage = ls.split('.', 1)[1] if '.' in ls else ls
    if only.upper() == stage.upper():
        return True
    wr = s.get('WR', '')
    rr = wr.split('.')[0] if wr else ''
    if only.upper() == RESET_REASON_NAMES.get(rr, '').upper():
        return True
    if only.startswith('P') and stage.startswith(only):
        return True
    return False


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[1])
    ap.add_argument('--n', type=int, default=100)
    ap.add_argument('--days', type=int, default=14)
    ap.add_argument('--results', type=int, default=8000)
    ap.add_argument('--only', help='filter by LS.stage or WR reset-reason name (e.g. PS, PANIC, INT_WDT)')
    args = ap.parse_args()

    wakes = merge_across_channels(args.days, args.results)
    wakes.reverse()   # newest first

    header = f'{"ts":21s} {"WR":10s} {"WF":5s} {"WT":6s} {"TU":6s} {"LR":22s} {"PR":8s} {"LP":6s} {"BV":5s} LS'
    print(header)
    print('-' * len(header))

    count = 0
    for w in wakes:
        s = parse_status(w['status'])
        if not matches_filter(s, args.only):
            continue
        print(f'{w["ts"]:21s} '
              f'{wr_label(s.get("WR","")):10s} '
              f'{s.get("WF","—"):5s} '
              f'{s.get("WT","—"):>6s} '
              f'{s.get("TU","—"):>6s} '
              f'{s.get("LR","—"):22s} '
              f'{s.get("PR","—"):8s} '
              f'{s.get("LP","—"):>6s} '
              f'{s.get("BV","—"):>5s} '
              f'{s.get("LS","—")}')
        count += 1
        if count >= args.n:
            break

    print(f'\n{count} rows shown (filter={args.only or "none"}, --n={args.n}, --days={args.days})')


if __name__ == '__main__':
    main()
