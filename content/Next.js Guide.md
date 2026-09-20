# Next.js

A deep-dive companion to `Next.js Topics.md`. Each heading matches the checklist; under every topic: **what it is**, **why it matters**, **how it works**, and **interview-ready nuance**. React Guide covers hooks & component model; this doc focuses on the **Next.js framework** (App Router–first, with Pages Router literacy).

---

**📌 Next.js Foundations**

### Next.js overview & why it exists

**Next.js** is a React meta-framework for production apps: routing, rendering strategies (SSR/SSG/ISR), bundling, image/font optimization, and (in App Router) Server Components & Server Actions—opinionated defaults on top of React.

**Why it exists:** CRA/Vite SPAs leave SEO, code-splitting by route, server data loading, and deployment edges as DIY. Next.js standardizes those concerns so teams ship full-stack React without inventing a framework each time.

**Interview stance:** Next is not “React with SSR”—it is a **routing + rendering + data** platform. Show you know *where code runs* (server, edge, client) and *what caches*.

---

### Next.js vs Create React App / Vite SPA

| | CRA / Vite SPA | Next.js |
|---|---|---|
| Default render | CSR in browser | Server + client hybrid |
| Routing | React Router (you add) | File-system built-in |
| Data on first paint | Extra round-trips | Can fetch on server |
| SEO | Harder without SSR | First-class |
| API | Separate backend | Route handlers / Actions optional |

Vite is excellent for pure SPAs and design systems. Choose Next when you want **document requests**, SEO, or colocated server logic.

---

### Next.js vs Remix vs Nuxt (high level)

| | Next.js | Remix | Nuxt |
|---|---|---|---|
| UI lib | React | React | Vue |
| Data | RSC + fetch cache + Actions | Loaders/actions (web fetch) | Vue ecosystem |
| Strength | Ecosystem, Vercel, RSC bet | Web standards, progressive enhancement | Vue DX |

**Nuance:** Interviews rarely need deep Remix/Nuxt—know Next’s RSC/Actions story and that Remix leaned harder into native Request/Response earlier.

---

### App Router vs Pages Router mental model

- **Pages Router (`pages/`):** classic Next—`getServerSideProps` / `getStaticProps`, client React tree by default after hydration.
- **App Router (`app/`):** React Server Components by default, nested layouts, streaming, Server Actions, finer caching APIs.

New apps should default to **App Router**. Still learn Pages for legacy codebases and interview “explain the old model” questions.

---

### Creating an app (`create-next-app`)

```bash
npx create-next-app@latest my-app
# prompts: TS, ESLint, Tailwind, App Router, src/, import alias
cd my-app && npm run dev
```

Prefer TypeScript + App Router + ESLint. `src/app` vs `app` is taste; be consistent.

---

### Project structure (`app/`, `public/`, `next.config`)

```
app/
  layout.tsx      # root shell
  page.tsx        # /
  api/hello/route.ts
public/           # static files served as-is
next.config.ts    # images, redirects, headers, experimental
middleware.ts     # edge gate (optional)
```

Colocate route UI (`page.tsx`) with route-local components; keep shared UI in `components/` or `_components` private folders.

---

### Dev server, build, and start scripts

| Script | Role |
|---|---|
| `next dev` | Hot reload, Turbopack/Webpack |
| `next build` | Production compile + static generation |
| `next start` | Serve production build (Node) |

Interview trap: behavior differs between dev and prod (caching, error overlays). Always verify caching claims with `next build` + `next start`.

---

### TypeScript setup in Next.js

Next ships TS support; `tsconfig.json` includes Next plugin for typed routes (when enabled) and JSX. Prefer typed `params` / `searchParams` in page props (async in recent versions).

---

### Environment variables (`NEXT_PUBLIC_` vs server-only)

- `process.env.SECRET` — **server only** (RSC, Route Handlers, Actions, `getServerSideProps`)
- `process.env.NEXT_PUBLIC_*` — inlined into **client** bundles

**Never** put API keys, DB URLs, or private tokens under `NEXT_PUBLIC_`. Restart dev server after `.env` changes.

---

### Absolute imports & path aliases

```json
// tsconfig paths
{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }
```

```ts
import { Button } from "@/components/Button";
```

Keeps deep relative paths (`../../../`) out of reviews.

---

**📌 App Router — Routing & Layouts**

### File-system routing in `app/`

Folders under `app/` define URL segments. A folder becomes a route when it contains `page.tsx` (or `route.ts` for APIs).

```
app/blog/[slug]/page.tsx  →  /blog/:slug
```

No React Router `<Route>` tree—the filesystem *is* the router.

---

### `page.tsx` vs `layout.tsx` vs `template.tsx`

| File | Role |
|---|---|
| `page.tsx` | Unique UI for that route (required for UI routes) |
| `layout.tsx` | Shared UI wrapping child segments; **state preserved** on navigation |
| `template.tsx` | Like layout but **remounts** on navigation (reset state / animations) |

Layouts nest: root → section → page.

---

### Root layout & nested layouts

Root `app/layout.tsx` must include `<html>` and `<body>`. Nested layouts wrap only their subtree (e.g. `app/dashboard/layout.tsx` for chrome with nav).

**Why it matters:** Shared chrome without remounting on every link—perf and UX win over SPA layout hacks.

---

### Route groups `(marketing)` / `(shop)`

Parentheses folders **do not** appear in the URL:

```
app/(marketing)/page.tsx     → /
app/(shop)/cart/page.tsx     → /cart
```

Use to apply different layouts without polluting paths.

---

### Dynamic segments `[id]` and catch-all `[...slug]`

```
app/users/[id]/page.tsx           → /users/1
app/docs/[...slug]/page.tsx       → /docs/a/b
```

In App Router, `params` are passed to pages/layouts (often as a `Promise` in newer Next—await them).

---

### Optional catch-all `[[...slug]]`

Matches `/docs` and `/docs/a/b`. Useful for docs homes + nested paths with one page file.

---

### Parallel routes (`@slot`)

Named slots render simultaneously in a layout:

```
app/dashboard/@analytics/page.tsx
app/dashboard/@team/page.tsx
app/dashboard/layout.tsx  // receives analytics, team as props
```

Powerful for dashboards and modals; interview depth: slots can load/error independently.

---

### Intercepting routes `(.)` `(..)` `(...)`

Intercept a route to show it in the current layout (e.g. photo modal over feed) while keeping a full page URL for refresh/share.

| Convention | Meaning |
|---|---|
| `(.)` | same level |
| `(..)` | one level up |
| `(...)` | from root |

Pair with parallel routes for modal patterns.

---

### Private folders `_components` convention

Folders starting with `_` are **private**—excluded from routing. Good for colocated helpers without creating URLs.

---

### Linking with `next/link`

```tsx
import Link from "next/link";
<Link href="/blog/hello">Hello</Link>
```

Enables client-side soft navigation and **prefetch** (viewport / hover depending on version/config). Prefer `Link` over raw `<a>` for internal routes.

---

### Programmatic navigation (`useRouter`, `redirect`)

- **Client:** `useRouter()` from `next/navigation` → `router.push`, `replace`, `refresh`
- **Server:** `redirect('/login')` from `next/navigation` throws a special control flow

Do not use `next/router` (Pages) in App Router code.

---

### `usePathname` / `useSearchParams` / `useParams`

Client hooks for location state. `useSearchParams` can force client rendering boundaries—wrap in `<Suspense>` when needed to keep static shells.

---

### Soft navigation vs full reload

Soft nav (via `Link` / router) reuses layouts and fetches only the next segment’s RSC payload. Full reload re-requests the document. Prefer soft nav; use `router.refresh()` to re-fetch server components without changing URL.

---

### `loading.tsx` and Suspense boundaries

`loading.tsx` auto-wraps the segment in Suspense and shows instant loading UI on navigation. You can also place manual `<Suspense fallback={...}>` around async Server Components for finer streaming.

---

### `error.tsx` and `global-error.tsx`

`error.tsx` is a Client Component error boundary for the segment. `global-error.tsx` replaces root when the root layout fails (must include its own `html/body`).

Reset with `reset()` from props after fixing transient errors.

---

### `not-found.tsx` and `notFound()`

Call `notFound()` in a Server Component when a resource is missing; renders nearest `not-found.tsx`. Prefer this over ad-hoc 404 UI for consistency.

---

### Route handlers vs pages (when each)

| Need | Use |
|---|---|
| HTML UI | `page.tsx` |
| JSON/webhook/API | `route.ts` |
| Form mutation from UI | Server Action (often) |
| Public HTTP API for mobile | Route Handler or external API |

---

**📌 Rendering Models**

### SSR, SSG, ISR, CSR — definitions & tradeoffs

| Mode | When HTML built | Good for |
|---|---|---|
| **SSG** | Build time | Marketing, docs |
| **SSR** | Each request | Personalized, auth-heavy |
| **ISR** | Build + revalidate in background | Semi-static catalogs |
| **CSR** | Browser after JS | Highly interactive widgets |

App Router maps these via static/dynamic rendering + revalidate config rather than only `getStaticProps` names.

---

### React Server Components (RSC) overview

**RSCs** render on the server and send a serialized component payload to the client—**no component JS** for pure server components in the browser bundle. They can touch DB/secrets directly.

Mental model: default `app/` components are Server Components unless marked `"use client"`.

---

### Server Components vs Client Components

| | Server | Client |
|---|---|---|
| Fetch DB/secrets | ✅ | ❌ (use API) |
| Hooks / browser APIs | ❌ | ✅ |
| Bundle size | Zero for pure SC | Costs JS |
| Interactivity | None | Events, state |

Compose: server fetches → pass data → small client islands for interactivity.

---

### `"use client"` boundary rules

`"use client"` at file top makes that module and its imports part of the **client graph**. Children can still be composed carefully; once you import a client module into a server file, that import is a client boundary.

**Rule:** Push `"use client"` as **leafward** as possible.

---

### Passing props across the RSC → client boundary

Props must be **serializable** (JSON-like): strings, numbers, plain objects/arrays, sparse Dates, etc.

```tsx
// Server
<LikeButton postId={post.id} initial={post.likes} />
```

---

### What cannot cross the boundary (functions, classes)

You cannot pass functions, class instances, or complex non-serializable objects as props from Server → Client (except special cases like Server Actions, which are encrypted references).

Interview classic: “Why can’t I pass an `onClick` from a Server Component?” → create a Client child that defines the handler.

---

### Streaming SSR with Suspense

Async Server Components suspend; React streams HTML/RSC chunks as they resolve. User sees shell + filling sections. Improves TTFB perception vs waiting for all data.

---

### Partial Prerendering (PPR) overview

**PPR** (evolving feature): static shell prerendered, holes streamed dynamically per request. Interview level: know the *goal* (static performance + dynamic bits) and that it’s configured/experimental depending on version—verify against current docs for your Next version.

---

### Static vs dynamic rendering decision

Next tries static when possible. Dynamic APIs (`cookies()`, `headers()`, uncached fetch, searchParams in some cases) opt the route into **dynamic** rendering.

**Interview stance:** Explain *what* forced dynamic, not just “Next decided.”

---

### `dynamic = 'force-static' | 'force-dynamic'`

Segment config exports:

```ts
export const dynamic = "force-dynamic";
```

Overrides heuristics. Use sparingly; prefer fixing fetches/caching intentionally.

---

### `revalidate` segment config

```ts
export const revalidate = 60; // ISR-like: revalidate every 60s
```

Applies time-based revalidation to the segment’s static output.

---

### `runtime = 'nodejs' | 'edge'` (overview)

Edge: faster cold starts, subset of APIs, good for middleware-like logic at the rim. Node: full Node APIs, ORMs, native modules. Default for most app routes is Node unless you opt into Edge.

---

### `generateStaticParams` for dynamic routes

At build time, return params to pre-render:

```ts
export async function generateStaticParams() {
  const posts = await db.listSlugs();
  return posts.map((slug) => ({ slug }));
}
```

Unknown params can be generated on demand depending on `dynamicParams`.

---

### When to reach for Client Components

Use client for: event handlers, `useState`/`useEffect`, browser-only libs, Context providers that hold client state. Keep data fetching on the server when possible; client for interactivity and live updates.

---

**📌 Data Fetching & Caching**

### Fetching in Server Components

```tsx
async function Page() {
  const data = await fetch("https://api.example.com/items").then((r) => r.json());
  return <ul>{data.map(/* ... */)}</ul>;
}
```

No `useEffect` required for initial data. Errors bubble to `error.tsx`.

---

### `fetch` cache defaults in Next.js (evolution awareness)

Next extended `fetch` with caching. **Defaults have changed across major versions**—interview answer: “I always set cache intent explicitly and verify against our Next version docs,” then explain `force-cache` / `no-store` / revalidate.

---

### `cache: 'force-cache'` vs `no-store`

```ts
await fetch(url, { cache: "force-cache" }); // prefer cached
await fetch(url, { cache: "no-store" });    // always hit origin
```

Use `no-store` for per-user personalized data; `force-cache` for public catalogs.

---

### `next: { revalidate: N }` time-based revalidation

```ts
await fetch(url, { next: { revalidate: 300 } });
```

Serves cached data; revalidates in background after `N` seconds (ISR-style for fetch).

---

### `next: { tags: [...] }` and tag-based revalidation

```ts
await fetch(url, { next: { tags: ["products"] } });
```

Later `revalidateTag("products")` invalidates those entries—precise busting after mutations.

---

### `revalidatePath` vs `revalidateTag`

| API | Scope |
|---|---|
| `revalidatePath('/shop')` | Path’s cached UI/data |
| `revalidateTag('products')` | All fetches tagged `products` |

Prefer tags for shared data used on many pages; paths for page-level refresh.

---

### Request memoization / React `cache()`

React `cache(fn)` memoizes per-server-request. Wrap DB lookups so layout + page can call `getUser()` without double query.

```ts
import { cache } from "react";
export const getUser = cache(async (id: string) => db.user.find(id));
```

---

### Deduping identical fetches in one render

Same URL+options `fetch` in one RSC render tree is deduped by Next/React. Still use `cache()` for non-fetch work (ORM).

---

### Parallel vs sequential data fetching

```ts
// sequential waterfall
const a = await getA();
const b = await getB(a.id);

// parallel when independent
const [a, b] = await Promise.all([getA(), getB()]);
```

Kick independent work early; pass promises into children + Suspense.

---

### Waterfalls and how to avoid them

Waterfalls: await in parent before child starts. Fix by fetching in parallel, or moving fetch into the child Suspense segment so shell streams first.

---

### Using ORMs / DB clients in Server Components

Instantiate clients in server-only modules; reuse connections carefully (global singleton in dev to avoid Hot Reload proliferation). Never import ORM into client files.

---

### `unstable_cache` / Data Cache patterns (overview)

`unstable_cache` (name may stabilize) caches arbitrary async functions with tags/revalidate—use when not using `fetch` (direct DB). Know the idea: **explicit cache keys + tags**.

---

### Client-side fetching (`useEffect`, SWR, React Query)

After hydration, client libraries shine for: polling, optimistic UI, window focus refetch, infinite scroll. Server still does first paint when SEO/perf matter.

---

### When client fetch beats server fetch

Highly dynamic user-only data behind auth cookies where CDN caching is useless; rapid interactive filters; websocket-ish freshness. Otherwise prefer RSC fetch for less client JS and faster first content.

---

**📌 Server Actions & Mutations**

### Server Actions overview

**Server Actions** are async server functions callable from Client Components / forms—Next wires a POST RPC under the hood with encrypted action IDs.

```ts
"use server";
export async function createPost(formData: FormData) { /* ... */ }
```

---

### `"use server"` in files vs inline actions

- File-level `"use server"` — all exports are actions  
- Inline `async function` with `"use server"` inside a Server Component — pass as prop to form/client

Keep privileged logic in dedicated server modules.

---

### Calling Server Actions from Client Components

```tsx
"use client";
import { createPost } from "./actions";
<button onClick={() => createPost()}>Create</button>
```

Actions can also be passed as props from server parents.

---

### Forms with Server Actions (`action={fn}`)

```tsx
<form action={createPost}>
  <input name="title" />
  <button type="submit">Save</button>
</form>
```

Works without custom `onSubmit` plumbing; progressive enhancement friendly.

---

### Progressive enhancement (JS-optional forms)

With Actions + forms, basic submit works even if JS fails (full document POST). Enhance with `useFormStatus` for pending UI when JS is available.

---

### `useFormStatus` and `useFormState` / `useActionState`

- `useFormStatus` — pending state inside form child  
- `useActionState` (formerly `useFormState`) — bind action + state for error display  

Exact names depend on React/Next version—describe the *pattern*: pending + last result state.

---

### Validation patterns (Zod on the server)

Always validate inside the action—never trust the client:

```ts
"use server";
const schema = z.object({ title: z.string().min(1) });
export async function createPost(fd: FormData) {
  const parsed = schema.safeParse({ title: fd.get("title") });
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten() };
  // persist
}
```

---

### Returning errors & success payloads

Return serializable objects `{ ok, errors, data }` for client display, or `throw` / `redirect` for hard flows. Don’t leak stack traces.

---

### Redirects after mutations

```ts
import { redirect } from "next/navigation";
redirect(`/posts/${id}`);
```

Call after successful write; treat as control-flow exception.

---

### Revalidation after mutations

```ts
import { revalidatePath, revalidateTag } from "next/cache";
revalidateTag("products");
revalidatePath("/shop");
```

Without this, SSR/RSC caches show stale UI after writes—classic interview bug.

---

### Security: closing Server Action attack surface

Actions are public HTTP endpoints if you know the ID. Always:

- Authz checks inside every action  
- Validate inputs  
- Avoid exporting dangerous low-level helpers as actions  
- Consider origin checks / Auth.js session  

Least privilege: thin actions calling service layer.

---

### Server Actions vs Route Handlers

| | Server Actions | Route Handlers |
|---|---|---|
| Primary consumer | Your Next UI | Any HTTP client |
| DX | RPC-like | REST/webhooks |
| Mobile / partners | Awkward | Natural |

Use Actions for first-party UI mutations; handlers for APIs and webhooks.

---

**📌 Route Handlers & Backend in Next**

### `route.ts` HTTP methods (GET/POST/…)

```ts
// app/api/health/route.ts
export async function GET() {
  return Response.json({ ok: true });
}
```

Export `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS` as needed.

---

### Request & Response helpers (`NextRequest`, `NextResponse`)

`NextRequest` extends Request with `nextUrl`, cookies helpers. `NextResponse` adds `redirect`, `rewrite`, cookie APIs. Standard `Request`/`Response` also work.

---

### Dynamic route handlers

```
app/api/users/[id]/route.ts
export async function GET(_req, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  ...
}
```

---

### Streaming responses from route handlers

Return a `ReadableStream` body for SSE or chunked data—useful for LLM token streams from a BFF.

---

### Cookies & headers in handlers

```ts
import { cookies } from "next/headers";
const jar = await cookies();
jar.set("session", token, { httpOnly: true, secure: true });
```

Same cookie API available in Server Actions / RSC (dynamic).

---

### CORS considerations for Next APIs

Browser calls from other origins need CORS headers on handlers. Same-origin Next UI often needs none. Don’t open `*` with credentials.

---

### Building a BFF with Next route handlers

**BFF** aggregates Spring/Java APIs, attaches cookies/session, shapes DTOs for the UI. Keeps tokens off the client. Matches Persoverse-style admin portals (Next or React talking to Spring).

---

### When to extract a separate API (Spring/Express)

Extract when: multiple clients (mobile, partners), heavy compute, independent scaling, non-JS teams own domain logic. Keep Next as UI + light BFF; core domain in Spring Boot / services.

---

**📌 Middleware & Edge**

### `middleware.ts` matchers & execution point

Runs at the **edge** before routes:

```ts
export const config = { matcher: ["/dashboard/:path*", "/login"] };
export function middleware(req: NextRequest) {
  // rewrite / redirect / set headers
}
```

Not a full Express middleware stack—keep it thin.

---

### Rewrites vs redirects vs headers in middleware

| | Effect |
|---|---|
| `NextResponse.redirect` | Browser URL changes |
| `NextResponse.rewrite` | Internally map path; URL stays |
| `NextResponse.next` + headers | Continue with extra headers |

---

### Auth gating patterns in middleware

Check session cookie existence / JWT expiry and redirect to login. **Heavy authz** (DB roles) often better in Server Components/Actions—middleware should be fast and dependency-light.

---

### Edge runtime limits (no Node APIs)

No native Node `fs`, limited crypto/npm. Prefer Web Crypto. If you need Prisma full engine, stay on Node runtime routes—not middleware.

---

### Middleware pitfalls (overuse, cold start, geo)

Bloated middleware adds latency on every matched request. Avoid large libs. Beware geo/IP assumptions behind proxies. Don’t stream large bodies through middleware.

---

### Proxying / A/B flags at the edge (overview)

Rewrite 50% traffic to `/b` variant or set a bucket cookie. Good for experiments; keep assignment deterministic per user id when needed.

---

**📌 Metadata, SEO & Assets**

### Metadata API (`export const metadata`)

```ts
export const metadata = {
  title: "LetsBridge",
  description: "B2B networking",
};
```

Only in Server Components (layouts/pages). Replaces manual `<Head>` for most App Router cases.

---

### `generateMetadata` for dynamic SEO

```ts
export async function generateMetadata({ params }) {
  const post = await getPost((await params).slug);
  return { title: post.title };
}
```

Share data with `cache()` to avoid double fetch with the page.

---

### Open Graph & Twitter cards

Set `openGraph` / `twitter` fields in metadata for link previews. Add `images` absolute URLs for reliable unfurls.

---

### `sitemap.ts` / `robots.ts`

Special App Router files generate `/sitemap.xml` and `/robots.txt` dynamically—keep SEO crawl rules next to the app.

---

### `next/image` — why it exists

Optimizes images: resize, modern formats, lazy load, prevents CLS with width/height or `fill`. Prefer over raw `<img>` for LCP-critical photos.

---

### Image optimization domains & loaders

Allow remote hosts in `next.config` `images.remotePatterns`. Custom loaders for Cloudinary/S3-style CDNs. Self-hosted Next still needs the optimizer (or use `unoptimized` / external CDN).

---

### `next/font` and layout shift avoidance

```ts
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
<html className={inter.className}>
```

Self-hosts font files—no FOUT from Google CSS; improves privacy and CLS.

---

### `next/script` loading strategies

`beforeInteractive` / `afterInteractive` / `lazyOnload` control third-party scripts. Prefer least blocking strategy that still works.

---

### Static files from `public/`

`public/logo.png` → `/logo.png`. No import hashing—good for stable URLs; don’t put secrets there.

---

### Favicons & `icon.tsx` / `apple-icon`

App Router can export file-based metadata icons or generate via code. Simpler: drop `icon.png` in `app/`.

---

**📌 Styling & UI Composition**

### Global CSS vs CSS Modules in App Router

Import global CSS only from root layout. CSS Modules (`*.module.css`) scope locally—safe in server and client components.

---

### Tailwind CSS with Next.js

Default `create-next-app` option. Utility-first; works with RSC (class names are strings). Keep design tokens consistent via theme config.

---

### CSS-in-JS caveats with RSC

Runtime CSS-in-JS (styled-components/emotion) needs client and careful setup; often avoided in RSC-first apps. Prefer Tailwind, CSS Modules, or zero-runtime solutions.

---

### Composing layouts for marketing vs app shells

Route groups: `(marketing)` with simple header; `(app)` with sidebar auth chrome. Separate concerns without two deployments.

---

### Client islands architecture

Server page + small client widgets (`<CartButton />`, `<DatePicker />`). Default mental model for performant Next apps.

---

### Third-party widgets (maps, chat) as client-only

Dynamic import with `ssr: false` when library touches `window`:

```ts
const Map = dynamic(() => import("./Map"), { ssr: false });
```

---

**📌 Auth, Sessions & Security**

### Cookie-based sessions vs JWTs in Next apps

HttpOnly secure cookies for session IDs (server session store or encrypted JWT cookie) fit RSC/Actions well—browser sends cookies automatically. Pure localStorage JWTs are awkward with SSR and XSS-prone.

---

### Auth.js / NextAuth patterns (overview)

Auth.js (NextAuth) handles OAuth/credentials, session callbacks, CSRF. Use session in Server Components via `auth()` helpers; gate Actions with the same.

---

### Protecting Server Components & Actions

```ts
const session = await auth();
if (!session) redirect("/login");
```

Repeat checks in **every** Action—UI gating is not security.

---

### CSRF considerations with Server Actions

Next adds protections for Actions (framework-level). Still: same-site cookies, auth checks, and avoid dangerous GET mutations. For custom raw POST handlers, implement CSRF explicitly.

---

### Storing secrets (env, not `NEXT_PUBLIC_`)

DB URLs, client secrets, webhook secrets → server env. Rotate via host (Vercel/AWS SM). Never commit `.env.local`.

---

### XSS / injection awareness in RSC HTML

React escapes text content by default. Avoid `dangerouslySetInnerHTML` with untrusted HTML; sanitize Markdown. SQL: parameterized queries only.

---

### Rate limiting route handlers & actions

Apply per-IP / per-user limits on login, Actions, and public APIs (Redis/Upstash). Agents and scrapers will find your `/api`.

---

### Multi-tenant routing & data isolation (overview)

Subdomain or path tenant (`/t/[tenant]/...`). Always scope DB queries by tenant id from trusted session—not from client-provided tenant alone.

---

**📌 Performance**

### Core Web Vitals in a Next app

LCP (hero image/font), INP (client JS), CLS (images/fonts). Next’s Image/Font and streaming help; client islands keep INP healthy.

---

### Bundle analysis & client JS budget

Use `@next/bundle-analyzer`. Track client KB for key routes. Treat regressions like perf bugs.

---

### Dynamic `import()` for heavy client components

Code-split charts/editors so they aren’t in the initial island.

---

### Streaming to improve TTFB / LCP

Shell first via layouts + Suspense; stream product data. Don’t block the entire page on slow secondary queries.

---

### Caching at CDN, Data Cache, and browser

Layers: CDN/Full Route Cache → Next Data Cache (`fetch`) → browser HTTP cache. Mutations must invalidate the right layer (`revalidateTag` vs CDN purge).

---

### Avoiding shipping server-only code to the client

If a client component imports a file that imports `fs`/ORM, build fails or leaks. Split modules; use `import 'server-only'`.

---

### `server-only` / `client-only` packages

```ts
import "server-only";
// db.ts — build error if imported from client
```

Documents intent and fails CI early.

---

### Prefetching behavior of `Link`

`Link` prefetches static routes in viewport (configurable). Don’t prefetch sensitive/expensive dynamic routes unnecessarily (`prefetch={false}`).

---

**📌 Testing & DX**

### Unit testing Server Components strategies

Render via React testing utilities with async support, or test pure data functions extracted from components. Heavy RSC trees often covered by integration/e2e.

---

### Testing Server Actions & route handlers

Call actions/handlers as async functions in Node tests with mocked DB/auth. Assert revalidate mocks and redirect throws.

---

### Playwright / Cypress for App Router flows

E2E soft navigation, auth cookies, form Actions, streaming UI. Most valuable net for Next apps.

---

### MSW for API mocking

Mock upstream BFFs in browser/Node tests so UI tests don’t hit real Spring/APIs.

---

### ESLint `eslint-config-next`

Includes React hooks rules + Next-specific checks (e.g. Image, link). Keep it on in CI.

---

### Turbopack vs Webpack in dev (overview)

Turbopack: faster HMR for many apps (`next dev --turbo`). Webpack still powers some prod paths depending on version. Know: dev bundler ≠ production behavior for all edge cases.

---

**📌 Deployment & Production**

### `next build` output mental model

Build produces `.next/` with server bundles, static assets, and prerendered HTML where applicable. Understand which routes are static vs dynamic from the build summary.

---

### Vercel deployment defaults

Git push → build → global CDN, preview URLs, env per stage, Image optimization hosted. Least ops friction; know lock-in tradeoffs for interviews.

---

### Self-hosting with Node (`next start`)

Run behind reverse proxy (Nginx) / ALB. Scale Node processes; sticky not required for typical apps. Configure `HOSTNAME`/`PORT`.

---

### Dockerizing a Next.js app

Multi-stage: deps → build → runner with `node server.js` or `next start`. Non-root user; only copy needed `.next` + `node_modules` prod.

---

### Standalone output (`output: 'standalone'`)

```js
// next.config.js
output: "standalone";
```

Emits minimal server folder for Docker—copies traced dependencies. Preferred for lean images.

---

### Preview deployments & env per stage

Preview DBs or shared staging; never point previews at prod secrets/write APIs without guards. Feature-flag risky Actions.

---

### ISR / on-demand revalidation in production

Time-based revalidate + on-demand via secured route calling `revalidateTag`. Protect revalidate endpoints with secrets.

---

### Observability (logging, OpenTelemetry overview)

Structured logs with request/route IDs; trace server fetches and Actions. Vercel analytics / OpenTelemetry exporters for self-host.

---

### Common production incidents (cache stampede, wrong env)

- Stampede: many rebuilds after expiry → stagger / soft TTL  
- Client seeing `undefined` API URL → missing `NEXT_PUBLIC_` in that env  
- Stale post-mutation UI → forgot `revalidateTag`  
- Edge middleware 500 → used Node-only API  

---

**📌 Pages Router Literacy (Interview)**

### `pages/` routing basics

`pages/index.tsx` → `/`; `pages/posts/[id].tsx` → dynamic. `_app` wraps all pages.

---

### `getServerSideProps` vs `getStaticProps` vs `getInitialProps`

| API | When runs |
|---|---|
| `getStaticProps` | Build (+ ISR revalidate) |
| `getServerSideProps` | Every request |
| `getInitialProps` | Legacy; disables some optimizations |

Prefer App Router equivalents in new code; explain these in migrations.

---

### `getStaticPaths` & fallback modes

With dynamic SSG: `fallback: false | true | 'blocking'` controls unknown paths (404 vs generate on demand).

---

### API routes in `pages/api`

`pages/api/hello.ts` exports default handler `(req, res)`. Older BFF style; App Router uses `route.ts`.

---

### `_app` / `_document` roles

`_app`: providers, global CSS. `_document`: customize `html/body` (Pages only). App Router replaces with root `layout.tsx`.

---

### Migrating Pages → App Router incrementally

Coexistence allowed: move route by route to `app/`. Watch for duplicated layouts and conflicting paths. Migrate data fetching to RSC; replace `getServerSideProps` with dynamic RSC + cookies.

---

**📌 Interview Scenarios & Tradeoffs**

### Design: marketing site + authenticated dashboard in one Next app

Route groups `(marketing)` SSG + `(app)` dynamic RSC with auth layout. Shared design system; separate caching policies. Middleware only for coarse auth redirects.

---

### Design: BFF for a Spring Boot personalisation API

Next Server Components/Actions call Spring with server-side credentials or user token exchange. Shape DTOs for admin UI; don’t expose internal APIs to the browser. Cache public catalog tags; `no-store` for per-user offers.

---

### Design: LetsBridge-style product (Next + mobile WebView/Capacitor)

Next App Router for web; Capacitor wraps WebView for mobile. Prefer cookie/session auth carefully in WebViews; API route handlers for mobile clients if cookie SSO is painful. Keep business logic in Spring/API for reuse.

---

### Debug: client bundle contains a DB SDK

Find the import path from a `"use client"` file to `db.ts`. Split shared types into `types.ts`; mark db with `server-only`; move fetch to Action/RSC.

---

### Debug: page always dynamic / never caches

Hunt `cookies()`, `headers()`, `searchParams`, `no-store`, or unauthorized dynamic APIs in the tree. Fix or explicitly accept dynamic for that route.

---

### Debug: Server Action succeeds but UI shows stale data

Missing `revalidatePath`/`Tag`, or client router cache needs `router.refresh()`. Confirm which cache layer holds the old RSC payload.

---

### Tradeoff: App Router RSC vs SPA + separate API

RSC: less client JS, faster first paint, colocated data. SPA+API: clearer mobile reuse, independent deploys, simpler mental model for some teams. Hybrid BFF is common.

---

### Tradeoff: Server Actions vs tRPC / REST handlers

Actions: best DX for first-party forms. tRPC/REST: typed multi-client contracts, non-Next consumers. Many codebases use Actions for UI + REST for mobile.

---

### Senior traps across caching, boundaries & security

- Treating Actions as private without authz  
- `NEXT_PUBLIC_` secrets  
- Giant client bundles from careless `"use client"`  
- Undefined cache behavior across Next versions  
- Middleware doing heavy DB authz  
- Forgetting revalidation after writes  
- Using Next as the only domain monolith when Spring already owns core  

Strong close: **boundaries + cache intent + authz in every mutation.**
