/**
 * @everystate/core self-test
 *
 * Standalone test of core EveryState functionality. No dependencies beyond everyState.js.
 * Runs on `node self-test.js` or as a postinstall hook.
 */

import { createEveryState } from './everyState.js';

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

console.log('\n1. get / set');
const s1 = createEveryState({ count: 0, user: { name: 'Alice', age: 30 } });

assert('get: primitive', s1.get('count') === 0);
assert('get: nested', s1.get('user.name') === 'Alice');
assert('get: object', s1.get('user')?.name === 'Alice');
assert('get: entire state', s1.get('')?.count === 0);
assert('get: missing path → undefined', s1.get('nonexistent') === undefined);
assert('get: deep missing → undefined', s1.get('user.email') === undefined);

s1.set('count', 5);
assert('set: primitive', s1.get('count') === 5);

s1.set('user.name', 'Bob');
assert('set: nested', s1.get('user.name') === 'Bob');

s1.set('user.email', 'bob@example.com');
assert('set: auto-creates path', s1.get('user.email') === 'bob@example.com');

s1.set('deep.nested.path', 'value');
assert('set: deep auto-create', s1.get('deep.nested.path') === 'value');

s1.destroy();

console.log('\n2. subscribe: exact path');
const s2 = createEveryState({ count: 0 });
let lastValue = null;
let fireCount = 0;

const unsub = s2.subscribe('count', (value) => {
  lastValue = value;
  fireCount++;
});

s2.set('count', 1);
assert('subscribe: fires on change', fireCount === 1);
assert('subscribe: receives value', lastValue === 1);

s2.set('count', 2);
assert('subscribe: fires again', fireCount === 2);
assert('subscribe: receives new value', lastValue === 2);

unsub();
s2.set('count', 3);
assert('unsubscribe: stops firing', fireCount === 2);
assert('unsubscribe: value unchanged in handler', lastValue === 2);
assert('set still works after unsub', s2.get('count') === 3);

s2.destroy();

console.log('\n3. subscribe: wildcard');
const s3 = createEveryState({ user: { name: 'Alice', age: 30 } });
let wildcardFires = 0;
let wildcardDetail = null;

s3.subscribe('user.*', (detail) => {
  wildcardFires++;
  wildcardDetail = detail;
});

s3.set('user.name', 'Bob');
assert('wildcard: fires on child change', wildcardFires === 1);
assert('wildcard: detail has path', wildcardDetail?.path === 'user.name');
assert('wildcard: detail has value', wildcardDetail?.value === 'Bob');

s3.set('user.age', 31);
assert('wildcard: fires on other child', wildcardFires === 2);

s3.destroy();

console.log('\n4. subscribe: global');
const s4 = createEveryState({ a: 1, b: { c: 2 } });
let globalFires = 0;

s4.subscribe('*', () => { globalFires++; });

s4.set('a', 10);
assert('global: fires on root path', globalFires === 1);

s4.set('b.c', 20);
assert('global: fires on nested path', globalFires === 2);

s4.destroy();

console.log('\n5. batch');
const s5 = createEveryState({ x: 0, y: 0 });
let batchFires = 0;
s5.subscribe('*', () => { batchFires++; });

s5.batch(() => {
  s5.set('x', 1);
  s5.set('y', 2);
});
assert('batch: fires after (not during)', batchFires === 2);
assert('batch: x set', s5.get('x') === 1);
assert('batch: y set', s5.get('y') === 2);

// Deduplication
batchFires = 0;
s5.batch(() => {
  s5.set('x', 10);
  s5.set('x', 20);
  s5.set('x', 30);
});
assert('batch: deduplicates same path (1 fire)', batchFires === 1);
assert('batch: last write wins', s5.get('x') === 30);

// Nested batch
batchFires = 0;
s5.batch(() => {
  s5.set('x', 100);
  s5.batch(() => {
    s5.set('y', 200);
  });
});
assert('nested batch: both fire after outermost', batchFires === 2);
assert('nested batch: x', s5.get('x') === 100);
assert('nested batch: y', s5.get('y') === 200);

// No notifications during batch
const seen = [];
const s5b = createEveryState({ v: 0 });
s5b.subscribe('v', (val) => seen.push(val));
s5b.batch(() => {
  s5b.set('v', 1);
  s5b.set('v', 2);
});
assert('batch: no mid-batch notifications', seen.length === 1);
assert('batch: final value delivered', seen[0] === 2);

s5.destroy();
s5b.destroy();

console.log('\n6. setMany');
const s6 = createEveryState({});

// Plain object
s6.setMany({ 'a.b': 1, 'a.c': 2 });
assert('setMany object: a.b', s6.get('a.b') === 1);
assert('setMany object: a.c', s6.get('a.c') === 2);

// Array of pairs
s6.setMany([['x.y', 'hello'], ['x.z', 'world']]);
assert('setMany array: x.y', s6.get('x.y') === 'hello');
assert('setMany array: x.z', s6.get('x.z') === 'world');

// Map
s6.setMany(new Map([['m.a', true], ['m.b', false]]));
assert('setMany Map: m.a', s6.get('m.a') === true);
assert('setMany Map: m.b', s6.get('m.b') === false);

s6.destroy();

console.log('\n7. destroy');
const s7 = createEveryState({ z: 0 });
s7.destroy();

let threw = false;
try { s7.get('z'); } catch { threw = true; }
assert('destroy: get throws', threw);

threw = false;
try { s7.set('z', 1); } catch { threw = true; }
assert('destroy: set throws', threw);

threw = false;
try { s7.batch(() => {}); } catch { threw = true; }
assert('destroy: batch throws', threw);

threw = false;
try { s7.setMany({ a: 1 }); } catch { threw = true; }
assert('destroy: setMany throws', threw);

threw = false;
try { s7.subscribe('z', () => {}); } catch { threw = true; }
assert('destroy: subscribe throws', threw);

console.log('\n8. subscribe: detail object');
const s8 = createEveryState({ count: 10 });
let detail = null;
s8.subscribe('count', (value, d) => { detail = d; });
s8.set('count', 20);
assert('detail: has path', detail?.path === 'count');
assert('detail: has value', detail?.value === 20);
assert('detail: has oldValue', detail?.oldValue === 10);

s8.destroy();

console.log('\n9. detail: shared across listener types');
const s9 = createEveryState({ user: { name: 'Alice' } });
let s9exact = null;
let s9wildcard = null;
let s9global = null;

s9.subscribe('user.name', (value, d) => { s9exact = d; });
s9.subscribe('user.*', (d) => { s9wildcard = d; });
s9.subscribe('*', (d) => { s9global = d; });

s9.set('user.name', 'Bob');
assert('detail shared: exact has detail', s9exact !== null);
assert('detail shared: wildcard === exact (same ref)', s9wildcard === s9exact);
assert('detail shared: global === exact (same ref)', s9global === s9exact);

s9.destroy();

console.log('\n10. unsubscribe: Map cleanup (fast-path recovery)');
const s10 = createEveryState({ x: 0 });
let s10fires = 0;

const unsub10 = s10.subscribe('x', () => { s10fires++; });
s10.set('x', 1);
assert('unsub cleanup: fires while subscribed', s10fires === 1);

unsub10();
s10.set('x', 2);
assert('unsub cleanup: stops firing after unsub', s10fires === 1);
assert('unsub cleanup: value still written', s10.get('x') === 2);

// Re-subscribe to same path after full cleanup
let s10fires2 = 0;
const unsub10b = s10.subscribe('x', () => { s10fires2++; });
s10.set('x', 3);
assert('unsub cleanup: re-subscribe works after cleanup', s10fires2 === 1);

unsub10b();
s10.destroy();

console.log('\n11. fast-path: no detail allocated without listeners');
const s11 = createEveryState({ a: 0 });
let s11fires = 0;

// set with zero subscribers — fast-path should skip all dispatch
s11.set('a', 1);
s11.set('a', 2);
s11.set('a', 3);
assert('fast-path: value written without subscribers', s11.get('a') === 3);

// subscribe, fire, unsub, then set again — fast-path should re-engage
const unsub11 = s11.subscribe('a', () => { s11fires++; });
s11.set('a', 4);
assert('fast-path: fires with subscriber', s11fires === 1);

unsub11();
s11fires = 0;
s11.set('a', 5);
assert('fast-path: no fire after full unsub', s11fires === 0);
assert('fast-path: value still written after full unsub', s11.get('a') === 5);

s11.destroy();

console.log('\n12. wildcard-only: detail allocated for wildcard without exact');
const s12 = createEveryState({ user: { name: 'Alice' } });
let s12detail = null;

// Only wildcard subscriber, no exact subscriber for user.name
s12.subscribe('user.*', (d) => { s12detail = d; });
s12.set('user.name', 'Bob');
assert('wildcard-only: detail created', s12detail !== null);
assert('wildcard-only: detail.path correct', s12detail?.path === 'user.name');
assert('wildcard-only: detail.value correct', s12detail?.value === 'Bob');
assert('wildcard-only: detail.oldValue correct', s12detail?.oldValue === 'Alice');

s12.destroy();

// Results

console.log(`\n@everystate/core v1.0.0 self-test`);
console.log(`✓ ${passed} assertions passed${failed ? `, ✗ ${failed} failed` : ''}\n`);

if (failed > 0) process.exit(1);
