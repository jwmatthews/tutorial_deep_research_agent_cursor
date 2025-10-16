/**
 * Deep Research Agent - Main Entry Point
 * 
 * This module provides the public API for interacting with the research agent.
 * It compiles the graph and provides methods for executing research queries.
 */

import { buildResearchGraph } from "./graph.js";
import { AgentState } from "../types/agent.js";

/**
 * The compiled research agent graph
 */
let agentGraph: ReturnType<typeof buildResearchGraph> | null = null;

/**
 * Initialize the research agent
 * 
 * This compiles the LangGraph state machine and prepares it for execution.
 * Should be called once before using the agent.
 */
export function initializeAgent(): ReturnType<typeof buildResearchGraph> {
  if (!agentGraph) {
    console.log("🚀 Initializing Deep Research Agent...");
    agentGraph = buildResearchGraph();
    console.log("✅ Agent initialized successfully");
  }
  return agentGraph;
}

/**
 * Execute a research query
 * 
 * This is the main method for running the agent. It takes a user query
 * and returns the complete research findings.
 * 
 * @param query - The migration query (e.g., "Spring Boot 2 to 3")
 * @returns The final agent state with findings
 * @throws Error if agent execution fails
 */
export async function executeResearch(query: string): Promise<AgentState> {
  const graph = initializeAgent();
  
  console.log("\n" + "=".repeat(60));
  console.log(`🔬 Starting research for: "${query}"`);
  console.log("=".repeat(60) + "\n");
  
  try {
    // Initialize state
    const initialState: Partial<AgentState> = {
      query,
      status: "parsing_query",
      searchAttempts: 0,
    };
    
    // Invoke the graph
    const finalState = await graph.invoke(initialState);
    
    if (finalState.status === "error") {
      throw new Error(finalState.error || "Unknown error occurred");
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ Research complete!");
    console.log("=".repeat(60) + "\n");
    
    return finalState;
  } catch (error) {
    console.error("\n❌ Research failed:", error);
    throw error;
  }
}

/**
 * Execute research with streaming updates
 * 
 * This method allows you to receive intermediate state updates as the
 * agent progresses through the graph. Useful for showing real-time progress.
 * 
 * @param query - The migration query
 * @param onUpdate - Callback function called with each state update
 * @returns The final agent state with findings
 */
export async function executeResearchStreaming(
  query: string,
  onUpdate: (state: AgentState) => void
): Promise<AgentState> {
  const graph = initializeAgent();
  
  console.log("\n" + "=".repeat(60));
  console.log(`🔬 Starting research for: "${query}"`);
  console.log("=".repeat(60) + "\n");
  
  try {
    const initialState: Partial<AgentState> = {
      query,
      status: "parsing_query",
      searchAttempts: 0,
    };
    
    // Stream the graph execution
    let finalState: AgentState | null = null;
    
    for await (const state of await graph.stream(initialState)) {
      // The state comes back as { [nodeName]: partialState }
      // Extract the actual state from the last node
      const values = Object.values(state)[0] as AgentState;
      if (values) {
        finalState = values;
        onUpdate(values);
      }
    }
    
    if (!finalState) {
      throw new Error("Graph execution produced no final state");
    }
    
    if (finalState.status === "error") {
      throw new Error(finalState.error || "Unknown error occurred");
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ Research complete!");
    console.log("=".repeat(60) + "\n");
    
    return finalState;
  } catch (error) {
    console.error("\n❌ Research failed:", error);
    throw error;
  }
}

/**
 * Validate environment configuration
 * 
 * Checks that all required API keys and configuration are present.
 * 
 * @throws Error if configuration is invalid
 */
export function validateEnvironment() {
  const required = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
  };
  
  const missing: string[] = [];
  
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
      "Please create a .env file with these variables. See .env.example for details."
    );
  }
  
  console.log("✅ Environment configuration valid");
}

