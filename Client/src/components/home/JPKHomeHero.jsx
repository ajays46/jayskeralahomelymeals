import React from 'react';
import { motion } from 'framer-motion';

/**
 * JPK – premium immersive hero for Jay's Popular Kitchen (retail delivery).
 */
const JPKHomeHero = ({ theme }) => {
  const textColor = theme.heroTextColor || '#1F2937';
  const subtextColor = theme.heroSubtextColor || '#4B5563';

  const headline =
    theme.heroTitle || 'Authentic Kerala Meals. Packed Fresh. Delivered Daily.';

  return (
    <section className="relative flex-1 min-h-[calc(100vh-4.25rem)] lg:min-h-[calc(100vh-4.75rem)] overflow-hidden font-['Inter',system-ui,sans-serif] pt-20 sm:pt-24 lg:pt-28">
      {/* Premium mesh gradient */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 8% 0%, rgba(250, 204, 21, 0.18) 0%, transparent 55%),
            radial-gradient(ellipse 75% 55% at 92% 8%, rgba(122, 21, 26, 0.07) 0%, transparent 50%),
            radial-gradient(ellipse 60% 45% at 50% 95%, rgba(255, 255, 255, 0.9) 0%, transparent 60%),
            linear-gradient(165deg, #FDFBF7 0%, #FFFFFF 42%, #FDFBF7 100%)
          `,
        }}
      />

      {/* Ambient orbs */}
      <motion.div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(250,204,21,0.5) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.35, 0.25] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />
      <motion.div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(122,21,26,0.35) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pb-10 sm:pb-14 lg:pb-16">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
          {/* Copy */}
          <motion.div
            className="lg:col-span-5 xl:col-span-5 text-center lg:text-left order-2 lg:order-1"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              className="text-[2rem] sm:text-4xl lg:text-[2.75rem] xl:text-5xl font-extrabold leading-[1.08] tracking-tight mb-6"
              style={{ color: textColor }}
            >
              {headline.split('. ').map((line, i, arr) => (
                <span key={i} className="block">
                  {line}
                  {i < arr.length - 1 ? '.' : ''}
                </span>
              ))}
            </h1>

            <p
              className="text-base sm:text-lg leading-relaxed max-w-md mx-auto lg:mx-0"
              style={{ color: subtextColor }}
            >
              {theme.heroDescription ||
                'Home-style Kerala lunch boxes made fresh every morning — individually packed, delivered straight to you, and ready the moment hunger hits.'}
            </p>
          </motion.div>

          {/* Visual stage */}
          <div className="lg:col-span-7 xl:col-span-7 order-1 lg:order-2 relative flex justify-center lg:justify-end min-h-[280px] sm:min-h-[340px] lg:min-h-[420px]">
            <motion.div
              className="relative w-full max-w-[320px] sm:max-w-[380px] lg:max-w-[440px]"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="absolute inset-0 scale-90 rounded-full blur-3xl opacity-50"
                style={{ background: 'radial-gradient(circle, rgba(250,204,21,0.45) 0%, rgba(122,21,26,0.12) 55%, transparent 75%)' }}
                aria-hidden
              />

              <motion.div
                className="relative z-10"
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <img
                  src={theme.heroShowcaseImage || '/jpk/jpk-hero.png'}
                  alt="Traditional Kerala meal served on a banana leaf"
                  className="w-full h-auto object-contain drop-shadow-[0_28px_48px_rgba(122,21,26,0.22)]"
                  style={{ filter: 'saturate(1.05) contrast(1.02)' }}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JPKHomeHero;
