#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.file_path // empty')

if [[ "$FILE" =~ \.(ts|tsx)$ ]]; then
  HOOKS_DIR="$(cd "$(dirname "$0")" && pwd)"
  PROJECT_DIR="$(cd "$HOOKS_DIR/../.." && pwd)"
  cd "$PROJECT_DIR"
  pnpm eslint --fix "$FILE" 2>/dev/null || true
fi

exit 0
