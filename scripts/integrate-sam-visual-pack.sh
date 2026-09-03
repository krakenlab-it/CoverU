#!/usr/bin/env bash
# Integrates Sam's CoverÜ visual pack into public/ using the drop-in layout
# documented in public/ASSETS.md. Safe to re-run.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC="$ROOT/public"
PACK_DIR="$ROOT/coveru-visual-system"
PACK_ZIP="$ROOT/coveru-visual-system.zip"

log() { printf 'integrate-sam-visual-pack: %s\n' "$*"; }
die() { printf 'integrate-sam-visual-pack: ERROR: %s\n' "$*" >&2; exit 1; }

resolve_source_root() {
  if [[ -d "$PACK_DIR" ]]; then
    printf '%s' "$PACK_DIR"
    return
  fi

  if [[ -f "$PACK_ZIP" ]]; then
    local tmp extracted
    tmp="$(mktemp -d)"
    unzip -q "$PACK_ZIP" -d "$tmp"
    if [[ -d "$tmp/coveru-visual-system" ]]; then
      extracted="$tmp/coveru-visual-system"
    elif [[ -d "$tmp/public" ]]; then
      extracted="$tmp"
    else
      extracted="$tmp"
    fi
    printf '%s' "$extracted"
    return
  fi

  die "Pack not found. Place Sam's pack at $PACK_DIR or $PACK_ZIP"
}

copy_tree() {
  local from="$1"
  local to="$2"
  mkdir -p "$to"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete-after "$from/" "$to/"
  else
    cp -a "$from/." "$to/"
  fi
}

map_file() {
  local src="$1"
  local dest="$2"
  if [[ -f "$src" ]]; then
    mkdir -p "$(dirname "$dest")"
    cp -f "$src" "$dest"
    log "mapped $(basename "$src") -> ${dest#$ROOT/}"
  fi
}

SOURCE="$(resolve_source_root)"
log "using source: $SOURCE"

# Preferred: pack already matches public/ layout
if [[ -d "$SOURCE/public" ]]; then
  copy_tree "$SOURCE/public" "$PUBLIC"
  log "copied public/ subtree"
else
  mkdir -p "$PUBLIC/brand" "$PUBLIC/illustrations"

  # Brand lockups / marks
  for name in wordmark mark lockup-horizontal lockup-stacked lockup-on-dark; do
    for ext in svg png; do
      map_file "$SOURCE/brand/${name}.${ext}" "$PUBLIC/brand/${name}.${ext}"
      map_file "$SOURCE/${name}.${ext}" "$PUBLIC/brand/${name}.${ext}"
    done
  done

  # Root favicons & social
  for file in favicon.ico icon-192.png icon-512.png apple-touch-icon.png og-coveru.png twitter-coveru.png; do
    map_file "$SOURCE/$file" "$PUBLIC/$file"
    map_file "$SOURCE/social/$file" "$PUBLIC/$file"
    map_file "$SOURCE/og/$file" "$PUBLIC/$file"
  done

  # State illustrations
  for name in empty-state error-state loading; do
    for ext in svg png; do
      map_file "$SOURCE/illustrations/${name}.${ext}" "$PUBLIC/illustrations/${name}.${ext}"
      map_file "$SOURCE/${name}.${ext}" "$PUBLIC/illustrations/${name}.${ext}"
    done
  done
fi

required=(
  "$PUBLIC/brand/wordmark.svg"
  "$PUBLIC/og-coveru.png"
  "$PUBLIC/illustrations/empty-state.svg"
)

missing=0
for file in "${required[@]}"; do
  if [[ ! -f "$file" ]]; then
    log "WARN: expected asset missing: ${file#$ROOT/}"
    missing=$((missing + 1))
  fi
done

if [[ "$missing" -gt 0 ]]; then
  die "$missing required asset(s) missing after copy — check pack layout vs public/ASSETS.md"
fi

log "integration complete"
