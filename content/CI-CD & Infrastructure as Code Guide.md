# CI/CD & Infrastructure as Code

A deep-dive companion to the CI/CD & Infrastructure as Code checklist. Each heading matches the original outline; under every topic you'll find **what it is**, **why it exists**, **how it works**, and **interview-ready nuance** — focused on **Jenkins, GitHub Actions, and Terraform**.

---

**📌 CI/CD Fundamentals & Pipeline Design**

### CI vs CD vs Continuous Deployment — definitions

| Term | Meaning |
|---|---|
| **Continuous Integration (CI)** | Developers merge to main frequently; each merge triggers automated **build + test** to catch integration bugs early |
| **Continuous Delivery (CD)** | CI plus automated deploy to staging; **production deploy is a manual/business decision** (one-click) |
| **Continuous Deployment** | Every green main commit **automatically** goes to production (requires strong tests, flags, observability) |

Interview: CI is about **integration quality**; CD is about **release readiness**; continuous deployment is **automation to prod**. Many teams say "CD" but mean delivery, not deployment.

---

### Build, test, deploy pipeline stages

Typical stage order:

```
Source → Build → Unit Test → Integration Test → Security Scan → Package/Artifact → Deploy Staging → Smoke Test → Deploy Prod
```

**Build** compiles/packages (jar, docker image). **Test** validates behavior. **Deploy** promotes immutable artifact. Keep stages **idempotent** and **parallelize** independent test suites (lint + unit in parallel).

---

### Pipeline as code vs UI-defined pipelines

**Pipeline as code** (Jenkinsfile, `.github/workflows/*.yml`) — versioned in Git, reviewed in PRs, reproducible, auditable. **UI-defined** (Jenkins freestyle) — quick to click but drifts, hard to review, not portable.

Interview stance: **always prefer pipeline as code** for anything beyond a toy job. Jenkins Declarative Pipeline and GitHub Actions workflows are the modern default.

---

### Artifact immutability & versioning

Once built, an artifact (Docker image `app:1.2.3`, jar, helm chart) should **never be rebuilt** for promotion. Tag with **git SHA** + semver. Promote **the same digest** from staging → prod. Rebuilding "the same" commit can differ (dependency drift, base image updates).

---

### Environment promotion (dev → staging → prod)

Progressive validation: dev (fast feedback) → staging (prod-like) → prod. **Same artifact**, different config (env vars, Terraform workspace, K8s values). Anti-pattern: building separately per environment.

---

### Git branching strategies for CI/CD (trunk, GitFlow, release branches)

| Strategy | CI/CD fit |
|---|---|
| **Trunk-based** | Short-lived branches; main always deployable; feature flags; best for continuous delivery |
| **GitFlow** | release/hotfix branches; heavier; suits scheduled releases |
| **Release branches** | stabilize branch for QA; cherry-pick fixes |

Modern default: **trunk-based + short PRs + main branch protection**. Jenkins multibranch / GHA on `pull_request` + deploy on `push` to `main`.

---

### Fail fast & shift-left testing

Run **cheap checks first** (lint, unit tests) before expensive integration/e2e. **Shift-left** — catch defects in PR, not prod. Parallel jobs in GHA `needs:` graph; Jenkins `parallel` stages for independent suites.

---

### Idempotent deployments & rollback mindset

Deploy scripts should produce the **same end state** if run twice. Terraform is declarative/idempotent. Kubernetes `kubectl apply` is mostly idempotent. Rollback = redeploy **previous artifact version**, not "undo" mystery steps.

---

### Configuration vs secrets separation

**Config** (log level, feature toggles) — env vars, ConfigMaps, tfvars (non-secret). **Secrets** (API keys, DB passwords) — Jenkins credentials, GHA secrets, AWS SSM/Secrets Manager. Never commit secrets; never bake into Docker images.

---

### Deployment frequency & DORA metrics (overview)

DORA: deployment frequency, lead time for changes, change failure rate, MTTR. CI/CD maturity shows in **small batches** and **fast recovery**. Tie pipeline design to measurable outcomes, not tool worship.

---

**📌 Deployment Strategies & Release Engineering**

### Rolling deployments

Replace instances incrementally (K8s RollingUpdate, ASG instance refresh). **Pros:** no double capacity. **Cons:** mixed versions during rollout; backward-compatible migrations required.

---

### Blue-green deployments

Two identical environments; switch traffic (ALB target group, DNS, service selector) from blue → green. **Pros:** instant rollback (switch back). **Cons:** 2× infra cost during cutover; schema migrations need care.

---

### Canary releases & traffic splitting

Route small % traffic to new version; monitor error rate/latency; ramp up. ALB weighted targets, Istio, LaunchDarkly-style progressive delivery. Safer than big-bang for high-risk changes.

---

### Feature flags vs deployment decoupling

**Deploy** = code in prod. **Release** = flag enables feature for users. Decouple to reduce rollback pressure. Flags need lifecycle (remove stale flags) and don't replace schema migration discipline.

---

### Database migration in CI/CD pipelines

Run migrations **before** or **during** deploy with compatibility rules: **expand-contract** pattern (add column nullable → dual-write → backfill → enforce → remove old). Never destructive migration in same release as code depending on new schema without expand phase.

---

### Rollback strategies (redeploy, revert, feature flag)

1. **Redeploy previous artifact** (fastest for stateless apps)
2. **Git revert + pipeline** (fixes forward)
3. **Feature flag off** (if logic-only)
4. **Terraform** — apply previous state or revert commit; watch for destructive changes

Infrastructure rollback may be **harder** than app rollback — design for forward fixes.

---

### Immutable infrastructure concept

Don't SSH and patch servers. Replace instances with new AMIs/images. Packer + Terraform + ASG/K8s. Drift from manual changes is eliminated; updates are **replace**, not **mutate**.

---

### Release tagging & semantic versioning

Tag releases `v1.4.2` (semver). CI builds on tag push (GHA `on: push: tags: v*`). Image tags: `app:1.4.2` and `app:sha-abc1234` for traceability.

---

### Change windows & approval gates

Regulated or legacy ops may require maintenance windows. Implement via Jenkins `input` step, GHA **environment protection rules** with required reviewers, or manual `workflow_dispatch`.

---

### Post-deploy smoke tests & health checks

After deploy, hit `/health`, critical API paths, synthetic checks. Fail pipeline or auto-rollback if smoke fails. K8s readiness/liveness ≠ business smoke test.

---

**📌 Jenkins — Architecture & Core Concepts**

### Jenkins controller vs agents (executors)

**Controller** — schedules builds, serves UI/API, holds configuration, can run lightweight steps (avoid heavy builds on controller). **Agents** (nodes) — execute Pipeline steps on **executors** (slots). One agent can have multiple executors (parallel builds).

---

### Jobs vs Pipeline jobs

**Freestyle job** — UI/config XML; simple shell steps. **Pipeline job** — runs Jenkinsfile (Declarative/Scripted); supports stages, parallel, shared libraries. Prefer Pipeline for real CI/CD.

---

### Declarative vs Scripted Pipeline (Jenkinsfile)

| Style | Characteristics |
|---|---|
| **Declarative** | `pipeline { }` block; structured; validation; preferred |
| **Scripted** | Groovy CPS; flexible; harder to maintain |

```groovy
pipeline {
  agent any
  stages {
    stage('Build') { steps { sh 'mvn package' } }
  }
}
```

Interview: start Declarative; mention Scripted for legacy/custom Groovy.

---

### Workspace, build number & BUILD_ID

Each build gets a **workspace** directory on the agent (`$WORKSPACE`). `BUILD_NUMBER`, `BUILD_ID`, `JOB_NAME` env vars for tagging artifacts. Clean workspace option vs speed tradeoff (`skipDefaultCheckout`, custom wipe).

---

### Jenkins plugins ecosystem

Jenkins extensibility via **plugins** (Git, Pipeline, Docker, Kubernetes, Credentials). Risk: plugin conflicts, security CVEs, upgrades break pipelines. **Pin plugin versions** in controlled environments; test controller upgrades in staging.

---

### Freestyle vs Pipeline — when to use which

Freestyle: one-off shell script, legacy. Pipeline: anything with stages, PR integration, shared libs, multibranch. New projects: **Pipeline only**.

---

### Jenkins home & configuration persistence

`JENKINS_HOME` stores jobs, configs, plugins, credentials (encrypted with master key). **Backup JENKINS_HOME** and master key. Controller loss without backup = rebuild pain.

---

### High availability & controller backup (overview)

Active/passive or regular backups; agents reconnect. CloudBees and K8s operators offer HA patterns. For interviews: know backup/restore of home dir and credential master key.

---

### Jenkins on Kubernetes (agents via K8s plugin — overview)

Controller outside or inside cluster; **Kubernetes plugin** spins **pod agents** per build dynamically. Scales elastically; isolate build dependencies in pod template (containers, resources).

---

**📌 Jenkins — Pipelines & Execution**

### Jenkinsfile structure (agent, stages, steps, post)

```groovy
pipeline {
  agent { label 'linux' }
  stages {
    stage('Test') { steps { sh 'npm test' } }
  }
  post {
    failure { emailext ... }
  }
}
```

**agent** — where to run. **stages** — logical phases. **steps** — shell, sh, bat, tool invocations. **post** — cleanup/notifications.

---

### Declarative pipeline syntax (pipeline, stage, steps)

Declarative enforces structure — only one `pipeline` block, defined sections (`options`, `environment`, `parameters`, `triggers`, `stages`, `post`). Syntax errors fail at parse time (better than runtime Groovy NPE in Scripted).

---

### Scripted pipeline (node, stage) — basic understanding

```groovy
node('linux') {
  stage('Build') { sh 'make' }
}
```

Full Groovy; use when Declarative limits hit (rare). Most teams wrap logic in **shared library** functions instead of large Scripted pipelines.

---

### Parallel stages & failFast

```groovy
stage('Tests') {
  parallel {
    stage('Unit') { steps { sh 'mvn test' } }
    stage('Lint') { steps { sh 'npm run lint' } }
  }
}
```

`failFast true` in `options` stops siblings on first failure. Speeds CI wall-clock time.

---

### Matrix / axes builds (Declarative matrix)

Test multiple JDK/OS combinations:

```groovy
matrix {
  axes {
    axis { name 'JAVA'; values '11', '17' }
  }
  stages { stage('Build') { steps { sh 'mvn verify' } } }
}
```

Similar to GHA `strategy.matrix`.

---

### Input steps & manual approval gates

```groovy
stage('Deploy Prod') {
  steps {
    input message: 'Deploy to production?', ok: 'Deploy'
    sh './deploy.sh prod'
  }
}
```

Pauses pipeline until authorized user approves. Pair with RBAC so only release managers can approve.

---

### Post actions (always, success, failure, unstable)

```groovy
post {
  always { cleanWs() }
  success { slackSend color: 'good', ... }
  failure { slackSend color: 'danger', ... }
}
```

`unstable` — e.g. tests passed but quality gate failed. Run notifications and cleanup in `always`.

---

### when / unless conditions in stages

```groovy
stage('Deploy') {
  when { branch 'main' }
  steps { ... }
}
```

Also: `environment`, `expression`, `tag`, `changeRequest`. Skip deploy stages on feature branches.

---

### Timeout, retry & catchError patterns

```groovy
options {
  timeout(time: 30, unit: 'MINUTES')
  retry(2)
}
```

`catchError` marks stage unstable instead of failing whole pipeline — use sparingly for non-critical checks.

---

### Environment block & withEnv

```groovy
environment {
  APP_ENV = 'staging'
  CREDS = credentials('my-secret-id')
}
```

`withEnv(['FOO=bar']) { ... }` for temporary vars. Inject secrets via credentials binding, never echo secrets (Jenkins masks known credential patterns).

---

**📌 Jenkins — Agents, Labels & Scaling**

### Static agents vs ephemeral agents

**Static** — always-on VM/agent connected via SSH/JNLP. **Ephemeral** — spun per build (Docker, K8s pod), destroyed after. Ephemeral improves isolation and reproducibility.

---

### Agent labels & node allocation

```groovy
agent { label 'docker && linux' }
```

Jobs queue until matching agent available. **Executor starvation** — too few executors, long queue. Scale agents horizontally.

---

### Docker agents (agent { docker { image } })

```groovy
agent {
  docker { image 'node:20-alpine' }
}
```

Build runs inside container on Docker-capable agent. Reproducible toolchain; pull image cost on cold start.

---

### Kubernetes dynamic agents (pod templates — overview)

Define pod YAML template — Jenkins creates pod per build with containers (jnlp + build tools). Best for elastic scale on K8s clusters.

---

### Tool installers (JDK, Maven, Node on agents)

Global Tool Configuration + `tools { jdk 'jdk17'; maven 'm3.9' }` in Pipeline. Prefer container images with tools preinstalled for consistency.

---

### Agent resource limits & queue buildup

Monitor queue length, executor utilization. Long-running integration tests block executors — use dedicated agent pools or separate Jenkins instances for heavy vs light jobs.

---

### Offline agents & executor starvation

Agent disconnects → builds queue. Alert on offline agents. Use **retention** and **auto-scaling** for cloud agents.

---

### Shared workspaces vs clean checkout

`skipDefaultCheckout` or reuse workspace for speed risks **dirty tree** from previous failed build. Prefer clean checkout for release builds; cache dependencies separately (Maven `.m2`, npm cache).

---

**📌 Jenkins — Credentials, Security & Operations**

### Credentials binding (username/password, secret text, SSH keys)

Jenkins Credentials plugin stores secrets encrypted. Types: Secret text, Username/password, SSH key, Secret file, Certificate.

---

### withCredentials & credentials() in Pipeline

```groovy
withCredentials([string(credentialsId: 'api-key', variable: 'API_KEY')]) {
  sh 'curl -H "Authorization: $API_KEY" ...'
}
```

Or `environment { API_KEY = credentials('api-key') }`. Never `echo $API_KEY`.

---

### Folder-scoped credentials & least privilege

Organize jobs in folders; scope credentials to folder/team. Prod deploy credentials only on prod folder jobs.

---

### Role-Based Access Control (RBAC — overview)

Role-based Strategy plugin: Admin, Developer, Read-only on folders. Restrict who can configure jobs, approve inputs, view secrets.

---

### CSRF & API token authentication

Use **API tokens** or credentials for programmatic access; enable CSRF protection for UI forms. Don't disable security for convenience.

---

### Audit log & who triggered builds

Track user who started build, SCM trigger, upstream cause. Important for compliance and incident response.

---

### Build retention & log rotation

Discard old builds (`buildDiscarder`) to save disk. Balance retention policy with debug needs.

---

### Plugin update risks & pinning versions

Test plugin updates in staging controller. Breaking changes in Pipeline Steps or Git plugin can halt all builds.

---

### Securing Jenkins controller (no anonymous admin)

Disable anonymous read if sensitive; restrict script approval; don't run controller as root; keep Jenkins updated; use HTTPS.

---

**📌 Jenkins — Advanced Patterns**

### Multibranch Pipeline & branch sources

One job discovers **all branches** from Git; each branch gets own Pipeline from Jenkinsfile in repo. Automatic branch/PR builds.

---

### Pull Request / Change Request triggers (Bitbucket/GitHub)

Branch Source plugin builds PRs and reports status back to SCM. "Build PR → merge if green" workflow.

---

### Shared Libraries (@Library, vars/, src/)

Reusable Groovy functions:

```groovy
@Library('my-shared-lib@v2') _
pipeline {
  stages { stage('Build') { steps { myBuildSteps.run() } } }
}
```

`vars/myBuildSteps.groovy` — global steps; `src/` — Groovy classes. Version libraries with tags.

---

### Global Pipeline Libraries vs folder libraries

Global — available everywhere (careful with breaking changes). Folder-scoped — team isolation.

---

### Parameterized builds (string, choice, boolean)

```groovy
parameters {
  choice(name: 'ENV', choices: ['dev', 'staging', 'prod'])
}
```

Triggered manually or by API with params. Useful for deploy workflows.

---

### Upstream/downstream job triggers

`build job: 'deploy-staging', wait: true` — orchestrate multi-repo or multi-stage releases. Prefer single pipeline when possible to reduce coupling.

---

### Archive artifacts & fingerprinting

`archiveArtifacts artifacts: 'target/*.jar'` — store build outputs on controller. **Fingerprint** tracks which jar went to which deploy job.

---

### Stash / unstash for cross-agent file transfer

```groovy
stash name: 'build', includes: 'target/**'
// later on another agent
unstash 'build'
```

When stages run on different agents, stash passes files (size limits apply).

---

### Blue Ocean UI (overview)

Modern pipeline visualization. Optional; Declarative Pipeline remains the source of truth.

---

### Jenkins vs GitHub Actions — when to use which

| Jenkins | GitHub Actions |
|---|---|
| On-prem, full control, complex enterprise integrations | Native to GitHub, zero infra for public/small teams |
| Heavy customization, shared libs, multibranch legacy | Marketplace actions, OIDC to cloud, PR-first |
| Requires ops to maintain controller/agents | Minutes pricing, runner management for scale |

Many orgs: **GHA for app repos**, **Jenkins for legacy or air-gapped** environments.

---

**📌 GitHub Actions — Workflows & Triggers**

### Workflow, job, step, action hierarchy

```
Workflow (.yml)
  └─ Job(s) — runs on runner, isolated VM
       └─ Step(s) — shell commands or uses: action
            └─ Action — reusable unit (composite/docker/js)
```

---

### on: push, pull_request, schedule, workflow_dispatch

```yaml
on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 6 * * 1'
  workflow_dispatch:
```

`pull_request` runs on PR events (open, sync). `workflow_dispatch` — manual button with optional inputs.

---

### Branch & path filters (paths, paths-ignore)

```yaml
on:
  push:
    paths:
      - 'terraform/**'
      - '.github/workflows/terraform.yml'
```

Skip CI when only docs change — saves minutes and noise.

---

### Concurrency groups & cancel-in-progress

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true
```

Only one deploy per branch; cancel outdated runs on new push.

---

### Workflow permissions (permissions: block)

```yaml
permissions:
  contents: read
  id-token: write   # OIDC
  pull-requests: write
```

Default GITHUB_TOKEN is overly broad in old repos — **least privilege** explicitly.

---

### Reusable workflows (workflow_call)

Centralize deploy logic:

```yaml
# deploy.yml
on:
  workflow_call:
    inputs:
      environment: { required: true, type: string }
```

Caller: `uses: org/repo/.github/workflows/deploy.yml@v1`.

---

### workflow_run & repository_dispatch triggers

Chain workflows after another completes, or trigger via external webhook/API (`repository_dispatch`) for integration with external systems.

---

### Environments & protection rules

GitHub **Environments** (staging, production) with **required reviewers**, **wait timer**, **deployment branches**. Secrets scoped per environment.

---

### Manual approvals via environment reviewers

Prod deploy job: `environment: production` — workflow pauses until designated reviewers approve in GitHub UI.

---

**📌 GitHub Actions — Jobs, Runners & Execution**

### runs-on: ubuntu-latest, self-hosted labels

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
```

Self-hosted: `runs-on: [self-hosted, linux, gpu]` for special hardware or private network access.

---

### Job dependencies (needs:)

```yaml
jobs:
  test: ...
  deploy:
    needs: test
```

DAG execution — deploy only after test succeeds. Parallel jobs without `needs` start together.

---

### Matrix strategy (matrix, include, exclude)

```yaml
strategy:
  matrix:
    node: [18, 20]
    os: [ubuntu-latest, windows-latest]
  fail-fast: false
```

`include`/`exclude` fine-tune combinations. `max-parallel` limits concurrency.

---

### Job outputs & step outputs

```yaml
jobs:
  build:
    outputs:
      version: ${{ steps.meta.outputs.version }}
    steps:
      - id: meta
        run: echo "version=1.2.3" >> $GITHUB_OUTPUT
```

Pass data between jobs via `needs.build.outputs.version`.

---

### Fail-fast vs continue-on-error

Matrix `fail-fast: true` — cancel siblings on first failure. Step `continue-on-error: true` — mark step failed but continue (use for optional lint).

---

### GitHub-hosted vs self-hosted runners

**GitHub-hosted** — managed, clean VM each job, internet access, minute billing. **Self-hosted** — your VM/K8s, access to private resources, you patch and secure them.

---

### Runner groups, labels & autoscaling (overview)

Enterprise: runner groups control repo access. Autoscale self-hosted with ARC (Actions Runner Controller) on Kubernetes.

---

### Container jobs (container: image)

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    container: node:20
    steps: ...
```

Steps run inside container; runner mounts workspace. Good for consistent toolchain.

---

### Service containers for integration tests

```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_PASSWORD: test
    ports:
      - 5432:5432
```

Ephemeral DB/Redis for integration tests alongside job container.

---

### Job timeouts & max execution time

```yaml
jobs:
  build:
    timeout-minutes: 30
```

Prevents hung jobs burning minutes. Org-level max limits also apply.

---

**📌 GitHub Actions — Actions, Secrets & Caching**

### Using marketplace actions (pin SHA vs tag)

```yaml
- uses: actions/checkout@v4
# Better for supply chain:
- uses: actions/checkout@b4ffde65f46336ab88eb53be7084771d77aae1f9 # v4.1.1
```

Pin **commit SHA** for third-party actions to avoid tag retag attacks.

---

### Composite actions (action.yml)

Bundle multiple steps into reusable action in same repo:

```yaml
# action.yml
runs:
  using: composite
  steps:
    - run: npm ci
      shell: bash
```

---

### JavaScript vs Docker actions

**JS** — runs on runner directly (fast). **Docker** — packaged environment (consistent, slower startup). Choose based on dependencies.

---

### Repository & organization secrets

Secrets in repo/org settings; available as `${{ secrets.MY_SECRET }}`. Not logged (masked). Fork PRs from untrusted contributors **don't** get secrets (security).

---

### Environment-scoped secrets

Production DB password only in `production` environment — not available to PR workflows from feature branches.

---

### GITHUB_TOKEN permissions & least privilege

Auto-generated per workflow run. Restrict with top-level `permissions:`. Don't use as long-lived credential — it expires when job ends.

---

### OIDC federation to AWS (no long-lived keys)

```yaml
permissions:
  id-token: write
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123:role/github-deploy
    aws-region: us-east-1
```

Short-lived credentials via trust policy on IAM role — **preferred over static AWS keys in secrets**.

---

### actions/cache for dependencies

Cache npm/Maven/Gradle by lockfile hash key. Speeds up builds; cache miss on dependency change. Not shared across branches perfectly — acceptable tradeoff.

---

### actions/upload-artifact & download-artifact

Pass build outputs between jobs or retain for download:

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: package
    path: dist/
```

Retention days limited; not for long-term artifact storage — use S3/GHCR for releases.

---

### Dependabot for Actions updates (overview)

Dependabot opens PRs to bump action versions. Review and merge to stay patched.

---

**📌 GitHub Actions — CI/CD Patterns**

### Build & test on PR, deploy on merge to main

```yaml
on:
  pull_request:  # ci.yml — test only
on:
  push:
    branches: [main]  # deploy.yml
```

Separate workflows or conditional jobs with `if: github.ref == 'refs/heads/main'`.

---

### Tag-triggered release workflows

```yaml
on:
  push:
    tags: ['v*.*.*']
```

Build release artifact, create GitHub Release, push Docker image with semver tag.

---

### Multi-environment deploy with environments

Sequential jobs: deploy staging → smoke → approval → deploy prod, each with `environment:` for secrets and gates.

---

### Reusable workflow for Terraform plan/apply

Org standard: `terraform-plan.yml` on PR (read-only), `terraform-apply.yml` on main with environment protection.

---

### Docker build & push (GHCR / ECR)

```yaml
- uses: docker/build-push-action@v5
  with:
    push: true
    tags: ghcr.io/org/app:${{ github.sha }}
```

Login via `docker/login-action` with GITHUB_TOKEN or OIDC to ECR.

---

### Terraform plan on PR, apply on merge pattern

PR workflow: `terraform plan -no-color` → comment on PR. Merge to main: `terraform apply -auto-approve` with prod credentials (gated). **Never apply from unreviewed PR branches with prod creds.**

---

### Secrets scanning & code scanning integration

Enable GitHub Advanced Security / secret scanning push protection. Block commits containing AWS keys. CodeQL for SAST in workflow.

---

### Workflow badges & run summaries

README badges show build status. `$GITHUB_STEP_SUMMARY` markdown for plan output in job summary tab.

---

### Debugging failed workflows (logs, tmate — overview)

Download logs; re-run with debug logging (`ACTIONS_STEP_DEBUG`). `mxschmitt/action-tmate` for SSH debug session (secure carefully).

---

### Cost & minute limits on private repos

GitHub-hosted minutes consume quota; cache and path filters save cost. Larger runners cost more. Self-hosted for heavy workloads.

---

**📌 Terraform — IaC Fundamentals**

### Infrastructure as Code principles (declarative, idempotent)

Describe **desired state**; tool reconciles reality. Same config → same outcome. Changes are **reviewed diffs**, not runbooks. Version control is source of truth.

---

### Terraform vs CloudFormation vs Pulumi (interview)

| Tool | Notes |
|---|---|
| **Terraform** | Multi-cloud HCL; large provider ecosystem; state file |
| **CloudFormation** | AWS-native; JSON/YAML; stack state in AWS |
| **Pulumi** | Real programming languages; state similar to TF |

Pick Terraform when **multi-cloud** or team standard; CFN when AWS-only and deep AWS integration needed.

---

### HCL syntax: resources, data sources, providers

```hcl
terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.region
}

resource "aws_s3_bucket" "logs" {
  bucket = var.bucket_name
}
```

**Resource** — managed object. **Data source** — read existing. **Provider** — API plugin.

---

### terraform init, plan, apply, destroy lifecycle

1. **init** — download providers, configure backend
2. **plan** — diff desired vs state
3. **apply** — execute changes
4. **destroy** — tear down managed resources

CI runs: `fmt` → `validate` → `plan` (PR) → `apply` (merge, gated).

---

### Execution plan reading (add, change, destroy)

```
# aws_s3_bucket.logs will be created
+ resource "aws_s3_bucket" "logs" { ... }

# aws_instance.app will be updated in-place
~ resource "aws_instance" "app" { ... }

# aws_security_group.old will be destroyed
- resource "aws_security_group" "old" { ... }
```

Watch for unexpected **destroy** — especially on replace (`-/+` forces replacement).

---

### Provider configuration & version constraints

Pin provider versions in `required_providers`. `~> 5.0` allows 5.x patches. Run `terraform init -upgrade` deliberately, not accidentally in prod CI.

---

### Resource addressing (type.name.attribute)

Reference: `aws_s3_bucket.logs.id`, `aws_instance.app[0].private_ip`. Outputs expose values to other modules/stacks.

---

### depends_on & implicit dependencies

Terraform infers deps from references (`bucket = aws_s3_bucket.logs.id`). Explicit `depends_on` when ordering needed but no attribute reference (e.g. IAM propagation delay).

---

### .terraform.lock.hcl & provider pinning

Commit lock file — ensures same provider binaries across team/CI. `terraform providers lock` for cross-platform.

---

### Terraform project layout conventions

```
envs/
  prod/
    main.tf
    variables.tf
    terraform.tfvars
modules/
  vpc/
    main.tf
    variables.tf
    outputs.tf
```

Root module calls child modules; env dirs separate state/backends.

---

**📌 Terraform — State Management**

### State file purpose & sensitivity

State maps config addresses to **real resource IDs**, tracks metadata, enables drift detection. Contains **sensitive values** — treat as secret. Corrupt state = painful recovery.

---

### Local state vs remote state

Local `terraform.tfstate` — solo dev only. **Remote backend** (S3, Terraform Cloud) — team collaboration, locking, encryption.

---

### S3 backend + DynamoDB locking (AWS pattern)

```hcl
terraform {
  backend "s3" {
    bucket         = "my-tf-state"
    key            = "prod/vpc/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

State in S3; DynamoDB provides **lock** during apply.

---

### State locking & concurrent apply prevention

Two applies simultaneously → second fails with lock error. If CI crashes, **force-unlock** only after verifying no running apply (`terraform force-unlock`).

---

### terraform state list, mv, rm (careful operations)

- **list** — resources in state
- **mv** — rename address without destroy/recreate
- **rm** — remove from state without destroying cloud resource (orphan risk)

Use for refactoring; always backup state first.

---

### State drift detection (plan shows drift)

Manual changes in console → next plan shows diff. Terraform wants to **revert** drift to match code. Policy: no manual prod changes, or import/adopt intentionally.

---

### Import existing resources (terraform import)

Bring existing AWS resource under management:

```bash
terraform import aws_s3_bucket.logs my-bucket-name
```

Write matching config first or after; import only binds state.

---

### Moved blocks & refactoring state (Terraform 1.1+)

```hcl
moved {
  from = aws_instance.old
  to   = aws_instance.new
}
```

Safer refactors without destroy/recreate when only name changed.

---

### State encryption at rest

S3 SSE-S3 or SSE-KMS. Restrict IAM to state bucket. Enable versioning on state bucket for accidental overwrite recovery.

---

### Never commit state to git (interview stance)

`.gitignore` `*.tfstate*`. Leaked state = leaked infrastructure map + secrets. Use remote backend with access control.

---

**📌 Terraform — Variables, Outputs & Modules**

### Input variables (type, default, validation)

```hcl
variable "instance_count" {
  type        = number
  default     = 2
  description = "Number of app instances"
  validation {
    condition     = var.instance_count >= 1 && var.instance_count <= 10
    error_message = "Must be between 1 and 10."
  }
}
```

---

### Output values & sensitive outputs

```hcl
output "lb_dns" {
  value = aws_lb.main.dns_name
}

output "db_password" {
  value     = aws_db_instance.main.password
  sensitive = true
}
```

Outputs feed other stacks via `terraform_remote_state` or CI scripts.

---

### locals block for computed values

```hcl
locals {
  name_prefix = "${var.project}-${var.env}"
  common_tags = { Project = var.project, Env = var.env }
}
```

DRY without polluting input variables.

---

### tfvars files & environment-specific values

`terraform.tfvars`, `prod.tfvars`:

```hcl
instance_count = 5
region         = "us-east-1"
```

Pass: `terraform apply -var-file=prod.tfvars`. Don't put secrets in tfvars in git — use `-var` from CI secret or SSM.

---

### Module structure (main.tf, variables.tf, outputs.tf)

Module = reusable package of resources. **Inputs** via variables; **outputs** expose IDs/endpoints to parent.

---

### Module sources (local, registry, git)

```hcl
module "vpc" {
  source = "../../modules/vpc"
  # or source = "terraform-aws-modules/vpc/aws"
  # or source = "git::https://github.com/org/modules.git//vpc?ref=v1.2.0"
}
```

Pin git refs and registry versions.

---

### Composition vs monolithic root module

Compose small modules (vpc, eks, rds) in env root. Monolith hard to test and reuse. Clear module boundaries = team ownership.

---

### Module versioning & semver tags

Publish internal modules with git tags `v1.0.0`. Consumers pin `?ref=v1.0.0`. Breaking changes → major bump.

---

### Root module vs child module responsibilities

Root wires modules, sets backend, passes env vars. Child modules encapsulate one concern; no backend in child.

---

### Variable precedence (CLI > env > tfvars > default)

`TF_VAR_region` env, `-var`, `-var-file`, default in variable block. Document for team which source wins.

---

**📌 Terraform — Resources, Lifecycle & Operations**

### Lifecycle meta-arguments (create_before_destroy)

```hcl
resource "aws_instance" "app" {
  lifecycle {
    create_before_destroy = true
  }
}
```

Create replacement before destroy — reduces downtime for resources that can't update in-place.

---

### prevent_destroy & ignore_changes

```hcl
lifecycle {
  prevent_destroy = true
  ignore_changes  = [tags["LastModified"]]
}
```

`prevent_destroy` — accidental destroy blocked. `ignore_changes` — stop fighting external tag updates (use carefully).

---

### replace_triggered_by (overview)

Force replacement when unrelated resource changes (Terraform 1.2+). Niche; prefer explicit taint or version triggers.

---

### Data sources vs managed resources

```hcl
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
}
```

Read-only lookup — not destroyed by Terraform. Use for existing VPC, AMI, caller identity.

---

### Count vs for_each (prefer for_each)

```hcl
resource "aws_instance" "app" {
  for_each = toset(var.instance_names)
  tags     = { Name = each.key }
}
```

`for_each` stable keys — rename without destroy cascade. `count` index-based — fragile on reorder.

---

### Dynamic blocks for nested repeated config

```hcl
dynamic "ingress" {
  for_each = var.allowed_ports
  content {
    from_port = ingress.value
    to_port   = ingress.value
    protocol  = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

Generate repeated nested blocks from variables.

---

### Provisioners — last resort (local-exec, remote-exec)

Run scripts on create — brittle, not declarative. Prefer **user_data**, **cloud-init**, or configuration management. If used, understand they break idempotency expectations.

---

### Null resource patterns for triggers

`null_resource` with `local-exec` triggered by `triggers` map — legacy pattern for scripts; prefer proper resources or external CI steps.

---

### Targeted apply (-target) risks

`terraform apply -target=aws_instance.app` — partial apply can break dependencies; leave inconsistent state. Emergency only; follow with full plan.

---

### Refresh-only plan (terraform apply -refresh-only)

Update state from real infrastructure without changing resources — reconcile state after external read.

---

**📌 Terraform — Workspaces, Environments & Collaboration**

### Terraform workspaces (same code, different state)

```bash
terraform workspace select prod
terraform workspace select dev
```

Same backend, different state key per workspace. Lightweight env separation; **not** strong isolation (same code dir).

---

### Workspace vs separate directories for envs

| Approach | When |
|---|---|
| **Workspaces** | small teams, similar envs, shared module code |
| **Separate dirs** (`envs/prod`, `envs/dev`) | different backends, IAM, provider aliases — **preferred at scale** |

Interview: workspaces ≠ AWS accounts; use separate state keys/backends per account for prod isolation.

---

### Backend config per environment

Prod state bucket with stricter IAM; dev separate bucket or prefix. `-backend-config` partial config for CI.

---

### Terraform Cloud / HCP Terraform (remote runs — overview)

Remote execution, state, run history, PR speculative plans, policy checks. Alternative to self-managed S3 backend + Jenkins/GHA.

---

### Policy as Code (Sentinel / OPA — overview)

Block plans that create public S3 buckets or open SG rules. Enforce org standards before apply.

---

### Run triggers & speculative plans on PRs

VCS integration posts plan output on PR. Same pattern achievable with GHA + `terraform plan` comment.

---

### Team workflows: plan in CI, apply gated

**Everyone** runs plan on PR. **Only** main branch / approved role runs apply. Separate IAM: plan=Read, apply=Write.

---

### .gitignore for .terraform/ and *.tfstate*

Standard ignore: `.terraform/`, `*.tfstate`, `*.tfstate.backup`, `.terraform.lock.hcl` is **committed** (exception).

---

### Code review checklist for Terraform PRs

Check: unexpected destroys/replaces, security group rules, public exposure, provider version bump, module pin change, variable defaults affecting prod.

---

### Tagging strategy via default_tags (AWS provider)

```hcl
provider "aws" {
  default_tags {
    tags = {
      ManagedBy = "Terraform"
      Project   = var.project
    }
  }
}
```

Consistent cost allocation and ownership.

---

**📌 Terraform — Testing, Security & Production Patterns**

### terraform fmt & validate in CI

```bash
terraform fmt -check -recursive
terraform validate
```

Format consistency; validate syntax without cloud creds (after init).

---

### tflint & checkov / tfsec static analysis

Lint AWS-specific mistakes (invalid instance types, missing encryption). Security scanners flag open ports, unencrypted S3. Run in PR pipeline.

---

### Terratest (Go integration tests — overview)

Apply to ephemeral env, assert outputs, destroy. Heavy but high confidence for modules.

---

### Module registry & private registry

Terraform Registry for public modules; Terraform Cloud private registry for internal modules with versioning.

---

### Secrets in Terraform (never in code — use vars/SSM/Vault)

Pass secrets via `TF_VAR_db_password` from CI secret store. Use `sensitive = true`. Consider **ephemeral values** (Terraform 1.10+) where supported.

---

### IAM least privilege for CI apply role

Apply role: only required actions on required resource ARNs. Plan role: ReadOnly. No AdministratorAccess for automation.

---

### Separate plan and apply IAM roles

PR workflow assumes plan role. Main branch apply assumes deploy role with write — can't apply from fork PR.

---

### Handling secrets with SSM Parameter Store / Secrets Manager

```hcl
data "aws_ssm_parameter" "db_password" {
  name = "/app/prod/db_password"
}
```

Or manage secret resource and reference version — avoid plaintext in state when possible (use write-only or external rotation).

---

### Multi-region & multi-account patterns (overview)

Provider aliases, separate state per account, AWS Organizations, SCPs. Hub-spoke networking — module composition across states via remote state outputs.

---

### Disaster recovery: state backup & restore

S3 versioning on state bucket; regular exports; document `force-unlock` and import procedures. Practice restore in drill.

---

**📌 End-to-End Patterns & Interview Scenarios**

### Full pipeline: commit → test → build image → Terraform apply

```
Developer PR → GHA: lint/test/plan → merge
→ GHA: build Docker image → push ECR with SHA tag
→ terraform apply (updates ECS/EKS/ASG to new tag)
→ smoke test → notify
```

Single thread: **artifact is image tag**; infra code references tag variable.

---

### Jenkins pipeline calling Terraform vs dedicated GHA workflow

Jenkins can run `sh 'terraform apply'` with credentials binding. GHA often cleaner for Terraform + OIDC. Split: Jenkins builds legacy apps; GHA handles infra — or unify on one platform to reduce credential sprawl.

---

### PR checks: terraform plan comment bot pattern

Plan output posted as PR comment (actions like `dflook/terraform-plan` or custom script). Reviewers see infra diff alongside code diff. Require plan success before merge.

---

### Promoting same artifact across environments

Build once in CI; deploy `image:abc123` to staging; after validation, deploy **same** `abc123` to prod — only Terraform tfvars/env changes (replicas, instance size).

---

### Rolling back application vs rolling back infrastructure

**App rollback** — redeploy previous image (minutes). **Infra rollback** — `terraform apply` previous git commit or revert PR; may **recreate** resources (DNS change, ASG). Test infra changes in staging; prefer **backward-compatible** app changes for fast rollback.

---

### Handling state lock failures in CI

Build failed mid-apply → lock held. Verify no running job; then `terraform force-unlock LOCK_ID`. Prevent with job concurrency group (one apply at a time per state).

---

### Blue-green at infra level (ASG, target groups)

Terraform manages two ASGs or weighted target groups; flip traffic variable from blue to green. Combine with application deployment strategy.

---

### Pipeline failure modes (flaky tests, partial apply)

Flaky tests → false red → trust erosion. Fix or quarantine. Partial apply → broken infra — use state backup, `-target` recovery carefully, or destroy/recreate in dev. **Always** have plan artifact from last good apply.

---

### Choosing Jenkins vs GitHub Actions for an org

Consider: GitHub as SCM (GHA natural fit), on-prem requirement (Jenkins), existing Jenkins investment, compliance (self-hosted runners in VPC), multirepo reusable workflows vs Shared Libraries.

---

### Common CI/CD & Terraform interview traps

- "We CI/CD" but only build, no automated deploy
- Storing AWS keys in Jenkins/GHA instead of OIDC
- Committing `.tfstate` or secrets in tfvars
- Running `terraform apply` on every PR with prod creds
- No concurrency control → double apply corrupts state
- Rebuilding artifacts per environment instead of promoting
- Ignoring `prevent_destroy` on stateful resources (RDS)
- Jenkins controller running all builds (no agents)
- Unpinned third-party GitHub Actions (supply chain)

---

## How to use this guide

- Walk each checkbox in `CI/CD & Infrastructure as Code Topics.md` and explain it aloud before reading the matching section.
- Connect the three tools: **GHA/Jenkins orchestrates**; **Terraform provisions**; **deployment strategies** decide how apps roll out on that infra.
- For interviews, always mention **secrets/OIDC**, **immutable artifacts**, **plan before apply**, and **environment gates** — that's where senior engineers differentiate.
- Rebuild a mental flow: PR → test → plan (Terraform) → merge → build artifact → apply (gated) → smoke → observe.

Good luck with prep.
