# Cycle 2 systemd RCA

Status: patched

## Symptom

On Ubuntu, `opr service start` can throw a raw Node child-process error:

```text
Failed to start openprovider-proxy.service: Unit openprovider-proxy.service not found.
```

## Hypotheses

- H1: `opr service start` is being run before `opr service install`, so no user unit exists.
- H2: The unit exists but systemd cannot see it because `daemon-reload` was not run.
- H3: The user systemd bus is unavailable in the shell, causing a misleading unit-not-found error.

## Current Evidence

- `installSystemd()` writes `~/.config/systemd/user/openprovider-proxy.service`, then runs `systemctl --user daemon-reload`, `enable`, and `restart`.
- `startSystemd()` directly runs `systemctl --user start openprovider-proxy`.
- `serviceStatusSummary()` already treats a missing unit file as `not installed`.

## RCA

- H1 accepted. The failing command is the `startSystemd()` direct shell-out, while `installSystemd()` is the path that creates the user unit.
- H2 rejected for normal installs. `installSystemd()` already writes the unit before `daemon-reload`, then enables and restarts it.
- H3 not the leading cause for this stack. The Linux platform path already tries to repair `XDG_RUNTIME_DIR` before probing systemd; a missing user bus usually fails before a clean `Unit ... not found` response.

## Fix

Make Linux `service start` perform a local unit-file preflight and print a handled openprovider error telling the user to run `opr service install` first. Preserve installed-unit behavior and do not add the preflight to `installSystemd()`, because install must be able to create the unit.

## Test Plan

- Assert `startSystemd()` checks `existsSync(unitPath())` before `systemctl --user start`.
- Assert the handled error mentions `opr service install` and exits without relying on a thrown child-process stack.
- Assert `installSystemd()` still writes the unit before `daemon-reload`, `enable`, and `restart`.
