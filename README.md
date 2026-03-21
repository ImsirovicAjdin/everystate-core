# @everystate/core v1.0.9

**EveryState: Observable state management with dot-path addressing**

Every piece of state has a name. Every name is subscribable. Every operation is visible.

## Installation

```bash
npm install @everystate/core
```

> **Zero external dependencies** - Pure state management with no third-party packages required.

## Quick Start

```js
import { createEveryState } from '@everystate/core';

const store = createEveryState({ count: 0, user: { name: 'Alice' } });

// Subscribe to specific path
const unsub = store.subscribe('count', (value) => {
  console.log('Count changed:', value);
});

// Update state
store.set('count', 1);

// Get state
const count = store.get('count');

// Wildcard subscription
store.subscribe('user.*', ({ path, value }) => {
  console.log(`User field ${path} changed to:`, value);
});

// Check if a path exists (handles intentional undefined)
store.has('count');        // true
store.has('nonexistent');  // false

// List all leaf paths under a prefix
store.keys('user');        // ['user.name']
store.keys();              // ['count', 'user.name']

// Cleanup
unsub();
```

## Self-test (CLI, opt-in)

Run the bundled **zero-dependency** self-test locally to verify core behavior.
It is **opt-in** and never runs automatically on install:

```bash
# via npx (no install needed)
npx everystate-self-test

# if installed locally
everystate-self-test

# or directly
node node_modules/@everystate/core/self-test.js
```

You can also run the npm script from the package folder:

```bash
npm --prefix node_modules/@everystate/core run self-test
```

### Integration tests (@everystate/test)

The `tests/` folder contains a separate integration suite that uses
`@everystate/test` (declared as `devDependency`). This is an intentional
tradeoff: the **self-test** stays lightweight, while integration tests
remain available for deeper validation.

**For end users** (after installing the package):

```bash
# Install test dependency
npm install @everystate/test

# Run from package folder
cd node_modules/@everystate/core
npm run test:integration
# or short alias
npm run test:i
```

Or, from your project root:

```bash
npm --prefix node_modules/@everystate/core run test:integration
# or short alias
npm --prefix node_modules/@everystate/core run test:i
```

**For package developers** (working in the source repo):

```bash
# Install dev dependencies first
npm install

# Run integration tests
npm run test:integration
```

## What is EveryState?

EveryState is a reactive state management library where:
- Every value lives at a **named dot-path** (like `user.profile.name`)
- Every path is **subscribable** with wildcards (`user.*`)
- Every change is **observable** and traceable
- No magic, no proxies, no hidden dependency tracking

## Core Features

- **Path-based subscriptions**: Subscribe to exactly what you need
- **Wildcard support**: `user.*` catches all user changes
- **Atomic batching**: Multiple writes, single notification per path
- **Path introspection**: `has()` and `keys()` for runtime path discovery
- **Zero dependencies**: ~2KB minified
- **Framework-agnostic**: Works with React, Vue, Angular, Solid, Svelte, or vanilla JS

## Why EveryState?

State management shouldn't be a black box. You should be able to:
- Ask "which paths changed most often?"
- See "how long did that update take?"
- Know "which component is listening to this path?"

EveryState makes state **addressable, observable, and testable** without special tooling.

## Ecosystem

| Package | Description | License |
|---|---|---|
| [@everystate/aliases](https://www.npmjs.com/package/@everystate/aliases) | Ergonomic single-character and short-name DOM aliases for vanilla JS | MIT |
| [@everystate/angular](https://www.npmjs.com/package/@everystate/angular) | Angular adapter: `usePath`, `useIntent`, `useWildcard`, `useAsync` - bridges store to Angular signals | MIT |
| [@everystate/core](https://www.npmjs.com/package/@everystate/core) | Path-based state management with wildcard subscriptions and async support. Core state engine (you are here). | MIT |
| [@everystate/css](https://www.npmjs.com/package/@everystate/css) | Reactive CSSOM engine: design tokens, typed validation, WCAG enforcement, all via path-based state | MIT |
| [@everystate/examples](https://www.npmjs.com/package/@everystate/examples) | Example applications and patterns | MIT |
| [@everystate/pattern-catalogue](https://www.npmjs.com/package/@everystate/pattern-catalogue) | Comprehensive demonstration of 13 UI patterns using the "No Ceiling" hybrid architecture | MIT |
| [@everystate/perf](https://www.npmjs.com/package/@everystate/perf) | Performance monitoring overlay | MIT |
| [@everystate/react](https://www.npmjs.com/package/@everystate/react) | React hooks adapter: `usePath`, `useIntent`, `useAsync` hooks and `EventStateProvider` | MIT |
| [@everystate/renderer](https://www.npmjs.com/package/@everystate/renderer) | Direct-binding reactive renderer: `bind-*`, `set`, `each` attributes. Zero build step | MIT |
| [@everystate/router](https://www.npmjs.com/package/@everystate/router) | SPA routing as state | MIT |
| [@everystate/solid](https://www.npmjs.com/package/@everystate/solid) | Solid adapter: `usePath`, `useIntent`, `useWildcard`, `useAsync` - bridges store to Solid signals | MIT |
| [@everystate/test](https://www.npmjs.com/package/@everystate/test) | Event-sequence testing for UIstate stores. Zero dependency. | MIT |
| [@everystate/types](https://www.npmjs.com/package/@everystate/types) | Typed dot-path autocomplete for EveryState stores (you are here) | MIT |
| [@everystate/ui](https://www.npmjs.com/package/@everystate/ui) | Tree-shakable, transparent, framework-free imperative UI components. Every component is readable vanilla JS | MIT |
| [@everystate/view](https://www.npmjs.com/package/@everystate/view) | State-driven view: DOMless resolve + surgical DOM projector. View tree as first-class state | MIT |
| [@everystate/view-ui](https://www.npmjs.com/package/@everystate/view-ui) | Declarative UI component specs: plain JS objects + handler maps. The declarative twin of @everystate/ui | MIT |
| [@everystate/vue](https://www.npmjs.com/package/@everystate/vue) | Vue 3 composables adapter: `provideStore`, `usePath`, `useIntent`, `useWildcard`, `useAsync` | MIT |

## Documentation

Full documentation available at [everystate.dev](https://everystate.dev).

Source code: [https://github.com/ImsirovicAjdin/everystate-core](https://github.com/ImsirovicAjdin/everystate-core)

## License

MIT © Ajdin Imsirovic


|