#!/usr/bin/env bash
set -euo pipefail

echo "Running local secret pattern checks..."

patterns=(
  "GOOGLE_CLIENT_SECRET"
  "GOOGLE_CLIENT_ID"
  "SESSION_SECRET"
  "DATABASE_URL=.*@"
  "BEGIN RSA PRIVATE KEY"
  "BEGIN PRIVATE KEY"
  "PRIVATE_KEY"
  "AKIA[0-9A-Z]{16}"
)

found=0
for p in "${patterns[@]}"; do
  echo "Checking pattern: $p"
  if git grep -n --break --heading -I -e "$p" -- ':!node_modules' ; then
    found=1
  fi
done

if [ "$found" -ne 0 ]; then
  echo "Secret patterns found in tracked files. Fix before committing/pushing." >&2
  exit 1
fi

echo "No obvious secret patterns found in tracked files."
