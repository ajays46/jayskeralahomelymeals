/**
 * Company-wise UI theme config (frontend only, no schema change).
 * Same app functionality for all companies; only look differs per company.
 * Key: company path from URL (e.g. jkhm, jlg). Add entries for each company that should have a custom look.
 *
 * Optional keys:
 *   primaryColor, accentColor, logoUrl, brandName, navBg  - navbar & global
 *   Home page overrides (optional):
 *   heroTitle, heroSubtitle, heroDescription, heroImage, featuredSectionTitle, adSectionTitle, adTagline, homeGradient
 */
export const tenantThemes = {
  jkhm: {
    primaryColor: '#FE8C00',
    accentColor: '#FE8C00',
    logoUrl: '/logo.png',
    brandName: "Jay's Kerala Homely Meals",
    navBg: 'bg-[#989494]/50',
    heroTitle: 'Discover Authentic',
    heroSubtitle: 'Kerala Cuisine',
    heroDescription: "Experience the rich flavors and traditional recipes from God's Own Country. From spicy curries to aromatic rice dishes, every bite tells a story.",
    heroImage: '/banner_one.jpg',
    featuredSectionTitle: 'Our Featured Dishes',
    adSectionTitle: "JAY'S KERALA HOMELY MEALS",
    adTagline: 'Homely Meals Network',
    homeGradient: 'from-orange-50 via-white to-orange-50',
    adSectionGradient: 'from-orange-50 to-yellow-50',
    featuredSectionSubtitle: 'Explore our carefully curated selection of traditional Kerala dishes by meal type',
    breakfastTitle: 'Breakfast Delights',
    breakfastSubtitle: 'Start your day with traditional Kerala breakfast items',
    lunchTitle: 'Lunch Specials',
    lunchSubtitle: 'Traditional Kerala lunch with rice, curries, and sides',
    dinnerTitle: 'Dinner Favorites',
    dinnerSubtitle: 'Light and delicious dinner options with traditional flavors',
    adRatesLine: 'NEW BREAKFAST-LUNCH-DINNER RATES',
    adFooterLine: 'Premium Homely Meals Network • Popular Menu Rates 5.0 ⭐',
    ctaTitle: 'Start Your Meal Journey Today!',
    ctaDescription: "Experience authentic Kerala cuisine with our flexible meal plans. Choose what works best for you!",
    ctaOrderText: 'Order Now',
    ctaContactText: 'Contact Us',
  },
  jlg: {
    primaryColor: '#059669',
    accentColor: '#10b981',
    logoUrl: '/logo2.png',
    brandName: "Jay's Leafy Greens",
    navBg: 'bg-[#065f46]/80',
    heroTitle: 'Fresh & Healthy',
    heroSubtitle: 'Leafy Greens',
    heroDescription: 'Experience the goodness of fresh micro greens—nutrient-packed, sustainably grown. From peppery radish and tender pea shoots to vibrant mustard greens, every bite brings health and flavor to your table.',
    heroImage: '/JLG.png',
    featuredSectionTitle: 'Our Fresh Selection',
    featuredSectionSubtitle: 'Explore our carefully curated selection of fresh micro greens and leafy options by category.',
    breakfastTitle: 'Fresh Greens & Breakfast',
    breakfastSubtitle: 'Start your day with nutrient-rich micro greens and light bites.',
    lunchTitle: 'Leafy Bowls & Lunch',
    lunchSubtitle: 'Fresh salads, grain bowls, and greens-based lunch options.',
    dinnerTitle: 'Evening Greens',
    dinnerSubtitle: 'Light and delicious dinner options with fresh flavors.',
    adSectionTitle: "JAY'S LEAFY GREENS",
    adTagline: 'Fresh Greens Network',
    adRatesLine: 'NEW GREENS & MEAL RATES',
    adFooterLine: 'Premium Fresh Greens Network • Popular Menu Rates 5.0 ⭐',
    ctaTitle: 'Start Your Fresh Greens Journey Today!',
    ctaDescription: 'Experience fresh micro greens and flexible meal options. Choose what works best for you!',
    ctaOrderText: 'Order Now',
    ctaContactText: 'Contact Us',
    homeGradient: 'from-emerald-50 via-white to-teal-50',
    adSectionGradient: 'from-emerald-50 to-teal-50',
    /** JLG home: show these 6 products instead of breakfast/lunch/dinner. Add images to public/jlg/ */
    featuredProducts: [
      { name: 'Green Mustard', image: '/jlg/green_mustard.png' },
      { name: 'Red Radish', image: '/jlg/red_radish.png' },
      { name: 'White Radish', image: '/jlg/white_radish.png' },
      { name: 'Yellow Mustard', image: '/jlg/yellow mustard.png' },
      { name: 'Bok Choy', image: '/jlg/bok choy.jpeg' },
      { name: 'Sunflower', image: '/jlg/sunflower.png' },
    ],
    /** JLG: hide rates/pricing section and bottom CTA on home */
    hideRatesAndCta: true,
  },
};

const DEFAULT_THEME = {
  primaryColor: '#FE8C00',
  accentColor: '#FE8C00',
  logoUrl: '/logo.png',
  brandName: "Jay's Kerala Homely Meals",
  navBg: 'bg-[#989494]/50',
  heroTitle: 'Discover Authentic',
  heroSubtitle: 'Kerala Cuisine',
  heroDescription: "Experience the rich flavors and traditional recipes from God's Own Country. From spicy curries to aromatic rice dishes, every bite tells a story.",
  heroImage: '/banner_one.jpg',
  featuredSectionTitle: 'Our Featured Dishes',
  adSectionTitle: "JAY'S KERALA HOMELY MEALS",
  adTagline: 'Homely Meals Network',
  homeGradient: 'from-orange-50 via-white to-orange-50',
  adSectionGradient: 'from-orange-50 to-yellow-50',
  featuredSectionSubtitle: 'Explore our carefully curated selection of traditional Kerala dishes by meal type',
  breakfastTitle: 'Breakfast Delights',
  breakfastSubtitle: 'Start your day with traditional Kerala breakfast items',
  lunchTitle: 'Lunch Specials',
  lunchSubtitle: 'Traditional Kerala lunch with rice, curries, and sides',
  dinnerTitle: 'Dinner Favorites',
  dinnerSubtitle: 'Light and delicious dinner options with traditional flavors',
  adRatesLine: 'NEW BREAKFAST-LUNCH-DINNER RATES',
  adFooterLine: 'Premium Homely Meals Network • Popular Menu Rates 5.0 ⭐',
  ctaTitle: 'Start Your Meal Journey Today!',
  ctaDescription: "Experience authentic Kerala cuisine with our flexible meal plans. Choose what works best for you!",
};

/**
 * Get theme for a company by path or name (case-insensitive). Falls back to DEFAULT_THEME.
 */
export function getThemeForCompany(companyPath, companyName) {
  const key = (companyPath || companyName || '').toString().trim().toLowerCase();
  if (!key) return DEFAULT_THEME;
  return tenantThemes[key] || DEFAULT_THEME;
}
