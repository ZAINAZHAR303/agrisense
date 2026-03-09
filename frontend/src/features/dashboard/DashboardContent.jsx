"use client";

import { Header } from "@/components/common";
import { DashboardStats, MoistureChart, NutrientChart, RecommendationCards } from "./components";

export default function DashboardContent() {
  return (
    <div className="space-y-10 px-4 sm:px-6 lg:px-8 py-10 bg-green-50 dark:bg-gray-900">
      <Header
        title="Smart Agriculture Dashboard"
        subtitle="Live insights powered by AI and IoT sensors"
        status="System Status: Online"
      />

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MoistureChart />
        <NutrientChart />
      </div>

      <RecommendationCards />
    </div>
  );
}
