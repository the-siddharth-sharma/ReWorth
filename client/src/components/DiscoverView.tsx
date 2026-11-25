import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
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
  const [searchInput, setSearchInput] = useState('');
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
  const liveBoardRows = resources.slice(0, 5);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className="space-y-10">
      {/* Swiss-Editorial Hero + Obsidian Live Board */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Hero Left */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E2E6EE] rounded-[2px] p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 mb-6 border-b border-[#E2E6EE]">
              <span className="font-mono-num text-[11px] font-semibold uppercase tracking-widest text-[#0052FF]">
                NEED-BASED CIRCULAR EXCHANGE
              </span>
              <span className="font-mono-num text-[11px] uppercase tracking-wider text-[#8A94A6]">
                INDEX // B2B &amp; CAMPUS
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight leading-[1.02] text-[#0B0F19]">
              ONE PERSON&apos;S <span className="text-[#0052FF]">WASTE.</span> ANOTHER&apos;S{' '}
              <span className="text-[#0052FF]">OPPORTUNITY.</span>{' '}
              <span className="font-editorial font-normal lowercase text-2xl sm:text-4xl text-[#0052FF] tracking-normal">
                (yes, zero-cash barter)
              </span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-[#5A6475] max-w-xl leading-relaxed">
              ReWorth matches surplus industrial offcuts, packaging, electronics, and academic
              materials directly against open community needs using transparent rule-based scoring.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-[#E2E6EE] space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('post-resource')}
                className="px-5 py-3 rounded-[2px] bg-[#0052FF] hover:bg-[#0040CC] text-white font-mono-num text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                Offer Surplus Resource
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('post-need')}
                className="px-5 py-3 rounded-[2px] bg-[#FFFFFF] border border-[#0B0F19] text-[#0B0F19] hover:bg-[#F5F6F8] font-mono-num text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                Post Material Need
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5A6475]">
              <span>
                Items badged{' '}
                <span className="font-mono-num text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#F5F6F8] text-[#5A6475] border border-[#E2E6EE]">
                  SAMPLE DATA
                </span>{' '}
                demonstrate core reuse scenarios. Live posts persist in SQLite.
              </span>
              <button
                type="button"
                onClick={() => onNavigate('matches')}
                className="font-mono-num text-[11px] font-semibold uppercase tracking-wider text-[#0052FF] hover:underline cursor-pointer"
              >
                VIEW {matches.length} RULE MATCHES ↗
              </button>
            </div>
          </div>
        </div>

        {/* Obsidian Dark Live Board Right */}
        <div className="lg:col-span-5 bg-[#060B18] text-[#F8FAFC] border border-[#1D2740] rounded-[2px] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1D2740]">
              <div className="font-mono-num text-[11px] font-semibold uppercase tracking-widest text-[#F8FAFC] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                LIVE BOARD — ACTIVE SURPLUS &amp; TRADES
              </div>
              <span className="font-mono-num text-[10px] text-[#8A94A6]">REALTIME</span>
            </div>

            <div className="divide-y divide-[#1D2740]">
              {liveBoardRows.map((item, idx) => {
                const isBarter = item.transferType === 'exchange';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectResource(item.id)}
                    className="w-full py-2.5 px-2 -mx-2 hover:bg-[#0E1528] transition-colors flex items-center justify-between gap-3 text-left cursor-pointer"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span className="font-mono-num text-[10px] text-[#8A94A6] shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#F8FAFC] truncate">
                          {item.title}
                        </div>
                        <div className="font-mono-num text-[10px] text-[#8A94A6] uppercase truncate">
                          {item.area} · {item.quantity} {item.unit}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`font-mono-num text-[10px] font-semibold px-2 py-0.5 rounded-sm border shrink-0 ${
                        isBarter
                          ? 'bg-[#0E1528] text-[#C7DBFF] border-[#0052FF]'
                          : 'bg-[#0E1528] text-[#A7F3D0] border-[#10B981]/50'
                      }`}
                    >
                      {isBarter ? '○ BARTER' : '● AVAILABLE'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3 Bold Stat Counters */}
          <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-[#1D2740]">
            <div className="bg-[#0E1528] border border-[#1D2740] rounded-[2px] p-3">
              <div className="font-mono-num text-[10px] uppercase tracking-wider text-[#8A94A6]">
                ACTIVE SURPLUS
              </div>
              <div className="font-mono-num text-xl font-bold text-[#F8FAFC] mt-0.5">
                {resources.length}
              </div>
            </div>
            <div className="bg-[#0E1528] border border-[#1D2740] rounded-[2px] p-3">
              <div className="font-mono-num text-[10px] uppercase tracking-wider text-[#8A94A6]">
                OPEN NEEDS
              </div>
              <div className="font-mono-num text-xl font-bold text-[#F8FAFC] mt-0.5">
                {needs.length}
              </div>
            </div>
            <div className="bg-[#0E1528] border border-[#1D2740] rounded-[2px] p-3">
              <div className="font-mono-num text-[10px] uppercase tracking-wider text-[#8A94A6]">
                RULE MATCHES
              </div>
              <div className="font-mono-num text-xl font-bold text-[#0052FF] mt-0.5">
                {matches.length}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ( 01 ) SMART MATCHES */}
      <section className="pt-6 border-t border-[#E2E6EE]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono-num text-xs font-semibold text-[#0052FF]">( 01 )</span>
            <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#0B0F19]">
              SMART MATCHES
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('matches')}
            className="font-mono-num text-[11px] font-semibold uppercase tracking-wider text-[#0052FF] hover:underline cursor-pointer"
          >
            TRANSPARENT RULE ENGINE · VIEW ALL ({matches.length}) ↗
          </button>
        </div>

        {topMatches.length === 0 ? (
          <div className="bg-[#F5F6F8] border border-[#E2E6EE] rounded-[2px] p-6 text-sm text-[#5A6475]">
            No matches above threshold yet. Post a new resource or need to trigger live matching.
          </div>
        ) : (
          <div className="bg-[#F5F6F8] border border-[#E2E6EE] p-4 rounded-[2px] grid grid-cols-1 lg:grid-cols-3 gap-4">
            {topMatches.map((m, idx) => (
              <div
                key={m.id}
                onClick={() => onSelectResource(m.resource.id)}
                className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-4 hover:border-[#0052FF] transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono-num text-[10px] uppercase tracking-wider text-[#8A94A6]">
                      PAIR // {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-mono-num px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                      {m.score}% MATCH
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#0B0F19] truncate">
                    SUPPLY: {m.resource.title}
                  </div>
                  <div className="text-xs font-semibold text-[#0052FF] truncate mt-0.5 mb-3">
                    NEED: {m.need.title}
                  </div>
                  <ul className="space-y-1 text-[11px] text-[#5A6475] border-t border-[#E2E6EE] pt-2.5">
                    {m.reasons.slice(0, 2).map((reason, rIdx) => (
                      <li key={rIdx} className="truncate">
                        ✓ {reason}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#E2E6EE] flex items-center justify-between font-mono-num text-[11px] uppercase tracking-wider">
                  <span className="text-[#8A94A6]">{m.distanceKm} KM APART</span>
                  <span className="font-semibold text-[#0B0F19]">COORDINATE ↗</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ( 02 ) NEARBY OPPORTUNITIES */}
      <section className="pt-6 border-t border-[#E2E6EE]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono-num text-xs font-semibold text-[#0052FF]">( 02 )</span>
            <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#0B0F19]">
              NEARBY OPPORTUNITIES
            </h2>
          </div>
          <span className="font-mono-num text-[11px] uppercase tracking-wider text-[#8A94A6]">
            {currentUser ? `HAVERSINE FROM ${currentUser.area}` : 'PROXIMITY SORTED'}
          </span>
        </div>
        <div className="bg-[#F5F6F8] border border-[#E2E6EE] p-4 rounded-[2px] grid grid-cols-1 md:grid-cols-3 gap-4">
          {nearbyResources.map((r, idx) => (
            <ResourceCard
              key={`nearby-${r.id}`}
              resource={r}
              index={idx + 1}
              currentUser={currentUser}
              onSelect={onSelectResource}
            />
          ))}
        </div>
      </section>

      {/* ( 03 ) AVAILABLE SURPLUS + Search/Filter */}
      <section className="pt-6 border-t border-[#E2E6EE]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono-num text-xs font-semibold text-[#0052FF]">( 03 )</span>
            <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#0B0F19]">
              AVAILABLE SURPLUS ({filteredResources.length})
            </h2>
          </div>
          <span className="font-mono-num text-[11px] uppercase tracking-wider text-[#8A94A6]">
            VERIFY CONDITION AT HANDOVER
          </span>
        </div>

        {/* Sharp Search & Filter Bar */}
        <div className="bg-[#FFFFFF] border border-[#E2E6EE] rounded-[2px] p-3 mb-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8A94A6] absolute left-3 top-3" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSearch(e.target.value);
                }}
                placeholder="Search fabric, corrugated boxes, wood offcuts, microcontrollers..."
                className="w-full pl-9 pr-3 py-2.5 rounded-[2px] border border-[#E2E6EE] bg-[#F5F6F8] text-xs text-[#0B0F19] focus:outline-none focus:border-[#0052FF] focus:bg-white"
              />
            </div>
            <select
              value={transferFilter}
              onChange={(e) => setTransferFilter(e.target.value)}
              className="px-3 py-2.5 rounded-[2px] border border-[#E2E6EE] bg-[#FFFFFF] font-mono-num text-[11px] uppercase text-[#0B0F19] focus:outline-none focus:border-[#0052FF]"
            >
              <option value="all">ALL TRANSFER TERMS</option>
              <option value="free">FREE PICKUP</option>
              <option value="exchange">EXCHANGE / BARTER</option>
              <option value="low_cost">LOW-COST TRANSFER</option>
            </select>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-[2px] bg-[#0B0F19] hover:bg-[#0052FF] text-white font-mono-num text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              SEARCH
            </button>
          </form>

          {/* Monospace Category Filter Chips */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#E2E6EE]">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-[2px] font-mono-num text-[10px] font-semibold uppercase tracking-wider border transition-colors cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-[#0052FF] text-white border-[#0052FF]'
                  : 'bg-[#F5F6F8] text-[#5A6475] border-[#E2E6EE] hover:border-[#0B0F19]'
              }`}
            >
              ALL CATEGORIES
            </button>
            {CATEGORY_NAMES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-[2px] font-mono-num text-[10px] font-semibold uppercase tracking-wider border transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#0052FF] text-white border-[#0052FF]'
                    : 'bg-[#F5F6F8] text-[#5A6475] border-[#E2E6EE] hover:border-[#0B0F19]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredResources.length === 0 ? (
          <div className="bg-[#F5F6F8] rounded-[2px] border border-[#E2E6EE] p-8 text-center text-sm text-[#5A6475]">
            No available resources match your current filters.
          </div>
        ) : (
          <div className="bg-[#F5F6F8] border border-[#E2E6EE] p-4 rounded-[2px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((r, idx) => (
              <ResourceCard
                key={r.id}
                resource={r}
                index={idx + 1}
                currentUser={currentUser}
                onSelect={onSelectResource}
              />
            ))}
          </div>
        )}
      </section>

      {/* ( 04 ) COMMUNITY NEEDS */}
      <section className="pt-6 border-t border-[#E2E6EE]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono-num text-xs font-semibold text-[#0052FF]">( 04 )</span>
            <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-[#0B0F19]">
              COMMUNITY NEEDS ({needs.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('post-need')}
            className="font-mono-num text-[11px] font-semibold uppercase tracking-wider text-[#0052FF] hover:underline cursor-pointer"
          >
            + POST MATERIAL NEED ↗
          </button>
        </div>
        <div className="bg-[#F5F6F8] border border-[#E2E6EE] p-4 rounded-[2px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {needs.map((n, idx) => (
            <NeedCard key={n.id} need={n} index={idx + 1} onSelect={onSelectNeed} />
          ))}
        </div>
      </section>
    </div>
  );
};
