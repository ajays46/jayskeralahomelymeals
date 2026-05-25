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
  pageTitle: "Jay's Kerala Kitchen",
  bannerTagline: "Welcome to Jay's Kerala Kitchen",
  lastUpdatedDisplay: 'May 14, 2026',
  intro: [
    "We've stripped away the heavy legal jargon so you know exactly how our food delivery service works. By using our website, app, or ordering from us, you agree to these simple rules.",
  ],
  sections: [
    {
      title: '1. Using Our Service',
      paragraphs: [
        'The Agreement: When you use our app, website, or order food, you are agreeing to these terms.',
        "App Maintenance: Sometimes we need to update our system to make it better. If the app goes down briefly for maintenance, we aren't liable for the temporary interruption.",
        'Our Property: All recipes, menu designs, photos, and app code belong to us. Please do not copy, scrape, or steal them.',
      ],
    },
    {
      title: '2. Payments & Subscriptions',
      bullets: [
        'No Refunds: All payments made for our food or subscription plans are final.',
        "Use It or Lose It: We plan our daily cooking and deliveries based on active subscribers. If you decide to skip a day or pause your meal, that day's meal is forfeited. You cannot roll it over to the next month or get a credit for it.",
      ],
    },
    {
      title: '3. Food Safety & Delivery',
      bullets: [
        'The 2-Hour Rule: Because our food is fresh and contains no nasty preservatives, you must eat it within two (2) hours of delivery.',
        'Our Responsibility Ends at Your Door: Once our delivery tracking system shows your food has been successfully delivered, it is officially yours. We are not responsible for food spoiling if it is left sitting out or stored incorrectly after delivery.',
      ],
    },
    {
      title: '4. Kerala Weather & Local Events (Force Majeure)',
      paragraphs: [
        'We always try our best to deliver on time, but Kerala can be unpredictable. We are not responsible for delivery delays caused by things out of our control, such as:',
      ],
      bullets: [
        'Heavy Monsoon rains and flooding',
        'Hartals (strikes) or local protests',
        'Any major local disruptions',
      ],
    },
    {
      title: '5. Your Data & Privacy',
      bullets: [
        'Data Minimalism: We only collect the basic information we need to get your food to you.',
        'Stored Safely: In line with Indian laws, your data is stored securely on servers inside India.',
        'Better Service: We may share your food preferences across our internal brand modules to give you a more personalized experience.',
      ],
    },
    {
      title: '6. Complaints & Legal Stuff',
      paragraphs: [
        'If we have a legal disagreement that we absolutely cannot solve together, it will be handled exclusively by the courts in Kochi, Kerala.',
      ],
    },
  ],
  contactTitle: 'Contact Information',
  contact: {
    legalName: "Jay's Kerala Kitchen Food Delivery Service",
    email: '[Your Email]',
    extraLines: [
      'Corporate Identity (CIN): [Insert Your CIN here]',
      'Grievance Officer: [Name of Officer]',
      'Grievance Email: [Official Support Email]',
    ],
  },
};

/** @type {TenantTermsDocument} */
const jlgTerms = {
  pageTitle: "Jay's Leafy Greens",
  bannerTagline: "Welcome to Jay's Leafy Greens",
  lastUpdatedDisplay: 'May 14, 2026',
  intro: [
    'We cultivate premium, nutrient-dense microgreens. We have simplified our terms so you know exactly how our harvest, delivery, and safety protocols work. By purchasing our greens or using our platform, you agree to these rules.',
  ],
  sections: [
    {
      title: '1. Our Microgreens Service',
      paragraphs: [
        'The Agreement: These terms apply to all orders of our harvested microgreens, live growing trays, and subscription features.',
        'Natural Variations: Microgreens are a live, natural product. Minor variations in color, size, and leaf density are completely normal and a sign of organic, pesticide-free cultivation.',
      ],
    },
    {
      title: '2. Harvest Cycles & Subscription Policy',
      bullets: [
        'Strict Harvest Allocation: We plant and grow our microgreens on a tight, custom cultivation cycle (typically 7 to 14 days) specifically allocated to active accounts.',
        'Finality of Payment: Because crops are grown to order, all subscription payments are final. No refunds will be issued.',
        'No Carryforwards: If you choose to pause or skip a scheduled delivery week, your specific fresh harvest slot for that week is forfeited. It cannot be rolled over or credited, as the live greens cannot be stored past their peak harvest window.',
      ],
    },
    {
      title: '3. Microgreens Food Safety & Storage Standards',
      bullets: [
        'Immediate Refrigeration Required: Microgreens are highly perishable raw superfoods. To maintain nutritional value and prevent spoilage, they must be placed in a refrigerator (stored between 2°C to 4°C) within two (2) hours of delivery.',
        'Consumption Prep: Unless explicitly labeled as "Pre-Washed & Ready to Eat," we recommend gently rinsing your fresh microgreens in cold water immediately before consumption.',
        'Transfer of Liability: Our responsibility for the freshness and structural integrity of the microgreens ends the exact moment our tracking system marks the order as delivered. We are not liable for wilting, mold, or spoilage caused by improper handling, washing, or storage after delivery.',
      ],
    },
    {
      title: '4. Kerala Environment & Local Disruptions',
      paragraphs: [
        'We operate in full compliance with the State of Kerala laws. We are not responsible for delivery delays caused by circumstances outside our control, such as heavy Monsoon flooding, local Hartals (strikes), or sudden logistical disruptions within the state.',
      ],
    },
    {
      title: '5. Your Data & Privacy',
      bullets: [
        'Data Minimalism: In line with the DPDP Act 2023, we only collect the basic contact and location details required to coordinate your fresh deliveries. Your data is securely stored on servers within India.',
      ],
    },
    {
      title: '6. Legal Jurisdiction',
      paragraphs: [
        'Any unresolved legal disputes shall be handled exclusively under the jurisdiction of the courts in Kochi, Kerala.',
      ],
    },
  ],
  contactTitle: 'Contact Information',
  contact: {
    legalName: "Jay's Leafy Greens",
    email: '[Your Email]',
    extraLines: [
      'Corporate Identity (CIN): [Insert Your CIN here]',
      'Grievance Officer: [Name of Officer]',
      'Official Grievance Email: [Official Support Email]',
    ],
  },
};

/** @type {TenantTermsDocument} */
const mlTerms = {
  pageTitle: 'terms and Conditions',
  bannerTagline: 'Terms for Maxhub Logistics',
  lastUpdatedDisplay: 'May 14, 2026',
  intro: [
    'Company: Maxhub logistcis',
    'Corporate Identity (CIN): [Insert Your CIN here]',
  ],
  sections: [
    {
      title: '1. The Innovation Ecosystem',
      paragraphs: [
        'Maxhub logistcis (the "Company") is a logistics service provider.',
        'The Company operates as a legal umbrella for the following proprietary brands and service modules:',
        'By accessing any application, website, or service provided by these brands, you agree to be bound by these Terms.',
      ],
      bullets: [
        'Maxhub Logistics',
      ],
    },
    {
      title: '2. Digital Standards & Brand-Specific Copyrights',
      paragraphs: [
        'All digital products, brand identities, and software developed by the Company are provided on a subscription basis.',
      ],
      bullets: [
        'Individual Brand Copyrights: While operating under one parent entity, each brand maintains a distinct copyright identity.',
        'All content, including but not limited to: Jays Kerala Kitchen: Recipes, menu designs, and culinary photography.',
        'Proprietary Rights: All software code, UI/UX designs, and trade secrets are protected under the Copyright Act 1957. Unauthorized scraping or reproduction of any brand asset is strictly prohibited.',
        'System Maintenance: The Company reserves the right to conduct upgrades across any brand platform. We are not liable for temporary service interruptions.',
      ],
    },
    {
      title: '3. Unified Subscription & Financial Policy',
      bullets: [
        'Finality of Payment: All subscription payments for any Company brand are final. No refunds will be issued.',
        'Resource Allocation (No Carryforward): Our SaaS model reserves specific daily capacity for each active subscriber (e.g., a daily meal slot or a delivery window). If a user chooses to "Pause" or skip a service day, that specific slot is forfeited. No credits or carryforwards are provided.',
      ],
    },
    {
      title: '4. Operational & Safety Standards (Perishables & Logistics)',
      paragraphs: [
        'Specific protocols apply based on the brand service utilized:',
      ],
      bullets: [
        'The 2-Hour Safety Rule: For any perishable goods delivered via Jays Kerala Kitchen or Jays Leafy Greens, products must be consumed within two (2) hours of the delivery timestamp.',
        'Transfer of Liability: Responsibility for product quality ends at the moment of successful delivery as recorded by the Maxhub Logistics tracking system. The Company is not liable for spoilage due to improper storage after delivery.',
      ],
    },
    {
      title: '5. Regional Force Majeure (Kerala Context)',
      paragraphs: [
        'Our service commitments are subject to the unique realities of Kerala:',
      ],
      bullets: [
        'Climatic & Social Events: The Company is not liable for delays caused by extreme weather (Monsoons/Flooding), Hartals, strikes, or localized disruptions within the state.',
        'Local Governance: We operate in full compliance with the laws of the State of Kerala and the Republic of India.',
      ],
    },
    {
      title: '6. Data Stewardship (DPDP Act 2023)',
      paragraphs: [
        'As a Data Fiduciary, we prioritize your security:',
      ],
      bullets: [
        'Data Minimalism: We collect only necessary data.',
        'Localization: All data is stored on secure servers within India.',
        'Inter-Service Synergy: To improve user experience, data/preferences may be shared across Jays Kerala Kitchen food delivey service under this unified agreement.',
      ],
    },
    {
      title: '7. Grievance Redressal & Jurisdiction',
      bullets: [
        'Grievance Officer: [Name of Officer]',
        'Contact: [Official Support Email]',
        'Jurisdiction: These Terms are governed by the laws of India. Any legal proceedings shall be subject to the exclusive jurisdiction of the courts in Kochi, Kerala.',
      ],
    },
  ],
  contactTitle: 'Contact Information',
  contact: {
    legalName: 'Maxhub logistcis',
    email: CONTACT_EMAIL,
    extraLines: [
      'Corporate Identity (CIN): [Insert Your CIN here]',
      'Grievance Officer: [Name of Officer]',
      'Official Support Email: [Official Support Email]',
    ],
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
  jkkfds: 'jkfds',
  // add e.g. maxhub: 'ml' if your Company.name differs from the URL segment
};

export function getTermsForCompany(companyPath) {
  const raw = (companyPath || '').toString().trim().toLowerCase();
  const key = TERMS_PATH_ALIASES[raw] || raw;
  return tenantTermsByPath[key] || jkfdsTerms;
}
