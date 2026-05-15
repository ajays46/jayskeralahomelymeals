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
  pageTitle: 'terms and Conditions',
  bannerTagline: 'Terms for Jays Kerala Kitchen food delivey serivce',
  lastUpdatedDisplay: 'May 14, 2026',
  intro: [
    'Parent Entity: Jays Kerala Innovations Private Limited',
    'Corporate Identity (CIN): [Insert Your CIN here]',
  ],
  sections: [
    {
      title: '1. The Innovation Ecosystem',
      paragraphs: [
        'Jays Kerala Innovations Private Limited (the "Company") is a multi-sector innovation firm specializing in Software-as-a-Service (SaaS) applications.',
        'The Company operates as a legal umbrella for the following proprietary brands and service modules:',
      ],
      bullets: [
        'Jays Kerala Kitchen: Food delivery services.',
      ],
    },
    {
      title: '1. The Innovation Ecosystem (continued)',
      paragraphs: [
        'By accessing any application, website, or service provided by these brands, you agree to be bound by these Terms.',
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
        'Resource Allocation (No Carryforward): Our SaaS model reserves specific daily capacity for each active subscriber (e.g., a daily meal slot or a delivery window). If a user chooses to pause or skip a service day, that specific slot is forfeited. No credits or carryforwards are provided.',
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
        'Inter-Service Synergy: To improve user experience, data/preferences may be shared across Jays Kerala Kitchen food delivery service under this unified agreement.',
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
    legalName: 'Jays Kerala Innovations Private Limited',
    email: CONTACT_EMAIL,
    extraLines: [
      'Corporate Identity (CIN): [Insert Your CIN here]',
      'Grievance Officer: [Name of Officer]',
      'Official Support Email: [Official Support Email]',
    ],
  },
};

/** @type {TenantTermsDocument} */
const jlgTerms = {
  pageTitle: 'terms and Conditions',
  bannerTagline: 'Terms for Jays Leafy Greens',
  lastUpdatedDisplay: 'May 14, 2026',
  intro: [
    'Parent Entity: Jays Kerala Innovations Private Limited',
    'Corporate Identity (CIN): [Insert Your CIN here]',
  ],
  sections: [
    {
      title: '1. The Innovation Ecosystem',
      paragraphs: [
        'Jays Kerala Innovations Private Limited (the "Company") is a multi-sector innovation firm specializing in Software-as-a-Service (SaaS) applications.',
        'The Company operates as a legal umbrella for the following proprietary brands and service modules:',
        'By accessing any application, website, or service provided by these brands, you agree to be bound by these Terms.',
      ],
      bullets: [
        'Jays Leafy Greens',
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
        'Resource Allocation (No Carryforward): Our SaaS model reserves specific daily capacity for each active subscriber (e.g., a daily meal slot or a delivery window). If a user chooses to Pause or skip a service day, that specific slot is forfeited. No credits or carryforwards are provided.',
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
    legalName: 'Jays Kerala Innovations Private Limited',
    email: CONTACT_EMAIL,
    extraLines: [
      'Corporate Identity (CIN): [Insert Your CIN here]',
      'Grievance Officer: [Name of Officer]',
      'Official Support Email: [Official Support Email]',
    ],
  },
};

/** @type {TenantTermsDocument} */
const mlTerms = {
  pageTitle: 'terms and Conditions',
  bannerTagline: 'Terms for Maxhub Logistics',
  lastUpdatedDisplay: 'May 14, 2026',
  intro: [
    'Parent Entity: Jays Kerala Innovations Private Limited',
    'Corporate Identity (CIN): [Insert Your CIN here]',
  ],
  sections: [
    {
      title: '1. The Innovation Ecosystem',
      paragraphs: [
        'Jays Kerala Innovations Private Limited (the "Company") is a multi-sector innovation firm specializing in Software-as-a-Service (SaaS) applications.',
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
    legalName: 'Jays Kerala Innovations Private Limited',
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
