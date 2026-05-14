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
  bannerTagline: 'SAS-based subscription meal platform',
  lastUpdatedDisplay: 'May 14, 2026',
  intro: [
    'Entity: JAYS KERALA INNOVATIONS PRIVATE LIMITED',
    'FSSAI License No: [Insert Number]',
  ],
  sections: [
    {
      title: '1. Purpose and Service Overview',
      paragraphs: [
        'JAYS KERALA INNOVATIONS PRIVATE LIMITED (the "Company") operates a SAS-based subscription platform designed to provide scheduled, nutritional meal plans.',
        'The purpose of this service is to automate healthy eating through a subscription model that optimizes food procurement, reduces waste, and ensures timely delivery to users across [Your Service Cities, e.g., Kochi, Thrissur].',
      ],
    },
    {
      title: '2. Subscription & "No Refund" Policy',
      paragraphs: [
        'Nature of Subscription: By subscribing, you enter into a service agreement where resources (ingredients and logistics) are committed in advance based on your plan.',
        'Finality of Payment: All payments are non-refundable. Due to the perishable nature of our products and the SAS procurement model, we cannot offer refunds once a subscription period has commenced.',
        'No Carryforward: We offer the flexibility to "Pause" or "Stop" a delivery if notified [Insert Hours, e.g., 12 hours] in advance. However, as the daily slot and ingredients were reserved for you, these meals will not be carried forward to future dates, and no credits will be issued.',
      ],
    },
    {
      title: '3. Food Safety & FSSAI Compliance',
      paragraphs: [
        'FSSAI Standards: All meals are prepared in facilities compliant with FSSAI 2026 hygiene and safety standards.',
        'The 2-Hour Rule: Per FSSAI safety guidelines for cooked meals, food must be consumed within two (2) hours of delivery.',
        'Liability Shift: The Company is not liable for spoilage, food-borne illness, or quality degradation if the food is consumed beyond this 2-hour window or stored improperly (e.g., left in high humidity/heat) after delivery.',
      ],
    },
    {
      title: '4. Localized Delivery & "Force Majeure"',
      paragraphs: [
        'Kerala Specifics: We strive for 100% on-time delivery. However, we are not liable for delays caused by extreme weather (heavy monsoons or flooding), state events (hartals, strikes), or localized traffic diversions common in Kerala.',
        'Non-Delivery: In the rare event the Company cancels a delivery due to its own operational failure, a credit for that specific meal may be applied to your next billing cycle at the Company\'s sole discretion.',
      ],
    },
    {
      title: '5. Privacy & Data Protection (DPDP Act 2023)',
      paragraphs: [
        'Consent: We collect only the data necessary (Name, Address, Dietary Preferences) to fulfill your subscription.',
        'Rights: You have the right to access, correct, or request the erasure of your personal data by contacting our Data Protection Officer.',
        'Data Storage: Your data is stored on secure Indian servers and is never sold to third-party advertisers.',
      ],
    },
    {
      title: '6. Menu & Chef\'s Discretion',
      paragraphs: [
        'Our culinary team reserves the right to modify the menu without prior notice to ensure the use of the freshest seasonal produce available in the Kerala markets.',
      ],
    },
    {
      title: '7. Grievance Redressal & Jurisdiction',
      paragraphs: [
        'In compliance with E-commerce Rules 2020, we have appointed a Grievance Officer to handle user concerns.',
      ],
      bullets: [
        'Grievance Officer: [Name of Officer]',
        'Email: [Support Email Address]',
        'Timeline: We acknowledge grievances within 48 hours and aim for resolution within 1 month.',
        'Jurisdiction: These terms are governed by Indian Law. Any legal proceedings shall be subject to the exclusive jurisdiction of the courts in Kochi, Kerala.',
      ],
    },
    {
      title: 'Compliance Checklist for Website/App',
      bullets: [
        'FSSAI Logo & License Number: Must be visible on the footer of every page.',
        'Mandatory Checkbox during checkout: "I agree to the Terms & Conditions, specifically the No-Refund and 2-hour consumption policy."',
        'GST Transparency: Invoices must clearly show GST breakdown as a Kerala-registered Private Limited entity.',
      ],
    },
  ],
  contactTitle: 'Contact & Compliance',
  contact: {
    legalName: 'JAYS KERALA INNOVATIONS PRIVATE LIMITED',
    email: CONTACT_EMAIL,
    extraLines: [
      'FSSAI License No: [Insert Number]',
      'Grievance Officer: [Name of Officer]',
      'Grievance Email: [Support Email Address]',
    ],
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
