SANKETA: COMPREHENSIVE REQUIREMENTS & ARCHITECTURE DOCUMENT
Version 1.0
Date: [Current Date]
Status: Final for Development

1. EXECUTIVE SUMMARY
   Sanketa is an AI-powered educational analytics platform that integrates deeply with Blackboard Learn to provide professors with real‑time, actionable insights about student performance, assessment quality, and teaching effectiveness—all while ensuring zero student data is permanently stored and no data leaves the institution. The system delivers 20 distinct insights (e.g., early intervention alerts, chapter difficulty analysis) using a novel “ghost database” architecture that relies on ephemeral caching, browser‑side WebAssembly computation, and Blackboard’s own APIs, eliminating the need for a traditional database or ETL pipelines. Sanketa is designed to be a native extension of Blackboard via LTI 1.3 Advantage, offering a seamless experience for faculty while meeting stringent privacy (FERPA/GDPR) requirements and providing patent‑worthy technological differentiators.

2. BUSINESS NEEDS & PROBLEM STATEMENT
   2.1 Current Challenges
   Data‑to‑Insight Lag: Professors receive end‑of‑semester reports, missing opportunities for early intervention.

Manual Overhead: Hours spent downloading gradebooks, creating Excel formulas, and searching for at‑risk students.

Reactive Teaching: No real‑time feedback on which topics or assessments are problematic.

Privacy Compliance Burden: Manual processes to ensure FERPA/GDPR compliance when using cloud analytics tools.

Integration Complexity: Existing analytics solutions require heavy IT involvement and data warehousing.

2.2 Desired Outcomes
Outcome Metric Target
Early identification of at‑risk students % identified by week 4 ≥95%
Professor time saved per week Hours saved 3–5 hours
Reduction in D/F/W rates Relative improvement 15–20%
Privacy compliance Zero data breach incidents 100%
Setup time for new course Minutes <10 minutes 3. FUNCTIONAL REQUIREMENTS
3.1 Core Features
FR1 – Real‑time Grade Analysis

Monitor Blackboard gradebook changes in real‑time (webhooks or API polling).

Process new grades within 30 seconds of entry.

Support all Blackboard grade types (points, percentage, letter, complete/incomplete).

FR2 – Twenty (20) Automated Insights
The system must generate the following insights without storing raw student data:

# Insight Name Description

1 Early Intervention Alerts Flags students as high/medium/low risk based on performance trend.
2 Chapter Difficulty Analysis Identifies topics or chapters where students collectively struggle.
3 Assessment Quality Insights Evaluates assessment items (discrimination, reliability).
4 Learning Progression Tracking Measures the velocity of learning over time.
5 Performance Pattern Recognition Detects consistency, streaks, or volatility in student grades.
6 Grade Distribution Analysis Shows skewness, normality, outliers.
7 Submission Behavior Monitoring Tracks on‑time vs. late submissions.
8 Improvement Trajectory Mapping Identifies students showing rapid improvement or decline.
9 Comparative Performance Analysis Percentile ranking within class.
10 Assessment Type Effectiveness Compares exams, assignments, quizzes.
11 Knowledge Gap Identification Pinpoints prerequisite concepts not mastered.
12 Consistency Scoring Standard deviation of performance across assessments.
13 Peer Performance Context Relative standing with anonymized peer comparison.
14 Predictive Grade Forecasting Estimates final grade based on current trajectory.
15 Learning Objective Mastery Tracks achievement of course learning outcomes.
16 Time‑on‑Task Analysis Correlates engagement (e.g., time spent) with performance.
17 Group Work Contribution Insights Distinguishes individual vs. team performance.
18 Cross‑Course Performance Trends Patterns across different courses (with consent).
19 Intervention Effectiveness Tracking Measures impact of teaching adjustments.
20 Personalized Learning Paths Recommends study resources based on gaps.
FR3 – Blackboard Native Integration

Appear as a native tool in Blackboard course navigation.

Single Sign‑On using Blackboard credentials (LTI 1.3 Advantage).

Bi‑directional grade passback (optional for instructors).

Mobile‑responsive design matching Blackboard’s mobile app.

FR4 – Privacy & Data Governance

No raw student data stored beyond 24 hours.

All processing occurs within the institution’s network (on‑premise or private cloud).

Encryption of all data in transit (TLS 1.3) and at rest (AES‑256).

Automatic purge at semester end or upon student withdrawal.

Granular consent controls for students (opt‑out from analytics).

FR5 – Role‑Based Access

Professor: Full access to insights for own courses.

TA: Limited view (configurable).

Admin: Cross‑course anonymized aggregates, system health.

Student: Personal dashboard (opt‑in) with anonymized peer comparisons.

FR6 – Reporting & Export

Generate PDF/CSV reports of insights (without PII).

Scheduled email reports (daily/weekly).

4. NON‑FUNCTIONAL REQUIREMENTS
   4.1 Performance & Scalability
   Insight computation latency: <2 seconds per assessment.

Concurrent users: Support 100+ professors simultaneously.

Data sync latency: <30 seconds from Blackboard grade change.

System uptime: 99.5% during academic terms.

4.2 Privacy & Compliance
FERPA/GDPR compliant: No PII in logs or permanent storage.

Right to be forgotten: Automatic deletion of all data upon request.

Data sovereignty: Configurable region for processing (EU, US, etc.).

Audit trail: Tamper‑proof logs without PII.

4.3 Integration Requirements
Blackboard Learn 9.1, Ultra Experience, and SaaS.

LTI 1.3 Advantage (Deep Linking, Names & Roles, Gradebook services).

REST API for future SIS integration (optional).

4.4 Security
Authentication exclusively via Blackboard SSO.

Role‑based authorization (RBAC).

Encrypted cache with key rotation.

Regular penetration testing.

4.5 Usability
Intuitive dashboard with minimal learning curve.

Accessibility (WCAG 2.1 AA).

Browser support: latest Chrome, Firefox, Safari, Edge.

5. SYSTEM ARCHITECTURE
   5.1 High‑Level Diagram
   text
   ┌─────────────────────────────────────────────────────────────┐
   │ INSTITUTION NETWORK │
   ├─────────────────────────────────────────────────────────────┤
   │ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
   │ │ Blackboard │◄─────►│ Sanketa │◄────►│ Browser │ │
   │ │ Learn │ LTI │ Service │ WS │ (UI) │ │
   │ └─────────────┘ 1.3 └─────────────┘ └───────────┘ │
   │ │ │ │ │
   │ │ (Webhook) │ (Cache) │ │
   │ ▼ ▼ │ │
   │ ┌─────────────┐ ┌─────────────┐ │ │
   │ │ Gradebook │ │ Redis │ │ │
   │ │ Events │◄─────►│ Cluster │ │ │
   │ └─────────────┘ 24h └─────────────┘ │ │
   │ TTL │ │ │
   │ ▼ │ │
   │ ┌─────────────┐ │ │
   │ │ ClickHouse │◄───────────┘ │
   │ │ (Aggregates)│ (Anonymized stats) │
   │ └─────────────┘ │
   └─────────────────────────────────────────────────────────────┘
   5.2 Component Breakdown
   5.2.1 Blackboard Connector Layer
   LTI 1.3 Provider: Handles OIDC login, launches, and Deep Linking.

Gradebook Sync Engine: Uses Blackboard REST API v2 to fetch gradebook structure and grades.

WebHook Listener: Receives real‑time grade change events.

Names & Roles Service: Synchronizes course roster without manual upload.

5.2.2 Analytics Engine
WebAssembly Modules: 20 independent Rust‑compiled WASM modules, each implementing one insight algorithm.

Stream Processor: Consumes events from Redis streams, routes to relevant WASM modules.

Model Manager: Maintains lightweight ML models (e.g., trend predictors) as serialized weights (no raw data).

Cache Coordinator: Manages multi‑tier cache (browser, Redis, ClickHouse).

5.2.3 Storage Layer
L1 – Browser Cache (IndexedDB + localStorage): Session‑only, cleared on logout.

L2 – Redis Cluster: Ephemeral key‑value store with 24h TTL; stores recent grades, pre‑computed aggregates, and bloom filters.

L3 – ClickHouse: Columnar store for long‑term anonymized statistics (e.g., average difficulty per chapter across semesters, no PII).

L4 – MinIO/S3 (optional): For exported reports and backups (no PII).

5.2.4 Presentation Layer
Blackboard Building Block: Iframe embedding Sanketa UI.

React PWA: Progressive Web App with offline capability via Service Workers.

WebSocket Server: Pushes real‑time updates to connected dashboards.

Export Service: Generates PDF/CSV reports.

5.3 Data Flow (Detailed)
text

1. Professor launches Sanketa from Blackboard course.
2. LTI launch → JWT issued → UI loaded in iframe.
3. WebSocket connection established for real‑time updates.
4. Blackboard WebHook fires when grade changes:
   - Event payload sent to Sanketa WebHook endpoint.
   - Payload validated, student/course IDs hashed (privacy).
   - Grade data stored in Redis with 24h TTL.
5. Redis stream triggers insight computation:
   - Relevant WASM modules loaded (in browser or server‑side fallback).
   - Insight results stored in Redis (TTL 24h).
6. WebSocket notifies UI → dashboard updates.
7. Every 24h, Redis keys expire; raw grades are gone.
8. Aggregated, anonymized statistics (e.g., “chapter X average difficulty”) are saved to ClickHouse for cross‑course trends.
9. TECHNOLOGY STACK
   6.1 Frontend
   Framework: React 18 + TypeScript

State Management: Redux Toolkit + RTK Query

Real‑time: Socket.io‑client

WebAssembly: Rust (compiled to WASM)

Styling: CSS‑in‑JS (Emotion) with Blackboard theme compliance

PWA: Workbox for Service Workers

6.2 Backend
API Gateway: Node.js + Express

LTI 1.3 Library: @imsglobal/lti‑1p3‑tool

WebSocket Server: Socket.io (or native WebSockets)

Background Jobs: Bull (Redis‑based queue)

Authentication: JWT (issued via LTI)

6.3 Data Layer
Redis 7.x: RedisJSON, RedisTimeSeries, RedisBloom modules

ClickHouse: For anonymized long‑term analytics

MinIO: S3‑compatible object storage (optional)

6.4 Deployment
Containerization: Docker + Docker Compose

Orchestration: Kubernetes (for larger institutions)

Reverse Proxy: Nginx (handles SSL, routing)

7. PRIVACY & SECURITY DESIGN
   7.1 Privacy Principles
   Data Minimization: Only collect what is necessary for insights.

Purpose Limitation: Data used only for analytics, never sold or shared.

Storage Limitation: 24h TTL on all raw data.

Transparency: Clear privacy policy and in‑app explanations.

7.2 Technical Controls
Encryption: TLS 1.3 for all external communication; AES‑256 for Redis at rest (if supported).

Hashing: Student IDs are salted SHA‑256 before use in cache keys.

Differential Privacy: Add calibrated noise to any aggregate published (e.g., grade distributions) to prevent re‑identification.

Zero‑Knowledge Proofs (optional): Prove that computation was performed correctly without revealing inputs.

7.3 Compliance Automation
Automatic PII Detection: Scan uploaded files for SSN, names, etc., and redact.

Consent Management: Store consent flags in Redis (no PII).

Data Subject Requests: Automated process to delete all data for a student (via hashed ID).

8. INTEGRATION SPECIFICATION
   8.1 Blackboard Integration Points
   Integration Point Method Purpose
   Course Navigation LTI 1.3 Deep Linking Sanketa appears as a course tool
   Gradebook REST API + WebHooks Read grades, receive updates
   Roster Names & Roles Provisioning Service Automatic student list
   SSO LTI 1.3 OIDC Single sign‑on
   Mobile Responsive design Works in Blackboard app
   8.2 Deployment Options
   Option A – On‑Premise Container

Docker image deployed on institution’s servers.

All data stays within institutional network.

Updates via pull from private registry.

Option B – Institutional Private Cloud

Hosted on institution’s AWS/Azure account.

Data still within VPC.

Managed by Sanketa (optional).

Option C – Hybrid (Edge + Cloud)

Analytics engine runs on‑premise, UI/aggregation in cloud.

Only anonymized data leaves.

9. PHASED IMPLEMENTATION PLAN
   Phase 1: Proof of Concept (Weeks 1‑4)
   Goal: Validate core insights with 3 pilot professors.
   Deliverables:

Chrome extension intercepting Blackboard gradebook.

5 insights (Early Alert, Chapter Difficulty, Assessment Quality, Progression, Patterns).

Manual installation; no institutional deployment.
Success Criteria: 90% accuracy vs. manual analysis, professor feedback positive.

Phase 2: MVP (Weeks 5‑12)
Goal: Full Blackboard integration for a single institution.
Deliverables:

LTI 1.3 tool (Building Block) for Blackboard.

All 20 insights implemented as WASM modules.

Redis‑based ephemeral cache.

Basic dashboard with role‑based views.
Success Criteria: 95% accuracy, <2s latency, successful pilot with 10 professors.

Phase 3: Scale (Weeks 13‑24)
Goal: Multi‑institution support with advanced features.
Deliverables:

Multi‑tenant architecture.

ClickHouse for anonymized aggregates.

Export/reporting module.

Admin dashboard for system health.
Success Criteria: Support 5 institutions, 99.5% uptime.

Phase 4: Enterprise (Ongoing)
Goal: Full enterprise features.
Deliverables:

SIS integration (Banner, PeopleSoft).

Advanced ML models (e.g., deep learning for prediction).

Custom insight builder.

API for third‑party integrations.
Success Criteria: Adopted by 20+ institutions, positive ROI.

10. VALIDATION & SUCCESS METRICS
    10.1 Technical Validation
    Accuracy: 95%+ agreement with professor’s manual assessment.

Performance: 99% of insights delivered within 2 seconds.

Reliability: 99.5% uptime during peak hours.

Privacy: Zero data leaks or policy violations.

10.2 User Validation
Adoption Rate: 80% of pilot professors continue using after trial.

Satisfaction Score: ≥4.5/5 on SUS (System Usability Scale).

Time Saved: Average 3 hours/week per professor.

10.3 Business Validation
Student Impact: 15% reduction in D/F/W rates in pilot courses.

ROI: Positive within first academic year.

IP Protection: Patent applications filed before public launch.

11. RISK ASSESSMENT & MITIGATION
    Risk Probability Impact Mitigation Strategy
    Blackboard API changes High High Multi‑version support, rapid update process, fallback to HTML parsing
    Performance bottlenecks Medium High Load testing from week 1; auto‑scaling Redis; WebAssembly for speed
    Data loss during processing Low Critical Idempotent processing; checkpointing; recovery from Redis logs
    Privacy breach Low Catastrophic Privacy‑by‑design; encryption; automatic TTL; third‑party audit
    Low adoption Medium High Co‑design with faculty; showcase quick wins; free pilot
    Competition Medium Medium Focus on privacy and Blackboard‑native differentiators
12. FUTURE ENHANCEMENTS (ROADMAP)
    Year 1

Full 20 insights implementation.

Blackboard Ultra support.

Mobile app for professors.

Year 2

Predictive modeling with deep learning.

NLP for open‑ended responses.

Cross‑institutional benchmarks (anonymized).

Year 3

Canvas, Moodle, D2L integration.

AI‑powered tutoring recommendations.

Research collaboration tools.

Year 4+

Global educational analytics standard.

Real‑time intervention marketplace.

Learning science research platform.

13. APPENDICES
    Appendix A: Detailed Insight Algorithms
    (Each insight described with formula, inputs, outputs, confidence calculation, and edge‑case handling – see separate technical spec document.)

Appendix B: Blackboard API Endpoints Reference
List of required Blackboard endpoints, permissions, and sample responses.

Appendix C: Privacy Impact Assessment
Formal PIA covering data flows, risks, and controls.

Appendix D: Deployment Checklist
Step‑by‑step for IT administrators: prerequisites, installation, configuration, testing.

Appendix E: Glossary of Terms
HDPE: Hierarchical Data Processing Engine

TCB: Temporal‑Categorical‑Behavioral analysis

AIGS: Automated Insight Generation System

CLLS: Closed‑Loop Learning System

DOCUMENT VERSION HISTORY
Version Date Author Changes
1.0 [Current Date] Product Team Initial comprehensive requirements
