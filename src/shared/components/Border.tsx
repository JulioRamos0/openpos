import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

type Props = {
  title?:     string;
  subtitle?:  string;
  children:   React.ReactNode;
  width?:     number | string;
  height?:    number;
  active?:    boolean;
  dimBorder?: boolean;
};

export function Border({ title, subtitle, children, width, height, active, dimBorder }: Props) {
  const color = dimBorder ? "gray" : active ? "green" : "#2a4a2a";

  return (
    <Box
      borderStyle={active ? "round" : "single"}
      borderColor={color}
      flexDirection="column"
      width={width}
      height={height}
    >
      {(title || subtitle) && (
        <Box gap={1} marginBottom={0}>
          {title && (
            <Text color={active ? theme.green : theme.textSec} bold={active}>
              {" "}{theme.sym.dot} {title}
            </Text>
          )}
          {subtitle && (
            <Text color={theme.textMuted}>{theme.sym.vbar} {subtitle}</Text>
          )}
        </Box>
      )}
      {children}
    </Box>
  );
}
