#!/usr/bin/env bash
set -euo pipefail

patterns='BEGIN (RSA |EC |OPENSSH |)?PRIVATE KEY|(^|[^A-Z_])(PRIVATE_KEY|SEED_PHRASE|MNEMONIC)=[[:space:]]*[^$<[:space:]][^[:space:]]{15,}'

if rg --hidden --line-number --ignore-case "$patterns" \
  -g '!node_modules/**' \
  -g '!.tools/**' \
  -g '!contracts/lib/**' \
  -g '!.git/**' \
  -g '!package-lock.json' \
  -g '!scripts/secret-scan.sh'; then
  echo "Potential secret material detected." >&2
  exit 1
fi

echo "Secret scan passed for repository files."
