# FastAPI Topics

Checklist for deep-dive FastAPI prep (async Python APIs, Pydantic, dependency injection, security, testing, production). Check off when you can explain aloud with tradeoffs and a small code mental model.

*Related:* `Python & Flask Topics.md` / Guide for core Python; this doc focuses on **FastAPI + ASGI ecosystem**.

---

**✅ FastAPI Foundations**

- [] FastAPI overview & why it exists
- [] FastAPI vs Flask vs Django REST Framework vs Express
- [] ASGI vs WSGI
  - [] Sync vs async request handling
  - [] Concurrency model (event loop)
  - [] When async helps vs when it doesn’t
- [] Starlette under the hood
- [] Uvicorn / Hypercorn / Daphne (ASGI servers)
- [] Installation & project bootstrap
- [] First app: path operation basics
- [] `FastAPI()` app instance options
- [] OpenAPI / Swagger UI / ReDoc auto-docs
- [] Interactive docs authentication & disabling in prod
- [] Type hints as the core design principle
- [] Request/response cycle overview

---

**✅ Path Operations & Routing**

- [] Path operation decorators (`@app.get/post/put/patch/delete/options/head`)
- [] Path parameters
  - [] Types & conversion
  - [] `Path()` constraints (ge, le, min_length, regex/pattern)
- [] Query parameters
  - [] Required vs optional vs defaults
  - [] `Query()` validation & metadata
  - [] List / multiple query values
- [] Request body
  - [] Single Pydantic model body
  - [] Embed / multiple bodies
  - [] Singular values as body (`Body()`)
- [] Header & Cookie parameters (`Header()`, `Cookie()`)
- [] Form data (`Form()`)
- [] File uploads (`File()`, `UploadFile`)
  - [] Spooled vs in-memory
  - [] Multiple files
- [] Status codes (`status_code=`, `status`)
- [] Response model (`response_model`)
  - [] `response_model_exclude_unset`
  - [] `response_model_exclude` / `include`
  - [] Return type annotations vs `response_model`
- [] Tags, summary, description, deprecated
- [] Operation IDs & OpenAPI customization
- [] `HTTPException` vs custom responses
- [] `Response` / `JSONResponse` / `ORJSONResponse` / `UJSONResponse`
- [] `RedirectResponse` / `StreamingResponse` / `FileResponse` / `HTMLResponse`
- [] Path operation configuration (`response_class`, `dependencies`, etc.)

---

**✅ APIRouter & Application Structure**

- [] `APIRouter` basics
- [] `include_router` & prefixes
- [] Router-level tags & dependencies
- [] Modular project layouts
  - [] Flat vs domain/package structure
  - [] `routers/`, `schemas/`, `models/`, `services/`, `api/deps.py`
- [] Bigger apps: multiple routers & versioning folders
- [] Lifespan vs deprecated startup/shutdown events
  - [] `@asynccontextmanager` lifespan
  - [] Resource setup/teardown (DB pools, clients)
- [] Application factory pattern with FastAPI
- [] Mounting sub-applications (`mount`)
- [] Sharing state via `app.state`

---

**✅ Pydantic (v2) for FastAPI**

- [] Pydantic role in FastAPI (validation + serialization + docs)
- [] Pydantic v1 vs v2 mental model (migration awareness)
- [] `BaseModel` basics
- [] Field types & `Field()`
  - [] Constraints (gt, ge, max_length, pattern)
  - [] Defaults & `default_factory`
  - [] Aliases (`alias`, `validation_alias`, `serialization_alias`)
- [] Optional / `None` / required fields
- [] Nested models
- [] Lists, dicts, unions, discriminated unions
- [] Enums in schemas
- [] `model_config` (`ConfigDict`)
  - [] `from_attributes` (ORM mode)
  - [] `extra` (forbid/ignore)
  - [] `str_strip_whitespace`, frozen, etc.
- [] Validators
  - [] `field_validator`
  - [] `model_validator`
  - [] Before vs after validation
- [] Computed fields (`computed_field`)
- [] Serialization
  - [] `model_dump` / `model_dump_json`
  - [] `model_validate` / `model_validate_json`
  - [] Custom serializers (`field_serializer`)
- [] Settings management (`pydantic-settings`)
  - [] `BaseSettings`
  - [] `.env` loading
  - [] Nested settings
  - [] Secrets & environment prefixes
- [] Schema reuse patterns
  - [] Create / Update / Read DTO split
  - [] Shared base schemas
- [] JSON Schema generation & OpenAPI impact
- [] Performance notes (Pydantic v2 Rust core)

---

**✅ Dependency Injection System**

- [] Why DI in FastAPI (testability, reuse, security)
- [] `Depends()` basics
- [] Dependency callables (functions & classes)
- [] Sub-dependencies / dependency trees
- [] `yield` dependencies (setup/teardown)
  - [] DB session pattern
  - [] Exception behavior with yield
- [] Router & app-level dependencies
- [] Path operation-level dependencies
- [] `Security()` vs `Depends()` for auth schemes
- [] Caching dependencies (`use_cache`)
- [] Overriding dependencies in tests (`app.dependency_overrides`)
- [] Common dependency catalog
  - [] Current user
  - [] DB session
  - [] Settings / config
  - [] Pagination params
  - [] Feature flags / tenants
- [] Annotated dependencies pattern (`Annotated[..., Depends()]`)
- [] Anti-patterns (over-DI, hidden I/O in surprising places)

---

**✅ Request Validation & Error Handling**

- [] Automatic validation errors (422 Unprocessable Entity)
- [] Validation error body shape
- [] Custom exception handlers
  - [] `@app.exception_handler`
  - [] Handling `RequestValidationError`
  - [] Handling `HTTPException`
  - [] Domain exceptions → HTTP mapping
- [] Consistent error response schema (Problem Details / RFC 9457 style)
- [] Middleware vs exception handlers vs dependencies for errors
- [] Logging exceptions without leaking internals
- [] Background-safe error patterns

---

**✅ Middleware & Request Lifecycle**

- [] What middleware is in Starlette/FastAPI
- [] Adding middleware (`add_middleware`)
- [] Built-ins & common middleware
  - [] `CORSMiddleware`
  - [] `GZipMiddleware`
  - [] `TrustedHostMiddleware`
  - [] `HTTPSRedirectMiddleware`
  - [] Session middleware (when used)
- [] Custom middleware (pure ASGI vs `BaseHTTPMiddleware`)
- [] Order of middleware (onion model)
- [] Correlation / request ID middleware
- [] Timing / metrics middleware
- [] Middleware pitfalls with streaming & `BaseHTTPMiddleware`
- [] Hooks comparison: middleware vs dependencies vs lifespan

---

**✅ Async Programming for FastAPI**

- [] `async def` vs `def` path operations
  - [] When FastAPI runs sync in a threadpool
  - [] Blocking calls inside `async def` (anti-pattern)
- [] awaitable I/O (HTTPX AsyncClient, async DB drivers)
- [] Running CPU-bound work (process pool / offload)
- [] Concurrent in-request work (`asyncio.gather`)
- [] Timeouts & cancellation awareness
- [] Shared resources & thread safety
- [] Async generators & streaming
- [] Common async bugs (forgotten await, blocking ORM)

---

**✅ Databases & Persistence**

- [] Choosing ORM / query layer (SQLAlchemy 2.0, Tortoise, Prisma, raw SQL)
- [] SQLAlchemy 2.0 + FastAPI patterns
  - [] Engine & session factory
  - [] Sync vs async session (`AsyncSession`)
  - [] Session-per-request dependency
  - [] `select()` style queries
  - [] Relationships & lazy loading pitfalls with async
- [] Alembic migrations
- [] Repository / service layer split
- [] Transactions & commit/rollback patterns
- [] Connection pooling with uvicorn workers
- [] Using MongoDB (Motor / Beanie) overview
- [] Redis for cache / sessions / rate limits
- [] Multi-DB & read replicas (conceptual)
- [] N+1 queries & performance
- [] Soft deletes & auditing patterns

---

**✅ Authentication & Authorization**

- [] Authn vs Authz
- [] Password hashing (passlib / bcrypt / argon2)
- [] OAuth2 password flow with FastAPI
  - [] `OAuth2PasswordBearer`
  - [] `OAuth2PasswordRequestForm`
  - [] Token URL & scopes
- [] JWT access tokens
  - [] Create / decode / verify
  - [] Claims (`sub`, `exp`, `scopes`)
  - [] Refresh token patterns
- [] API keys (`APIKeyHeader` / query / cookie)
- [] HTTP Basic / Digest (when relevant)
- [] `HTTPBearer` / custom security schemes
- [] Cookie-based auth & CSRF considerations
- [] Getting current user dependency
- [] Role-based access control (RBAC)
- [] Permission / scope checks
- [] Optional auth (anonymous vs logged-in)
- [] Service-to-service auth (client credentials conceptual)
- [] OAuth2 / OIDC social login overview (Authlib)
- [] Securing docs endpoints
- [] Common vulnerabilities (token storage, alg=none, weak secrets)

---

**✅ Security Best Practices**

- [] CORS configuration deep dive
- [] Trusted hosts
- [] HTTPS & reverse proxy headers (`ProxyHeadersMiddleware` / uvicorn flags)
- [] Input validation as security boundary
- [] SQL injection prevention (ORM/parameterized)
- [] XSS & response headers (CSP awareness)
- [] Rate limiting strategies
- [] File upload security (size, type, storage path)
- [] Secrets management (env, vault)
- [] Dependency vulnerability scanning
- [] Least privilege DB credentials
- [] Security headers checklist

---

**✅ Background Tasks & Async Work**

- [] `BackgroundTasks` (Starlette)
  - [] Use cases & limitations
  - [] Not surviving process death
- [] When to use a real queue (Celery, RQ, Dramatiq, Arq, SAQ)
- [] Enqueue-from-API patterns
- [] Idempotent background jobs
- [] Scheduled jobs vs request-triggered
- [] Returning 202 Accepted for async operations
- [] Job status endpoints

---

**✅ WebSockets & Realtime**

- [] WebSocket routes in FastAPI
- [] Accept / receive / send loop
- [] JSON vs text messages
- [] Connection managers (broadcast patterns)
- [] Auth for WebSockets
- [] Scaling WebSockets (sticky sessions, Redis pub/sub)
- [] SSE (Server-Sent Events) alternatives
- [] When to prefer WebSockets vs polling vs SSE

---

**✅ Streaming, Files & Media**

- [] `StreamingResponse` for large payloads
- [] Generator / async generator streaming
- [] Chunked downloads
- [] `FileResponse` & static file mounting
- [] Upload → S3 / object storage patterns
- [] Content-Type & Content-Disposition handling
- [] Memory backpressure concerns

---

**✅ Caching & Performance**

- [] Response caching strategies
- [] HTTP caching headers (`Cache-Control`, ETag)
- [] Redis caching layer
- [] `lru_cache` for settings/resources
- [] ORJSONResponse performance
- [] Avoiding unnecessary Pydantic work
- [] DB query optimization
- [] Connection pooling & keep-alive
- [] Profiling FastAPI apps
- [] Load testing (Locust, k6)
- [] uvicorn workers vs async concurrency
  - [] gunicorn + uvicorn workers
  - [] Worker count heuristics
- [] uvloop / httptools overview

---

**✅ Pagination, Filtering & API Design**

- [] Pagination styles (offset, cursor/keyset)
- [] Sorting & filtering query conventions
- [] Search endpoints design
- [] Idempotency keys for POST
- [] Bulk endpoints tradeoffs
- [] HATEOAS (optional awareness)
- [] Consistent envelope vs raw resources
- [] API versioning strategies
  - [] URL path `/v1`
  - [] Header versioning
  - [] Router-per-version
- [] Breaking vs non-breaking changes
- [] Designing DELETE / soft-delete semantics
- [] Partial updates (`PATCH`) with optional fields

---

**✅ OpenAPI Customization & Documentation**

- [] Automatic schema generation
- [] `openapi_tags` metadata
- [] `examples` & `openapi_examples` (Pydantic/FastAPI)
- [] `json_schema_extra`
- [] Custom OpenAPI schema function
- [] External docs links
- [] Separate public vs private schemas
- [] Exporting `openapi.json`
- [] Client SDK generation awareness
- [] Documenting auth schemes clearly

---

**✅ Testing FastAPI**

- [] `TestClient` (Starlette / sync)
- [] `httpx.AsyncClient` + `ASGITransport` (async tests)
- [] pytest fixtures for app / client
- [] Overriding dependencies
- [] Testing auth (token fixtures)
- [] Database test strategies
  - [] Transaction rollback per test
  - [] Testcontainers / ephemeral DB
  - [] SQLite limits for Postgres features
- [] Testing file uploads
- [] Testing WebSockets
- [] Testing exception handlers & status codes
- [] Contract tests against OpenAPI (schemathesis overview)
- [] Coverage goals for APIs

---

**✅ Configuration, Logging & Observability**

- [] 12-factor config with pydantic-settings
- [] Environments (dev/stage/prod)
- [] Structured logging
- [] Correlation / request IDs
- [] Metrics (Prometheus / OpenTelemetry)
- [] Tracing distributed requests
- [] Health checks
  - [] `/health` liveness
  - [] `/ready` readiness (DB/ping)
- [] Graceful shutdown with lifespan
- [] Error tracking (Sentry)
- [] Audit logging for sensitive actions

---

**✅ Deployment & Production**

- [] Running with uvicorn
- [] gunicorn + uvicorn worker class
- [] Dockerizing FastAPI
  - [] Multi-stage builds
  - [] Non-root user
  - [] Healthcheck
- [] Docker Compose with DB/Redis
- [] Kubernetes deployment basics
  - [] Probes (liveness/readiness)
  - [] Resource requests/limits
  - [] Horizontal scaling
- [] Reverse proxy (Nginx / Traefik / ALB)
- [] TLS termination
- [] Environment secrets in prod
- [] Multiple workers & shared state pitfalls
- [] Serverless deploy (AWS Lambda + Mangum overview)
- [] Cold starts & async on Lambda caveats
- [] CI/CD pipeline stages for FastAPI apps

---

**✅ CORS, Cookies, Sessions & Browsers**

- [] CORS preflight deep dive
- [] Credentials & `allow_origins` (no `*` with cookies)
- [] Cookie flags (`HttpOnly`, `Secure`, `SameSite`)
- [] CSRF for cookie-based session APIs
- [] SPA + FastAPI architecture patterns
- [] CSRF-exempt JWT bearer pattern (and risks)

---

**✅ Advanced FastAPI Patterns**

- [] Class-based views / `cbv` style (optional libraries)
- [] Generic CRUD routers (awareness of fastapi-crudrouter / custom)
- [] Plugin-style routers
- [] Multi-tenant APIs (tenant dependency)
- [] Feature flags
- [] Request context (contextvars)
- [] Internationalization (i18n) overview
- [] GraphQL with FastAPI (Strawberry) awareness
- [] Mixing sync legacy libraries safely
- [] Gradual migration from Flask to FastAPI
- [] Hexagonal / clean architecture with FastAPI
- [] Domain exceptions & application services

---

**✅ Ecosystem & Related Libraries**

- [] HTTPX (sync/async client)
- [] SQLAlchemy 2 / sqlmodel
- [] Alembic
- [] pydantic-settings
- [] python-jose / PyJWT / jwcrypto
- [] passlib / pwdlib / argon2-cffi
- [] Celery / Arq / Dramatiq / Taskiq
- [] FastAPI-Users / Authlib (awareness)
- [] fastapi-limiter / slowapi
- [] ORJSON / UJSON
- [] Jinja2 templates with FastAPI (HTML apps)
- [] Admin UIs (SQLAdmin / Starlette Admin) overview

---

**✅ Interview & Design Scenarios**

- [] Design a versioned REST API with JWT auth
- [] Design file upload + async processing pipeline
- [] Design pagination for large datasets
- [] Explain DI + DB session lifecycle
- [] Explain async def vs def tradeoffs
- [] Design rate-limited public API
- [] Design WebSocket notification channel
- [] Compare FastAPI and Flask for a greenfield service
- [] Debug 422 validation errors & OpenAPI mismatches
- [] Production checklist walkthrough (workers, health, logs, migrations)

---

## How to use this checklist

1. For each item: **definition → why → how → tradeoffs → tiny example in your head**.
2. Prioritize for interviews: **Pydantic models, Depends/DI, async vs sync, JWT auth, SQLAlchemy session pattern, TestClient, lifespan, deployment**.
3. Ask for the **Guide** next when you want full deep-dive answers under every heading.
