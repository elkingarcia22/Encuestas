#!/usr/bin/env bash
# Prepara el playground para el equipo de UX: herramientas + dependencias.
# El login de AWS ocurre al instalar dependencias (npm preinstall), no al abrir la app.
# Uso:
#   bash scripts/setup.sh          # instala Node/AWS CLI si faltan + npm install
#   bash scripts/aws-login.sh      # solo autenticar (lo corre npm en preinstall)
#   bash scripts/setup.sh --login  # equivalente a aws-login.sh

set -euo pipefail

CODEARTIFACT_DOMAIN="npm-repository-ubits"
CODEARTIFACT_OWNER="824404647578"
CODEARTIFACT_REPO="ubits-npm"
AWS_REGION="us-east-1"
NPM_SCOPE="@ubits"
CODEARTIFACT_REGISTRY="https://${CODEARTIFACT_DOMAIN}-${CODEARTIFACT_OWNER}.d.codeartifact.${AWS_REGION}.amazonaws.com/npm/${CODEARTIFACT_REPO}/"
CODEARTIFACT_AUTH_KEY="//${CODEARTIFACT_DOMAIN}-${CODEARTIFACT_OWNER}.d.codeartifact.${AWS_REGION}.amazonaws.com/npm/${CODEARTIFACT_REPO}/"

MODE="setup"
for arg in "$@"; do
  case "$arg" in
    --login) MODE="login" ;;
    -h|--help)
      echo "Uso: bash scripts/setup.sh [--login]"
      exit 0
      ;;
  esac
done

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
ok() { printf '  ✓ %s\n' "$*"; }
info() { printf '  → %s\n' "$*"; }
fail() {
  printf '\n\033[1mNo se pudo continuar\033[0m\n' >&2
  printf '%s\n' "$*" >&2
  exit 1
}

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

refresh_brew_path() {
  local brew_bin
  for brew_bin in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    if [[ -x "$brew_bin" ]]; then
      # shellcheck disable=SC2046
      eval "$("$brew_bin" shellenv)"
      return 0
    fi
  done
  return 1
}

ensure_homebrew() {
  if command -v brew >/dev/null 2>&1; then
    return 0
  fi
  if refresh_brew_path && command -v brew >/dev/null 2>&1; then
    return 0
  fi
  if [[ "$(uname -s)" != "Darwin" ]]; then
    return 1
  fi
  info "Instalando Homebrew (una sola vez)…"
  if ! NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"; then
    fail "Falta Homebrew y no se pudo instalar solo.
Ábrelo en https://brew.sh — puede pedir la contraseña de la Mac.
Luego vuelve a correr este comando."
  fi
  refresh_brew_path || true
  if ! command -v brew >/dev/null 2>&1; then
    fail "Homebrew se instaló pero no está en el PATH.
Cierra y abre la terminal (o Cursor) y vuelve a intentarlo."
  fi
  ok "Homebrew listo"
}

brew_install_once() {
  local formula="$1"
  local label="$2"
  ensure_homebrew || fail "Falta ${label}.
En Mac, instala Homebrew desde https://brew.sh y vuelve a correr este comando.
Si no usas Mac: instala ${label} con el instalador oficial y reintenta."
  info "Instalando ${label} (una sola vez)…"
  HOMEBREW_NO_AUTO_UPDATE=1 brew install "$formula"
  refresh_brew_path || true
}

ensure_node() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    ok "Node $(node --version) · npm $(npm --version)"
    return 0
  fi
  brew_install_once node "Node.js"
  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    fail "Falta Node.js.
Instálalo desde https://nodejs.org (versión LTS) y vuelve a correr este comando."
  fi
  ok "Node $(node --version) · npm $(npm --version)"
}

ensure_awscli() {
  if command -v aws >/dev/null 2>&1; then
    ok "AWS CLI $(aws --version 2>&1 | awk '{print $1}')"
    return 0
  fi
  brew_install_once awscli "AWS CLI"
  if ! command -v aws >/dev/null 2>&1; then
    fail "Falta AWS CLI (necesario para bajar la librería interna).
Instálalo desde:
https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

Después pide a ingeniería que configure tu acceso (una sola vez):

  aws configure sso"
  fi
  ok "AWS CLI $(aws --version 2>&1 | awk '{print $1}')"
}

aws_login() {
  info "Comprobando sesión de AWS…"
  if ! aws sts get-caller-identity --region "$AWS_REGION" >/dev/null 2>&1; then
    info "Hay que iniciar sesión. Se abrirá el navegador."
    if ! aws sso login; then
      fail "No se pudo iniciar sesión en AWS.
Si es la primera vez en esta Mac, pide a ingeniería que corra contigo:

  aws configure sso

Documentación interna: https://ubits-dev.atlassian.net/wiki/external/ZjE2MWI1YmNlMGZiNDcyMWJkY2RlMWQyYzQ1NGMxMjM"
    fi
  fi
  ok "Sesión de AWS activa"

  info "Conectando la librería interna (${NPM_SCOPE}/flux-ui)…"
  CODEARTIFACT_TOKEN="$(
    aws codeartifact get-authorization-token \
      --domain "$CODEARTIFACT_DOMAIN" \
      --domain-owner "$CODEARTIFACT_OWNER" \
      --region "$AWS_REGION" \
      --query authorizationToken \
      --output text
  )"
  # npm 11+ ya no acepta `always-auth`. El token en ~/.npmrc alcanza
  # para npm, npx y el MCP de Cursor.
  npm config set "${NPM_SCOPE}:registry" "$CODEARTIFACT_REGISTRY"
  npm config set "${CODEARTIFACT_AUTH_KEY}:_authToken" "$CODEARTIFACT_TOKEN"
  ok "Librería interna lista (el acceso dura unas 12 horas)"
}

bold "Playground UX — preparación"

ensure_node
ensure_awscli

if [[ "$MODE" == "login" ]]; then
  aws_login
  echo
  bold "Listo. Acceso a la librería interna configurado."
  exit 0
fi

info "Instalando dependencias…"
npm install
ok "Dependencias instaladas"

echo
bold "Listo. Para abrir la app:"
echo "  npm start"
echo
