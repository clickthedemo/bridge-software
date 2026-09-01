import { existsSync, mkdirSync, rmSync, renameSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const stagingRoot = join(root, "staging");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const buildCommand = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : npmCommand;
const buildArgs = process.platform === "win32" ? ["/d", "/s", "/c", `${npmCommand} run build`] : ["run", "build"];
const directions = ["current", "network", "botanical"];

rmSync(stagingRoot, { recursive: true, force: true });
mkdirSync(stagingRoot, { recursive: true });

for (const direction of directions) {
  console.log(`== Building staging app: ${direction} ==`);
  rmSync(join(root, "out"), { recursive: true, force: true });
  rmSync(join(root, ".next"), { recursive: true, force: true });

  const result = spawnSync(buildCommand, buildArgs, {
    cwd: root,
    env: {
      ...process.env,
      NEXT_OUTPUT: "export",
      NEXT_PUBLIC_DIRECTION_LOCK: direction,
    },
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  if (!existsSync(join(root, "out", "index.html"))) {
    throw new Error(`Expected static output for ${direction} at out/index.html`);
  }

  renameSync(join(root, "out"), join(stagingRoot, direction));
}

rmSync(join(root, ".next"), { recursive: true, force: true });
console.log("Done. Static apps in staging/current, staging/network, staging/botanical.");
