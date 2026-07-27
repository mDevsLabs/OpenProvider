import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface IsolatedCodexHome {
  path: string;
  restore(): void;
}

export function installIsolatedCodexHome(prefix = "opr-codex-home-"): IsolatedCodexHome {
  const previousCodexHome = process.env.CODEX_HOME;
  const path = mkdtempSync(join(tmpdir(), prefix));
  writeFileSync(join(path, "config.toml"), 'model_catalog_json = "openprovider-catalog.json"\n', "utf8");
  process.env.CODEX_HOME = path;

  return {
    path,
    restore() {
      if (previousCodexHome === undefined) delete process.env.CODEX_HOME;
      else process.env.CODEX_HOME = previousCodexHome;
      rmSync(path, { recursive: true, force: true });
    },
  };
}
