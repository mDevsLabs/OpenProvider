---
title: CLI Reference
description: Every opr command and flag.
---

The OpenProvider CLI is `opr`. Run `opr help` (or `--help` / `-h`) for top-level usage.
Run `opr help <command>` for commands registered in the help table. Help and version commands are
read-only and do not start, stop, install, uninstall, or rewrite Codex/OpenProvider state.

## Setup & lifecycle

### `opr init`

Interactive setup wizard. Prompts for a provider (preset or custom), API key (literal or `${ENV}`),
default model, and proxy port; saves `~/.OpenProvider/config.json`; optionally injects the proxy into
`$CODEX_HOME/config.toml` (default `~/.codex/config.toml`); and optionally installs the Codex
autostart shim.

### `opr start [--port <port>]`

Start the proxy server (preferred port `10100`). If that port is occupied, OpenProvider selects and
records another available port. It writes PID/runtime-port state and refuses to start a second live
instance. On start it syncs each provider's models into Codex's catalog. On shutdown it restores
native Codex — unless it was launched as a managed service (`OCX_SERVICE=1`).

```bash
opr start
opr start --port 8080
```

### `opr stop`

Stop the running proxy (by PID), remove the PID file, and restore native Codex. If a managed
background service is installed, `opr stop` also stops it first (so it won't respawn the proxy).
The same action is available from the web dashboard's **Stop** button (`POST /api/stop`).

### `opr restore` &nbsp;·&nbsp; `opr eject`

Restore native Codex **without** stopping the proxy — strips the injected config lines and routed
catalog entries so plain `codex` works natively again. `eject` is an alias of `restore`.

Pass `back` to either spelling to re-point plain `codex` at an already-running proxy without changing
the proxy lifecycle:

```bash
opr restore back
opr eject back
```

### `opr recover-history --legacy-openai`

Explicit recovery for older development builds that remapped Codex App history before reversible
backup support existed. Close Codex first if its history database is locked.

### `opr restart`

Run `stop` followed by `ensure`: stop the proxy/service, restore native Codex, start the proxy in the
background, and sync the live port back into Codex.

### `opr ensure`

Idempotently ensure a background proxy is running, then sync its live model catalog. If
`codexAutoStart` is `false`, it prints that autostart is disabled and does nothing.

### `opr status [--json]`

Print a read-only diagnostic summary: proxy PID, `/healthz` reachability, dashboard URL,
config path, default provider, Codex autostart setting, service state, shim state, and the redacted
effective Codex home. Only the explicit, high-confidence Windows Orca runtime-home signature adds an
actionable App-home mismatch warning; it never changes `CODEX_HOME` automatically.

Human output also includes an **OAuth health** block after the OAuth logins summary: `OAuth health:
ok` when every known account is healthy, or `OAuth health: warning` with one redacted line per
non-healthy account (provider, masked account id, status such as reauthentication required / rate or
quota limited / refresh conflict) plus an optional `Action:` hint. Account ids are redacted; tokens
and emails are never printed. The `--json` contract does not currently include this health block.

Use `--json` for a machine-readable, read-only diagnostics contract:

```bash
opr status
opr status --json
```

Abbreviated example shape:

```json
{
  "schemaVersion": 1,
  "proxy": {
    "running": false,
    "pid": null,
    "health": {
      "ok": false,
      "url": "http://127.0.0.1:10100/healthz",
      "message": "unreachable"
    }
  },
  "dashboard": {
    "url": "http://localhost:10100/"
  },
  "paths": {
    "config": "/Users/example/.OpenProvider/config.json",
    "pid": "/Users/example/.OpenProvider/opr.pid",
    "runtime": "/path/to/bun"
  },
  "runtime": {
    "source": "bundled"
  },
  "codexHome": {
    "effectiveCodexHome": "C:\\Users\\[USER]\\.codex",
    "appCodexHome": "C:\\Users\\[USER]\\.codex",
    "mismatch": false,
    "warning": null,
    "action": null
  },
  "codexAutostart": true,
  "defaultProvider": "openai",
  "service": {
    "summary": "not installed (logs: /Users/example/.OpenProvider/service.log)"
  },
  "codexShim": {
    "summary": "Codex autostart shim: not installed"
  }
}
```

The real object also includes `listen` (port, hostname, runtime/config source), config load
diagnostics, and bundled Codex plugin diagnostics. The JSON schema is additive-only: future versions
may add fields, but existing fields should stay stable. It intentionally excludes API keys, OAuth
tokens, authorization headers, request content, emails, and account identities.

### `opr health [--json]`

Identity-check the live proxy. Human output reports PID/port; `--json` emits `{ok, pid, port}`. The
command exits 0 only when healthy and 1 otherwise, making it suitable for service probes.

### `opr uninstall` &nbsp;·&nbsp; `opr remove`

Stop the service and proxy, remove the service and Codex shim, restore native Codex, then remove
OpenProvider local config only if all restore steps succeeded. `remove` is an alias of `uninstall`.

## Models & Codex

### `opr sync`

Fetch the live model list from every configured provider and re-inject the merged catalog into Codex.
Run it after adding a provider or to refresh available models.

### `opr sync-cache`

Invalidate Codex's local model picker cache so it is rebuilt from the active OpenProvider catalog.

### `opr v2 [subcommand]`

Manage the Codex `multi_agent_v2` feature flag and the 3-state multi-agent surface mode.

| Subcommand | Action |
| --- | --- |
| `status` (default) | Report the current v2 flag, multi-agent mode, and thread concurrency. |
| `on` | Enable the `multi_agent_v2` feature in `$CODEX_HOME/config.toml` and resync the catalog. |
| `off` | Disable the `multi_agent_v2` feature and resync. |
| `mode v1` | Force ALL models to v1, disable native v2, and preserve the thread limit under `[agents] max_threads`. |
| `mode default` | Respect upstream model pins (sol/terra=v2, luna=v1, rest=codex flag). Install default. |
| `mode v2` | Force ALL models to v2, enable native v2, and migrate the same thread limit to the v2 key. |
| `threads <n>` | Set the active v1/v2 thread limit (integer >= 1). |

```bash
opr v2 status
opr v2 mode v1
opr v2 mode default
opr v2 on
opr v2 threads 16
```

The `mode` subcommand writes `multiAgentMode` to the OpenProvider config and resyncs the Codex catalog.
`mode v1`/`mode v2` and `on`/`off` move the current numeric thread limit between the valid v1/v2
Codex keys while flipping the native feature through `codex features enable|disable`. A failed
transition restores the original `config.toml`.
Changes apply to new Codex sessions; running sessions keep their pinned surface.

### `opr models [--provider <name>] [--json]`

List the models statically seeded in configured providers. `--provider` filters one configured
provider and `--json` returns model metadata plus a reminder that `liveModels` may add runtime-only
entries. This command does not fetch live catalogs; use `opr sync` or the dashboard for that.

### `opr provider <subcommand>`

Non-interactive provider management. Registry entries are seeded by name; a custom name requires
both `--adapter` and `--base-url`.

| Subcommand | Supported flags | Action |
| --- | --- | --- |
| `list` | `--json` | List configured providers and the remaining registry entries. |
| `add <name>` | `--adapter <adapter>`, `--base-url <url>`, `--api-key <key>`, `--default-model <model>`, `--set-default`, `--force`, `--json`, `--sync` | Add a registry/custom provider. `--force` overwrites; `--sync` refreshes a running proxy in human-output mode. |
| `show <name>` | `--json` | Show config with API keys masked. |
| `remove <name>` | `--json` | Remove a non-default provider; the last provider cannot be removed. |
| `set-default <name>` | `--json` | Select an existing provider as the default. |

```bash
opr provider list --json
opr provider add anthropic --api-key sk-ant-... --set-default --sync
opr provider add local-dev --adapter openai-chat --base-url http://localhost:11434/v1
opr provider show anthropic --json
opr models --provider anthropic --json
```

### `opr account <subcommand>`

List and switch provider accounts and API-key pools through the running proxy. The shipped help
surface is:

```text
Usage: opr account <list|current|use|refresh|auto-switch|remove|add-key> ...

List and switch provider accounts and API-key pools (GUI parity).

list [provider]     Codex account pool, OAuth accounts and API keys (identifiers shown masked as the API returns them).
current <provider>  Show the active account or key.
use <provider> <id> Switch the active credential; 'main' selects the Codex App login.
refresh <provider>  Force-refresh Codex or provider quota reports.
auto-switch <provider> <on|off|status|threshold N>  Control the Codex pool threshold.
remove <provider> <id> --yes  Remove a stored account or key after an existence check.
add-key <provider> [--label <label>]  Add a key read only from piped stdin.
Codex pool switches apply to new sessions; running threads keep their account.
```

All subcommands require the proxy to be running; the CLI auto-resolves its recorded runtime port.
Successful operations exit 0. Invalid usage, an unknown provider or account/key id, an unreachable
proxy, or an API failure exits 1. Credential fields are displayed exactly as the management API
returns them (including its masking); raw API keys and OAuth tokens are never returned. Display
conveniences are synthesized client-side, same as the dashboard: `main` is the CLI alias for the
Codex App login in the `openai` account pool, OAuth accounts without an email appear as
`Account N`, and the plan/label column falls back across plan, masked email, label, and masked key.

`--json` account rows use this common shape (optional fields are omitted when unavailable):

```json
{
  "provider": "openai",
  "type": "codex | oauth | api-key",
  "id": "__main__",
  "label": "plus",
  "email": "m***@example.com",
  "plan": "plus",
  "masked": "sk-ab****wxyz",
  "active": true,
  "needsReauth": false,
  "quota": null
}
```

#### `opr account list [provider] [--json] [--all]`

Without a provider, lists the Codex pool, OAuth accounts, and configured API-key pools. Empty
providers are skipped unless `--all` is present. With a provider, lists only that credential family.
Human output uses `PROVIDER TYPE ID PLAN/LABEL STATUS`; a manually chosen Codex row is marked `selected`.
When a stored Kiro account exists, the output notes that Kiro has one login slot and that signing in
again replaces the current account. An empty result is still success. `--json` returns:

```text
{ accounts: AccountRow[], notes: string[] }
```

#### `opr account current <provider> [--json]`

Shows the active account or key. A Codex pool with no manual pin reports automatic lowest-usage
selection; another family with no active credential reports that state and still exits 0. `--json`
returns:

```text
{ provider, type, activeId: string | null, autoSwitchThreshold?: number, account: AccountRow | null }
```

#### `opr account use <provider> <account-or-key-id|main> [--json]`

Selects an existing Codex account, OAuth account, or API key. For `openai`, `main` selects the Codex
App login. Codex selections apply only to **new sessions**; existing threads keep their account, and
an enabled auto-switch threshold may later override the manual pin. Unknown providers or ids exit 1.
`--json` returns:

```text
{ ok: true, provider, type, activeId }
```

#### `opr account refresh <provider> [--json]`

For the Codex pool, use `opr account refresh openai [--json]`. It force-refreshes account quotas and
prints available weekly/monthly percentages and reset times; missing quota data is reported as
unknown, not 0%. Its JSON envelope is `{ accounts: AccountRow[] }`, with `quota` on each Codex row.

For OAuth and API-key providers, this force-refreshes the provider quota-report endpoint; it is not a
token re-login or a plain account-list re-read. `--json` returns
`{ provider, report: ProviderQuotaReport | null }`. A provider with no supported quota report prints
`no quota report available for <provider>` and exits 0. Unknown providers and management-API
failures exit 1; an upstream quota probe that fails or times out degrades to a null or stale
report instead (exit 0), matching the dashboard's quota bars.

#### `opr account auto-switch <provider> <on|off|status|threshold <0-100>> [--json]`

Controls only the `openai` Codex account pool. `on` sets 80%, `off` sets 0%, `status` reads the current
value, and `threshold <n>` accepts an integer from 0 through 100. Other providers and invalid values
exit 1. `--json` returns:

```text
{ provider, autoSwitchThreshold: number, enabled: boolean }
```

#### `opr account remove <provider> <id|main> --yes [--json]`

This guarded, non-interactive deletion requires `--yes`. Before deleting, it verifies that the id
exists; a missing id exits 1 without sending DELETE. The main Codex App login cannot be removed, so
`remove openai main --yes` is refused. After deletion, the family is read again: removing the pinned
Codex account clears the pin and returns to automatic selection; OAuth promotes the first remaining
account or reports none; API-key pools promote the first remaining key or report none. `--json`
success and failure shapes are:

```text
{ ok: true, provider, id, removedActive: boolean, promotedActiveId: string | null }
{ error: string } // stderr, exit 1
```

#### `opr account add-key <provider> [--label <label>] [--json]`

Adds and activates a key for an API-key provider. The key is read only from non-TTY piped/redirected
stdin; interactive TTY input, empty input, OAuth/Codex providers, and API failures exit 1. The key is
never echoed, including when it appears inside a label. Prefer a secret manager or a here-string:

```bash
opr account add-key openrouter --label personal <<< "$OPENROUTER_API_KEY"
security find-generic-password -w openrouter | opr account add-key openrouter --json
```

`--json` returns `{ ok: true, id: string | null, label?: string }` and never includes the key.

## Authentication

### `opr login <provider>`

Start the provider's registered login flow. OAuth providers open a browser and store auto-refreshed
credentials under `~/.OpenProvider/`; API-key login providers open their key dashboard, prompt for the
key, validate it when possible, and save the resulting provider config. The command prints the
currently accepted OAuth and API-key provider ids when the name is missing or unknown.

Use the same command to **reauthenticate** after `opr status` / `opr doctor` reports
reauthentication required or a terminal refresh failure (or use Reauthenticate in the dashboard).
Codex pool accounts are not a public `opr login` provider — reauthenticate via the dashboard Codex
account pool (Reauthenticate) instead.

```bash
opr login xai
opr login anthropic
```

### `opr logout <provider>`

Remove the stored OAuth credential for a provider.

## Dashboard

### `opr gui`

Open the [web dashboard](/guides/web-dashboard/) at `http://localhost:<port>`, auto-starting
the proxy if it isn't running.

## Background service

### `opr service [subcommand]`

Run OpenProvider as a login-managed background service (macOS **launchd**, Linux **systemd user unit**,
Windows **Task Scheduler**) that auto-starts on login and auto-restarts on crash. Service runs set
`OCX_SERVICE=1` so a restart doesn't churn the Codex config.

| Subcommand | Action |
| --- | --- |
| none | Create/update and start the service. |
| `install` | Create and start the service. |
| `start` | Start an installed service. |
| `stop` | Stop the service and restore native Codex. |
| `status` | Report whether the service is running. |
| `uninstall` | Remove the service and restore native Codex. |
| `remove` | Alias of `uninstall`. |

```bash
opr service
opr service install
opr service status
opr service uninstall
```

### `opr codex-shim <subcommand>`

Wrap a script-based `codex` launcher on PATH with a lightweight autostart script. Real `codex.exe`
targets are left untouched to avoid breaking exact executable invocations.

If a completed external Codex update overwrites an installed shim, the next ordinary `opr` command
backs up the stable new launcher and restores the shim before dispatch. A launcher that is still
changing is left untouched and retried later. Repair failures warn without failing the requested
command; manual fallback: `opr codex-shim install`. Set `codexShimAutoRestore` to `false`, or set
`OpenProvider_CODEX_SHIM_AUTO_RESTORE=0` for a process-level opt-out.

| Subcommand | Action |
| --- | --- |
| `install` | Install the shim (or repair if stale). |
| `uninstall` | Remove the shim and restore the original Codex binary. |
| `remove` | Alias of `uninstall`. |
| `status` | Report shim state (installed / stale / missing). |

```bash
opr codex-shim install
opr codex-shim status
opr codex-shim uninstall
```

:::tip[Service vs Shim]
Use `opr service` for an always-on background proxy (recommended). Use `opr codex-shim` for
lightweight, on-demand startup without a daemon — the proxy starts only when `codex` is launched.
:::

## Diagnostics

### `opr doctor`

Run read-only environment and connectivity diagnostics: state paths and filesystem type, WSL dual
installs, proxy environment/config, ChatGPT reachability, Codex plugin and project-config warnings,
and pending history migration. The Codex app-home targeting section also detects the narrow Windows
Orca runtime-home mismatch and explains service migration when applicable. Paths shown by this new
diagnostic redact the OS username. Doctor prints repair hints but does not apply them.

The **OAuth reliability** section reports whether credential storage is writable, whether refresh
single-flight / lock files can be created under `OpenProvider_HOME`, non-healthy OAuth or Codex pool
accounts (redacted ids) with a recovery `Action:`, and a static OK that the Codex forward path does
not fabricate official-client metadata. Doctor never mutates credentials or applies repairs.

### `opr debug [provider|usage …]`

Read or change runtime debug overrides through the running proxy's management API.

```bash
opr debug provider on|off|status|reset
opr debug provider logs [-f|--follow]
opr debug usage on|off|status|reset
opr debug usage logs [-f|--follow]
```

With no scope, `opr debug` prints usage and, when the proxy is stopped, the next-start environment
defaults. Provider debug defaults from `OCX_DEBUG=1` (legacy `OCX_DEBUG_FRAMES=1` also works); usage
debug defaults from `OpenProvider_USAGE_DEBUG=1`.

## Updating

### `opr update`

Self-update OpenProvider from npm. Stable installs use `@latest`; preview installs stay on `@preview`
unless you pass `--tag latest|preview`. It detects a source checkout and tells you to
`git pull && bun install` instead, and is a no-op if you're already on the newest version for that
tag. A running proxy is stopped before files are replaced; an installed service is rebuilt and
started automatically, while a foreground installation prints `opr start` as the next step.

```bash
opr update
opr update --tag preview
```

New versions become available the moment the [Release workflow](https://github.com/mDevsLabs/OpenProvider/actions/workflows/release.yml)
publishes them to npm.

## Help

`opr help`, `opr --help`, `opr -h` — print top-level usage and examples.

`opr help <command>`, `opr <command> --help`, `opr <command> -h` — print command-specific usage for
commands registered in `src/cli/help.ts`. The full `provider`, `debug`, and `v2` subcommand contracts
are documented above.

Unknown commands remain errors even when a help flag is present, so scripts can rely on the exit
code instead of scraping text.

## Version

`opr --version`, `opr -v`, `opr version` — print a single script-friendly version line and exit.

## Internal commands

Two dispatch targets are intentionally omitted from normal help: `__refresh-version [preview]`
refreshes the update-notification cache in a detached process, and
`__gui-update-worker <job-id> [latest|preview] [restart]` runs a dashboard update job. They are
implementation details, not stable user-facing commands.


