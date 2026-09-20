# Agentic AI & LLM Harnesses

Checklist for deep-dive Agentic AI & LLM harness interview prep (models, tools, agent loops, harness design, evals, security, production). Check off when you can explain aloud with tradeoffs and a small code mental model.

*Related:* `Senior Backend Production Stack Topics.md` / Guide for LLM API basics, RAG, embeddings & observability; this doc focuses on **agents, tool use, and production harnesses**.

---

**📌 LLM Foundations for Agents**

- [] LLM overview & why agents need a model loop
- [] Tokens, context windows & cost for agent runs
- [] Chat completions vs Responses / Assistants-style APIs
- [] Streaming tokens (SSE) for agent UIs & logs
- [] Temperature, top_p, max_tokens — agent-relevant defaults
- [] Structured outputs (JSON mode / schema-constrained decoding)
- [] System vs developer vs user vs tool messages
- [] Model selection for agents (latency vs reasoning vs cost)
- [] Provider landscape (OpenAI, Anthropic, Gemini, Bedrock, local)
- [] Determinism limits & reproducibility of agent runs

---

**📌 Prompting for Agentic Systems**

- [] System prompts as agent constitutions
- [] Role, goal, constraints & stop conditions
- [] Few-shot examples for tool-using agents
- [] Chain-of-thought vs hidden reasoning vs ReAct traces
- [] Prompt templates & versioning in code
- [] Separating instructions from untrusted user content
- [] Output contracts (schemas, enums, refusal formats)
- [] Prompt injection vs jailbreaks (agent context)
- [] Progressive disclosure (skills / tool docs on demand)
- [] When to fine-tune vs prompt vs RAG vs tools

---

**📌 Tools & Function Calling**

- [] What a tool is (name, description, JSON schema, handler)
- [] Function calling / tool-use API flow
- [] Parallel tool calls vs sequential dependency
- [] Tool result messages & error surfaces to the model
- [] Designing tool granularity (too fine vs too coarse)
- [] Idempotent tools & safe retries
- [] Side-effecting vs read-only tools
- [] Human-in-the-loop tools (approval gates)
- [] MCP (Model Context Protocol) overview
- [] Tool registries & discovery at runtime
- [] Validating tool args before execution
- [] Sandboxing tool execution (timeouts, network, FS)

---

**📌 Agent Architectures & Loops**

- [] Agent vs chatbot vs workflow automation
- [] The agent loop (observe → think → act → observe)
- [] ReAct (Reason + Act) pattern
- [] Plan-then-execute vs interleaved planning
- [] Tool-calling agents without explicit CoT
- [] Reflection / self-critique loops
- [] Stopping criteria (max steps, budget, goal check)
- [] Stateless request agents vs long-running agents
- [] Deterministic workflows (graphs) vs free-form agents
- [] When *not* to use an agent (prefer scripts / DAGs)

---

**📌 Harness Design (Production Agent Runtime)**

- [] What an LLM / agent harness is
- [] Harness responsibilities (loop, tools, memory, policy, telemetry)
- [] Session & run IDs; correlating multi-step traces
- [] Step budgets, token budgets & wall-clock timeouts
- [] Retry policies (model errors vs tool errors)
- [] Circuit breakers when the model or tools fail
- [] Cancellation & graceful abort mid-run
- [] Checkpointing agent state between steps
- [] Pluggable model backends behind one interface
- [] Configuration as code (prompts, tools, budgets per env)
- [] Multi-tenant harness isolation
- [] Feature flags for prompt / model / tool rollouts

---

**📌 Memory, State & Context Management**

- [] Short-term conversation memory vs long-term memory
- [] Message history trimming & summarization strategies
- [] Scratchpads / working memory for multi-step tasks
- [] Entity & episodic memory stores (overview)
- [] Context window budgeting for tools + history + RAG
- [] Compaction: summarize older turns without losing goals
- [] Thread / session persistence (DB, Redis, S3)
- [] Idempotent run resume after crashes
- [] Avoiding memory poisoning from untrusted content

---

**📌 RAG & Knowledge for Agents**

- [] RAG inside an agent loop (retrieve as a tool)
- [] Agent-chosen retrieval vs always-on RAG
- [] Hybrid search & re-ranking for tool-facing retrieval
- [] Citations & grounding requirements in agent answers
- [] Stale knowledge & freshness SLAs
- [] Access-controlled retrieval (per-user / per-tenant ACL)
- [] When agents should write back to the knowledge base

---

**📌 Multi-Agent Systems**

- [] Single agent vs multi-agent tradeoffs
- [] Supervisor / orchestrator pattern
- [] Specialist agents (researcher, coder, reviewer)
- [] Handoffs & shared scratchpads
- [] Debate / critique ensembles (overview)
- [] Avoiding infinite agent-to-agent loops
- [] Cost & latency explosion in multi-agent designs
- [] Human as a node in the multi-agent graph

---

**📌 Evaluation, Testing & Quality**

- [] Why evals beat vibe-testing for agents
- [] Golden task datasets & regression suites
- [] Trajectory evals (did the agent take sensible steps?)
- [] Tool-call correctness (right tool, right args)
- [] End-to-end task success metrics
- [] LLM-as-judge (benefits & failure modes)
- [] Offline evals vs online shadow / canary runs
- [] Mocking models & tools in unit tests
- [] Deterministic replay with recorded fixtures
- [] Red-teaming agents (injection, exfiltration, loops)
- [] Latency, cost & quality SLOs for agent products

---

**📌 Observability & Operations**

- [] Tracing agent runs (spans per step / tool / model call)
- [] Logging prompts & completions safely (redaction)
- [] Token, cost & step-count metrics
- [] Dashboards for success rate, retries, tool errors
- [] Alerting on runaway loops & budget breaches
- [] Debugging a failed production trajectory
- [] Version pinning models & prompt hashes in telemetry
- [] Incident playbooks for bad model releases

---

**📌 Security, Safety & Governance**

- [] OWASP LLM Top 10 — agent-relevant subset
- [] Prompt injection via tools, RAG docs & user input
- [] Confused deputy & over-privileged tools
- [] Secrets never in prompts; vault / IAM for tools
- [] Output validation & allowlists for side effects
- [] PII handling in agent memory & logs
- [] Rate limits & abuse prevention for agent endpoints
- [] Audit trails for regulated actions
- [] Kill switches & emergency disable of tools/models
- [] Responsible AI & disclosure for agent products

---

**📌 Implementation Stacks & Patterns**

- [] Python agent harness patterns (LangGraph / custom loop)
- [] Java / Spring Boot agent service patterns
- [] Node.js agent services (overview)
- [] AWS for agents (Lambda, Step Functions, Bedrock, SQS)
- [] Sync API vs async job queue for long agent runs
- [] Streaming UX (token + tool-event streams)
- [] Webhooks / callbacks when agent runs complete
- [] Batch agent jobs (Airflow / workers) vs interactive
- [] Capstone: design an enterprise agent harness

---

**📌 Interview Scenarios & Tradeoffs**

- [] Design: customer-support agent with tools & HITL
- [] Design: personalization workflow automation agent
- [] Design: code / data-ops agent with sandboxing
- [] Debug: agent loops forever calling the same tool
- [] Debug: agent ignores tools and hallucinates actions
- [] Tradeoff: agent vs Airflow DAG vs Step Functions
- [] Tradeoff: multi-agent vs one strong agent + tools
- [] Senior/staff traps across harness, security & cost
