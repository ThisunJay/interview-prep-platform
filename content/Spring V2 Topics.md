# Spring V2  
  
**📌 Spring Core (IoC, DI, Beans)**  
- [] Spring Framework Overview  
- [] Dependency Injection (Constructor, Setter, Field)  
- [] Inversion of Control (IoC) Container  
- [] Bean Lifecycle  
    - [] @PostConstruct/ InitializingBean - afterpropertyset  
    - [] @PreDestory / disposableBean - destroy  
- [] Bean Scopes (Singleton, Prototype, etc.)  
- [] @Component, @Service, @Repository, @Controller  
- [] @Autowired, @Qualifier, @Primary  
- [] Java-based Configuration (@Configuration, @Bean)  
- [] XML-based Configuration (basic understanding)  
- [] Profiles (@Profile)  
  
**📌 Spring Boot**  
- [] External Configuration  
- [] Custom Starter Creation  
- [] Spring Boot Auto-configuration  
- [] Spring Boot Starters  
- [] Spring Boot Annotations (@SpringBootApplication, etc.)  
- [] application.properties vs application.yml  
- [] Profiles in Spring Boot  
- [] CommandLineRunner & ApplicationRunner  
- [] Spring Boot DevTools  
- [] Fat JAR / Executable JAR  
- [] @ConfigurationProperties  
- [] Custom Contexts  
  
**📌 Spring MVC (Web)**  
- [] @Controller & @RestController  
- [] @RequestMapping, @GetMapping, @PostMapping, etc.  
- [] @PathVariable vs @RequestParam  
- [] Exception Handling (@ExceptionHandler, @ControllerAdvice)  
- [] HttpMessageConverters  
- [] Request/Response Body Mapping  
- [] Validation (JSR-303 / Hibernate Validator) ***  
- [] File Upload Handling  
- [] Filters  
- [] Intercepters  
    - [] preHandle  
    - [] postHandle  
    - [] afterCompletion  
- [] Dispatcher Servlet  
- [] Content Negotiation  
- [] CORS Configuration  
  
**📌 Spring Data JPA & Hibernate**  
- [] Spring Data JPA Overview  
    - [] JDBC  
    - [] Spring JDBC  
    - [] Data JPA  
    - [] Spring Data JPA  
- [] Entity Mapping: @Entity, @Table, @Id, @GeneratedValue  
- [] OneToOne, OneToMany, ManyToOne, ManyToMany  
- [] @JoinColumn, @MappedBy, Fetch Types  
- [] Repositories: CrudRepository, JpaRepository, PagingAndSortingRepository  
- [] Derived Query Methods  
- [] @Query (JPQL & Native SQL)  
- [] Custom Repositories  
- [] Pagination and Sorting  
- [] Auditing (CreatedDate, CreatedBy, etc.)  
- [] EntityManager Basics  
- [] Persistence Context  
- [] Caching in JPA  
- [] Transaction Management (@Transactional)  
    - [] PlatformTransactionManager  
  
**📌 Hibernate (Advanced JPA Concepts)**  
- [] Hibernate Caching: First-level, Second-level, Query Cache  
- [] Hibernate Annotations & Mapping  
- [] Lazy vs Eager Fetching  
- [] N+1 Problem  
- [] Cascade Types  
- [] HQL vs JPQL  
- [] Dirty Checking  
- [] Hibernate Session & SessionFactory  
  
**📌 Spring REST & APIs**  
- [] REST Principles  
- [] API Versioning  
- [] Exception Handling for APIs  
- [] ResponseEntity, HttpStatus  
- [] DTO Pattern & ModelMapper  
  
**📌 Spring Testing**  
- [] Unit Testing with Spring Context  
- [] @WebMvcTest, @DataJpaTest, @SpringBootTest  
- [] MockMvc  
- [] TestRestTemplate  
- [] Mockito Integration  
- [] Embedded Databases (H2, HSQL)  
- [] Testcontainers (Optional but modern)  

** 📌 Spring AOP**  
- [] Aspect-Oriented Programming  
- [] Cross-cutting concerns  
- [] @Aspect, @Before, @After, @Around, etc.  
- [] Pointcut expressions  
- [] Proxy vs Target object  
- [] AOP use-cases: Logging, Transactions, Security  
  
**📌 Spring Security**  
- [] In-memory Authentication  
- [] Authentication Providers  
- [] Role-based Authorization (@PreAuthorize, @Secured)  
- [] Spring Security Architecture  
- [] Authentication & Authorization  
- [] JDBC Authentication  
- [] Password Encoding (BCrypt)  
- [] Security Filters and Filter Chain  
- [] CSRF Protection  
- [] JWT Integration  
- [] OAuth2 Basics  
- [] Method-level Security  
- [] Custom UserDetailsService  
- [] Session Management  
- [] Stateless vs Stateful Authentication  
- [] Custom Authentication Provider  
- [] Security with REST APIs  
  
**📌 Spring Boot Actuator**  
- [] Built-in Endpoints (health, metrics, info, etc.)  
- [] Custom Health Indicators - implement HealthIndicator  
- [] Security of Actuator Endpoints  
- [] Metrics Collection (Micrometer)  
- [] Integration with Prometheus/Grafana  
  
**📌 Spring Boot Production Readiness**  
- [] Logging (Logback, Log4j2)  
- [] Spring Boot Admin  
- [] Actuator Alerts & Monitoring  
- [] Config Server (Spring Cloud)  
- [] Secrets Management  
- [] Graceful Shutdown  
- [] Embedded Server Configuration (Tomcat, Jetty)  
  
**📌 Advanced Topics (Optional but Impressive)**  
- [] Spring WebFlux (Reactive Programming)  
- [] Reactive Repositories  
- [] Spring Cloud Overview (Config, Discovery, Gateway)  
- [] Circuit Breaker (Resilience4j)  
- [] Kafka Integration with Spring Boot  
- [] Schedulers (Spring Scheduler, Quartz)  
- [] Async Programming (@Async)  
