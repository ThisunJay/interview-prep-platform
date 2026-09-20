# Express.js

A deep-dive companion to `Express.js Topics.md`. Each heading matches the checklist; under every topic: **what it is**, **why it matters**, **how it works**, and **interview-ready nuance**. Node.js Guide covers the runtime & event loop; this doc focuses on **Express HTTP apps and APIs**.

---

**📌 Express Foundations**

### Express overview & why it exists

Express is a minimal, unopinionated **web framework** for Node.js. It sits on top of Node's `http` module and gives you routing, middleware composition, and a request/response API without prescribing ORM, auth, or folder layout.

**Why it exists:** Raw Node `http` forces you to parse URLs, methods, and headers yourself. Express standardizes the **middleware pipeline** (`req, res, next`) so libraries (CORS, body parsers, auth) compose cleanly.

```js
const express = require('express');
const app = express();
app.get('/health', (req, res) => res.json({ ok: true }));
app.listen(3000);
```

**Why it matters:** Most Node interview API questions assume Express idioms even if the company uses Fastify/Nest—the mental model (router + middleware + error middleware) transfers.

**Nuance:** "Minimal" means *you* choose structure and security. Express does not magically make an app production-ready; it makes HTTP plumbing composable.

---

### Express vs Node `http` module

Node's `http.createServer((req, res) => …)` is the primitive. Express wraps it: same IncomingMessage/ServerResponse under the hood, plus routing tables, middleware stack, and helpers (`res.json`, `res.status`).

```js
// http
require('http').createServer((req, res) => {
  if (req.url === '/hi' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ hi: true }));
  } else { res.writeHead(404); res.end(); }
}).listen(3000);

// Express equivalent
app.get('/hi', (req, res) => res.json({ hi: true }));
```

**Why Express wins for APIs:** declarative routes, reusable middleware, ecosystem packages, cleaner error propagation via `next(err)`.

**When raw `http` still matters:** custom servers, WebSocket upgrades, understanding `app.listen` internals, or ultra-thin edge handlers. Interviewers often ask you to explain what Express adds *on top of* `http`.

---

### Express vs Fastify vs Koa vs NestJS

| | Express | Fastify | Koa | NestJS |
|---|---|---|---|---|
| Style | Middleware chain | Plugin + schema | Async middleware (ctx) | Angular-like DI modules |
| Perf focus | Good enough | High throughput, schemas | Lean core | Structure over raw speed |
| Typing | Manual / community | Strong JSON Schema | Manual | First-class TypeScript |
| Ecosystem | Largest | Growing | Smaller | Batteries + Express/Fastify adapter |

**Interview stance:** Express = default literacy and hiring pool. Fastify when you want validation/serialization performance and plugins. Koa when you want async/`ctx` elegance with fewer built-ins. Nest when the team wants enterprise structure (modules, DI, guards) on Node.

**Tradeoff:** Switching costs are mostly middleware/ecosystem habits, not HTTP itself. Don't pick Nest for a 3-route prototype or Express without conventions for a 50-person monolith.

---

### Installing Express & hello-world app

```bash
mkdir api && cd api
npm init -y
npm install express
# optional: npm install -D nodemon
```

```js
// index.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello Express');
});

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
```

**Why it matters:** Shows you can bootstrap without generators. Know `npm install express` vs pinning major versions (`"express": "^4.21.0"`), and that Express 5 may be on the project's roadmap.

**Nuance:** Prefer `"type": "module"` + ESM or stick to CJS consistently. Hello-world is not production—add `NODE_ENV`, structured logging, and a process manager later.

---

### `express()` application instance

Calling `express()` returns an **application**—a function `(req, res) => …` that is also an object with `.get`, `.use`, `.set`, `.listen`, etc.

```js
const express = require('express');
const app = express();

app.set('env', process.env.NODE_ENV || 'development');
app.disable('x-powered-by'); // hide Express fingerprint
app.locals.appName = 'prep-api';
```

**Key ideas:** One app owns the middleware stack and settings. You can mount *other* apps or routers with `app.use('/api', otherApp)`. Settings like `trust proxy`, `view engine`, and `json spaces` live on the app.

**Interview tip:** `app` is both the request handler and the configuration root—passing `app` into `http.createServer(app)` works because it's a function.

---

### Request/response cycle in Express

1. Client sends HTTP request → Node `http` server receives it.  
2. Express matches middleware/`app.use` in **registration order**.  
3. Matching route handlers run; each may read `req`, write `res`, call `next()`, or end the response.  
4. If something calls `next(err)`, control jumps to **error middleware** `(err, req, res, next)`.  
5. If nothing handles the request, you should have a 404 middleware; otherwise the connection may hang or hit the default handler.

```js
app.use(express.json());
app.use((req, res, next) => { req.id = crypto.randomUUID(); next(); });
app.get('/users/:id', getUser);
app.use(notFound);
app.use(errorHandler);
```

**Why it matters:** Almost every Express bug (order, double-send, swallowed async errors) is a cycle misunderstanding.

**Nuance:** Middleware does not "return" to previous layers like a stack unwind for success—once `res.end` happens, later middleware for that request should not write again.

---

### `app.listen` vs wrapping with Node `http.Server`

`app.listen(port)` is sugar: it creates an `http.Server`, registers `app` as the handler, and calls `listen`.

```js
// Convenient
const server = app.listen(3000);

// Explicit — needed for HTTPS, Socket.IO, graceful shutdown
const http = require('http');
const server = http.createServer(app);
server.listen(3000);

// HTTPS
const https = require('https');
https.createServer({ key, cert }, app).listen(443);
```

**Why wrap yourself:** Graceful shutdown (`server.close()`), attaching WebSockets, custom timeouts (`server.setTimeout`), or sharing the server with other protocols.

**Interview stance:** Prefer holding the `server` reference in production code. `app.listen` is fine for demos; ops patterns need the `http.Server`.

---

### Environment-based config for Express apps

Never hardcode secrets or prod URLs. Load config from environment (and optionally a validated config module).

```js
// config.js
const required = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env ${k}`);
  return v;
};

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  dbUrl: required('DATABASE_URL'),
  sessionSecret: required('SESSION_SECRET'),
};
```

**Patterns:** `dotenv` for local only; real deploys inject env. Split `development` / `test` / `production` behavior (`morgan` formats, cookie `secure`, detailed errors).

**Nuance:** Fail fast on missing critical env at boot. Don't commit `.env`. `NODE_ENV=production` changes Express's default error verbosity—know that.

---

### Project structure conventions (routes, controllers, middleware, services)

Express won't enforce structure. A common API layout:

```text
src/
  app.js          # createApp(): middleware + mount routers (no listen)
  server.js       # listen + shutdown
  config/
  routes/         # thin: wire paths → controllers
  controllers/    # HTTP in/out, call services
  services/       # business logic, DB
  middleware/     # auth, validate, errors
  models/ or repos/
```

**Why it matters:** Interviews probe whether you keep handlers thin and testable. Mount routers in `app.js`; start the server only in `server.js` so tests can import `createApp()`.

**Anti-patterns:** God `index.js` with routes + SQL + auth; circular requires between routers and services. Prefer dependency injection of services into controllers for tests.

---

**📌 Routing**

### Basic routing (`app.get/post/put/patch/delete/all`)

Route methods register handlers for a path + HTTP verb:

```js
app.get('/items', listItems);
app.post('/items', createItem);
app.put('/items/:id', replaceItem);
app.patch('/items/:id', patchItem);
app.delete('/items/:id', deleteItem);
app.all('/debug', (req, res) => res.json({ method: req.method }));
```

`app.all` matches any method; `app.use` matches any method and is usually for middleware/mounts.

**REST idioms:** GET safe/idempotent; PUT replace; PATCH partial; POST create or actions; DELETE remove.

**Nuance:** Method mismatch on a defined path may fall through to 404 unless you handle 405. Order matters when paths overlap.

---

### Route paths & string patterns

Express path-to-regexp style patterns (Express 4/5 differ slightly):

```js
app.get('/ab?cd', …);      // acd or abcd
app.get('/ab+cd', …);      // one or more b
app.get('/ab*cd', …);      // wildcard segment (legacy-style)
app.get(/.*fly$/, …);      // RegExp
app.get('/users/:userId/books/:bookId', …);
```

Prefer **explicit params** over clever string patterns—they're readable and safer.

**Why it matters:** Overly magical paths cause surprising matches and security footguns (open redirects, unintended wildcards).

**Express 5 note:** Some legacy wildcard/`*` path syntax changed; check docs when upgrading. Prefer named params and routers with prefixes.

---

### Route parameters (`req.params`)

Named segments become `req.params`:

```js
app.get('/users/:id', (req, res) => {
  const { id } = req.params; // always strings
  res.json({ id });
});

app.get('/files/*file', …); // catch-all style depends on Express version
```

**Always validate/coerce:** IDs are strings until you parseInt/UUID-check. Never interpolate params into SQL/shell.

**With `app.param`:** preprocess once (`app.param('id', loadUser)`). Nested routers still see params if `mergeParams: true`.

**Interview tip:** Contrast `params` (path) vs `query` (after `?`) vs `body` (payload). Mixing them up is a common junior mistake.

---

### Query strings (`req.query`)

The query string is parsed into `req.query` (object). Arrays/nested shapes depend on the query parser setting.

```js
// GET /search?q=express&page=2&tag=a&tag=b
app.get('/search', (req, res) => {
  const { q, page, tag } = req.query;
  res.json({ q, page, tag });
});

app.set('query parser', 'extended'); // qs library (default-ish)
// or 'simple' for basic Node querystring
```

**Why it matters:** Pagination, filters, and search live here. Types are strings/arrays—coerce and validate (`page` → number, clamp limits).

**Nuance:** Huge query strings can be an attack vector; validate allowed keys. Don't trust `req.query` for auth.

---

### `Router` vs mounting on `app`

`express.Router()` creates a mini-app for a subset of routes. Mount with `app.use('/prefix', router)`.

```js
const users = express.Router();
users.get('/', listUsers);
users.get('/:id', getUser);

app.use('/users', users); // GET /users, GET /users/:id
```

**Why routers:** Modularize by resource, apply middleware to a group (`users.use(auth)`), and keep `app.js` thin.

**vs mounting on `app`:** `app.get('/users', …)` is fine for tiny apps; routers scale better and mirror "feature folders."

**Options:** `express.Router({ mergeParams: true })` to see parent `:id` inside child routers.

---

### `router.route()` chaining

Chain handlers for the same path across methods:

```js
router.route('/users/:id')
  .get(getUser)
  .put(replaceUser)
  .patch(patchUser)
  .delete(deleteUser);
```

**Why use it:** Keeps one path definition; easy to attach shared middleware for that path:

```js
router.route('/users/:id')
  .all(loadUser)
  .get(getUser)
  .patch(patchUser);
```

**Nuance:** Still respect order across the file. Chaining is sugar—behavior equals separate `router.get/put/...` calls.

---

### Route order & specificity pitfalls

Express matches **in order**. The first matching route/middleware wins for that layer.

```js
// BUG: static path never reached if :id is first
router.get('/:id', getById);
router.get('/me', getMe); // unreachable

// FIX: specific first
router.get('/me', getMe);
router.get('/:id', getById);
```

**Also:** `app.use('/api', …)` runs for every `/api…` request. A greedy middleware without `next()` starves later routes.

**Interview tip:** When debugging "wrong handler," print registration order and check param routes vs literals. Mount path + router path concatenate.

---

### Nested routers & prefixes

Compose resource trees:

```js
const posts = express.Router({ mergeParams: true });
posts.get('/', listPosts);           // /users/:userId/posts
posts.post('/', createPost);

const users = express.Router();
users.use('/:userId/posts', posts);
app.use('/users', users);
```

**Prefixes:** Mount path (`/users`) + router paths. Avoid double slashes and redundant prefixes inside the child.

**Why it matters:** Clean REST nesting (`/orgs/:orgId/projects/:projectId`). Use `mergeParams` or re-read parent ids from a prior middleware-loaded context.

**Tradeoff:** Deep nesting can mirror DB relations too literally—sometimes flat `/posts?userId=` is simpler.

---

### Named route organization by resource

Organize by **resource**, not by HTTP verb files:

```text
routes/users.js      → /users
routes/orders.js     → /orders
routes/auth.js       → /auth/login, /auth/logout
```

Export a router per resource; mount once in `app.js` with a clear prefix map. Controllers named `usersController.list` etc.

**Why it matters:** Onboarding and code review scale when every resource has a home. Mirrors how you talk about the API in design docs.

**Anti-pattern:** `getRoutes.js`, `postRoutes.js` by verb. Prefer resource modules; share cross-cutting auth via middleware mounts.

---

### 405 Method Not Allowed patterns

Express default: unknown method on an existing path often looks like **404** if no handler registered. Explicit 405 is more RESTful.

```js
router.route('/items/:id')
  .get(getItem)
  .put(replaceItem)
  .all((req, res) => {
    res.set('Allow', 'GET, PUT');
    res.sendStatus(405);
  });
```

Or a final method-check middleware after verb routes. Include an `Allow` header listing supported methods.

**Interview stance:** 404 = no resource; 405 = resource exists, wrong verb. Many APIs blur this—know the distinction even if product chooses 404 for security-through-obscurity.

---

### Trailing slashes & path normalization

`/users` and `/users/` can be different routes depending on settings and how you register paths.

```js
// Express 4: strict routing off by default (usually treats them similarly for many cases)
app.set('strict routing', true); // then /users and /users/ differ
```

**Practical approach:** Pick one canonical form; redirect with `301/308` or use middleware to strip trailing slashes for APIs. Document the convention.

**Why it matters:** Caches, CDNs, and clients treat URLs as strings—duplicate content and broken signed URLs appear when inconsistent.

**Nuance:** Mount paths with/without trailing slash affect how remaining path is stripped for child routers—test mounts.

---

### Host-based / subdomain routing (overview)

Express can branch on `Host` / subdomain for multi-tenant or admin portals.

```js
const admin = express.Router();
app.use(vhost('admin.example.com', admin)); // community `vhost` package

// or manual
app.use((req, res, next) => {
  if (req.hostname === 'admin.example.com') return admin(req, res, next);
  next();
});
```

**Why it matters:** White-label and admin separation. Often better handled at the reverse proxy (Nginx) by routing to different upstreams.

**Nuance:** Trust `Host` only with correct `trust proxy` settings; Host header attacks exist. Prefer proxy-level routing for security-sensitive splits.

---

**📌 Request & Response**

### `req` object essentials (`params`, `query`, `body`, `headers`, `cookies`)

Augmented IncomingMessage:

| Field | Source |
|---|---|
| `req.params` | path `:id` |
| `req.query` | `?a=1` |
| `req.body` | parsed body (needs middleware) |
| `req.headers` | lowercased header object |
| `req.cookies` | after `cookie-parser` |
| `req.method`, `req.url`, `req.path`, `req.ip` | request meta |

```js
app.post('/login', (req, res) => {
  const { email } = req.body;
  const requestId = req.get('x-request-id');
  const session = req.cookies?.sid;
});
```

**Interview tip:** `body` is empty until `express.json()` / urlencoded / multer runs. `req.ip` depends on `trust proxy`.

---

### `res` object essentials (`status`, `json`, `send`, `sendStatus`)

Common response helpers:

```js
res.status(201).json({ id });     // JSON + Content-Type
res.send('ok');                   // auto Content-Type sniffing
res.sendStatus(204);              // status + standard message body
res.status(404).end();            // empty body
```

**Chainable:** `res.status(400).json({ error: 'bad_request' })`.

**Why it matters:** Consistent API responses use `json` + explicit status. Prefer `sendStatus` for empty success (`204`) over inventing bodies.

**Nuance:** After `res.json`/`send`, the response is finished—don't write again. `res.send(object)` also JSON-stringifies; prefer `res.json` for clarity.

---

### Reading JSON bodies

```js
app.use(express.json({ limit: '100kb' }));
app.post('/users', (req, res) => {
  // req.body is already an object (or {} if empty)
  res.status(201).json(req.body);
});
```

**How it works:** Middleware reads the stream, parses JSON, assigns `req.body`, calls `next()`. Invalid JSON → error (usually 400 via default/error handler).

**Why limits:** Unbounded body size → memory DoS. Place JSON parser before routes that need it; skip for multipart uploads (use multer instead).

**Nuance:** `Content-Type` must be `application/json` (or configured type). Don't double-parse.

---

### URL-encoded form bodies

HTML forms typically post `application/x-www-form-urlencoded`:

```js
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
// extended: true → qs library (nested objects)
// extended: false → querystring (flat)
```

```html
<form method="POST" action="/login">
  <input name="email" /><input name="password" type="password" />
</form>
```

**When to use:** Server-rendered forms, simple POSTs. JSON APIs usually use `express.json()` instead.

**Nuance:** `extended: true` allows rich objects but has historically had prototype pollution considerations—keep limits and validate shapes.

---

### Headers: get/set/append

```js
const ua = req.get('User-Agent');      // case-insensitive get
res.set('X-Request-Id', id);
res.set({ 'X-A': '1', 'X-B': '2' });
res.append('Set-Cookie', 'a=1');       // multi-value friendly
res.type('json');                      // Content-Type shortcut
```

**Why it matters:** Auth tokens, caching (`Cache-Control`), CORS, content negotiation, and request IDs all flow through headers.

**Nuance:** Incoming headers are lowercased in `req.headers`. Never reflect raw header values into HTML without encoding. Hop-by-hop headers are proxy concerns.

---

### Status codes idioms for REST

| Code | Typical use |
|---|---|
| 200 | OK with body |
| 201 | Created (often + `Location`) |
| 204 | Success, no body |
| 400 | Validation / bad input |
| 401 | Unauthenticated |
| 403 | Authenticated but not allowed |
| 404 | Missing resource |
| 409 | Conflict (unique constraint) |
| 422 | Semantic validation (if you distinguish from 400) |
| 429 | Rate limited |
| 500 | Unexpected server fault |

**Interview stance:** Be consistent; document your matrix. Prefer 401 vs 403 correctly. Don't return 200 for every failure with `{ success: false }` in serious APIs—use HTTP semantics clients understand.

---

### Redirects (`res.redirect`)

```js
res.redirect('/login');           // 302 by default
res.redirect(301, '/new-url');    // permanent
res.redirect(308, '/new-url');    // permanent, preserve method
res.redirect('https://example.com/x');
```

**Why it matters:** OAuth callbacks, trailing-slash canonicalization, legacy URL support.

**Security:** Validate open redirects—never `res.redirect(req.query.next)` without an allowlist. Prefer relative paths or same-origin checks.

**Nuance:** 302/303 vs 307/308 affect whether clients rewrite POST → GET. APIs often avoid redirects and return absolute URLs in JSON instead.

---

### Sending files (`res.sendFile`, `res.download`)

```js
const path = require('path');
const root = path.join(__dirname, 'files');

res.sendFile('report.pdf', { root }, (err) => { if (err) next(err); });
res.download(path.join(root, 'report.pdf'), 'report.pdf'); // sets Content-Disposition
```

**Why `root`:** Prevents path traversal when joining user input—always resolve under a trusted directory and reject `..`.

**Nuance:** For large files or S3 objects, streaming / signed URLs beat `sendFile` through Node. `sendFile` needs absolute paths (or `root`). Handle errors in the callback.

---

### Streaming responses from Express

You can pipe Node streams to `res`:

```js
const fs = require('fs');
app.get('/big', (req, res) => {
  res.setHeader('Content-Type', 'application/octet-stream');
  const stream = fs.createReadStream('/data/big.bin');
  stream.on('error', next);
  stream.pipe(res);
});
```

**Why it matters:** Keeps memory flat for large payloads, CSV exports, proxied upstreams.

**Nuance:** Handle `error` and client abort (`req.on('close')`). Don't also call `res.json` on the same response. Compression middleware may buffer—know interactions.

---

### Content-Type & charset handling

`res.json` sets `application/json; charset=utf-8`. `res.type('html')` sets `text/html`. Charset matters for browsers interpreting text.

```js
res.set('Content-Type', 'text/plain; charset=utf-8');
res.send('こんにちは');
```

**Negotiation:** `req.accepts(['json', 'html'])` for multi-mode endpoints.

**Nuance:** Wrong Content-Type breaks clients. For APIs, always be explicit. Don't trust client-provided Content-Type for security decisions about file uploads—verify magic bytes / allowlists.

---

### Ending a response correctly (double-send bugs)

A response should be ended **once**. Classic bugs: calling `res.json` then `next()`, or both success and error paths sending.

```js
// BAD
app.get('/x', async (req, res) => {
  getUser(req.params.id, (err, user) => {
    if (err) res.status(500).json({ err });
    res.json(user); // still runs → double send
  });
});

// GOOD
if (err) return res.status(500).json({ err });
return res.json(user);
```

**Symptoms:** `Error [ERR_HTTP_HEADERS_SENT]`.

**Prevention:** Prefer `return res.…`, async/await with a single exit, and error middleware instead of ad-hoc sends in many layers.

---

**📌 Middleware**

### What middleware is (`req, res, next`)

Middleware is a function `(req, res, next)` that can inspect/modify the request, end the response, or delegate with `next()`.

```js
function requestId(req, res, next) {
  req.id = req.get('x-request-id') || crypto.randomUUID();
  res.set('x-request-id', req.id);
  next();
}
app.use(requestId);
```

**Why it matters:** Auth, logging, parsing, metrics, feature flags—all are middleware. Express's power is **composing** these functions in order.

**Mental model:** A pipeline. Each piece does one job and calls `next()` unless it finished the response (or passed `next(err)`).

---

### Application-level vs router-level vs route-level middleware

```js
// Application-level — all requests
app.use(cors());
app.use(express.json());

// Router-level — all routes on this router
const api = express.Router();
api.use(authRequired);
api.get('/profile', profile);

// Route-level — one route
app.get('/admin', authRequired, requireRole('admin'), adminPanel);
```

**Why it matters:** Scope security tightly—don't put expensive auth on public static health checks. Router-level keeps resource modules self-contained.

**Nuance:** Order within each level still matters. Mounting `api` at `/api` means its middleware only runs under that prefix.

---

### Middleware execution order

Registration order **is** execution order for matching middleware.

```js
app.use(captureRawBody);    // must be before json parser if needed
app.use(express.json());
app.use(morgan('combined'));
app.use('/api', apiRouter);
app.use(notFound);
app.use(errorHandler);      // 4-arg handler last among app.use
```

**Rules of thumb:** security headers early; parsers before routes; loggers early (or after request id); 404 after routes; error handler last.

**Interview tip:** If `req.body` is undefined, the parser wasn't registered or was registered after the route. If auth never runs, mount path doesn't match.

---

### Built-in `express.json()`

```js
app.use(express.json({
  limit: '100kb',
  strict: true,
  type: 'application/json',
}));
```

Parses JSON request bodies into `req.body`. Replaced the old `body-parser` package (still the same code lineage).

**Configure:** `verify` callback for raw body (webhooks/signatures), `inflate` for compressed bodies.

**Nuance:** Only parses matching Content-Type. Large `limit` increases DoS risk. Webhook routes may need raw body—mount a dedicated parser on that path.

---

### Built-in `express.urlencoded()`

```js
app.use(express.urlencoded({ extended: true, limit: '100kb', parameterLimit: 1000 }));
```

Parses HTML form posts. `parameterLimit` caps number of parameters (DoS protection).

**When:** Server-rendered Express apps, or accepting form posts alongside JSON (mount both).

**Nuance:** Don't use urlencoded for file uploads—use `multipart/form-data` + multer. Validate fields the same way you validate JSON.

---

### Built-in `express.static()`

```js
app.use('/public', express.static(path.join(__dirname, 'public'), {
  index: false,
  dotfiles: 'deny',
  maxAge: '1d',
  fallthrough: true,
}));
```

Serves files from a directory. Place **before** catch-all SPA handlers if you want files to win.

**Safety:** Never `express.static` a directory containing secrets. Set `dotfiles: 'deny'`. Prefer CDN/object storage for user uploads.

**Nuance:** Static middleware is still Express/Node bandwidth—production often lets Nginx/CDN serve static assets instead.

---

### Built-in `express.raw()` / `express.text()`

```js
app.post('/webhook', express.raw({ type: 'application/json', limit: '1mb' }), (req, res) => {
  const raw = req.body; // Buffer — verify HMAC signature
  const parsed = JSON.parse(raw.toString('utf8'));
  res.sendStatus(200);
});

app.use(express.text({ type: 'text/*', limit: '100kb' }));
```

**Why:** Stripe/GitHub webhooks need the **exact bytes** for signatures. `express.json()` would parse too early and break verification.

**Nuance:** Mount raw parser only on webhook paths so normal JSON routes still use `express.json()`.

---

### Third-party: `cors`

```js
const cors = require('cors');
app.use(cors({
  origin: ['https://app.example.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
```

Adds Access-Control-* headers and handles OPTIONS preflights.

**Why it matters:** Browser same-origin policy. Misconfigured CORS is either broken UX (`credentials` + `origin: '*'`) or an open door.

**Interview:** CORS is a **browser** enforcement mechanism—not server auth. Non-browser clients ignore it. Pair with real authentication.

---

### Third-party: `helmet`

```js
const helmet = require('helmet');
app.use(helmet()); // sensible defaults: CSP-ish, nosniff, frameguard, etc.
```

Sets security-related HTTP response headers to reduce XSS, clickjacking, MIME sniffing risks.

**Why it matters:** Cheap hardening. You still need CSP tuned for your frontend; default CSP can break inline scripts.

**Nuance:** Helmet ≠ full security program. Combine with input validation, authz, and dependency hygiene. Review headers per app (APIs vs HTML SSR differ).

---

### Third-party: `morgan` / request logging

```js
const morgan = require('morgan');
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// custom tokens
morgan.token('id', (req) => req.id);
app.use(morgan(':id :method :url :status :response-time ms'));
```

**Why:** Access logs for debugging and incident response. Prefer structured logs (pino/winston) in serious systems; morgan is a quick win.

**Nuance:** Don't log secrets (tokens, bodies with passwords). Sample high-volume health checks. Ship logs to a central store in prod.

---

### Third-party: `compression`

```js
const compression = require('compression');
app.use(compression({ threshold: 1024 }));
```

Gzip/deflate (and optionally Brotli via other setups) response bodies to save bandwidth.

**Tradeoffs:** CPU vs size. Already-compressed assets (images, zip) shouldn't be recompressed. Prefer terminating compression at CDN/Nginx for static/heavy traffic.

**Nuance:** Compression can interact with streaming and `Content-Length`. Measure before assuming it's free performance.

---

### Third-party: `cookie-parser`

```js
const cookieParser = require('cookie-parser');
app.use(cookieParser(process.env.COOKIE_SECRET)); // optional signed cookies
// req.cookies, req.signedCookies
res.cookie('sid', value, { httpOnly: true, secure: true, sameSite: 'lax' });
```

**Why:** Session IDs and CSRF tokens often live in cookies. Parsing is not validation—treat cookie values as untrusted input.

**Nuance:** Prefer `express-session` or explicit cookie libs for session stores. Signed cookies detect tampering, not confidentiality—still use HTTPS + `httpOnly`.

---

### Custom middleware patterns

```js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const requireJson = (req, res, next) => {
  if (!req.is('application/json')) {
    return res.status(415).json({ error: 'unsupported_media_type' });
  }
  next();
};

function attachServices(services) {
  return (req, res, next) => {
    req.services = services;
    next();
  };
}
```

**Patterns:** factories that close over config; `asyncHandler` wrappers; middleware that decorates `req` with locals/services.

**Keep them pure:** one concern, testable without listening on a port, documented side effects on `req`/`res`.

---

### Short-circuiting vs calling `next()`

- **Call `next()`** — continue pipeline.  
- **Send a response and don't call `next()`** — short-circuit (done).  
- **`next(err)`** — skip to error handlers.  
- **`next('route')`** — skip remaining handlers on this route (advanced).

```js
function auth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' }); // short-circuit
  next();
}
```

**Bug:** Calling `next()` after `res.json` → double-send risk. Calling neither → hung request.

**Interview:** Be explicit about control flow in every middleware branch.

---

### Async middleware & rejecting promises

Express 4 does **not** automatically catch rejected promises from `async` middleware/handlers (Express 5 improves this).

```js
// Express 4 — rejected promise can crash / hang depending on version/setup
app.get('/x', async (req, res) => {
  throw new Error('boom'); // must be caught
});

const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/x', wrap(async (req, res) => {
  res.json(await service.load());
}));
```

**Interview stance:** Know your Express major version. Until Express 5 everywhere, use wrappers or `express-async-errors` carefully.

---

### Conditionally skipping middleware

```js
function skipHealth(mw) {
  return (req, res, next) => {
    if (req.path === '/health') return next();
    return mw(req, res, next);
  };
}

app.use(skipHealth(rateLimit()));
app.use(skipHealth(heavyAuthMetrics));
```

Or mount middleware only on routers that need it. Feature flags:

```js
app.use((req, res, next) => {
  if (!config.featureX) return next();
  return featureXMiddleware(req, res, next);
});
```

**Why:** Health checks, public assets, and webhooks often need different pipelines than authenticated JSON APIs.

---

**📌 Error Handling**

### Error-first mindset in Express

Treat failure as a first-class path: detect operational errors early, convert to typed errors, forward with `next(err)`, respond once in a centralized handler.

```js
app.get('/orders/:id', wrap(async (req, res, next) => {
  const order = await orders.find(req.params.id);
  if (!order) throw Object.assign(new Error('not found'), { status: 404, code: 'NOT_FOUND' });
  res.json(order);
}));
```

**Why:** Scattered `try/catch` + `res.status` duplicates logic and leaks inconsistent shapes.

**Mindset:** Happy path in handlers; policy (status, log level, client body) in the error layer.

---

### Error-handling middleware signature `(err, req, res, next)`

Four arguments identify error middleware—Express detects arity:

```js
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  if (res.headersSent) return next(err);
  res.status(status).json({
    error: err.code || 'internal_error',
    message: status < 500 ? err.message : 'Internal Server Error',
  });
}
app.use(errorHandler);
```

**Must be registered after routes.** If you omit `next` in the signature, it won't be treated as error middleware.

**Nuance:** Still include `next` even if unused (or use it when headers already sent).

---

### Centralized error handler design

One place to: map domain errors → HTTP, log with request id, pick client-safe message, optionally report to Sentry.

```js
function errorHandler(err, req, res, next) {
  logger.error({ err, requestId: req.id }, 'request failed');
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'validation_error', details: err.flatten() });
  }
  // ...
}
```

**Benefits:** Consistent API, less duplication, easier audits of what clients see vs what you log.

**Avoid:** Catching everything and returning 500 with `err.message` in production—leaks internals.

---

### Creating operational vs programmer errors

**Operational:** expected failures—not found, validation, third-party 503, conflict. Recoverable; return 4xx/5xx appropriately.  
**Programmer:** bugs—undefined is not a function, invariant violations. Log loudly; fix the code; usually 500.

```js
class AppError extends Error {
  constructor(message, { status = 400, code = 'bad_request', expose = true } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.expose = expose;
  }
}
```

**Interview:** Borrow from Joyent/Node guidance—don't try to recover from programmer errors by papering over them; crash and restart for truly unknown corrupt state if that's your process model.

---

### `next(err)` propagation

Calling `next(err)` skips remaining non-error middleware and jumps to the next error handler.

```js
function loadUser(req, res, next) {
  User.findById(req.params.id)
    .then((u) => {
      if (!u) return next(new AppError('Not found', { status: 404 }));
      req.userDoc = u;
      next();
    })
    .catch(next);
}
```

**Sync throw** inside non-async middleware is caught by Express and becomes `next(err)`. **Async rejection** needs wrapping in Express 4.

**Don't** throw after starting to write the response—check `headersSent`.

---

### Async errors in route handlers (wrappers / catch)

```js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/:id', asyncHandler(async (req, res) => {
  const item = await items.get(req.params.id);
  if (!item) throw new AppError('Not found', { status: 404 });
  res.json(item);
}));
```

Alternatives: `express-async-errors` (patches), Express 5 native promise handling, or explicit `try/catch` per handler.

**Why it matters:** Unhandled rejections are a top Express production footgun. Pick one pattern per codebase and enforce it in review.

---

### Default Express error handler behavior

If you don't provide error middleware, Express sends a response: HTML stack in development, less verbose in production (`NODE_ENV=production`).

**Why replace it:** APIs want JSON, not HTML error pages. You also want structured logging and consistent error codes.

**Nuance:** Default handler is a safety net—still add your own. If error middleware calls `next(err)` after `headersSent`, Express delegates to the final default behavior.

---

### Mapping errors to HTTP status codes

```js
const map = [
  [ValidationError, 400],
  [UnauthorizedError, 401],
  [ForbiddenError, 403],
  [NotFoundError, 404],
  [ConflictError, 409],
];

function toStatus(err) {
  if (err.status) return err.status;
  for (const [Cls, status] of map) if (err instanceof Cls) return status;
  return 500;
}
```

**DB examples:** unique violation → 409; foreign key → 400/409; timeout → 503.

**Interview:** Mapping is product policy—document it. Never map every DB error message literally to clients.

---

### Consistent API error response shape

Pick a envelope and stick to it:

```json
{
  "error": "validation_error",
  "message": "email is required",
  "details": [{ "path": "email", "msg": "required" }],
  "requestId": "…"
}
```

**Why:** Clients parse one schema; support can correlate via `requestId`.

**Avoid:** Sometimes `{ message }`, sometimes `{ error: {…} }`, sometimes string bodies. Version the shape if you must change it.

---

### 404 not-found middleware

Place **after** all routes:

```js
app.use((req, res, next) => {
  res.status(404).json({
    error: 'not_found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});
// then error handler
```

**Why:** Without it, unmatched routes may fall through awkwardly. Explicit 404 JSON is clearer for APIs.

**Nuance:** For SPAs, a final `app.get('*', sendIndexHtml)` may come *before* API 404, or you separate static host from API host entirely.

---

### Logging errors without leaking stacks to clients

```js
logger.error({ err, requestId: req.id, userId: req.user?.id }, err.message);

const payload = {
  error: err.code || 'internal_error',
  message: err.expose ? err.message : 'Internal Server Error',
  requestId: req.id,
};
if (process.env.NODE_ENV !== 'production' && !err.expose) {
  payload.debug = err.stack;
}
res.status(status).json(payload);
```

**Rule:** Stacks and SQL in **logs/telemetry**; clients get stable codes + safe messages. Include request ids so users can quote them to support.

---

**📌 Validation & Data Shaping**

### Why validate at the edge

Validate **as soon as the request enters** your app (params/query/body) before business logic or DB.

**Benefits:** Fail fast with 400; protect invariants; reduce injection surface; keep services free of HTTP-shaped junk.

**Where:** Middleware or controller boundary—not deep inside repositories. Trust boundaries again at service-to-service calls.

**Interview:** "We'll validate in the UI" is insufficient—clients are hostile. Edge validation + DB constraints together.

---

### `express-validator` patterns

```js
const { body, param, validationResult } = require('express-validator');

const validate = (reqs) => [
  ...reqs,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'validation_error', details: errors.array() });
    }
    next();
  },
];

router.post('/users',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 12 }),
  ]),
  createUser,
);
```

**Why:** Declarative chains familiar in Express codebases. Compose per-route.

**Nuance:** Sanitization methods mutate input—know what you're normalizing. Prefer schema libs (Zod) if you want one source of types + runtime checks.

---

### Zod validation middleware

```js
const { z } = require('zod');

const validateBody = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', details: parsed.error.flatten() });
  }
  req.body = parsed.data; // stripped/coerced
  next();
};

const CreateUser = z.object({
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user'),
});
router.post('/users', validateBody(CreateUser), createUser);
```

**Why interviews like Zod:** One schema → types (TS) + runtime validation. Replace `req.body` with parsed data to drop unknown keys.

---

### Joi validation middleware

```js
const Joi = require('joi');

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    return res.status(400).json({ error: 'validation_error', details: error.details });
  }
  req[property] = value;
  next();
};

const schema = Joi.object({
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0),
});
```

**Stance:** Battle-tested in Node APIs. Zod vs Joi is mostly ecosystem/TS preference—defend *consistency* and `stripUnknown`.

---

### Validating params vs query vs body

Different locations, different rules:

```js
const Id = z.string().uuid();
const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const PatchBody = z.object({ name: z.string().min(1) }).partial();

router.patch(
  '/items/:id',
  validateParams(z.object({ id: Id })),
  validateQuery(ListQuery.partial()), // if needed
  validateBody(PatchBody),
  patchItem,
);
```

**Why separate:** Params identify resources; query controls reads; body carries writes. Coerce query numbers—they're strings by default.

---

### Sanitization vs validation

**Validation:** reject illegal input (400).  
**Sanitization:** transform input (trim, normalize email, strip HTML) then maybe validate.

```js
body('bio').trim().escape(); // express-validator style
// vs
z.string().trim().max(500)  // validate length after trim
```

**XSS:** Prefer encode on **output** (templates) over relying only on input escaping. For APIs returning JSON, encode when rendering HTML elsewhere.

**Nuance:** Over-sanitizing can destroy legitimate data (names with `'`). Know intent: security encode vs normalize.

---

### DTO / response shaping without a heavy ORM

Don't leak DB rows. Map to DTOs in the controller/service boundary:

```js
function toUserDto(row) {
  return {
    id: row.id,
    email: row.email,
    createdAt: row.created_at,
    // omit password_hash, internal flags
  };
}
res.json(toUserDto(user));
```

**Why:** Hides schema, prevents accidental secret leakage, lets you evolve storage.

**Tools:** Manual mappers, Zod `pick`, class-transformer—keep it light. Serializers aren't only an ORM feature.

---

### Partial updates & PATCH semantics

PATCH applies a partial update; PUT often means full replace (semantics vary by API design).

```js
const PatchUser = z.object({
  name: z.string().min(1),
  email: z.string().email(),
}).partial().refine((o) => Object.keys(o).length > 0);

// service: UPDATE only provided columns
await db('users').where({ id }).update(patch);
```

**Idempotency:** Same PATCH twice should yield same resource state if no concurrent writes. Use ETags/`If-Match` for concurrency when it matters.

**Nuance:** Distinguish `null` (clear field) vs omitted (leave unchanged)—document and validate explicitly.

---

**📌 Auth, Sessions & Security**

### Authentication strategies in Express apps

Common patterns:

1. **Cookie sessions** (`express-session`) — server-side session store; good for first-party browsers.  
2. **JWT bearer tokens** — `Authorization: Bearer …`; good for SPAs/mobile/APIs.  
3. **API keys / HMAC** — service-to-service.  
4. **OAuth2/OIDC** — delegate identity (Auth0, Cognito).

```js
// conceptual
app.post('/login', verifyCredentials, establishSessionOrIssueJwt);
app.use('/api', authenticate, apiRouter);
```

**Interview:** Authn (who) vs authz (what). Pick session vs JWT with CSRF, revocation, and storage tradeoffs—not hype.

---

### `express-session` overview

```js
const session = require('express-session');
const RedisStore = require('connect-redis').default;

app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 86_400_000 },
}));
// req.session.userId = …
```

**Why Redis/store:** Default MemoryStore leaks memory and doesn't share across processes—**not for prod**.

**Nuance:** Rotate secrets carefully; regenerate session id on login (`req.session.regenerate`) to prevent fixation.

---

### Cookie flags (`httpOnly`, `secure`, `sameSite`)

| Flag | Effect |
|---|---|
| `httpOnly` | JS cannot read cookie (mitigates XSS token theft) |
| `secure` | Only sent over HTTPS |
| `sameSite=lax/strict/none` | Cross-site send rules; `none` requires `secure` |

```js
res.cookie('sid', sid, { httpOnly: true, secure: true, sameSite: 'lax' });
```

**Why it matters:** Wrong flags → stolen sessions or broken cross-site flows. CSRF risk remains for cookie auth—pair with CSRF tokens or `SameSite` strategy.

**Interview:** `httpOnly` doesn't stop CSRF; it stops `document.cookie` exfiltration.

---

### JWT auth middleware patterns

```js
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [, token] = header.split(' ');
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_PUBLIC_KEY, { algorithms: ['RS256'] });
    next();
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
}
```

**Nuance:** Prefer asymmetric keys; short expiry + refresh rotation; store minimal claims; deny `alg=none`. Revocation needs a blocklist/version field—JWTs aren't magically logout-friendly.

**Never** put secrets in JWT payloads; they're base64, not encrypted (unless using JWE).

---

### Protecting routes with auth middleware

```js
const api = express.Router();
api.use(requireAuth); // all /api/* authenticated
api.get('/me', me);
api.get('/public-stats', publicStats); // oops — also protected

// better: mount public separately
app.use('/api/public', publicRouter);
app.use('/api', requireAuth, privateRouter);
```

**Route-level:** `router.post('/orders', requireAuth, createOrder)`.

**Pattern:** Default-deny for private routers; explicitly mark public exceptions. Tests should prove unauthenticated access fails.

---

### Role-based authorization middleware

```js
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  };
}

router.delete('/users/:id', requireAuth, requireRole('admin'), deleteUser);
```

**Beyond RBAC:** resource ownership checks (`order.userId === req.user.id`), permissions/ABAC for complex domains.

**Nuance:** 401 vs 403. Roles in JWT can go stale—re-check critical admin actions server-side if roles change often.

---

### Password hashing at the app boundary

Hash in the auth service layer with **bcrypt/argon2/scrypt**—never store plaintext or reversible encryption for passwords.

```js
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 12);
const ok = await bcrypt.compare(password, user.passwordHash);
```

**Boundary:** Controllers accept raw password over TLS once; services hash before persist; DTOs never return hashes.

**Nuance:** Tune cost factors for your hardware. Timing-safe compares (libs handle). Disable legacy MD5/SHA1-for-passwords talk in interviews—it's wrong.

---

### CSRF for cookie-session apps

Browsers automatically attach cookies on qualifying cross-site requests → **CSRF**. Mitigations: synchronizer tokens, double-submit cookies, `SameSite`, and avoiding cookie auth for pure bearer APIs.

```js
const csrf = require('csurf'); // legacy pattern; newer apps may use alternatives
app.use(csrf({ cookie: false })); // token in session
app.get('/form', (req, res) => res.render('form', { csrfToken: req.csrfToken() }));
```

**Modern stance:** SPA + JWT in memory/headers avoids classic CSRF; cookie-based SPA needs CSRF strategy. `SameSite=Lax` helps but isn't complete for all flows.

**Interview:** Know *why* CSRF exists and when your auth mode is vulnerable.

---

### CORS deeply with Express

Preflight `OPTIONS` asks permission for non-simple requests. `cors` middleware answers with ACAO, methods, headers.

```js
cors({
  origin(origin, cb) {
    if (!origin || allowlist.has(origin)) cb(null, true);
    else cb(new Error('not allowed'));
  },
  credentials: true,
  maxAge: 600,
});
```

**Gotchas:** `origin: true` reflects any Origin—dangerous with credentials. File:// and mobile apps differ. Server-to-server calls don't use CORS.

**Debug:** Check preflight vs actual request headers; caches can stick bad ACAO—use `maxAge` thoughtfully.

---

### Rate limiting middleware

```js
const rateLimit = require('express-rate-limit');
app.use('/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));
```

**Why:** Brute force, scraping, cost control. Use Redis store when running multiple processes so counts are shared.

**Nuance:** Key by user id when authenticated, IP when not—mind proxies (`trust proxy`). Return 429 with `Retry-After`. Edge/CDN limits complement app limits.

---

### Helmet headers worth knowing

| Header / feature | Purpose |
|---|---|
| `Content-Security-Policy` | Restrict script/style sources (XSS) |
| `X-Content-Type-Options: nosniff` | Reduce MIME sniffing |
| `X-Frame-Options` / `frame-ancestors` | Clickjacking |
| `Strict-Transport-Security` | Force HTTPS (after HTTPS works) |
| `Referrer-Policy` | Limit referrer leakage |
| `Cross-Origin-Opener-Policy` etc. | Isolation (advanced) |

**APIs vs HTML:** JSON APIs still benefit from nosniff/frameguard; CSP matters most when serving HTML.

**Tune:** Default CSP may break your app—start report-only in migration.

---

### XSS / injection awareness in Express handlers

**XSS:** Untrusted input echoed into HTML (`res.send(\`<p>${name}</p>\`)`) without escaping. Prefer templates with auto-escape or React SSR; for APIs, don't build HTML in handlers.

**SQL/NoSQL injection:** Parameterize queries; never string-build with `req.body`.  
**Command injection:** Never `exec(userInput)`.  
**Header injection:** Sanitize values used in headers/redirects.

```js
// dangerous
res.send('<h1>' + req.query.title + '</h1>');
```

**Interview:** Express doesn't escape for you on `res.send` strings—you must.

---

### File upload security (multer limits, MIME checks)

```js
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter(req, file, cb) {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      return cb(new Error('unsupported_file_type'));
    }
    cb(null, true);
  },
});
```

**Defense in depth:** MIME from client is spoofable—verify magic bytes server-side; rename files; store outside web root or in S3; scan if needed; never trust original filename paths.

**Nuance:** Separate upload size limits from JSON body limits.

---

### Trust proxy (`app.set('trust proxy')`)

Behind Nginx/ELB, the direct peer is the proxy. To use `X-Forwarded-*` for `req.ip`, secure cookies, and rate limits:

```js
app.set('trust proxy', 1); // trust first hop
// or 'loopback', or a subnet list
```

**Why it matters:** Without it, `req.ip` is the proxy; with it wrongly set to `true` in open environments, clients can spoof IPs via forged forwarded headers.

**Interview:** Know *how many* proxies hop to your app and trust exactly that. Affects HTTPS detection (`req.secure`) for `secure` cookies.

---

**📌 File Uploads & Static Assets**

### Serving static files safely

- Serve only a dedicated `public/` directory.  
- Disable directory indexes if not needed.  
- Deny dotfiles.  
- Don't expose uploads via the same static root without auth.  
- Prefer object storage + CDN for user content; signed URLs for private files.

```js
app.use('/assets', express.static(assetsDir, { index: false, dotfiles: 'deny' }));
```

**Path traversal:** If you `sendFile` user-driven paths, resolve and ensure `resolved.startsWith(root)`.

---

### Multer memory vs disk storage

**Memory (`memoryStorage`):** `file.buffer` in RAM—simple, good for small images you'll pipe to S3; watch memory under concurrency.  
**Disk (`diskStorage`):** writes temp files—better for larger uploads; manage cleanup; path permissions matter.

```js
multer.diskStorage({
  destination: '/tmp/uploads',
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}-${file.originalname}`),
});
```

**Interview:** Memory is not free—N concurrent 50MB uploads can OOM the process. Align storage with size limits and processing pipeline.

---

### Multi-file uploads

```js
upload.array('photos', 5);           // multiple, same field
upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'docs', maxCount: 3 },
]);
upload.any(); // generally avoid — too permissive
```

`req.files` shape differs (`array` vs `fields`). Validate counts and types per field.

**UX/API:** Document field names and limits. Reject early with clear 400s when over count/size.

---

### Size limits & denial-of-service considerations

Attackers send huge bodies, many fields, zip bombs, or slowloris-style slow sends.

**Mitigate:** `express.json({ limit })`, multer `fileSize`, `parameterLimit`, reverse-proxy `client_max_body_size`, request timeouts, concurrency limits, and rate limits.

```js
server.setTimeout(30_000);
server.headersTimeout = 35_000;
server.requestTimeout = 30_000;
```

**Interview:** App limits + proxy limits + infra WAF layers. One missing layer becomes the bottleneck exploit.

---

### Streaming uploads/downloads

Avoid buffering entire payloads when possible:

- **Download:** `createReadStream().pipe(res)` or redirect to signed S3 URL.  
- **Upload:** pipe request to object storage SDK upload stream / multipart upload; or proxy with size caps.

```js
const { Upload } = require('@aws-sdk/lib-storage');
// stream req to S3 with Upload / PassThrough patterns
```

**Why:** Memory predictability. Express + multer memory undoes streaming benefits—choose disk or direct-to-S3 (presigned POST) for large files.

---

### Storing files in S3-compatible storage (overview)

Typical flow: API authenticates → issues **presigned URL** → client uploads directly to S3 → client confirms → API stores object key metadata.

```js
// store only: bucket, key, contentType, size, ownerId
await db.files.insert({ key, userId: req.user.id });
```

**Why:** Offloads bandwidth from Express; scales; integrates with CDN.

**Nuance:** Validate content-type/size on the presign constraints; virus scan async if required; never make buckets world-writable accidentally; use least-privilege IAM.

---

**📌 Templating & Server-Rendered Apps (Overview)**

### `res.render` & view engines

```js
app.set('view engine', 'ejs'); // or pug, hbs
app.set('views', path.join(__dirname, 'views'));
app.get('/hello', (req, res) => {
  res.render('hello', { name: req.user?.name || 'world' });
});
```

Express delegates to consolidated view engines. Templates should **auto-escape** by default.

**Why still taught:** Admin panels, emails (render to string), legacy SSR apps, login pages.

**Nuance:** JSON APIs may never call `render`. Don't disable escaping casually.

---

### When SSR Express apps still make sense

SSR/templating still fits: SEO-light marketing pages colocated with APIs, internal admin tools, multi-page forms, progressive enhancement, or teams without a separate frontend deploy.

**Less ideal:** Large interactive SPAs—use a dedicated frontend (React/Next/etc.) and Express as JSON API.

**Interview:** Express SSR is valid, not obsolete; the industry default for product UIs shifted to separate frontends, but ops consoles and simple sites remain fine.

---

### Mixing HTML routes and JSON APIs

```js
app.use('/api', jsonApiRouter);          // Accept JSON, error → JSON
app.use('/admin', sessionAuth, htmlAdminRouter); // render templates
```

**Challenges:** Different error formats, CSRF for HTML forms vs bearer for API, shared auth cookies carefully.

**Pattern:** Separate routers, shared services. Or split hosts (`api.` vs `admin.`). Content negotiation (`req.accepts`) on shared routes is possible but easy to get wrong—prefer clear prefixes.

---

**📌 Testing Express**

### Unit-testing handlers in isolation

Call the controller with mocked `req`/`res`/`next`:

```js
const res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};
await createUser(req, res, next);
expect(res.status).toHaveBeenCalledWith(201);
```

**Why:** Fast feedback for branching logic. Pair with service unit tests.

**Nuance:** Brittle if you over-mock Express internals—prefer testing behavior (status + body) over spy counts alone. Integration tests catch wiring bugs unit tests miss.

---

### Integration tests with Supertest

```js
const request = require('supertest');
const { createApp } = require('../src/app');

const app = createApp({ db: testDb });

await request(app)
  .post('/users')
  .send({ email: 'a@b.com', password: 'hunter2hunter2' })
  .expect(201)
  .expect(({ body }) => {
    expect(body.email).toBe('a@b.com');
  });
```

**Why:** Exercises middleware order, parsers, and routing for real. No need to listen on a port—Supertest uses the app function.

---

### Testing middleware

```js
function run(mw, { req = {}, res = {} } = {}) {
  return new Promise((resolve, reject) => {
    const next = (err) => (err ? reject(err) : resolve({ req, res }));
    mw(req, res, next);
  });
}

await run(requireAuth, { req: { headers: {} } }); // expect 401 path
```

Or mount middleware on a tiny `express()` app and Supertest it.

**Cover:** success `next()`, short-circuit status, `next(err)` cases, and conditional skip logic.

---

### Testing auth-protected routes

- Hit without credentials → 401.  
- Hit with valid session/JWT → 200.  
- Hit with wrong role → 403.  
- Expired/invalid token → 401.

```js
const token = signTestJwt({ sub: 'u1', role: 'user' });
await request(app).get('/admin').set('Authorization', `Bearer ${token}`).expect(403);
```

**Helpers:** test user factory, cookie jar (`supertest` agent) for session apps. Never skip auth tests because "middleware is shared."

---

### Mocking services behind controllers

Inject services into `createApp({ userService })` or onto `req.services`.

```js
const userService = {
  create: jest.fn().mockResolvedValue({ id: '1', email: 'a@b.com' }),
};
const app = createApp({ userService });
```

**Why:** Controllers stay thin; tests avoid real DB for unit/integration-lite cases. Use a real test DB for repository tests separately.

**Anti-pattern:** Mocking `request` library internals deep in the stack when you could inject an interface.

---

### Test app factory pattern (`createApp()`)

```js
function createApp(deps = {}) {
  const app = express();
  app.use(express.json());
  app.use('/users', usersRouter(deps));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
// server.js: createApp(prodDeps).listen…
```

**Why:** Tests import `createApp` with test doubles; production wires real deps once. No global singleton app mutated across tests.

**Interview:** This pattern signals production-minded Express structure.

---

### Avoiding listen() in tests

`request(app)` works with the Express function—**don't** `listen` in unit/integration tests (port conflicts, slower, cleanup pain).

```js
// server.js only
if (require.main === module) {
  const server = app.listen(config.port);
  setupGracefulShutdown(server);
}
```

**E2E** against a running server is a separate layer. Keep the default test path listen-free.

---

**📌 Performance & Reliability**

### Keep middleware lean

Each middleware adds latency and complexity. Avoid heavy CPU, sync FS, or remote calls in the hot path unless cached/needed.

**Do:** request ids, auth verification, light parsing.  
**Don't:** full report generation, unbounded DB scans, sync bcrypt with absurd cost on every request without need.

**Interview:** Performance problems are often "death by a thousand middlewares" plus blocking work—profile before adding more layers.

---

### Body parser size limits

```js
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true }));
```

Tune per route if needed (webhook 1mb, profile JSON 50kb). Align with Nginx `client_max_body_size`.

**Why:** Default unlimited parsing is a memory DoS. Return 413 when over limit—know how your stack surfaces it.

---

### Compression tradeoffs

Pros: less bandwidth, faster downloads on slow links.  
Cons: CPU, potential BREACH-like concerns with secrets in compressed HTTPS bodies (niche but known), skipping already-compressed content.

**Practice:** Compress JSON/HTML above a threshold; let CDN handle static; exclude `image/*`, `zip`, `br`/`gzip` pre-encoded assets.

**Measure:** CPU-bound Node processes may prefer proxy-side compression.

---

### Timeouts & slow clients

Slow clients hold sockets. Set server timeouts and consider middleware that aborts long handlers.

```js
const server = http.createServer(app);
server.requestTimeout = 30_000;
server.headersTimeout = 35_000;
server.keepAliveTimeout = 5_000;
```

Upstream calls need their own timeouts (`fetch` + `AbortSignal`). Return 504 when dependency times out.

**Nuance:** Health checks should be fast; don't share the same generous timeout everywhere.

---

### Graceful shutdown with Express + HTTP server

```js
const server = app.listen(port);

async function shutdown(signal) {
  console.log('shutting down', signal);
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

**Why:** Kubernetes sends SIGTERM; finish in-flight requests, stop accepting new ones (`server.close`), then close pools.

**Nuance:** Long-lived SSE/WebSockets need explicit cleanup. Readiness probe should fail during drain.

---

### Clustering Express behind a process manager

One Node process uses one OS thread for JS. Scale out with:

- **Node `cluster`** module (shared port)  
- **PM2 cluster mode**  
- **Multiple containers** behind a load balancer (preferred in K8s)

```js
// prefer horizontal pods/processes over clever in-process cluster for cloud-native
```

**Sticky sessions:** needed for in-memory sessions/WebSockets unless you centralize store/pubsub.

**Interview:** Clustering ≠ parallelism inside one request; it's multi-core acceptance of concurrent requests.

---

### Avoiding blocking work in handlers

```js
// bad in request path
const data = fs.readFileSync(huge);
crypto.pbkdf2Sync(password, salt, 1e6, 64, 'sha512');

// better
await fs.promises.readFile…
await bcrypt.hash… // still CPU — consider dedicated auth workers if extreme
```

Offload CPU to worker threads/queues; use streaming; cache hot computations.

**Symptom:** Event-loop lag; all routes slow together. Mention Node's single-threaded JS model in interviews.

---

### Caching responses (CDN vs Redis vs in-memory)

| Layer | Good for |
|---|---|
| CDN / Cache-Control | Public GETs, static, edge |
| Redis | Shared computed results, sessions |
| In-process Memory | Tiny hot data single instance |

```js
res.set('Cache-Control', 'public, max-age=60');
// or cache aside
const cached = await redis.get(key);
```

**Nuance:** Auth'ed responses often `Cache-Control: private, no-store`. Invalidate correctly on writes. In-memory caches break consistency across cluster nodes.

---

**📌 Production Patterns**

### Splitting config by environment

```text
config/
  index.js      # selects env
  default.js
  production.js
  test.js
```

Or single schema validated with Zod from `process.env`.

**Rules:** Secrets from env/secret manager; feature flags explicit; test config uses disposable DB. Never rely on developer laptops' implicit defaults in prod.

**Express:** `app.get('env')` reflects `NODE_ENV`—don't overload it for custom staging names; use `APP_ENV` if needed.

---

### Structured logging in Express apps

```js
const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const pinoHttp = require('pino-http')({ logger });

app.use((req, res, next) => {
  req.log = logger.child({ requestId: req.id });
  next();
});
app.use(pinoHttp);
```

**Log JSON lines:** level, msg, requestId, userId, route, duration. Avoid `console.log` spaghetti in prod.

**Redact:** authorization headers, cookies, passwords. Correlate with metrics/traces via shared ids.

---

### Health/readiness endpoints

```js
app.get('/healthz', (req, res) => res.sendStatus(200)); // liveness
app.get('/readyz', async (req, res) => {
  try {
    await db.query('select 1');
    res.sendStatus(200);
  } catch {
    res.sendStatus(503);
  }
});
```

**Liveness:** process up. **Readiness:** can serve traffic (DB/redis up). Don't require deep dependency checks on liveness or kube may kill restart loops incorrectly.

**Keep them lightweight** and outside heavy auth/rate limits (carefully).

---

### Reverse proxy (Nginx) with Express

Typical: Nginx terminates TLS, serves static, proxies `/api` to Node `127.0.0.1:3000`.

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

**Why:** TLS, buffering, compression, rate limiting, static offload, multiple upstreams.

**Express side:** `trust proxy` matching hop count; listen on internal interface only.

---

### HTTPS termination & forwarded headers

TLS often ends at the load balancer. Express sees HTTP internally. For secure cookies and redirects to `https://`:

```js
app.set('trust proxy', 1);
// req.secure derived from X-Forwarded-Proto
```

**Security:** Only trust forwarded headers from your proxy. Strip client-supplied `X-Forwarded-*` at the proxy edge so users can't spoof.

**Interview:** End-to-end HTTPS story = edge certs + internal network trust model.

---

### Process managers (PM2) with Express

PM2 runs Node processes with restart policies, cluster mode, logs.

```bash
pm2 start src/server.js -i max --name api
pm2 reload api  # zero-downtime reload (cluster)
```

**Cloud-native alternative:** systemd, Docker restart policies, Kubernetes deployments—PM2 less common in K8s.

**Nuance:** Still need graceful shutdown hooks. PM2 doesn't replace metrics/APM. Env files via `ecosystem.config.js` carefully (secrets).

---

### Dockerizing an Express service

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
```

**Practices:** non-root user; `npm ci`; small image; pass env at runtime; healthcheck hits `/healthz`; don't bake secrets; multi-stage builds for TS compile.

**Nuance:** Forward signals for graceful shutdown (`NODE` receives SIGTERM from Docker/K8s).

---

### Observability: request IDs, metrics, tracing hooks

```js
app.use((req, res, next) => {
  req.id = req.get('x-request-id') || crypto.randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});
// metrics: request duration histogram by route template
// tracing: OpenTelemetry middleware → spans around handlers + HTTP clients
```

**Why:** Debug distributed failures; SLO dashboards; find slow routes.

**Interview:** Prefer route **templates** (`/users/:id`) over raw paths as metric labels to avoid cardinality explosions.

---

### API versioning in production codebases

Strategies:

- **URL:** `/v1/users`, `/v2/users`  
- **Header:** `Accept: application/vnd.myapp.v2+json`  
- **Mount separate routers:** `app.use('/v1', v1); app.use('/v2', v2)`

**Practice:** Prefer additive changes; deprecate with timelines; run versions in parallel during migration.

**Nuance:** Versioning isn't free—shared domain logic with version-specific adapters beats copy-paste entire apps.

---

### Monolith Express app vs modular services

**Modular monolith:** one deployable Express app, clear domain modules (routers/services), single DB maybe.  
**Services:** multiple Express (or other) apps, network boundaries, independent scale.

**Start monolith** when team/domain fit; extract when scale, ownership, or failure isolation demand it.

**Interview:** Express doesn't force microservices. Many "microservices" are distributed monoliths without module discipline—argue boundaries by domain events and data ownership, not folder count.

---

**📌 Advanced / Interview Differentiating**

### `app.param` for param preprocessing

```js
app.param('userId', async (req, res, next, id) => {
  try {
    const user = await users.findById(id);
    if (!user) return next(new AppError('Not found', { status: 404 }));
    req.userDoc = user;
    next();
  } catch (e) { next(e); }
});

app.get('/users/:userId', (req, res) => res.json(req.userDoc));
```

**Why:** DRY loading/validation for a param name across routes.

**Caution:** Implicit magic—newcomers miss it. Overuse couples routing to DB heavily. Prefer explicit middleware when clarity > DRYness.

---

### Sub-apps with `express()` mounting

An Express app is mountable middleware:

```js
const admin = express();
admin.use(requireAdmin);
admin.get('/stats', stats);

const main = express();
main.use('/admin', admin);
```

**Use cases:** isolate admin pipeline, white-label tenants, gradual extraction of a module toward a service.

**Nuance:** Settings don't always inherit the way you expect—configure each app. Paths are relative to mount point.

---

### Generator-style vs async/await middleware history

Older Express experiments and Koa popularized generators (`function*`) with `co`. Modern Express/Node uses **async/await** and promises.

```js
// historical Koa/co style — not Express 4 idiomatic today
// function* (next) { yield next; }

// modern
async (req, res, next) => { await work(); res.send('ok'); }
```

**Interview context:** Shows ecosystem evolution. Express 4 stayed callback/`next`-centric; promise support solidifies more in Express 5. Don't write generator middleware in new Express apps.

---

### Express 4 vs Express 5 differences (overview)

High-level themes (verify against current docs when upgrading):

- **Promise rejection** handling in middleware/handlers improves in v5.  
- **Path route matching** / wildcard syntax cleanup (breaking for some patterns).  
- Removal of legacy APIs and stricter behaviors.  
- Body parsers remain built-in; ecosystem middleware compatibility matters.

**Interview stance:** Most production apps still on Express 4. Know *why* upgrades hurt (route patterns, assumptions about async errors) and test thoroughly. Don't claim trivia you haven't verified for the exact minor version.

---

### Building a minimal framework-like layer on Express

Teams often add a thin layer: `createApp`, `asyncHandler`, `validate(schema)`, `AppError`, `requireAuth`, standard error envelope, typed routers.

```js
function createController(handlers) { /* wrap all with asyncHandler */ }
```

**Why:** Consistency without Nest's weight. Document the conventions—undocumented "internal frameworks" confuse hires.

**Risk:** Rebuilding Nest poorly. Keep the layer thin; adopt a real framework when conventions + DI + structure become the product need.

---

### When to leave Express for Fastify/Nest

**Consider Fastify** when throughput/validation/serialization performance matters and plugins fit.  
**Consider Nest** when large teams need enforced modules, DI, guards, OpenAPI generation, and interchangeable HTTP adapters.  
**Stay on Express** when the app is stable, team fluency is Express, and bottlenecks aren't the framework.

**Migration cost:** middleware rewrite, ecosystem packages, mental models. Prototype hot paths before rewriting the monolith for benchmarks alone.

---

### Idempotency keys for mutating routes

Clients send `Idempotency-Key` on POST payments/creates. Server stores key → response for a TTL; replays return the same result instead of double-charging.

```js
app.post('/charges', requireAuth, async (req, res) => {
  const key = req.get('Idempotency-Key');
  if (!key) return res.status(400).json({ error: 'missing_idempotency_key' });
  const cached = await idem.get(req.user.id, key);
  if (cached) return res.status(cached.status).json(cached.body);
  const result = await charges.create(req.body);
  await idem.put(req.user.id, key, { status: 201, body: result });
  res.status(201).json(result);
});
```

**Nuance:** Scope keys per user; define conflict behavior when same key different body; use durable store (Redis/DB).

---

### Designing clean controller → service boundaries in Express

**Controllers:** parse/validate HTTP, call services, map DTOs, set status codes.  
**Services:** business rules, transactions, external APIs—**no** `req`/`res`.  
**Repos:** persistence only.

```js
async function createOrder(req, res) {
  const input = req.body; // already validated
  const order = await orderService.create(req.user.id, input);
  res.status(201).json(toOrderDto(order));
}
```

**Why interviews care:** Testability, reuse (CLI/jobs call same services), and avoiding "Fat Controller" Express apps.

**Smell:** `req` passed into the service layer; SQL in routers; status codes thrown from deep persistence without translation.

---
