# Tutorial 4: LLM Integration & Prompt Engineering

## Introduction

The quality of an AI agent heavily depends on how well it communicates with the LLM. This tutorial covers LLM integration with LangChain and the art of prompt engineering for research tasks.

## OpenAI Integration with LangChain

### Basic Setup

```typescript
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
  modelName: "gpt-4",              // Model to use
  temperature: 0.1,                 // Low = more consistent
  openAIApiKey: process.env.OPENAI_API_KEY,
  maxTokens: 2000,                  // Response length limit
  streaming: false,                 // Enable/disable streaming
});
```

### Key Configuration Options

**Model Name:**
- `gpt-4` - Most capable, best for complex reasoning
- `gpt-4-turbo` - Faster, good balance
- `gpt-3.5-turbo` - Fast and cheap, less capable

**Temperature (0-2):**
- `0-0.3` - Focused, deterministic, factual (research)
- `0.7-1.0` - Balanced creativity and consistency
- `1.5-2.0` - Very creative, less predictable

**Our Choice:** Temperature 0.1 for consistent, factual responses about migrations.

### Streaming Responses

For real-time updates:

```typescript
const streamingLLM = new ChatOpenAI({
  modelName: "gpt-4",
  streaming: true,
});

const stream = await streamingLLM.stream("Explain React 18 features");

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

## Prompt Engineering Fundamentals

### What is Prompt Engineering?

**Prompt engineering** is the practice of crafting inputs to LLMs to get desired outputs. Good prompts:

1. Are clear and specific
2. Provide context and examples
3. Define output format
4. Set the right "role" for the AI
5. Include constraints and guidelines

### Anatomy of a Good Prompt

```typescript
const prompt = `
[SYSTEM ROLE]
You are an expert at analyzing software documentation.

[CONTEXT]
The user is looking for migration information between software versions.

[TASK]
Given search results, extract:
1. Migration steps
2. Breaking changes
3. Code examples

[FORMAT]
Return your response as JSON:
{
  "steps": [...],
  "breaking_changes": [...],
  "examples": [...]
}

[CONSTRAINTS]
- Be specific and actionable
- Only include verified information
- Cite sources when possible

[INPUT]
Search Results: {search_results}

[OUTPUT]
`;
```

## Our Prompt Templates

Let's examine each prompt in our agent and why it's structured that way.

### 1. Query Enhancement Prompt

**Purpose:** Transform user queries into better search terms

**Location:** `src/agent/llm.ts`

```typescript
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
```

**Why this works:**
- Clear role: "expert at formulating search queries"
- Specific guidelines for what to include
- Explicit instruction to return only the query
- Examples implied through guidelines

**Example transformation:**
```
Input:  "spring boot 2 to 3"
Output: "Spring Boot 2 to 3 migration guide official documentation breaking changes"
```

### 2. Relevance Filtering Prompt

**Purpose:** Filter search results to keep only relevant ones

```typescript
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
```

**Why this works:**
- Defines clear relevance criteria
- Requests specific output format (JSON array)
- Provides example format
- Orders results by relevance

**Example output:**
```json
[0, 3, 7, 2, 9]
```

### 3. Deep Analysis Prompt

**Purpose:** Extract structured information from documentation

```typescript
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
```

**Why this works:**
- Role establishes expertise
- Numbered list of extraction tasks
- Exact JSON schema provided
- Emphasis on "specific and actionable"
- Triple braces `{{}}` escape JSON in template

**Example output:**
```json
{
  "migrationSteps": [
    "Upgrade to Java 17",
    "Update dependencies in pom.xml",
    "Refactor deprecated APIs"
  ],
  "breakingChanges": [
    "javax.* packages renamed to jakarta.*",
    "Spring Security config requires lambda DSL"
  ],
  "examples": [
    "Old: @EnableWebSecurity\nNew: @EnableWebSecurity(debug = true)"
  ],
  "warnings": [
    "Ensure database schema is compatible"
  ]
}
```

### 4. Synthesis Prompt

**Purpose:** Combine multiple analyses into one coherent guide

```typescript
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
```

**Why this works:**
- Role as technical writer (different from engineer)
- Combines multiple sources
- Structured output format
- Emphasis on clarity and actionability

## Prompt Engineering Best Practices

### 1. Be Specific About Output Format

```typescript
// ❌ Vague
"Analyze this and give me the results"

// ✅ Specific
"Return a JSON object with keys: steps, changes, examples"
```

### 2. Use Examples (Few-Shot Learning)

```typescript
const prompt = `
Extract key points from the text.

Example 1:
Text: "React 18 introduces concurrent features and automatic batching."
Output: ["Concurrent features", "Automatic batching"]

Example 2:
Text: "Spring Boot 3 requires Java 17 and uses jakarta packages."
Output: ["Requires Java 17", "Uses jakarta packages"]

Now extract from:
Text: {text}
Output:
`;
```

### 3. Set Clear Constraints

```typescript
const prompt = `
Summarize the migration guide.

Constraints:
- Maximum 3 sentences
- Focus on breaking changes only
- Use simple language
- No technical jargon

Guide: {guide}
Summary:
`;
```

### 4. Handle Edge Cases

```typescript
const prompt = `
Extract migration steps from the documentation.

If no steps are found, return: {"steps": [], "reason": "No steps found"}
If the content is not about migration, return: {"error": "Not a migration guide"}

Documentation: {content}
Output (JSON):
`;
```

### 5. Iterate and Refine

Test prompts with various inputs and refine based on outputs:

```typescript
// Version 1 - Too vague
"Tell me about the migration"

// Version 2 - Better but still ambiguous
"List the migration steps"

// Version 3 - Clear and structured
"Extract migration steps as a JSON array of strings, ordered by execution sequence"
```

## Prompt Template Patterns

### 1. Chat Templates

For conversation-style interactions:

```typescript
import { ChatPromptTemplate } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a {role}"],
  ["human", "{question}"],
  ["ai", "{previous_response}"],
  ["human", "Follow up: {followup}"],
]);

const formatted = await prompt.format({
  role: "migration expert",
  question: "How to migrate?",
  previous_response: "First, update dependencies",
  followup: "What about breaking changes?",
});
```

### 2. Template Variables

Use variables for dynamic content:

```typescript
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are analyzing {software} version {from_version} to {to_version}"],
  ["human", "Documentation: {docs}\n\nAnalyze:"],
]);

const chain = prompt.pipe(llm);
const result = await chain.invoke({
  software: "Spring Boot",
  from_version: "2.7",
  to_version: "3.0",
  docs: "...",
});
```

### 3. Partial Templates

Pre-fill some variables:

```typescript
const basePrompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a {role} specializing in {domain}"],
  ["human", "{task}"],
]);

const migrationPrompt = await basePrompt.partial({
  role: "software engineer",
  domain: "version migrations",
});

// Now only need to provide task
const result = await migrationPrompt.format({
  task: "Analyze Spring Boot migration",
});
```

## Working with LLM Responses

### Parsing JSON Responses

```typescript
const response = await llm.invoke(prompt);
const content = response.content.toString();

try {
  const parsed = JSON.parse(content);
  return parsed;
} catch (error) {
  // Fallback: extract JSON from markdown code blocks
  const jsonMatch = content.match(/```json\n(.*?)\n```/s);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }
  
  throw new Error("Could not parse LLM response as JSON");
}
```

### Handling Streaming

```typescript
let fullResponse = "";

for await (const chunk of await llm.stream(prompt)) {
  fullResponse += chunk.content;
  // Update UI in real-time
  updateProgress(fullResponse);
}

return fullResponse;
```

## Error Handling

### Retry Logic

```typescript
async function llmWithRetry(prompt: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await llm.invoke(prompt);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      await sleep(1000 * Math.pow(2, i));
    }
  }
}
```

### Validation

```typescript
async function llmWithValidation(prompt: string, validator: (result: any) => boolean) {
  const response = await llm.invoke(prompt);
  const parsed = JSON.parse(response.content.toString());
  
  if (!validator(parsed)) {
    throw new Error("LLM response failed validation");
  }
  
  return parsed;
}

// Usage
const result = await llmWithValidation(
  prompt,
  (r) => Array.isArray(r.steps) && r.steps.length > 0
);
```

## Key Takeaways

1. **Model selection** affects quality and cost
2. **Temperature** controls creativity vs consistency
3. **Prompts** should be specific, structured, and clear
4. **System messages** set the role and context
5. **Output format** should be explicitly specified
6. **Examples** improve consistency (few-shot learning)
7. **Error handling** and validation are essential
8. **Iteration** improves prompts over time

## Next Steps

Now let's see how all these pieces come together in the overall graph architecture.

Continue to: [Tutorial 5: Graph Design & Control Flow](./05-graph-design.md)

