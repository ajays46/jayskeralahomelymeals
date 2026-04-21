/**
 * Order inventory units and suggest an abbreviation from item name + catalog {@link inventory_units.unit_type}.
 */

/** @param {string} t */
export function normalizeCatalogUnitType(t) {
  const u = String(t ?? '')
    .trim()
    .toUpperCase();
  if (!u) return '';
  if (u.includes('WEIGHT') || u === 'MASS') return 'WEIGHT';
  if (u.includes('VOL') || u === 'LIQUID') return 'VOLUME';
  if (u.includes('COUNT') || u.includes('PIECE') || u === 'UNIT' || u === 'NUMBER') return 'COUNT';
  if (u.includes('LENGTH') || u.includes('DISTANCE')) return 'LENGTH';
  if (u.includes('AREA')) return 'AREA';
  return u;
}

/** Typical bulk sacks / wholesale — kg before g. */
const WEIGHT_ABBR_RANK_BULK = ['kg', 'kilogram', 'g', 'gram', 'grams', 'gm', 'mg', 'lb', 'lbs', 'oz', 'ton', 'quintal', 'qtl'];

/** Retail packs (kadala, spice powders…) — grams before kg. */
const WEIGHT_ABBR_RANK_GRAM_FIRST = ['g', 'gram', 'grams', 'gm', 'mg', 'kg', 'kilogram', 'lb', 'lbs', 'oz', 'ton', 'quintal', 'qtl'];

/** Stronger overlap → prefer kg-ish ordering (rice, sacks, loose veg bulk). English + existing transliterations. */
const WEIGHT_KG_FIRST_HINTS = [
  'brown rice',
  'basmati',
  'matta rice',
  'red rice',
  'rice flour',
  'rice',
  'arisi',
  'pachari',
  'kuruva',
  'atta',
  'maida',
  'wheat flour',
  'whole wheat flour',
  'whole wheat',
  'all purpose flour',
  'grain',
  'sugar',
  'salt',
  'potato',
  'tomato',
  'onion',
  'vegetables',
  'vegetable',
  'semolina',
  'sooji',
  'rava',
  'corn',
  'besan',
  'chickpea flour',
  'vermicelli',
  'javvarisi',
  'sago',
  'jaggery',
  'oats',
  'rolled oats',
  'bulgur',
  'quinoa',
  'bulk',
  'wholesale',
  'sack',
  '25kg',
  '50kg',
  '10kg'
];

/** Stronger overlap → prefer g-ish ordering (small pulses, powders, retail packs). English + Malayalam/Manglish. */
const WEIGHT_GRAM_FIRST_HINTS = [
  'kadala parippu',
  'kadala',
  'cherupayar',
  'green gram',
  'split chickpeas',
  'split peas',
  'bengal gram',
  'black chickpea',
  'whole moong',
  'whole urad',
  'urad dal',
  'moong dal',
  'toor dal',
  'tur dal',
  'chana dal',
  'yellow split',
  'red lentil',
  'masoor',
  'masoor dal',
  'malli podi',
  'molaga podi',
  'molagu podi',
  'mulaku podi',
  'coriander powder',
  'cumin powder',
  'garlic powder',
  'ginger powder',
  'onion powder',
  'garam masala',
  'spice blend',
  'spice mix',
  'curry powder',
  'sambar powder',
  'rasam powder',
  'chilli powder',
  'turmeric powder',
  'red chili powder',
  'cayenne',
  'pepper powder',
  'coffee powder',
  'tea powder',
  'baking powder',
  'baking soda',
  'dry yeast',
  'instant yeast',
  'corn starch',
  'cornflour',
  'custard powder',
  'icing sugar',
  'caster sugar',
  'hing',
  'asafoetida',
  'nuts',
  'mixed nuts',
  'trail mix',
  'cashew',
  'almond',
  'walnut',
  'pistachio',
  'papad',
  'murku',
  'tea leaf',
  'coffee bean',
  'seasoning',
  'sprinkles'
];

/**
 * Score name against keyword hints (same weighting idea as NAME_RULES: longer phrases count more).
 * @param {string} nameNormalized lowercased trimmed name
 * @param {string[]} hints
 */
function hintHitScore(nameNormalized, hints) {
  const name = String(nameNormalized ?? '').trim().toLowerCase();
  let score = 0;
  for (const kw of hints) {
    if (!kw) continue;
    const k = kw.toLowerCase();
    if (name.includes(k)) score += k.length >= 5 ? 2 : 1;
  }
  return score;
}

/**
 * Bulk staples (rice sacks) vs retail grams (kadala, powders). Tie → bulk (safer default).
 * @param {string} rawName
 */
export function prefersGramWeightUnitForName(rawName) {
  const name = String(rawName ?? '').trim().toLowerCase();
  /** Mixed names usually mean staple rice sacks (kg), not small retail grams. */
  if (name.includes('kadala') && name.includes('rice')) return false;
  const g = hintHitScore(name, WEIGHT_GRAM_FIRST_HINTS);
  const k = hintHitScore(name, WEIGHT_KG_FIRST_HINTS);
  return g > k;
}

/** @returns {typeof WEIGHT_ABBR_RANK_BULK} */
function weightAbbrevRankOrderForName(rawName) {
  return prefersGramWeightUnitForName(rawName) ? WEIGHT_ABBR_RANK_GRAM_FIRST : WEIGHT_ABBR_RANK_BULK;
}

const VOLUME_ABBR_RANK = ['l', 'ltr', 'liter', 'litre', 'lit', 'ml', 'cl', 'gal'];
const COUNT_ABBR_RANK = ['pcs', 'pc', 'piece', 'pieces', 'nos', 'no', 'unit', 'units', 'dozen', 'dz', 'box', 'pkt', 'packet', 'bundle', 'crate'];

/**
 * @param {string} abbreviation
 * @param {'WEIGHT'|'VOLUME'|'COUNT'|string} family
 * @param {string} [itemNameNormalized] improves WEIGHT ordering (rice → kg default, kadala → g default)
 */
function abbreviationPreferenceRank(abbreviation, family, itemNameNormalized = '') {
  const a = String(abbreviation ?? '')
    .trim()
    .toLowerCase();
  if (!a) return 999;
  let order = [];
  if (family === 'WEIGHT') {
    order = weightAbbrevRankOrderForName(itemNameNormalized);
  } else if (family === 'VOLUME') {
    order = VOLUME_ABBR_RANK;
  } else if (family === 'COUNT') {
    order = COUNT_ABBR_RANK;
  }
  if (!order.length) return 999;
  let best = 999;
  for (let i = 0; i < order.length; i++) {
    const token = order[i];
    if (a === token || a.startsWith(`${token}.`) || (token.length >= 2 && a.includes(token))) {
      best = Math.min(best, i);
    }
  }
  return best;
}

/**
 * Keyword buckets for rough “real world” intent. Includes common Manglish / romanized Malayalam
 * spellings used on shop labels (Kerala-style). Longer phrases are scored higher in inference.
 */
const NAME_RULES = [
  {
    unitType: 'WEIGHT',
    keywords: [
      /* English — dry groceries & staples */
      'grocery',
      'groceries',
      'staple',
      'staples',
      'vegetable',
      'vegetables',
      'produce',
      'greens',
      'rice',
      'basmati',
      'atta',
      'flour',
      'wheat',
      'maida',
      'besan',
      'ragi',
      'semolina',
      'sooji',
      'rava',
      'dal',
      'daal',
      'lentil',
      'pulse',
      'parippu',
      'beans',
      'bean',
      'payar',
      'chana',
      'kadala',
      'kadala parippu',
      'cherupayar',
      'moong',
      'toor',
      'tur',
      'urad',
      'rajma',
      'sugar',
      'salt',
      'grain',
      'corn',
      'rice flour',
      'vermicelli',
      'sev',
      'poha',
      'aval',
      'murku',
      'papad',
      'cashew',
      'almond',
      'nuts',
      'dry fruit',
      'coffee',
      'tea',
      'powder',
      'podi',
      'malli podi',
      'molaga podi',
      'molagu podi',
      'mulaku podi',
      'coriander powder',
      'chilli powder',
      'masala',
      'spice',
      'hing',
      'turmeric',
      'mulaku',
      'mulagu',
      'chilli',
      'pepper',
      'cumin',
      'mustard seed',
      'fenugreek',
      'uluva',
      'coriander seed',
      'kothambari',
      /* Loose veg — usually kg/g at scale */
      'potato',
      'tomato',
      'onion',
      'ulli',
      'shallot',
      'carrot',
      'beetroot',
      'beet',
      'radish',
      'turnip',
      'yam',
      'chena',
      'tapioca',
      'cassava',
      'kappa',
      'spinach',
      'cheera',
      'methi',
      'fenugreek leaf',
      'ladies finger',
      'vendakka',
      'okra',
      'avarakkai',
      'bitter gourd',
      'pavakka',
      'snake gourd',
      'padavalam',
      'ridge gourd',
      'peerkangai',
      'ash gourd',
      'mathan',
      'pumpkin',
      'meat',
      'fish',
      'prawn',
      'chicken',
      'paneer',
      'cheese',
      'butter',
      /* Malayalam / Manglish — rice & grain */
      'arisi',
      'ari',
      'pachari',
      'matta',
      'chemba',
      'rosematta',
      'kuruva',
      'javvarisi',
      'sago'
    ]
  },
  {
    unitType: 'VOLUME',
    keywords: [
      /* Prefer volume when liquid / pourable */
      'oil',
      'enna',
      'velichenna',
      'coconut oil',
      'sunflower oil',
      'vegetable oil',
      'olive oil',
      'fruit juice',
      'orange juice',
      'ghee',
      'nei',
      'milk',
      'paal',
      'cream',
      'curd',
      'thairu',
      'thair',
      'yogurt',
      'yoghurt',
      'buttermilk',
      'moru',
      'lassi',
      'juice',
      'syrup',
      'vinegar',
      'sauce',
      'water',
      'liquor',
      'wine',
      'honey',
      'shampoo',
      'soap',
      'cleaner',
      'detergent',
      /* Dairy department — liquids */
      'dairy drink',
      'toned milk',
      'full cream'
    ]
  },
  {
    unitType: 'COUNT',
    keywords: [
      /* Discrete / each */
      'egg',
      'mutta',
      'bread',
      'bun',
      'buns',
      'loaf',
      'banana',
      'pazham',
      'plantain',
      'nendran',
      'orange',
      'apple',
      'lime',
      'lemon',
      'coconut',
      'thenga',
      'pineapple',
      'mango',
      'maanga',
      'papaya',
      'guava',
      'perakka',
      'pear',
      'plum',
      'grapes',
      'strawberry',
      'watermelon',
      'dragon fruit',
      'custard apple',
      'sapota',
      'chikoo',
      'packet',
      'bottle',
      'can',
      'tin',
      'jar',
      /* Whole heads — often “each” at retail */
      'lettuce head',
      'cabbage',
      'muttakose',
      'cauliflower',
      'broccoli'
    ]
  }
];

/**
 * @param {string} rawName
 * @returns {string | null}
 */
export function inferPrimaryUnitTypeFromItemName(rawName) {
  const name = String(rawName ?? '')
    .trim()
    .toLowerCase();
  if (name.length < 2) return null;

  let best = null;
  let bestHits = 0;

  for (const rule of NAME_RULES) {
    let hits = 0;
    for (const kw of rule.keywords) {
      if (!kw) continue;
      const k = kw.toLowerCase();
      if (name.includes(k)) hits += k.length >= 5 ? 2 : 1;
    }
    if (hits > bestHits) {
      bestHits = hits;
      best = rule.unitType;
    }
  }

  return bestHits > 0 ? best : null;
}

/**
 * @typedef {{ id: string, abbreviation: string, name: string, unit_type: string }} InventoryUnitRow
 */

/**
 * @param {string} rawName
 * @param {InventoryUnitRow[]} catalogUnits
 */
export function rankInventoryUnitsForItemName(rawName, catalogUnits) {
  const list = Array.isArray(catalogUnits) ? catalogUnits : [];
  const primary = inferPrimaryUnitTypeFromItemName(rawName);
  const nameNorm = String(rawName ?? '').trim();

  const scored = list.map((u, index) => {
    const t = normalizeCatalogUnitType(u.unit_type);
    const tier = primary ? (t === primary ? 0 : 1) : 0;
    const pref =
      primary && t === primary ? abbreviationPreferenceRank(u.abbreviation, primary, nameNorm) : 999;
    const nameSort = String(u.name || u.abbreviation).toLowerCase();
    return { u, index, tier, pref, nameSort };
  });

  scored.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (primary && a.tier === 0 && b.tier === 0 && a.pref !== b.pref) return a.pref - b.pref;
    if (a.nameSort !== b.nameSort) return a.nameSort.localeCompare(b.nameSort);
    return a.index - b.index;
  });

  const orderedUnits = scored.map((s) => s.u);

  let suggestedAbbrev = '';
  if (primary) {
    const pick = orderedUnits.find((u) => normalizeCatalogUnitType(u.unit_type) === primary);
    if (pick) suggestedAbbrev = pick.abbreviation.trim();
  }
  if (!suggestedAbbrev && orderedUnits.length > 0) {
    /** When DB rows omit `unit_type`, pick a sensible abbreviation by convention. */
    const abbrMatch = (pred) => list.find((u) => pred(String(u.abbreviation ?? '').trim()));
    if (primary === 'COUNT') {
      const hit =
        abbrMatch((a) => /^pcs?$/i.test(a)) ||
        abbrMatch((a) => /^nos?$/i.test(a)) ||
        abbrMatch((a) => /^(pc|piece|unit)s?$/i.test(a));
      if (hit) suggestedAbbrev = hit.abbreviation.trim();
    } else if (primary === 'VOLUME') {
      const hit =
        abbrMatch((a) => /^(l|ltr|litre|liter|lit)$/i.test(a)) || abbrMatch((a) => /^ml$/i.test(a));
      if (hit) suggestedAbbrev = hit.abbreviation.trim();
    } else if (primary === 'WEIGHT') {
      const hit =
        abbrMatch((a) => /^kg$/i.test(a)) ||
        abbrMatch((a) => /^g$/i.test(a)) ||
        abbrMatch((a) => /^(gram|grams)$/i.test(a));
      if (hit) suggestedAbbrev = hit.abbreviation.trim();
    }
  }
  if (!suggestedAbbrev && orderedUnits.length > 0) {
    const pcs = orderedUnits.find((u) => /^pcs?$/i.test(String(u.abbreviation).trim()));
    suggestedAbbrev = pcs ? pcs.abbreviation.trim() : orderedUnits[0].abbreviation.trim();
  }

  const suggestedGroup =
    primary && orderedUnits.some((u) => normalizeCatalogUnitType(u.unit_type) === primary)
      ? orderedUnits.filter((u) => normalizeCatalogUnitType(u.unit_type) === primary)
      : orderedUnits;

  const suggestedIds = new Set(suggestedGroup.map((u) => `${u.id}\0${u.abbreviation}`));
  const otherGroup =
    primary && suggestedGroup.length > 0 && suggestedGroup.length < orderedUnits.length
      ? orderedUnits.filter((u) => !suggestedIds.has(`${u.id}\0${u.abbreviation}`))
      : [];

  return {
    orderedUnits,
    suggestedAbbrev,
    primaryUnitType: primary,
    suggestedGroup,
    otherGroup
  };
}

/**
 * @param {string | null} primaryUnitType
 * @param {string} [itemNameForWeightHint] improves weight hint when grams-vs-kg heuristic applies
 */
export function unitInferenceHint(primaryUnitType, itemNameForWeightHint = '') {
  if (!primaryUnitType) return '';
  const label =
    primaryUnitType === 'WEIGHT'
      ? 'weight'
      : primaryUnitType === 'VOLUME'
        ? 'volume'
        : primaryUnitType === 'COUNT'
          ? 'count'
          : primaryUnitType.toLowerCase();
  let base = `Likely ${label} units listed first — pick another if needed.`;
  if (
    primaryUnitType === 'WEIGHT' &&
    itemNameForWeightHint &&
    prefersGramWeightUnitForName(itemNameForWeightHint)
  ) {
    base +=
      ' Grams first for typical retail packs (e.g. split pulses, spice powders); choose kg for sacks / bulk.';
  }
  return base;
}
