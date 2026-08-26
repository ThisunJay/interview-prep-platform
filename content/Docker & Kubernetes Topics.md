# Docker & Kubernetes

**📌 Container & Docker Fundamentals**
- [] Containers vs Virtual Machines
- [] Docker architecture (CLI, daemon, containerd, runc)
- [] Images vs containers
- [] OCI image & runtime specs
- [] Registries (Docker Hub, ECR, GCR, ACR)
- [] Docker Desktop vs Linux engine (conceptual)

**📌 Images & Dockerfile**
- [] Dockerfile instructions (FROM, RUN, COPY, ADD, CMD, ENTRYPOINT)
- [] ENV, ARG, EXPOSE, WORKDIR, USER, HEALTHCHECK
- [] Multi-stage builds
- [] Layer caching & build optimization
- [] .dockerignore
- [] Image tags, digests & immutability
- [] Base image selection (distroless, alpine, slim)
- [] BuildKit features (cache mounts, secrets)

**📌 Container Runtime & Operations**
- [] docker run, ps, stop, rm, logs, exec
- [] Container lifecycle states
- [] Resource limits (CPU, memory)
- [] Restart policies
- [] Health checks (HEALTHCHECK / compose)
- [] Exit codes & debugging containers

**📌 Docker Networking**
- [] Bridge, host, none, overlay networks
- [] Port mapping (-p host:container)
- [] Custom bridge networks & DNS
- [] Container-to-container communication
- [] docker network inspect & connect

**📌 Docker Storage**
- [] Volumes vs bind mounts vs tmpfs
- [] Named volumes & persistence
- [] Volume lifecycle & cleanup
- [] Data patterns for stateful containers

**📌 Docker Compose**
- [] docker-compose.yml structure (services, networks, volumes)
- [] depends_on & service healthchecks
- [] Environment variables & env files
- [] Compose profiles
- [] Local multi-service dev stacks

**📌 Docker Security & Best Practices**
- [] Run as non-root (USER)
- [] Secrets in images (anti-patterns)
- [] Image scanning & SBOM basics
- [] Read-only root filesystem
- [] Least privilege & minimal base images

**📌 Docker in CI/CD**
- [] Build & tag in CI pipelines
- [] Push to private registries
- [] Immutable tags & promotion
- [] Build cache in CI

**📌 Kubernetes Architecture**
- [] Control plane vs worker nodes
- [] etcd (cluster state)
- [] API Server
- [] Scheduler
- [] Controller Manager
- [] kubelet & kube-proxy
- [] CNI, CSI, CRI (plug-in model)

**📌 Core Objects & Workloads**
- [] Namespace
- [] Pod (smallest deployable unit)
- [] Labels & selectors
- [] ReplicaSet
- [] Deployment
    - [] Rolling updates
    - [] Rollback (kubectl rollout)
- [] StatefulSet
- [] DaemonSet
- [] Job & CronJob
- [] HorizontalPodAutoscaler (HPA)

**📌 Services & Networking**
- [] ClusterIP Service
- [] NodePort & LoadBalancer
- [] Headless Service
- [] Ingress & Ingress Controller
- [] CoreDNS & service discovery
- [] NetworkPolicy

**📌 Configuration & Secrets**
- [] ConfigMap
- [] Secret
- [] env vs volume mount patterns
- [] Immutable ConfigMaps / Secrets

**📌 Storage in Kubernetes**
- [] PersistentVolume (PV)
- [] PersistentVolumeClaim (PVC)
- [] StorageClass
- [] Dynamic provisioning
- [] Access modes (RWO, ROX, RWX)

**📌 Scheduling & Resources**
- [] Requests & limits (CPU, memory)
- [] QoS classes (Guaranteed, Burstable, BestEffort)
- [] nodeSelector
- [] Affinity & anti-affinity
- [] Taints & tolerations

**📌 Observability & Debugging**
- [] Liveness, readiness & startup probes
- [] Logging (stdout/stderr, sidecar pattern)
- [] Metrics (metrics-server, Prometheus overview)
- [] kubectl logs, describe, exec, debug
- [] Common failure states (CrashLoopBackOff, ImagePullBackOff, Pending)

**📌 Kubernetes Security**
- [] RBAC (Role, ClusterRole, RoleBinding, ClusterRoleBinding)
- [] ServiceAccount
- [] Pod Security Standards / SecurityContext
- [] NetworkPolicy for isolation
- [] Secrets encryption at rest (overview)

**📌 Packaging & GitOps**
- [] Helm (Chart, values.yaml, release)
- [] Kustomize (bases & overlays)
- [] GitOps with Argo CD / Flux (overview)

**📌 Production & Operations**
- [] kubectl apply vs create vs replace
- [] ResourceQuota & LimitRange
- [] Multi-environment patterns (dev/stage/prod)
- [] Cluster upgrades & node drains
- [] PodDisruptionBudget (PDB)
- [] Troubleshooting workflow (events → describe → logs)

**📌 Advanced & Interview Extras (Optional)**
- [] Init containers
- [] Sidecar pattern
- [] Operators & CRDs (overview)
- [] Service mesh (Istio/Linkerd overview)
- [] Multi-cluster & federation (high level)
