/**
 * API utility functions for backend communication
 */

const DISEASE_API_BASE_URL =
// http://localhost:8000
// https://agrisence-plant-disease-detection.onrender.com
  process.env.NEXT_PUBLIC_DISEASE_API_URL || "https://agrisence-plant-disease-detection.onrender.com";
const RAG_API_BASE_URL =
  process.env.NEXT_PUBLIC_RAG_API_URL || "http://localhost:8001";
const APP_API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_API_URL || "https://agrisence-backend.onrender.com/api";
  // process.env.NEXT_PUBLIC_APP_API_URL || "http://localhost:5000/api";
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
    const response = await fetch(`${DISEASE_API_BASE_URL}/predict?top_k=${topK}`, {
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
      `${DISEASE_API_BASE_URL}/disease-info/${encodeURIComponent(diseaseName)}`
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
    const response = await fetch(`${DISEASE_API_BASE_URL}/classes`);

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
    const response = await fetch(`${DISEASE_API_BASE_URL}/health`);

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

export async function askRagAssistant({ question, language, chatHistory }) {
  const response = await fetch(`${RAG_API_BASE_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      language,
      chat_history: chatHistory || [],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `RAG request failed with status ${response.status}`);
  }
  return data;
}

export async function translateAssistantText({ text, language }) {
  const response = await fetch(`${RAG_API_BASE_URL}/translate`, { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Translation failed with status ${response.status}`);
  }
  return data;
}

export async function speakText({ text, language }) {
  const response = await fetch(`${RAG_API_BASE_URL}/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `Text-to-speech failed with status ${response.status}`);
  }
  
  const audioBlob = await response.blob();
  return audioBlob;
}

export async function saveChatSession({ token, sessionId, title, language, messages }) {
  const response = await fetch(`${APP_API_BASE_URL}/chat-history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionId, title, language, messages }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Save chat failed with status ${response.status}`);
  }
  return data;
}

export async function getChatSessions(token) {
  const response = await fetch(`${APP_API_BASE_URL}/chat-history`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Fetch chat history failed with status ${response.status}`);
  }
  return data;
}

export async function getChatSession({ token, sessionId }) {
  const response = await fetch(`${APP_API_BASE_URL}/chat-history/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Fetch chat failed with status ${response.status}`);
  }
  return data;
}

export async function deleteChatSession({ token, sessionId }) {
  const response = await fetch(`${APP_API_BASE_URL}/chat-history/${sessionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Delete chat failed with status ${response.status}`);
  }
  return data;
}
