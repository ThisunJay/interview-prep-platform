# Python & Flask Guide

A deep-dive companion to the Python & Flask Topics checklist. Each heading matches the original outline; under every topic you'll find **what it is**, **why it exists**, **how it works**, and **interview-ready nuance**.

---

**✅ Python Basics**

### Python Overview & Interpreter

Python is a high-level, dynamically typed, garbage-collected language emphasizing readability. Code compiles to **bytecode** (`.pyc`) executed by the **Python Virtual Machine** inside CPython (the reference implementation). Other runtimes: PyPy (JIT), Jython, IronPython, MicroPython.

```bash
python main.py          # run a file
python -m venv .venv    # common module invocation
python -c "print(1)"    # one-liner
```

**REPL** (`python`) for exploration; **IPython**/Jupyter for data work. Interview distinction: Python is **interpreted** in the sense you don't ship machine code, but CPython still compiles to bytecode then interprets/executes it — similar mental model to Java's "bytecode + VM," without a heavy JIT by default (CPython 3.13+ exploring optional JIT).

---

### Data Types (int, float, bool, str, None)

| Type | Notes |
|---|---|
| `int` | Arbitrary precision (no overflow like Java `int`) |
| `float` | IEEE-754 double; `decimal.Decimal` for exact decimals |
| `bool` | Subclass of `int`; `True`/`False` |
| `str` | Immutable Unicode sequence |
| `None` | Sole value of `NoneType`; means "no value" |

Truthy/falsy: `None`, `0`, `0.0`, `''`, `[]`, `{}`, `set()` are falsy; most other objects are truthy. Prefer `if x is None` over `== None`. Use `isinstance(x, int)` for type checks (careful: `bool` is an `int` subclass).

---

### Variables & Dynamic Typing

Names bind to objects; types live on objects, not variables:

```python
x = 1
x = "hello"  # rebound; legal
```

Assignment does not copy (for mutables, aliases share state). Multiple names can reference one object (`a = b = []`). Delete a name with `del x` (doesn't necessarily destroy object if other refs remain).

---

### Operators

Arithmetic: `+ - * / // % **` (`/` always float; `//` floor div).  
Comparison: `== != < > <= >=` (value); `is` / `is not` (identity).  
Boolean: `and or not` (short-circuit; return operand).  
Bitwise: `& | ^ ~ << >>`.  
Membership: `in` / `not in`.  
Walrus: `:=` (see Advanced).  
Chaining: `a < b < c` works as in math.

**Gotcha:** `==` vs `is` — use `is` for `None`/singletons; `==` for values. `+` on lists concatenates; on nums adds. Matrix mul `@` for numpy-style.

---

### Control Flow (if, match, loops)

```python
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
else:
    grade = "C"

for i, item in enumerate(items):
    ...
while cond:
    ...
```

**`match`/`case`** (3.10+): structural pattern matching (see Advanced).  
`break` / `continue`; `for`/`while` may have `else` (runs if no `break` — niche). Prefer iterate directly over collections; use `range` for index patterns.

---

### Functions (args, kwargs, defaults, return)

```python
def greet(name: str, greeting: str = "Hi") -> str:
    return f"{greeting}, {name}"
```

Functions are first-class objects. Default args evaluated **once** at definition — never use mutable defaults (`def f(xs=[])` is a classic bug; use `None` then create inside). Multiple return values via tuples. Docstrings in `"""..."""`.

---

### Scope & LEGB Rule

Name lookup order: **L**ocal → **E**nclosing (closures) → **G**lobal (module) → **B**uiltins.

```python
x = "global"
def outer():
    x = "enclosing"
    def inner():
        nonlocal x  # bind to enclosing
        x = "inner"
    inner()
```

`global` / `nonlocal` for assignment into outer scopes. Reading outer names doesn't need declarations; rebinding does.

---

### Modules, Packages & Imports

A **module** is a `.py` file; a **package** is a directory with imports (namespace packages possible without `__init__.py` in modern Python).

```python
import math
from collections import defaultdict
from package.sub import util as u
```

`if __name__ == "__main__":` guards script entrypoints. Circular imports: refactor shared types, lazy import inside functions, or rethink structure. `PYTHONPATH` / editable installs (`pip install -e .`) for project imports.

---

### Virtual Environments (venv, pip, poetry)

Isolate project dependencies:

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

**pip** + `requirements.txt` is universal. **Poetry** / **uv** / **PDM** manage deps + lockfiles + builds via `pyproject.toml`. Never install project deps into system Python. Pin versions for reproducibility (`==` or lock files).

---

### *args and **kwargs

```python
def f(a, *args, b=1, **kwargs):
    ...
f(1, 2, 3, b=4, x=5)  # args=(2,3), kwargs={'x':5}
```

`*args` collects extra positional; `**kwargs` extra keywords. Use for wrappers/decorators and flexible APIs. Keyword-only args after `*`; positional-only before `/` (3.8+).

---

### Lambda Functions

Anonymous single-expression functions:

```python
sorted(users, key=lambda u: u.age)
```

Limited to expressions (no statements). Prefer `def` for anything non-trivial (stack traces, docs, reuse).

---

### Comprehensions (list, dict, set, generator)

```python
squares = [x * x for x in range(10) if x % 2 == 0]
mapping = {u.id: u.name for u in users}
unique = {x.lower() for x in names}
gen = (x * x for x in range(10**6))  # lazy
```

Readable and fast for simple transforms. Avoid nested comprehension abuse — use loops or generators. Generator expressions save memory for large streams.

---

### String Formatting (f-strings, format, %)

```python
name, age = "Ada", 36
f"{name} is {age}"           # preferred (3.6+)
"{} is {}".format(name, age)
"%s is %d" % (name, age)     # older
```

f-strings are fastest and clearest; support expressions and format specs (`f"{pi:.2f}"`). Debug: `f"{name=}"` (3.8+).

---

**✅ Data Structures**

### Lists

Ordered, mutable, heterogeneous sequences: `[]`. Amortized O(1) append; O(n) insert/pop front. Slicing `a[i:j:k]` returns a new list. Methods: `append`, `extend`, `insert`, `pop`, `remove`, `sort`, `reverse`. Prefer lists as default dynamic arrays.

---

### Tuples

Immutable ordered sequences: `(1, 2)`. Hashable if elements are hashable → usable as dict keys. Single element: `(1,)`. Unpacking: `a, b = pair`. Often for fixed records / multiple returns.

---

### Sets & Frozensets

Unordered unique hashables: `{1, 2}`. O(1) avg membership. Ops: `| & - ^`. `frozenset` is immutable/hashable. Empty set is `set()` not `{}` (`{}` is dict). Great for dedupe and membership tests.

---

### Dictionaries

Key→value maps (insertion-ordered since 3.7 language guarantee): `{"a": 1}`. Keys must be hashable. Methods: `get`, `keys`, `values`, `items`, `setdefault`, `pop`, `|` merge (3.9+). Dict views are dynamic. Prefer `dict` over `OrderedDict` unless you need its extra APIs.

---

### Collections Module (defaultdict, Counter, deque, namedtuple, OrderedDict)

| Type | Use |
|---|---|
| `defaultdict(list)` | auto-create missing keys |
| `Counter` | multiset / frequency counts |
| `deque` | O(1) append/pop both ends |
| `namedtuple` / `NamedTuple` | lightweight immutable records |
| `OrderedDict` | reorder/move_to_end APIs |
| `ChainMap` | layered mappings |

Interview favorite: `Counter(words).most_common(3)` and `defaultdict` for grouping.

---

### Arrays (array module) vs Lists

`array.array('i')` stores typed compact values (less memory than list of ints). For serious numeric work use **NumPy**. Lists store pointers to objects — flexible but heavier.

---

### Sorting (sorted, list.sort, key functions)

```python
sorted(items, key=lambda x: x.score, reverse=True)
items.sort(key=attrgetter("score"))  # in-place
```

Timsort — **stable**. `sorted` returns new list; `list.sort` mutates. Multi-key: `key=lambda x: (x.last, x.first)`. Decorate-sort-undecorate rarely needed with `key=`.

---

**✅ Object-Oriented Python**

### Classes & Objects

```python
class User:
    species = "human"  # class attribute
    def __init__(self, name):
        self.name = name
```

Everything is an object (including classes/functions). Instances get a namespace (`__dict__` unless `__slots__`). Prefer composition when inheritance hierarchies deepen.

---

### __init__ & Constructors

`__init__` initializes an already-created instance. Actual construction is `__new__` (rare to override — immutable/subclassing builtins). `__init__` should not return a value other than `None`.

---

### Instance vs Class vs Static Methods

```python
class C:
    def instance(self): ...
    @classmethod
    def from_str(cls, s): ...   # receives class; alternative constructors
    @staticmethod
    def helper(x): ...          # no self/cls; namespaced function
```

Prefer `@classmethod` for factories; `@staticmethod` sparingly (module-level function often clearer).

---

### Inheritance & super()

```python
class Admin(User):
    def __init__(self, name, level):
        super().__init__(name)
        self.level = level
```

`super()` cooperates with MRO for cooperative multiple inheritance. Always call parent init when extending state.

---

### Multiple Inheritance & MRO

Python uses **C3 linearization**. Inspect with `Class.__mro__` or `help(Class)`. Diamond problem solved by MRO. Mixins: small classes providing methods only — keep them focused; prefer composition if confused.

---

### Polymorphism & Duck Typing

"If it walks like a duck…" — objects judged by behavior (methods), not nominal type. Polymorphism via shared methods / protocols (`Iterable`, `Sized`). `isinstance` with ABCs/`Protocol` when you need explicit checks.

---

### Encapsulation (public, _protected, __private)

Convention only:

- `public` — normal
- `_single` — internal API (please don't touch)
- `__double` — name-mangled to `_Class__attr` (avoid collisions in subclasses; not true security)

No true access control like Java `private`. Properties encapsulate getters/setters idiomatically.

---

### Magic / Dunder Methods

Customize behavior: `__repr__`, `__str__`, `__eq__`, `__hash__`, `__lt__` (with `functools.total_ordering`), `__len__`, `__iter__`, `__getitem__`, `__enter__`/`__exit__`, `__call__`, `__bool__`, …

```python
def __repr__(self):
    return f"User({self.name!r})"
```

If you define `__eq__`, decide `__hash__` (mutable objects → `__hash__ = None`).

---

### Properties (@property)

```python
@property
def age(self):
    return self._age

@age.setter
def age(self, value):
    if value < 0:
        raise ValueError
    self._age = value
```

Attribute-like API with validation/computation. Prefer over getters/setters boilerplate.

---

### Dataclasses

```python
@dataclass(frozen=True, slots=True)
class Point:
    x: float
    y: float
```

Auto-generates `__init__`, `__repr__`, `__eq__` (and optional ordering/hash). Ideal for data carriers. `frozen=True` for immutability; `slots=True` (3.10+) saves memory. Prefer over hand-written boilerplate; for validation-heavy models consider Pydantic.

---

### Abstract Base Classes (abc)

```python
from abc import ABC, abstractmethod

class Repo(ABC):
    @abstractmethod
    def get(self, id): ...
```

Cannot instantiate until abstract methods implemented. `collections.abc` defines `Iterable`, `Mapping`, `Sequence`, etc. `typing.Protocol` enables structural subtyping without inheritance.

---

### Enums

```python
class Color(Enum):
    RED = 1
    GREEN = 2

class Status(str, Enum):  # string enums for JSON APIs
    ACTIVE = "active"
```

Type-safe constants; iterable; hashable. Prefer enums over magic strings/ints.

---

**✅ Intermediate Python**

### Iterators & Iterables

**Iterable:** has `__iter__` returning an iterator.  
**Iterator:** has `__next__` and `__iter__` (returns self).  
`for` loop calls `iter()` then `next()` until `StopIteration`.

One-pass: iterators exhaust. `itertools` builds powerful iterator pipelines without lists.

---

### Generators & yield

Functions with `yield` return a generator iterator — lazy, suspendable:

```python
def countdown(n):
    while n:
        yield n
        n -= 1
```

`yield from` delegates to subgenerators. Memory-efficient for streams/pipelines. Generator expressions: `(x for x in xs)`. Async generators use `async def` + `yield`.

---

### Decorators (functions & classes)

Wrappers that modify callables:

```python
from functools import wraps

def log(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        print(fn.__name__)
        return fn(*args, **kwargs)
    return wrapper

@log
def add(a, b):
    return a + b
```

`@wraps` preserves metadata. Decorators with args: nested triple functions / decorator factories. Class decorators and `@classmethod`-style stacking order: bottom decorator applied first. Flask heavily uses decorators (`@app.route`).

---

### Closures

Inner functions capturing enclosing variables:

```python
def make_adder(n):
    def add(x):
        return x + n
    return add
```

Foundation of decorators and callbacks. Late-binding gotcha in loops: capture with default arg `lambda i=i: ...`.

---

### Context Managers (with, __enter__/__exit__, contextlib)

```python
with open(path) as f:
    data = f.read()
```

Guarantees cleanup. Implement `__enter__`/`__exit__` or:

```python
from contextlib import contextmanager

@contextmanager
def timed(label):
    t0 = time.perf_counter()
    try:
        yield
    finally:
        print(label, time.perf_counter() - t0)
```

Also: `ExitStack`, `closing`, `suppress`, `nullcontext`.

---

### Exception Handling (try/except/else/finally)

```python
try:
    risky()
except ValueError as e:
    log(e)
except (TypeError, KeyError):
    ...
else:
    # no exception
    commit()
finally:
    cleanup()
```

Catch specific exceptions; avoid bare `except:`. Re-raise with `raise` / `raise New from e` (exception chaining). `else` keeps success path separate from `try`.

---

### Custom Exceptions

```python
class AppError(Exception):
    """Base app error."""

class NotFoundError(AppError):
    def __init__(self, entity, id):
        super().__init__(f"{entity} {id} not found")
        self.entity, self.id = entity, id
```

Hierarchy enables broad vs narrow catches. Prefer domain exceptions over returning `None` for errors.

---

### File I/O

```python
with open("f.txt", "r", encoding="utf-8") as f:
    for line in f:
        ...
```

Modes: `r/w/a/x`, `b` binary, `+` update. Always set `encoding` for text. Prefer `pathlib.Path.read_text()` for simple cases.

---

### pathlib & os

```python
from pathlib import Path
p = Path("data") / "file.txt"
p.exists(); p.read_text(encoding="utf-8"); p.write_text(...)
```

`pathlib` is object-oriented and cross-platform; `os`/`os.path` still common for env vars (`os.environ`), process, lower-level ops. Prefer `pathlib` for path manipulation in new code.

---

### JSON / CSV handling

```python
import json, csv
json.dumps(obj); json.loads(s)
json.dump(obj, f); json.load(f)
```

`csv.DictReader`/`DictWriter` for tabular data. For Excel: third-party libs. Note: `json` keys become str; tuples become lists — not all Python objects are JSON-serializable (`datetime` needs custom encoder or ISO strings).

---

### Copy vs Deepcopy

```python
import copy
b = a.copy()          # list/dict shallow
b = copy.deepcopy(a)  # recursive
```

Shallow copy: nested mutables still shared. Assignment `b = a` copies **reference**, not object.

---

### Mutable vs Immutable Types

**Immutable:** `int`, `float`, `str`, `tuple`, `frozenset`, `bytes` — "change" creates new object.  
**Mutable:** `list`, `dict`, `set`, most custom objects.

Immutables are hashable (if contents are) → dict keys/set members. Understanding this prevents aliasing bugs and explains dict-key rules.

---

### Shallow pitfalls (default mutable args)

```python
def append_item(x, bucket=[]):  # BUG: shared across calls
    bucket.append(x)
    return bucket

def append_item(x, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(x)
    return bucket
```

Same class of bug: shared class attributes that are mutable (`class A: items = []`).

---

**✅ Advanced Python**

### Type Hints & typing Module

```python
def get_user(id: int) -> User | None:
    ...

from typing import Optional, Iterable, Any, TypedDict, Literal
```

Hints are optional at runtime (unless you use them with tools) but enable **mypy/pyright**, better IDE help, and clearer APIs. Prefer built-in generics (`list[int]`, `dict[str, User]`) on 3.9+. `|` union on 3.10+.

---

### Generics in Python (typing / TypeVar / ParamSpec)

```python
from typing import TypeVar, Generic
T = TypeVar("T")

class Repo(Generic[T]):
    def get(self, id: int) -> T | None: ...
```

`ParamSpec` / `Concatenate` type decorators correctly. `Protocol` for structural typing. Interview: Python generics erase at runtime similar in spirit to TypeScript — checking is tool-based, not enforced by CPython.

---

### Concurrency: Threading

`threading.Thread` for I/O-bound concurrency. Shared memory requires locks (`Lock`, `RLock`, `Event`, `Queue`). GIL limits CPU parallelism of pure-Python bytecode. Use `concurrent.futures.ThreadPoolExecutor` for pools.

---

### Concurrency: Multiprocessing

Separate processes bypass GIL for CPU-bound work. `multiprocessing.Pool` / `ProcessPoolExecutor`. Higher overhead; pickle-based IPC. Careful on Windows (`if __name__ == "__main__"` guard).

---

### asyncio & async/await

Cooperative concurrency on one thread for many I/O waits:

```python
async def fetch(url):
    async with session.get(url) as resp:
        return await resp.text()

asyncio.run(main())
```

`async def` returns coroutine; `await` yields control. Use async libraries (`aiohttp`, async DB drivers). Don't call blocking I/O inside the event loop. Flask is traditionally sync WSGI; async views exist in newer Flask but FastAPI/Starlette are more native async.

---

### GIL (Global Interpreter Lock)

CPython allows only one thread to execute Python bytecode at a time. **I/O** releases GIL → threads help. **CPU-bound** Python threads don't scale on multiple cores → use multiprocessing, C extensions (numpy releases GIL), or subinterpreters (evolving). Interview must-answer for "why multiprocessing?"

---

### Memory Management & Garbage Collection

Reference counting frees objects ASAP when refcount hits 0. **Cyclic GC** (`gc` module) collects reference cycles. `del`, scopes ending, and containers dropping refs matter. Large graphs / caches can leak if referenced. Tools: `tracemalloc`, `objgraph`, memory profilers.

---

### Weak References

`weakref.ref(obj)` / `WeakValueDictionary` — references that don't keep objects alive. Useful for caches and observer patterns. Callbacks fire when objects die.

---

### Descriptors

Objects defining `__get__` / `__set__` / `__delete__` hooked into attribute access. Foundation of `property`, `classmethod`, ORM columns (SQLAlchemy/Django models). Deep interview topic for "how does `@property` work?"

---

### Metaclasses (basics)

Classes of classes — customize class creation (`type` is default metaclass). Used in ORMs/frameworks; rarely needed in app code. Prefer class decorators / `__init_subclass__` for lighter hooks.

---

### __slots__

```python
class Point:
    __slots__ = ("x", "y")
```

Prevents per-instance `__dict__` → less memory, faster attr access; no arbitrary attributes unless included. Dataclass `slots=True` automates this.

---

### functools (lru_cache, partial, wraps, reduce)

| Tool | Use |
|---|---|
| `wraps` | fix decorator metadata |
| `lru_cache` / `cache` | memoization |
| `partial` | freeze some args |
| `reduce` | fold (often clearer as loop) |
| `singledispatch` | function overloading by type |
| `total_ordering` | generate rich comparisons |

---

### itertools

Lazy building blocks: `chain`, `islice`, `groupby`, `product`, `combinations`, `cycle`, `tee`, `zip_longest`. Compose memory-efficient pipelines — interview gold for algorithm-style Python.

---

### Structural Pattern Matching (match/case)

```python
match command:
    case {"type": "add", "value": int(v)}:
        total += v
    case ["quit" | "exit"]:
        ...
    case _:
        ...
```

Matches structure (sequences, mappings, classes). Guards with `if`. More than a switch — powerful for AST/protocol handling.

---

### Walrus Operator :=

Assignment expression (3.8+):

```python
if (n := len(items)) > 10:
    print(n)
```

Avoid overuse — clarity first. Useful in `while` reads and comprehensions carefully.

---

### Packaging & Distribution (setuptools, pyproject.toml)

Modern packaging centers on `pyproject.toml` (PEP 517/518/621): metadata, deps, build backend (`setuptools`, `hatchling`, `poetry-core`). Build wheels/sdists; publish to PyPI. Editable installs for development. Know `src/` layout vs flat layout tradeoffs.

---

**✅ Testing & Quality (Python)**

### unittest

stdlib xUnit style: `TestCase`, `assertEqual`, `setUp`/`tearDown`. Discover with `python -m unittest`. Still everywhere; many prefer pytest ergonomics.

---

### pytest Basics

```python
def test_add():
    assert add(1, 2) == 3
```

Assert rewriting, rich failures, plugin ecosystem. Run `pytest`. Filename/function naming conventions (`test_*.py`).

---

### Fixtures & Parametrize

```python
@pytest.fixture
def client(app):
    return app.test_client()

@pytest.mark.parametrize("a,b,expected", [(1,2,3), (0,0,0)])
def test_add(a, b, expected):
    assert add(a, b) == expected
```

Fixtures manage setup/teardown with dependency injection of test resources. Scopes: function/class/module/session.

---

### Mocking (unittest.mock)

```python
from unittest.mock import patch, MagicMock

with patch("module.api_call", return_value=42):
    ...
```

`Mock`/`MagicMock`/`AsyncMock`; `patch` as decorator or context. Assert `assert_called_with`. Prefer mocking at boundaries (network, time, DB).

---

### Coverage

`coverage.py` / `pytest-cov` measures executed lines. Aim for meaningful coverage of critical paths, not 100% vanity. Enforce in CI.

---

### Linting & Formatting (ruff, flake8, black, isort)

**Black** — uncompromising formatter. **isort** — import order. **flake8** — lint. **Ruff** — ultra-fast linter/formatter replacing many tools. Standardize in CI + pre-commit.

---

### Type Checking (mypy / pyright)

Static analysis of hints. Gradual typing: start on critical modules. `pyright`/Pylance excellent in VS Code/Cursor. Treat type errors as first-class quality gates for larger codebases.

---

**✅ Flask Core**

### Flask Overview & WSGI

Flask is a **microframework** for web apps/APIs — minimal core, extensions for ORM, auth, etc. It implements a WSGI app (`app.wsgi_app`) conforming to PEP 3333.

**WSGI:** Python sync interface between servers (Gunicorn, uWSGI) and apps. Request comes as `environ` dict; app returns iterable of bytes. Contrast ASGI (async) used by FastAPI/Starlette.

Built on **Werkzeug** (routing, request/response) and **Jinja2** (templates).

---

### App Object & Application Factory

```python
def create_app(config_object="config.ProdConfig"):
    app = Flask(__name__)
    app.config.from_object(config_object)
    db.init_app(app)
    app.register_blueprint(api_bp)
    return app
```

**Application factory** pattern enables multiple apps (tests, different configs), avoids circular imports, and is the production-grade structure. Avoid module-level `app = Flask(__name__)` for anything beyond tiny tutorials.

---

### Routing & URL Building (url_for)

```python
@app.get("/hello")
def hello():
    return "Hi"

url_for("hello")                 # '/hello'
url_for("user", user_id=3)       # '/users/3'
url_for("static", filename="app.css")
```

`url_for` builds URLs from endpoint names — survives path changes; use it in templates/redirects instead of hardcoding.

---

### Route Variables & Converters

```python
@app.get("/users/<int:user_id>")
def user(user_id: int):
    ...
```

Built-in converters: `string`, `int`, `float`, `path`, `uuid`. Custom converters register on `app.url_map.converters`.

---

### HTTP Methods

```python
@app.route("/items", methods=["GET", "POST"])
@app.post("/items")
@app.put("/items/<int:id>")
```

Default `@app.route` allows GET (and HEAD/OPTIONS). REST APIs map methods explicitly. Method not allowed → 405.

---

### Request Object (args, form, json, files, headers)

```python
from flask import request

request.args["q"]          # query string (?q=)
request.form["email"]      # form body
request.get_json()         # JSON body
request.files["avatar"]    # uploads
request.headers["Authorization"]
request.method; request.path; request.cookies
```

`request` is a **context local** proxy — valid only in request context. Prefer `request.get_json(silent=True)` for optional JSON.

---

### Response Object & make_response

Views may return:

- string → 200 text/html
- dict/list (Flask 1.1+) → JSON
- `(body, status)` / `(body, status, headers)`
- full `Response` via `make_response`

```python
resp = make_response(render_template("x.html"), 200)
resp.headers["X-Trace"] = "1"
return resp
```

---

### jsonify & Status Codes

```python
from flask import jsonify

return jsonify(error="not found"), 404
return {"ok": True}, 201  # modern shorthand
```

`jsonify` sets `Content-Type: application/json` and handles serialization. Use correct statuses: 201 create, 204 no content, 400 validation, 401/403 auth, 404, 409 conflict, 422 unprocessable, 500.

---

### Redirects & abort

```python
from flask import redirect, url_for, abort

return redirect(url_for("index"))
abort(404)                 # raises HTTPException → error handler
abort(403, description="Nope")
```

`abort` jumps to registered error handlers — cleaner than manually building error responses everywhere.

---

### Sessions & Cookies

```python
from flask import session

session["user_id"] = user.id
session.clear()
```

Signed **cookie-based** sessions (client-side) using `SECRET_KEY`. Don't store secrets/large data; for server-side sessions use Redis/extensions. Set cookie flags: `SESSION_COOKIE_SECURE`, `HTTPONLY`, `SAMESITE`.

---

### Config Object & Environments

```python
app.config.from_object("config.ProductionConfig")
app.config.from_prefixed_env()  # FLASK_ / custom
app.config["SQLALCHEMY_DATABASE_URI"] = ...
```

Class-based configs (`Dev`, `Test`, `Prod`) + env vars. Never commit secrets. `FLASK_DEBUG=1` for development only.

---

### Blueprints

Modular route groups:

```python
api = Blueprint("api", __name__, url_prefix="/api")

@api.get("/health")
def health():
    return {"status": "ok"}

app.register_blueprint(api)
```

Each blueprint can have templates/static folders. Scales apps into packages (`auth`, `api`, `admin`). Endpoints become `api.health` for `url_for`.

---

### Application Context & Request Context

Flask uses contexts so proxies (`current_app`, `g`, `request`, `session`) work:

- **Application context** — app-level (`current_app`, `g`)
- **Request context** — per request (`request`, `session`)

Pushed automatically for requests; in CLI/shell/tests use `with app.app_context():`. Missing context → `RuntimeError: Working outside of ...`. Critical interview topic.

---

### g Object

`g` is a request-bound namespace for stash data (current user, DB connection, request id):

```python
@app.before_request
def load_user():
    g.user = user_from_session()
```

Cleared each request. Don't confuse with `session` (persists across requests via cookie).

---

### Hooks / Lifecycle (before_request, after_request, teardowns)

```python
@app.before_request
def auth():
    if not authorized() and request.endpoint not in PUBLIC:
        abort(401)

@app.after_request
def headers(resp):
    resp.headers["X-Content-Type-Options"] = "nosniff"
    return resp

@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()
```

`before_request` can abort. `after_request` must return response (skipped if unhandled exception before response — use `teardown_request` for cleanup always). Blueprint-specific hooks exist too.

---

### Error Handlers

```python
@app.errorhandler(404)
def not_found(e):
    return jsonify(error="not found"), 404

@app.errorhandler(AppError)
def app_error(e):
    return jsonify(error=str(e)), e.status_code
```

Register for HTTP codes or exception classes. API apps should return JSON consistently; HTML apps render error templates.

---

### Static Files

Default folder `static/`; URL `/static/<path>`. `url_for('static', filename='css/app.css')`. In production, often served by Nginx/CDN, not Flask. `send_from_directory` for controlled downloads.

---

### Secret Key & Security Basics

`app.secret_key` / `SECRET_KEY` signs sessions and CSRF tokens. Generate with `secrets.token_hex(32)`. Rotate carefully (invalidates sessions). Debug mode off in prod; keep dependencies updated; validate all input.

---

**✅ Flask Templates (Jinja2)**

### Rendering Templates (render_template)

```python
return render_template("user.html", user=user, title="Profile")
```

Templates live in `templates/` by default. Autoescaping on for HTML. Prefer passing explicit context over huge `**locals()`.

---

### Jinja2 Syntax (variables, filters, tests)

```jinja2
{{ user.name|e }}
{{ items|length }}
{% if user.admin %}...{% endif %}
{% for item in items %}...{% else %}empty{% endfor %}
```

Filters: `|safe`, `|default`, `|join`, `|tojson`. Tests: `is none`, `defined`. Keep logic light — complex decisions belong in Python views.

---

### Template Inheritance (extends, block)

```jinja2
{# base.html #}
<html>{% block body %}{% endblock %}</html>

{# page.html #}
{% extends "base.html" %}
{% block body %}<h1>Hi</h1>{% endblock %}
```

Single layout, many pages. `super()` calls parent block content.

---

### Macros & Includes

`{% include "nav.html" %}` for fragments. `{% macro input(name) %}...{% endmacro %}` for reusable form controls — Jinja's "functions."

---

### Context Processors

```python
@app.context_processor
def inject_globals():
    return {"config_name": app.config["ENV"], "now": datetime.utcnow}
```

Inject variables into **all** templates. Use sparingly for truly global chrome (current user, csrf_token with Flask-WTF).

---

### Autoescaping & XSS Prevention

Jinja escapes `{{ var }}` by default in HTML templates — prevents XSS. `|safe` / `Markup` marks trusted HTML only. Never mark user input safe. For JSON in script tags use `|tojson`.

---

### Custom Filters

```python
@app.template_filter("datetimeformat")
def datetimeformat(value, fmt="%Y-%m-%d"):
    return value.strftime(fmt)
```

Register filters/tests for domain formatting — keep them pure and small.

---

**✅ Flask Forms & Validation**

### WTForms / Flask-WTF

Flask-WTF integrates WTForms with Flask (CSRF, file support, config):

```python
class LoginForm(FlaskForm):
    email = StringField(validators=[DataRequired(), Email()])
    password = PasswordField(validators=[DataRequired()])
    submit = SubmitField("Login")
```

In view: `form.validate_on_submit()` combines POST + validate.

---

### CSRF Protection

Flask-WTF CSRFProtect embeds tokens in forms; validates on POST. For APIs using JSON + token auth, CSRF often disabled/not applicable; for cookie-session browser forms, **keep CSRF on**. AJAX: send token in header `X-CSRFToken`.

---

### Field Types & Validators

Fields: `StringField`, `PasswordField`, `BooleanField`, `SelectField`, `FileField`, `HiddenField`, …  
Validators: `DataRequired`, `Email`, `Length`, `EqualTo`, `Regexp`, custom validators.

Server-side validation is mandatory — client-side is UX only.

---

### Form Handling Patterns (GET/POST)

```python
@app.route("/login", methods=["GET", "POST"])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        # authenticate, redirect (PRG pattern)
        return redirect(url_for("index"))
    return render_template("login.html", form=form)
```

**Post/Redirect/Get** avoids duplicate form submits on refresh.

---

### File Uploads

```python
file = form.avatar.data  # FileStorage
filename = secure_filename(file.filename)
file.save(path)
```

Always `secure_filename`; validate extension/MIME/size; store outside repo or in object storage; serve carefully. Config `MAX_CONTENT_LENGTH` to cap body size.

---

**✅ Flask & Databases**

### SQLAlchemy Core vs ORM Overview

**Core:** SQL expression language — explicit, powerful, closer to SQL.  
**ORM:** Map classes to tables; unit of work pattern; relationships.

Flask apps typically use ORM via Flask-SQLAlchemy. Know Core for complex queries/performance.

---

### Flask-SQLAlchemy Setup

```python
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql+psycopg://..."
    db.init_app(app)
    return app
```

`init_app` factory pattern. Modern Flask-SQLAlchemy 3.x aligns with SQLAlchemy 2.0 style (`db.session.execute(select(...))`).

---

### Models & Relationships

```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    posts = db.relationship("Post", back_populates="author")

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    author_id = db.Column(db.ForeignKey("user.id"))
    author = db.relationship("User", back_populates="posts")
```

Relationships: one-to-many, many-to-many (`secondary` table), one-to-one. Prefer explicit `back_populates`. Lazy options: `select`, `joined`, `selectin`, `raise` — `selectin` often a good default to avoid N+1.

---

### Sessions & Transactions

`db.session` is the unit of work. `add`, `commit`, `rollback`, `flush`. Pattern:

```python
try:
    db.session.add(obj)
    db.session.commit()
except Exception:
    db.session.rollback()
    raise
```

Teardown handlers / scoped sessions manage cleanup. Keep sessions short (per request typical).

---

### Queries (filter, get, joins)

```python
# SQLAlchemy 2.0 style
user = db.session.get(User, 1)
users = db.session.scalars(select(User).where(User.active.is_(True))).all()
```

Legacy: `User.query.filter_by(email=...).first()`. Prefer `scalars`/`execute` in new code. Joins for related filters; `options(selectinload(User.posts))` for eager loading.

---

### Migrations (Flask-Migrate / Alembic)

Alembic (via Flask-Migrate) versions schema:

```bash
flask db init
flask db migrate -m "add users"
flask db upgrade
```

Never rely only on `db.create_all()` in production. Review autogenerate diffs — renames aren't magic.

---

### Connection Pooling Basics

SQLAlchemy pools DB connections (`pool_size`, `max_overflow`, `pool_pre_ping`). Important behind Gunicorn with multiple workers (each process has a pool). Size pools thoughtfully relative to DB `max_connections`.

---

### Raw SQL vs ORM

ORM for productivity and safety; Core/raw SQL for complex reporting, bulk ops, vendor features. Always parameterize — never f-string SQL with user input. `session.execute(text("..."), params)`.

---

**✅ Flask Auth & Security**

### Password Hashing (werkzeug / passlib)

```python
from werkzeug.security import generate_password_hash, check_password_hash

hash = generate_password_hash(password)  # scrypt/pbkdf2
check_password_hash(hash, password)
```

Never store plaintext. Prefer slow hashes (scrypt, bcrypt, argon2). Constant-time compare via library helpers.

---

### Flask-Login

Manages user session identity:

```python
login_manager = LoginManager()
login_manager.login_view = "auth.login"

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

@login_required
def dashboard():
    return render_template("dash.html", user=current_user)
```

User model implements `UserMixin` (`is_authenticated`, `get_id`, …).

---

### Authorization Patterns (roles, decorators)

```python
def roles_required(*roles):
    def deco(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not current_user.is_authenticated or current_user.role not in roles:
                abort(403)
            return fn(*args, **kwargs)
        return wrapper
    return deco
```

Separate authentication (who) from authorization (what). Check on every sensitive action server-side.

---

### JWT with Flask (optional patterns)

For APIs: issue JWT on login; protect routes by validating `Authorization: Bearer`. Libraries: PyJWT, Flask-JWT-Extended. Prefer short expiry + refresh; store only non-sensitive claims; use strong secrets/RS256 with key rotation for distributed systems.

---

### CORS (Flask-CORS)

```python
CORS(app, resources={r"/api/*": {"origins": ["https://app.example.com"]}})
```

Browsers enforce same-origin; APIs used by SPAs need CORS. Avoid `*` with credentials.

---

### Rate Limiting Basics

Flask-Limiter (Redis backend) throttles endpoints:

```python
@limiter.limit("5/minute")
def login():
    ...
```

Critical on auth endpoints. Prefer gateway/WAF for global limits in production.

---

### Secure Headers & HTTPS

Set HSTS, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, CSP via after_request or Talisman. Terminate TLS at reverse proxy; set `PREFERRED_URL_SCHEME=https` and secure cookies. ProxyFix for X-Forwarded-* headers when behind Nginx.

---

### SQL Injection / XSS / CSRF Defenses

| Threat | Defense |
|---|---|
| SQLi | ORM/parameterized queries; never string-build SQL |
| XSS | Jinja autoescape; CSP; sanitize rich text |
| CSRF | Flask-WTF tokens for cookie sessions |
| Open redirect | Allowlist next URLs |
| Path traversal | `secure_filename`, resolve under base dir |

Defense in depth: validate input, encode output, least privilege DB users.

---

**✅ Flask REST APIs**

### Designing REST Endpoints

Resource nouns, HTTP verbs, proper statuses, consistent JSON envelopes or Problem Details. Stateless auth. Idempotent PUT/DELETE. Version from day one if public.

```text
GET    /api/v1/orders
POST   /api/v1/orders
GET    /api/v1/orders/{id}
PATCH  /api/v1/orders/{id}
```

---

### Flask-RESTful / flask-smorest / plain Flask APIs

- **Plain Flask** — flexible; jsonify + blueprints
- **Flask-RESTful** — resource classes (older style, still seen)
- **flask-smorest** — Marshmallow + OpenAPI generation (modern)

Many teams use plain Flask or migrate toward FastAPI for new JSON APIs. Know tradeoffs.

---

### Request Parsing & Serialization (Marshmallow)

```python
class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    email = fields.Email(required=True)

data = UserSchema().load(request.get_json())
return UserSchema().dump(user)
```

Separates validation/serialization from models (DTO-like). Alternatives: Pydantic, attrs. Don't expose ORM objects directly (circular refs, internals).

---

### API Versioning

URI (`/api/v1`) most common; header versioning also used. Maintain compatibility windows; deprecate explicitly.

---

### Error Responses & Problem Details

Consistent JSON:

```json
{"title": "Validation failed", "status": 400, "detail": "...", "errors": {"email": ["required"]}}
```

Map domain exceptions → HTTP in handlers. Log 5xx with request IDs.

---

### Pagination

Cursor or offset/limit:

```python
page = request.args.get("page", 1, type=int)
per_page = min(request.args.get("per_page", 20, type=int), 100)
pagination = query.paginate(page=page, per_page=per_page)
```

Return `items`, `total`, `page`, `pages` or Link headers. Cap `per_page`.

---

### OpenAPI / Swagger Docs

Document endpoints with OpenAPI 3; serve Swagger UI / ReDoc. flask-smorest and APISpec generate from schemas. Living docs reduce client integration friction — strong interview plus.

---

**✅ Flask Extensions & Architecture**

### Extension Pattern (init_app)

```python
class MyExt:
    def __init__(self, app=None):
        if app:
            self.init_app(app)
    def init_app(self, app):
        app.teardown_appcontext(self.teardown)
        app.extensions["myext"] = self
```

Supports application factories: create extension globally, `init_app` inside factory. Standard for Flask-SQLAlchemy, Login, Migrate, etc.

---

### Flask-Caching

Memoize views/functions with backends (SimpleCache, Redis, Memcached):

```python
@cache.cached(timeout=60, key_prefix="users")
def list_users():
    ...
```

Invalidate on writes. Critical for expensive reads.

---

### Flask-Mail

Send email via SMTP asynchronously ideally (task queue). Configure server/credentials; use in signup verification, password reset. In tests, use memory backend.

---

### Celery Integration (async tasks)

Offload slow work (emails, reports, webhooks):

```python
@celery.task
def send_email(user_id):
    ...
```

Broker: Redis/RabbitMQ. Flask app context inside tasks needs care (`ContextTask` pattern). Idempotent tasks; retries with backoff; observability for failures.

---

### Structuring Larger Apps

```text
project/
  app/
    __init__.py      # create_app
    extensions.py
    models/
    blueprints/
      api/
      auth/
    services/
    templates/
  tests/
  migrations/
  config.py
  wsgi.py
```

Layer: blueprints (HTTP) → services (business) → models/repos (data). Avoid fat views circular-importing everything.

---

### Dependency Injection Patterns in Flask

Flask doesn't ship a DI container like Spring. Patterns:

- Application factory wiring
- Pass dependencies into service constructors in `create_app`
- `g` for request-scoped objects
- Libraries: `injector`, `dependency-injector`

Keep services testable with plain constructors; avoid hiding globals everywhere.

---

### Middleware (WSGI middleware)

Wrap `app.wsgi_app`:

```python
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
```

Useful for metrics, request IDs, path fixes. Different from Flask `before_request` — middleware sits outside Flask's request dispatch.

---

**✅ Flask Testing & Production**

### Testing Flask Apps (test client)

```python
def test_health(client):
    rv = client.get("/api/health")
    assert rv.status_code == 200
    assert rv.get_json()["status"] == "ok"
```

`app.test_client()` simulates requests without server. `app.test_request_context()` for unit-testing code needing request context.

---

### pytest + Flask Fixtures

```python
@pytest.fixture
def app():
    app = create_app("config.TestConfig")
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()
```

Isolate DB per test; use transactions/rollback or ephemeral SQLite/Postgres (Testcontainers).

---

### Environment Config for Prod

`DEBUG=False`, strong `SECRET_KEY`, production DB URI, log level INFO, secure cookies, trusted proxy config, disabled interactive debugger. 12-factor: config via env.

---

### Gunicorn / uWSGI / Waitress

WSGI servers for production (Flask's built-in server is **dev only**):

```bash
gunicorn -w 4 -b 0.0.0.0:8000 "app:create_app()"
```

**Gunicorn** common on Linux; **Waitress** pure-Python (Windows-friendly); **uWSGI** feature-rich/complex. Workers × threads sizing depends on I/O vs CPU. Prefer `create_app()` entrypoint.

---

### Reverse Proxy (Nginx)

Nginx terminates TLS, serves static files, load-balances to Gunicorn, sets max body size, compresses responses. Flask trusts `X-Forwarded-For/Proto` via ProxyFix carefully.

---

### Logging & Monitoring

```python
import logging
logging.getLogger("myapp").info("order created", extra={"order_id": id})
```

Structured logs (JSON) + request ID in middleware. Metrics: Prometheus exporters; APM (OpenTelemetry). Don't log passwords/tokens. Health endpoints for orchestrators.

---

### Dockerizing Flask

Multi-stage Dockerfile: install deps, run as non-root, `gunicorn` CMD, env-based config. Compose with Postgres/Redis. Don't bake secrets into images. Prefer slim base images.

---

### Health Checks

```python
@app.get("/health")
def health():
    db.session.execute(text("SELECT 1"))
    return {"status": "ok"}
```

Separate liveness (process up) vs readiness (DB reachable). Used by k8s/load balancers.

---

### Performance Basics (profiling, N+1, caching)

- Fix N+1 with `selectinload` / joins
- Cache hot reads (Redis/Flask-Caching)
- Connection pooling sized correctly
- Avoid huge templates in APIs — use JSON
- Profile with `cProfile`, Flask Debug Toolbar (dev), py-spy
- Compress responses; CDN static assets
- Paginate everything unbounded

---

**✅ Related Ecosystem (Optional but Impressive)**

### FastAPI Comparison

| | Flask | FastAPI |
|---|---|---|
| Model | WSGI sync (async optional) | ASGI async-first |
| Validation | Manual / Marshmallow / WTForms | Pydantic built-in |
| OpenAPI | Extensions | Automatic |
| Style | Flexible microframework | Opinionated API framework |

Flask wins legacy/HTML apps & simplicity; FastAPI wins modern async JSON APIs with schema-first design. Knowing both is a strong signal.

---

### Django Comparison (high level)

Django is batteries-included (ORM, admin, auth, forms). Flask is minimal — you choose pieces. Django great for content-heavy CMS-like apps; Flask for custom architectures and APIs (or FastAPI). Interview: trade flexibility vs conventions.

---

### Pydantic

Data validation using Python type hints — models parse/coerce/validate I/O. Core of FastAPI; also usable in Flask for request bodies. v2 is Rust-backed and fast. Complements or replaces Marshmallow in modern stacks.

---

### SQLModel / async SQLAlchemy

SQLModel combines SQLAlchemy + Pydantic (by FastAPI author). Async SQLAlchemy + async drivers (asyncpg) for ASGI stacks. Flask traditionally sync — mixing async requires care.

---

### Redis Integration

Sessions, cache, rate limits, Celery broker, pub/sub. `redis-py` client; connection pools; serialize JSON carefully; set TTLs to avoid memory blowups.

---

### Message Queues Overview

Decouple producers/consumers: Celery+Redis/RabbitMQ, RQ, Dramatiq, Kafka for event streams. Use for reliability, retries, smoothing traffic spikes — not for every function call.

---

## How to use this guide

- Walk `Python & Flask Topics.md` checkbox by checkbox; explain aloud before peeking here.
- For Python, always be ready to discuss **mutability, iterators/generators, decorators, and the GIL**.
- For Flask, narrate a request: **WSGI → before_request → view → session/DB → after_request → response**, and mention **app vs request context**.
- Build one small app with factory + blueprint + SQLAlchemy + pytest client — practice beats memorization.

Good luck with prep.
