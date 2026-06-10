import React from 'react';
import { motion } from 'framer-motion';

const AMBIENT_SHADOW = 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.12))';

function renderHeadline(text) {
  return text.split(/(Kerala)/i).map((part, i) =>
    /^Kerala$/i.test(part) ? (
      <span key={i} className="text-[#7A151A]">
        {part}
      </span>
    ) : (
      part
    )
  );
}

/**
 * JOM – centered editorial hero for Jay's Office Meals.
 * Symmetrical vertical stack on a single central axis.
 */
const JOMHomeHero = ({ theme }) => {
  const headline = theme.heroTitle || 'Fresh Kerala Lunch.';
  const subheadline =
    theme.heroDescription || 'AUTHENTIC MEALS, DELIVERED TO YOUR OFFICE';
  const platterImage = theme.heroShowcaseImage || theme.heroImage || '/jom/jom-hero.png';
  const bagImage = theme.heroPackagingImage || '/jom/jom-pckage.png';

  return (
    <section className="relative flex-1 w-full min-h-[calc(100vh-4.25rem)] overflow-hidden font-['Inter',system-ui,sans-serif] sm:min-h-[calc(100vh-4.75rem)]">
      {/* Base warm vertical gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#FDFBF7] via-[#FAF4EA] to-[#F5EFE4]"
        aria-hidden
      />

      {/* Symmetrical color washes */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 70% 45% at 50% 0%, rgba(45, 106, 79, 0.14) 0%, transparent 58%),
            radial-gradient(ellipse 45% 38% at 0% 50%, rgba(122, 21, 26, 0.09) 0%, transparent 52%),
            radial-gradient(ellipse 45% 38% at 100% 50%, rgba(122, 21, 26, 0.09) 0%, transparent 52%),
            radial-gradient(ellipse 55% 40% at 50% 100%, rgba(212, 168, 83, 0.16) 0%, transparent 55%)
          `,
        }}
      />

      {/* Soft center glow behind content */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 50% 42% at 50% 45%, rgba(255,255,255,0.65) 0%, transparent 68%)',
        }}
      />

      {/* Gentle ambient orbs */}
      <motion.div
        className="pointer-events-none absolute -top-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl sm:h-72 sm:w-72"
        style={{ background: 'radial-gradient(circle, rgba(45,106,79,0.22) 0%, transparent 70%)' }}
        animate={{ opacity: [0.45, 0.65, 0.45] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute bottom-8 left-1/2 h-56 w-72 -translate-x-1/2 rounded-full blur-3xl sm:h-64 sm:w-80"
        style={{ background: 'radial-gradient(circle, rgba(122,21,26,0.12) 0%, transparent 72%)' }}
        animate={{ opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 pb-10 pt-24 text-center sm:px-8 sm:pb-16 sm:pt-28 md:pt-32 lg:pb-20">
        <motion.h1
          className="text-center text-4xl font-black text-[#1A0F0B] md:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          {renderHeadline(headline)}
        </motion.h1>

        <motion.p
          className="mt-4 max-w-xl text-center text-base text-[#3D2B1F]/70 md:text-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {subheadline}
        </motion.p>

        <motion.div
          className="relative mt-8 w-full max-w-[min(100%,380px)] sm:mt-10 md:mt-12"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-[62%] h-28 w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-[52px] sm:h-36 md:h-44"
            style={{
              background:
                'radial-gradient(ellipse, rgba(122,21,26,0.18) 0%, rgba(212,168,83,0.1) 45%, transparent 72%)',
            }}
            aria-hidden
          />

          <div className="relative mx-auto w-full max-w-[270px] min-[400px]:max-w-[300px] sm:max-w-[340px] md:max-w-[380px]">
            <div className="relative block w-full overflow-visible pr-4 sm:pr-6">
              <motion.div
                className="absolute bottom-0 right-[-10%] z-10 w-[54%] sm:right-[-12%] sm:w-[52%] md:right-[-14%] md:w-[50%]"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                style={{ filter: AMBIENT_SHADOW }}
              >
                <img
                  src={platterImage}
                  alt="Traditional Kerala meal served on a banana leaf"
                  className="h-auto w-full object-contain object-bottom mix-blend-screen"
                />
              </motion.div>

              <motion.div
                className="relative z-20 w-[88%] sm:w-[84%]"
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ filter: AMBIENT_SHADOW }}
              >
                <img
                  src={bagImage}
                  alt="Jay's Office Meals stamped lunch delivery package"
                  className="h-auto w-full object-contain mix-blend-screen sm:scale-[1.05]"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default JOMHomeHero;
