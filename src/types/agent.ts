/**
 * Type definitions and state schemas for the Deep Research Agent
 * 
 * This file defines the core state structure that flows through the LangGraph state machine.
 * The state is immutable and gets transformed as it passes through each node in the graph.
 */

import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

/**
 * Represents a single search result from Tavily
 */
export interface SearchResult {
  /** The title of the search result */
  title: string;
  /** URL to the source */
  url: string;
  /** Text content/snippet from the page */
  content: string;
  /** Relevance score (0-1) */
  score: number;
  /** Timestamp of when this was found */
  timestamp?: string;
}

/**
 * Represents an analysis step in the research process
 */
export interface AnalysisStep {
  /** Name of the step (e.g., "Identify Breaking Changes") */
  step: string;
  /** Findings from this analysis step */
  findings: string;
  /** Confidence level (0-1) */
  confidence: number;
}

/**
 * Final synthesized findings about the migration
 */
export interface MigrationFindings {
  /** Summary of the migration */
  summary: string;
  /** List of key migration steps */
  migrationSteps: string[];
  /** Breaking changes to be aware of */
  breakingChanges: string[];
  /** Code examples or snippets */
  examples?: string[];
  /** List of source URLs */
  sources: string[];
}

/**
 * Current processing status of the agent
 */
export type AgentStatus = 
  | "idle"
  | "parsing_query"
  | "searching"
  | "filtering_results"
  | "analyzing"
  | "synthesizing"
  | "complete"
  | "error";

/**
 * Agent State Schema using LangGraph Annotation
 * 
 * This defines the structure of state that flows through the graph.
 * Each node can read from and write to these fields.
 */
export const AgentStateAnnotation = Annotation.Root({
  /** Original user query */
  query: Annotation<string>,
  
  /** Enhanced/optimized query for search */
  enhancedQuery: Annotation<string | undefined>,
  
  /** Raw search results from Tavily */
  searchResults: Annotation<SearchResult[] | undefined>,
  
  /** Filtered relevant search results */
  relevantResults: Annotation<SearchResult[] | undefined>,
  
  /** Analysis steps performed */
  analysisSteps: Annotation<AnalysisStep[] | undefined>,
  
  /** Final synthesized findings */
  findings: Annotation<MigrationFindings | undefined>,
  
  /** Chat messages for LLM interaction */
  messages: Annotation<BaseMessage[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  
  /** Current status of processing */
  status: Annotation<AgentStatus>({
    reducer: (_, right) => right,
    default: () => "idle" as AgentStatus,
  }),
  
  /** Error message if any */
  error: Annotation<string | undefined>,
  
  /** Number of search attempts (for retry logic) */
  searchAttempts: Annotation<number>({
    reducer: (_, right) => right,
    default: () => 0,
  }),
});

/**
 * TypeScript type inferred from the annotation
 */
export type AgentState = typeof AgentStateAnnotation.State;

