# Node.js

Checklist for deep-dive Node.js interview prep (runtime, async model, Express APIs, data access, security, testing, production). Check off when you can explain aloud with tradeoffs and a small code mental model.

*Related:* language-agnostic backend/system design docs for distributed topics; this doc focuses on **Node.js runtime + Express-style HTTP APIs**.

---

**📌 Node.js Foundations**

- [] Node.js overview & what it is (and isn't)
- [] Node.js vs browsers vs Deno vs Bun
- [] V8, libuv, and the Node runtime stack
- [] Single-threaded JS + thread pool reality
- [] Event loop phases (timers, pending, poll, check, close)
- [] `process.nextTick` vs `queueMicrotask` vs `setImmediate` vs `setTimeout`
- [] Blocking the event loop (CPU-heavy work pitfalls)
- [] Call stack, microtasks, and macrotasks
- [] When to use Worker Threads vs child processes vs clustering
- [] REPL, `node` CLI flags, and debugging basics

---

**📌 Modules, Packaging & Tooling**

- [] CommonJS (`require` / `module.exports`)
- [] ES Modules (`import` / `export`) and `.mjs` / `"type": "module"`
- [] Interop CJS ↔ ESM pitfalls
- [] `package.json` essentials (`name`, `main`, `exports`, `engines`, scripts)
- [] Semantic versioning & semver ranges (`^`, `~`, exact)
- [] `npm` vs `yarn` vs `pnpm` (lockfiles & installs)
- [] `node_modules` resolution algorithm
- [] Local vs global packages; `npx`
- [] Environment config (`.env`, `process.env`, 12-factor basics)
- [] TypeScript with Node (tsc, tsx, path aliases overview)

---

**📌 Core Built-ins**

- [] `process` object (`env`, `argv`, `cwd`, signals, exit codes)
- [] Path handling (`path`, POSIX vs Windows)
- [] File system (`fs` sync vs async vs promises API)
- [] Buffers & binary data
- [] Streams (Readable, Writable, Duplex, Transform; backpressure)
- [] `pipeline` / `stream/promises` error handling
- [] Events & `EventEmitter`
- [] Timers & cancellation patterns
- [] URL / `URLSearchParams` / WHATWG URL API
- [] `util.promisify` / `util.types` / debugging helpers
- [] Crypto basics (`crypto` hashing, HMAC, randomBytes)
- [] HTTP/HTTPS core modules (without Express)

---

**📌 Async Patterns**

- [] Callbacks & error-first convention
- [] Promises & async/await
- [] `Promise.all` / `allSettled` / `race` / `any`
- [] Error handling in async flows (try/catch, unhandledRejection)
- [] Concurrent async work without blocking
- [] Cancellation ideas (AbortController)
- [] Async iterators & `for await...of`
- [] Avoiding callback hell and promise antipatterns

---

**📌 Express & HTTP APIs**

- [] Express overview & middleware philosophy
- [] App vs Router
- [] Routing (`get/post/put/patch/delete`, params, query)
- [] Request & response objects (`req`, `res`)
- [] Middleware chain (order matters)
- [] Built-in middleware (`express.json`, `urlencoded`, static)
- [] Third-party middleware (helmet, cors, morgan, compression)
- [] Error-handling middleware (`err, req, res, next`)
- [] 404 handling patterns
- [] Validation (Joi / Zod / express-validator)
- [] File uploads (multer) & streaming responses
- [] Cookies, sessions, and cookie-parser
- [] CORS configuration for APIs
- [] API versioning strategies
- [] Choosing Express vs Fastify vs NestJS (overview)

---

**📌 Data Access**

- [] Connecting to PostgreSQL (`pg` / pools)
- [] Connection pooling & why it matters in Node
- [] Query parameterization (SQL injection defense)
- [] ORMs/query builders overview (Prisma, Knex, TypeORM, Sequelize)
- [] MongoDB with Mongoose (when document DBs fit)
- [] Transactions with SQL databases
- [] N+1 and over-fetching in Node data layers
- [] Redis for cache/sessions/rate limits
- [] Migrations in Node ecosystems
- [] Repository / data-access layer patterns

---

**📌 Auth & Security**

- [] Authentication vs authorization
- [] Password hashing (bcrypt / argon2)
- [] Sessions vs JWT (tradeoffs)
- [] JWT structure, signing, refresh tokens
- [] OAuth2 / OpenID Connect basics in Node apps
- [] Helmet & secure HTTP headers
- [] CSRF for cookie-based apps
- [] XSS / injection / prototype pollution awareness
- [] Rate limiting & brute-force defenses
- [] Secrets management (never commit `.env`)
- [] Dependency security (`npm audit`, lockfiles, supply chain)

---

**📌 Testing**

- [] Unit vs integration vs e2e in Node
- [] Jest / Vitest / Node test runner overview
- [] Mocking modules & timers
- [] Supertest for HTTP APIs
- [] Testing Express routes & middleware
- [] Test databases & isolation strategies
- [] Coverage & what “enough” tests means in interviews

---

**📌 Performance & Scalability**

- [] Profiling CPU & memory (clinic, `--inspect`, heap snapshots)
- [] Memory leaks common in Node (listeners, caches, closures)
- [] Clustering (`cluster` module) & multi-core utilization
- [] Load balancing sticky sessions vs JWT
- [] Caching strategies (in-memory vs Redis)
- [] Horizontal scaling Node APIs
- [] When Node is the wrong tool (CPU-bound workloads)
- [] Message queues overview (BullMQ / Rabbit / SQS)

---

**📌 Production & Ops**

- [] Process managers (PM2, systemd)
- [] Graceful shutdown (`SIGTERM`, drain connections)
- [] Logging (pino/winston) & structured logs
- [] Health checks & readiness vs liveness
- [] Metrics & APM (OpenTelemetry overview)
- [] Reverse proxy with Nginx
- [] Containers & Node Docker image best practices
- [] 12-factor config, 12-factor logs, immutable deploys
- [] Handling uncaughtException / unhandledRejection in prod

---

**📌 Advanced / Interview Differentiating**

- [] Event-driven architecture with Node
- [] WebSockets (`ws`) & Socket.IO overview
- [] GraphQL with Node (Apollo overview)
- [] NestJS architecture (modules, DI) overview
- [] Serverless Node (Lambda cold starts, constraints)
- [] Native addons / N-API awareness (rare but impressive)
- [] ESM package `exports` map for libraries
- [] Designing idiomatic Node service boundaries
