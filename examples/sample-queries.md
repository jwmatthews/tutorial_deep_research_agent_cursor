# Sample Queries and Expected Outputs

This file contains example queries you can try with the Deep Research Agent and typical outputs you might see.

## Example 1: Spring Boot Migration

### Query
```
Spring Boot 2 to Spring Boot 3
```

### Expected Output Summary

**Migration Steps:**
1. Upgrade to Java 17 as minimum version
2. Update Spring Boot version to 3.0.x in build configuration
3. Replace javax.* package imports with jakarta.*
4. Update Spring Security configuration to use lambda DSL
5. Review and update deprecated API usages
6. Update third-party dependencies for compatibility
7. Test thoroughly, especially security and persistence layers

**Breaking Changes:**
- Java 17 minimum requirement
- javax to jakarta namespace migration
- Spring Security requires lambda-based configuration
- Several auto-configuration classes removed
- Actuator endpoints security changes
- Deprecation removals from Spring Framework 6

**Example Notes:**
- Use Spring Boot Migrator tool for automated refactoring
- Database drivers may need updates for jakarta persistence
- Some third-party libraries may not yet support Spring Boot 3

---

## Example 2: React Version Upgrade

### Query
```
React 17 to React 18
```

### Expected Output Summary

**Migration Steps:**
1. Update React and ReactDOM to version 18
2. Replace ReactDOM.render with createRoot API
3. Enable automatic batching (works by default)
4. Opt into Concurrent Features if needed
5. Update TypeScript types (@types/react@18)
6. Test for any breaking changes in your components

**Breaking Changes:**
- ReactDOM.render is deprecated, use createRoot
- IE 11 is no longer supported
- Automatic batching may affect state update timing
- render function callback removed
- Some TypeScript types have changed

**Example Code:**
```javascript
// Old (React 17)
ReactDOM.render(<App />, document.getElementById('root'));

// New (React 18)
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

---

## Example 3: Node.js Upgrade

### Query
```
Node.js 16 to Node.js 20
```

### Expected Output Summary

**Migration Steps:**
1. Install Node.js 20 LTS
2. Update package.json engines field
3. Run tests to identify compatibility issues
4. Update dependencies that don't support Node 20
5. Review and update any native addons
6. Update CI/CD configurations

**Breaking Changes:**
- Some deprecated APIs removed
- V8 engine updated (may affect performance characteristics)
- Crypto package changes
- URL API behavior changes
- Some dependencies may need updates

**Notes:**
- Node 20 includes performance improvements
- ESM support is more stable
- Built-in test runner available
- Consider updating to latest npm as well

---

## Example 4: Python Version Upgrade

### Query
```
Python 3.9 to Python 3.12
```

### Expected Output Summary

**Migration Steps:**
1. Install Python 3.12
2. Update virtual environment
3. Reinstall dependencies
4. Run tests to identify issues
5. Update type hints for new syntax
6. Review deprecation warnings
7. Update CI/CD to use Python 3.12

**Breaking Changes:**
- distutils removed (use setuptools)
- Some deprecated features removed
- Type hinting syntax changes
- Performance characteristics may differ
- asyncio behavior changes

**Notes:**
- Python 3.12 includes significant performance improvements
- New syntax features available (e.g., type parameter syntax)
- Some packages may need updates for compatibility

---

## Example 5: Angular Migration

### Query
```
Angular 14 to Angular 15
```

### Expected Output Summary

**Migration Steps:**
1. Run `ng update @angular/core@15 @angular/cli@15`
2. Update to standalone components if desired
3. Migrate to ESLint from TSLint
4. Update router configuration
5. Review dependency updates
6. Run tests and fix any issues

**Breaking Changes:**
- Standalone components API stable
- Router guards and resolvers signature changes
- Some deprecated APIs removed
- RxJS version requirements updated

**Example:**
```typescript
// Standalone component (new in 15)
@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule],
  template: `...`
})
export class AppComponent {}
```

---

## Example 6: Vue Migration

### Query
```
Vue 2 to Vue 3
```

### Expected Output Summary

**Migration Steps:**
1. Update Vue to version 3
2. Replace Vue constructor with createApp
3. Update component lifecycle hooks
4. Migrate to Composition API (recommended)
5. Update Vue Router to v4
6. Update Vuex to v4 or migrate to Pinia
7. Update third-party component libraries

**Breaking Changes:**
- Global API restructured (Vue.use → app.use)
- v-model behavior changes
- Filters removed
- $on, $off, $once removed
- Functional components syntax changed

**Major Features:**
- Composition API for better code organization
- Improved TypeScript support
- Better performance
- Multiple root nodes supported

---

## Example 7: Django Upgrade

### Query
```
Django 3.2 to Django 4.2
```

### Expected Output Summary

**Migration Steps:**
1. Review Django 4.0, 4.1, and 4.2 release notes
2. Update Django in requirements.txt
3. Run `python manage.py check --deploy`
4. Update deprecated features
5. Test all functionality
6. Update database if needed
7. Deploy with appropriate Python version (3.8+)

**Breaking Changes:**
- CSRF token format changed
- Some template tags behavior updated
- URL resolver changes
- Admin interface changes
- Database backend requirements

**New Features:**
- Functional indexes
- Expression-based constraints
- Async ORM interface
- Template-based form rendering

---

## Example 8: .NET Core Upgrade

### Query
```
.NET 6 to .NET 8
```

### Expected Output Summary

**Migration Steps:**
1. Update TargetFramework in .csproj to net8.0
2. Update NuGet packages
3. Address any obsolete API warnings
4. Update ASP.NET Core configurations
5. Test thoroughly
6. Update deployment targets

**Breaking Changes:**
- Some APIs marked obsolete or removed
- Minimal API changes
- Performance characteristics may differ
- Some default behaviors changed

**New Features:**
- Native AOT compilation support
- Improved performance
- New C# 12 language features
- Enhanced minimal APIs

---

## Tips for Best Results

### Be Specific
```
✅ GOOD: "Spring Boot 2.7 to Spring Boot 3.1"
❌ VAGUE: "spring boot upgrade"
```

### Include Context
```
✅ GOOD: "React 17 to 18 with TypeScript"
❌ VAGUE: "react update"
```

### Mention Your Stack
```
✅ GOOD: "Django 3 to 4 with PostgreSQL and Celery"
❌ VAGUE: "django migration"
```

### Check Version Numbers
```
✅ GOOD: "Node.js 16.x to 20.x LTS"
❌ VAGUE: "node js new version"
```

---

## Common Migration Patterns

The agent typically finds and structures:

1. **Prerequisites** - What you need before starting
2. **Step-by-step process** - Ordered migration steps
3. **Breaking changes** - What will break existing code
4. **Code examples** - Before/after code samples
5. **Gotchas and warnings** - Common pitfalls
6. **Testing recommendations** - How to verify the migration
7. **Rollback procedures** - How to undo if needed

---

## Using the Output

### Export to File
The CLI output can be copied to a file for reference:

```bash
npm start > migration-guide.txt
```

### Create a Checklist
Use the migration steps as a checklist:
- [ ] Step 1: Upgrade to Java 17
- [ ] Step 2: Update Spring Boot version
- [ ] Step 3: Replace javax imports
...

### Share with Team
Copy the findings section to documentation or share with your team for review.

---

## Feedback

If the agent doesn't find good results:
- Try rephrasing your query
- Add more specific version numbers
- Include your technology stack
- Mention specific areas of concern (e.g., "security changes")

