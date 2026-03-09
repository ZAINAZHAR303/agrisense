"use client";

import { useTheme } from "@/hooks";
import { Header } from "@/components/common";
import { SensorCardsGrid, SoilDataTrend, FertilizerRecommendations } from "./components";

export default function SoilMonitoringContent() {
  const [theme] = useTheme();

  return (
    <div className="space-y-10 px-4 sm:px-6 lg:px-8 py-10 bg-green-50 dark:bg-gray-900">
      <Header
        title="Soil Monitoring Dashboard"
        subtitle="Real-time soil health & fertilizer recommendations"
      />

      <SensorCardsGrid />

      <SoilDataTrend theme={theme} />

      <FertilizerRecommendations />
    </div>
  );
}
