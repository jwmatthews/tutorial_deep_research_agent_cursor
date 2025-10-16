# Tutorial 9: Extending & Customizing the Agent

## Introduction

This tutorial shows how to extend the Deep Research Agent with new capabilities. You'll learn to add new tools, create custom nodes, modify prompts, and customize the UI.

## Adding New Tools

### Example: GitHub API Integration

Let's add a tool to search GitHub for migration examples:

**Step 1: Create the tool**

```typescript
// src/agent/tools/github.ts
export interface GitHubSearchResult {
  repository: string;
  filePath: string;
  code: string;
  url: string;
}

export async function searchGitHub(query: string): Promise<GitHubSearchResult[]> {
  const response = await fetch(
    `https://api.github.com/search/code?q=${encodeURIComponent(query)}`,
    {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  );
  
  const data = await response.json();
  
  return data.items.map(item => ({
    repository: item.repository.full_name,
    filePath: item.path,
    code: item.text_matches?.[0]?.fragment || '',
    url: item.html_url,
  }));
}
```

**Step 2: Add a new graph node**

```typescript
// src/agent/graph.ts
async function searchCodeExamples(state: AgentState): Promise<Partial<AgentState>> {
  console.log("🔍 Searching GitHub for code examples");
  
  try {
    // Extract key terms from query
    const searchQuery = `${state.query} migration example`;
    
    const codeExamples = await searchGitHub(searchQuery);
    
    return {
      codeExamples,
      status: "analyzing",
    };
  } catch (error) {
    console.warn("GitHub search failed, continuing without code examples");
    return { codeExamples: [] };
  }
}
```

**Step 3: Add to graph**

```typescript
export function buildResearchGraph() {
  const graph = new StateGraph(AgentStateAnnotation)
    .addNode("query_parser", parseQuery)
    .addNode("search", search)
    .addNode("relevance_filter", filterRelevance)
    .addNode("code_examples", searchCodeExamples)  // NEW
    .addNode("deep_analysis", analyzeResults)
    .addNode("synthesis", synthesizeFindings);
  
  // Update edges
  graph.addEdge(START, "query_parser");
  graph.addEdge("query_parser", "search");
  graph.addEdge("search", "relevance_filter");
  graph.addEdge("relevance_filter", "code_examples");  // NEW
  graph.addEdge("code_examples", "deep_analysis");     // NEW
  graph.addEdge("deep_analysis", "synthesis");
  graph.addEdge("synthesis", END);
  
  return graph.compile();
}
```

**Step 4: Update state type**

```typescript
// src/types/agent.ts
export const AgentStateAnnotation = Annotation.Root({
  // ... existing fields
  
  codeExamples: Annotation<GitHubSearchResult[] | undefined>,
});
```

### Example: Web Scraper Tool

Add a tool to scrape full documentation pages:

```typescript
// src/agent/tools/scraper.ts
import * as cheerio from 'cheerio';

export async function scrapePage(url: string): Promise<string> {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  
  // Remove scripts, styles, nav, footer
  $('script, style, nav, footer, header').remove();
  
  // Extract main content
  const mainContent = $('main, article, .content, #content').text();
  
  // Clean up whitespace
  return mainContent.replace(/\s+/g, ' ').trim();
}

// Use in graph node
async function scrapeDocumentation(state: AgentState): Promise<Partial<AgentState>> {
  const topResults = state.relevantResults?.slice(0, 3) || [];
  
  const scrapedContent = await Promise.all(
    topResults.map(async (result) => {
      try {
        const content = await scrapePage(result.url);
        return { ...result, content };
      } catch (error) {
        return result; // Use original content if scraping fails
      }
    })
  );
  
  return {
    relevantResults: scrapedContent,
    status: "analyzing",
  };
}
```

## Creating Custom Nodes

### Example: Validation Node

Add a node to validate findings quality:

```typescript
// src/agent/graph.ts
async function validateFindings(state: AgentState): Promise<Partial<AgentState>> {
  console.log("✓ Validating findings quality");
  
  const findings = state.findings;
  
  if (!findings) {
    return {
      status: "error",
      error: "No findings to validate",
    };
  }
  
  // Check quality metrics
  const hasSteps = findings.migrationSteps.length > 0;
  const hasChanges = findings.breakingChanges.length > 0;
  const hasSources = findings.sources.length > 0;
  const hasSummary = findings.summary.length > 50;
  
  const qualityScore = [hasSteps, hasChanges, hasSources, hasSummary]
    .filter(Boolean).length / 4;
  
  if (qualityScore < 0.5) {
    // Quality too low, trigger re-search
    if (state.searchAttempts < 2) {
      return {
        status: "parsing_query",
        searchAttempts: state.searchAttempts + 1,
        enhancedQuery: `${state.query} comprehensive guide detailed`,
      };
    }
  }
  
  return {
    status: "complete",
    qualityScore,
  };
}

// Add to graph
graph.addNode("validate", validateFindings);
graph.addEdge("synthesis", "validate");
graph.addConditionalEdges("validate", (state) => {
  if (state.status === "parsing_query") return "query_parser";
  return END;
});
```

### Example: Summarization Node

Add a node to create different summary formats:

```typescript
async function createSummaries(state: AgentState): Promise<Partial<AgentState>> {
  const llm = createLLM();
  const findings = state.findings!;
  
  // Create multiple summary formats
  const summaries = {
    brief: await generateBriefSummary(llm, findings),
    detailed: await generateDetailedSummary(llm, findings),
    technical: await generateTechnicalSummary(llm, findings),
  };
  
  return {
    summaries,
    status: "complete",
  };
}

async function generateBriefSummary(llm: ChatOpenAI, findings: any): Promise<string> {
  const prompt = `Summarize this migration in 2 sentences:\n${JSON.stringify(findings)}`;
  const response = await llm.invoke(prompt);
  return response.content.toString();
}
```

## Custom Prompts

### Dynamic Prompts Based on Context

```typescript
// src/agent/llm.ts
export function createAnalysisPrompt(context: {
  migrationComplexity: "simple" | "moderate" | "complex";
  userExperience: "beginner" | "intermediate" | "expert";
}) {
  const basePrompt = "Analyze this migration documentation.";
  
  const complexityInstructions = {
    simple: "Focus on the most critical steps only.",
    moderate: "Provide a balanced overview with key details.",
    complex: "Include comprehensive details and edge cases.",
  };
  
  const audienceInstructions = {
    beginner: "Use simple language and explain concepts.",
    intermediate: "Assume basic knowledge, focus on specifics.",
    expert: "Be technical and concise.",
  };
  
  return ChatPromptTemplate.fromMessages([
    ["system", basePrompt],
    ["system", complexityInstructions[context.migrationComplexity]],
    ["system", audienceInstructions[context.userExperience]],
    ["human", "Documentation: {content}\n\nAnalysis:"],
  ]);
}
```

### Few-Shot Prompts

Add examples to improve consistency:

```typescript
export const EXTRACTION_PROMPT_WITH_EXAMPLES = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Extract migration steps from documentation.

Example 1:
Input: "First, upgrade to Java 17. Then update Spring Boot to 3.0 in pom.xml."
Output: ["Upgrade to Java 17", "Update Spring Boot to 3.0 in pom.xml"]

Example 2:
Input: "The migration requires updating dependencies and refactoring code."
Output: ["Update dependencies", "Refactor code"]

Now extract from:
Input: {content}
Output:`
  ],
]);
```

## Customizing LLM Provider

### Support Multiple Providers

```typescript
// src/agent/llm.ts
export function createLLM(provider: "openai" | "anthropic" = "openai") {
  switch (provider) {
    case "openai":
      return new ChatOpenAI({
        modelName: "gpt-4",
        temperature: 0.1,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
    
    case "anthropic":
      return new ChatAnthropic({
        modelName: "claude-3-sonnet",
        temperature: 0.1,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      });
    
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// Configuration
const provider = process.env.LLM_PROVIDER || "openai";
const llm = createLLM(provider);
```

### Model Selection

```typescript
export function selectModel(taskComplexity: "low" | "medium" | "high") {
  const models = {
    low: "gpt-3.5-turbo",     // Fast, cheap
    medium: "gpt-4",           // Balanced
    high: "gpt-4-turbo",       // Best quality
  };
  
  return new ChatOpenAI({
    modelName: models[taskComplexity],
    temperature: 0.1,
  });
}
```

## Customizing the UI

### Custom Theme

```typescript
// src/cli/theme.ts
export const theme = {
  colors: {
    primary: "cyan",
    success: "green",
    error: "red",
    warning: "yellow",
    muted: "gray",
  },
  
  styles: {
    header: { bold: true, color: "cyan" },
    section: { bold: true, marginTop: 1 },
    item: { paddingLeft: 2 },
    error: { bold: true, color: "red" },
  },
};

// Use in components
<Text {...theme.styles.header}>Section Title</Text>
```

### Custom Progress Indicators

```typescript
// src/cli/components/CustomProgress.tsx
function AnimatedProgress({ progress }: { progress: number }) {
  const barLength = 20;
  const filled = Math.floor((progress / 100) * barLength);
  const empty = barLength - filled;
  
  return (
    <Box>
      <Text color="cyan">
        [{"█".repeat(filled)}{"░".repeat(empty)}]
      </Text>
      <Text> {progress}%</Text>
    </Box>
  );
}
```

### Multi-Format Output

```typescript
// src/cli/components/ResultsExport.tsx
function ExportOptions({ findings }: { findings: MigrationFindings }) {
  const [format, setFormat] = useState<"text" | "markdown" | "json">("text");
  
  useInput((input) => {
    if (input === "1") setFormat("text");
    if (input === "2") setFormat("markdown");
    if (input === "3") setFormat("json");
    if (input === "e") exportFindings(findings, format);
  });
  
  return (
    <Box flexDirection="column">
      <Text>Export format:</Text>
      <Text>1) Plain Text  2) Markdown  3) JSON</Text>
      <Text dimColor>Press 'e' to export</Text>
    </Box>
  );
}

function exportFindings(findings: MigrationFindings, format: string) {
  const content = formatFindings(findings, format);
  fs.writeFileSync(`migration-guide.${format}`, content);
}
```

## Configuration File

### User Configuration

```typescript
// .research-agent.config.js
module.exports = {
  llm: {
    provider: "openai",
    model: "gpt-4",
    temperature: 0.1,
  },
  
  search: {
    maxResults: 10,
    minScore: 0.7,
    retryAttempts: 2,
  },
  
  analysis: {
    maxSources: 3,
    includeCodeExamples: true,
    complexityLevel: "moderate",
  },
  
  ui: {
    theme: "dark",
    showProgress: true,
    autoExport: false,
  },
};

// Load config
// src/utils/config.ts
export function loadConfig() {
  try {
    return require(path.join(process.cwd(), '.research-agent.config.js'));
  } catch {
    return defaultConfig;
  }
}
```

## Plugin System

### Define Plugin Interface

```typescript
// src/plugins/types.ts
export interface Plugin {
  name: string;
  version: string;
  
  // Hooks
  onQueryParse?: (query: string) => string;
  onSearchComplete?: (results: SearchResult[]) => SearchResult[];
  onAnalysisComplete?: (findings: MigrationFindings) => MigrationFindings;
  
  // Custom nodes
  nodes?: Record<string, NodeFunction>;
  
  // UI extensions
  components?: Record<string, React.ComponentType<any>>;
}

// Example plugin
export const enhancedSearchPlugin: Plugin = {
  name: "enhanced-search",
  version: "1.0.0",
  
  onQueryParse: (query) => {
    return `${query} site:github.com OR site:stackoverflow.com`;
  },
  
  onSearchComplete: (results) => {
    return results.filter(r => r.score > 0.8);
  },
};
```

### Load Plugins

```typescript
// src/plugins/loader.ts
export function loadPlugins(pluginNames: string[]): Plugin[] {
  return pluginNames.map(name => {
    const plugin = require(`./plugins/${name}`);
    console.log(`Loaded plugin: ${plugin.name} v${plugin.version}`);
    return plugin;
  });
}

// Apply plugins
export function applyPlugins(agent: any, plugins: Plugin[]) {
  plugins.forEach(plugin => {
    if (plugin.nodes) {
      Object.entries(plugin.nodes).forEach(([name, fn]) => {
        agent.addNode(name, fn);
      });
    }
  });
}
```

## Advanced Patterns

### Caching Results

```typescript
// src/utils/cache.ts
class ResultCache {
  private cache = new Map<string, any>();
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check expiry
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  set(key: string, value: any, ttl: number = 3600000) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }
}

// Use in search
const cache = new ResultCache();

async function searchWithCache(query: string): Promise<SearchResult[]> {
  const cached = cache.get(query);
  if (cached) return cached;
  
  const results = await executeSearch(query);
  cache.set(query, results);
  return results;
}
```

### Rate Limiting

```typescript
// src/utils/rateLimiter.ts
class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  async throttle(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(t => t > now - this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(Date.now());
  }
}

// Use with API calls
const limiter = new RateLimiter(10, 60000); // 10 requests per minute

async function searchWithRateLimit(query: string) {
  await limiter.throttle();
  return await executeSearch(query);
}
```

## Testing Extensions

### Test Custom Tools

```typescript
// src/agent/tools/__tests__/github.test.ts
import { searchGitHub } from '../github';

describe('GitHub search tool', () => {
  it('returns code examples', async () => {
    const results = await searchGitHub('Spring Boot migration');
    
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('repository');
    expect(results[0]).toHaveProperty('code');
  });
});
```

### Test Custom Nodes

```typescript
// src/agent/__tests__/customNodes.test.ts
describe('Validation node', () => {
  it('validates high quality findings', async () => {
    const state = {
      findings: {
        summary: "A comprehensive migration guide...",
        migrationSteps: ["Step 1", "Step 2"],
        breakingChanges: ["Change 1"],
        sources: ["http://example.com"],
      },
    };
    
    const result = await validateFindings(state);
    
    expect(result.status).toBe("complete");
    expect(result.qualityScore).toBeGreaterThan(0.5);
  });
});
```

## Key Takeaways

1. **Tools** extend agent capabilities with external APIs
2. **Custom nodes** add new processing steps
3. **Prompts** can be customized for different contexts
4. **UI** is fully customizable with React/Ink
5. **Configuration** makes the agent flexible
6. **Plugins** enable modular extensions
7. **Testing** ensures extensions work correctly

## Conclusion

You now have a comprehensive understanding of:
- LangChain and LangGraph fundamentals
- Building stateful agents
- Tool integration
- Prompt engineering
- Graph design
- React/Ink for CLI
- System architecture
- Extension patterns

The Deep Research Agent is a starting point. Use these patterns to build your own sophisticated AI agents!

## Resources

- [LangChain Documentation](https://js.langchain.com/)
- [LangGraph Guide](https://langchain-ai.github.io/langgraphjs/)
- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Tavily API Docs](https://docs.tavily.com/)

