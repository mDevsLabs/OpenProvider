import type { oprConfig } from "../../types";
import type { StartupInstallAction } from "../startup-action-control";

export interface ManagementApiDeps {
  toggleCodexMultiAgentV2?: (enabled: boolean) => void;
  refreshCodexCatalog?: () => Promise<void>;
  clearThreadAccountMap?: () => void;
  clearProviderQuotaCache?: () => void;
  primeCodexPoolQuotas?: (config: oprConfig, reason: string) => Promise<void> | void;
  runStartupInstallAction?: (action: StartupInstallAction) => Promise<{ message: string }>;
}


export interface ManagementContext {
  req: Request;
  url: URL;
  config: oprConfig;
  deps: ManagementApiDeps;
  refreshCodexCatalogBestEffort: () => Promise<void>;
  syncClaudeAgentDefsBestEffort: () => Promise<void>;
}

