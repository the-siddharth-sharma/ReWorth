import React from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';
import type { MatchResult } from '../../../shared/types.ts';

interface MatchCardProps {
  match: MatchResult;
  index?: number;
  onInspectResource: (resourceId: string) => void;
  onRequestExchange: (match: MatchResult) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  index,
  onInspectResource,
  onRequestExchange,
}) => {
  const { resource, need, score, breakdown, reasons, warnings, distanceKm } = match;
  const highMatch = score >= 80;

  return (
    <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-5 hover:border-[#0052FF] transition-colors">
      {/* Header with Score */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#E2E6EE]">
        <div className="flex items-center gap-2 flex-wrap">
          {index !== undefined && (
            <span className="font-mono-num text-[11px] font-semibold text-[#8A94A6]">
              {String(index).padStart(2, '0')} //
            </span>
          )}
          <span
            className={`font-mono-num px-2.5 py-0.5 rounded-sm text-[11px] font-bold uppercase border ${
              highMatch
                ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                : 'bg-[#EEF4FF] text-[#0052FF] border-[#C7DBFF]'
            }`}
          >
            {score}% RULE MATCH
          </span>
          <span className="font-mono-num text-[11px] uppercase text-[#5A6475] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#0052FF]" />
            {distanceKm} KM APART
          </span>
          {(resource.isSample || need.isSample) && (
            <span className="font-mono-num text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-[#F5F6F8] text-[#5A6475] border border-[#E2E6EE]">
              SAMPLE DATA
            </span>
          )}
        </div>
        <div className="font-mono-num text-[10px] uppercase tracking-wider text-[#8A94A6]">
          DETERMINISTIC SCORE · NO AI CLAIMS
        </div>
      </div>

      {/* Resource <-> Need Pairing */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center mb-4">
        <div className="p-3.5 rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE]">
          <div className="font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#047857] mb-1">
            AVAILABLE RESOURCE
          </div>
          <button
            type="button"
            onClick={() => onInspectResource(resource.id)}
            className="text-sm font-bold text-[#0B0F19] hover:text-[#0052FF] text-left cursor-pointer"
          >
            {resource.title}
          </button>
          <div className="text-xs text-[#5A6475] mt-1">
            <span className="font-mono-num font-semibold text-[#0B0F19]">
              {resource.quantity} {resource.unit}
            </span>{' '}
            · {resource.condition} ·{' '}
            {resource.transferType === 'free'
              ? 'Free'
              : resource.transferType === 'exchange'
                ? 'Barter'
                : `₹${resource.priceAmount}`}
          </div>
          <div className="font-mono-num text-[10px] uppercase text-[#8A94A6] mt-1">
            FROM: {resource.ownerName} ({resource.area})
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-[2px] bg-[#EEF4FF] border border-[#C7DBFF] text-[#0052FF]">
          <ArrowRight className="w-4 h-4" />
        </div>

        <div className="p-3.5 rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE]">
          <div className="font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0052FF] mb-1">
            MATCHED NEED
          </div>
          <div className="text-sm font-bold text-[#0B0F19]">{need.title}</div>
          <div className="text-xs text-[#5A6475] mt-1">
            Needs{' '}
            <span className="font-mono-num font-semibold text-[#0B0F19]">
              {need.quantity} {need.unit}
            </span>{' '}
            · Deadline {need.deadline}
          </div>
          <div className="font-mono-num text-[10px] uppercase text-[#8A94A6] mt-1">
            BY: {need.requesterName} ({need.area})
          </div>
        </div>
      </div>

      {/* Transparent Rule Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {[
          { label: 'CATEGORY & TAGS', val: breakdown.categoryAndMaterial, max: 40 },
          { label: 'QUANTITY FIT', val: breakdown.quantityFit, max: 20 },
          { label: 'PROXIMITY', val: breakdown.proximity, max: 20 },
          { label: 'TIMELINE', val: breakdown.timeline, max: 10 },
          { label: 'TRANSFER FIT', val: breakdown.budgetFit, max: 10 },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-[#F5F6F8] rounded-[2px] px-2.5 py-2 border border-[#E2E6EE]"
          >
            <div className="font-mono-num text-[10px] text-[#8A94A6] truncate">{item.label}</div>
            <div className="font-mono-num text-xs font-bold text-[#0B0F19] mt-0.5">
              {item.val}/{item.max}
            </div>
          </div>
        ))}
      </div>

      {/* Why it matches */}
      <div className="space-y-1.5 mb-4">
        <div className="font-mono-num text-[11px] font-semibold uppercase tracking-wider text-[#0B0F19]">
          WHY THESE MATCH
        </div>
        {reasons.map((r, i) => (
          <div key={i} className="flex items-start gap-1.5 text-xs text-[#047857]">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{r}</span>
          </div>
        ))}
        {warnings.map((w, i) => (
          <div key={i} className="flex items-start gap-1.5 text-xs text-[#D97706]">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{w}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#E2E6EE]">
        <button
          type="button"
          onClick={() => onInspectResource(resource.id)}
          className="px-3.5 py-2 rounded-[2px] border border-[#E2E6EE] font-mono-num text-[11px] font-semibold uppercase tracking-wider text-[#0B0F19] hover:border-[#0B0F19] cursor-pointer"
        >
          Inspect Resource
        </button>
        <button
          type="button"
          onClick={() => onRequestExchange(match)}
          className="px-4 py-2 rounded-[2px] bg-[#0B0F19] hover:bg-[#0052FF] text-white font-mono-num text-[11px] font-semibold uppercase tracking-wider inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          Initiate Exchange
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
