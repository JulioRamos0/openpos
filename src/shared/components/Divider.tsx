import React from "react";
import { Text } from "ink";
import { theme } from "../theme.js";

type DividerStyle = "solid" | "dashed" | "dotted";

type Props = {
  width?:   number;
  style?:   DividerStyle;
  color?:   string;
};

const STYLE_CHARS: Record<DividerStyle, string> = {
  solid:   "─",
  dashed:  "┄",
  dotted:  "┅",
};

export function Divider({ width = 30, style = "solid", color }: Props) {
  const char = STYLE_CHARS[style];
  const lineColor = color || theme.textDim;
  
  return (
    <Text color={lineColor}>
      {char.repeat(width)}
    </Text>
  );
}