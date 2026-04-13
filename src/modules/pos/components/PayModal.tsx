import React from "react";
import { Box, Text, useInput } from "ink";
import { useCart } from "../../../store/cart.js";
import { theme, fmt } from "../../../shared/theme.js";

// ── Tipos ──────────────────────────────────────────────────────────────────────
export type Method  = "efectivo" | "tarjeta" | "transf." | "qr/codi";
type PayStep        = "method" | "cash" | "change";

const PAY_METHODS: Method[] = ["efectivo", "tarjeta", "transf.", "qr/codi"];

const METHOD_COLOR: Record<string, string> = {
  efectivo:  theme.green,
  tarjeta:   theme.blue,
  "transf.": theme.cyan,
  "qr/codi": theme.amber,
};
const METHOD_ICON: Record<string, string> = {
  efectivo:  "◆",
  tarjeta:   "▣",
  "transf.": "⇄",
  "qr/codi": "⊞",
};
const METHOD_DESC: Record<string, string> = {
  efectivo:  "Pago en efectivo",
  tarjeta:   "Débito / Crédito",
  "transf.": "Transferencia SPEI",
  "qr/codi": "CoDi / QR",
};

type Props = {
  active:    boolean;
  marginLeft: number;
  marginTop:  number;
  onConfirm: (method: Method, received: number, change: number) => void;
  onCancel:  () => void;
};

// ── Sub-componente: separador con título ───────────────────────────────────────
function SectionTitle({ label, color = theme.textDim }: { label: string; color?: string }) {
  return (
    <Box justifyContent="center" marginBottom={1}>
      <Text bold color={color}>{label}</Text>
    </Box>
  );
}

// ── Sub-componente: fila de monto ──────────────────────────────────────────────
function AmountRow({
  label,
  value,
  valueColor = theme.textSec,
  bold = false,
  cursor = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
  cursor?: boolean;
}) {
  return (
    <Box justifyContent="space-between" width={30}>
      <Text color={theme.textMuted}>{label}</Text>
      <Text color={valueColor} bold={bold}>
        {value}{cursor ? "▌" : ""}
      </Text>
    </Box>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export function PayModal({ active, marginLeft, marginTop, onConfirm, onCancel }: Props) {
  const { total } = useCart();

  const [step,     setStep]     = React.useState<PayStep>("method");
  const [cursor,   setCursor]   = React.useState(0);
  const [received, setReceived] = React.useState("");

  // Reset al activarse
  React.useEffect(() => {
    if (active) {
      setStep("method");
      setCursor(0);
      setReceived("");
    }
  }, [active]);

  useInput((input, key) => {
    if (!active) return;

    // ── Paso 1: Selección de método ──────────────────────────────────────────
    if (step === "method") {
      if (key.upArrow   || input === "1") setCursor(c => Math.max(0, c - 1));
      if (key.downArrow || input === "2") setCursor(c => Math.min(PAY_METHODS.length - 1, c + 1));
      if (key.return || input === "4") {
        const m = PAY_METHODS[cursor]!;
        if (m === "efectivo") { setStep("cash"); setReceived(""); }
        else { onConfirm(m, 0, 0); }
      }
      if (key.escape) onCancel();
      return;
    }

    // ── Paso 2: Ingreso de efectivo ──────────────────────────────────────────
    if (step === "cash") {
      if (/^[0-9]$/.test(input))           { setReceived(r => r + input); return; }
      if (input === "3" || key.backspace)   { setReceived(r => r.slice(0, -1)); return; }
      if (key.return || input === "4") {
        const rec = parseFloat(received) || 0;
        const tot = total();
        if (rec >= tot) setStep("change");
        // si falta dinero no avanza — el error visual lo indica
        return;
      }
      if (key.escape) { setStep("method"); setReceived(""); }
      return;
    }

    // ── Paso 3: Confirmar cambio ─────────────────────────────────────────────
    if (step === "change") {
      if (key.return || input === "4" || input === "s") {
        const rec = parseFloat(received) || 0;
        const tot = total();
        onConfirm("efectivo", rec, Math.max(0, rec - tot));
        setStep("method");
        setReceived("");
        return;
      }
      if (key.escape) setStep("cash");
      return;
    }
  });

  if (!active) return null;

  const tot      = total();
  const rec      = parseFloat(received) || 0;
  const falta    = Math.max(0, tot - rec);
  const cambio   = Math.max(0, rec - tot);
  const ready    = rec >= tot;
  const method   = PAY_METHODS[cursor]!;
  const methCol  = METHOD_COLOR[method]!;

  // ── Título dinámico ──────────────────────────────────────────────────────────
  const TITLES: Record<PayStep, string> = {
    method: "━━  MÉTODO DE PAGO  ━━",
    cash:   "━━  INGRESO EFECTIVO  ━━",
    change: "━━  CONFIRMAR VENTA  ━━",
  };

  // Color del borde según paso/estado
  const borderColor =
    step === "change" ? theme.green
    : step === "cash" && ready ? theme.green
    : step === "cash" ? theme.amber
    : methCol;

  return (
    <Box
      position="absolute"
      marginLeft={marginLeft}
      marginTop={marginTop}
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      backgroundColor={theme.bgPanel}
      width={36}
      paddingX={2}
      paddingY={1}
    >
      {/* ── Título ────────────────────────────────────────────────────────── */}
      <SectionTitle label={TITLES[step]} color={borderColor} />

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 1 — Selección de método
         ══════════════════════════════════════════════════════════════════════ */}
      {step === "method" && (
        <Box flexDirection="column" gap={0}>

          {/* Total a cobrar */}
          <Box justifyContent="center" marginBottom={1}>
            <Text color={theme.textMuted}>Total a cobrar  </Text>
            <Text bold color={theme.white}>{fmt.money(tot)}</Text>
          </Box>

          {/* Opciones de método */}
          {PAY_METHODS.map((m, i) => {
            const sel  = i === cursor;
            const col  = METHOD_COLOR[m]!;
            const ico  = METHOD_ICON[m]!;
            const desc = METHOD_DESC[m]!;
            return (
              <Box
                key={m}
                width={30}
                paddingX={1}
                marginBottom={0}
                borderStyle={sel ? "single" : undefined}
                borderColor={sel ? col : undefined}
              >
                <Box flexDirection="row" gap={2} width={26}>
                  <Text color={sel ? col : theme.textDim} bold={sel}>
                    {sel ? "▸" : " "}{ico}
                  </Text>
                  <Box flexDirection="column">
                    <Text color={sel ? col : theme.textMuted} bold={sel}>
                      {m.toUpperCase()}
                    </Text>
                    <Text color={sel ? theme.textMuted : theme.textDim}>
                      {desc}
                    </Text>
                  </Box>
                </Box>
              </Box>
            );
          })}

          {/* Hints */}
          <Box marginTop={1} justifyContent="center" gap={2}>
            <Text color={theme.textDim}>
              <Text color={theme.textMuted} bold>↑↓</Text>{" elegir"}
            </Text>
            <Text color={theme.textDim}>{"·"}</Text>
            <Text color={theme.textDim}>
              <Text color={theme.textMuted} bold>Enter</Text>{" confirmar"}
            </Text>
            <Text color={theme.textDim}>{"·"}</Text>
            <Text color={theme.textDim}>
              <Text color={theme.textMuted} bold>Esc</Text>{" volver"}
            </Text>
          </Box>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 2 — Ingreso de efectivo
         ══════════════════════════════════════════════════════════════════════ */}
      {step === "cash" && (
        <Box flexDirection="column" gap={0}>

          {/* Montos */}
          <AmountRow label="Total:"    value={fmt.money(tot)} valueColor={theme.white} bold />
          <AmountRow
            label="Recibido:"
            value={fmt.money(rec)}
            valueColor={ready ? theme.green : theme.amber}
            bold
            cursor={!!received || !ready}
          />
          <Box paddingY={0}>
            <Text color={theme.textDim}>{"─".repeat(30)}</Text>
          </Box>
          <AmountRow
            label={ready ? "Cambio:" : "Falta:"}
            value={ready ? fmt.money(cambio) : fmt.money(falta)}
            valueColor={ready ? theme.green : theme.red}
            bold
          />

          {/* Numberpad visual */}
          <Box flexDirection="column" marginTop={1} alignItems="center" gap={0}>
            {[["1","2","3"],["4","5","6"],["7","8","9"],["←","0","✓"]].map((row, ri) => (
              <Box key={ri} flexDirection="row" gap={1}>
                {row.map(k => {
                  const isBack  = k === "←";
                  const isOk    = k === "✓";
                  const litBack = isBack && received.length > 0;
                  const litOk   = isOk && ready;
                  const lit     = litBack || litOk || (!isBack && !isOk);
                  const col     = isOk && ready   ? theme.green
                                : isBack && litBack ? theme.amber
                                : isOk            ? theme.textDim
                                : theme.textMuted;
                  return (
                    <Box
                      key={k}
                      width={7}
                      justifyContent="center"
                      borderStyle="single"
                      borderColor={litOk ? theme.green : litBack ? theme.amber : theme.textDim}
                    >
                      <Text color={col} bold={litOk || litBack}>{k}</Text>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>

          {/* Hint */}
          <Box marginTop={1} justifyContent="center">
            <Text color={theme.textDim}>
              <Text color={theme.textMuted} bold>0-9</Text>{" ingresar  "}
              <Text color={theme.textMuted} bold>←/3</Text>{" borrar  "}
              <Text color={theme.textMuted} bold>Enter</Text>{" confirmar"}
            </Text>
          </Box>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PASO 3 — Confirmar cambio
         ══════════════════════════════════════════════════════════════════════ */}
      {step === "change" && (
        <Box flexDirection="column" gap={0}>

          {/* Resumen */}
          <AmountRow label="Total:"     value={fmt.money(tot)} valueColor={theme.white} bold />
          <AmountRow label="Recibido:"  value={fmt.money(rec)} valueColor={theme.textSec} />
          <Box>
            <Text color={theme.textDim}>{"─".repeat(30)}</Text>
          </Box>

          {/* Cambio destacado */}
          <Box
            justifyContent="space-between"
            width={30}
            borderStyle="single"
            borderColor={theme.green}
            paddingX={1}
            marginTop={0}
          >
            <Text bold color={theme.green}>Cambio:</Text>
            <Text bold color={theme.greenBr}>{fmt.money(cambio)}</Text>
          </Box>

          {/* Botón confirmar */}
          <Box justifyContent="center" marginTop={1}>
            <Text bold color={theme.green}>{"[ Enter ]  Confirmar venta  ✓"}</Text>
          </Box>

          {/* Hint */}
          <Box justifyContent="center" marginTop={0}>
            <Text color={theme.textDim}>
              <Text color={theme.textMuted} bold>Esc</Text>{" volver al monto"}
            </Text>
          </Box>
        </Box>
      )}

    </Box>
  );
}