# CI/CD & Infrastructure as Code

**📌 CI/CD Fundamentals & Pipeline Design**
- [] CI vs CD vs Continuous Deployment — definitions
- [] Build, test, deploy pipeline stages
- [] Pipeline as code vs UI-defined pipelines
- [] Artifact immutability & versioning
- [] Environment promotion (dev → staging → prod)
- [] Git branching strategies for CI/CD (trunk, GitFlow, release branches)
- [] Fail fast & shift-left testing
- [] Idempotent deployments & rollback mindset
- [] Configuration vs secrets separation
- [] Deployment frequency & DORA metrics (overview)

**📌 Deployment Strategies & Release Engineering**
- [] Rolling deployments
- [] Blue-green deployments
- [] Canary releases & traffic splitting
- [] Feature flags vs deployment decoupling
- [] Database migration in CI/CD pipelines
- [] Rollback strategies (redeploy, revert, feature flag)
- [] Immutable infrastructure concept
- [] Release tagging & semantic versioning
- [] Change windows & approval gates
- [] Post-deploy smoke tests & health checks

**📌 Jenkins — Architecture & Core Concepts**
- [] Jenkins controller vs agents (executors)
- [] Jobs vs Pipeline jobs
- [] Declarative vs Scripted Pipeline (Jenkinsfile)
- [] Workspace, build number & BUILD_ID
- [] Jenkins plugins ecosystem
- [] Freestyle vs Pipeline — when to use which
- [] Jenkins home & configuration persistence
- [] High availability & controller backup (overview)
- [] Jenkins on Kubernetes (agents via K8s plugin — overview)

**📌 Jenkins — Pipelines & Execution**
- [] Jenkinsfile structure (agent, stages, steps, post)
- [] Declarative pipeline syntax (pipeline, stage, steps)
- [] Scripted pipeline (node, stage) — basic understanding
- [] Parallel stages & failFast
- [] Matrix / axes builds (Declarative matrix)
- [] Input steps & manual approval gates
- [] Post actions (always, success, failure, unstable)
- [] when / unless conditions in stages
- [] Timeout, retry & catchError patterns
- [] Environment block & withEnv

**📌 Jenkins — Agents, Labels & Scaling**
- [] Static agents vs ephemeral agents
- [] Agent labels & node allocation
- [] Docker agents (agent { docker { image } })
- [] Kubernetes dynamic agents (pod templates — overview)
- [] Tool installers (JDK, Maven, Node on agents)
- [] Agent resource limits & queue buildup
- [] Offline agents & executor starvation
- [] Shared workspaces vs clean checkout

**📌 Jenkins — Credentials, Security & Operations**
- [] Credentials binding (username/password, secret text, SSH keys)
- [] withCredentials & credentials() in Pipeline
- [] Folder-scoped credentials & least privilege
- [] Role-Based Access Control (RBAC — overview)
- [] CSRF & API token authentication
- [] Audit log & who triggered builds
- [] Build retention & log rotation
- [] Plugin update risks & pinning versions
- [] Securing Jenkins controller (no anonymous admin)

**📌 Jenkins — Advanced Patterns**
- [] Multibranch Pipeline & branch sources
- [] Pull Request / Change Request triggers (Bitbucket/GitHub)
- [] Shared Libraries (@Library, vars/, src/)
- [] Global Pipeline Libraries vs folder libraries
- [] Parameterized builds (string, choice, boolean)
- [] Upstream/downstream job triggers
- [] Archive artifacts & fingerprinting
- [] Stash / unstash for cross-agent file transfer
- [] Blue Ocean UI (overview)
- [] Jenkins vs GitHub Actions — when to use which

**📌 GitHub Actions — Workflows & Triggers**
- [] Workflow, job, step, action hierarchy
- [] on: push, pull_request, schedule, workflow_dispatch
- [] Branch & path filters (paths, paths-ignore)
- [] Concurrency groups & cancel-in-progress
- [] Workflow permissions (permissions: block)
- [] Reusable workflows (workflow_call)
- [] workflow_run & repository_dispatch triggers
- [] Environments & protection rules
- [] Manual approvals via environment reviewers

**📌 GitHub Actions — Jobs, Runners & Execution**
- [] runs-on: ubuntu-latest, self-hosted labels
- [] Job dependencies (needs:)
- [] Matrix strategy (matrix, include, exclude)
- [] Job outputs & step outputs
- [] Fail-fast vs continue-on-error
- [] GitHub-hosted vs self-hosted runners
- [] Runner groups, labels & autoscaling (overview)
- [] Container jobs (container: image)
- [] Service containers for integration tests
- [] Job timeouts & max execution time

**📌 GitHub Actions — Actions, Secrets & Caching**
- [] Using marketplace actions (pin SHA vs tag)
- [] Composite actions (action.yml)
- [] JavaScript vs Docker actions
- [] Repository & organization secrets
- [] Environment-scoped secrets
- [] GITHUB_TOKEN permissions & least privilege
- [] OIDC federation to AWS (no long-lived keys)
- [] actions/cache for dependencies
- [] actions/upload-artifact & download-artifact
- [] Dependabot for Actions updates (overview)

**📌 GitHub Actions — CI/CD Patterns**
- [] Build & test on PR, deploy on merge to main
- [] Tag-triggered release workflows
- [] Multi-environment deploy with environments
- [] Reusable workflow for Terraform plan/apply
- [] Docker build & push (GHCR / ECR)
- [] Terraform plan on PR, apply on merge pattern
- [] Secrets scanning & code scanning integration
- [] Workflow badges & run summaries
- [] Debugging failed workflows (logs, tmate — overview)
- [] Cost & minute limits on private repos

**📌 Terraform — IaC Fundamentals**
- [] Infrastructure as Code principles (declarative, idempotent)
- [] Terraform vs CloudFormation vs Pulumi (interview)
- [] HCL syntax: resources, data sources, providers
- [] terraform init, plan, apply, destroy lifecycle
- [] Execution plan reading (add, change, destroy)
- [] Provider configuration & version constraints
- [] Resource addressing (type.name.attribute)
- [] depends_on & implicit dependencies
- [] .terraform.lock.hcl & provider pinning
- [] Terraform project layout conventions

**📌 Terraform — State Management**
- [] State file purpose & sensitivity
- [] Local state vs remote state
- [] S3 backend + DynamoDB locking (AWS pattern)
- [] State locking & concurrent apply prevention
- [] terraform state list, mv, rm (careful operations)
- [] State drift detection (plan shows drift)
- [] Import existing resources (terraform import)
- [] Moved blocks & refactoring state (Terraform 1.1+)
- [] State encryption at rest
- [] Never commit state to git (interview stance)

**📌 Terraform — Variables, Outputs & Modules**
- [] Input variables (type, default, validation)
- [] Output values & sensitive outputs
- [] locals block for computed values
- [] tfvars files & environment-specific values
- [] Module structure (main.tf, variables.tf, outputs.tf)
- [] Module sources (local, registry, git)
- [] Composition vs monolithic root module
- [] Module versioning & semver tags
- [] Root module vs child module responsibilities
- [] Variable precedence (CLI > env > tfvars > default)

**📌 Terraform — Resources, Lifecycle & Operations**
- [] Lifecycle meta-arguments (create_before_destroy)
- [] prevent_destroy & ignore_changes
- [] replace_triggered_by (overview)
- [] Data sources vs managed resources
- [] Count vs for_each (prefer for_each)
- [] Dynamic blocks for nested repeated config
- [] Provisioners — last resort (local-exec, remote-exec)
- [] Null resource patterns for triggers
- [] Targeted apply (-target) risks
- [] Refresh-only plan (terraform apply -refresh-only)

**📌 Terraform — Workspaces, Environments & Collaboration**
- [] Terraform workspaces (same code, different state)
- [] Workspace vs separate directories for envs
- [] Backend config per environment
- [] Terraform Cloud / HCP Terraform (remote runs — overview)
- [] Policy as Code (Sentinel / OPA — overview)
- [] Run triggers & speculative plans on PRs
- [] Team workflows: plan in CI, apply gated
- [] .gitignore for .terraform/ and *.tfstate*
- [] Code review checklist for Terraform PRs
- [] Tagging strategy via default_tags (AWS provider)

**📌 Terraform — Testing, Security & Production Patterns**
- [] terraform fmt & validate in CI
- [] tflint & checkov / tfsec static analysis
- [] Terratest (Go integration tests — overview)
- [] Module registry & private registry
- [] Secrets in Terraform (never in code — use vars/SSM/Vault)
- [] IAM least privilege for CI apply role
- [] Separate plan and apply IAM roles
- [] Handling secrets with SSM Parameter Store / Secrets Manager
- [] Multi-region & multi-account patterns (overview)
- [] Disaster recovery: state backup & restore

**📌 End-to-End Patterns & Interview Scenarios**
- [] Full pipeline: commit → test → build image → Terraform apply
- [] Jenkins pipeline calling Terraform vs dedicated GHA workflow
- [] PR checks: terraform plan comment bot pattern
- [] Promoting same artifact across environments
- [] Rolling back application vs rolling back infrastructure
- [] Handling state lock failures in CI
- [] Blue-green at infra level (ASG, target groups)
- [] Pipeline failure modes (flaky tests, partial apply)
- [] Choosing Jenkins vs GitHub Actions for an org
- [] Common CI/CD & Terraform interview traps
