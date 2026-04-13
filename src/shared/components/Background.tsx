import React from "react";
import { Box } from "ink";
import { theme } from "../theme.js";

type BackgroundVariant = "default" | "panel" | "section" | "active" | "header" | "accent";

type Props = {
  children?: React.ReactNode;
  variant?: BackgroundVariant;
  width?: number | string;
  height?: number;
  flexGrow?: number;
  flexDirection?: "row" | "column";
  justifyContent?: "flex-start" | "center" | "space-between" | "flex-end";
  alignItems?: "flex-start" | "center" | "flex-end";
  gap?: number;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
};

const VARIANT_BG: Record<BackgroundVariant, string> = {
  default:  theme.ansi.bgDefault,
  panel:    theme.ansi.bgPanel,
  section:  theme.ansi.bgSection,
  active:   theme.ansi.bgActive,
  header:   theme.ansi.bgHeader,
  accent:   theme.ansi.bgSection,
};

export function Background({
  children,
  variant = "default",
  width,
  height,
  flexGrow,
  flexDirection = "column",
  justifyContent,
  alignItems,
  gap,
  padding,
  paddingX,
  paddingY,
}: Props) {
  return (
    <Box
      backgroundColor={variant === "header" ? theme.green : undefined}
      padding={padding}
      paddingX={paddingX}
      paddingY={paddingY}
      width={width}
      height={height}
      flexGrow={flexGrow}
      flexDirection={flexDirection}
      justifyContent={justifyContent}
      alignItems={alignItems}
      gap={gap}
    >
      {children}
    </Box>
  );
}

type RowProps = {
  children: React.ReactNode;
  justifyContent?: "flex-start" | "center" | "space-between" | "flex-end";
  alignItems?: "flex-start" | "center" | "flex-end";
  gap?: number;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  flexGrow?: number;
  width?: number | string;
};

export function Row({
  children,
  justifyContent,
  alignItems,
  gap,
  padding,
  paddingX,
  paddingY,
  flexGrow,
  width,
}: RowProps) {
  return (
    <Box
      flexDirection="row"
      justifyContent={justifyContent}
      alignItems={alignItems}
      gap={gap}
      padding={padding}
      paddingX={paddingX}
      paddingY={paddingY}
      flexGrow={flexGrow}
      width={width}
    >
      {children}
    </Box>
  );
}

type ColProps = {
  children: React.ReactNode;
  justifyContent?: "flex-start" | "center" | "space-between" | "flex-end";
  alignItems?: "flex-start" | "center" | "flex-end";
  gap?: number;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  flexGrow?: number;
  width?: number | string;
  height?: number;
};

export function Col({
  children,
  justifyContent,
  alignItems,
  gap,
  padding,
  paddingX,
  paddingY,
  flexGrow,
  width,
  height,
}: ColProps) {
  return (
    <Box
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
    >
      {children}
    </Box>
  );
}