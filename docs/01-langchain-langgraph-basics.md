# Tutorial 1: LangChain & LangGraph Fundamentals

## Introduction

This tutorial covers the foundational concepts of LangChain and LangGraph, the frameworks that power our Deep Research Agent. By the end, you'll understand how these tools enable sophisticated AI applications.

## What is LangChain?

**LangChain** is a framework for developing applications powered by Large Language Models (LLMs). It provides:

- **Abstractions** for working with different LLM providers (OpenAI, Anthropic, etc.)
- **Chains** for composing multiple LLM calls together
- **Prompts** for managing and templating inputs to LLMs
- **Tools** for giving LLMs access to external functions and APIs
- **Memory** for maintaining conversation context

### Core LangChain Concepts

#### 1. Language Models

LangChain abstracts over different LLM providers:

```typescript
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.1,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Use the model
const response = await llm.invoke("What is TypeScript?");
```

#### 2. Prompts

Prompts are templates for LLM inputs:

```typescript
import { ChatPromptTemplate } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant that {task}."],
  ["human", "{question}"],
]);

const formatted = await prompt.format({
  task: "explains programming concepts",
  question: "What is a closure?"
});
```

#### 3. Chains

Chains combine multiple steps:

```typescript
// Simple chain: prompt -> LLM -> output
const chain = prompt.pipe(llm);
const result = await chain.invoke({
  task: "explains programming",
  question: "What is a closure?"
});
```

## What is LangGraph?

**LangGraph** extends LangChain to create **stateful, multi-step agents**. While chains are linear, graphs can have:

- **Branches** - conditional logic based on state
- **Loops** - retry logic or iterative refinement
- **Parallel execution** - multiple paths simultaneously
- **State management** - persistent data across nodes

### Why Use LangGraph?

Traditional chains work well for simple workflows, but complex agents need:

1. **Decision Making** - "Should I search again or analyze the results?"
2. **State Tracking** - "What have I done so far?"
3. **Error Recovery** - "If this fails, try that"
4. **Multiple Paths** - "Different actions based on conditions"

LangGraph solves these with a **state machine** approach.

## LangGraph Core Concepts

### 1. State

State is the data structure that flows through your graph:

```typescript
import { Annotation } from "@langchain/langgraph";

// Define state schema
const StateAnnotation = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  count: Annotation<number>({
    reducer: (_, right) => right,
    default: () => 0,
  }),
});

type State = typeof StateAnnotation.State;
```

**Key Points:**
- State is immutable - nodes return partial updates
- Reducers define how updates merge with existing state
- Type-safe with TypeScript

### 2. Nodes

Nodes are functions that transform state:

```typescript
async function myNode(state: State): Promise<Partial<State>> {
  // Read from state
  const messages = state.messages;
  
  // Do some work
  const result = await doSomething(messages);
  
  // Return updates
  return {
    messages: [result],
    count: state.count + 1,
  };
}
```

**Node Characteristics:**
- Async functions
- Receive full state
- Return partial updates
- Can call LLMs, APIs, or any other code

### 3. Edges

Edges connect nodes and define the flow:

```typescript
import { StateGraph, START, END } from "@langchain/langgraph";

const graph = new StateGraph(StateAnnotation);

// Add nodes
graph.addNode("step1", step1Function);
graph.addNode("step2", step2Function);

// Add edges
graph.addEdge(START, "step1");      // Entry point
graph.addEdge("step1", "step2");    // Fixed path
graph.addEdge("step2", END);        // Exit point
```

### 4. Conditional Edges

Make decisions based on state:

```typescript
graph.addConditionalEdges(
  "step1",
  (state: State) => {
    // Routing logic
    if (state.count > 5) {
      return END;
    }
    return "step2";
  }
);
```

### 5. Compiling and Running

```typescript
// Compile the graph
const app = graph.compile();

// Run it
const result = await app.invoke({
  messages: ["Hello"],
  count: 0,
});

console.log(result);
```

## Example: Simple Research Agent

Let's build a minimal research agent to see these concepts in action:

```typescript
import { StateGraph, START, END } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

// Define state
const AgentState = Annotation.Root({
  query: Annotation<string>,
  searchResults: Annotation<string[]>({
    default: () => [],
  }),
  answer: Annotation<string | undefined>,
});

type State = typeof AgentState.State;

// Create LLM
const llm = new ChatOpenAI({ modelName: "gpt-4" });

// Node 1: Search
async function search(state: State): Promise<Partial<State>> {
  console.log("Searching for:", state.query);
  
  // Simulate search
  const results = [
    "Result 1 about " + state.query,
    "Result 2 about " + state.query,
  ];
  
  return { searchResults: results };
}

// Node 2: Analyze
async function analyze(state: State): Promise<Partial<State>> {
  console.log("Analyzing results...");
  
  const prompt = `Based on these search results: ${state.searchResults.join(", ")}
  Answer the query: ${state.query}`;
  
  const response = await llm.invoke(prompt);
  
  return { answer: response.content.toString() };
}

// Build graph
const graph = new StateGraph(AgentState)
  .addNode("search", search)
  .addNode("analyze", analyze);

graph.addEdge(START, "search");
graph.addEdge("search", "analyze");
graph.addEdge("analyze", END);

// Compile and run
const app = graph.compile();

const result = await app.invoke({
  query: "What is TypeScript?",
});

console.log("Answer:", result.answer);
```

## Chains vs. Graphs: When to Use Each

### Use Chains When:
- Linear workflow (A → B → C)
- No branching or loops needed
- Simple transformations
- Stateless operations

### Use Graphs When:
- Need conditional branching
- Require retry/loop logic
- Complex state management
- Multi-step agents with decision making
- Error recovery paths

## Our Deep Research Agent: Graph Structure

Our agent uses a graph because it needs:

1. **Query Enhancement** - Improve the search query
2. **Search** - Find relevant docs
3. **Conditional Retry** - If results poor, search again
4. **Filtering** - Keep only relevant results
5. **Analysis** - Extract structured info
6. **Synthesis** - Combine findings

This flow requires branches and conditional logic - perfect for LangGraph!

```
START → parse_query → search → filter → analyze → synthesize → END
              ↑           ↓
              └───── retry logic
```

## Key Takeaways

1. **LangChain** provides abstractions for LLMs, prompts, and tools
2. **LangGraph** adds state machines for complex agents
3. **State** flows through the graph, getting transformed by nodes
4. **Nodes** are functions that take state and return updates
5. **Edges** define the flow, can be conditional
6. **Graphs** are better than chains for agents with decision-making

## Next Steps

In the next tutorial, we'll dive deeper into **stateful agents** and see how state management enables sophisticated behaviors.

Continue to: [Tutorial 2: Building Stateful Agents](./02-stateful-agents.md)

