/**
 * Results Display Component
 * 
 * This component formats and displays the final research findings
 * in a clear, readable format with proper styling and organization.
 */

import React from "react";
import { Box, Text } from "ink";
import { MigrationFindings } from "../../types/agent.js";

interface ResultsProps {
  /** The migration findings to display */
  findings: MigrationFindings;
}

/**
 * Display the complete migration guide results
 */
export function Results({ findings }: ResultsProps) {
  return (
    <Box flexDirection="column" marginTop={1}>
      {/* Summary Section */}
      <Box flexDirection="column" marginBottom={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            📋 Summary
          </Text>
        </Box>
        <Box paddingLeft={2}>
          <Text>{findings.summary}</Text>
        </Box>
      </Box>

      {/* Migration Steps Section */}
      {findings.migrationSteps.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}>
            <Text bold color="cyan">
              🔄 Migration Steps
            </Text>
          </Box>
          <Box flexDirection="column" paddingLeft={2}>
            {findings.migrationSteps.map((step, index) => (
              <Box key={index} marginBottom={1}>
                <Text color="yellow">{index + 1}. </Text>
                <Text>{step}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Breaking Changes Section */}
      {findings.breakingChanges.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}>
            <Text bold color="red">
              ⚠️  Breaking Changes
            </Text>
          </Box>
          <Box flexDirection="column" paddingLeft={2}>
            {findings.breakingChanges.map((change, index) => (
              <Box key={index} marginBottom={1}>
                <Text color="red">• </Text>
                <Text>{change}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Examples Section */}
      {findings.examples && findings.examples.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}>
            <Text bold color="green">
              💡 Examples & Notes
            </Text>
          </Box>
          <Box flexDirection="column" paddingLeft={2}>
            {findings.examples.map((example, index) => (
              <Box key={index} marginBottom={1}>
                <Text color="green">• </Text>
                <Text>{example}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Sources Section */}
      {findings.sources.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Box marginBottom={1}>
            <Text bold color="magenta">
              🔗 Sources
            </Text>
          </Box>
          <Box flexDirection="column" paddingLeft={2}>
            {findings.sources.map((source, index) => (
              <Box key={index}>
                <Text dimColor>{index + 1}. </Text>
                <Text color="blue">{source}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

/**
 * Display an error message
 */
export function ErrorDisplay({ error }: { error: string }) {
  return (
    <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="red" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="red">
          ❌ Error
        </Text>
      </Box>
      <Text color="red">{error}</Text>
    </Box>
  );
}

/**
 * Display a welcome message with instructions
 */
export function Welcome() {
  return (
    <Box flexDirection="column" marginY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          🔬 Deep Research Agent
        </Text>
      </Box>
      <Text dimColor>
        I help you find comprehensive migration guides for software upgrades.
      </Text>
      <Box marginTop={1}>
        <Text dimColor>
          Simply enter what you want to migrate (e.g., "Spring Boot 2 to 3") and I'll search
        </Text>
      </Box>
      <Box>
        <Text dimColor>
          the internet for official documentation, breaking changes, and migration steps.
        </Text>
      </Box>
    </Box>
  );
}

