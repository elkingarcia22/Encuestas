#!/usr/bin/env bash
# Autenticación AWS + acceso a @ubits/flux-ui. Lo corre npm en preinstall.
# También se puede usar a mano si el token (~12 h) caducó:
#   bash scripts/aws-login.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec bash "$ROOT/scripts/setup.sh" --login
