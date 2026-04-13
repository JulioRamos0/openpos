import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import type { PrinterConfig, TicketData } from "./types.js";
import { getDefaultConfig } from "./types.js";
import { ThermalDriver, type PrintResult } from "./ThermalDriver.js";
import { TicketBuilder } from "./TicketBuilder.js";
import { getStoreConfig } from "../../db/client.js";

function getExeDir(): string {
  const execPath = process.argv[1] || process.execPath;
  if (!execPath) return process.cwd();
  return dirname(resolve(execPath));
}

function findConfigPath(): string {
  const exeDir = getExeDir();
  const cwdDir = process.cwd();
  
  const exeConfig = resolve(exeDir, "config.json");
  if (existsSync(exeConfig)) return exeConfig;
  
  const cwdConfig = resolve(cwdDir, "config.json");
  if (existsSync(cwdConfig)) return cwdConfig;
  
  return exeConfig;
}

const configPath = findConfigPath();

let config: PrinterConfig | null = null;

export function loadConfig(): PrinterConfig {
  if (config) return config;

  try {
    if (existsSync(configPath)) {
      const file = readFileSync(configPath, "utf-8");
      config = JSON.parse(file) as PrinterConfig;
    } else {
      config = getDefaultConfig();
    }
  } catch {
    config = getDefaultConfig();
  }

  const storeConfig = getStoreConfig();

  const bannerPath = resolve(process.cwd(), "assets", "banner.png");

  if (config.template.header.enabled) {
    config.template.header.items = [
      { type: "image", path: bannerPath, align: "center" },
      { type: "divider", value: "─", align: "center" },
      { type: "text", value: storeConfig.name, align: "center", bold: true },
      { type: "text", value: `RFC: ${storeConfig.rfc}`, align: "center", if: "width>=48" },
      { type: "text", value: storeConfig.address, align: "center", if: "width>=48" },
      { type: "divider", value: "─", align: "center" },
    ];
  }

  return config;
}

export function getConfig(): PrinterConfig {
  return config || loadConfig();
}

export function updateConfig(newConfig: Partial<PrinterConfig>): void {
  config = { ...loadConfig(), ...newConfig };
}

export function getWidth(): number {
  return loadConfig().template.width;
}

export async function printTicket(data: TicketData): Promise<PrintResult> {
  const cfg = loadConfig();
  const driver = new ThermalDriver(cfg);
  return driver.print(data, cfg.options.previewBeforePrint);
}

export function buildTicketLines(data: TicketData): string[] {
  const cfg = loadConfig();
  const builder = new TicketBuilder(cfg);
  return builder.build(data);
}

export async function testPrint(): Promise<PrintResult> {
  const cfg = loadConfig();
  const driver = new ThermalDriver(cfg);
  return driver.test();
}

export * from "./types.js";
export * from "./TicketBuilder.js";
export * from "./ThermalDriver.js";
