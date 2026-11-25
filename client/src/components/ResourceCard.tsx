import React from 'react';
import { MapPin, Clock, Package } from 'lucide-react';
import { haversineDistanceKm } from '../../../shared/matching.ts';
import type { Resource, User } from '../../../shared/types.ts';

interface ResourceCardProps {
  resource: Resource;
  currentUser: User | null;
  onSelect: (resourceId: string) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  currentUser,
  onSelect,
}) => {
  const distanceKm = currentUser
    ? haversineDistanceKm(currentUser.lat, currentUser.lng, resource.lat, resource.lng)
    : null;

  const transferBadge =
    resource.transferType === 'free'
      ? { label: 'Free Pickup', cls: 'bg-[#E8F3EC] text-[#1B4332] border-[#B7DFC5]' }
      : resource.transferType === 'exchange'
        ? { label: 'Exchange / Barter', cls: 'bg-[#F6EFE8] text-[#9C6B43] border-[#E6D6C5]' }
        : {
            label: `₹${resource.priceAmount ?? 0} Low-Cost`,
            cls: 'bg-[#F3EFEA] text-[#1D2420] border-[#D8D1C7]',
          };

  return (
    <div
      onClick={() => onSelect(resource.id)}
      className="group bg-white rounded-2xl border border-[#E4DFD7] overflow-hidden hover:border-[#1B4332] transition-all cursor-pointer flex flex-col"
    >
      {/* Image */}
      <div className="relative h-40 bg-[#F3EFEA] border-b border-[#E4DFD7] overflow-hidden">
        {resource.imageUrl ? (
          <img
            src={resource.imageUrl}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#8A918D]">
            <Package className="w-8 h-8 mb-1" />
            <span className="text-xs">No image provided</span>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${transferBadge.cls}`}>
            {transferBadge.label}
          </span>
          {resource.urgency === 'urgent' && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              Urgent Disposal
            </span>
          )}
        </div>
        {resource.isSample && (
          <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-white/90 text-[#9C6B43] border border-[#E6D6C5]">
            Sample Data
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#2D6A4F] mb-1">
          {resource.category}
        </div>
        <h3 className="text-sm font-bold text-[#1D2420] group-hover:text-[#1B4332] line-clamp-2 mb-1.5">
          {resource.title}
        </h3>
        <p className="text-xs text-[#5C6460] line-clamp-2 mb-3 flex-1">{resource.description}</p>

        <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-y border-[#E4DFD7] mb-3">
          <div>
            <span className="text-[#5C6460] block text-[10px]">Quantity</span>
            <span className="font-mono-num font-semibold text-[#1D2420]">
              {resource.quantity} {resource.unit}
            </span>
          </div>
          <div>
            <span className="text-[#5C6460] block text-[10px]">Condition</span>
            <span className="font-medium text-[#1D2420]">{resource.condition}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#5C6460]">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0" />
            <span className="truncate">
              {resource.area}
              {distanceKm !== null ? ` (${distanceKm} km)` : ''}
            </span>
          </span>
          <span className="flex items-center gap-1 shrink-0 ml-2">
            <Clock className="w-3 h-3" />
            By {resource.disposalDate}
          </span>
        </div>
      </div>
    </div>
  );
};
