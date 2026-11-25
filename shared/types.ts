export type AccountType = 'individual' | 'student' | 'business' | 'ngo';
export type UserRole = 'member' | 'admin';

export type ResourceCategory =
  | 'Textiles & Fabric'
  | 'Packaging & Cardboard'
  | 'Electronics & Components'
  | 'Books & Stationery'
  | 'Wood & Carpentry'
  | 'Metals & Hardware'
  | 'Glass & Containers'
  | 'Art & Craft Supplies';

export type ResourceCondition =
  | 'Like New'
  | 'Good - Minor Wear'
  | 'Usable Offcuts'
  | 'Needs Cleaning/Repair';

export type TransferType = 'free' | 'exchange' | 'low_cost';
export type UrgencyLevel = 'urgent' | 'this_week' | 'this_month' | 'flexible';
export type ListingStatus = 'available' | 'reserved' | 'completed' | 'removed';
export type NeedStatus = 'open' | 'fulfilled' | 'removed';
export type ExchangeStatus = 'pending' | 'countered' | 'accepted' | 'completed' | 'rejected' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  accountType: AccountType;
  role: UserRole;
  organization?: string;
  area: string;
  lat: number;
  lng: number;
  interests: ResourceCategory[];
  bio?: string;
  isDemo: boolean;
  createdAt: string;
}

export interface Resource {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAccountType: AccountType;
  ownerOrganization?: string;
  title: string;
  description: string;
  category: ResourceCategory;
  materialTags: string[];
  quantity: number;
  unit: string;
  condition: ResourceCondition;
  transferType: TransferType;
  priceAmount: number | null;
  exchangeNote?: string;
  area: string;
  pickupInstructions: string;
  availability: string;
  lat: number;
  lng: number;
  disposalDate: string;
  urgency: UrgencyLevel;
  imageUrl?: string;
  safetyConfirmed: boolean;
  status: ListingStatus;
  isSample: boolean;
  createdAt: string;
}

export interface Need {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAccountType: AccountType;
  requesterOrganization?: string;
  title: string;
  description: string;
  category: ResourceCategory;
  materialTags: string[];
  quantity: number;
  unit: string;
  purpose: string;
  area: string;
  lat: number;
  lng: number;
  deadline: string;
  preferredTransfer: 'free_only' | 'free_or_exchange' | 'low_cost_ok';
  maxBudget: number | null;
  status: NeedStatus;
  isSample: boolean;
  createdAt: string;
}

export interface MatchBreakdown {
  categoryAndMaterial: number; // max 40
  quantityFit: number; // max 20
  proximity: number; // max 20
  timeline: number; // max 10
  budgetFit: number; // max 10
}

export interface MatchResult {
  id: string;
  resource: Resource;
  need: Need;
  score: number;
  breakdown: MatchBreakdown;
  reasons: string[];
  warnings: string[];
  distanceKm: number;
}

export interface ExchangeMessage {
  id: string;
  exchangeId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface Exchange {
  id: string;
  resourceId: string;
  needId: string | null;
  resourceTitle: string;
  resourceCategory: ResourceCategory;
  resourceImageUrl?: string;
  resourceArea: string;
  pickupInstructions: string;
  ownerId: string;
  ownerName: string;
  requesterId: string;
  requesterName: string;
  requestedQuantity: number;
  unit: string;
  offeredResourceId?: string | null;
  offeredResourceTitle?: string;
  offeredResourceCategory?: ResourceCategory;
  offeredResourceImageUrl?: string;
  offeredResourceArea?: string;
  offeredQuantity?: number | null;
  offeredUnit?: string;
  cashTopUpAmount?: number | null;
  lastCounterBy?: string | null;
  ownerConfirmed: boolean;
  requesterConfirmed: boolean;
  handoverOtp?: string | null;
  status: ExchangeStatus;
  initialNote: string;
  ownerNote?: string;
  estimatedKg: number;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
  messages?: ExchangeMessage[];
}

export interface Report {
  id: string;
  targetType: 'resource' | 'need';
  targetId: string;
  targetTitle: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details: string;
  status: 'open' | 'dismissed' | 'removed';
  moderatorNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ImpactCategoryStat {
  category: ResourceCategory;
  completedExchanges: number;
  actualUnitsReused: number;
  estimatedKgDiverted: number;
  activeListings: number;
}

export interface ImpactStats {
  totalCompletedExchanges: number;
  sampleCompletedExchanges: number;
  liveCompletedExchanges: number;
  totalResourcesReused: number;
  totalEstimatedKgDiverted: number;
  liveEstimatedKgDiverted: number;
  activeAvailableResources: number;
  openNeedsCount: number;
  categoryBreakdown: ImpactCategoryStat[];
  methodologyNote: string;
}
