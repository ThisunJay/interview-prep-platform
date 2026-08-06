# Java Core V2

A deep-dive companion to the Java Core V2 checklist. Each heading matches the original outline; under every topic you'll find **what it is**, **why it exists**, **how it works**, and **interview-ready nuance**.

---

### Java Collections Framework

The Java Collections Framework (JCF) is the standard library for storing and manipulating groups of objects. It lives mainly in `java.util` and is built on a small set of **interfaces**, with many **implementations** optimized for different access patterns.

**Core interface hierarchy:**

```
Iterable
  └── Collection
        ├── List   (ordered, duplicates allowed, index access)
        ├── Set    (no duplicates; some preserve order)
        ├── Queue  (typically FIFO; specialized for holding before processing)
        └── Deque  (double-ended queue)
Map  (key → value; not a Collection, but part of the framework)
```

**Why it matters:** Almost every Java app stores data in lists, sets, or maps. Interviews probe whether you pick the right structure (`ArrayList` vs `LinkedList`, `HashMap` vs `TreeMap`, `HashSet` vs `LinkedHashSet`) and understand complexity, ordering, null policy, and thread-safety.

**Supporting pieces:**

- **Iterators** — traverse without exposing internal structure; some are fail-fast.
- **Collections utility** (`java.util.Collections`) — `sort`, `synchronizedList`, `unmodifiableList`, `binarySearch`, etc.
- **Arrays utility** — bridge between arrays and collections (`Arrays.asList`, `sort`).
- **Algorithms** — sort, shuffle, reverse, frequency — work on `List` / arrays via utilities.

**Mental model:** Program to interfaces (`List`, `Map`) in APIs; choose concrete classes at construction based on performance and semantics.

---

### java.util.concurrent Package

`java.util.concurrent` provides high-level concurrency utilities so you rarely need raw `synchronized` and hand-rolled thread management for common patterns.

**Major categories:**

| Area | Examples |
|---|---|
| Executors | `ExecutorService`, `ThreadPoolExecutor`, `ScheduledExecutorService`, `ForkJoinPool` |
| Concurrent collections | `ConcurrentHashMap`, `CopyOnWriteArrayList`, `BlockingQueue` impls |
| Synchronizers | `CountDownLatch`, `CyclicBarrier`, `Semaphore`, `Phaser`, `Exchanger` |
| Locks / atomics | `ReentrantLock`, `ReadWriteLock`, `StampedLock`, `AtomicInteger`, `LongAdder` |
| Futures | `Future`, `CompletableFuture` |

**Why it exists:** Correct concurrency is hard. These types encapsulate proven patterns (work queues, safe maps under concurrent reads/writes, coordination barriers) and usually outperform naive locking.

**Interview anchors:**

- Prefer concurrent collections over `Collections.synchronizedMap` for scalability.
- `BlockingQueue` is the backbone of producer–consumer.
- Know when to use latch (one-shot) vs barrier (reusable phases) vs semaphore (permits).

---

### Queue, Deque, Stack, LinkedList

**Queue** — hold elements prior to processing. Typical ops: `offer`/`add` (insert), `poll`/`remove` (take head), `peek`/`element` (look). `offer`/`poll`/`peek` prefer returning special values over throwing; `add`/`remove`/`element` throw on failure.

Implementations: `LinkedList`, `ArrayDeque`, `PriorityQueue`, `ArrayBlockingQueue`, `LinkedBlockingQueue`, etc.

**Deque (Double-Ended Queue)** — insert/remove at both ends. Methods: `addFirst`/`addLast`, `pollFirst`/`pollLast`. `ArrayDeque` is the go-to general-purpose deque (resizing array, no capacity waste of `LinkedList` nodes for this use).

**Stack** — LIFO. The legacy `java.util.Stack` class extends `Vector` and is considered obsolete. Prefer:

```java
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);
stack.pop();
stack.peek();
```

**LinkedList** — doubly linked list implementing `List` and `Deque`. Good for frequent insert/remove in the middle *when you already have the node/iterator*; poor for random index access (`get(i)` is O(n)). For stacks/queues, `ArrayDeque` usually wins on memory and speed. Don't default to `LinkedList` for "list" — default to `ArrayList`.

---

### Java Algo

"Java Algo" means implementing classic algorithms and data structures *in Java*, and knowing the complexity of library operations.

**Must-know library complexities (typical):**

| Structure | Access | Search | Insert | Notes |
|---|---|---|---|---|
| `ArrayList` | O(1) | O(n) | O(1) amort. end | Resize cost |
| `LinkedList` | O(n) | O(n) | O(1) at known node | |
| `HashMap` | — | O(1) avg | O(1) avg | O(n) worst |
| `TreeMap` | — | O(log n) | O(log n) | Sorted keys |
| `PriorityQueue` | peek O(1) | — | O(log n) | Heap |
| `HashSet` | — | O(1) avg | O(1) avg | Backed by HashMap |

**Interview algorithm themes in Java:**

- Two pointers / sliding window on arrays & strings
- HashMap frequency counting
- Sorting + two-sum variants
- BFS/DFS with `Queue` / recursion / explicit `Deque`
- Heaps via `PriorityQueue` (min-heap default; max-heap with reversed comparator)
- Binary search: `Arrays.binarySearch`, or manual on answer space
- Graph: adjacency list as `Map<T, List<T>>` or `List<List<Integer>>`

**Java-specific tips:** watch integer overflow; prefer `ArrayList` growth patterns; for string building in loops use `StringBuilder`; for recursion depth, consider iterative with stack.

---

### Java Design Patterns (Factory, Singleton, etc.)

Design patterns are reusable solutions to recurring design problems. In Java interviews, expect definitions, when to use them, and a sketch.

**Creational**

- **Singleton** — one instance. Modern approaches: enum singleton (`ENUM INSTANCE`), holder idiom, or DI frameworks managing scope. Classic `private` constructor + `getInstance()` needs care for reflection/serialization/thread-safety.
- **Factory Method / Abstract Factory** — encapsulate object creation; caller depends on interface, not concrete class.
- **Builder** — construct complex objects step-by-step (`Lombok @Builder`, or manual). Avoid telescoping constructors.
- **Prototype** — clone existing instance (`Cloneable` is awkward in Java; prefer copy constructors).

**Structural**

- **Adapter** — convert one interface to another.
- **Decorator** — wrap to add behavior (`java.io` streams are textbook decorators: `new BufferedReader(new FileReader(...))`).
- **Facade** — simplify a subsystem with one entry API.
- **Proxy** — stand-in for access control, lazy load, or remoting (JDK dynamic proxy, Spring AOP).

**Behavioral**

- **Strategy** — swap algorithms (often lambdas / functional interfaces today).
- **Observer** — publish–subscribe (`PropertyChangeListener`, reactive streams).
- **Template Method** — skeleton in base class, hooks in subclasses.
- **Command** — encapsulate requests as objects (undo queues).
- **Iterator** — `Iterator` / enhanced for-loop.

**Interview tip:** Relate patterns to JDK/Spring examples. Prefer composition and DI over forcing Gang of Four ceremony.

---

### Collectors, Grouping, Mapping

`Collectors` are reductions used with `Stream.collect(...)` to accumulate into collections or summaries.

**Common collectors:**

```java
list.stream().collect(Collectors.toList());           // or .toList() (Java 16+)
Collectors.toSet();
Collectors.toMap(Person::id, Person::name);
Collectors.joining(", ");
Collectors.counting();
Collectors.summingInt(Order::amount);
Collectors.averagingDouble(...);
Collectors.summarizingInt(...); // count/sum/min/max/avg
```

**Grouping & partitioning:**

```java
Map<Department, List<Employee>> byDept =
    emps.stream().collect(Collectors.groupingBy(Employee::dept));

Map<Department, Long> counts =
    emps.stream().collect(Collectors.groupingBy(Employee::dept, Collectors.counting()));

Map<Boolean, List<Employee>> parts =
    emps.stream().collect(Collectors.partitioningBy(Employee::active));
```

**Downstream collectors:** `groupingBy(classifier, downstream)` — e.g. group then map names:

```java
Collectors.groupingBy(Employee::dept,
    Collectors.mapping(Employee::name, Collectors.toList()));
```

**`collectingAndThen`** — finish with a finisher (e.g. wrap in `Collections.unmodifiableList`).

**Caveats:** `toMap` throws on duplicate keys unless you supply a merge function. `groupingBy` uses `HashMap` by default; overload accepts map supplier (`TreeMap::new`). Parallel streams need concurrent collectors (`groupingByConcurrent`) carefully.

---

### JAR, WAR Files

**JAR (Java ARchive)** — ZIP file packaging `.class` files, resources, and a `META-INF/MANIFEST.MF`. Used for libraries and runnable apps.

```bash
jar cf app.jar -C classes .
java -jar app.jar   # needs Main-Class in manifest
```

**Executable JAR:** manifest entry `Main-Class: com.example.Main`. Dependencies may be shaded (fat/uber JAR) or listed on the classpath / via module path.

**WAR (Web ARchive)** — JAR layout specialized for Java web apps: `WEB-INF/web.xml` (legacy), `WEB-INF/classes`, `WEB-INF/lib`, static assets. Deployed to a servlet container (Tomcat, Jetty). Spring Boot often embeds the server and ships an executable JAR instead of a traditional WAR.

**Related:** EAR for Java EE multi-module enterprise archives (less common in modern microservice stacks).

---

### Maven/Gradle Basics

Build tools manage compilation, dependencies, tests, and packaging.

**Maven**

- Convention over configuration; `pom.xml` is the project model.
- Lifecycle: `validate` → `compile` → `test` → `package` → `verify` → `install` → `deploy`.
- Coordinates: `groupId:artifactId:version`.
- Scopes: `compile`, `provided`, `runtime`, `test`.
- Multi-module reactors with parent POMs.
- Plugins: compiler, surefire (tests), failsafe (IT), shade (fat JAR).

**Gradle**

- Groovy or Kotlin DSL (`build.gradle` / `build.gradle.kts`).
- Task graph; incremental & cache-friendly (especially with configuration cache).
- Highly flexible; default for Android; popular for large multi-projects.
- Same dependency coordinates as Maven Central.

**Interview comparison:** Maven is standardized and ubiquitous in enterprise Java; Gradle is more flexible/faster for large builds. Both resolve transitive dependencies and can publish artifacts.

---

### Unit Testing (JUnit, Mockito Basics)

**JUnit 5 (Jupiter)** — modern standard:

```java
@Test
void adds() {
    assertEquals(3, calc.add(1, 2));
}

@ParameterizedTest
@ValueSource(ints = {1, 2, 3})
void positive(int n) { assertTrue(n > 0); }

@BeforeEach void setUp() { ... }
```

Annotations: `@Test`, `@BeforeEach`/`@AfterEach`, `@BeforeAll`/`@AfterAll`, `@Disabled`, `@DisplayName`, `@Nested`, `@ExtendWith`.

**Mockito** — mock dependencies to isolate the unit:

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock PaymentGateway gateway;
    @InjectMocks OrderService service;

    @Test
    void pays() {
        when(gateway.charge(any())).thenReturn(true);
        assertTrue(service.checkout(order));
        verify(gateway).charge(order);
    }
}
```

Concepts: stubbing (`when`/`thenReturn`), verification (`verify`), argument matchers (`any()`, `eq()`), spies (partial real objects). Prefer testing behavior over implementation details. Don't mock what you don't own without care; prefer fakes for complex types when clearer.

---

### ExecutorService & ThreadPool

`ExecutorService` decouples **task submission** from **thread management**.

```java
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> f = pool.submit(() -> compute());
int result = f.get(); // blocks; prefer timeouts
pool.shutdown();      // reject new tasks; finish existing
```

**Common factories:**

| Factory | Behavior |
|---|---|
| `newFixedThreadPool(n)` | Fixed n threads; unbounded queue |
| `newCachedThreadPool()` | Creates threads as needed; reclaims idle; can explode under load |
| `newSingleThreadExecutor()` | One thread; sequential |
| `newScheduledThreadPool(n)` | Delayed/periodic tasks |
| `newWorkStealingPool()` | ForkJoin-based |

**Prefer explicit `ThreadPoolExecutor`** in production: set core/max size, bounded queue, and `RejectedExecutionHandler` (e.g. `CallerRunsPolicy`) so overload is visible and controlled. Unbounded queues + fixed pools can hide memory problems.

**Lifecycle:** `shutdown` vs `shutdownNow`; await termination; always release pools in apps/servers (or use managed executors in frameworks).

---

### Reflection API

Reflection (`java.lang.reflect`) inspects and manipulates classes, methods, fields at runtime.

```java
Class<?> clazz = Class.forName("com.example.User");
Object obj = clazz.getDeclaredConstructor().newInstance();
Method m = clazz.getDeclaredMethod("setName", String.class);
m.setAccessible(true); // bypass private (module rules may still block)
m.invoke(obj, "Ada");
```

**Uses:** frameworks (Spring DI, Jackson, JPA), plugins, serializers, test libraries.

**Costs & risks:**

- Slow vs direct calls; breaks encapsulation; brittle under refactoring/renames.
- Security managers / JPMS strongly encapsulate JDK internals (`setAccessible` may fail).
- Prefer method handles / compile-time alternatives when possible; know reflection for framework interviews.

Related: `Proxy.newProxyInstance` for dynamic proxies; annotations read via reflection.

---

### CompletableFuture

`CompletableFuture<T>` is a composable, non-blocking evolution of `Future` for async pipelines.

```java
CompletableFuture.supplyAsync(() -> fetchUser(id), executor)
    .thenApply(user -> enrich(user))
    .thenCompose(user -> fetchOrdersAsync(user)) // flatMap-like
    .thenAccept(orders -> save(orders))
    .exceptionally(ex -> { log(ex); return null; });
```

**Key operations:**

- Create: `supplyAsync`, `runAsync`, `completedFuture`
- Transform: `thenApply`, `thenAccept`, `thenRun`
- Chain futures: `thenCompose`
- Combine: `thenCombine`, `allOf`, `anyOf`
- Handle errors: `exceptionally`, `handle`, `whenComplete`
- Complete manually: `complete`, `completeExceptionally`

**Pitfalls:** default `ForkJoinPool.commonPool()` may be wrong for blocking I/O — pass a dedicated `Executor`. Avoid `.get()` on hot threads without timeout. Know difference between `thenApply` (sync transform) and `thenApplyAsync` (extra async stage).

---

### Collections.sort & custom sorting

```java
Collections.sort(list); // natural order; elements must be Comparable
Collections.sort(list, comparator);
list.sort(comparator);  // List default method — preferred modern style
Arrays.sort(array);
```

**Custom sorting:**

```java
list.sort(Comparator.comparing(Person::age)
    .thenComparing(Person::name)
    .reversed());
```

`Comparator.nullsFirst` / `nullsLast` handle nulls. For reverse natural order: `Comparator.reverseOrder()`.

**Stability:** `Collections.sort` / `List.sort` use TimSort — **stable** (equal elements keep relative order). Important when sorting by secondary keys in multiple passes.

Sorting mutates the list in place. For streams: `sorted()` returns a new stream pipeline result without mutating the source (when collected).

---

### Fail-fast vs Fail-safe Iterators

**Fail-fast** (most `java.util` collections: `ArrayList`, `HashMap`, etc.):

- Track a `modCount`.
- If the collection is structurally modified while iterating (except via iterator's own `remove`), the iterator throws `ConcurrentModificationException`.
- Detection is best-effort, not a guarantee in all concurrent scenarios.

```java
for (String s : list) {
    list.add("x"); // CME likely
}
```

**Fail-safe / weakly consistent** (concurrent collections, e.g. `ConcurrentHashMap`, `CopyOnWriteArrayList`):

- Iteration does not throw CME on concurrent modification.
- May reflect a snapshot or weakly consistent view — not necessarily a frozen moment for all types.
- `CopyOnWriteArrayList` iterators see a snapshot at creation time (safe, but writes copy the array — costly for frequent writes).

**Interview takeaway:** Fail-fast protects against bugs in single-threaded misuse; concurrent collections address multi-threaded access with different consistency models.

---

### Java I/O (FileReader, BufferedReader, etc.)

Classic `java.io` is stream-oriented.

**Byte streams:** `InputStream` / `OutputStream` (`FileInputStream`, `BufferedInputStream`).  
**Character streams:** `Reader` / `Writer` (`FileReader`, `FileWriter`, `InputStreamReader` with charset).

```java
try (BufferedReader br = new BufferedReader(new FileReader("f.txt", StandardCharsets.UTF_8))) {
    String line;
    while ((line = br.readLine()) != null) {
        process(line);
    }
}
```

**Why buffer?** Unbuffered reads/writes hit OS per call; `BufferedReader`/`BufferedWriter` reduce syscalls.

**Decorator pattern:** wrap streams (`new DataInputStream(new BufferedInputStream(...))`).

**Modern preference:** `java.nio.file.Files` / `Path` for many tasks; always specify charset (`StandardCharsets.UTF_8`) — `FileReader` without charset uses the platform default (legacy footgun). Prefer `Files.newBufferedReader(path, UTF_8)`.

---

### Sealed Classes (Java 15+)

Sealed classes/interfaces restrict which types may extend/implement them (finalized in Java 17).

```java
public sealed interface Shape permits Circle, Rectangle, Square {}

public final class Circle implements Shape { ... }
public final class Rectangle implements Shape { ... }
public non-sealed class Square implements Shape { ... } // open for further extension
```

Permitted subtypes must be `final`, `sealed`, or `non-sealed`, and typically in the same module/package (rules apply).

**Why:** Domain modeling with a closed hierarchy — enables exhaustive `switch`/pattern matching and clearer API contracts than open inheritance. Excellent with records for algebraic data types in Java.

---

### Records (Java 14+)

Records are compact, immutable data carriers (finalized Java 16):

```java
public record Point(int x, int y) {}
// auto: constructor, accessors x()/y(), equals, hashCode, toString
```

**Rules & features:**

- Fields (components) are `private final`; class is implicitly `final`.
- Can add compact constructor for validation:

```java
public record Point(int x, int y) {
    public Point {
        if (x < 0 || y < 0) throw new IllegalArgumentException();
    }
}
```

- Can implement interfaces; cannot extend other classes.
- Great for DTOs, map keys (careful with mutability of referenced objects), pattern matching.

Not a replacement for all entities (JPA entities often need mutable/no-arg patterns) — use where immutability fits.

---

### Garbage Collection (GC) & GC Tuning Basics

GC automatically reclaims objects that are no longer reachable, preventing most manual memory errors (but not memory leaks from lingering references).

**Generational hypothesis:** most objects die young → heap split into **Young** (Eden + Survivor) and **Old** generations. Minor GC collects young gen; Major/Full GC collects old (and often more).

**Common collectors (HotSpot):**

| Collector | Notes |
|---|---|
| Serial | Single-threaded; small apps |
| Parallel | Throughput-oriented multi-thread young/old |
| G1 (default modern) | Region-based; balances throughput & pause goals |
| ZGC / Shenandoah | Ultra-low pause; large heaps |

**Tuning basics (know flags conceptually):**

- `-Xms` / `-Xmx` — initial/max heap
- `-XX:+UseG1GC` / ZGC selection
- `-XX:MaxGCPauseMillis` — pause goal (G1)
- Logging: `-Xlog:gc*` (unified logging)

**Process:** Measure first (GC logs, flight recorder). Fix leaks and allocation churn before aggressive flag tweaking. Interviewers want: reachability, generations, stop-the-world pauses, and that tuning without metrics is guesswork.

---

### JVM Architecture

The JVM executes Java bytecode and provides runtime services.

**Main subsystems:**

1. **Class Loader Subsystem** — load, link (verify, prepare, resolve), initialize classes.
2. **Runtime Data Areas**
   - **Method Area / Metaspace** — class metadata, static variables (Metaspace is native memory in modern HotSpot).
   - **Heap** — objects/arrays; GC-managed.
   - **Java stacks** — per-thread frames: locals, operand stack.
   - **PC register** — per-thread current instruction.
   - **Native method stacks**
3. **Execution Engine** — interpreter + JIT compiler(s); GC.
4. **JNI** — native code bridge.

**Class loading phases:** Loading → Linking (Verification, Preparation, Resolution) → Initialization (`<clinit>`).

**Interview diagram:** Source → `javac` → `.class` bytecode → ClassLoader → JVM → Interpreter/JIT → CPU; Heap + Stack + Metaspace beside the engine.

---

### Method References

Syntactic shorthand for lambdas that only call an existing method:

```java
list.forEach(System.out::println);           // instance method of particular object
list.sort(String::compareToIgnoreCase);      // instance method of arbitrary object
Person::new;                                   // constructor reference
Integer::parseInt;                             // static method
```

**Kinds:** `static`, bound instance (`obj::method`), unbound instance (`Class::method` — first arg is the instance), array constructor (`String[]::new`).

Same target-type rules as lambdas — need a compatible functional interface. Prefer method references when they are clearer than lambdas; prefer lambdas when you need extra logic.

---

### Functional Interfaces

A functional interface has **exactly one abstract method** (SAM). May have `default`/`static` methods. Marked `@FunctionalInterface` (optional but recommended — compiler enforces the contract).

**Core `java.util.function` types:**

| Interface | Shape |
|---|---|
| `Function<T,R>` | T → R |
| `Predicate<T>` | T → boolean |
| `Consumer<T>` | T → void |
| `Supplier<T>` | () → T |
| `UnaryOperator<T>` | T → T |
| `BinaryOperator<T>` | (T,T) → T |
| `BiFunction`, `BiPredicate`, `BiConsumer` | two-arg variants |

Primitive specializations (`IntPredicate`, `ToIntFunction`, …) avoid boxing.

Lambdas and method references are instances of functional interfaces — the foundation of Streams and modern Java APIs.

---

### Synchronized, volatile, wait/notify

**`synchronized`** — intrinsic locking on an object monitor:

```java
synchronized (lock) {
    // critical section
}
public synchronized void mut() { ... } // locks this
public static synchronized void s() { ... } // locks Class object
```

Provides mutual exclusion and **happens-before** visibility for releases/acquires of the same lock.

**`volatile`** — ensures visibility of writes to a variable across threads; prevents some reorderings. Does **not** make compound actions (`i++`) atomic. Use for flags / publication of immutable state; use atomics or locks for read-modify-write.

**`wait` / `notify` / `notifyAll`** — must hold the monitor lock:

```java
synchronized (lock) {
    while (!condition) {  // always wait in a loop
        lock.wait();
    }
    // proceed
}
synchronized (lock) {
    condition = true;
    lock.notifyAll();
}
```

Prefer higher-level constructs (`BlockingQueue`, `CountDownLatch`, `Lock` + `Condition`) over bare wait/notify in new code — but know them for interviews.

---

### ThreadLocal

`ThreadLocal<T>` gives each thread its own independent value of a variable:

```java
static final ThreadLocal<SimpleDateFormat> FMT =
    ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

FMT.get().format(date);
```

**Uses:** per-request context (legacy), JDBC connection binding in some frameworks, preventing sharing of non-thread-safe objects.

**Danger:** In thread pools, values **stick** to the worker thread. Always `remove()` in a `finally` after the task (or use framework-scoped context). Leaks of classloaders/app objects via `ThreadLocal` are classic Tomcat warnings.

Java 21+ virtual threads: still be careful; prefer scoped values (`ScopedValue`) for immutable request context in modern designs when available.

---

### Nested & Inner Classes

**Static nested class** — `static class Nested` inside an outer class. No hidden reference to outer instance. Good for helper types / builders.

**Inner class (non-static)** — holds implicit reference to outer instance (`Outer.this`). Can access outer instance fields.

**Local class** — declared inside a method/block.

**Anonymous class** — see dedicated section; a one-off inner/local class.

```java
class Outer {
    private int x;
    class Inner {
        void print() { System.out.println(x); }
    }
    static class Nested {
        void hi() { /* no access to instance x */ }
    }
}
```

**Serialization/memory:** inner classes can keep outer objects alive → leaks. Prefer `static` nested when you don't need the outer instance.

---

### Immutability & Thread-Safety

**Immutable object:** state cannot change after construction (e.g. `String`, boxed primitives, records with immutable components).

**How to design:**

- `final` class (or sealed carefully), `private final` fields
- No setters; defensive copies of mutable inputs/outputs
- Don't expose mutable internals

**Why thread-safe:** if no state changes, concurrent reads need no locking (after safe publication). Immutable objects are ideal map keys and shared config.

**Thread-safety strategies:** immutability; confinement (touch from one thread); synchronization/locks; concurrent collections; atomic variables. "Thread-safe class" means documented concurrent use without external sync — always read the docs (`ArrayList` is not thread-safe; `ConcurrentHashMap` is for concurrent use with caveats on compound sequences).

---

### FlatMap vs Map

In Streams (and Optional):

- **`map`** — 1:1 transform. Each input element becomes one output element.
- **`flatMap`** — 1:many (or nested → flat). Each input produces a **stream** (or Optional), then flattened into one stream.

```java
List<String> words = List.of("a b", "c");
words.stream().map(s -> s.split(" "));      // Stream<String[]>
words.stream().flatMap(s -> Arrays.stream(s.split(" "))); // Stream<String>
```

```java
optionalUser.flatMap(User::getAddress); // Optional<Address> if getAddress returns Optional
optionalUser.map(User::getAddress);     // Optional<Optional<Address>> if nested
```

**Interview line:** "`map` wraps; `flatMap` flattens." Same idea in `CompletableFuture.thenCompose` vs `thenApply`.

---

### Date and Time API (java.time)

`java.time` (JSR-310, Java 8+) replaced `Date` / `Calendar` mess with immutable, clear types:

| Type | Meaning |
|---|---|
| `Instant` | Point on timeline (UTC timeline) |
| `LocalDate` | Date without time/zone |
| `LocalTime` | Time without date/zone |
| `LocalDateTime` | Date+time, no zone |
| `ZonedDateTime` | Date+time with zone |
| `OffsetDateTime` | With UTC offset |
| `Duration` | Time-based amount (seconds/nanos) |
| `Period` | Date-based amount (years/months/days) |
| `DateTimeFormatter` | Parse/format |

```java
LocalDate d = LocalDate.now(ZoneId.of("Asia/Colombo"));
ZonedDateTime z = ZonedDateTime.now(ZoneOffset.UTC);
Duration between = Duration.between(start, end);
```

**Rules:** Prefer `Instant` for machine timestamps; `LocalDate` for birthdays; always be explicit about zones for scheduling. Avoid legacy `Date` unless interoperating — convert via `Date.from(instant)` / `date.toInstant()`.

---

### Locks (ReentrantLock etc.)

`java.util.concurrent.locks` offers explicit locks beyond `synchronized`:

**`ReentrantLock`**

```java
lock.lock();
try {
    // critical
} finally {
    lock.unlock(); // always
}
```

Extras vs synchronized: `tryLock`, `tryLock(timeout)`, `lockInterruptibly`, fairness option, multiple `Condition` objects (`await`/`signal`).

**`ReadWriteLock` / `ReentrantReadWriteLock`** — many concurrent readers OR one writer. Helps read-heavy structures (watch writer starvation).

**`StampedLock`** — optimistic reads; advanced, easy to misuse.

**When:** need try/timed lock, interruptible lock acquisition, or multiple conditions. Otherwise `synchronized` is simpler and sufficient. Always unlock in `finally`. Avoid deadlocks: consistent lock ordering.

---

### Annotations (Built-in & Custom)

Annotations are metadata on classes/methods/fields/parameters (`@Override`, `@Deprecated`, `@SuppressWarnings`, `@FunctionalInterface`, `@SafeVarargs`).

**Retention policies:** `SOURCE` (discarded), `CLASS` (in bytecode, not runtime default reflection), `RUNTIME` (available via reflection).

**Custom annotation:**

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Audited {
    String value() default "";
}
```

Frameworks (JUnit, Spring, Jackson, Bean Validation) are annotation-driven. Marker annotations have no elements; single-element often use `value`. Meta-annotations (`@Inherited`, `@Documented`, `@Repeatable`) refine behavior.

---

### Stream API

Streams process sequences of elements declaratively with lazy pipelines:

```java
orders.stream()
    .filter(o -> o.active())
    .map(Order::total)
    .filter(t -> t > 100)
    .sorted()
    .collect(Collectors.toList());
```

**Characteristics:**

- **Not a data structure** — pulls from a source (collection, array, generator).
- **Lazy** intermediate ops (`filter`, `map`, `flatMap`, `distinct`, `sorted`, `limit`) until a **terminal** op (`collect`, `forEach`, `reduce`, `count`, `anyMatch`, …).
- **Possibly parallel** via `parallelStream()` — only win when enough data + pure ops + right workload; not a free speedup.
- Must be **non-interfering** and preferably **stateless** intermediate ops; don't mutate the source mid-stream.

**Primitive streams:** `IntStream`, `LongStream`, `DoubleStream` avoid boxing.

**Order:** encounter order matters for some ops; `findFirst` vs `findAny` in parallel.

---

### JIT Compiler

The JVM starts by **interpreting** bytecode, then the **Just-In-Time (JIT)** compiler compiles "hot" methods to native machine code.

**HotSpot tiers (simplified):** interpretation → C1 (client, quick) → C2 (server, heavy optimize) with profiling in between. Graal can replace C2 in some setups.

**Optimizations:** inlining, escape analysis (stack allocate / scalar replace), loop unrolling, monomorphic call site optimization, dead code elimination.

**Implications:**

- Microbenchmarks need warmup (JMH).
- First requests may be slower (cold JVM).
- `-XX:+PrintCompilation` / flight recorder for diagnosis.
- Deoptimization can happen if assumptions fail.

Interview: Java isn't "always interpreted"; steady-state performance relies on JIT.

---

### Java Memory Model (JMM)

The JMM defines how threads interact through memory — what writes are guaranteed visible to other threads and when reorderings are allowed.

**Without synchronization,** compilers/CPUs may reorder instructions; threads may cache values — **data races** yield undefined behavior (stale reads, impossible-looking states).

**Happens-before relationships** (examples):

- Unlock of monitor *happens-before* subsequent lock of same monitor
- Write to `volatile` *happens-before* subsequent read of that volatile
- Thread `start` *happens-before* actions in the started thread
- Actions in a thread *happen-before* successful `join` on that thread
- Chain transitively

**Safe publication:** initialize an object then publish via volatile field, synchronized, concurrent collection, or final-field freeze semantics (properly constructed immutables).

Interview depth: volatile ≠ atomicity; synchronized gives exclusion + visibility; final fields have special initialization safety.

---

### Java Modules (JPMS - Java 9+)

The Java Platform Module System adds explicit module boundaries:

```java
// module-info.java
module com.example.app {
    requires java.sql;
    requires com.example.lib;
    exports com.example.app.api;
}
```

**Goals:** strong encapsulation (hide internals), reliable configuration (explicit dependencies), smaller runtimes (`jlink`).

**Keywords:** `requires`, `requires transitive`, `exports`, `opens` (reflection), `provides`/`uses` (services).

**Reality check:** many apps still live on the classpath ("unnamed module"). Frameworks historically needed `opens` for reflection. Know concepts for interviews; day-to-day Spring Boot often still classpath-first unless modularized deliberately.

---

### JAVA JRE, JDK

| | JDK | JRE |
|---|---|---|
| Contents | Compiler (`javac`), tools (`jar`, `jlink`, debuggers), + runtime | JVM + core libs to **run** apps |
| Audience | Developers | End users / runtime-only installs |

Since Java 11, Oracle no longer ships a separate consumer JRE the old way — you typically install a **JDK** (or a trimmed runtime via `jlink`). Colloquially: **JDK = develop**, **JRE = run**. The **JVM** is the virtual machine inside both.

Also distinguish: **SE** (Standard Edition) vs **EE**/**Jakarta EE** (enterprise APIs, historically separate).

---

### Java bytecode

`javac` compiles `.java` → `.class` files containing **bytecode** — instructions for the JVM (not a specific CPU).

View with:

```bash
javap -c -p com.example.Foo
```

Examples of opcodes: `aload`, `invokevirtual`, `invokeinterface`, `invokestatic`, `invokedynamic` (lambdas), `getfield`, `new`.

Bytecode enables portability ("write once, run anywhere"), verification before execution, and JIT optimization. Instrumentation agents and libraries (Byte Buddy, ASM) rewrite bytecode for AOP/mocks.

---

### Java Basics & Syntax

Java is a statically typed, object-oriented language with a C-like syntax. Entry point:

```java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}
```

**Structure:** packages → classes/interfaces/enums/records → members (fields, methods, constructors, nested types). Statements end with `;`. Blocks use `{}`. Comments: `//`, `/* */`, `/** javadoc */`.

**Identifiers:** letters, digits, `_`, `$`; can't start with digit. Conventions: `PascalCase` types, `camelCase` methods/fields, `UPPER_SNAKE` constants.

**Compilation/run:** `javac Hello.java` then `java Hello` (or use Maven/Gradle/IDE). Package name should match directory structure.

---

### Data Types & Variables

**Primitive types:** `byte`, `short`, `int`, `long`, `float`, `double`, `char`, `boolean`.

| Type | Size (bits) | Notes |
|---|---|---|
| byte | 8 | |
| short | 16 | |
| int | 32 | default integer literals |
| long | 64 | suffix `L` |
| float | 32 | suffix `f`; binary floating point |
| double | 64 | default floating literals |
| char | 16 | UTF-16 code unit |
| boolean | JVM-dependent | `true`/`false` |

**Reference types:** objects, arrays, interfaces — variables hold references (or `null`).

**Variables:** local (must assign before use), instance fields (default 0/`null`/`false`), static fields. `final` variables can't be reassigned (for refs, object may still mutate).

**Literals:** `0xFF`, `0b1010`, underscores `1_000_000`, text blocks `"""..."""` (Java 15+).

---

### Operators

**Arithmetic:** `+ - * / %`  
**Unary:** `+ - ++ -- !`  
**Relational:** `== != < > <= >=` (for objects, `==` is reference identity — use `equals` for values)  
**Logical:** `&& || & | ^` (short-circuit `&&`/`||`)  
**Bitwise:** `& | ^ ~ << >> >>>`  
**Assignment:** `= += -=` …  
**Ternary:** `cond ? a : b`  
**instanceof** (pattern matching forms in newer Java)  
**new**, cast `(Type)`, method call

**Precedence:** know that `&&` binds tighter than `||`; when unsure, parenthesize. String `+` concatenates and can hide performance issues in loops (`StringBuilder`).

**Integer division** truncates toward zero. Watch overflow — Java silently wraps `int`/`long`.

---

### Control Flow Statements (if, switch, loops)

**if / else if / else** — branches on boolean expressions.

**switch** — classic statement on `int`, `String`, enums, some wrappers; see Switch Expressions for modern forms.

**Loops:**

```java
for (int i = 0; i < n; i++) { ... }
for (String s : list) { ... }          // enhanced for
while (cond) { ... }
do { ... } while (cond);
```

**Control:** `break`, `continue`, labeled break/continue (rare), `return`.

Avoid busy-wait loops; prefer blocking queues / park for concurrency. Prefer enhanced-for when index isn't needed; be careful removing from a collection while enhancing-for (use `Iterator.remove` or `removeIf`).

---

### Arrays

Fixed-size, ordered containers of one type (primitive or reference):

```java
int[] a = new int[10];
int[] b = {1, 2, 3};
int[][] matrix = new int[3][4];
```

Length via `a.length`. Default element values: `0` / `0.0` / `false` / `null`.

**Utilities:** `Arrays.sort`, `binarySearch`, `fill`, `copyOf`, `equals`, `deepEquals`, `stream(a)`.

Arrays are covariant (`String[]` is `Object[]`) — can throw `ArrayStoreException` at runtime. Generics are invariant — one reason preferring `List<T>` in APIs. Multidimensional arrays are arrays of arrays (rows can have different lengths — jagged).

---

### Strings & StringBuilder

**`String`** is immutable; methods return new strings (`substring`, `toLowerCase`, `replace`). Stored in the heap; literals may be interned in the string pool.

```java
String s = "hi" + name; // compiler may optimize simple cases
```

**`StringBuilder`** — mutable character sequence for building in loops (not thread-safe).  
**`StringBuffer`** — synchronized variant (rarely needed).

```java
StringBuilder sb = new StringBuilder();
for (String w : words) sb.append(w).append(' ');
return sb.toString();
```

**Comparisons:** `equals` for content; `equalsIgnoreCase`; `compareTo`; never use `==` for logical equality (except carefully with interned literals — still discouraged).

**Text blocks** (Java 15+): multi-line literals with `"""`.

---

### Object-Oriented Programming (OOP)

OOP models software as interacting **objects** that bundle **state** (fields) and **behavior** (methods). Java's pillars typically taught as:

1. Encapsulation  
2. Inheritance  
3. Polymorphism  
4. Abstraction  

Additional OO practice: favor **composition over inheritance**, depend on abstractions, keep types cohesive. Java is class-based (not prototype-based); all objects inherit from `java.lang.Object` (`equals`, `hashCode`, `toString`, `getClass`, `wait`/`notify`, …).

---

### Classes & Objects

A **class** is a blueprint; an **object** (instance) is a concrete allocation of that blueprint on the heap.

```java
public class Person {
    private String name;
    public Person(String name) { this.name = name; }
    public String name() { return name; }
}

Person p = new Person("Ada"); // reference p points to object
```

Members: fields, methods, constructors, nested types, initializers. Multiple references can point to one object; when none remain reachable, GC can reclaim it.

---

### Constructors

Special methods invoked on `new` to initialize instances. Same name as class, **no return type**.

```java
public Person(String name) {
    this.name = name;
}
public Person() {
    this("unknown"); // constructor chaining
}
```

**Rules:** If you declare any constructor, the compiler does **not** add a default no-arg. Subclass constructors call `super(...)` explicitly or implicitly (must be first statement). Instance initializer blocks run before constructor body.

Records/enums have specialized construction rules. Prefer clear constructors or builders over many overloads.

---

### Inheritance

`extends` creates an is-a relationship; subclass inherits accessible members of the superclass.

```java
class Animal { void speak() {} }
class Dog extends Animal {
    @Override void speak() { System.out.println("woof"); }
}
```

Java: **single class inheritance**, multiple interface implementation. `super` accesses parent methods/constructors. All classes extend `Object` directly or indirectly.

**Fragile base class problem:** deep hierarchies break easily — prefer composition and interfaces. Mark methods `final` to prevent override; mark classes `final`/`sealed` to restrict extension.

---

### Polymorphism

Same interface/message, different behavior.

**Runtime (dynamic dispatch):** overriding instance methods — call resolved by actual object type:

```java
Animal a = new Dog();
a.speak(); // Dog's speak
```

**Compile-time:** overloading — same name, different parameter lists; resolved by static types of arguments.

**Rules:** Overrides must be compatible (return type covariant allowed); can't override `static`/`private`/`final` as instance overrides; `@Override` catches mistakes. Fields and static methods **hide**, they don't override polymorphically — a common trick question.

---

### Abstraction

Hide complexity; expose essential API. In Java:

- **Abstract classes** — partial implementation + abstract methods
- **Interfaces** — contracts (and default methods)
- **Encapsulation** — hide fields behind methods
- **Modules** — hide packages

Abstraction lets callers depend on `List` not `ArrayList`, or `PaymentProcessor` not `StripeClient`, enabling substitution and testing.

---

### Encapsulation

Bundle data with methods and **restrict direct access** (typically `private` fields + getters/setters or richer behavior methods).

Benefits: invariants protected, implementation changeable, validation centralized. Immutability is a strong form of encapsulation. "Anemic" getters/setters everywhere aren't automatically good design — prefer behavior that keeps state consistent (`account.deposit(amount)` vs public `balance` field).

---

### Interfaces vs Abstract Classes

| | Interface | Abstract class |
|---|---|---|
| Instantiation | No | No |
| Multiple | A class can implement many | Only one `extends` |
| Fields | Constants (`public static final`) | Instance fields OK |
| Constructors | No | Yes |
| Methods | Abstract, default, static, private | Abstract + concrete |
| Evolution | Default methods help | Add concrete methods carefully |

**Use interfaces** for capabilities (`Comparable`, `Serializable`, repository ports).  
**Use abstract classes** for shared state/code in a tight hierarchy.  
Modern Java often prefers interfaces + composition. Abstract class can still implement shared skeletal behavior (`AbstractList`).

---

### Access Modifiers

| Modifier | Class | Package | Subclass | World |
|---|---|---|---|---|
| `private` | ✓ | | | |
| (default/package) | ✓ | ✓ | | |
| `protected` | ✓ | ✓ | ✓ | |
| `public` | ✓ | ✓ | ✓ | ✓ |

Top-level classes: only `public` or package-private. `protected` includes package access in Java (unlike some languages). Modules add another boundary (`exports`).

---

### Static & Final Keywords

**`static`:** belongs to the class, not an instance. Static fields shared across instances; static methods can't access instance members without an instance. Static imports for constants/utils. Static nested classes. Static initializer blocks (`static { ... }`).

**`final`:**

- Variable — can't reassign (blank final must assign exactly once)
- Method — can't override
- Class — can't extend
- Parameters — can't reassign (style / capture clarity)

`static final` fields are constants (primitives/String often inlined). Order of static initialization matters (and circular static init can surprise you).

---

### Anonymous Classes

Unnamed class expressed inline — typically for one-off interface/class implementations:

```java
button.addActionListener(new ActionListener() {
    @Override
    public void actionPerformed(ActionEvent e) {
        System.out.println("clicked");
    }
});
```

Today, **lambdas** replace most single-method anonymous classes. Anonymous classes can still extend classes, hold state, and implement multiple methods — lambdas cannot. They capture enclosing locals that are effectively final.

---

### Enums

Type-safe constant sets:

```java
enum Level {
    LOW(1), MEDIUM(2), HIGH(3);
    private final int severity;
    Level(int severity) { this.severity = severity; }
    public int severity() { return severity; }
}
```

Enums can have fields, methods, abstract methods per-constant, implement interfaces. `switch` works cleanly. Prefer enums over `int` constants. Singleton pattern via single-element enum is serialization-safe. `EnumSet` / `EnumMap` are efficient specialized collections.

---

### Wrapper Classes

Object counterparts of primitives: `Integer`, `Long`, `Double`, `Boolean`, `Character`, etc.

**Autoboxing / unboxing:** automatic conversion `int` ↔ `Integer`. Watch for:

```java
Integer a = null;
int b = a; // NullPointerException
```

**Caching:** `Integer.valueOf` caches -128..127 (and possibly more) — `==` may work for cached values and fail outside — always `equals` for value equality.

Generics require reference types → wrappers in `List<Integer>`. Prefer primitives in hot paths to avoid allocation/boxing pressure.

---

### List, Set, Map Implementations

**List**

| Impl | Traits |
|---|---|
| `ArrayList` | Resizable array; fast random access; default choice |
| `LinkedList` | Doubly linked; implements Deque; rarely best |
| `Vector` | Legacy synchronized ArrayList-like |
| `CopyOnWriteArrayList` | Snapshot iterations; write-heavy cost |

**Set**

| Impl | Traits |
|---|---|
| `HashSet` | Hash table; unordered; O(1) avg |
| `LinkedHashSet` | Insertion order |
| `TreeSet` | Sorted (Comparable/Comparator); O(log n) |
| `EnumSet` | Bit-vector for enums |
| `CopyOnWriteArraySet` | Concurrent niche |

**Map**

| Impl | Traits |
|---|---|
| `HashMap` | Unordered; null key/values allowed; not concurrent |
| `LinkedHashMap` | Insert or access order; LRU possible |
| `TreeMap` | Sorted keys |
| `EnumMap` | Enum keys |
| `Hashtable` | Legacy synchronized; no nulls |
| `ConcurrentHashMap` | Concurrent; no nulls |

Choose based on ordering, sorting, concurrency, and null policy.

---

### Comparable vs Comparator

**`Comparable<T>`** — natural order defined **on the class** via `compareTo`.

```java
public int compareTo(Person o) {
    return this.id.compareTo(o.id);
}
```

**`Comparator<T>`** — external ordering strategy:

```java
Comparator<Person> byAge = Comparator.comparingInt(Person::age);
```

**Contract:** `compareTo` consistent with `equals` is strongly recommended for sorted sets/maps (otherwise `TreeSet` may violate Set contract). `compare` returns negative/zero/positive — never mutate compared objects; be transitive.

Use `Comparable` for the obvious default; `Comparator` for alternate sorts or third-party classes.

---

### HashCode & Equals Contracts

For objects used in hash-based collections (`HashMap`, `HashSet`):

1. If `a.equals(b)` then `a.hashCode() == b.hashCode()`.
2. Reflexive, symmetric, transitive, consistent `equals`.
3. `equals` null → false; typically check type (`instanceof` or `getClass()` — know the inheritance tradeoff).
4. Mutating fields used in `equals`/`hashCode` while object is in a hash collection **breaks** the collection.

```java
@Override public boolean equals(Object o) { ... }
@Override public int hashCode() { return Objects.hash(id, name); }
```

Records generate both correctly for components. Lombok `@EqualsAndHashCode` is common — exclude mutable/irrelevant fields. Identity (`==`) ≠ equality (`equals`).

---

### Concurrency (Threads, Runnable)

**Thread** — unit of execution. Create by extending `Thread` (less preferred) or implementing `Runnable`/`Callable` and submitting to an executor.

```java
Runnable task = () -> doWork();
Thread t = new Thread(task, "worker");
t.start(); // not run() — run() executes on current thread
```

**`Callable<V>`** — like Runnable but returns value and may throw checked exceptions; used with `ExecutorService.submit`.

**Lifecycle (simplified):** NEW → RUNNABLE → RUNNING / BLOCKED / WAITING / TIMED_WAITING → TERMINATED.

Prefer thread pools over spawning unbounded threads. Coordinate with interrupts (`interrupt`, `InterruptedException` — restore interrupt flag when swallowing). Virtual threads (Java 21) change scalability for blocking workloads — know they exist for modern interviews.

---

### Exception Handling

Exceptions signal abnormal conditions. Handle with `try` / `catch` / `finally` or propagate with `throws`.

```java
try {
    work();
} catch (IOException e) {
    log(e);
    throw new AppException("failed", e); // wrap — keep cause
} finally {
    cleanup();
}
```

**Best practices:** catch specific types; don't swallow without logging; wrap with cause; use exceptions for exceptional cases, not normal control flow; document `throws` for checked exceptions; prefer precise types.

**`Error`** (e.g. `OutOfMemoryError`) — usually don't catch. **`Throwable`** catch is rarely appropriate.

---

### Checked vs Unchecked Exceptions

**Checked** (`Exception` except `RuntimeException`): must declare `throws` or handle. Represent recoverable conditions the caller should anticipate (`IOException`, `SQLException`).

**Unchecked** (`RuntimeException` and subclasses): not required to declare (`NullPointerException`, `IllegalArgumentException`, `IllegalStateException`). Often indicate programming bugs or violations.

**Debate:** checked exceptions force awareness but clutter APIs — many modern libraries prefer unchecked + clear docs. Interviews expect the distinction and examples, plus wrapping checked into unchecked at boundaries when appropriate.

---

### Custom Exceptions

```java
public class InsufficientFundsException extends RuntimeException {
    private final BigDecimal shortfall;
    public InsufficientFundsException(String msg, BigDecimal shortfall) {
        super(msg);
        this.shortfall = shortfall;
    }
    public BigDecimal shortfall() { return shortfall; }
}
```

Extend `Exception` for checked, `RuntimeException` for unchecked. Provide constructors `(message)`, `(message, cause)`, optionally `(cause)`. Add domain fields when useful. Don't create huge exception hierarchies without need.

---

### Try-with-resources

Automatically closes `AutoCloseable` resources:

```java
try (InputStream in = Files.newInputStream(path);
     OutputStream out = Files.newOutputStream(dest)) {
    in.transferTo(out);
} // close in reverse order; suppressed exceptions attached
```

Resources must be effectively final. Prefer this over manual `finally` close — less leak-prone, handles suppressed exceptions properly (`getSuppressed()`).

---

### Lambda Expressions

Concise implementation of functional interfaces:

```java
Comparator<String> c = (a, b) -> a.length() - b.length();
list.removeIf(s -> s.isBlank());
Runnable r = () -> System.out.println("hi");
```

**Syntax:** `(params) → body` ; types often inferred; single param may drop parentheses; block body needs `return` if non-void.

**Capture:** can use effectively final locals from enclosing scope. `this` inside a lambda refers to the enclosing class (unlike anonymous classes).

Lambdas enable Streams, easier callbacks, and Strategy pattern without boilerplate.

---

### Optional Class

`Optional<T>` is a container that may or may not hold a non-null value — designed for **return types**, not fields/parameters everywhere.

```java
Optional<User> user = repo.find(id);
user.map(User::name)
    .filter(n -> !n.isBlank())
    .orElse("unknown");

user.orElseThrow(() -> new NotFoundException());
user.ifPresent(System.out::println);
```

**Do:** use to avoid returning `null` from methods that may lack a result.  
**Don't:** `Optional.of(null)` (NPE) — use `ofNullable`; don't use Optional to wrap collections (return empty collection); avoid `get()` without check — prefer `orElse`/`orElseGet`/`orElseThrow`.

---

### Default & Static Methods in Interfaces

Java 8+ interfaces may contain:

**Default methods** — instance methods with a body; classes inherit them; can override.

```java
public interface Repository<T> {
    T find(Id id);
    default List<T> findAllById(List<Id> ids) {
        return ids.stream().map(this::find).toList();
    }
}
```

**Static methods** — helpers belonging to the interface (`List.of`, `Comparator.comparing` live on interfaces/classes similarly).

**Conflicts:** if two interfaces provide the same default method, the class must override and choose (`InterfaceName.super.method()`). Default methods enabled interface evolution (e.g. `Collection.stream()`) without breaking implementors.

---

### Memory Management

Java manages memory primarily via:

- **Stack** — per-thread frames; locals; automatic reclaim on method exit
- **Heap** — objects; GC
- **Metaspace** — class metadata
- **Native / direct** — NIO direct buffers, JNI

**Leaks in Java:** objects still reachable that shouldn't be (static collections, caches without eviction, `ThreadLocal` not removed, listeners not unregistered, unbounded queues).

**Tools:** heap dumps (Eclipse MAT), Flight Recorder, `jcmd`, VisualVM. Tuning GC ≠ fixing leaks. Object allocation rate affects GC pressure — reuse/pooling only when measured.

---

### ClassLoader

ClassLoaders load `.class` bytes into the JVM defining them as classes.

**Delegation model (classic):** application → extension/platform → bootstrap. Child asks parent first (parent-first) to avoid duplicate core classes.

**Types:** bootstrap (JDK classes), platform, application (classpath), custom (frameworks, hot reload, plugin isolation — child-first variants).

**Interview topics:** `ClassNotFoundException` vs `NoClassDefFoundError`; same class name loaded by two loaders → two distinct classes (ClassCastException surprises); web apps / app servers use hierarchical loaders; JPMS layers interact with loading.

---

### Var Keyword (Java 10+)

`var` enables **local variable type inference**:

```java
var list = new ArrayList<String>(); // ArrayList<String>
var stream = list.stream();
```

**Rules:** only for local variables (and some loop/try-with-resources); must initialize on declaration; cannot be `null` without type; not a keyword for fields/method params (those stay explicit). Not dynamic typing — the compiler still fixes a static type.

**Style:** use when the type is obvious from the right-hand side; keep explicit types when they aid readability (especially `var` hiding a messy generic).

---

### Switch Expressions (Java 14+)

Switch as an **expression** with exhaustiveness and arrow labels:

```java
int numLetters = switch (day) {
    case MONDAY, FRIDAY, SUNDAY -> 6;
    case TUESDAY -> 7;
    case THURSDAY, SATURDAY -> 8;
    case WEDNESDAY -> 9;
};
```

**`yield`** for block-style arms that need to produce a value. No fall-through with `->` (unlike classic `:` cases). For enums/sealed types, compiler can require all cases — safer than forgotten `break`. Classic switch **statements** still exist; prefer expressions for value mapping.

---

### Pattern Matching (Java 16+)

Pattern matching reduces boilerplate casting and enables richer switches (evolving through later Java versions).

**`instanceof` pattern (Java 16):**

```java
if (obj instanceof String s) {
    System.out.println(s.toLowerCase());
}
```

**Switch pattern matching / record patterns** (Java 21 finalized features — know the trajectory):

```java
switch (shape) {
    case Circle c -> area(c.radius());
    case Rectangle r -> r.w() * r.h();
    case null -> 0;
    default -> throw new IllegalStateException();
}
```

Pairs powerfully with **sealed classes + records** for exhaustive domain modeling.

---

### Text Blocks

Java 15+ multi-line string literals:

```java
String json = """
        {
          "name": "Ada",
          "id": 1
        }
        """;
```

Incidental indentation is stripped based on the closing `"""` position. Useful for SQL, JSON, HTML in tests. Escape sequences still work; `\s` and `\` line continuations exist for fine control. Prefer text blocks over messy `\n` concatenation.

---

### Try-with-resources Enhancements

Java 9+ allows using **effectively final** existing variables in try-with-resources:

```java
BufferedReader br = open();
try (br) {
    return br.readLine();
}
```

Still ensures `close()`. Combine multiple resources; suppressed exceptions work the same. Prefer declaring resources in the try header when creating them inline for clarity.

---

### Multi-catch Blocks

Java 7+ catch multiple unrelated exceptions in one clause:

```java
try {
    work();
} catch (IOException | SQLException e) {
    log(e);
    throw new UncheckedIOException(e instanceof IOException
        ? (IOException) e
        : new IOException(e));
}
```

The catch parameter is implicitly `final`. Types must not be subtypes of each other in the same multi-catch. Reduces duplication when handling is identical.

---

### Best Practices & Code Quality

High-signal habits interviews and code reviews look for:

- Clear names; small methods; single responsibility
- Program to interfaces; dependency injection over `new` everywhere
- Prefer immutability and final where practical
- Fail fast with informative exceptions
- Don't swallow exceptions; preserve causes
- Close resources with try-with-resources
- Avoid premature optimization; measure
- Write tests for core logic; use meaningful assertions
- Consistent formatting (Google/Oracle style, Spotless)
- Limit mutable shared state; document thread-safety
- Avoid raw types; embrace generics; minimize `null` (Optional at boundaries)
- Keep cognitive complexity low; prefer composition
- Log with levels and correlation IDs in services
- Treat warnings seriously (`-Xlint`, NullAway/Error Prone in serious codebases)

---

### Serialization & Deserialization

**Serialization** converts an object graph to bytes; **deserialization** reconstructs objects — used for caches, session replication, RMI, some messaging (though JSON/Protobuf often preferred today).

```java
public class User implements Serializable {
    private static final long serialVersionUID = 1L;
    private String name;
}
```

Mark with `Serializable`. Prefer explicit `serialVersionUID`. Custom hooks: `private void writeObject` / `readObject`, `readResolve` (singletons).

**Security:** deserializing untrusted data is dangerous (gadget chains). Prefer avoid Java native serialization for untrusted input; use allowlists / safer formats.

---

### Transient & Static in Serialization

**`transient`** — field skipped during default serialization (passwords, caches, derived fields). After deserialize, transient fields get defaults (`null`/0) unless restored in `readObject`.

**`static`** — belongs to the class, not the instance; **not serialized** as part of object state. After deserialize, static fields retain the JVM's current class values.

Together: use `transient` for non-portable/sensitive instance state; don't expect static fields to travel with the object.

---

### Java NIO (Buffer, Channel, Selector)

NIO (`java.nio`) supports block-oriented I/O and non-blocking multiplexed networking.

**Buffer** — container of data (`ByteBuffer`, `CharBuffer`). Indices: `capacity`, `limit`, `position`, `mark`. Flip between write and read modes (`flip()`, `clear()`, `compact()`).

**Channel** — bidirectional pipes (`FileChannel`, `SocketChannel`, `ServerSocketChannel`).

**Selector** — multiplex many non-blocking channels with one thread (classic high-connection servers before virtual threads / reactive frameworks).

**NIO.2 (`java.nio.file`)** — `Path`, `Files`, watch service — preferred for file system ops.

```java
ByteBuffer buf = ByteBuffer.allocate(1024);
channel.read(buf);
buf.flip();
```

Direct buffers (`allocateDirect`) live off-heap — faster for some native I/O, harder on GC/diagnostics.

---

### Soft, Weak, Phantom References

`java.lang.ref` provides reference types that don't prevent GC the same way strong references do:

| Type | Behavior |
|---|---|
| **Strong** | Normal references — keep object alive |
| **SoftReference** | Cleared under memory pressure; useful for caches (still easy to get wrong) |
| **WeakReference** | Cleared when only weakly reachable; `WeakHashMap` keys |
| **PhantomReference** | After finalization path; used with `ReferenceQueue` for post-mortem cleanup (prefer cleaner APIs) |

**`ReferenceQueue`** — notified when referenced objects become reclaimable.

**Interview tip:** `WeakHashMap` is weak on **keys**; values can keep keys alive indirectly (use carefully). Modern code prefers explicit cache eviction (`Caffeine`) over soft-ref caches.

---

### Generics

Generics add compile-time type parameters for safer, reusable APIs:

```java
List<String> names = new ArrayList<>();
Map<Id, User> users = new HashMap<>();

public static <T> T first(List<T> list) {
    return list.get(0);
}
```

**Key concepts:**

- **Type erasure** — type parameters removed at runtime; `List<String>` is `List` at runtime; can't do `new T()` easily or `instanceof List<String>`.
- **Bounds:** `<T extends Number>`, lower bounds with wildcards.
- **Wildcards:** `? extends T` (producer, covariant — get), `? super T` (consumer, contravariant — put) — PECS: Producer Extends, Consumer Super.
- **Raw types** — avoid (`List` without `<>`).
- **Heap pollution / `@SafeVarargs`** — be careful with generic varargs.

Generics enable Stream APIs, collections, and repository patterns without casting. Bridge methods and erasure quirks appear in advanced interviews.

---

## How to use this guide

- Walk the checklist in `Java Core V2.md` top to bottom; explain each item aloud before peeking here.
- For collections and concurrency, always add complexity + thread-safety + null policy in your answer.
- For modern Java (records, sealed, pattern matching, virtual threads), state **which version** stabilized the feature — interviewers notice.
- Reinforce with small coding drills: implement Producer–Consumer with `BlockingQueue`, group-by with Collectors, and a tiny `CompletableFuture` pipeline.

Good luck with prep.
