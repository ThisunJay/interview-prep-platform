# Docker & Kubernetes

A deep-dive companion to the Docker & Kubernetes checklist. Each heading matches the original outline; under every topic you'll find **what it is**, **why it exists**, **how it works**, and **interview-ready nuance**.

---

**📌 Container & Docker Fundamentals**

### Containers vs Virtual Machines

**VMs** virtualize hardware: each VM runs a full guest OS on a hypervisor. **Containers** virtualize the OS: processes share the host kernel but see isolated namespaces (PID, network, mount, etc.) and cgroups for resource limits.

| Aspect | VM | Container |
|---|---|---|
| Boot time | Minutes | Seconds |
| Footprint | GB (full OS) | MB (app + libs) |
| Isolation | Strong (hardware boundary) | Process-level (shared kernel) |
| Density | Lower | Higher |
| Use case | Legacy, strong isolation, mixed OS | Microservices, CI, cloud-native |

**Why interviews care:** Containers are not "lightweight VMs." They trade isolation for speed and density. Know when you still need VMs (different kernels, untrusted multi-tenant on same host without extra hardening).

---

### Docker architecture (CLI, daemon, containerd, runc)

**Docker CLI** talks to the **Docker daemon** (`dockerd`), which orchestrates images, networks, volumes, and containers. Modern stacks delegate runtime work:

```
docker CLI → dockerd → containerd → runc → container process
```

- **dockerd** — API, image build/pull, networking plugins
- **containerd** — image transfer, container lifecycle (industry standard)
- **runc** — OCI-compliant low-level container runner

**Interview nuance:** Kubernetes uses containerd/CRI-O directly — not dockerd on nodes (Docker removed as K8s runtime since 1.24). "Docker in K8s" usually means **building images with Docker**, not running dockerd on workers.

---

### Images vs containers

An **image** is an immutable, layered filesystem snapshot + metadata (entrypoint, env, exposed ports). A **container** is a **running instance** of an image — writable layer on top + isolated process tree.

```bash
docker build -t myapp:1.0 .    # image
docker run -d myapp:1.0        # container
```

Delete container → writable layer gone. Delete image → layers removed if unreferenced. Multiple containers can run from one image.

---

### OCI image & runtime specs

**Open Container Initiative (OCI)** defines portable standards:

- **Image spec** — manifest, config, layer tarballs (how images are packaged)
- **Runtime spec** — how to configure namespaces, cgroups, rootfs to run a container

Docker, containerd, Podman, CRI-O all converge on OCI. Interview line: *OCI decouples image format from runtime vendor lock-in.*

---

### Registries (Docker Hub, ECR, GCR, ACR)

A **registry** stores and distributes images by name:tag or digest.

| Registry | Typical use |
|---|---|
| Docker Hub | Public defaults, dev |
| Amazon ECR | AWS workloads |
| Google GCR / Artifact Registry | GCP |
| Azure ACR | Azure |

`docker push` / `docker pull` authenticate via login tokens or IAM (ECR get-login-password). Production: private registries, scan on push, lifecycle policies for old tags.

---

### Docker Desktop vs Linux engine (conceptual)

**Docker Desktop** — Mac/Windows GUI bundling Linux VM + dockerd for local dev. **Linux engine** — native dockerd on the host.

K8s local: minikube, kind, k3d run clusters inside Docker/containers. Know that Desktop resource limits (CPU/RAM) affect local perf; prod runs on Linux nodes.

---

**📌 Images & Dockerfile**

### Dockerfile instructions (FROM, RUN, COPY, ADD, CMD, ENTRYPOINT)

Core Dockerfile directives:

| Instruction | Purpose |
|---|---|
| `FROM` | Base image (required first stage) |
| `RUN` | Execute command at **build** time (new layer) |
| `COPY` | Copy files from build context |
| `ADD` | COPY + optional tar extract / URL (prefer COPY) |
| `CMD` | Default command at **run** time (overridable) |
| `ENTRYPOINT` | Fixed executable; `CMD` args append |

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

**ENTRYPOINT vs CMD:** `ENTRYPOINT` defines the binary; `CMD` supplies default args. `docker run img --flag` replaces CMD args, not ENTRYPOINT (unless `--entrypoint`).

---

### ENV, ARG, EXPOSE, WORKDIR, USER, HEALTHCHECK

| Instruction | Build vs run | Notes |
|---|---|---|
| `ARG` | Build-time only | Not in final env unless re-exported |
| `ENV` | Persists in image | Visible at runtime |
| `WORKDIR` | — | Sets cwd; creates dir if missing |
| `EXPOSE` | Documentation | Does not publish ports by itself |
| `USER` | Runtime | Drop root after setup |
| `HEALTHCHECK` | Runtime | Docker marks healthy/unhealthy |

```dockerfile
ARG VERSION=1.0
ENV APP_VERSION=$VERSION
USER 1000:1000
HEALTHCHECK --interval=30s CMD curl -f http://localhost:8080/health || exit 1
```

---

### Multi-stage builds

Multiple `FROM` stages in one Dockerfile — copy artifacts from build stage into minimal runtime stage.

```dockerfile
FROM golang:1.22 AS builder
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /bin/app .

FROM gcr.io/distroless/static
COPY --from=builder /bin/app /app
ENTRYPOINT ["/app"]
```

**Why:** Smaller attack surface, faster deploys, no compiler/toolchain in prod image. Interview favorite for Java (Maven stage → JRE slim) and Go/Rust static binaries.

---

### Layer caching & build optimization

Each Dockerfile instruction creates a **layer**. Cache hits skip rebuild until an invalidated line.

**Optimize:**
- Order from least → most frequently changing (`COPY package.json` before source)
- Combine RUN steps judiciously (fewer layers vs readability)
- Use `.dockerignore` to shrink context
- Pin base image digests for reproducibility
- Use BuildKit cache mounts for package managers (`RUN --mount=type=cache`)

Changing an early layer busts all later layers — structure matters.

---

### .dockerignore

Like `.gitignore` for the **build context** sent to the daemon. Exclude `node_modules`, `.git`, secrets, local `.env`, `target/`, `__pycache__`.

Smaller context → faster builds, fewer accidental secret leaks.

---

### Image tags, digests & immutability

- **Tag** — mutable label (`myapp:v1.2.3`, `latest`)
- **Digest** — content-addressable SHA256 (`myapp@sha256:abc…`) — immutable

Production deploy by **digest** or immutable semver tags. Never rely on `:latest` in prod. Promotion flow: dev tag → scan → promote same digest to prod.

---

### Base image selection (distroless, alpine, slim)

| Base | Tradeoff |
|---|---|
| `ubuntu` / `debian` | Familiar, larger, more CVE surface |
| `-slim` variants | Smaller, still glibc |
| `alpine` | Tiny, musl — watch compatibility |
| `distroless` | No shell/package manager — max minimalism |
| `scratch` | Empty — static binaries only |

Choose based on debugging needs vs security/size. Distroless + multi-stage is a strong interview answer for prod.

---

### BuildKit features (cache mounts, secrets)

**BuildKit** (`DOCKER_BUILDKIT=1`) enables parallel stages, cache mounts, secret mounts:

```dockerfile
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
RUN --mount=type=secret,id=pipconf,target=/etc/pip.conf ...
```

Secrets never persist in image layers. Cache mounts speed CI without bloating layers.

---

**📌 Container Runtime & Operations**

### docker run, ps, stop, rm, logs, exec

Essential commands:

```bash
docker run -d --name api -p 8080:8080 -e NODE_ENV=prod myapp:1.0
docker ps -a
docker logs -f api
docker exec -it api sh
docker stop api && docker rm api
```

Flags: `-d` detached, `--rm` auto-remove, `-v` volumes, `--network`, `--memory`, `--cpus`, `--restart`.

---

### Container lifecycle states

States: **created** → **running** → **paused** (optional) → **stopped/exited** → **removed**. `docker ps -a` shows exited containers until removed.

Restart policy can return **running** from **exited**. Understand `docker start` vs `docker run` (new container vs existing).

---

### Resource limits (CPU, memory)

Without limits, a container can consume host resources.

```bash
docker run --memory=512m --cpus=1.5 myapp
```

**Memory:** exceeding limit → OOM kill (exit 137). **CPU:** cgroup quota/throttle — not hard kill.

K8s uses `resources.requests/limits` — same concepts, cluster-wide scheduling.

---

### Restart policies

| Policy | Behavior |
|---|---|
| `no` | Default — don't restart |
| `on-failure` | Restart on non-zero exit |
| `always` | Always restart (including daemon restart) |
| `unless-stopped` | Like always unless manually stopped |

Use `on-failure` or `unless-stopped` for long-running services; not a substitute for orchestrator health management in K8s.

---

### Health checks (HEALTHCHECK / compose)

Docker `HEALTHCHECK` runs a probe inside the container; status: **starting**, **healthy**, **unhealthy**. Unhealthy containers can be restarted by orchestrators that respect Docker health (Swarm; Compose depends on config).

Compose:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/health"]
  interval: 10s
  retries: 3
```

K8s uses liveness/readiness probes — richer and first-class.

---

### Exit codes & debugging containers

Common exit codes: **0** success, **1** generic error, **137** SIGKILL/OOM, **139** segfault, **143** SIGTERM.

Debug workflow: `docker logs`, `docker inspect` (State, OOMKilled), `docker exec`, check CMD/ENTRYPOINT, env vars, missing files, wrong architecture (`exec format error`).

---

**📌 Docker Networking**

### Bridge, host, none, overlay networks

| Driver | Use |
|---|---|
| **bridge** | Default isolated network on single host |
| **host** | Container shares host network stack (no NAT) |
| **none** | No networking |
| **overlay** | Multi-host (Swarm/K8s CNI different mechanism) |

Default `bridge` gives NAT outbound; publish ports with `-p`.

---

### Port mapping (-p host:container)

```bash
docker run -p 8080:80 nginx    # host:container
docker run -p 127.0.0.1:8080:80 nginx  # bind localhost only
```

`-P` publishes all EXPOSEd ports to random host ports. Interview: container listens on **container port**; mapping connects host traffic.

---

### Custom bridge networks & DNS

User-defined bridge networks provide **automatic DNS** between containers by name:

```bash
docker network create app-net
docker run --network app-net --name db postgres
docker run --network app-net --name api myapp  # resolves "db"
```

Default bridge uses legacy `--link`; prefer custom networks.

---

### Container-to-container communication

Same custom network → L2 bridge, embedded DNS. Cross-host → overlay/Swarm or move to K8s Services.

Avoid hardcoding IPs; use service names. For host → container use mapped ports or `host.docker.internal` (Desktop).

---

### docker network inspect & connect

```bash
docker network inspect app-net
docker network connect app-net existing-container
```

Inspect shows containers, subnets, gateways. Connect/disconnect at runtime for ad-hoc wiring (prefer declarative Compose/K8s for prod).

---

**📌 Docker Storage**

### Volumes vs bind mounts vs tmpfs

| Type | Managed by | Persistence | Typical use |
|---|---|---|---|
| **Volume** | Docker | Yes (host path managed) | DB data, shared storage |
| **Bind mount** | User path | Host directory | Dev hot-reload config |
| **tmpfs** | Memory | No | secrets/cache ephemeral |

```bash
docker run -v pgdata:/var/lib/postgresql/data postgres
docker run -v $(pwd)/config.yml:/app/config.yml:ro myapp
```

---

### Named volumes & persistence

Named volumes survive container removal unless `-v` on `docker rm` deletes anonymous volumes explicitly. `docker volume create`, `docker volume ls`, backup via sidecar or host path access.

---

### Volume lifecycle & cleanup

Orphan volumes accumulate: `docker volume prune`. Named volumes need documented backup/restore (pg_dump, file snapshots). K8s PVCs solve similar problems with StorageClasses.

---

### Data patterns for stateful containers

Prefer **stateless containers** + external DB/object storage. When stateful: single-writer volumes, avoid scaling writable same volume without shared FS. K8s **StatefulSet** + PVC per pod for ordered stateful apps.

---

**📌 Docker Compose**

### docker-compose.yml structure (services, networks, volumes)

```yaml
services:
  api:
    build: .
    ports: ["8080:8080"]
    depends_on: [db]
  db:
    image: postgres:16
    volumes: [pgdata:/var/lib/postgresql/data]
volumes:
  pgdata:
networks:
  default:
    name: app-net
```

Compose v2: `docker compose up` (plugin). Defines multi-container apps as code.

---

### depends_on & service healthchecks

`depends_on` orders startup but **does not wait for app readiness** unless using `condition: service_healthy` (Compose spec v2+):

```yaml
depends_on:
  db:
    condition: service_healthy
```

Without health condition, API may crash-loop until DB accepts connections — use retries or wait scripts in dev.

---

### Environment variables & env files

```yaml
environment:
  NODE_ENV: production
env_file:
  - .env
```

Never commit secrets in `.env` to git. Prod secrets via Docker secrets (Swarm), K8s Secrets, or external vault.

---

### Compose profiles

Activate optional services with profiles:

```yaml
services:
  debug-tools:
    profiles: [debug]
    image: busybox
```

`docker compose --profile debug up` — keeps default stack lean.

---

### Local multi-service dev stacks

Compose models app + DB + Redis + mock services for laptop parity with prod topology (not prod scale). Pair with `.env`, volume mounts for hot reload, and healthchecks. Migration path: same images → K8s Deployments.

---

**📌 Docker Security & Best Practices**

### Run as non-root (USER)

Create app user in Dockerfile, `chown` files, switch before CMD:

```dockerfile
RUN adduser -D app && chown -R app:app /app
USER app
```

Root in container = root on host if kernel escape — minimize blast radius.

---

### Secrets in images (anti-patterns)

Never `COPY .env`, bake API keys in layers, or pass secrets as `ARG`. Layers are forensic-recoverable. Use runtime injection: env from orchestrator, secret mounts, BuildKit secret mounts at build only when necessary.

---

### Image scanning & SBOM basics

Scan images in CI/registry (Trivy, Grype, ECR scanning) for CVEs. **SBOM** (Software Bill of Materials) lists packages for supply-chain audit. Policy: block critical CVEs, pin bases, rebuild regularly.

---

### Read-only root filesystem

```bash
docker run --read-only --tmpfs /tmp myapp
```

Prevents runtime file tampering; requires writable mounts for temp/cache paths. K8s: `securityContext.readOnlyRootFilesystem: true`.

---

### Least privilege & minimal base images

Combine: non-root, minimal base, no unnecessary packages, drop capabilities (`--cap-drop=ALL`), seccomp/AppArmor profiles where available. Defense in depth — containers are not security boundaries alone for hostile multi-tenant.

---

**📌 Docker in CI/CD**

### Build & tag in CI pipelines

CI steps: checkout → `docker build` → test image (integration) → tag with git SHA + semver. Use consistent Dockerfile path and build args for version stamping.

---

### Push to private registries

Authenticate CI to ECR/GCR/ACR via OIDC/IRSA (preferred over long-lived keys). Push after successful tests. Image becomes deploy artifact — same digest across environments.

---

### Immutable tags & promotion

Promote **digest** or immutable tag from staging to prod rather than rebuilding. Avoid retagging `latest` in prod pipelines. Git SHA tags trace code → image → deployment.

---

### Build cache in CI

Use registry cache (`cache-from`/`cache-to`), BuildKit inline cache, or dedicated cache volumes. Dramatically cuts build time; ensure cache invalidation on dependency lockfile changes.

---

**📌 Kubernetes Architecture**

### Control plane vs worker nodes

**Control plane** — brains: API server, scheduler, controller manager, etcd. **Worker nodes** — run pods via kubelet. Managed K8s (EKS/GKE/AKS) hides control plane; you manage node pools.

---

### etcd (cluster state)

Distributed key-value store holding all cluster desired/actual state. Strong consistency for K8s objects. Backups critical — loss is catastrophic. Typically odd-numbered quorum (3, 5) for HA.

---

### API Server

Front door for `kubectl`, controllers, kubelet. Validates, persists to etcd, watches for changes. All access should be authenticated & authorized (RBAC). Rate limits protect cluster.

---

### Scheduler

Assigns **Pending** pods to nodes based on resources, affinity, taints, volume topology. Does not run containers — kubelet does. Custom schedulers possible but rare.

---

### Controller Manager

Runs control loops: Deployment controller, ReplicaSet, Node, Job, etc. Reconcile **desired state** (spec) vs **actual state** — core Kubernetes pattern.

---

### kubelet & kube-proxy

**kubelet** — agent on each node; pulls images, starts pods, reports status, runs probes. **kube-proxy** — implements Service VIP/iptables/IPVS rules for cluster IP routing (mode depends on setup).

---

### CNI, CSI, CRI (plug-in model)

| Plugin | Role |
|---|---|
| **CRI** | Container runtime interface (containerd, CRI-O) |
| **CNI** | Pod networking (Calico, Cilium, Flannel) |
| **CSI** | Volume attach/mount (EBS, GCE PD, NFS) |

Kubernetes stays extensible — choose plugins for cloud/on-prem needs.

---

**📌 Core Objects & Workloads**

### Namespace

Virtual cluster partition for names + RBAC + quotas. `default`, `kube-system`, team/env namespaces (`prod`, `staging`). Same resource name can exist in different namespaces.

---

### Pod (smallest deployable unit)

One or more containers sharing network namespace (same IP), volumes, IPC. Ephemeral — pods die and are replaced; don't treat pod IP as stable. Sidecars share pod lifecycle.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.25
```

---

### Labels & selectors

Key/value metadata for grouping:

```yaml
metadata:
  labels:
    app: api
    tier: backend
```

Controllers and Services select pods via `matchLabels`. Annotations hold non-identifying metadata (tooling hints).

---

### ReplicaSet

Maintains N pod replicas with label selector. Rarely created directly — Deployments manage ReplicaSets. If you delete a pod, RS recreates it.

---

### Deployment

Declarative rolling updates for stateless apps. Owns ReplicaSet(s); new RS for new template, scales down old.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels: { app: api }
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
      - name: api
        image: myapi:1.2.0
```

#### Rolling updates

Default `RollingUpdate` strategy: `maxSurge`, `maxUnavailable` control rollout pace. New pods pass readiness before old terminate (when configured). Zero-downtime requires readiness probes + enough capacity.

#### Rollback (kubectl rollout)

```bash
kubectl rollout status deployment/api
kubectl rollout history deployment/api
kubectl rollout undo deployment/api
```

Revision history stored in ReplicaSet annotations — quick recovery from bad image/config.

---

### StatefulSet

Stable pod identity (`pod-0`, `pod-1`), ordered deploy/scale, stable PVC per pod. For databases, Kafka brokers, ZooKeeper — when identity and storage stick to pod name. Headless Service provides stable DNS per pod.

---

### DaemonSet

One pod per (matching) node — log collectors, node exporters, CNI agents. Updates can roll node-by-node. Taints can restrict which nodes run the daemon.

---

### Job & CronJob

**Job** — run to completion (batch, migrations). **CronJob** — scheduled Jobs (backups, reports). Restart policy `OnFailure` / `Never`. Different from long-running Deployments.

---

### HorizontalPodAutoscaler (HPA)

Scales Deployment/StatefulSet replicas based on metrics (CPU, memory, custom). Needs metrics-server (resource) or Prometheus adapter (custom). Define min/max replicas and targets:

```yaml
metrics:
- type: Resource
  resource:
    name: cpu
    target:
      type: Utilization
      averageUtilization: 70
```

---

**📌 Services & Networking**

### ClusterIP Service

Default internal virtual IP + DNS name (`my-svc.namespace.svc.cluster.local`) load-balancing to pod endpoints. Only reachable inside cluster.

---

### NodePort & LoadBalancer

**NodePort** — exposes on each node's high port (30000–32767). **LoadBalancer** — cloud LB provisioning (AWS ELB, GCP LB) → NodePort/ClusterIP backend. External traffic path depends on cloud provider.

---

### Headless Service

`clusterIP: None` — DNS returns pod IPs directly (A records), not single VIP. Used with StatefulSets for stable per-pod DNS: `pod-0.my-svc.default.svc.cluster.local`.

---

### Ingress & Ingress Controller

**Ingress** — HTTP/S routing rules (host, path, TLS). Requires **Ingress Controller** (nginx, traefik, AWS LB controller) to implement. L7 routing vs Service L4.

```yaml
rules:
- host: api.example.com
  http:
    paths:
    - path: /
      pathType: Prefix
      backend:
        service:
          name: api
          port:
            number: 80
```

---

### CoreDNS & service discovery

In-cluster DNS resolves Services and Pods. Pods use `/etc/resolv.conf` → CoreDNS. Cross-namespace: `service.namespace.svc.cluster.local`.

---

### NetworkPolicy

Firewall rules for pods (label-based). Default allow-all unless CNI supports policies and policies deny. Example: only frontend namespace can reach backend port 8080.

```yaml
spec:
  podSelector:
    matchLabels: { app: api }
  ingress:
  - from:
    - podSelector: { matchLabels: { app: frontend } }
    ports: [{ port: 8080 }]
```

---

**📌 Configuration & Secrets**

### ConfigMap

Non-sensitive config as key-value or files:

```yaml
data:
  LOG_LEVEL: debug
  app.properties: |
    key=value
```

Mount as env or volume. Updates can be remounted (with delay) — apps may need reload sidecar or restart.

---

### Secret

Base64-encoded (not encrypted by default in etcd unless encryption at rest enabled). Types: `Opaque`, `kubernetes.io/tls`, docker registry, etc. Mount as files preferred over env for rotation.

---

### env vs volume mount patterns

| Pattern | Pros | Cons |
|---|---|---|
| **env** | Simple | Visible in `kubectl describe`, process env |
| **volume mount** | File-based, app-native config | Requires file watch/reload |

Secrets as env vars leak in crash dumps and child processes — mounts + permissions preferred for sensitive data.

---

### Immutable ConfigMaps / Secrets

`immutable: true` — prevent updates; delete/recreate required. Protects against accidental drift; forces explicit rollout when config changes.

---

**📌 Storage in Kubernetes**

### PersistentVolume (PV)

Cluster-scoped storage resource (admin-provisioned or dynamic). Has capacity, access modes, reclaim policy (`Retain`, `Delete`, `Recycle` deprecated).

---

### PersistentVolumeClaim (PVC)

Namespace-scoped request for storage. Binds to matching PV (or triggers dynamic provision). Pod references PVC in volume spec.

---

### StorageClass

Defines **provisioner** + parameters (EBS gp3, SSD, NFS). `default` StorageClass used when PVC omits class. Enables infra-as-code storage tiers.

---

### Dynamic provisioning

PVC created → provisioner creates PV + backing volume automatically. Standard cloud pattern — no manual PV per app.

---

### Access modes (RWO, ROX, RWX)

| Mode | Meaning |
|---|---|
| **RWO** | ReadWriteOnce — one node writer |
| **ROX** | ReadOnlyMany |
| **RWX** | ReadWriteMany — shared (NFS, EFS) |

Match workload: block storage often RWO; shared files need RWX-capable backend.

---

**📌 Scheduling & Resources**

### Requests & limits (CPU, memory)

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

**Requests** — scheduling guarantee. **Limits** — cap (memory OOMKill, CPU throttle). Always set in prod.

---

### QoS classes (Guaranteed, Burstable, BestEffort)

| QoS | When |
|---|---|
| **Guaranteed** | limits = requests for all containers |
| **Burstable** | requests set, limits differ or partial |
| **BestEffort** | none set — evicted first under pressure |

Node pressure evicts BestEffort → Burstable → Guaranteed last.

---

### nodeSelector

Simple scheduling: `nodeSelector: { disktype: ssd }`. Requires node labels. Superseded by affinity for expressiveness but still valid for simple cases.

---

### Affinity & anti-affinity

**Pod affinity** — co-locate with other pods (same zone, same app tier). **Anti-affinity** — spread replicas across nodes/zones for HA:

```yaml
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchLabels: { app: api }
      topologyKey: kubernetes.io/hostname
```

`preferredDuringScheduling` — soft preference.

---

### Taints & tolerations

**Taints** on nodes repel pods unless pod has matching **toleration**. Use dedicated nodes (GPU, spot, system), maintenance:

```yaml
tolerations:
- key: "spot"
  operator: "Equal"
  value: "true"
  effect: "NoSchedule"
```

---

**📌 Observability & Debugging**

### Liveness, readiness & startup probes

| Probe | Purpose |
|---|---|
| **liveness** | Restart if deadlocked |
| **readiness** | Remove from Service endpoints if not ready |
| **startup** | Disable liveness until slow-start completes |

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
```

Wrong liveness → restart loops; wrong readiness → traffic to broken pods.

---

### Logging (stdout/stderr, sidecar pattern)

Apps log to **stdout/stderr** — collected by node agent (fluent-bit, fluentd) → centralized stack (ELK, Loki, CloudWatch). **Sidecar** container tails shared volume or forwards logs when app can't stdout.

---

### Metrics (metrics-server, Prometheus overview)

**metrics-server** — resource usage for kubectl top & HPA. **Prometheus** — scrape `/metrics`, alerting, Grafana dashboards. Custom metrics via adapters for HPA.

---

### kubectl logs, describe, exec, debug

```bash
kubectl get pods -n prod
kubectl describe pod api-xxx -n prod    # events, state, probes
kubectl logs api-xxx -c api --tail=100
kubectl exec -it api-xxx -- sh
kubectl debug node/...                  # ephemeral debug containers (K8s 1.23+)
```

`describe` **Events** section is gold for scheduling/volume/mount failures.

---

### Common failure states (CrashLoopBackOff, ImagePullBackOff, Pending)

| State | Common causes |
|---|---|
| **Pending** | Insufficient CPU/mem, no matching node, PVC unbound, taints |
| **ImagePullBackOff** | Wrong tag, missing registry secret, rate limit |
| **CrashLoopBackOff** | App exit on start, misconfig, failed probe, missing deps |
| **OOMKilled** | Memory limit too low |
| **CreateContainerConfigError** | Bad mount, missing Secret/ConfigMap |

Systematic debug: `kubectl describe` → events → logs → config diff.

---

**📌 Kubernetes Security**

### RBAC (Role, ClusterRole, RoleBinding, ClusterRoleBinding)

**Role** — namespaced permissions; **ClusterRole** — cluster-wide or aggregated. **Binding** links identity (User, Group, **ServiceAccount**) to role.

```yaml
kind: Role
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
```

Principle of least privilege for humans and workloads.

---

### ServiceAccount

Identity for pods. Default SA per namespace; create dedicated SA per app. Mount token (legacy) or use projected tokens. Link to RBAC RoleBinding.

```yaml
spec:
  serviceAccountName: api-sa
```

---

### Pod Security Standards / SecurityContext

**Pod Security Admission** (replacing PSP): `privileged`, `baseline`, `restricted` namespaces. **securityContext**: runAsNonRoot, capabilities drop, seccompProfile, readOnlyRootFilesystem at pod/container level.

---

### NetworkPolicy for isolation

Default deny ingress/egress in zero-trust setups; explicit allow rules per app. Requires CNI support (Calico, Cilium). Interview: NetworkPolicy is layer 3/4 pod firewall — not a replacement for mTLS.

---

### Secrets encryption at rest (overview)

Enable **EncryptionConfiguration** so etcd secrets encrypted at rest (KMS integration on cloud). RBAC still required — encryption ≠ access control. Rotate KMS keys per policy.

---

**📌 Packaging & GitOps**

### Helm (Chart, values.yaml, release)

**Chart** — templated manifests; **values.yaml** — defaults; **release** — installed instance in cluster.

```bash
helm install my-api ./chart -f prod-values.yaml
helm upgrade --atomic my-api ./chart
```

Templates + hooks (pre/post install). Use for reusable packages; watch template complexity.

---

### Kustomize (bases & overlays)

Patch/overlay base YAML without templating language:

```
base/
  deployment.yaml
overlays/prod/
  kustomization.yaml  # patches, image tags, replicas
```

`kubectl apply -k overlays/prod`. Native to kubectl; great for environment diffs.

---

### GitOps with Argo CD / Flux (overview)

Git as source of truth — repo changes → sync to cluster. Argo CD UI/drift detection; Flux controller family. Benefits: audit trail, PR-based deploys, rollback via revert. Pair with image updaters for automated tag bumps.

---

**📌 Production & Operations**

### kubectl apply vs create vs replace

- **`apply`** — declarative, three-way merge, idempotent (preferred)
- **`create`** — fails if exists
- **`replace`** — full spec replacement, can drop fields managed by server-side apply nuances

Use **server-side apply** (SSA) for controllers and CI with field ownership.

---

### ResourceQuota & LimitRange

**ResourceQuota** — cap total CPU/mem/pods per namespace. **LimitRange** — defaults/min/max per container/PVC in namespace. Prevents one team exhausting cluster.

---

### Multi-environment patterns (dev/stage/prod)

Separate clusters or namespaces; Kustomize/Helm overlays; different values/secrets; promote images by digest. Network isolation between prod and non-prod. RBAC separates who can deploy where.

---

### Cluster upgrades & node drains

Upgrade control plane (managed) then node pools version-by-version:

```bash
kubectl drain node1 --ignore-daemonsets --delete-emptydir-data
# upgrade kubelet/OS
kubectl uncordon node1
```

Respect PDBs so drains don't take all replicas offline.

---

### PodDisruptionBudget (PDB)

Ensures minimum available or max unavailable during voluntary disruptions (drain, rollout):

```yaml
spec:
  minAvailable: 2
  selector:
    matchLabels: { app: api }
```

Protects availability during cluster maintenance.

---

### Troubleshooting workflow (events → describe → logs)

1. `kubectl get events --sort-by=.lastTimestamp`
2. `kubectl describe` failing resource
3. `kubectl logs` / previous container (`--previous`)
4. Compare spec (image, env, mounts, probes) to working revision
5. Network: Service endpoints, NetworkPolicy, DNS from debug pod
6. Node: `kubectl top`, conditions, kubelet logs

Document runbooks for common alerts (5xx spike, probe failures, PVC full).

---

**📌 Advanced & Interview Extras (Optional)**

### Init containers

Run to completion before app containers start — wait for DB, download config, migration:

```yaml
initContainers:
- name: wait-db
  image: busybox
  command: ['sh', '-c', 'until nc -z db 5432; do sleep 2; done']
```

Separate concerns from main app lifecycle.

---

### Sidecar pattern

Helper container in same pod: log shipper, proxy (Envoy), config reloader, mesh injector. Shares network namespace — localhost communication. Lifecycle tied to pod — design for graceful shutdown ordering.

---

### Operators & CRDs (overview)

**Custom Resource Definitions** extend API; **Operators** encode domain knowledge (reconcile loops) for complex stateful systems (Postgres, Kafka). Built with Kubebuilder, Operator SDK. Interview: Operator = controller + CRD for Day-2 ops automation.

---

### Service mesh (Istio/Linkerd overview)

Sidecar proxy layer for mTLS, traffic splitting, retries, observability without app changes. Cost: complexity, latency, resource overhead. Use when many services need consistent policy — not mandatory for every cluster.

---

### Multi-cluster & federation (high level)

Patterns: env per cluster, geo replicas, hub-spoke GitOps. **Federation v2** / multi-cluster services evolve — know tradeoffs (blast radius, networking, data consistency) vs single large cluster with strong namespace isolation.

---

**Interview recap**

- **Docker:** image layers, multi-stage, non-root, compose for dev, registry promotion by digest.
- **Kubernetes:** declarative reconciliation, Deployments + Services + Ingress, probes, requests/limits, PVC + StorageClass, RBAC, NetworkPolicy, GitOps.
- **Connect the dots:** Build in CI → push image → deploy to K8s with probes, resources, and secrets — same artifact from laptop to prod.
