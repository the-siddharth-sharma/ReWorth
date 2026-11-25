import React, { useState } from 'react';
import { ArrowUpRight, MapPin, Package } from 'lucide-react';
import { haversineDistanceKm } from '../../../shared/matching.ts';
import type { Resource, User } from '../../../shared/types.ts';

interface ResourceCardProps {
  resource: Resource;
  index?: number;
  currentUser: User | null;
  onSelect: (resourceId: string) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  index,
  currentUser,
  onSelect,
}) => {
  const [imgError, setImgError] = useState(false);
  const distanceKm = currentUser
    ? haversineDistanceKm(currentUser.lat, currentUser.lng, resource.lat, resource.lng)
    : null;

  const statusBadge =
    resource.transferType === 'exchange'
      ? {
          label: 'BARTER / SWAP',
          cls: 'bg-[#EEF4FF] text-[#0052FF] border-[#C7DBFF]',
        }
      : resource.transferType === 'free'
        ? {
            label: 'AVAILABLE · FREE',
            cls: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
          }
        : {
            label: `₹${resource.priceAmount ?? 0} RECOVERY`,
            cls: 'bg-[#F5F6F8] text-[#0B0F19] border-[#E2E6EE]',
          };

  return (
    <div
      onClick={() => onSelect(resource.id)}
      className="group bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] overflow-hidden hover:border-[#0052FF] transition-colors cursor-pointer flex flex-col"
    >
      {/* Top Meta Row */}
      <div className="px-4 py-2.5 border-b border-[#E2E6EE] flex items-center justify-between gap-2 bg-[#FFFFFF]">
        <span className="font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#8A94A6] truncate">
          {index !== undefined ? `${String(index).padStart(2, '0')} // ` : ''}
          {resource.category}
        </span>
        <span
          className={`font-mono-num text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm border shrink-0 ${statusBadge.cls}`}
        >
          {statusBadge.label}
        </span>
      </div>

      {/* Image */}
      <div className="relative h-36 bg-[#F5F6F8] border-b border-[#E2E6EE] overflow-hidden">
        {resource.imageUrl && !imgError ? (
          <img
            src={resource.imageUrl}
            alt={resource.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#8A94A6]">
            <Package className="w-7 h-7 mb-1" />
            <span className="font-mono-num text-[10px] uppercase">NO IMAGE PROVIDED</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          {resource.urgency === 'urgent' && (
            <span className="font-mono-num text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
              URGENT DISPOSAL
            </span>
          )}
          {resource.isSample && (
            <span className="font-mono-num text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-[#FFFFFF] text-[#5A6475] border border-[#E2E6EE]">
              SAMPLE DATA
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="font-mono-num text-[10px] uppercase tracking-wider text-[#5A6475] mb-1 truncate">
          {resource.ownerOrganization || resource.ownerName}
        </div>
        <h3 className="text-sm font-bold text-[#0B0F19] group-hover:text-[#0052FF] line-clamp-2 mb-1.5">
          {resource.title}
        </h3>
        <p className="text-xs text-[#5A6475] line-clamp-2 mb-3 flex-1">{resource.description}</p>

        <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-y border-[#E2E6EE] mb-3">
          <div>
            <span className="font-mono-num text-[#8A94A6] uppercase block text-[10px]">
              QUANTITY
            </span>
            <span className="font-mono-num font-semibold text-[#0B0F19]">
              {resource.quantity} {resource.unit}
            </span>
          </div>
          <div>
            <span className="font-mono-num text-[#8A94A6] uppercase block text-[10px]">
              CONDITION
            </span>
            <span className="font-semibold text-[#0B0F19]">{resource.condition}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#5A6475] font-mono-num uppercase">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#0052FF] shrink-0" />
            <span className="truncate">
              {resource.area}
              {distanceKm !== null ? ` (${distanceKm} KM)` : ''}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-[#0B0F19] group-hover:text-[#0052FF] font-semibold shrink-0 ml-2">
            BY {resource.disposalDate}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
