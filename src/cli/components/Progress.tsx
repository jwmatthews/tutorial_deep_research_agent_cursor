/**
 * Progress Indicator Component
 * 
 * This component displays the current status of the agent's research process,
 * with a spinner and status message to keep the user informed.
 */

import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { AgentStatus } from "../../types/agent.js";

interface ProgressProps {
  /** Current agent status */
  status: AgentStatus;
  /** Status message to display */
  message: string;
  /** Whether the agent is currently processing */
  isLoading: boolean;
}

/**
 * Progress indicator with spinner and status message
 */
export function Progress({ status, message, isLoading }: ProgressProps) {
  if (!isLoading && status !== "complete") {
    return null;
  }

  const getStatusColor = (status: AgentStatus): string => {
    switch (status) {
      case "complete":
        return "green";
      case "error":
        return "red";
      default:
        return "yellow";
    }
  };

  const statusColor = getStatusColor(status);

  return (
    <Box marginY={1}>
      <Box marginRight={1}>
        {isLoading && status !== "complete" ? (
          <>
            <Text color={statusColor}>
              <Spinner type="dots" />
            </Text>
            <Text> </Text>
          </>
        ) : status === "complete" ? (
          <Text color="green">✓ </Text>
        ) : null}
      </Box>
      <Text color={statusColor}>{message}</Text>
    </Box>
  );
}

interface StepIndicatorProps {
  /** List of steps with their completion status */
  steps: Array<{
    name: string;
    status: "pending" | "active" | "complete" | "error";
  }>;
}

/**
 * Visual indicator showing progress through multiple steps
 */
export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <Box flexDirection="column" marginY={1}>
      {steps.map((step, index) => {
        const getIcon = () => {
          switch (step.status) {
            case "complete":
              return <Text color="green">✓</Text>;
            case "active":
              return (
                <Text color="yellow">
                  <Spinner type="dots" />
                </Text>
              );
            case "error":
              return <Text color="red">✗</Text>;
            default:
              return <Text dimColor>○</Text>;
          }
        };

        const getColor = () => {
          switch (step.status) {
            case "complete":
              return "green";
            case "active":
              return "yellow";
            case "error":
              return "red";
            default:
              return "gray";
          }
        };

        return (
          <Box key={index}>
            <Box marginRight={1}>{getIcon()}</Box>
            <Text color={getColor()}>{step.name}</Text>
          </Box>
        );
      })}
    </Box>
  );
}

