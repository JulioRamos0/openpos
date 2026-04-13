/**
 * BgBox.tsx — requiere Ink 7+
 *
 * Ink 7 agregó backgroundColor nativo en <Box>.
 * Internamente usa un BackgroundContext para propagar el color
 * a los Text children, llenando también los espacios en blanco.
 *
 * Para actualizar: bun add ink@7.0.0
 */

import React from "react";
import { Box as InkBox } from "ink";
import { theme } from "../theme.js";

type BgVariant = "default" | "panel" | "section" | "active" | "header" | "accent";

const VARIANT_BG: Record<BgVariant, string> = {
  default: theme.bg,        // #0d1117
  panel:   theme.bgPanel,   // #161b22
  section: theme.bgSection, // #1c2128
  active:  theme.bgActive,  // #21262d
  header:  theme.green,     // #3fb950
  accent:  theme.bgActive,  // #21262d
};

// ─── BgBox ───────────────────────────────────────────────────────────────────
type BgBoxProps = {
  children?: React.ReactNode;
  variant?: BgVariant;
  width?: number | string;
  height?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexDirection?: "row" | "column";
  justifyContent?: "flex-start" | "center" | "space-between" | "flex-end";
  alignItems?: "flex-start" | "center" | "flex-end";
  gap?: number;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
};

export function BgBox({
  children,
  variant = "default",
  width,
  height,
  flexGrow,
  flexShrink,
  flexDirection = "column",
  justifyContent,
  alignItems,
  gap,
  padding,
  paddingX,
  paddingY,
}: BgBoxProps) {
  return (
    <InkBox
      flexDirection={flexDirection}
      justifyContent={justifyContent}
      alignItems={alignItems}
      gap={gap}
      flexGrow={flexGrow}
      flexShrink={flexShrink}
      width={width}
      height={height}
      padding={padding}
      paddingX={paddingX}
      paddingY={paddingY}
      backgroundColor={VARIANT_BG[variant]}
    >
      {children}
    </InkBox>
  );
}

export const SimpleBgBox = BgBox;

// ─── BgRow ───────────────────────────────────────────────────────────────────
type BgRowProps = {
  children?: React.ReactNode;
  variant?: BgVariant;
  width?: number | string;
  justifyContent?: "flex-start" | "center" | "space-between" | "flex-end";
  alignItems?: "flex-start" | "center" | "flex-end";
  gap?: number;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  flexGrow?: number;
};

export function BgRow({
  children,
  variant = "default",
  width,
  justifyContent,
  alignItems,
  gap,
  padding,
  paddingX,
  paddingY,
  flexGrow,
}: BgRowProps) {
  return (
    <InkBox
      flexDirection="row"
      justifyContent={justifyContent}
      alignItems={alignItems}
      gap={gap}
      padding={padding}
      paddingX={paddingX}
      paddingY={paddingY}
      flexGrow={flexGrow}
      width={width}
      backgroundColor={VARIANT_BG[variant]}
    >
      {children}
    </InkBox>
  );
}

// ─── BgCol ───────────────────────────────────────────────────────────────────
type BgColProps = {
  children?: React.ReactNode;
  variant?: BgVariant;
  width?: number | string;
  height?: number;
  flexGrow?: number;
  justifyContent?: "flex-start" | "center" | "space-between" | "flex-end";
  alignItems?: "flex-start" | "center" | "flex-end";
  gap?: number;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
};

export function BgCol({
  children,
  variant = "default",
  width,
  height,
  flexGrow,
  justifyContent,
  alignItems,
  gap,
  padding,
  paddingX,
  paddingY,
}: BgColProps) {
  return (
    <InkBox
      flexDirection="column"
      justifyContent={justifyContent}
      alignItems={alignItems}
      gap={gap}
      padding={padding}
      paddingX={paddingX}
      paddingY={paddingY}
      flexGrow={flexGrow}
      width={width}
      height={height}
      backgroundColor={VARIANT_BG[variant]}
    >
      {children}
    </InkBox>
  );
}