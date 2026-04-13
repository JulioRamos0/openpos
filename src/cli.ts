import { resolve } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { db, initDb, getConfig, setConfig, CONFIG_KEYS } from "./db/client.js";
import { products } from "./db/schema.js";
import { sql } from "drizzle-orm";

const VERSION = "1.0.0";

const HELP_TEXT = `
╔════════════════════════════════════════════════════════════════╗
║ OPENPOS v1.0.0                                                 ║
║ Sistema de Punto de Venta                                      ║
╚════════════════════════════════════════════════════════════════╝

USO:
  pos.exe [COMANDO] [OPCIONES]

COMANDOS:
  (sin comando)    Iniciar modo interactivo
  import products  Importar productos desde archivo CSV
  export products Exportar productos a archivo CSV
  seed            Insertar productos de ejemplo
  config get      Ver configuracion actual
  config set      Actualizar configuracion

OPCIONES:
  -h, --help      Mostrar esta ayuda
  -v, --version   Mostrar version
  --dry-run       Simular sin guardar cambios

EJEMPLOS:
  pos.exe           Modo interactivo
  import products   Importar productos
  export products   Exportar productos
  seed              Productos de ejemplo
  config get        Ver configuracion
  config set        Actualizar configuracion
`;

const VALID_UNIT_TYPES = ["pza", "kg", "g", "lt", "ml", "m", "cm"];
const VALID_CONFIG_KEYS = Object.values(CONFIG_KEYS);

function showHelp(): void {
  console.log(HELP_TEXT);
}

function showVersion(): void {
  console.log(`OPENPOS v${VERSION}`);
}

function showError(msg: string): void {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV vacío o sin encabezados");

  const headers = lines[0]!.split(",").map(h => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]!.split(",").map(v => v.trim());
    if (values.length < 2) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

function normalizeProduct(row: Record<string, string>) {
  return {
    barcode: row.barcode || null,
    sku: row.sku?.trim() || "",
    name: row.name?.trim() || "",
    price: parseFloat(row.price) || 0,
    cost: parseFloat(row.cost) || 0,
    category: row.category?.trim() || "GEN",
    stock: parseFloat(row.stock) || 0,
    minStock: parseFloat(row.minstock) || 5,
    unitType: (row.unittype?.trim() || "pza").toLowerCase(),
    unitQty: parseFloat(row.unitqty) || 1,
    active: 1,
  };
}

async function importProducts(filePath: string, dryRun: boolean): Promise<void> {
  if (!filePath) {
    showError("Falta archivo. Uso: pos.exe import products <archivo.csv>");
  }

  const fullPath = resolve(process.cwd(), filePath);
  if (!existsSync(fullPath)) {
    showError(`Archivo no encontrado: ${filePath}`);
  }

  console.log(`📂 Importando: ${filePath}`);

  initDb();

  const content = readFileSync(fullPath, "utf-8");
  const rows = parseCSV(content);

  console.log(`📊 ${rows.length} productos encontrados en CSV`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const lineNum = i + 2;

    if (!row.sku || !row.name) {
      errors.push(`Línea ${lineNum}: Falta SKU o nombre`);
      continue;
    }

    if (!row.price || isNaN(parseFloat(row.price))) {
      errors.push(`Línea ${lineNum}: Precio inválido`);
      continue;
    }

    if (row.unittype && !VALID_UNIT_TYPES.includes(row.unittype.toLowerCase())) {
      errors.push(`Línea ${lineNum}: unitType inválido (use: pza, kg, g, lt, ml, m, cm)`);
      continue;
    }

    const product = normalizeProduct(row);
    const existing = db.select().from(products).where(sql`sku = ${product.sku}`).get();

    if (existing) {
      if (dryRun) {
        console.log(`  🔄 [dry-run] Se actualizaría: ${product.sku} - ${product.name}`);
        updated++;
      } else {
        db.run(sql`
          UPDATE products SET
            name = ${product.name},
            price = ${product.price},
            cost = ${product.cost},
            category = ${product.category},
            stock = ${product.stock},
            barcode = ${product.barcode},
            unitType = ${product.unitType},
            unitQty = ${product.unitQty},
            minStock = ${product.minStock},
            updated_at = datetime('now')
          WHERE sku = ${product.sku}
        `);
        console.log(`  🔄 ${product.sku} - actualizado`);
        updated++;
      }
    } else {
      if (dryRun) {
        console.log(`  ✅ [dry-run] Se insertaría: ${product.sku} - ${product.name}`);
        inserted++;
      } else {
        db.insert(products).values({
          ...product,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).run();
        console.log(`  ✅ ${product.sku} - ${product.name}`);
        inserted++;
      }
    }
  }

  console.log("\n📈 RESUMEN:");
  console.log(`   ✅ Insertados: ${inserted}`);
  console.log(`   🔄 Actualizados: ${updated}`);
  console.log(`   ⏭️  Omitidos: ${skipped}`);
  console.log(`   ❌ Errores: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\n❌ ERRORES:");
    errors.forEach(e => console.log(`   ${e}`));
  }
}

async function exportProducts(filePath: string): Promise<void> {
  if (!filePath) {
    showError("Falta archivo. Uso: pos.exe export products <archivo.csv>");
  }

  initDb();

  const allProducts = db.select().from(products).all();

  if (allProducts.length === 0) {
    showError("No hay productos para exportar");
  }

  const headers = ["sku", "name", "price", "cost", "category", "stock", "barcode", "unittype", "unitqty", "minstock"];
  const csvLines = [headers.join(",")];

  for (const p of allProducts) {
    const row = [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.price.toString(),
      (p.cost ?? 0).toString(),
      p.category,
      p.stock.toString(),
      p.barcode || "",
      p.unitType,
      (p.unitQty ?? 1).toString(),
      (p.minStock ?? 5).toString(),
    ];
    csvLines.push(row.join(","));
  }

  const fullPath = resolve(process.cwd(), filePath);
  writeFileSync(fullPath, csvLines.join("\n"), "utf-8");

  console.log(`✅ Exportados ${allProducts.length} productos a: ${filePath}`);
}

async function runSeed(dryRun: boolean): Promise<void> {
  initDb();

  const sample = [
    { barcode: "7501234560014", sku: "BEB001", name: "Agua Bonafont 600ml", price: 15, cost: 8, category: "BEB", stock: 100, minStock: 20, unitType: "pza", unitQty: 0.6 },
    { barcode: "7501234560021", sku: "BEB002", name: "Coca-Cola 600ml", price: 22, cost: 12, category: "BEB", stock: 80, minStock: 15, unitType: "pza", unitQty: 0.6 },
    { barcode: "7501234560038", sku: "BEB003", name: "Cafe Americano", price: 35, cost: 18, category: "BEB", stock: 50, minStock: 10, unitType: "pza", unitQty: 1 },
    { barcode: "7503000100019", sku: "BOT001", name: "Papas Fritas Sabritas", price: 28, cost: 14, category: "BOT", stock: 60, minStock: 15, unitType: "pza", unitQty: 1 },
    { barcode: "7503000100026", sku: "BOT002", name: "Chicles Orbit Menta", price: 12, cost: 5, category: "BOT", stock: 100, minStock: 20, unitType: "pza", unitQty: 1 },
    { barcode: "7505000100014", sku: "GEN001", name: "Cigarros Camel", price: 55, cost: 38, category: "GEN", stock: 40, minStock: 10, unitType: "pza", unitQty: 1 },
    { barcode: "7505000100021", sku: "GEN002", name: "Encendedor Bic", price: 15, cost: 6, category: "GEN", stock: 50, minStock: 15, unitType: "pza", unitQty: 1 },
  ];

  let inserted = 0;
  for (const p of sample) {
    const existing = db.select().from(products).where(sql`sku = ${p.sku}`).get();
    if (existing) continue;

    if (dryRun) {
      console.log(`  ✅ [dry-run] Se insertaría: ${p.sku} - ${p.name}`);
    } else {
      db.insert(products).values({
        ...p,
        active: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).run();
      console.log(`  ✅ ${p.sku} - ${p.name}`);
    }
    inserted++;
  }

  console.log(`\n📈 Seed: ${inserted} productos insertados (dry-run: ${dryRun})`);
}

async function configGet(key: string): Promise<void> {
  if (!key) {
    console.log("Claves de configuración disponibles:");
    VALID_CONFIG_KEYS.forEach(k => {
      const val = getConfig(k);
      console.log(`  ${k}: ${val || "(sin valor)"}`);
    });
    return;
  }

  if (!VALID_CONFIG_KEYS.includes(key as any)) {
    showError(`Clave inválida. Use: ${VALID_CONFIG_KEYS.join(", ")}`);
  }

  const val = getConfig(key);
  console.log(`${key} = ${val || "(sin valor)"}`);
}

async function configSet(key: string, value: string): Promise<void> {
  if (!key || value === undefined) {
    showError("Faltan parámetros. Uso: pos.exe config set <key> <value>");
  }

  if (!VALID_CONFIG_KEYS.includes(key as any)) {
    showError(`Clave inválida. Use: ${VALID_CONFIG_KEYS.join(", ")}`);
  }

  setConfig(key, value);
  console.log(`✅ ${key} = ${value}`);
}

export async function runCLI(): Promise<boolean> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    return false;
  }

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    showVersion();
    process.exit(0);
  }

  const dryRun = args.includes("--dry-run");

  const cmd = args[0];
  const subcmd = args[1];
  const param = args[2];

  switch (cmd) {
    case "import":
      if (subcmd === "products") {
        await importProducts(param, dryRun);
        process.exit(0);
      }
      showError("Uso: pos.exe import products <archivo.csv>");
      break;

    case "export":
      if (subcmd === "products") {
        await exportProducts(param);
        process.exit(0);
      }
      showError("Uso: pos.exe export products <archivo.csv>");
      break;

    case "seed":
      await runSeed(dryRun);
      process.exit(0);

    case "config":
      if (subcmd === "get") {
        await configGet(param);
        process.exit(0);
      }
      if (subcmd === "set") {
        await configSet(param, args[3]);
        process.exit(0);
      }
      showError("Uso: pos.exe config get <key> | set <key> <value>");
      break;

    default:
      console.log(`Comando desconocido: ${cmd}`);
      console.log("Use --help para ver los comandos disponibles");
      process.exit(1);
  }

  return false;
}