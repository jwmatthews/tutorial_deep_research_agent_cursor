#!/usr/bin/env node

/**
 * Deep Research Agent - CLI Entry Point
 * 
 * This is the main entry point for the CLI application.
 * It loads environment variables, validates configuration,
 * and renders the React/Ink interface.
 */

import React from "react";
import { render } from "ink";
import { App } from "./cli/App.js";
import { loadEnvironment } from "./utils/env.js";
import { validateEnvironment } from "./agent/index.js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Main function to start the CLI
 */
async function main() {
  // Load environment variables
  loadEnvironment();

  // Check for command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Deep Research Agent - Migration Guide Finder

USAGE:
  deep-research-agent [OPTIONS]

OPTIONS:
  --help, -h       Show this help message
  --version, -v    Show version information

ENVIRONMENT VARIABLES:
  OPENAI_API_KEY   Your OpenAI API key (required)
  TAVILY_API_KEY   Your Tavily API key (required)
  OPENAI_MODEL     OpenAI model to use (default: gpt-4)
  DEBUG            Enable debug mode (true/false)

EXAMPLES:
  # Run the interactive CLI
  deep-research-agent

  # Set up your environment
  cp .env.example .env
  # Edit .env with your API keys
  
For more information, visit: https://github.com/yourusername/deep-research-agent
    `);
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, "../package.json"), "utf-8")
    );
    console.log(`Deep Research Agent v${packageJson.version}`);
    process.exit(0);
  }

  // Validate environment
  try {
    validateEnvironment();
  } catch (error) {
    console.error("\n❌ Configuration Error:");
    console.error((error as Error).message);
    console.error("\nPlease set up your environment variables.");
    console.error("See .env.example for required variables.\n");
    process.exit(1);
  }

  // Render the Ink app
  render(<App />);
}

// Run the main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

