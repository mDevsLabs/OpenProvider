---
title: Grok Build
description: Use any OpenProvider-routed model from xAI's Grok Build CLI — models are auto-registered into ~/.grok/config.toml while the proxy runs.
---

OpenProvider serves an OpenAI-compatible `POST /v1/chat/completions` (and `/v1/responses`) on its
local port, and Grok Build supports custom models against OpenAI-compatible servers. Starting
with this integration, OpenProvider registers its whole visible catalog into Grok Build
automatically — no manual config editing required.

## Auto-registration

When `~/.grok` exists, `opr start` (and `opr ensure` / `opr restart`) writes a managed block
into `~/.grok/config.toml`:

```toml
# >>> OpenProvider managed block — do not edit (removed by `opr stop`) >>>
[model.opr-gpt-5-6-sol]
model = "gpt-5.6-sol"
base_url = "http://127.0.0.1:10100/v1"
api_backend = "chat_completions"
api_key = "OpenProvider-loopback"
name = "opr gpt-5.6-sol"
# ... one [model.opr-*] table per visible model ...
# <<< OpenProvider managed block <<<
```

- **Additive:** your own config outside the fence is never touched. Before the first
  injection into a pre-existing file, a one-time backup is written to
  `~/.grok/config.toml.bak-OpenProvider`.
- **Idempotent:** every `opr start` (and `opr ensure` while autostart is enabled) replaces
  the fenced block with the current catalog.
- **Removed on teardown:** `opr stop`, `opr eject`, `opr uninstall`, and graceful
  non-service daemon shutdown strip the fenced block and restore your file
  byte-for-byte. Under a service manager, teardown goes through `opr stop`/`opr
  uninstall` (service-mode processes intentionally keep the block across respawns).
- **Conflict-safe:** aliases already defined by your own `[model.*]` tables are respected
  (OpenProvider suffixes its own entries); a damaged fence (begin marker without end marker)
  refuses any automatic change and asks for manual repair.

Then pick a model inside Grok Build:

```bash
grok models          # lists opr-* entries alongside native grok models
grok -m opr-anthropic-claude-opus-4-8 -p "hello"
# or in the TUI: /model opr-anthropic-claude-opus-4-8
```

## Authentication note

Grok Build requires a non-empty API key for custom models even on loopback. The injected
entries carry a placeholder (`OpenProvider-loopback`) — OpenProvider ignores admission keys for
loopback connections, so no real secret is involved.

**Auto-registration is loopback-only.** When OpenProvider binds a non-loopback host — including
the wildcards `0.0.0.0` and `::`, which expose every interface — requests need your real
admission token, and a managed block cannot carry one safely. Writing the literal token would
put your secret into `~/.grok/config.toml` and overwrite whatever you set there on the next
`opr start`/`ensure`/`restart`. So OpenProvider writes nothing at all in that case (and removes
any block left over from an earlier loopback bind), and you configure the models yourself
outside the managed markers, where nothing OpenProvider does can clobber them. See
[Manual recipe](#manual-recipe-without-auto-registration) for the exact table, and set both
`base_url` (a host that is actually reachable from where you run `grok`) and `api_key`
(your `OpenProvider_API_AUTH_TOKEN`).

Do not replace `api_key` with `env_key` here. With no `model_provider` set, an `env_key`
that fails to resolve does not stop the request — Grok falls through to your xAI session
token and sends it to whatever `base_url` the entry names, which for a LAN deployment is a
plaintext HTTP endpoint that is not xAI.

The injected per-model `api_key` sits first in Grok's credential chain for these models,
so turns against OpenProvider need no additional Grok login. Keep your normal `grok login` /
`XAI_API_KEY` setup for native grok models and any harness features that contact xAI
directly.

## Manual recipe (without auto-registration)

If you manage `~/.grok/config.toml` yourself — or OpenProvider is on a non-loopback bind — add
per-model tables with **direct fields**, outside the `# >>> OpenProvider managed block` markers:

```toml
[model.opr-opus]
model = "anthropic/claude-opus-4-8"
base_url = "http://127.0.0.1:10100/v1"
api_backend = "chat_completions"
api_key = "OpenProvider-loopback"
```

For a proxy reachable over the network, point `base_url` at the address `grok` can actually
dial and use your admission token:

```toml
[model.opr-opus]
model = "anthropic/claude-opus-4-8"
base_url = "http://192.168.1.10:10100/v1"   # the reachable host, not 127.0.0.1
api_backend = "chat_completions"
api_key = "your-OpenProvider_API_AUTH_TOKEN"
```

Do not rely on `[model_providers.<id>]` inheritance for the endpoint: as of Grok Build
0.2.101 the inherited `base_url` is not applied to inference routing (requests fall
through to the default xAI proxy and fail with 401). Direct per-model fields route
correctly.

Quote any alias containing a dot: bare `[model.grok-4.5]` is a three-segment key path, not
the id `grok-4.5`. Generated aliases avoid dots entirely for this reason.

## Known limitations

- **Responses backend and keep-alives:** OpenProvider emits a `response.heartbeat` keep-alive
  on `/v1/responses` streams during upstream silence. Grok Build's Responses decoder
  rejects unknown event types, so a manually configured `api_backend = "responses"` model
  can fail mid-turn on slow upstreams. The auto-registered entries pin
  `api_backend = "chat_completions"`, which never surfaces raw heartbeat frames.
- **Service-installed `opr restart`:** when OpenProvider runs under a service manager,
  `opr restart` currently stops the service and replaces it with an unmanaged process —
  service persistence (auto-restart, start-at-login) is lost until the next
  `opr service` setup, and if that unmanaged process dies the managed block can point at
  a dead proxy until the next `opr start`/`opr ensure` refreshes it.
- **Config read timing:** start OpenProvider first, then launch `grok` for the most
  predictable results. Grok Build watches `~/.grok/config.toml` and reloads when the
  `[model]` table actually changes (roughly a one-second debounce, compared by content), so
  a refreshed block reaches an open session without a restart. To confirm what Grok parsed,
  run `grok inspect`: it lists the config sources it loaded and warns about any field it
  rejected. It does not print the resolved model list. Note that a single TOML error
  invalidates the *entire* user config layer, which is why OpenProvider writes the file
  atomically — Grok never sees a half-written config.
- **Catalog updates:** the fenced block reflects the catalog at injection time. After
  adding providers or models, run `opr ensure` (or restart the proxy) to refresh it.


