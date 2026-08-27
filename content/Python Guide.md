# Python

A deep-dive companion to the Python checklist. Each heading matches the original outline; under every topic you'll find **what it is**, **why it exists**, **how it works**, and **interview-ready nuance**.

---

**📌 Python Fundamentals**

### Python overview & design philosophy (Zen of Python)

Python is a **high-level, dynamically typed** language emphasizing **readability** and **developer productivity**. `import this` prints the Zen: "Explicit is better than implicit," "Readability counts," "There should be one obvious way to do it."

Interview: Python trades raw performance for speed of development; use the right tool (NumPy, C extensions, asyncio) when performance matters.

---

### Python 2 vs 3 (migration awareness)

Python 2 reached end-of-life in 2020. Python 3 broke compatibility (unicode strings, `/` true division, print function). All modern code is Python 3 (3.10+ common in 2026). Mention only if legacy migration context arises.

---

### Running Python (REPL, scripts, `python -m`)

- **REPL** — interactive experimentation (`python3`)
- **Script** — `python app.py`
- **Module** — `python -m package.module` (runs as module, fixes import paths)

Use `-m` for tools: `python -m pytest`, `python -m http.server`.

---

### Indentation & significant whitespace

Blocks defined by **indentation** (4 spaces standard), not braces. Mixing tabs/spaces causes `IndentationError`. Consistent style enforced by editors + black/ruff.

---

### Variables, naming conventions & constants (UPPER_CASE)

`snake_case` for variables/functions; `PascalCase` for classes; `UPPER_SNAKE` for module-level constants (convention, not enforced). Variables are **names bound to objects**, not typed boxes.

---

### Comments, docstrings & `help()`

`#` for comments. **Docstrings** (triple-quoted first statement) document modules/classes/functions. `help(func)` reads them. Use Google/NumPy docstring style in teams.

---

### `__name__ == "__main__"` idiom

When file run directly, `__name__` is `"__main__"`. When imported, it's the module name. Guard script-only code:

```python
if __name__ == "__main__":
    main()
```

---

### Python execution model (interpreter, bytecode — overview)

Source → **compile** to bytecode (`.pyc`) → **CPython VM** executes. Not interpreted line-by-line at runtime after first compile. `@dis.dis(func)` shows bytecode for learning.

---

### CPython vs PyPy vs other implementations (brief)

**CPython** — reference implementation in C. **PyPy** — JIT, faster for long-running CPU loops. **MicroPython** — embedded. Most interviews assume **CPython**.

---

**📌 Data Types & Variables**

### Built-in types overview (numbers, str, bool, None, collections)

| Category | Types |
|---|---|
| Numbers | `int`, `float`, `complex` |
| Text/binary | `str`, `bytes`, `bytearray` |
| Collections | `list`, `tuple`, `set`, `dict` |
| Other | `bool`, `NoneType`, `range` |

Everything is an **object** with type and identity.

---

### `int` — arbitrary precision

Python 3 `int` has **unlimited precision** (big integers). No overflow like fixed 32-bit. Memory is the limit. `10 ** 1000` works fine.

---

### `float` & floating-point precision traps

IEEE 754 doubles — `0.1 + 0.2 != 0.3`. Use **`decimal.Decimal`** for money, or integers (cents). Never compare floats with `==` for critical logic.

---

### `bool` & truthiness

Subclass of `int` (`True == 1`, `False == 0`). Used in conditions. Prefer explicit checks in APIs; internally `if items:` is idiomatic for non-empty collections.

---

### `None` — singleton sentinel

`None` means **no value**. Single object: `None is None`. Default for missing optional returns. Don't confuse with `False` or `0`.

---

### `type()` vs `isinstance()`

`type(x) == int` — exact type, ignores subclasses. **`isinstance(x, int)`** — preferred; respects inheritance and ABCs. Use isinstance in production code.

---

### Mutable vs immutable types

| Immutable | Mutable |
|---|---|
| int, float, str, tuple, frozenset, bytes | list, dict, set, bytearray |

Immutable objects can be dict keys if hashable. Mutating shared mutable defaults is a classic bug.

---

### Dynamic typing & duck typing

No compile-time type declarations required. **Duck typing:** "If it walks like a duck..." — behavior matters, not declared type. Enables flexible APIs; type hints add optional static checks.

---

### Type coercion & implicit conversions

`True + 1` → 2. `"5" + 5` → TypeError. Comparison chains mix carefully. Explicit is better: `int("5")`.

---

### `id()` & object identity

`id(obj)` returns identity (often memory address in CPython). `a is b` iff same object. `a == b` iff equal value (`__eq__`).

---

**📌 Strings & Text**

### String creation & immutability

`str` objects **cannot change in place**. `"hello"[0] = "H"` fails. Concatenation creates new strings — use `''.join(list)` for many concatenations.

---

### Indexing, slicing & negative indices

`s[0]`, `s[-1]`, `s[1:4]`, `s[::2]`, `s[::-1]` (reverse). Slices return new strings; bounds don't error on slice (clamped).

---

### String methods (split, join, strip, replace, find)

`"a,b".split(",")`, `",".join(parts)`, `"  x  ".strip()`, `"foo".replace("o","0")`. Methods return new strings. Know **`in`** for substring test.

---

### f-strings, `.format()` & `%` formatting

**f-strings** (3.6+) preferred: `f"{name}={value:.2f}"`. Support expressions: `f"{obj.method()}"`. `.format()` for templates; `%` legacy.

---

### Raw strings & escape sequences

`r"\n"` is backslash + n, not newline. Useful for regex patterns and Windows paths.

---

### `bytes` vs `str` (text vs binary)

`str` — Unicode text. `bytes` — raw bytes. Decode bytes → str; encode str → bytes. Never mix without explicit conversion.

---

### Encoding & decoding (`encode` / `decode`, UTF-8)

```python
b = "café".encode("utf-8")
s = b.decode("utf-8")
```

Default UTF-8 in Python 3. Always know encoding when reading files/network.

---

### `bytearray` mutable byte sequence

Like `bytes` but mutable — useful for in-place binary manipulation without creating new objects each time.

---

### Regular expressions (`re` module basics)

`re.search`, `re.match`, `re.findall`, `re.sub`. Compile patterns with `re.compile` for reuse. Prefer `str` methods when sufficient; regex for complex patterns.

---

**📌 Operators & Expressions**

### Arithmetic operators

`+`, `-`, `*`, `/` (true division), `//` (floor), `%`, `**`. `/` always float in Py3: `5/2 == 2.5`, `5//2 == 2`.

---

### Comparison & chaining (`a < b < c`)

Python allows chained comparisons: `a < b < c` means `a < b and b < c`. Elegant and evaluates middle once.

---

### Logical operators (`and`, `or`, `not`) & short-circuit

Return last evaluated operand, not strictly bool. `and` stops at first falsy; `or` at first truthy. Useful for defaults: `name = user_input or "guest"`.

---

### Membership (`in`) & identity (`is`, `is not`)

`x in collection` uses `__contains__` or iteration. **`is`** compares identity — use for `None`, `True`, `False`. **`==`** for value equality.

---

### Bitwise operators (overview)

`&`, `|`, `^`, `~`, `<<`, `>>` on integers. Flags, permissions, low-level protocols. Less common in application interviews unless systems role.

---

### Walrus operator `:=` (3.8+)

Assignment expression: `if (n := len(data)) > 10:` assigns and tests. Reduces duplication; don't overuse at cost of readability.

---

### Operator precedence

`**` > unary > `* / // %` > `+ -` > comparisons > `not` > `and` > `or`. When unsure, use parentheses — explicit is better.

---

### `is` vs `==` (interview classic)

`==` — value equality. `is` — same object. Small integers (-5 to 256) and short interned strings may be cached — don't rely on `is` for value comparison. **Always `==` for values; `is` for None.**

---

**📌 Control Flow**

### `if` / `elif` / `else`

Standard branching. No parentheses required around condition. Blocks by indentation.

---

### `for` loops & iterating iterables

`for item in iterable:` — works on any iterator (list, dict keys, file lines, generators). Not index-based C-style unless you need index (`enumerate`).

---

### `while` loops

Repeat while condition true. Ensure progress toward exit to avoid infinite loops.

---

### `break`, `continue` & `else` on loops

Loop **`else`** runs if loop completes **without** `break` — useful for search loops ("not found" case). Rare but interview differentiator.

```python
for x in items:
    if x == target:
        break
else:
    print("not found")
```

---

### `range()` — lazy sequence of numbers

`range(5)`, `range(2, 10, 2)` — memory-efficient, not a list. `list(range(3))` materializes. Prefer `for i in range(n)` over `while` counters.

---

### `enumerate()` & `zip()`

```python
for i, val in enumerate(items):
    ...
for a, b in zip(list_a, list_b):
    ...
```

`zip` stops at shortest; use `itertools.zip_longest` for padding.

---

### `match` / `case` structural pattern matching (3.10+)

```python
match command:
    case ["quit"]:
        ...
    case ["load", filename]:
        ...
    case {"type": "user", "name": str(n)}:
        ...
```

Like switch on steroids — destructuring, guards, types. Know it exists; not every codebase uses it yet.

---

### Ternary conditional expression

`x if condition else y` — inline choice. Keep readable; nested ternaries discouraged.

---

**📌 Functions**

### Defining functions with `def`

```python
def greet(name: str) -> str:
    return f"Hello, {name}"
```

Functions are objects — assignable, passable as arguments.

---

### Return values & multiple returns (tuple unpacking)

`return a, b` returns a **tuple**. Caller: `x, y = func()`. Explicit `return None` optional at end.

---

### Positional & keyword arguments

`func(1, 2, z=3)` — positional first, then keywords. Keywords can reorder after positional args are satisfied.

---

### Default parameter values

Defaults evaluated **once at function definition time** — critical for mutable defaults bug.

---

### Mutable default argument trap (interview classic)

```python
def bad(x=[]):  # DON'T — shared list across calls
    x.append(1)
    return x

def good(x=None):
    if x is None:
        x = []
    x.append(1)
    return x
```

---

### `*args` & `**kwargs`

`*args` — tuple of extra positional. `**kwargs` — dict of extra keyword. For wrappers and flexible APIs:

```python
def log_call(func, *args, **kwargs):
    ...
    return func(*args, **kwargs)
```

---

### Positional-only (`/`) & keyword-only (`*`) parameters

```python
def f(a, b, /, c, *, d):
    ...
```

`/` — before must be positional. `*` — after must be keyword. API stability for library design.

---

### Lambda expressions & limitations

```python
sorted(items, key=lambda x: x.name)
```

Single expression only — no statements. Prefer `def` for anything non-trivial.

---

### Nested functions & closures

Inner functions capture outer variables — **closure**. Useful for factories and decorators.

---

### Late binding closure trap in loops

```python
funcs = [lambda: i for i in range(3)]
# all return 2 — i bound at call time

funcs = [lambda i=i: i for i in range(3)]  # fix: default arg capture
```

Classic interview question.

---

### `functools.partial`

Partial application — fix some arguments:

```python
from functools import partial
int_from_hex = partial(int, base=16)
```

---

### Function annotations (type hints on parameters)

```python
def add(a: int, b: int) -> int:
    return a + b
```

Annotations stored in `__annotations__`; not enforced at runtime without tools like mypy.

---

**📌 Data Structures — Core**

### `list` — dynamic array operations & complexity

| Op | Amortized |
|---|---|
| append | O(1) |
| insert middle | O(n) |
| index access | O(1) |
| search | O(n) |

Dynamic array overallocated — occasional resize cost.

---

### `tuple` — immutable sequences & unpacking

Fixed-length, hashable if all elements hashable. **Unpacking:** `a, *rest, z = seq`. Return multiple values idiomatically via tuple.

---

### `set` & `frozenset` — uniqueness & set operations

O(1) average membership. Union `|`, intersection `&`, difference `-`. **`frozenset`** immutable, hashable — can be dict key.

---

### `dict` — hash map, keys/values/items views

3.7+ **insertion order** preserved (language guarantee 3.7+). `.get(k, default)`, `.setdefault`, dict comprehensions. Keys must be hashable.

---

### Choosing list vs tuple vs set vs dict (interview)

| Need | Use |
|---|---|
| Ordered mutable sequence | list |
| Fixed record, hashable | tuple |
| Unique membership / dedup | set |
| Key → value lookup | dict |

---

### List, dict & set comprehensions

```python
squares = [x*x for x in range(10) if x % 2]
index = {word: i for i, word in enumerate(words)}
unique_lens = {len(w) for w in words}
```

Readable for simple transforms; don't nest deeply.

---

### Dict merge (`|`, `|=`, 3.9+)

`d1 | d2` creates merged dict; `d1 |= d2` in-place. Later keys win on conflict.

---

### `collections.defaultdict`

Auto-creates missing keys with factory:

```python
from collections import defaultdict
counts = defaultdict(int)
counts["a"] += 1
```

---

### `collections.Counter`

Multiset / frequency map:

```python
Counter("abracadabra").most_common(3)
```

---

### `collections.deque`

Double-ended queue — O(1) append/pop both ends. **`maxlen`** for fixed-size sliding window. Preferred over `list` for queue patterns.

---

### `heapq` module (min-heap)

```python
import heapq
heapq.heappush(h, item)
smallest = heapq.heappop(h)
```

Max-heap: negate values. `heapq.nlargest(k, iterable)` for top-k.

---

### `OrderedDict` & `ChainMap` (awareness)

`OrderedDict` — redundant for order since 3.7 dict. **`ChainMap`** — layered dict lookup for scopes/config fallbacks.

---

**📌 Object-Oriented Programming**

### Classes & objects

```python
class User:
    def __init__(self, name: str):
        self.name = name
```

Classes are callables that produce instances. Everything object-oriented but not everything needs a class.

---

### `__init__` & instance attributes

Initializer — not quite constructor (`__new__` creates). Set `self.attr` for instance state.

---

### `self` parameter

Explicit first parameter — instance reference. Must be named `self` by convention (not keyword).

---

### Instance vs class vs static methods

| Decorator | Receives | Use |
|---|---|---|
| (none) | instance | instance behavior |
| `@classmethod` | class | factories, alt constructors |
| `@staticmethod` | neither | utility in namespace |

---

### `@property`, getters & setters

```python
@property
def full_name(self):
    return f"{self.first} {self.last}"

@full_name.setter
def full_name(self, value):
    self.first, self.last = value.split()
```

Computed attributes without breaking attribute syntax.

---

### `@classmethod` & `@staticmethod`

```python
@classmethod
def from_dict(cls, data):
    return cls(data["name"])

@staticmethod
def validate_email(email):
    return "@" in email
```

---

### Inheritance & `super()`

```python
class Admin(User):
    def __init__(self, name, level):
        super().__init__(name)
        self.level = level
```

`super()` follows MRO — cooperative multiple inheritance.

---

### Method Resolution Order (MRO) & `__mro__`

C3 linearization — deterministic order for attribute lookup. `Class.__mro__` or `Class.mro()`. Diamond inheritance resolved predictably.

---

### Polymorphism & duck typing

Same interface, different types — no required base class. `def area(shape): return shape.area()` works if objects implement `area`.

---

### Abstract Base Classes (`abc` module)

```python
from abc import ABC, abstractmethod

class Repository(ABC):
    @abstractmethod
    def get(self, id: int): ...
```

Enforce interface for subclasses. `isinstance(x, Repository)` works with ABC registration.

---

### `@dataclass` (3.7+)

```python
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float
```

Auto-generates `__init__`, `__repr__`, comparisons. Use `frozen=True` for immutable. **`field(default_factory=list)`** for mutable defaults.

---

### Composition vs inheritance

**Favor composition** — "has-a" over "is-a" when behavior is combined. Inheritance for true subtype relationships. Reduces fragile base class problems.

---

### `__slots__` for memory optimization

```python
class Point:
    __slots__ = ("x", "y")
```

No per-instance `__dict__` — saves memory, fixes attributes. Tradeoff: no dynamic attributes.

---

### Encapsulation conventions (`_private`, `__name mangling`)

`_single_leading` — internal use convention. `__double_leading` — name mangling to `_ClassName__attr` (not true private). Don't rely on mangling for security.

---

**📌 Dunder (Magic) Methods**

### What dunder methods are

**Double-underscore** methods hook into Python operators and protocols. Define how objects behave with built-ins.

---

### `__str__` vs `__repr__`

- **`__repr__`** — unambiguous, for developers; ideally `eval`-able. `repr(obj)`
- **`__str__`** — readable, for users. `print(obj)`, `str(obj)`

If only one: implement `__repr__`.

---

### `__eq__`, `__hash__` & hashable objects

If `__eq__` defined, default hash may break dict/set use. **Rule:** if `a == b`, then `hash(a) == hash(b)`. Mutable objects shouldn't be hashable. `@dataclass(frozen=True)` auto hashable.

---

### `__len__`, `__getitem__`, `__setitem__`

Make objects sequence/map-like. `len(obj)`, `obj[i]`, `obj[i] = v`.

---

### `__iter__` & `__next__` — making objects iterable

Implement iterator protocol or define `__iter__` yielding from generator. Enables `for x in obj`.

---

### `__enter__` & `__exit__` — context managers

Used by `with` statement — setup/teardown (files, locks, DB transactions).

---

### `__call__` — callable objects

`obj()` invokes `__call__` — function-like classes, decorators with state.

---

### `__lt__` etc. for sorting

Rich comparisons enable `sorted()` without `key=`. `@functools.total_ordering` generates rest from `__eq__` and `__lt__`.

---

### Operator overloading overview

`__add__`, `__mul__`, etc. Use sparingly when types naturally support math. NumPy-style libraries rely heavily on this.

---

**📌 Exception Handling**

### `try` / `except` / `else` / `finally`

```python
try:
    risky()
except ValueError as e:
    handle(e)
else:
    runs_if_no_exception()
finally:
    always_cleanup()
```

---

### Exception hierarchy (`BaseException`, `Exception`)

Catch **`Exception`**, not `BaseException` (includes KeyboardInterrupt, SystemExit). Specific exceptions first in multiple handlers.

---

### Catching specific vs broad exceptions

Catch what you can handle. Bare `except:` or broad `Exception` — log and re-raise or wrap if truly needed. Never silent swallow.

---

### `raise` & re-raising

`raise ValueError("bad")` — `raise` alone in except block re-raises current exception preserving traceback.

---

### Exception chaining (`raise ... from`)

```python
raise RuntimeError("failed") from original_error
```

Shows cause chain in traceback — critical for debugging wrapped errors.

---

### Custom exception classes

```python
class PaymentError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        super().__init__(message)
```

Hierarchy per domain — callers catch `PaymentError` not all `Exception`.

---

### EAFP vs LBYLE (Pythonic style)

**Easier to Ask Forgiveness than Permission** — try/except vs check-then-act. Python favors EAFP for race-free code (`dict[key]` vs `if key in dict`). Still validate user input at boundaries.

---

### `assert` statement & `-O` flag

Debug checks stripped with `python -O`. **Never** use assert for business logic or user validation — can be disabled in production.

---

**📌 Modules, Packages & Environment**

### Modules & `import` / `from ... import`

`import os` — module namespace. `from os import path` — specific names. Avoid `from module import *` (pollutes namespace).

---

### Package structure & `__init__.py`

Directory with `__init__.py` (still recommended) is a package. Namespace packages (PEP 420) allow portions without `__init__.py`.

---

### Absolute vs relative imports

```python
from myapp.services import billing      # absolute
from .models import User                  # relative within package
```

Relative imports only inside packages.

---

### `if __name__ == "__main__"` for script vs module

Enables dual use — library import vs CLI execution.

---

### `sys.path` & module search path

List of directories searched for imports. `PYTHONPATH`, venv site-packages, script directory. **`pip install -e .`** for editable local packages.

---

### Virtual environments (`venv`, `virtualenv`)

Isolated Python + site-packages per project. **`python -m venv .venv`** then activate. Never install globally for apps.

---

### `pip` & dependency management

`pip install package`, `pip freeze > requirements.txt`. Pin versions in production. Use lock files or `pyproject.toml` with Poetry/uv for reproducibility.

---

### `requirements.txt` vs `pyproject.toml` (Poetry/uv — overview)

`requirements.txt` — simple pip list. **`pyproject.toml`** — modern standard (PEP 621) for metadata, tools, dependencies. Poetry/uv resolve transitive deps.

---

### `__all__` for public API control

```python
__all__ = ["public_func", "PublicClass"]
```

Documents exports; limits `from module import *`.

---

### Circular import problem & fixes

Module A imports B, B imports A — partial initialization errors. Fixes: refactor shared code to third module, lazy import inside function, type-only imports under `TYPE_CHECKING`.

---

**📌 File I/O & Serialization**

### `open()` & file modes (`r`, `w`, `a`, `rb`, etc.)

`r` read, `w` write truncate, `a` append, `x` exclusive create, `b` binary, `t` text default. **`encoding="utf-8"`** always for text files.

---

### Context manager for files (`with open(...)`)

Ensures file closed even on exception — always use `with` for files.

---

### Reading/writing text & binary files

```python
with open("data.txt", encoding="utf-8") as f:
    content = f.read()

with open("img.bin", "wb") as f:
    f.write(blob)
```

---

### `pathlib.Path` — modern path handling

```python
from pathlib import Path
p = Path("src") / "main.py"
p.read_text(encoding="utf-8")
p.exists()
```

OOP paths — preferred over `os.path` for new code.

---

### `json` module — load/dump, custom encoders

`json.loads`, `json.dumps`, `json.load(file)`. `default=str` for non-serializable types. **`datetime` needs custom encoder**.

---

### `csv` module

`csv.reader`, `csv.DictReader` for tabular data. Mind encoding and newline handling.

---

### `pickle` — serialization & security warning

**Never unpickle untrusted data** — arbitrary code execution risk. Use JSON/MessagePack for untrusted interchange. Pickle OK for internal trusted caches.

---

### Working with directories (`os.walk`, pathlib glob)

```python
for path in Path("data").rglob("*.json"):
    ...
```

---

**📌 Iterators, Generators & Comprehensions**

### Iterator protocol (`__iter__`, `__next__`)

Objects with `__iter__` returning self with `__next__` raising `StopIteration` when done.

---

### `iter()` & `StopIteration`

`iter(collection)` gets iterator. Exhaustion signals via exception — not sentinel return.

---

### Generator functions & `yield`

```python
def count_up(n):
    for i in range(n):
        yield i
```

Lazy — state suspended between yields. Memory efficient for large sequences.

---

### Generator expressions vs list comprehensions

`(x*x for x in range(10**6))` — generator, lazy. `[x*x for x in range(10**6)]` — list in memory. Choose based on one-pass vs reuse.

---

### Lazy evaluation & memory benefits

Process pipeline items without materializing full dataset — essential for ETL, log processing, large file reads line-by-line.

---

### `yield from` delegation

```python
def chain(a, b):
    yield from a
    yield from b
```

Delegates to sub-generator — cleaner than manual loop.

---

### `itertools` module (chain, islice, groupby, combinations)

`itertools.chain`, `islice`, `groupby` (requires sorted input!), `product`, `combinations`. Compose efficient iterator pipelines.

---

### Sending values to generators (`.send()` — awareness)

Coroutine-style generators accept values — foundation of old coroutines; **`async/await`** replaced most use cases. Know name only unless advanced interview.

---

### Generator vs iterator vs iterable (interview)

| Term | Meaning |
|---|---|
| **Iterable** | Has `__iter__` — can produce iterator |
| **Iterator** | Has `__next__`, one-shot consumption |
| **Generator** | Iterator from function with `yield` |

All generators are iterators; not all iterators are generators.

---

**📌 Decorators & Context Managers**

### Functions as first-class objects

Assign to variables, pass as args, return from functions — enables decorators and callbacks.

---

### Decorator pattern & `@syntax`

```python
def timer(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        print(time.perf_counter() - start)
        return result
    return wrapper

@timer
def work(): ...
```

`@timer` ≡ `work = timer(work)`.

---

### Writing parameterized decorators

```python
def repeat(n):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(n):
                func(*args, **kwargs)
        return wrapper
    return decorator

@repeat(3)
def hello(): print("hi")
```

---

### `functools.wraps` — preserving metadata

```python
from functools import wraps

def deco(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

Preserves `__name__`, `__doc__` for introspection and debugging.

---

### Class-based decorators

Class with `__call__` acting as decorator — holds configuration/state.

---

### Stacking multiple decorators

Applied bottom-up: `@a @b def f` → `f = a(b(f))`. Order matters when decorators transform signatures.

---

### Context managers & the `with` statement

Guarantees setup/teardown — even on exceptions. Files, locks, DB connections.

---

### `contextlib.contextmanager` decorator

```python
from contextlib import contextmanager

@contextmanager
def temp_file():
    f = open(...)
    try:
        yield f
    finally:
        f.close()
```

Write generators as context managers without class boilerplate.

---

### `contextlib.suppress`, `ExitStack`

`suppress(FileNotFoundError)` — ignore specific exceptions in block. **`ExitStack`** — dynamic number of context managers.

---

### Common uses: timing, locking, DB sessions

Decorators for cross-cutting concerns; context managers for scoped resources. Same patterns as Spring AOP/transactions — Python-native style.

---

**📌 Functional Programming Patterns**

### `map()`, `filter()`, `reduce()` (`functools`)

```python
list(map(str, [1, 2, 3]))
list(filter(None, items))
from functools import reduce
reduce(lambda a, b: a + b, [1, 2, 3])
```

Comprehensions often clearer in Python — use map/filter when functional pipeline reads well.

---

### `sorted()` with `key=` function

```python
sorted(users, key=lambda u: u.last_login, reverse=True)
```

Decouple sort criteria from object comparison.

---

### List comprehension vs map/filter (readability)

**Comprehensions** preferred for Pythonic code unless chaining with lazy iterators. Interview: readability > cleverness.

---

### Immutability patterns in Python

Tuples, frozenset, `@dataclass(frozen=True)`, copy-on-write patterns. Reduces bugs in concurrent code.

---

### Pure functions & side effects

Pure: same input → same output, no mutation. Easier to test. Push I/O to edges; keep core logic pure where practical.

---

### Higher-order functions

Functions accepting/returning functions — decorators, `sorted(key=)`, strategy pattern without classes.

---

**📌 Type Hints & Static Typing**

### Why type hints (documentation, tooling, mypy)

Optional annotations for static analysis — **not enforced at runtime** by default. Improves IDE autocomplete, catches bugs pre-commit.

---

### Basic annotations (`int`, `str`, `list`, `dict`)

```python
def process(items: list[str], count: int = 0) -> dict[str, int]:
    ...
```

---

### `Optional`, `Union` & `|` syntax (3.10+)

`Optional[str]` ≡ `str | None`. `Union[int, str]` ≡ `int | str`.

---

### `list[str]` vs `List[str]` (3.9+ built-in generics)

Prefer **`list[str]`** (PEP 585) in 3.9+. `typing.List` legacy for older code.

---

### `TypedDict`, `NamedTuple`, `NewType`

Structured dict shapes, lightweight records, distinct type aliases for IDs.

---

### `Callable`, `TypeVar` & `Generic`

```python
from typing import TypeVar, Generic

T = TypeVar("T")

class Stack(Generic[T]):
    def push(self, item: T): ...
```

---

### `Protocol` — structural subtyping

Duck typing for type checker — define interface by methods without inheritance:

```python
class Readable(Protocol):
    def read(self, n: int) -> bytes: ...
```

---

### `Literal` & `Final`

`Literal["GET", "POST"]` for fixed strings. `Final` for constants not reassigned.

---

### Running `mypy` / IDE type checking

`mypy src/` in CI. Gradual typing — add hints incrementally. `# type: ignore` sparingly with comment why.

---

### Type hints at runtime (`typing.get_type_hints`)

Introspection for frameworks (FastAPI, Pydantic). Hints primarily for tools, not runtime validation (unless Pydantic).

---

**📌 Concurrency & Parallelism**

### GIL (Global Interpreter Lock) & implications

CPython GIL allows **one thread executing Python bytecode at a time** per process. **Threads don't parallelize CPU-bound Python code.** They help **I/O-bound** (waiting on network/disk). **multiprocessing** for CPU parallelism.

---

### CPU-bound vs I/O-bound workloads

| Workload | Approach |
|---|---|
| I/O-bound | threading, asyncio, async libraries |
| CPU-bound | multiprocessing, ProcessPoolExecutor, C/NumPy |

---

### `threading` module & thread safety

```python
t = threading.Thread(target=work, args=(data,))
t.start()
t.join()
```

Shared mutable state needs locks — race conditions otherwise.

---

### Locks (`threading.Lock`, `RLock`) & race conditions

```python
with lock:
    counter += 1
```

**RLock** — reentrant for same thread. Prefer `queue.Queue` over manual lock+list for producer-consumer.

---

### `multiprocessing` — bypass GIL for CPU work

Separate memory spaces — `Process`, `Pool`, `ProcessPoolExecutor`. Higher overhead than threads; pickling args cost.

---

### `concurrent.futures` — ThreadPoolExecutor & ProcessPoolExecutor

```python
with ThreadPoolExecutor(max_workers=4) as ex:
    results = list(ex.map(fetch_url, urls))
```

Unified API — choose executor by workload type.

---

### `asyncio` basics (`async`/`await`, event loop overview)

Single-threaded cooperative multitasking for I/O. `async def`, `await`, `asyncio.run(main())`. **Don't block the event loop** with sync I/O inside async. Deep dive in FastAPI guide.

---

### When threading vs multiprocessing vs asyncio

- **asyncio** — many concurrent I/O connections, async-native libs
- **threading** — blocking I/O libraries without async support
- **multiprocessing** — CPU crunch in parallel

---

### `queue.Queue` for producer-consumer

Thread-safe FIFO — blocks on get/put. Decouples producers and consumers safely.

---

### Deadlocks & debugging concurrency (overview)

Circular lock acquisition → hang. Mitigate: lock ordering, timeouts, avoid holding locks during I/O. Tools: logging thread names, `faulthandler`.

---

**📌 Memory Management & Performance**

### Reference counting & garbage collection

Primary: **reference counting** — object freed when count hits 0. **Cycle detector** (`gc` module) handles circular references.

---

### `gc` module & cyclic references

`gc.collect()` forces collection. Rarely needed manually. Watch for long-lived cycles holding large graphs.

---

### Shallow vs deep copy (`copy` module)

```python
import copy
b = copy.copy(a)       # new container, same inner objects
c = copy.deepcopy(a)   # recursive copy
```

Nested mutable structures need **deepcopy** for independence.

---

### Interning small ints & strings (awareness)

CPython caches small ints and some strings — `is` may appear to work for `==` values. **Never depend on this.**

---

### `__slots__` & memory savings

Reduces per-object memory for millions of instances — trade flexibility.

---

### Big-O for common Python operations (list, dict, set)

Know table from data structures section. **`in dict/set` O(1)** vs **`in list` O(n)** — critical for interview algorithm choices.

---

### Profiling basics (`cProfile`, `timeit`)

```python
python -m cProfile -s cumtime script.py
```

Measure before optimizing — Python bottlenecks often algorithm choice, not interpreter.

---

### `weakref` module (overview)

References that don't prevent garbage collection — caches, observer patterns without leaks.

---

**📌 Standard Library Essentials**

### `os` & `sys` — environment, argv, exit

`os.environ`, `os.getenv`, `sys.argv`, `sys.exit(code)`. `if __name__ == "__main__"` entry points.

---

### `datetime`, `timedelta`, `timezone` — aware vs naive

**Always use timezone-aware** datetimes in production (`datetime.now(timezone.utc)`). Naive datetimes cause DST/offset bugs.

---

### `time` & `time.sleep`

Monotonic clock `time.perf_counter()` for benchmarks. `sleep` blocks thread — not for async (use `asyncio.sleep`).

---

### `logging` module — levels, handlers, formatters

```python
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("event", extra={"user_id": 1})
```

Prefer logging over print in apps. Structured JSON logging in production.

---

### `argparse` for CLI scripts

Standard library CLI parsing — subcommands, `--flags`, positional args. Alternatives: click, typer (built on click).

---

### `functools` — lru_cache, wraps, partial

```python
@functools.lru_cache(maxsize=128)
def expensive(n): ...
```

Memoization for pure functions with hashable args.

---

### `enum.Enum` for constants

```python
class Status(Enum):
    PENDING = "pending"
    DONE = "done"
```

Type-safe constants — better than string magic values.

---

### `dataclasses` vs `NamedTuple` vs dict

| | Mutable | Use |
|---|---|---|
| dict | yes | dynamic, JSON-like |
| NamedTuple | no | lightweight records |
| dataclass | configurable | rich objects with methods |

---

### `secrets` module for crypto-safe random

`secrets.token_urlsafe(32)` for tokens — not `random` module (predictable PRNG).

---

### `hashlib` for hashing

`hashlib.sha256(data).hexdigest()` — passwords use **bcrypt/argon2** (passlib), not raw SHA256.

---

### `subprocess` — running shell commands safely

```python
subprocess.run(["ls", "-la"], check=True, capture_output=True, text=True)
```

**Never** `shell=True` with user input — injection risk. Prefer list args.

---

### `tempfile`, `shutil` utilities

Temp files/dirs safely. `shutil.copy`, `rmtree`, `disk_usage`.

---

**📌 Testing**

### `unittest` module basics

```python
class TestMath(unittest.TestCase):
    def test_add(self):
        self.assertEqual(add(1, 2), 3)
```

JUnit-style — class-based tests, setup/teardown.

---

### `pytest` — tests, fixtures, parametrize

```python
def test_add():
    assert add(1, 2) == 3

@pytest.mark.parametrize("a,b,expected", [(1,2,3), (0,0,0)])
def test_add_cases(a, b, expected):
    assert add(a, b) == expected
```

Industry default for Python — simpler assertions, rich plugin ecosystem.

---

### `pytest.raises` for exception testing

```python
with pytest.raises(ValueError, match="invalid"):
    parse("")
```

---

### `unittest.mock` — Mock, patch, MagicMock

```python
@patch("mymodule.requests.get")
def test_fetch(mock_get):
    mock_get.return_value.json.return_value = {"ok": True}
```

Patch where **used**, not where defined.

---

### Test organization & naming conventions

`tests/` mirror package structure. `test_<module>.py`, `test_<behavior>`. One logical assert focus per test when possible.

---

### Test coverage (`pytest-cov` — overview)

`pytest --cov=src --cov-report=term-missing` — find untested paths. Coverage % isn't quality alone — test behavior that matters.

---

### Testing best practices (arrange-act-assert)

Setup → execute → verify. Independent tests — no order dependency. Fast unit tests; slow integration separated.

---

### Mocking I/O & external dependencies

Unit tests shouldn't hit real DB/API. Inject dependencies; mock at boundary. Integration tests with Testcontainers/real services separately.

---

**📌 Best Practices & Idioms**

### PEP 8 style guide

Official style: 4 spaces, max line length 88-100 (black default 88), naming conventions. Consistency beats personal preference.

---

### Pythonic idioms (enumerate, zip, dict.get, any/all)

```python
if any(x > 0 for x in values):
    ...
value = config.get("key", default)
```

Read "Fluent Python" / "Effective Python" for patterns.

---

### List comprehension readability limits

One comprehension OK; nested or long filters → use loop or helper function for clarity.

---

### `global` & `nonlocal` keywords

`global x` — assign module-level. `nonlocal x` — assign enclosing scope. Rare in clean code — prefer return values and parameters.

---

### Truthiness & empty container checks

`if items:` not `if len(items) > 0:`. `if x is None:` not `if not x:` when 0 or "" are valid.

---

### Avoiding bare `except:`

Catches everything including KeyboardInterrupt. Catch specific exceptions; log unexpected ones.

---

### Using `with` for resource management

Files, locks, DB connections — always context managers. Custom via `@contextmanager` or class.

---

### `if __name__ == "__main__"` guard

Keeps import side effects out of library usage.

---

### Linters & formatters (ruff, black, isort — overview)

**ruff** — fast lint + import sort. **black** — opinionated format. Run in pre-commit/CI. Zero bike-shedding on style in review.

---

### Security basics (never eval user input, pickle risks)

No `eval`/`exec` on user strings. Parameterized SQL. Sanitize paths. Secrets from env, not code. See Senior Backend Production Stack for OWASP depth.

---

**📌 Design Patterns & Architecture**

### Singleton in Python (module pattern vs `__new__`)

**Module is a singleton** — `import config` once, shared state. Class singleton rarely needed; if used, `@lru_cache` on factory or explicit module-level instance.

---

### Factory & Strategy patterns

**Factory** — function/class creates appropriate implementation. **Strategy** — pass behavior callable or protocol implementation. Python favors functions over ceremony.

---

### Dependency injection without a framework

Pass collaborators via constructor — no Spring needed:

```python
class OrderService:
    def __init__(self, repo: OrderRepository, payments: PaymentClient):
        self.repo = repo
        self.payments = payments
```

FastAPI `Depends()` builds on this pattern.

---

### Repository pattern for data access

Isolate persistence behind interface — swap SQLAlchemy for mock in tests. `Protocol` or ABC for repository contract.

---

### Protocol-based interfaces vs ABCs

**Protocol** — structural (duck typing + types). **ABC** — nominal inheritance required. Protocols lighter for Python style.

---

### Clean separation: models, services, I/O

Layers: domain models → services (business logic) → repositories/API clients. Keep I/O at edges; test services with fakes.

---

**📌 Interview Scenarios & Common Traps**

### Mutable default arguments

See functions section — shared list/dict across calls. Fix with `None` sentinel.

---

### Late-binding closures in loops

Lambdas in loop capture variable by name, not value — bind with default arg `lambda i=i: i`.

---

### `is` vs `==` for integers & strings

Use `==` for value comparison. `is` only for singletons (`None`, `True`, `False`) — not for cached small ints in trick questions.

---

### Modifying list while iterating

```python
for x in items:
    items.remove(x)  # BUG — skips elements
```

Iterate copy `for x in items[:]:` or build new list comprehension filter.

---

### Shallow copy surprises with nested lists

`copy.copy` duplicates outer list, inner lists shared. Use `deepcopy` for nested mutables.

---

### `__eq__` without consistent `__hash__`

Mutable object with custom `__eq__` becomes unhashable — can't use in set/dict keys. Use frozen dataclass for hashable value objects.

---

### GIL question — explain clearly

"Python threads don't run bytecode in parallel on multiple cores due to GIL; use multiprocessing for CPU parallelism or asyncio/threading for I/O concurrency." Shows depth without overclaiming.

---

### Implement flatten, group-by, anagram check

**Flatten:** recursion or stack. **Group-by:** `defaultdict(list)`. **Anagram:** `Counter(s)` equality or sorted strings. Know stdlib shortcuts.

---

### Reverse linked list / tree traversal (in Python)

Implement with class `Node` or dict-based trees. BFS/DFS with `deque` or recursion. Same algorithms as Java — syntax differs.

---

### When to reach for C extensions / NumPy (awareness)

Heavy numeric loops — **NumPy** vectorization or Cython/C extension. Don't micro-optimize pure Python loops without profiling first.

---

## How to use this guide

- Walk each checkbox in `Python Topics.md` and explain it aloud before reading the matching section.
- Pair with **FastAPI Topics** for web/backend API depth; this guide is the **language core**.
- For interviews, prioritize: **data structures + complexity, mutable defaults, GIL, decorators, generators, OOP/dunder, pytest/mock, type hints**.
- Write small snippets in a REPL — Python fluency comes from doing, not only reading.

Good luck with prep.
