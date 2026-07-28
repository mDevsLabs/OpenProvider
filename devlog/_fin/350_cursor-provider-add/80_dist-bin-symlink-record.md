# 80 Dist Bin Symlink Record

## Context

The local `dist/bin` command aliases are required for the `opr` developer
workflow, but `dist/` is ignored by default. This record keeps the symlink setup
explicit without running `opr`, `codex`, `cursor`, or `cursor-agent`.

## Symlink Targets

- `dist/bin/opr` -> `opr.mjs`
- `dist/bin/opr.mjs` -> `../../bin/opr.mjs`
- `dist/bin/openprovider` -> `opr.mjs`

## Safety Boundary

- No command shim execution.
- No Cursor process execution.
- No write/delete/shell capability smoke through Cursor.
- Verification is filesystem metadata only: `readlink`, `test -L`, and git
  tracking state.

