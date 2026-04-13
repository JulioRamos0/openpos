import React from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.js";

type Props = {
  isOpen:    boolean;
  title:     string;
  onClose:   () => void;
  children:  React.ReactNode;
  width?:    number;
};

export function Modal({ isOpen, title, onClose, children, width = 40 }: Props) {
  useInput((_, key) => {
    if (key.escape) onClose();
  });

  if (!isOpen) return null;

  return (
    <Box position="absolute" top={0} left={0}>
      <Box
        flexDirection="column"
        width={width}
        borderStyle="round"
        borderColor={theme.green}
      >
        <Box justifyContent="space-between" paddingX={1} paddingY={0}>
          <Text bold color={theme.green}>{title}</Text>
          <Text color={theme.textMuted}>esc</Text>
        </Box>
        <Box padding={1}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}