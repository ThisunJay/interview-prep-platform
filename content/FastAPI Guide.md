# FastAPI Guide

A deep-dive companion to `FastAPI Topics.md`. Each heading matches the checklist; under every topic and subtopic: **what it is**, **why it exists**, **how it works**, **tradeoffs**, and **interview-ready nuance**.

*Related:* `Python & Flask Guide.md` for core Python / Flask contrast.

---

**✅ FastAPI Foundations**

### FastAPI overview & why it exists

FastAPI is a modern Python web framework for building APIs, built on **Starlette** (web layer) and **Pydantic** (validation/serialization). It exists to combine:

1. High performance (async ASGI)
2. Editor/IDE-friendly type hints
3. Automatic OpenAPI docs
4. Validation with clear 422 errors
5. First-class dependency injection

Created by Sebastián Ramírez; widely adopted for microservices, internal APIs, and ML model serving endpoints.

---

### FastAPI vs Flask vs Django REST Framework vs Express

| | FastAPI | Flask | DRF | Express |
|---|---|---|---|---|
| Style | ASGI, typed | WSGI micro | Batteries Django | Node micro |
| Validation | Pydantic built-in | Manual / extensions | Serializers | Manual / Joi/Zod |
| Docs | Auto OpenAPI | Extensions | Spectacular/etc. | Swagger kits |
| Async | Native | Add-on / limited | Evolving | Native callbacks/async |
| Best for | Modern APIs | Simple/flexible apps | CMS-heavy Django shops | JS full-stack |

Interview: FastAPI wins greenfield JSON APIs; Flask still fine for small/legacy; DRF if you’re already in Django; Express if Node ecosystem.

---

### ASGI vs WSGI

**WSGI** — sync Python web interface (Flask, Django classic). One request occupies a worker until done.  
**ASGI** — async-capable interface supporting HTTP, WebSockets, lifespan. FastAPI speaks ASGI.

#### Sync vs async request handling

Sync: thread/process blocked on I/O. Async: await I/O, event loop serves other requests on same thread.

#### Concurrency model (event loop)

Single-threaded loop schedules coroutines. Concurrent waits, not parallel CPU (GIL still applies for pure Python CPU work).

#### When async helps vs when it doesn’t

**Helps:** many concurrent I/O waits (DB, HTTP, S3).  
**Doesn’t:** CPU-bound crypto/image work (use processes); blocking libraries inside `async def` (hurts everyone). Sync `def` endpoints are OK — FastAPI runs them in a threadpool.

---

### Starlette under the hood

Starlette provides routing, requests/responses, middleware, WebSockets, BackgroundTasks, TestClient. FastAPI adds Pydantic validation, DI, OpenAPI generation on top. Knowing Starlette explains middleware and low-level Response types.

---

### Uvicorn / Hypercorn / Daphne (ASGI servers)

| Server | Notes |
|---|---|
| **Uvicorn** | Default choice; asyncio; optional uvloop/httptools |
| **Hypercorn** | HTTP/2, multiple event loop backends |
| **Daphne** | Django Channels heritage |

Production often: **gunicorn** with `uvicorn.workers.UvicornWorker` for multi-process.

---

### Installation & project bootstrap

```bash
pip install "fastapi[standard]"  # includes uvicorn, etc.
# or: pip install fastapi uvicorn pydantic sqlalchemy
```

Modern layout: `pyproject.toml` + `src/app/` or `app/`.

---

### First app: path operation basics

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}
```

A **path operation** = path + HTTP method + function. Run: `uvicorn app.main:app --reload`.

---

### `FastAPI()` app instance options

Useful constructor args: `title`, `version`, `description`, `openapi_url`, `docs_url`, `redoc_url`, `lifespan`, `dependencies`, `openapi_tags`, `contact`, `license_info`. Set `docs_url=None` to disable Swagger in prod if desired.

---

### OpenAPI / Swagger UI / ReDoc auto-docs

FastAPI generates OpenAPI 3 schema from types. **Swagger UI** at `/docs`, **ReDoc** at `/redoc`, raw schema at `/openapi.json`. Huge for client contracts and interviews — “docs as code.”

---

### Interactive docs authentication & disabling in prod

Authorize in Swagger via security schemes. In production: disable docs (`docs_url=None`, `redoc_url=None`, `openapi_url=None`) or protect behind auth/VPN — schema can leak internal models.

---

### Type hints as the core design principle

Parameters and models annotated with types → validation + docs + editor autocomplete. Untyped = weaker FastAPI value. Prefer `str | None`, `list[int]`, Pydantic models over bare `dict`.

---

### Request/response cycle overview

Request → middleware onion → routing → dependencies resolve → parse/validate params/body → path operation runs → `response_model` filter/serialize → middleware outward → client. Exceptions jump to handlers.

---

**✅ Path Operations & Routing**

### Path operation decorators (`@app.get/post/put/patch/delete/options/head`)

```python
@app.post("/items", status_code=201)
async def create_item(item: ItemCreate) -> ItemRead:
    ...
```

Also `@app.api_route` / `add_api_route` for multiple methods. Prefer explicit verbs for REST clarity.

---

### Path parameters

#### Types & conversion

```python
@app.get("/users/{user_id}")
def get_user(user_id: int): ...
```

Path segments converted to declared types; failure → validation error.

#### `Path()` constraints (ge, le, min_length, regex/pattern)

```python
from fastapi import Path
async def get(item_id: int = Path(ge=1, description="Item id")): ...
```

Use for OpenAPI metadata + validation. Prefer `pattern=` (Pydantic v2) over deprecated `regex=`.

---

### Query parameters

#### Required vs optional vs defaults

No default → required. `q: str | None = None` → optional. `limit: int = 10` → defaulted optional.

#### `Query()` validation & metadata

```python
from fastapi import Query
q: str | None = Query(None, min_length=2, max_length=50, examples=["milk"])
```

#### List / multiple query values

`tags: list[str] = Query()` accepts `?tags=a&tags=b`.

---

### Request body

#### Single Pydantic model body

A single `BaseModel` parameter is interpreted as JSON body — FastAPI’s sweet spot.

#### Embed / multiple bodies

Rare; use `Body(embed=True)` when mixing singular values/models oddly. Prefer one DTO.

#### Singular values as body (`Body()`)

```python
async def login(password: str = Body(embed=True)): ...
```

Usually better as a model.

---

### Header & Cookie parameters (`Header()`, `Cookie()`)

```python
from fastapi import Header, Cookie
user_agent: str | None = Header(default=None, convert_underscores=True)
session: str | None = Cookie(default=None)
```

Headers are case-insensitive; underscores convert to hyphens by default.

---

### Form data (`Form()`)

`application/x-www-form-urlencoded` or multipart fields:

```python
from fastapi import Form
username: str = Form()
```

Cannot easily mix arbitrary JSON body + form in one operation — use multipart for files+fields.

---

### File uploads (`File()`, `UploadFile`)

#### Spooled vs in-memory

`UploadFile` spools to disk above a threshold — better for large files than raw `bytes = File()`.

#### Multiple files

`files: list[UploadFile]` — validate count/size/content-type yourself.

Always: size limits, content-type allowlist, `secure` filenames, store outside executable paths / to S3.

---

### Status codes (`status_code=`, `status`)

```python
from fastapi import status
@app.post(..., status_code=status.HTTP_201_CREATED)
```

Dynamic status: return `JSONResponse(content=..., status_code=202)` or raise `HTTPException`.

---

### Response model (`response_model`)

Filters/validates output — hide password hashes, enforce shape for OpenAPI.

#### `response_model_exclude_unset`

Omit fields not explicitly set — useful for sparse PATCH responses.

#### `response_model_exclude` / `include`

Fine-grained field control; prefer dedicated Read DTOs over exclude soup.

#### Return type annotations vs `response_model`

Modern FastAPI: return annotation `-> ItemRead` often enough. `response_model=` still useful when return type is broader (`dict`, ORM object) or you need exclude options.

---

### Tags, summary, description, deprecated

Group ops in docs (`tags=["users"]`); `summary` short; docstring → description; `deprecated=True` marks sunset.

---

### Operation IDs & OpenAPI customization

`operation_id` names generated clients. Keep stable; default is function name (collisions if duplicated across routers — set explicitly).

---

### `HTTPException` vs custom responses

```python
from fastapi import HTTPException
raise HTTPException(status_code=404, detail="User not found")
```

Use for expected client/business errors. Custom `JSONResponse` when you need full control of body/headers without exception flow.

---

### `Response` / `JSONResponse` / `ORJSONResponse` / `UJSONResponse`

Raw `Response` for arbitrary bytes. `JSONResponse` stdlib json. **`ORJSONResponse`** — faster JSON via orjson (common prod choice). Set `default_response_class=ORJSONResponse` on app.

---

### `RedirectResponse` / `StreamingResponse` / `FileResponse` / `HTMLResponse`

Redirects for OAuth/browser flows; Streaming for large/chunked; FileResponse for disk files; HTMLResponse for simple HTML (or Jinja templates).

---

### Path operation configuration (`response_class`, `dependencies`, etc.)

Per-route: `response_class`, `dependencies=[Depends(...)]`, `include_in_schema=False`, `callbacks`, `openapi_extra`. Use router/app defaults to avoid repetition.

---

**✅ APIRouter & Application Structure**

### `APIRouter` basics

```python
from fastapi import APIRouter
router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{id}")
async def get_user(id: int): ...
```

Routers modularize large apps like Flask blueprints — but with typed DI and OpenAPI tags.

---

### `include_router` & prefixes

```python
app.include_router(users.router)
app.include_router(api_v1.router, prefix="/api/v1")
```

Compose versioned APIs cleanly.

---

### Router-level tags & dependencies

`APIRouter(dependencies=[Depends(require_auth)])` applies auth to all routes — DRY for protected modules.

---

### Modular project layouts

#### Flat vs domain/package structure

Small apps: flat `main.py`. Medium+: package by layer or domain.

#### `routers/`, `schemas/`, `models/`, `services/`, `api/deps.py`

Common layout:

```text
app/
  main.py
  api/
    deps.py
    routes/
  schemas/
  models/
  services/
  core/config.py
```

Routers stay thin; services hold business logic.

---

### Bigger apps: multiple routers & versioning folders

`api/v1/`, `api/v2/` each with routers. Share domain services; version only schemas/routes that change.

---

### Lifespan vs deprecated startup/shutdown events

#### `@asynccontextmanager` lifespan

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db = await create_pool()
    yield
    await app.state.db.close()

app = FastAPI(lifespan=lifespan)
```

Replaces `@app.on_event("startup")` / `shutdown` (deprecated).

#### Resource setup/teardown (DB pools, clients)

Create engine/client once; close cleanly on shutdown — critical with multiple workers (each worker runs lifespan).

---

### Application factory pattern with FastAPI

```python
def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)
    app.include_router(...)
    return app
```

Enables tests with different settings; mirrors Flask factories.

---

### Mounting sub-applications (`mount`)

`app.mount("/metrics", metrics_app)` or static files. Mounted apps are separate ASGI apps — middleware may not apply the same way; paths under mount.

---

### Sharing state via `app.state`

`request.app.state` / `app.state` for process-global handles (db pool). Prefer DI wrappers over importing globals — easier testing.

---

**✅ Pydantic (v2) for FastAPI**

### Pydantic role in FastAPI (validation + serialization + docs)

Inbound JSON → validated models; outbound → serialized per schema; JSON Schema feeds OpenAPI. This triad is FastAPI’s core value.

---

### Pydantic v1 vs v2 mental model (migration awareness)

v2: `model_validate` / `model_dump` replace `parse_obj` / `dict`; `model_config = ConfigDict(...)` replaces inner `class Config`; validators redesigned; much faster (Rust). FastAPI modern versions expect v2.

---

### `BaseModel` basics

```python
from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str
```

Immutable-by-convention DTOs at API boundary.

---

### Field types & `Field()`

#### Constraints (gt, ge, max_length, pattern)

```python
from pydantic import Field
age: int = Field(ge=0, le=150)
```

#### Defaults & `default_factory`

`Field(default_factory=list)` — never mutable defaults like `= []`.

#### Aliases (`alias`, `validation_alias`, `serialization_alias`)

Map Python `user_id` to JSON `userId` — populate by alias for inbound if configured.

---

### Optional / `None` / required fields

`name: str` required; `name: str | None = None` optional; `name: str | None` without default still required but nullable (must send `null` or string — subtle interview point).

---

### Nested models

Models containing models — nested validation & OpenAPI objects. Keep depth reasonable.

---

### Lists, dicts, unions, discriminated unions

`list[Item]`, `dict[str, int]`, `A | B`. Discriminated unions (`Field(discriminator="type")`) for polymorphic payloads — excellent for event APIs.

---

### Enums in schemas

`class Role(str, Enum)` — OpenAPI shows enum values; validation rejects unknowns.

---

### `model_config` (`ConfigDict`)

#### `from_attributes` (ORM mode)

Allows `ItemRead.model_validate(orm_obj)` — was `orm_mode` in v1.

#### `extra` (forbid/ignore)

`extra="forbid"` rejects unknown fields — good for strict APIs.

#### `str_strip_whitespace`, frozen, etc.

Strip inputs; `frozen=True` for hashable/immutable models.

---

### Validators

#### `field_validator`

Per-field checks/transforms.

#### `model_validator`

Cross-field rules (password == confirm).

#### Before vs after validation

`mode="before"` gets raw input; `after` gets typed fields. Know which you need.

---

### Computed fields (`computed_field`)

Derived properties included in serialization (e.g. `full_name`) without accepting them on input.

---

### Serialization

#### `model_dump` / `model_dump_json`

To dict/JSON string; options `exclude_none`, `by_alias`.

#### `model_validate` / `model_validate_json`

Parse from objects/JSON.

#### Custom serializers (`field_serializer`)

Format datetime, mask secrets on output.

---

### Settings management (`pydantic-settings`)

#### `BaseSettings`

Typed env config — preferred over scattered `os.getenv`.

#### `.env` loading

`model_config = SettingsConfigDict(env_file=".env")`.

#### Nested settings

Nested models for DB/Redis sections.

#### Secrets & environment prefixes

`SecretStr`; `env_prefix="APP_"`; never log secrets.

---

### Schema reuse patterns

#### Create / Update / Read DTO split

`UserCreate` (password), `UserUpdate` (optional fields), `UserRead` (no password). Don’t expose ORM directly.

#### Shared base schemas

`UserBase` with email/name; inherit for Create/Read.

---

### JSON Schema generation & OpenAPI impact

Constraints become OpenAPI schema — clients and docs stay accurate. Bad models → bad docs.

---

### Performance notes (Pydantic v2 Rust core)

Validation is fast; still avoid validating huge blobs repeatedly. Prefer `ORJSONResponse` + lean models for hot paths.

---

**✅ Dependency Injection System**

### Why DI in FastAPI (testability, reuse, security)

Shared logic (auth, DB, pagination) declared once, composed per route, overridden in tests — without a heavy IoC container.

---

### `Depends()` basics

```python
from fastapi import Depends

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/items")
def list_items(db=Depends(get_db)):
    ...
```

FastAPI calls the dependency, injects result.

---

### Dependency callables (functions & classes)

Functions common; classes with `__call__` useful for configurable dependencies (`get_current_user = AuthDep(roles=["admin"])` patterns).

---

### Sub-dependencies / dependency trees

`get_current_user` depends on `oauth2_scheme` + `get_db` — tree resolves automatically, cached per request by default.

---

### `yield` dependencies (setup/teardown)

#### DB session pattern

Yield session; close after response — classic unit-of-work per request.

#### Exception behavior with yield

Code after `yield` runs as cleanup (finally-like) even on failures — exit generators carefully; FastAPI handles the teardown phase.

---

### Router & app-level dependencies

Apply auth/logging to many routes without repeating parameters.

---

### Path operation-level dependencies

`dependencies=[Depends(verify_api_key)]` when you don’t need the return value — side-effect/security deps.

---

### `Security()` vs `Depends()` for auth schemes

`Security()` is `Depends` + OpenAPI security metadata (scopes). Prefer `Security` for OAuth scopes so docs show correctly.

---

### Caching dependencies (`use_cache`)

Same dependency called multiple times in one request → one execution if cached (default True). Disable rare cases with `use_cache=False`.

---

### Overriding dependencies in tests (`app.dependency_overrides`)

```python
app.dependency_overrides[get_db] = lambda: mock_db
```

Critical testing feature — swap auth/DB without patching everywhere.

---

### Common dependency catalog

#### Current user

Decode JWT → load user → 401 if invalid.

#### DB session

Yield session/connection.

#### Settings / config

`lru_cache` settings factory via Depends.

#### Pagination params

`skip`/`limit` or cursor dependency returning a small dataclass.

#### Feature flags / tenants

Resolve tenant from header/JWT; inject into services.

---

### Annotated dependencies pattern (`Annotated[..., Depends()]`)

```python
from typing import Annotated
DbSession = Annotated[Session, Depends(get_db)]

def list_items(db: DbSession): ...
```

Cleaner signatures; recommended modern style.

---

### Anti-patterns (over-DI, hidden I/O in surprising places)

Don’t make every one-liner a dependency. Don’t hide slow network calls in innocent-looking deps without timeouts. Avoid request-unrelated global mutable state.

---

**✅ Request Validation & Error Handling**

### Automatic validation errors (422 Unprocessable Entity)

Invalid types/constraints → 422 before your function runs. Interview: 400 often for malformed HTTP; FastAPI uses **422** for semantic validation (OpenAPI common practice).

---

### Validation error body shape

Default: `{"detail": [{"loc": ["body","email"], "msg": "...", "type": "..."}]}`. Clients parse `loc` paths.

---

### Custom exception handlers

#### `@app.exception_handler`

Register handlers for exception types.

#### Handling `RequestValidationError`

Customize 422 body to your standard error envelope.

#### Handling `HTTPException`

Unify shape with domain errors.

#### Domain exceptions → HTTP mapping

`UserNotFoundError` → 404 handler; keep route code clean (`raise UserNotFoundError`).

---

### Consistent error response schema (Problem Details / RFC 9457 style)

Fields like `type`, `title`, `status`, `detail`, `instance` (+ `errors` for fields). Consistency beats cleverness.

---

### Middleware vs exception handlers vs dependencies for errors

Dependencies: auth failures. Handlers: translate exceptions. Middleware: catch-all logging — don’t replace handlers for business errors.

---

### Logging exceptions without leaking internals

Log stack traces server-side; return generic 500 message to clients. Include request ID in both.

---

### Background-safe error patterns

Exceptions in `BackgroundTasks` won’t change the already-sent response — log heavily; prefer queues for critical work.

---

**✅ Middleware & Request Lifecycle**

### What middleware is in Starlette/FastAPI

ASGI layers wrapping the app — see every request/response (and can short-circuit).

---

### Adding middleware (`add_middleware`)

```python
app.add_middleware(CORSMiddleware, allow_origins=[...])
```

Last added = outermost (runs first on request).

---

### Built-ins & common middleware

#### `CORSMiddleware`

Browser cross-origin — configure explicitly.

#### `GZipMiddleware`

Compress responses above minimum size.

#### `TrustedHostMiddleware`

Reject unknown Host headers (anti-DNS-rebinding).

#### `HTTPSRedirectMiddleware`

Force HTTPS (often better at reverse proxy).

#### Session middleware (when used)

Signed cookie sessions — less common for pure JWT APIs.

---

### Custom middleware (pure ASGI vs `BaseHTTPMiddleware`)

Pure ASGI middleware is more correct for streaming. `BaseHTTPMiddleware` easier but has known edge-case pitfalls — prefer pure ASGI for high-fidelity apps.

---

### Order of middleware (onion model)

Request: outer → inner → app. Response: inner → outer. CORS usually outer enough to handle preflight.

---

### Correlation / request ID middleware

Accept incoming `X-Request-ID` or generate UUID; bind to contextvars/logging; return header.

---

### Timing / metrics middleware

Record duration, status, path templates (careful with high-cardinality path params).

---

### Middleware pitfalls with streaming & `BaseHTTPMiddleware`

Buffering large/streaming responses; exception handling quirks — know the issue exists for interviews.

---

### Hooks comparison: middleware vs dependencies vs lifespan

| Hook | Use |
|---|---|
| Lifespan | Process resources |
| Middleware | Cross-cutting HTTP |
| Dependencies | Per-route injectable logic |

---

**✅ Async Programming for FastAPI**

### `async def` vs `def` path operations

#### When FastAPI runs sync in a threadpool

`def` endpoints run in anyio threadpool so they don’t block the event loop — limited threads; still don’t do CPU bombs.

#### Blocking calls inside `async def` (anti-pattern)

Blocking SQL/HTTP inside async holds the loop — latency spikes for all. Use async drivers or `asyncio.to_thread`.

---

### awaitable I/O (HTTPX AsyncClient, async DB drivers)

`httpx.AsyncClient`, `AsyncSession`, async Redis — share clients via lifespan; don’t recreate per request without pooling.

---

### Running CPU-bound work (process pool / offload)

`ProcessPoolExecutor` / task queue for heavy CPU; keep API workers responsive.

---

### Concurrent in-request work (`asyncio.gather`)

Fan-out independent I/O calls carefully with timeouts and error handling (`return_exceptions`).

---

### Timeouts & cancellation awareness

Always timeout outbound calls. Client disconnect may cancel tasks — design idempotent writes.

---

### Shared resources & thread safety

Async-safe: one loop. Sync threadpool + shared mutable state needs locks. DB sessions are not cross-request shared.

---

### Async generators & streaming

`async def gen(): yield chunk` with `StreamingResponse` — stream without loading all memory.

---

### Common async bugs (forgotten await, blocking ORM)

Forgotten `await` → coroutine never runs. Classic SQLAlchemy lazy-load in async context → errors/`greenlet` issues — eager load or async patterns.

---

**✅ Databases & Persistence**

### Choosing ORM / query layer (SQLAlchemy 2.0, Tortoise, Prisma, raw SQL)

SQLAlchemy 2.0 is the industry default with FastAPI. Tortoise async-native. SQLModel wraps SQLAlchemy+Pydantic (Tiangolo). Raw SQL for hot paths/complex analytics.

---

### SQLAlchemy 2.0 + FastAPI patterns

#### Engine & session factory

Create engine once; `sessionmaker` / `async_sessionmaker`.

#### Sync vs async session (`AsyncSession`)

Async stack needs `asyncpg`/`aiomysql` style drivers. Don’t mix sync session calls inside async routes carelessly.

#### Session-per-request dependency

Yield session; commit on success or explicit service commit; rollback on error; close always.

#### `select()` style queries

```python
result = await session.execute(select(User).where(User.id == id))
user = result.scalar_one_or_none()
```

#### Relationships & lazy loading pitfalls with async

Lazy I/O in async fails. Use `selectinload`/`joinedload` explicitly.

---

### Alembic migrations

Version schema; autogenerate carefully; expand/contract for zero-downtime. Run migrations as CI/CD/init job — not silently on every API start in multi-replica (race).

---

### Repository / service layer split

Repos: HTTP mapping. Service: business rules. Repository: queries. Keeps FastAPI swappable and tests focused.

---

### Transactions & commit/rollback patterns

One request → one transaction by default; explicit nested transactions for complex workflows. Commit after business success.

---

### Connection pooling with uvicorn workers

Each worker has its own pool — `pool_size * workers` ≤ DB max connections. Tune aggressively in K8s.

---

### Using MongoDB (Motor / Beanie) overview

Motor async driver; Beanie ODM on Pydantic. Same DI session/client patterns; different consistency story.

---

### Redis for cache / sessions / rate limits

Shared cache across workers; rate limit counters; revoke token denylist. Set TTLs.

---

### Multi-DB & read replicas (conceptual)

Bind write engine vs read engine; routing in session factory; eventual consistency awareness for reads.

---

### N+1 queries & performance

Detect via logging/timing; fix with eager loads or joined queries; paginate.

---

### Soft deletes & auditing patterns

`deleted_at` filter defaults; audit table or columns (`created_by`); never hard-delete financial records casually.

---

**✅ Authentication & Authorization**

### Authn vs Authz

**Authentication** — who are you? **Authorization** — what can you do? Separate dependencies.

---

### Password hashing (passlib / bcrypt / argon2)

Hash with salt + slow KDF; `verify` constant-time. Prefer argon2/bcrypt; never store plaintext.

---

### OAuth2 password flow with FastAPI

#### `OAuth2PasswordBearer`

Extracts Bearer token from `Authorization` header; declares token URL for docs.

#### `OAuth2PasswordRequestForm`

Form fields `username`/`password` for `/token` login endpoint.

#### Token URL & scopes

`tokenUrl="token"` relative to app; scopes list permissions in OpenAPI.

---

### JWT access tokens

#### Create / decode / verify

Sign with secret/private key; verify signature + exp. Use battle-tested libs (PyJWT).

#### Claims (`sub`, `exp`, `scopes`)

`sub` = user id; short `exp`; scopes/roles claims. Opaque vs JWT tradeoffs (revocation).

#### Refresh token patterns

Long-lived refresh stored server-side/rotated; access short-lived. Steal refresh = danger — rotate & revoke families.

---

### API keys (`APIKeyHeader` / query / cookie)

Simple service auth; put in header not query (logs). Rotate keys; hash at rest.

---

### HTTP Basic / Digest (when relevant)

Basic only over HTTPS for demos/admin tooling — prefer Bearer tokens for APIs.

---

### `HTTPBearer` / custom security schemes

Generic bearer extraction; custom schemes for weird headers — register in OpenAPI.

---

### Cookie-based auth & CSRF considerations

Cookie sessions need CSRF protection for browser state-changing requests. SameSite helps but isn’t complete alone.

---

### Getting current user dependency

Token → payload → DB user → raise 401 if missing/disabled. Inject `CurrentUser` Annotated dep.

---

### Role-based access control (RBAC)

Check `user.role in {"admin"}` or permissions set. Dependency factory `require_roles("admin")`.

---

### Permission / scope checks

OAuth scopes via `Security(scopes=["items:write"])`. Fine-grained permissions for larger apps.

---

### Optional auth (anonymous vs logged-in)

Dependency returns `User | None` instead of raising — personalize if logged in.

---

### Service-to-service auth (client credentials conceptual)

Machine clients get tokens via client credentials; mTLS or AWS IAM alternatives in cloud.

---

### OAuth2 / OIDC social login overview (Authlib)

Redirect to IdP; callback with code; map to local user. Authlib integrates well.

---

### Securing docs endpoints

Disable or protect `/docs` in prod; don’t expose internal admin schemas publicly.

---

### Common vulnerabilities (token storage, alg=none, weak secrets)

Reject `alg=none`; strong secrets; don’t store JWT forever in localStorage if XSS risk (know tradeoffs); validate `aud`/`iss` when applicable; https only.

---

**✅ Security Best Practices**

### CORS configuration deep dive

Allow specific origins; methods; headers; `expose_headers`; `max_age` for preflight cache. Reflecting arbitrary Origin is dangerous.

---

### Trusted hosts

`TrustedHostMiddleware` allowlist — important behind misconfigured proxies.

---

### HTTPS & reverse proxy headers (`ProxyHeadersMiddleware` / uvicorn flags)

Trust `X-Forwarded-Proto/For` only from known proxies (`--proxy-headers`). Wrong config → broken URLs/security.

---

### Input validation as security boundary

Pydantic constraints = first line; still authorize object-level access (IDOR checks).

---

### SQL injection prevention (ORM/parameterized)

Never f-string SQL with user input; bound parameters only.

---

### XSS & response headers (CSP awareness)

JSON APIs less XSS-prone; if HTML, escape templates; CSP headers via middleware/proxy.

---

### Rate limiting strategies

slowapi/fastapi-limiter + Redis; limit by IP/user/API key; stricter on auth endpoints.

---

### File upload security (size, type, storage path)

Max body size at proxy; sniff content-type; random storage keys; virus scan when needed; no user-controlled paths.

---

### Secrets management (env, vault)

Env/Secrets Manager; rotate JWT secrets carefully (versioned keys).

---

### Dependency vulnerability scanning

pip-audit / Dependabot / safety in CI.

---

### Least privilege DB credentials

API role: DML on needed tables only; migrations use separate role.

---

### Security headers checklist

HSTS, X-Content-Type-Options, Frame-Options/CSP, Referrer-Policy — often at CDN/Nginx.

---

**✅ Background Tasks & Async Work**

### `BackgroundTasks` (Starlette)

#### Use cases & limitations

After response: send email, light logging fan-out. Same process; no retries dashboard; runs before worker fully free.

#### Not surviving process death

Worker kill loses tasks — not for payments/critical side effects.

---

### When to use a real queue (Celery, RQ, Dramatiq, Arq, SAQ)

Durable brokers (Redis/Rabbit), retries, concurrency, scheduling — Arq/Taskiq fit asyncio niches.

---

### Enqueue-from-API patterns

Validate → persist job row → enqueue → return `202` + `job_id`.

---

### Idempotent background jobs

Same `job_id` / business key safe to run twice.

---

### Scheduled jobs vs request-triggered

Cron/Celery beat/Airflow for schedules; API for user-triggered.

---

### Returning 202 Accepted for async operations

Signal acceptance without completion; provide status URL.

---

### Job status endpoints

`GET /jobs/{id}` → queued/running/succeeded/failed + error summary.

---

**✅ WebSockets & Realtime**

### WebSocket routes in FastAPI

```python
@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    ...
```

---

### Accept / receive / send loop

Accept → loop receive_text/json → send; handle disconnect exceptions.

---

### JSON vs text messages

Prefer JSON protocols with `type` field for multiplexed events.

---

### Connection managers (broadcast patterns)

In-memory set of connections for single-worker demos; won’t scale across processes alone.

---

### Auth for WebSockets

Token in query/first message/subprotocol; validate before accept; close on failure.

---

### Scaling WebSockets (sticky sessions, Redis pub/sub)

Sticky LB or broadcast via Redis pub/sub so any worker can fan out.

---

### SSE (Server-Sent Events) alternatives

One-way server→client over HTTP; simpler than WS for notifications.

---

### When to prefer WebSockets vs polling vs SSE

Polling: simple/low frequency. SSE: server push one-way. WebSockets: bidirectional low-latency (chat, collab).

---

**✅ Streaming, Files & Media**

### `StreamingResponse` for large payloads

Stream file-like/generators — constant memory vs full buffer.

---

### Generator / async generator streaming

Sync gen runs in threadpool nuances; async gen native — prefer async for ASGI purity.

---

### Chunked downloads

Iterate S3/file chunks; set media type; handle client disconnect.

---

### `FileResponse` & static file mounting

`FileResponse(path)` for single files; `StaticFiles` mount for assets (prod often CDN/Nginx).

---

### Upload → S3 / object storage patterns

Stream to S3 (multipart upload); store metadata in DB; never keep large blobs on API disk.

---

### Content-Type & Content-Disposition handling

`attachment; filename="..."` for downloads; correct media types.

---

### Memory backpressure concerns

Don’t read entire upload into memory; constrain max size early.

---

**✅ Caching & Performance**

### Response caching strategies

Cache deterministic GET responses; invalidate on writes; vary by user/auth carefully.

---

### HTTP caching headers (`Cache-Control`, ETag)

Client/CDN caching; conditional requests with ETag/If-None-Match.

---

### Redis caching layer

Shared across workers; serialize JSON; stampede protection (locks/jitter TTLs).

---

### `lru_cache` for settings/resources

Cache parsed settings; process-local only.

---

### ORJSONResponse performance

Faster dumps; datetimes/numpy friendly options — common default_response_class.

---

### Avoiding unnecessary Pydantic work

Don’t re-validate trusted internal objects repeatedly; use `model_construct` sparingly (skips validation — dangerous for untrusted input).

---

### DB query optimization

Indexes, select columns needed, eager load, pagination, EXPLAIN.

---

### Connection pooling & keep-alive

Pool size tuning; HTTPX client reuse; DB pool recycling.

---

### Profiling FastAPI apps

pyinstrument/cProfile; slow middleware; APM (Datadog/OTel).

---

### Load testing (Locust, k6)

Establish p95 baselines before “optimizing.”

---

### uvicorn workers vs async concurrency

#### gunicorn + uvicorn workers

Multiple processes for multi-core; each with async concurrency.

#### Worker count heuristics

Often `2–4 × CPU cores` starting point — measure; each worker has memory/DB pool cost.

---

### uvloop / httptools overview

Faster event loop & HTTP parser on CPython Unix — uvicorn optional extras.

---

**✅ Pagination, Filtering & API Design**

### Pagination styles (offset, cursor/keyset)

Offset simple but slow deep pages; **cursor/keyset** scales (`WHERE id > :cursor`). Return `next_cursor`.

---

### Sorting & filtering query conventions

`?sort=-created_at&status=active` — whitelist sort fields (SQLi/perf).

---

### Search endpoints design

Prefer dedicated `/search` with explicit params; debounce client-side; consider OpenSearch for fuzzy.

---

### Idempotency keys for POST

Header `Idempotency-Key` stored with response — safe client retries for payments/creates.

---

### Bulk endpoints tradeoffs

Efficient but complex validation/partial success semantics — document carefully (`207` multi-status rare).

---

### HATEOAS (optional awareness)

Links in responses; uncommon in pragmatic APIs — know the term.

---

### Consistent envelope vs raw resources

`{data, meta}` vs raw JSON object — pick one. FastAPI examples often raw resources + headers for meta.

---

### API versioning strategies

#### URL path `/v1`

Most common/clear.

#### Header versioning

Cleaner URLs; harder to discover/cache.

#### Router-per-version

`include_router(..., prefix="/v1")` — practical FastAPI approach.

---

### Breaking vs non-breaking changes

Additive fields usually OK; renames/removals/type changes break — version or expand/contract.

---

### Designing DELETE / soft-delete semantics

404 vs 204 on missing; soft-delete default for recoverable domains; hard-delete admin-only.

---

### Partial updates (`PATCH`) with optional fields

All-optional Update model; distinguish “omit” vs “set null” (Optional vs Union + sentinel / explicit nullable fields).

---

**✅ OpenAPI Customization & Documentation**

### Automatic schema generation

Models → components/schemas; routes → paths. Keep models clean for good docs.

---

### `openapi_tags` metadata

Order/descriptions for tag groups in Swagger.

---

### `examples` & `openapi_examples` (Pydantic/FastAPI)

Rich examples improve client adoption; multiple named examples supported.

---

### `json_schema_extra`

Attach extra schema metadata/examples on models.

---

### Custom OpenAPI schema function

`app.openapi = custom_openapi` to inject gateways, global security, scrub internal fields.

---

### External docs links

`externalDocs` for runbooks.

---

### Separate public vs private schemas

Different apps or `include_in_schema=False` on internal routes.

---

### Exporting `openapi.json`

Commit or publish artifact for contract tests / SDK gen in CI.

---

### Client SDK generation awareness

openapi-generator, speakeasy, etc. Stable `operationId` matters.

---

### Documenting auth schemes clearly

If Swagger Authorize doesn’t work, onboarding suffers — test it.

---

**✅ Testing FastAPI**

### `TestClient` (Starlette / sync)

```python
from fastapi.testclient import TestClient
client = TestClient(app)
assert client.get("/health").status_code == 200
```

Runs ASGI in-process; familiar sync pytest style.

---

### `httpx.AsyncClient` + `ASGITransport` (async tests)

True async tests for async deps/lifespan nuance.

---

### pytest fixtures for app / client

Factory `app` fixture; `client` depends on app; function-scoped DB.

---

### Overriding dependencies

Replace `get_current_user` / `get_db` — cornerstone of FastAPI unit/integration tests.

---

### Testing auth (token fixtures)

Helper builds JWT; client sends `Authorization: Bearer ...`; also test 401/403 paths.

---

### Database test strategies

#### Transaction rollback per test

Wrap test in transaction rollback — fast isolation.

#### Testcontainers / ephemeral DB

Real Postgres in Docker — highest fidelity.

#### SQLite limits for Postgres features

JSON/ARRAY/dialect differences — don’t exclusively trust SQLite for Postgres apps.

---

### Testing file uploads

`files={"file": ("x.png", b"...", "image/png")}`.

---

### Testing WebSockets

`with client.websocket_connect("/ws") as ws:` — send/receive assertions.

---

### Testing exception handlers & status codes

Assert status + error envelope shape; not only happy path.

---

### Contract tests against OpenAPI (schemathesis overview)

Property-based hits endpoints per schema — catches drift.

---

### Coverage goals for APIs

Prefer critical path coverage (authz, validation, billing) over vanity 100%.

---

**✅ Configuration, Logging & Observability**

### 12-factor config with pydantic-settings

Env-based settings object injected via DI; no hardcoded hosts.

---

### Environments (dev/stage/prod)

`ENV` switch; stricter CORS/docs/debug in prod; separate secrets.

---

### Structured logging

JSON logs with `request_id`, `user_id`, `path`, `status`, `duration`.

---

### Correlation / request IDs

Middleware sets; propagate to HTTPX outbound calls & jobs.

---

### Metrics (Prometheus / OpenTelemetry)

RED metrics: rate, errors, duration; export `/metrics` or OTLP.

---

### Tracing distributed requests

OpenTelemetry spans across FastAPI → DB → downstream HTTP.

---

### Health checks

#### `/health` liveness

Process up — don’t check deep deps (avoid kill loops).

#### `/ready` readiness (DB/ping)

Can serve traffic — DB/redis reachable.

---

### Graceful shutdown with lifespan

Finish in-flight requests; close pools; K8s `terminationGracePeriodSeconds` aligned.

---

### Error tracking (Sentry)

Capture 500s with release versions; scrub PII.

---

### Audit logging for sensitive actions

Who changed what/when — immutable store for admin/financial APIs.

---

**✅ Deployment & Production**

### Running with uvicorn

`uvicorn app.main:app --host 0.0.0.0 --port 8000`. Dev `--reload`. Prod: multiple workers or gunicorn.

---

### gunicorn + uvicorn worker class

```bash
gunicorn -k uvicorn.workers.UvicornWorker -w 4 app.main:app
```

Process manager + ASGI workers.

---

### Dockerizing FastAPI

#### Multi-stage builds

Build deps in builder; copy venv/app to slim runtime.

#### Non-root user

Drop privileges.

#### Healthcheck

Hit `/health` in `HEALTHCHECK` / compose.

---

### Docker Compose with DB/Redis

Local parity: api + postgres + redis; wait-for-db scripts or restart policies.

---

### Kubernetes deployment basics

#### Probes (liveness/readiness)

Map to `/health` & `/ready`.

#### Resource requests/limits

Avoid noisy neighbors; size from load tests.

#### Horizontal scaling

HPA on CPU/RPS; stateless API required (externalize sessions/state).

---

### Reverse proxy (Nginx / Traefik / ALB)

TLS, routing, max body size, compression, static, WAF.

---

### TLS termination

Usually at proxy/LB; app may still enforce HTTPS redirects carefully.

---

### Environment secrets in prod

K8s Secrets / AWS SM; inject env; never bake into images.

---

### Multiple workers & shared state pitfalls

In-memory caches/WebSocket sets not shared — use Redis. Uploaded local files not visible across pods — use object storage.

---

### Serverless deploy (AWS Lambda + Mangum overview)

Mangum adapts ASGI→Lambda. Good for spiky low traffic; watch package size & timeouts.

---

### Cold starts & async on Lambda caveats

Cold start latency; leftover loop/connection issues — reuse clients carefully; provisioned concurrency if needed.

---

### CI/CD pipeline stages for FastAPI apps

lint → typecheck → unit/integration → build image → migrate → deploy → smoke `/health`.

---

**✅ CORS, Cookies, Sessions & Browsers**

### CORS preflight deep dive

Browser OPTIONS probe for “non-simple” cross-origin requests. Middleware must answer correctly or browser blocks — server logs may still show success if you test with curl.

---

### Credentials & `allow_origins` (no `*` with cookies)

`allow_credentials=True` requires explicit origins, not `*`.

---

### Cookie flags (`HttpOnly`, `Secure`, `SameSite`)

HttpOnly blocks JS access; Secure HTTPS-only; SameSite CSRF mitigation (`Lax`/`Strict`/`None`).

---

### CSRF for cookie-based session APIs

Synchronizer tokens or double-submit; frameworks/libraries help. Any cookie-auth browser API needs a story.

---

### SPA + FastAPI architecture patterns

SPA on CDN + API on api.example.com with CORS; or same-site reverse proxy paths (`/api`) to simplify cookies.

---

### CSRF-exempt JWT bearer pattern (and risks)

Authorization header isn’t auto-sent cross-site like cookies — CSRF less relevant; XSS token theft risk if stored in localStorage. Know both models.

---

**✅ Advanced FastAPI Patterns**

### Class-based views / `cbv` style (optional libraries)

Not built-in; third-party CBV helpers exist. Most codebases prefer functions + DI.

---

### Generic CRUD routers (awareness of fastapi-crudrouter / custom)

Rapid prototypes; customize carefully for authz and real business rules.

---

### Plugin-style routers

Dynamic `include_router` based on settings/features.

---

### Multi-tenant APIs (tenant dependency)

Resolve tenant from subdomain/header/JWT; constrain every query by `tenant_id` — miss once = data leak.

---

### Feature flags

Dependency reads flags from config/LaunchDarkly; gate routes/behavior.

---

### Request context (contextvars)

Bind request_id/user for deep call stacks without param drilling — reset safely per request.

---

### Internationalization (i18n) overview

Accept-Language → translation dependency; keep message keys in errors.

---

### GraphQL with FastAPI (Strawberry) awareness

Mount Strawberry schema; REST+GraphQL hybrid possible; auth still DI-based.

---

### Mixing sync legacy libraries safely

Call via `to_thread` or wrap sync service behind threadpool; migrate gradually to async drivers.

---

### Gradual migration from Flask to FastAPI

Strangle pattern: new routes in FastAPI behind gateway; share DB; migrate module by module; don’t rewrite everything at once.

---

### Hexagonal / clean architecture with FastAPI

Adapters (routes) → use cases (services) → ports (repo interfaces) → infrastructure (SQLAlchemy). FastAPI stays at the edges.

---

### Domain exceptions & application services

Domain raises `InsufficientStock`; interface layer maps to HTTP. Keeps business logic framework-agnostic — strong interview signal.

---

**✅ Ecosystem & Related Libraries**

### HTTPX (sync/async client)

Preferred modern HTTP client; httpx for TestClient transport too.

---

### SQLAlchemy 2 / sqlmodel

SQLAlchemy 2 — standard ORM. SQLModel — friendlier hybrid, still SQLAlchemy underneath.

---

### Alembic

Migrations companion to SQLAlchemy.

---

### pydantic-settings

Env config for 12-factor apps.

---

### python-jose / PyJWT / jwcrypto

JWT encode/decode; prefer maintained PyJWT; beware outdated jose forks.

---

### passlib / pwdlib / argon2-cffi

Password hashing libraries; argon2 often recommended.

---

### Celery / Arq / Dramatiq / Taskiq

Task queues — Celery ubiquitous; Arq/Taskiq more async-native.

---

### FastAPI-Users / Authlib (awareness)

FastAPI-Users scaffolds user auth; Authlib for OAuth/OIDC providers.

---

### fastapi-limiter / slowapi

Rate limiting integrations.

---

### ORJSON / UJSON

Fast JSON serializers; ORJSON common with `ORJSONResponse`.

---

### Jinja2 templates with FastAPI (HTML apps)

Possible via Jinja2Templates — FastAPI isn’t only JSON; still API-first culture.

---

### Admin UIs (SQLAdmin / Starlette Admin) overview

Quick internal admin; protect ruthlessly.

---

**✅ Interview & Design Scenarios**

### Design a versioned REST API with JWT auth

`/api/v1` router; register/login/token; `OAuth2PasswordBearer`; `get_current_user`; RBAC deps; Pydantic Create/Read; SQLAlchemy; Alembic; TestClient auth fixtures; OpenAPI security scheme.

---

### Design file upload + async processing pipeline

Upload endpoint validates file → store S3 → DB row `pending` → enqueue job → `202` + id → worker processes → status endpoint; never use BackgroundTasks alone for critical processing.

---

### Design pagination for large datasets

Keyset on `(created_at, id)`; `limit`; return `next_cursor`; index supporting columns; forbid crazy `offset=10_000_000`.

---

### Explain DI + DB session lifecycle

Request starts → `Depends(get_db)` creates session → route/service uses it → response → yield cleanup closes/rollbacks → overrides in tests replace session.

---

### Explain async def vs def tradeoffs

Async for non-blocking I/O with async libs; sync def OK for sync ORM/simple code (threadpool); never block inside async def; CPU → queue/process pool.

---

### Design rate-limited public API

API keys; Redis token bucket per key; return `429` + `Retry-After`; stricter limits on expensive endpoints; dashboard abuse metrics.

---

### Design WebSocket notification channel

Auth on connect; subscribe to user channel; Redis pub/sub from workers; reconnect/backoff client protocol; fallback SSE/polling.

---

### Compare FastAPI and Flask for a greenfield service

Choose FastAPI for typed APIs, async, auto docs; Flask for minimal sync apps/extensions familiarity/legacy alignment. Many teams pick FastAPI for new JSON services.

---

### Debug 422 validation errors & OpenAPI mismatches

Read `detail.loc`; compare request to schema; check Optional vs required; aliases; content-type; nested models; update clients when schema evolves.

---

### Production checklist walkthrough (workers, health, logs, migrations)

gunicorn/uvicorn workers tuned; `/health` `/ready`; structured logs + request IDs; migrations job before deploy; secrets from env; CORS locked; docs disabled/protected; timeouts; pool limits; dashboards/alerts on error rate & p95.

---

## How to use this guide

- Walk `FastAPI Topics.md` and explain each checkbox aloud before peeking here.
- Prioritize: **Pydantic DTOs, Depends/yield DB session, async vs def, JWT auth, TestClient overrides, lifespan, deployment workers**.
- Build one small CRUD API with auth + Alembic + tests — practice beats passive reading.
- Contrast with Flask from your other guide when asked “why FastAPI?”

Good luck with prep.
