/**
 * Tavily Search Tool Integration
 * 
 * This module integrates Tavily's search API to find relevant documentation
 * and migration guides on the internet. Tavily is specifically designed for
 * AI agents and provides clean, relevant search results.
 */

import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { SearchResult } from "../../types/agent.js";

/**
 * Initialize the Tavily search tool
 */
export function createSearchTool() {
  return new TavilySearchResults({
    maxResults: 10,
    apiKey: process.env.TAVILY_API_KEY,
  });
}

/**
 * Execute a search query using Tavily and return structured results
 * 
 * @param query - The search query
 * @returns Array of structured search results
 * @throws Error if search fails
 */
export async function executeSearch(query: string): Promise<SearchResult[]> {
  try {
    const searchTool = createSearchTool();
    
    // Execute the search
    const rawResults = await searchTool.invoke(query);
    
    // Parse the results (Tavily returns JSON string)
    let results: any[];
    try {
      results = JSON.parse(rawResults);
    } catch (e) {
      console.error("Failed to parse search results:", rawResults);
      throw new Error("Invalid search results format");
    }
    
    // Transform to our SearchResult format
    const searchResults: SearchResult[] = results.map((result, index) => ({
      title: result.title || `Result ${index + 1}`,
      url: result.url || "",
      content: result.content || result.snippet || "",
      score: result.score || 0.5,
      timestamp: new Date().toISOString(),
    }));
    
    // Filter out results with empty content
    const filteredResults = searchResults.filter(
      (result) => result.content && result.content.length > 50
    );
    
    console.log(`Search completed: Found ${filteredResults.length} relevant results`);
    
    return filteredResults;
  } catch (error) {
    console.error("Search error:", error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Optimize a query for finding migration documentation
 * 
 * This adds helpful context to queries to improve search results
 * 
 * @param query - Original user query
 * @returns Optimized query string
 */
export function optimizeQueryForMigration(query: string): string {
  // Check if query already mentions migration/upgrade
  const hasMigrationKeyword = /\b(migrat|upgrad|port|transition|move)\b/i.test(query);
  
  if (!hasMigrationKeyword) {
    return `${query} migration guide upgrade documentation`;
  }
  
  return `${query} official documentation guide`;
}

/**
 * Extract version numbers from a query
 * 
 * @param query - Search query
 * @returns Object with source and target versions if found
 */
export function extractVersions(query: string): { source?: string; target?: string } {
  // Pattern: "from X to Y" or "X to Y"
  const transitionPattern = /(?:from\s+)?(\d+(?:\.\d+)*)\s+(?:to|→)\s+(\d+(?:\.\d+)*)/i;
  const match = query.match(transitionPattern);
  
  if (match) {
    return {
      source: match[1],
      target: match[2],
    };
  }
  
  return {};
}

/**
 * Validate search results to ensure they're useful
 * 
 * @param results - Search results to validate
 * @returns True if results are sufficient
 */
export function validateSearchResults(results: SearchResult[]): boolean {
  if (results.length === 0) {
    return false;
  }
  
  // Check if we have at least one high-quality result
  const hasHighQualityResult = results.some(
    (result) => result.score > 0.7 && result.content.length > 200
  );
  
  return hasHighQualityResult;
}

