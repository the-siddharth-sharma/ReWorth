import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { AREA_HUBS, CATEGORIES } from '../../../shared/constants.ts';
import { checkListingSafety } from '../../../shared/safety.ts';
import type { MatchResult, Need, ResourceCategory, User } from '../../../shared/types.ts';
import { api } from '../api.ts';

interface PostNeedViewProps {
  currentUser: User | null;
  onRequireAuth: () => void;
  onCreated: () => void;
  onInspectResource: (id: string) => void;
}

export const PostNeedView: React.FC<PostNeedViewProps> = ({
  currentUser,
  onRequireAuth,
  onCreated,
  onInspectResource,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>(CATEGORIES[0].name);
  const [materialTags, setMaterialTags] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState(CATEGORIES[0].defaultUnits[0]);
  const [purpose, setPurpose] = useState('');
  const [area, setArea] = useState(currentUser?.area ?? AREA_HUBS[0].name);
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [preferredTransfer, setPreferredTransfer] =
    useState<Need['preferredTransfer']>('free_or_exchange');
  const [maxBudget, setMaxBudget] = useState<number>(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMatches, setCreatedMatches] = useState<MatchResult[] | null>(null);

  const liveSafety = checkListingSafety(
    title,
    `${description} ${purpose}`,
    materialTags.split(',').map((t) => t.trim())
  );

  const selectedCategoryMeta = CATEGORIES.find((c) => c.name === category) ?? CATEGORIES[0];

  const handleCategoryChange = (nextCat: ResourceCategory) => {
    setCategory(nextCat);
    const meta = CATEGORIES.find((c) => c.name === nextCat);
    if (meta) setUnit(meta.defaultUnits[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!liveSafety.safe) {
      setError(liveSafety.reason || 'Need blocked by safety policy.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.createNeed({
        title,
        description,
        category,
        materialTags,
        quantity,
        unit,
        purpose,
        area,
        deadline,
        preferredTransfer,
        maxBudget: preferredTransfer === 'low_cost_ok' ? maxBudget : null,
      });
      setCreatedMatches(res.matches);
      onCreated();
      setTitle('');
      setDescription('');
      setPurpose('');
      setMaterialTags('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post need.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-6 sm:p-8">
        <div className="font-mono-num text-[11px] font-semibold uppercase tracking-widest text-[#0052FF] mb-1">
          ( 04 ) DEMAND SIGNAL
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-[#0B0F19] mb-1">
          POST A MATERIAL <span className="text-[#0052FF]">NEED</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6475] mb-6">
          Tell ReWorth what material you need and why. Our rule-based engine will immediately surface
          matching surplus resources nearby.
        </p>

        {!currentUser && (
          <div className="mb-5 p-3.5 rounded-[2px] bg-[#EEF4FF] border border-[#C7DBFF] flex items-center justify-between gap-3 text-xs">
            <span className="text-[#0B0F19]">Sign in or pick a Demo Account to post a live need.</span>
            <button
              type="button"
              onClick={onRequireAuth}
              className="px-3.5 py-2 rounded-[2px] bg-[#0B0F19] hover:bg-[#0052FF] text-white font-mono-num text-[11px] font-semibold uppercase cursor-pointer"
            >
              Sign In / Demo ↗
            </button>
          </div>
        )}

        {!liveSafety.safe && (
          <div className="mb-4 p-3.5 rounded-[2px] bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-900">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Safety Policy Block:</strong> {liveSafety.reason}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-[2px] bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        {createdMatches !== null && (
          <div className="mb-5 p-4 rounded-[2px] bg-[#ECFDF5] border border-[#A7F3D0] space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#047857]">
              <CheckCircle2 className="w-4 h-4" />
              Need Posted! Found {createdMatches.length} matching available resource(s).
            </div>
            {createdMatches.slice(0, 3).map((m) => (
              <div
                key={m.id}
                onClick={() => onInspectResource(m.resource.id)}
                className="p-2.5 rounded-[2px] bg-white border border-[#A7F3D0] text-xs cursor-pointer hover:border-[#0052FF]"
              >
                <span className="font-mono-num font-bold text-[#047857] mr-2">
                  {m.score}% MATCH
                </span>
                <span className="font-semibold text-[#0B0F19]">{m.resource.title}</span> —{' '}
                <span className="text-[#5A6475]">{m.reasons[0]}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1">
                What material do you need? *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Need 15 meters cotton or denim fabric for fashion thesis"
                className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] bg-[#F5F6F8] focus:bg-white text-sm focus:outline-none focus:border-[#0052FF]"
              />
            </div>

            <div>
              <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as ResourceCategory)}
                className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm bg-white focus:outline-none focus:border-[#0052FF]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1">
                Material Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={materialTags}
                onChange={(e) => setMaterialTags(e.target.value)}
                placeholder="e.g. cotton, denim, fabric"
                className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] bg-[#F5F6F8] focus:bg-white text-sm focus:outline-none focus:border-[#0052FF]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1">
                Purpose / Project Context *
              </label>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. College sustainable fashion design project / Small business shipping"
                className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] bg-[#F5F6F8] focus:bg-white text-sm focus:outline-none focus:border-[#0052FF]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1">
                Specifications &amp; Requirements *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe acceptable sizes, condition, or minimum quality needed."
                className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] bg-[#F5F6F8] focus:bg-white text-sm focus:outline-none focus:border-[#0052FF]"
              />
            </div>

            <div>
              <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1">
                Needed Quantity *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-28 px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm font-mono-num focus:outline-none focus:border-[#0052FF]"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm bg-white focus:outline-none focus:border-[#0052FF]"
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
              <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1">
                Your Area / Pickup Radius Center *
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm bg-white focus:outline-none focus:border-[#0052FF]"
              >
                {AREA_HUBS.map((hub) => (
                  <option key={hub.name} value={hub.name}>
                    {hub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1">
                Needed By Deadline *
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm font-mono-num focus:outline-none focus:border-[#0052FF]"
              />
            </div>

            <div>
              <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1">
                Budget / Transfer Preference
              </label>
              <select
                value={preferredTransfer}
                onChange={(e) => setPreferredTransfer(e.target.value as Need['preferredTransfer'])}
                className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm bg-white focus:outline-none focus:border-[#0052FF]"
              >
                <option value="free_only">Free only</option>
                <option value="free_or_exchange">Free or Exchange / Barter</option>
                <option value="low_cost_ok">Open to Low-Cost Transfer</option>
              </select>
            </div>

            {preferredTransfer === 'low_cost_ok' && (
              <div>
                <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1">
                  Optional Max Budget (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm font-mono-num focus:outline-none focus:border-[#0052FF]"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !liveSafety.safe}
            className="w-full py-3 rounded-[2px] bg-[#0B0F19] hover:bg-[#0052FF] text-white font-mono-num text-xs font-semibold uppercase tracking-wider disabled:opacity-50 cursor-pointer transition-colors"
          >
            {submitting
              ? 'Posting Need & Matching...'
              : 'Post Need & Find Available Resources ↗'}
          </button>
        </form>
      </div>
    </div>
  );
};
