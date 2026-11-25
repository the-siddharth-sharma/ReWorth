import type {
  AccountType,
  ResourceCategory,
  ResourceCondition,
  TransferType,
  UrgencyLevel,
} from './types.ts';

export interface CategoryMeta {
  name: ResourceCategory;
  defaultUnits: string[];
  estimatedKgPerUnit: Record<string, number>;
  examples: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    name: 'Textiles & Fabric',
    defaultUnits: ['meters', 'kg', 'pieces'],
    estimatedKgPerUnit: { meters: 0.35, kg: 1.0, pieces: 0.4 },
    examples: 'Cotton bolts, denim offcuts, linen swatches, yarn cones',
  },
  {
    name: 'Packaging & Cardboard',
    defaultUnits: ['boxes', 'kg', 'sheets'],
    estimatedKgPerUnit: { boxes: 0.45, kg: 1.0, sheets: 0.3 },
    examples: 'Corrugated cartons, kraft paper rolls, bubble wrap, mailers',
  },
  {
    name: 'Electronics & Components',
    defaultUnits: ['pieces', 'kits', 'kg'],
    estimatedKgPerUnit: { pieces: 0.12, kits: 0.6, kg: 1.0 },
    examples: 'Microcontrollers, sensors, breadboards, jumper wires, LEDs',
  },
  {
    name: 'Books & Stationery',
    defaultUnits: ['books', 'pieces', 'bundles'],
    estimatedKgPerUnit: { books: 0.65, pieces: 0.3, bundles: 2.5 },
    examples: 'Engineering textbooks, drafting pads, reference manuals',
  },
  {
    name: 'Wood & Carpentry',
    defaultUnits: ['pieces', 'kg', 'planks'],
    estimatedKgPerUnit: { pieces: 1.4, kg: 1.0, planks: 2.8 },
    examples: 'Teak offcuts, plywood sheets, pine battens, dowel rods',
  },
  {
    name: 'Metals & Hardware',
    defaultUnits: ['pieces', 'kg', 'meters'],
    estimatedKgPerUnit: { pieces: 0.5, kg: 1.0, meters: 1.2 },
    examples: 'Aluminum channels, hinges, screws, sheet metal offcuts',
  },
  {
    name: 'Glass & Containers',
    defaultUnits: ['jars', 'pieces', 'kg'],
    estimatedKgPerUnit: { jars: 0.35, pieces: 0.35, kg: 1.0 },
    examples: 'Clean food-grade glass jars, mason jars, storage tubs',
  },
  {
    name: 'Art & Craft Supplies',
    defaultUnits: ['pieces', 'sheets', 'kg'],
    estimatedKgPerUnit: { pieces: 0.2, sheets: 0.15, kg: 1.0 },
    examples: 'Acrylic offcuts, canvas rolls, framing mats, clay',
  },
];

export const CATEGORY_NAMES: ResourceCategory[] = CATEGORIES.map((c) => c.name);

export const CONDITIONS: { value: ResourceCondition; description: string }[] = [
  { value: 'Like New', description: 'Unused surplus or unopened stock' },
  { value: 'Good - Minor Wear', description: 'Previously used, fully functional & clean' },
  { value: 'Usable Offcuts', description: 'Workshop scraps, irregular sizes, clean' },
  { value: 'Needs Cleaning/Repair', description: 'Structurally sound; requires minor prep' },
];

export const TRANSFER_TYPES: { value: TransferType; label: string; description: string }[] = [
  { value: 'free', label: 'Free Pickup', description: 'Zero cost to avoid disposal' },
  { value: 'exchange', label: 'Exchange / Barter', description: 'Swap for materials or skills' },
  { value: 'low_cost', label: 'Low-Cost Transfer', description: 'Nominal recovery fee' },
];

export const URGENCY_OPTIONS: { value: UrgencyLevel; label: string }[] = [
  { value: 'urgent', label: 'Urgent (Within 3 days)' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'flexible', label: 'Flexible' },
];

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'student', label: 'Student' },
  { value: 'business', label: 'Business / Workshop' },
  { value: 'ngo', label: 'NGO / Organization' },
];

export interface AreaHub {
  name: string;
  lat: number;
  lng: number;
}

export const AREA_HUBS: AreaHub[] = [
  { name: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { name: 'Peenya Industrial Area', lat: 13.0285, lng: 77.5197 },
  { name: 'Jayanagar', lat: 12.9299, lng: 77.5824 },
  { name: 'HSR Layout', lat: 12.9121, lng: 77.6446 },
  { name: 'Malleswaram', lat: 13.0031, lng: 77.5643 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.75 },
  { name: 'Electronic City', lat: 12.8452, lng: 77.6602 },
];

export function resolveAreaCoordinates(areaName: string): { lat: number; lng: number } {
  const normalized = areaName.trim().toLowerCase();
  const match = AREA_HUBS.find((hub) => hub.name.toLowerCase() === normalized);
  if (match) return { lat: match.lat, lng: match.lng };
  const partial = AREA_HUBS.find((hub) => normalized.includes(hub.name.toLowerCase()));
  if (partial) return { lat: partial.lat, lng: partial.lng };
  return { lat: 12.9716, lng: 77.5946 }; // City center fallback
}

export function estimateDivertedKg(
  category: ResourceCategory,
  quantity: number,
  unit: string
): number {
  const meta = CATEGORIES.find((c) => c.name === category);
  if (!meta) return Number((quantity * 0.5).toFixed(2));
  const normalizedUnit = unit.trim().toLowerCase();
  const factor = meta.estimatedKgPerUnit[normalizedUnit] ?? 0.5;
  return Number((quantity * factor).toFixed(2));
}
