import { backupConfigBeforeOpenAiTierMigration, saveConfig } from "../config";
import type { oprConfig } from "../types";
import { projectOpenAiTierMigration } from "./openai-tiers";

export interface OpenAiTierStartupDeps {
  project: typeof projectOpenAiTierMigration;
  backup: () => void;
  save: (config: oprConfig) => void;
}

const DEFAULT_DEPS: OpenAiTierStartupDeps = {
  project: projectOpenAiTierMigration,
  backup: backupConfigBeforeOpenAiTierMigration,
  save: saveConfig,
};

export function runOpenAiTierStartupMigration(
  config: oprConfig,
  deps: OpenAiTierStartupDeps = DEFAULT_DEPS,
): oprConfig {
  const projection = deps.project(config);
  if (!projection.changed) return projection.config;
  deps.backup();
  deps.save(projection.config);
  for (const warning of projection.warnings) console.warn(`[openai-provider-migration] ${warning}`);
  return projection.config;
}

