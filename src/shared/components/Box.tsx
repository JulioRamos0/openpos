import React from "react";
import { Box as InkBox, Text } from "ink";
import { theme } from "../theme.js";

type BoxVariant = "default" | "panel" | "section" | "active" | "header" | "accent";

type Props = {
  children?: React.ReactNode;
  variant?: BoxVariant;
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

const VARIANT_BG: Record<BoxVariant, string> = {
  default:  theme.bgPanel,
  panel:    theme.bgPanel,
  section:  theme.bgSection,
  active:   theme.bgActive,
  header:   theme.green,
  accent:   theme.bgActive,
};

export function BgBox({
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
  const bgHex = VARIANT_BG[variant];
  const ansiBg = theme.ansi.bg(bgHex);

  if (variant === "header") {
    return (
      <InkBox
        flexDirection={flexDirection}
        justifyContent={justifyContent}
        alignItems={alignItems}
        gap={gap}
        flexGrow={flexGrow}
        width={width}
        height={height}
        padding={padding}
        paddingX={paddingX}
        paddingY={paddingY}
      >
        <Text>{ansiBg}</Text>
        <InkBox flexGrow={1} width={width}>{children}</InkBox>
        <Text>{theme.ansi.reset}</Text>
      </InkBox>
    );
  }

  return (
    <InkBox
      flexDirection={flexDirection}
      justifyContent={justifyContent}
      alignItems={alignItems}
      gap={gap}
      flexGrow={flexGrow}
      width={width}
      height={height}
      padding={padding}
      paddingX={paddingX}
      paddingY={paddingY}
    >
      <Text>{ansiBg}</Text>
      <InkBox flexGrow={1} width={width}>{children}</InkBox>
      <Text>{theme.ansi.reset}</Text>
    </InkBox>
  );
}

type RowProps = {
  children: React.ReactNode;
  variant?: BoxVariant;
  justifyContent?: "flex-start" | "center" | "space-between" | "flex-end";
  alignItems?: "flex-start" | "center" | "flex-end";
  gap?: number;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  flexGrow?: number;
  width?: number | string;
};

export function BgRow({
  children,
  variant = "default",
  justifyContent,
  alignItems,
  gap,
  padding,
  paddingX,
  paddingY,
  flexGrow,
  width,
}: RowProps) {
  const bgHex = VARIANT_BG[variant];
  const ansiBg = theme.ansi.bg(bgHex);

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
    >
      <Text>{ansiBg}</Text>
      <InkBox flexGrow={1}>{children}</InkBox>
      <Text>{theme.ansi.reset}</Text>
    </InkBox>
  );
}

type ColProps = {
  children: React.ReactNode;
  variant?: BoxVariant;
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

export function BgCol({
  children,
  variant = "default",
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
  const bgHex = VARIANT_BG[variant];
  const ansiBg = theme.ansi.bg(bgHex);

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
    >
      <Text>{ansiBg}</Text>
      <InkBox flexGrow={1} width={width} height={height}>{children}</InkBox>
      <Text>{theme.ansi.reset}</Text>
    </InkBox>
  );
}