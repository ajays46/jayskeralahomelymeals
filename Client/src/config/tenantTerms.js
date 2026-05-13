/**
 * Company-specific Terms & Conditions (key = URL path, e.g. jkfds, jlg, ml).
 * Add or edit an entry per company. Unknown paths fall back to jkfds terms.
 */

const CONTACT_EMAIL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TERMS_CONTACT_EMAIL) || '[Your Email]';

/** @typedef {{ title: string, paragraphs?: string[], bullets?: string[] }} TermsSection */

/**
 * @typedef {{
 *   pageTitle: string,
 *   bannerTagline: string,
 *   lastUpdatedDisplay: string,
 *   intro: string[],
 *   sections: TermsSection[],
 *   contactTitle?: string,
 *   contact: { legalName: string; email?: string; extraLines?: string[] },
 * }} TenantTermsDocument
 */

/** @type {TenantTermsDocument} */
const jkfdsTerms = {
  pageTitle: 'Terms & Conditions',
  bannerTagline: 'Meal plans, food ordering & kitchen delivery (jkk fds)',
  lastUpdatedDisplay: '11 May 2026',
  intro: [
    'JAYS KERALA INNOVATIONS PRIVATE LIMITED provides this food ordering and meal plan service.',
    'By using our service, you agree to these Terms.',
  ],
  sections: [
    {
      title: '1. Payments & Refunds',
      paragraphs: ['All payments are final.', 'No refunds will be provided after purchase.'],
    },
    {
      title: '2. Delivery & Carry Forward',
      paragraphs: [
        'If you do not want a scheduled meal, you may request to stop delivery in advance.',
        'No refunds, credits, or carry forward to another day will be provided.',
      ],
    },
    {
      title: '3. Food Responsibility',
      paragraphs: [
        'Food should be consumed within 2 hours of delivery.',
        'After delivery, we are not responsible for food quality or safety.',
      ],
    },
    {
      title: '4. Menu Changes',
      paragraphs: ['The Company may change menu items at any time without prior notice.'],
    },
    {
      title: '5. Usage Terms',
      bullets: [
        'Users must not misuse the service or engage in illegal activity.',
        'Minimum age to use the service is 18 years.',
      ],
    },
    {
      title: '6. Liability',
      paragraphs: [
        'Service is provided "as is".',
        'We are not liable for indirect losses or damages.',
      ],
    },
    {
      title: '7. Governing Law',
      paragraphs: [
        'These Terms are governed by Indian law.',
        'Jurisdiction: Kochi, Kerala, India.',
      ],
    },
  ],
  contactTitle: 'Contact',
  contact: {
    legalName: 'JAYS KERALA INNOVATIONS PRIVATE LIMITED',
    email: CONTACT_EMAIL,
  },
};

/** @type {TenantTermsDocument} */
const jlgTerms = {
  pageTitle: 'Terms & Conditions',
  bannerTagline: 'Fresh microgreens & leafy produce only (JLG) — separate from meal-plan services',
  lastUpdatedDisplay: '11 May 2026',
  intro: [
    "These Terms apply to Jay's Leafy Greens (fresh micro greens and leafy products) ordering, delivery, and related services.",
    'By placing an order or using this site, you agree to these Terms.',
  ],
  sections: [
    {
      title: '1. Product nature & appearance',
      paragraphs: [
        'Fresh produce is a natural product: size, colour, and density may vary by batch and season.',
        'Images and descriptions on the site are indicative only and not a guarantee that each delivery will look identical.',
      ],
    },
    {
      title: '2. Orders, pricing & payment',
      paragraphs: [
        'Prices, fees, taxes, and minimum order rules are shown at checkout and may change without prior notice for future orders.',
        'The Company may cancel or refuse an order where a product is unavailable, there is a pricing error, or the law requires it.',
      ],
    },
    {
      title: '3. Delivery, storage & shelf life',
      paragraphs: [
        'Perishable items must be refrigerated or stored as labelled or as advised at checkout.',
        'You are responsible for safe handling after delivery. The Company is not liable for spoilage, quality, or safety if storage or consumption guidance is not followed.',
      ],
    },
    {
      title: '4. Substitutions & unavailability',
      paragraphs: [
        'If an item is unavailable, we may offer a reasonable substitute where permitted, or cancel that line item and adjust payment accordingly.',
      ],
    },
    {
      title: '5. Health information',
      paragraphs: [
        'Product information is general in nature and not medical or dietary advice. Consult a professional for health-related decisions.',
      ],
    },
    {
      title: '6. Acceptable use & age',
      bullets: [
        'You must not misuse the service, harass staff or other users, or use the site for unlawful activity.',
        'Minimum age to order or register is 18 years (or higher if required by law).',
      ],
    },
    {
      title: '7. Liability & law',
      paragraphs: [
        'Services are provided as permitted by law, without warranties beyond what cannot be excluded under Indian law.',
        'To the extent permitted by law, we are not liable for indirect or consequential loss.',
        'These Terms are governed by the laws of India. Courts at Kochi, Kerala, shall have jurisdiction.',
      ],
    },
  ],
  contactTitle: 'Contact (Leafy Greens)',
  contact: {
    legalName: "Jay's Leafy Greens",
    email: CONTACT_EMAIL,
  },
};

/** @type {TenantTermsDocument} */
const mlTerms = {
  pageTitle: 'Terms & Conditions',
  bannerTagline: 'Logistics software: trips, partners & dashboards (ML) — not food or greens retail',
  lastUpdatedDisplay: '11 May 2026',
  intro: [
    'These Terms apply to the MaXHub Logistics web platform used to manage trips, delivery partners, and related logistics operations.',
    'By accessing dashboards, APIs, or mobile/web features, you agree to these Terms.',
  ],
  sections: [
    {
      title: '1. Platform role',
      paragraphs: [
        'The platform is a software tool for scheduling, visibility, and coordination. It does not replace compliance with transport law, labour law, insurance, or permits applicable to your operations.',
      ],
    },
    {
      title: '2. Accounts, roles & security',
      bullets: [
        'You must keep login credentials confidential and notify us promptly of suspected unauthorised use.',
        'You may only use accounts and roles assigned to you by your organisation or the Company.',
        'You must not probe, scrape, or attack the platform, or attempt to access data you are not authorised to see.',
      ],
    },
    {
      title: '3. Trip & operational data',
      paragraphs: [
        'Trip status, locations, timestamps, and related data are provided for operational purposes. Accuracy depends on device, network, and user input; the Company does not guarantee error-free data.',
      ],
    },
    {
      title: '4. Partner conduct & vehicles',
      paragraphs: [
        'Delivery partners and drivers remain responsible for lawful driving, vehicle condition, and cargo handling.',
        'The platform does not insure goods or vehicles unless a separate written agreement says otherwise.',
      ],
    },
    {
      title: '5. Service changes & downtime',
      paragraphs: [
        'Features, integrations, and APIs may change, be limited, or be suspended for maintenance, security, or compliance reasons.',
      ],
    },
    {
      title: '6. Confidentiality',
      paragraphs: [
        'Non-public information you see in the platform (customer names, routes, rates, etc.) must be used only for your job and not disclosed without authorisation.',
      ],
    },
    {
      title: '7. Liability & law',
      paragraphs: [
        'The platform is provided on an "as is" basis to the extent permitted by law.',
        'We are not liable for lost profits, missed deliveries caused by third parties, or other indirect or consequential damages, except where Indian law does not allow such exclusion.',
        'These Terms are governed by the laws of India. Courts at Kochi, Kerala, shall have jurisdiction.',
      ],
    },
  ],
  contactTitle: 'Contact (Logistics)',
  contact: {
    legalName: 'MaXHub Logistics',
    email: CONTACT_EMAIL,
  },
};

const tenantTermsByPath = {
  jkfds: jkfdsTerms,
  jlg: jlgTerms,
  ml: mlTerms,
};

/**
 * Terms document for a company URL path (case-insensitive).
 * Add a key in `tenantTermsByPath` for each new company.
 */
/** Map DB / URL variants to the terms bundle key (extend when you add companies). */
const TERMS_PATH_ALIASES = {
  // add e.g. maxhub: 'ml' if your Company.name differs from the URL segment
};

export function getTermsForCompany(companyPath) {
  const raw = (companyPath || '').toString().trim().toLowerCase();
  const key = TERMS_PATH_ALIASES[raw] || raw;
  return tenantTermsByPath[key] || jkfdsTerms;
}
