# Tutorial 8: Integration Architecture

## Introduction

This tutorial explains how all the pieces of our Deep Research Agent fit together. You'll understand the data flow, component interactions, and architectural decisions that make the system work.

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User Interface                       │
│                      (React/Ink CLI)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ QueryInput   │  │  Progress    │  │   Results    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ├─ useAgent Hook (State Management)
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                     Agent Layer                              │
│                   (LangGraph)                                │
│  ┌────────────┐ ┌────────┐ ┌─────────┐ ┌───────────┐      │
│  │   Query    │→│ Search │→│ Filter  │→│ Analysis  │→     │
│  │   Parser   │ └────────┘ └─────────┘ └───────────┘      │
│  └────────────┘                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
    ┌──────────────────┐ ┌──────────────────┐
    │   OpenAI API     │ │   Tavily API     │
    │   (LLM)          │ │   (Search)       │
    └──────────────────┘ └──────────────────┘
```

## Layer Breakdown

### 1. UI Layer (React/Ink)

**Responsibilities:**
- Display information to user
- Capture user input
- Show real-time progress
- Handle keyboard interactions

**Key Files:**
- `src/cli/App.tsx` - Main application
- `src/cli/components/` - UI components
- `src/cli/hooks/useAgent.ts` - Agent integration hook

**Technology:**
- React for component model
- Ink for terminal rendering
- React Hooks for state management

### 2. Agent Layer (LangGraph)

**Responsibilities:**
- Orchestrate research workflow
- Manage agent state
- Execute graph nodes
- Handle errors and retries

**Key Files:**
- `src/agent/graph.ts` - Graph definition and nodes
- `src/agent/index.ts` - Public API
- `src/types/agent.ts` - State types

**Technology:**
- LangGraph for state machine
- LangChain for LLM integration

### 3. Tool Layer

**Responsibilities:**
- Integrate external APIs
- Transform API responses
- Validate results
- Handle API errors

**Key Files:**
- `src/agent/tools/search.ts` - Tavily integration
- `src/agent/llm.ts` - OpenAI integration

**Technology:**
- LangChain Community (Tavily)
- LangChain OpenAI

## Data Flow

### Query Submission Flow

```
1. User enters query in CLI
   ↓
2. QueryInput component captures input
   ↓
3. App.tsx calls handleSubmit()
   ↓
4. useAgent.executeQuery() is called
   ↓
5. Agent.executeResearchStreaming() starts
   ↓
6. Graph executes nodes sequentially
   ↓
7. Each node updates state
   ↓
8. State updates streamed back to UI
   ↓
9. React components re-render with new state
   ↓
10. User sees real-time progress
```

### State Flow Through System

```typescript
// 1. Initial state (from UI)
{
  query: "Spring Boot 2 to 3"
}

// 2. After query_parser node
{
  query: "Spring Boot 2 to 3",
  enhancedQuery: "Spring Boot 2 to 3 migration guide...",
  status: "searching",
  messages: [...]
}

// 3. After search node
{
  ...previous,
  searchResults: [{title, url, content, score}, ...],
  status: "filtering_results"
}

// 4. After relevance_filter node
{
  ...previous,
  relevantResults: [filtered results],
  status: "analyzing"
}

// 5. After deep_analysis node
{
  ...previous,
  analysisSteps: [{step, findings, confidence}, ...],
  status: "synthesizing"
}

// 6. Final state (back to UI)
{
  ...previous,
  findings: {
    summary: "...",
    migrationSteps: [...],
    breakingChanges: [...],
    examples: [...],
    sources: [...]
  },
  status: "complete"
}
```

## Component Communication

### CLI to Agent

**Pattern: Custom Hook Abstraction**

```typescript
// src/cli/hooks/useAgent.ts
export function useAgent() {
  const [state, setState] = useState<AgentState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const executeQuery = useCallback(async (query: string) => {
    setIsLoading(true);
    
    // Call agent with streaming callback
    await executeResearchStreaming(query, (updatedState) => {
      setState(updatedState); // Update React state
    });
    
    setIsLoading(false);
  }, []);

  return { state, isLoading, executeQuery };
}
```

**Why this pattern?**
- Encapsulates agent interaction
- Manages async operations
- Converts agent state to React state
- Provides clean API to components

### Agent to External APIs

**Pattern: Tool Functions**

```typescript
// src/agent/tools/search.ts
export async function executeSearch(query: string): Promise<SearchResult[]> {
  const searchTool = createSearchTool();
  const rawResults = await searchTool.invoke(query);
  
  // Transform and validate
  const results = parseResults(rawResults);
  return results;
}

// Used in graph node
async function search(state: AgentState): Promise<Partial<AgentState>> {
  const searchResults = await executeSearch(state.enhancedQuery);
  return { searchResults, status: "filtering_results" };
}
```

**Why this pattern?**
- Separates API logic from graph logic
- Enables testing of API integration
- Allows swapping implementations
- Clear error boundaries

## Streaming Architecture

### Why Streaming?

Without streaming:
```typescript
// ❌ Bad: User waits with no feedback
const result = await agent.invoke({ query });
// ... 30 seconds later ...
displayResults(result);
```

With streaming:
```typescript
// ✅ Good: Real-time updates
for await (const state of agent.stream({ query })) {
  displayProgress(state); // Updates every few seconds
}
```

### Implementation

**Agent Side (LangGraph):**

```typescript
// src/agent/index.ts
export async function executeResearchStreaming(
  query: string,
  onUpdate: (state: AgentState) => void
): Promise<AgentState> {
  const graph = initializeAgent();
  
  // Stream returns async iterator
  for await (const state of await graph.stream(initialState)) {
    const values = Object.values(state)[0] as AgentState;
    onUpdate(values); // Callback for each update
  }
  
  return finalState;
}
```

**UI Side (React/Ink):**

```typescript
// src/cli/hooks/useAgent.ts
const executeQuery = useCallback(async (query: string) => {
  await executeResearchStreaming(query, (updatedState) => {
    setState(updatedState); // Triggers React re-render
  });
}, []);
```

**Result:**
Each node completion triggers:
1. Agent state update
2. Callback invocation
3. React state update
4. Component re-render
5. UI update

## Error Handling Strategy

### Layered Error Handling

**Layer 1: API Level**

```typescript
// Tool layer catches API errors
try {
  const results = await searchTool.invoke(query);
} catch (error) {
  throw new Error(`Search failed: ${error.message}`);
}
```

**Layer 2: Node Level**

```typescript
// Graph nodes catch and store errors in state
async function search(state: AgentState): Promise<Partial<AgentState>> {
  try {
    const results = await executeSearch(query);
    return { searchResults: results, status: "filtering" };
  } catch (error) {
    return {
      status: "error",
      error: error.message,
    };
  }
}
```

**Layer 3: Graph Level**

```typescript
// Conditional edges handle error state
graph.addConditionalEdges("search", (state: AgentState) => {
  if (state.status === "error") return END;
  return "relevance_filter";
});
```

**Layer 4: UI Level**

```typescript
// UI displays errors gracefully
{error && <ErrorDisplay error={error} />}
```

### Retry Strategy

```typescript
// In search node
if (!validateResults(results)) {
  if (state.searchAttempts < 2) {
    // Retry with better query
    return {
      searchAttempts: state.searchAttempts + 1,
      status: "parsing_query", // Loop back
    };
  }
  // Give up after 2 retries
  return { status: "error", error: "No results found" };
}
```

## State Synchronization

### Challenge

Two separate state systems:
1. **Agent State** (LangGraph) - Agent's internal state
2. **React State** (UI) - Component state

### Solution: One-Way Data Flow

```
Agent State (Source of Truth)
       ↓
   Streaming
       ↓
  React State (Derived)
       ↓
    UI Render
```

**Implementation:**

```typescript
// Agent is source of truth
const agentState = await agent.execute(query);

// React state mirrors agent state
setState(agentState);

// UI renders from React state
<Progress status={state.status} />
```

**Benefits:**
- Single source of truth
- Predictable updates
- No synchronization bugs

## Module Organization

```
src/
├── agent/              # Agent logic
│   ├── index.ts        # Public API
│   ├── graph.ts        # Graph definition
│   ├── llm.ts          # LLM integration
│   └── tools/          # External tools
│       └── search.ts
├── cli/                # UI layer
│   ├── App.tsx         # Main app
│   ├── components/     # UI components
│   │   ├── QueryInput.tsx
│   │   ├── Progress.tsx
│   │   └── Results.tsx
│   └── hooks/          # Custom hooks
│       └── useAgent.ts
├── types/              # Type definitions
│   └── agent.ts
├── utils/              # Utilities
│   └── env.ts
└── index.tsx           # Entry point
```

**Principles:**
- **Separation of concerns** - Agent logic separate from UI
- **Layered architecture** - Clear boundaries
- **Dependency direction** - UI depends on agent, not vice versa

## Configuration Management

### Environment Variables

```typescript
// src/utils/env.ts
export function loadEnvironment() {
  dotenv.config();
}

// src/agent/index.ts
export function validateEnvironment() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY required");
  }
}

// src/index.tsx
loadEnvironment();
validateEnvironment();
render(<App />);
```

**Benefits:**
- Centralized configuration
- Early validation
- Clear error messages

## Design Decisions

### Why Separate Agent and UI?

**Advantages:**
- Agent can be used without CLI (e.g., as library)
- Testing agent logic independently
- Could swap UI (web, native, etc.)
- Clear separation of concerns

### Why Custom Hook for Agent Integration?

**Advantages:**
- Encapsulates complexity
- Reusable across components
- Standard React pattern
- Easy to test

### Why Streaming Instead of Polling?

**Streaming:**
```typescript
// Push updates
for await (const state of agent.stream()) {
  update(state);
}
```

**Polling (alternative):**
```typescript
// Pull updates
setInterval(async () => {
  const state = await agent.getState();
  update(state);
}, 1000);
```

**Why streaming wins:**
- Real-time updates (no delay)
- No unnecessary checks
- Lower resource usage
- Natural async/await pattern

## Performance Considerations

### UI Performance

- **Memoization** prevents unnecessary re-renders
- **Conditional rendering** only shows active components
- **Debouncing** input to avoid excessive updates

### Agent Performance

- **Parallel LLM calls** where possible
- **Result caching** to avoid duplicate searches
- **Early termination** on errors
- **Limit search results** to top N

### Network Performance

- **Request batching** where possible
- **Timeout handling** for slow APIs
- **Exponential backoff** for retries

## Key Takeaways

1. **Layered architecture** separates concerns clearly
2. **One-way data flow** from agent to UI
3. **Streaming** enables real-time updates
4. **Custom hooks** integrate agent with React
5. **Error handling** at multiple layers
6. **State synchronization** via callbacks
7. **Module organization** follows best practices

## Next Steps

Learn how to extend the agent with new capabilities.

Continue to: [Tutorial 9: Extending the Agent](./09-extending-the-agent.md)

