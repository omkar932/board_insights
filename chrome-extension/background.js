import init, { 
  analyze_early_intervention,
  analyze_chapter_difficulty,
  analyze_assessment_quality,
  analyze_learning_progression,
  analyze_performance_patterns
} from './wasm/analytics_wasm.js';

console.log("Sanketa background service worker loaded");

// Global state for WASM readiness
let wasmReady = false;
const wasmInitializationPromise = (async () => {
  try {
    console.log('🔄 Starting WASM initialization...');
    const wasmBgUrl = chrome.runtime.getURL('wasm/analytics_wasm_bg.wasm');
    await init(wasmBgUrl);
    wasmReady = true;
    console.log('✅ WASM initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize WASM:', error);
  }
})();

async function ensureWasmLoaded() {
  if (!wasmReady) {
    await wasmInitializationPromise;
  }
  if (!wasmReady) {
    throw new Error('WASM module not available');
  }
  return {
    analyze_early_intervention,
    analyze_chapter_difficulty,
    analyze_assessment_quality,
    analyze_learning_progression,
    analyze_performance_patterns
  };
}

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

// Update handleInsightComputation to use ensureWasmLoaded
async function handleInsightComputation(data) {
  console.log('Computing insights for course:', data.courseId);
  
  try {
    // Ensure WASM is loaded before proceeding
    const wasm = await ensureWasmLoaded();
    
    const insights = {
      earlyIntervention: await computeEarlyIntervention(data.gradebook, wasm),
      chapterDifficulty: await computeChapterDifficulty(data.gradebook, wasm),
      assessmentQuality: await computeAssessmentQuality(data.gradebook, wasm),
      learningProgression: await computeLearningProgression(data.gradebook, wasm),
      performancePatterns: await computePerformancePatterns(data.gradebook, wasm)
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

// Helper functions updated to use passed-in wasm exports
async function computeEarlyIntervention(gradebook, wasm) {
  try {
    if (!gradebook || !gradebook.grades || !gradebook.assignments) {
      return { high_risk: [], medium_risk: [], low_risk: [], total_students: 0 };
    }
    const resultJson = wasm.analyze_early_intervention(JSON.stringify(gradebook.grades), JSON.stringify(gradebook.assignments));
    return JSON.parse(resultJson);
  } catch (error) {
    console.error('Error in Early Intervention analysis:', error);
    return { high_risk: [], medium_risk: [], low_risk: [], total_students: 0 };
  }
}

async function computeChapterDifficulty(gradebook, wasm) {
  try {
    if (!gradebook || !gradebook.grades || !gradebook.assignments) {
      return { chapters: [], total_chapters: 0, hardest_chapter: null, easiest_chapter: null };
    }
    const resultJson = wasm.analyze_chapter_difficulty(JSON.stringify(gradebook.grades), JSON.stringify(gradebook.assignments));
    return JSON.parse(resultJson);
  } catch (error) {
    console.error('Error in Chapter Difficulty analysis:', error);
    return { chapters: [], total_chapters: 0, hardest_chapter: null, easiest_chapter: null };
  }
}

async function computeAssessmentQuality(gradebook, wasm) {
  try {
    if (!gradebook || !gradebook.grades || !gradebook.assignments) {
      return { reliability: 0, reliability_rating: 'insufficient_data', items: [], problematic_items: [], total_items: 0 };
    }
    const resultJson = wasm.analyze_assessment_quality(JSON.stringify(gradebook.grades), JSON.stringify(gradebook.assignments));
    return JSON.parse(resultJson);
  } catch (error) {
    console.error('Error in Assessment Quality analysis:', error);
    return { reliability: 0, reliability_rating: 'error', items: [], problematic_items: [], total_items: 0 };
  }
}

async function computeLearningProgression(gradebook, wasm) {
  try {
    if (!gradebook || !gradebook.grades || !gradebook.assignments) {
      return { overall_trend: 'insufficient_data', velocity: 0, class_velocity: 0, class_average_trend: 'unknown', student_progressions: [] };
    }
    const resultJson = wasm.analyze_learning_progression(JSON.stringify(gradebook.grades), JSON.stringify(gradebook.assignments));
    return JSON.parse(resultJson);
  } catch (error) {
    console.error('Error in Learning Progression analysis:', error);
    return { overall_trend: 'error', velocity: 0, class_velocity: 0, class_average_trend: 'unknown', student_progressions: [] };
  }
}

async function computePerformancePatterns(gradebook, wasm) {
  try {
    if (!gradebook || !gradebook.grades || !gradebook.assignments) {
      return { student_patterns: [], class_consistency: 0, total_students: 0 };
    }
    const resultJson = wasm.analyze_performance_patterns(JSON.stringify(gradebook.grades), JSON.stringify(gradebook.assignments) || "[]");
    return JSON.parse(resultJson);
  } catch (error) {
    console.error('Error in Performance Patterns analysis:', error);
    return { student_patterns: [], class_consistency: 0, total_students: 0 };
  }
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
