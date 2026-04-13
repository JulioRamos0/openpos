import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

type BadgeVariant = "success" | "warning" | "error" | "info" | "default";

type Props = {
  text:     string;
  variant?: BadgeVariant;
};

const VARIANT_STYLES: Record<BadgeVariant, { color: string; prefix: string }> = {
  success:  { color: theme.green,  prefix: "●" },
  warning:  { color: theme.amber,  prefix: "●" },
  error:    { color: theme.red,    prefix: "●" },
  info:     { color: theme.blue,   prefix: "●" },
  default:  { color: theme.textSec, prefix: "○" },
};

export function Badge({ text, variant = "default" }: Props) {
  const style = VARIANT_STYLES[variant];

  return (
    <Text color={style.color}>
      {style.prefix} {text}
    </Text>
  );
}