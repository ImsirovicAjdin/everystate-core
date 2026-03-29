/**
 * @everystate/core - eventTest-based integration tests
 *
 * Merged from test-batch.js and test-batch-dogfood.js.
 * Tests batch, setMany, setAsync, destroy, and core regression tests
 * using @everystate/event-test.
 */

import { createEventTest, runTests } from '@everystate/test';
import { createEveryState } from '@everystate/core';

const results = runTests({

  // -- batch ---------------------------------------------------------

  'batch: coalesces - same-path deduplication': () => {
    const t = createEventTest({ count: 0 });
    t.store.batch(() => {
      t.trigger('count', 1);
      t.trigger('count', 2);
      t.trigger('count', 3);
    });
    t.assertPath('count', 3);
    t.assertEventFired('count', 1);
  },

  'batch: fires once per unique path after flush': () => {
    const t = createEventTest({ user: { name: 'Alice', email: 'a@b.com' } });
    t.store.batch(() => {
      t.trigger('user.name', 'Bob');
      t.trigger('user.email', 'bob@b.com');
    });
    t.assertPath('user.name', 'Bob');
    t.assertPath('user.email', 'bob@b.com');
    t.assertEventFired('user.name', 1);
    t.assertEventFired('user.email', 1);
  },

  'batch: no notifications during, only after': () => {
    const store = createEveryState({ x: 0 });
    const seen = [];
    store.subscribe('x', (v) => seen.push(v));
    store.batch(() => {
      store.set('x', 1);
      if (seen.length !== 0) throw new Error('Notification fired during batch');
      store.set('x', 2);
      if (seen.length !== 0) throw new Error('Notification fired during batch');
    });
    if (seen.length !== 1) throw new Error(`Expected 1 notification after batch, got ${seen.length}`);
    if (seen[0] !== 2) throw new Error(`Expected final value 2, got ${seen[0]}`);
    store.destroy();
  },

  'batch: nested - only outermost flushes': () => {
    const t = createEventTest({ a: 0, b: 0 });
    t.store.batch(() => {
      t.trigger('a', 1);
      t.store.batch(() => {
        t.trigger('b', 2);
      });
    });
    t.assertPath('a', 1);
    t.assertPath('b', 2);
    t.assertEventFired('a', 1);
    t.assertEventFired('b', 1);
  },

  'batch: get() during batch reads committed state (not buffer)': () => {
    const store = createEveryState({ v: 'old' });
    store.batch(() => {
      store.set('v', 'new');
      const read = store.get('v');
      if (read !== 'old') {
        throw new Error(`get() during batch should read committed state, got "${read}"`);
      }
    });
    if (store.get('v') !== 'new') {
      throw new Error('After batch, get() should read new value');
    }
    store.destroy();
  },

  // -- setMany -------------------------------------------------------

  'setMany: plain object': () => {
    const t = createEventTest({});
    t.store.setMany({
      'ui.route.view': 'home',
      'ui.route.path': '/',
      'ui.route.params': {},
    });
    t.assertPath('ui.route.view', 'home');
    t.assertPath('ui.route.path', '/');
    t.assertType('ui.route.view', 'string');
    t.assertType('ui.route.path', 'string');
    t.assertShape('ui.route.params', {});
  },

  'setMany: array of [path, value] pairs': () => {
    const t = createEventTest({});
    t.store.setMany([
      ['a.b', 1],
      ['a.c', 2],
    ]);
    t.assertPath('a.b', 1);
    t.assertPath('a.c', 2);
    t.assertType('a.b', 'number');
    t.assertType('a.c', 'number');
  },

  'setMany: Map': () => {
    const t = createEventTest({});
    const m = new Map([['x.y', 'hello'], ['x.z', 'world']]);
    t.store.setMany(m);
    t.assertPath('x.y', 'hello');
    t.assertPath('x.z', 'world');
  },

  // -- setAsync ------------------------------------------------------

  'setAsync: batches loading phase writes': () => {
    const store = createEveryState({});
    let wildcardFires = 0;
    store.subscribe('users.*', () => { wildcardFires++; });

    const promise = store.setAsync('users', async (signal) => {
      return [{ id: 1, name: 'Alice' }];
    });

    if (wildcardFires !== 2) {
      throw new Error(`Loading phase: expected 2 wildcard fires, got ${wildcardFires}`);
    }
    if (store.get('users.status') !== 'loading') {
      throw new Error(`Expected status=loading, got ${store.get('users.status')}`);
    }
    if (store.get('users.error') !== null) {
      throw new Error(`Expected error=null, got ${store.get('users.error')}`);
    }

    promise.catch(() => {});
    store.destroy();
  },

  'setAsync: batches success phase writes': async () => {
    const store = createEveryState({});
    await store.setAsync('data', async () => ({ result: 42 }));

    if (store.get('data.status') !== 'success') {
      throw new Error(`Expected status=success, got ${store.get('data.status')}`);
    }
    if (store.get('data.data')?.result !== 42) {
      throw new Error('Expected data.result=42');
    }
    store.destroy();
  },

  'setAsync: full wildcard fire count': async () => {
    const store = createEveryState({});
    let wildcardFires = 0;
    store.subscribe('users.*', () => { wildcardFires++; });

    await store.setAsync('users', async (signal) => {
      return [{ id: 1, name: 'Alice' }];
    });

    // Loading: status+error = 2, Success: data+status = 2, Total = 4
    if (wildcardFires !== 4) {
      throw new Error(`Expected 4 wildcard fires, got ${wildcardFires}`);
    }
    if (store.get('users.status') !== 'success') {
      throw new Error(`Expected status=success`);
    }
    if (!Array.isArray(store.get('users.data'))) {
      throw new Error('Expected data to be array');
    }
    store.destroy();
  },

  // -- destroy -------------------------------------------------------

  'destroy: batch throws after destroy': () => {
    const store = createEveryState({ z: 0 });
    store.destroy();
    let threw = false;
    try { store.batch(() => {}); } catch { threw = true; }
    if (!threw) throw new Error('batch() should throw after destroy');
  },

  'destroy: setMany throws after destroy': () => {
    const store = createEveryState({ z: 0 });
    store.destroy();
    let threw = false;
    try { store.setMany({ a: 1 }); } catch { threw = true; }
    if (!threw) throw new Error('setMany() should throw after destroy');
  },

  // -- core regression -----------------------------------------------

  'core: basic get/set/subscribe': () => {
    const t = createEventTest({ name: 'Alice' });
    t.trigger('name', 'Bob');
    t.assertPath('name', 'Bob');
    t.assertType('name', 'string');
    t.assertEventFired('name', 1);
  },

  'core: wildcard subscription': () => {
    const t = createEventTest({ user: { name: 'Alice', age: 30 } });
    t.trigger('user.name', 'Bob');
    t.trigger('user.age', 31);
    t.assertPath('user.name', 'Bob');
    t.assertPath('user.age', 31);
  },

  'core: nested path auto-creation': () => {
    const t = createEventTest({});
    t.trigger('deep.nested.path', 'value');
    t.assertPath('deep.nested.path', 'value');
    t.assertType('deep.nested.path', 'string');
  },

  'core: type assertions for type generation': () => {
    const t = createEventTest({
      count: 0,
      user: { name: 'Alice', active: true },
      items: [{ id: 1, text: 'Todo' }],
    });
    t.assertType('count', 'number');
    t.assertShape('user', { name: 'string', active: 'boolean' });
    t.assertArrayOf('items', { id: 'number', text: 'string' });

    const types = t.getTypeAssertions();
    if (types.length !== 3) throw new Error(`Expected 3 type assertions, got ${types.length}`);
  },

  // -- derived -------------------------------------------------------

  'derived: basic computation and recomputation': () => {
    const store = createEveryState({ todos: ['a', 'b', 'c'] });
    store.derived('count', ['todos'], () => store.get('todos').length);

    if (store.get('count') !== 3) throw new Error(`Expected 3, got ${store.get('count')}`);

    store.set('todos', ['a', 'b', 'c', 'd']);
    if (store.get('count') !== 4) throw new Error(`Expected 4, got ${store.get('count')}`);

    store.destroy();
  },

  'derived: multiple dependencies': () => {
    const store = createEveryState({ a: 10, b: 20 });
    store.derived('sum', ['a', 'b'], () => store.get('a') + store.get('b'));

    if (store.get('sum') !== 30) throw new Error(`Expected 30, got ${store.get('sum')}`);

    store.set('a', 100);
    if (store.get('sum') !== 120) throw new Error(`Expected 120, got ${store.get('sum')}`);

    store.set('b', 200);
    if (store.get('sum') !== 300) throw new Error(`Expected 300, got ${store.get('sum')}`);

    store.destroy();
  },

  'derived: wildcard dependency': () => {
    const store = createEveryState({ counters: { a: 1, b: 2 } });
    store.derived('total', ['counters.*'], () => {
      const c = store.get('counters');
      return Object.values(c).reduce((sum, v) => sum + v, 0);
    });

    if (store.get('total') !== 3) throw new Error(`Expected 3, got ${store.get('total')}`);

    store.set('counters.a', 10);
    if (store.get('total') !== 12) throw new Error(`Expected 12, got ${store.get('total')}`);

    store.destroy();
  },

  'derived: set on derived path throws': () => {
    const store = createEveryState({ x: 5 });
    store.derived('doubled', ['x'], () => store.get('x') * 2);

    let threw = false;
    try { store.set('doubled', 999); } catch { threw = true; }
    if (!threw) throw new Error('set() on derived path should throw');
    if (store.get('doubled') !== 10) throw new Error('Derived value should be unchanged');

    store.destroy();
  },

  'derived: unsubscribe allows manual set': () => {
    const store = createEveryState({ x: 3 });
    const unsub = store.derived('y', ['x'], () => store.get('x') + 1);

    if (store.get('y') !== 4) throw new Error(`Expected 4, got ${store.get('y')}`);

    unsub();
    store.set('y', 100); // should NOT throw after unsub
    if (store.get('y') !== 100) throw new Error(`Expected 100 after manual set`);

    store.set('x', 50);
    if (store.get('y') !== 100) throw new Error(`Expected 100, dep change should not recompute`);

    store.destroy();
  },

  'derived: cascading (derived of derived)': () => {
    const store = createEveryState({ base: 2 });
    store.derived('x2', ['base'], () => store.get('base') * 2);
    store.derived('x4', ['x2'], () => store.get('x2') * 2);

    if (store.get('x2') !== 4) throw new Error(`Expected x2=4, got ${store.get('x2')}`);
    if (store.get('x4') !== 8) throw new Error(`Expected x4=8, got ${store.get('x4')}`);

    store.set('base', 10);
    if (store.get('x2') !== 20) throw new Error(`Expected x2=20, got ${store.get('x2')}`);
    if (store.get('x4') !== 40) throw new Error(`Expected x4=40, got ${store.get('x4')}`);

    store.destroy();
  },

  'derived: recomputes after batch': () => {
    const store = createEveryState({ a: 1, b: 2 });
    store.derived('product', ['a', 'b'], () => store.get('a') * store.get('b'));

    if (store.get('product') !== 2) throw new Error(`Expected 2, got ${store.get('product')}`);

    store.batch(() => {
      store.set('a', 5);
      store.set('b', 6);
    });

    if (store.get('product') !== 30) throw new Error(`Expected 30, got ${store.get('product')}`);

    store.destroy();
  },

  'derived: subscribers on derived path fire': () => {
    const store = createEveryState({ x: 1 });
    store.derived('y', ['x'], () => store.get('x') * 10);

    const seen = [];
    store.subscribe('y', (val) => seen.push(val));

    store.set('x', 2);
    if (seen.length !== 1 || seen[0] !== 20) {
      throw new Error(`Expected [20], got [${seen}]`);
    }

    store.set('x', 3);
    if (seen.length !== 2 || seen[1] !== 30) {
      throw new Error(`Expected [20,30], got [${seen}]`);
    }

    store.destroy();
  },

  'derived: duplicate path throws': () => {
    const store = createEveryState({ x: 1 });
    store.derived('y', ['x'], () => store.get('x'));

    let threw = false;
    try { store.derived('y', ['x'], () => store.get('x') * 2); } catch { threw = true; }
    if (!threw) throw new Error('Duplicate derived should throw');

    store.destroy();
  },

  'derived: validation errors': () => {
    const store = createEveryState({ x: 1 });

    let t1 = false;
    try { store.derived('', ['x'], () => 1); } catch { t1 = true; }
    if (!t1) throw new Error('Empty path should throw');

    let t2 = false;
    try { store.derived('y', 'x', () => 1); } catch { t2 = true; }
    if (!t2) throw new Error('Non-array deps should throw');

    let t3 = false;
    try { store.derived('y', ['x'], 'nope'); } catch { t3 = true; }
    if (!t3) throw new Error('Non-function fn should throw');

    store.destroy();
  },

  // -- two-pass batch flush (v1.2.0) ------------------------------------

  'batch: two-pass — subscriber on first path reads later paths fresh': () => {
    const store = createEveryState({ active: false, color: 'gray', label: 'Off' });
    let readColor = null;
    let readLabel = null;
    store.subscribe('active', () => {
      readColor = store.get('color');
      readLabel = store.get('label');
    });
    store.batch(() => {
      store.set('active', true);
      store.set('color', 'blue');
      store.set('label', 'On');
    });
    if (readColor !== 'blue') throw new Error(`Expected color='blue', got '${readColor}'`);
    if (readLabel !== 'On') throw new Error(`Expected label='On', got '${readLabel}'`);
    store.destroy();
  },

  'batch: two-pass — all subscribers see fully consistent state': () => {
    const store = createEveryState({ a: 0, b: 0, c: 0 });
    const snapshots = [];
    store.subscribe('a', () => snapshots.push({ src: 'a', a: store.get('a'), b: store.get('b'), c: store.get('c') }));
    store.subscribe('b', () => snapshots.push({ src: 'b', a: store.get('a'), b: store.get('b'), c: store.get('c') }));
    store.subscribe('c', () => snapshots.push({ src: 'c', a: store.get('a'), b: store.get('b'), c: store.get('c') }));
    store.batch(() => {
      store.set('a', 1);
      store.set('b', 2);
      store.set('c', 3);
    });
    for (const snap of snapshots) {
      if (snap.a !== 1 || snap.b !== 2 || snap.c !== 3) {
        throw new Error(`Subscriber on '${snap.src}' saw inconsistent state: ${JSON.stringify(snap)}`);
      }
    }
    store.destroy();
  },

  'batch: two-pass — setMany subscribers see consistent state': () => {
    const store = createEveryState({ x: 'old', y: 'old' });
    let yDuringX = null;
    store.subscribe('x', () => { yDuringX = store.get('y'); });
    store.setMany({ x: 'new', y: 'new' });
    if (yDuringX !== 'new') throw new Error(`Expected y='new' during x subscriber, got '${yDuringX}'`);
    store.destroy();
  },

  'batch: two-pass — wildcard sees all sibling values fresh': () => {
    const store = createEveryState({ user: { name: 'Alice', role: 'viewer' } });
    const snaps = [];
    store.subscribe('user.*', () => {
      snaps.push({ name: store.get('user.name'), role: store.get('user.role') });
    });
    store.batch(() => {
      store.set('user.name', 'Bob');
      store.set('user.role', 'admin');
    });
    for (let i = 0; i < snaps.length; i++) {
      if (snaps[i].name !== 'Bob' || snaps[i].role !== 'admin') {
        throw new Error(`Wildcard fire #${i} saw inconsistent state: ${JSON.stringify(snaps[i])}`);
      }
    }
    store.destroy();
  },
});

if (results.failed > 0) process.exit(1);
