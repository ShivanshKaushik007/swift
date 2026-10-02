// Entry point for hosting providers (such as Render) defaulting to `node index.js`
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const distApp = path.join(__dirname, "dist", "app.js");

// If TypeScript hasn't been built yet, compile it before starting
if (!fs.existsSync(distApp)) {
  console.log("[Swift] Compiled server not found at dist/app.js. Building TypeScript...");
  try {
    execSync("npm run build", { stdio: "inherit", cwd: __dirname });
  } catch (err) {
    console.error("[Swift] Failed to build TypeScript project:", err);
    process.exit(1);
  }
}

require("./dist/app.js");
