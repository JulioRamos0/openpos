import React from "react";
import { Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import { db, initDb } from "../../db/client.js";
import { products as productsTable, sales } from "../../db/schema.js";
import { sql } from "drizzle-orm";
import type { Product } from "../../db/schema.js";
import { useCart } from "../../store/cart.js";
import { useAuth } from "../../store/auth.js";
import { ProductGrid } from "./components/ProductGrid.js";
import { Ticket } from "./components/Ticket.js";
import { ReportsScreen } from "./ReportsScreen.js";
import { BgBox } from "../../shared/components/BgBox.js";
import { theme, fmt } from "../../shared/theme.js";
import { printTicket, type TicketData } from "../../utils/printer/index.js";
import { PayModal, type Method } from "./components/PayModal.js";

type PanelType = "search" | "grid" | "ticket" | "pay" | "reports";

export function PosScreen({ onLogout }: { onLogout?: () => void }) {
  const { exit } = useApp();
  const { add, nextTicket, total, ticketNum, items } = useCart();
  const { user } = useAuth();

  const [cols, setCols] = React.useState(process.stdout.columns || 120);
  const [rows, setRows] = React.useState(process.stdout.rows || 30);

  React.useEffect(() => {
    const onResize = () => {
      setCols(process.stdout.columns || 120);
      setRows(process.stdout.rows || 30);
    };
    process.stdout.on("resize", onResize);
    return () => { process.stdout.off("resize", onResize); };
  }, []);

  const [products,    setProducts]    = React.useState<Product[]>([]);
  const [query,       setQuery]       = React.useState("");
  const [activePanel, setActivePanel] = React.useState<PanelType>("search");
  const [lastMsg,     setLastMsg]     = React.useState("");
  const [time,        setTime]        = React.useState("");
  const [barcode,     setBarcode]     = React.useState("");

  React.useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    initDb();
    setProducts(db.select().from(productsTable).all());
  }, []);

  useInput((input, key) => {
    // ── ESCANEO DE CÓDIGO DE BARRAS ──────────────────────────────────────
    if (activePanel === "grid" && key.return && barcode.length >= 4) {
      const qtyMatch = barcode.match(/^(\d+)[*\s](.+)$/);
      const qty  = qtyMatch ? parseInt(qtyMatch[1]!) : 1;
      const code = qtyMatch ? qtyMatch[2]!.trim() : barcode.trim();
      const product = products.find(p => p.barcode === code || p.sku === code);
      if (product) {
        if (product.active === 0) {
          setLastMsg(`✗ "${product.name}" está inactivo`);
        } else if (product.stock < qty) {
          setLastMsg(`✗ Stock insuficiente (disponible: ${product.stock})`);
        } else {
          for (let i = 0; i < qty; i++) add(product);
          const unitLabel = product.unitType === "pza" ? "pza" : product.unitType;
          const qtyStr = qty > 1 ? `${qty}× ` : "";
          setLastMsg(`✓ ${qtyStr}${product.name.substring(0, 12)} ${unitLabel} $${product.price}`);
        }
      } else {
        setLastMsg(`✗ Código "${code}" no encontrado`);
      }
      setBarcode("");
      return;
    }
    if (activePanel === "grid" && /^[0-9* ]$/.test(input)) {
      setBarcode(b => b + input);
      return;
    }

    // ── NAVEGACIÓN GLOBAL ────────────────────────────────────────────────
    if (key.tab)   { setActivePanel(p => (p === "search" || p === "grid") ? "ticket" : "grid"); return; }
    if (key.escape && activePanel === "ticket")        { setActivePanel("grid"); return; }
    if (input === "/" && activePanel !== "search")     { setActivePanel("search"); return; }
    if (input === "r" && activePanel !== "pay" && activePanel !== "reports") { setActivePanel("reports"); return; }
    if (input === "l") { if (onLogout) onLogout(); return; }
    if (input === "q" && key.ctrl) exit();
  });

  function confirmPay(method: Method, receivedVal = 0, changeVal = 0) {
    const cartState  = useCart.getState();
    const cartItems  = cartState.items;
    if (cartItems.length === 0) { setLastMsg("✗ Carrito vacío"); return; }

    const t           = cartState.total();
    const sub         = cartState.subtotal();
    const taxVal      = t - sub;
    const tno         = fmt.ticket(ticketNum);
    const itemCount   = cartItems.reduce((sum, i) => sum + i.qty, 0);

    db.insert(sales).values({
      ticket:    tno,
      subtotal:  sub,
      tax:       taxVal,
      discount:  0,
      total:     t,
      received:  receivedVal,
      change:    changeVal,
      method,
      status:    "completed",
      items:     JSON.stringify(cartItems),
      itemCount: itemCount,
      createdAt: new Date().toISOString(),
      createdBy: user?.name || "Cajero",
    }).run();

    for (const item of cartItems) {
      const current = products.find(p => p.sku === item.sku);
      if (current && current.stock !== null) {
        const newStock = Math.max(0, current.stock - item.qty);
        db.run(sql`UPDATE products SET stock = ${newStock}, updated_at = datetime('now') WHERE sku = ${item.sku}`);
        setProducts(prev => prev.map(p => p.sku === item.sku ? { ...p, stock: newStock } : p));
      }
    }

    const ticketData: TicketData = {
      ticket:   tno,
      date:     new Date().toLocaleString("es-MX"),
      employee: user?.name || "Cajero",
      items:    cartItems.map(i => ({ sku: i.sku, name: i.name, price: i.price, qty: i.qty, unitType: i.unitType })),
      subtotal: sub,
      tax:      taxVal,
      discount: 0,
      total:    t,
      received: receivedVal,
      change:   changeVal,
      method,
      width:    48,
    };
    printTicket(ticketData).catch(err => console.error("Print error:", err));

    nextTicket();
    setQuery("");
    setLastMsg(`✓ Venta ${tno} · ${fmt.money(t)} · ${method}`);
  }

  // ── Dimensiones ──────────────────────────────────────────────────────────
  const TICKET_W = 26;
  const DIV_W    = 1;
  const gridW    = cols - TICKET_W - DIV_W;

  const H_HEADER = 1;
  const H_SEARCH = 1;
  const H_FOOTER = 1;
  const mainH    = rows - H_HEADER - H_SEARCH - H_FOOTER;

  const H_SUBHDR = 1;
  const H_HINTS  = 1;
  const gridH    = mainH - H_SUBHDR - H_HINTS;

  const itemCount    = items.reduce((a, i) => a + i.qty, 0);
  const totalAmount  = total();
  const isSearchActive = activePanel === "search";
  const isGridActive   = activePanel === "grid";
  const isTicketActive = activePanel === "ticket";

  // Mensaje de status: color e icono
  const msgColor = lastMsg.startsWith("✓") ? theme.green
                 : lastMsg.startsWith("✗") ? theme.red
                 : theme.textMuted;

  return (
    <Box flexDirection="column" width={cols} height={rows}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <BgBox variant="header" flexDirection="row" width={cols} paddingX={1}>
        <Box justifyContent="space-between" width={cols - 2}>

          {/* Izquierda: nombre sistema + usuario */}
          <Box flexDirection="row" gap={1}>
            <Text color={theme.bg} bold>▸ OpenPos</Text>
            <Text color={theme.bg} dimColor>│</Text>
            <Text color={theme.bg}>{user?.name || "Cajero"}</Text>
          </Box>

          {/* Centro: ticket + items */}
          <Box flexDirection="row" gap={2}>
            <Text color={theme.bg} bold>{fmt.ticket(ticketNum)}</Text>
            {itemCount > 0 && (
              <>
                <Text color={theme.bg} dimColor>·</Text>
                <Text color={theme.bg}>{itemCount} {itemCount === 1 ? "item" : "items"}</Text>
                <Text color={theme.bg} dimColor>·</Text>
                <Text color={theme.bg} bold>{fmt.money(totalAmount)}</Text>
              </>
            )}
          </Box>

          {/* Derecha: hora */}
          <Text color={theme.bg}>{time}</Text>
        </Box>
      </BgBox>

      {/* ── SEARCH ─────────────────────────────────────────────────────── */}
      <BgBox variant="section" flexDirection="row" width={cols} paddingX={1}>
        <Box flexDirection="row" width={cols - 2} gap={1}>
          <Text color={isSearchActive ? theme.green : theme.textDim} bold>
            {isSearchActive ? "❯" : "›"}
          </Text>
          <Box flexGrow={1}>
            <TextInput
              value={query}
              onChange={setQuery}
              onSubmit={() => {
                const value = query.trim();
                if (value.length >= 4) {
                  const qtyMatch = value.match(/^(\d+)[*\s](.+)$/);
                  const qty  = qtyMatch ? parseInt(qtyMatch[1]!) : 1;
                  const code = qtyMatch ? qtyMatch[2]!.trim() : value;
                  const product = products.find(p => p.barcode === code || p.sku === code);
                  if (product) {
                    if (product.active === 0) {
                      setLastMsg(`✗ "${product.name}" está inactivo`);
                    } else if (product.stock < qty) {
                      setLastMsg(`✗ Stock insuficiente (disponible: ${product.stock})`);
                    } else {
                      for (let i = 0; i < qty; i++) add(product);
                      const unitLabel = product.unitType === "pza" ? "pza" : product.unitType;
                      const qtyStr = qty > 1 ? `${qty}× ` : "";
                      setLastMsg(`✓ ${qtyStr}${product.name.substring(0, 12)} ${unitLabel} $${product.price}`);
                    }
                  } else {
                    setLastMsg(`✗ Código "${code}" no encontrado`);
                  }
                }
                setQuery("");
                setActivePanel("grid");
              }}
              placeholder="Buscar producto o código: 4*7501234560014"
              focus={isSearchActive}
            />
          </Box>
          {/* Conteo de resultados */}
          {query && (
            <>
              <Text color={theme.textDim}>│</Text>
              <Text color={theme.textMuted}>
                {products.filter(p =>
                  p.name.toLowerCase().includes(query.toLowerCase()) ||
                  p.sku.toLowerCase().includes(query.toLowerCase())
                ).length} resultados
              </Text>
            </>
          )}
        </Box>
      </BgBox>

      {/* ── MAIN ───────────────────────────────────────────────────────── */}
      <Box flexDirection="row" height={mainH}>

        {/* ── Panel productos ──────────────────────────────────────────── */}
        <Box flexDirection="column" width={gridW} height={mainH}>

          {/* Subheader */}
          <BgBox variant="section" flexDirection="row" width={gridW} paddingX={1}>
            <Box justifyContent="space-between" width={gridW - 2}>
              <Box flexDirection="row" gap={1}>
                <Text color={isGridActive ? theme.green : theme.textSec} bold>
                  {isGridActive ? "▸" : " "}
                </Text>
                <Text color={isGridActive ? theme.white : theme.textSec} bold>
                  Productos
                </Text>
                {barcode && (
                  <>
                    <Text color={theme.textDim}>│</Text>
                    <Text color={theme.amber}>⊞ {barcode}</Text>
                  </>
                )}
              </Box>
              <Box flexDirection="row" gap={2}>
                <Text color={theme.textDim}>{products.length} total</Text>
                {query && <Text color={theme.amber}>"{query}"</Text>}
              </Box>
            </Box>
          </BgBox>

          {/* Grid */}
          <Box width={gridW} height={gridH} paddingX={1}>
            <ProductGrid
              products={products}
              query={query}
              onSelect={p => { add(p); setLastMsg(`✓ ${p.name} · ${fmt.money(p.price)}`); }}
              active={isGridActive}
              width={gridW - 4}
              height={gridH}
            />
          </Box>

          {/* Hints */}
          <BgBox variant="section" flexDirection="row" width={gridW} paddingX={1}>
            <Box justifyContent="space-between" width={gridW - 2}>
              <Text color={theme.textDim}>
                {isGridActive
                  ? "↑↓←→ navegar  Enter agregar  Tab ticket  / buscar"
                  : "/ buscar  ↑↓ navegar  Tab ticket"}
              </Text>
              <Box flexDirection="row" gap={2}>
                <Text color={theme.textDim}>
                  <Text color={theme.textMuted}>R</Text> reportes
                </Text>
                <Text color={theme.textDim}>
                  <Text color={theme.textMuted}>L</Text> salir
                </Text>
              </Box>
            </Box>
          </BgBox>
        </Box>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <Box width={DIV_W} height={mainH} flexDirection="column">
          <Text color={theme.textDim}>{"│\n".repeat(mainH)}</Text>
        </Box>

        {/* ── Panel ticket ─────────────────────────────────────────────── */}
        <Box width={TICKET_W} height={mainH}>
          <Ticket
            active={isTicketActive}
            onPay={() => setActivePanel("pay")}
            height={mainH}
          />
        </Box>
      </Box>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <BgBox variant="section" flexDirection="row" width={cols} paddingX={1}>
        <Box justifyContent="space-between" width={cols - 2}>

          {/* Estado de conexión */}
          <Box flexDirection="row" gap={1}>
            <Text color={theme.green}>●</Text>
            <Text color={theme.textMuted}>Online</Text>
          </Box>

          {/* Panel activo indicator */}
          <Box flexDirection="row" gap={1}>
            {(["search", "grid", "ticket"] as PanelType[]).map(p => (
              <Text key={p} color={activePanel === p ? theme.green : theme.textDim}>
                {activePanel === p ? "◉" : "○"}
                {" "}
                <Text color={activePanel === p ? theme.white : theme.textDim}>
                  {p === "search" ? "buscar" : p === "grid" ? "productos" : "ticket"}
                </Text>
              </Text>
            ))}
          </Box>

          {/* Mensaje de último evento */}
          <Text color={msgColor}>
            {lastMsg || <Text color={theme.textDim}>Listo</Text>}
          </Text>
        </Box>
      </BgBox>

      {/* ── MODAL COBRO ────────────────────────────────────────────────── */}
      <PayModal
        active={activePanel === "pay"}
        marginLeft={Math.floor((gridW - 36) / 2)}
        marginTop={H_HEADER + H_SEARCH + Math.floor((mainH - 22) / 2)}
        onConfirm={(method, received, change) => {
          confirmPay(method, received, change);
          setActivePanel("search");
        }}
        onCancel={() => setActivePanel("ticket")}
      />

      {/* ── REPORTES

      {/* ── REPORTES ───────────────────────────────────────────────────── */}
      <ReportsScreen
        rows={rows}
        cols={cols}
        active={activePanel === "reports"}
        onClose={() => setActivePanel("grid")}
      />

    </Box>
  );
}