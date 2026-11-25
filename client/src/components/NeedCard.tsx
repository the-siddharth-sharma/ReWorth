import React from 'react';
import { ArrowUpRight, MapPin, Target } from 'lucide-react';
import type { Need } from '../../../shared/types.ts';

interface NeedCardProps {
  need: Need;
  index?: number;
  onSelect: (needId: string) => void;
}

export const NeedCard: React.FC<NeedCardProps> = ({ need, index, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(need.id)}
      className="group bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-4 hover:border-[#0052FF] transition-colors cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[#E2E6EE]">
          <span className="font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0052FF] truncate">
            {index !== undefined ? `${String(index).padStart(2, '0')} // ` : ''}
            {need.category}
          </span>
          {need.isSample ? (
            <span className="font-mono-num text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-[#F5F6F8] text-[#5A6475] border border-[#E2E6EE]">
              SAMPLE DATA
            </span>
          ) : (
            <span className="font-mono-num text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
              OPEN NEED
            </span>
          )}
        </div>

        <div className="font-mono-num text-[10px] uppercase tracking-wider text-[#8A94A6] mb-1 truncate">
          {need.requesterOrganization || need.requesterName}
        </div>
        <h3 className="text-sm font-bold text-[#0B0F19] group-hover:text-[#0052FF] mb-1.5 line-clamp-2">
          {need.title}
        </h3>
        <p className="text-xs text-[#5A6475] line-clamp-2 mb-3">{need.description}</p>

        <div className="bg-[#F5F6F8] rounded-[2px] p-2.5 border border-[#E2E6EE] mb-3 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#0B0F19]">
            <Target className="w-3.5 h-3.5 text-[#0052FF] shrink-0" />
            <span className="truncate">
              <strong>Purpose:</strong> {need.purpose}
            </span>
          </div>
          <div className="flex items-center justify-between font-mono-num text-[11px] text-[#5A6475] uppercase">
            <span>
              REQ:{' '}
              <strong className="text-[#0B0F19]">
                {need.quantity} {need.unit}
              </strong>
            </span>
            <span>
              {need.preferredTransfer === 'free_only'
                ? 'FREE ONLY'
                : need.preferredTransfer === 'free_or_exchange'
                  ? 'FREE / BARTER'
                  : `BUDGET ≤ ₹${need.maxBudget ?? 'N/A'}`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between font-mono-num text-[11px] uppercase text-[#5A6475] pt-2.5 border-t border-[#E2E6EE]">
        <span className="flex items-center gap-1 truncate">
          <MapPin className="w-3.5 h-3.5 text-[#0052FF] shrink-0" />
          {need.area}
        </span>
        <span className="inline-flex items-center gap-1 text-[#0B0F19] group-hover:text-[#0052FF] font-semibold shrink-0">
          BY {need.deadline}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
