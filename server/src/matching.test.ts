import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreMatch,
  findMatchesForNeed,
  findMatchesForResource,
} from '../../shared/matching.ts';
import { checkListingSafety } from '../../shared/safety.ts';
import type { Need, Resource } from '../../shared/types.ts';

const baseResource: Resource = {
  id: 'res-1',
  ownerId: 'u-factory',
  ownerName: 'LoomCraft Garments',
  ownerAccountType: 'business',
  ownerOrganization: 'LoomCraft Apparel Pvt Ltd',
  title: 'Leftover Cotton & Denim Fabric Bolts',
  description: 'Surplus 100% cotton and medium-weight denim offcuts from spring production.',
  category: 'Textiles & Fabric',
  materialTags: ['cotton', 'denim', 'fabric', 'offcuts'],
  quantity: 25,
  unit: 'meters',
  condition: 'Usable Offcuts',
  transferType: 'free',
  priceAmount: null,
  area: 'Peenya Industrial Area',
  pickupInstructions: 'Gate 3 loading bay, Mon-Sat 10am-5pm',
  availability: 'Weekdays 10 AM - 5 PM',
  lat: 13.0285,
  lng: 77.5197,
  disposalDate: '2026-12-10',
  urgency: 'this_week',
  safetyConfirmed: true,
  status: 'available',
  isSample: true,
  createdAt: '2026-11-20T10:00:00Z',
};

const matchingNeed: Need = {
  id: 'need-1',
  requesterId: 'u-student',
  requesterName: 'Ananya Rao',
  requesterAccountType: 'student',
  requesterOrganization: 'NIFT Bengaluru',
  title: 'Denim and Cotton Fabric for Senior Thesis Collection',
  description: 'Looking for cotton or denim fabric scraps for sustainable outerwear.',
  category: 'Textiles & Fabric',
  materialTags: ['denim', 'cotton', 'fabric'],
  quantity: 15,
  unit: 'meters',
  purpose: 'College fashion design thesis project',
  area: 'Malleswaram',
  lat: 13.0031,
  lng: 77.5643,
  deadline: '2026-12-20',
  preferredTransfer: 'free_only',
  maxBudget: null,
  status: 'open',
  isSample: true,
  createdAt: '2026-11-21T10:00:00Z',
};

const unrelatedNeed: Need = {
  ...matchingNeed,
  id: 'need-2',
  title: 'Used Physics Textbooks',
  description: 'Need university physics textbooks for semester 2.',
  category: 'Books & Stationery',
  materialTags: ['physics', 'textbooks'],
  quantity: 4,
  unit: 'books',
};

test('scoreMatch gives high score and transparent reasons for strong textile match', () => {
  const result = scoreMatch(baseResource, matchingNeed);
  assert.ok(result.score >= 80, `Expected score >= 80, got ${result.score}`);
  assert.equal(result.breakdown.categoryAndMaterial >= 35, true);
  assert.equal(result.breakdown.quantityFit, 20);
  assert.equal(result.breakdown.budgetFit, 10);
  assert.ok(result.reasons.some((r) => r.includes('Exact category match')));
  assert.ok(result.reasons.some((r) => r.includes('Covers 100%')));
});

test('findMatchesForNeed filters out unrelated categories and own listings', () => {
  const ownResource: Resource = { ...baseResource, id: 'res-own', ownerId: 'u-student' };
  const matches = findMatchesForNeed(matchingNeed, [baseResource, ownResource]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].resource.id, 'res-1');

  const noMatches = findMatchesForNeed(unrelatedNeed, [baseResource]);
  assert.equal(noMatches.length, 0);
});

test('findMatchesForResource ranks matching need above unrelated need', () => {
  const matches = findMatchesForResource(baseResource, [matchingNeed, unrelatedNeed]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].need.id, 'need-1');
});

test('safety screening blocks hazardous materials and medicines but allows safe electronics', () => {
  const medCheck = checkListingSafety('Unused Antibiotic Tablets', 'Leftover prescription medicine');
  assert.equal(medCheck.safe, false);
  assert.ok(medCheck.flaggedTerms.includes('medicine'));

  const chemCheck = checkListingSafety('Industrial Sulfuric Acid', 'Leftover drum');
  assert.equal(chemCheck.safe, false);

  const safeTabCheck = checkListingSafety('Wooden Drawing Tablet Stand', 'Unused pine stand');
  assert.equal(safeTabCheck.safe, true);
});
