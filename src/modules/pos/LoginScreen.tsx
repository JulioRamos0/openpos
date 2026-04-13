import React from "react";
import { Box, Text, useInput } from "ink";
import { useAuth } from "../../store/auth.js";
import { BgBox } from "../../shared/components/BgBox.js";
import { theme } from "../../shared/theme.js";

type Props = {
  onLogin: () => void;
};

// Logo "OpenPos" — 6 filas: 3 blancas (top) + 3 grises (sombra/bottom)
const LOGO_TOP = [
  " ██████╗ ██████╗ ███████╗███╗  ██╗    ██████╗  ██████╗ ███████╗",
  "██╔═══██╗██╔══██╗██╔════╝████╗ ██║    ██╔══██╗██╔═══██╗██╔════╝",
  "██║   ██║██████╔╝█████╗  ██╔██╗██║    ██████╔╝██║   ██║███████╗",
];

const LOGO_BOTTOM = [
  "██║   ██║██╔═══╝ ██╔══╝  ██║╚████║    ██╔═══╝ ██║   ██║╚════██║",
  " ██████╔╝██║     ███████╗██║ ╚███║    ██║      ██████╔╝███████║",
  " ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚══╝   ╚═╝      ╚═════╝ ╚══════╝",
];

export function LoginScreen({ onLogin }: Props) {
  const { login } = useAuth();
  const [cols, setCols] = React.useState(80);
  const [rows, setRows] = React.useState(24);
  const [username, setUsername] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [focus, setFocus] = React.useState<"username" | "pin">("username");
  const [error, setError] = React.useState("");
  const [attempts, setAttempts] = React.useState(0);

  React.useEffect(() => {
    const updateSize = () => {
      setCols(process.stdout.columns || 80);
      setRows(process.stdout.rows || 24);
    };
    updateSize();
    process.stdout.on("resize", updateSize);
    return () => { process.stdout.off("resize", updateSize); };
  }, []);

  useInput((input, key) => {
    if (error) setError("");

    if (key.tab) {
      setFocus(f => f === "username" ? "pin" : "username");
      return;
    }

    if (key.backspace) {
      if (focus === "username") setUsername(s => s.slice(0, -1));
      if (focus === "pin") setPin(s => s.slice(0, -1));
      return;
    }

    if (focus === "username" && /^[a-zA-Z0-9]$/.test(input)) {
      if (username.length < 20) setUsername(s => s + input);
      return;
    }

    if (focus === "pin" && /^[0-9]$/.test(input)) {
      if (pin.length < 6) setPin(s => s + input);
      return;
    }

    if (key.return) {
      if (username && pin) {
        const success = login(username, pin);
        if (success) {
          onLogin();
        } else {
          const next = attempts + 1;
          setAttempts(next);
          setPin("");
          if (next >= 3) {
            setUsername("");
            setPin("");
            setAttempts(0);
            setError("Demasiados intentos. Limpiando...");
          } else {
            setError(`Credenciales incorrectas (${next}/3)`);
          }
        }
      }
      return;
    }

    if (key.escape) {
      if (focus === "username") setUsername("");
      if (focus === "pin") setPin("");
      return;
    }
  });

  return (
    <Box flexDirection="column" width={cols} height={rows}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <BgBox variant="section" width={cols} paddingX={2}>
        <Box width={cols - 4} justifyContent="space-between">
          <Text color={theme.textMuted}>
            <Text color={theme.green} bold>▸</Text>
            {"  TIENDA POS"}
          </Text>
          <Text color={theme.textMuted}>Sistema de Punto de Venta</Text>
        </Box>
      </BgBox>

      {/* ── Cuerpo central ─────────────────────────────────────── */}
      <Box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1} gap={1}>

        {/* Logo — mitad superior blanca, mitad inferior gris (sombra) */}
        <Box flexDirection="column" alignItems="center">
          {LOGO_TOP.map((line, i) => (
            <Text key={`t${i}`} color={theme.white}>{line}</Text>
          ))}
          {LOGO_BOTTOM.map((line, i) => (
            <Text key={`b${i}`} color={theme.textMuted}>{line}</Text>
          ))}
          <Box width={65} justifyContent="flex-end">
            <Text color={theme.textDim}>v1.0.0</Text>
          </Box>
        </Box>

        {/* ── Panel de login ──────────────────────────────────── */}
        <BgBox variant="panel" width={44} paddingX={3} paddingY={1}>

          {/* Título del panel */}
          <Box justifyContent="center" marginBottom={1}>
            <Text color={theme.green} bold>━━  ACCESO AL SISTEMA  ━━</Text>
          </Box>

          {/* Campo: usuario */}
          <Box flexDirection="column" marginBottom={1}>
            <Box gap={1}>
              <Text color={focus === "username" ? theme.amber : theme.textMuted}>
                {focus === "username" ? "◉" : "○"}
              </Text>
              <Text color={focus === "username" ? theme.white : theme.textMuted} bold>
                USUARIO
              </Text>
            </Box>
            <Box
              borderStyle={focus === "username" ? "single" : undefined}
              borderColor={theme.amber}
              paddingX={focus === "username" ? 1 : 0}
              marginLeft={focus === "username" ? 0 : 2}
              width={36}
            >
              <Text color={focus === "username" ? theme.amber : theme.textSec}>
                {username
                  ? username + (focus === "username" ? "▌" : "")
                  : focus === "username"
                    ? "▌"
                    : <Text color={theme.textDim}>sin usuario</Text>
                }
              </Text>
            </Box>
          </Box>

          {/* Campo: contraseña */}
          <Box flexDirection="column" marginBottom={1}>
            <Box gap={1}>
              <Text color={focus === "pin" ? theme.green : theme.textMuted}>
                {focus === "pin" ? "◉" : "○"}
              </Text>
              <Text color={focus === "pin" ? theme.white : theme.textMuted} bold>
                CONTRASEÑA
              </Text>
            </Box>
            <Box
              borderStyle={focus === "pin" ? "single" : undefined}
              borderColor={theme.green}
              paddingX={focus === "pin" ? 1 : 0}
              marginLeft={focus === "pin" ? 0 : 2}
              width={36}
            >
              <Text color={focus === "pin" ? theme.green : theme.textSec}>
                {pin
                  ? "●".repeat(pin.length) + (focus === "pin" ? "▌" : "")
                  : focus === "pin"
                    ? "▌"
                    : <Text color={theme.textDim}>sin contraseña</Text>
                }
              </Text>
            </Box>
          </Box>

          {/* Separador */}
          <Text color={theme.textDim}>{"─".repeat(38)}</Text>

          {/* Error o botón de acceso */}
          {error ? (
            <Box justifyContent="center" marginTop={1}>
              <Text color={theme.red} bold>⚠  {error}</Text>
            </Box>
          ) : (
            <Box justifyContent="center" marginTop={1}>
              {username && pin ? (
                <Text color={theme.green} bold>{"[ ENTER ]  ACCEDER  →"}</Text>
              ) : (
                <Text color={theme.textMuted}>{"[ ENTER ]  ACCEDER"}</Text>
              )}
            </Box>
          )}

          {/* Ayuda de teclado */}
          <Box justifyContent="center" marginTop={1} gap={2}>
            <Text color={theme.textDim}>
              <Text color={theme.textMuted} bold>Tab</Text>
              {" cambiar"}
            </Text>
            <Text color={theme.textDim}>{"·"}</Text>
            <Text color={theme.textDim}>
              <Text color={theme.textMuted} bold>Esc</Text>
              {" limpiar"}
            </Text>
          </Box>

        </BgBox>

      </Box>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <BgBox variant="section" width={cols} paddingX={2}>
        <Box width={cols - 4} justifyContent="space-between">
          <Text color={theme.textDim}>v1.0.0</Text>
          <Text color={theme.textDim}>
            {"Developed by "}
            <Text color={theme.textMuted}>AvalonTM</Text>
          </Text>
        </Box>
      </BgBox>

    </Box>
  );
}