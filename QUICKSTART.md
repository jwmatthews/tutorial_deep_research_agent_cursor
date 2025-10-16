# Quick Start Guide - Deep Research Agent

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- OpenAI API key
- Tavily API key

## Installation

```bash
# 1. Navigate to project
cd /Users/jmatthews/tmp/langgraph_tutorial/cursor

# 2. Install dependencies
npm install

# 3. Create environment file
cat > .env << EOF
OPENAI_API_KEY=your_openai_key_here
TAVILY_API_KEY=your_tavily_key_here
OPENAI_MODEL=gpt-4
DEBUG=false
EOF

# 4. Edit .env and add your actual API keys
nano .env  # or use your preferred editor

# 5. Build the project
npm run build

# 6. Run the agent
npm start
```

## Get API Keys

### OpenAI API Key
1. Visit https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Paste into `.env` file

### Tavily API Key
1. Visit https://tavily.com
2. Sign up for free account
3. Go to dashboard
4. Copy your API key (starts with `tvly-`)
5. Paste into `.env` file

## First Query

When the CLI starts, enter a migration query:

```
Enter your migration query:
→ Spring Boot 2 to Spring Boot 3
```

Press Enter and watch the agent work!

## Example Queries to Try

```
Spring Boot 2 to Spring Boot 3
React 17 to React 18
Node.js 16 to Node.js 20
Python 3.9 to Python 3.12
Angular 14 to Angular 15
Django 3 to Django 4
```

## Keyboard Shortcuts

- **Enter** - Submit query
- **Ctrl+R** - New query (after completing one)
- **Ctrl+C** - Exit

## Troubleshooting

### "Missing required environment variables"
→ Make sure `.env` file exists and contains both API keys

### "Command not found: npm"
→ Install Node.js from https://nodejs.org

### "Cannot find module"
→ Run `npm install` again

### API errors
→ Check your API keys are correct and have credits

## Development Mode

Run without building:

```bash
npm run dev
```

## Global Installation

Install as a global command:

```bash
npm run link
deep-research-agent
```

## Next Steps

1. ✅ Try different queries
2. 📚 Read [README.md](README.md) for full documentation
3. 🎓 Start with [Tutorial 00](docs/00-getting-started.md)
4. 🔧 Explore [extending the agent](docs/09-extending-the-agent.md)
5. 💡 Check [example queries](examples/sample-queries.md)

## Need Help?

- Read the [Getting Started guide](docs/00-getting-started.md)
- Check [README.md](README.md) troubleshooting section
- Review [example queries](examples/sample-queries.md)

## What's Next?

This project includes:
- ✅ Complete working implementation
- ✅ 9 comprehensive tutorials
- ✅ Full source code with comments
- ✅ Examples and references

**Start learning:** Read tutorials in `docs/` folder in order (00-09)

Enjoy building AI agents! 🚀

