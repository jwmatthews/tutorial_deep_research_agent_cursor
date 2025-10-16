# Tutorial 3: Tool Integration with Tavily Search

## Introduction

Tools give LLM agents the ability to interact with the external world. In this tutorial, we'll explore how to integrate the Tavily Search API into our agent, enabling it to search the internet for migration documentation.

## What are Tools in LangChain?

**Tools** are functions that agents can call to perform specific tasks. Common tool types include:

- **Search tools** - Google, Bing, Tavily, etc.
- **APIs** - REST APIs, databases, etc.
- **File operations** - Read/write files
- **Calculators** - Perform computations
- **Custom tools** - Any function you create

## Why Tavily for Research Agents?

**Tavily** is specifically designed for AI agents and offers several advantages:

1. **AI-Optimized Results** - Returns clean, relevant content
2. **Structured Output** - JSON format perfect for parsing
3. **Context-Aware** - Understands research queries
4. **Rate Limit Friendly** - Designed for agent workflows
5. **Comprehensive** - Returns URLs, titles, content, and scores

Traditional search APIs (Google, Bing) require parsing HTML and filtering ads, making them harder to use.

## Setting Up Tavily

### 1. Get API Key

Visit https://tavily.com and sign up for a free account. You'll get an API key that allows several searches per day.

### 2. Install LangChain Integration

```bash
npm install @langchain/community
```

### 3. Configure Environment

```env
TAVILY_API_KEY=tvly-your-key-here
```

## Basic Tavily Integration

### Simple Search

```typescript
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

// Create search tool
const searchTool = new TavilySearchResults({
  maxResults: 5,
  apiKey: process.env.TAVILY_API_KEY,
});

// Execute search
const results = await searchTool.invoke("Spring Boot 3 migration guide");
console.log(results);
```

**Output format:**
```json
[
  {
    "title": "Migrating to Spring Boot 3",
    "url": "https://spring.io/...",
    "content": "Spring Boot 3 requires Java 17...",
    "score": 0.95
  },
  ...
]
```

## Our Search Tool Implementation

Let's examine our implementation in `src/agent/tools/search.ts`:

### 1. Tool Creation

```typescript
export function createSearchTool() {
  return new TavilySearchResults({
    maxResults: 10, // Get more results for filtering
    apiKey: process.env.TAVILY_API_KEY,
    searchDepth: "advanced", // More thorough search
  });
}
```

**Configuration options:**
- `maxResults` - Number of results to return (we use 10 for more options)
- `searchDepth` - "basic" or "advanced" (advanced searches deeper)
- `apiKey` - Your Tavily API key

### 2. Execute Search Function

```typescript
export async function executeSearch(query: string): Promise<SearchResult[]> {
  try {
    const searchTool = createSearchTool();
    
    // Execute the search
    const rawResults = await searchTool.invoke(query);
    
    // Parse results (Tavily returns JSON string)
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
    
    // Filter out low-quality results
    const filteredResults = searchResults.filter(
      (result) => result.content && result.content.length > 50
    );
    
    return filteredResults;
  } catch (error) {
    console.error("Search error:", error);
    throw new Error(`Search failed: ${error.message}`);
  }
}
```

**Key features:**
- Error handling for API failures
- Result parsing and validation
- Filtering of low-quality results
- Structured output format

### 3. Result Structure

We transform Tavily results into our own format:

```typescript
export interface SearchResult {
  title: string;        // Page title
  url: string;          // Source URL
  content: string;      // Text content/snippet
  score: number;        // Relevance score (0-1)
  timestamp?: string;   // When found
}
```

This abstraction allows us to:
- Switch search providers easily
- Add custom metadata
- Ensure consistent structure

## Query Optimization

### Version Extraction

We extract version numbers from queries:

```typescript
export function extractVersions(query: string): { 
  source?: string; 
  target?: string;
} {
  // Pattern: "from X to Y" or "X to Y"
  const pattern = /(?:from\s+)?(\d+(?:\.\d+)*)\s+(?:to|→)\s+(\d+(?:\.\d+)*)/i;
  const match = query.match(pattern);
  
  if (match) {
    return {
      source: match[1],  // e.g., "2"
      target: match[2],  // e.g., "3"
    };
  }
  
  return {};
}

// Usage:
const versions = extractVersions("Spring Boot 2 to 3");
// { source: "2", target: "3" }
```

### Query Enhancement

Add context to improve search results:

```typescript
export function optimizeQueryForMigration(query: string): string {
  const hasMigrationKeyword = /\b(migrat|upgrad|port|transition)\b/i.test(query);
  
  if (!hasMigrationKeyword) {
    return `${query} migration guide upgrade documentation`;
  }
  
  return `${query} official documentation guide`;
}

// Examples:
optimizeQueryForMigration("Spring Boot 2 to 3");
// → "Spring Boot 2 to 3 migration guide upgrade documentation"

optimizeQueryForMigration("React migration 17 to 18");
// → "React migration 17 to 18 official documentation guide"
```

## Result Validation

We validate search results before processing:

```typescript
export function validateSearchResults(results: SearchResult[]): boolean {
  if (results.length === 0) {
    return false;
  }
  
  // Check for at least one high-quality result
  const hasHighQualityResult = results.some(
    (result) => result.score > 0.7 && result.content.length > 200
  );
  
  return hasHighQualityResult;
}
```

**Validation criteria:**
- At least one result exists
- At least one result has score > 0.7
- At least one result has substantial content (> 200 chars)

## Using Search in the Graph

The search node in our graph:

```typescript
async function search(state: AgentState): Promise<Partial<AgentState>> {
  const query = state.enhancedQuery || state.query;
  console.log("🔍 Searching for:", query);
  
  try {
    // Execute search
    const searchResults = await executeSearch(query);
    
    // Validate results
    if (!validateSearchResults(searchResults)) {
      // Retry logic using state
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
    
    // Success - update state
    return {
      searchResults,
      status: "filtering_results",
    };
  } catch (error) {
    return {
      status: "error",
      error: `Search failed: ${error.message}`,
    };
  }
}
```

**Key aspects:**
1. Uses enhanced query if available
2. Executes search with error handling
3. Validates result quality
4. Implements retry logic (up to 2 attempts)
5. Updates state appropriately

## Advanced Search Patterns

### 1. Focused Search

For specific documentation types:

```typescript
async function searchDocumentation(topic: string, docType: string) {
  const query = `${topic} ${docType} site:docs.* OR site:*.org`;
  return await executeSearch(query);
}

// Usage:
await searchDocumentation("Spring Boot 3", "migration guide");
// Searches for migration guides on documentation sites
```

### 2. Multi-Query Search

Search multiple related queries:

```typescript
async function multiSearch(baseQuery: string) {
  const queries = [
    `${baseQuery} official migration guide`,
    `${baseQuery} breaking changes`,
    `${baseQuery} upgrade steps`,
  ];
  
  const allResults = await Promise.all(
    queries.map(q => executeSearch(q))
  );
  
  // Combine and deduplicate
  const combined = allResults.flat();
  const unique = Array.from(
    new Map(combined.map(r => [r.url, r])).values()
  );
  
  return unique;
}
```

### 3. Progressive Search

Start broad, then narrow:

```typescript
async function progressiveSearch(query: string) {
  // Try specific search first
  let results = await executeSearch(`${query} official documentation`);
  
  if (results.length < 3) {
    // Broaden if insufficient
    results = await executeSearch(query);
  }
  
  return results;
}
```

## Error Handling

### API Errors

```typescript
try {
  const results = await executeSearch(query);
} catch (error) {
  if (error.message.includes("rate limit")) {
    // Wait and retry
    await sleep(1000);
    return await executeSearch(query);
  }
  
  if (error.message.includes("authentication")) {
    throw new Error("Invalid Tavily API key");
  }
  
  throw error;
}
```

### Result Errors

```typescript
// Empty results
if (results.length === 0) {
  return {
    status: "error",
    error: "No search results found. Try rephrasing your query.",
  };
}

// Low quality results
if (!validateSearchResults(results)) {
  return {
    status: "error",
    error: "Search results were not relevant enough.",
  };
}
```

## Testing Search

Test your search integration:

```typescript
// test-search.ts
import { executeSearch } from "./src/agent/tools/search";

async function testSearch() {
  const results = await executeSearch("Spring Boot 2 to 3 migration");
  
  console.log(`Found ${results.length} results`);
  
  results.forEach((result, i) => {
    console.log(`\n${i + 1}. ${result.title}`);
    console.log(`   Score: ${result.score}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Content: ${result.content.substring(0, 100)}...`);
  });
}

testSearch();
```

## Key Takeaways

1. **Tavily** is optimized for AI agent search tasks
2. **Tools** extend agent capabilities with external functions
3. **Result validation** ensures quality before processing
4. **Query optimization** improves search relevance
5. **Error handling** makes the agent robust
6. **Structured output** enables easy integration with LLMs

## Next Steps

Now that we can search for information, let's explore how to use LLMs to analyze and synthesize the results.

Continue to: [Tutorial 4: LLM Integration & Prompting](./04-llm-prompting.md)

