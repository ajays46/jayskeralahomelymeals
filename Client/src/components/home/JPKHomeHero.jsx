import React from 'react';
import { motion } from 'framer-motion';

const AMBIENT_SHADOW = 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.12))';

/**
 * JPK – premium editorial hero: large lunch package foreground + platter behind.
 */
const JPKHomeHero = ({ theme, onSignUpClick }) => {
  const textColor = theme.heroTextColor || '#1F2937';
  const subtextColor = theme.heroSubtextColor || '#4B5563';
  const ctaText = theme.heroCtaText || 'Explore Combos';
  const ctaColor = theme.heroCtaColor || '#6B1D1D';
  const ctaHover = theme.heroCtaHoverColor || '#5E1014';

  const platterImage = theme.heroShowcaseImage || '/jpk/jpk-hero.png';
  const bagImage = theme.heroPackagingImage || '/jpk/jpk-pckg.png';
  const headline = theme.heroTitle || 'Authentic Kerala Meals.';

  return (
    <section className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden bg-[#FDFBF7] pt-[4.25rem] font-['Inter',system-ui,sans-serif] lg:pt-[4.75rem]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 100% 20%, rgba(250, 204, 21, 0.1) 0%, transparent 55%),
            radial-gradient(ellipse 50% 45% at 100% 85%, rgba(122, 21, 26, 0.04) 0%, transparent 50%),
            linear-gradient(165deg, #FDFBF7 0%, #FEFCF8 50%, #FDFBF7 100%)
          `,
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 px-6 py-4 sm:py-6 lg:px-12 lg:py-8">
        <div className="grid h-full min-h-0 w-full grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-6 xl:gap-8">
          {/* Left — clean cream typography */}
          <motion.div
            className="relative order-2 text-center lg:order-1 lg:text-left"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              className="mx-auto mb-3 max-w-[18rem] text-[1.65rem] font-extrabold leading-[1.1] tracking-tight min-[400px]:max-w-none min-[400px]:text-[1.85rem] sm:mb-4 sm:text-4xl lg:mx-0 lg:text-[2.75rem] xl:text-5xl"
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
              className="mx-auto max-w-md px-1 text-[0.9375rem] leading-relaxed sm:px-0 sm:text-lg lg:mx-0"
              style={{ color: subtextColor }}
            >
              {theme.heroDescription ||
                'Chef-crafted meals delivered fresh straight to your door.'}
            </p>

            <button
              type="button"
              onClick={onSignUpClick}
              className="mt-5 inline-block sm:mt-6"
            >
              <span
                className="inline-flex min-h-[2.5rem] items-center justify-center rounded-full px-6 py-2 text-sm font-semibold text-white transition-all duration-300 active:scale-[0.98] sm:min-h-[2.75rem] sm:px-8 sm:py-2.5 sm:hover:-translate-y-0.5"
                style={{ backgroundColor: ctaColor }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = ctaHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ctaColor;
                }}
              >
                {ctaText}
              </span>
            </button>
          </motion.div>

          {/* Right — large bag foreground + platter behind right edge */}
          <div className="order-1 flex min-h-0 items-center justify-center lg:order-2 lg:justify-start">
            <motion.div
              className="w-full max-w-[270px] min-[400px]:max-w-[310px] sm:max-w-[370px] md:max-w-[410px] lg:max-w-[480px] xl:max-w-[520px]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative block w-full overflow-visible">
                {/* Platter — smaller, behind bag's right edge */}
                <motion.div
                  className="absolute right-[2%] bottom-0 z-10 w-[51%] sm:right-[4%] sm:w-[49%] lg:w-[47%]"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                  style={{ filter: AMBIENT_SHADOW }}
                >
                  <img
                    src={platterImage}
                    alt="Traditional Kerala meal served on a banana leaf"
                    className="h-auto w-full object-contain object-bottom mix-blend-screen"
                  />
                </motion.div>

                {/* Lunch bag — hero foreground */}
                <motion.div
                  className="relative z-20 w-[88%] sm:w-[84%]"
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ filter: AMBIENT_SHADOW }}
                >
                  <img
                    src={bagImage}
                    alt="Jay's Popular Kitchen stamped lunch delivery package"
                    className="h-auto w-full object-contain mix-blend-screen sm:scale-[1.05]"
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JPKHomeHero;
