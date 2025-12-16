'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { logAnalyticsEvent } from '@/lib/api/client';
import { generateSessionId } from '@/lib/utils';

export default function LandingPage() {
  const router = useRouter();
  const sessionId = typeof window !== 'undefined' ?
    (sessionStorage.getItem('sessionId') || generateSessionId()) :
    '';

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('sessionId')) {
      sessionStorage.setItem('sessionId', sessionId);
    }
  }, [sessionId]);

  const handleStartJourney = async () => {
    await logAnalyticsEvent(sessionId, 'landing_to_search_home');
    router.push('/search');
  };

  const handleNewSearch = async () => {
    await logAnalyticsEvent(sessionId, 'landing_to_new_search');
    router.push('/new-search');
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="absolute left-8 top-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-600">
          <span className="text-2xl font-bold text-white">D</span>
        </div>
        <span className="text-xl font-semibold text-gray-900">Demo Retailer</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex max-w-6xl flex-col items-center px-8 text-center"
      >
        <h1 className="mb-8 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-7xl bg-gradient-to-r from-teal-600 via-blue-600 to-blue-700 bg-clip-text text-transparent" > Search that understands <br /> YOU </h1>
        <p className="mb-12 max-w-3xl text-xl text-gray-600 md:text-2xl">
          Shopping with an intelligent helper that understands your goals, not just keywords.
        </p>

        <div className="flex gap-6 flex-col md:flex-row items-center">
          {/* Start Your Journey Button */}
          <div className="relative">
            {/* Particle Effects */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-3 w-3 rounded-full bg-teal-400 shadow-lg shadow-teal-300/50"
                style={{
                  left: `${10 + i * 15}%`,
                  top: `${-30 + (i % 3) * 20}px`,
                }}
                animate={{
                  y: [0, -40, 0],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.2, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Glow effect beneath button */}
            <div className="absolute inset-0 -bottom-4 rounded-full bg-gradient-to-r from-teal-400 via-blue-400 to-teal-400 opacity-40 blur-3xl" />

            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 25px 50px rgba(20, 184, 166, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartJourney}
              className="group relative flex flex-row items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-teal-500 via-blue-600 to-blue-700 px-10 py-5 text-lg font-semibold text-white shadow-2xl transition-all hover:shadow-teal-500/50"
            >
              <span>Start Your Journey</span>
              <motion.div
                animate={{ x: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="h-6 w-6" />
              </motion.div>

              {/* Glow effect on hover */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-teal-400 to-blue-400 opacity-0 blur-xl transition-opacity group-hover:opacity-40"
              />
            </motion.button>
          </div>

          {/* Experience New Age Search Button */}
          <div className="relative">
            {/* Particle Effects */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`purple-${i}`}
                className="absolute h-3 w-3 rounded-full bg-purple-400 shadow-lg shadow-purple-300/50"
                style={{
                  left: `${10 + i * 15}%`,
                  top: `${-30 + (i % 3) * 20}px`,
                }}
                animate={{
                  y: [0, -40, 0],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.2, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.2 + 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Glow effect beneath button */}
            <div className="absolute inset-0 -bottom-4 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 opacity-40 blur-3xl" />

            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 25px 50px rgba(139, 92, 246, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewSearch}
              className="group relative flex flex-row items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-purple-500 via-pink-600 to-purple-700 px-10 py-5 text-lg font-semibold text-white shadow-2xl transition-all hover:shadow-purple-500/50"
            >
              <span>Experience New Age Search</span>
              <motion.div
                animate={{ x: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              >
                <ArrowRight className="h-6 w-6" />
              </motion.div>

              {/* Glow effect on hover */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 opacity-0 blur-xl transition-opacity group-hover:opacity-40"
              />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="absolute bottom-8 text-sm text-gray-500">
        Powered by Google Cloud Vertex AI
      </div>
    </div>
  );
}
