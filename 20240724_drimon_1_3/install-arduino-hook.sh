#!/usr/bin/env bash
# install-arduino-hook.sh — installs the pre-build hook that runs ./gen_version.sh on every compile.
#
# Why: without this hook, gen_version.sh only runs on git commit (via hooks/post-commit). That leaves
# a gap — if you commit, hit a compile error, fix it, and re-flash, the fix isn't committed but the
# binary still gets the old commit hash. The pre-build hook closes the gap by running gen_version.sh
# before EVERY compile; gen_version.sh writes an #error into version.h when the sketch folder is
# dirty, aborting the compile.
#
# Where: Arduino IDE / arduino-cli looks for `platform.local.txt` in the platform install directory,
# not the sketch folder. So the hook line has to live under
# ~/Library/Arduino15/packages/esp32/hardware/esp32/<version>/platform.local.txt (macOS path).
# When you update the ESP32 core via Board Manager, a new version directory appears and the hook is
# gone — re-run this script to restore it. Idempotent: safe to run any number of times.
#
# Escape hatch during the compile: `ALLOW_DIRTY_FLASH=1` in the environment.

set -euo pipefail

# Same one-liner as documented in the doc / gen_version.sh header comment.
HOOK='recipe.hooks.sketch.prebuild.1.pattern=/bin/sh -c "if [ -x '"'"'{build.source.path}/gen_version.sh'"'"' ]; then '"'"'{build.source.path}/gen_version.sh'"'"'; fi"'

# Common per-OS locations for the Arduino15 config folder. Adjust if yours is elsewhere.
CANDIDATES=(
    "$HOME/Library/Arduino15/packages/esp32/hardware/esp32"           # macOS
    "$HOME/.arduino15/packages/esp32/hardware/esp32"                  # Linux
    "$HOME/AppData/Local/Arduino15/packages/esp32/hardware/esp32"     # Windows (git-bash / WSL)
)

FOUND_ANY=0
INSTALLED=0
SKIPPED=0

for base in "${CANDIDATES[@]}"; do
    [ -d "$base" ] || continue
    FOUND_ANY=1
    # One subdirectory per installed platform version.
    for dir in "$base"/*/; do
        [ -d "$dir" ] || continue
        f="${dir}platform.local.txt"
        if [ -f "$f" ] && grep -qF "gen_version.sh" "$f"; then
            echo "  already installed: $f"
            SKIPPED=$((SKIPPED + 1))
        else
            # Append a trailing newline first if the file exists and doesn't end with one, so we don't
            # merge the hook onto the last existing line.
            if [ -f "$f" ] && [ -s "$f" ] && [ "$(tail -c1 "$f" | wc -l | tr -d ' ')" -eq 0 ]; then
                printf '\n' >> "$f"
            fi
            printf '%s\n' "$HOOK" >> "$f"
            echo "  installed:         $f"
            INSTALLED=$((INSTALLED + 1))
        fi
    done
done

if [ "$FOUND_ANY" -eq 0 ]; then
    echo "install-arduino-hook.sh: no ESP32 platform install found under any known location." >&2
    echo "Checked:" >&2
    printf '  %s\n' "${CANDIDATES[@]}" >&2
    exit 1
fi

echo
echo "Done: $INSTALLED installed, $SKIPPED already had the hook."
echo "Restart Arduino IDE for the change to take effect (arduino-cli picks it up immediately)."
