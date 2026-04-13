import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

type SpinnerVariant = "primary" | "success" | "warning" | "error";

type Props = {
  label?:    string;
  variant?: SpinnerVariant;
  size?:    number;
};

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const VARIANT_COLORS: Record<SpinnerVariant, string> = {
  primary:  theme.green,
  success:  theme.green,
  warning:  theme.amber,
  error:    theme.red,
};

export function Spinner({ label, variant = "primary", size = 1 }: Props) {
  const [frame, setFrame] = React.useState(0);
  const color = VARIANT_COLORS[variant];

  React.useEffect(() => {
    const id = setInterval(() => {
      setFrame(f => (f + 1) % FRAMES.length);
    }, 80);
    return () => clearInterval(id);
  }, []);

  return (
    <Box flexDirection="row" gap={1}>
      <Text color={color}>{FRAMES[frame]}</Text>
      {label && <Text color={theme.textSec}>{label}</Text>}
    </Box>
  );
}