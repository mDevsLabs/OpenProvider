# 030 — Feasibility verdict: Grok Build → OpenProvider models

Date: 2026-07-16  
Question (corrected): **Can Grok Build use the models OpenProvider already exposes/routes?**

## Executive verdict

**PARTIAL — practically POSSIBLE with config, not zero-config.**

Grok Build already supports third-party / local OpenAI-compatible **and** OpenAI Responses backends. OpenProvider already runs a local proxy that advertises those models on `GET /v1/models` and serves inference on `POST /v1/responses` (and Claude-shaped `POST /v1/messages`).  

The catch: Grok’s **default** custom-model backend is Chat Completions (`/v1/chat/completions`), and OpenProvider **does not implement inbound** `/v1/chat/completions`. You must point Grok at OpenProvider with `api_backend = "responses"` (or use the messages path for Claude-style clients).

| Path | Verdict | Notes |
|------|---------|-------|
| A. Custom model → OpenProvider Responses | **POSSIBLE** | Best fit for Codex-native / routed models |
| B. Catalog base_url → OpenProvider `/v1` | **POSSIBLE (config)** | Pull model list from OpenProvider; still need Responses backend per model or inheritance |
| C. Default chat_completions → OpenProvider | **NO / broken** | OpenProvider returns JSON 404 for unknown `/v1/*` |
| D. messages backend → OpenProvider `/v1/messages` | **PARTIAL** | Works for Claude inbound surface; not the full multi-provider Responses catalog semantics |

## Why this is possible (Grok Build side)

Official custom models guide (`crates/codegen/xai-grok-pager/docs/user-guide/11-custom-models.md`):

1. Custom endpoints via `~/.grok/config.toml` `[model.<name>]` with `base_url`, `model`, credentials.
2. Explicit backends:
   - `chat_completions` → `/v1/chat/completions` (default)
   - `responses` → `/v1/responses`
   - `messages` → `/v1/messages`
3. First-class examples for local OpenAI-compatible servers (Ollama, `http://localhost:8080/v1`).
4. Catalog override: `GROK_MODELS_BASE_URL` / `[endpoints] models_base_url` fetching `{base}/models` with Bearer auth.

## Why OpenProvider can be the server (OpenProvider side)

Routes in `src/server/index.ts`:
- `GET /v1/models` — OpenAI list shape: bare native gpt ids + namespaced `provider/id` routed models
- `POST /v1/responses` — primary multi-provider translation data plane
- `POST /v1/messages` — Claude Code / Anthropic Messages inbound
- Unknown `/v1/*` → JSON 404 (so bare chat completions do not silently work)

Auth (`src/server/auth-cors.ts`):
- Loopback (`127.0.0.1` / localhost): data-plane API key **not required**
- Non-loopback: `@mdevs/openprovider_API_AUTH_TOKEN` or configured API keys via Bearer / `x-openprovider-api-key` / `x-api-key`

Live probe (this host, 2026-07-16):
```text
GET http://127.0.0.1:10100/healthz → openprovider 2.7.20
GET http://127.0.0.1:10100/v1/models → gpt-5.6-sol, gpt-5.5, anthropic/claude-opus-4-8,
  cursor/grok-4.5, xai/grok-4.5, opencode-go/glm-5.2, …
```

## Concrete config recipe (installed Grok Build user)

OpenProvider must already be running (`opr start`, default `http://127.0.0.1:10100`).

### Minimal single-model (Responses)

```toml
# ~/.grok/config.toml

[model.opr-sol]
model = "gpt-5.6-sol"
base_url = "http://127.0.0.1:10100/v1"
name = "OpenProvider GPT-5.6 Sol"
api_backend = "responses"
# loopback: api_key optional; non-loopback: set OpenProvider admission token
# api_key = "openprovider-admission-token"
context_window = 1050000

[models]
default = "opr-sol"
```

Then:
```bash
grok models
grok -p "ping" -m opr-sol
# or in TUI: /model opr-sol
```

### Multi-provider routed ids

OpenProvider model ids are often namespaced:

```toml
[model.opr-opus]
model = "anthropic/claude-opus-4-8"
base_url = "http://127.0.0.1:10100/v1"
name = "OpenProvider Claude Opus 4.8"
api_backend = "responses"

[model.opr-cursor-grok]
model = "cursor/grok-4.5"
base_url = "http://127.0.0.1:10100/v1"
name = "OpenProvider via Cursor Grok 4.5"
api_backend = "responses"
```

### Catalog-style (optional)

```bash
export GROK_MODELS_BASE_URL="http://127.0.0.1:10100/v1"
# if non-loopback / if Grok requires a key for models_base_url:
export XAI_API_KEY="openprovider-admission-token-or-any-required-bearer"
```

Or:

```toml
[endpoints]
models_base_url = "http://127.0.0.1:10100/v1"
```

**Residual:** when using catalog override, confirm each discovered model still uses a Responses-capable client path; if Grok assumes chat_completions for generic OpenAI lists, pin `api_backend = "responses"` on overrides for critical models.

## What is NOT automatic
1. Installing Grok Build does not auto-discover OpenProvider. User must edit config or env.
2. Default custom-model backend mismatch (`chat_completions` vs OpenProvider Responses-only inbound).
3. OpenProvider product focus is still **Codex → providers**; Grok → OpenProvider is a supported *protocol coincidence*, not a first-class “Grok Build integration” product surface.
4. Tool/streaming/reasoning field parity between Grok’s Responses client and OpenProvider’s Responses dialect is not fully proven end-to-end in this docs pass (no live smoke with a paid turn was required for the architecture verdict; residual for a later C-phase live smoke).

## Opposite direction (for clarity only)
OpenProvider can import `~/.grok/auth.json` and call `cli-chat-proxy` as an **xAI provider**. That is **OpenProvider using Grok account models**, not this question.

## Live smoke (2026-07-16)
See [040_live_smoke.md](./040_live_smoke.md).

- **PASS content**: `anthropic/claude-opus-4-8`, `cursor/grok-4.5`, `opencode-go/glm-5.2` returned `opr_SMOKE_OK` via Grok headless → OpenProvider Responses.
- **FAIL request**: native `gpt-5.6-sol` / `gpt-5.6-luna` → OpenProvider `System messages are not allowed`.
- **FAIL backend**: `chat_completions` → `404 Unknown endpoint: POST /v1/chat/completions`.
- **Friction**: Grok exits non-zero after successful text due to missing usage detail fields on `response.completed`.

## Residuals
1. Live smoke: `grok -p "hi" -m opr-sol` against running OpenProvider (not executed in this docs pass).
2. Whether Grok’s Responses request shape (tools, reasoning, store flags) always passes OpenProvider parser for every routed provider.
3. Catalog override auth: Grok docs say models_base_url forces API key auth — on loopback OpenProvider ignores admission keys, but Grok may still require a non-empty Bearer.
4. If product wants zero-friction UX, OpenProvider could add inbound `/v1/chat/completions` or a documented “Grok Build preset” — out of scope for this docs unit.

## Bottom line
**Yes, with configuration: point Grok Build at local OpenProvider using the Responses backend and OpenProvider model ids.**  
**No, not as a silent default, and not via Grok’s default Chat Completions custom-model path.**

## Evidence index
- Grok custom models: `/Users/jun/Developer/codex/180_grok-build/crates/codegen/xai-grok-pager/docs/user-guide/11-custom-models.md`
- OpenProvider routes: `/Users/jun/Developer/new/700_projects/openprovider/src/server/index.ts`
- Auth loopback: `/Users/jun/Developer/new/700_projects/openprovider/src/server/auth-cors.ts`
- Live: `http://127.0.0.1:10100/v1/models` (2026-07-16)
- Analysis: `/Users/jun/Developer/codex/180_grok-build/analysis/`


