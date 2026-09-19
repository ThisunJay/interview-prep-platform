# Django & DRF

Checklist for deep-dive Django + Django REST Framework interview prep. Check off when you can explain aloud with tradeoffs and a small code mental model.

*Related:* `Python Topics.md` for language core; this doc focuses on **Django MVT, ORM, and DRF APIs**.

---

**📌 Django Foundations**

- [] Django overview & MVT architecture
- [] Django vs Flask vs FastAPI vs Express
- [] Project vs App structure
- [] `django-admin` / `manage.py` essentials
- [] Settings module (`settings.py`, env-based config)
- [] WSGI vs ASGI in Django
- [] Development server vs production servers (Gunicorn/Uvicorn + Nginx)
- [] Apps, `INSTALLED_APPS`, and AppConfig
- [] Request/response cycle overview
- [] Django MTV vs classic MVC naming

---

**📌 Models & ORM**

- [] Models as the source of truth
- [] Field types (CharField, TextField, IntegerField, DecimalField, DateTimeField, JSONField, etc.)
- [] Primary keys & `UUIDField` / custom PKs
- [] Relationships: ForeignKey, OneToOneField, ManyToManyField
- [] `on_delete` behaviors (CASCADE, PROTECT, SET_NULL, …)
- [] `related_name` & reverse relations
- [] Model `Meta` options (ordering, unique_together / UniqueConstraint, indexes)
- [] `__str__`, custom methods, and model properties
- [] Validators on fields & models
- [] Multi-table inheritance vs abstract base classes vs proxy models
- [] Soft deletes patterns (and why Django has no built-in)

---

**📌 Migrations**

- [] Why migrations exist
- [] `makemigrations` vs `migrate`
- [] Migration files anatomy
- [] Data migrations (`RunPython`)
- [] Squashing migrations
- [] Fake migrations & zero migrations pitfalls
- [] Handling migration conflicts on teams

---

**📌 QuerySets & Database Access**

- [] QuerySets are lazy
- [] `filter`, `exclude`, `get`, `create`, `update`, `delete`
- [] Lookups (`exact`, `iexact`, `contains`, `in`, `gt/gte`, `isnull`, …)
- [] `Q` objects & complex OR/AND queries
- [] `F` expressions & database-side updates
- [] Aggregations & annotations (`Count`, `Sum`, `Avg`, …)
- [] `select_related` vs `prefetch_related`
- [] N+1 query problem in Django
- [] `only` / `defer` / `values` / `values_list`
- [] Transactions (`atomic`, `select_for_update`)
- [] Raw SQL (`raw`, `cursor`) — when it's justified
- [] Database routers (multi-DB basics)

---

**📌 Admin, Forms & Templates (Practical)**

- [] Django Admin customization (`ModelAdmin`, list_display, filters, search)
- [] Forms & `ModelForm`
- [] Form validation (`clean`, `clean_<field>`)
- [] CSRF in forms and APIs
- [] Template language essentials (for API-heavy roles: enough to read)
- [] Static files vs media files

---

**📌 Views, URLs & Middleware**

- [] Function-based views (FBV)
- [] Class-based views (CBV) & generic CBVs
- [] `URLConf`, `path`, `re_path`, `include`
- [] Named URLs & `reverse` / `redirect`
- [] HttpRequest / HttpResponse / JsonResponse
- [] Middleware pipeline (request/response/exception)
- [] Common middleware (Security, Session, Auth, CSRF, Common, XFrame)
- [] Custom middleware patterns
- [] `Http404` / exception handling
- [] File uploads & storage backends

---

**📌 Django Auth, Sessions & Security**

- [] Built-in User model vs custom user model
- [] `AbstractUser` vs `AbstractBaseUser`
- [] Authentication backends
- [] Permissions & groups
- [] Sessions & cookies
- [] Password hashing (PBKDF2/Argon2 defaults)
- [] CSRF, XSS, SQL injection defenses in Django
- [] Django SECURE settings & HTTPS
- [] Clickjacking / `X-Frame-Options`
- [] Secrets: `SECRET_KEY`, never committing credentials

---

**📌 Signals, Caching & Async**

- [] Django signals (`pre_save`, `post_save`, `m2m_changed`, …)
- [] When signals help vs when they hurt
- [] Caching framework (LocMem, Redis, Memcached)
- [] Per-view / template fragment / low-level cache API
- [] `cache_page` & cache keys
- [] Django async views & ORM async limitations
- [] Celery / background jobs with Django (overview)

---

**📌 Django Testing**

- [] `TestCase` vs `SimpleTestCase` vs `TransactionTestCase`
- [] Django test client
- [] Factories / fixtures patterns
- [] Testing models, views, and forms
- [] Overriding settings in tests
- [] Parallel tests & database isolation

---

**📌 DRF Foundations**

- [] Django REST Framework overview
- [] Why DRF on top of Django (not replacing it)
- [] Request/Response objects in DRF
- [] `APIView` basics
- [] Broader REST principles with DRF
- [] Browsable API
- [] Content negotiation
- [] Status codes & idiomatic error shapes

---

**📌 Serializers**

- [] Serializer vs ModelSerializer
- [] Field types & `source`
- [] Nested serializers
- [] Read-only vs write-only fields
- [] `create` / `update` overrides
- [] Validation (`validate_<field>`, object-level `validate`)
- [] `SerializerMethodField`
- [] Hyperlinked vs primary-key relations
- [] SerializerContexts & passing `request`
- [] Partial updates (`partial=True`)

---

**📌 Views, ViewSets & Routers**

- [] Generic API views (`ListAPIView`, `RetrieveAPIView`, …)
- [] Mixins composition
- [] ViewSets (`ModelViewSet`, `ReadOnlyModelViewSet`)
- [] `@action` custom endpoints
- [] Routers (`DefaultRouter`, `SimpleRouter`)
- [] URL structure DRF generates
- [] FBV with `@api_view` (when still useful)
- [] Choosing APIView vs generics vs ViewSet

---

**📌 DRF Auth, Permissions & Throttling**

- [] Authentication classes (Session, Token, JWT, Basic)
- [] `IsAuthenticated`, `IsAdminUser`, `AllowAny`
- [] DjangoModelPermissions & DjangoObjectPermissions
- [] Custom permission classes
- [] Throttling (Anon/User/Scoped rates)
- [] CORS with DRF (`django-cors-headers`)
- [] CSRF interaction with session auth APIs
- [] Multi-tenant / object-level auth patterns

---

**📌 Filtering, Pagination, Versioning & Docs**

- [] Pagination (PageNumber, LimitOffset, Cursor)
- [] Filtering (`DjangoFilterBackend`, SearchFilter, OrderingFilter)
- [] Custom filter backends
- [] API versioning strategies in DRF
- [] Schema generation & OpenAPI (drf-spectacular / coreapi legacy)
- [] Parsers & renderers
- [] Exception handling (`EXCEPTION_HANDLER`)
- [] Idempotency & safe methods

---

**📌 DRF Performance & Production Patterns**

- [] Serializer performance & avoiding overfetch
- [] `select_related` / `prefetch_related` in `get_queryset`
- [] Pagination as a performance tool
- [] Caching API responses
- [] Write patterns: nested writes, transactions in `perform_create`
- [] File uploads in DRF
- [] Rate limiting at API gateway vs DRF throttle
- [] Deploying Django+DRF (settings split, WhiteNoise/static, Gunicorn)
- [] Observability: logging, Sentry, health checks

---

**📌 Advanced / Interview Differentiating**

- [] Service layer vs “fat models / fat views”
- [] CQRS-ish read/write serializer split
- [] Event-driven hooks around Django (outbox overview)
- [] Multi-database and read replicas with Django
- [] GraphQL alongside Django (overview only)
- [] Channels / WebSockets overview
