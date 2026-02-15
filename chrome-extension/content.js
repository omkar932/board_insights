// Sanketa Content Script
// Runs on Blackboard pages to detect and extract gradebook data

console.log('Sanketa content script loaded');

// Detect if we're on a Blackboard gradebook page
function detectGradebookPage() {
  const url = window.location.href;
  
  // Check for gradebook URL patterns
  const isGradebook = url.includes('/webapps/gradebook/') || 
                      url.includes('/ultra/courses/') ||
                      url.includes('mock-blackboard.html') ||
                      document.querySelector('[id*="gradebook"]') !== null;
  
  if (isGradebook) {
    console.log('Gradebook page detected!');
    extractCourseContext();
  }
  
  return isGradebook;
}

// Extract course context from the page
function extractCourseContext() {
  try {
    // Try to extract course ID and name from various locations
    const courseId = extractCourseId();
    const courseName = extractCourseName();
    
    if (courseId) {
      console.log('Course detected:', courseId, courseName);
      
      // Notify background script
      chrome.runtime.sendMessage({
        type: 'GRADEBOOK_DETECTED',
        data: {
          courseId,
          courseName,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      });
      
      // Inject Sanketa UI
      injectSanketaUI();
    }
  } catch (error) {
    console.error('Error extracting course context:', error);
  }
}

// Extract course ID from URL or page
function extractCourseId() {
  // Try mock page ID first
  const mockId = document.getElementById('courseId');
  if (mockId) return mockId.textContent.trim();

  // Try URL first
  const urlMatch = window.location.href.match(/course_id=([^&]+)/);
  if (urlMatch) return urlMatch[1];
  
  // Try Ultra course link
  const ultraMatch = window.location.href.match(/\/ultra\/courses\/([^\/]+)/);
  if (ultraMatch) return ultraMatch[1];

  // Try from breadcrumb or title
  const breadcrumb = document.querySelector('.breadcrumbs, #courseMenuPalette_paletteTitleHeading');
  if (breadcrumb) {
    const match = breadcrumb.textContent.match(/\(([A-Z0-9_-]+)\)/);
    if (match) return match[1];
  }
  
  return null;
}

// Extract course name
function extractCourseName() {
  // Try mock page name first
  const mockName = document.getElementById('courseName');
  if (mockName) return mockName.textContent.trim();

  // Try page title or header
  const titleElement = document.querySelector('h1.page-title, .course-title, #courseMenuPalette_paletteTitleHeading, [data-test-id="course-title"]');
  if (titleElement) return titleElement.textContent.trim();
  
  // Try breadcrumb
  const breadcrumb = document.querySelector('.breadcrumbs a, .breadcrumb-item');
  if (breadcrumb) return breadcrumb.textContent.trim();
  
  // Fallback to document title
  return document.title.split('|')[0].trim();
}

// Inject Sanketa UI into the page
// Global state for current view
let currentInsightsData = null;
let currentStudentsData = null;
let currentView = 'summary';

// Inject Sanketa UI into the page
function injectSanketaUI() {
  if (document.getElementById('sanketa-fab')) return;

  // Create styles
  const style = document.createElement('style');
  style.textContent = `
    #sanketa-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
    }
    #sanketa-fab-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      border: none;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #sanketa-fab-button:hover {
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    }
    #sanketa-panel {
      position: fixed;
      top: 0;
      right: -520px;
      width: 500px;
      height: 100vh;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #sanketa-panel.open { right: 0; }
    #sanketa-panel.expanded { width: 800px; right: 0; }
    
    .s-header {
      padding: 20px 24px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(99, 102, 241, 0.2);
    }
    .s-header h2 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
    
    .s-header-actions { display: flex; gap: 8px; }
    
    .s-btn-icon {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .s-btn-icon:hover { background: rgba(255, 255, 255, 0.3); }

    #sanketa-panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      scroll-behavior: smooth;
    }

    .s-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      border: 1px solid #f1f5f9;
    }

    /* Report Specific Styles */
    .s-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .s-table th { text-align: left; font-size: 11px; color: #94a3b8; text-transform: uppercase; padding: 12px 8px; border-bottom: 1px solid #f1f5f9; }
    .s-table td { padding: 12px 8px; border-bottom: 1px solid #f8fafc; font-size: 13px; vertical-align: middle; }
    
    .s-chart-row { display: flex; align-items: flex-end; gap: 8px; height: 120px; padding-top: 20px; }
    .s-bar { flex: 1; min-width: 12px; background: #6366f1; border-radius: 4px 4px 0 0; position: relative; }
    .s-bar:hover::after {
      content: attr(data-val);
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      font-weight: 700;
      color: #1e293b;
    }
  `;
  document.head.appendChild(style);

  // FAB
  const fab = document.createElement('div');
  fab.id = 'sanketa-fab';
  fab.innerHTML = `<button id="sanketa-fab-button" title="Sanketa Analytics">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M12 20V10M18 20V4M6 20v-4"/>
    </svg>
  </button>`;
  document.body.appendChild(fab);

  document.getElementById('sanketa-fab-button').addEventListener('click', openSanketaPanel);
}

// Open / Close Panel
function openSanketaPanel() {
  let panel = document.getElementById('sanketa-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'sanketa-panel';
    panel.innerHTML = `
      <div class="s-header">
        <div style="display:flex; align-items:center; gap:12px;">
          <button id="sanketa-back-btn" class="s-btn-icon" style="display:none;" title="Back to Summary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h2 id="sanketa-panel-title">Sanketa</h2>
        </div>
        <div class="s-header-actions">
          <button id="sanketa-panel-close" class="s-btn-icon" title="Close Panel">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      <div id="sanketa-panel-content">
        <div style="text-align:center; padding: 40px 20px;">
          <div style="width:40px; height:40px; border:3px solid #f3f3f3; border-top:3px solid #6366f1; border-radius:50%; animation: spin 1s linear infinite; margin:0 auto 16px;"></div>
          <p style="color:#64748b; font-size:14px; margin-top:16px;">Analyzing gradebook data...</p>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    
    document.getElementById('sanketa-panel-close').onclick = () => panel.classList.remove('open', 'expanded');
    document.getElementById('sanketa-back-btn').onclick = () => setView('summary');
    
    // Inject spin animation
    const spinStyle = document.createElement('style');
    spinStyle.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(spinStyle);
  }
  
  panel.classList.add('open');
  if (currentInsightsData) {
    setView(currentView);
  } else {
    extractGradebookData();
  }
}

// View Switching
function setView(view) {
  currentView = view;
  const panel = document.getElementById('sanketa-panel');
  const title = document.getElementById('sanketa-panel-title');
  const backBtn = document.getElementById('sanketa-back-btn');
  
  if (view === 'report') {
    panel.classList.add('expanded');
    title.textContent = 'Full Analysis Report';
    backBtn.style.display = 'flex';
    renderDetailedReport(currentInsightsData, currentStudentsData);
  } else {
    panel.classList.remove('expanded');
    title.textContent = 'Sanketa Summary';
    backBtn.style.display = 'none';
    renderSummary(currentInsightsData, currentStudentsData);
  }
}

// Extract gradebook data from the page
async function extractGradebookData() {
  try {
    const table = document.getElementById('gradebookTable') || document.querySelector('table');
    if (!table) throw new Error('Gradebook table not found');

    const assignments = [];
    const students = [];
    const grades = [];

    // Extract assignments from header
    const headers = table.querySelectorAll('thead th');
    headers.forEach((th, index) => {
      if (index < 2) return; // Skip name columns
      const text = th.textContent.trim();
      const maxScoreMatch = text.match(/\((\d+)\)/);
      const maxScore = maxScoreMatch ? parseFloat(maxScoreMatch[1]) : 100;
      
      assignments.push({
        id: `A${index - 1}`,
        name: text.split('(')[0].trim(),
        max_score: maxScore
      });
    });

    // Extract students and grades
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 3) return;

      const lastName = cells[0].textContent.trim();
      const firstName = cells[1].textContent.trim();
      const studentId = `S${rowIndex + 1}`;
      students.push({ id: studentId, name: `${firstName} ${lastName}` });
      
      cells.forEach((cell, cellIndex) => {
        if (cellIndex < 2) return;
        const score = parseFloat(cell.textContent.trim()) || 0;
        const assignment = assignments[cellIndex - 2];
        
        grades.push({
          student_id: studentId,
          assignment_id: assignment.id,
          score: score,
          max_score: assignment.max_score
        });
      });
    });

    const gradebookData = {
      courseId: extractCourseId() || 'MOCK_101',
      students,
      assignments,
      grades
    };

    const insights = await computeInsights({
      courseId: gradebookData.courseId,
      gradebook: gradebookData
    });

    currentInsightsData = insights;
    currentStudentsData = students;
    setView('summary');

  } catch (error) {
    displayError(error.message);
  }
}

// Compute insights
async function computeInsights(gradebookData) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'COMPUTE_INSIGHTS',
      data: gradebookData
    }, (response) => {
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

// Render Summary View
function renderSummary(insights, students) {
  const content = document.getElementById('sanketa-panel-content');
  const reliabilityColor = insights.assessmentQuality.reliability > 0.8 ? '#10b981' : (insights.assessmentQuality.reliability > 0.6 ? '#f59e0b' : '#ef4444');

  const atRiskCount = insights.earlyIntervention.high_risk.length + insights.earlyIntervention.medium_risk.length;

  content.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h3 style="margin:0 0 16px 0; font-size:14px; text-transform:uppercase; color:#64748b; font-weight:700;">Class Performance</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="s-card" style="margin-bottom:0; background:#f8fafc;">
          <div style="font-size:10px; font-weight:700; color:#94a3b8; margin-bottom:4px;">RELIABILITY</div>
          <div style="font-size:24px; font-weight:800; color:${reliabilityColor};">${(insights.assessmentQuality.reliability * 100).toFixed(0)}%</div>
        </div>
        <div class="s-card" style="margin-bottom:0; background:#f8fafc;">
          <div style="font-size:10px; font-weight:700; color:#94a3b8; margin-bottom:4px;">AT RISK</div>
          <div style="font-size:24px; font-weight:800; color:#ef4444;">${atRiskCount}</div>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <h3 style="margin:0 0 16px 0; font-size:14px; text-transform:uppercase; color:#64748b; font-weight:700;">Insights Summary</h3>
      <div class="s-card" style="border-left: 4px solid #ef4444; margin-bottom:12px;">
        <h4 style="margin:0; font-size:14px;">🔥 Early Intervention</h4>
        <p style="margin-top:8px;">${atRiskCount > 0 ? `<b>${atRiskCount}</b> students are showing significant performance variations.` : 'Stability detected across all student performance tracks.'}</p>
      </div>
      
      <div id="open-full-report" class="s-card" style="cursor:pointer; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color:white; border:none; text-align:center; transition: transform 0.2s;">
        <h4 style="margin:0; color:white; justify-content:center; gap:12px;">
           <span>Analyze Full Report</span> 
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
        </h4>
      </div>
    </div>
  `;
  
  const reportBtn = document.getElementById('open-full-report');
  reportBtn.onmouseover = () => reportBtn.style.transform = 'translateY(-2px)';
  reportBtn.onmouseout = () => reportBtn.style.transform = 'translateY(0)';
  reportBtn.onclick = () => setView('report');
}

// Render Detailed Report View
function renderDetailedReport(insights, students) {
  const content = document.getElementById('sanketa-panel-content');
  
  const studentRows = students.map(student => {
    const risk = insights.earlyIntervention.high_risk.find(r => r.student_id === student.id) || 
                 insights.earlyIntervention.medium_risk.find(r => r.student_id === student.id) ||
                 insights.earlyIntervention.low_risk.find(r => r.student_id === student.id);
    const progression = insights.learningProgression.student_progressions.find(p => p.student_id === student.id);
    
    return `
      <tr>
        <td style="font-weight:600; color:#1e293b;">${student.name}</td>
        <td>
          <span style="padding:4px 10px; border-radius:12px; font-size:10px; font-weight:800; text-transform:uppercase; display:inline-block;
            background:${risk.risk_level === 'high' ? '#fee2e2' : (risk.risk_level === 'medium' ? '#fef3c7' : '#d1fae5')}; 
            color:${risk.risk_level === 'high' ? '#b91c1c' : (risk.risk_level === 'medium' ? '#b45309' : '#047857')}">
            ${risk.risk_level}
          </span>
        </td>
        <td style="color:${progression.metrics.velocity >= 0 ? '#10b981' : '#ef4444'}; font-weight:700;">
          ${progression.metrics.velocity >= 0 ? '+' : ''}${progression.metrics.velocity.toFixed(1)}
        </td>
        <td style="font-weight:600;">${progression.metrics.projected_performance.toFixed(0)}%</td>
        <td style="font-size:12px; color:#64748b; line-height:1.4; max-width:200px;">${risk.recommendations[0]}</td>
      </tr>
    `;
  }).join('');

  content.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr; gap:24px;">
      <div>
        <h3 style="margin:0 0 16px 0; font-size:14px; text-transform:uppercase; color:#64748b; font-weight:700;">Curriculum Difficulty Heatmap</h3>
        <div class="s-card" style="padding:24px 32px;">
           <div class="s-chart-row">
             ${insights.chapterDifficulty.chapters.slice(0, 8).map(ch => `
               <div class="s-bar" style="height:${ch.avg_score}%" data-val="${ch.avg_score.toFixed(0)}%"></div>
             `).join('')}
           </div>
           <div style="display:flex; justify-content:space-between; margin-top:12px; font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase;">
             <span>Chapter 1</span>
             <span>Chapter 8</span>
           </div>
        </div>
      </div>

      <div>
        <h3 style="margin:0 0 16px 0; font-size:14px; text-transform:uppercase; color:#64748b; font-weight:700;">Student Performance Matrix</h3>
        <div class="s-card" style="padding:0; overflow:hidden;">
          <table class="s-table">
            <thead>
              <tr>
                <th style="padding-left:24px;">Student</th>
                <th>Risk</th>
                <th>Velocity</th>
                <th>Proj.</th>
                <th style="padding-right:24px;">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              ${studentRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// Display error
function displayError(message) {
  const content = document.getElementById('sanketa-panel-content');
  if (content) {
    content.innerHTML = `
      <div style="text-align:center; padding: 40px 20px;">
        <div style="font-size:40px; margin-bottom:16px;">⚠️</div>
        <h3 style="margin:0; color:#1e293b; font-size:18px;">Analysis Failed</h3>
        <p style="color:#64748b; font-size:14px; margin:12px 0 24px;">${message}</p>
        <button id="sanketa-retry" style="background:#6366f1; color:white; border:none; padding:10px 24px; border-radius:8px; font-weight:600; cursor:pointer;">Retry Extraction</button>
      </div>
    `;
    document.getElementById('sanketa-retry').onclick = () => extractGradebookData();
  }
}

// Compute insights via background service worker
async function computeInsights(gradebookData) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'COMPUTE_INSIGHTS',
      data: gradebookData
    }, (response) => {
      if (response && response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response ? response.error : 'Computation failed'));
      }
    });
  });
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectGradebookPage);
} else {
  detectGradebookPage();
}

// Listen for URL changes
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    detectGradebookPage();
  }
}).observe(document, {subtree: true, childList: true});

