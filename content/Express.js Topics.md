# Express.js

Checklist for deep-dive Express.js interview prep (routing, middleware, errors, security, testing, production patterns). Check off when you can explain aloud with tradeoffs and a small code mental model.

*Related:* `Node.js Topics.md` / Guide for the runtime & event loop; this doc focuses on **Express HTTP apps and APIs**.

---

**📌 Express Foundations**

- [] Express overview & why it exists
- [] Express vs Node `http` module
- [] Express vs Fastify vs Koa vs NestJS
- [] Installing Express & hello-world app
- [] `express()` application instance
- [] Request/response cycle in Express
- [] `app.listen` vs wrapping with Node `http.Server`
- [] Environment-based config for Express apps
- [] Project structure conventions (routes, controllers, middleware, services)

---

**📌 Routing**

- [] Basic routing (`app.get/post/put/patch/delete/all`)
- [] Route paths & string patterns
- [] Route parameters (`req.params`)
- [] Query strings (`req.query`)
- [] `Router` vs mounting on `app`
- [] `router.route()` chaining
- [] Route order & specificity pitfalls
- [] Nested routers & prefixes
- [] Named route organization by resource
- [] 405 Method Not Allowed patterns
- [] Trailing slashes & path normalization
- [] Host-based / subdomain routing (overview)

---

**📌 Request & Response**

- [] `req` object essentials (`params`, `query`, `body`, `headers`, `cookies`)
- [] `res` object essentials (`status`, `json`, `send`, `sendStatus`)
- [] Reading JSON bodies
- [] URL-encoded form bodies
- [] Headers: get/set/append
- [] Status codes idioms for REST
- [] Redirects (`res.redirect`)
- [] Sending files (`res.sendFile`, `res.download`)
- [] Streaming responses from Express
- [] Content-Type & charset handling
- [] Ending a response correctly (double-send bugs)

---

**📌 Middleware**

- [] What middleware is (`req, res, next`)
- [] Application-level vs router-level vs route-level middleware
- [] Middleware execution order
- [] Built-in `express.json()`
- [] Built-in `express.urlencoded()`
- [] Built-in `express.static()`
- [] Built-in `express.raw()` / `express.text()`
- [] Third-party: `cors`
- [] Third-party: `helmet`
- [] Third-party: `morgan` / request logging
- [] Third-party: `compression`
- [] Third-party: `cookie-parser`
- [] Custom middleware patterns
- [] Short-circuiting vs calling `next()`
- [] Async middleware & rejecting promises
- [] Conditionally skipping middleware

---

**📌 Error Handling**

- [] Error-first mindset in Express
- [] Error-handling middleware signature `(err, req, res, next)`
- [] Centralized error handler design
- [] Creating operational vs programmer errors
- [] `next(err)` propagation
- [] Async errors in route handlers (wrappers / catch)
- [] Default Express error handler behavior
- [] Mapping errors to HTTP status codes
- [] Consistent API error response shape
- [] 404 not-found middleware
- [] Logging errors without leaking stacks to clients

---

**📌 Validation & Data Shaping**

- [] Why validate at the edge
- [] `express-validator` patterns
- [] Zod validation middleware
- [] Joi validation middleware
- [] Validating params vs query vs body
- [] Sanitization vs validation
- [] DTO / response shaping without a heavy ORM
- [] Partial updates & PATCH semantics

---

**📌 Auth, Sessions & Security**

- [] Authentication strategies in Express apps
- [] `express-session` overview
- [] Cookie flags (`httpOnly`, `secure`, `sameSite`)
- [] JWT auth middleware patterns
- [] Protecting routes with auth middleware
- [] Role-based authorization middleware
- [] Password hashing at the app boundary
- [] CSRF for cookie-session apps
- [] CORS deeply with Express
- [] Rate limiting middleware
- [] Helmet headers worth knowing
- [] XSS / injection awareness in Express handlers
- [] File upload security (multer limits, MIME checks)
- [] Trust proxy (`app.set('trust proxy')`)

---

**📌 File Uploads & Static Assets**

- [] Serving static files safely
- [] Multer memory vs disk storage
- [] Multi-file uploads
- [] Size limits & denial-of-service considerations
- [] Streaming uploads/downloads
- [] Storing files in S3-compatible storage (overview)

---

**📌 Templating & Server-Rendered Apps (Overview)**

- [] `res.render` & view engines
- [] When SSR Express apps still make sense
- [] Mixing HTML routes and JSON APIs

---

**📌 Testing Express**

- [] Unit-testing handlers in isolation
- [] Integration tests with Supertest
- [] Testing middleware
- [] Testing auth-protected routes
- [] Mocking services behind controllers
- [] Test app factory pattern (`createApp()`)
- [] Avoiding listen() in tests

---

**📌 Performance & Reliability**

- [] Keep middleware lean
- [] Body parser size limits
- [] Compression tradeoffs
- [] Timeouts & slow clients
- [] Graceful shutdown with Express + HTTP server
- [] Clustering Express behind a process manager
- [] Avoiding blocking work in handlers
- [] Caching responses (CDN vs Redis vs in-memory)

---

**📌 Production Patterns**

- [] Splitting config by environment
- [] Structured logging in Express apps
- [] Health/readiness endpoints
- [] Reverse proxy (Nginx) with Express
- [] HTTPS termination & forwarded headers
- [] Process managers (PM2) with Express
- [] Dockerizing an Express service
- [] Observability: request IDs, metrics, tracing hooks
- [] API versioning in production codebases
- [] Monolith Express app vs modular services

---

**📌 Advanced / Interview Differentiating**

- [] `app.param` for param preprocessing
- [] Sub-apps with `express()` mounting
- [] Generator-style vs async/await middleware history
- [] Express 4 vs Express 5 differences (overview)
- [] Building a minimal framework-like layer on Express
- [] When to leave Express for Fastify/Nest
- [] Idempotency keys for mutating routes
- [] Designing clean controller → service boundaries in Express
