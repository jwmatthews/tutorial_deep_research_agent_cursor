# Deep Research Agent

An AI-powered CLI tool that searches the internet for comprehensive software migration guides. Built with TypeScript, LangChain, LangGraph, and React/Ink.

![CLI Demo](docs/assets/demo.gif)

## Features

- 🔍 **Intelligent Search** - Uses Tavily AI to find relevant migration documentation
- 🤖 **LLM-Powered Analysis** - GPT-4 analyzes and extracts structured information
- 📊 **Structured Output** - Migration steps, breaking changes, code examples
- ⚡ **Real-Time Progress** - See what the agent is doing as it works
- 🎨 **Beautiful CLI** - Interactive terminal UI built with React/Ink
- 🔄 **Smart Retry Logic** - Automatically refines searches if results are poor
- 🌐 **Multi-Source Analysis** - Combines information from multiple sources

## Quick Start

### Prerequisites

- Node.js v18 or later
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- Tavily API key ([get one here](https://tavily.com))

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd deep-research-agent

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys

# Build the project
npm run build

# Run the agent
npm start
```

### Usage

```bash
# Interactive mode
npm start

# Development mode (with TypeScript)
npm run dev

# Install globally
npm run link
deep-research-agent
```

Enter a migration query when prompted:
```
Enter your migration query:
→ Spring Boot 2 to Spring Boot 3
```

The agent will:
1. Enhance your query for better search results
2. Search the internet using Tavily
3. Filter results by relevance using LLM
4. Analyze top sources for migration info
5. Synthesize findings into a structured guide

## Example Output

```
🔬 DEEP RESEARCH AGENT - Migration Guide Finder
╭──────────────────────────────────────────────╮
│ Query: Spring Boot 2 to Spring Boot 3        │
╰──────────────────────────────────────────────╯

✓ Searching... Found 10 results
✓ Analyzing documentation...
✓ Creating your migration guide...

📋 Summary
Spring Boot 3.0 requires Java 17 as the minimum version and migrates from
javax.* to jakarta.* namespace...

🔄 Migration Steps
1. Upgrade to Java 17
2. Update Spring Boot version to 3.0 in pom.xml or build.gradle
3. Replace all javax.* imports with jakarta.*
4. Update Spring Security configuration to use lambda DSL
5. Review and update deprecated APIs

⚠️ Breaking Changes
• Java 17 is now the minimum required version
• javax.* to jakarta.* namespace migration required
• Spring Security configuration changes mandatory
• Several APIs have been removed or changed

💡 Examples & Notes
• Configuration example: @EnableWebSecurity with new SecurityFilterChain
• Use Spring Boot Migrator tool for automated refactoring
• Test thoroughly after migration, especially security configurations

🔗 Sources
1. https://spring.io/blog/2022/11/16/spring-boot-3-0-goes-ga
2. https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide
3. https://docs.spring.io/spring-boot/docs/3.0.0/reference/html/

Press Ctrl+R for new query • Press Ctrl+C to exit
```

## Architecture

### System Overview

```
┌─────────────────────────────────────┐
│         CLI Interface               │
│         (React/Ink)                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      LangGraph Agent                │
│  ┌────────┐  ┌────────┐  ┌────────┐│
│  │ Parse  │→│ Search │→│ Analyze││
│  └────────┘  └────────┘  └────────┘│
└──────────────┬──────────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌──────────┐      ┌──────────┐
│ OpenAI   │      │ Tavily   │
│ GPT-4    │      │ Search   │
└──────────┘      └──────────┘
```

### Key Components

**Agent Layer** (`src/agent/`)
- **graph.ts** - LangGraph state machine with nodes and edges
- **llm.ts** - OpenAI integration and prompt templates
- **tools/search.ts** - Tavily search integration
- **index.ts** - Public API for agent execution

**CLI Layer** (`src/cli/`)
- **App.tsx** - Main React/Ink application
- **components/** - Reusable UI components
- **hooks/useAgent.ts** - Custom hook for agent integration

**Types** (`src/types/`)
- **agent.ts** - TypeScript types and state schemas

## Documentation

Comprehensive tutorials covering all aspects:

1. [Getting Started](docs/00-getting-started.md) - Setup and first query
2. [LangChain & LangGraph Basics](docs/01-langchain-langgraph-basics.md) - Core concepts
3. [Building Stateful Agents](docs/02-stateful-agents.md) - State management
4. [Tool Integration](docs/03-tool-integration.md) - Tavily search integration
5. [LLM Integration & Prompting](docs/04-llm-prompting.md) - Prompt engineering
6. [Graph Design & Control Flow](docs/05-graph-design.md) - Agent architecture
7. [React & Ink for CLI](docs/06-react-ink-basics.md) - Terminal UI basics
8. [Advanced Ink Patterns](docs/07-advanced-ink.md) - Advanced UI patterns
9. [Integration Architecture](docs/08-integration-architecture.md) - How it all fits together
10. [Extending the Agent](docs/09-extending-the-agent.md) - Customization guide

## Project Structure

```
deep-research-agent/
├── src/
│   ├── agent/              # Agent implementation
│   │   ├── graph.ts        # LangGraph state machine
│   │   ├── index.ts        # Public API
│   │   ├── llm.ts          # LLM configuration
│   │   └── tools/          # External tools
│   │       └── search.ts   # Tavily integration
│   ├── cli/                # CLI interface
│   │   ├── App.tsx         # Main application
│   │   ├── components/     # UI components
│   │   │   ├── QueryInput.tsx
│   │   │   ├── Progress.tsx
│   │   │   └── Results.tsx
│   │   └── hooks/          # Custom hooks
│   │       └── useAgent.ts
│   ├── types/              # Type definitions
│   │   └── agent.ts
│   ├── utils/              # Utilities
│   │   └── env.ts
│   └── index.tsx           # Entry point
├── docs/                   # Tutorial documentation
├── examples/               # Example queries
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

### Environment Variables

Create a `.env` file:

```env
# Required
OPENAI_API_KEY=sk-your-openai-key
TAVILY_API_KEY=tvly-your-tavily-key

# Optional
OPENAI_MODEL=gpt-4
DEBUG=false
```

### Models

The agent uses GPT-4 by default for best results. You can change this:

```env
OPENAI_MODEL=gpt-3.5-turbo  # Faster, cheaper, less capable
OPENAI_MODEL=gpt-4          # Best quality (default)
OPENAI_MODEL=gpt-4-turbo    # Faster GPT-4
```

## Development

### Scripts

```bash
npm run dev      # Run in development mode (ts-node)
npm run build    # Compile TypeScript
npm start        # Run compiled version
npm run link     # Install CLI globally
npm test         # Run tests
```

### Adding New Features

See [Tutorial 9: Extending the Agent](docs/09-extending-the-agent.md) for detailed guides on:
- Adding new tools (GitHub, web scraping, etc.)
- Creating custom graph nodes
- Modifying prompts
- Customizing the UI
- Adding configuration options

## Troubleshooting

### "Missing required environment variables"

Make sure you've created a `.env` file with both `OPENAI_API_KEY` and `TAVILY_API_KEY`.

### "Search failed" or API Errors

- Verify your API keys are valid
- Check you have sufficient API credits
- Ensure you have internet connectivity

### No Results Found

- Try rephrasing your query to be more specific
- Include version numbers explicitly
- Use official product names

### TypeScript Compilation Errors

- Ensure you're using Node.js v18+
- Delete `node_modules` and reinstall: `npm install`
- Check `tsconfig.json` settings

## Example Queries

Try these migration scenarios:

```
Spring Boot 2 to Spring Boot 3
React 17 to React 18
Node.js 16 to Node.js 20
Python 3.9 to Python 3.12
Angular 14 to Angular 15
Vue 2 to Vue 3
Django 3 to Django 4
.NET 6 to .NET 8
```

## Performance

- **Average query time:** 20-30 seconds
- **API calls per query:** ~5-7 LLM calls, 1-2 search calls
- **Cost per query:** ~$0.10-0.20 (OpenAI + Tavily)

## Limitations

- Requires active internet connection
- Limited to publicly available documentation
- Quality depends on available documentation
- API rate limits apply

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Apache 2 License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [LangChain](https://js.langchain.com/) - LLM framework
- [LangGraph](https://langchain-ai.github.io/langgraphjs/) - Agent orchestration
- [Ink](https://github.com/vadimdemedes/ink) - React for CLI
- [Tavily](https://tavily.com) - AI search API
- [OpenAI](https://openai.com) - GPT-4 language model

## Learn More

- [LangChain JS Docs](https://js.langchain.com/docs/)
- [LangGraph Tutorial](https://langchain-ai.github.io/langgraphjs/)
- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [Building AI Agents](https://www.langchain.com/blog/agents)

## Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/deep-research-agent/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/deep-research-agent/discussions)
- **Email:** support@example.com

---

Built with ❤️ using TypeScript, LangChain, and React

