// Sanketa Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  await loadStatus();
  setupEventListeners();
});

async function loadStatus() {
  try {
    // Get stored data
    const data = await chrome.storage.local.get(null);
    
    // Count courses
    const courses = Object.keys(data).filter(key => key.startsWith('course_'));
    const insights = Object.keys(data).filter(key => key.startsWith('insights_'));
    
    // Update UI
    if (courses.length > 0) {
      document.getElementById('status-text').textContent = 
        `${courses.length} course${courses.length > 1 ? 's' : ''} analyzed`;
      document.getElementById('stats').style.display = 'grid';
      document.getElementById('action-button').style.display = 'block';
      document.getElementById('courses-count').textContent = courses.length;
      document.getElementById('insights-count').textContent = insights.length;
    }
    
    // Check if we're on a Blackboard page
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('blackboard')) {
      document.getElementById('status-text').textContent = 
        'Blackboard detected! Click to view insights.';
      document.getElementById('action-button').style.display = 'block';
      document.getElementById('action-button').textContent = 'Open Analytics Panel';
    }
    
  } catch (error) {
    console.error('Error loading status:', error);
  }
}

function setupEventListeners() {
  // Action button
  document.getElementById('action-button').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script to open panel
    chrome.tabs.sendMessage(tab.id, { type: 'OPEN_PANEL' });
    
    // Close popup
    window.close();
  });
  
  // Help link
  document.getElementById('help-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/sanketa/docs' });
  });
}
