# Node.js

A deep-dive companion to `Node.js Topics.md`. Each heading matches the checklist; under every topic: **what it is**, **why it matters**, **how it works**, and **interview-ready nuance**.

*Related:* language-agnostic backend/system design docs for distributed topics; this doc focuses on **Node.js runtime + Express-style HTTP APIs**.

---

**📌 Node.js Foundations**

### Node.js overview & what it is (and isn't)

Node.js is a **JavaScript runtime** built on Chrome's V8 engine plus **libuv** for async I/O. It lets you run JS outside the browser—primarily for servers, CLIs, build tools, and edge/serverless functions.

**What it is:** an event-driven, non-blocking I/O platform with a rich standard library (`fs`, `http`, `net`, `crypto`, streams) and npm's package ecosystem.

**What it isn't:** a language (that's JavaScript/TypeScript), a web framework (Express/Fastify/Nest sit on top), or a magic parallel CPU engine. Your JS still runs on **one main thread** per process unless you explicitly add workers/cluster.

**Why it matters:** Interviews probe whether you understand Node as a *runtime model* (event loop + I/O), not "JS on the server" as a slogan.

**Nuance:** Great for I/O-heavy APIs and realtime apps; weak for raw CPU-bound work unless you offload. Saying "Node is single-threaded" without mentioning the libuv thread pool and worker threads is a classic incomplete answer.

---

### Node.js vs browsers vs Deno vs Bun

| Runtime | Engine / I/O | Modules | Notable |
|---|---|---|---|
| **Browsers** | V8/SpiderMonkey/JSCore + Web APIs | ESM | DOM, `fetch`, no `fs` |
| **Node.js** | V8 + libuv | CJS + ESM | `fs`, `http`, npm, huge ecosystem |
| **Deno** | V8 + Rust tokio | ESM-first | Secure-by-default, URL imports, built-in tooling |
| **Bun** | JavaScriptCore + custom | npm-compatible | Fast installs, bundler/test runner baked in |

**Why it matters:** Shows you know the *platform APIs* differ even when the language is JS.

**Interview stance:** Browsers ≠ Node globals (`window` vs `process`, no DOM in Node). Deno/Bun compete on DX and speed; most production backends still bet on Node's maturity, ops knowledge, and library support. Mention compatibility (npm) and security model differences when comparing.

---

### V8, libuv, and the Node runtime stack

**Stack (bottom → top):** OS → **libuv** (event loop, async I/O, thread pool) → Node bindings → **V8** (parses/compiles/runs JS) → your application / npm packages.

**V8** executes JavaScript, manages the heap/GC, and exposes the call stack. **libuv** multiplexes non-blocking sockets, file I/O (often via a thread pool), timers, and DNS, then feeds completions back to JS as callbacks/promises.

```text
Your JS  →  Node APIs  →  V8 + libuv  →  OS sockets / files
```

**Why it matters:** Explains *why* `fs.readFile` doesn't block the process the way a naive sync read would, and why native addons exist.

**Nuance:** Not all "async" work uses the thread pool (network I/O is typically non-blocking on the loop). CPU-bound JS still blocks V8 regardless of libuv.

---

### Single-threaded JS + thread pool reality

**JS on the main thread:** one call stack; only one piece of your JS runs at a time per process. That keeps shared memory simple and matches the browser mental model.

**Thread pool reality:** libuv maintains a pool (default size often 4, configurable via `UV_THREADPOOL_SIZE`) for work that isn't purely evented—classic examples: some `fs` operations, `dns.lookup`, `crypto.pbkdf2`, `zlib`.

```js
// This JS is single-threaded…
for (let i = 0; i < 1e9; i++) {} // blocks everything

// …but some APIs farm work to libuv's pool
const { pbkdf2 } = require('crypto');
pbkdf2('secret', 'salt', 100000, 64, 'sha512', () => {});
```

**Interview answer:** "Single-threaded JavaScript, multi-threaded I/O underneath." Worker Threads / `child_process` / `cluster` are how *you* add parallelism for JS/CPU or multi-core HTTP.

---

### Event loop phases (timers, pending, poll, check, close)

The **event loop** repeatedly cycles through phases, each with a callback queue:

1. **timers** — `setTimeout` / `setInterval` whose delay has elapsed  
2. **pending callbacks** — some system deferred I/O errors/callbacks  
3. **idle/prepare** — internal  
4. **poll** — retrieve new I/O events; run I/O callbacks; may wait here  
5. **check** — `setImmediate` callbacks  
6. **close callbacks** — e.g. `socket.on('close')`

Between phases (and after many callbacks), **microtasks** (`process.nextTick`, then promise jobs) drain.

```js
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
// order can vary depending on context (timers vs I/O callback)
```

**Nuance:** Don't memorize trivia for its own sake—use phases to reason about starvation (long poll callbacks), `setImmediate` vs `setTimeout(0)`, and why blocking in any phase freezes the app.

---

### `process.nextTick` vs `queueMicrotask` vs `setImmediate` vs `setTimeout`

| API | Queue | Timing |
|---|---|---|
| `process.nextTick(fn)` | nextTick queue (Node-specific) | Before other microtasks; can starve the loop if recursive |
| `queueMicrotask(fn)` | microtask / Promise job queue | After nextTick drain, before next macrotask |
| `Promise.then` | same microtask queue | Same as `queueMicrotask` |
| `setImmediate(fn)` | check phase | After poll (I/O) |
| `setTimeout(fn, 0)` | timers phase | ASAP after delay ≥ 0; not "instant" |

```js
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
queueMicrotask(() => console.log('micro'));
process.nextTick(() => console.log('nextTick'));
// Typical: nextTick → micro → then timeout/immediate (context-dependent)
```

**Interview stance:** Prefer `queueMicrotask` / promises for portable microtasks. Reserve `nextTick` for Node libs that must run before I/O continues—warn about starvation. Prefer `setImmediate` to yield to I/O when deferring work inside an I/O handler.

---

### Blocking the event loop (CPU-heavy work pitfalls)

Anything synchronous and heavy on the main thread—tight loops, big JSON.parse, sync crypto, sync `fs`, complex regex on huge strings—**stops accepting new work** (HTTP, timers, heartbeats).

```js
app.get('/report', (req, res) => {
  const data = fs.readFileSync('./huge.json'); // blocks
  const out = expensiveTransform(data);         // blocks
  res.json(out);
});
```

**Symptoms:** rising latency for *all* requests, failed health checks, event-loop lag metrics spiking.

**Mitigations:** async I/O APIs; break work into chunks (`setImmediate` between slices); Worker Threads; child processes; move CPU to a queue/worker service; streaming instead of buffering entire payloads.

**Nuance:** "Async" functions that still do heavy sync work inside `await` gaps still block. Profiling event-loop delay beats guessing.

---

### Call stack, microtasks, and macrotasks

**Call stack:** currently executing sync frames. When empty, the runtime pulls the next task.

**Microtasks:** `process.nextTick`, promise reactions, `queueMicrotask`—run to completion before the next macrotask/phase continues.

**Macrotasks (tasks):** timers, I/O callbacks, `setImmediate`, etc.

```js
console.log('A');
Promise.resolve().then(() => console.log('B'));
console.log('C');
// A C B — microtask after current stack clears
```

**Why it matters:** Explains ordering bugs ("why did my then run before setTimeout?") and UI/server jank when microtask queues grow huge.

**Interview tip:** Draw stack → microtasks → (next) macrotask. Mention that endlessly scheduling `nextTick` prevents the loop from ever reaching poll.

---

### When to use Worker Threads vs child processes vs clustering

| Tool | Model | Best for |
|---|---|---|
| **Worker Threads** | threads, shared memory optional (`SharedArrayBuffer` / `Atomics`) | CPU-bound JS in-process; parallelize compute |
| **child_process** (`fork`/`spawn`) | separate OS processes | Isolation, other languages, crash containment |
| **cluster** | multiple Node processes sharing a server handle | Multi-core HTTP throughput on one machine |

```js
const { Worker } = require('worker_threads');
new Worker('./heavy.js', { workerData: { n: 40 } });
```

**Tradeoffs:** Workers share process limits and can still contend; forked processes cost more memory but isolate GC/crashes; cluster doesn't help a single CPU-heavy request—only concurrent capacity. Prefer an external queue + workers at scale over reinventing orchestration with ad-hoc forks.

---

### REPL, `node` CLI flags, and debugging basics

**REPL:** `node` with no file drops into an interactive shell for quick experiments (`TAB` completion, `_` for last value).

**Useful CLI flags:**

- `--inspect` / `--inspect-brk` — Chrome DevTools / VS Code debugger  
- `-e` / `-p` — evaluate / print  
- `--trace-warnings`, `--unhandled-rejections=strict`  
- `--max-old-space-size=4096` — raise heap limit  
- `NODE_OPTIONS` — pass flags via env  

```bash
node --inspect-brk server.js
node -p "process.versions"
```

**Debugging:** breakpoints in IDE, `debugger` statement, `console`/`util.inspect`, async stack traces. Know how to attach DevTools to a running process—common ops/interview crossover.

---

**📌 Modules, Packaging & Tooling**

### CommonJS (`require` / `module.exports`)

CommonJS (CJS) is Node's original module system: **synchronous** load/cache by filename.

```js
// math.js
function add(a, b) { return a + b; }
module.exports = { add };

// app.js
const { add } = require('./math');
```

`require` resolves paths/`node_modules`, executes once, caches in `require.cache`. `exports.foo = …` is sugar; reassigning `exports = …` breaks the link—use `module.exports`.

**Why it matters:** Vast npm history is CJS. Understanding cache and circular-dependency partial exports prevents subtle bugs.

**Nuance:** CJS `require` of ESM is limited/problematic; new code often prefers ESM, but many codebases remain CJS or dual-publish.

---

### ES Modules (`import` / `export`) and `.mjs` / `"type": "module"`

ESM is the JS standard module system: static structure, async-friendly loading, better tree-shaking in bundlers.

Enable via:

- `"type": "module"` in nearest `package.json`, or  
- `.mjs` extension (`.cjs` forces CommonJS)

```js
import { readFile } from 'fs/promises';
import express from 'express';
export function ping() { return 'pong'; }
```

**Differences vs CJS:** no `__dirname`/`__filename` by default (use `import.meta.url`); `require` unavailable unless created via `createRequire`; top-level `await` allowed in ESM.

**Interview tip:** Know how to get `__dirname` in ESM (`fileURLToPath`) and that resolution rules/`exports` maps differ slightly from classic CJS.

---

### Interop CJS ↔ ESM pitfalls

Pain points teams hit:

- **Default export mismatch:** CJS `module.exports = fn` imported as `import fn from 'x'` vs `import * as ns` / `.default` depending on interop.  
- **Cannot `require()` pure ESM** in older flows; dynamic `import()` works from CJS.  
- **Dual packages hazard:** different copies of the same library via CJS/ESM graphs.  
- **`__dirname`, JSON imports, and extension requirements** differ.

```js
// From CJS, load ESM:
const { pathToFileURL } = require('url');
const mod = await import(pathToFileURL('./esm-only.mjs').href);
```

**Nuance:** Library authors use conditional `exports` (`import`/`require` conditions). App authors standardize on one system where possible; hybrid is fine if intentional.

---

### `package.json` essentials (`name`, `main`, `exports`, `engines`, scripts)

| Field | Role |
|---|---|
| `name` / `version` | package identity (semver) |
| `main` | legacy CJS entry |
| `exports` | modern entry map (preferred over only `main`) |
| `type` | `"module"` or `"commonjs"` |
| `engines` | supported Node versions |
| `scripts` | `start`, `test`, `lint`, lifecycle hooks |
| `dependencies` / `devDependencies` | runtime vs tooling |

```json
{
  "name": "billing-api",
  "type": "module",
  "main": "./dist/index.js",
  "exports": { ".": "./dist/index.js" },
  "engines": { "node": ">=20" },
  "scripts": { "start": "node dist/index.js" }
}
```

**Interview:** `exports` can hide internal files from deep imports—important for library design and security surface.

---

### Semantic versioning & semver ranges (`^`, `~`, exact)

**Semver:** `MAJOR.MINOR.PATCH` — breaking / features / fixes.

| Range | Meaning (approx.) |
|---|---|
| `1.2.3` | exact |
| `~1.2.3` | patch updates (`>=1.2.3 <1.3.0`) |
| `^1.2.3` | minor+patch (`>=1.2.3 <2.0.0`); for `0.x` often more conservative |
| `*` / `latest` | avoid in apps |

**Lockfiles** pin the real tree; ranges in `package.json` declare *policy*. Interviews: explain why `^` + lockfile is normal for apps, and why libraries choose ranges carefully. Breaking changes hide behind major bumps—read changelogs for majors.

---

### `npm` vs `yarn` vs `pnpm` (lockfiles & installs)

| Client | Lockfile | Notes |
|---|---|---|
| **npm** | `package-lock.json` | default with Node |
| **yarn** (v1/berry) | `yarn.lock` | Berry uses Plug'n'Play optionally |
| **pnpm** | `pnpm-lock.yaml` | content-addressable store, strict peer deps, fast/disk-efficient |

**Why lockfiles matter:** reproducible CI/prod installs; commit them. Don't mix clients on one repo (divergent trees).

**Interview stance:** pnpm's strictness catches phantom dependencies; npm is ubiquitous; yarn still common in enterprises. Focus on lockfile + CI `npm ci` / `pnpm install --frozen-lockfile` rather than fanboying a client.

---

### `node_modules` resolution algorithm

When you `require('lodash')` or `import 'lodash'`, Node walks **upward** from the current file's directory looking for `node_modules/lodash`, until the filesystem root (or package boundary rules with `exports`).

```text
app/src/util.js
  → app/src/node_modules/
  → app/node_modules/     ← usually found here
  → …/node_modules/
```

Scoped packages: `@org/name`. Core modules (`fs`) win over `node_modules/fs`. `exports`/`imports` fields can redirect or block deep paths.

**Nuance:** Hoisting (npm/yarn) vs pnpm's symlink layout changes what "accidentally require a transitive dep" allows—pnpm often fails loudly (good).

---

### Local vs global packages; `npx`

- **Local:** installed in project `node_modules`; invoked via `npx`, `npm run`, or `./node_modules/.bin`.  
- **Global:** system-wide CLIs (`npm i -g`); convenient, but version conflicts across projects.

```bash
npx eslint .          # use local binary, or fetch temporarily
npm exec -- vitest
```

**Best practice:** project-local tooling + lockfile so CI and teammates share versions. Use `npx`/`npm exec` instead of global installs for one-offs. Interviews like "why not global webpack?" → reproducibility.

---

### Environment config (`.env`, `process.env`, 12-factor basics)

**12-factor:** store config in the environment, not code. In Node, read `process.env.PORT`, `process.env.DATABASE_URL`, etc.

```js
import 'dotenv/config'; // dev convenience; not a secrets vault
const port = Number(process.env.PORT ?? 3000);
```

`.env` files are for **local/dev**; production injects env via the platform (K8s secrets, ECS, Vault). Never commit real secrets. Validate env at boot (Zod/`envalid`) so misconfig fails fast.

**Nuance:** `dotenv` doesn't replace secret managers. Distinguish build-time vs runtime config (especially frontend vs server).

---

### TypeScript with Node (tsc, tsx, path aliases overview)

Common workflows:

- **`tsc`** — compile `ts` → `js` for production (`dist/`).  
- **`tsx` / `ts-node`** — run TS directly in dev.  
- **Bundlers** (esbuild, swc) — faster transpile/CI.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "strict": true,
    "paths": { "@/*": ["src/*"] }
  }
}
```

**Path aliases:** great in TS; runtime needs mirroring (`tsc-alias`, bundler, or Node subpath imports). Interview: types erase at runtime—don't rely on interfaces for authz. Prefer `NodeNext` resolution when shipping ESM.

---

**📌 Core Built-ins**

### `process` object (`env`, `argv`, `cwd`, signals, exit codes)

`process` is the global handle to the running Node process.

```js
process.env.NODE_ENV;
process.argv;            // CLI args
process.cwd();           // working directory
process.exitCode = 1;    // prefer over immediate exit when possible
process.on('SIGTERM', shutDown);
```

**Signals:** `SIGTERM`/`SIGINT` for graceful shutdown; `SIGHUP` sometimes reload. **Exit codes:** `0` success, non-zero failure (ops/K8s depend on this).

**Nuance:** `process.exit(1)` aborts hard—may skip flush of logs. Prefer setting `exitCode` and stopping the server gracefully.

---

### Path handling (`path`, POSIX vs Windows)

Use the `path` module instead of string concat so separators and normalization work cross-platform.

```js
import path from 'path';
path.join('/var', 'log', 'app.log');
path.resolve('src', '../dist');
path.basename(file);
path.extname(file);
```

**POSIX vs Windows:** `path.win32` / `path.posix` when you must force style (e.g. zip metadata). Prefer `path.join`/`resolve` over `/` literals. With URLs/`file://`, use `URL` + `fileURLToPath`.

**Security:** guard against `../` traversal when joining user input to a root directory (`path.resolve` + prefix check).

---

### File system (`fs` sync vs async vs promises API)

Three styles:

```js
import fs from 'fs';
import fsp from 'fs/promises';

fs.readFileSync('f.txt', 'utf8');          // blocks loop
fs.readFile('f.txt', 'utf8', (e, d) => {}); // callback
await fsp.readFile('f.txt', 'utf8');       // promises (preferred)
```

**When sync is OK:** CLI boot, one-shot scripts, loading tiny config before serving. **Avoid sync** on request paths.

Streams (`createReadStream`) beat reading huge files into memory. Know `fs.constants`, recursive `mkdir`, and error codes (`ENOENT`, `EEXIST`).

---

### Buffers & binary data

`Buffer` is Node's fixed-length byte array (Uint8Array subclass in modern Node) for binary data—files, TCP, crypto, images.

```js
Buffer.from('hello', 'utf8');
Buffer.alloc(16);           // zero-filled safe
Buffer.allocUnsafe(16);     // faster, may contain old memory
buf.toString('hex');
```

**Why it matters:** JS strings are UTF-16 code units—binary protocols need bytes. Prefer `Buffer.alloc` over `allocUnsafe` unless you overwrite every byte and need the perf.

**Nuance:** Don't mix encodings carelessly (`base64` vs `utf8`). For large payloads, streams > giant buffers.

---

### Streams (Readable, Writable, Duplex, Transform; backpressure)

Streams process data in chunks:

- **Readable** — source (`fs.createReadStream`, HTTP req)  
- **Writable** — sink (`fs.createWriteStream`, HTTP res)  
- **Duplex** — both (`net.Socket`)  
- **Transform** — duplex that mutates (`zlib.createGzip`)

**Backpressure:** if write returns `false`, wait for `'drain'` before pushing more—prevents unbounded memory growth.

```js
import { createReadStream, createWriteStream } from 'fs';
import { createGzip } from 'zlib';
createReadStream('in')
  .pipe(createGzip())
  .pipe(createWriteStream('out.gz'));
```

**Interview:** `.pipe` is classic; `pipeline` is safer for errors. Streaming uploads/downloads is a Node superpower versus buffering.

---

### `pipeline` / `stream/promises` error handling

`stream.pipeline` (and `stream/promises.pipeline`) wires streams, forwards errors, and cleans up—prefer over raw `.pipe` chains.

```js
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip } from 'zlib';

await pipeline(
  createReadStream('in'),
  createGzip(),
  createWriteStream('out.gz')
);
```

**Why:** `.pipe` can leave streams dangling on error and miss propagating failures. `pipeline` destroys streams on failure and returns a promise you can `try/catch`.

**Nuance:** Always handle `error` on streams or use `pipeline`. Unhandled stream errors can crash the process.

---

### Events & `EventEmitter`

Many Node APIs are event emitters: `on`/`once`/`emit`/`off`.

```js
import { EventEmitter } from 'events';
const bus = new EventEmitter();
bus.on('order', (o) => console.log(o.id));
bus.emit('order', { id: 1 });
```

**Patterns:** `once` for single-fire; `removeListener` to avoid leaks; `error` events are special—if unhandled, they can throw.

**Nuance:** Set `setMaxListeners` carefully; growing listener counts often mean leaks. Prefer well-defined domain events over a global god-emitter. `AbortSignal` sometimes replaces ad-hoc cancel events.

---

### Timers & cancellation patterns

```js
const t = setTimeout(fn, 1000);
clearTimeout(t);
const i = setInterval(fn, 1000);
clearInterval(i);
const im = setImmediate(fn);
clearImmediate(im);
```

**Cancellation:** keep timer handles; use `AbortController` to cancel fetch/async work tied to timers; in servers, clear intervals on shutdown.

```js
const ac = new AbortController();
setTimeout(() => ac.abort(), 5000);
await fetch(url, { signal: ac.signal });
```

**Nuance:** Unref timers (`timer.unref()`) if they shouldn't keep the process alive (e.g. optional metrics flush). Leaked intervals are a common memory/CPU leak.

---

### URL / `URLSearchParams` / WHATWG URL API

Prefer the WHATWG `URL` API over legacy `url.parse`.

```js
const u = new URL('https://api.example.com/v1/users?active=1');
u.pathname; // /v1/users
u.searchParams.get('active'); // '1'
u.searchParams.set('page', '2');
String(u);
```

**Why:** Correct parsing of encoding, IPv6, and edge cases; works in browsers and Node. `URLSearchParams` for query manipulation.

**Security:** validate `hostname`/`protocol` when proxying user-supplied URLs (SSRF). Avoid string concat for query strings.

---

### `util.promisify` / `util.types` / debugging helpers

```js
import { promisify, types, inspect } from 'util';
const sleep = promisify(setTimeout); // careful: setTimeout signature quirks
import { readFile } from 'fs';
const readFileP = promisify(readFile);

types.isPromise(x);
types.isDate(x);
inspect(obj, { depth: 3, colors: true });
```

**promisify:** wraps error-first callbacks. Prefer native `fs/promises` when available. **types:** reliable runtime checks vs `typeof`. **inspect:** better than `JSON.stringify` for circular structures / Buffers.

**Also:** `util.deprecate`, `debuglog`, `TextEncoder`/`TextDecoder` for strings↔bytes.

---

### Crypto basics (`crypto` hashing, HMAC, randomBytes)

```js
import { createHash, createHmac, randomBytes, scrypt } from 'crypto';

createHash('sha256').update('data').digest('hex');
createHmac('sha256', secret).update('data').digest('hex');
randomBytes(32); // tokens, IDs — not Math.random()
```

**Passwords:** use `scrypt`/`argon2`/`bcrypt`—not raw SHA-256. **HMAC** for integrity with a key (webhooks). Prefer `randomBytes` / `crypto.randomUUID()` for secrets.

**Nuance:** hashing ≠ encryption. Timing-safe compare (`timingSafeEqual`) for secrets. Know sync vs async crypto APIs regarding the event loop.

---

### HTTP/HTTPS core modules (without Express)

```js
import http from 'http';

const server = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
});
server.listen(3000);
```

**What you handle yourself:** routing, body parsing, headers, CORS, errors. `https` needs certs. Good interview exercise: parse JSON body via stream, set status codes, understand chunked responses.

**Why frameworks exist:** middleware, ergonomics, ecosystem—core `http` still underpins them (`req`/`res` are streams).

---

**📌 Async Patterns**

### Callbacks & error-first convention

Node's classic style: last argument is `function (err, result)`.

```js
fs.readFile('f.txt', 'utf8', (err, data) => {
  if (err) return handle(err);
  console.log(data);
});
```

**Rules:** always check `err` first; don't throw across callback boundaries without a domain/catch; pass `null`/`undefined` as err on success.

**Why it matters:** Still appears in older APIs and native bindings. Promisify assumes this convention. Nested callbacks → "callback hell" → motivate promises/async-await.

---

### Promises & async/await

Promises represent a future value: `pending` → `fulfilled` / `rejected`.

```js
async function loadUser(id) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error('fetch failed');
  return res.json();
}
```

`async` functions always return promises. `await` pauses the *async function*, not the whole process—the event loop continues.

**Interview:** promises are eager (start when created); know conversion from callbacks; avoid mixing `.then` chains with `await` inconsistently in one flow.

---

### `Promise.all` / `allSettled` / `race` / `any`

| Helper | Behavior |
|---|---|
| `all` | fulfill with all results; **reject on first** failure |
| `allSettled` | wait for all; get `{status, value/reason}[]` |
| `race` | settle with **first** fulfill or reject |
| `any` | fulfill with first success; reject `AggregateError` if all fail |

```js
const [user, orders] = await Promise.all([
  getUser(id),
  getOrders(id),
]);
```

**Nuance:** `all` fail-fast is great for request paths; `allSettled` for best-effort fan-out. `race` for timeouts (pair with AbortController). Unhandled sibling rejections after `all` fails still need care in some patterns—abort peers when possible.

---

### Error handling in async flows (try/catch, unhandledRejection)

```js
try {
  await doWork();
} catch (err) {
  logger.error({ err }, 'doWork failed');
  throw err; // or map to HTTP 5xx
}

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'unhandledRejection');
  // in modern Node, often crash is preferred after logging
});
```

**Rules:** await or `.catch` every promise; never swallow errors silently; map errors at boundaries (HTTP layer).

**Nuance:** `try/catch` only catches awaited rejections in that block—floating promises bypass it. Production policy for `unhandledRejection` should be explicit (often exit).

---

### Concurrent async work without blocking

Concurrency ≠ blocking the loop. Kick off independent I/O together:

```js
const p1 = db.query('…');
const p2 = cache.get(key);
const p3 = fetch(url);
const [a, b, c] = await Promise.all([p1, p2, p3]);
```

**Pattern:** start promises immediately, await together. Bound concurrency with pools (e.g. `p-limit`) when hitting rate limits or DB connection caps.

**Anti-pattern:** `for … of { await }` when iterations are independent—serializes latency. Use sequential only when order/transaction requires it.

---

### Cancellation ideas (AbortController)

`AbortController` / `AbortSignal` is the standard cancel token (fetch, many Node APIs, undici, frameworks).

```js
const ac = new AbortController();
const t = setTimeout(() => ac.abort(), 3000);
try {
  await fetch(url, { signal: ac.signal });
} finally {
  clearTimeout(t);
}
```

Pass `signal` into lower layers (DB drivers that support it, custom loops checking `signal.aborted`). On abort, throw/`AbortError` and clean resources.

**Interview:** cancellation is cooperative—code must observe the signal. Timeouts = abort + cleanup, not just `Promise.race` ignoring the loser.

---

### Async iterators & `for await...of`

Async iterables produce values over time (`Readable` in object mode, paginated APIs, event streams).

```js
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const rl = createInterface({ input: createReadStream('big.log') });
for await (const line of rl) {
  processLine(line);
}
```

**Why:** backpressure-friendly consumption vs loading everything. Implement `async *[Symbol.asyncIterator]()` for your own sources.

**Nuance:** break/return should cancel upstream when possible (Destroyable streams / AbortSignal).

---

### Avoiding callback hell and promise antipatterns

**Avoid:**

- Deep nested callbacks → flatten with async/await  
- `new Promise(async (resolve, reject) => { … })` — anti-pattern (error handling traps)  
- Swallowing rejections empty `.catch(() => {})`  
- Forgetting to `return` inside `.then` chains  
- Sequential awaits for independent I/O  

**Prefer:** async functions, early returns, typed errors, `Promise.all` for parallelism, abortable timeouts, centralized error middleware at HTTP edge.

**Interview soundbite:** "Promises compose; callbacks nest. Still know error-first for legacy."

---

**📌 Express & HTTP APIs**

### Express overview & middleware philosophy

Express is a minimal HTTP framework: routing + a **middleware pipeline**. Each middleware is `(req, res, next) => {}` that can read/modify the request, end the response, or call `next()`.

```js
import express from 'express';
const app = express();
app.use(express.json());
app.get('/health', (req, res) => res.json({ ok: true }));
app.listen(3000);
```

**Philosophy:** unopinionated core; you compose logging, auth, validation. Power and footguns both come from middleware order and shared `req` mutability.

**Nuance:** Express 4 is ubiquitous; Express 5 modernizes some promise behavior—know which version you run.

---

### App vs Router

`app` is the application; `Router` is a mountable mini-app for route groups.

```js
const users = express.Router();
users.get('/:id', getUser);
app.use('/users', users);
```

**Why:** modularize by domain (`/users`, `/orders`), apply middleware to a subset, mount versioned APIs (`/v1`).

**Interview:** routers inherit middleware mounted before them; `mergeParams` when nested routers need parent params.

---

### Routing (`get/post/put/patch/delete`, params, query)

```js
app.get('/users/:id', (req, res) => {
  const { id } = req.params;
  const active = req.query.active; // string | string[] | undefined
  res.json({ id, active });
});
```

**Methods:** map to handlers; `app.all` / `app.use` for catch-alls. **params** from path, **query** from querystring (always strings until parsed).

**Nuance:** distinguish `PUT` (replace) vs `PATCH` (partial). Route order matters for overlapping patterns. Prefer explicit schemas over trusting raw query types.

---

### Request & response objects (`req`, `res`)

`req`: `params`, `query`, `body` (after parser), `headers`, `cookies`, `ip`, `path`, streams for raw body.

`res`: `status`, `json`, `send`, `sendFile`, `redirect`, `set`, `cookie`, `end`.

```js
res.status(201).json({ id });
res.set('Cache-Control', 'no-store');
```

**Remember:** `res` is a Writable stream; after you end it, don't write again. Helpers like `res.json` set content-type. Framework middleware often decorates `req` (e.g. `req.user`).

---

### Middleware chain (order matters)

Middleware runs in registration order until a handler ends the response or next('route').

```js
app.use(requestId);
app.use(morgan('combined'));
app.use(express.json());
app.use(authOptional);
app.use('/admin', authRequired, adminRouter);
app.use(notFound);
app.use(errorHandler); // last
```

**Rules:** parsers before handlers needing `body`; auth before protected routes; error handler **last** with 4 args. Mis-ordered CORS or body parsers cause baffling bugs—prime interview fodder.

---

### Built-in middleware (`express.json`, `urlencoded`, static)

```js
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('public'));
```

**json / urlencoded:** populate `req.body`. Always set **limits** to avoid huge payload DoS. `extended: true` uses qs library for nested objects.

**static:** serves files; put behind CDN in prod when possible; beware directory listing and path traversal (Express handles basics—still don't mount sensitive dirs).

---

### Third-party middleware (helmet, cors, morgan, compression)

| Package | Role |
|---|---|
| **helmet** | secure default headers |
| **cors** | Cross-Origin Resource Sharing |
| **morgan** | HTTP access logs |
| **compression** | gzip/brotli responses |

```js
app.use(helmet());
app.use(cors({ origin: ['https://app.example.com'], credentials: true }));
app.use(morgan('combined'));
app.use(compression());
```

**Nuance:** compression + SSE/streaming needs care; CORS with credentials cannot use `*`; morgan to stdout fits 12-factor logging. Know *what* each does—not every header name under helmet.

---

### Error-handling middleware (`err, req, res, next`)

Express recognizes middleware with **4 arguments** as error handlers.

```js
app.use((err, req, res, next) => {
  const status = err.status ?? 500;
  logger.error({ err, reqId: req.id }, 'request failed');
  res.status(status).json({
    error: status === 500 ? 'Internal Error' : err.message,
  });
});
```

Trigger via `next(err)` or thrown errors in sync code / Express 5 async paths. Place after routes. Don't leak stack traces to clients in production.

**Nuance:** async errors in Express 4 need `try/catch` or wrappers (`express-async-errors`)—common gotcha.

---

### 404 handling patterns

404 is "no route matched," not necessarily an thrown error.

```js
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});
// or next({ status: 404, message: 'Not Found' }) into error handler
```

Place after all routes, before (or into) error handler. Distinguish **404** (missing resource) vs **401/403** (authz)—don't conflate.

**API design:** consistent error shape (`code`, `message`, `details`) helps clients.

---

### Validation (Joi / Zod / express-validator)

Validate **before** business logic.

```js
// Zod sketch
const Body = z.object({ email: z.string().email(), age: z.number().int().min(0) });
app.post('/users', (req, res, next) => {
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());
  req.body = parsed.data;
  next();
});
```

| Lib | Notes |
|---|---|
| **Zod** | TS-first, infer types |
| **Joi** | mature, rich rules |
| **express-validator** | declarative middleware chains |

**Interview:** validate params/query/body separately; strip unknown fields; never trust client types.

---

### File uploads (multer) & streaming responses

**multer** parses `multipart/form-data` into memory or disk.

```js
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5_000_000 } });
app.post('/avatar', upload.single('avatar'), handler);
```

**Streaming responses:** `fs.createReadStream(path).pipe(res)` or `pipeline`; set `Content-Type` / `Content-Disposition`. For huge downloads, stream from S3/object storage.

**Security:** file type sniffing, size limits, don't use user filenames raw, virus scan when needed, prefer object storage over local disk at scale.

---

### Cookies, sessions, and cookie-parser

```js
import cookieParser from 'cookie-parser';
import session from 'express-session';

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: true, sameSite: 'lax' },
}));
```

**Sessions:** server stores session data (memory/Redis); client holds session id cookie. **cookie-parser** populates `req.cookies` / `req.signedCookies`.

**Hardening:** `httpOnly`, `secure`, `sameSite`; store sessions in Redis for multi-instance; rotate secrets carefully.

---

### CORS configuration for APIs

Browsers enforce CORS on cross-origin XHR/fetch. APIs must opt in with headers.

```js
app.use(cors({
  origin: (origin, cb) => cb(null, allowlist.has(origin)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
```

**Nuance:** `credentials: true` requires explicit origin (not `*`). Preflight `OPTIONS` must succeed. Mobile/non-browser clients often ignore CORS—still validate auth. Don't use CORS as the only security layer.

---

### API versioning strategies

| Strategy | Example | Pros / cons |
|---|---|---|
| URL path | `/v1/users` | Clear, cache-friendly |
| Header | `Accept: application/vnd.app.v1+json` | Cleaner URLs, harder to discover |
| Query | `?version=1` | Easy, easy to misuse |

**Practice:** path versioning is most common. Prefer additive changes; deprecate with timelines; run dual versions during migration. Don't invent a new version for every field add—use compatibility rules.

---

### Choosing Express vs Fastify vs NestJS (overview)

| | Express | Fastify | NestJS |
|---|---|---|---|
| Style | minimal middleware | schema-speed focused | opinionated modular DI |
| Perf | good | often faster JSON | Express/Fastify under the hood |
| Structure | DIY | plugins | Angular-inspired modules |
| Best for | flexibility, ubiquity | high-throughput APIs | large teams, structure |

**Interview stance:** Express = default literacy. Fastify when perf + schemas matter. Nest when you want batteries (DI, modules, OpenAPI) and enterprise structure. Choose for team/ops, not Twitter benchmarks alone.

---

**📌 Data Access**

### Connecting to PostgreSQL (`pg` / pools)

```js
import pg from 'pg';
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});
const { rows } = await pool.query('select now() as n');
```

`pg` is the canonical driver. Prefer **pools** over `new Client()` per request. Use SSL settings in cloud. Release clients correctly when using `pool.connect()` (try/finally `client.release()`).

**Interview:** know pool vs single client; idle timeouts; env-based connection strings.

---

### Connection pooling & why it matters in Node

Each DB connection is expensive. Under concurrency, opening a connection per request exhausts Postgres `max_connections` and adds latency.

**Pool:** keep N ready connections; checkout → query → release. Size relative to DB limits and instance count (`instances × pool.max` < DB max).

**Node angle:** async concurrency means many requests in flight on one process—pools are mandatory. Too large pools hurt the database; too small queues latency.

**Nuance:** serverless can multiply pools per cold instance—use external poolers (PgBouncer) or serverless-friendly drivers.

---

### Query parameterization (SQL injection defense)

**Never** string-concatenate user input into SQL.

```js
// bad
await pool.query(`select * from users where id = ${id}`);

// good
await pool.query('select * from users where id = $1', [id]);
```

Parameterized queries send data separately from the query string. Same idea in ORMs (`where: { id }`). Dynamic **identifiers** (table/column names) can't be bound as values—whitelist them.

**Interview:** demonstrate a classic injection and the `$1` fix. ORM ≠ automatic safety if you use raw SQL strings.

---

### ORMs/query builders overview (Prisma, Knex, TypeORM, Sequelize)

| Tool | Style |
|---|---|
| **Prisma** | schema-first client, great DX/migrations |
| **Knex** | SQL query builder + migrations |
| **TypeORM** | Active Record / Data Mapper, decorators |
| **Sequelize** | mature Active Record style |

**Tradeoffs:** ORMs speed CRUD and migrations; complex queries/performance tuning may need raw SQL. Query builders stay closer to SQL. Interviews care that you can drop to SQL, manage N+1, and understand transactions—not that you memorized every API.

---

### MongoDB with Mongoose (when document DBs fit)

**MongoDB** stores flexible JSON-like documents. **Mongoose** adds schemas, validation, and models on top of the driver.

```js
const userSchema = new mongoose.Schema({ email: String, tags: [String] });
const User = mongoose.model('User', userSchema);
await User.find({ tags: 'admin' }).limit(20);
```

**When it fits:** variable attributes, document-centric aggregates, horizontal scale patterns. **When not:** heavy relational integrity, multi-row ACID across entities—Postgres often simpler.

**Nuance:** "schemaless" still needs modeling discipline; secondary indexes matter; transactions exist but aren't an excuse for relational designs in Mongo.

---

### Transactions with SQL databases

```js
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('update accounts set bal = bal - $1 where id = $2', [100, from]);
  await client.query('update accounts set bal = bal + $1 where id = $2', [100, to]);
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

ORMs expose `prisma.$transaction`, Knex `trx`, etc. **Isolation levels** matter for race conditions. Keep transactions short—no HTTP calls inside a held transaction.

---

### N+1 and over-fetching in Node data layers

**N+1:** fetch N parents, then 1 query each for children → N+1 queries.

```js
// bad
const users = await User.findAll();
for (const u of users) u.orders = await Order.findAll({ userId: u.id });

// better: join, IN query, or dataloader/include/prefetch
```

**Over-fetching:** `SELECT *` / wide ORM includes when you need three fields—wastes IO and memory.

**Fixes:** joins, batch `WHERE id IN`, GraphQL DataLoader, Prisma `include` carefully, columns lists. Measure with logging/APM.

---

### Redis for cache/sessions/rate limits

Redis is an in-memory data store used as:

- **Cache** — hot reads (`GET`/`SET` + TTL)  
- **Session store** — shared across Node instances  
- **Rate limits** — sliding windows / token buckets (INCR + EXPIRE)  
- **Queues/pubsub** — lightweight messaging  

```js
await redis.set('user:1', JSON.stringify(user), 'EX', 60);
const cached = await redis.get('user:1');
```

**Nuance:** cache invalidation is the hard part; treat Redis as ephemeral unless configured durable; connection pooling/clients per process; timeouts so Redis blips don't freeze requests.

---

### Migrations in Node ecosystems

Migrations version schema changes: up/down scripts applied in order.

| Ecosystem | Tools |
|---|---|
| Prisma | `prisma migrate` |
| Knex | `knex migrate:latest` |
| TypeORM | migration:generate/run |
| node-pg-migrate / Flyway / Liquibase | SQL-centric |

**Practice:** migrations in CI; never hand-edit prod schema; backward-compatible expands/contracts for zero-downtime; data migrations separated when heavy.

**Interview:** expand-contract pattern; why lockfiles ≠ schema versioning.

---

### Repository / data-access layer patterns

Keep HTTP handlers thin: route → service → **repository**/DAO → DB.

```js
// repositories/users.js
export const UsersRepo = {
  findById: (id) => pool.query('select * from users where id = $1', [id]),
};
```

**Benefits:** swap drivers/ORMs, unit-test services with fake repos, consistent transactions at service boundary.

**Nuance:** don't build a second ORM; avoid anemic pass-through if a simple module of queries suffices. Match complexity to team size.

---

**📌 Auth & Security**

### Authentication vs authorization

- **Authentication (authn):** who are you? (login, session/JWT, API keys)  
- **Authorization (authz):** what can you do? (roles, permissions, policies)

```js
// authn middleware sets req.user
// authz middleware checks capability
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user?.roles?.includes(role)) return res.status(403).end();
    next();
  };
}
```

**Interview:** 401 Unauthorized (unauthenticated) vs 403 Forbidden (authenticated but not allowed)—teams quibble naming; be consistent and precise about meaning.

---

### Password hashing (bcrypt / argon2)

Never store plaintext or plain SHA passwords. Use adaptive KDFs:

```js
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 12);
const ok = await bcrypt.compare(password, hash);
```

**argon2** is often preferred modern choice; bcrypt is widely deployed. Tune cost factors to ~100ms on your hardware. Hash **server-side** only; salt is built-in.

**Nuance:** timing-safe compares; migrate hashes on login if params change; never log passwords.

---

### Sessions vs JWT (tradeoffs)

| | Sessions | JWT (bearer) |
|---|---|---|
| State | server store | client holds token |
| Revocation | delete session | hard until expiry (need blocklist) |
| Scaling | needs shared store | easy horizontally |
| Size | small cookie id | larger token |

**Hybrid:** short-lived access JWT + refresh token server-side. Cookie sessions with Redis remain excellent for first-party browsers (CSRF considerations).

**Interview:** "stateless JWT" still needs key management, expiry, and often refresh/revocation strategy—not a free lunch.

---

### JWT structure, signing, refresh tokens

JWT: `header.payload.signature` (Base64url JSON).

```js
import jwt from 'jsonwebtoken';
const access = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
```

**Claims:** `sub`, `exp`, `iat`, `aud`, `iss`. Prefer **asymmetric** RS256/ES256 for multi-service verify. Store **refresh** tokens hashed in DB; rotate on use; bind to device when possible.

**Nuance:** don't put secrets in payload (only signed, not encrypted unless JWE). Validate `alg` explicitly to avoid alg=none attacks.

---

### OAuth2 / OpenID Connect basics in Node apps

**OAuth2:** delegated authorization (access APIs as a user/client). **OIDC:** identity layer on OAuth (ID token, UserInfo).

Flows: authorization code (+ PKCE for public clients) is default for apps; client credentials for machine-to-machine.

In Node: passport strategies, `openid-client`, Auth0/Cognito SDKs. Store tokens securely; map IdP subject to local user; validate issuer/audience.

**Interview:** know code flow vs implicit (legacy); why PKCE; difference between access token and ID token.

---

### Helmet & secure HTTP headers

Helmet sets headers like `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security` (when configured).

```js
app.use(helmet());
```

**Why:** defense in depth against XSS clickjacking MIME sniffing. CSP needs real tuning for your frontends—defaults may break apps.

**Nuance:** Helmet ≠ full security program; still need input validation, authz, dependency hygiene.

---

### CSRF for cookie-based apps

Browsers automatically send cookies on requests → malicious sites can trigger state-changing requests.

**Defenses:** `SameSite` cookies; CSRF tokens (double-submit / synchronizer); correlating custom headers for SPA+API on same site.

```js
// SameSite=lax/strict reduces risk; still use tokens for sensitive POSTs when using cookie sessions
```

**JWT in `Authorization` header** is not sent cross-site by browsers automatically—different threat model than cookie sessions. Pick defenses matching your auth transport.

---

### XSS / injection / prototype pollution awareness

- **XSS:** untrusted HTML/JS in pages—escape output, CSP, sanitize. APIs returning JSON still matter if clients unsafe-`innerHTML`.  
- **SQL/NoSQL injection:** parameterize; validate; avoid building queries from strings.  
- **Command injection:** never `exec` unsanitized input.  
- **Prototype pollution:** unsafe merges of JSON into objects (`__proto__`)—use `Object.create(null)`, hardened libs, freeze where needed.

**Interview:** name the bug class + one concrete Node mitigation.

---

### Rate limiting & brute-force defenses

Protect auth and expensive routes:

```js
import rateLimit from 'express-rate-limit';
app.use('/login', rateLimit({ windowMs: 60_000, max: 5 }));
```

Use Redis-backed stores for multi-instance. Add lockouts/backoff, CAPTCHA when needed, device fingerprinting carefully. Prefer IP + account dimensions.

**Nuance:** naive IP limits hurt NAT users; combine signals. Edge/WAF rate limits complement app limits.

---

### Secrets management (never commit `.env`)

Secrets: DB URLs, JWT keys, API tokens. Keep them in env/secret managers (AWS Secrets Manager, GCP Secret Manager, Vault), inject at runtime.

**.gitignore** `.env`; use `.env.example` with placeholders. Rotate on leak; least privilege IAM; different secrets per environment.

**Interview red flag:** secrets in git history—mention rotation + scanning (`gitleaks`). Config ≠ code.

---

### Dependency security (`npm audit`, lockfiles, supply chain)

```bash
npm audit
npm ci   # clean, lockfile-faithful install in CI
```

Pin with lockfiles; review new deps; prefer maintained packages; enable Dependabot/Renovate; beware typosquatting and postinstall scripts.

**Supply chain:** install only what you need; use `ignore-scripts` in CI when possible; verify package integrity. `audit` has false positives—triage, don't ignore blindly.

---

**📌 Testing**

### Unit vs integration vs e2e in Node

| Layer | Scope | Example |
|---|---|---|
| **Unit** | function/module in isolation | hash password, pure pricing |
| **Integration** | modules + DB/Redis | repo + Postgres in Docker |
| **E2E** | full HTTP stack | Supertest/Playwright against app |

**Pyramid:** many fast units, fewer integrations, few e2e. Interviews: know what each catches and the cost/flakiness tradeoff.

---

### Jest / Vitest / Node test runner overview

| Runner | Notes |
|---|---|
| **Jest** | ubiquitous, great mocking, heavier |
| **Vitest** | Vite-native, fast, Jest-like API |
| **node:test** | built-in, lightweight, growing |

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
test('adds', () => assert.equal(1 + 2, 3));
```

Pick one per repo; CI parallelization; TypeScript via ts-jest/vitest/tsx.

---

### Mocking modules & timers

```js
jest.unstable_mockModule('./mailer.js', () => ({
  sendMail: jest.fn(async () => {}),
}));
jest.useFakeTimers();
jest.advanceTimersByTime(1000);
```

Mock at boundaries (email, payments, time)—not every internal function. Restore mocks between tests. For ESM, know current mocking limitations/patterns.

**Nuance:** over-mocking tests the mock. Prefer fakes/in-memory repos for domain logic.

---

### Supertest for HTTP APIs

Supertest hits your Express app without opening a port (or against a listening server).

```js
import request from 'supertest';
import { app } from '../app.js';

await request(app)
  .post('/users')
  .send({ email: 'a@b.com' })
  .expect(201)
  .expect('Content-Type', /json/);
```

Great for middleware/routing/status codes. Combine with test DB. Assert response bodies carefully (stable fields).

---

### Testing Express routes & middleware

- Unit-test middleware with fake `req`/`res`/`next`  
- Integration-test routes with Supertest  
- Inject dependencies (db, clock) for determinism  

```js
function auth(req, res, next) {
  if (!req.headers.authorization) return res.status(401).end();
  next();
}
```

Cover happy path, 401/403/400/404/500 mapping, and validation failures. Test error middleware gets `next(err)`.

---

### Test databases & isolation strategies

Use a real Postgres in Docker/CI when SQL matters. Strategies:

- **Transaction rollback** per test  
- **Truncate** tables between tests  
- **Ephemeral schemas/databases** per worker  

Never point tests at prod. Seed minimal fixtures. Parallel tests need isolation (separate DBs or careful locking). Prefer migrations to create schema, not hand-rolled dumps only.

---

### Coverage & what “enough” tests means in interviews

Coverage % is a **signal**, not a goal. 100% with weak assertions is theater.

**Enough** usually means: critical auth/money paths covered; domain invariants tested; regressions for past bugs; CI green and fast enough to run always.

**Interview:** talk risk-based testing—authz, payments, data integrity—over chasing a number. Mention flakiness control and test data factories.

---

**📌 Performance & Scalability**

### Profiling CPU & memory (clinic, `--inspect`, heap snapshots)

```bash
node --inspect app.js
npx clinic doctor -- node app.js
npx clinic flame -- node app.js
```

Chrome DevTools: CPU profiles, heap snapshots, allocation timelines. Look for hot functions, retained DOM-less objects (closures, caches, listeners).

**Interview:** measure before optimizing; event-loop lag + heap growth tell different stories (CPU vs leak).

---

### Memory leaks common in Node (listeners, caches, closures)

Common culprits:

- `EventEmitter` listeners never removed  
- Global/module-level caches without TTL/bounds  
- Closures capturing large buffers/requests  
- Uncleared intervals/timeouts  
- Growing arrays/maps per connection  

**Detection:** heap snapshots diff; `process.memoryUsage()`; clinic heapprofiler. **Fix:** bounded LRU, `AbortSignal`, remove listeners on close, stream data.

---

### Clustering (`cluster` module) & multi-core utilization

```js
import cluster from 'cluster';
import os from 'os';
if (cluster.isPrimary) {
  for (let i = 0; i < os.availableParallelism(); i++) cluster.fork();
} else {
  startServer();
}
```

One process ≈ one JS thread. Cluster forks workers sharing a server port for multi-core HTTP. Alternatives: PM2 cluster mode, Kubernetes replicas (often preferred).

**Nuance:** in-memory state isn't shared—sessions/cache must be external. Sticky sessions may be needed for some WebSocket setups.

---

### Load balancing sticky sessions vs JWT

**Sticky sessions:** LB routes a client to the same instance (session memory or WS affinity). Simple but uneven load and painful deploys.

**JWT / shared session store:** any instance can serve any request—better for horizontal scale.

**Interview:** prefer shared Redis sessions or JWT (with clear revocation story) over stickiness; use stickiness only when necessary (some WS/socket cases), knowing the tradeoffs.

---

### Caching strategies (in-memory vs Redis)

| Cache | Pros | Cons |
|---|---|---|
| **In-memory** | fastest, simple | per-process, lost on restart, inconsistent multi-instance |
| **Redis** | shared, TTL, eviction | network hop, ops cost |

Patterns: cache-aside, TTLs, stampede protection (singleflight), key namespacing, explicit invalidation on writes.

**Nuance:** cache only idempotent/read-heavy data; never cache unauthorized personalized data under a shared key.

---

### Horizontal scaling Node APIs

Scale out: multiple processes/instances behind a load balancer.

**Requirements:** stateless app tier (or externalized state), shared sessions/cache, connection pool sizing vs DB, idempotent workers for retries, health checks for LB.

**Node specifics:** each instance has its own event loop—great for I/O concurrency; still protect the DB and downstreams with limits/queues.

---

### When Node is the wrong tool (CPU-bound workloads)

Heavy pure computation (video encode, tight ML inference, huge CPU crypto at QPS) can monopolize the event loop.

**Options:** Worker Threads for moderate CPU; rewrite hot path in Go/Rust/Java; native addons; offload to specialized services/GPUs; batch offline.

**Interview honesty:** Node excels at concurrent I/O. Choosing Node for a CPU crusher because "team knows JS" is a tradeoff—call it out and mitigate.

---

### Message queues overview (BullMQ / Rabbit / SQS)

Use queues for async work: emails, webhooks, image processing, fan-out.

| Tool | Notes |
|---|---|
| **BullMQ** | Redis-based, popular in Node |
| **RabbitMQ** | AMQP brokers, routing patterns |
| **AWS SQS** | managed, integrates with AWS |

**Ideas:** at-least-once delivery → idempotent consumers; retries/DLQ; visibility timeouts; don't do heavy work on the HTTP request path—enqueue and respond `202`.

---

**📌 Production & Ops**

### Process managers (PM2, systemd)

Keep Node alive across crashes and reboots.

- **PM2:** process mgmt, cluster mode, logs—common on VMs  
- **systemd:** OS-native unit files, restart policies  
- **Containers/K8s:** often replace PM2; rely on orchestrator restarts  

```bash
pm2 start app.js -i max
```

**Interview:** prefer platform supervision in containers; PM2 still appears in legacy VM deploys. Capture logs and exit codes correctly.

---

### Graceful shutdown (`SIGTERM`, drain connections)

```js
process.on('SIGTERM', async () => {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
});
```

On `SIGTERM`: stop accepting new connections, finish in-flight requests, close DB/Redis, flush logs, exit. K8s sends SIGTERM before kill.

**Nuance:** readiness probe should fail first so LB drains traffic; set terminationGracePeriodSeconds appropriately.

---

### Logging (pino/winston) & structured logs

```js
import pino from 'pino';
const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });
logger.info({ reqId, userId }, 'order created');
```

**Structured JSON** logs are queryable in ELK/Datadog. Prefer **pino** for speed; winston is flexible. Log levels, request IDs, never log secrets/PII carelessly.

**12-factor:** log to stdout/stderr; let the platform ship logs.

---

### Health checks & readiness vs liveness

- **Liveness:** process should be restarted if failing (deadlock/stuck). Keep shallow.  
- **Readiness:** ready to receive traffic (DB pool up, warmup done). Fail readiness to drain without killing.

```js
app.get('/healthz', (req, res) => res.sendStatus(200));
app.get('/readyz', async (req, res) => {
  try { await pool.query('select 1'); res.sendStatus(200); }
  catch { res.sendStatus(503); }
});
```

Don't make liveness depend on downstreams or you cascade failures.

---

### Metrics & APM (OpenTelemetry overview)

**OpenTelemetry (OTel):** vendor-neutral traces/metrics/logs instrumentation. Export to Jaeger, Prometheus, Datadog, etc.

Track: RPS, latency histograms, error rates, event-loop delay, heap, DB pool wait.

**APM** agents auto-instrument HTTP/DB. Interviews: golden signals + trace a request across services with a correlation id.

---

### Reverse proxy with Nginx

Nginx (or Envoy/ALB) terminates TLS, load balances, serves static assets, rate limits, and buffers clients.

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

Node trusts proxy headers only when behind a known proxy (`app.set('trust proxy', 1)`). WebSockets need Upgrade headers configured.

---

### Containers & Node Docker image best practices

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
# multi-stage: run as non-root, small final image
USER node
CMD ["node", "dist/index.js"]
```

**Practices:** multi-stage builds; `npm ci`; non-root user; omit devDeps in prod; small base images; don't bake secrets; healthcheck; graceful SIGTERM; pin base digests when paranoid.

---

### 12-factor config, 12-factor logs, immutable deploys

- **Config:** env vars, not checked-in secrets  
- **Logs:** stdout streams, no local log files as source of truth  
- **Immutable deploys:** build artifact/image once; promote same binary across envs; no SSH mutates  

**Why:** reproducibility, scaling, and rollback. Node apps should be disposable processes.

---

### Handling uncaughtException / unhandledRejection in prod

```js
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'unhandledRejection');
  // shut down gracefully; let supervisor restart
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaughtException');
  process.exit(1);
});
```

After unknown exceptions, process state may be corrupt—**log, flush, exit**, don't keep serving forever. Prefer crash + restart over "recover at all costs." Fix root causes; use `strict` unhandled rejection modes in modern Node.

---

**📌 Advanced / Interview Differentiating**

### Event-driven architecture with Node

Services communicate via events/messages (bus, queue, log) instead of only sync HTTP chains.

**Fits Node:** non-blocking consumers, `EventEmitter` in-process, Redis streams/BullMQ/Kafka clients.

**Tradeoffs:** eventual consistency, idempotency, ordering, poison messages. Interview: when to choose choreography vs orchestration; at-least-once processing.

---

### WebSockets (`ws`) & Socket.IO overview

**`ws`:** lightweight WebSocket library close to the protocol.  
**Socket.IO:** higher-level—fallback transports, rooms, auto-reconnect, ACK.

```js
import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ server });
wss.on('connection', (socket) => {
  socket.on('message', (data) => socket.send('pong'));
});
```

**Scale:** sticky sessions or pub/sub adapter (Redis) so broadcasts cross instances. Auth on handshake; heartbeats; backpressure.

---

### GraphQL with Node (Apollo overview)

GraphQL exposes a schema of types/queries/mutations; clients ask for exact fields. **Apollo Server** (and alternatives like Yoga/Mercurius) integrate with Express/Fastify/standalone HTTP.

**Node concerns:** resolvers + DataLoader to avoid N+1; auth in context; query depth/cost limits; caching.

**Interview:** GraphQL ≠ magic REST replacement; over/under fetching tradeoffs flip to resolver complexity and abuse protection.

---

### NestJS architecture (modules, DI) overview

NestJS structures apps into **modules**, **providers** (DI), **controllers**, and optionally GraphQL/WebSockets/microservices.

```ts
@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

Inspired by Angular. Runs on Express or Fastify. Great for large teams needing conventions; overhead for tiny scripts.

**Interview:** constructor injection, module boundaries, testing with testing module—map concepts to Spring-like DI literacy.

---

### Serverless Node (Lambda cold starts, constraints)

AWS Lambda/Cloud Functions run Node handlers per event. **Cold start:** new isolate boots—optimize package size, lazy init, provisioned concurrency.

**Constraints:** time/memory limits; no long-lived WS easily (use API Gateway WS); connection pooling pitfalls (reuse carefully across invocations); ephemeral filesystem.

**Interview:** when serverless shines (spiky I/O workloads) vs always-on containers (steady traffic, sticky connections).

---

### Native addons / N-API awareness (rare but impressive)

Native addons (C/C++/Rust via N-API/node-addon-api) extend Node for CPU-heavy or OS-specific work.

**N-API:** ABI-stable interface across Node versions—prefer over legacy NAN when writing addons.

**Interview awareness:** why they exist, risk (segfaults crash the process), distribution (`prebuild`), and alternatives (WASM, sidecar service, Worker + pure JS). Rare to write in interviews—valuable to discuss tradeoffs.

---

### ESM package `exports` map for libraries

Modern libraries declare precise entrypoints:

```json
{
  "name": "fancy-lib",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./plugin": "./dist/plugin.js"
  }
}
```

**Benefits:** block deep imports of internals; dual CJS/ESM publish; conditional exports for browsers/node.

**Pitfalls:** dual-package hazard; consumers on old Node; testing both `import` and `require` graphs.

---

### Designing idiomatic Node service boundaries

Idiomatic Node services tend to be:

- **I/O-bound** HTTP/gRPC/queue consumers  
- **Stateless** app tier with externalized state  
- **Small surface:** clear module boundaries (routes → services → data)  
- **Async-first** APIs with AbortSignal and timeouts  
- **Observable:** structured logs, metrics, traces  
- **Fail fast** on config; **fail graceful** on shutdown  

**Interview close:** Node is a concurrency runtime for networked apps—design around the event loop, keep CPU off the hot path, and make every dependency timeout/retry/idempotent at the edges.

---
