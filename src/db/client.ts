import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sql } from "drizzle-orm";
import * as schema from "./schema.js";

const sqlite = new Database("pos.db");
sqlite.exec("PRAGMA journal_mode = WAL;");

export const db = drizzle(sqlite, { schema });

export const CONFIG_KEYS = {
  LAST_TICKET: "lastTicketNum",
  STORE_NAME: "storeName",
  STORE_RFC: "storeRfc",
  STORE_ADDRESS: "storeAddress",
  TAX_RATE: "taxRate",
  PRINTER_ENABLED: "printerEnabled",
} as const;

export type ConfigKey = typeof CONFIG_KEYS[keyof typeof CONFIG_KEYS];

export function getConfig(key: string): string | null {
  try {
    const row = db.select().from(schema.config).where(sql`key = ${key}`).get();
    return row?.value ?? null;
  } catch {
    return null;
  }
}

export function setConfig(key: string, value: string): void {
  try {
    db.run(sql`
      INSERT INTO config (key, value, updated_at)
      VALUES (${key}, ${value}, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = ${value}, updated_at = datetime('now')
    `);
  } catch {
    // Table doesn't exist yet, ignore
  }
}

export function getStoreConfig(): {
  name: string;
  rfc: string;
  address: string;
  taxRate: number;
  printerEnabled: boolean;
} {
  return {
    name: getConfig(CONFIG_KEYS.STORE_NAME) || "MI TIENDA",
    rfc: getConfig(CONFIG_KEYS.STORE_RFC) || "XAXX010101000",
    address: getConfig(CONFIG_KEYS.STORE_ADDRESS) || "Sin dirección",
    taxRate: parseFloat(getConfig(CONFIG_KEYS.TAX_RATE) || "16"),
    printerEnabled: getConfig(CONFIG_KEYS.PRINTER_ENABLED) === "true",
  };
}

export function initDb() {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(sql`
    CREATE TABLE IF NOT EXISTS products (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode    TEXT UNIQUE,
      sku        TEXT NOT NULL UNIQUE,
      name       TEXT NOT NULL,
      price      REAL NOT NULL,
      cost       REAL DEFAULT 0,
      category   TEXT NOT NULL DEFAULT 'GEN',
      stock      REAL NOT NULL DEFAULT 0,
      min_stock  REAL DEFAULT 5,
      unit_type  TEXT NOT NULL DEFAULT 'pza',
      unit_qty   REAL DEFAULT 1,
      active     INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(sql`
    CREATE TABLE IF NOT EXISTS sales (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket     TEXT NOT NULL,
      subtotal   REAL NOT NULL,
      tax        REAL NOT NULL,
      discount   REAL DEFAULT 0,
      total      REAL NOT NULL,
      received   REAL DEFAULT 0,
      change     REAL DEFAULT 0,
      method     TEXT NOT NULL,
      status     TEXT DEFAULT 'completed',
      items      TEXT NOT NULL,
      item_count INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      created_by TEXT DEFAULT 'admin'
    )
  `);

  initDefaultConfig();
}

function initDefaultConfig(): void {
  const defaults: Record<string, string> = {
    [CONFIG_KEYS.LAST_TICKET]: "1",
    [CONFIG_KEYS.STORE_NAME]: "MI TIENDA",
    [CONFIG_KEYS.STORE_RFC]: "XAXX010101000",
    [CONFIG_KEYS.STORE_ADDRESS]: "Calle Principal 123",
    [CONFIG_KEYS.TAX_RATE]: "16",
    [CONFIG_KEYS.PRINTER_ENABLED]: "false",
  };

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const existing = getConfig(key);
    if (existing === null) {
      setConfig(key, defaultValue);
    }
  }
}
