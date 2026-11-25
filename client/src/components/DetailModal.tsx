import React, { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Flag,
  ArrowRight,
  Package,
} from 'lucide-react';
import { api } from '../api.ts';
import type { MatchResult, Need, Resource, User } from '../../../shared/types.ts';

interface DetailModalProps {
  target: { type: 'resource' | 'need'; id: string } | null;
  currentUser: User | null;
  onClose: () => void;
  onRequireAuth: () => void;
  onExchangeCreated: () => void;
  onSwitchTarget: (target: { type: 'resource' | 'need'; id: string }) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  target,
  currentUser,
  onClose,
  onRequireAuth,
  onExchangeCreated,
  onSwitchTarget,
}) => {
  const [loading, setLoading] = useState(false);
  const [resource, setResource] = useState<Resource | null>(null);
  const [need, setNeed] = useState<Need | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Request exchange form
  const [reqQty, setReqQty] = useState<number>(1);
  const [reqNote, setReqNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Report modal inline
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('Unsafe or Hazardous Material');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    if (!target) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setShowReport(false);
    setReportSuccess(false);
    setResource(null);
    setNeed(null);

    if (target.type === 'resource') {
      api
        .getResourceDetail(target.id)
        .then((res) => {
          setResource(res.resource);
          setMatches(res.matches);
          setReqQty(Math.min(res.resource.quantity, Math.max(1, Math.round(res.resource.quantity / 2))));
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load resource.'))
        .finally(() => setLoading(false));
    } else {
      api
        .getNeedDetail(target.id)
        .then((res) => {
          setNeed(res.need);
          setMatches(res.matches);
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load need.'))
        .finally(() => setLoading(false));
    }
  }, [target]);

  if (!target) return null;

  const handleRequestExchange = async (
    resourceId: string,
    needId: string | null,
    quantity: number,
    note: string
  ) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.createExchange({
        resourceId,
        needId,
        requestedQuantity: quantity,
        initialNote: note,
      });
      setSuccessMsg('Exchange request sent! You can coordinate pickup in the Exchanges tab.');
      setReqNote('');
      onExchangeCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create exchange request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    try {
      await api.submitReport({
        targetType: target.type,
        targetId: target.id,
        reason: reportReason,
        details: reportDetails,
      });
      setReportSuccess(true);
      setShowReport(false);
      setReportDetails('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#E4DFD7] max-w-3xl w-full shadow-xl overflow-hidden my-auto">
        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E4DFD7] flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#2D6A4F]">
            {target.type === 'resource' ? 'Resource Details & Matched Needs' : 'Need Posting & Matched Resources'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5C6460] hover:bg-[#E4DFD7]/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {loading && <div className="text-sm text-[#5C6460] py-8 text-center">Loading details...</div>}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-lg bg-[#E8F3EC] border border-[#B7DFC5] text-sm text-[#1B4332] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {reportSuccess && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
              Report submitted to the Moderation Queue. Thank you for keeping ReWorth safe.
            </div>
          )}

          {resource && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
                <div className="h-44 md:h-full rounded-xl bg-[#F3EFEA] border border-[#E4DFD7] overflow-hidden flex items-center justify-center">
                  {resource.imageUrl ? (
                    <img
                      src={resource.imageUrl}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-10 h-10 text-[#8A918D]" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-[#2D6A4F]">{resource.category}</span>
                    {resource.isSample && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F6EFE8] text-[#9C6B43] border border-[#E6D6C5]">
                        Sample Data
                      </span>
                    )}
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E4DFD7] capitalize">
                      Status: {resource.status}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-[#1D2420] mb-2">{resource.title}</h2>
                  <p className="text-sm text-[#5C6460] mb-3">{resource.description}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs mb-3">
                    <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E4DFD7]">
                      <div className="text-[#5C6460] text-[10px]">Quantity Available</div>
                      <div className="font-mono-num font-bold text-[#1D2420]">
                        {resource.quantity} {resource.unit}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E4DFD7]">
                      <div className="text-[#5C6460] text-[10px]">Condition</div>
                      <div className="font-semibold text-[#1D2420]">{resource.condition}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E4DFD7]">
                      <div className="text-[#5C6460] text-[10px]">Transfer Terms</div>
                      <div className="font-semibold text-[#1B4332]">
                        {resource.transferType === 'free'
                          ? 'Free Pickup'
                          : resource.transferType === 'exchange'
                            ? 'Exchange / Barter'
                            : `₹${resource.priceAmount} Low-Cost`}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-[#5C6460] space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#2D6A4F]" />
                      <span>
                        <strong>Pickup Area:</strong> {resource.area} · {resource.pickupInstructions}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                      <span>
                        <strong>Availability:</strong> {resource.availability} · Intended disposal:{' '}
                        {resource.disposalDate}
                      </span>
                    </div>
                    <div>
                      <strong>Posted by:</strong> {resource.ownerName} (
                      <span className="capitalize">{resource.ownerAccountType}</span>
                      {resource.ownerOrganization ? ` · ${resource.ownerOrganization}` : ''})
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Notice */}
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E4DFD7] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C6460]">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#9C6B43] shrink-0" />
                  Owner confirmed non-hazardous. Always inspect condition and usability at pickup; no physical delivery is integrated.
                </span>
                <button
                  type="button"
                  onClick={() => setShowReport(!showReport)}
                  className="text-xs font-semibold text-[#991B1B] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" /> Report Unsafe Listing
                </button>
              </div>

              {/* Request Exchange Form */}
              {resource.status === 'available' && currentUser?.id !== resource.ownerId && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRequestExchange(resource.id, null, reqQty, reqNote);
                  }}
                  className="p-4 rounded-xl bg-[#E8F3EC]/55 border border-[#B7DFC5] space-y-3"
                >
                  <div className="text-sm font-bold text-[#1B4332]">Request This Resource</div>
                  <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                        Quantity ({resource.unit})
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={resource.quantity}
                        required
                        value={reqQty}
                        onChange={(e) => setReqQty(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] bg-white text-sm font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                        How will you reuse it &amp; preferred pickup time? *
                      </label>
                      <input
                        type="text"
                        required
                        value={reqNote}
                        onChange={(e) => setReqNote(e.target.value)}
                        placeholder="e.g. Need for college prototype; can pick up Friday 4 PM"
                        className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] bg-white text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-[#1B4332] text-white text-xs font-semibold hover:bg-[#143326] disabled:opacity-50 cursor-pointer"
                  >
                    {submitting
                      ? 'Sending Request...'
                      : currentUser
                        ? 'Send Interest & Coordinate Pickup'
                        : 'Sign In to Request Exchange'}
                  </button>
                </form>
              )}

              {/* Matching Needs */}
              <div>
                <h3 className="text-sm font-bold text-[#1D2420] mb-2">
                  Matching Needs Found by Rule-Based Engine ({matches.length})
                </h3>
                {matches.length === 0 ? (
                  <p className="text-xs text-[#5C6460]">No open needs currently match this resource above threshold.</p>
                ) : (
                  <div className="space-y-2.5">
                    {matches.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl border border-[#E4DFD7] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-num text-xs font-bold px-2 py-0.5 rounded-full bg-[#E8F3EC] text-[#1B4332]">
                              {m.score}% Match
                            </span>
                            <button
                              type="button"
                              onClick={() => onSwitchTarget({ type: 'need', id: m.need.id })}
                              className="text-sm font-semibold text-[#1D2420] hover:text-[#1B4332] cursor-pointer"
                            >
                              {m.need.title}
                            </button>
                          </div>
                          <div className="text-xs text-[#5C6460]">
                            {m.need.requesterName} ({m.need.area}, {m.distanceKm} km) · Needs{' '}
                            {m.need.quantity} {m.need.unit}
                          </div>
                          <div className="text-[11px] text-[#2D6A4F]">
                            {m.reasons.slice(0, 3).join(' · ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {need && (
            <>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#9C6B43]">{need.category}</span>
                    {need.isSample && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F6EFE8] text-[#9C6B43] border border-[#E6D6C5]">
                        Sample Data
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReport(!showReport)}
                    className="text-xs font-semibold text-[#991B1B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" /> Report Need
                  </button>
                </div>

                <h2 className="text-xl font-bold text-[#1D2420] mb-2">{need.title}</h2>
                <p className="text-sm text-[#5C6460] mb-3">{need.description}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs mb-4">
                  <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E4DFD7]">
                    <div className="text-[#5C6460] text-[10px]">Needed Quantity</div>
                    <div className="font-mono-num font-bold text-[#1D2420]">
                      {need.quantity} {need.unit}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E4DFD7]">
                    <div className="text-[#5C6460] text-[10px]">Location</div>
                    <div className="font-semibold text-[#1D2420]">{need.area}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E4DFD7]">
                    <div className="text-[#5C6460] text-[10px]">Deadline</div>
                    <div className="font-semibold text-[#1D2420]">{need.deadline}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E4DFD7]">
                    <div className="text-[#5C6460] text-[10px]">Purpose</div>
                    <div className="font-semibold text-[#1D2420] truncate">{need.purpose}</div>
                  </div>
                </div>
              </div>

              {/* Matching Resources */}
              <div>
                <h3 className="text-sm font-bold text-[#1D2420] mb-2.5">
                  Matching Available Resources ({matches.length})
                </h3>
                {matches.length === 0 ? (
                  <p className="text-xs text-[#5C6460]">No matching available resources found right now.</p>
                ) : (
                  <div className="space-y-3">
                    {matches.map((m) => (
                      <div
                        key={m.id}
                        className="p-4 rounded-xl border border-[#E4DFD7] bg-[#FAF8F5] space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-num text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8F3EC] text-[#1B4332]">
                              {m.score}% Match
                            </span>
                            <button
                              type="button"
                              onClick={() => onSwitchTarget({ type: 'resource', id: m.resource.id })}
                              className="text-sm font-bold text-[#1D2420] hover:text-[#1B4332] cursor-pointer"
                            >
                              {m.resource.title}
                            </button>
                          </div>
                          <span className="text-xs text-[#5C6460]">{m.distanceKm} km away</span>
                        </div>
                        <div className="text-xs text-[#5C6460]">
                          {m.resource.quantity} {m.resource.unit} · {m.resource.condition} ·{' '}
                          {m.resource.area}
                        </div>
                        <div className="text-xs text-[#2D6A4F] space-y-0.5">
                          {m.reasons.map((r, idx) => (
                            <div key={idx}>✓ {r}</div>
                          ))}
                        </div>
                        <div className="pt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => onSwitchTarget({ type: 'resource', id: m.resource.id })}
                            className="px-3 py-1.5 rounded-lg bg-[#1B4332] text-white text-xs font-semibold flex items-center gap-1 hover:bg-[#143326] cursor-pointer"
                          >
                            View &amp; Request <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Inline Report Form */}
          {showReport && (
            <form
              onSubmit={handleSubmitReport}
              className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-3"
            >
              <div className="text-sm font-bold text-red-900">Report Suspicious or Unsafe Listing</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-red-900 mb-1">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-xs"
                  >
                    <option>Unsafe or Hazardous Material</option>
                    <option>Medicines / Pharmaceuticals</option>
                    <option>Misleading Quantity or Condition</option>
                    <option>Spam or Commercial Advertisement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-red-900 mb-1">Details</label>
                  <input
                    type="text"
                    required
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Briefly explain what needs moderator review"
                    className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-red-800 text-white text-xs font-semibold cursor-pointer"
                >
                  Submit Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowReport(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-900 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
