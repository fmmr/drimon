// Committed placeholder — actual git commit hash is injected locally by gen_version.sh
// or the post-commit hook. This file is `git update-index --skip-worktree`'d so local
// updates never enter git history. If you see FIRMWARE_VERSION == "template" on the
// running firmware, gen_version.sh has never been run in this clone.
#ifndef FIRMWARE_VERSION
#define FIRMWARE_VERSION "template"
#endif
