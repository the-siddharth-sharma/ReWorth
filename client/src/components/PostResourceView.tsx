import React, { useState } from 'react';
import { Upload, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  AREA_HUBS,
  CATEGORIES,
  CONDITIONS,
  TRANSFER_TYPES,
  URGENCY_OPTIONS,
} from '../../../shared/constants.ts';
import { checkListingSafety } from '../../../shared/safety.ts';
import type {
  MatchResult,
  ResourceCategory,
  ResourceCondition,
  TransferType,
  UrgencyLevel,
  User,
} from '../../../shared/types.ts';
import { api } from '../api.ts';

interface PostResourceViewProps {
  currentUser: User | null;
  onRequireAuth: () => void;
  onCreated: () => void;
  onInspectNeed: (id: string) => void;
}

export const PostResourceView: React.FC<PostResourceViewProps> = ({
  currentUser,
  onRequireAuth,
  onCreated,
  onInspectNeed,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>(CATEGORIES[0].name);
  const [materialTags, setMaterialTags] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState(CATEGORIES[0].defaultUnits[0]);
  const [condition, setCondition] = useState<ResourceCondition>('Usable Offcuts');
  const [transferType, setTransferType] = useState<TransferType>('free');
  const [priceAmount, setPriceAmount] = useState<number>(0);
  const [exchangeNote, setExchangeNote] = useState('');
  const [area, setArea] = useState(currentUser?.area ?? AREA_HUBS[0].name);
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [availability, setAvailability] = useState('Weekdays 10 AM - 5 PM');
  const [disposalDate, setDisposalDate] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10)
  );
  const [urgency, setUrgency] = useState<UrgencyLevel>('this_week');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMatches, setCreatedMatches] = useState<MatchResult[] | null>(null);

  const liveSafety = checkListingSafety(
    title,
    description,
    materialTags.split(',').map((t) => t.trim())
  );

  const selectedCategoryMeta = CATEGORIES.find((c) => c.name === category) ?? CATEGORIES[0];

  const handleCategoryChange = (nextCat: ResourceCategory) => {
    setCategory(nextCat);
    const meta = CATEGORIES.find((c) => c.name === nextCat);
    if (meta) setUnit(meta.defaultUnits[0]);
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });
      const res = await api.uploadImage(dataUrl);
      setImageUrl(res.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!liveSafety.safe) {
      setError(liveSafety.reason || 'Listing blocked by safety policy.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.createResource({
        title,
        description,
        category,
        materialTags,
        quantity,
        unit,
        condition,
        transferType,
        priceAmount: transferType === 'low_cost' ? priceAmount : null,
        exchangeNote: transferType === 'exchange' ? exchangeNote : undefined,
        area,
        pickupInstructions,
        availability,
        disposalDate,
        urgency,
        imageUrl: imageUrl || undefined,
        safetyConfirmed,
      });
      setCreatedMatches(res.matches);
      onCreated();
      setTitle('');
      setDescription('');
      setMaterialTags('');
      setImageUrl('');
      setSafetyConfirmed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish resource.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-[#E4DFD7] p-6">
        <h1 className="text-xl font-bold text-[#1B4332] mb-1">List Surplus or Leftover Resource</h1>
        <p className="text-xs sm:text-sm text-[#5C6460] mb-5">
          Share usable materials before disposal. ReWorth automatically runs our rule-based matcher
          against open community needs upon publishing.
        </p>

        {!currentUser && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#F6EFE8] border border-[#E6D6C5] flex items-center justify-between gap-3 text-xs">
            <span>Sign in or pick a Demo Account to publish a live resource listing.</span>
            <button
              type="button"
              onClick={onRequireAuth}
              className="px-3 py-1.5 rounded-lg bg-[#1B4332] text-white font-semibold cursor-pointer"
            >
              Sign In / Demo
            </button>
          </div>
        )}

        {!liveSafety.safe && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-900">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Safety Policy Block:</strong> {liveSafety.reason} (Detected:{' '}
              {liveSafety.flaggedTerms.join(', ')})
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        {createdMatches !== null && (
          <div className="mb-5 p-4 rounded-xl bg-[#E8F3EC] border border-[#B7DFC5] space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1B4332]">
              <CheckCircle2 className="w-4 h-4" />
              Resource Published! Found {createdMatches.length} matching community need(s).
            </div>
            {createdMatches.slice(0, 3).map((m) => (
              <div
                key={m.id}
                onClick={() => onInspectNeed(m.need.id)}
                className="p-2.5 rounded-lg bg-white border border-[#B7DFC5] text-xs cursor-pointer hover:border-[#1B4332]"
              >
                <span className="font-mono-num font-bold text-[#1B4332] mr-2">{m.score}% Match</span>
                <span className="font-semibold text-[#1D2420]">{m.need.title}</span> —{' '}
                <span className="text-[#5C6460]">{m.reasons[0]}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-[#1D2420] mb-1.5">
              Resource Photo (PNG/JPG/WEBP, max 3 MB)
            </label>
            <div className="flex items-center gap-4">
              <label className="px-4 py-2.5 rounded-xl border border-dashed border-[#1B4332] bg-[#FAF8F5] hover:bg-[#E8F3EC]/50 text-xs font-semibold text-[#1B4332] flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageFile}
                  className="hidden"
                />
              </label>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-16 h-16 rounded-lg object-cover border border-[#E4DFD7]"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                Resource Name *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Leftover 100% Cotton Poplin Rolls"
                className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D2420] mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as ResourceCategory)}
                className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-[#5C6460]">{selectedCategoryMeta.examples}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                Material Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={materialTags}
                onChange={(e) => setMaterialTags(e.target.value)}
                placeholder="e.g. cotton, denim, fabric, unbleached"
                className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                Description &amp; Dimensions *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify dimensions, cleanliness, defects, and ideal reuse cases."
                className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D2420] mb-1">Quantity *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-28 px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm font-mono-num"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm bg-white"
                >
                  {selectedCategoryMeta.defaultUnits.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D2420] mb-1">Condition *</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ResourceCondition)}
                className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm bg-white"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.value} — {c.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                Transfer Terms *
              </label>
              <select
                value={transferType}
                onChange={(e) => setTransferType(e.target.value as TransferType)}
                className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm bg-white"
              >
                {TRANSFER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label} ({t.description})
                  </option>
                ))}
              </select>
            </div>

            {transferType === 'low_cost' && (
              <div>
                <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                  Low-Cost Recovery Fee (₹) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={priceAmount}
                  onChange={(e) => setPriceAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm font-mono-num"
                />
              </div>
            )}

            {transferType === 'exchange' && (
              <div>
                <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                  What would you swap for?
                </label>
                <input
                  type="text"
                  value={exchangeNote}
                  onChange={(e) => setExchangeNote(e.target.value)}
                  placeholder="e.g. Packaging boxes or craft help"
                  className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                Pickup Area *
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm bg-white"
              >
                {AREA_HUBS.map((hub) => (
                  <option key={hub.name} value={hub.name}>
                    {hub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                Pickup Availability
              </label>
              <input
                type="text"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                Pickup Instructions (Gate / Landmark)
              </label>
              <input
                type="text"
                value={pickupInstructions}
                onChange={(e) => setPickupInstructions(e.target.value)}
                placeholder="e.g. Collect from reception; bring your own bag"
                className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                Intended Disposal Date *
              </label>
              <input
                type="date"
                required
                value={disposalDate}
                onChange={(e) => setDisposalDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D2420] mb-1">Urgency *</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm bg-white"
              >
                {URGENCY_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mandatory Safety Confirmation */}
          <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E4DFD7] text-xs text-[#1D2420] cursor-pointer">
            <input
              type="checkbox"
              required
              checked={safetyConfirmed}
              onChange={(e) => setSafetyConfirmed(e.target.checked)}
              className="mt-0.5 accent-[#1B4332]"
            />
            <span>
              <strong className="inline-flex items-center gap-1 text-[#1B4332]">
                <ShieldCheck className="w-3.5 h-3.5" /> Safety Declaration (Required):
              </strong>{' '}
              I confirm this resource contains NO hazardous chemicals, medicines/pharmaceuticals,
              biohazards, leaking batteries, or unsafe/recalled items, and its condition &amp;
              quantity are accurately described.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || !liveSafety.safe}
            className="w-full py-3 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#143326] disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Publishing & Matching...' : 'Publish Resource & Find Need Matches'}
          </button>
        </form>
      </div>
    </div>
  );
};
