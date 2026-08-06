## React Topics

A deep-dive companion to the React Topics checklist. Each heading matches the original outline; under every topic you'll find **what it is**, **why it exists**, **how it works**, and **interview-ready nuance**.

---

**✅ Core Concepts**

### JSX

JSX (JavaScript XML) is a syntax extension that lets you write HTML-like markup inside JavaScript. React does not require JSX, but almost every codebase uses it because it makes the UI tree readable and colocated with logic.

Under the hood, a tool like Babel or the TypeScript compiler transforms JSX into `React.createElement` calls (or, with the modern JSX transform, into `_jsx` / `_jsxs` from `react/jsx-runtime`). For example:

```jsx
const el = <h1 className="title">Hello</h1>;
// roughly becomes
const el = React.createElement("h1", { className: "title" }, "Hello");
```

**Key mental models:**

- JSX expressions must resolve to a single parent (or a Fragment). Adjacent siblings without a wrapper are invalid.
- Curly braces `{}` embed any JavaScript expression (not statements). Ternaries and `&&` short-circuiting are the common control-flow patterns.
- Attributes use camelCase (`className`, `htmlFor`, `onClick`) because they map to DOM properties / React event props, not raw HTML attribute names.
- `false`, `null`, `undefined`, and `true` render nothing when placed as children; `0` *does* render — a common gotcha with `{count && <Badge />}` when `count` is `0`.
- JSX creates *descriptions* of UI (React elements), not DOM nodes. Rendering and updating the real DOM is React's job via reconciliation.

**Why interviews care:** Understanding that JSX is syntactic sugar for element objects clarifies Virtual DOM, keys, and why you can't mutate returned JSX after the fact.

---

### Components (Functional vs Class)

A component is a reusable unit that returns UI (React elements). React historically supported two styles:

**Class components** extend `React.Component` (or `PureComponent`), hold state in `this.state`, receive props as `this.props`, and use lifecycle methods (`componentDidMount`, `componentDidUpdate`, `componentWillUnmount`, etc.).

**Functional components** are plain functions that receive `props` and return JSX. With Hooks (React 16.8+), they can also hold state, run effects, and use the full feature set — so they are the default in modern React.

```jsx
// Functional
function Greeting({ name }) {
  return <p>Hello, {name}</p>;
}

// Class
class Greeting extends React.Component {
  render() {
    return <p>Hello, {this.props.name}</p>;
  }
}
```

**Comparison that matters in interviews:**

| Concern | Functional + Hooks | Class |
|---|---|---|
| State | `useState` / `useReducer` | `this.state` + `setState` |
| Side effects | `useEffect` | lifecycle methods |
| `this` binding | none | easy to get wrong |
| Sharing logic | custom hooks | HOCs / render props |
| Bundle / mental model | simpler, composable | more boilerplate |

Class components still appear in legacy codebases and are required for **Error Boundaries** (there is no Hook equivalent yet for catching render errors). Prefer functional components for new code.

**Rules of components:**

- Components must be pure with respect to props/state for a given render: same inputs → same output (effects are separate).
- Don't mutate props. Treat them as read-only.
- Naming: capitalize component names so React treats them as components, not DOM tags.

---

### Props & PropTypes

**Props** (properties) are the inputs passed from parent to child. They flow one way: parent → child. Updating props triggers a re-render of the child (unless memoization skips it).

```jsx
<UserCard name="Ada" age={36} onSelect={handleSelect} />
```

Destructuring is idiomatic: `function UserCard({ name, age, onSelect }) { ... }`.

**PropTypes** (from the `prop-types` package) is a runtime type-checking system for JavaScript React apps. It validates props in development and warns in the console:

```jsx
import PropTypes from "prop-types";

UserCard.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number,
  onSelect: PropTypes.func,
};

UserCard.defaultProps = {
  age: 0,
};
```

**Context for interviews:**

- PropTypes do **not** run in production builds (warnings are stripped / no-ops depending on setup).
- In TypeScript projects, PropTypes are largely redundant — static types replace them. Some teams still keep both for runtime safety at module boundaries.
- `children` is just another prop. You can type it and pass it explicitly or nest JSX between tags.
- Spreading props (`{...rest}`) is powerful but can accidentally forward invalid DOM attributes; filter or use rest carefully.
- Default values today are often written with JS defaults: `function UserCard({ age = 0 })` rather than `defaultProps` (and `defaultProps` on function components is discouraged in newer React docs in favor of default parameters).

---

### State Management (useState, useReducer)

**State** is data that belongs to a component and can change over time. When state updates, React schedules a re-render.

#### useState

```jsx
const [count, setCount] = useState(0);
const [user, setUser] = useState(null);

setCount(count + 1);           // may be stale in async closures
setCount((c) => c + 1);        // functional updater — preferred when next depends on prev
setUser({ ...user, name });    // replace object; don't mutate
```

**Important details:**

- `useState` returns `[value, setter]`. The setter is stable across renders.
- Initial state is used only on the first mount. Expensive init should use a lazy initializer: `useState(() => compute())`.
- React may batch multiple setters in the same event (and, since React 18, in more contexts — see Automatic Batching).
- Setting state to the same value (Object.is equality) bails out of re-rendering.

#### useReducer

`useReducer` is better when state transitions are complex, interdependent, or when the next state depends on a clear action vocabulary:

```jsx
function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + 1 };
    case "setName":
      return { ...state, name: action.payload };
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0, name: "" });
dispatch({ type: "increment" });
```

**When to choose which:**

- `useState` — independent, simple values; local UI toggles; form fields that don't interact much.
- `useReducer` — multi-field forms with related updates; undo/redo; state machines-ish flows; when you want testable pure transitions.

Both are "local" state. For shared app-wide state, lift state up, use Context, or a library (Redux, Zustand, etc.).

---

### Lifecycle Methods (Class + Hooks)

Class components expose an explicit lifecycle. Hooks map the same *moments* differently — usually into `useEffect` (and related hooks).

**Class lifecycle (common ones):**

| Method | When |
|---|---|
| `constructor` | Init state, bind methods |
| `static getDerivedStateFromProps` | Sync state from props (rare; often an anti-pattern) |
| `render` | Pure UI description |
| `componentDidMount` | After first paint — fetch, subscriptions, DOM measure |
| `componentDidUpdate` | After updates — respond to prop/state changes |
| `componentWillUnmount` | Cleanup — remove listeners, cancel timers |
| `shouldComponentUpdate` | Perf: skip render |
| `getSnapshotBeforeUpdate` | Read DOM before mutation (rare) |
| `componentDidCatch` / `getDerivedStateFromError` | Error boundaries |

**Hooks equivalents:**

| Class | Hooks |
|---|---|
| `componentDidMount` | `useEffect(() => { ... }, [])` |
| `componentDidUpdate` | `useEffect(() => { ... }, [deps])` |
| `componentWillUnmount` | return cleanup from `useEffect` |
| `shouldComponentUpdate` / `PureComponent` | `React.memo`, `useMemo`, careful deps |
| constructor state | `useState` / `useReducer` |

**Critical difference:** One class component can have many lifecycle methods; one functional component may have many `useEffect`s, each focused on one concern. That co-location is intentional.

**Strict Mode note:** In React 18 Strict Mode (dev), effects mount → cleanup → mount again to surface missing cleanups. Don't treat double-invocation as a production bug.

---

### useEffect

`useEffect` runs **side effects** after render: network requests, subscriptions, manual DOM work, syncing with external systems.

```jsx
useEffect(() => {
  const id = setInterval(() => console.log("tick"), 1000);
  return () => clearInterval(id); // cleanup
}, []); // dependency array
```

**Dependency array rules:**

- **No array** — run after every render (almost always wrong for subscriptions).
- **`[]`** — run once after mount (and cleanup on unmount). Still re-runs in Strict Mode double-mount in dev.
- **`[a, b]`** — run when `a` or `b` change (Object.is comparison).

**Mental model:** Effects synchronize React with the outside world. If something can be computed during render from props/state, don't put it in an effect — derive it.

**Common pitfalls:**

1. Missing dependencies → stale closures (effect sees old props/state).
2. Putting objects/functions inline in deps without memoization → effect runs every render.
3. Fetch races: always cancel or ignore stale responses:

```jsx
useEffect(() => {
  let cancelled = false;
  fetch(`/api/users/${id}`)
    .then((r) => r.json())
    .then((data) => {
      if (!cancelled) setUser(data);
    });
  return () => {
    cancelled = true;
  };
}, [id]);
```

4. Setting state in an effect that depends on that state without a guard → infinite loops.

**Related hooks:** `useLayoutEffect` fires before the browser paints (for DOM measurement/sync layout). Prefer `useEffect` unless you see visual flicker. `useInsertionEffect` is for CSS-in-JS libraries injecting styles.

---

### useCallback

`useCallback` memoizes a **function** identity between renders:

```jsx
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

Without it, `const handleClick = () => ...` creates a new function every render. That matters when:

- The function is passed to a child wrapped in `React.memo` (new function ⇒ child re-renders).
- The function is a dependency of `useEffect` / another hook.
- You're registering listeners and need a stable reference (sometimes paired with refs for latest values).

**It is not a free performance win.** Memoizing every function adds complexity and memory. Use it when you measured a problem or when a memoized child / effect dep requires stability.

`useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.

---

### useMemo

`useMemo` memoizes a **computed value**:

```jsx
const sorted = useMemo(() => expensiveSort(items), [items]);
```

Use when:

- The computation is genuinely expensive.
- You need referential equality for a derived object/array passed to memoized children or used as a dependency.

```jsx
// Without useMemo, options is a new array every render
const options = useMemo(
  () => items.map((i) => ({ label: i.name, value: i.id })),
  [items]
);
```

**Don't** wrap every expression. Premature `useMemo` can make code harder to read and may cost more than the recalculation. React Compiler (newer React tooling) aims to auto-memoize where safe — still know the manual hooks for interviews and older codebases.

---

### React.memo

`React.memo` is a higher-order component that memoizes a **component**: it skips re-render if props are shallowly equal to the previous props.

```jsx
const ListItem = React.memo(function ListItem({ item, onSelect }) {
  return <li onClick={() => onSelect(item.id)}>{item.name}</li>;
});
```

**Shallow compare:** primitives by value; objects/arrays/functions by reference. If the parent passes `onSelect={() => ...}` or `style={{ color }}` inline, memoization fails.

Optional second argument: custom comparator `(prevProps, nextProps) => boolean` (return `true` if props are equal and render should be skipped — opposite of `shouldComponentUpdate`).

**Pair with:** `useCallback` / `useMemo` on the parent so props stay stable when appropriate.

`React.memo` ≈ functional equivalent of `PureComponent` for props (not context — context changes still re-render consumers).

---

### Refs (useRef, forwardRef)

Refs hold a mutable value that **survives across renders** without causing a re-render when updated.

#### useRef

```jsx
const inputRef = useRef(null);
const renderCount = useRef(0);
renderCount.current += 1; // no re-render

return <input ref={inputRef} />;
// later: inputRef.current.focus();
```

Common uses:

1. Accessing DOM nodes (`focus`, `scrollIntoView`, measure).
2. Storing previous values, timer IDs, WebSocket instances.
3. Keeping the "latest" callback in a ref to avoid re-subscribing effects.

#### forwardRef

By default, `ref` is not a normal prop — it's reserved. To let a parent get a ref to a child's DOM node (or imperative handle), wrap the child:

```jsx
const FancyInput = forwardRef(function FancyInput(props, ref) {
  return <input ref={ref} {...props} />;
});
```

In React 19+, `ref` can be passed as a regular prop to function components in many cases — know both eras for interviews.

Combine with `useImperativeHandle` to expose a limited imperative API instead of the raw DOM node.

**vs state:** Updating `ref.current` does not trigger render. Use state for anything that should appear on screen; use refs for escape hatches and instance variables.

---

### Keys in Lists

When rendering lists, each sibling needs a stable **key** so React can match elements across updates:

```jsx
{items.map((item) => (
  <Row key={item.id} item={item} />
))}
```

**Why keys matter:** Reconciliation compares trees. Keys tell React which item is which when the list reorders, inserts, or deletes. Wrong keys cause:

- Incorrect state reuse (input values "jump" between rows).
- Extra unmount/remount (lost focus, remount animations, refetch in children).
- Subtle bugs that look like "React is broken."

**Rules:**

- Keys must be unique among siblings (not globally).
- Prefer stable IDs from data. Avoid array index as key if the list can reorder, filter, or insert in the middle.
- Index keys are acceptable for static lists that never change order/length.
- Don't use random keys (`Math.random()`) — that remounts everything every render.
- Keys are not passed as props; if the child needs the id, pass `id={item.id}` separately.

---

### Error Boundaries

Error Boundaries are React components that catch **JavaScript errors in the render phase** of their child tree, log them, and show a fallback UI instead of crashing the whole app.

They catch errors in:

- Rendering
- Lifecycle methods
- Constructors of the tree below them

They do **not** catch:

- Event handlers (use try/catch)
- Asynchronous code (promises, `setTimeout`) — unless you rethrow into React somehow
- Server-side rendering errors (framework-dependent)
- Errors inside the boundary component itself

Implementation requires class methods:

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logToService(error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return <Fallback />;
    return this.props.children;
  }
}
```

Place boundaries strategically (around routes, widgets, third-party embeds) so one failure doesn't blank the entire page. Libraries like `react-error-boundary` wrap this pattern for function-component-friendly APIs.

---

### React Strict Mode

`<React.StrictMode>` is a **development-only** helper that:

- Identifies unsafe lifecycles and deprecated APIs.
- Warns about legacy string refs and findDOMNode.
- Detects unexpected side effects by **double-invoking** certain functions in development (React 18+):
  - Component function bodies
  - State updater functions
  - `useState`/`useMemo`/`useReducer` initializers
  - Effect setup + cleanup (mount → cleanup → mount)

It does **not** affect production builds — no extra double-rendering in prod.

**Interview takeaway:** If your effect runs twice in dev, fix the missing cleanup / make the effect idempotent; don't disable Strict Mode to hide the symptom.

---

### Portals

Portals render children into a DOM node **outside** the parent component's DOM hierarchy, while preserving React context and event bubbling in the **React tree**:

```jsx
import { createPortal } from "react-dom";

createPortal(
  <ModalContent />,
  document.getElementById("modal-root")
);
```

Classic use cases: modals, tooltips, toasts, dropdowns that must escape `overflow: hidden` or stacking-context issues.

**Event bubbling:** A click inside a portal still bubbles to React parents above the portal component, even if the DOM parent is `document.body`. That surprises people coming from raw DOM mental models.

---

### Fragments

Fragments let you group children without adding an extra DOM node:

```jsx
<>
  <dt>Term</dt>
  <dd>Definition</dd>
</>

// or with key (needed in maps):
<React.Fragment key={id}>
  ...
</React.Fragment>
```

The short syntax `<>...</>` cannot accept keys or attributes; use `React.Fragment` when you need a key.

Useful for tables (`<> <td/> <td/> </>`), list items that return multiple nodes, and avoiding useless wrapper `<div>`s that break CSS flex/grid or semantics.

---

### Controlled vs Uncontrolled Components

Applies mainly to form inputs.

**Controlled:** React state is the source of truth. The input's `value` is set from state; `onChange` updates state.

```jsx
const [name, setName] = useState("");
<input value={name} onChange={(e) => setName(e.target.value)} />
```

Pros: full control, easy validation, instant derived UI. Cons: every keystroke re-renders; more code.

**Uncontrolled:** The DOM holds the value. You read it via a ref when needed (e.g. on submit).

```jsx
const ref = useRef();
<input defaultValue="Ada" ref={ref} />
// submit: ref.current.value
```

Pros: less re-rendering, simple for one-shot reads, closer to classic HTML. Cons: harder to enforce validation on every change, sync with other UI.

**Hybrid:** Controlled for most fields; uncontrolled for file inputs (`type="file"` is always uncontrolled in practice) or performance-sensitive large forms (often with libraries).

`defaultValue` / `defaultChecked` initialize uncontrolled inputs. Don't switch a single input between controlled and uncontrolled (passing `value={undefined}` then a string) — React warns.

---

### React.Children API

`React.Children` provides utilities to inspect and transform the opaque `children` prop:

- `React.Children.map(children, fn)` — map over children, preserving keys.
- `React.Children.forEach` — iterate without returning.
- `React.Children.count` — count children.
- `React.Children.toArray` — flatten and assign keys (useful before sorting/slicing).
- `React.Children.only` — assert exactly one child.

```jsx
function RowList({ children }) {
  return (
    <ul>
      {React.Children.map(children, (child) =>
        child ? <li className="row">{child}</li> : null
      )}
    </ul>
  );
}
```

**Why it exists:** `children` may be a single element, an array, a string, or nested fragments. Manual array methods break on non-arrays. Prefer composition patterns that don't require introspecting children when possible; when building flexible APIs (tabs, menus), `Children` + `cloneElement` (or explicit context) is common — though `cloneElement` is somewhat discouraged in favor of clearer composition.

---

**✅ Advanced React**

### Custom Hooks

A custom hook is a function whose name starts with `use` and that may call other hooks. It lets you extract and reuse stateful logic without changing the component tree (unlike HOCs/render props).

```jsx
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}
```

**Rules of Hooks still apply** inside custom hooks: only call hooks at the top level, only from React functions.

**Design tips:**

- Return values clearly — tuple `[value, setValue]` like `useState`, or an object `{ data, error, isLoading }` for readability when there are many fields.
- Keep hooks focused (one concern). Compose smaller hooks.
- Document dependency behavior and cleanup.
- Custom hooks share *logic*, not *state* — each call gets its own state unless you deliberately share via context or an external store.

Examples interviewers love: `useLocalStorage`, `useFetch` / `useQuery` wrappers, `useDebounce`, `usePrevious`, `useMediaQuery`, `useAuth`.

---

### Higher Order Components (HOCs)

An HOC is a function that takes a component and returns a new enhanced component:

```jsx
function withAuth(Wrapped) {
  return function WithAuth(props) {
    const { user } = useAuth();
    if (!user) return <LoginRedirect />;
    return <Wrapped {...props} user={user} />;
  };
}

export default withAuth(Dashboard);
```

HOCs were the primary reuse pattern before Hooks. They still appear in legacy code and some libraries.

**Caveats:**

- Wrap display names for DevTools: `WithAuth.displayName = \`withAuth(${Wrapped.displayName})\``.
- Don't mutate the wrapped component — compose by wrapping.
- Prop collisions: the HOC injects props that might clash; document injected props.
- Refs don't pass through automatically — use `forwardRef`.
- Multiple HOCs → wrapper hell and unclear data flow.

Prefer custom hooks for new shared logic. Use HOCs when you must inject into a component you don't control or match a library's API.

---

### useContext

Context provides a way to pass data through the tree without prop drilling.

```jsx
const ThemeContext = createContext("light");

function App() {
  const [theme, setTheme] = useState("light");
  return (
    <ThemeContext.Provider value={theme}>
      <Page />
    </ThemeContext.Provider>
  );
}

function Button() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Hi</button>;
}
```

**Performance:** When `value` changes (new reference or new primitive), **all** consumers re-render. Mitigations:

- Split contexts (state vs dispatch).
- Memoize value objects: `useMemo(() => ({ theme, setTheme }), [theme])`.
- Use external stores (Zustand, etc.) for high-frequency updates.
- React 19 `use(Context)` and compiler improvements — know that context isn't free.

**Good for:** theme, locale, auth user, "current tree configuration."  
**Bad for:** high-frequency data (mouse position every frame) without careful design.

Default value in `createContext(default)` is used only when no Provider is above — useful for optional context, dangerous if you forget the Provider and silently get defaults.

---

### Render Props

A render prop is a prop whose value is a function that returns React elements — the component calls it to share state/logic:

```jsx
function Mouse({ render }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  // ... listen to mousemove
  return render(pos);
}

<Mouse render={({ x, y }) => <Cursor x={x} y={y} />} />

// Often written as children-as-function:
<Mouse>{({ x, y }) => <Cursor x={x} y={y} />}</Mouse>
```

This was a dominant pattern pre-Hooks (alongside HOCs). Today, a custom hook `useMouse()` is usually clearer. Still worth knowing for library APIs (`react-router`'s older APIs, Formik, Downshift, etc.).

**Tradeoff:** Very flexible composition; can create nesting ("render prop hell") and may interfere with `PureComponent`/`memo` because the render function is often inline (new every time).

---

### Compound Components Pattern

Compound components cooperate to form a complete UI, sharing implicit state via context, while giving the consumer flexible JSX composition:

```jsx
<Tabs>
  <Tabs.List>
    <Tabs.Tab id="a">A</Tabs.Tab>
    <Tabs.Tab id="b">B</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="a">Panel A</Tabs.Panel>
  <Tabs.Panel id="b">Panel B</Tabs.Panel>
</Tabs>
```

Internally, `Tabs` holds selected id in state/context; `Tab` and `Panel` consume it. The parent doesn't need to wire every prop manually.

**Benefits:** expressive API, clear ownership of shared state, flexible ordering/structure.  
**Examples:** `<select>`/`<option>`, Accordion, Menu, Tabs, React Router's older nested route components.

Related: **slot patterns** and **headless components** (Radix, Headless UI, Downshift) — behavior without forced styling.

---

### React Performance Optimization

Performance work should start from measurement (React DevTools Profiler, browser Performance panel), not guesswork.

**Main levers:**

1. **Reduce wasted renders** — `React.memo`, stable callbacks/values, split context, move state down.
2. **Reduce work per render** — `useMemo` for heavy derived data; virtualize long lists (`react-window`, `@tanstack/virtual`).
3. **Reduce JS load** — code splitting (`React.lazy`), route-based chunks.
4. **Concurrent features** — `useTransition` / `useDeferredValue` to keep input responsive while rendering heavy UI.
5. **Avoid layout thrash** — prefer CSS; measure with `useLayoutEffect` only when needed.
6. **Immutable update patterns** — help bailouts and make changes detectable.

**Anti-patterns:** memoizing everything; giant Context for all app state; anonymous components defined inside render (`function Inner()` inside `Parent` remounts every time); using index keys on dynamic lists; fetching in render.

---

### Lazy Loading & Code Splitting (React.lazy, Suspense)

Code splitting loads parts of the JS bundle on demand.

```jsx
const HeavyChart = React.lazy(() => import("./HeavyChart"));

function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart />
    </Suspense>
  );
}
```

`React.lazy` takes a function that returns a dynamic `import()` resolving to a module with a `default` export component.

`Suspense` shows `fallback` while the lazy component's chunk loads. In modern React / frameworks, Suspense also coordinates data loading (depending on router and library support).

**Patterns:**

- Route-level splitting (biggest wins).
- Modal / admin / rarely used feature splitting.
- Named exports: wrap as `lazy(() => import("./m").then(m => ({ default: m.Chart })))`.

**Error handling:** pair with an Error Boundary around Suspense for failed chunk loads (network errors).

SSR note: classic `React.lazy` needs framework support on the server (Next.js has its own patterns; React 18+ streaming SSR has specific Suspense integration).

---

### Concurrent Mode / React 18 features

"Concurrent Mode" evolved into **concurrent rendering** features shipped in React 18. React can prepare multiple versions of the UI, interrupt rendering, and prioritize urgent updates.

**Headline React 18 APIs/behaviors:**

- `createRoot` (replaces `ReactDOM.render`)
- Automatic batching everywhere
- `useTransition`, `useDeferredValue`, `startTransition`
- Suspense for data (with compatible libraries / frameworks)
- Streaming SSR with `pipeToNodeWritable` / selective hydration
- Strict Mode double-effect behavior in development

**Mental model:** Not all state updates are equal. Typing in an input is urgent; filtering a huge list can be a transition. Concurrent React may pause expensive render work to keep the urgent update responsive.

There is no separate "turn on Concurrent Mode" flag in modern React — using `createRoot` enables concurrent features.

---

### useTransition, useDeferredValue

#### useTransition

Marks state updates as non-urgent:

```jsx
const [isPending, startTransition] = useTransition();
const [query, setQuery] = useState("");
const [list, setList] = useState(allItems);

function onChange(e) {
  const value = e.target.value;
  setQuery(value); // urgent — keep input snappy
  startTransition(() => {
    setList(filterHuge(value)); // non-urgent
  });
}
```

`isPending` lets you show a pending UI state (dim list, spinner) without blocking typing.

#### useDeferredValue

Defers updating a *value* derived from urgent state:

```jsx
const deferredQuery = useDeferredValue(query);
const results = useMemo(() => search(deferredQuery), [deferredQuery]);
```

React keeps showing the previous deferred value while rendering the new one in the background when the urgent path is busy.

**Difference:** `startTransition` wraps the *setState* that causes slow render. `useDeferredValue` wraps a *value* you already have (often from props or parent state you don't control).

---

### useImperativeHandle

Customizes the instance value exposed to parent refs when using `forwardRef`:

```jsx
const MediaPlayer = forwardRef(function MediaPlayer(props, ref) {
  const videoRef = useRef(null);

  useImperativeHandle(ref, () => ({
    play: () => videoRef.current.play(),
    pause: () => videoRef.current.pause(),
  }), []);

  return <video ref={videoRef} {...props} />;
});

// Parent:
playerRef.current.play();
```

**Philosophy:** Prefer declarative props (`playing={true}`). Use imperative handles for focus management, scroll, animation triggers, third-party widget bridges — cases where a command API is clearer.

---

### Server Components (React 18+)

React Server Components (RSC) run on the server (or at build time) and send a serialized UI payload to the client. They can:

- Access server data sources directly (DB, filesystem) without an extra API round-trip.
- Keep heavy dependencies on the server (smaller client bundles).
- Not use state, effects, or browser APIs.

**Client Components** are the traditional interactive components (`"use client"` in Next.js App Router). They hydrate and run in the browser.

**Composition rules (conceptual):**

- Server Components can import and render Client Components.
- Client Components cannot import Server Components directly (they can receive them as `children` passed from a server parent).
- Props passed from Server → Client must be serializable.

This is primarily experienced through frameworks like **Next.js App Router**. Interview angle: RSC shifts data fetching toward the server tree, reduces client JS, and changes mental models around `"use client"` boundaries and caching.

---

### Batching and automatic re-rendering behavior

**Batching** means React groups multiple state updates into one re-render for performance.

Before React 18, batching happened mainly inside React event handlers. Updates inside promises, `setTimeout`, or native events could re-render per update.

**React 18 automatic batching** batches updates in timeouts, promises, native handlers, etc.:

```jsx
function handle() {
  setCount((c) => c + 1);
  setFlag(true);
  // single re-render
}

setTimeout(() => {
  setCount((c) => c + 1);
  setFlag(true);
  // also single re-render in React 18
}, 0);
```

Escape hatch: `flushSync(() => setX())` forces synchronous DOM update (rare — needed for measuring layout immediately).

**Re-render triggers:** state/props/context change; parent re-render (by default children re-render even if props are the same — unless memoized); force patterns (generally avoid).

---

### Event Delegation in React

React historically attached listeners at the root (document / root container) and dispatched synthetic events through its system — **event delegation**. You write `onClick` on a `<button>`, but React listens higher up and routes the event to your handler.

**SyntheticEvent:** React wraps native events for cross-browser consistency. In older React, events were pooled (reused); you had to call `e.persist()` to use them async. Pooling was removed in React 17+.

**React 17+ change:** Delegating to the root container instead of `document` improved embedding multiple React roots and interoperability with other libraries.

**Bubbling vs capture:** `onClick` bubbles; `onClickCapture` runs in capture phase. `e.stopPropagation()` stops React tree propagation; understanding portals + bubbling is important.

You generally don't attach your own delegated listeners for React-managed DOM; use React's props so the synthetic system stays consistent.

---

### Reconciliation algorithm & Virtual DOM

**Virtual DOM:** React elements are lightweight plain objects describing UI. React compares the previous tree to the next tree and computes a minimal set of DOM mutations.

**Reconciliation (diffing) heuristics:**

1. Different element **types** (`div` → `span`, or `ComponentA` → `ComponentB`) ⇒ tear down old tree, mount new (state lost).
2. Same component type ⇒ update props, recurse into children (state preserved).
3. Among siblings, **keys** identify identity for insert/move/remove.
4. React assumes distinct component types produce unrelated trees (optimization heuristic, not a perfect O(n) tree diff of arbitrary algorithms).

**Fiber (React 16+):** the reimplementation of the reconciler that splits work into units, enables interruption, prioritization, and concurrent features. Each Fiber node corresponds to a component/DOM node instance and tracks pending work, alternate trees, etc.

**Interview phrase:** "Virtual DOM isn't always faster than careful manual DOM updates; its value is predictable declarative UI + efficient batching of changes. Fiber makes that work interruptible."

---

**✅ State Management (Advanced)**

### Redux (Thunk, Saga, Toolkit)

Redux is a predictable state container: a single store, state updated only by dispatching **actions** through pure **reducers**.

**Classic flow:** UI → `dispatch(action)` → reducer(s) → new state → subscribers (React-Redux) re-render.

#### Redux Thunk

Middleware that lets action creators return **functions** instead of plain objects — used for async:

```js
function fetchUser(id) {
  return async (dispatch) => {
    dispatch({ type: "USER_LOADING" });
    const data = await api.getUser(id);
    dispatch({ type: "USER_SUCCESS", payload: data });
  };
}
```

#### Redux Saga

Middleware using **generator functions** for complex async workflows (debounce, race, retry, background sync). More powerful and heavier than Thunk; chosen for intricate side-effect orchestration.

#### Redux Toolkit (RTK) — modern default

RTK reduces boilerplate:

- `configureStore` — good defaults (thunk included, DevTools).
- `createSlice` — reducers + actions with Immer (writable "mutating" syntax that produces immutable updates).
- `createAsyncThunk` — standardized async lifecycle.
- RTK Query — built-in data fetching/caching layer.

```js
const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    incremented(state) {
      state.value += 1; // Immer
    },
  },
});
```

**React-Redux hooks:** `useSelector`, `useDispatch`. Selectors should be efficient; use memoized selectors (`reselect` / `createSelector`) for derived data.

**When Redux shines:** large apps, cross-cutting state, strong middleware needs, time-travel debugging, standardized patterns across a big team.

---

### Zustand / Jotai / Recoil

Modern lighter alternatives to Redux for many apps:

| Library | Model | Notes |
|---|---|---|
| **Zustand** | Single store hook API | Minimal boilerplate; `create((set) => ({ ... }))`; can use selectors to avoid extra renders |
| **Jotai** | Atomic | Bottom-up atoms; components subscribe to atoms they use; great for derived state |
| **Recoil** | Atomic (Meta) | Atoms + selectors; async selectors; less active than earlier years — know it historically |

**Zustand sketch:**

```js
const useStore = create((set) => ({
  bears: 0,
  increase: () => set((s) => ({ bears: s.bears + 1 })),
}));

function BearCounter() {
  const bears = useStore((s) => s.bears);
  return <span>{bears}</span>;
}
```

**Interview framing:** Context is fine for low-frequency shared state; Zustand/Jotai for app state without Redux ceremony; Redux/RTK when you need ecosystem, middleware, or enterprise conventions. TanStack Query for **server** state (cache) is often more important than putting fetched data in Redux.

---

### useReducer

Already covered under Core Concepts as a local Hook — here, the advanced angle:

- Scale local complexity before reaching for global stores.
- Pair with Context: `const [state, dispatch] = useReducer(...)` then provide `{ state, dispatch }` — classic "Redux-lite."
- Prefer putting `dispatch` in a separate context so components that only dispatch don't re-render on every state change.
- Reducers must be pure: no API calls inside; do side effects in effects or middleware-like wrappers after dispatch.

Use for wizards, multi-step forms, editors, and components with many interrelated transitions.

---

**✅ Routing**

### React Router DOM (v6+)

React Router v6 redesigned APIs around nested routes and relative links.

```jsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/users/:id" element={<User />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

**Concepts:**

- `BrowserRouter` uses History API; `HashRouter` uses `#` (useful for static hosts without rewrite rules).
- `Routes` picks the best matching `Route` (ranked matching, not exclusive first-match like v5 `Switch` in the same way).
- `element` prop replaces `component` / `render` from v5.
- Data APIs (v6.4+): loaders, actions, `createBrowserRouter`, `RouterProvider` — closer to Remix ideas.

---

### Nested Routes

Nested routes render child routes inside a parent layout via `<Outlet />`:

```jsx
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<Overview />} />
  <Route path="settings" element={<Settings />} />
  <Route path="reports" element={<Reports />} />
</Route>
```

`DashboardLayout` includes shared chrome (nav, sidebar) and `<Outlet />` where child routes appear. URLs compose: `/dashboard/settings`.

This is the backbone of app shells and persistent layouts without remounting the parent on every child navigation.

---

### Dynamic Routing

Dynamic segments capture URL params:

```jsx
<Route path="/posts/:postId" element={<Post />} />
// useParams() → { postId: "123" }
```

Also: optional segments, splats (`*`), and search params via `useSearchParams`.

Dynamic routes often drive data fetching: when `postId` changes, refetch. Coordinate with loaders (RR 6.4+) or query libraries keyed by param.

---

### Route Protection / Auth Guard

Restrict routes to authenticated (or authorized) users.

**Declarative wrapper pattern:**

```jsx
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

<Route
  path="/account"
  element={
    <RequireAuth>
      <Account />
    </RequireAuth>
  }
/>
```

After login, redirect back using `location.state.from`.

**Loader-based auth (data routers):** throw `redirect("/login")` from a loader if the session is invalid — centralizes checks.

Also cover role-based guards (`admin` only) and optimistic UI vs hard blocking.

---

### useLocation, useNavigate, useParams

| Hook | Purpose |
|---|---|
| `useParams` | Path params (`:id`) |
| `useLocation` | Current location object (`pathname`, `search`, `hash`, `state`) |
| `useNavigate` | Programmatic navigation (`navigate("/x")`, `navigate(-1)`) |
| `useSearchParams` | Read/write query string |
| `useMatch` / `useResolvedPath` | Matching helpers |

```jsx
const { id } = useParams();
const location = useLocation();
const navigate = useNavigate();

navigate("/home");
navigate("/login", { replace: true, state: { from: location } });
```

`Link` / `NavLink` for declarative navigation; `NavLink` adds active styling via `className={({ isActive }) => ...}`.

---

**✅ Forms**

### Controlled Forms

All field values live in React state (or a form library's store). One source of truth enables:

- Validation on change/blur/submit
- Disabling submit until valid
- Conditional fields
- Formatting (phone masks) as the user types

Patterns: one `useState` per field; or a single object state; or `useReducer` for large forms. For big forms, libraries reduce boilerplate and re-renders.

---

### Form Validation

Layers of validation:

1. **HTML constraint validation** — `required`, `type="email"`, `minLength` (accessible baseline, easy to bypass).
2. **Sync JS validation** — on change/blur/submit.
3. **Async validation** — username availability (debounce!).
4. **Schema validation** — Yup, Zod, Valibot: declare once, reuse on client/server.

UX details interviewers like: show errors after blur or submit (not while the user is still typing the first character); keep error text associated with inputs (`aria-describedby`); don't rely only on color.

---

### Libraries: Formik / React Hook Form / Yup

**Formik:** Classic form state library — values, errors, touched, helpers. More re-renders by default; mature; often paired with Yup.

**React Hook Form (RHF):** Minimizes re-renders by using uncontrolled inputs + refs under the hood (register API), with controlled `Controller` when needed. Excellent performance for large forms. Integrates with Yup/Zod resolvers.

**Yup:** Schema builder for object validation (`yup.object({ email: yup.string().email().required() })`).

**Zod:** Increasingly preferred in TS codebases — infer static types from schemas (`z.infer<typeof schema>`).

```jsx
// RHF sketch
const { register, handleSubmit, formState: { errors } } = useForm();
<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register("email", { required: true })} />
  {errors.email && <span>Required</span>}
</form>
```

---

### Field Arrays and Dynamic Forms

Dynamic lists of fields: add/remove phone numbers, line items, attendees.

React Hook Form: `useFieldArray` (`append`, `remove`, `fields` with stable `field.id` keys).  
Formik: `FieldArray`.

**Keys:** use the library's field id, not the array index, when rendering dynamic rows — same reconciliation rules as lists.

Validate at both row and form level (e.g., at least one item; each item complete).

---

**✅ Testing**

### Unit Testing with Jest

Jest is a test runner + assertion library + mocking system commonly used with React.

```js
test("adds numbers", () => {
  expect(sum(1, 2)).toBe(3);
});
```

Features: watch mode, coverage, snapshot support, module mocks (`jest.mock`), fake timers (`jest.useFakeTimers()`).

Vitest is a modern alternative with a Jest-compatible API and faster ESM-native DX — mention both in interviews.

Test **behavior and logic** of pure functions, reducers, utilities first — they're the cheapest unit tests.

---

### Testing Library (React Testing Library)

RTL encourages testing from the user's perspective: query by role/label/text, not implementation details.

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("submits name", async () => {
  const user = userEvent.setup();
  render(<ContactForm onSubmit={onSubmit} />);
  await user.type(screen.getByLabelText(/name/i), "Ada");
  await user.click(screen.getByRole("button", { name: /submit/i }));
  expect(onSubmit).toHaveBeenCalledWith({ name: "Ada" });
});
```

**Query priority:** `getByRole` → `getByLabelText` → `getByPlaceholderText` → `getByText` → `getByTestId` (last resort).

`findBy*` for async; `queryBy*` when asserting absence. Avoid testing state variables or private methods directly.

---

### Mocking APIs

Isolate UI from real network:

- `jest.mock("./api")` and mock module functions.
- **MSW (Mock Service Worker)** — intercept real `fetch`/XHR at network level; best practice for integration-style tests.
- Spy on `global.fetch`.

Assert loading → success and loading → error paths. Always clean up handlers between tests.

---

### Snapshot Testing

Snapshots serialize rendered output and fail when it changes unexpectedly:

```js
expect(renderer.toJSON()).toMatchSnapshot();
```

Useful for stable presentational components / serialized structures. Fragile for large, frequently changing UIs — overuse causes rubber-stamp updates. Prefer RTL assertions for behavior; use snapshots sparingly or for small pure outputs.

Inline snapshots and serializers improve reviewability.

---

### E2E Testing with Cypress or Playwright

E2E runs the real app in a browser and exercises user flows.

| | Cypress | Playwright |
|---|---|---|
| Model | Often time-travel debug, all-in-one | Multi-browser, multi-tab, strong auto-wait |
| Languages | JS/TS | JS/TS/Python/etc. |
| Strength | Excellent DX historically | Fast parallel, tracing, modern default for many teams |

Test critical paths: login, checkout, form submit. Use test IDs or roles thoughtfully; seed backends or mock APIs at the gateway. Keep E2E suite small and stable; push detail down to unit/integration tests.

---

**✅ Performance & Optimization**

### Memoization (React.memo, useMemo, useCallback)

Covered individually under Core Concepts. Combined strategy:

1. Profile to find expensive subtrees.
2. Wrap pure leaf components in `React.memo`.
3. Stabilize props from parents with `useCallback` / `useMemo` only as needed.
4. Memoize expensive derived data with `useMemo`.
5. Don't memoize cheap calculations — clarity first.

Remember: memoization trades memory and complexity for skipped work. Wrong dependencies cause stale UI bugs that are worse than extra renders.

---

### Debounce / Throttle

**Debounce:** wait until calls stop for N ms, then run once (search-as-you-type).  
**Throttle:** run at most once per N ms (scroll handlers).

```js
// conceptual debounce
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
```

In React, debounce the **effect** or the **callback** that hits the API, not necessarily every keystroke state update (you usually want the input controlled and snappy). Libraries: `lodash.debounce`, `useDeferredValue` for render deferral (related but not identical), custom `useDebouncedValue` hooks.

Always cancel debounced calls on unmount.

---

### Profiling with React DevTools

The **Profiler** tab records commit durations, which components rendered, and why ("props changed", "hooks changed", "parent rendered").

Workflow:

1. Record while reproducing slowness.
2. Sort by duration; find unexpected re-renders.
3. Fix with state locality, memoization, or concurrent features.
4. Re-profile to confirm.

Also use the Components tree to inspect props/hooks/context. Browser Performance panel complements this for paint/layout/JS long tasks.

---

### Avoiding unnecessary re-renders

Checklist:

- Move state closer to where it's used (don't store keystrokes in a top-level context).
- Split contexts; memoize provider values.
- `React.memo` on heavy pure children.
- Stable function/object identities when they matter.
- Avoid creating components inside render.
- Prefer composition (`children`) so parents don't need to own frequently changing props for static children.
- Virtualize huge lists.
- For external stores, subscribe with selectors (`useSyncExternalStore` / Zustand selectors).

Remember: **re-renders are cheap until they're not**. Optimize measured bottlenecks.

---

### React Fiber

Fiber is React's internal reconciliation engine (since React 16). Each component instance corresponds to a Fiber node with fields for type, pending props, state, effects list, and links (`child`, `sibling`, `return`).

**Why Fiber:**

- Incremental rendering: work split into chunks; can pause/resume.
- Priority levels (lanes) for updates.
- Better error handling (boundaries) and Suspense integration.
- Foundation for concurrent rendering.

You rarely touch Fiber APIs directly; understanding it explains how `useTransition` can interrupt work and how React can render without blocking the main thread for long stretches.

---

**✅ Architecture & Patterns**

### Component Composition

Prefer composing small components over inheritance or deep prop configuration:

```jsx
<Modal>
  <Modal.Header>Title</Modal.Header>
  <Modal.Body>Content</Modal.Body>
  <Modal.Footer>
    <Button>OK</Button>
  </Modal.Footer>
</Modal>
```

`children` as the main extension point beats boolean prop sprawl (`showHeader`, `showFooter`, `headerVariant`, ...). Composition keeps APIs flexible and readable.

Techniques: children, multiple named slots (`leftAction`, `rightAction`), compound components, hooks for behavior + dumb components for UI.

---

### Container vs Presentational Components

Classic pattern (Redux era):

- **Container / smart:** data fetching, state, connected to store; passes props down.
- **Presentational / dumb:** receives props, renders UI; mostly pure.

Today the line blurs: hooks let "containers" be thin custom hooks (`useUserScreen()`), and components mix concerns carefully. The **idea** remains valuable: separate data/orchestration from visual rendering for reuse and testing.

Related modern terms: "headless" components (logic, no UI) vs styled views.

---

### Atomic Design

Brad Frost's methodology for UI hierarchy:

1. **Atoms** — button, input, label  
2. **Molecules** — search field (input + button)  
3. **Organisms** — header with nav + search  
4. **Templates** — page layout  
5. **Pages** — templates with real content  

Useful for design systems and shared component libraries. Don't over-apply dogmatically inside a small app feature folder — use it where a system boundary exists.

---

### Folder Structure Best Practices

There is no single correct structure. Common approaches:

**By type:** `components/`, `hooks/`, `utils/`, `pages/` — simple early on; becomes noisy.

**By feature:** `features/auth/`, `features/cart/` — each with its components, hooks, API — scales better.

**Colocation:** keep test, styles, and component together (`Button/Button.tsx`, `Button.test.tsx`, `Button.module.css`).

Guidelines:

- Public API via `index.ts` barrels carefully (watch circular deps and tree-shaking).
- Shared UI in `components/ui`; domain logic in `features`.
- Align with routing structure for app pages.
- Enforce boundaries in monorepos with lint rules / Nx tags.

---

### Monorepo (Nx or TurboRepo, optional)

A monorepo hosts multiple packages/apps in one repo:

- `apps/web`, `apps/admin`, `packages/ui`, `packages/config`

**Turborepo:** task orchestration + remote caching for `build`/`test` pipelines.  
**Nx:** rich codegen, dependency graph, affected commands, optional plugins.

Benefits: atomic cross-package changes, shared UI libraries, consistent tooling. Costs: CI complexity, ownership boundaries, learning curve.

For interviews: explain caching ("only rebuild what changed"), package boundaries, and why shared `tsconfig`/`eslint` packages matter.

---

**✅ SSR / SSG / Frameworks**

### Next.js (Routing, API Routes, getServerSideProps, etc.)

Next.js is the dominant React meta-framework.

**Pages Router (legacy but widespread):**

- File-based routes in `pages/`.
- `getServerSideProps` — SSR on each request.
- `getStaticProps` / `getStaticPaths` — SSG / ISR.
- `pages/api/*` — API routes.
- `_app`, `_document` for app shell / HTML document.

**App Router (current direction):**

- `app/` directory, layouts, nested routing, Server Components by default.
- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts` handlers.
- Data fetching with `fetch` + caching semantics; server actions for mutations.

Know both for interviews; many codebases still mix eras.

---

### Remix (optional)

Remix emphasizes web fundamentals: nested routes, loaders/actions for data mutations, progressive enhancement forms, and excellent nested error/loading UI. React Router's data APIs absorbed many Remix ideas. Mention Remix when discussing "loaders on the server, actions for POSTs, no separate API required for many mutations."

---

### Static Site Generation vs Server Side Rendering

| | SSG | SSR |
|---|---|---|
| When HTML built | At build time | On each request |
| Best for | Marketing, docs, blogs | Personalized, frequently changing, auth-bound pages |
| TTFB | Very fast (CDN static) | Depends on server/data |
| Freshness | Rebuild or ISR/on-demand revalidation | Always fresh |

**ISR / on-demand revalidation** (Next.js) blurs the line: static pages that refresh periodically or via webhook.

**CSR (client-only):** SPA shell + fetch on client — simpler hosting, slower first contentful paint for data-heavy pages, weaker SEO unless pre-rendered.

---

### App Router vs Pages Router (Next.js 13+)

| | Pages Router | App Router |
|---|---|---|
| Components | Client by default | Server by default |
| Layouts | Custom via `_app` / nested conventions | Native nested `layout.tsx` |
| Data | `getServerSideProps` / `getStaticProps` | async Server Components, `fetch` cache, server actions |
| Streaming | Limited | Built-in with Suspense |
| Routing file API | `pages/index.js` | `app/page.tsx` |

Migration is incremental in many apps. Interview depth: `"use client"` boundaries, how to pass data across them, caching (`cache`, `revalidate`), and when a Client Component is actually required (hooks, browser APIs, event handlers).

---

**✅ Real-time & Side Effects**

### WebSockets with React

WebSockets provide full-duplex channels for live data (chat, presence, collaborative editing, trading ticks).

Pattern:

```jsx
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = (event) => {
    setMessages((m) => [...m, JSON.parse(event.data)]);
  };
  return () => ws.close();
}, [url]);
```

Concerns: reconnect/backoff, auth tokens, heartbeat/ping, backpressure, updating React state efficiently (batch high-frequency messages), and putting the socket in context/store so multiple components don't open duplicates. Libraries: Socket.IO (fallback transports), native WebSocket, Ably/Pusher.

---

### Fetch / Axios

**`fetch`:** built-in, promise-based, no request/response interceptors built-in, need to check `res.ok` manually.

**Axios:** extras like interceptors, automatic JSON transform, request cancellation historically easier (`CancelToken` → `AbortController`), wider older-browser habits.

Both should use **`AbortController`** for canceling on unmount or query change. Prefer wrapping data fetching in a library (TanStack Query) rather than ad-hoc `useEffect` + `useState` everywhere.

---

### SWR / React Query / TanStack Query

These libraries manage **server state**: caching, deduping, revalidation, retries, stale-while-revalidate.

**SWR (Vercel):** lightweight, `useSWR(key, fetcher)` — focuses on revalidation model.  
**TanStack Query (formerly React Query):** richer mutations, infinite queries, Devtools, normalized patterns for complex apps.

Benefits over manual effects:

- Cache by key
- Deduplicate parallel requests
- Background refetch on focus/reconnect
- Stale/fresh semantics
- Retry/backoff
- Mutation lifecycle + cache updates

---

### useSWR, useMutation, useQuery

```js
// SWR
const { data, error, isLoading, mutate } = useSWR("/api/user", fetcher);

// TanStack Query
const { data, isPending, error } = useQuery({
  queryKey: ["user", id],
  queryFn: () => fetchUser(id),
});

const mutation = useMutation({
  mutationFn: updateUser,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
});
```

**Keys** uniquely identify cached data — include all variables that affect the result (`["todos", { status, page }]`).

**Mutations** update the server then invalidate or optimistically update the cache. Know optimistic updates + rollback on error for senior interviews.

---

**✅ Styling**

### CSS Modules

CSS files scoped locally by default via build tooling:

```css
/* Button.module.css */
.root { padding: 8px; }
```

```jsx
import styles from "./Button.module.css";
<button className={styles.root} />
```

Class names are hashed to avoid collisions. Compose with `composes` or multiple classes. Great middle ground: real CSS, local scope, no runtime cost like CSS-in-JS.

---

### Styled Components / Emotion

CSS-in-JS: styles colocated with components using template literals / objects; generate class names at runtime (or compile-time with modern setups).

```jsx
const Button = styled.button`
  background: ${(p) => p.theme.primary};
`;
```

Pros: dynamic styling from props/theme, colocation. Cons: runtime cost, SSR critical CSS setup, complexity with React Server Components (runtime CSS-in-JS is awkward in RSC — many move to CSS Modules / Tailwind / zero-runtime solutions).

Emotion is similar; MUI historically used Emotion under the hood.

---

### Tailwind CSS

Utility-first CSS: compose design from atomic classes in JSX (`className="flex items-center gap-2 px-4"`).

Pros: fast UI iteration, constrained design tokens via config, excellent tree-shaken production CSS, no naming fatigue. Cons: verbose class strings; learn the vocabulary; extract components to avoid duplication.

Works especially well with component libraries and design systems that map props → class lists (`cva` / `tailwind-variants`).

---

### SCSS / PostCSS

**SCSS/Sass:** variables, nesting, mixins, partials — still common in enterprise codebases.

**PostCSS:** transform CSS with plugins (`autoprefixer`, `preset-env`, Tailwind is PostCSS-based). Modern pipelines often use PostCSS even when authors write plain CSS.

Nesting is now native in CSS in modern browsers — SCSS less mandatory than before, but mixins and existing ecosystems keep it relevant.

---

### BEM Methodology

**Block Element Modifier** naming convention:

```text
.card {}
.card__title {}
.card__title--featured {}
.card--dark {}
```

Goal: predictable, collision-resistant class names without deep selector coupling. Pairs with classic SCSS. Less necessary inside CSS Modules (local scope) or Tailwind (utilities), but still appears in interviews and legacy CSS.

---

**✅ Accessibility & SEO**

### ARIA Attributes

ARIA (Accessible Rich Internet Applications) communicates role, state, and properties to assistive tech when native HTML isn't enough.

Examples:

- `role="dialog"`, `aria-modal="true"`
- `aria-label`, `aria-labelledby`, `aria-describedby`
- `aria-expanded`, `aria-controls`
- `aria-live` for polite/assertive announcements

**First rule of ARIA:** don't use ARIA if a native element works (`button`, `a`, `input`, `select`). Prefer semantic HTML; add ARIA to fill gaps (custom widgets).

Incorrect ARIA is worse than none. Follow WAI-ARIA authoring practices for tabs, menus, comboboxes.

---

### Keyboard Navigation

Accessible apps are fully operable via keyboard:

- Tab order matches visual order (don't break with positive `tabIndex` randomly).
- Interactive elements focusable (`button` not `div` with onClick).
- Manage focus when opening/closing modals (focus trap, restore focus).
- Arrow keys within composite widgets (menus, listboxes) per ARIA patterns.
- Visible focus styles — never `outline: none` without a replacement.

Test by unplugging the mouse. Tools: Axe, keyboard-only walkthroughs, screen readers (VoiceOver, NVDA).

---

### Lighthouse Scores

Lighthouse audits Performance, Accessibility, Best Practices, SEO (and PWA historically).

Use it as a diagnostic, not a vanity metric. For React SPAs: watch LCP, CLS, JS bundle size, unused JS, heading order, image alt text, meta description. Frameworks with SSR/SSG usually score better on SEO and LCP for content pages.

---

### Meta tags with React Helmet or Head (Next.js)

SEO and social sharing depend on `<title>`, meta description, Open Graph, canonical URLs, etc.

- **react-helmet-async** — set head tags from components in CSR/SSR apps.
- **Next.js** — `next/head` (Pages Router) or `metadata` export / `generateMetadata` (App Router).

For SSR/SSG, meta tags must be present in the initial HTML for crawlers and link unfurlers — client-only `useEffect` title changes are weaker for SEO.

---

## 🔶 TypeScript Topics

**✅ Core TypeScript Concepts**

### Basic Types (string, number, boolean, any, unknown)

| Type | Meaning |
|---|---|
| `string`, `number`, `boolean` | Primitive types |
| `any` | Opt-out of checking — avoid when possible |
| `unknown` | Safer top type — must narrow before use |
| `void` | Function returns nothing meaningful |
| `never` | Function never returns (throw/infinite) |
| `bigint`, `symbol` | Less common primitives |
| `object` | Non-primitive (not very precise — prefer shapes) |

```ts
let id: number = 1;
let conf: any = JSON.parse(text);      // unchecked
let conf2: unknown = JSON.parse(text); // must narrow
```

Prefer `unknown` over `any` for untrusted input. Prefer concrete interfaces over `object`.

---

### Type Inference

TypeScript often infains types without annotations:

```ts
const n = 42;          // number
const greet = (name: string) => `Hi ${name}`; // return inferred as string
const items = [1, 2];  // number[]
```

Annotate when:

- Exporting public APIs for clearer docs/errors
- Inference widens too much (`[]` as `any[]` / `never[]`)
- Return types of complex functions for intentional contracts

`as const` asserts deep readonly literal inference — powerful with discriminated unions and config objects.

---

### Union & Intersection Types

**Union (`A | B`):** value is one of the members. Narrow with typeof checks, `in`, equality, or type guards.

```ts
function printId(id: string | number) {
  if (typeof id === "string") console.log(id.toUpperCase());
  else console.log(id.toFixed(0));
}
```

**Intersection (`A & B`):** value must satisfy both. Useful for combining props: `type Props = BaseProps & { extra: string }`.

Avoid overusing intersections of incompatible object types (can collapse toward `never`).

---

### Literal Types

Types that are exact values:

```ts
type Direction = "left" | "right" | "up" | "down";
type Dice = 1 | 2 | 3 | 4 | 5 | 6;
const mode: "on" | "off" = "on";
```

Combine with unions for strong APIs (button variants, action types). `as const` on arrays/objects produces literal types instead of widened `string` / `number`.

---

### Type Aliases vs Interfaces

**Interface:** object shapes; can `extend`; supports declaration merging.

**Type alias:** any type expression — unions, intersections, tuples, mapped types, primitives.

```ts
interface User { id: string; name: string }
type ID = string | number;
type ReadonlyUser = Readonly<User>;
```

Practical guidance: many React codebases use `interface` for component props and object shapes, `type` for unions/utilities. Both work for props. Consistency matters more than dogma.

Interfaces can be extended/merged; type aliases with unions cannot be reopened.

---

### Enums

```ts
enum Direction { Up, Down, Left, Right }       // numeric
enum Status { Active = "ACTIVE", Off = "OFF" } // string
```

Enums are a TypeScript-issued construct that emit JS (except `const enum` which inlines). Many style guides prefer:

```ts
const Direction = { Up: "UP", Down: "DOWN" } as const;
type Direction = typeof Direction[keyof typeof Direction];
```

Know classic enums for interviews; prefer union literals / const objects in modern TS React apps unless a library forces enums.

---

### Tuples

Fixed-length arrays with typed positions:

```ts
type Pair = [string, number];
const useStateLike: [number, (n: number) => void] = [0, setN];
```

Optional elements and rest elements exist (`[string, ...number[]]`). `as const` produces readonly tuples of literals. Useful for `useState`-style returns and CSV-like rows.

---

### Optional & Default Parameters

```ts
function greet(name: string, title?: string) { ... }
function greet2(name: string, title: string = "Dr.") { ... }
```

Optional props in objects: `age?: number` (≈ `age: number | undefined` with nuances around exactOptionalPropertyTypes).

Default parameter values are JS runtime defaults; the parameter type is inferred or annotated separately.

---

### Null & Undefined

`strictNullChecks` (in `strict` mode) makes `null` and `undefined` not assignable to other types unless included in a union.

```ts
let a: string | null = null;
a?.toUpperCase();           // optional chaining
const len = a?.length ?? 0; // nullish coalescing
```

Distinguish `??` (only null/undefined) from `||` (any falsy). Prefer explicit `| null` for "absence" in APIs. `non-null assertion` (`a!`) overrides the checker — use sparingly.

---

**✅ TypeScript with React**

### Typing Props and State

```tsx
type ButtonProps = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  children?: React.ReactNode;
};

function Button({ label, onClick, variant = "primary" }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

State types usually inferred from `useState` initial value; provide a generic when initial is `null`:

```ts
const [user, setUser] = useState<User | null>(null);
```

`React.ReactNode` for children that can be almost anything renderable; `React.ReactElement` for a single element; `JSX.Element` similar but slightly different historically.

---

### Typing Functional Components

Prefer:

```tsx
function Card(props: CardProps) {
  return <div>{props.title}</div>;
}
```

Or with destructuring. Explicit return type `JSX.Element` / `React.ReactElement | null` is optional; inference usually suffices. Returning `null` is valid for conditional render.

---

### React.FC vs regular function components

`React.FC<Props>` (or `React.FunctionComponent<Props>`) historically:

- Implicitly included `children` (until `@types/react` changed this)
- Gave slightly worse inference with generics
- Looked "official" but many style guides discourage it

**Modern recommendation:** use plain functions with typed props. Avoid `React.FC` unless a codebase standard requires it. Know the debate for interviews.

---

### Typing useState, useRef, useReducer

```ts
useState<string>("");
useState<User | null>(null);

const inputRef = useRef<HTMLInputElement>(null); // .current: HTMLInputElement | null
const valueRef = useRef<string>("");             // mutable box, initial ""

type State = { count: number };
type Action = { type: "inc" } | { type: "add"; payload: number };

const [state, dispatch] = useReducer(reducer, { count: 0 });
// type reducer carefully for Action narrowing
```

For `useRef` holding a DOM node, initialize with `null` and type the element. For a ref box that always has a value, initialize it and TypeScript won't force `| null` in the same way.

---

### Typing Custom Hooks

Type inputs and outputs explicitly when inference isn't obvious:

```ts
function useToggle(initial = false): [boolean, () => void] {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn((v) => !v);
  return [on, toggle];
}
```

For data hooks:

```ts
function useUser(id: string): {
  data: User | undefined;
  error: Error | null;
  isLoading: boolean;
} { ... }
```

Generic hooks: `function useLocalStorage<T>(key: string, initial: T)`.

---

### Typing event handlers (MouseEvent, ChangeEvent, etc.)

```ts
function onClick(e: React.MouseEvent<HTMLButtonElement>) {}
function onChange(e: React.ChangeEvent<HTMLInputElement>) {
  setValue(e.target.value);
}
function onSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
}
```

Common types: `MouseEvent`, `ChangeEvent`, `KeyboardEvent`, `FocusEvent`, `FormEvent`, `DragEvent` — all under `React.*` when using the React type package. The generic parameter is the element type for `currentTarget` typing.

Inline handlers often infer correctly; extract named functions when you need annotations.

---

### Typing forwardRef

```tsx
type InputProps = { label: string };

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label },
  ref
) {
  return (
    <label>
      {label}
      <input ref={ref} />
    </label>
  );
});
```

`forwardRef<RefType, PropsType>`. With `useImperativeHandle`, `RefType` becomes your custom handle interface.

---

### Typing HOCs

HOCs need careful generics so props injected vs required remain correct:

```ts
function withUser<P extends { user: User }>(
  Component: React.ComponentType<P>
) {
  return function Wrapped(props: Omit<P, "user">) {
    const user = useCurrentUser();
    return <Component {...(props as P)} user={user} />;
  };
}
```

`Omit`, `ComponentType`, and sometimes props inference helpers appear. This complexity is a reason hooks are preferred.

---

### Typing Context Providers and Consumers

```ts
type AuthContextValue = {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

Typing context as `| null` and throwing in a hook is a common pattern for required providers. Alternatively provide a default no-op (less safe). Provider `value` must match the type — memoize to keep referential stability.

---

**✅ Advanced TypeScript**

### Generics

Generics parameterize types for reuse while preserving type information:

```ts
function identity<T>(value: T): T {
  return value;
}

type ApiResponse<T> = { data: T; error: null } | { data: null; error: string };

function useResource<T>(url: string): ApiResponse<T> { ... }
```

Constraints: `function longest<T extends { length: number }>(a: T, b: T): T`.

React uses generics heavily: `useState<T>`, `createContext<T>`, component props with `T`.

---

### Mapped Types

Build new types by iterating keys:

```ts
type Readonly<T> = { readonly [K in keyof T]: T[K] };
type Optional<T> = { [K in keyof T]?: T[K] };
type Nullable<T> = { [K in keyof T]: T[K] | null };
```

Modifiers: `readonly`, `?`, and prefix `-` to remove (`-readonly`, `-?`). Foundation of many utility types.

---

### Conditional Types

Types that choose based on a condition:

```ts
type IsString<T> = T extends string ? true : false;
type Flatten<T> = T extends (infer U)[] ? U : T;
type NonNullable<T> = T extends null | undefined ? never : T;
```

Distributed conditional types over unions are a deep interview topic: `T extends X ? A : B` distributes when `T` is a naked type parameter.

---

### Utility Types (Partial, Pick, Omit, Required, Record, etc.)

| Utility | Effect |
|---|---|
| `Partial<T>` | All properties optional |
| `Required<T>` | All properties required |
| `Readonly<T>` | All properties readonly |
| `Pick<T, K>` | Subset of keys |
| `Omit<T, K>` | Remove keys |
| `Record<K, V>` | Object with keys K and values V |
| `Exclude<T, U>` | From union T, remove U |
| `Extract<T, U>` | From union T, keep U |
| `NonNullable<T>` | Remove null/undefined |
| `ReturnType<F>` | Function return type |
| `Parameters<F>` | Function parameter tuple |
| `InstanceType<C>` | Instance of constructor |

```ts
type UserUpdate = Partial<Pick<User, "name" | "email">>;
type Roles = Record<string, boolean>;
```

---

### keyof, typeof, infer

- **`keyof T`** — union of keys of T (`"id" | "name"`).
- **`typeof` value** — produce a type from a runtime value (`typeof config`).
- **`infer`** — declare a type variable to infer inside conditional types (`T extends Promise<infer U> ? U : T`).

```ts
type ValueOf<T> = T[keyof T];
type PropType = typeof Button; // for components, often typeof + React tools
```

Together these enable advanced type-level programming used in typed routers, form libraries, and ORM clients.

---

### Declaration Merging

Interfaces with the same name in the same scope merge their members:

```ts
interface Window {
  myAppConfig: Config;
}
```

Useful for extending global types or library interfaces. Type aliases do **not** merge — redeclaring them is an error. Module augmentation (`declare module "lib"`) is related and common when extending third-party types.

---

### Type Guards

Runtime checks that narrow types for the compiler:

```ts
function isUser(v: unknown): v is User {
  return typeof v === "object" && v !== null && "id" in v;
}

if (isUser(data)) {
  console.log(data.id); // User
}
```

Built-ins: `typeof`, `instanceof`, `Array.isArray`, `in`. Custom predicates use `value is Type` return signature. Assertion functions: `asserts value is Type`.

---

### Discriminated Unions

Unions of objects sharing a common literal **discriminant** field:

```ts
type Result =
  | { status: "loading" }
  | { status: "success"; data: User }
  | { status: "error"; error: string };

function render(r: Result) {
  switch (r.status) {
    case "loading":
      return "…";
    case "success":
      return r.data.name;
    case "error":
      return r.error;
  }
}
```

Exhaustiveness checking with `never` in the default branch catches missing cases. This is the gold standard for typing React state machines and async UI states.

---

### Type Assertions & Casting

```ts
const el = document.getElementById("root") as HTMLDivElement;
const len = (value as string).length;
```

Assertions tell the compiler to trust you — they don't emit runtime checks. Prefer narrowing/guards. Double assertion `as unknown as T` is an escape hatch when types are mismatched — a smell.

`satisfies` operator (TS 4.9+) validates a value matches a type while preserving literal inference — often better than `as`.

---

### Function Overloads

Declare multiple call signatures, then one implementation:

```ts
function parse(x: string): User;
function parse(x: string[]): User[];
function parse(x: string | string[]): User | User[] {
  // implementation
}
```

Useful for APIs that return different types based on inputs. Overuse hurts readability; often generics or conditional return types suffice.

---

### Interface vs Type deep differences

| Feature | Interface | Type |
|---|---|---|
| Object shapes | Yes | Yes |
| Unions / tuples / primitives | No | Yes |
| Extending | `extends` | `&` intersection |
| Declaration merging | Yes | No |
| Computed properties / mapped | Limited | Excellent |
| Error messages | Sometimes clearer | Sometimes more opaque |
| `implements` | Classes can implement | Classes can implement type aliases that look like objects too |

Both can describe React props. Prefer interfaces when you may augment; prefer type aliases for unions and advanced compositions. In interviews, emphasize trade-offs rather than "always use X."

---

**✅ TypeScript Tooling**

### tsconfig.json settings

Important compiler options:

| Option | Why it matters |
|---|---|
| `strict` | Enables strictNullChecks, noImplicitAny, etc. — turn on |
| `jsx` | `react-jsx` for modern JSX transform |
| `module` / `moduleResolution` | `ESNext` + `bundler` common in Vite |
| `target` | Emitted JS language level |
| `baseUrl` / `paths` | Path aliases |
| `noUncheckedIndexedAccess` | Indexed access includes `undefined` — safer |
| `exactOptionalPropertyTypes` | Distinguishes missing vs `undefined` |
| `skipLibCheck` | Faster builds; skips `.d.ts` checking |
| `incremental` / `composite` | Project references / speed |
| `noEmit` | Typecheck only (bundler emits) |

Know `include`/`exclude` and project references for monorepos.

---

### Path Aliases

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

Import `@/components/Button` instead of `../../../components/Button`. Bundlers (Vite, Webpack) and test runners need matching alias config — `tsconfig` alone isn't enough at runtime.

---

### ESLint & Prettier Setup

**Prettier:** formatting (quotes, width, semicolons).  
**ESLint:** code quality and bug prevention.

Typical React TS stack:

- `typescript-eslint` parser + plugin
- `eslint-plugin-react` / `react-hooks` (Rules of Hooks!)
- `eslint-config-prettier` to disable conflicting format rules

Run format on save; run lint in CI. Don't fight Prettier with ESLint style rules — separate concerns.

---

### Linting for Type Safety

ESLint type-aware rules (`parserOptions.project`) unlock rules like:

- `no-floating-promises`
- `no-misused-promises`
- `no-unsafe-assignment` (from `any`)

Trade-off: slower lint. Many teams enable type-aware lint on CI or use a focused ruleset. Pair with `tsc --noEmit` in CI as the source of truth for types.

---

### Integrating TypeScript with Babel

Two historical approaches:

1. **tsc emits JS** — TypeScript is the compiler.
2. **Babel strips types** (`@babel/preset-typescript`) — Babel emits JS; `tsc --noEmit` typechecks separately.

Vite/esbuild similarly strip types and rely on `tsc` or IDE for checking. Babel path was popular with Create React App. Understand that **erasing types ≠ typechecking** — always run a typecheck step in CI.

---

## How to use this guide

- Treat each checkbox topic in `React Topics.md` as a flashcard: explain it aloud, then skim the matching section here for gaps.
- Prefer writing a tiny code sample from memory for Hooks, Router, Query, and TS utility types — interviews reward fluency over buzzwords.
- When studying performance, practice reading a Profiler screenshot story: what re-rendered, why, and what you'd change.

Good luck with prep.
