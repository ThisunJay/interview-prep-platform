# Spring V2

A deep-dive companion to the Spring V2 checklist. Each heading matches the original outline; under every topic you'll find **what it is**, **why it exists**, **how it works**, and **interview-ready nuance**.

---

**📌 Spring Core (IoC, DI, Beans)**

### Spring Framework Overview

Spring is a comprehensive Java application framework whose core idea is **Inversion of Control (IoC)** and **Dependency Injection (DI)**. Instead of your classes constructing and wiring their own collaborators, Spring creates objects (**beans**), injects dependencies, manages lifecycle, and provides cross-cutting infrastructure.

**Major modules / ecosystem (conceptual map):**

| Area | What it provides |
|---|---|
| Spring Core / Context | IoC container, beans, events, resources |
| Spring AOP | Aspect-oriented programming |
| Spring JDBC / ORM / TX | Data access & transactions |
| Spring MVC | Servlet-based web |
| Spring WebFlux | Reactive web |
| Spring Security | Authn / authz |
| Spring Data | Repository abstraction over JPA, Mongo, Redis, etc. |
| Spring Boot | Opinionated auto-config, starters, executable apps |
| Spring Cloud | Distributed systems (config, discovery, gateway) |

**Why interviews start here:** Almost every enterprise Java backend uses Spring Boot. Understanding *Core* (container + DI) explains how MVC, Security, Data, and Boot all plug together.

---

### Dependency Injection (Constructor, Setter, Field)

**Dependency Injection** means a component does not create its dependencies; they are supplied from outside (the container).

**Constructor injection (preferred):**

```java
@Service
public class OrderService {
    private final PaymentClient payments;

    public OrderService(PaymentClient payments) {
        this.payments = payments;
    }
}
```

Pros: dependencies are `final` and required; object is always fully initialized; easy to unit-test without Spring; fails fast if a bean is missing.

**Setter injection:**

```java
@Autowired
public void setPayments(PaymentClient payments) {
    this.payments = payments;
}
```

Useful for optional dependencies or circular-dependency workarounds (still better to redesign). Fields aren't `final`.

**Field injection:**

```java
@Autowired
private PaymentClient payments;
```

Convenient but discouraged: hides dependencies, harder to test, can't use `final`, encourages container coupling.

**Interview stance:** Prefer constructor injection. Spring can omit `@Autowired` on a single constructor. For multiple constructors, annotate the one Spring should use.

---

### Inversion of Control (IoC) Container

**IoC** flips control: *your* code no longer owns object graph construction; the **container** does.

In Spring, the IoC container is primarily `ApplicationContext` (builds on `BeanFactory`):

- Reads configuration (annotations, `@Configuration`, XML, Boot auto-config)
- Instantiates beans
- Injects dependencies
- Applies AOP proxies when needed
- Publishes events, resolves messages, serves as environment holder

```java
ApplicationContext ctx = SpringApplication.run(App.class, args);
OrderService orders = ctx.getBean(OrderService.class);
```

In Boot apps you rarely call `getBean` — you inject collaborators instead. Mentally: **BeanFactory** = bean creation core; **ApplicationContext** = enterprise features on top (events, i18n, AOP integration, environment).

---

### Bean Lifecycle

A Spring bean goes through a defined lifecycle from instantiation to destruction. Simplified sequence for a singleton:

1. Instantiate
2. Populate properties / inject dependencies
3. Aware interfaces (`BeanNameAware`, `BeanFactoryAware`, `ApplicationContextAware`, …)
4. BeanPostProcessor **before** init
5. Initialization (`@PostConstruct`, `InitializingBean`, custom `initMethod`)
6. BeanPostProcessor **after** init (AOP proxies often wrap here)
7. Bean ready for use
8. On context shutdown: destruction (`@PreDestroy`, `DisposableBean`, custom `destroyMethod`)

Understanding this explains why constructor logic shouldn't depend on proxied collaborators being fully ready, and why `@Transactional` self-invocation fails (proxy not in play).

#### @PostConstruct / InitializingBean — afterPropertiesSet

After dependencies are injected, Spring runs initialization callbacks:

```java
@PostConstruct
void warmCache() {
    cache.load();
}

// equivalent style:
public class Warmup implements InitializingBean {
    @Override
    public void afterPropertiesSet() {
        cache.load();
    }
}
```

`@PostConstruct` (Jakarta Annotation) is the modern, clearer choice. `InitializingBean.afterPropertiesSet()` is the Spring interface alternative. You can also declare `initMethod` on `@Bean`.

Use for: validation of required config, warming caches, starting non-bean resources. Avoid heavy I/O that blocks startup unless intentional; consider `ApplicationRunner` for post-startup work.

#### @PreDestroy / DisposableBean — destroy

On singleton shutdown (context close), destruction callbacks run:

```java
@PreDestroy
void closeClient() {
    httpClient.close();
}

public class Closer implements DisposableBean {
    @Override
    public void destroy() {
        httpClient.close();
    }
}
```

Prototype beans are **not** fully managed for destruction by the container in the same way — if you create many prototypes holding resources, you may need to clean them yourself.

---

### Bean Scopes (Singleton, Prototype, etc.)

| Scope | Meaning |
|---|---|
| **singleton** (default) | One shared instance per container |
| **prototype** | New instance every time the bean is requested |
| **request** | One per HTTP request (web) |
| **session** | One per HTTP session (web) |
| **application** | One per ServletContext |
| **websocket** | One per WebSocket session |

```java
@Scope("prototype")
@Component
public class ReportBuilder { ... }
```

**Gotcha:** Injecting a prototype into a singleton still injects **one** instance at singleton creation time, unless you use `ObjectFactory`/`Provider`/`@Lookup` for on-demand creation.

Most services/repos stay singleton (stateless). Stateful or non-thread-safe collaborators may be prototype or request-scoped.

---

### @Component, @Service, @Repository, @Controller

Stereotype annotations mark classes as Spring-managed components (via component scanning):

| Annotation | Intent |
|---|---|
| `@Component` | Generic bean |
| `@Service` | Domain/business service layer |
| `@Repository` | Data access; also enables persistence exception translation |
| `@Controller` | MVC controller (view or REST with extra annotations) |
| `@RestController` | `@Controller` + `@ResponseBody` |

Functionally, `@Service` / `@Repository` / `@Controller` are specialized `@Component`s. Using the right one documents layering and enables special processing (e.g. `@Repository` → `DataAccessException` translation).

Scanning is typically enabled from `@SpringBootApplication` / `@ComponentScan` on the main package — put the main class in a root package so subpackages are discovered.

---

### @Autowired, @Qualifier, @Primary

**`@Autowired`** — inject by type. Required by default (`required=false` for optional). Constructor injection often needs no annotation when there's a single constructor.

**Ambiguity:** If multiple beans implement the same type, Spring fails unless you disambiguate:

```java
@Autowired
@Qualifier("stripeClient")
PaymentClient payments;
```

**`@Primary`** — marks a bean as the default choice when multiple candidates exist.

**`@Qualifier`** — named selection; more precise than `@Primary` for many implementations.

Also: inject by name matching field/parameter name (with caveats); use `@Resource` (JSR) for name-first; prefer constructor + `@Qualifier` for clarity.

---

### Java-based Configuration (@Configuration, @Bean)

```java
@Configuration
public class AppConfig {
    @Bean
    PaymentClient paymentClient(PaymentProperties props) {
        return new StripeClient(props.apiKey());
    }
}
```

**`@Configuration`** — class whose `@Bean` methods define container beans. Spring enhances `@Configuration` with CGLIB so calls between `@Bean` methods go through the container (singleton semantics preserved).

**`@Bean`** — method producing a bean instance; method name is the default bean name.

Use for: third-party classes you can't annotate, conditional wiring, explicit infrastructure. Prefer stereotypes for your own app classes; use `@Configuration` for assembly.

`@Configuration(proxyBeanMethods = false)` (Lite mode) skips CGLIB — faster, but `@Bean` inter-calls won't be intercepted (Boot uses this often in auto-config).

---

### XML-based Configuration (basic understanding)

Historically, beans were declared in `applicationContext.xml`:

```xml
<bean id="orderService" class="com.example.OrderService">
  <constructor-arg ref="paymentClient"/>
</bean>
```

Namespaces: `context:component-scan`, `aop:config`, `tx:annotation-driven`, MVC config, etc.

Modern apps use Java config + annotations + Boot auto-config. Know XML for legacy codebases: how `<bean>`, `ref`, `property`, and component-scan map to today's annotations. You can still import XML via `@ImportResource`.

---

### Profiles (@Profile)

Profiles activate environment-specific beans and config:

```java
@Configuration
@Profile("prod")
public class ProdMailConfig { ... }

@Profile("!prod") // active when prod is NOT active
```

Activate with `spring.profiles.active=prod` (env var, property, CLI `--spring.profiles.active=prod`). Multiple profiles can be active.

Use for: different datasources, mock vs real gateways, feature toggles for infra. Prefer keeping business logic profile-agnostic; profile the infrastructure.

---

**📌 Spring Boot**

### External Configuration

Spring Boot externalizes config so the same artifact runs in many environments. Property sources are loaded with a documented **precedence** (higher wins) — conceptually:

command-line args → OS env vars → `application-{profile}.properties/yml` → `application.properties/yml` → defaults / `@PropertySource`, etc.

Access via:

```java
@Value("${app.timeout-ms}")
long timeout;

@Autowired Environment env;
```

Prefer `@ConfigurationProperties` for grouped, validated config. Never hardcode secrets; use env vars / secret managers.

---

### Custom Starter Creation

A **starter** is a dependency (often with auto-configuration) that pulls in a cohesive set of libraries and wires defaults.

To build one:

1. Module with dependencies (e.g. client SDK + Spring Web)
2. `@Configuration` classes with `@ConditionalOnClass`, `@ConditionalOnMissingBean`, etc.
3. Register in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` (Boot 3) or legacy `spring.factories`
4. Optional `spring-boot-configuration-processor` for metadata on `@ConfigurationProperties`
5. Publish artifact; apps depend on `my-company-foo-starter`

Interview angle: starters = **dependency aggregation + auto-config**, not magic.

---

### Spring Boot Auto-configuration

Boot looks at the classpath and properties, then automatically creates beans you typically need (DataSource if JDBC driver present, DispatcherServlet if web on classpath, etc.).

Mechanism:

- Auto-config classes annotated with `@AutoConfiguration` / `@Configuration` + many `@Conditional*`
- Imported via `AutoConfiguration.imports`
- Conditions: `@ConditionalOnClass`, `@OnMissingBean`, `@OnProperty`, `@OnWebApplication`, …

```java
@SpringBootApplication // includes @EnableAutoConfiguration
public class App { ... }
```

Exclude with `exclude = {DataSourceAutoConfiguration.class}` when you need full control. Debug with `--debug` or `ConditionEvaluationReport`.

---

### Spring Boot Starters

Official starters shorten dependency management:

| Starter | Brings in |
|---|---|
| `spring-boot-starter-web` | MVC, Tomcat, Jackson |
| `spring-boot-starter-data-jpa` | Hibernate, Spring Data JPA |
| `spring-boot-starter-security` | Spring Security |
| `spring-boot-starter-actuator` | Production endpoints |
| `spring-boot-starter-test` | JUnit, Mockito, MockMvc, … |
| `spring-boot-starter-webflux` | Reactive stack |

Use BOM/`spring-boot-dependencies` so versions align — don't mix random Spring versions manually.

---

### Spring Boot Annotations (@SpringBootApplication, etc.)

**`@SpringBootApplication`** = `@SpringBootConfiguration` + `@EnableAutoConfiguration` + `@ComponentScan` (and more meta-annotations). Place on the main class in the root package.

Related:

- `@SpringBootConfiguration` — specialization of `@Configuration`
- `@EnableAutoConfiguration` — turn on auto-config
- `@ImportAutoConfiguration` — targeted imports (tests)
- `@ConditionalOn*` — used heavily in library auto-config
- `@EnableConfigurationProperties`

`SpringApplication.run(App.class, args)` bootstraps the context and embedded server (for web apps).

---

### application.properties vs application.yml

Both configure the same `Environment`.

**properties:**

```properties
server.port=8080
app.feature.enabled=true
```

**YAML:**

```yaml
server:
  port: 8080
app:
  feature:
    enabled: true
```

YAML is hierarchical and often cleaner for nested config / lists; properties are simpler and merge more predictably in some multi-file scenarios. Don't mix conflicting styles carelessly for the same key. Profile-specific files: `application-prod.yml`.

Relaxed binding maps `APP_FEATURE_ENABLED`, `app.feature.enabled`, `app.feature-enabled` to the same property in many cases.

---

### Profiles in Spring Boot

Same `@Profile` idea, with Boot conveniences:

- `spring.profiles.active`
- `spring.profiles.include` / group profiles (`spring.profiles.group.prod=...`)
- Profile-specific documents inside one YAML using `---` and `spring.config.activate.on-profile`
- `application-local.yml` for developer overrides (often gitignored)

Test with `@ActiveProfiles("test")`.

---

### CommandLineRunner & ApplicationRunner

Callbacks invoked **after** the application context is loaded (and for web apps, typically after the server has started wiring):

```java
@Component
public class SeedData implements CommandLineRunner {
    public void run(String... args) {
        // seed DB, warm caches
    }
}

@Component
public class Seed2 implements ApplicationRunner {
    public void run(ApplicationArguments args) {
        // typed access to options/flags
    }
}
```

`ApplicationRunner` wraps args more conveniently. Order with `@Order` / `Ordered`. Prefer these over heavy `@PostConstruct` for startup tasks that need the full context.

---

### Spring Boot DevTools

Developer-time productivity:

- Automatic restart on classpath changes (fast classloader tricks)
- LiveReload support
- Disable caching templates by default in dev
- Remote DevTools (rarely used; security-sensitive)

Not for production. Add `spring-boot-devtools` with optional runtime scope. Restart is not a full JVM reboot — understand limitations with certain static state / native libs.

---

### Fat JAR / Executable JAR

`spring-boot-maven-plugin` / Gradle plugin packages a **fat (uber) JAR**: your classes + dependencies + nested loader.

```bash
java -jar myapp.jar
```

The JAR has a special layout (`Boot-Inf/classes`, `Boot-Inf/lib`) and a launcher that loads nested jars. This is the standard deployable unit for microservices (vs traditional WAR on external Tomcat). You can still build WARs if required.

---

### @ConfigurationProperties

Type-safe binding of a property prefix to a class:

```java
@ConfigurationProperties(prefix = "app.mail")
public record MailProps(String host, int port, boolean ssl) {}

@Configuration
@EnableConfigurationProperties(MailProps.class)
public class MailConfig { ... }
```

Benefits over many `@Value`s: grouped config, IDE metadata (with annotation processor), `@Validated` + JSR-303 on properties, immutable records/constructors binding in Boot 3.

Enable via `@EnableConfigurationProperties`, `@ConfigurationPropertiesScan`, or `@Component` on the props class.

---

### Custom Contexts

"Custom contexts" usually means controlling or specializing `ApplicationContext`:

- Child contexts (parent/child hierarchies — rare in Boot, common historically in MVC+root web contexts)
- Multiple contexts in tests (`@ContextConfiguration`)
- `SpringApplicationBuilder` for custom bootstrap
- Reactive vs servlet web application type
- Custom `ApplicationContextInitializer`, `EnvironmentPostProcessor`, `BeanFactoryPostProcessor`

For interviews: Boot creates one primary `ApplicationContext`; Spring MVC used to have a root context + dispatcher child context. Today Boot unifies this. Know that parent contexts share beans downward, not upward.

---

**📌 Spring MVC (Web)**

### @Controller & @RestController

**`@Controller`** — handles web requests; return value often a view name (Thymeleaf) unless method is annotated `@ResponseBody`.

**`@RestController`** — `@Controller` + `@ResponseBody` on the class: return values written directly to the HTTP response body (JSON typically).

```java
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    @GetMapping("/{id}")
    OrderDto get(@PathVariable long id) { ... }
}
```

Keep controllers thin: validate input, call services, map to DTOs.

---

### @RequestMapping, @GetMapping, @PostMapping, etc.

Map HTTP methods and paths to handler methods:

```java
@RequestMapping(path = "/api/users", method = RequestMethod.GET)
@GetMapping("/api/users")
@PostMapping
@PutMapping("/{id}")
@PatchMapping("/{id}")
@DeleteMapping("/{id}")
```

Class-level `@RequestMapping` prefixes method paths. Can constrain `consumes` / `produces` media types, headers, params.

---

### @PathVariable vs @RequestParam

| Annotation | Source | Example |
|---|---|---|
| `@PathVariable` | URI path template | `/users/{id}` → `@PathVariable long id` |
| `@RequestParam` | Query string / form | `/users?page=1` → `@RequestParam int page` |

Also: `@RequestHeader`, `@CookieValue`, `@MatrixVariable` (rare), `@RequestBody` (body), `@ModelAttribute` (form / complex binding).

`required` and `defaultValue` control optionality for params.

---

### Exception Handling (@ExceptionHandler, @ControllerAdvice)

**`@ExceptionHandler`** — handle exceptions in a controller (or advice):

```java
@ExceptionHandler(NotFoundException.class)
@ResponseStatus(HttpStatus.NOT_FOUND)
ErrorBody handle(NotFoundException ex) { ... }
```

**`@ControllerAdvice` / `@RestControllerAdvice`** — global exception handling / binding / model advice across controllers.

Centralize API error payloads (type, title, status, detail — Problem Details RFC 9457 is a good model). Distinguish business 4xx vs unexpected 5xx; don't leak stack traces to clients.

---

### HttpMessageConverters

Components that convert HTTP body ↔ Java objects (`MappingJackson2HttpMessageConverter` for JSON, others for XML, form data, etc.).

When you use `@RequestBody` / `@ResponseBody`, Spring picks a converter based on `Content-Type` / `Accept` and classpath (Jackson present → JSON).

Customize Jackson via `Jackson2ObjectMapperBuilderCustomizer` or replace converters. Understanding converters explains 415 Unsupported Media Type and 406 Not Acceptable.

---

### Request/Response Body Mapping

```java
@PostMapping
OrderDto create(@RequestBody @Valid CreateOrderRequest req) {
    return service.create(req);
}
```

Jackson maps JSON properties to fields/accessors (and records). Configure naming (`snake_case`), dates (`JavaTimeModule`), unknown properties (`fail-on-unknown`). Use DTOs — don't expose JPA entities directly (lazy loads, over-posting, circular refs).

---

### Validation (JSR-303 / Hibernate Validator) ***

Bean Validation API (`jakarta.validation`) with Hibernate Validator as the usual implementation:

```java
public record CreateUserRequest(
    @NotBlank String name,
    @Email String email,
    @Min(18) int age
) {}

@PostMapping
void create(@Valid @RequestBody CreateUserRequest req) { ... }
```

Trigger with `@Valid` / `@Validated`. Constraints: `@NotNull`, `@Size`, `@Pattern`, custom `@Constraint` validators. Method validation on services needs `@Validated` on the class.

`MethodArgumentNotValidException` → handle in `@RestControllerAdvice` to return field errors. For `@ConfigurationProperties`, `@Validated` + constraints catch bad config at startup.

---

### File Upload Handling

Multipart uploads:

```java
@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
void upload(@RequestParam("file") MultipartFile file) throws IOException {
    files.store(file.getInputStream(), file.getOriginalFilename());
}
```

Configure limits: `spring.servlet.multipart.max-file-size`. Prefer streaming to disk/object storage for large files; don't load huge files entirely into memory. Validate content type and size; generate safe stored names.

---

### Filters

Servlet **Filters** wrap the request/response pipeline *before* reaching DispatcherServlet (and after on the way out):

```java
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(...) {
        // set MDC / header, then
        filterChain.doFilter(request, response);
    }
}
```

Use for: CORS (sometimes), compression, authentication wrappers, logging, correlation IDs. Spring Security is itself a filter chain. Order with `@Order` or `FilterRegistrationBean`.

Filters are servlet-container concepts — they don't have easy access to Controller-resolved `@PathVariable` (use interceptors/handlers for that).

---

### Interceptors

Spring MVC **HandlerInterceptor** hooks into handler execution inside DispatcherServlet:

```java
public class AuditInterceptor implements HandlerInterceptor {
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        return true; // false aborts
    }
    public void postHandle(...) { /* after handler, before view render */ }
    public void afterCompletion(...) { /* after request finishes; cleanup */ }
}
```

Register via `WebMvcConfigurer.addInterceptors`.

#### preHandle

Runs **before** the controller method. Return `false` to abort. Good for authz checks, rate limits, early rejects.

#### postHandle

Runs **after** the controller, **before** the view is rendered. Useful for adding model attributes for view-based MVC. Less relevant for pure REST (`@RestController` often has no view).

#### afterCompletion

Runs after the complete request (including view), even if exceptions occurred (check `ex`). Use for cleanup, timing metrics, auditing completion.

**Filter vs Interceptor:** Filter = servlet level, all requests; Interceptor = Spring MVC handler level, access to `HandlerMethod`.

---

### Dispatcher Servlet

**`DispatcherServlet`** is the front controller of Spring MVC. It:

1. Receives every HTTP request mapped to it
2. Uses `HandlerMapping` to find a handler
3. Uses `HandlerAdapter` to invoke it
4. Resolves exceptions via resolvers
5. Resolves views (or writes body via message converters)

Boot auto-registers it and an embedded Tomcat by default with `spring-boot-starter-web`. Understanding DispatcherServlet explains the whole request lifecycle and where filters/interceptors/advice fit.

---

### Content Negotiation

Selecting response representation based on client preference:

- `Accept` header (`application/json` vs `application/xml`)
- Path extension / query param strategies (often disabled for security/clarity)

Configure via `WebMvcConfigurer.configureContentNegotiation` or properties. Produces/consumes on mappings constrain endpoints. Default in Boot APIs is JSON via Jackson.

---

### CORS Configuration

**Cross-Origin Resource Sharing** allows browsers to call your API from another origin.

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://app.example.com")
            .allowedMethods("GET", "POST")
            .allowCredentials(true);
    }
}
```

Or `@CrossOrigin` on controllers. With Spring Security, CORS must be integrated into the security filter chain (`cors(Customizer.withDefaults())`) or preflight `OPTIONS` fails. Never use `*` origins with credentials.

---

**📌 Spring Data JPA & Hibernate**

### Spring Data JPA Overview

Layered data-access story:

#### JDBC

Raw `java.sql` — `Connection`, `PreparedStatement`, `ResultSet`. Full control, verbose, easy to leak connections, manual mapping.

#### Spring JDBC

`JdbcTemplate` / `NamedParameterJdbcTemplate` — connection handling, exception translation to `DataAccessException`, less boilerplate. Still SQL and manual row mapping (`RowMapper`).

#### Data JPA

"Data JPA" in conversation usually means the **JPA specification** (Jakarta Persistence): standard ORM API (`EntityManager`, annotations, JPQL). Hibernate is the most common implementation.

#### Spring Data JPA

Spring Data repository abstraction **on top of JPA**: you declare interfaces; Spring generates implementations for CRUD, query derivation, `@Query`, pagination. Dramatically less boilerplate for standard data access.

---

### Entity Mapping: @Entity, @Table, @Id, @GeneratedValue

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;
}
```

- `@Entity` — JPA managed type
- `@Table` — table name/schema
- `@Id` — primary key
- `@GeneratedValue` — `IDENTITY`, `SEQUENCE` (often preferred for batching), `UUID`, etc.
- `@Column` — nullability, length, uniqueness

Prefer immutable-friendly design carefully with JPA (no-arg constructor requirements; records as entities still limited). Equals/hashCode on entities: use business key carefully or id after persist — avoid naive all-fields equals with lazy collections.

---

### OneToOne, OneToMany, ManyToOne, ManyToMany

Relationship mappings:

| Annotation | Cardinality |
|---|---|
| `@ManyToOne` | Many child rows → one parent (FK usually on many side) |
| `@OneToMany` | One parent → many children |
| `@OneToOne` | 1:1 |
| `@ManyToMany` | Usually join table |

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "department_id")
private Department department;

@OneToMany(mappedBy = "department")
private List<Employee> employees;
```

Prefer **ManyToOne as owning side** for FK control. Avoid eager `@OneToMany`/`@ManyToMany` by default.

---

### @JoinColumn, mappedBy, Fetch Types

**`@JoinColumn`** — which column is the FK (owning side).

**`mappedBy`** — on the inverse side; points to the field that owns the relationship. Without it, JPA may create extra join tables for bidirectional one-to-many.

**FetchType:**

- `LAZY` — load on access (default for many-to-many / one-to-many)
- `EAGER` — load with owner (default historically for many-to-one/one-to-one — still prefer explicit LAZY)

Lazy loading requires an open persistence context (see Open Session In View debate).

---

### Repositories: CrudRepository, JpaRepository, PagingAndSortingRepository

```java
public interface UserRepository extends JpaRepository<User, Long> { }
```

| Interface | Adds |
|---|---|
| `Repository` | Marker |
| `CrudRepository` | `save`, `findById`, `findAll`, `delete`, … |
| `PagingAndSortingRepository` | `findAll(Pageable)`, `Sort` |
| `JpaRepository` | JPA-specific: `flush`, `saveAndFlush`, `deleteInBatch`, extends paging/CRUD |

Boot auto-detects `@EnableJpaRepositories` via auto-config. Prefer `JpaRepository` for typical apps.

---

### Derived Query Methods

Spring Data parses method names:

```java
List<User> findByEmail(String email);
Optional<User> findByEmailIgnoreCase(String email);
Page<User> findByActiveTrue(Pageable pageable);
List<User> findByNameContainingAndActive(String name, boolean active);
```

Keywords: `And`, `Or`, `Between`, `Like`, `Containing`, `IgnoreCase`, `OrderBy`, `Top`/`First`, `Exists`, `Count`, `Delete`.

Keep names readable; when too complex, switch to `@Query`.

---

### @Query (JPQL & Native SQL)

```java
@Query("select u from User u where u.email = :email")
Optional<User> findByEmailJpql(@Param("email") String email);

@Query(value = "select * from users where email = :email", nativeQuery = true)
Optional<User> findByEmailNative(@Param("email") String email);
```

**JPQL** — operates on entities/fields; database-agnostic.  
**Native** — SQL for vendor features; less portable; careful with mapping.

Modifying queries need `@Modifying` (+ often `@Transactional`) and clearAutomatically when needed.

---

### Custom Repositories

When derived/`@Query` aren't enough:

1. Fragment interface `UserRepositoryCustom` with methods
2. Impl class `UserRepositoryImpl` (naming convention) using `EntityManager` or JDBC
3. `UserRepository extends JpaRepository, UserRepositoryCustom`

Use for Criteria API, dynamic queries, Specifications (`JpaSpecificationExecutor`), QueryDSL.

---

### Pagination and Sorting

```java
Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
Page<User> page = repo.findByActiveTrue(pageable);
```

Returns `Page` (with total count), `Slice` (no total — cheaper), or `List`. Expose carefully in APIs (page/size limits). Count queries can be expensive — tune with `@Query` countQuery or `Slice`.

---

### Auditing (CreatedDate, CreatedBy, etc.)

```java
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Order {
    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
    @CreatedBy
    private String createdBy;
}
```

Enable with `@EnableJpaAuditing` and an `AuditorAware<String>` bean (from Security context). Keeps audit fields consistent without manual sets.

---

### EntityManager Basics

JPA's primary API:

```java
@PersistenceContext
EntityManager em;

User u = em.find(User.class, id);
em.persist(newUser);
em.merge(detached);
em.remove(u);
TypedQuery<User> q = em.createQuery("select u from User u", User.class);
```

Spring Data repositories use `EntityManager` under the hood. Inject for custom ops, Criteria, bulk updates, flush control.

---

### Persistence Context

The **persistence context** is the first-level cache / unit of work for entities:

- Entities loaded/persisted are managed
- Changes to managed entities are detected (**dirty checking**) and flushed to DB
- Identity guarantee: same row → same instance within context
- Closes at end of transaction (typically)

**Detached** entities are outside the context — changes aren't auto-saved until `merge`. **Transient** = new, never persisted. **Removed** = scheduled for delete.

Understanding this explains LazyInitializationException, dirty checking, and why `save` on an already managed entity is often redundant.

---

### Caching in JPA

Beyond the persistence context (L1):

- **Second-level cache** — shared across sessions (provider-specific; Hibernate L2)
- **Query cache** — caches query result IDs (needs L2 for entities)

Enable carefully: consistency invalidation is hard for write-heavy data. Good for read-mostly reference data. See Hibernate Caching section for detail.

---

### Transaction Management (@Transactional)

```java
@Service
public class TransferService {
    @Transactional
    public void transfer(long from, long to, Money amount) {
        // multiple repo calls — one unit of work
    }
}
```

Spring creates an AOP proxy that begins/commits/rolls back transactions. Default rollback on unchecked exceptions (not checked, unless `rollbackFor`).

Key attributes: `propagation` (`REQUIRED`, `REQUIRES_NEW`, …), `isolation`, `readOnly`, `timeout`, `noRollbackFor`.

**Self-invocation:** calling `this.method()` bypasses proxy — no TX / no security advice. Fix: inject self, separate bean, or AspectJ weaving.

#### PlatformTransactionManager

SPI that Spring uses to demark transactions against a technology:

- `JpaTransactionManager` / `HibernateTransactionManager`
- `DataSourceTransactionManager` (JDBC)
- `JtaTransactionManager` (distributed)

`@Transactional` is infrastructure-agnostic; the manager binds the actual JDBC connection / EntityManager to the thread for the transaction scope. Boot auto-configures the right manager when JPA/JDBC is present.

---

**📌 Hibernate (Advanced JPA Concepts)**

### Hibernate Caching: First-level, Second-level, Query Cache

| Cache | Scope | Purpose |
|---|---|---|
| **First-level** | Persistence context / Session | Always on; identity map + dirty checking |
| **Second-level** | SessionFactory (shared) | Cross-session entity caching |
| **Query cache** | SessionFactory | Cache results of queries (IDs) |

L2 requires a provider (Ehcache, Caffeine, Redis region factory, etc.) and `@Cacheable` on entities/collections. Query cache only helps with repeated identical queries and correct invalidation.

---

### Hibernate Annotations & Mapping

Beyond basic JPA: Hibernate-specific annotations (`@BatchSize`, `@Fetch`, `@Cache`, `@NaturalId`, `@Formula`, `@Type`) extend mapping. Prefer **standard JPA** annotations when portable; use Hibernate extensions for performance features.

XML mappings (`hbm.xml`) are legacy — annotation/JPA XML `orm.xml` dominate now.

---

### Lazy vs Eager Fetching

**Lazy:** proxy/placeholder until attribute accessed.  
**Eager:** fetch immediately with owner query (often via joins).

Defaults and best practice: make associations **LAZY**; fetch what you need per use-case with **join fetch** / entity graphs / DTO queries. Eager collections are a common source of huge Cartesian products and N+1 surprises.

`LazyInitializationException` — accessed lazy assoc outside session/TX. Fixes: fetch join in repo query, `@EntityGraph`, transactional service layer DTO mapping, or (controversial) Open Session In View (`spring.jpa.open-in-view` — convenience vs hidden queries).

---

### N+1 Problem

One query loads parents; then **N** additional queries load each child's association:

```text
SELECT * FROM authors;          -- 1
SELECT * FROM books WHERE author_id=1; -- N times
...
```

**Fixes:**

- `join fetch` in JPQL
- `@EntityGraph`
- `@BatchSize` / `hibernate.default_batch_fetch_size` (batch the +N)
- DTO projections / single query aggregations
- Avoid accidental lazy touches in loops/serializers

Detect with SQL logging / p6spy / datasource-proxy in tests.

---

### Cascade Types

Cascade propagates operations from parent to children:

`PERSIST`, `MERGE`, `REMOVE`, `REFRESH`, `DETACH`, `ALL`.

```java
@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
private List<LineItem> items;
```

**`orphanRemoval`** — removing child from collection deletes it. Don't cascade `REMOVE` from shared references carelessly (deleting a department shouldn't wipe employees unless intended). Cascades are not the same as DB `ON DELETE CASCADE` — both can exist; know which layer does what.

---

### HQL vs JPQL

**JPQL** — Jakarta Persistence query language (standard).  
**HQL** — Hibernate Query Language (superset historically; many features converged).

In Spring Data / JPA apps, write **JPQL** for portability. Hibernate-specific functions may appear in native or Hibernate APIs. Both are object-oriented (entity names/fields), not table/column names (unlike SQL).

---

### Dirty Checking

Managed entities are tracked. At flush time, Hibernate compares current state to a snapshot and issues **UPDATE**s for changed columns — you don't call `save` for every field change inside a transaction.

```java
@Transactional
public void rename(long id, String name) {
    User u = repo.findById(id).orElseThrow();
    u.setName(name); // dirty → UPDATE on flush/commit
}
```

Implications: avoid unnecessary field sets; be careful with large objects in session; `readOnly=true` transactions can skip dirty checks/flushes for optimization.

---

### Hibernate Session & SessionFactory

**`SessionFactory`** — thread-safe, heavyweight, one per datasource; creates Sessions. Maps to JPA `EntityManagerFactory`.

**`Session`** — single-threaded unit of work; persistence context. Maps to JPA `EntityManager`.

In Spring you usually use `EntityManager` / repositories; Hibernate APIs appear for unwrap/criteria/stateless sessions. Don't keep Sessions open across HTTP requests without a clear pattern (OSIV).

---

**📌 Spring REST & APIs**

### REST Principles

REST is an architectural style for networked resources:

- Resource-oriented URIs (`/orders/42`)
- Uniform interface: HTTP methods (`GET` retrieve, `POST` create, `PUT` replace, `PATCH` partial, `DELETE`)
- Stateless requests (each carries auth/context)
- Representations (JSON) separate from resources
- Hypermedia optional (HATEOAS — less common in practice)
- Correct status codes: `201` + Location, `204`, `400`, `401`, `403`, `404`, `409`, `429`

Idempotency: `GET`/`PUT`/`DELETE` should be idempotent; `POST` often isn't.

---

### API Versioning

Strategies:

- URI: `/api/v1/orders`
- Header: `Accept: application/vnd.company.v1+json`
- Query: `?version=1` (least preferred)

URI versioning is most common and cache-friendly. Plan backward compatibility; deprecate with headers/docs; avoid breaking changes in-place.

---

### Exception Handling for APIs

Map domain errors to stable JSON error bodies + status:

```java
@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<Problem> notFound(NotFoundException ex) {
        return ResponseEntity.status(404).body(Problem.of(ex));
    }
}
```

Use consistent structure (Problem Details). Log 5xx with correlation IDs; don't expose internals. Validate input → 400 with field errors.

---

### ResponseEntity, HttpStatus

`ResponseEntity<T>` controls status, headers, and body:

```java
return ResponseEntity
    .created(uri)
    .body(dto);

return ResponseEntity.noContent().build();
return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
```

Prefer explicit statuses over always returning 200 with error payloads.

---

### DTO Pattern & ModelMapper

**DTOs** decouple API contracts from persistence entities:

- Prevent over-exposure / over-posting
- Avoid lazy serialization issues
- Allow API evolution independent of schema

Mapping options: manual mappers, MapStruct (compile-time, preferred for type safety), ModelMapper (reflection, flexible but opaque). Interview: explain *why* DTOs, not only the library.

---

**📌 Spring Testing**

### Unit Testing with Spring Context

Pure unit tests: no Spring — `new Service(mockDep)`. Fastest.

When you need Spring (DI, `@Transactional`, MVC stack), use slice or full context tests. Balance: more Spring = more realism, slower/flakier.

---

### @WebMvcTest, @DataJpaTest, @SpringBootTest

| Annotation | Loads | Use |
|---|---|---|
| `@WebMvcTest` | MVC slice (controllers, advice, filters optionally) | Controller tests with MockMvc |
| `@DataJpaTest` | JPA slice + embedded DB by default | Repository tests |
| `@SpringBootTest` | Full (or partially mocked) context | Integration tests |
| `@JsonTest` | Jackson | JSON (de)serialization |
| `@RestClientTest` | REST client slice | |

`@WebMvcTest` does **not** load full security/services unless `@Import` / `@MockBean`.

---

### MockMvc

Simulates HTTP against DispatcherServlet without a real network port:

```java
mockMvc.perform(get("/api/users/1").accept(MediaType.APPLICATION_JSON))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.email").value("a@b.com"));
```

Supports security (`springSecurity()`), multipart, async. Primary tool for `@WebMvcTest`.

---

### TestRestTemplate

Real HTTP client against a running server (`@SpringBootTest(webEnvironment = RANDOM_PORT)`):

```java
ResponseEntity<UserDto> res = restTemplate.getForEntity("/api/users/1", UserDto.class);
```

`WebTestClient` is the reactive/modern alternative (also works with servlet). Use for end-to-end API tests; MockMvc for faster controller-focused tests.

---

### Mockito Integration

```java
@MockBean PaymentClient payments; // Spring bean replaced by mock in context

@Mock PaymentClient payments;     // pure unit test
@InjectMocks OrderService service;
```

`@MockBean` is Spring Boot test annotation — adds/replaces a bean in the context (can reload context — cost). Prefer pure Mockito for unit tests; `@MockBean` for slice/integration where the collaborator must be a bean.

---

### Embedded Databases (H2, HSQL)

`@DataJpaTest` typically uses H2 in-memory. Good for fast repo tests; dialect differences can hide production issues (Postgres JSON, locks). Options: run tests on Testcontainers Postgres, or use Flyway/Liquibase with the same DB as prod.

---

### Testcontainers (Optional but modern)

Spins real Docker containers (Postgres, Kafka, Redis) for tests:

```java
@Container
static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");
```

Dynamic property registration points Spring datasource at the container. Higher fidelity than H2; needs Docker; slower but catches real SQL bugs. Strong "production readiness" interview signal.

---

**📌 Spring AOP**

### Aspect-Oriented Programming

AOP modularizes behavior that cuts across many classes (logging, metrics, TX, security) without polluting business code. Spring AOP uses **proxies** (JDK interface proxies or CGLIB subclass proxies) to wrap beans and apply advice.

---

### Cross-cutting concerns

Concerns that span modules: transactions, security checks, auditing, caching (`@Cacheable`), retries, logging, timing. Without AOP you'd scatter boilerplate; with AOP you declare *where* (pointcut) and *what* (advice).

---

### @Aspect, @Before, @After, @Around, etc.

```java
@Aspect
@Component
public class TimingAspect {
    @Around("@annotation(Timed)")
    public Object time(ProceedingJoinPoint pjp) throws Throwable {
        long t = System.nanoTime();
        try {
            return pjp.proceed();
        } finally {
            log.info("{} took {}ms", pjp.getSignature(), (System.nanoTime()-t)/1e6);
        }
    }
}
```

Advice types: `@Before`, `@AfterReturning`, `@AfterThrowing`, `@After` (finally), `@Around` (most powerful — must `proceed()`).

Enable with `@EnableAspectJAutoProxy` (Boot auto-enables when AspectJ + Spring AOP on classpath).

---

### Pointcut expressions

Pointcuts match join points (method executions in Spring AOP):

```text
execution(* com.example.service.*.*(..))
@annotation(com.example.Timed)
within(com.example.web..*)
bean(*Service)
```

Combine with `&&`, `||`, `!`. Keep pointcuts precise — overly broad aspects surprise performance and behavior.

---

### Proxy vs Target object

Client → **Proxy** (advice + delegate) → **Target** (your class).

Calls that go through the proxy get advice. Internal `this.foo()` calls on the target **do not**. Hence `@Transactional` / `@Cacheable` / `@Async` self-invocation issues.

`@EnableAspectJAutoProxy(exposeProxy = true)` + `AopContext.currentProxy()` is a workaround; cleaner design is split beans.

---

### AOP use-cases: Logging, Transactions, Security

| Feature | Mechanism |
|---|---|
| `@Transactional` | Transaction advice around methods |
| `@PreAuthorize` | Security method advice |
| `@Cacheable` | Cache advice |
| `@Async` | Async executor advice |
| Custom `@Audited` | Your aspect |

Interview: Spring AOP is **method-execution** oriented on Spring beans — not full AspectJ weave of all constructors/fields unless you add AspectJ compile/load-time weaving.

---

**📌 Spring Security**

### In-memory Authentication

Quick demo auth:

```java
@Bean
UserDetailsService users() {
    var user = User.withUsername("admin")
        .password(encoder.encode("secret"))
        .roles("ADMIN")
        .build();
    return new InMemoryUserDetailsManager(user);
}
```

Fine for local demos; never for production user stores.

---

### Authentication Providers

`AuthenticationProvider` validates an `Authentication` request and returns an authenticated token or throws.

Default: `DaoAuthenticationProvider` uses `UserDetailsService` + `PasswordEncoder`. Custom providers handle LDAP, API keys, OTP, etc. `AuthenticationManager` delegates to providers.

---

### Role-based Authorization (@PreAuthorize, @Secured)

```java
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("hasAuthority('ORDER_WRITE')")
@Secured("ROLE_ADMIN")
@PostAuthorize("returnObject.owner == authentication.name")
```

Enable with `@EnableMethodSecurity` (Boot 3) / legacy `@EnableGlobalMethodSecurity`. Prefer `hasAuthority` with fine-grained permissions when roles become coarse. SpEL can access beans/parameters (`#id`).

---

### Spring Security Architecture

Request → **Security Filter Chain** → Authentication mechanism → SecurityContext → Authorization decisions (HTTP + method) → Controller.

Core types: `SecurityFilterChain`, `AuthenticationManager`, `SecurityContextHolder` (ThreadLocal by default), `UserDetails`, `GrantedAuthority`.

Boot 3 uses `SecurityFilterChain` beans instead of `WebSecurityConfigurerAdapter` (removed).

---

### Authentication & Authorization

**Authentication** — who are you? (credentials → principal)  
**Authorization** — what can you do? (roles/authorities/policies)

Unauthenticated → 401; authenticated but forbidden → 403. Keep them distinct in API design and error handling.

---

### JDBC Authentication

Store users/authorities in tables; configure `JdbcUserDetailsManager` or custom queries. Prefer custom `UserDetailsService` + your schema for real apps. Always store **hashed** passwords.

---

### Password Encoding (BCrypt)

```java
@Bean
PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

BCrypt (or Argon2/SCrypt via Spring Security) with salt and work factor. Never store plaintext. `DelegatingPasswordEncoder` supports `{bcrypt}` prefixes for migration between algorithms.

---

### Security Filters and Filter Chain

Spring Security is a chain of servlet filters (`UsernamePasswordAuthenticationFilter`, `BearerTokenAuthenticationFilter`, `CorsFilter`, `CsrfFilter`, …).

```java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable()) // often for stateless APIs
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health").permitAll()
            .anyRequest().authenticated())
        .sessionManagement(s -> s.sessionCreationPolicy(STATELESS));
    return http.build();
}
```

Order matters. Multiple `SecurityFilterChain` beans can secure different request matchers.

---

### CSRF Protection

Cross-Site Request Forgery protection for cookie-based session auth (browser automatically sends cookies). Spring Security enables CSRF by default for browser sessions.

For **stateless JWT APIs** without cookie auth, CSRF is often disabled. For session cookie SPAs, use CSRF tokens (header) or SameSite cookie strategies carefully. Don't disable CSRF blindly on cookie-based apps.

---

### JWT Integration

JSON Web Tokens carry claims for stateless auth:

1. Client authenticates → server issues signed JWT
2. Client sends `Authorization: Bearer <token>`
3. Filter validates signature/expiry → sets `SecurityContext`

Libraries: Spring Security OAuth2 Resource Server (`spring-boot-starter-oauth2-resource-server`) is the preferred modern path; custom JWT filters appear in tutorials but reinvent validation. Store minimal claims; short TTL + refresh tokens; never put secrets in JWT payload (it's encoded, not encrypted by default).

---

### OAuth2 Basics

Roles:

- **Resource Owner** — user
- **Client** — app requesting access
- **Authorization Server** — issues tokens
- **Resource Server** — API validating tokens

Flows: Authorization Code (+ PKCE for public clients), Client Credentials (service-to-service). Spring: `oauth2-client` for login/clients; `oauth2-resource-server` for APIs. "Login with Google" uses OIDC on top of OAuth2.

---

### Method-level Security

Authorize at service methods, not only HTTP paths — defense in depth when multiple entry points exist. Uses AOP proxies → same self-invocation caveats. Combine with domain checks (`@PreAuthorize("@guard.check(#id)")`).

---

### Custom UserDetailsService

```java
@Service
public class DbUserDetailsService implements UserDetailsService {
    public UserDetails loadUserByUsername(String username) {
        AppUser u = users.findByEmail(username).orElseThrow(...);
        return User.withUsername(u.getEmail())
            .password(u.getPasswordHash())
            .authorities(u.getRoles().toArray(String[]::new))
            .build();
    }
}
```

Bridge your domain user model to Spring Security's `UserDetails`.

---

### Session Management

Configure session fixation protection, concurrent session control, session creation policy:

- `IF_REQUIRED` — traditional web apps
- `STATELESS` — JWT APIs (no session cookie)

Session fixation: rotate session ID after login (Spring default behaviors help).

---

### Stateless vs Stateful Authentication

| | Stateful (session) | Stateless (JWT) |
|---|---|---|
| Server stores | Session | Usually nothing (or token denylist) |
| Scale | Sticky sessions / shared session store | Easier horizontal scale |
| Revocation | Invalidate session | Harder until expiry / denylist |
| CSRF | Relevant with cookies | Less if no cookies |

Many APIs choose stateless; browser apps may use sessions or BFF patterns.

---

### Custom Authentication Provider

```java
public class ApiKeyAuthProvider implements AuthenticationProvider {
    public Authentication authenticate(Authentication auth) { ... }
    public boolean supports(Class<?> type) { ... }
}
```

Register with `AuthenticationManagerBuilder` / as bean consumed by custom filter. Use when username/password isn't the model (API keys, HMAC, step-up auth).

---

### Security with REST APIs

Typical REST security setup:

- Stateless session policy
- JWT / OAuth2 resource server
- CSRF disabled (if no cookie session)
- CORS configured explicitly
- `401`/`403` entry point / access denied handlers returning JSON
- Method security for sensitive operations
- Harden actuator endpoints
- Validate input; rate-limit at gateway

Don't rely only on "hidden" URLs — authorize every request.

---

**📌 Spring Boot Actuator**

### Built-in Endpoints (health, metrics, info, etc.)

Actuator exposes operational endpoints:

| Endpoint | Purpose |
|---|---|
| `/actuator/health` | Health (liveness/readiness in k8s) |
| `/actuator/info` | App info |
| `/actuator/metrics` | Metric names/values |
| `/actuator/env` | Property sources (sensitive!) |
| `/actuator/beans` | Bean list |
| `/actuator/loggers` | Adjust log levels at runtime |
| `/actuator/prometheus` | Prometheus scrape format (with dependency) |

Expose selectively: `management.endpoints.web.exposure.include=health,info,prometheus`.

---

### Custom Health Indicators — implement HealthIndicator

```java
@Component
public class PaymentHealth implements HealthIndicator {
    public Health health() {
        return payments.ping()
            ? Health.up().withDetail("payments", "reachable").build()
            : Health.down().withDetail("payments", "unreachable").build();
    }
}
```

Aggregates into `/actuator/health`. Use `ReactiveHealthIndicator` for WebFlux. Separate **liveness** (process up) from **readiness** (can accept traffic — DB up, warmups done).

---

### Security of Actuator Endpoints

Actuator can leak env vars, heap dumps, logger control. In production:

- Expose minimally
- Separate management port (`management.server.port`)
- Authenticate/authorize actuator (`ROLE_ADMIN` / network policies)
- Never expose `env`/`heapdump` publicly

---

### Metrics Collection (Micrometer)

Micrometer is the metrics facade Boot uses (`Counter`, `Timer`, `Gauge`, `DistributionSummary`).

```java
timer.record(() -> service.work());
counter.increment();
```

Auto-instruments Web, JVM, DB pools, etc. Tag carefully (cardinality explosion with unbounded IDs).

---

### Integration with Prometheus/Grafana

Add `micrometer-registry-prometheus` → scrape `/actuator/prometheus`. Grafana dashboards visualize rates, latencies, error ratios (RED/USE methods). Pair with alerts on health and SLOs. Standard production observability stack for Spring Boot services.

---

**📌 Spring Boot Production Readiness**

### Logging (Logback, Log4j2)

Boot defaults to **Logback** via `spring-boot-starter-logging`. Configure in `logback-spring.xml` (Spring profiles aware) or `application.yml`:

```yaml
logging:
  level:
    org.hibernate.SQL: DEBUG
  pattern:
    console: "%d{ISO8601} [%X{correlationId}] %-5level %logger - %msg%n"
```

**Log4j2** via `spring-boot-starter-log4j2` (exclude default logging). Use structured JSON logs in prod; MDC for correlation IDs; never log secrets/PII.

---

### Spring Boot Admin

UI to monitor multiple Boot apps' actuator data (health, metrics, loggers). Apps register as clients; Admin server aggregates. Useful in mid-size deployments; large orgs may prefer full APM (Datadog, New Relic) + Prometheus.

---

### Actuator Alerts & Monitoring

Wire health/metrics into alerting:

- Kubernetes probes on liveness/readiness
- Prometheus Alertmanager on error rate / latency / heap
- On-call runbooks for dependency downs

Actuator alone doesn't alert — exporters + monitoring systems do.

---

### Config Server (Spring Cloud)

**Spring Cloud Config Server** centralizes external config (Git, Vault, native backend). Clients fetch config at bootstrap/startup (`spring.config.import=configserver:`). Supports env profiles, refresh (`@RefreshScope`) with Spring Cloud Bus.

Tradeoffs: operational dependency; many teams use Kubernetes ConfigMaps/Secrets + env vars instead. Know Config Server as the Spring-native option.

---

### Secrets Management

Don't commit secrets. Options:

- Environment variables / platform secrets
- HashiCorp Vault + Spring Cloud Vault
- Cloud secret managers (AWS Secrets Manager, GCP Secret Manager)
- Kubernetes Secrets (base64 — still need RBAC/encryption at rest)

Rotate credentials; use short-lived tokens where possible; `@ConfigurationProperties` for injection without scattering secrets in code.

---

### Graceful Shutdown

On SIGTERM, finish in-flight requests before dying:

```yaml
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
```

Combine with k8s `preStop` hooks and readiness probe failing first so traffic drains. Important for zero-downtime deploys.

---

### Embedded Server Configuration (Tomcat, Jetty)

Boot embeds **Tomcat** by default (`starter-web`). Switch to Jetty/Undertow by excluding Tomcat and adding another starter.

Tune:

```yaml
server:
  port: 8080
  tomcat:
    threads:
      max: 200
    connection-timeout: 5s
```

Understand thread-per-request model vs WebFlux event loop when sizing. Forward headers for proxies (`server.forward-headers-strategy`).

---

**📌 Advanced Topics (Optional but Impressive)**

### Spring WebFlux (Reactive Programming)

Reactive stack on **Netty** (non-blocking) using Project Reactor (`Mono`, `Flux`):

```java
@GetMapping("/users/{id}")
Mono<User> get(@PathVariable String id) {
    return repo.findById(id);
}
```

Use when high concurrency with blocking-wait workloads (many connections, streaming). Not automatically "faster" for simple CRUD with blocking JDBC — blocking calls must be isolated (`publishOn` / bounded elastic) or you defeat the model. Harder debugging; rethink thread-locals (SecurityContext propagation differs).

---

### Reactive Repositories

Spring Data reactive variants (`ReactiveCrudRepository`) for MongoDB, Cassandra, R2DBC (SQL), Redis, etc.

```java
public interface UserRepo extends ReactiveCrudRepository<User, String> {
    Flux<User> findByActiveTrue();
}
```

JPA/Hibernate is blocking — don't call it on WebFlux event-loop threads. Use R2DBC or isolate JDBC.

---

### Spring Cloud Overview (Config, Discovery, Gateway)

| Project | Role |
|---|---|
| **Config** | Centralized configuration |
| **Discovery (Eureka/Consul)** | Service registry — find instances by name |
| **Gateway** | Edge routing, auth, rate limits, path rewrite |
| **LoadBalancer** | Client-side load balancing |
| **Circuit Breaker** | Resilience integration |
| **Sleuth/Micrometer Tracing** | Distributed tracing (Brave/OTel) |

Modern deployments often use Kubernetes DNS + Ingress instead of Eureka; Gateway still common. Speak to tradeoffs.

---

### Circuit Breaker (Resilience4j)

Prevent cascade failures when dependencies are down:

```java
@CircuitBreaker(name = "payments", fallbackMethod = "fallback")
public PaymentResult pay(Request r) { ... }
```

States: closed → open (fail fast) → half-open (trial). Also: retries, rate limiters, bulkheads, time limiters. Resilience4j replaced Netflix Hystrix in Spring Cloud recommendations.

---

### Kafka Integration with Spring Boot

`spring-kafka`:

```java
@KafkaListener(topics = "orders")
void onMessage(OrderEvent event) { ... }

kafkaTemplate.send("orders", event);
```

Know: consumer groups, offsets, idempotency, exactly-once/at-least-once tradeoffs, DLQs, serialization (JSON/Avro), partitioning keys. Spring Cloud Stream is a higher abstraction over binders (Kafka/Rabbit).

---

### Schedulers (Spring Scheduler, Quartz)

**Spring `@Scheduled`:**

```java
@EnableScheduling
@Scheduled(cron = "0 0 * * * *")
void hourly() { ... }
```

Simple in-app scheduling; with multiple instances, use ShedLock / DB locks to avoid duplicate runs.

**Quartz** — fuller job scheduling (clustering, persistence, complex calendars). Use when you need enterprise job stores and failover.

---

### Async Programming (@Async)

```java
@EnableAsync
@Async
public CompletableFuture<Result> compute() {
    return CompletableFuture.completedFuture(doWork());
}
```

Runs on a Spring-managed `TaskExecutor` (configure pool sizes!). Same proxy caveat as `@Transactional`. Propagate MDC/SecurityContext with decorators if needed. Prefer `CompletableFuture` / explicit executors for clarity in complex flows; `@Async` for fire-and-forget side work.

---

## How to use this guide

- Walk each checkbox in `Spring V2.md` and explain it aloud before reading the matching section.
- Always connect layers: **Boot auto-config → Core beans → MVC/Security filters → Data `@Transactional` + persistence context**.
- For JPA answers, mention **LAZY, N+1, DTO vs entity, and transaction boundaries** — that's where seniors differentiate.
- Rebuild a mental request path: Filter → Security → DispatcherServlet → Interceptor → Controller → Service (`@Transactional`) → Repository → DB.

Good luck with prep.
