# @everystate/core

**EveryState: Observable state management with dot-path addressing**

Every piece of state has a name. Every name is subscribable. Every operation is visible.

## Installation

```bash
npm install @everystate/core
```

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

// Cleanup
unsub();
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
- **Zero dependencies**: ~2KB minified
- **Framework-agnostic**: Works with React, Vue, Angular, Svelte, or vanilla JS

## Why EveryState?

State management shouldn't be a black box. You should be able to:
- Ask "which paths changed most often?"
- See "how long did that update take?"
- Know "which component is listening to this path?"

EveryState makes state **addressable, observable, and testable** without special tooling.

## Ecosystem

- `@everystate/core`: Core state engine (you are here)
- `@everystate/css`: Reactive styling and design tokens
- `@everystate/perf`: Performance monitoring overlay
- `@everystate/react`: React hooks adapter
- `@everystate/router`: SPA routing as state
- `@everystate/test`: Zero-dependency testing
- `@everystate/view`: DOM-as-state with surgical updates

## Documentation

Full documentation: [https://github.com/ImsirovicAjdin/everystate-core](https://github.com/ImsirovicAjdin/everystate-core)

## License

MIT © Ajdin Imsirovic
