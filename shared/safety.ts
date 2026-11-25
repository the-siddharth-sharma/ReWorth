export interface SafetyCheckResult {
  safe: boolean;
  flaggedTerms: string[];
  reason?: string;
}

const PROHIBITED_TERMS: { term: string; category: string }[] = [
  { term: 'medicine', category: 'Pharmaceuticals & Medicines' },
  { term: 'medication', category: 'Pharmaceuticals & Medicines' },
  { term: 'prescription', category: 'Pharmaceuticals & Medicines' },
  { term: 'tablet', category: 'Pharmaceuticals & Medicines' },
  { term: 'antibiotic', category: 'Pharmaceuticals & Medicines' },
  { term: 'syringe', category: 'Medical / Biohazard' },
  { term: 'medical waste', category: 'Medical / Biohazard' },
  { term: 'biohazard', category: 'Medical / Biohazard' },
  { term: 'hazardous', category: 'Hazardous Material' },
  { term: 'asbestos', category: 'Hazardous Material' },
  { term: 'mercury', category: 'Hazardous Material' },
  { term: 'lead paint', category: 'Hazardous Material' },
  { term: 'pesticide', category: 'Toxic Chemicals' },
  { term: 'insecticide', category: 'Toxic Chemicals' },
  { term: 'hydrochloric', category: 'Corrosive Chemicals' },
  { term: 'sulfuric acid', category: 'Corrosive Chemicals' },
  { term: 'solvent', category: 'Flammable / Toxic Chemicals' },
  { term: 'thinner', category: 'Flammable / Toxic Chemicals' },
  { term: 'flammable', category: 'Flammable Material' },
  { term: 'gasoline', category: 'Flammable Material' },
  { term: 'kerosene', category: 'Flammable Material' },
  { term: 'explosive', category: 'Explosives / Weapons' },
  { term: 'firearm', category: 'Explosives / Weapons' },
  { term: 'ammunition', category: 'Explosives / Weapons' },
  { term: 'leaking battery', category: 'Damaged Battery Hazard' },
  { term: 'swollen lithium', category: 'Damaged Battery Hazard' },
  { term: 'expired food', category: 'Perishable / Unsafe Consumable' },
];

// Exceptions so legitimate electronics ("tablet stand", "drawing tablet") aren't false-positived unless paired with medicine context.
const SAFE_CONTEXT_OVERRIDES: Record<string, RegExp[]> = {
  tablet: [/drawing tablet/i, /tablet stand/i, /tablet case/i, /graphics tablet/i],
};

export function checkListingSafety(
  title: string,
  description: string,
  tags: string[] = []
): SafetyCheckResult {
  const combined = `${title} ${description} ${tags.join(' ')}`.toLowerCase();
  const flaggedTerms: string[] = [];
  const reasons = new Set<string>();

  for (const rule of PROHIBITED_TERMS) {
    const regex = new RegExp(`\\b${rule.term.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (regex.test(combined)) {
      const overrides = SAFE_CONTEXT_OVERRIDES[rule.term];
      if (overrides && overrides.some((ov) => ov.test(combined))) {
        continue;
      }
      flaggedTerms.push(rule.term);
      reasons.add(rule.category);
    }
  }

  if (flaggedTerms.length > 0) {
    return {
      safe: false,
      flaggedTerms,
      reason: `Blocked by ReWorth Safety Policy (${Array.from(reasons).join(', ')}). Hazardous materials, medicines, toxic chemicals, and unsafe goods are not permitted.`,
    };
  }

  return { safe: true, flaggedTerms: [] };
}
