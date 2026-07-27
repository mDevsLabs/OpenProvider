# 220 Codex App history visibility

## Goal

Investigate and fix the Codex App project-sidebar history visibility regression around `opr start` / `opr stop`, issue #11, and PR #13.

The fix must preserve user data by default, document the exact reproduction, explain the Codex App filtering semantics we can infer from `codex-rs` and local state, and avoid broad irreversible mutation of the user's real `~/.codex/state_5.sqlite`.

## User reproduction

The local `opr` binary is the development checkout:

- `/Users/jun/.local/bin/opr`
- `/Users/jun/Developer/new/700_projects/openprovider/dist/bin/opr`
- `/Users/jun/Developer/new/700_projects/openprovider/src/cli.ts`

Observed behavior:

1. `opr start` makes all Codex App project conversations disappear from the sidebar, including old OpenAI conversations and conversations created while openprovider was active.
2. `opr stop` makes old OpenAI-side conversations visible again.
3. Conversations created while openprovider was active remain invisible after `opr stop`.

## Current evidence

Local config evidence:

- `/Users/jun/.openprovider/config.json` currently has no `syncResumeHistory` key, so PR #13's default is "do not rewrite resume history".
- `~/.codex/config.toml` can be in native mode after `opr stop`, with no root `model_provider = "openprovider"`.

Local Codex state evidence from `~/.codex/state_5.sqlite`:

| Row set | model_provider | source | Count / effect |
| --- | --- | --- | --- |
| App/CLI resumable rows | `openai` | `cli`, `vscode` | Visible when native OpenAI provider is active |
| openprovider-created project rows | `openprovider` | `exec` | Not visible in Codex App project sidebar |
| openprovider `cli`/`vscode` rows | `openprovider` | `cli`, `vscode` | None found in current local state |

Working hypothesis:

- Codex App visibility is not controlled by provider alone.
- It likely filters by both `threads.model_provider` and a resumable/source classification.
- Old OpenAI rows disappear during `opr start` because the active/root provider becomes `openprovider`.
- openprovider-created rows stay hidden because they are mostly `source = 'exec'`, not `cli` or `vscode`.

## Current PR #13 behavior

PR #13 is already merged locally on `dev` for testing.

It changes the default from automatic resume-history rewriting to explicit opt-in:

- Default: leave history unchanged.
- `syncResumeHistory: true`: remap resumable OpenAI rows to openprovider during `opr start`.
- `opr stop`: remap openprovider rows back to OpenAI using the existing restoration path.

Limitation:

- #13 is a safety improvement, not the full #11 fix.
- It only addresses the provider-label side of the problem.
- It does not make openprovider-created `source = 'exec'` rows visible in Codex App.

## Plan

### P / A: document and audit

- Create this devlog file as the durable issue record.
- Correctly notify GitHub issue #11 and PR #13 that investigation is underway with the refined reproduction and current hypothesis.
- Run a read-only audit worker against the plan and the local code anchors before editing behavior.

### B: investigate and implement

- Inspect local `codex-rs` / Codex App sources or installed artifacts for thread filtering semantics around `model_provider`, `source`, `thread_source`, `cwd`, `archived`, and `has_user_event`.
- Re-check the local SQLite schema and representative rows without mutating the real DB.
- Design the smallest openprovider-side compatibility fix that can make old OpenAI rows and openprovider-created rows visible without unsafe broad mutation.
- Preserve reversibility. If metadata must be changed, record original values before changing them and restore only rows openprovider touched.

### C: verify

- Add unit tests against temporary SQLite fixtures only.
- Run targeted tests first, then full `bun test tests`.
- Run `bun run typecheck`.
- Verify no test or script mutates the real `~/.codex/state_5.sqlite`.

### D: report

- Summarize the root cause in plain Korean.
- List exact files changed.
- Include verification commands and results.
- Note remaining Codex App upstream limitation if any behavior can only be fully fixed in `codex-rs`.

## Likely files

Likely code files:

- `/Users/jun/Developer/new/700_projects/openprovider/src/codex-history-provider.ts`
- `/Users/jun/Developer/new/700_projects/openprovider/src/codex-inject.ts`
- `/Users/jun/Developer/new/700_projects/openprovider/src/types.ts`

Likely tests:

- `/Users/jun/Developer/new/700_projects/openprovider/tests/codex-history-provider.test.ts`
- `/Users/jun/Developer/new/700_projects/openprovider/tests/codex-inject.test.ts`

Likely docs:

- `/Users/jun/Developer/new/700_projects/openprovider/README.md`
- `/Users/jun/Developer/new/700_projects/openprovider/docs-site/src/content/docs/reference/configuration.md`
- `/Users/jun/Developer/new/700_projects/openprovider/docs-site/src/content/docs/ko/reference/configuration.md`
- `/Users/jun/Developer/new/700_projects/openprovider/docs-site/src/content/docs/zh/reference/configuration.md`

## Safety rules

- Do not mutate the user's real Codex DB while testing.
- Do not broaden `opr start` default behavior into silent history rewriting without an explicit config or user action.
- Do not let `opr stop` broadly rewrite all `openprovider` rows to `openai` if the implementation starts producing genuinely openprovider-owned visible rows.
- Prefer reversible metadata backup over pattern-based rollback.
