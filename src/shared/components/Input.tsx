import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { theme } from "../theme.js";

type InputVariant = "default" | "error" | "success";

type Props = {
  label?:       string;
  placeholder?: string;
  value:        string;
  onChange:     (value: string) => void;
  onSubmit?:    () => void;
  variant?:     InputVariant;
  disabled?:    boolean;
  width?:       number;
};

const VARIANT_COLORS: Record<InputVariant, { border: string; label: string }> = {
  default: { border: theme.textMuted, label: theme.textSec },
  error:   { border: theme.red,       label: theme.red },
  success: { border: theme.green,     label: theme.green },
};

export function Input({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  onSubmit,
  variant = "default",
  disabled = false,
  width 
}: Props) {
  const colors = VARIANT_COLORS[variant];

  return (
    <Box flexDirection="column" width={width}>
      {label && (
        <Text color={colors.label} bold marginBottom={0}>
          {label}
        </Text>
      )}
      <Box 
        borderStyle="single" 
        borderColor={disabled ? theme.textDim : colors.border}
      >
        <TextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder={placeholder}
          disabled={disabled}
        />
      </Box>
    </Box>
  );
}