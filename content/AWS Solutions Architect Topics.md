# AWS Solutions Architect

**📌 AWS Fundamentals & Well-Architected**
- [] AWS global infrastructure (Regions, AZs, Edge Locations)
- [] Shared Responsibility Model
- [] AWS Well-Architected Framework — six pillars
- [] Operational Excellence pillar
- [] Security pillar
- [] Reliability pillar
- [] Performance Efficiency pillar
- [] Cost Optimization pillar
- [] Sustainability pillar (overview)
- [] AWS Organizations & SCPs (overview)
- [] Landing zone & multi-account strategy (overview)

**📌 Identity, Access & Governance**
- [] IAM users, groups, roles, policies
- [] IAM policy evaluation (explicit deny, allow)
- [] IAM roles for EC2, Lambda, cross-account
- [] STS & temporary credentials
- [] AWS SSO / IAM Identity Center (overview)
- [] Resource-based vs identity-based policies
- [] Permission boundaries & session policies
- [] AWS CloudTrail (audit)
- [] AWS Config (compliance & drift)

**📌 VPC & Networking**
- [] VPC, subnets (public vs private)
- [] Internet Gateway & NAT Gateway vs NAT Instance
- [] Route tables & routing
- [] Security Groups vs NACLs
- [] VPC peering
- [] Transit Gateway
- [] VPN (Site-to-Site) & Client VPN
- [] AWS Direct Connect (overview)
- [] PrivateLink & VPC endpoints (Gateway vs Interface)
- [] Flow Logs & network troubleshooting

**📌 DNS, CDN & Edge**
- [] Route 53 — routing policies
    - [] Simple, weighted, latency, failover, geolocation, geoproximity
- [] Route 53 health checks & DNS failover
- [] Amazon CloudFront (CDN)
- [] CloudFront origins, behaviors, caching, signed URLs/cookies
- [] AWS Global Accelerator (overview)
- [] S3 as CloudFront origin patterns

**📌 Compute — EC2 & Auto Scaling**
- [] EC2 instance types & purchasing options
    - [] On-Demand, Reserved, Savings Plans, Spot, Dedicated
- [] AMIs & instance store vs EBS-backed
- [] EC2 placement groups
- [] Elastic Load Balancing (ALB, NLB, GLB)
- [] Target groups, health checks, stickiness
- [] Auto Scaling Groups (ASG)
- [] Launch templates & scaling policies
- [] Connection draining & graceful shutdown

**📌 Serverless Compute**
- [] AWS Lambda fundamentals
- [] Lambda triggers (API Gateway, S3, SQS, EventBridge, etc.)
- [] Lambda concurrency, reserved vs provisioned
- [] Lambda layers & deployment packages
- [] Lambda@Edge (overview)
- [] AWS Fargate (serverless containers overview)

**📌 Storage — S3 & Object Storage**
- [] S3 buckets, objects, keys, prefixes
- [] S3 storage classes (Standard, IA, One Zone-IA, Glacier tiers, Intelligent-Tiering)
- [] S3 durability, availability & consistency model
- [] S3 lifecycle policies & transitions
- [] S3 versioning & MFA Delete
- [] S3 replication (CRR & SRR)
- [] S3 encryption (SSE-S3, SSE-KMS, SSE-C, DSSE)
- [] S3 presigned URLs & access points
- [] S3 event notifications
- [] S3 request patterns & performance (prefix scaling)

**📌 Storage — Block & File**
- [] Amazon EBS volumes & types (gp3, io2, st1, sc1)
- [] EBS snapshots & AMIs
- [] EBS encryption & multi-attach (io2)
- [] Amazon EFS (NFS, performance modes, access points)
- [] FSx (Windows, Lustre, NetApp, OpenZFS — overview)
- [] Storage Gateway (file, volume, tape — overview)

**📌 Databases — Relational**
- [] Amazon RDS (Multi-AZ, Read Replicas)
- [] RDS engines & use cases (MySQL, PostgreSQL, Aurora)
- [] Amazon Aurora architecture & Aurora Serverless v2
- [] RDS Proxy (connection pooling)
- [] RDS backup, snapshots & restore
- [] Amazon Redshift (warehouse overview)

**📌 Databases — NoSQL & Caching**
- [] Amazon DynamoDB (partitions, RCU/WCU, on-demand vs provisioned)
- [] DynamoDB indexes (LSI, GSI)
- [] DynamoDB streams & DAX
- [] DynamoDB global tables & TTL
- [] Amazon ElastiCache (Redis vs Memcached)
- [] Amazon DocumentDB & Neptune (overview)

**📌 Application Integration & Messaging**
- [] Amazon SQS (standard vs FIFO)
- [] SQS visibility timeout, DLQ, long polling
- [] Amazon SNS (topics, fan-out, filtering)
- [] SNS + SQS fan-out pattern
- [] Amazon EventBridge (event bus, rules, schema registry)
- [] AWS Step Functions (Standard vs Express)
- [] Amazon MQ (overview)

**📌 Streaming & Data Ingestion**
- [] Amazon Kinesis Data Streams
- [] Kinesis Data Firehose
- [] Kinesis Data Analytics (overview)
- [] MSK (Managed Kafka — overview)
- [] Glue & Athena (analytics overview)

**📌 API Management & Integration**
- [] Amazon API Gateway (REST vs HTTP vs WebSocket)
- [] API Gateway stages, throttling, caching, usage plans
- [] API Gateway authorizers (IAM, Cognito, Lambda)
- [] AWS AppSync (GraphQL overview)

**📌 Containers on AWS**
- [] Amazon ECR
- [] Amazon ECS (tasks, services, clusters)
- [] ECS launch types (EC2 vs Fargate)
- [] Application Load Balancer with ECS
- [] Amazon EKS (overview)
- [] ECS vs EKS vs Lambda decision matrix

**📌 High Availability & Disaster Recovery**
- [] RTO & RPO definitions
- [] DR strategies (backup-restore, pilot light, warm standby, multi-site active-active)
- [] Multi-AZ vs Multi-Region patterns
- [] Elastic Disaster Recovery (DRS overview)
- [] Backup plans (AWS Backup overview)
- [] Architecture for stateless vs stateful tiers

**📌 Migration & Hybrid**
- [] AWS Migration Hub & Application Discovery Service
- [] AWS Database Migration Service (DMS)
- [] AWS Application Migration Service (MGN)
- [] VMware Cloud on AWS (overview)
- [] Hybrid connectivity summary (VPN + Direct Connect)
- [] Snowball / Snowmobile (edge transfer overview)

**📌 Security, Encryption & Compliance**
- [] AWS KMS (CMK, envelope encryption, grants)
- [] AWS Secrets Manager vs Systems Manager Parameter Store
- [] AWS WAF & AWS Shield
- [] AWS Firewall Manager (overview)
- [] Amazon Macie (PII in S3 overview)
- [] GuardDuty, Security Hub, Inspector (overview)
- [] Encryption in transit (TLS) & at rest patterns

**📌 Monitoring, Logging & Operations**
- [] Amazon CloudWatch metrics, alarms, dashboards
- [] CloudWatch Logs & Logs Insights
- [] CloudWatch Agent & custom metrics
- [] AWS X-Ray (distributed tracing)
- [] AWS Systems Manager (Patch Manager, Session Manager, Parameter Store)
- [] EventBridge for operational events
- [] Personal Health Dashboard & Trusted Advisor (overview)

**📌 Cost Management & Optimization**
- [] AWS Pricing models & Cost Explorer
- [] AWS Budgets & Cost Anomaly Detection
- [] Reserved Instances & Savings Plans strategy
- [] Spot instances & Spot Fleet patterns
- [] S3 Intelligent-Tiering & lifecycle cost wins
- [] Right-sizing & tagging for cost allocation
- [] Data transfer cost awareness

**📌 Architecture Patterns & Design Scenarios**
- [] Three-tier web application on AWS
- [] Microservices on ECS/EKS/Lambda
- [] Event-driven architecture (SQS/SNS/EventBridge)
- [] Static website (S3 + CloudFront)
- [] Hybrid read-heavy API (ElastiCache + RDS)
- [] Multi-region active-passive failover
- [] Batch processing (Batch, Step Functions)
- [] CI/CD on AWS (CodePipeline overview)

**📌 Solutions Architect Exam & Interview Extras**
- [] Choosing the right database (decision flow)
- [] Choosing the right compute (decision flow)
- [] CAP & consistency tradeoffs on AWS services
- [] Idempotency & exactly-once patterns (FIFO, dedup)
- [] Common exam traps (NACL vs SG, Multi-AZ vs Read Replica)
- [] Whiteboard: design a scalable photo-sharing app
- [] Whiteboard: design real-time analytics pipeline
