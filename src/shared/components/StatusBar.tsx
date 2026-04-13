import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

type StatusVariant = "info" | "success" | "warning" | "error" | "neutral";

type Props = {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  variant?: StatusVariant;
};

const VARIANT_COLORS: Record<StatusVariant, string> = {
  info:    theme.blue,
  success: theme.green,
  warning: theme.amber,
  error:   theme.red,
  neutral: theme.textSec,
};

export function StatusBar({ left, center, right, variant = "neutral" }: Props) {
  const color = VARIANT_COLORS[variant];

  return (
    <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
      {/* Left section */}
      <Box flexDirection="row" gap={1}>
        {left || (
          <>
            <Text color={theme.green}>●</Text>
            <Text color={theme.textSec}>Online</Text>
            <Text color={theme.textDim}>│</Text>
            <Text color={theme.textMuted}>admin</Text>
          </>
        )}
      </Box>

      {/* Center section */}
      <Box flexDirection="row" gap={2}>
        {center || (
          <>
            <Text color={theme.textMuted}>Tab</Text>
            <Text color={theme.textMuted}>/</Text>
            <Text color={theme.textMuted}>p</Text>
            <Text color={theme.textMuted}>Ctrl+Q</Text>
          </>
        )}
      </Box>

      {/* Right section */}
      <Box>
        {right || <Text color={color}>Listo para vender</Text>}
      </Box>
    </Box>
  );
}

type ShortcutProps = {
  keys: string;
  action: string;
};

export function Shortcut({ keys, action }: ShortcutProps) {
  return (
    <Box flexDirection="row" gap={1}>
      <Text color={theme.white}>{keys}</Text>
      <Text color={theme.textMuted}>{action}</Text>
    </Box>
  );
}