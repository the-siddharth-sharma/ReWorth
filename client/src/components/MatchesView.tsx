import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { MatchResult, User } from '../../../shared/types.ts';
import { MatchCard } from './MatchCard.tsx';
import { api } from '../api.ts';

interface MatchesViewProps {
  matches: MatchResult[];
  currentUser: User | null;
  onInspectResource: (id: string) => void;
  onRequireAuth: () => void;
  onExchangeCreated: () => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches,
  currentUser,
  onInspectResource,
  onRequireAuth,
  onExchangeCreated,
}) => {
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const [minScore, setMinScore] = useState(50);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleMatches = matches.filter((m) => {
    if (m.score < minScore) return false;
    if (scope === 'mine' && currentUser) {
      return (
        m.need.requesterId === currentUser.id || m.resource.ownerId === currentUser.id
      );
    }
    return true;
  });

  const handleQuickInitiate = async (match: MatchResult) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (currentUser.id === match.resource.ownerId) {
      setError('You are the owner of this resource. Switch to the requester account or wait for them to initiate.');
      return;
    }
    setError(null);
    setFeedback(null);
    try {
      const qty = Math.min(match.resource.quantity, match.need.quantity);
      await api.createExchange({
        resourceId: match.resource.id,
        needId: match.need.id,
        requestedQuantity: qty,
        initialNote: `Matched via ReWorth (${match.score}% rule match) for "${match.need.title}". Requesting ${qty} ${match.resource.unit}.`,
      });
      setFeedback(
        `Exchange initiated for "${match.resource.title}"! Check the Exchanges tab to coordinate pickup.`
      );
      onExchangeCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate exchange.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="font-mono-num text-[11px] font-semibold uppercase tracking-widest text-[#0052FF] mb-1">
              ( 02 ) DETERMINISTIC SCORING ENGINE
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-[#0B0F19]">
              SMART NEED-TO-RESOURCE <span className="text-[#0052FF]">MATCHING</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5A6475] mt-1">
              Transparent weighted scoring (100 pts max): Category &amp; Material Keywords (40),
              Quantity Coverage (20), Haversine Proximity (20), Timeline/Urgency (10), and Transfer Fit (10).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {currentUser && (
              <div className="inline-flex rounded-[2px] border border-[#E2E6EE] p-0.5 bg-[#F5F6F8]">
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-3 py-1.5 rounded-[2px] font-mono-num text-[11px] font-semibold uppercase cursor-pointer ${
                    scope === 'all' ? 'bg-[#0B0F19] text-white' : 'text-[#5A6475]'
                  }`}
                >
                  All Matches
                </button>
                <button
                  type="button"
                  onClick={() => setScope('mine')}
                  className={`px-3 py-1.5 rounded-[2px] font-mono-num text-[11px] font-semibold uppercase cursor-pointer ${
                    scope === 'mine' ? 'bg-[#0B0F19] text-white' : 'text-[#5A6475]'
                  }`}
                >
                  My Listings
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] border border-[#E2E6EE] bg-[#F5F6F8] font-mono-num text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0052FF]" />
              <span className="text-[11px] uppercase text-[#5A6475]">MIN SCORE:</span>
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="bg-transparent font-mono-num font-bold text-[#0052FF] focus:outline-none"
              >
                <option value={40}>40%</option>
                <option value={50}>50%</option>
                <option value={65}>65%</option>
                <option value={80}>80%</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-[2px] bg-[#ECFDF5] border border-[#A7F3D0] text-sm text-[#047857]">
          {feedback}
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-[2px] bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}

      {visibleMatches.length === 0 ? (
        <div className="bg-[#F5F6F8] rounded-[2px] border border-[#E2E6EE] p-8 text-center text-sm text-[#5A6475]">
          No matches found for this filter. Try lowering the minimum score or posting a new resource/need.
        </div>
      ) : (
        <div className="bg-[#F5F6F8] border border-[#E2E6EE] p-4 rounded-[2px] space-y-4">
          {visibleMatches.map((m, idx) => (
            <MatchCard
              key={m.id}
              match={m}
              index={idx + 1}
              onInspectResource={onInspectResource}
              onRequestExchange={handleQuickInitiate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
