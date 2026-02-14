use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

// Data structures for gradebook data
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Student {
    pub id: String,
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Grade {
    pub student_id: String,
    pub assignment_id: String,
    pub score: f64,
    pub max_score: f64,
    pub submitted_at: Option<String>,
    pub due_date: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Assignment {
    pub id: String,
    pub name: String,
    pub max_score: f64,
    pub due_date: Option<String>,
}

// Risk assessment result
#[derive(Serialize, Deserialize, Debug)]
pub struct RiskAssessment {
    pub student_id: String,
    pub risk_level: String,  // "high", "medium", "low"
    pub risk_score: f64,     // 0-100
    pub factors: Vec<String>,
    pub recommendations: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EarlyInterventionResult {
    pub high_risk: Vec<RiskAssessment>,
    pub medium_risk: Vec<RiskAssessment>,
    pub low_risk: Vec<RiskAssessment>,
    pub total_students: usize,
}

// Main entry point for Early Intervention analysis
#[wasm_bindgen]
pub fn analyze_early_intervention(
    grades_json: &str,
    assignments_json: &str,
) -> Result<String, JsValue> {
    // Parse input data
    let grades: Vec<Grade> = serde_json::from_str(grades_json)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse grades: {}", e)))?;
    
    let assignments: Vec<Assignment> = serde_json::from_str(assignments_json)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse assignments: {}", e)))?;
    
    // Group grades by student
    let mut student_grades: std::collections::HashMap<String, Vec<&Grade>> = 
        std::collections::HashMap::new();
    
    for grade in &grades {
        student_grades
            .entry(grade.student_id.clone())
            .or_insert_with(Vec::new)
            .push(grade);
    }
    
    // Analyze each student
    let mut assessments: Vec<RiskAssessment> = Vec::new();
    
    for (student_id, student_grade_list) in student_grades.iter() {
        let assessment = assess_student_risk(student_id, student_grade_list, &assignments);
        assessments.push(assessment);
    }
    
    // Categorize by risk level
    let mut high_risk = Vec::new();
    let mut medium_risk = Vec::new();
    let mut low_risk = Vec::new();
    
    for assessment in assessments {
        match assessment.risk_level.as_str() {
            "high" => high_risk.push(assessment),
            "medium" => medium_risk.push(assessment),
            _ => low_risk.push(assessment),
        }
    }
    
    let result = EarlyInterventionResult {
        total_students: student_grades.len(),
        high_risk,
        medium_risk,
        low_risk,
    };
    
    // Serialize result
    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize result: {}", e)))
}

// Assess individual student risk
fn assess_student_risk(
    student_id: &str,
    grades: &[&Grade],
    _assignments: &[Assignment],
) -> RiskAssessment {
    let mut risk_score = 0.0;
    let mut factors = Vec::new();
    let mut recommendations = Vec::new();
    
    if grades.is_empty() {
        return RiskAssessment {
            student_id: student_id.to_string(),
            risk_level: "low".to_string(),
            risk_score: 0.0,
            factors: vec!["No grades available".to_string()],
            recommendations: vec!["Monitor student progress".to_string()],
        };
    }
    
    // Calculate average score percentage
    let total_score: f64 = grades.iter()
        .map(|g| (g.score / g.max_score) * 100.0)
        .sum();
    let avg_percentage = total_score / grades.len() as f64;
    
    // Factor 1: Low average score
    if avg_percentage < 60.0 {
        risk_score += 40.0;
        factors.push(format!("Low average score: {:.1}%", avg_percentage));
        recommendations.push("Schedule one-on-one meeting".to_string());
    } else if avg_percentage < 70.0 {
        risk_score += 20.0;
        factors.push(format!("Below average score: {:.1}%", avg_percentage));
    }
    
    // Factor 2: Declining trend
    if grades.len() >= 3 {
        let recent_avg = calculate_recent_average(grades, 3);
        let overall_avg = avg_percentage;
        
        if recent_avg < overall_avg - 10.0 {
            risk_score += 30.0;
            factors.push("Declining performance trend".to_string());
            recommendations.push("Identify struggling topics".to_string());
        }
    }
    
    // Factor 3: Missing submissions
    let missing_count = grades.iter()
        .filter(|g| g.score == 0.0)
        .count();
    
    if missing_count > 0 {
        let missing_rate = (missing_count as f64 / grades.len() as f64) * 100.0;
        if missing_rate > 30.0 {
            risk_score += 30.0;
            factors.push(format!("High missing submission rate: {:.0}%", missing_rate));
            recommendations.push("Check for personal/technical issues".to_string());
        } else if missing_rate > 15.0 {
            risk_score += 15.0;
            factors.push(format!("Some missing submissions: {:.0}%", missing_rate));
        }
    }
    
    // Determine risk level
    let risk_level = if risk_score >= 70.0 {
        "high"
    } else if risk_score >= 40.0 {
        "medium"
    } else {
        "low"
    };
    
    // Add default recommendation if none
    if recommendations.is_empty() {
        recommendations.push("Continue monitoring progress".to_string());
    }
    
    RiskAssessment {
        student_id: student_id.to_string(),
        risk_level: risk_level.to_string(),
        risk_score,
        factors,
        recommendations,
    }
}

// Calculate average of recent N grades
fn calculate_recent_average(grades: &[&Grade], n: usize) -> f64 {
    let recent_grades: Vec<&Grade> = grades.iter()
        .rev()
        .take(n)
        .copied()
        .collect();
    
    if recent_grades.is_empty() {
        return 0.0;
    }
    
    let total: f64 = recent_grades.iter()
        .map(|g| (g.score / g.max_score) * 100.0)
        .sum();
    
    total / recent_grades.len() as f64
}

// ============================================================================
// INSIGHT 2: Chapter Difficulty Analysis
// ============================================================================

#[derive(Serialize, Deserialize, Debug)]
pub struct ChapterStats {
    pub chapter_name: String,
    pub assignment_count: usize,
    pub avg_score: f64,
    pub std_deviation: f64,
    pub difficulty_level: String,  // "easy", "moderate", "hard", "very_hard"
    pub student_count: usize,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ChapterDifficultyResult {
    pub chapters: Vec<ChapterStats>,
    pub total_chapters: usize,
    pub hardest_chapter: Option<String>,
    pub easiest_chapter: Option<String>,
}

#[wasm_bindgen]
pub fn analyze_chapter_difficulty(
    grades_json: &str,
    assignments_json: &str,
) -> Result<String, JsValue> {
    // Parse input data
    let grades: Vec<Grade> = serde_json::from_str(grades_json)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse grades: {}", e)))?;
    
    let assignments: Vec<Assignment> = serde_json::from_str(assignments_json)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse assignments: {}", e)))?;
    
    // Extract chapter from assignment names
    let mut chapter_data: std::collections::HashMap<String, Vec<f64>> = 
        std::collections::HashMap::new();
    
    for assignment in &assignments {
        let chapter = extract_chapter_name(&assignment.name);
        
        // Get all grades for this assignment
        let assignment_grades: Vec<f64> = grades.iter()
            .filter(|g| g.assignment_id == assignment.id)
            .map(|g| (g.score / g.max_score) * 100.0)
            .collect();
        
        if !assignment_grades.is_empty() {
            chapter_data.entry(chapter)
                .or_insert_with(Vec::new)
                .extend(assignment_grades);
        }
    }
    
    // Calculate statistics for each chapter
    let mut chapters: Vec<ChapterStats> = chapter_data.iter()
        .map(|(name, scores)| {
            let avg = calculate_mean(scores);
            let std_dev = calculate_std_deviation(scores, avg);
            let difficulty = categorize_difficulty(avg, std_dev);
            
            ChapterStats {
                chapter_name: name.clone(),
                assignment_count: scores.len(),
                avg_score: avg,
                std_deviation: std_dev,
                difficulty_level: difficulty,
                student_count: scores.len(),
            }
        })
        .collect();
    
    // Sort by average score (ascending = hardest first)
    chapters.sort_by(|a, b| a.avg_score.partial_cmp(&b.avg_score).unwrap());
    
    let hardest = chapters.first().map(|c| c.chapter_name.clone());
    let easiest = chapters.last().map(|c| c.chapter_name.clone());
    
    let result = ChapterDifficultyResult {
        total_chapters: chapters.len(),
        hardest_chapter: hardest,
        easiest_chapter: easiest,
        chapters,
    };
    
    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize result: {}", e)))
}

// Extract chapter name from assignment name
fn extract_chapter_name(assignment_name: &str) -> String {
    // Try to extract chapter number/name from assignment name
    // Common patterns: "Chapter 1", "Ch 1", "Unit 1", "Week 1", etc.
    
    let patterns = [
        ("Chapter ", "Chapter "),
        ("Ch ", "Chapter "),
        ("Unit ", "Unit "),
        ("Week ", "Week "),
        ("Module ", "Module "),
    ];
    
    for (pattern, replacement) in &patterns {
        if let Some(idx) = assignment_name.find(pattern) {
            let after = &assignment_name[idx + pattern.len()..];
            // Extract number or name until space or special char
            let chapter_id: String = after.chars()
                .take_while(|c| c.is_alphanumeric())
                .collect();
            
            if !chapter_id.is_empty() {
                return format!("{}{}", replacement, chapter_id);
            }
        }
    }
    
    // If no pattern found, use "Other"
    "Other".to_string()
}

// Calculate mean of scores
fn calculate_mean(scores: &[f64]) -> f64 {
    if scores.is_empty() {
        return 0.0;
    }
    scores.iter().sum::<f64>() / scores.len() as f64
}

// Calculate standard deviation
fn calculate_std_deviation(scores: &[f64], mean: f64) -> f64 {
    if scores.len() < 2 {
        return 0.0;
    }
    
    let variance: f64 = scores.iter()
        .map(|score| {
            let diff = score - mean;
            diff * diff
        })
        .sum::<f64>() / (scores.len() - 1) as f64;
    
    variance.sqrt()
}

// Categorize difficulty based on average score and std deviation
fn categorize_difficulty(avg_score: f64, _std_dev: f64) -> String {
    if avg_score >= 85.0 {
        "easy".to_string()
    } else if avg_score >= 70.0 {
        "moderate".to_string()
    } else if avg_score >= 60.0 {
        "hard".to_string()
    } else {
        "very_hard".to_string()
    }
}

// ============================================================================
// INSIGHT 3: Assessment Quality Analysis
// ============================================================================

#[derive(Serialize, Deserialize, Debug)]
pub struct ItemAnalysis {
    pub assignment_id: String,
    pub assignment_name: String,
    pub discrimination_index: f64,  // -1 to 1
    pub difficulty_index: f64,      // 0 to 1
    pub quality_rating: String,     // "excellent", "good", "fair", "poor"
    pub recommendation: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AssessmentQualityResult {
    pub reliability: f64,           // Cronbach's alpha (0 to 1)
    pub reliability_rating: String, // "excellent", "good", "acceptable", "poor"
    pub items: Vec<ItemAnalysis>,
    pub problematic_items: Vec<String>,
    pub total_items: usize,
}

#[wasm_bindgen]
pub fn analyze_assessment_quality(
    grades_json: &str,
    assignments_json: &str,
) -> Result<String, JsValue> {
    // Parse input data
    let grades: Vec<Grade> = serde_json::from_str(grades_json)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse grades: {}", e)))?;
    
    let assignments: Vec<Assignment> = serde_json::from_str(assignments_json)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse assignments: {}", e)))?;
    
    if assignments.is_empty() {
        return Ok(serde_json::to_string(&AssessmentQualityResult {
            reliability: 0.0,
            reliability_rating: "insufficient_data".to_string(),
            items: vec![],
            problematic_items: vec![],
            total_items: 0,
        }).unwrap());
    }
    
    // Calculate Cronbach's alpha for overall reliability
    let reliability = calculate_cronbachs_alpha(&grades, &assignments);
    let reliability_rating = rate_reliability(reliability);
    
    // Analyze each assignment/item
    let mut items: Vec<ItemAnalysis> = Vec::new();
    let mut problematic_items: Vec<String> = Vec::new();
    
    for assignment in &assignments {
        let analysis = analyze_item(&grades, assignment);
        
        if analysis.quality_rating == "poor" {
            problematic_items.push(assignment.name.clone());
        }
        
        items.push(analysis);
    }
    
    let result = AssessmentQualityResult {
        reliability,
        reliability_rating,
        total_items: items.len(),
        problematic_items,
        items,
    };
    
    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize result: {}", e)))
}

// Calculate Cronbach's alpha (internal consistency reliability)
fn calculate_cronbachs_alpha(grades: &[Grade], assignments: &[Assignment]) -> f64 {
    if assignments.len() < 2 {
        return 0.0;
    }
    
    // Build score matrix: students x assignments
    let mut student_ids: Vec<String> = grades.iter()
        .map(|g| g.student_id.clone())
        .collect();
    student_ids.sort();
    student_ids.dedup();
    
    if student_ids.is_empty() {
        return 0.0;
    }
    
    // Create score matrix
    let mut score_matrix: Vec<Vec<f64>> = Vec::new();
    
    for student_id in &student_ids {
        let mut student_scores: Vec<f64> = Vec::new();
        
        for assignment in assignments {
            let score = grades.iter()
                .find(|g| g.student_id == *student_id && g.assignment_id == assignment.id)
                .map(|g| (g.score / g.max_score) * 100.0)
                .unwrap_or(0.0);
            
            student_scores.push(score);
        }
        
        score_matrix.push(student_scores);
    }
    
    // Calculate variance of total scores
    let total_scores: Vec<f64> = score_matrix.iter()
        .map(|scores| scores.iter().sum())
        .collect();
    
    let total_variance = calculate_variance(&total_scores);
    
    // Calculate sum of item variances
    let mut sum_item_variances = 0.0;
    
    for i in 0..assignments.len() {
        let item_scores: Vec<f64> = score_matrix.iter()
            .map(|scores| scores[i])
            .collect();
        
        sum_item_variances += calculate_variance(&item_scores);
    }
    
    // Cronbach's alpha formula
    let k = assignments.len() as f64;
    let alpha = (k / (k - 1.0)) * (1.0 - (sum_item_variances / total_variance));
    
    // Clamp between 0 and 1
    alpha.max(0.0).min(1.0)
}

// Calculate variance
fn calculate_variance(scores: &[f64]) -> f64 {
    if scores.len() < 2 {
        return 0.0;
    }
    
    let mean = scores.iter().sum::<f64>() / scores.len() as f64;
    let variance = scores.iter()
        .map(|score| (score - mean).powi(2))
        .sum::<f64>() / (scores.len() - 1) as f64;
    
    variance
}

// Rate reliability based on Cronbach's alpha
fn rate_reliability(alpha: f64) -> String {
    if alpha >= 0.9 {
        "excellent".to_string()
    } else if alpha >= 0.8 {
        "good".to_string()
    } else if alpha >= 0.7 {
        "acceptable".to_string()
    } else if alpha >= 0.6 {
        "questionable".to_string()
    } else {
        "poor".to_string()
    }
}

// Analyze individual item/assignment
fn analyze_item(grades: &[Grade], assignment: &Assignment) -> ItemAnalysis {
    // Get scores for this assignment
    let assignment_grades: Vec<&Grade> = grades.iter()
        .filter(|g| g.assignment_id == assignment.id)
        .collect();
    
    if assignment_grades.is_empty() {
        return ItemAnalysis {
            assignment_id: assignment.id.clone(),
            assignment_name: assignment.name.clone(),
            discrimination_index: 0.0,
            difficulty_index: 0.0,
            quality_rating: "insufficient_data".to_string(),
            recommendation: "Not enough data to analyze".to_string(),
        };
    }
    
    // Calculate difficulty index (proportion correct)
    let difficulty_index = assignment_grades.iter()
        .map(|g| g.score / g.max_score)
        .sum::<f64>() / assignment_grades.len() as f64;
    
    // Calculate discrimination index (simplified version)
    // Ideally: correlation with total score, but we'll use score spread
    let scores: Vec<f64> = assignment_grades.iter()
        .map(|g| (g.score / g.max_score) * 100.0)
        .collect();
    
    let mean = calculate_mean(&scores);
    let std_dev = calculate_std_deviation(&scores, mean);
    
    // Discrimination approximation: higher std dev = better discrimination
    let discrimination_index = (std_dev / 50.0).min(1.0); // Normalize to 0-1
    
    // Rate quality
    let (quality_rating, recommendation) = rate_item_quality(difficulty_index, discrimination_index);
    
    ItemAnalysis {
        assignment_id: assignment.id.clone(),
        assignment_name: assignment.name.clone(),
        discrimination_index,
        difficulty_index,
        quality_rating,
        recommendation,
    }
}

// Rate item quality based on difficulty and discrimination
fn rate_item_quality(difficulty: f64, discrimination: f64) -> (String, String) {
    // Good items: moderate difficulty (0.3-0.7) and high discrimination (>0.3)
    
    if discrimination < 0.2 {
        return (
            "poor".to_string(),
            "Low discrimination - consider revising or removing".to_string()
        );
    }
    
    if difficulty < 0.2 || difficulty > 0.9 {
        return (
            "fair".to_string(),
            "Extreme difficulty - most students got it very wrong or very right".to_string()
        );
    }
    
    if discrimination >= 0.4 && difficulty >= 0.3 && difficulty <= 0.7 {
        return (
            "excellent".to_string(),
            "Well-designed item with good discrimination".to_string()
        );
    }
    
    (
        "good".to_string(),
        "Acceptable item quality".to_string()
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_risk_assessment() {
        let grades = vec![
            Grade {
                student_id: "S1".to_string(),
                assignment_id: "A1".to_string(),
                score: 50.0,
                max_score: 100.0,
                submitted_at: None,
                due_date: None,
            },
            Grade {
                student_id: "S1".to_string(),
                assignment_id: "A2".to_string(),
                score: 45.0,
                max_score: 100.0,
                submitted_at: None,
                due_date: None,
            },
        ];
        
        let grade_refs: Vec<&Grade> = grades.iter().collect();
        let assignments = vec![];
        
        let assessment = assess_student_risk("S1", &grade_refs, &assignments);
        
        // Average is 47.5%, which triggers 40 points (low score)
        // This puts it in "medium" risk category (40-69 points)
        assert_eq!(assessment.risk_level, "medium");
        assert!(assessment.risk_score >= 40.0);
        assert!(assessment.risk_score < 70.0);
    }
    
    #[test]
    fn test_chapter_extraction() {
        assert_eq!(extract_chapter_name("Chapter 1 Quiz"), "Chapter 1");
        assert_eq!(extract_chapter_name("Ch 2 Assignment"), "Chapter 2");
        assert_eq!(extract_chapter_name("Unit 3 Test"), "Unit 3");
        assert_eq!(extract_chapter_name("Random Assignment"), "Other");
    }
    
    #[test]
    fn test_statistics() {
        let scores = vec![80.0, 85.0, 90.0, 75.0, 95.0];
        let mean = calculate_mean(&scores);
        assert_eq!(mean, 85.0);
        
        let std_dev = calculate_std_deviation(&scores, mean);
        assert!(std_dev > 0.0);
    }
    
    #[test]
    fn test_assessment_quality() {
        let grades = vec![
            Grade {
                student_id: "S1".to_string(),
                assignment_id: "A1".to_string(),
                score: 80.0,
                max_score: 100.0,
                submitted_at: None,
                due_date: None,
            },
            Grade {
                student_id: "S1".to_string(),
                assignment_id: "A2".to_string(),
                score: 85.0,
                max_score: 100.0,
                submitted_at: None,
                due_date: None,
            },
        ];
        
        let assignments = vec![
            Assignment {
                id: "A1".to_string(),
                name: "Quiz 1".to_string(),
                max_score: 100.0,
                due_date: None,
            },
            Assignment {
                id: "A2".to_string(),
                name: "Quiz 2".to_string(),
                max_score: 100.0,
                due_date: None,
            },
        ];
        
        let reliability = calculate_cronbachs_alpha(&grades, &assignments);
        assert!(reliability >= 0.0 && reliability <= 1.0);
    }

}
