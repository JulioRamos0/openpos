import React from "react";
import { Text } from "ink";
import { theme } from "../theme.js";

type Props = {
  children: React.ReactNode;
  color?: string;
  bold?:   boolean;
  dim?:    boolean;
};

const COLOR_MAP: Record<string, string> = {
  primary: theme.green,
  secondary: theme.textSec,
  muted: theme.textMuted,
  dim: theme.textDim,
  white: theme.white,
  success: theme.green,
  warning: theme.amber,
  error: theme.red,
  info: theme.blue,
};

export function Text_({ children, color, bold, dim }: Props) {
  const textColor = color ? (COLOR_MAP[color] || color) : theme.textPri;
  
  return (
    <Text color={textColor} bold={bold} dim={dim}>
      {children}
    </Text>
  );
}