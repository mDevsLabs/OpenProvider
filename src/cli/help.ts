import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(new URL("../../package.json", import.meta.url)));

type HelpEntry = {
  usage: string;
  summary: string;
  details?: string[];
};

const helpEntries: Record<string, HelpEntry> = {
  init: { usage: "opr init", summary: "Interactive setup for providers and Codex config injection." },
  setup: { usage: "opr setup", summary: "Interactive setup for providers and Codex config injection (alias of init)." },
  start: { usage: "opr start [--port <port>]", summary: "Start the proxy server and sync models to Codex." },
  stop: { usage: "opr stop", summary: "Stop the proxy and restore native Codex config." },
  restore: {
    usage: "opr restore [back]",
    summary: "Restore native Codex config without stopping the proxy; \"restore back\" re-points codex at the running proxy.",
  },
  eject: {
    usage: "opr eject [back]",
    summary: "Restore native Codex config without stopping the proxy; \"eject back\" re-points codex at the running proxy.",
  },
  "recover-history": {
    usage: "opr recover-history --legacy-openai",
    summary: "Explicitly recover pre-backup syncResumeHistory rows.",
  },
  uninstall: {
    usage: "opr uninstall",
    summary: "Remove service/shim/config and restore native Codex.",
    details: ["Alias: opr remove"],
  },
  remove: {
    usage: "opr remove",
    summary: "Remove service/shim/config and restore native Codex.",
    details: ["Alias of: opr uninstall"],
  },
  service: {
    usage: "opr service [install|start|stop|status|uninstall|remove]",
    summary: "Run as a background service.",
    details: [
      "With no subcommand, installs/updates and starts the background service.",
      "Use \"opr service status\" to see diagnostics and log paths.",
    ],
  },
  "codex-shim": {
    usage: "opr codex-shim <install|status|uninstall|remove>",
    summary: "Auto-start the proxy when \"codex\" launches.",
    details: ["Use \"remove\" as an alias for \"uninstall\"."],
  },
  tray: {
    usage: "opr tray <install|start|stop|status|uninstall|remove> [--json] [--no-start]",
    summary: "Install and control the Windows status tray icon.",
    details: [
      "The tray starts at Windows login and provides one-click proxy controls.",
      "Tray start/stop controls the icon only; use its menu to start or stop the proxy.",
      "--no-start (install only) installs the tray without launching it immediately.",
    ],
  },
  ensure: { usage: "opr ensure", summary: "Ensure the proxy is running and Codex config/cache are current." },
  sync: { usage: "opr sync", summary: "Fetch provider models and inject them into Codex config." },
  "sync-cache": { usage: "opr sync-cache", summary: "Refresh Codex's model cache from the active catalog." },
  status: { usage: "opr status", summary: "Check proxy server status." },
  doctor: { usage: "opr doctor", summary: "Diagnose environment/network issues (paths, WSL /mnt, proxy env, ChatGPT reachability)." },
  debug: {
    usage: "opr debug <provider|usage|injection|claude> <on|off|status|reset|logs [-f]>",
    summary: "Show or toggle runtime provider, usage, injection, and Claude debug capture.",
    details: [
      "Provider: opr debug provider on | off | status | reset | logs [-f]",
      "Usage JSONL: opr debug usage on | off | status | reset | logs [-f]",
      "Env default: opr_DEBUG=1 (legacy opr_DEBUG_FRAMES still works)",
    ],
  },
  login: { usage: "opr login <provider>", summary: "OAuth or API-key login for a provider." },
  logout: { usage: "opr logout <provider>", summary: "Remove a stored provider login." },
  gui: { usage: "opr gui", summary: "Open the openprovider dashboard." },
  update: {
    usage: "opr update [--tag latest|preview]",
    summary: "Update openprovider. Preview installs stay on the preview tag unless overridden.",
  },
  provider: {
    usage: "opr provider <list|add|edit|test|remove|show|set-default|selected|quota|presets|account-mode>",
    summary: "Non-interactive provider management.",
    details: [
      "Subcommands: list, add/edit/test/remove/show, set-default, selected, quota, presets, account-mode",
      "Registry providers are auto-configured by name. Custom providers need --adapter and --base-url.",
      "Run \"opr provider --help\" for full usage and examples.",
    ],
  },
  account: {
    usage: "opr account <list|current|use|refresh|auto-switch|login|reauth|code|cancel|remove|add-key|reset-credits> ...",
    summary: "List and switch provider accounts and API-key pools (GUI parity).",
    details: [
      "list [provider]     Codex account pool, OAuth accounts and API keys (identifiers shown masked as the API returns them).",
      "current <provider>  Show the active account or key.",
      "use <provider> <id> Switch the active credential; 'main' selects the Codex App login.",
      "refresh <provider>  Force-refresh Codex or provider quota reports.",
      "auto-switch <provider> <on|off|status|threshold N>  Control the Codex pool threshold.",
      "remove <provider> <id> --yes  Remove a stored account or key after an existence check.",
      "add-key <provider> [--label <label>]  Add a key read only from piped stdin.",
      "login/reauth/code/cancel  Run browser or manual-code auth from a headless shell.",
      "reset-credits <id|main> [--consume --yes]  Inspect or consume Codex reset credits.",
      "Codex pool switches apply to new sessions; running threads keep their account.",
    ],
  },
  models: {
    usage: "opr models <list|live|add|edit|remove|enable|disable|provider|selected|context|shadow> ...",
    summary: "List models and manage custom (manually registered) models.",
    details: [
      "List available models from static config with no subcommand (liveModels may add more at runtime).",
      "add: register a model the provider catalog does not advertise yet.",
      "  --display-name <name>     Human label (no slashes).",
      "  --context-window <tokens> e.g. 200000.",
      "  --modalities text,image   Comma-separated (text|image|audio).",
      "remove: delete a custom model by UUID or <provider>/<modelId>.",
      "list-custom: show all custom models.",
      "Changes apply immediately to a running proxy (catalog sync).",
    ],
  },
  model: {
    usage: "opr model <subcommand>",
    summary: "Alias of opr models.",
  },
  combo: {
    usage: "opr combo <list|show|set|remove> ...",
    summary: "Manage combo failover and round-robin virtual models.",
    details: ["Alias hierarchy: opr route combo ...", "Use --targets provider/model[:weight],provider/model[:weight]."],
  },
  route: {
    usage: "opr route combo <list|show|set|remove> ...",
    summary: "Manage routing features; combo is currently the supported routing resource.",
  },
  agent: {
    usage: "opr agent <status|injection|effort|subagents|fallback|sidecar> ...",
    summary: "Manage headless multi-agent, roster, effort, injection, and sidecar settings.",
  },
  observe: {
    usage: "opr observe <logs|usage|storage|memory|debug|claude-inbound|injection> ...",
    summary: "Inspect proxy requests, usage, storage, memory, and debug data.",
  },
  logs: { usage: "opr logs [filters] [--follow] [--json|--jsonl]", summary: "Alias of opr observe logs." },
  usage: { usage: "opr usage [--range <7d|30d|all>] [--surface <all|codex|claude|grok>] [--json]", summary: "Alias of opr observe usage." },
  storage: { usage: "opr storage [--json]", summary: "Alias of opr observe storage." },
  memory: { usage: "opr memory [--json]", summary: "Alias of opr observe memory." },
  access: {
    usage: "opr access <key|endpoints|models|test> ...",
    summary: "Manage OpenProvider admission API keys and inspect external endpoints.",
  },
  "api-key": { usage: "opr api-key <list|create|remove> ...", summary: "Alias of opr access key." },
  grok: { usage: "opr grok <status|exclude|include|set|clear|apply> ...", summary: "Manage and apply the Grok Build model fence." },
  integration: { usage: "opr integration <claude|grok> ...", summary: "Manage supported client integrations." },
  system: {
    usage: "opr system <status|settings|startup|diagnostics|sync|update> ...",
    summary: "Manage headless runtime settings, startup, sync, diagnostics, and updates.",
  },
  config: {
    usage: "opr config <show|get|set|unset|validate|export|import> ...",
    summary: "Inspect and safely modify validated OpenProvider configuration.",
    details: ["Secrets are masked by show/get. Import requires --yes and validates before writing."],
  },
  claude: {
    usage: "opr claude [claude args...]",
    summary: "Launch Claude Code wired to the proxy (env injection + gateway model discovery).",
    details: [
      "Ensures the proxy is running, then execs \"claude\" with ANTHROPIC_BASE_URL/ANTHROPIC_AUTH_TOKEN,",
      "CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1 and model slots from config.claudeCode.",
      "Routed models appear in the native /model picker with stable claude-opus-4-8-2026MMDD slot aliases (Claude Code >= 2.1.129).",
      "Older versions: pick models via ANTHROPIC_MODEL or /model <id> directly (any string passes through).",
      "User-exported ANTHROPIC_* variables always take precedence.",
      "",
      "Claude Desktop profile:",
      "  opr claude desktop [apply]                         Save and apply the four-family profile",
      "  opr claude desktop show [--json]                   Show routes, families, and defaults",
      "  opr claude desktop move <route> <family> [--default]",
      "  opr claude desktop default <family> <route|none>",
      "  opr claude desktop export <path|->                 Export versioned JSON (\"-\" = stdout)",
      "  opr claude desktop import <path> [--apply]         Validate and import JSON",
      "Families: opus, fable, sonnet, haiku. New routes start in opus.",
      "\"none\" is valid only when that family is empty.",
      "Legacy apply flags remain supported: --static, --hybrid, --discovery-only.",
      "",
      "Claude Code settings: opr claude config <status|set> ...",
    ],
  },
  opencode: {
    usage: "opr opencode [opencode args...]",
    summary: "Launch opencode wired to the proxy (runtime provider config).",
    details: [
      "Ensures the proxy is running, then execs \"opencode\" with the generated \"provider.OpenProvider\"",
      "block injected through OpenCode's inline runtime layer (\"OPENCODE_CONFIG_CONTENT\"). Any",
      "existing inline config in the environment is preserved and only \"provider.OpenProvider\" is",
      "overwritten for this launch.",
      "Global/project opencode.json may be read to warn about an existing provider.OpenProvider",
      "override; on-disk files are never modified.",
      "Routed models appear in the model picker as OpenProvider/<provider>/<model>.",
      "Stop using \"opr opencode\" and plain \"opencode\" behaves exactly as before.",
    ],
  },
  restart: {
    usage: "opr restart",
    summary: "Stop the proxy and restart it (background). Equivalent to stop + ensure.",
  },
  v2: {
    usage: "opr v2 <status|on|off|mode <v1|default|v2>|threads <n>>",
    summary: "Toggle the Codex multi_agent_v2 feature (multi-agent surface).",
    details: [
      "status                Show flag, multi-agent mode, and thread limit.",
      "on | off              Enable/disable multi_agent_v2 (catalog resyncs).",
      "mode <v1|default|v2>  Force all models to one surface, or respect upstream pins.",
      "threads <n>           Set max_concurrent_threads_per_session (integer >= 1).",
      "Flips preserve the active thread limit while moving between v1/v2 modes.",
    ],
  },
  health: {
    usage: "opr health [--json]",
    summary: "Check proxy health. Exits 0 if healthy, 1 otherwise.",
    details: ["Use --json for structured output: {ok, pid, port}."],
  },
};

function packageVersion(): string {
  const raw = readFileSync(join(repoRoot, "package.json"), "utf8");
  const parsed = JSON.parse(raw) as { version?: unknown };
  return typeof parsed.version === "string" ? parsed.version : "unknown";
}

export function printVersion(): void {
  console.log("openprovider " + packageVersion());
}

export function printUsage(): void {
  console.log("\x1b[36m\x1b[1mOpenProvider (opr) \x1b[0m— Universal provider proxy for Codex\n" +
"Usage:\n" +
"  opr setup                   Interactive setup (alias: init)\n" +
"  opr start [--port <port>]   Start the proxy server (auto-syncs models to Codex)\n" +
"  opr stop                    Stop the proxy AND restore native Codex (plain codex works again)\n" +
"  opr restore                 Restore native Codex without stopping (alias: eject)\n" +
"  opr restore back            Re-point codex at the running proxy (undo restore)\n" +
"  opr recover-history --legacy-openai\n" +
"                               Explicitly recover pre-backup syncResumeHistory rows\n" +
"  opr uninstall               Remove service/shim/config and restore native Codex (alias: remove)\n" +
"  opr service [sub]           Run as a background service (default: install/update/start)\n" +
"  opr codex-shim <sub>        Auto-start proxy when \"codex\" launches (install|status|uninstall|remove)\n" +
"  opr tray <sub>              Windows status tray (install|start|stop|status|uninstall)\n" +
"  opr ensure                  Ensure the proxy is running and Codex config/cache are current\n" +
"  opr sync                    Fetch models from providers and inject into Codex config\n" +
"  opr sync-cache              Refresh Codex's model cache from the active catalog\n" +
"  opr status                  Check proxy server status\n" +
"  opr doctor                  Diagnose environment/network issues (WSL, proxy, ChatGPT reachability)\n" +
"  opr debug <scope>           provider/usage/injection/claude on|off|status|reset\n" +
"  opr login <provider>        OAuth or API-key provider login\n" +
"  opr logout <provider>       Remove a stored OAuth login\n" +
"  opr gui                     Open the OpenProvider dashboard\n" +
"  opr update [--tag <tag>]    Update OpenProvider (keeps preview installs on @preview)\n" +
"  opr restart                  Stop and restart the proxy\n" +
"  opr v2 <sub>                multi_agent_v2 surface (status|on|off|mode|threads)\n" +
"  opr health [--json]          Check proxy health (exit 0=healthy, 1=not)\n" +
"  opr provider <sub>          Providers, connectivity, quota, and selected models\n" +
"  opr account <sub>           Accounts, login/reauth, key pools, and quota controls\n" +
"  opr models <sub>            Live/custom models, visibility, context, and shadow calls\n" +
"  opr combo <sub>             Combo failover/round-robin routing\n" +
"  opr agent <sub>             Subagents, injection, effort caps, and sidecars\n" +
"  opr observe <sub>           Logs, usage, storage, memory, and debug data\n" +
"  opr access <sub>            External API keys and endpoint information\n" +
"  opr grok <sub>              Grok Build model selection and apply\n" +
"  opr system <sub>            Runtime settings, startup, sync, and updates\n" +
"  opr config <sub>            Validated configuration show/get/set/import/export\n" +
"  opr claude [args...]        Launch Claude Code wired to the proxy (model discovery on)\n" +
"  opr claude desktop [sub]    Manage and apply Claude Desktop's four-family profile\n" +
"  opr opencode [args...]      Launch opencode wired to the proxy (runtime provider config)\n" +
"  opr help [command]          Show help\n" +
"  opr --version | -v          Print version\n\n" +
"Examples:\n" +
"  opr init                    Set up provider and inject into Codex\n" +
"  opr start                   Start on default port (10100)\n" +
"  opr start --port 8080       Start on custom port\n" +
"  opr help service            Show service command help\n" +
"  opr sync                    Sync available models to Codex\n");
}

export function hasHelpFlag(values: string[]): boolean {
  return values.some(value => value === "--help" || value === "-h" || value === "help");
}

export function printSubcommandUsage(name: string | undefined): void {
  const entry = name ? helpEntries[name] : undefined;
  if (!entry) {
    console.error("Unknown command: " + (name ?? "").trim());
    printUsage();
    process.exit(1);
  }
  console.log("\x1b[36mUsage:\x1b[0m " + entry.usage + "\n\n" + entry.summary);
  if (entry.details?.length) console.log("\n" + entry.details.join("\n"));
}