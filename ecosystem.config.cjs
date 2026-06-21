const path = require("path");
const fs = require("fs");

function loadEnvFile(filename) {
  const filePath = path.join(__dirname, filename);
  const env = {
    NODE_ENV: "production",
    PORT: 3000,
    HOSTNAME: "0.0.0.0",
  };

  if (!fs.existsSync(filePath)) {
    return env;
  }

  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }

  return env;
}

module.exports = {
  apps: [
    {
      name: "adel-immobilier",
      script: ".next/standalone/server.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: loadEnvFile(".env.production"),
    },
  ],
};
