import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

type Props = {
  children:     React.ReactNode;
  title?:       string;
  subtitle?:    string;
  padding?:     number;
  borderStyle?: "single" | "double" | "round" | "bold";
  borderColor?: string;
};

export function Card({ 
  children, 
  title, 
  subtitle, 
  padding = 1,
  borderStyle = "single",
  borderColor = theme.textMuted
}: Props) {
  return (
    <Box flexDirection="column" borderStyle={borderStyle} borderColor={borderColor}>
      {(title || subtitle) && (
        <Box flexDirection="column" paddingX={padding} paddingBottom={0}>
          {title && (
            <Text bold color={theme.textPri}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text color={theme.textMuted}>
              {subtitle}
            </Text>
          )}
        </Box>
      )}
      <Box padding={padding}>
        {children}
      </Box>
    </Box>
  );
}