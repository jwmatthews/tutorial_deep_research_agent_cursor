# Tutorial 2: Building Stateful Agents

## Introduction

In this tutorial, we'll explore how to build stateful agents using LangGraph. State management is crucial for creating agents that can track their progress, remember what they've done, and make decisions based on accumulated information.

## What is Agent State?

**State** is the data structure that represents everything your agent knows at any point in time. Think of it as the agent's "memory" or "context."

For our Deep Research Agent, the state includes:
- The user's query
- Search results found
- Analysis performed
- Final findings
- Current processing status

## Defining State with Annotations

LangGraph uses `Annotation` to define state schemas with type safety and reducer logic.

### Basic State Definition

```typescript
import { Annotation } from "@langchain/langgraph";

const SimpleState = Annotation.Root({
  // Simple field - just stores the latest value
  userId: Annotation<string>,
  
  // Field with default value
  count: Annotation<number>({
    default: () => 0,
  }),
});
```

### State with Reducers

Reducers control how updates are merged:

```typescript
const AgentState = Annotation.Root({
  // Messages append to existing array
  messages: Annotation<BaseMessage[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  
  // Status always takes the new value
  status: Annotation<"idle" | "working" | "done">({
    reducer: (_, right) => right,
    default: () => "idle",
  }),
  
  // Count increments
  attempts: Annotation<number>({
    reducer: (left, right) => left + right,
    default: () => 0,
  }),
});
```

### Our Agent's State

Let's look at our actual agent state from `src/types/agent.ts`:

```typescript
export const AgentStateAnnotation = Annotation.Root({
  // Original user query
  query: Annotation<string>,
  
  // Enhanced search query
  enhancedQuery: Annotation<string | undefined>,
  
  // Raw search results
  searchResults: Annotation<SearchResult[] | undefined>,
  
  // Filtered relevant results
  relevantResults: Annotation<SearchResult[] | undefined>,
  
  // Analysis steps
  analysisSteps: Annotation<AnalysisStep[] | undefined>,
  
  // Final findings
  findings: Annotation<MigrationFindings | undefined>,
  
  // Chat messages (append)
  messages: Annotation<BaseMessage[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  
  // Current status (replace)
  status: Annotation<AgentStatus>({
    reducer: (_, right) => right,
    default: () => "idle",
  }),
  
  // Error message
  error: Annotation<string | undefined>,
  
  // Retry counter
  searchAttempts: Annotation<number>({
    reducer: (_, right) => right,
    default: () => 0,
  }),
});
```

## Understanding State Flow

State flows through the graph like this:

```
Initial State:
{
  query: "Spring Boot 2 to 3",
  status: "parsing_query",
  searchAttempts: 0,
}

After query_parser node:
{
  query: "Spring Boot 2 to 3",
  enhancedQuery: "Spring Boot 2 to 3 migration guide official documentation",
  status: "searching",
  messages: [HumanMessage, AIMessage],
  searchAttempts: 0,
}

After search node:
{
  ...previous state,
  searchResults: [{title: "...", url: "...", content: "..."}],
  status: "filtering_results",
}

...and so on
```

## State Reducer Patterns

### 1. Replace Reducer (Default)

Takes only the new value:

```typescript
status: Annotation<string>({
  reducer: (_, right) => right,
})

// Usage in node:
return { status: "complete" }; // Replaces old status
```

### 2. Append Reducer

Adds to an array:

```typescript
messages: Annotation<BaseMessage[]>({
  reducer: (left, right) => left.concat(right),
  default: () => [],
})

// Usage in node:
return { 
  messages: [new AIMessage("New message")]
}; // Appends to existing messages
```

### 3. Merge Reducer

Combines objects:

```typescript
metadata: Annotation<Record<string, any>>({
  reducer: (left, right) => ({ ...left, ...right }),
  default: () => ({}),
})

// Usage in node:
return {
  metadata: { timestamp: Date.now() }
}; // Merges with existing metadata
```

### 4. Increment Reducer

Adds numbers:

```typescript
attempts: Annotation<number>({
  reducer: (left, right) => left + right,
  default: () => 0,
})

// Usage in node:
return { attempts: 1 }; // Increments by 1
```

## Node Functions: Transforming State

Nodes are pure functions that:
1. Receive the full state
2. Perform operations (LLM calls, API requests, etc.)
3. Return partial state updates

### Example: Query Parser Node

```typescript
async function parseQuery(state: AgentState): Promise<Partial<AgentState>> {
  console.log("📝 Parsing query:", state.query);
  
  try {
    // Use LLM to enhance query
    const llm = createLLM();
    const prompt = await QUERY_ENHANCEMENT_PROMPT.format({
      query: state.query,
    });
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    const enhancedQuery = response.content.toString().trim();
    
    // Return state updates
    return {
      enhancedQuery,
      status: "searching",
      messages: [new HumanMessage(state.query), new AIMessage(enhancedQuery)],
    };
  } catch (error) {
    // Handle errors in state
    return {
      status: "error",
      error: `Query parsing failed: ${error.message}`,
    };
  }
}
```

**Key Points:**
- Read from state: `state.query`
- Return partial updates: `{ enhancedQuery, status, messages }`
- Reducers handle merging: `messages` appends, `status` replaces

### Example: Search Node with Retry Logic

```typescript
async function search(state: AgentState): Promise<Partial<AgentState>> {
  const query = state.enhancedQuery || state.query;
  
  try {
    const searchResults = await executeSearch(query);
    
    // Check if results are sufficient
    if (!validateSearchResults(searchResults)) {
      // Use state to track retries
      if (state.searchAttempts < 2) {
        return {
          searchAttempts: state.searchAttempts + 1,
          status: "parsing_query", // Trigger re-parse
          enhancedQuery: `${query} official documentation`,
        };
      }
      
      return {
        status: "error",
        error: "Could not find sufficient results",
      };
    }
    
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

**Key Points:**
- Conditional logic based on state: `if (state.searchAttempts < 2)`
- State enables retry: tracking attempts
- Status changes trigger different paths

## Conditional Routing Based on State

State enables intelligent routing:

```typescript
graph.addConditionalEdges("search", (state: AgentState) => {
  // Error path
  if (state.status === "error") {
    return END;
  }
  
  // Retry path
  if (state.status === "parsing_query") {
    return "query_parser"; // Loop back
  }
  
  // Success path
  return "relevance_filter"; // Continue
});
```

## State Management Best Practices

### 1. Immutable Updates

Never modify state directly:

```typescript
// ❌ BAD
function badNode(state: State): Partial<State> {
  state.messages.push(newMessage); // Mutating!
  return state;
}

// ✅ GOOD
function goodNode(state: State): Partial<State> {
  return {
    messages: [newMessage], // Reducer will append
  };
}
```

### 2. Typed State

Always use TypeScript types:

```typescript
// Define types
export type AgentState = typeof AgentStateAnnotation.State;

// Use in functions
async function myNode(state: AgentState): Promise<Partial<AgentState>> {
  // TypeScript ensures type safety
}
```

### 3. Defensive Defaults

Provide default values for optional fields:

```typescript
async function analyze(state: AgentState): Promise<Partial<AgentState>> {
  // ❌ Could crash if undefined
  const count = state.relevantResults.length;
  
  // ✅ Safe with default
  const count = state.relevantResults?.length || 0;
  
  if (count === 0) {
    return { error: "No results to analyze" };
  }
  
  // ... rest of logic
}
```

### 4. Clear Status Tracking

Use status to drive the UI and control flow:

```typescript
type AgentStatus = 
  | "idle"
  | "parsing_query"
  | "searching"
  | "filtering_results"
  | "analyzing"
  | "synthesizing"
  | "complete"
  | "error";
```

Every node should update status:

```typescript
return {
  // ... other updates
  status: "filtering_results",
};
```

### 5. Error Handling in State

Store errors in state rather than throwing:

```typescript
try {
  const result = await riskyOperation();
  return { result, status: "complete" };
} catch (error) {
  return {
    status: "error",
    error: error.message,
  };
}
```

This allows:
- Graceful error display in UI
- Error recovery in other nodes
- Continuation of execution

## State Evolution Example

Let's trace state through our agent:

```typescript
// 1. Initial invoke
const result = await agent.invoke({
  query: "React 17 to 18",
  status: "parsing_query",
  searchAttempts: 0,
});

// 2. After query_parser
{
  query: "React 17 to 18",
  enhancedQuery: "React 17 to 18 migration guide breaking changes",
  status: "searching",
  messages: [HumanMessage("React 17 to 18"), AIMessage("...")],
  searchAttempts: 0,
}

// 3. After search
{
  ...previous,
  searchResults: [/* 10 results */],
  status: "filtering_results",
}

// 4. After relevance_filter
{
  ...previous,
  relevantResults: [/* 5 filtered results */],
  status: "analyzing",
}

// 5. After deep_analysis
{
  ...previous,
  analysisSteps: [/* 3 analysis steps */],
  status: "synthesizing",
}

// 6. Final state after synthesis
{
  ...previous,
  findings: {
    summary: "React 18 introduces...",
    migrationSteps: [...],
    breakingChanges: [...],
    sources: [...]
  },
  status: "complete",
}
```

## State in the UI

The CLI reads state to show progress:

```typescript
// In useAgent hook
executeResearchStreaming(query, (updatedState) => {
  setState(updatedState); // Update React state
});

// In Progress component
<Progress 
  status={state.status} 
  message={getStatusMessage(state.status)}
/>

// In Results component
{state.findings && <Results findings={state.findings} />}
```

## Key Takeaways

1. **State** is the agent's memory and context
2. **Annotations** define state schema with type safety
3. **Reducers** control how updates merge
4. **Nodes** transform state immutably
5. **Status** drives control flow and UI
6. **Errors** are handled gracefully in state
7. **Conditional edges** route based on state

## Next Steps

Now that you understand stateful agents, let's explore how to integrate external tools like Tavily search.

Continue to: [Tutorial 3: Tool Integration](./03-tool-integration.md)

