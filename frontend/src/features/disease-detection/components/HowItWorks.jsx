export const HowItWorks = () => {
  const steps = [
    "Image preprocessing and enhancement",
    "Deep learning model inference",
    "Disease classification and confidence scoring",
    "Remedy and prevention recommendation",
  ];

  return (
    <div>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
        How Our AI Works
      </h3>

      <p className="mt-4 text-gray-600 dark:text-gray-300">
        AgriSense AI uses transfer learning and convolutional neural networks trained on thousands of plant leaf images to detect diseases with high accuracy
      </p>

      <div className="mt-8 space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-4">
            <div className="shrink-0 w-8 h-8 bg-green-600 dark:bg-green-700 text-white rounded-full flex items-center justify-center font-bold">
              {idx + 1}
            </div>
            <p className="text-gray-600 dark:text-gray-300 pt-1">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
