# Python

**📌 Python Fundamentals**
- [] Python overview & design philosophy (Zen of Python)
- [] Python 2 vs 3 (migration awareness)
- [] Running Python (REPL, scripts, `python -m`)
- [] Indentation & significant whitespace
- [] Variables, naming conventions & constants (UPPER_CASE)
- [] Comments, docstrings & `help()`
- [] `__name__ == "__main__"` idiom
- [] Python execution model (interpreter, bytecode — overview)
- [] CPython vs PyPy vs other implementations (brief)

**📌 Data Types & Variables**
- [] Built-in types overview (numbers, str, bool, None, collections)
- [] `int` — arbitrary precision
- [] `float` & floating-point precision traps
- [] `bool` & truthiness
- [] `None` — singleton sentinel
- [] `type()` vs `isinstance()`
- [] Mutable vs immutable types
- [] Dynamic typing & duck typing
- [] Type coercion & implicit conversions
- [] `id()` & object identity

**📌 Strings & Text**
- [] String creation & immutability
- [] Indexing, slicing & negative indices
- [] String methods (split, join, strip, replace, find)
- [] f-strings, `.format()` & `%` formatting
- [] Raw strings & escape sequences
- [] `bytes` vs `str` (text vs binary)
- [] Encoding & decoding (`encode` / `decode`, UTF-8)
- [] `bytearray` mutability
- [] Regular expressions (`re` module basics)

**📌 Operators & Expressions**
- [] Arithmetic operators
- [] Comparison & chaining (`a < b < c`)
- [] Logical operators (`and`, `or`, `not`) & short-circuit
- [] Membership (`in`) & identity (`is`, `is not`)
- [] Bitwise operators (overview)
- [] Walrus operator `:=` (3.8+)
- [] Operator precedence
- [] `is` vs `==` (interview classic)

**📌 Control Flow**
- [] `if` / `elif` / `else`
- [] `for` loops & iterating iterables
- [] `while` loops
- [] `break`, `continue` & `else` on loops
- [] `range()` — lazy sequence of numbers
- [] `enumerate()` & `zip()`
- [] `match` / `case` structural pattern matching (3.10+)
- [] Ternary conditional expression

**📌 Functions**
- [] Defining functions with `def`
- [] Return values & multiple returns (tuple unpacking)
- [] Positional & keyword arguments
- [] Default parameter values
- [] Mutable default argument trap (interview classic)
- [] `*args` & `**kwargs`
- [] Positional-only (`/`) & keyword-only (`*`) parameters
- [] Lambda expressions & limitations
- [] Nested functions & closures
- [] Late binding closure trap in loops
- [] `functools.partial`
- [] Function annotations (type hints on parameters)

**📌 Data Structures — Core**
- [] `list` — dynamic array operations & complexity
- [] `tuple` — immutable sequences & unpacking
- [] `set` & `frozenset` — uniqueness & set operations
- [] `dict` — hash map, keys/values/items views
- [] Choosing list vs tuple vs set vs dict (interview)
- [] List, dict & set comprehensions
- [] Dict merge (`|`, `|=`, 3.9+)
- [] `collections.defaultdict`
- [] `collections.Counter`
- [] `collections.deque`
- [] `heapq` module (min-heap)
- [] `OrderedDict` & `ChainMap` (awareness)

**📌 Object-Oriented Programming**
- [] Classes & objects
- [] `__init__` & instance attributes
- [] `self` parameter
- [] Instance vs class vs static methods
- [] `@property`, getters & setters
- [] `@classmethod` & `@staticmethod`
- [] Inheritance & `super()`
- [] Method Resolution Order (MRO) & `__mro__`
- [] Polymorphism & duck typing
- [] Abstract Base Classes (`abc` module)
- [] `@dataclass` (3.7+)
- [] Composition vs inheritance
- [] `__slots__` for memory optimization
- [] Encapsulation conventions (`_private`, `__name mangling`)

**📌 Dunder (Magic) Methods**
- [] What dunder methods are
- [] `__str__` vs `__repr__`
- [] `__eq__`, `__hash__` & hashable objects
- [] `__len__`, `__getitem__`, `__setitem__`
- [] `__iter__` & `__next__` — making objects iterable
- [] `__enter__` & `__exit__` — context managers
- [] `__call__` — callable objects
- [] `__lt__` etc. for sorting
- [] Operator overloading overview

**📌 Exception Handling**
- [] `try` / `except` / `else` / `finally`
- [] Exception hierarchy (`BaseException`, `Exception`)
- [] Catching specific vs broad exceptions
- [] `raise` & re-raising
- [] Exception chaining (`raise ... from`)
- [] Custom exception classes
- [] EAFP vs LBYLE (Pythonic style)
- [] `assert` statement & `-O` flag

**📌 Modules, Packages & Environment**
- [] Modules & `import` / `from ... import`
- [] Package structure & `__init__.py`
- [] Absolute vs relative imports
- [] `if __name__ == "__main__"` for script vs module
- [] `sys.path` & module search path
- [] Virtual environments (`venv`, `virtualenv`)
- [] `pip` & dependency management
- [] `requirements.txt` vs `pyproject.toml` (Poetry/uv — overview)
- [] `__all__` for public API control
- [] Circular import problem & fixes

**📌 File I/O & Serialization**
- [] `open()` & file modes (`r`, `w`, `a`, `rb`, etc.)
- [] Context manager for files (`with open(...)`)
- [] Reading/writing text & binary files
- [] `pathlib.Path` — modern path handling
- [] `json` module — load/dump, custom encoders
- [] `csv` module
- [] `pickle` — serialization & security warning
- [] Working with directories (`os.walk`, pathlib glob)

**📌 Iterators, Generators & Comprehensions**
- [] Iterator protocol (`__iter__`, `__next__`)
- [] `iter()` & `StopIteration`
- [] Generator functions & `yield`
- [] Generator expressions vs list comprehensions
- [] Lazy evaluation & memory benefits
- [] `yield from` delegation
- [] `itertools` module (chain, islice, groupby, combinations)
- [] Sending values to generators (`.send()` — awareness)
- [] Generator vs iterator vs iterable (interview)

**📌 Decorators & Context Managers**
- [] Functions as first-class objects
- [] Decorator pattern & `@syntax`
- [] Writing parameterized decorators
- [] `functools.wraps` — preserving metadata
- [] Class-based decorators
- [] Stacking multiple decorators
- [] Context managers & the `with` statement
- [] `contextlib.contextmanager` decorator
- [] `contextlib.suppress`, `ExitStack`
- [] Common uses: timing, locking, DB sessions

**📌 Functional Programming Patterns**
- [] `map()`, `filter()`, `reduce()` (`functools`)
- [] `sorted()` with `key=` function
- [] List comprehension vs map/filter (readability)
- [] Immutability patterns in Python
- [] Pure functions & side effects
- [] Higher-order functions

**📌 Type Hints & Static Typing**
- [] Why type hints (documentation, tooling, mypy)
- [] Basic annotations (`int`, `str`, `list`, `dict`)
- [] `Optional`, `Union` & `|` syntax (3.10+)
- [] `list[str]` vs `List[str]` (3.9+ built-in generics)
- [] `TypedDict`, `NamedTuple`, `NewType`
- [] `Callable`, `TypeVar` & `Generic`
- [] `Protocol` — structural subtyping
- [] `Literal` & `Final`
- [] Running `mypy` / IDE type checking
- [] Type hints at runtime (`typing.get_type_hints`)

**📌 Concurrency & Parallelism**
- [] GIL (Global Interpreter Lock) & implications
- [] CPU-bound vs I/O-bound workloads
- [] `threading` module & thread safety
- [] Locks (`threading.Lock`, `RLock`) & race conditions
- [] `multiprocessing` — bypass GIL for CPU work
- [] `concurrent.futures` — ThreadPoolExecutor & ProcessPoolExecutor
- [] `asyncio` basics (`async`/`await`, event loop overview)
- [] When threading vs multiprocessing vs asyncio
- [] `queue.Queue` for producer-consumer
- [] Deadlocks & debugging concurrency (overview)

**📌 Memory Management & Performance**
- [] Reference counting & garbage collection
- [] `gc` module & cyclic references
- [] Shallow vs deep copy (`copy` module)
- [] Interning small ints & strings (awareness)
- [] `__slots__` & memory savings
- [] Big-O for common Python operations (list, dict, set)
- [] Profiling basics (`cProfile`, `timeit`)
- [] `weakref` module (overview)

**📌 Standard Library Essentials**
- [] `os` & `sys` — environment, argv, exit
- [] `datetime`, `timedelta`, `timezone` — aware vs naive
- [] `time` & `time.sleep`
- [] `logging` module — levels, handlers, formatters
- [] `argparse` for CLI scripts
- [] `functools` — lru_cache, wraps, partial
- [] `enum.Enum` for constants
- [] `dataclasses` vs `NamedTuple` vs dict
- [] `secrets` module for crypto-safe random
- [] `hashlib` for hashing
- [] `subprocess` — running shell commands safely
- [] `tempfile`, `shutil` utilities

**📌 Testing**
- [] `unittest` module basics
- [] `pytest` — tests, fixtures, parametrize
- [] `pytest.raises` for exception testing
- [] `unittest.mock` — Mock, patch, MagicMock
- [] Test organization & naming conventions
- [] Test coverage (`pytest-cov` — overview)
- [] Testing best practices (arrange-act-assert)
- [] Mocking I/O & external dependencies

**📌 Best Practices & Idioms**
- [] PEP 8 style guide
- [] Pythonic idioms (enumerate, zip, dict.get, any/all)
- [] List comprehension readability limits
- [] `global` & `nonlocal` keywords
- [] Truthiness & empty container checks
- [] Avoiding bare `except:`
- [] Using `with` for resource management
- [] `if __name__ == "__main__"` guard
- [] Linters & formatters (ruff, black, isort — overview)
- [] Security basics (never eval user input, pickle risks)

**📌 Design Patterns & Architecture**
- [] Singleton in Python (module pattern vs `__new__`)
- [] Factory & Strategy patterns
- [] Dependency injection without a framework
- [] Repository pattern for data access
- [] Protocol-based interfaces vs ABCs
- [] Clean separation: models, services, I/O

**📌 Interview Scenarios & Common Traps**
- [] Mutable default arguments
- [] Late-binding closures in loops
- [] `is` vs `==` for integers & strings
- [] Modifying list while iterating
- [] Shallow copy surprises with nested lists
- [] `__eq__` without consistent `__hash__`
- [] GIL question — explain clearly
- [] Implement flatten, group-by, anagram check
- [] Reverse linked list / tree traversal (in Python)
- [] When to reach for C extensions / NumPy (awareness)
