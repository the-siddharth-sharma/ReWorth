import React from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';
import type { MatchResult } from '../../../shared/types.ts';

interface MatchCardProps {
  match: MatchResult;
  onInspectResource: (resourceId: string) => void;
  onRequestExchange: (match: MatchResult) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onInspectResource,
  onRequestExchange,
}) => {
  const { resource, need, score, breakdown, reasons, warnings, distanceKm } = match;

  return (
    <div className="bg-white rounded-2xl border border-[#E4DFD7] p-5 shadow-xs hover:border-[#2D6A4F]/60 transition-colors">
      {/* Header with Score */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono-num px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F3EC] text-[#1B4332] border border-[#B7DFC5]">
            {score}% Rule Match
          </span>
          <span className="text-xs font-medium text-[#5C6460] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#2D6A4F]" />
            {distanceKm} km apart
          </span>
          {(resource.isSample || need.isSample) && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F6EFE8] text-[#9C6B43] border border-[#E6D6C5]">
              Sample Data
            </span>
          )}
        </div>
        <div className="text-[11px] text-[#5C6460]">
          Deterministic score · No AI claims
        </div>
      </div>

      {/* Resource <-> Need Pairing */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center mb-4">
        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4DFD7]">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#2D6A4F] mb-1">
            Available Resource
          </div>
          <button
            type="button"
            onClick={() => onInspectResource(resource.id)}
            className="text-sm font-bold text-[#1D2420] hover:text-[#1B4332] text-left cursor-pointer"
          >
            {resource.title}
          </button>
          <div className="text-xs text-[#5C6460] mt-1">
            <span className="font-mono-num font-semibold text-[#1D2420]">
              {resource.quantity} {resource.unit}
            </span>{' '}
            · {resource.condition} ·{' '}
            {resource.transferType === 'free'
              ? 'Free'
              : resource.transferType === 'exchange'
                ? 'Exchange'
                : `₹${resource.priceAmount}`}
          </div>
          <div className="text-[11px] text-[#5C6460] mt-1">
            From: {resource.ownerName} ({resource.area})
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-[#E8F3EC] text-[#1B4332]">
          <ArrowRight className="w-4 h-4" />
        </div>

        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4DFD7]">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#9C6B43] mb-1">
            Matched Need
          </div>
          <div className="text-sm font-bold text-[#1D2420]">{need.title}</div>
          <div className="text-xs text-[#5C6460] mt-1">
            Needs{' '}
            <span className="font-mono-num font-semibold text-[#1D2420]">
              {need.quantity} {need.unit}
            </span>{' '}
            · Deadline {need.deadline}
          </div>
          <div className="text-[11px] text-[#5C6460] mt-1">
            By: {need.requesterName} ({need.area})
          </div>
        </div>
      </div>

      {/* Transparent Rule Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4 text-[11px]">
        {[
          { label: 'Category & Material', val: breakdown.categoryAndMaterial, max: 40 },
          { label: 'Quantity Fit', val: breakdown.quantityFit, max: 20 },
          { label: 'Proximity', val: breakdown.proximity, max: 20 },
          { label: 'Timeline', val: breakdown.timeline, max: 10 },
          { label: 'Transfer Fit', val: breakdown.budgetFit, max: 10 },
        ].map((item) => (
          <div key={item.label} className="bg-[#FAF8F5] rounded-lg px-2.5 py-1.5 border border-[#E4DFD7]">
            <div className="text-[#5C6460] truncate">{item.label}</div>
            <div className="font-mono-num font-semibold text-[#1B4332]">
              {item.val}/{item.max}
            </div>
          </div>
        ))}
      </div>

      {/* Why it matches */}
      <div className="space-y-1.5 mb-4">
        <div className="text-xs font-semibold text-[#1D2420]">Why these match:</div>
        {reasons.map((r, i) => (
          <div key={i} className="flex items-start gap-1.5 text-xs text-[#2D6A4F]">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{r}</span>
          </div>
        ))}
        {warnings.map((w, i) => (
          <div key={i} className="flex items-start gap-1.5 text-xs text-[#B45309]">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{w}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#E4DFD7]">
        <button
          type="button"
          onClick={() => onInspectResource(resource.id)}
          className="px-3.5 py-2 rounded-lg border border-[#E4DFD7] text-xs font-semibold text-[#1D2420] hover:bg-[#F3EFEA] cursor-pointer"
        >
          Inspect Resource
        </button>
        <button
          type="button"
          onClick={() => onRequestExchange(match)}
          className="px-4 py-2 rounded-lg bg-[#1B4332] text-white text-xs font-semibold hover:bg-[#143326] cursor-pointer"
        >
          Initiate Exchange
        </button>
      </div>
    </div>
  );
};
