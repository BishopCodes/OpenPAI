# ═══════════════════════════════════════════════════════════
#  OpenPAI — Local Development Container
#
#  Build:  docker build -t openpai .
#  Run:    docker run -it --env-file .env.local openpai
#
#  Pass API keys via --env-file or -e flags:
#    docker run -it -e ANTHROPIC_API_KEY=sk-... openpai
#    docker run -it --env-file .env.local openpai
#
#  Override to serve mode:
#    docker run -p 4099:4099 --env-file .env.local openpai serve --hostname 0.0.0.0 --port 4099
# ═══════════════════════════════════════════════════════════
FROM --platform=linux/amd64 fedora:latest

# ─── System dependencies ──────────────────────────────────
RUN dnf install -y \
      git \
      curl \
      unzip \
      findutils \
      jq \
      ca-certificates \
      tar \
      gzip \
    && dnf clean all

# ─── Install Bun ──────────────────────────────────────────
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# ─── Install OpenCode ─────────────────────────────────────
RUN curl -fsSL https://opencode.ai/install | bash
ENV PATH="/root/.opencode/bin:/root/.local/bin:${PATH}"

# ─── Copy repo and run installer ──────────────────────────
COPY . /tmp/openpai-src
RUN cd /tmp/openpai-src && bash install.sh

# ─── Verify installation ─────────────────────────────────
RUN test -d /root/.config/openpai/.opencode \
    && test -f /root/.config/openpai/opencode.json \
    && test -f /root/.config/openpai/AGENTS.md \
    && echo "OpenPAI installation verified"

# ─── Cleanup build source ────────────────────────────────
RUN rm -rf /tmp/openpai-src

# ─── Working directory = OpenPAI config ───────────────────
WORKDIR /root/.config/openpai

# ─── Expose serve mode port (optional) ───────────────────
EXPOSE 4099

# ─── Default: interactive TUI mode ───────────────────────
ENTRYPOINT ["opencode"]
