/**
 * Query Input Component
 * 
 * This component provides an interactive text input for users to enter
 * their migration queries. It includes validation and helpful examples.
 */

import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface QueryInputProps {
  /** Current input value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Callback when user submits (presses Enter) */
  onSubmit: (value: string) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
}

/**
 * Interactive query input component
 */
export function QueryInput({ value, onChange, onSubmit, disabled = false }: QueryInputProps) {
  const handleSubmit = (submittedValue: string) => {
    const trimmed = submittedValue.trim();
    if (trimmed.length > 0) {
      onSubmit(trimmed);
    }
  };

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Enter your migration query:
        </Text>
      </Box>
      
      <Box>
        <Text color="gray">→ </Text>
        {!disabled ? (
          <TextInput
            value={value}
            onChange={onChange}
            onSubmit={handleSubmit}
            placeholder="e.g., Spring Boot 2 to Spring Boot 3"
          />
        ) : (
          <Text dimColor>{value || "Processing..."}</Text>
        )}
      </Box>
      
      {value.length === 0 && !disabled && (
        <Box marginTop={1}>
          <Text dimColor>
            Examples: "Spring Boot 2 to 3" • "React 17 to 18" • "Node.js 16 to 20"
          </Text>
        </Box>
      )}
    </Box>
  );
}

