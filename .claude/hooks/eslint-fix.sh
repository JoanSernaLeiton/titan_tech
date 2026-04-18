#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ "$FILE" =~ \.(ts|tsx)$ ]]; then
  cd "$CLAUDE_PROJECT_DIR"
  pnpm eslint --fix "$FILE" 2>/dev/null || true
fi

exit 0
