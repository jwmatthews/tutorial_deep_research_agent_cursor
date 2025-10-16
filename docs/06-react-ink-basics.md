# Tutorial 6: React & Ink for CLI Development

## Introduction

This tutorial introduces React and Ink for building terminal user interfaces. You'll learn how React's component model translates to the terminal, and how to create interactive CLI applications.

## What is Ink?

**Ink** is a library that allows you to build command-line interfaces using React components. It renders React components to the terminal instead of the DOM.

### Why Use Ink?

**Traditional CLI Approaches:**
```javascript
// Imperative, hard to maintain
console.log("Loading...");
process.stdout.write("\r✓ Done!     \n");
```

**With Ink (React):**
```jsx
// Declarative, component-based
<Box>
  {loading ? <Text>Loading...</Text> : <Text>✓ Done!</Text>}
</Box>
```

**Benefits:**
- Declarative UI (describe what, not how)
- Component reusability
- State management with React hooks
- Familiar React patterns
- Automatic rendering optimization

## Basic Ink Concepts

### 1. Components

Just like React for web, but using terminal-specific components:

```jsx
import React from 'react';
import { Text, Box } from 'ink';

const App = () => (
  <Box>
    <Text color="green">Hello, Terminal!</Text>
  </Box>
);
```

### 2. Rendering

Use Ink's `render()` instead of ReactDOM:

```jsx
import { render } from 'ink';

render(<App />);
```

### 3. Layout with Flexbox

Ink uses Flexbox for layout (like React Native):

```jsx
<Box flexDirection="column">  {/* Vertical */}
  <Text>First line</Text>
  <Text>Second line</Text>
</Box>

<Box flexDirection="row">  {/* Horizontal */}
  <Text>Left</Text>
  <Text>Right</Text>
</Box>
```

## Core Ink Components

### Text Component

Displays text with styling:

```jsx
import { Text } from 'ink';

// Basic text
<Text>Plain text</Text>

// Colored text
<Text color="green">Success!</Text>
<Text color="red">Error!</Text>
<Text color="yellow">Warning</Text>

// Bold/italic/underline
<Text bold>Bold text</Text>
<Text italic>Italic text</Text>
<Text underline>Underlined</Text>

// Dimmed (less prominent)
<Text dimColor>Subtle text</Text>

// Background color
<Text backgroundColor="blue">Highlighted</Text>

// Combinations
<Text bold color="cyan" backgroundColor="black">
  Fancy text
</Text>
```

### Box Component

Container for layout (like `div`):

```jsx
import { Box } from 'ink';

// Vertical layout
<Box flexDirection="column">
  <Text>Line 1</Text>
  <Text>Line 2</Text>
</Box>

// Horizontal layout
<Box flexDirection="row">
  <Text>Column 1</Text>
  <Text>Column 2</Text>
</Box>

// With spacing
<Box marginTop={1} marginBottom={1} paddingX={2}>
  <Text>Spaced content</Text>
</Box>

// Borders
<Box borderStyle="round" borderColor="cyan" padding={1}>
  <Text>Boxed content</Text>
</Box>
```

**Border Styles:**
- `single` - Single line `┌───┐`
- `double` - Double line `╔═══╗`
- `round` - Rounded corners `╭───╮`
- `bold` - Bold line
- `singleDouble` - Mix of single and double

### Newline Component

Force line breaks:

```jsx
import { Newline } from 'ink';

<Box>
  <Text>Line 1</Text>
  <Newline />
  <Text>Line 2 (with gap)</Text>
</Box>
```

## Interactive Components

### User Input with useInput

Handle keyboard input:

```jsx
import { useInput } from 'ink';

function App() {
  useInput((input, key) => {
    if (key.return) {
      console.log('Enter pressed!');
    }
    
    if (key.escape) {
      console.log('Escape pressed!');
    }
    
    if (key.ctrl && input === 'c') {
      process.exit(0);
    }
    
    console.log('Key:', input);
  });
  
  return <Text>Press any key...</Text>;
}
```

**Key Object Properties:**
- `key.return` - Enter key
- `key.escape` - Escape key
- `key.ctrl` - Ctrl modifier
- `key.shift` - Shift modifier
- `key.upArrow`, `key.downArrow`, etc.
- `key.tab` - Tab key

### Text Input with ink-text-input

Pre-built text input component:

```jsx
import TextInput from 'ink-text-input';
import { useState } from 'react';

function App() {
  const [query, setQuery] = useState('');
  
  const handleSubmit = (value) => {
    console.log('Submitted:', value);
  };
  
  return (
    <Box>
      <Text>Query: </Text>
      <TextInput
        value={query}
        onChange={setQuery}
        onSubmit={handleSubmit}
        placeholder="Type something..."
      />
    </Box>
  );
}
```

### App Control with useApp

Control the Ink app lifecycle:

```jsx
import { useApp } from 'ink';

function App() {
  const { exit } = useApp();
  
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit(); // Gracefully exit
    }
  });
  
  return <Text>Press Ctrl+C to exit</Text>;
}
```

## State Management

Use React hooks just like in web development:

### useState

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  
  useInput((input, key) => {
    if (key.upArrow) {
      setCount(c => c + 1);
    }
    if (key.downArrow) {
      setCount(c => c - 1);
    }
  });
  
  return <Text>Count: {count}</Text>;
}
```

### useEffect

```jsx
function LoadingComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      const result = await fetch('...');
      setData(result);
      setLoading(false);
    }
    
    fetchData();
  }, []);
  
  if (loading) return <Text>Loading...</Text>;
  return <Text>Data: {data}</Text>;
}
```

### Custom Hooks

```jsx
function useAgent() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const execute = async (query) => {
    setLoading(true);
    const result = await runAgent(query);
    setState(result);
    setLoading(false);
  };
  
  return { state, loading, execute };
}

// Usage
function App() {
  const { state, loading, execute } = useAgent();
  
  // ... use in component
}
```

## Building Our CLI Components

### QueryInput Component

```jsx
// src/cli/components/QueryInput.tsx
import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function QueryInput({ value, onChange, onSubmit, disabled }: QueryInputProps) {
  const handleSubmit = (submittedValue: string) => {
    const trimmed = submittedValue.trim();
    if (trimmed.length > 0) {
      onSubmit(trimmed);
    }
  };

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Enter your migration query:
        </Text>
      </Box>
      
      <Box>
        <Text color="gray">→ </Text>
        <TextInput
          value={value}
          onChange={onChange}
          onSubmit={handleSubmit}
          placeholder="e.g., Spring Boot 2 to 3"
          disabled={disabled}
        />
      </Box>
      
      {value.length === 0 && !disabled && (
        <Box marginTop={1}>
          <Text dimColor>
            Examples: "Spring Boot 2 to 3" • "React 17 to 18"
          </Text>
        </Box>
      )}
    </Box>
  );
}
```

**Key Features:**
- Controlled component (value/onChange)
- Submit handler with validation
- Disabled state support
- Example hints
- Styled with colors and spacing

### Progress Component

```jsx
// src/cli/components/Progress.tsx
import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";

interface ProgressProps {
  status: string;
  message: string;
  isLoading: boolean;
}

export function Progress({ status, message, isLoading }: ProgressProps) {
  if (!isLoading && status !== "complete") {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete": return "green";
      case "error": return "red";
      default: return "yellow";
    }
  };

  return (
    <Box marginY={1}>
      <Box marginRight={1}>
        {isLoading ? (
          <Text color={getStatusColor(status)}>
            <Spinner type="dots" />
          </Text>
        ) : (
          <Text color="green">✓</Text>
        )}
      </Box>
      <Text color={getStatusColor(status)}>{message}</Text>
    </Box>
  );
}
```

**Key Features:**
- Conditional rendering based on loading state
- Dynamic color based on status
- Spinner from `ink-spinner` package
- Margin for spacing

### Results Component

```jsx
// src/cli/components/Results.tsx
import React from "react";
import { Box, Text } from "ink";

export function Results({ findings }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      {/* Summary */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">📋 Summary</Text>
        <Box paddingLeft={2}>
          <Text>{findings.summary}</Text>
        </Box>
      </Box>

      {/* Migration Steps */}
      {findings.migrationSteps.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="cyan">🔄 Migration Steps</Text>
          <Box flexDirection="column" paddingLeft={2}>
            {findings.migrationSteps.map((step, index) => (
              <Box key={index}>
                <Text color="yellow">{index + 1}. </Text>
                <Text>{step}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* More sections... */}
    </Box>
  );
}
```

**Key Features:**
- Structured layout with sections
- Color-coded headings
- Numbered/bulleted lists
- Indentation for hierarchy

## Main App Structure

```jsx
// src/cli/App.tsx
import React, { useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { QueryInput } from "./components/QueryInput";
import { Progress } from "./components/Progress";
import { Results } from "./components/Results";
import { useAgent } from "./hooks/useAgent";

export function App() {
  const { exit } = useApp();
  const [query, setQuery] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { state, isLoading, error, executeQuery, reset, statusMessage } = useAgent();

  // Keyboard shortcuts
  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
    }
    
    if (key.ctrl && input === "r" && !isLoading) {
      reset();
      setQuery("");
      setHasSubmitted(false);
    }
  });

  const handleSubmit = async (submittedQuery: string) => {
    setHasSubmitted(true);
    await executeQuery(submittedQuery);
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="round" borderColor="cyan" padding={1}>
        <Text bold color="cyan">
          🔬 DEEP RESEARCH AGENT
        </Text>
      </Box>

      {/* Input */}
      {!hasSubmitted && (
        <QueryInput
          value={query}
          onChange={setQuery}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
      )}

      {/* Progress */}
      {isLoading && state && (
        <Progress
          status={state.status}
          message={statusMessage}
          isLoading={isLoading}
        />
      )}

      {/* Results */}
      {state?.findings && !isLoading && (
        <Results findings={state.findings} />
      )}

      {/* Error */}
      {error && <Text color="red">Error: {error}</Text>}

      {/* Footer */}
      <Box marginTop={1} borderStyle="single" borderColor="gray">
        <Text dimColor>
          Press Ctrl+R for new query • Press Ctrl+C to exit
        </Text>
      </Box>
    </Box>
  );
}
```

**Structure:**
1. **State management** with hooks
2. **Keyboard handlers** for shortcuts
3. **Conditional rendering** based on state
4. **Component composition** for modularity
5. **Consistent styling** throughout

## Key Takeaways

1. **Ink** brings React to the terminal
2. **Components** are declared like web React
3. **Flexbox** provides layout control
4. **Text** and **Box** are core primitives
5. **Hooks** work exactly like web React
6. **useInput** handles keyboard events
7. **State management** drives the UI
8. **Conditional rendering** creates dynamic UIs

## Next Steps

Now let's explore advanced Ink patterns for more complex interactions.

Continue to: [Tutorial 7: Advanced Ink Patterns](./07-advanced-ink.md)

