/**
 * LangGraph State Machine for Deep Research Agent
 * 
 * This file defines the core graph structure that orchestrates the research process.
 * The graph consists of multiple nodes that transform the state as it flows through.
 * 
 * Graph Flow:
 * START → query_parser → search → relevance_filter → deep_analysis → synthesis → END
 * 
 * Conditional edges handle retries and error cases.
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentState, AgentStateAnnotation, SearchResult } from "../types/agent.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import {
  createLLM,
  QUERY_ENHANCEMENT_PROMPT,
  RELEVANCE_FILTER_PROMPT,
  DEEP_ANALYSIS_PROMPT,
  SYNTHESIS_PROMPT,
} from "./llm.js";
import { executeSearch, validateSearchResults } from "./tools/search.js";

/**
 * Node: Parse and enhance the user's query
 * 
 * This node takes the raw user query and uses an LLM to create
 * an optimized search query that's more likely to find relevant documentation.
 */
async function parseQuery(state: AgentState): Promise<Partial<AgentState>> {
  console.log("📝 Parsing query:", state.query);
  
  try {
    const llm = createLLM();
    const prompt = await QUERY_ENHANCEMENT_PROMPT.format({
      query: state.query,
    });
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    const enhancedQuery = response.content.toString().trim();
    
    console.log("✅ Enhanced query:", enhancedQuery);
    
    return {
      enhancedQuery,
      status: "searching",
      messages: [new HumanMessage(state.query), new AIMessage(enhancedQuery)],
    };
  } catch (error) {
    console.error("❌ Query parsing failed:", error);
    return {
      status: "error",
      error: `Query parsing failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Node: Execute search using Tavily
 * 
 * This node performs the actual internet search using the enhanced query.
 * It returns structured search results with URLs, content, and relevance scores.
 */
async function search(state: AgentState): Promise<Partial<AgentState>> {
  const query = state.enhancedQuery || state.query;
  console.log("🔍 Searching for:", query);
  
  try {
    const searchResults = await executeSearch(query);
    
    if (!validateSearchResults(searchResults)) {
      console.warn("⚠️  Search results insufficient");
      
      // If this is the first attempt, try again with modified query
      if (state.searchAttempts < 2) {
        return {
          searchAttempts: state.searchAttempts + 1,
          status: "parsing_query",
          enhancedQuery: `${query} official documentation breaking changes`,
        };
      }
      
      return {
        status: "error",
        error: "Could not find sufficient search results",
      };
    }
    
    console.log(`✅ Found ${searchResults.length} search results`);
    
    return {
      searchResults,
      status: "filtering_results",
    };
  } catch (error) {
    console.error("❌ Search failed:", error);
    return {
      status: "error",
      error: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Node: Filter results by relevance using LLM
 * 
 * This node uses the LLM to intelligently filter search results,
 * keeping only those that are truly relevant to the migration task.
 */
async function filterRelevance(state: AgentState): Promise<Partial<AgentState>> {
  console.log("🔎 Filtering search results for relevance");
  
  if (!state.searchResults || state.searchResults.length === 0) {
    return {
      status: "error",
      error: "No search results to filter",
    };
  }
  
  try {
    const llm = createLLM();
    
    // Format results for LLM
    const resultsText = state.searchResults
      .map((result, idx) => `[${idx}] ${result.title}\nURL: ${result.url}\nContent: ${result.content.substring(0, 300)}...`)
      .join("\n\n");
    
    const prompt = await RELEVANCE_FILTER_PROMPT.format({
      query: state.query,
      results: resultsText,
    });
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    const content = response.content.toString().trim();
    
    // Parse the JSON array of indices
    let relevantIndices: number[];
    try {
      relevantIndices = JSON.parse(content);
    } catch (e) {
      // If parsing fails, use top results by score
      console.warn("Failed to parse relevance filter response, using top results");
      relevantIndices = state.searchResults
        .map((_, idx) => idx)
        .sort((a, b) => state.searchResults![b].score - state.searchResults![a].score)
        .slice(0, 5);
    }
    
    const relevantResults = relevantIndices
      .filter((idx) => idx >= 0 && idx < state.searchResults!.length)
      .map((idx) => state.searchResults![idx]);
    
    console.log(`✅ Filtered to ${relevantResults.length} relevant results`);
    
    return {
      relevantResults,
      status: "analyzing",
    };
  } catch (error) {
    console.error("❌ Relevance filtering failed:", error);
    // Fall back to top results
    const topResults = state.searchResults
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    return {
      relevantResults: topResults,
      status: "analyzing",
    };
  }
}

/**
 * Node: Perform deep analysis on relevant results
 * 
 * This node analyzes each relevant search result to extract
 * structured information: migration steps, breaking changes, examples, etc.
 */
async function analyzeResults(state: AgentState): Promise<Partial<AgentState>> {
  console.log("🔬 Performing deep analysis on results");
  
  if (!state.relevantResults || state.relevantResults.length === 0) {
    return {
      status: "error",
      error: "No relevant results to analyze",
    };
  }
  
  try {
    const llm = createLLM();
    const analysisSteps = [];
    
    // Analyze top 3 results in detail
    const resultsToAnalyze = state.relevantResults.slice(0, 3);
    
    for (const result of resultsToAnalyze) {
      console.log(`  Analyzing: ${result.title}`);
      
      const prompt = await DEEP_ANALYSIS_PROMPT.format({
        query: state.query,
        content: result.content,
      });
      
      const response = await llm.invoke([new HumanMessage(prompt)]);
      const analysis = response.content.toString().trim();
      
      analysisSteps.push({
        step: `Analysis of: ${result.title}`,
        findings: analysis,
        confidence: result.score,
      });
    }
    
    console.log(`✅ Completed ${analysisSteps.length} analyses`);
    
    return {
      analysisSteps,
      status: "synthesizing",
    };
  } catch (error) {
    console.error("❌ Analysis failed:", error);
    return {
      status: "error",
      error: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Node: Synthesize all findings into final guide
 * 
 * This node takes all the analyses and combines them into a
 * coherent, actionable migration guide for the user.
 */
async function synthesizeFindings(state: AgentState): Promise<Partial<AgentState>> {
  console.log("🔧 Synthesizing findings into migration guide");
  
  if (!state.analysisSteps || state.analysisSteps.length === 0) {
    return {
      status: "error",
      error: "No analyses to synthesize",
    };
  }
  
  try {
    const llm = createLLM();
    
    // Combine all analyses
    const analysesText = state.analysisSteps
      .map((step) => `${step.step}:\n${step.findings}`)
      .join("\n\n---\n\n");
    
    const prompt = await SYNTHESIS_PROMPT.format({
      query: state.query,
      sourceCount: state.analysisSteps.length,
      analyses: analysesText,
    });
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    const synthesisJson = response.content.toString().trim();
    
    // Parse the synthesis
    let synthesis;
    try {
      synthesis = JSON.parse(synthesisJson);
    } catch (e) {
      // If JSON parsing fails, create a basic structure
      synthesis = {
        summary: synthesisJson,
        migrationSteps: [],
        breakingChanges: [],
        examples: [],
      };
    }
    
    // Extract source URLs
    const sources = state.relevantResults
      ? state.relevantResults.slice(0, 5).map((r) => r.url)
      : [];
    
    const findings = {
      summary: synthesis.summary || "Migration guide synthesis",
      migrationSteps: synthesis.migrationSteps || [],
      breakingChanges: synthesis.breakingChanges || [],
      examples: synthesis.examples || synthesis.notes || [],
      sources,
    };
    
    console.log("✅ Synthesis complete");
    
    return {
      findings,
      status: "complete",
    };
  } catch (error) {
    console.error("❌ Synthesis failed:", error);
    return {
      status: "error",
      error: `Synthesis failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Build and compile the research agent graph
 * 
 * @returns Compiled graph ready for execution
 */
export function buildResearchGraph() {
  const graph = new StateGraph(AgentStateAnnotation)
    .addNode("query_parser", parseQuery)
    .addNode("search", search)
    .addNode("relevance_filter", filterRelevance)
    .addNode("deep_analysis", analyzeResults)
    .addNode("synthesis", synthesizeFindings);
  
  // Define the flow
  graph.addEdge(START, "query_parser");
  
  // After parsing, go to search
  graph.addConditionalEdges("query_parser", (state: AgentState) => {
    if (state.status === "error") return END;
    return "search";
  });
  
  // After search, check if we need to retry or continue
  graph.addConditionalEdges("search", (state: AgentState) => {
    if (state.status === "error") return END;
    if (state.status === "parsing_query") return "query_parser"; // Retry with new query
    return "relevance_filter";
  });
  
  // After filtering, proceed to analysis
  graph.addConditionalEdges("relevance_filter", (state: AgentState) => {
    if (state.status === "error") return END;
    return "deep_analysis";
  });
  
  // After analysis, proceed to synthesis
  graph.addConditionalEdges("deep_analysis", (state: AgentState) => {
    if (state.status === "error") return END;
    return "synthesis";
  });
  
  // After synthesis, we're done
  graph.addEdge("synthesis", END);
  
  return graph.compile();
}

