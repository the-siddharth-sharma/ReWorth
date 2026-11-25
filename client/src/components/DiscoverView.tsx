import React, { useMemo, useState } from 'react';
import { Search, Sparkles, MapPin, PlusCircle, Info } from 'lucide-react';
import { CATEGORY_NAMES } from '../../../shared/constants.ts';
import { haversineDistanceKm } from '../../../shared/matching.ts';
import type { MatchResult, Need, Resource, User } from '../../../shared/types.ts';
import { ResourceCard } from './ResourceCard.tsx';
import { NeedCard } from './NeedCard.tsx';
import type { NavTab } from './Navbar.tsx';

interface DiscoverViewProps {
  resources: Resource[];
  needs: Need[];
  matches: MatchResult[];
  currentUser: User | null;
  onSelectResource: (id: string) => void;
  onSelectNeed: (id: string) => void;
  onNavigate: (tab: NavTab) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  resources,
  needs,
  matches,
  currentUser,
  onSelectResource,
  onSelectNeed,
  onNavigate,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [transferFilter, setTransferFilter] = useState<string>('all');

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (transferFilter !== 'all' && r.transferType !== transferFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.area.toLowerCase().includes(q) ||
          r.materialTags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [resources, categoryFilter, transferFilter, search]);

  const nearbyResources = useMemo(() => {
    if (!currentUser) return resources.slice(0, 3);
    return [...resources]
      .sort(
        (a, b) =>
          haversineDistanceKm(currentUser.lat, currentUser.lng, a.lat, a.lng) -
          haversineDistanceKm(currentUser.lat, currentUser.lng, b.lat, b.lng)
      )
      .slice(0, 3);
  }, [resources, currentUser]);

  const topMatches = matches.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Purposeful Context Header (Clean, not bloated landing page) */}
      <section className="bg-white rounded-2xl border border-[#E4DFD7] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F3EC] text-[#1B4332] text-xs font-semibold">
              Need-Based Circular Resource Exchange
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] tracking-tight">
              One person&apos;s waste. Another person&apos;s opportunity.
            </h1>
            <p className="text-sm text-[#5C6460]">
              ReWorth matches surplus industrial offcuts, packaging, components, and study materials
              directly with verified community needs using transparent rule-based scoring.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('post-resource')}
              className="px-4 py-2.5 rounded-xl bg-[#1B4332] text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-[#143326] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Offer Surplus Resource
            </button>
            <button
              type="button"
              onClick={() => onNavigate('post-need')}
              className="px-4 py-2.5 rounded-xl border border-[#1B4332] text-[#1B4332] text-sm font-semibold flex items-center gap-1.5 hover:bg-[#E8F3EC] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Post Material Need
            </button>
          </div>
        </div>

        {/* Sample Data Honesty Banner */}
        <div className="mt-4 pt-3.5 border-t border-[#E4DFD7] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C6460]">
          <span className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#9C6B43] shrink-0" />
            Listings badged <strong className="text-[#9C6B43]">Sample Data</strong> demonstrate the 5
            core circular reuse scenarios. Any resource or need you post is saved live in SQLite.
          </span>
          <button
            type="button"
            onClick={() => onNavigate('matches')}
            className="text-[#1B4332] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Explore {matches.length} Rule-Based Matches →
          </button>
        </div>
      </section>

      {/* Recommended Matches Strip */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-[#1D2420] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2D6A4F]" />
              Recommended Resource-to-Need Matches
            </h2>
            <p className="text-xs text-[#5C6460]">
              Explained by category, material keywords, quantity coverage, distance, and urgency.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('matches')}
            className="text-xs font-semibold text-[#1B4332] hover:underline cursor-pointer"
          >
            View All Matches ({matches.length})
          </button>
        </div>

        {topMatches.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E4DFD7] p-6 text-sm text-[#5C6460]">
            No matches above threshold yet. Post a new resource or need to see live matching!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {topMatches.map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectResource(m.resource.id)}
                className="bg-white rounded-2xl border border-[#E4DFD7] p-4 hover:border-[#1B4332] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono-num px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F3EC] text-[#1B4332]">
                      {m.score}% Match
                    </span>
                    <span className="text-[11px] text-[#5C6460]">{m.distanceKm} km apart</span>
                  </div>
                  <div className="text-xs font-semibold text-[#2D6A4F] truncate">
                    Supply: {m.resource.title}
                  </div>
                  <div className="text-xs font-semibold text-[#9C6B43] truncate mb-2">
                    Need: {m.need.title}
                  </div>
                  <ul className="space-y-1 text-[11px] text-[#5C6460]">
                    {m.reasons.slice(0, 2).map((reason, idx) => (
                      <li key={idx} className="truncate">
                        ✓ {reason}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#E4DFD7] text-xs font-semibold text-[#1B4332]">
                  Inspect &amp; Coordinate →
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Nearby Opportunities */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#1D2420] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#2D6A4F]" />
            Nearby Opportunities {currentUser ? `near ${currentUser.area}` : ''}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nearbyResources.map((r) => (
            <ResourceCard
              key={`nearby-${r.id}`}
              resource={r}
              currentUser={currentUser}
              onSelect={onSelectResource}
            />
          ))}
        </div>
      </section>

      {/* Search & Filter Available Resources */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1D2420]">
              Available Resources ({filteredResources.length})
            </h2>
            <p className="text-xs text-[#5C6460]">
              Usable surplus materials — verify condition &amp; safety before pickup.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[#5C6460] absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fabric, boxes, wood..."
                className="pl-9 pr-3 py-2 rounded-xl border border-[#E4DFD7] bg-white text-xs w-56 focus:outline-none focus:border-[#1B4332]"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E4DFD7] bg-white text-xs focus:outline-none focus:border-[#1B4332]"
            >
              <option value="all">All Categories</option>
              {CATEGORY_NAMES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={transferFilter}
              onChange={(e) => setTransferFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E4DFD7] bg-white text-xs focus:outline-none focus:border-[#1B4332]"
            >
              <option value="all">Any Transfer Type</option>
              <option value="free">Free Pickup</option>
              <option value="exchange">Exchange / Barter</option>
              <option value="low_cost">Low-Cost Transfer</option>
            </select>
          </div>
        </div>

        {filteredResources.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E4DFD7] p-8 text-center text-sm text-[#5C6460]">
            No available resources match your current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                currentUser={currentUser}
                onSelect={onSelectResource}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent Needs */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-[#1D2420]">
              Recent Community Needs ({needs.length})
            </h2>
            <p className="text-xs text-[#5C6460]">
              Students, workshops, and small businesses actively looking for reusable materials.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('post-need')}
            className="text-xs font-semibold text-[#1B4332] hover:underline cursor-pointer"
          >
            + Post a Need
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {needs.map((n) => (
            <NeedCard key={n.id} need={n} onSelect={onSelectNeed} />
          ))}
        </div>
      </section>
    </div>
  );
};
