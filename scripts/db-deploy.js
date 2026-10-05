import { spawnSync } from "node:child_process";

const environment = process.env.NODE_ENV || "development";
const steps = [
  ["npx", ["sequelize-cli", "db:migrate", "--env", environment]],
  ["npx", ["sequelize-cli", "db:seed:all", "--env", environment]],
];

for (const [command, args] of steps) {
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  console.log(`[db:deploy] Running: ${executable} ${args.join(" ")}`);

  const result = spawnSync(executable, args, {
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.error) {
    console.error("[db:deploy] Failed to execute database step.");
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("[db:deploy] Migrations and seeders applied successfully.");
