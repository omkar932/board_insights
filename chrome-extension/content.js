// Sanketa Content Script
// Runs on Blackboard pages to detect and extract gradebook data

console.log('Sanketa content script loaded');

// Detect if we're on a Blackboard gradebook page
function detectGradebookPage() {
  const url = window.location.href;
  
  // Check for gradebook URL patterns
  const isGradebook = url.includes('/webapps/gradebook/') || 
                      url.includes('/ultra/courses/') ||
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
  // Try URL first
  const urlMatch = window.location.href.match(/course_id=([^&]+)/);
  if (urlMatch) return urlMatch[1];
  
  // Try data attributes
  const courseElement = document.querySelector('[data-course-id]');
  if (courseElement) return courseElement.dataset.courseId;
  
  // Try from breadcrumb or title
  const breadcrumb = document.querySelector('.breadcrumbs');
  if (breadcrumb) {
    const match = breadcrumb.textContent.match(/\(([A-Z0-9-]+)\)/);
    if (match) return match[1];
  }
  
  return null;
}

// Extract course name
function extractCourseName() {
  // Try page title
  const titleElement = document.querySelector('h1.page-title, .course-title, #courseMenuPalette_paletteTitleHeading');
  if (titleElement) return titleElement.textContent.trim();
  
  // Try breadcrumb
  const breadcrumb = document.querySelector('.breadcrumbs a');
  if (breadcrumb) return breadcrumb.textContent.trim();
  
  // Fallback to document title
  return document.title.split('|')[0].trim();
}

// Inject Sanketa UI into the page
function injectSanketaUI() {
  // Check if already injected
  if (document.getElementById('sanketa-panel')) {
    return;
  }
  
  // Create floating action button
  const fab = document.createElement('div');
  fab.id = 'sanketa-fab';
  fab.innerHTML = `
    <button id="sanketa-fab-button" title="Open Sanketa Analytics">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
      </svg>
    </button>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #sanketa-fab {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
    }
    
    #sanketa-fab-button {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    #sanketa-fab-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0,0,0,0.4);
    }
    
    #sanketa-fab-button:active {
      transform: scale(0.95);
    }
    
    #sanketa-panel {
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100vh;
      background: white;
      box-shadow: -2px 0 12px rgba(0,0,0,0.2);
      z-index: 9999;
      transition: right 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    
    #sanketa-panel.open {
      right: 0;
    }
    
    #sanketa-panel-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    #sanketa-panel-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
    
    #sanketa-panel-close {
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }
    
    #sanketa-panel-close:hover {
      background: rgba(255,255,255,0.2);
    }
    
    #sanketa-panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }
    
    .sanketa-loading {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }
    
    .sanketa-spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(fab);
  
  // Add click handler
  document.getElementById('sanketa-fab-button').addEventListener('click', openSanketaPanel);
}

// Open Sanketa panel
function openSanketaPanel() {
  // Create panel if it doesn't exist
  if (!document.getElementById('sanketa-panel')) {
    const panel = document.createElement('div');
    panel.id = 'sanketa-panel';
    panel.innerHTML = `
      <div id="sanketa-panel-header">
        <h2>📊 Sanketa Analytics</h2>
        <button id="sanketa-panel-close">×</button>
      </div>
      <div id="sanketa-panel-content">
        <div class="sanketa-loading">
          <div class="sanketa-spinner"></div>
          <p>Extracting gradebook data...</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add close handler
    document.getElementById('sanketa-panel-close').addEventListener('click', closeSanketaPanel);
    
    // Start data extraction
    extractGradebookData();
  }
  
  // Open panel
  document.getElementById('sanketa-panel').classList.add('open');
}

// Close Sanketa panel
function closeSanketaPanel() {
  document.getElementById('sanketa-panel').classList.remove('open');
}

// Extract gradebook data from the page
async function extractGradebookData() {
  try {
    console.log('Extracting gradebook data...');
    
    // This is a placeholder - actual implementation will depend on Blackboard's structure
    // For now, we'll create mock data
    
    const gradebookData = {
      courseId: extractCourseId(),
      courseName: extractCourseName(),
      students: extractStudents(),
      assignments: extractAssignments(),
      grades: extractGrades(),
      extractedAt: new Date().toISOString()
    };
    
    console.log('Gradebook data extracted:', gradebookData);
    
    // Send to background for storage
    chrome.runtime.sendMessage({
      type: 'EXTRACT_DATA',
      data: gradebookData
    });
    
    // Compute insights
    const insights = await computeInsights(gradebookData);
    
    // Display insights
    displayInsights(insights);
    
  } catch (error) {
    console.error('Error extracting gradebook data:', error);
    displayError(error.message);
  }
}

// Extract student list (placeholder)
function extractStudents() {
  // TODO: Implement actual extraction from Blackboard DOM
  return [];
}

// Extract assignment list (placeholder)
function extractAssignments() {
  // TODO: Implement actual extraction from Blackboard DOM
  return [];
}

// Extract grades (placeholder)
function extractGrades() {
  // TODO: Implement actual extraction from Blackboard DOM
  return [];
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
function displayInsights(insights) {
  const content = document.getElementById('sanketa-panel-content');
  
  content.innerHTML = `
    <div class="sanketa-insights">
      <h3>📈 Insights Ready</h3>
      <p>Analytics computed successfully!</p>
      
      <div class="insight-card">
        <h4>🚨 Early Intervention</h4>
        <p>High Risk: ${insights.earlyIntervention.highRisk.length} students</p>
        <p>Medium Risk: ${insights.earlyIntervention.mediumRisk.length} students</p>
      </div>
      
      <div class="insight-card">
        <h4>📚 Chapter Difficulty</h4>
        <p>${insights.chapterDifficulty.chapters.length} chapters analyzed</p>
      </div>
      
      <div class="insight-card">
        <h4>✅ Assessment Quality</h4>
        <p>Reliability: ${insights.assessmentQuality.reliability.toFixed(2)}</p>
      </div>
      
      <div class="insight-card">
        <h4>📊 Learning Progression</h4>
        <p>Trend: ${insights.learningProgression.trend}</p>
      </div>
      
      <div class="insight-card">
        <h4>🔍 Performance Patterns</h4>
        <p>${insights.performancePatterns.patterns.length} patterns detected</p>
      </div>
    </div>
    
    <style>
      .sanketa-insights h3 {
        margin-top: 0;
        color: #333;
      }
      
      .insight-card {
        background: #f8f9fa;
        border-left: 4px solid #667eea;
        padding: 15px;
        margin: 15px 0;
        border-radius: 4px;
      }
      
      .insight-card h4 {
        margin: 0 0 10px 0;
        color: #667eea;
        font-size: 16px;
      }
      
      .insight-card p {
        margin: 5px 0;
        color: #666;
        font-size: 14px;
      }
    </style>
  `;
}

// Display error
function displayError(message) {
  const content = document.getElementById('sanketa-panel-content');
  content.innerHTML = `
    <div class="sanketa-error">
      <h3>❌ Error</h3>
      <p>${message}</p>
      <button onclick="location.reload()">Retry</button>
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
