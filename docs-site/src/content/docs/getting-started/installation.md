---
title: Installation
description: Install the OpenProvider (ocx) proxy, its prerequisites, and verify it runs.
---

OpenProvider installs two equivalent command names, `ocx` and `OpenProvider`. Both launch the same small
local HTTP server (built on Bun). Model requests go to the provider selected by routing; optional
vision and web-search sidecars can also use your ChatGPT login when a routed model needs them.

## Prerequisites

| Requirement | Why |
| --- | --- |
| **[Node](https://nodejs.org) ≥ 18** | `ocx` runs on the Bun runtime, but the runtime is bundled automatically on `npm install` — you do **not** need to install Bun yourself. |
| **[OpenAI Codex](https://openai.com/codex)** (CLI, App, or SDK) | The client OpenProvider sits in front of. OpenProvider writes to `$CODEX_HOME/config.toml` (default `~/.codex/config.toml`). |
| A provider account or API key | Anthropic, xAI, Kimi, Ollama Cloud, OpenRouter, an OpenAI-compatible endpoint, or your ChatGPT login. |

## Install

```bash
npm install -g @bitkyc08/OpenProvider
```

:::note[npm blocked the bun postinstall?]
Recent npm versions may block bun's postinstall script (`npm warn
install-scripts ... blocked because they are not covered by allowScripts`),
which leaves the bundled Bun runtime unprepared. Reinstall allowing bun's
script — and always include the package name (npm's abbreviated suggestion
omits it, which would reinstall the current directory instead):

```bash
npm install -g --allow-scripts=bun @bitkyc08/OpenProvider

# if the original install used sudo, keep using sudo:
sudo npm install -g --allow-scripts=bun @bitkyc08/OpenProvider
```
:::

Verify both command aliases are on your `PATH`:

```bash
ocx --version
OpenProvider --version
```

### Release channels

The stable `latest` channel already includes GPT-5.6 Sol/Terra/Luna catalog support for ChatGPT,
OpenAI API-key, OpenRouter, and experimental Cursor routes. Upstream access is still account-gated;
the catalog entries do not grant access by themselves. Use the preview channel only to test
unreleased OpenProvider builds:

```bash
npm install -g @bitkyc08/OpenProvider@preview
ocx update --tag preview
```

## Run from source

To hack on OpenProvider itself:

```bash
git clone https://github.com/mDevsLabs/OpenProvider.git
cd OpenProvider
bun install
bun run dev:proxy   # starts the proxy API in dev mode (src/cli/index.ts start)
bun run dev:gui     # starts the dashboard dev server (another terminal)
```

`bun run dev` remains an alias for `bun run dev:proxy`. The proxy API exposes `/healthz`,
`/v1/responses`, and `/api/*`; `GET /` serves the packaged dashboard only after `bun run build:gui`
has produced `gui/dist`. While hacking on the dashboard, run the frontend separately with
`bun run dev:gui`.

## What gets created

OpenProvider state lives under `$OpenProvider_HOME` (default `~/.OpenProvider`). Codex integration files live
under `$CODEX_HOME` (default `~/.codex`).

| Path | Purpose |
| --- | --- |
| `$OpenProvider_HOME/config.json` | Your providers, default provider, port, and options. |
| `$OpenProvider_HOME/ocx.pid` | PID of the running proxy (single-instance guard). |
| `$OpenProvider_HOME/runtime-port.json` | The live PID, hostname, and port, including an automatically selected fallback port. |
| `$OpenProvider_HOME/auth.json` | Stored OAuth credentials (when you `ocx login`). |
| `$OpenProvider_HOME/catalog-backup*.json` | Codex model catalog backups made before OpenProvider edits it. |
| `$CODEX_HOME/config.toml` | On loopback, OpenProvider adds a marker-owned root `openai_base_url`; non-loopback binds use `model_provider = "OpenProvider"` plus `[model_providers.OpenProvider]` so Codex can send the API-auth header. |
| `$CODEX_HOME/OpenProvider.config.toml` | Fallback/reference profile written alongside the main Codex config. |
| `$CODEX_HOME/OpenProvider-catalog.json` | Synced native and routed model catalog used by Codex. |

:::note
OpenProvider never deletes your Codex config. Every injection is reversible — `ocx stop`, `ocx restore`,
or `ocx eject` strip exactly the lines OpenProvider added and restore native Codex.
:::

## Next

Continue to the [Quickstart](/getting-started/quickstart/) to configure your first provider,
or read [How It Works](/getting-started/how-it-works/) for the architecture.


