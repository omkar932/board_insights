# BoardInsight Architecture & Requirements

> [!NOTE]
> This document was formerly the project README. It serves as the comprehensive technical specification and vision for the BoardInsight platform.

## 1. PROJECT VISION

**BoardInsight** is an AI-powered educational analytics platform that integrates deeply with Blackboard Learn to provide professors with real‑time, actionable intelligence. The system delivers 20 distinct insights (e.g., early intervention alerts, chapter difficulty analysis) using a browser-side WebAssembly computation engine, eliminating the need for a traditional database or ETL pipelines.

## 2. FUNCTIONAL REQUIREMENTS

The system generates 20 automated insights without storing raw student data:

1. **Early Intervention Alerts**: Flags students as high/medium/low risk.
2. **Chapter Difficulty Analysis**: Identifies topics where students collectively struggle.
3. **Assessment Quality Insights**: Evaluates assessment reliability.
4. **Learning Progression Tracking**: Measures the velocity of learning.
5. **Performance Pattern Recognition**: Detects consistency and volatility.
   ... (See `boardinsights.md` for the full list of transformative insights)

## 3. SYSTEM ARCHITECTURE

### 3.1 High-Level Data Flow

1. **Extraction**: Content scripts extract gradebook data directly from the Blackboard DOM.
2. **Computation**: Rust-based WebAssembly (WASM) processes grades in the background service worker.
3. **Visualization**: The results are injected into a custom sidebar directly within the Blackboard UI.

### 3.2 Component Breakdown

- **Chrome Extension**: The primary delivery vehicle for the analytics.
- **WASM Engine**: High-performance, private-by-design analytics core.
- **Ghost Database**: Ephemeral storage model ensuring zero data persistence.

## 4. PRIVACY & COMPLIANCE

- **FERPA/GDPR Compliant**: No student data is stored on external servers.
- **Local Sovereignty**: All calculations happen within the professor's browser environment.
