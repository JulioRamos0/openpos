import React from "react";
import { Box, Text, useInput } from "ink";
import type { Product } from "../../../db/schema.js";
import { theme, fmt } from "../../../shared/theme.js";

type Props = {
  products: Product[];
  query:    string;
  onSelect: (p: Product) => void;
  active:   boolean;
  width:    number;
  height:   number;
};

// ── Constantes de layout ──────────────────────────────────────────────────────
const COLS      = 3;
const ITEM_H    = 5;  // filas por tarjeta
const SCROLLBAR = 2;  // columnas reservadas para el scrollbar derecho

// ── Categorías ────────────────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  BEB: theme.blue,
  ALI: theme.amber,
  BOT: theme.cyan,
  LAC: theme.purple,
  GEN: theme.textSec,
  FRU: theme.green,
  CAR: theme.red,
  LIM: theme.orange,
};
const CAT_ICON: Record<string, string> = {
  BEB: "◆", ALI: "◈", BOT: "◇", LAC: "◉",
  GEN: "○", FRU: "◍", CAR: "◼", LIM: "◌",
};
const CAT_LABEL: Record<string, string> = {
  BEB: "Bebidas",  ALI: "Alimentos", BOT: "Botanas",  LAC: "Lácteos",
  GEN: "General",  FRU: "Frutas",    CAR: "Carnes",   LIM: "Limpieza",
};

// ── Scrollbar vertical ────────────────────────────────────────────────────────
// Dibuja un scrollbar de `trackH` filas indicando la posición scrollRow/totalRows
function Scrollbar(props: { scrollRow: number; totalRows: number; visibleRows: number; trackH: number }) {
  const { scrollRow, totalRows, visibleRows, trackH } = props;

  if (totalRows <= visibleRows) {
    // No hace falta scrollbar — track vacío
    return (
      <Box flexDirection="column" width={SCROLLBAR}>
        {Array.from({ length: trackH }).map((_, i) => (
          <Text key={i} color={theme.textDim}> </Text>
        ))}
      </Box>
    );
  }

  // Tamaño del thumb proporcional a la fracción visible
  const thumbH = Math.max(1, Math.round((visibleRows / totalRows) * trackH));
  // Posición del thumb
  const maxOffset = trackH - thumbH;
  const thumbPos  = Math.round((scrollRow / Math.max(1, totalRows - visibleRows)) * maxOffset);

  const lines: string[] = Array.from({ length: trackH }, (_, i) => {
    if (i >= thumbPos && i < thumbPos + thumbH) return "█";
    return "▒";
  });

  // Flechas arriba/abajo en los extremos
  if (trackH >= 3) {
    lines[0]          = scrollRow > 0                          ? "▲" : "╷";
    lines[trackH - 1] = scrollRow + visibleRows < totalRows   ? "▼" : "╵";
  }

  return (
    <Box flexDirection="column" width={SCROLLBAR} alignItems="center">
      {lines.map((ch, i) => {
        const isThumb = ch === "█";
        return (
          <Text key={i} color={isThumb ? theme.textSec : theme.textDim}>
            {ch}
          </Text>
        );
      })}
    </Box>
  );
}

// ── StockBar ──────────────────────────────────────────────────────────────────
function StockBar(props: { stock: number; max: number; width: number; low: boolean }) {
  const { stock, max, width, low } = props;
  const filled = max > 0 ? Math.max(1, Math.round((Math.min(stock, max) / max) * width)) : 0;
  const empty  = Math.max(0, width - filled);
  const col    = low ? theme.red : stock > max * 0.5 ? theme.green : theme.amber;
  return (
    <Text>
      <Text color={col}>{"▰".repeat(filled)}</Text>
      <Text color={theme.textDim}>{"▱".repeat(empty)}</Text>
    </Text>
  );
}

// ── CatBadge ──────────────────────────────────────────────────────────────────
function CatBadge(props: { category: string; selected: boolean }) {
  const { category, selected } = props;
  const color = CAT_COLOR[category] ?? theme.textSec;
  const icon  = CAT_ICON[category]  ?? "○";
  const label = CAT_LABEL[category] ?? category;
  return (
    <Text color={selected ? color : theme.textDim}>
      {icon}{" "}{label}
    </Text>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function ProductGrid({ products, query, onSelect, active, width, height }: Props) {
  const [cursor,    setCursor]    = React.useState(0);
  const [scrollRow, setScrollRow] = React.useState(0);

  const filtered = React.useMemo(() =>
    query
      ? products.filter(p =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase())
        )
      : products,
    [products, query]
  );

  React.useEffect(() => { setCursor(0); setScrollRow(0); }, [query]);

  // Filas visibles (descontar 1 fila para la barra de paginación inferior)
  const visibleRows = Math.max(1, Math.floor((height - 1) / ITEM_H));

  const maxStock = React.useMemo(() =>
    filtered.reduce((mx, p) => Math.max(mx, p.stock ?? 0), 1),
    [filtered]
  );

  // Construir filas
  const allRows: Product[][] = React.useMemo(() => {
    const rows: Product[][] = [];
    for (let i = 0; i < filtered.length; i += COLS)
      rows.push(filtered.slice(i, i + COLS));
    return rows;
  }, [filtered]);

  const totalRows = allRows.length;

  // ── Mover scroll para mantener cursor visible ────────────────────────────
  const clampScroll = React.useCallback((nextCursor: number, currentScroll: number) => {
    const row = Math.floor(nextCursor / COLS);
    if (row < currentScroll)              return row;
    if (row >= currentScroll + visibleRows) return row - visibleRows + 1;
    return currentScroll;
  }, [visibleRows]);

  useInput((input, key) => {
    if (!active) return;
    const len = filtered.length;
    if (!len) return;

    const currentRow = Math.floor(cursor / COLS);
    const currentCol = cursor % COLS;
    let next    = cursor;
    let nextScroll = scrollRow;

    // ── Navegación fila/columna ──────────────────────────────────────────
    if (key.upArrow || input === "1") {
      if (currentRow > 0) {
        next = cursor - COLS;
      } else {
        const lastRow = Math.floor((len - 1) / COLS);
        const lastCol = Math.min(currentCol, (len - 1) % COLS);
        next = lastRow * COLS + lastCol;
      }
    }

    if (key.downArrow || input === "2") {
      const nRow = currentRow + 1;
      if (nRow * COLS < len) {
        next = cursor + COLS;
        if (next >= len) next = len - 1;
      } else {
        next = currentCol;
        if (next >= len) next = 0;
      }
    }

    if (key.leftArrow || input === "3") {
      if (currentCol > 0) {
        next = cursor - 1;
      } else {
        next = Math.min(cursor + COLS - 1, len - 1);
      }
    }

    if (key.rightArrow) {
      if (currentCol < COLS - 1 && cursor + 1 < len) {
        next = cursor + 1;
      } else {
        next = cursor - currentCol;
      }
    }

    // ── PageUp / PageDown ────────────────────────────────────────────────
    if (key.pageUp) {
      const targetRow = Math.max(0, currentRow - visibleRows);
      next       = targetRow * COLS + currentCol;
      if (next >= len) next = Math.max(0, len - 1);
      nextScroll = Math.max(0, scrollRow - visibleRows);
    }

    if (key.pageDown) {
      const targetRow = Math.min(totalRows - 1, currentRow + visibleRows);
      next       = targetRow * COLS + currentCol;
      if (next >= len) next = len - 1;
      nextScroll = Math.min(Math.max(0, totalRows - visibleRows), scrollRow + visibleRows);
    }

    // ── Home / End ───────────────────────────────────────────────────────
    if (key.ctrl && key.upArrow) {
      next       = 0;
      nextScroll = 0;
    }
    if (key.ctrl && key.downArrow) {
      next       = len - 1;
      nextScroll = Math.max(0, totalRows - visibleRows);
    }

    // ── Seleccionar ──────────────────────────────────────────────────────
    if (key.return || input === "4") {
      onSelect(filtered[cursor]!);
      return;
    }

    if (next !== cursor || nextScroll !== scrollRow) {
      // Para pageUp/Down el scroll ya viene calculado arriba
      const finalScroll = (key.pageUp || key.pageDown)
        ? nextScroll
        : clampScroll(next, scrollRow);
      setCursor(next);
      setScrollRow(finalScroll);
    }
  });

  // ── Dimensiones ───────────────────────────────────────────────────────────
  // Ancho disponible para el grid = width - scrollbar
  const gridW = width - SCROLLBAR;
  const colW  = Math.floor(gridW / COLS);

  const visibleSlice = allRows.slice(scrollRow, scrollRow + visibleRows);

  // Altura del track del scrollbar = visibleRows * ITEM_H líneas
  const trackH = visibleRows * ITEM_H;

  // Paginación
  const currentPage = Math.floor(scrollRow / visibleRows) + 1;
  const totalPages  = Math.max(1, Math.ceil(totalRows / visibleRows));

  // ── Estado vacío ──────────────────────────────────────────────────────────
  if (!filtered.length) {
    const emptyW   = Math.min(60, colW * COLS);
    const divider  = "╌".repeat(emptyW);
    const mainMsg  = query
      ? `○  Sin resultados para "${query}"`
      : "○  No hay productos disponibles";
    const hintMsg  = "Intenta con otro nombre, SKU o código de barras";
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" width={width} height={height}>
        <Box width={emptyW} justifyContent="center"><Text color={theme.textDim}>{divider}</Text></Box>
        <Box width={emptyW} justifyContent="center"><Text color={theme.textMuted}>{mainMsg}</Text></Box>
        {query && (
          <Box width={emptyW} justifyContent="center"><Text color={theme.textDim}>{hintMsg}</Text></Box>
        )}
        <Box width={emptyW} justifyContent="center"><Text color={theme.textDim}>{divider}</Text></Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height={height}>

      {/* ── Grid + Scrollbar ──────────────────────────────────────────── */}
      <Box flexDirection="row" height={trackH} flexGrow={0}>

        {/* Columnas de tarjetas */}
        <Box flexDirection="column" width={gridW}>
          {visibleSlice.map((row, ri) => {
            const absRi = scrollRow + ri;
            return (
              <Box key={absRi} flexDirection="row">
                {row.map((p, ci) => {
                  const idx      = absRi * COLS + ci;
                  const sel      = idx === cursor && active;
                  const catColor = CAT_COLOR[p.category] ?? theme.textSec;
                  const stock    = p.stock ?? 0;
                  const isLow    = stock > 0 && stock <= 5;
                  const isOut    = stock === 0;
                  const inactive = p.active === 0;
                  const innerW   = colW - 4;
                  const barW     = Math.max(4, Math.floor(innerW * 0.55));

                  return (
                    <Box
                      key={p.sku}
                      width={colW}
                      flexDirection="column"
                      paddingX={1}
                      borderStyle="single"
                      borderColor={
                        sel     ? catColor
                        : isOut ? theme.textDim
                        : theme.bgActive
                      }
                    >
                      {/* Fila 1: categoría + SKU */}
                      <Box justifyContent="space-between">
                        <CatBadge category={p.category} selected={sel} />
                        <Text color={sel ? theme.textMuted : theme.textDim}>{p.sku}</Text>
                      </Box>

                      {/* Fila 2: nombre */}
                      <Text
                        color={inactive ? theme.textDim : sel ? theme.white : theme.textPri}
                        bold={sel}
                        wrap="truncate"
                      >
                        {sel ? "▸ " : "  "}{fmt.trunc(p.name, innerW - 2)}
                      </Text>

                      {/* Fila 3: precio + estado */}
                      <Box justifyContent="space-between">
                        <Text
                          color={inactive ? theme.textDim : sel ? theme.greenBr : theme.green}
                          bold={sel}
                        >
                          {fmt.money(p.price)}
                        </Text>
                        {inactive           && <Text color={theme.textDim}>inactivo</Text>}
                        {!inactive && isOut && <Text color={theme.red}  bold>AGOTADO</Text>}
                        {!inactive && isLow && !isOut && <Text color={theme.amber}>▲ bajo</Text>}
                        {!inactive && !isLow && !isOut && <Text color={theme.textDim}>×{stock}</Text>}
                      </Box>

                      {/* Fila 4: barra de stock + unidad */}
                      <Box justifyContent="space-between">
                        {inactive || isOut
                          ? <Text color={theme.textDim}>{"▱".repeat(barW)}</Text>
                          : <StockBar stock={stock} max={maxStock} width={barW} low={isLow} />
                        }
                        <Text color={theme.textDim}>
                          {p.unitType === "pza" ? "pza" : p.unitType ?? "pza"}
                        </Text>
                      </Box>
                    </Box>
                  );
                })}

                {/* Relleno columnas vacías */}
                {row.length < COLS &&
                  Array.from({ length: COLS - row.length }).map((_, ei) => (
                    <Box key={`empty-${ei}`} width={colW} />
                  ))
                }
              </Box>
            );
          })}
        </Box>

        {/* Scrollbar */}
        <Scrollbar
          scrollRow={scrollRow}
          totalRows={totalRows}
          visibleRows={visibleRows}
          trackH={trackH}
        />
      </Box>

      {/* ── Barra de paginación ────────────────────────────────────────── */}
      <Box justifyContent="space-between" width={width} paddingX={1}>
        {/* Izquierda: posición cursor */}
        <Text color={theme.textDim}>
          {"#"}
          <Text color={theme.textMuted}>{cursor + 1}</Text>
          {"/"}
          <Text color={theme.textDim}>{filtered.length}</Text>
        </Text>

        {/* Centro: páginas con indicador visual */}
        <Box gap={0}>
          {Array.from({ length: totalPages }).map((_, i) => {
            const isCurrent = i === currentPage - 1;
            return (
              <Text
                key={i}
                color={isCurrent ? theme.green : theme.textDim}
              >
                {isCurrent ? "●" : "○"}
              </Text>
            );
          })}
          <Text color={theme.textDim}>
            {"  "}pág <Text color={theme.textMuted}>{currentPage}</Text>/{totalPages}
          </Text>
        </Box>

        {/* Derecha: atajos */}
        <Text color={theme.textDim}>
          <Text color={theme.textMuted}>PgUp</Text>
          {"/"}
          <Text color={theme.textMuted}>PgDn</Text>
          {" página"}
        </Text>
      </Box>

    </Box>
  );
}