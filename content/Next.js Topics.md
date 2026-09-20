# Next.js

Checklist for deep-dive Next.js interview prep (App Router, RSC, data fetching, caching, Server Actions, routing, middleware, auth, deployment). Check off when you can explain aloud with tradeoffs and a small code mental model.

*Related:* `React Topics.md` / Guide for React fundamentals & hooks; this doc focuses on the **Next.js framework** (App Router–first, with Pages Router literacy).

---

**📌 Next.js Foundations**

- [] Next.js overview & why it exists
- [] Next.js vs Create React App / Vite SPA
- [] Next.js vs Remix vs Nuxt (high level)
- [] App Router vs Pages Router mental model
- [] Creating an app (`create-next-app`)
- [] Project structure (`app/`, `public/`, `next.config`)
- [] Dev server, build, and start scripts
- [] TypeScript setup in Next.js
- [] Environment variables (`NEXT_PUBLIC_` vs server-only)
- [] Absolute imports & path aliases

---

**📌 App Router — Routing & Layouts**

- [] File-system routing in `app/`
- [] `page.tsx` vs `layout.tsx` vs `template.tsx`
- [] Root layout & nested layouts
- [] Route groups `(marketing)` / `(shop)`
- [] Dynamic segments `[id]` and catch-all `[...slug]`
- [] Optional catch-all `[[...slug]]`
- [] Parallel routes (`@slot`)
- [] Intercepting routes `(.)` `(..)` `(...)`
- [] Private folders `_components` convention
- [] Linking with `next/link`
- [] Programmatic navigation (`useRouter`, `redirect`)
- [] `usePathname` / `useSearchParams` / `useParams`
- [] Soft navigation vs full reload
- [] `loading.tsx` and Suspense boundaries
- [] `error.tsx` and `global-error.tsx`
- [] `not-found.tsx` and `notFound()`
- [] Route handlers vs pages (when each)

---

**📌 Rendering Models**

- [] SSR, SSG, ISR, CSR — definitions & tradeoffs
- [] React Server Components (RSC) overview
- [] Server Components vs Client Components
- [] `"use client"` boundary rules
- [] Passing props across the RSC → client boundary
- [] What cannot cross the boundary (functions, classes)
- [] Streaming SSR with Suspense
- [] Partial Prerendering (PPR) overview
- [] Static vs dynamic rendering decision
- [] `dynamic = 'force-static' | 'force-dynamic'`
- [] `revalidate` segment config
- [] `runtime = 'nodejs' | 'edge'` (overview)
- [] `generateStaticParams` for dynamic routes
- [] When to reach for Client Components

---

**📌 Data Fetching & Caching**

- [] Fetching in Server Components
- [] `fetch` cache defaults in Next.js (evolution awareness)
- [] `cache: 'force-cache'` vs `no-store`
- [] `next: { revalidate: N }` time-based revalidation
- [] `next: { tags: [...] }` and tag-based revalidation
- [] `revalidatePath` vs `revalidateTag`
- [] Request memoization / React `cache()`
- [] Deduping identical fetches in one render
- [] Parallel vs sequential data fetching
- [] Waterfalls and how to avoid them
- [] Using ORMs / DB clients in Server Components
- [] `unstable_cache` / Data Cache patterns (overview)
- [] Client-side fetching (`useEffect`, SWR, React Query)
- [] When client fetch beats server fetch

---

**📌 Server Actions & Mutations**

- [] Server Actions overview
- [] `"use server"` in files vs inline actions
- [] Calling Server Actions from Client Components
- [] Forms with Server Actions (`action={fn}`)
- [] Progressive enhancement (JS-optional forms)
- [] `useFormStatus` and `useFormState` / `useActionState`
- [] Validation patterns (Zod on the server)
- [] Returning errors & success payloads
- [] Redirects after mutations
- [] Revalidation after mutations
- [] Security: closing Server Action attack surface
- [] Server Actions vs Route Handlers

---

**📌 Route Handlers & Backend in Next**

- [] `route.ts` HTTP methods (GET/POST/…)
- [] Request & Response helpers (`NextRequest`, `NextResponse`)
- [] Dynamic route handlers
- [] Streaming responses from route handlers
- [] Cookies & headers in handlers
- [] CORS considerations for Next APIs
- [] Building a BFF with Next route handlers
- [] When to extract a separate API (Spring/Express)

---

**📌 Middleware & Edge**

- [] `middleware.ts` matchers & execution point
- [] Rewrites vs redirects vs headers in middleware
- [] Auth gating patterns in middleware
- [] Edge runtime limits (no Node APIs)
- [] Middleware pitfalls (overuse, cold start, geo)
- [] Proxying / A/B flags at the edge (overview)

---

**📌 Metadata, SEO & Assets**

- [] Metadata API (`export const metadata`)
- [] `generateMetadata` for dynamic SEO
- [] Open Graph & Twitter cards
- [] `sitemap.ts` / `robots.ts`
- [] `next/image` — why it exists
- [] Image optimization domains & loaders
- [] `next/font` and layout shift avoidance
- [] `next/script` loading strategies
- [] Static files from `public/`
- [] Favicons & `icon.tsx` / `apple-icon`

---

**📌 Styling & UI Composition**

- [] Global CSS vs CSS Modules in App Router
- [] Tailwind CSS with Next.js
- [] CSS-in-JS caveats with RSC
- [] Composing layouts for marketing vs app shells
- [] Client islands architecture
- [] Third-party widgets (maps, chat) as client-only

---

**📌 Auth, Sessions & Security**

- [] Cookie-based sessions vs JWTs in Next apps
- [] Auth.js / NextAuth patterns (overview)
- [] Protecting Server Components & Actions
- [] CSRF considerations with Server Actions
- [] Storing secrets (env, not `NEXT_PUBLIC_`)
- [] XSS / injection awareness in RSC HTML
- [] Rate limiting route handlers & actions
- [] Multi-tenant routing & data isolation (overview)

---

**📌 Performance**

- [] Core Web Vitals in a Next app
- [] Bundle analysis & client JS budget
- [] Dynamic `import()` for heavy client components
- [] Streaming to improve TTFB / LCP
- [] Caching at CDN, Data Cache, and browser
- [] Avoiding shipping server-only code to the client
- [] `server-only` / `client-only` packages
- [] Prefetching behavior of `Link`

---

**📌 Testing & DX**

- [] Unit testing Server Components strategies
- [] Testing Server Actions & route handlers
- [] Playwright / Cypress for App Router flows
- [] MSW for API mocking
- [] ESLint `eslint-config-next`
- [] Turbopack vs Webpack in dev (overview)

---

**📌 Deployment & Production**

- [] `next build` output mental model
- [] Vercel deployment defaults
- [] Self-hosting with Node (`next start`)
- [] Dockerizing a Next.js app
- [] Standalone output (`output: 'standalone'`)
- [] Preview deployments & env per stage
- [] ISR / on-demand revalidation in production
- [] Observability (logging, OpenTelemetry overview)
- [] Common production incidents (cache stampede, wrong env)

---

**📌 Pages Router Literacy (Interview)**

- [] `pages/` routing basics
- [] `getServerSideProps` vs `getStaticProps` vs `getInitialProps`
- [] `getStaticPaths` & fallback modes
- [] API routes in `pages/api`
- [] `_app` / `_document` roles
- [] Migrating Pages → App Router incrementally

---

**📌 Interview Scenarios & Tradeoffs**

- [] Design: marketing site + authenticated dashboard in one Next app
- [] Design: BFF for a Spring Boot personalisation API
- [] Design: LetsBridge-style product (Next + mobile WebView/Capacitor)
- [] Debug: client bundle contains a DB SDK
- [] Debug: page always dynamic / never caches
- [] Debug: Server Action succeeds but UI shows stale data
- [] Tradeoff: App Router RSC vs SPA + separate API
- [] Tradeoff: Server Actions vs tRPC / REST handlers
- [] Senior traps across caching, boundaries & security
