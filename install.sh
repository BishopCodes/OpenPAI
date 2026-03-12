#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
#  OpenPAI Installer v1.0 — Bootstrap Script
#  Requirements: bash, curl
#  Bootstraps the installer by ensuring Bun + OpenCode are
#  available, then hands off to the TypeScript installer.
# ═══════════════════════════════════════════════════════════
set -euo pipefail

# ─── Colors ───────────────────────────────────────────────
BLUE='\033[38;2;59;130;246m'
LIGHT_BLUE='\033[38;2;147;197;253m'
NAVY='\033[38;2;30;58;138m'
GREEN='\033[38;2;34;197;94m'
YELLOW='\033[38;2;234;179;8m'
RED='\033[38;2;239;68;68m'
GRAY='\033[38;2;100;116;139m'
STEEL='\033[38;2;51;65;85m'
SILVER='\033[38;2;203;213;225m'
CYAN='\033[38;2;6;182;212m'
RESET='\033[0m'
BOLD='\033[1m'
ITALIC='\033[3m'

# ─── Helpers ──────────────────────────────────────────────
info()    { echo -e "  ${BLUE}ℹ${RESET} $1"; }
success() { echo -e "  ${GREEN}✓${RESET} $1"; }
warn()    { echo -e "  ${YELLOW}⚠${RESET} $1"; }
error()   { echo -e "  ${RED}✗${RESET} $1"; }

# ─── Banner ───────────────────────────────────────────────
echo ""
echo -e "${STEEL}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${RESET}"
echo ""
echo -e "               ${CYAN}Open${RESET}${NAVY}P${RESET}${BLUE}A${RESET}${LIGHT_BLUE}I${RESET} ${STEEL}|${RESET} ${GRAY}Open Personal AI Infrastructure${RESET}"
echo ""
echo -e "                  ${ITALIC}${LIGHT_BLUE}\"Your AI, your hardware, your rules.\"${RESET}"
echo ""
echo ""
echo -e "           ${CYAN}████████████████${RESET}${LIGHT_BLUE}████${RESET}   ${STEEL}│${RESET}  ${GRAY}\"${RESET}${LIGHT_BLUE}Free & Open${RESET}${GRAY}\"${RESET}"
echo -e "           ${CYAN}████████████████${RESET}${LIGHT_BLUE}████${RESET}   ${STEEL}│${RESET}  ${STEEL}────────────────────────${RESET}"
echo -e "           ${CYAN}████${RESET}        ${CYAN}████${RESET}${LIGHT_BLUE}████${RESET}   ${STEEL}│${RESET}  ${CYAN}⬢${RESET}  ${GRAY}OpenPAI${RESET}   ${SILVER}v1.0.0${RESET}"
echo -e "           ${CYAN}████${RESET}        ${CYAN}████${RESET}${LIGHT_BLUE}████${RESET}   ${STEEL}│${RESET}  ${CYAN}⚙${RESET}  ${GRAY}Algo${RESET}      ${SILVER}v3.7.0${RESET}"
echo -e "           ${CYAN}████████████████${RESET}${LIGHT_BLUE}████${RESET}   ${STEEL}│${RESET}  ${LIGHT_BLUE}✦${RESET}  ${GRAY}Installer${RESET} ${SILVER}v1.0${RESET}"
echo -e "           ${CYAN}████████████████${RESET}${LIGHT_BLUE}████${RESET}   ${STEEL}│${RESET}  ${STEEL}────────────────────────${RESET}"
echo -e "           ${CYAN}████${RESET}        ${BLUE}████${RESET}${LIGHT_BLUE}████${RESET}   ${STEEL}│${RESET}"
echo -e "           ${CYAN}████${RESET}        ${BLUE}████${RESET}${LIGHT_BLUE}████${RESET}   ${STEEL}│${RESET}  ${LIGHT_BLUE}✦  Free & Open Source${RESET}"
echo -e "           ${CYAN}████${RESET}        ${BLUE}████${RESET}${LIGHT_BLUE}████${RESET}   ${STEEL}│${RESET}  ${LIGHT_BLUE}✦  No API Keys Required${RESET}"
echo -e "           ${CYAN}████${RESET}        ${BLUE}████${RESET}${LIGHT_BLUE}████${RESET}   ${STEEL}│${RESET}  ${LIGHT_BLUE}✦  Local Voice (Kokoro)${RESET}"
echo ""
echo ""
echo -e "                    ${STEEL}→${RESET} ${CYAN}Powered by OpenCode${RESET}"
echo ""
echo -e "${STEEL}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${RESET}"
echo ""

# ─── Resolve Script Directory ─────────────────────────────
SOURCE="${BASH_SOURCE[0]}"
while [ -L "$SOURCE" ]; do
  DIR="$(cd "$(dirname "$SOURCE")" && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  [[ "$SOURCE" != /* ]] && SOURCE="$DIR/$SOURCE"
done
SCRIPT_DIR="$(cd "$(dirname "$SOURCE")" && pwd)"

# ─── OS Detection ─────────────────────────────────────────
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin) info "Platform: macOS ($ARCH)" ;;
  Linux)  info "Platform: Linux ($ARCH)" ;;
  *)      error "Unsupported platform: $OS"; exit 1 ;;
esac

# ─── Check curl ───────────────────────────────────────────
if ! command -v curl &>/dev/null; then
  error "curl is required but not found."
  echo "  Please install curl and try again."
  exit 1
fi
success "curl found"

# ─── Check/Install Git ───────────────────────────────────
if command -v git &>/dev/null; then
  success "Git found: $(git --version 2>&1 | head -1)"
else
  warn "Git not found — attempting to install..."
  if [[ "$OS" == "Darwin" ]]; then
    if command -v brew &>/dev/null; then
      brew install git 2>/dev/null || warn "Could not install Git via Homebrew"
    else
      info "Installing Xcode Command Line Tools (includes Git)..."
      xcode-select --install 2>/dev/null || true
      echo "  Please complete the Xcode installation and re-run this script."
      exit 1
    fi
  elif [[ "$OS" == "Linux" ]]; then
    if command -v apt-get &>/dev/null; then
      sudo apt-get install -y git 2>/dev/null || warn "Could not install Git"
    elif command -v yum &>/dev/null; then
      sudo yum install -y git 2>/dev/null || warn "Could not install Git"
    fi
  fi

  if command -v git &>/dev/null; then
    success "Git installed: $(git --version 2>&1 | head -1)"
  else
    warn "Git could not be installed automatically. Please install it manually."
  fi
fi

# ─── Check/Install Bun ───────────────────────────────────
if command -v bun &>/dev/null; then
  success "Bun found: v$(bun --version 2>/dev/null || echo 'unknown')"
else
  info "Installing Bun runtime..."
  curl -fsSL https://bun.sh/install | bash 2>/dev/null

  export PATH="$HOME/.bun/bin:$PATH"

  if command -v bun &>/dev/null; then
    success "Bun installed: v$(bun --version 2>/dev/null || echo 'unknown')"
  else
    error "Failed to install Bun. Please install manually: https://bun.sh"
    exit 1
  fi
fi

# ─── Check OpenCode ──────────────────────────────────────
if command -v opencode &>/dev/null; then
  success "OpenCode found: $(opencode --version 2>/dev/null || echo 'installed')"
else
  warn "OpenCode not found — installing..."
  curl -fsSL https://opencode.ai/install | bash 2>/dev/null

  export PATH="$HOME/.opencode/bin:$HOME/.local/bin:$PATH"

  if command -v opencode &>/dev/null; then
    success "OpenCode installed"
  else
    warn "OpenCode could not be auto-installed. Install manually: https://opencode.ai"
  fi
fi

# ─── Kokoro TTS (via kokoro-js, no Python needed) ────────
info "Kokoro TTS runs natively via kokoro-js (installed with VoiceServer deps)"

# ─── Setup OpenPAI Directory ─────────────────────────────
OPENPAI_DIR="${HOME}/.config/openpai"
info "Setting up OpenPAI at: ${OPENPAI_DIR}"

mkdir -p "$OPENPAI_DIR"

if [ -d "$SCRIPT_DIR/.opencode" ]; then
  cp -r "$SCRIPT_DIR/.opencode" "$OPENPAI_DIR/"
fi

for dir in PAI skills MEMORY lib VoiceServer; do
  if [ -d "$SCRIPT_DIR/$dir" ]; then
    cp -r "$SCRIPT_DIR/$dir" "$OPENPAI_DIR/"
  fi
done

for file in AGENTS.md opencode.jsonc openpai.json .env.example; do
  if [ -f "$SCRIPT_DIR/$file" ]; then
    cp "$SCRIPT_DIR/$file" "$OPENPAI_DIR/"
  fi
done

if [ ! -f "$OPENPAI_DIR/.env" ] && [ -f "$OPENPAI_DIR/.env.example" ]; then
  cp "$OPENPAI_DIR/.env.example" "$OPENPAI_DIR/.env"
fi

# ─── Install Plugin Dependencies ─────────────────────────
if [ -f "$OPENPAI_DIR/.opencode/package.json" ]; then
  info "Installing plugin dependencies..."
  (cd "$OPENPAI_DIR/.opencode" && bun install 2>/dev/null) || warn "Plugin dependency install failed"
fi

# ─── Install VoiceServer Dependencies ────────────────────
if [ -f "$OPENPAI_DIR/VoiceServer/package.json" ]; then
  info "Installing VoiceServer dependencies..."
  (cd "$OPENPAI_DIR/VoiceServer" && bun install 2>/dev/null) || warn "VoiceServer dependency install failed"
fi

# ─── Create Shell Alias ──────────────────────────────────
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
  SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
  SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ]; then
  if ! grep -q "alias openpai=" "$SHELL_RC" 2>/dev/null; then
    echo "" >> "$SHELL_RC"
    echo "# OpenPAI" >> "$SHELL_RC"
    echo "alias openpai='cd ${OPENPAI_DIR} && opencode'" >> "$SHELL_RC"
    echo "export PAI_DIR='${OPENPAI_DIR}'" >> "$SHELL_RC"
    success "Added 'openpai' alias to $SHELL_RC"
  else
    success "Alias 'openpai' already exists in $SHELL_RC"
  fi
fi

# ─── Done ─────────────────────────────────────────────────
echo ""
echo -e "${STEEL}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
success "${BOLD}OpenPAI installed successfully!${RESET}"
echo ""
info "To start: ${CYAN}openpai${RESET} (or restart your shell first)"
info "Config:   ${SILVER}${OPENPAI_DIR}/opencode.jsonc & openpai.json${RESET}"
info "Voice:    ${SILVER}${OPENPAI_DIR}/VoiceServer/start.sh${RESET}"
echo ""
echo -e "${STEEL}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
