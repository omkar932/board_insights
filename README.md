# BoardInsight 📊

**Transforming Academic Data into Actionable Intelligence**

BoardInsight is a high-fidelity Chrome extension and analytics engine designed to help professors achieve "Teaching Excellence" through real-time, data-driven insights directly within Blackboard Learn.

## 🚀 Key Features

- **Executive Dashboard**: Real-time Reliability Index, Intervention Alerts, and Knowledge Gap Identification.
- **Teaching Excellence Matrix**: Grade distributions, Improvement Trajectories, and Predictive Forecasting.
- **Individual Performance Profiles**: Deep-dive into student-specific annual progress charts and personalized AI reasoning.
- **Privacy-First (Ghost DB)**: Zero-data persistence; all analytics are computed locally via WebAssembly.

## 🛠 Project Structure

- `chrome-extension/`: Manifest V3 extension with integrated sidebar UI.
- `analytics-wasm/`: Rust-powered analytics engine compiled to WebAssembly.
- `boardinsights.md`: The official project proposal and vision document.
- `docs/architecture.md`: Detailed technical requirements and system architecture.

## 📦 Getting Started

### 1. Build the Analytics Engine

```bash
cd analytics-wasm
wasm-pack build --target web
```

### 2. Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `chrome-extension/` directory.

### 3. Usage

- Navigate to any Blackboard Gradebook page.
- The **BoardInsight** sidebar will automatically appear and begin extraction.

## 📈 Roadmap & Vision

BoardInsight is currently in the MVP phase, focusing on 20 transformative insights for higher education. See [docs/architecture.md](docs/architecture.md) for the full roadmap.

---

_Built for educators who demand excellence._
