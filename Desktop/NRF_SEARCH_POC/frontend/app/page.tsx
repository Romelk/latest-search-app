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
        className="flex max-w-4xl flex-col items-center px-8 text-center"
      >
        <h1 className="mb-6 text-6xl font-bold text-gray-900 md:text-7xl">
          Search that understands you
        </h1>
        <p className="mb-12 max-w-2xl text-xl text-gray-600 md:text-2xl">
          Shopping with an intelligent helper that understands your goals, not just keywords.
        </p>

        <div className="relative">
          {/* Particle Effects */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-teal-400"
              style={{
                left: `${20 + i * 15}%`,
                top: `${-20 + (i % 3) * 20}px`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}

          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(20, 184, 166, 0.4)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartJourney}
            className="group relative flex flex-row items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-teal-600 via-blue-600 to-teal-700 px-12 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-2xl"
          >
            <span>Start your journey</span>
            <motion.div
              animate={{ x: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="h-6 w-6" />
            </motion.div>

            {/* Glow effect on hover */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-teal-400 to-blue-400 opacity-0 blur-xl transition-opacity group-hover:opacity-30"
            />
          </motion.button>
        </div>
      </motion.div>

      <div className="absolute bottom-8 text-sm text-gray-500">
        Powered by Google Cloud Vertex AI
      </div>
    </div>
  );
}
