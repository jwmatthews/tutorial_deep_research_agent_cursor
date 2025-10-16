/**
 * LLM Configuration and Prompt Templates
 * 
 * This module handles OpenAI integration and defines all prompt templates
 * used throughout the agent. Prompts are carefully crafted to extract
 * structured information about software migrations.
 */

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

/**
 * Initialize the OpenAI LLM with configuration
 */
export function createLLM(streaming: boolean = false) {
  return new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || "gpt-4",
    temperature: 0.1, // Low temperature for more consistent, factual responses
    streaming,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Prompt for enhancing user queries to better search terms
 * 
 * This prompt transforms user queries into optimal search queries
 * by adding context about migration guides, documentation, etc.
 */
export const QUERY_ENHANCEMENT_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert at formulating search queries for finding software migration guides and documentation.
Your task is to transform a user's migration query into an optimized search query that will find the best documentation.

Guidelines:
- Focus on official documentation, migration guides, and upgrade guides
- Include version numbers explicitly
- Add terms like "migration guide", "upgrade guide", "breaking changes"
- Keep it concise but specific
- Return ONLY the enhanced query, nothing else`
  ],
  ["human", "User query: {query}\n\nEnhanced search query:"],
]);

/**
 * Prompt for filtering search results by relevance
 * 
 * This prompt helps identify which search results are actually relevant
 * to the migration task at hand.
 */
export const RELEVANCE_FILTER_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert at evaluating search results for software migration documentation.
Given a migration query and a list of search results, identify which results are most relevant.

A result is relevant if it:
- Contains official migration or upgrade documentation
- Discusses breaking changes between versions
- Provides code examples for migration
- Comes from official or authoritative sources

Return a JSON array of indices (0-based) of the relevant results, ordered by relevance.
Return ONLY the JSON array, nothing else. Example: [0, 2, 5]`
  ],
  [
    "human",
    `Query: {query}

Search Results:
{results}

Relevant result indices (JSON array):`,
  ],
]);

/**
 * Prompt for deep analysis of migration documentation
 * 
 * This prompt extracts structured information from the documentation:
 * migration steps, breaking changes, examples, etc.
 */
export const DEEP_ANALYSIS_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert software engineer specializing in analyzing migration documentation.
Your task is to extract and structure key information from migration documentation.

Extract the following:
1. Key migration steps (in order)
2. Breaking changes and their impact
3. Code examples or patterns (if available)
4. Important warnings or gotchas

Return your analysis in the following JSON format:
{{
  "migrationSteps": ["step 1", "step 2", ...],
  "breakingChanges": ["change 1", "change 2", ...],
  "examples": ["example 1", "example 2", ...],
  "warnings": ["warning 1", "warning 2", ...]
}}

Be specific and actionable. Return ONLY valid JSON, nothing else.`
  ],
  [
    "human",
    `Migration Query: {query}

Documentation Content:
{content}

Analysis (JSON):`,
  ],
]);

/**
 * Prompt for synthesizing all findings into a coherent guide
 * 
 * This prompt takes all the analysis from multiple sources and creates
 * a unified, well-structured migration guide.
 */
export const SYNTHESIS_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert technical writer specializing in software migration guides.
Your task is to synthesize information from multiple sources into a clear, actionable migration guide.

Create a comprehensive guide that includes:
1. A brief summary of the migration
2. Ordered list of migration steps
3. Breaking changes to be aware of
4. Code examples where available
5. Important notes and warnings

Format your response as JSON:
{{
  "summary": "Brief overview of the migration...",
  "migrationSteps": ["Step 1: ...", "Step 2: ..."],
  "breakingChanges": ["Breaking change 1: ...", "Breaking change 2: ..."],
  "examples": ["Example 1: ...", "Example 2: ..."],
  "notes": ["Note 1: ...", "Note 2: ..."]
}}

Be clear, concise, and actionable. Return ONLY valid JSON, nothing else.`
  ],
  [
    "human",
    `Migration Query: {query}

Analyzed Documentation from {sourceCount} sources:
{analyses}

Synthesized Guide (JSON):`,
  ],
]);

