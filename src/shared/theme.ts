const ESC = String.fromCharCode(27);

function hexToAnsiBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${ESC}[48;2;${r};${g};${b}m`;
}

function hexToAnsiFg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${ESC}[38;2;${r};${g};${b}m`;
}

export const theme = {
  bg:        "#0d1117",
  bgPanel:   "#161b22",
  bgSection: "#1c2128",
  bgActive:  "#21262d",
  bgInput:   "#0d1117",

  white:     "#e6edf3",
  textPri:   "#c9d1d9",
  textSec:   "#8b949e",
  textMuted: "#484f58",
  textDim:   "#30363d",
  bgDim:     "#21262d",

  green:     "#3fb950",
  greenBr:   "#56d364",
  amber:     "#e3b341",
  amberBr:   "#f0c060",
  blue:      "#58a6ff",
  cyan:      "#39c5cf",
  red:       "#f85149",
  purple:    "#bc8cff",
  orange:    "#ffa657",

  ansi: {
    bg: hexToAnsiBg,
    fg: hexToAnsiFg,
    reset: `${ESC}[0m`,
    
    bgDefault:  hexToAnsiBg("#0d1117"),
    bgPanel:    hexToAnsiBg("#161b22"),
    bgSection:  hexToAnsiBg("#1c2128"),
    bgActive:   hexToAnsiBg("#21262d"),
    bgHeader:   hexToAnsiBg("#3fb950"),
    
    fgWhite:    hexToAnsiFg("#e6edf3"),
    fgPrimary:  hexToAnsiFg("#c9d1d9"),
    fgSecondary:hexToAnsiFg("#8b949e"),
    fgMuted:    hexToAnsiFg("#484f58"),
    fgGreen:    hexToAnsiFg("#3fb950"),
  },

  sym: {
    dot:      "●",
    dotEmpty: "○",
    arrow:    "›",
    bullet:   "·",
    vbar:     "│",
    tick:     "✓",
    selected: "▌",
    prompt:   "❯",
  },
} as const;

export const fmt = {
  money:  (n: number | undefined | null) => "$" + (n ?? 0).toFixed(2),
  ticket: (n: number) => "#" + String(n).padStart(4, "0"),
  trunc:  (s: string, len: number) => s.length > len ? s.slice(0, len - 1) + "…" : s,
  pad:    (s: string, len: number) => s.slice(0, len).padEnd(len),
};