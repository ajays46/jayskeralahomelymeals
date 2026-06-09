import React from 'react';
import { motion } from 'framer-motion';

const CANVAS = '#FDFBF7';

/**
 * JOM – centered editorial hero for Jay's Office Meals.
 * Symmetrical vertical stack on a single central axis.
 */
const JOMHomeHero = ({ theme }) => {
  const headline = theme.heroTitle || 'Fresh Kerala Lunch.';
  const subheadline =
    theme.heroDescription || 'AUTHENTIC MEALS, DELIVERED TO YOUR OFFICE';
  const productImage = theme.heroShowcaseImage || theme.heroImage || '/jom/jom-hero.png';

  return (
    <section
      className="relative flex-1 w-full min-h-[calc(100vh-4.25rem)] overflow-hidden font-['Inter',system-ui,sans-serif] sm:min-h-[calc(100vh-4.75rem)]"
      style={{ backgroundColor: CANVAS }}
    >
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 pb-10 pt-24 text-center sm:px-8 sm:pb-16 sm:pt-28 md:pt-32 lg:pb-20">
        <motion.h1
          className="text-center text-4xl font-black text-[#1A0F0B] md:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          {headline}
        </motion.h1>

        <motion.p
          className="mt-4 max-w-xl text-center text-base text-neutral-600 md:text-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {subheadline}
        </motion.p>

        <motion.div
          className="relative mt-8 w-full max-w-[min(100%,340px)] sm:mt-10 md:mt-12"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-[62%] h-24 w-[125%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-[40px] sm:h-32 sm:w-[130%] sm:blur-[56px] md:h-44 md:blur-[64px]"
            style={{
              background:
                'radial-gradient(ellipse, rgba(61,43,31,0.42) 0%, rgba(26,15,11,0.16) 40%, transparent 75%)',
            }}
            aria-hidden
          />

          <div className="relative mx-auto w-full max-w-[260px] min-[400px]:max-w-[280px] sm:max-w-[320px] md:max-w-[340px]">
            <div className="rounded-full p-[2px] sm:p-1">
              <div
                className="rounded-full p-1.5 sm:p-2.5"
                style={{
                  background:
                    'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(245,235,220,0.6) 100%)',
                  boxShadow: '0 0 0 1px rgba(26,15,11,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
              >
                <div
                  className="relative aspect-square w-full overflow-hidden rounded-full"
                  style={{
                    boxShadow:
                      '0 28px 56px rgba(26, 15, 11, 0.24), 0 10px 20px rgba(61, 43, 31, 0.16)',
                  }}
                >
                  <img
                    src={productImage}
                    alt="Fresh Kerala lunch box on a banana leaf"
                    className="h-full w-full object-cover"
                    style={{ filter: 'saturate(1.04) contrast(1.02)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default JOMHomeHero;
