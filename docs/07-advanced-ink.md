# Tutorial 7: Advanced Ink Patterns

## Introduction

This tutorial covers advanced patterns for building sophisticated CLI applications with Ink, including real-time updates, performance optimization, and complex UI patterns.

## Real-Time Updates Without Flickering

### The Problem

Naive terminal updates can cause flickering:

```jsx
// ❌ BAD: Causes flickering
setInterval(() => {
  console.clear();
  console.log("Progress: " + progress);
}, 100);
```

### The Solution

Ink handles this automatically with React's reconciliation:

```jsx
// ✅ GOOD: Smooth updates
function ProgressBar({ progress }) {
  return (
    <Box>
      <Text>Progress: {progress}%</Text>
    </Box>
  );
}

// Updates trigger re-render, not re-print
function App() {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => Math.min(p + 10, 100));
    }, 100);
    
    return () => clearInterval(timer);
  }, []);
  
  return <ProgressBar progress={progress} />;
}
```

**Why it works:**
- Ink only updates changed parts
- Uses terminal cursor positioning
- Avoids clearing and reprinting

## Streaming Updates from Async Operations

### Pattern: Streaming Agent Results

Our agent streams updates as it progresses:

```jsx
// src/cli/hooks/useAgent.ts
export function useAgent() {
  const [state, setState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const executeQuery = useCallback(async (query) => {
    setIsLoading(true);
    
    // Stream updates from agent
    await executeResearchStreaming(query, (updatedState) => {
      setState(updatedState); // Each update triggers re-render
    });
    
    setIsLoading(false);
  }, []);

  return { state, isLoading, executeQuery };
}
```

**In the UI:**

```jsx
function App() {
  const { state, isLoading, executeQuery } = useAgent();
  
  return (
    <Box flexDirection="column">
      {/* Shows current status in real-time */}
      <Text>Status: {state?.status}</Text>
      
      {/* Updates as search results arrive */}
      <Text>Results: {state?.searchResults?.length || 0}</Text>
    </Box>
  );
}
```

### Pattern: Progress Through Steps

Show which step is currently executing:

```jsx
function StepProgress({ currentStatus }) {
  const steps = [
    { id: "parsing_query", name: "Parsing Query" },
    { id: "searching", name: "Searching" },
    { id: "filtering_results", name: "Filtering Results" },
    { id: "analyzing", name: "Analyzing" },
    { id: "synthesizing", name: "Synthesizing" },
  ];
  
  return (
    <Box flexDirection="column">
      {steps.map((step) => {
        const isActive = step.id === currentStatus;
        const isComplete = steps.findIndex(s => s.id === currentStatus) > 
                          steps.findIndex(s => s.id === step.id);
        
        return (
          <Box key={step.id}>
            <Text color={isComplete ? "green" : isActive ? "yellow" : "gray"}>
              {isComplete ? "✓" : isActive ? "→" : "○"} {step.name}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
```

## Multi-Screen Navigation

### Pattern: Screen State Machine

```jsx
type Screen = "home" | "searching" | "results";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [results, setResults] = useState(null);
  
  const handleSearch = async (query: string) => {
    setScreen("searching");
    const data = await search(query);
    setResults(data);
    setScreen("results");
  };
  
  const handleBack = () => {
    setScreen("home");
  };
  
  return (
    <Box>
      {screen === "home" && <HomeScreen onSearch={handleSearch} />}
      {screen === "searching" && <SearchingScreen />}
      {screen === "results" && <ResultsScreen results={results} onBack={handleBack} />}
    </Box>
  );
}
```

### Pattern: Modal Dialogs

```jsx
function App() {
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleDelete = () => {
    setShowConfirm(true);
  };
  
  useInput((input, key) => {
    if (showConfirm) {
      if (input === "y") {
        // Perform delete
        setShowConfirm(false);
      }
      if (input === "n") {
        setShowConfirm(false);
      }
    }
  });
  
  return (
    <Box>
      <MainContent />
      
      {showConfirm && (
        <Box
          position="absolute"
          borderStyle="round"
          borderColor="red"
          padding={1}
        >
          <Text>Are you sure? (y/n)</Text>
        </Box>
      )}
    </Box>
  );
}
```

## Advanced Input Patterns

### Pattern: Input Validation

```jsx
function ValidatedInput() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  
  const handleSubmit = (input: string) => {
    // Validation
    if (input.length < 3) {
      setError("Query must be at least 3 characters");
      return;
    }
    
    if (!/[a-zA-Z]/.test(input)) {
      setError("Query must contain letters");
      return;
    }
    
    setError("");
    // Process valid input
  };
  
  return (
    <Box flexDirection="column">
      <TextInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
      />
      {error && <Text color="red">{error}</Text>}
    </Box>
  );
}
```

### Pattern: Multi-Step Form

```jsx
function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: "", query: "" });
  
  const handleStep1 = (name: string) => {
    setData(d => ({ ...d, name }));
    setStep(2);
  };
  
  const handleStep2 = (query: string) => {
    setData(d => ({ ...d, query }));
    // Submit complete form
    submitForm({ ...data, query });
  };
  
  return (
    <Box flexDirection="column">
      <Text>Step {step} of 2</Text>
      
      {step === 1 && (
        <Box>
          <Text>Name: </Text>
          <TextInput onSubmit={handleStep1} />
        </Box>
      )}
      
      {step === 2 && (
        <Box>
          <Text>Query: </Text>
          <TextInput onSubmit={handleStep2} />
        </Box>
      )}
    </Box>
  );
}
```

### Pattern: Autocomplete

```jsx
function AutocompleteInput() {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const queries = [
    "Spring Boot 2 to 3",
    "React 17 to 18",
    "Node.js 16 to 20",
  ];
  
  useEffect(() => {
    if (value.length > 0) {
      const filtered = queries.filter(q => 
        q.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
    }
  }, [value]);
  
  useInput((input, key) => {
    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(i => i - 1);
    }
    if (key.downArrow && selectedIndex < suggestions.length - 1) {
      setSelectedIndex(i => i + 1);
    }
    if (key.return && suggestions[selectedIndex]) {
      setValue(suggestions[selectedIndex]);
      setSuggestions([]);
    }
  });
  
  return (
    <Box flexDirection="column">
      <TextInput value={value} onChange={setValue} />
      
      {suggestions.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {suggestions.map((suggestion, i) => (
            <Text
              key={i}
              color={i === selectedIndex ? "cyan" : "white"}
              bold={i === selectedIndex}
            >
              {i === selectedIndex ? "→ " : "  "}
              {suggestion}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
```

## Performance Optimization

### Memoization with useMemo

Avoid expensive recalculations:

```jsx
function ResultsList({ results }) {
  // Only recalculate when results change
  const sortedResults = useMemo(() => {
    return results
      .slice()
      .sort((a, b) => b.score - a.score);
  }, [results]);
  
  return (
    <Box flexDirection="column">
      {sortedResults.map(result => (
        <ResultItem key={result.id} result={result} />
      ))}
    </Box>
  );
}
```

### Callback Memoization with useCallback

Prevent unnecessary re-renders:

```jsx
function App() {
  const [query, setQuery] = useState("");
  
  // Memoize callback
  const handleSubmit = useCallback((value: string) => {
    console.log("Submitted:", value);
  }, []); // Empty deps = never recreated
  
  return (
    <QueryInput
      value={query}
      onChange={setQuery}
      onSubmit={handleSubmit} // Stable reference
    />
  );
}
```

### Component Memoization with React.memo

Prevent re-renders of unchanged components:

```jsx
// Component only re-renders if props change
const ResultItem = React.memo(({ result }) => {
  return (
    <Box>
      <Text>{result.title}</Text>
      <Text dimColor>{result.url}</Text>
    </Box>
  );
});
```

## Error Boundaries

Handle errors gracefully:

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error("Caught error:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Box borderStyle="round" borderColor="red" padding={1}>
          <Text color="red" bold>Error Occurred</Text>
          <Text>{this.state.error?.message}</Text>
        </Box>
      );
    }
    
    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <ErrorBoundary>
      <MainContent />
    </ErrorBoundary>
  );
}
```

## Custom Hooks for Common Patterns

### useAsyncData Hook

```jsx
function useAsyncData(fetchFn, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetch() {
      try {
        setLoading(true);
        const result = await fetchFn();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    fetch();
    
    return () => {
      cancelled = true;
    };
  }, dependencies);
  
  return { data, loading, error };
}

// Usage
function App() {
  const { data, loading, error } = useAsyncData(
    () => fetchMigrationGuide("Spring Boot 2 to 3"),
    []
  );
  
  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text color="red">Error: {error.message}</Text>;
  return <Results data={data} />;
}
```

### useKeyPress Hook

```jsx
function useKeyPress(targetKey, callback) {
  useInput((input, key) => {
    if (key[targetKey]) {
      callback();
    }
  });
}

// Usage
function App() {
  const [count, setCount] = useState(0);
  
  useKeyPress("upArrow", () => setCount(c => c + 1));
  useKeyPress("downArrow", () => setCount(c => c - 1));
  useKeyPress("return", () => console.log("Current:", count));
  
  return <Text>Count: {count}</Text>;
}
```

### useInterval Hook

```jsx
function useInterval(callback, delay) {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

// Usage
function Timer() {
  const [seconds, setSeconds] = useState(0);
  
  useInterval(() => {
    setSeconds(s => s + 1);
  }, 1000);
  
  return <Text>Elapsed: {seconds}s</Text>;
}
```

## Accessibility Considerations

### Screen Reader Support

```jsx
// Use descriptive text
<Text>Processing step 2 of 5: Searching documentation</Text>

// Not just:
<Text>⏳</Text>
```

### Color Blindness

```jsx
// Don't rely only on color
<Text color="red">✗ Error</Text>  // Icon + color
<Text color="green">✓ Success</Text>

// Not just:
<Text color="red">Failed</Text>  // Color only
```

### Keyboard Navigation

```jsx
// Always provide keyboard alternatives
useInput((input, key) => {
  if (key.return) handleSubmit();  // Enter
  if (input === " ") handleSubmit(); // Space
  if (key.escape) handleCancel();   // Escape
});
```

## Testing Ink Components

### Snapshot Testing

```jsx
import { render } from 'ink-testing-library';

test('renders correctly', () => {
  const { lastFrame } = render(<App />);
  expect(lastFrame()).toMatchSnapshot();
});
```

### Interactive Testing

```jsx
import { render } from 'ink-testing-library';

test('handles input', () => {
  const { stdin, lastFrame } = render(<App />);
  
  // Simulate user typing
  stdin.write('test query');
  expect(lastFrame()).toContain('test query');
  
  // Simulate Enter
  stdin.write('\r');
  expect(lastFrame()).toContain('Searching...');
});
```

## Key Takeaways

1. **Ink handles flickering** automatically with reconciliation
2. **State updates** trigger smooth re-renders
3. **Streaming data** integrates naturally with React state
4. **Multi-screen apps** use state machines
5. **Custom hooks** encapsulate reusable patterns
6. **Performance optimization** uses standard React patterns
7. **Error boundaries** catch and display errors gracefully
8. **Accessibility** matters in terminal UIs too

## Next Steps

Let's see how all these pieces fit together in the overall architecture.

Continue to: [Tutorial 8: Integration Architecture](./08-integration-architecture.md)

