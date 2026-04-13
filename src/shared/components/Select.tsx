import React from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.js";

type Option = { label: string; value: string };

type Props = {
  label?:     string;
  options:    Option[];
  selected?:  string;
  onChange:   (value: string) => void;
  active?:    boolean;
};

export function Select({ label, options, selected, onChange, active = false }: Props) {
  const [cursor, setCursor] = React.useState(
    options.findIndex(o => o.value === selected) || 0
  );

  useInput((input, key) => {
    if (!active) return;
    if (key.upArrow || input === "1")   setCursor(c => Math.max(0, c - 1));
    if (key.downArrow || input === "2") setCursor(c => Math.min(options.length - 1, c + 1));
    if (key.return || input === "4")    onChange(options[cursor]!.value);
  });

  return (
    <Box flexDirection="column">
      {label && (
        <Text color={theme.textSec} bold marginBottom={0}>
          {label}
        </Text>
      )}
      {options.map((opt, i) => {
        const isSelected = opt.value === selected;
        const isCursor = i === cursor && active;
        return (
          <Box key={opt.value} flexDirection="row" gap={1}>
            <Text color={isCursor ? theme.green : theme.textMuted}>
              {isCursor ? "›" : " "}
            </Text>
            <Text 
              color={isSelected ? theme.green : isCursor ? theme.white : theme.textSec}
              bold={isSelected}
            >
              {opt.label}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}