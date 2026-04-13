import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

type PanelVariant = "default" | "primary";

type Props = {
  children?: React.ReactNode;
  title?: string;
  variant?: PanelVariant;
  width?: number;
  height?: number;
  scrollable?: boolean;
};

const BORDER_COLOR = {
  default: theme.textMuted,
  primary: theme.green,
};

export function Panel({ 
  children, 
  title, 
  variant = "default",
  width,
  height,
  scrollable = false
}: Props) {
  const borderColor = BORDER_COLOR[variant];
  const innerW = width ? width - 2 : undefined;
  
  const titleH = title ? 1 : 0;
  const contentH = height ? height - 1 - titleH : undefined;

  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Top border */}
      <Box>
        <Text color={borderColor}>┌</Text>
        {width && <Text color={borderColor}>{"─".repeat(innerW!)}</Text>}
        <Text color={borderColor}>┐</Text>
      </Box>
      
      {/* Title */}
      {title && (
        <Box>
          <Text color={borderColor}>│</Text>
          <Text color={theme.white} bold> {title} </Text>
          {width && <Text color={borderColor}>{" ".repeat(innerW! - title.length - 3)}</Text>}
          <Text color={borderColor}>│</Text>
        </Box>
      )}
      
      {/* Middle border if has title */}
      {title && (
        <Box>
          <Text color={borderColor}>├</Text>
          {width && <Text color={borderColor}>{"─".repeat(innerW!)}</Text>}
          <Text color={borderColor}>┤</Text>
        </Box>
      )}
      
      {/* Content */}
      <Box flexDirection="column" flexGrow={contentH ? 0 : 1} height={contentH}>
        {children}
      </Box>

      {/* Bottom border */}
      <Box>
        <Text color={borderColor}>└</Text>
        {width && <Text color={borderColor}>{"─".repeat(innerW!)}</Text>}
        <Text color={borderColor}>┘</Text>
      </Box>
    </Box>
  );
}

type ScrollBoxProps = {
  children: React.ReactNode;
  height: number;
  width?: number;
  showScrollbar?: boolean;
  cursor?: number;
  itemCount?: number;
};

export function ScrollBox({ 
  children, 
  height, 
  width,
  showScrollbar = false,
  cursor = 0,
  itemCount = 0
}: ScrollBoxProps) {
  const scrollbarWidth = 1;
  const contentWidth = width ? width - scrollbarWidth - 1 : undefined;
  
  return (
    <Box flexDirection="row" flexGrow={1}>
      <Box flexDirection="column" flexGrow={1} width={contentWidth}>
        {children}
      </Box>
      
      {/* Scrollbar */}
      {showScrollbar && itemCount > height - 4 && (
        <Box flexDirection="column">
          {Array(height - 2).fill(0).map((_, i) => {
            const ratio = i / (height - 3);
            const isCursor = Math.floor(ratio * Math.min(itemCount, height - 4)) === cursor;
            return (
              <Text key={i} color={isCursor ? theme.green : theme.textDim}>
                │
              </Text>
            );
          })}
        </Box>
      )}
    </Box>
  );
}