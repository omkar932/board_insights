// Sanketa Background Service Worker
// Handles extension lifecycle and message passing

console.log("Sanketa background service worker loaded");

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Sanketa installed:", details.reason);

  if (details.reason === "install") {
    // First time installation
    chrome.storage.local.set({
      installed: true,
      installDate: new Date().toISOString(),
      version: chrome.runtime.getManifest().version,
    });
  } else if (details.reason === "update") {
    // Extension updated
    console.log("Updated from version:", details.previousVersion);
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request.type);

  switch (request.type) {
    case "GRADEBOOK_DETECTED":
      handleGradebookDetected(request.data, sender);
      sendResponse({ success: true });
      break;

    case "EXTRACT_DATA":
      handleDataExtraction(request.data, sender);
      sendResponse({ success: true });
      break;

    case "COMPUTE_INSIGHTS":
      handleInsightComputation(request.data)
        .then((result) => sendResponse({ success: true, data: result }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        );
      return true; // Keep channel open for async response

    case "SAVE_DATA":
      chrome.storage.local.set(request.data, () => {
        sendResponse({ success: true });
      });
      return true;

    case "GET_DATA":
      chrome.storage.local.get(request.keys, (data) => {
        sendResponse({ success: true, data });
      });
      return true;

    default:
      sendResponse({ success: false, error: "Unknown message type" });
  }
});

// Handle gradebook detection
function handleGradebookDetected(data, sender) {
  console.log("Gradebook detected on tab:", sender.tab.id);
  console.log("Course:", data.courseId, data.courseName);

  // Store course context
  chrome.storage.local.set({
    [`course_${data.courseId}`]: {
      id: data.courseId,
      name: data.courseName,
      url: sender.tab.url,
      lastAccessed: new Date().toISOString(),
    },
  });

  // Update badge to show extension is active
  chrome.action.setBadgeText({
    text: "✓",
    tabId: sender.tab.id,
  });

  chrome.action.setBadgeBackgroundColor({
    color: "#4CAF50",
    tabId: sender.tab.id,
  });
}

// Handle data extraction
function handleDataExtraction(data, sender) {
  console.log("Data extraction started for course:", data.courseId);

  // Store extracted data with TTL (24 hours)
  const expiryTime = Date.now() + 24 * 60 * 60 * 1000;

  chrome.storage.local.set({
    [`gradebook_${data.courseId}`]: {
      data: data.gradebook,
      extractedAt: new Date().toISOString(),
      expiresAt: expiryTime,
    },
  });
}

// Handle insight computation
async function handleInsightComputation(data) {
  console.log('Computing insights for course:', data.courseId);
  
  try {
    // Load WASM module
    const wasm = await loadWasmModule();
    
    const insights = {
      earlyIntervention: await computeEarlyIntervention(data.gradebook, wasm),
      chapterDifficulty: await computeChapterDifficulty(data.gradebook, wasm),
      assessmentQuality: await computeAssessmentQuality(data.gradebook, wasm),
      learningProgression: await computeLearningProgression(data.gradebook),
      performancePatterns: await computePerformancePatterns(data.gradebook)
    };


    
    // Store computed insights
    chrome.storage.local.set({
      [`insights_${data.courseId}`]: {
        data: insights,
        computedAt: new Date().toISOString()
      }
    });
    
    return insights;
  } catch (error) {
    console.error('Error computing insights:', error);
    throw error;
  }
}

// Load WASM module (cached)
let wasmModule = null;

async function loadWasmModule() {
  if (wasmModule) {
    return wasmModule;
  }
  
  try {
    // Import WASM module
    const wasmUrl = chrome.runtime.getURL('wasm/analytics_wasm.js');
    const { 
      default: init, 
      analyze_early_intervention,
      analyze_chapter_difficulty,
      analyze_assessment_quality
    } = await import(wasmUrl);
    
    // Initialize WASM
    await init();
    
    wasmModule = { 
      analyze_early_intervention,
      analyze_chapter_difficulty,
      analyze_assessment_quality
    };
    console.log('WASM module loaded successfully');
    
    return wasmModule;
  } catch (error) {
    console.error('Failed to load WASM module:', error);
    throw new Error('WASM module not available');
  }
}

// Real Early Intervention using WASM
async function computeEarlyIntervention(gradebook, wasm) {
  try {
    if (!gradebook || !gradebook.grades || !gradebook.assignments) {
      return {
        high_risk: [],
        medium_risk: [],
        low_risk: [],
        total_students: 0
      };
    }
    
    // Prepare data for WASM
    const gradesJson = JSON.stringify(gradebook.grades);
    const assignmentsJson = JSON.stringify(gradebook.assignments);
    
    // Call WASM function
    const resultJson = wasm.analyze_early_intervention(gradesJson, assignmentsJson);
    const result = JSON.parse(resultJson);
    
    console.log('Early Intervention analysis complete:', result);
    return result;
  } catch (error) {
    console.error('Error in Early Intervention analysis:', error);
    // Return empty result on error
    return {
      high_risk: [],
      medium_risk: [],
      low_risk: [],
      total_students: 0
    };
  }
}

// Real Chapter Difficulty using WASM
async function computeChapterDifficulty(gradebook, wasm) {
  try {
    if (!gradebook || !gradebook.grades || !gradebook.assignments) {
      return {
        chapters: [],
        total_chapters: 0,
        hardest_chapter: null,
        easiest_chapter: null
      };
    }
    
    // Prepare data for WASM
    const gradesJson = JSON.stringify(gradebook.grades);
    const assignmentsJson = JSON.stringify(gradebook.assignments);
    
    // Call WASM function
    const resultJson = wasm.analyze_chapter_difficulty(gradesJson, assignmentsJson);
    const result = JSON.parse(resultJson);
    
    console.log('Chapter Difficulty analysis complete:', result);
    return result;
  } catch (error) {
    console.error('Error in Chapter Difficulty analysis:', error);
    // Return empty result on error
    return {
      chapters: [],
      total_chapters: 0,
      hardest_chapter: null,
      easiest_chapter: null
    };
  }
}

// Real Assessment Quality using WASM
async function computeAssessmentQuality(gradebook, wasm) {
  try {
    if (!gradebook || !gradebook.grades || !gradebook.assignments) {
      return {
        reliability: 0,
        reliability_rating: 'insufficient_data',
        items: [],
        problematic_items: [],
        total_items: 0
      };
    }
    
    // Prepare data for WASM
    const gradesJson = JSON.stringify(gradebook.grades);
    const assignmentsJson = JSON.stringify(gradebook.assignments);
    
    // Call WASM function
    const resultJson = wasm.analyze_assessment_quality(gradesJson, assignmentsJson);
    const result = JSON.parse(resultJson);
    
    console.log('Assessment Quality analysis complete:', result);
    return result;
  } catch (error) {
    console.error('Error in Assessment Quality analysis:', error);
    // Return empty result on error
    return {
      reliability: 0,
      reliability_rating: 'error',
      items: [],
      problematic_items: [],
      total_items: 0
    };
  }
}

// Placeholder functions for remaining insights


async function computeLearningProgression(gradebook) {
  return {
    trend: 'stable',
    velocity: 0
  };
}

async function computePerformancePatterns(gradebook) {
  return {
    patterns: []
  };
}


// Clean up expired data periodically
chrome.alarms.create("cleanup", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cleanup") {
    cleanupExpiredData();
  }
});

function cleanupExpiredData() {
  chrome.storage.local.get(null, (items) => {
    const now = Date.now();
    const keysToRemove = [];

    for (const [key, value] of Object.entries(items)) {
      if (value.expiresAt && value.expiresAt < now) {
        keysToRemove.push(key);
      }
    }

    if (keysToRemove.length > 0) {
      chrome.storage.local.remove(keysToRemove, () => {
        console.log("Cleaned up expired data:", keysToRemove.length, "items");
      });
    }
  });
}
