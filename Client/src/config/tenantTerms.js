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
  bannerTagline: 'Master Terms for the Jays Kerala innovation ecosystem',
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
        'The Company operates as an umbrella entity for various proprietary digital platforms and service modules. By accessing any application, website, or service provided by the Company, you agree to be bound by these Master Terms.',
      ],
    },
    {
      title: '2. SaaS Licensing & Digital Standards',
      paragraphs: [
        'All digital products developed by the Company are provided on a subscription basis.',
      ],
      bullets: [
        'Predictive Architecture: Our SaaS platforms utilize automated logic for resource allocation, procurement, and logistical scheduling.',
        'Proprietary Rights: All software code, algorithms, UI/UX designs, and intellectual property within our applications are the exclusive property of the Company.',
        'System Maintenance: To maintain our innovation standards, the Company reserves the right to conduct system upgrades. While we strive for maximum uptime, we are not liable for temporary service interruptions during these periods.',
      ],
    },
    {
      title: '3. Unified Subscription & Financial Policy',
      paragraphs: [
        'To maintain the efficiency of our automated systems, all services follow a strict financial protocol:',
      ],
      bullets: [
        'Finality of Payment: All subscription payments are final. Due to the high-cost integration of automated systems and advance resource commitments, no refunds will be issued for any reason.',
        'Resource Allocation (No Carryforward): Our SaaS model reserves specific daily capacity for each active subscriber. If a user chooses to "Pause" or skip a service day via the app interface, that specific daily slot is forfeited. To ensure system sustainability, no credits or carryforwards will be provided.',
      ],
    },
    {
      title: '4. Operational & Safety Standards',
      paragraphs: [
        'While the Company operates as a technology firm, specific service modules involving physical goods (perishables) follow strict safety protocols:',
      ],
      bullets: [
        'The 2-Hour Safety Rule: For any perishable goods delivered via Company platforms, products must be consumed within two (2) hours of the recorded delivery timestamp.',
        'Transfer of Liability: The Company’s responsibility for product quality and safety ends at the moment of successful delivery as recorded by our digital tracking system. The Company is not liable for health outcomes or spoilage resulting from improper storage after delivery.',
      ],
    },
    {
      title: '5. Regional Force Majeure (Kerala Context)',
      paragraphs: [
        'Jays Kerala Innovations Private Limited is a Kerala-based entity. Our service commitments are subject to the unique geographical and social realities of the region:',
      ],
      bullets: [
        'Climatic & Social Events: The Company is not liable for service delays or failures caused by extreme weather (Monsoons/Flooding), Hartals, strikes, or localized traffic disruptions common within the state.',
        'Local Governance: We operate in full compliance with the digital and commercial laws of the State of Kerala and the Republic of India.',
      ],
    },
    {
      title: '6. Data Stewardship (DPDP Act 2023)',
      paragraphs: [
        'As a Data Fiduciary, the Company prioritizes the security of your digital footprint:',
      ],
      bullets: [
        'Data Minimalism: We collect only the data necessary to fulfill the SaaS functions you have subscribed to.',
        'Localization: In accordance with the Digital Personal Data Protection Act 2023, all user data is stored on secure servers within the territory of India.',
        'Inter-Service Synergy: User preferences may be shared across different Company applications under this unified Master Agreement to improve the user experience.',
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
  contactTitle: 'Contact',
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
