import { afterEach, describe, expect, test } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import { expandUserPath, getConfigDir } from "../src/config";

const previousOpenProviderHome = process.env.OpenProvider_HOME;

afterEach(() => {
  if (previousOpenProviderHome === undefined) delete process.env.OpenProvider_HOME;
  else process.env.OpenProvider_HOME = previousOpenProviderHome;
});

describe("expandUserPath", () => {
  test("expands ~ and leading ~/ or ~\\ to the home directory", () => {
    expect(expandUserPath("~")).toBe(homedir());
    expect(expandUserPath("~/custom/dir")).toBe(join(homedir(), "custom/dir"));
    expect(expandUserPath("~\\custom\\dir")).toBe(join(homedir(), "custom\\dir"));
  });

  test("leaves ~user, absolute, relative, and %VAR%/$VAR paths untouched", () => {
    expect(expandUserPath("~other/dir")).toBe("~other/dir");
    expect(expandUserPath("/absolute/dir")).toBe("/absolute/dir");
    expect(expandUserPath("relative/dir")).toBe("relative/dir");
    expect(expandUserPath("%USERPROFILE%\\dir")).toBe("%USERPROFILE%\\dir");
    expect(expandUserPath("$HOME/dir")).toBe("$HOME/dir");
  });
});

describe("OpenProvider_HOME tilde expansion", () => {
  test("getConfigDir honors OpenProvider_HOME=~/...", () => {
    process.env.OpenProvider_HOME = "~/.opr-tilde-test";
    expect(getConfigDir()).toBe(join(homedir(), ".opr-tilde-test"));
  });
});

