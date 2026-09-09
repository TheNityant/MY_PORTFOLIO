#!/usr/bin/env bash
set -euo pipefail

corepack enable
corepack prepare pnpm@10.4.1 --activate
pnpm install --frozen-lockfile
