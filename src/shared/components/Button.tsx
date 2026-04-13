import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";

type Props = {
  children:  React.ReactNode;
  variant?:  ButtonVariant;
  disabled?: boolean;
  loading?:  boolean;
  onPress?:  () => void;
  width?:    number | string;
  fullWidth?: boolean;
};

const VARIANT_COLORS: Record<ButtonVariant, { bg: string; text: string; border: string }> = {
  primary:   { bg: theme.green,    text: theme.bg,      border: theme.green    },
  secondary: { bg: theme.bgActive, text: theme.textPri, border: theme.textMuted },
  danger:    { bg: theme.red,      text: theme.white,   border: theme.red      },
  success:   { bg: theme.green,    text: theme.bg,      border: theme.green    },
  ghost:     { bg: "transparent", text: theme.textSec, border: "transparent" },
};

export function Button({ 
  children, 
  variant = "primary", 
  disabled = false, 
  loading = false,
  onPress,
  width,
  fullWidth = false
}: Props) {
  const colors = VARIANT_COLORS[variant];
  const isDisabled = disabled || loading;

  const content = loading ? (
    <Text color={colors.text}>...</Text>
  ) : (
    <Text color={colors.text} bold>{children}</Text>
  );

  return (
    <Box
      alignItems="center"
      justifyContent="center"
      paddingX={2}
      paddingY={0}
      borderStyle="single"
      borderColor={isDisabled ? theme.textDim : colors.border}
      backgroundColor={isDisabled ? theme.bgSection : colors.bg}
      width={fullWidth ? "100%" : width}
      opacity={isDisabled ? 0.5 : 1}
    >
      {content}
    </Box>
  );
}