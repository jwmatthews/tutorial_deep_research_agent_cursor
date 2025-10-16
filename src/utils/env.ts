/**
 * Environment Configuration Utilities
 * 
 * This module handles loading and validating environment variables.
 */

import * as dotenv from "dotenv";
import * as path from "path";

/**
 * Load environment variables from .env file
 */
export function loadEnvironment() {
  // Try to load from current directory
  const result = dotenv.config();
  
  if (result.error) {
    // Try to load from parent directory (when running from dist/)
    dotenv.config({ path: path.join(__dirname, "../../.env") });
  }
}

/**
 * Get an environment variable with a default value
 */
export function getEnv(key: string, defaultValue: string = ""): string {
  return process.env[key] || defaultValue;
}

/**
 * Check if running in debug mode
 */
export function isDebugMode(): boolean {
  return process.env.DEBUG === "true";
}

