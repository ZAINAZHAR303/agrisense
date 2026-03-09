"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export const HeroSection = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 lg:pt-0">
      {/* Background Decorations */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 2 }}
          className="absolute top-20 left-10 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute top-40 right-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 2, delay: 1 }}
          className="absolute -bottom-8 left-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl"
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
      >
        <motion.div variants={item}>
          <span className="inline-block px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold mb-6">
            🌱 Powered by AI Technology
          </span>
        </motion.div>

        <motion.h1
          variants={item}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
        >
          Smart Farming Starts with{" "}
          <span className="bg-linear-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
            Intelligence
          </span>
        </motion.h1>

        <motion.p
          variants={item}
          className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8"
        >
          Detect diseases early, monitor soil health in real-time, and optimize irrigation with AI-powered insights for sustainable agriculture.
        </motion.p>

        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-linear-to-r from-emerald-600 to-green-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all"
            >
              Get Started →
            </motion.button>
          </Link>
          <Link href="/disease-detection">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 font-semibold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
            >
              Try Disease Detection
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats Preview */}
        <motion.div
          variants={item}
          className="mt-16 pt-16 border-t border-emerald-200 dark:border-emerald-900/30 grid grid-cols-3 gap-4 sm:gap-8"
        >
          {[
            { number: "98%", label: "Accuracy" },
            { number: "500K+", label: "Farms Monitored" },
            { number: "24/7", label: "Real-time Alerts" },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              className="space-y-2"
            >
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {stat.number}
              </p>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};
