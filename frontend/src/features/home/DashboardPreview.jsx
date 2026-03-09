"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export const DashboardPreview = () => {
  return (
    <section className="py-20  px-4 sm:px-6 lg:px-8 bg-linear-to-b from-emerald-50/50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Comprehensive Dashboard
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Monitor all your farm metrics in one unified interface
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          whileHover={{ y: -5 }}
          className="rounded-2xl border border-emerald-200 dark:border-emerald-900/30 bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all overflow-hidden"
        >
          {/* Mock Dashboard Header */}
          <div className="bg-linear-to-r from-emerald-600 to-green-500 px-8 py-6 text-white">
            <h3 className="text-xl font-bold">Dashboard</h3>
            <p className="text-emerald-100 text-sm">
              Real-time farm monitoring
            </p>
          </div>

          {/* Mock Dashboard Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Soil Moisture", value: "65%", color: "emerald" },
                { label: "Temperature", value: "28°C", color: "orange" },
                { label: "Humidity", value: "72%", color: "blue" },
                { label: "pH Level", value: "6.8", color: "purple" },
              ].map((metric, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className={`p-4 rounded-lg bg-${metric.color}-50 dark:bg-${metric.color}-900/10 border border-${metric.color}-100 dark:border-${metric.color}-900/30`}
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.label}
                  </p>
                  <p
                    className={`text-2xl font-bold text-${metric.color}-600 dark:text-${metric.color}-400 mt-2`}
                  >
                    {metric.value}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="pt-8 border-t border-emerald-100 dark:border-emerald-900/30">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Status: All systems operational
              </p>
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  View Full Dashboard →
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
