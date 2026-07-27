export const packageName = "@mdevs/openprovider";
export const cliCommand = "opr";

export async function loadBunApi() {
  if (typeof Bun === "undefined") {
    throw new Error("The openprovider programmatic API requires the Bun runtime. Use `opr` for the CLI entrypoint.");
  }
  return import("../src/index.ts");
}

