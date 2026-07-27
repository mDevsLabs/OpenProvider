# 040 — Live smoke: Grok Build → OpenProvider models

Date: 2026-07-16  
Method: isolated `GROK_HOME=/tmp/grok-opr-smoke-*` with custom models pointing at `http://127.0.0.1:10100/v1`, `api_backend = "responses"`.

OpenProvider: `GET /healthz` → `openprovider 2.7.20` on port 10100.

## Commands
```bash
export GROK_HOME=/tmp/grok-opr-smoke-...
export GROK_SANDBOX=off
grok models
grok -p "Reply with exactly: OCX_SMOKE_OK" -m <model> \
  --output-format plain --max-turns 1 --no-plan --always-approve \
  --disallowed-tools "run_terminal_cmd,web_search,web_fetch,Agent"
```

## Results

| model id (OpenProvider) | Grok config name | backend | model reply text | process exit | notes |
|----------------------|------------------|---------|------------------|--------------|-------|
| (catalog) | — | — | — | 0 | `grok models` lists `opr-sol`, `opr-opus` as available |
| `gpt-5.6-sol` | `opr-sol` / `opr-luna` | responses | (empty) | fail | OpenProvider 400: `System messages are not allowed` (native OpenAI path) |
| `gpt-5.6-sol` | `opr-chat` | chat_completions | (empty) | fail | OpenProvider 404: `Unknown endpoint: POST /v1/chat/completions` |
| `anthropic/claude-opus-4-8` | `opr-opus` | responses | **`OCX_SMOKE_OK`** | 1 | Content success; Grok then errors on stream deserialize: missing `output_tokens_details` |
| `cursor/grok-4.5` | `opr-cursor` | responses | **`OCX_SMOKE_OK`** | 1 | Content success; Grok errors missing `input_tokens_details` on completed event |
| `opencode-go/glm-5.2` | `opr-glm` | responses | **`OCX_SMOKE_OK`** | 1 | Content success; same `output_tokens_details` deserialize error |

## Interpretation
1. **Wire path works** for Responses-backed routed models: Grok → local OpenProvider → upstream model, and assistant text is delivered to stdout.
2. **Native OpenAI models via OpenProvider currently reject Grok's system message** (`System messages are not allowed`) — so not all catalog entries work without OpenProvider or Grok-side adaptation.
3. **Default chat_completions path is confirmed broken** against OpenProvider (404).
4. **Exit-code friction**: even when text arrives, Grok Build hard-fails after the turn if OpenProvider's `response.completed.usage` omits fields Grok's Responses client requires (`output_tokens_details` / `input_tokens_details`). UX is "answer printed then Internal error".

## Verdict refinement after smoke
Still **PARTIAL / practically usable for some models**:
- Best today: routed providers that tolerate Grok's system prompt (observed: Anthropic, Cursor, OpenCode-Go).
- Not green yet: native `gpt-5.6-*` through OpenProvider with Grok's system messages.
- Not green: chat_completions backend.
- Residual product work if we want clean exit 0: OpenProvider Responses usage field parity for Grok client, and/or system-message policy for native models.

## Artifacts
- Smoke home: `/tmp/grok-opr-smoke-29424/config.toml`
- Logs: `/tmp/grok-smoke-opr-{opus,cursor,glm}.{out,err}`, `/tmp/grok-opr-chat-stderr.txt`
