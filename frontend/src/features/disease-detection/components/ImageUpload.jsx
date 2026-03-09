import { useImageUpload } from "@/hooks";
import Button from "@/components/ui/Button";
import { predictDisease } from "@/utils/api";
import { useState } from "react";

export const ImageUploadSection = ({ onAnalyze, onResult }) => {
  const { image, error, loading, handleImageUpload, resetImage } = useImageUpload();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      handleImageUpload(file);
      setAnalysisError(null);
    }
  };

  const handleAnalyzeClick = async () => {
    if (!uploadedFile) return;

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await predictDisease(uploadedFile, 3);
      
      if (result.success && result.data) {
        onResult?.(result.data);
        onAnalyze?.();
      } else {
        throw new Error(result.message || "Analysis failed");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setAnalysisError(
        err.message || "Failed to analyze image. Please ensure the backend API is running."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    resetImage();
    setUploadedFile(null);
    setAnalysisError(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-green-100 dark:border-gray-700 rounded-3xl p-8">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Upload Leaf Image
      </h2>

      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Supported formats JPG, PNG. Use a clear image with visible leaf texture
      </p>

      <label className="mt-6 flex flex-col items-center justify-center border-2 border-dashed border-green-300 dark:border-green-700 rounded-2xl p-8 cursor-pointer hover:bg-green-50 dark:hover:bg-gray-700 transition">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={loading}
        />

        <span className="text-5xl">📸</span>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          Click to upload or drag and drop
        </p>
      </label>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {analysisError && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-200 text-sm">
          {analysisError}
        </div>
      )}

      {image && (
        <div className="mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Preview</p>
          <img
            src={image}
            alt="Uploaded leaf"
            className="rounded-xl border border-green-100 dark:border-gray-700 max-h-96 w-full object-cover"
          />

          <div className="mt-4 flex gap-3">
            <Button 
              onClick={handleAnalyzeClick} 
              disabled={loading || analyzing} 
              className="flex-1"
            >
              {analyzing ? "Analyzing..." : "Analyze Disease"}
            </Button>
            <Button variant="secondary" onClick={handleReset} disabled={analyzing}>
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
