"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { ImageUploadSection, HowItWorks, ResultPreview, ResultDisplay, TrustFeatures } from "./components";
import Button from "@/components/ui/Button";

export default function DiseaseDetectionContent() {
  const [result, setResult] = useState(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyze = () => {
    setHasAnalyzed(true);
  };

  const handleResult = (resultData) => {
    setResult(resultData);
  };

  const handleReset = () => {
    setResult(null);
    setHasAnalyzed(false);
  };

  return (
    <div className="space-y-24 bg-green-50 dark:bg-gray-900 p-8 md:p-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-green-50 via-white to-green-100 dark:from-gray-800 dark:via-gray-900 dark:to-green-900 rounded-3xl p-10 md:p-16">
        <div className="max-w-3xl">
          <Badge variant="success">AI Powered Disease Detection</Badge>

          <h1 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Detect Cotton Leaf Diseases
            <span className="text-green-600 dark:text-green-400"> Instantly With AI</span>
          </h1>

          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
            Upload a cotton leaf image and let the deep learning model identify disease symptoms, confidence, and recommended actions
          </p>
        </div>

        <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-green-300 dark:bg-green-900/30 rounded-full blur-3xl opacity-30"></div>
      </section>

      {/* Upload Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <ImageUploadSection onAnalyze={handleAnalyze} onResult={handleResult} />
        <HowItWorks />
      </section>

      {/* Result Display - Shows real results when available */}
      {result && <ResultDisplay result={result} />}

      {/* Result Preview Section - Shows sample result when no analysis yet */}
      {!result && <ResultPreview />}

      {/* Trust Features Section */}
      <TrustFeatures />

      {/* CTA */}
      <section className="bg-green-600 dark:bg-green-700 rounded-3xl p-12 text-center text-white">
        <h3 className="text-3xl font-bold">
          Protect Your Crops With AI Today
        </h3>

        <p className="mt-4 text-green-100 max-w-xl mx-auto">
          Early detection can save crops, reduce losses, and improve yield quality
        </p>

        <Button className="mt-6 bg-green-200 border  text-green-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-green-400 dark:hover:bg-gray-700">
          Get Started Now
        </Button>
      </section>
    </div>
  );
}
