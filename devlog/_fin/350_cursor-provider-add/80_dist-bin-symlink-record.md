# 80 Dist Bin Symlink Record

## Context

The local `dist/bin` command aliases are required for the `opr` developer
workflow, but `dist/` is ignored by default. This record keeps the symlink setup
explicit without running `opr`, `codex`, `cursor`, or `cursor-agent`.

## Symlink Targets

- `dist/bin/opr` -> `ocx.mjs`
- `dist/bin/ocx.mjs` -> `../../bin/ocx.mjs`
- `dist/bin/openprovider` -> `ocx.mjs`

## Safety Boundary

- No command shim execution.
- No Cursor process execution.
- No write/delete/shell capability smoke through Cursor.
- Verification is filesystem metadata only: `readlink`, `test -L`, and git
  tracking state.
