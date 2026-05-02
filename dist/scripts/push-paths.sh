#!/usr/bin/env bash
set -euo pipefail

# Enable trace logging
set -x

attic=$1 atticArgs=${2:--j8} cache=$3 preBuildPathsFile=$4 pushFilter=$5

filterPaths() {
  local regex=$1
  local paths=$2

  for path in $paths; do
    echo "$path" | grep -vEe "$regex"
  done | xargs
}

pathsToPush=""
if preBuildPaths=$(sort "$preBuildPathsFile"); then
  if postBuildPaths=$("$(dirname "$0")"/list-nix-store.sh | sort); then
    pathsToPush=$(comm -13 <(echo "$preBuildPaths") <(echo "$postBuildPaths"))
  else
    echo "::error::Failed to list post-build store paths."
  fi
else
  printf "::error::Failed to find pre-build store paths. Expected cached paths in %s\n" "$preBuildPathsFile"
fi

if [[ -n $pushFilter ]]; then
  pathsToPush=$(filterPaths "$pushFilter" "$pathsToPush")
fi

echo "$pathsToPush" | "$attic" push "$atticArgs" "$cache" --stdin
