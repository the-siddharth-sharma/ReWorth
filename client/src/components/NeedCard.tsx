import React from 'react';
import { MapPin, Calendar, Target } from 'lucide-react';
import type { Need } from '../../../shared/types.ts';

interface NeedCardProps {
  need: Need;
  onSelect: (needId: string) => void;
}

export const NeedCard: React.FC<NeedCardProps> = ({ need, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(need.id)}
      className="bg-white rounded-2xl border border-[#E4DFD7] p-4 hover:border-[#1B4332] transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9C6B43]">
            {need.category}
          </span>
          {need.isSample && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F6EFE8] text-[#9C6B43] border border-[#E6D6C5]">
              Sample Data
            </span>
          )}
        </div>

        <h3 className="text-sm font-bold text-[#1D2420] mb-1.5 line-clamp-2">{need.title}</h3>
        <p className="text-xs text-[#5C6460] line-clamp-2 mb-3">{need.description}</p>

        <div className="bg-[#FAF8F5] rounded-xl p-2.5 border border-[#E4DFD7] mb-3 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-[#1D2420]">
            <Target className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0" />
            <span className="truncate">
              <strong>Purpose:</strong> {need.purpose}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#5C6460]">
            <span>
              Needs:{' '}
              <strong className="font-mono-num text-[#1D2420]">
                {need.quantity} {need.unit}
              </strong>
            </span>
            <span>
              {need.preferredTransfer === 'free_only'
                ? 'Free only'
                : need.preferredTransfer === 'free_or_exchange'
                  ? 'Free / Exchange'
                  : `Budget ≤ ₹${need.maxBudget ?? 'N/A'}`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#5C6460] pt-2 border-t border-[#E4DFD7]">
        <span className="flex items-center gap-1 truncate">
          <MapPin className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0" />
          {need.area}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          <Calendar className="w-3 h-3" />
          Needed by {need.deadline}
        </span>
      </div>
    </div>
  );
};
