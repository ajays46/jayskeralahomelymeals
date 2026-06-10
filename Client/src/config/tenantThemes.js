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
  ml: {
    primaryColor: '#E85D04',
    accentColor: '#F48C06',
    logoUrl: '/Maxhub.jpeg',
    brandName: 'MaXHub Logistics',
    navBg: 'bg-[#2d2d2d]/90',
    heroTitle: 'MaXHub',
    heroSubtitle: 'Logistics',
    heroDescription: 'Logistics platform for delivery partners and operations.',
    homeGradient: 'from-orange-50 via-white to-orange-50',
    /** ML: logistics company - use minimal home, no food/menu content */
    isLogisticsCompany: true,
  },
  jpk: {
    primaryColor: '#7A151A',
    accentColor: '#FFFFFF',
    logoUrl: '/jpk/jpk.jpeg',
    brandName: "Jay's Popular Kitchen",
    brandTagline: 'Kerala Meals & Combos',
    navBg: 'bg-[#7A151A]',
    navbarLogoSize: 'small',
    brandNameColor: '#1F2937',
    navTaglineColor: '#7A151A',
    glassNavbar: true,
    modernSignInButton: true,
    authAccentColor: '#7A151A',
    authHeadingColor: '#7A151A',
    authFormPanelBg: '#F5F0E8',
    heroLayout: 'premium',
    heroBgColor: '#FDFBF7',
    heroTextColor: '#1F2937',
    heroSubtextColor: '#4B5563',
    heroCtaColor: '#7A151A',
    heroCtaHoverColor: '#5E1014',
    heroShowcaseImage: '/jpk/jpk-hero.png',
    heroPackagingImage: '/jpk/jpk-pckg.png',
    heroImage: '/jpk/jpk.jpeg',
    heroTitle: 'Authentic Kerala Meals.',
    heroSubtitle: 'Kerala Meals & Combos',
    heroDescription: 'Chef-crafted meals delivered fresh straight to your door.',
    heroCtaText: 'Explore',
    heroImageCaption: 'Individual Kerala Lunch Boxes',
    heroImageSubcaption: 'Packed fresh & delivered daily to your doorstep',
    heroCtaLink: '/menu',
    homeGradient: '',
    homePageBg: '#FDFBF7',
    featuredSectionTitle: 'Popular Kitchen Specials',
    adSectionTitle: "JAY'S POPULAR KITCHEN",
    adTagline: 'Kerala Meals & Combos',
    homeGradient: 'from-red-50 via-white to-amber-50',
    adSectionGradient: 'from-red-50 to-amber-50',
    featuredSectionSubtitle: 'Explore our curated Kerala meals and combo options by meal type',
    breakfastTitle: 'Breakfast Combos',
    breakfastSubtitle: 'Start your day with traditional Kerala breakfast combos',
    lunchTitle: 'Lunch Combos',
    lunchSubtitle: 'Hearty Kerala lunch combos with rice, curries, and sides',
    dinnerTitle: 'Dinner Combos',
    dinnerSubtitle: 'Delicious dinner combos with traditional Kerala flavors',
    adRatesLine: 'NEW MEALS & COMBO RATES',
    adFooterLine: 'Popular Kitchen Network • Kerala Meals & Combos 5.0 ⭐',
    ctaTitle: 'Start Your Kitchen Journey Today!',
    ctaDescription: 'Experience authentic Kerala meals and combos with flexible plans. Choose what works best for you!',
    ctaOrderText: 'Order Now',
    ctaContactText: 'Contact Us',
    minimalNavbar: true,
    minimalHome: true,
    hideTermsAndConditions: true,
    footerCopyrightName: "Jay's Popular Kitchen",
  },
  jom: {
    primaryColor: '#7A151A',
    accentColor: '#2D6A4F',
    logoUrl: '/jom/jom.jpeg',
    brandName: "Jay's Office Meals",
    navBg: 'bg-[#FDFBF7]',
    navbarVariant: 'jom-editorial',
    brandNameColor: '#1A0F0B',
    heroLayout: 'jom-editorial',
    heroShowcaseImage: '/jom/jom-hero.png',
    heroBgColor: '#FDFBF7',
    heroTextColor: '#1A0F0B',
    heroSubtextColor: '#4A3F35',
    heroImage: '/jom/jom-hero.png',
    heroTitle: 'Fresh Kerala Lunch.',
    heroSubtitle: 'Delivered Fresh',
    heroDescription: 'AUTHENTIC MEALS, DELIVERED TO YOUR OFFICE',
    featuredSectionTitle: 'Office Meal Selection',
    adSectionTitle: "JAY'S OFFICE MEALS",
    adTagline: 'Authentic Meals • Delivered to Your Office',
    homeGradient: 'from-stone-100 via-white to-emerald-50',
    adSectionGradient: 'from-stone-100 to-emerald-50',
    featuredSectionSubtitle: 'Explore our office-friendly Kerala meal options by meal type',
    breakfastTitle: 'Office Breakfast',
    breakfastSubtitle: 'Light Kerala breakfast options for a great start to your workday',
    lunchTitle: 'Office Lunch',
    lunchSubtitle: 'Satisfying Kerala lunch meals delivered to your workplace',
    dinnerTitle: 'Office Dinner',
    dinnerSubtitle: 'Convenient dinner options for late office hours',
    adRatesLine: 'NEW OFFICE MEAL RATES',
    adFooterLine: 'Office Meals Network • Delivered Fresh Daily 5.0 ⭐',
    ctaTitle: 'Start Your Office Meal Plan Today!',
    ctaDescription: 'Get authentic Kerala meals delivered to your office. Flexible plans for teams and individuals.',
    ctaOrderText: 'Order Now',
    ctaContactText: 'Contact Us',
    minimalNavbar: true,
    minimalHome: true,
    hideTermsAndConditions: true,
    footerCopyrightName: "Jay's Office Meals",
    authAccentColor: '#2D6A4F',
    authHeadingColor: '#3D2B1F',
    authFormPanelBg: '#F5F0E8',
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

const LIGHT_ACCENTS = new Set(['#ffffff', '#fff', '#fefefe', '#fafafa']);

/**
 * Accent safe for auth forms (buttons/links on white). Avoids invisible white-on-white UI.
 */
export function getAuthAccentColor(theme) {
  if (!theme) return '#FE8C00';
  const candidate =
    theme.authAccentColor ||
    theme.primaryColor ||
    theme.heroCtaColor ||
    theme.accentColor;
  if (!candidate) return '#FE8C00';
  if (LIGHT_ACCENTS.has(candidate.toLowerCase())) {
    return theme.primaryColor || theme.authAccentColor || '#7A151A';
  }
  return candidate;
}

/** Headings and labels on auth forms — tenant brand text colour, not the reference orange/green. */
export function getAuthHeadingColor(theme) {
  if (!theme) return '#1F2937';
  return (
    theme.authHeadingColor ||
    theme.brandNameColor ||
    theme.heroTextColor ||
    theme.primaryColor ||
    '#1F2937'
  );
}

export function getAuthFormBg(theme) {
  if (!theme) return '#FDFBF7';
  return theme.homePageBg || theme.heroBgColor || '#FDFBF7';
}

export function getAuthFormPanelBg(theme) {
  if (!theme) return '#F5F0E8';
  return theme.authFormPanelBg || '#F5F0E8';
}
