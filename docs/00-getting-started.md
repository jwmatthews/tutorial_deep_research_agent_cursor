# Getting Started with Deep Research Agent

Welcome! This guide will help you set up and run the Deep Research Agent, a powerful tool for finding software migration guides.

## What is the Deep Research Agent?

The Deep Research Agent is an AI-powered CLI tool that searches the internet for comprehensive migration guides. Simply ask it about any software migration (like "Spring Boot 2 to 3"), and it will:

1. Search the internet for official documentation
2. Filter and analyze relevant results
3. Extract migration steps, breaking changes, and examples
4. Present a structured, actionable guide

## Prerequisites

Before you begin, make sure you have:

- **Node.js** (v18 or later)
- **npm** or **yarn** package manager
- **OpenAI API Key** (from https://platform.openai.com)
- **Tavily API Key** (from https://tavily.com)

## Installation Steps

### 1. Clone or Download the Project

```bash
git clone <repository-url>
cd deep-research-agent
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- LangChain and LangGraph for AI orchestration
- React and Ink for the CLI interface
- OpenAI and Tavily integrations

### 3. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit the `.env` file and add your API keys:

```env
OPENAI_API_KEY=sk-your-openai-key-here
TAVILY_API_KEY=tvly-your-tavily-key-here
OPENAI_MODEL=gpt-4
DEBUG=false
```

#### Getting API Keys

**OpenAI:**
1. Visit https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new API key
4. Copy and paste it into your `.env` file

**Tavily:**
1. Visit https://tavily.com
2. Sign up for a free account
3. Navigate to your dashboard to get your API key
4. Copy and paste it into your `.env` file

### 4. Build the Project

```bash
npm run build
```

This compiles the TypeScript code into JavaScript in the `dist/` directory.

### 5. Run the Agent

You have two options:

**Option A: Development mode (with TypeScript)**
```bash
npm run dev
```

**Option B: Production mode (compiled JavaScript)**
```bash
npm start
```

**Option C: Install globally**
```bash
npm run link
deep-research-agent
```

## First Query

Once the agent is running, you'll see an interactive prompt:

```
🔬 DEEP RESEARCH AGENT - Migration Guide Finder

Enter your migration query:
→ 
```

Try entering a query like:
- "Spring Boot 2 to Spring Boot 3"
- "React 17 to React 18"
- "Node.js 16 to Node.js 20"

The agent will then:
1. Parse and enhance your query
2. Search the internet using Tavily
3. Filter relevant results
4. Analyze documentation
5. Synthesize a comprehensive guide

## Understanding the Output

The agent provides structured output:

### 📋 Summary
A brief overview of the migration

### 🔄 Migration Steps
Ordered list of steps to follow

### ⚠️ Breaking Changes
Critical changes that will break existing code

### 💡 Examples & Notes
Code examples and important notes

### 🔗 Sources
Links to the documentation sources

## Keyboard Shortcuts

- **Enter** - Submit your query
- **Ctrl+R** - Start a new query (after completing one)
- **Ctrl+C** - Exit the application

## Troubleshooting

### "Missing required environment variables"
Make sure you've created a `.env` file with both `OPENAI_API_KEY` and `TAVILY_API_KEY`.

### "Search failed" or "API Error"
- Check that your API keys are valid
- Verify you have sufficient API credits
- Check your internet connection

### TypeScript compilation errors
- Make sure you're using Node.js v18 or later
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

### No results found
- Try rephrasing your query to be more specific
- Include version numbers explicitly
- Use official product names (e.g., "Spring Boot" not "springboot")

## Next Steps

Now that you have the agent running, explore the tutorial series to understand how it works:

1. [LangChain & LangGraph Fundamentals](./01-langchain-langgraph-basics.md)
2. [Building Stateful Agents](./02-stateful-agents.md)
3. [Tool Integration](./03-tool-integration.md)
4. [LLM Integration & Prompting](./04-llm-prompting.md)
5. [Graph Design & Control Flow](./05-graph-design.md)
6. [React & Ink for CLI](./06-react-ink-basics.md)
7. [Advanced Ink Patterns](./07-advanced-ink.md)
8. [Integration Architecture](./08-integration-architecture.md)
9. [Extending the Agent](./09-extending-the-agent.md)

## Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review the relevant tutorial documentation
3. Check the console for error messages (run with `DEBUG=true` for more details)

Enjoy researching migrations with AI! 🚀

