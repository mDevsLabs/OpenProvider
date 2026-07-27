# Windows Service Lifecycle Fix Plan

## GPT Pro verdict

- Verdict: NEEDS FIX.
- Release blocker: Windows Task Scheduler delete/end does not guarantee the launched Bun/proxy child exits.
- Affected direct commands: `opr service stop` and `opr service uninstall` restore native Codex or delete the scheduled task without first killing the tracked proxy PID.

## Patch plan

1. Extract existing `killProxy` / process liveness helpers from `src/cli.ts` into `src/process-control.ts` so service code can use the same Windows `taskkill /T /F` behavior.
2. Add a service-side helper that reads the tracked PID, kills the proxy tree, and removes the PID file.
3. Change `opr service stop` to: stop service manager, kill tracked proxy, then restore native Codex.
4. Change `opr service uninstall` to: stop service manager, kill tracked proxy, delete service/task/script, then restore native Codex.
5. Change top-level `opr uninstall` to stop service manager, kill tracked proxy, then remove the service/task, preserving the same before-delete guarantee.
6. Add focused source-order regression tests for service stop/uninstall and top-level uninstall order, plus process-control coverage.

## Verification plan

- `bun test tests/service.test.ts tests/uninstall.test.ts`
- `bun x tsc --noEmit`
- Broader `bun test tests` if targeted checks pass.
