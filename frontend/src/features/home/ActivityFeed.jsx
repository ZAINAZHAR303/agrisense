"use client";

import { motion } from "framer-motion";
import { HiCheck } from "react-icons/hi";

const activityData = [
  {
    type: "disease",
    farm: "Green Valley Farm",
    message: "Early blight detected on tomato plants",
    time: "2 hours ago",
    icon: "🍅",
  },
  {
    type: "soil",
    farm: "Sunny Acres",
    message: "Soil moisture below optimal level",
    time: "4 hours ago",
    icon: "💧",
  },
  {
    type: "irrigation",
    farm: "Farm Fresh Fields",
    message: "Irrigation cycle completed successfully",
    time: "6 hours ago",
    icon: "💦",
  },
  {
    type: "health",
    farm: "Natural Harvest",
    message: "All sensors functioning normally",
    time: "8 hours ago",
    icon: "✅",
  },
];

export const ActivityFeed = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.h3
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold text-gray-900 dark:text-white mb-8"
        >
          Recent Activity
        </motion.h3>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
        >
          {activityData.map((activity, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              whileHover={{ x: 5 }}
              className="flex items-start gap-4 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 hover:shadow-md transition-shadow"
            >
              <div className="text-2xl shrink-0">{activity.icon}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {activity.farm}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {activity.message}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                    {activity.time}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
