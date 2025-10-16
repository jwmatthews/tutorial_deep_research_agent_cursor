/**
 * Custom React Hook for Agent Integration
 * 
 * This hook manages the state and lifecycle of agent research queries.
 * It handles executing queries, tracking progress, and managing results.
 */

import { useState, useCallback } from "react";
import { AgentState, AgentStatus } from "../../types/agent.js";
import { executeResearchStreaming } from "../../agent/index.js";

interface UseAgentResult {
  /** Current agent state */
  state: AgentState | null;
  /** Whether a query is currently running */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Execute a research query */
  executeQuery: (query: string) => Promise<void>;
  /** Reset the agent state */
  reset: () => void;
  /** Current status message for display */
  statusMessage: string;
}

/**
 * Custom hook for managing agent interactions
 */
export function useAgent(): UseAgentResult {
  const [state, setState] = useState<AgentState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Execute a research query with streaming updates
   */
  const executeQuery = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    setState(null);

    try {
      await executeResearchStreaming(query, (updatedState) => {
        setState(updatedState);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset the agent state
   */
  const reset = useCallback(() => {
    setState(null);
    setError(null);
    setIsLoading(false);
  }, []);

  /**
   * Get a user-friendly status message based on current status
   */
  const getStatusMessage = (status: AgentStatus | undefined): string => {
    if (!status) return "";
    
    switch (status) {
      case "idle":
        return "Ready";
      case "parsing_query":
        return "Understanding your query...";
      case "searching":
        return "Searching the internet for migration guides...";
      case "filtering_results":
        return "Filtering relevant results...";
      case "analyzing":
        return "Analyzing documentation...";
      case "synthesizing":
        return "Creating your migration guide...";
      case "complete":
        return "Complete!";
      case "error":
        return "Error occurred";
      default:
        return "";
    }
  };

  const statusMessage = getStatusMessage(state?.status);

  return {
    state,
    isLoading,
    error,
    executeQuery,
    reset,
    statusMessage,
  };
}

