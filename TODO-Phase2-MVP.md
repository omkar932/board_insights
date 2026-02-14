# Phase 2: MVP (Weeks 5-12)

**Goal:** Full Blackboard integration for single institution  
**Timeline:** Weeks 5-12  
**Success Criteria:** 95% accuracy, <2s latency, successful pilot with 10 professors

---

## Week 5-6: LTI 1.3 Integration

### LTI 1.3 Setup

- [ ] Study LTI 1.3 Advantage specification
  - [ ] Review IMS Global documentation
  - [ ] Understand OIDC login flow
  - [ ] Learn Deep Linking protocol
  - [ ] Study Names & Roles service
  - [ ] Review Gradebook services

### Backend Foundation

- [ ] Initialize Node.js project
  - [ ] Set up Express server
  - [ ] Configure TypeScript
  - [ ] Set up project structure
  - [ ] Configure environment variables
  - [ ] Set up logging (Winston/Pino)

- [ ] Install LTI 1.3 library
  - [ ] Install @imsglobal/lti-1p3-tool
  - [ ] Configure LTI platform registration
  - [ ] Set up key pairs (RSA)
  - [ ] Configure JWKS endpoint
  - [ ] Test basic LTI launch

### LTI Provider Implementation

- [ ] Implement OIDC login
  - [ ] Create login initiation endpoint
  - [ ] Handle authentication request
  - [ ] Validate state parameter
  - [ ] Redirect to platform authorization

- [ ] Implement LTI launch
  - [ ] Create launch endpoint
  - [ ] Validate JWT token
  - [ ] Extract user/course context
  - [ ] Create session
  - [ ] Render application UI

- [ ] Implement Deep Linking
  - [ ] Create content selection UI
  - [ ] Handle Deep Linking request
  - [ ] Generate Deep Linking response
  - [ ] Test tool placement in course

### Blackboard Registration

- [ ] Register tool in Blackboard
  - [ ] Create LTI 1.3 tool registration
  - [ ] Configure redirect URIs
  - [ ] Set up tool placement (course navigation)
  - [ ] Configure permissions
  - [ ] Test launch from Blackboard

---

## Week 7-8: All 20 Insights Implementation

### WASM Module Setup

- [ ] Set up Rust development environment
  - [ ] Install Rust toolchain
  - [ ] Install wasm-pack
  - [ ] Create workspace for WASM modules
  - [ ] Configure build scripts

### Insights 1-5 (Port from POC)

- [ ] Convert to WASM modules
  - [ ] Early Intervention Alerts
  - [ ] Chapter Difficulty Analysis
  - [ ] Assessment Quality Insights
  - [ ] Learning Progression Tracking
  - [ ] Performance Pattern Recognition

### Insights 6-10

- [ ] Grade Distribution Analysis
  - [ ] Calculate mean, median, mode
  - [ ] Compute skewness and kurtosis
  - [ ] Identify outliers (IQR method)
  - [ ] Test for normality (Shapiro-Wilk)
  - [ ] Visualize distribution (histogram)

- [ ] Submission Behavior Monitoring
  - [ ] Track on-time vs. late submissions
  - [ ] Calculate late submission rate
  - [ ] Identify chronic late submitters
  - [ ] Analyze submission time patterns
  - [ ] Generate behavior report

- [ ] Improvement Trajectory Mapping
  - [ ] Calculate grade deltas over time
  - [ ] Identify rapid improvement/decline
  - [ ] Compute improvement velocity
  - [ ] Flag students needing intervention
  - [ ] Visualize trajectories

- [ ] Comparative Performance Analysis
  - [ ] Calculate percentile rankings
  - [ ] Generate class distribution
  - [ ] Compare to historical data
  - [ ] Identify top/bottom performers
  - [ ] Create comparison charts

- [ ] Assessment Type Effectiveness
  - [ ] Categorize assessments (exam, quiz, assignment)
  - [ ] Compare average scores by type
  - [ ] Analyze correlation with final grade
  - [ ] Identify most predictive assessment types
  - [ ] Generate effectiveness report

### Insights 11-15

- [ ] Knowledge Gap Identification
  - [ ] Map prerequisites to assessments
  - [ ] Identify prerequisite failures
  - [ ] Trace knowledge dependencies
  - [ ] Recommend remediation
  - [ ] Create gap analysis report

- [ ] Consistency Scoring
  - [ ] Calculate standard deviation per student
  - [ ] Identify high-variance students
  - [ ] Compare to class average variance
  - [ ] Flag inconsistent performers
  - [ ] Visualize consistency metrics

- [ ] Peer Performance Context
  - [ ] Anonymize peer data
  - [ ] Calculate relative standing
  - [ ] Generate percentile bands
  - [ ] Create peer comparison charts
  - [ ] Ensure privacy compliance

- [ ] Predictive Grade Forecasting
  - [ ] Build linear regression model
  - [ ] Train on historical data
  - [ ] Predict final grade
  - [ ] Calculate confidence intervals
  - [ ] Validate predictions

- [ ] Learning Objective Mastery
  - [ ] Map assessments to learning objectives
  - [ ] Calculate mastery percentage
  - [ ] Identify unmet objectives
  - [ ] Track progress over time
  - [ ] Generate mastery report

### Insights 16-20

- [ ] Time-on-Task Analysis
  - [ ] Integrate with Blackboard activity logs
  - [ ] Correlate time spent with performance
  - [ ] Identify optimal study time
  - [ ] Flag under-engaged students
  - [ ] Create engagement report

- [ ] Group Work Contribution Insights
  - [ ] Compare individual vs. group grades
  - [ ] Identify contribution patterns
  - [ ] Flag potential free-riders
  - [ ] Analyze collaboration effectiveness
  - [ ] Generate contribution report

- [ ] Cross-Course Performance Trends
  - [ ] Aggregate data across courses (with consent)
  - [ ] Identify cross-course patterns
  - [ ] Detect subject-specific struggles
  - [ ] Compare performance across disciplines
  - [ ] Create holistic student profile

- [ ] Intervention Effectiveness Tracking
  - [ ] Mark intervention points
  - [ ] Measure before/after performance
  - [ ] Calculate intervention impact
  - [ ] Compare intervention types
  - [ ] Generate effectiveness report

- [ ] Personalized Learning Paths
  - [ ] Identify knowledge gaps
  - [ ] Recommend study resources
  - [ ] Suggest practice problems
  - [ ] Create personalized study plan
  - [ ] Track path completion

---

## Week 9: Redis Cache & Data Flow

### Redis Setup

- [ ] Install and configure Redis
  - [ ] Install Redis 7.x
  - [ ] Enable RedisJSON module
  - [ ] Enable RedisTimeSeries module
  - [ ] Enable RedisBloom module
  - [ ] Configure persistence (AOF)

- [ ] Design cache schema
  - [ ] Define key naming conventions
  - [ ] Design data structures
  - [ ] Set TTL policies (24h default)
  - [ ] Plan eviction strategy
  - [ ] Document schema

### Cache Implementation

- [ ] Create cache service layer
  - [ ] Implement get/set operations
  - [ ] Add TTL management
  - [ ] Implement cache invalidation
  - [ ] Add error handling
  - [ ] Create cache statistics

- [ ] Implement data caching
  - [ ] Cache gradebook data
  - [ ] Cache computed insights
  - [ ] Cache user sessions
  - [ ] Cache course metadata
  - [ ] Implement cache warming

### Gradebook Sync Engine

- [ ] Implement Blackboard REST API client
  - [ ] Set up OAuth 2.0 authentication
  - [ ] Create API wrapper functions
  - [ ] Implement rate limiting
  - [ ] Add retry logic
  - [ ] Handle API errors

- [ ] Build gradebook fetcher
  - [ ] Fetch gradebook structure
  - [ ] Fetch all grades
  - [ ] Handle pagination
  - [ ] Parse response data
  - [ ] Store in Redis cache

- [ ] Implement WebHook listener
  - [ ] Create webhook endpoint
  - [ ] Validate webhook signatures
  - [ ] Parse grade change events
  - [ ] Update cache
  - [ ] Trigger insight recalculation

---

## Week 10: Dashboard Development

### Frontend Setup

- [ ] Initialize React project
  - [ ] Create React app with TypeScript
  - [ ] Configure build tools (Vite/Webpack)
  - [ ] Set up folder structure
  - [ ] Configure linting (ESLint)
  - [ ] Set up formatting (Prettier)

- [ ] Install dependencies
  - [ ] Redux Toolkit + RTK Query
  - [ ] Socket.io-client
  - [ ] Emotion (CSS-in-JS)
  - [ ] Chart.js / Recharts
  - [ ] React Router

### State Management

- [ ] Set up Redux store
  - [ ] Configure Redux Toolkit
  - [ ] Create slices (user, course, insights)
  - [ ] Set up RTK Query API
  - [ ] Configure middleware
  - [ ] Add Redux DevTools

### Dashboard UI Components

- [ ] Create layout components
  - [ ] Header with navigation
  - [ ] Sidebar menu
  - [ ] Main content area
  - [ ] Footer
  - [ ] Responsive grid system

- [ ] Build insight cards
  - [ ] Card container component
  - [ ] Title and description
  - [ ] Visualization area
  - [ ] Action buttons
  - [ ] Loading states

- [ ] Create visualizations
  - [ ] Line charts (progression, trends)
  - [ ] Bar charts (chapter difficulty, distributions)
  - [ ] Scatter plots (correlations)
  - [ ] Heat maps (patterns)
  - [ ] Gauge charts (risk scores)

### Role-Based Views

- [ ] Implement role detection
  - [ ] Extract role from LTI context
  - [ ] Store in Redux state
  - [ ] Create role-based routing
  - [ ] Implement permission checks

- [ ] Create professor dashboard
  - [ ] Overview page with key metrics
  - [ ] All 20 insights accessible
  - [ ] Student list (anonymized)
  - [ ] Export functionality
  - [ ] Settings panel

- [ ] Create TA dashboard (limited view)
  - [ ] Subset of insights (configurable)
  - [ ] Read-only access
  - [ ] No export capability
  - [ ] Limited student data

- [ ] Create admin dashboard
  - [ ] System health metrics
  - [ ] Cross-course aggregates
  - [ ] User management
  - [ ] Configuration panel
  - [ ] Audit logs

---

## Week 11: Real-Time Features & Integration

### WebSocket Server

- [ ] Set up Socket.io server
  - [ ] Install Socket.io
  - [ ] Configure server
  - [ ] Set up authentication
  - [ ] Create room management
  - [ ] Add error handling

- [ ] Implement real-time events
  - [ ] Grade update events
  - [ ] Insight recalculation events
  - [ ] User activity events
  - [ ] System notifications
  - [ ] Error alerts

### Frontend WebSocket Integration

- [ ] Connect to WebSocket server
  - [ ] Establish connection on login
  - [ ] Handle reconnection
  - [ ] Subscribe to relevant rooms
  - [ ] Handle disconnection
  - [ ] Show connection status

- [ ] Handle real-time updates
  - [ ] Update Redux state on events
  - [ ] Refresh visualizations
  - [ ] Show toast notifications
  - [ ] Animate changes
  - [ ] Log events

### Names & Roles Service

- [ ] Implement roster sync
  - [ ] Call Names & Roles API
  - [ ] Parse roster data
  - [ ] Store in Redis cache
  - [ ] Handle roster changes
  - [ ] Update UI automatically

---

## Week 12: Testing, Optimization & Pilot

### Performance Optimization

- [ ] Backend optimization
  - [ ] Profile API endpoints
  - [ ] Optimize database queries
  - [ ] Implement caching strategies
  - [ ] Add request compression
  - [ ] Optimize WASM modules

- [ ] Frontend optimization
  - [ ] Code splitting
  - [ ] Lazy loading components
  - [ ] Memoization (React.memo, useMemo)
  - [ ] Virtual scrolling for lists
  - [ ] Image optimization

### Testing

- [ ] Backend testing
  - [ ] Unit tests (Jest)
  - [ ] Integration tests (Supertest)
  - [ ] LTI launch flow tests
  - [ ] API endpoint tests
  - [ ] WebSocket tests

- [ ] Frontend testing
  - [ ] Component tests (React Testing Library)
  - [ ] Redux tests
  - [ ] Integration tests
  - [ ] E2E tests (Playwright/Cypress)
  - [ ] Accessibility tests

- [ ] Performance testing
  - [ ] Load testing (Artillery/k6)
  - [ ] Stress testing
  - [ ] Latency measurement
  - [ ] Memory profiling
  - [ ] Concurrent user testing

### Security Testing

- [ ] Penetration testing
  - [ ] Test LTI authentication
  - [ ] Test JWT validation
  - [ ] Test authorization
  - [ ] Test input validation
  - [ ] Test XSS/CSRF protection

### Pilot Preparation

- [ ] Create deployment package
  - [ ] Docker image
  - [ ] Configuration templates
  - [ ] Installation scripts
  - [ ] Database migrations
  - [ ] Monitoring setup

- [ ] Documentation
  - [ ] Installation guide
  - [ ] User manual (professor)
  - [ ] Admin guide
  - [ ] API documentation
  - [ ] Troubleshooting guide

### Pilot Execution

- [ ] Deploy to pilot institution
  - [ ] Set up infrastructure
  - [ ] Configure Blackboard integration
  - [ ] Register LTI tool
  - [ ] Test all features
  - [ ] Train administrators

- [ ] Onboard 10 professors
  - [ ] Schedule training sessions
  - [ ] Provide user guides
  - [ ] Set up support channel
  - [ ] Monitor initial usage
  - [ ] Collect early feedback

- [ ] Monitor and support
  - [ ] Daily health checks
  - [ ] Respond to issues
  - [ ] Track usage metrics
  - [ ] Collect feedback
  - [ ] Document bugs

### Validation

- [ ] Measure success criteria
  - [ ] Verify 95% accuracy
  - [ ] Measure latency (<2s)
  - [ ] Track uptime
  - [ ] Survey user satisfaction
  - [ ] Calculate time saved

- [ ] Create pilot report
  - [ ] Compile metrics
  - [ ] Include testimonials
  - [ ] Document issues
  - [ ] List improvements
  - [ ] Recommend Phase 3 priorities

---

## Deliverables Checklist

- [ ] LTI 1.3 Building Block for Blackboard
- [ ] All 20 WASM insight modules
- [ ] Redis-based caching system
- [ ] Complete dashboard (professor, TA, admin views)
- [ ] Real-time update system
- [ ] Docker deployment package
- [ ] Complete documentation set
- [ ] Pilot report with metrics

---

## Success Criteria Validation

- [ ] ✅ 95% accuracy achieved
- [ ] ✅ <2s latency for all insights
- [ ] ✅ Successful pilot with 10 professors
- [ ] ✅ Positive user feedback (≥4/5)
- [ ] ✅ No critical security issues
- [ ] ✅ 99%+ uptime during pilot

---

## Notes & Blockers

**Blockers:**

- [ ] Blackboard LTI 1.3 registration approval
- [ ] Institution IT approval for deployment
- [ ] Access to production Blackboard instance

**Dependencies:**

- Blackboard REST API access
- Redis server availability
- SSL certificates for production

**Risks:**

- LTI integration complexity
- Performance with large courses (>500 students)
- Real-time sync reliability
