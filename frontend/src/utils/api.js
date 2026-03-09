/**
 * API utility functions for backend communication
 */

// Backend API base URL - Update this to match your backend server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Predict plant disease from image
 * @param {File} imageFile - The image file to analyze
 * @param {number} topK - Number of top predictions to return
 * @returns {Promise<Object>} Prediction results
 */
export async function predictDisease(imageFile, topK = 3) {
  try {
    // Create FormData to send file
    const formData = new FormData();
    formData.append("file", imageFile);

    // Make API request
    const response = await fetch(`${API_BASE_URL}/predict?top_k=${topK}`, {
      method: "POST",
      body: formData,
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `API request failed with status ${response.status}`
      );
    }

    // Parse and return response
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Disease prediction error:", error);
    throw error;
  }
}

/**
 * Get detailed information about a specific disease
 * @param {string} diseaseName - Name of the disease
 * @returns {Promise<Object>} Disease information
 */
export async function getDiseaseInfo(diseaseName) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/disease-info/${encodeURIComponent(diseaseName)}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `API request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get disease info error:", error);
    throw error;
  }
}

/**
 * Get all available disease classes
 * @returns {Promise<Object>} List of disease classes
 */
export async function getDiseaseClasses() {
  try {
    const response = await fetch(`${API_BASE_URL}/classes`);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get disease classes error:", error);
    throw error;
  }
}

/**
 * Check API health status
 * @returns {Promise<Object>} Health status
 */
export async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Health check error:", error);
    throw error;
  }
}
