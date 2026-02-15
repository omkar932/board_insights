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
      right: -420px;
      width: 400px;
      height: 100vh;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      transition: right 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #sanketa-panel.open { right: 0; }
    .s-header {
      padding: 24px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .s-header h2 { margin: 0; font-size: 22px; font-weight: 700; }
    .s-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 20px;
    }
    #sanketa-panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
    .s-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      border: 1px solid #f1f5f9;
    }
    .s-card h4 { margin: 0 0 12px 0; color: #4338ca; display: flex; align-items: center; gap: 8px; }
    .s-card p { margin: 4px 0; color: #64748b; font-size: 14px; }
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

// Open / Create Panel
function openSanketaPanel() {
  let panel = document.getElementById('sanketa-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'sanketa-panel';
    panel.innerHTML = `
      <div class="s-header">
        <h2>Sanketa</h2>
        <button class="s-close">&times;</button>
      </div>
      <div id="sanketa-panel-content">
        <div style="text-align:center; padding: 40px;">
          <div style="width:40px; height:40px; border:3px solid #f3f3f3; border-top:3px solid #6366f1; border-radius:50%; animation: spin 1s linear infinite; margin:0 auto 16px;"></div>
          <p style="color:#64748b;">Analyzing Gradebook...</p>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    panel.querySelector('.s-close').addEventListener('click', () => panel.classList.remove('open'));
    
    // Inject spin animation
    const spinStyle = document.createElement('style');
    spinStyle.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(spinStyle);
  }

  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
  } else {
    panel.classList.add('open');
    extractGradebookData();
  }
}

// Close Sanketa panel
function closeSanketaPanel() {
  const panel = document.getElementById('sanketa-panel');
  if (panel) panel.classList.remove('open');
}

// Extract gradebook data from the page
async function extractGradebookData() {
  try {
    console.log('Extracting gradebook data...');
    
    // Parse the HTML table
    const table = document.getElementById('gradebookTable');
    if (!table) {
      throw new Error('Gradebook table not found');
    }
    
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    
    // assignments are columns 3 onwards (0-indexed)
    // Format: "Quiz 1 (100)" -> name: "Quiz 1", max: 100
    const assignments = headers.slice(2).map((header, index) => {
      const match = header.match(/(.*)\((\d+)\)/);
      return {
        id: `A${index + 1}`,
        name: match ? match[1].trim() : header,
        max_score: match ? parseFloat(match[2]) : 100,
        due_date: null
      };
    });
    
    const grades = [];
    const students = [];
    
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('td');
      const lastName = cells[0].textContent.trim();
      const firstName = cells[1].textContent.trim();
      const studentId = `S${rowIndex + 1}`;
      
      students.push({
        id: studentId,
        name: `${firstName} ${lastName}`
      });
      
      // Process grade cells
      cells.forEach((cell, cellIndex) => {
        if (cellIndex < 2) return; // Skip name columns
        
        const assignmentIndex = cellIndex - 2;
        const assignment = assignments[assignmentIndex];
        const scoreText = cell.textContent.trim();
        const score = parseFloat(scoreText) || 0;
        
        grades.push({
          student_id: studentId,
          assignment_id: assignment.id,
          score: score,
          max_score: assignment.max_score,
          submitted_at: new Date().toISOString(),
          due_date: null
        });
      });
    });
    
    const gradebookData = {
      courseId: extractCourseId() || 'MOCK_101',
      courseName: extractCourseName() || 'Mock Course',
      students,
      assignments,
      grades,
      extractedAt: new Date().toISOString()
    };
    
    console.log('Gradebook data extracted:', gradebookData);
    
    // Compute insights (send wrapper object expected by background)
    const insights = await computeInsights({
      courseId: gradebookData.courseId,
      gradebook: gradebookData
    });
    
    // Display insights
    displayInsights(insights, gradebookData.students);
    
  } catch (error) {
    console.error('Error extracting gradebook data:', error);
    // fallback to display error in panel
    const content = document.getElementById('sanketa-panel-content');
    if(content) {
      content.innerHTML = `<div style="padding:20px; color:red">Error: ${error.message}</div>`;
    }
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

// Display insights in the panel
function displayInsights(insights, students) {
  const content = document.getElementById('sanketa-panel-content');
  if (!content) return;

  const reliabilityColor = insights.assessmentQuality.reliability > 0.8 ? '#10b981' : (insights.assessmentQuality.reliability > 0.6 ? '#f59e0b' : '#ef4444');
  
  // Prepare student data with safe fallbacks for WASM fields
  const studentDetails = students.map(student => {
    const risk = insights.earlyIntervention.high_risk.find(r => r.student_id === student.id) || 
                 insights.earlyIntervention.medium_risk.find(r => r.student_id === student.id) ||
                 insights.earlyIntervention.low_risk.find(r => r.student_id === student.id);
    const patternObj = insights.performancePatterns.student_patterns.find(p => p.student_id === student.id);
    const progression = insights.learningProgression.student_progressions.find(p => p.student_id === student.id);
    
    // Extract trait from patterns array safely
    let trait = 'Consistent';
    if (patternObj && patternObj.patterns && patternObj.patterns.length > 0) {
      trait = patternObj.patterns[0].pattern_type.replace('_', ' ');
    }
    
    return {
      name: student.name,
      riskLevel: risk ? risk.risk_level : 'low',
      trait: trait,
      velocity: progression ? progression.metrics.velocity : 0,
      factors: risk ? risk.factors : []
    };
  });

  // Get unique overall traits for the cloud
  const allTraits = [...new Set(insights.performancePatterns.student_patterns.flatMap(p => 
    p.patterns.map(pat => pat.pattern_type.replace('_', ' '))
  ))].slice(0, 4);

  content.innerHTML = `
    <div class="sanketa-insights">
      <!-- CLASS HEALTH DASHBOARD -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin:0 0 16px 0; font-size:16px; color:#1e293b; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">Class Performance</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom:12px;">
          <div class="s-card" style="margin-bottom:0; padding:16px; background:#f8fafc;">
            <div style="font-size:11px; color:#64748b; font-weight:600; margin-bottom:4px;">LEARNING TREND</div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:16px; font-weight:700; color:#4338ca; text-transform:capitalize;">${insights.learningProgression.class_average_trend}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${insights.learningProgression.class_average_trend === 'declining' ? '#ef4444' : '#10b981'}" stroke-width="3">
                ${insights.learningProgression.class_average_trend === 'declining' ? '<path d="M23 18l-9-9-5 5-9-9M23 18h-6M23 18v-6"/>' : '<path d="M23 6l-9 9-5-5-9 9M23 6h-6M23 6v6"/>'}
              </svg>
            </div>
          </div>
          
          <div class="s-card" style="margin-bottom:0; padding:16px; background:#f8fafc;">
            <div style="font-size:11px; color:#64748b; font-weight:600; margin-bottom:4px;">RELIABILITY</div>
            <div style="font-size:18px; font-weight:700; color:${reliabilityColor};">${(insights.assessmentQuality.reliability * 100).toFixed(0)}%</div>
          </div>
        </div>

        <div class="s-card" style="padding:16px; background:#f8fafc;">
          <div style="font-size:11px; color:#64748b; font-weight:600; margin-bottom:8px;">COMMON BEHAVIORS</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${allTraits.map(trait => `<span style="background:#e0e7ff; color:#4338ca; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600; text-transform:capitalize;">${trait}</span>`).join('')}
          </div>
        </div>
      </div>

      <!-- STUDENT LIST -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin:0 0 16px 0; font-size:16px; color:#1e293b; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">Student Records</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${studentDetails.map(s => `
            <div class="s-card" style="margin-bottom:0; padding:14px; border-left: 4px solid ${s.riskLevel === 'high' ? '#ef4444' : (s.riskLevel === 'medium' ? '#f59e0b' : '#10b981')}; background:white;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="flex:1;">
                  <div style="font-weight:600; color:#1e293b; font-size:14px;">${s.name}</div>
                  <div style="font-size:11px; color:#64748b; margin-top:2px; display:flex; gap:8px;">
                    <span style="text-transform:capitalize;">${s.trait}</span>
                    <span>•</span>
                    <span style="color:${s.velocity >= 0 ? '#059669' : '#dc2626'}">${s.velocity >= 0 ? '+' : ''}${s.velocity.toFixed(1)} velocity</span>
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:9px; font-weight:800; text-transform:uppercase; padding:2px 6px; border-radius:4px; 
                    background:${s.riskLevel === 'high' ? '#fee2e2' : (s.riskLevel === 'medium' ? '#fef3c7' : '#d1fae5')}; 
                    color:${s.riskLevel === 'high' ? '#b91c1c' : (s.riskLevel === 'medium' ? '#b45309' : '#047857')}">
                    ${s.riskLevel}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- TOPICS -->
      <div class="s-card" style="background:#4338ca; border:none;">
        <h4 style="color:white; font-size:13px; margin-bottom:8px;"><span>📚</span> Hardest Topics</h4>
        <p style="color:rgba(255,255,255,0.8); font-size:13px; margin:0;">
          ${insights.chapterDifficulty.hardest_chapter ? 
            `Section <b style="color:white;">${insights.chapterDifficulty.hardest_chapter}</b> requires attention.` : 
            'All course sections performing within expected range.'}
        </p>
      </div>
    </div>
  `;
}

// Display error
function displayError(message) {
  const content = document.getElementById('sanketa-panel-content');
  if (!content) return;

  content.innerHTML = `
    <div style="text-align:center; padding: 40px 20px;">
      <div style="font-size:40px; margin-bottom:16px;">⚠️</div>
      <h3 style="margin:0; color:#1e293b; font-size:18px;">Analysis Failed</h3>
      <p style="color:#64748b; font-size:14px; margin:12px 0 24px;">${message}</p>
      <button onclick="location.reload()" style="background:#6366f1; color:white; border:none; padding:10px 24px; border-radius:8px; font-weight:600; cursor:pointer;">Retry Analysis</button>
    </div>
  `;
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectGradebookPage);
} else {
  detectGradebookPage();
}

// Also check when URL changes (for single-page apps)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    detectGradebookPage();
  }
}).observe(document, { subtree: true, childList: true });
