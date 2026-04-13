import React from "react";
import { render, useApp } from "ink";
import { PosScreen } from "./modules/pos/PosScreen.js";
import { LoginScreen } from "./modules/pos/LoginScreen.js";
import { initDb } from "./db/client.js";
import { runCLI } from "./cli.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for CLI mode first
const isCliMode = await runCLI();

// If CLI mode handled the command, don't start interactive mode
if (isCliMode === true) {
  process.exit(0);
}

// Activar alternate screen buffer para evitar scrollback
process.stdout.write("\x1b[?1049h");  // Cambiar a alternate screen
process.stdout.write("\x1b[2J");       // Limpiar pantalla
process.stdout.write("\x1b[H");        // Mover cursor a inicio

initDb();

// Cleanup al salir de la app
function cleanup() {
  process.stdout.write("\x1b[?1049l");  // Restaurar screen buffer original
}
process.on("exit", cleanup);
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

async function checkAndInstallFont() {
  if (process.platform !== "win32") return;

  const fontRegistryPath = "HKCU:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts";
  const fontName = "JetBrains Mono (TrueType)";

  try {
    const { execSync } = await import("child_process");
    
    const result = execSync(
      `powershell -Command "Get-ItemProperty -Path 'Registry::${fontRegistryPath}' -Name '${fontName}' -ErrorAction SilentlyContinue"`,
      { encoding: "utf8", stdio: "pipe" }
    );

    if (result.includes(fontName)) {
      return true;
    }
    
    const fontPath = path.join(__dirname, "..", "assets", "fonts", "JetBrainsMono-Regular.ttf");
    const userFontDir = path.join(process.env.LOCALAPPDATA || "", "Microsoft", "Windows", "Fonts");
    
    try {
      const fs = await import("fs");
      if (!fs.existsSync(userFontDir)) {
        fs.mkdirSync(userFontDir, { recursive: true });
      }
      
      const destPath = path.join(userFontDir, "JetBrainsMono-Regular.ttf");
      fs.copyFileSync(fontPath, destPath);
      
      execSync(
        `powershell -Command "Set-ItemProperty -Path 'Registry::${fontRegistryPath}' -Name '${fontName}' -Value 'JetBrainsMono-Regular.ttf' -Type String"`,
        { stdio: "pipe" }
      );
      
      console.log("\n\x1b[32m[OK]\x1b[0m JetBrains Mono font installed. Please restart terminal.\n");
    } catch (e) {
      console.log("\n\x1b[33m[WARN]\x1b[0m Font not found. Run: powershell -ExecutionPolicy Bypass -File scripts/install-font.ps1\n");
    }
    
    return true;
  } catch {
    return false;
  }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return <PosScreen onLogout={() => setIsLoggedIn(false)} />;
}

await checkAndInstallFont();
render(<App />);