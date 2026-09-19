# Django & DRF

A deep-dive companion to `Django & DRF Topics.md`. Each heading matches the checklist; under every topic: **what it is**, **why it matters**, **how it works**, and **interview-ready nuance**.

*Related:* `Python Guide.md` / `FastAPI Guide.md` for language and alternate API stacks; this doc focuses on **Django MVT, ORM, and DRF APIs**.

---

**📌 Django Foundations**
### Django overview & MVT architecture

Django is a batteries-included Python web framework: ORM, admin, auth, forms, templates, and an app/project layout. Its architecture is often called **MVT** (Model–View–Template): models own data and schema, views hold request logic, templates render HTML (or you skip templates and return JSON via DRF).

**Why it matters:** Interviews expect you to map Django pieces to MVC mental models and explain what “batteries included” buys you versus microframeworks.

**How it works:** A request hits URLConf → middleware → view → (ORM / forms / serializers) → response. The ORM generates SQL; the admin and auth reuse the same models.

**Nuance:** Django shines for CRUD-heavy products, admin-backed ops tools, and teams that want conventions. For thin async JSON microservices, FastAPI/Flask may fit better — but Django + DRF remains dominant in many enterprise Python shops.

---
### Django vs Flask vs FastAPI vs Express

| | Django | Flask | FastAPI | Express |
|---|---|---|---|---|
| Style | Full stack + ORM | Micro, WSGI | ASGI, typed APIs | Node micro |
| Validation | Forms / DRF serializers | Manual / extensions | Pydantic | Manual / Joi/Zod |
| Admin | Built-in | Extensions | N/A | N/A |
| Async | Evolving (ASGI views) | Limited | Native | Native |
| Best for | Apps + APIs + admin | Small/flexible apps | Modern JSON APIs | JS full-stack |

**Interview stance:** Choose Django when you need ORM + auth + admin + conventions in one place. Flask for minimal control. FastAPI for greenfield typed ASGI APIs. Express when the stack is Node. “Best” is team and domain, not benchmarks alone.

---
### Project vs App structure

A **project** is the deployable site: `settings`, root `urls`, WSGI/ASGI entry. An **app** is a reusable feature package (`models`, `views`, `urls`, `admin`).

```text
mysite/                 # project
  settings.py
  urls.py
  wsgi.py / asgi.py
catalog/                # app
  models.py
  views.py
  urls.py
  apps.py
```

**Why split:** Apps isolate domains (users, billing, catalog). Multiple apps compose one project; well-designed apps can be reused across projects.

**Nuance:** Don’t create one giant `core` app for everything. Prefer domain apps, keep project package thin, and avoid circular imports between apps (shared `common` carefully).

---
### `django-admin` / `manage.py` essentials

`django-admin` is the global CLI; `manage.py` is the project-local wrapper that sets `DJANGO_SETTINGS_MODULE` and calls the same commands.

```bash
django-admin startproject mysite
python manage.py startapp catalog
python manage.py runserver
python manage.py makemigrations && python manage.py migrate
python manage.py createsuperuser
python manage.py shell
python manage.py test
```

**Interview tip:** Know the difference between `startproject` vs `startapp`, and that production never relies on `runserver`. Custom management commands (`manage.py mycmd`) are how you run ops scripts inside Django’s environment.

---
### Settings module (`settings.py`, env-based config)

`settings.py` (or a package) is Django’s central config: `INSTALLED_APPS`, `DATABASES`, `MIDDLEWARE`, `AUTH_USER_MODEL`, `SECRET_KEY`, etc. Imported once via `DJANGO_SETTINGS_MODULE`.

**Env-based pattern:**

```python
import os
DEBUG = os.environ.get("DJANGO_DEBUG", "0") == "1"
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
DATABASES = {"default": {"ENGINE": "...", "NAME": os.environ["DB_NAME"], ...}}
```

Often split: `base.py`, `local.py`, `prod.py`, or use `django-environ` / `pydantic-settings`.

**Nuance:** Never commit secrets. Different settings for test (`DJANGO_SETTINGS_MODULE=...test`). Changing `AUTH_USER_MODEL` after migrations is painful — set it before first migrate.

---
### WSGI vs ASGI in Django

**WSGI** (`wsgi.py`) — classic sync Python web interface. Gunicorn/uWSGI workers run sync views.  
**ASGI** (`asgi.py`) — async-capable; supports HTTP + WebSockets (Channels), async views, and ASGI servers (Uvicorn/Daphne).

```python
# asgi.py
application = get_asgi_application()
```

**When it matters:** Sync ORM-heavy CRUD → WSGI is fine and battle-tested. WebSockets, SSE, or many concurrent I/O waits → ASGI. Mixing sync ORM calls inside `async def` views can block the event loop — use sync_to_async or keep ORM in sync views.

**Interview:** Django supports both; Channels needs ASGI. “Django is sync-only” is outdated.

---
### Development server vs production servers (Gunicorn/Uvicorn + Nginx)

`runserver` is single-process, auto-reloading, not hardened — **dev only**.

**Production typical stack:**
- **Gunicorn** (WSGI) or **Gunicorn + UvicornWorker** / **Uvicorn** (ASGI)
- **Nginx** (or Caddy) as reverse proxy: TLS, static files, buffering, rate limits
- Multiple workers/processes for concurrency

```bash
gunicorn mysite.wsgi:application -w 4 -b 0.0.0.0:8000
# ASGI:
gunicorn mysite.asgi:application -k uvicorn.workers.UvicornWorker
```

**Nuance:** Nginx terminates TLS and serves `/static/`; app workers handle dynamic requests. Tune workers to CPU/memory; don’t run `DEBUG=True` or `runserver` in prod.

---
### Apps, `INSTALLED_APPS`, and AppConfig

Apps must be listed in `INSTALLED_APPS` for models, admin, template tags, and checks to load. Prefer the AppConfig path:

```python
INSTALLED_APPS = [
    "django.contrib.admin",
    "catalog.apps.CatalogConfig",
]
```

```python
# catalog/apps.py
class CatalogConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "catalog"
    def ready(self):
        import catalog.signals  # noqa: F401
```

**Why AppConfig:** Customize verbose names, set `default_auto_field`, register signals in `ready()` (avoid importing signals at module top in ways that cause AppRegistryNotReady).

**Order note:** Some apps depend on others (e.g. admin needs auth). Third-party packages document required install order.

---
### Request/response cycle overview

1. Web server → WSGI/ASGI handler  
2. Middleware **process_request** (top → bottom of `MIDDLEWARE`)  
3. URL resolver matches path → view  
4. View runs (FBV/CBV/DRF); may hit ORM, cache, external APIs  
5. Response built (`HttpResponse` / DRF `Response`)  
6. Middleware **process_response** (bottom → top)  
7. Exceptions → `process_exception` / handlers → error response  

**Interview model:** Middleware is an onion around the view. Auth populates `request.user`; CSRF validates unsafe methods; sessions load cookies. DRF adds its own auth/permission/throttle layers *inside* the view dispatch after Django middleware.

---
### Django MTV vs classic MVC naming

Classic **MVC:** Model, View (UI), Controller (input).  
Django **MTV:** Model, Template (UI), View (controller-like request handler).

Django’s “View” is closer to a controller; “Template” is the presentation. For APIs, templates drop out and serializers + DRF views fill the presentation/controller roles.

**Why interviews ask:** Shows you aren’t confused by naming. Don’t say Django has no controllers — the view *is* the controller. Models should stay domain-focused; views orchestrate.

---

**📌 Models & ORM**
### Models as the source of truth

Django models are Python classes mapping to DB tables. They define fields, relationships, constraints, and often domain methods. Migrations are generated *from* model changes — the model (plus migration history) is the schema source of truth in Django apps.

```python
class Order(models.Model):
    status = models.CharField(max_length=20)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Why it matters:** Changing the DB by hand without migrations drifts environments. Fat models vs service layer is a design debate, but schema ownership stays with models + migrations.

**Nuance:** `Meta.constraints` / indexes belong on the model so migrations capture them. Don’t treat the live DB as authoritative over model code.

---
### Field types (CharField, TextField, IntegerField, DecimalField, DateTimeField, JSONField, etc.)

Common fields:

| Field | Use |
|---|---|
| `CharField(max_length=)` | Short strings (required max_length) |
| `TextField` | Long text |
| `IntegerField` / `BigIntegerField` | Integers |
| `DecimalField(max_digits, decimal_places)` | Money/precise decimals — prefer over `FloatField` |
| `BooleanField` | True/False |
| `DateTimeField` | Timestamps (`auto_now`, `auto_now_add`) |
| `JSONField` | Structured JSON (Postgres/MySQL/SQLite modern) |
| `EmailField`, `URLField`, `UUIDField`, `FileField` | Specialized |

**Interview:** Money → `DecimalField`. Unbounded text → `TextField`. Prefer explicit `null`/`blank` policy: `null` is DB NULL; `blank` is form/validation empty. For strings, usually `null=False, blank=True` with `""` rather than NULL.

---
### Primary keys & `UUIDField` / custom PKs

Default PK is `BigAutoField` (`id`). Override with `primary_key=True` on another field:

```python
id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
```

**Why UUID PKs:** Hide sequential IDs, merge DBs easier, generate IDs client-side. Tradeoffs: larger indexes, less cache-friendly order, harder debugging than integers.

**Nuance:** Changing PK type after data exists is a hard migration. Natural keys as PKs (email, slug) couple identity to mutable business data — usually prefer surrogate keys + `unique=True` on naturals.

---
### Relationships: ForeignKey, OneToOneField, ManyToManyField

```python
class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name="books")
    # OneToOneField: profile ↔ user
    # ManyToManyField: books ↔ tags (through table)
```

- **ForeignKey** — many-to-one (many books → one author)  
- **OneToOneField** — specialized FK with uniqueness (user profile)  
- **ManyToManyField** — implicit through table, or explicit `through=` model for extra fields  

**Access:** `book.author`, `author.books.all()`, `book.tags.add(tag)`. Interview: know the SQL (FK column vs join table) and when you need an explicit through model.

---
### `on_delete` behaviors (CASCADE, PROTECT, SET_NULL, …)

Required on ForeignKey/OneToOne — what happens when the referenced row is deleted:

| Behavior | Effect |
|---|---|
| `CASCADE` | Delete dependents |
| `PROTECT` / `RESTRICT` | Block delete if dependents exist |
| `SET_NULL` | Set FK to NULL (`null=True` required) |
| `SET_DEFAULT` | Set to default |
| `DO_NOTHING` | DB must handle (usually risky) |
| `SET(...)` | Callable/value |

**Interview stance:** Don’t default everything to `CASCADE`. Orders referencing users often `PROTECT` or soft-delete. `SET_NULL` for optional ownership. Explain data-loss risk of CASCADE in production.

---
### `related_name` & reverse relations

`related_name` names the reverse accessor from the related model. Default is `modelname_set`.

```python
author = models.ForeignKey(Author, related_name="books", on_delete=models.CASCADE)
# author.books.all()
```

Use `related_name="+"` to disable reverse relation. For symmetrical clashes (two FKs to same model), set distinct `related_name`s.

**`related_query_name`:** Controls filter lookups (`Book.objects.filter(author__name=...)` vs custom). Reverse relations are why `select_related`/`prefetch_related` matter for performance.

---
### Model `Meta` options (ordering, unique_together / UniqueConstraint, indexes)

```python
class Meta:
    ordering = ["-created_at"]
    constraints = [
        models.UniqueConstraint(fields=["org", "slug"], name="uniq_org_slug"),
    ]
    indexes = [models.Index(fields=["status", "-created_at"])]
    # unique_together = [["org", "slug"]]  # legacy; prefer UniqueConstraint
```

Other common: `verbose_name`, `db_table`, `abstract = True`, `proxy = True`.

**Nuance:** Default `ordering` adds ORDER BY to every query — can surprise performance; prefer explicit `.order_by()` when needed. Prefer `UniqueConstraint` over `unique_together` for names, conditions, and deferred uniqueness.

---
### `__str__`, custom methods, and model properties

```python
def __str__(self):
    return f"{self.title} ({self.pk})"

def mark_paid(self):
    self.status = "paid"
    self.save(update_fields=["status"])

@property
def is_open(self):
    return self.status == "open"
```

`__str__` appears in admin and debugging — keep it cheap (no extra queries). Methods encapsulate state transitions; properties are derived read-only views.

**Tradeoff:** Business logic on models is discoverable but can bloat models and hide I/O. Heavy workflows often move to services while models keep invariants and simple transitions.

---
### Validators on fields & models

Field validators run on full_clean / ModelForm / DRF (with care):

```python
from django.core.validators import MinValueValidator

price = models.DecimalField(..., validators=[MinValueValidator(0)])

def clean(self):
    if self.end < self.start:
        raise ValidationError("end before start")
```

`clean_<field>` on forms; model `clean()` for cross-field rules. **Important:** `Model.save()` does *not* call `full_clean()` by default — validation must be triggered (forms, serializers, explicit `full_clean()`).

**Interview:** ORM constraints (`CheckConstraint`) enforce at DB; validators enforce at app layer — use both for defense in depth.

---
### Multi-table inheritance vs abstract base classes vs proxy models

| Pattern | DB | Use |
|---|---|---|
| **Abstract base** (`abstract=True`) | No table; fields copied | Shared fields/methods |
| **Multi-table inheritance** | Parent + child tables, implicit OneToOne | True subtype with extra columns |
| **Proxy** (`proxy=True`) | Same table | Different Python behavior/managers/admin |

```python
class Timestamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        abstract = True
```

**Interview stance:** Prefer abstract bases or composition (FK) over multi-table inheritance — joins and polymorphism get awkward. Proxies for “same data, different API.”

---
### Soft deletes patterns (and why Django has no built-in)

Soft delete: set `deleted_at` / `is_deleted` instead of removing rows. Custom manager filters “alive” rows:

```python
class SoftDeleteQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(deleted_at__isnull=True)

def soft_delete(self):
    self.deleted_at = timezone.now()
    self.save(update_fields=["deleted_at"])
```

**Why no built-in:** Soft delete interacts badly with unique constraints, CASCADE, M2M, and “deleted” visibility everywhere. Django keeps hard DELETE simple; apps opt into soft delete consciously.

**Pitfalls:** Unique on email must include deleted state or use partial unique indexes; FKs to soft-deleted rows still “exist.”

---

**📌 Migrations**
### Why migrations exist

Migrations version the schema alongside code: reproducible deploys, peer review of DB changes, rollback paths, and multi-environment consistency. Without them, “works on my machine” schema drift kills teams.

Django’s migration system records applied migrations in `django_migrations` and applies pending ones in dependency order.

**Interview:** Migrations are code. Treat them as first-class — review SQL, avoid editing applied migrations on shared branches, and never “fix prod by hand” without a matching migration.

---
### `makemigrations` vs `migrate`

- **`makemigrations`** — detects model changes, writes migration files under `app/migrations/`  
- **`migrate`** — applies unapplied migrations to the database  

```bash
python manage.py makemigrations catalog
python manage.py migrate
python manage.py showmigrations
python manage.py sqlmigrate catalog 0003
```

**Nuance:** Always review generated migrations. Empty migrations or `SeparateDatabaseAndState` appear in advanced refactors. CI often runs `makemigrations --check` to catch uncommitted model changes.

---
### Migration files anatomy

A migration is a class with `dependencies` and `operations`:

```python
class Migration(migrations.Migration):
    dependencies = [("catalog", "0002_book")]
    operations = [
        migrations.AddField(model_name="book", name="isbn", field=...),
    ]
```

Operations: `CreateModel`, `AddField`, `AlterField`, `RenameField`, `DeleteModel`, `RunPython`, `RunSQL`, `AddConstraint`, etc.

**Interview:** Dependency graph allows parallel app migrations. Circular deps need careful empty migrations or reordering. `atomic = False` for Postgres operations that can’t run in a transaction (some creates/indexes historically).

---
### Data migrations (`RunPython`)

Schema migrations change structure; **data migrations** transform rows:

```python
def forwards(apps, schema_editor):
    Book = apps.get_model("catalog", "Book")
    Book.objects.filter(status="").update(status="draft")

class Migration(migrations.Migration):
    operations = [migrations.RunPython(forwards, migrations.RunPython.noop)]
```

Use **`apps.get_model`** — historical model, not your current `models.py` (avoids broken old migrations when code changes).

**Nuance:** Provide reverse when feasible. Keep data migrations idempotent if re-run risk exists. Large data changes may need batched updates outside a single long transaction.

---
### Squashing migrations

`squashmigrations` combines many migrations into fewer files to speed fresh installs and reduce clutter:

```bash
python manage.py squashmigrations catalog 0001 0020
```

**When:** Long history, slow test DB setup. **Caveats:** Once squashed migrations are applied in prod, replace carefully; remove old files only when all environments have the squash. Squash can struggle with complex `RunPython` / circular deps.

**Interview:** Squashing is optimization, not required for correctness.

---
### Fake migrations & zero migrations pitfalls

- **`--fake`** — mark migration applied without running SQL (schema already matches)  
- **`--fake-initial`** — fake initial CreateModel if tables exist  
- **`migrate app zero`** — unapply all migrations for an app (destructive)

**Pitfalls:** Faking incorrectly → Django thinks schema matches when it doesn’t (or vice versa). Zeroing in prod drops tables. Always `sqlmigrate` / inspect DB before faking.

**When fake is legit:** Recovering from partial manual schema, or aligning a restored DB with migration history — document it.

---
### Handling migration conflicts on teams

Two branches each add `0004_*.py` → merge conflict on migration graph.

**Fix pattern:**
1. Merge code  
2. Delete or rename conflicting leaf migrations if needed  
3. `makemigrations --merge` to create a merge migration, *or* resequence numbers and set dependencies manually  

**Prevention:** Small migrations, don’t edit applied migrations, communicate schema ownership, run migrations in CI. Never rewrite migration history that already shipped to shared environments.

---

**📌 QuerySets & Database Access**
### QuerySets are lazy

QuerySets don’t hit the DB until evaluated: iteration, `list()`, `bool()`, `len()`, indexing/slicing (with caveats), `repr` in shell sometimes, or explicit `.get()`/aggregates.

```python
qs = Book.objects.filter(status="published")  # no SQL yet
qs = qs.filter(year__gte=2020)               # still lazy, cloned
books = list(qs)                              # SQL runs
```

**Why it matters:** You can compose filters in services/views safely. Accidental evaluation in loops causes N+1. Caching: reusing an evaluated queryset doesn’t re-hit DB; cloning with more filters does.

**Interview:** “Lazy” ≠ “async”; it means deferred execution.

---
### `filter`, `exclude`, `get`, `create`, `update`, `delete`

```python
Book.objects.filter(author=a)           # queryset
Book.objects.exclude(status="draft")
Book.objects.get(pk=1)                  # exactly one or DoesNotExist / MultipleObjectsReturned
Book.objects.create(title="...")        # insert + return instance
Book.objects.filter(...).update(status="x")  # SQL UPDATE, no save() signals per row
Book.objects.filter(...).delete()       # SQL DELETE (collector may cascade)
```

**Nuance:** `update()`/`delete()` on querysets skip per-instance `save()`/`delete()` and most signals (bulk). `get_or_create` / `update_or_create` for upserts — watch race conditions (use constraints + handling IntegrityError).

---
### Lookups (`exact`, `iexact`, `contains`, `in`, `gt/gte`, `isnull`, …)

Field lookups use double-underscore syntax:

```python
Book.objects.filter(title__icontains="django")
Book.objects.filter(year__gte=2020, author_id__in=ids)
Book.objects.filter(published_at__isnull=True)
Book.objects.filter(author__name__iexact="ada")  # join
```

Common: `exact` (default), `iexact`, `contains`/`icontains`, `startswith`, `in`, `gt`/`gte`/`lt`/`lte`, `range`, `isnull`, `date`, JSON lookups on supported backends.

**Interview:** `__` both means lookup and relation traverse. Prefer `author_id=` over `author=` when you already have the PK (avoids fetching related object).

---
### `Q` objects & complex OR/AND queries

Default chained `filter()` is AND. For OR/NOT, use `Q`:

```python
from django.db.models import Q
Book.objects.filter(Q(status="pub") | Q(featured=True), year__gte=2020)
Book.objects.filter(~Q(status="draft"))
```

**Why:** Dynamic query building from query params. Combine with `&`, `|`, `~`.

**Nuance:** Mixing `filter(Q(...) | Q(...), other=1)` — understand precedence. For complex trees, build `Q` objects in a loop. Overusing OR can prevent index use — know when to restructure.

---
### `F` expressions & database-side updates

`F` references column values in the DB — avoids racey read-modify-write in Python:

```python
from django.db.models import F
Book.objects.filter(pk=1).update(views=F("views") + 1)
Product.objects.filter(stock__gt=0).update(stock=F("stock") - 1)
```

Also in annotations and filters (`price__gt=F("cost")`).

**Interview:** Pair with `select_for_update` or constraints for inventory. Expressions (`Value`, `Func`, `Case`/`When`) compose advanced SQL without raw strings.

---
### Aggregations & annotations (`Count`, `Sum`, `Avg`, …)

```python
from django.db.models import Count, Avg, Sum
Author.objects.annotate(n=Count("books")).filter(n__gte=5)
Book.objects.aggregate(avg=Avg("price"), total=Sum("price"))
```

- **`annotate`** — per-row computed fields on a queryset  
- **`aggregate`** — single summary dict over the queryset  

**Gotcha:** Multiple `Count`s can multiply joins — use `Count(..., distinct=True)` or subqueries. Filter on annotations with `.filter(n__gte=5)` after annotate. `order_by` + annotate interaction can surprise — check the SQL.

---
### `select_related` vs `prefetch_related`

- **`select_related`** — SQL JOIN for ForeignKey/OneToOne (single query)  
- **`prefetch_related`** — separate query(s) for reverse FK / M2M; stitches in Python  

```python
Book.objects.select_related("author")
Author.objects.prefetch_related("books")
Author.objects.prefetch_related(Prefetch("books", queryset=Book.objects.filter(status="pub")))
```

**Interview:** FK forward → `select_related`. M2M / reverse → `prefetch_related`. Nesting: `select_related("author__publisher")`. Wrong choice either over-joins or N+1s.

---
### N+1 query problem in Django

Classic bug: list parents, then access `.child` / `.related` per row → 1 + N queries.

```python
# bad
for book in Book.objects.all():
    print(book.author.name)  # query each time

# good
for book in Book.objects.select_related("author"):
    print(book.author.name)
```

**Detect:** `django-debug-toolbar`, `assertNumQueries`, logging `connection.queries`. DRF serializers that nest relations are a common N+1 source — fix in `get_queryset`, not only in the serializer.

---
### `only` / `defer` / `values` / `values_list`

- **`only(*fields)`** — load subset; deferred fields fetched on access  
- **`defer(*fields)`** — postpone large fields (e.g. TextField)  
- **`values()`** — dicts, not model instances  
- **`values_list()`** — tuples; `flat=True` for single field  

```python
Book.objects.only("id", "title")
Book.objects.values_list("id", flat=True)
```

**Tradeoff:** `only`/`defer` can cause hidden queries if you touch deferred fields. `values` is great for APIs/export but skips model methods/signals. Prefer explicit fields for list endpoints.

---
### Transactions (`atomic`, `select_for_update`)

```python
from django.db import transaction

with transaction.atomic():
    order = Order.objects.select_for_update().get(pk=id)
    order.status = "paid"
    order.save(update_fields=["status"])
```

`@transaction.atomic` on views/services. Nested atomics use savepoints. `select_for_update` row-locks until commit (watch deadlocks; use `nowait`/`skip_locked` when appropriate).

**Interview:** Autocommit is default per query. Multi-step writes that must succeed together need atomic. Avoid long transactions holding locks across external HTTP calls.

---
### Raw SQL (`raw`, `cursor`) — when it's justified

```python
Book.objects.raw("SELECT * FROM catalog_book WHERE ...")
from django.db import connection
with connection.cursor() as c:
    c.execute("SELECT ...")
    rows = c.fetchall()
```

**Justified when:** Window functions/CTEs ORM can’t express cleanly, vendor-specific features, bulk copy, proven hotspot with measured gain.

**Rules:** Parameterize always (`%s` / params) — never string-format user input. Prefer `QuerySet.annotate`/`Extra` carefully before raw. Raw querysets still map to models when columns match.

---
### Database routers (multi-DB basics)

`DATABASES` can define multiple connections; **routers** decide read/write DB per model/operation:

```python
class PrimaryReplicaRouter:
    def db_for_read(self, model, **hints):
        return "replica"
    def db_for_write(self, model, **hints):
        return "default"
    def allow_relation(self, obj1, obj2, **hints):
        return True
```

Set `DATABASE_ROUTERS`. Use `.using("replica")` for explicit control.

**Nuance:** Replicas lag — read-after-write may need primary. Migrations usually run on default. Cross-DB FKs are unsupported/limited. Routers are easy to misconfigure — test deliberately.

---

**📌 Admin, Forms & Templates (Practical)**
### Django Admin customization (`ModelAdmin`, list_display, filters, search)

Register models and tune the staff UI:

```python
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "status", "created_at")
    list_filter = ("status", "author")
    search_fields = ("title", "isbn")
    autocomplete_fields = ("author",)
    readonly_fields = ("created_at",)
```

**Why it matters:** Admin is a free internal tool for ops — interviews often ask how you’d secure and customize it (`has_module_permission`, inlines, actions).

**Nuance:** Admin is not your public API. Optimize `list_select_related`, limit `search_fields` (can be expensive), and restrict access to staff only behind VPN/SSO when possible.

---
### Forms & `ModelForm`

Django forms validate and clean input; `ModelForm` binds fields to a model:

```python
class BookForm(forms.ModelForm):
    class Meta:
        model = Book
        fields = ("title", "author", "status")
```

In views: bind `request.POST`/`FILES`, `is_valid()`, `save()`. For APIs, DRF serializers usually replace forms — but forms still power admin and classic server-rendered apps.

**Interview:** Know `fields` vs `exclude`, widgets, and that unbound vs bound forms differ (`form.is_bound`).

---
### Form validation (`clean`, `clean_<field>`)

```python
def clean_title(self):
    title = self.cleaned_data["title"].strip()
    if not title:
        raise forms.ValidationError("Required")
    return title

def clean(self):
    cleaned = super().clean()
    if cleaned.get("end") < cleaned.get("start"):
        raise forms.ValidationError("Invalid range")
    return cleaned
```

Field errors vs non-field errors. Order: field clean → `clean_<field>` → `clean()`.

**Nuance:** Always call `super().clean()` in `clean()`. Validation belongs here (or serializers), not only in the template/JS. Model `clean()` is separate unless you call `full_clean()`.

---
### CSRF in forms and APIs

Django CSRF protects cookie-authenticated session users from cross-site state changes. Templates use `{% csrf_token %}`; AJAX sends `X-CSRFToken` from the cookie.

**APIs:** Session auth (cookie) → CSRF applies to unsafe methods. Token/JWT in `Authorization` header → typically CSRF-exempt for that auth mode (no ambient cookie credential).

**Interview:** CSRF ≠ XSS defense. Exempting CSRF globally is a smell. DRF’s `SessionAuthentication` enforces CSRF; `TokenAuthentication` does not rely on cookies the same way.

---
### Template language essentials (for API-heavy roles: enough to read)

Enough to read Django templates in legacy apps:

```django
{{ book.title }}
{% if user.is_authenticated %}...{% endif %}
{% for b in books %}{{ b }}{% empty %}None{% endfor %}
{% url 'book-detail' b.pk %}
{% static 'app.css' %}
{% csrf_token %}
```

Filters: `{{ name|default:""|truncatechars:20 }}`. Inheritance: `{% extends %}` / `{% block %}`. Auto-escapes HTML by default (`|safe` is dangerous if misused).

**Interview for API roles:** You won’t write much template code daily, but recognize escaping, URL reversing, and that business logic should stay out of templates.

---
### Static files vs media files

- **Static** — CSS/JS/images shipped with the app (`STATIC_URL`, `STATIC_ROOT`, `collectstatic`)  
- **Media** — user uploads (`MEDIA_URL`, `MEDIA_ROOT`, storage backends)

WhiteNoise or Nginx serves static in production. Media often goes to S3 (`django-storages`). Never commit uploaded media; don’t put secrets in static.

**Gotcha:** `DEBUG=True` serves static differently than prod. `collectstatic` must run in deploy. Separate CDN caches for static vs private media permissions.

---

**📌 Views, URLs & Middleware**
### Function-based views (FBV)

```python
def book_list(request):
    books = Book.objects.all()[:20]
    return render(request, "books/list.html", {"books": books})
    # or return JsonResponse({"ids": [...]})
```

FBVs are explicit and easy to read for simple endpoints. Decorators: `@login_required`, `@require_POST`, `@csrf_exempt` (rare/careful).

**Tradeoff:** Duplication grows for CRUD. CBVs/generics reduce boilerplate; FBVs win for one-off logic and readability in interviews when showing a clear control flow.

---
### Class-based views (CBV) & generic CBVs

CBVs use `as_view()` and dispatch by HTTP method. Generics: `ListView`, `DetailView`, `CreateView`, `UpdateView`, `DeleteView`, `TemplateView`.

```python
class BookList(ListView):
    model = Book
    paginate_by = 20

urlpatterns = [path("books/", BookList.as_view(), name="book-list")]
```

**How:** Mixins + MRO customize `get_queryset`, `get_context_data`, `form_valid`.  

**Interview:** Explain `as_view()` and method dispatch. Prefer readability over deep mixin stacks. DRF has its own CBV hierarchy separate from django.views.generic.

---
### `URLConf`, `path`, `re_path`, `include`

```python
urlpatterns = [
    path("admin/", admin.site.urls),
    path("books/", include("catalog.urls")),
    path("books/<int:pk>/", views.book_detail, name="book-detail"),
    re_path(r"^articles/(?P<year>[0-9]{4})/$", views.year_archive),
]
```

`path` converters (`int`, `slug`, `uuid`) beat fragile regex for most routes. `include` namespaces apps. Prefer `path` over `re_path` unless you need complex patterns.

**Nuance:** URL order matters (first match wins). Trailing slash behavior interacts with `CommonMiddleware` (`APPEND_SLASH`).

---
### Named URLs & `reverse` / `redirect`

```python
path("books/<int:pk>/", views.detail, name="book-detail")

from django.urls import reverse
url = reverse("book-detail", kwargs={"pk": 1})
return redirect("book-detail", pk=1)
```

Namespaced: `reverse("catalog:book-detail")` with `include((...), namespace="catalog")`.

**Why:** Avoid hardcoding paths — rename URLs without hunting string literals. Templates use `{% url %}`. Broken names fail loudly at reverse time (good).

---
### HttpRequest / HttpResponse / JsonResponse

`HttpRequest`: `method`, `path`, `GET`, `POST`, `body`, `headers`, `user`, `session`, `FILES`, `META`.

```python
return HttpResponse("ok", content_type="text/plain")
return JsonResponse({"ok": True}, status=200)
return HttpResponseRedirect(reverse("home"))
```

`JsonResponse` encodes dicts (set `safe=False` for lists). Streaming and `FileResponse` for downloads.

**DRF note:** Prefer DRF `Request`/`Response` in APIs for negotiation and serializers; raw `JsonResponse` is fine for tiny health checks.

---
### Middleware pipeline (request/response/exception)

Middleware wraps the view like an onion. On the way in: each middleware’s request hook; on the way out: response hooks in reverse. Exceptions can short-circuit to exception handlers.

```python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    ...
]
```

**Modern style:** callable class/`__call__` middleware with `get_response`. Order is critical: Session before Auth; Security early; CorsMiddleware usually high in the list when used.

**Interview:** Middleware for cross-cutting concerns (logging request IDs, auth, locales) — not business logic for one endpoint.

---
### Common middleware (Security, Session, Auth, CSRF, Common, XFrame)

| Middleware | Role |
|---|---|
| `SecurityMiddleware` | HTTPS redirects, HSTS, some headers |
| `SessionMiddleware` | Loads `request.session` |
| `AuthenticationMiddleware` | Sets `request.user` |
| `CsrfViewMiddleware` | CSRF checks |
| `CommonMiddleware` | `APPEND_SLASH`, content length |
| `XFrameOptionsMiddleware` | Clickjacking header |

Also: `MessageMiddleware`, `LocaleMiddleware`, GZip (careful with BREACH). Know roughly what breaks if you remove Auth or Session from the stack.

---
### Custom middleware patterns

```python
class RequestIDMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    def __call__(self, request):
        request.request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        response = self.get_response(request)
        response["X-Request-ID"] = request.request_id
        return response
```

Patterns: attach context, timing metrics, force auth on `/api/`, maintenance mode. Prefer middleware libraries’ documented order.

**Avoid:** Heavy DB in middleware for every request; mutating bodies carelessly; swallowing exceptions silently.

---
### `Http404` / exception handling

```python
from django.http import Http404
from django.shortcuts import get_object_or_404

book = get_object_or_404(Book, pk=pk)
raise Http404("Not found")
```

`handler404` / `handler500` in root URLconf customize error pages. `PermissionDenied` → 403. In DRF, raise `NotFound` / `APIException` subclasses for consistent JSON errors.

**Interview:** Prefer `get_object_or_404` over catch-all except. Don’t return 500 for missing objects — 404/403 communicate correctly.

---
### File uploads & storage backends

`FileField`/`ImageField` store path; file content goes to storage backend (`default_storage`). Forms/DRF receive `request.FILES`.

```python
DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
# or modern STORAGES setting in newer Django
```

Validate size/content-type; scan if needed. Serve private files via signed URLs, not public buckets.

**Nuance:** Transactions don’t roll back S3 uploads automatically — upload after DB commit or use cleanup. Streaming large uploads carefully.

---

**📌 Django Auth, Sessions & Security**
### Built-in User model vs custom user model

`django.contrib.auth.models.User` ships with username/email/password flags. For new projects, set a **custom user model early**:

```python
AUTH_USER_MODEL = "accounts.User"
```

```python
class User(AbstractUser):
    # extra fields
    pass
```

**Why:** Swapping user model after migrations is painful (FKs everywhere). Custom model lets you use email-as-username, extra profile fields without OneToOne hacks.

**Rule:** Reference users via `settings.AUTH_USER_MODEL` / `get_user_model()`, never hard-import `auth.User` in reusable apps.

---
### `AbstractUser` vs `AbstractBaseUser`

- **`AbstractUser`** — full User (username, permissions, flags) ready to extend — usual choice  
- **`AbstractBaseUser`** — only password + last_login; you build identity fields + `PermissionsMixin` yourself  

```python
class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
```

**Interview:** Use `AbstractUser` unless you need a radically different identity model. Remember `USERNAME_FIELD`, managers (`create_user`/`create_superuser`), and admin integration.

---
### Authentication backends

Backends authenticate credentials and optionally fetch users:

```python
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]
```

`ModelBackend` checks username/password against the user model. Custom backends: LDAP, SSO, magic links — implement `authenticate` and `get_user`.

**Nuance:** Multiple backends are tried in order. Permissions can also come from backends (`has_perm`). DRF authentication classes are a separate layer for APIs.

---
### Permissions & groups

Django permissions: `app_label.codename` (e.g. `catalog.change_book`). Default model perms: add/change/delete/view. Groups bundle permissions; users have groups + user permissions.

```python
user.has_perm("catalog.change_book")
user.is_staff  # admin access
user.is_superuser  # all perms
```

Object-level perms need packages (Guardian) or custom checks. DRF maps these via `DjangoModelPermissions` / custom classes.

**Interview:** Authn (who) vs authz (what). Superuser bypasses permission checks — don’t use it for app roles in production demos carelessly.

---
### Sessions & cookies

Server-side session data keyed by sessionid cookie (default DB/cache store). `request.session["cart"] = ...` — modified sessions saved on response.

Settings: `SESSION_ENGINE`, `SESSION_COOKIE_HTTPONLY`, `SESSION_COOKIE_SECURE`, `SESSION_COOKIE_SAMESITE`.

**Vs JWT:** Sessions are revocable server-side and fit browser apps; JWTs are stateless (until denylist) and fit mobile/SPA cross-API. Cookie security flags matter as much as the framework.

---
### Password hashing (PBKDF2/Argon2 defaults)

Passwords stored as hasher strings, not plaintext. Django’s default hasher has evolved (PBKDF2 → often Argon2 when available). `user.set_password` / `check_password` handle hashing.

```python
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    ...
]
```

**Interview:** Never log passwords. Work factor (iterations/memory) trades CPU for brute-force resistance. Old hashes upgrade on login when stronger hashers are first in the list.

---
### CSRF, XSS, SQL injection defenses in Django

- **CSRF:** middleware + tokens for cookie sessions  
- **XSS:** template auto-escape; avoid `|safe` / `mark_safe` on user input; CSP helps  
- **SQLi:** ORM parameterizes queries; never f-stringify SQL with user input  

Also: validate redirects (`django.utils.http.url_has_allowed_host_and_scheme`), limit upload sizes, use `json` not `pickle` for untrusted data.

**Interview:** Framework defaults help but don’t replace secure coding. XSS in APIs often becomes XSS in the SPA consuming unsanitized HTML.

---
### Django SECURE settings & HTTPS

Production checklist (names matter for interviews):

```python
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
```

Behind proxies: `SECURE_PROXY_SSL_HEADER` so Django trusts `X-Forwarded-Proto`. TLS usually terminates at load balancer/Nginx.

**Nuance:** Enable HSTS only when HTTPS works everywhere — it’s sticky for browsers. `DEBUG=False` and allowed hosts are mandatory companions.

---
### Clickjacking / `X-Frame-Options`

Clickjacking embeds your site in an attacker iframe to hijack clicks. Django’s `XFrameOptionsMiddleware` sets `X-Frame-Options: DENY` (or `SAMEORIGIN` via `X_FRAME_OPTIONS`).

Modern complement: CSP `frame-ancestors`. Admin and login pages especially need this.

**When to relax:** Intentional embedding (trusted parents) — use `SAMEORIGIN` or per-view `@xframe_options_exempt` sparingly with CSP allowlists.

---
### Secrets: `SECRET_KEY`, never committing credentials

`SECRET_KEY` signs sessions, CSRF tokens, password reset tokens, etc. Leak = attacker can forge. Rotate carefully (session invalidation).

**Practice:** Env vars / secret manager (AWS SM, GCP Secret Manager); different keys per env; `.env` in `.gitignore`; scan CI for secrets. DB passwords, API keys, and cloud credentials follow the same rule.

**Interview:** Don’t bake secrets into Docker images or client-side JS. Config maps ≠ secret stores.

---

**📌 Signals, Caching & Async**
### Django signals (`pre_save`, `post_save`, `m2m_changed`, …)

Signals are callbacks on framework events:

```python
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
```

Common: `pre_save`, `post_save`, `pre_delete`, `post_delete`, `m2m_changed`, `request_started`. Connect in `AppConfig.ready()`.

**Bulk caveat:** QuerySet `update()`/`bulk_create` may skip some signals — know which operations fire them.

---
### When signals help vs when they hurt

**Help:** Soft cross-cutting reactions (cache invalidation, audit log) when you can’t modify every write path; decoupling third-party apps.

**Hurt:** Hidden control flow, hard to test, recursive saves, ordering surprises, side effects on bulk ops skipped. Prefer explicit service calls for core business workflows (“create user → create profile” in one function).

**Interview stance:** Signals are glue, not an architecture. If onboarding requires discovering ten receivers to understand checkout, you’ve overused them.

---
### Caching framework (LocMem, Redis, Memcached)

```python
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
    }
}
```

Backends: LocMem (dev/single process), Memcached, Redis (shared, common in prod). Cache is not durable storage — expect eviction.

**Interview:** LocMem doesn’t share across Gunicorn workers. Use Redis for multi-process/multi-host. Version keys or short TTLs for correctness.

---
### Per-view / template fragment / low-level cache API

- **Per-view:** `@cache_page(60)`  
- **Template fragment:** `{% cache 60 sidebar %}...{% endcache %}`  
- **Low-level:** `cache.set(key, value, timeout)`, `cache.get`, `cache.get_or_set`

```python
from django.core.cache import cache
data = cache.get_or_set(f"book:{pk}", lambda: expensive(), 60)
```

Invalidate deliberately on writes. Fragment caching needs careful vary-on-user keys for personalized content.

---
### `cache_page` & cache keys

`cache_page` keys by URL path (+ middleware vary headers like cookies/Accept-Language via `Vary`). Authenticated personalized pages often shouldn’t use naive `cache_page`.

`django.utils.cache` helpers and `cache_control` / `never_cache` decorators manage HTTP caching headers separately from Django’s cache framework.

**Gotcha:** Caching responses with session cookies can leak data between users if misconfigured — prefer caching data layers or vary correctly.

---
### Django async views & ORM async limitations

Django supports `async def` views on ASGI. The ORM gained `a*` methods (`aget`, `afilter` via async queryset methods in modern versions) but many ecosystem packages remain sync.

```python
async def detail(request, pk):
    book = await Book.objects.aget(pk=pk)
    return JsonResponse({"title": book.title})
```

**Limitation:** Calling sync ORM directly inside async views blocks the event loop — use async ORM APIs or `sync_to_async`. Third-party sync SDKs need the same care.

**Interview:** Async helps concurrent I/O; CPU-bound and sync-heavy stacks may see little gain.

---
### Celery / background jobs with Django (overview)

Celery (or RQ/Dramatiq/Huey) runs tasks out-of-band: emails, image processing, webhooks. Django handles request/response; workers consume a broker (Redis/RabbitMQ).

```python
@shared_task
def send_invoice(order_id): ...
# view:
send_invoice.delay(order.id)
```

**Patterns:** Idempotent tasks, retries with backoff, dead-letter queues, pass IDs not huge payloads, don’t share Django DB connections carelessly across forks.

**Interview:** Why not threads in-process? Reliability, scale, deploy isolation, and surviving web worker restarts.

---

**📌 Django Testing**
### `TestCase` vs `SimpleTestCase` vs `TransactionTestCase`

| Class | DB | Notes |
|---|---|---|
| `SimpleTestCase` | No DB | Fast; settings/views without ORM |
| `TestCase` | Transactions, rollback | Default; isolation per test |
| `TransactionTestCase` | Truncates tables | Needed for transaction/commit behavior, some concurrency tests |

`LiveServerTestCase` for full HTTP against a live thread. Prefer lightest base class that works.

**Nuance:** `TestCase` wraps tests in atomic blocks — code under test that expects real commits may need `TransactionTestCase`.

---
### Django test client

```python
from django.test import TestCase, Client

class BookTests(TestCase):
    def test_list(self):
        c = Client()
        r = c.get("/books/")
        self.assertEqual(r.status_code, 200)
        c.login(username="u", password="p")
        r = c.post("/books/", {"title": "X"})
```

Client simulates requests without a real network (middleware runs). For DRF, `APIClient` adds auth helpers (`force_authenticate`).

**Assert:** status, templates used, redirects, JSON body. Prefer `reverse()` over hardcoded paths.

---
### Factories / fixtures patterns

- **Fixtures:** JSON/YAML dumps loaded via `loaddata` — brittle for large graphs  
- **Factories:** `factory_boy` / custom helpers — flexible, explicit  

```python
class BookFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Book
    title = factory.Faker("sentence")
```

**Interview preference:** Factories for most unit/integration tests; fixtures for rare reference data. Keep factory defaults minimal to avoid slow over-creation.

---
### Testing models, views, and forms

- **Models:** constraints, methods, `full_clean` validation  
- **Forms:** valid/invalid payloads, error messages  
- **Views:** status codes, auth redirects, queryset filters, side effects  

Use `assertNumQueries` for N+1 regressions. Test permissions (anonymous/user/staff). Prefer testing behavior over private helpers.

**Pyramid:** Many fast model/form tests; fewer full request tests; sparse end-to-end.

---
### Overriding settings in tests

```python
from django.test import override_settings

@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
def test_email(self):
    ...
```

Also `self.settings(...)` context manager. Override `CACHES`, `PASSWORD_HASHERS` (faster MD5 hasher in tests), feature flags.

**Careful:** Mutating settings that affect DB connections or app loading mid-suite is fragile. Prefer dedicated test settings module for structural config.

---
### Parallel tests & database isolation

`manage.py test --parallel` runs tests in multiple processes with cloned DBs (`test_name_1`, …). Tests must not assume shared global state or fixed primary keys across processes.

**Rules:** Avoid relying on sequential PK values; don’t write to shared filesystem without unique paths; use `setUpTestData` carefully (class-level data with TestCase). Flaky parallel tests often mean hidden shared state.

---

**📌 DRF Foundations**
### Django REST Framework overview

Django REST Framework (DRF) is the standard toolkit for building Web APIs on Django: serializers, views/viewsets, routers, auth, permissions, throttling, browsable API, and negotiation.

**Why it exists:** Django’s core focuses on HTML apps; DRF adds a consistent API layer that reuses Django models, auth, and middleware while speaking JSON (and more).

**Mental model:** `Serializer` (validate/shape data) + `APIView`/`ViewSet` (HTTP verbs) + auth/permission/throttle stack + optional router. Interviews expect you to know this stack end-to-end, not only ModelViewSet magic.

---
### Why DRF on top of Django (not replacing it)

DRF is a Django app — it doesn’t replace the ORM, migrations, admin, auth models, or settings. You still deploy Django; DRF plugs into views/URLs.

**What Django provides:** models, DB, users, middleware, caching, admin.  
**What DRF adds:** serialization, API views, versioning, schema hooks, browsable UI.

**Interview:** Contrast with FastAPI (standalone ASGI + Pydantic). DRF wins when the product already lives in Django (admin, complex models). FastAPI wins for greenfield async microservices without Django’s weight.

---
### Request/Response objects in DRF

DRF wraps Django’s HttpRequest:

```python
request.data          # parsed body (JSON/form)
request.query_params  # GET params
request.user          # after authentication
request.auth          # token/credential object
```

`Response(data, status=...)` renders via content negotiation (JSON by default). Unlike `JsonResponse`, `Response` accepts native Python structures and defers rendering.

**Nuance:** `request.data` is cached; accessing it on GET is empty/irrelevant. File uploads appear in `request.data`/`FILES` depending on parser.

---
### `APIView` basics

```python
from rest_framework.views import APIView
from rest_framework.response import Response

class BookList(APIView):
    def get(self, request):
        qs = Book.objects.all()[:20]
        return Response(BookSerializer(qs, many=True).data)
    def post(self, request):
        ser = BookSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=201)
```

`APIView` adds policy hooks: authentication, permissions, throttling, and exception handling before your method runs.

**When:** Full control without generics. Foundation for understanding ViewSets (which compose APIView + mixins).

---
### Broader REST principles with DRF

DRF encourages REST-ish HTTP APIs: resources as nouns, verbs via methods, meaningful status codes, stateless requests (auth per request), and hypermedia options (hyperlinked serializers).

You can still build RPC-style `@action` endpoints — use sparingly. Idempotent GETs, careful PUTs/PATCHs, and consistent error bodies matter more than dogmatic purity.

**Interview:** REST is architectural style, not a DRF checkbox. Explain resource modeling and why `POST /books/123/publish/` might be an action vs a state field update.

---
### Browsable API

DRF’s HTML browsable API lets humans explore endpoints in a browser with forms for POST/PUT — great for development and demos.

Disable or restrict in production if it leaks schema/internal fields (`DEFAULT_RENDERER_CLASSES` without `BrowsableAPIRenderer`, or auth-gate docs).

**Interview:** It’s a renderer, not a separate app. Same view returns JSON to clients and HTML to browsers based on `Accept` negotiation.

---
### Content negotiation

DRF selects parsers/renderers from client `Accept` / `Content-Type` and server config:

```python
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
}
```

Clients ask for JSON vs browsable HTML; you can add CSV/XML/YAML renderers. Wrong `Content-Type` → 415 Unsupported Media Type.

**Nuance:** Prefer explicit JSON-only APIs in production for predictability and smaller attack surface.

---
### Status codes & idiomatic error shapes

Use idiomatic codes: `200` OK, `201` Created, `204` No Content, `400` validation, `401` unauthenticated, `403` forbidden, `404` missing, `429` throttled.

Validation errors typically:

```json
{"field": ["error message"], "non_field_errors": ["..."]}
```

`raise_exception=True` on `is_valid` returns standard 400. Custom `EXCEPTION_HANDLER` can wrap into `{ "error": { "code", "message", "details" } }` for product consistency.

**Interview:** 401 vs 403 distinction; don’t return 200 with `{success:false}` for API errors.

---

**📌 Serializers**
### Serializer vs ModelSerializer

- **`Serializer`** — explicit fields; full control; map non-model data  
- **`ModelSerializer`** — auto fields from model; `create`/`update` defaults  

```python
class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ("id", "title", "author", "status")
```

**Interview:** ModelSerializer is convenience, not magic — generated fields can over-expose. Prefer explicit `fields` (never casual `fields = "__all__"` on public APIs without review).

---
### Field types & `source`

Serializer fields mirror model types (`CharField`, `IntegerField`, `DecimalField`, `DateTimeField`, `JSONField`, …) plus relations (`PrimaryKeyRelatedField`, `SlugRelatedField`, nested serializers).

```python
author_name = serializers.CharField(source="author.name", read_only=True)
```

`source` maps to dotted attributes or callables (`source="*"` for whole object). `method_name` pairs with `SerializerMethodField`.

**Nuance:** Write paths with dotted `source` don’t auto-create nested objects — handle in `create`/`update`.

---
### Nested serializers

```python
class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ("id", "name")

class BookSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
```

Writable nested serializers need custom `create`/`update` (or packages). Deep nesting explodes payload size and write complexity.

**Interview:** Prefer nested **reads**, PK/slug writes (`author_id`) for simplicity unless the product truly needs nested writes in one request.

---
### Read-only vs write-only fields

```python
password = serializers.CharField(write_only=True)
created_at = serializers.DateTimeField(read_only=True)
```

`write_only` — accepted on input, omitted from output (passwords). `read_only` — shown on output, ignored on input (IDs, timestamps). `extra_kwargs` on ModelSerializer sets these in Meta.

**Security:** Never echo secrets. Computed fields should be read_only unless you intentionally accept them.

---
### `create` / `update` overrides

```python
def create(self, validated_data):
    tags = validated_data.pop("tags", [])
    book = Book.objects.create(**validated_data)
    book.tags.set(tags)
    return book

def update(self, instance, validated_data):
    instance.title = validated_data.get("title", instance.title)
    instance.save(update_fields=["title"])
    return instance
```

Called by `serializer.save()`. Use for M2M, nested objects, password hashing (`set_password`), and attaching `request.user`.

**Keep:** Side effects transactional (`atomic`). Don’t put HTTP concerns here — stay on validated data → model.

---
### Validation (`validate_<field>`, object-level `validate`)

```python
def validate_title(self, value):
    if "spam" in value.lower():
        raise serializers.ValidationError("Blocked")
    return value

def validate(self, attrs):
    if attrs["end"] < attrs["start"]:
        raise serializers.ValidationError({"end": "Must be after start"})
    return attrs
```

Field-level → object-level → `create`/`update`. Unique validators may need `UniqueValidator` with queryset.

**Nuance:** `validate` sees partially updated attrs on PATCH — merge with instance when needed. DB constraints still required as last line of defense.

---
### `SerializerMethodField`

```python
class BookSerializer(serializers.ModelSerializer):
    is_recent = serializers.SerializerMethodField()
    def get_is_recent(self, obj):
        return obj.created_at >= timezone.now() - timedelta(days=30)
```

Read-only computed fields. Easy N+1 if method hits relations — prefetch in the view.

**Tradeoff:** Convenient vs harder to filter/order in DB. Prefer annotate on queryset when the value should be filterable.

---
### Hyperlinked vs primary-key relations

- **PK relations** — simple integers/UUIDs; compact  
- **Hyperlinked** — URLs to related resources (`HyperlinkedModelSerializer`, `HyperlinkedRelatedField`) — more RESTful discoverability  

```python
url = serializers.HyperlinkedIdentityField(view_name="book-detail")
```

Requires `request` in serializer context for absolute URLs. Mobile clients often prefer PKs; public APIs may prefer links.

**Interview:** Explain tradeoffs — hypermedia vs payload size and client complexity.

---
### SerializerContexts & passing `request`

```python
ser = BookSerializer(book, context={"request": request})
# inside serializer:
user = self.context["request"].user
```

Generics/ViewSets pass context automatically. Needed for hyperlinked fields, absolute media URLs, and permission-aware field inclusion.

**Pattern:** Custom context keys (`{"include_private": True}`) — document them. Don’t stash huge objects in context.

---
### Partial updates (`partial=True`)

PATCH uses partial validation — required fields can be omitted:

```python
ser = BookSerializer(instance, data=request.data, partial=True)
ser.is_valid(raise_exception=True)
ser.save()
```

`UpdateAPIView`/`ModelViewSet.partial_update` set this for you. PUT conventionally expects full representation (`partial=False`), though clients vary.

**Gotcha:** Object-level `validate` must tolerate missing keys on PATCH. Defaults don’t re-apply to omitted fields.

---

**📌 Views, ViewSets & Routers**
### Generic API views (`ListAPIView`, `RetrieveAPIView`, …)

Generics combine mixins + `GenericAPIView` (queryset, serializer_class, lookup):

| Class | Method | Role |
|---|---|---|
| `ListAPIView` | GET | Collection |
| `CreateAPIView` | POST | Create |
| `RetrieveAPIView` | GET | Detail |
| `UpdateAPIView` | PUT/PATCH | Update |
| `DestroyAPIView` | DELETE | Delete |
| `ListCreateAPIView` | GET/POST | Combo |
| `RetrieveUpdateDestroyAPIView` | … | Combo |

```python
class BookList(ListCreateAPIView):
    queryset = Book.objects.select_related("author")
    serializer_class = BookSerializer
```

Override `get_queryset` / `get_serializer_class` / `perform_create` for customization.

---
### Mixins composition

Mixins supply action methods: `ListModelMixin`, `CreateModelMixin`, `RetrieveModelMixin`, `UpdateModelMixin`, `DestroyModelMixin`. ViewSets compose them:

```python
class BookViewSet(mixins.ListModelMixin,
                  mixins.RetrieveModelMixin,
                  viewsets.GenericViewSet):
    ...
```

**Why:** Pick only the verbs you need (read-only without delete). Order in MRO rarely matters for DRF mixins but keep `GenericViewSet` last.

**Interview:** ViewSet = mixins + routing glue; generics = mixins + APIView wiring without router actions map.

---
### ViewSets (`ModelViewSet`, `ReadOnlyModelViewSet`)

```python
class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated]
```

`ModelViewSet` = list/create/retrieve/update/partial_update/destroy. `ReadOnlyModelViewSet` = list/retrieve only.

**Benefit:** One class + router → CRUD URLs. **Risk:** Oversharing verbs; lock down permissions and override `get_queryset` for tenancy.

---
### `@action` custom endpoints

```python
from rest_framework.decorators import action

class BookViewSet(viewsets.ModelViewSet):
    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        book = self.get_object()
        book.status = "published"
        book.save(update_fields=["status"])
        return Response(self.get_serializer(book).data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        return Response({"count": self.get_queryset().count()})
```

`detail=True` → `/books/{pk}/publish/`. Set `permission_classes`, `serializer_class`, `url_path` as needed.

**Design:** Prefer state fields + PATCH when possible; use `@action` for genuine operations.

---
### Routers (`DefaultRouter`, `SimpleRouter`)

```python
router = DefaultRouter()
router.register("books", BookViewSet, basename="book")
urlpatterns = [path("api/", include(router.urls))]
```

`DefaultRouter` adds an API root view; `SimpleRouter` does not. `basename` required when queryset isn’t set / dynamic.

**Interview:** Routers introspect ViewSet actions to build URLs. Custom `@action` routes appear automatically.

---
### URL structure DRF generates

For a registered `books` ModelViewSet, DefaultRouter roughly yields:

- `GET/POST /api/books/`  
- `GET/PUT/PATCH/DELETE /api/books/{pk}/`  
- `@action` detail → `/api/books/{pk}/{action}/`  
- list action → `/api/books/{action}/`  

Trailing slashes follow Django/`APPEND_SLASH`. Use `reverse("book-detail", kwargs={"pk": 1})` with basename.

**Nuance:** Lookup field defaults to `pk`; set `lookup_field = "uuid"` for UUID URLs.

---
### FBV with `@api_view` (when still useful)

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def health(request):
    return Response({"status": "ok"})
```

Useful for health checks, webhooks, one-off endpoints without a class. Still gets DRF request/response and policies.

**When:** Tiny surfaces. Prefer ViewSets/generics once you have models + CRUD shape.

---
### Choosing APIView vs generics vs ViewSet

| Choice | Use when |
|---|---|
| `APIView` | Custom flows, non-CRUD, odd status logic |
| Generics | Single resource/collection endpoint, explicit URLs |
| ViewSet + router | Standard CRUD (+ few actions), less URL boilerplate |

**Interview stance:** Start from requirements. Don’t force ViewSets for everything; don’t hand-roll generics for vanilla CRUD. Consistency across the codebase beats purity.

---

**📌 DRF Auth, Permissions & Throttling**
### Authentication classes (Session, Token, JWT, Basic)

Authentication associates credentials with `request.user` / `request.auth`:

| Class | Mechanism | Typical client |
|---|---|---|
| SessionAuthentication | Cookies | Browsers / browsable API |
| TokenAuthentication | `Authorization: Token …` | Simple clients |
| JWT (SimpleJWT etc.) | Bearer JWT | SPA/mobile |
| BasicAuthentication | HTTP Basic | Rare/prod caution |

```python
"DEFAULT_AUTHENTICATION_CLASSES": [
    "rest_framework.authentication.SessionAuthentication",
    "rest_framework_simplejwt.authentication.JWTAuthentication",
]
```

Auth runs before permissions. Unauthenticated user is `AnonymousUser` unless auth fails hard (malformed token → 401).

---
### `IsAuthenticated`, `IsAdminUser`, `AllowAny`

```python
permission_classes = [IsAuthenticated]
# IsAdminUser → user.is_staff
# AllowAny → open (explicit)
```

Defaults in settings apply unless overridden per view. Prefer **deny by default** (`IsAuthenticated` globally) and open specific public endpoints with `AllowAny`.

**Interview:** Authentication ≠ permission. You can be authenticated and still 403. `AllowAny` + sensitive data is a common bug.

---
### DjangoModelPermissions & DjangoObjectPermissions

- **`DjangoModelPermissions`** — requires model add/change/delete (and view with `DjangoModelPermissionsOrAnonReadOnly` variants) mapped to HTTP methods  
- **`DjangoObjectPermissions`** — object-level via Django’s auth backend / Guardian-style perms; needs custom auth backend support  

Useful when staff permissions already live in Django admin groups. For multi-tenant SaaS, custom permissions often fit better than raw model perms.

---
### Custom permission classes

```python
from rest_framework.permissions import BasePermission

class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner_id == request.user.id
```

Implement `has_permission` (view-level) and/or `has_object_permission` (after `get_object`). Safe methods can be broader than writes.

**Pattern:** Compose with `&` / `|` operators on permission instances in modern DRF. Keep permissions pure — no heavy DB in surprising ways without caching.

---
### Throttling (Anon/User/Scoped rates)

```python
"DEFAULT_THROTTLE_RATES": {
    "anon": "100/day",
    "user": "1000/day",
    "burst": "60/min",
}
```

Classes: `AnonRateThrottle`, `UserRateThrottle`, `ScopedRateThrottle` (per-view `throttle_scope`). Returns 429 when exceeded.

**Interview:** DRF throttle is app-level, often Redis/cache-backed. For edge protection (DDoS), use API gateway/WAF too — defense in depth.

---
### CORS with DRF (`django-cors-headers`)

Browsers block cross-origin API calls unless the server sends CORS headers. `django-cors-headers` middleware configures `CORS_ALLOWED_ORIGINS`, credentials, methods.

```python
CORS_ALLOWED_ORIGINS = ["https://app.example.com"]
CORS_ALLOW_CREDENTIALS = True  # cookies; careful with *
```

**Nuance:** CORS is a browser security feature, not API auth. Mobile apps aren’t subject to CORS. Wildcard origins + credentials is invalid/dangerous.

---
### CSRF interaction with session auth APIs

If the SPA uses **session cookies** + DRF `SessionAuthentication`, unsafe methods need CSRF tokens (cookie + header). Same-site cookie strategies and CSRF headers must be configured for the frontend origin.

If the SPA uses **JWT in Authorization**, CSRF is less relevant (no cookie credential for API). Mixing both requires clear rules.

**Interview:** Explain why DRF session auth enforces CSRF and how SPAs fetch the token (`csrftoken` cookie / ensure-csrf endpoint).

---
### Multi-tenant / object-level auth patterns

Patterns:
1. **Filter queryset** — `get_queryset()` → `qs.filter(org=request.user.org)` (mandatory)  
2. **Object permissions** — `has_object_permission` / Guardian  
3. **Scoped tokens** — tenant claim in JWT  

Never rely only on hiding IDs — always enforce server-side. Combine list filtering + object checks so retrieve by PK can’t cross tenants.

**Interview:** Tenancy bugs are high-severity; show defense at queryset *and* permission layers.

---

**📌 Filtering, Pagination, Versioning & Docs**
### Pagination (PageNumber, LimitOffset, Cursor)

```python
"DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
"PAGE_SIZE": 20,
```

| Style | Query shape | Notes |
|---|---|---|
| PageNumber | `?page=2` | Simple; slow deep pages |
| LimitOffset | `?limit=&offset=` | Flexible; offset cost |
| Cursor | opaque cursor | Stable for infinite scroll; needs ordering |

Override `pagination_class` per view. Disable with `pagination_class = None` for tiny non-list endpoints.

**Interview:** Cursor pagination avoids “page drift” when data inserts; requires unique ordering fields.

---
### Filtering (`DjangoFilterBackend`, SearchFilter, OrderingFilter)

```python
filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
filterset_fields = ["status", "author"]
search_fields = ["title", "isbn"]
ordering_fields = ["created_at", "title"]
```

`django-filter` enables richer `FilterSet`s (ranges, multiple values). Search uses `icontains`/`istartswith` prefixes (`^`, `=`, `@`).

**Security:** Whitelist ordering/search fields — don’t allow arbitrary ORM paths from users.

---
### Custom filter backends

Implement `BaseFilterBackend.filter_queryset(self, request, queryset, view)`:

```python
class MineFilter(BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        if request.query_params.get("mine") == "1":
            return queryset.filter(owner=request.user)
        return queryset
```

Use for tenancy defaults, geo filters, or feature-flagged query shapes. Keep SQL efficient; combine with indexes.

**Interview:** Filters belong in backends/`get_queryset`, not in serializers.

---
### API versioning strategies in DRF

DRF supports: URL path (`/v1/`), namespace, accept-header, query param, host header versioning.

```python
"DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.URLPathVersioning"
# request.version inside views
```

**Practice:** Version when breaking changes ship; avoid versioning every cosmetic tweak. Prefer additive changes (new fields) when possible. Maintain two versions max in active support when you can.

**Interview:** URL versioning is clearest for clients; header versioning is cleaner URLs but harder to explore.

---
### Schema generation & OpenAPI (drf-spectacular / coreapi legacy)

Modern default: **drf-spectacular** (OpenAPI 3) → Swagger/ReDoc. Legacy coreapi/coreschema is outdated.

```python
# spectacular
path("api/schema/", SpectacularAPIView.as_view()),
path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema")),
```

Annotate with `@extend_schema` for odd endpoints. Keep serializers accurate — schema quality tracks serializer quality.

**Interview:** Contract-first vs code-first; generated schemas drift if views are overly dynamic.

---
### Parsers & renderers

**Parsers** turn request bodies into `request.data` (`JSONParser`, `FormParser`, `MultiPartParser`).  
**Renderers** turn `Response.data` into bytes (`JSONRenderer`, `BrowsableAPIRenderer`).

Multipart required for file uploads. Restrict parsers/renderers globally to what you support.

**415/406:** Unsupported media / not acceptable — show you understand negotiation failures.

---
### Exception handling (`EXCEPTION_HANDLER`)

```python
"EXCEPTION_HANDLER": "myapp.exceptions.custom_handler"
```

Default handler converts `APIException` and validation errors into Response. Custom handlers add error codes, correlation IDs, or hide internals in prod.

```python
def custom_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {"errors": response.data, "request_id": ...}
    return response
```

Don’t swallow unexpected exceptions — log and return generic 500.

---
### Idempotency & safe methods

Safe methods (GET/HEAD/OPTIONS) shouldn’t change state. Idempotent methods (PUT/DELETE) can be retried with same effect; POST is not idempotent by default.

For payment-like POSTs: **Idempotency-Key** header stored with result, return the same response on retry. Combine with unique constraints.

**Interview:** PATCH can be idempotent depending on semantics. Retries + timeouts without idempotency cause duplicate charges/orders.

---

**📌 DRF Performance & Production Patterns**
### Serializer performance & avoiding overfetch

Problems: nested serializers pulling huge graphs, `SerializerMethodField` queries, `fields = "__all__"`, serializing unused columns.

**Fixes:** Slim list serializers vs detail serializers; `only`/`defer`; annotations instead of methods; paginate; avoid `depth` Meta on ModelSerializer for public lists.

**Measure:** `assertNumQueries`, silk/debug toolbar. Optimize the queryset first — serializers can’t fix missing prefetch.

---
### `select_related` / `prefetch_related` in `get_queryset`

```python
def get_queryset(self):
    return (
        Book.objects.select_related("author")
        .prefetch_related("tags")
        .all()
    )
```

Centralize ORM optimization on the view/ViewSet so every action (list, retrieve, custom `@action`) benefits. Action-specific tweaks via `self.action` branching.

**Interview:** Show you fix N+1 at the source for DRF, not with ad-hoc queries inside serializer methods.

---
### Pagination as a performance tool

Unbounded list endpoints are accidental DoS. Pagination caps work per request and stabilizes latency.

Pair with indexed ordering columns. Deep `OFFSET` pages get expensive — switch to cursor for large datasets. Default page sizes (20–100) beat “return all.”

**Also:** Pagination shapes client UX — document totals (`count`) tradeoffs (extra COUNT query).

---
### Caching API responses

Options: HTTP cache headers (`Cache-Control`) for public GETs; per-view `cache_page`; low-level cache around expensive query aggregates; CDN in front of public GETs.

Authenticated personalized responses rarely share caches — cache *data* keyed by user/tenant instead of full responses.

**Invalidate** on writes (signals/services). Stale API cache bugs look like “random wrong data.”

---
### Write patterns: nested writes, transactions in `perform_create`

```python
def perform_create(self, serializer):
    with transaction.atomic():
        serializer.save(owner=self.request.user)
```

`perform_create`/`perform_update` hook ownership and side effects. Nested writes: pop children, create parent, create children inside `atomic`.

**Failure modes:** Partial creates without transactions; TOCTOU races without locks/constraints. Prefer DB uniqueness + catch `IntegrityError`.

---
### File uploads in DRF

Use `MultiPartParser` / `FormParser`, `FileField`/`ImageField` on serializers:

```python
class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("avatar",)
```

Validate size/MIME; store on S3; return URL. For large files, prefer direct-to-storage uploads (presigned POST) then confirm via API.

**Nuance:** JSON can’t carry raw files — clients use multipart or separate upload flows.

---
### Rate limiting at API gateway vs DRF throttle

| Layer | Strength |
|---|---|
| Gateway/WAF | Edge protection, IP bans, global budgets |
| DRF throttle | User/token-aware app rules, scoped endpoints |

Use both: gateway stops abuse early; DRF enforces product limits (free vs paid tiers). Don’t rely only on in-app throttles under volumetric attack.

**Interview:** Mention Redis-backed counters and consistent 429 + `Retry-After`.

---
### Deploying Django+DRF (settings split, WhiteNoise/static, Gunicorn)

Checklist:
- Split settings (`base`/`prod`); `DEBUG=False`; `ALLOWED_HOSTS`
- `SECRET_KEY` & DB from env
- Gunicorn/Uvicorn workers behind Nginx
- `collectstatic` + WhiteNoise or Nginx/CDN
- Migrate on deploy; health check endpoint
- HTTPS + secure cookies

Containerize with non-root user; don’t bake `.env` into images. Separate release of static/media.

**Interview:** Talk zero-downtime: migrate expand/contract patterns, not rewrite columns in one scary step.

---
### Observability: logging, Sentry, health checks

Structured logging (JSON) with request IDs. Sentry/OpenTelemetry for errors and traces. `/healthz` (liveness) and `/readyz` (DB/cache connectivity) for orchestrators.

Log auth failures and 5xx; don’t log tokens/PII. Metrics: latency, 4xx/5xx rates, queue depth for Celery.

**Interview:** Observability is how you debug prod — frameworks alone aren’t enough.

---

**📌 Advanced / Interview Differentiating**
### Service layer vs “fat models / fat views”

- **Fat models:** domain methods on models — discoverable, risk of god objects  
- **Fat views:** business logic in views — hard to reuse/test  
- **Service layer:** functions/classes orchestrate use cases (`OrderService.checkout`) — clear entry points  

**Pragmatic stance:** Models hold invariants and simple transitions; services orchestrate multi-model workflows and external I/O; views/serializers adapt HTTP.

**Interview:** Show you’ve felt pain of all three extremes and pick consistency for the team.

---
### CQRS-ish read/write serializer split

Use different serializers for read vs write (and list vs detail):

```python
def get_serializer_class(self):
    if self.action in ("create", "update", "partial_update"):
        return BookWriteSerializer
    return BookReadSerializer
```

Writes accept `author_id`; reads nest author. Prevents overposting and keeps payloads lean.

**Interview:** Lightweight CQRS — separate models optional; separate DTOs (serializers) alone already help.

---
### Event-driven hooks around Django (outbox overview)

Publishing events in the same request as a DB write can fail after commit or commit after publish — dual-write problem.

**Outbox pattern:** Write business row + outbox row in one transaction; a worker publishes outbox events to Kafka/SQS and marks them sent.

Signals/Celery can approximate but outbox gives stronger reliability. Useful for “order placed → email/search index/analytics.”

**Interview:** Name dual-write and why transactions + outbox beat “fire Celery then save.”

---
### Multi-database and read replicas with Django

Use routers or `.using("replica")` for read scaling. Pin writes and read-after-write to primary. Migrations on primary; replicas stream WAL.

**Caveats:** Cross-DB joins unsupported; transactions don’t span DBs; lag causes stale reads. Test failover.

**Interview:** Explain eventual consistency of replicas and when you’d force primary reads (just after create).

---
### GraphQL alongside Django (overview only)

Graphene-Django / Strawberry can expose a GraphQL schema over Django models. Coexists with DRF — GraphQL isn’t a replacement for auth/ORM.

**Tradeoffs:** Flexible client queries vs complexity, N+1 (need DataLoader), caching difficulty, and authorization on fields. Many teams keep DRF for public APIs and GraphQL for specific BFF needs.

**Interview:** Know when GraphQL helps (variable client shapes) vs when REST/DRF is simpler.

---
### Channels / WebSockets overview

Django Channels extends Django to ASGI protocols beyond HTTP — notably **WebSockets** for realtime (chat, notifications). Consumers handle connect/receive/disconnect; channel layers (Redis) broadcast across workers.

```python
# conceptual
class NotifyConsumer(AsyncWebsocketConsumer):
    async def connect(self): ...
```

**Stack:** Daphne/Uvicorn + channel layer. Auth on connect; authorize subscriptions. Not every realtime need requires Channels — SSE or external realtime services sometimes fit better.

**Interview:** Channels is ASGI; classic WSGI Gunicorn alone isn’t enough for WebSockets.

---
