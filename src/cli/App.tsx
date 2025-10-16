/**
 * Main CLI Application Component
 * 
 * This is the root React component for the CLI interface.
 * It orchestrates the UI, handles user input, and displays results.
 */

import React, { useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { QueryInput } from "./components/QueryInput.js";
import { Progress } from "./components/Progress.js";
import { Results, ErrorDisplay, Welcome } from "./components/Results.js";
import { useAgent } from "./hooks/useAgent.js";

/**
 * Main App Component
 */
export function App() {
  const { exit } = useApp();
  const [query, setQuery] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { state, isLoading, error, executeQuery, reset, statusMessage } = useAgent();

  // Handle keyboard shortcuts
  useInput((input: string, key: any) => {
    // Ctrl+C to exit
    if (key.ctrl && input === "c") {
      exit();
    }
    
    // Ctrl+R to reset and start new query
    if (key.ctrl && input === "r" && !isLoading) {
      reset();
      setQuery("");
      setHasSubmitted(false);
    }
  });

  const handleSubmit = async (submittedQuery: string) => {
    setHasSubmitted(true);
    await executeQuery(submittedQuery);
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box flexDirection="column" marginBottom={1}>
        <Box borderStyle="round" borderColor="cyan" padding={1}>
          <Text bold color="cyan">
            🔬 DEEP RESEARCH AGENT - Migration Guide Finder
          </Text>
        </Box>
      </Box>

      {/* Welcome message (only shown initially) */}
      {!hasSubmitted && <Welcome />}

      {/* Query Input (disabled when loading) */}
      {!hasSubmitted && (
        <QueryInput
          value={query}
          onChange={setQuery}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
      )}

      {/* Show the submitted query */}
      {hasSubmitted && state && (
        <Box marginBottom={1}>
          <Text dimColor>Query: </Text>
          <Text bold>{state.query}</Text>
        </Box>
      )}

      {/* Progress Indicator */}
      {isLoading && state && (
        <Progress
          status={state.status}
          message={statusMessage}
          isLoading={isLoading}
        />
      )}

      {/* Results */}
      {state?.findings && !isLoading && (
        <Results findings={state.findings} />
      )}

      {/* Error Display */}
      {error && <ErrorDisplay error={error} />}

      {/* Footer with instructions */}
      <Box marginTop={1} paddingTop={1} borderStyle="single" borderColor="gray">
        <Text dimColor>
          {!hasSubmitted || (!isLoading && state?.status === "complete")
            ? "Press Ctrl+R for new query • "
            : ""}
          Press Ctrl+C to exit
        </Text>
      </Box>
    </Box>
  );
}

