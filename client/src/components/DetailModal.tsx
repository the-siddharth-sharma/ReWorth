import React, { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Flag,
  ArrowRight,
  ArrowLeftRight,
  Package,
} from 'lucide-react';
import { api } from '../api.ts';
import type { MatchResult, Need, Resource, User } from '../../../shared/types.ts';

interface DetailModalProps {
  target: { type: 'resource' | 'need'; id: string } | null;
  allResources?: Resource[];
  currentUser: User | null;
  onClose: () => void;
  onRequireAuth: () => void;
  onExchangeCreated: () => void;
  onSwitchTarget: (target: { type: 'resource' | 'need'; id: string }) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  target,
  allResources = [],
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

  // Two-way barter / trade request form
  const [tradeMode, setTradeMode] = useState<'barter' | 'direct'>('barter');
  const [reqQty, setReqQty] = useState<number>(1);
  const [offeredResourceId, setOfferedResourceId] = useState<string>('');
  const [offeredQty, setOfferedQty] = useState<number>(1);
  const [cashTopUp, setCashTopUp] = useState<number>(0);
  const [reqNote, setReqNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // Report modal inline
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('Unsafe or Hazardous Material');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const myAvailableResources = currentUser
    ? allResources.filter(
        (r) => r.ownerId === currentUser.id && r.status === 'available' && r.id !== resource?.id
      )
    : [];

  const selectedOfferedResource = myAvailableResources.find((r) => r.id === offeredResourceId) ?? null;

  useEffect(() => {
    if (!target) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setShowReport(false);
    setReportSuccess(false);
    setResource(null);
    setNeed(null);
    setCashTopUp(0);
    setImgError(false);

    if (target.type === 'resource') {
      api
        .getResourceDetail(target.id)
        .then((res) => {
          setResource(res.resource);
          setMatches(res.matches);
          setReqQty(Math.min(res.resource.quantity, Math.max(1, Math.round(res.resource.quantity / 2))));
          const ownList = currentUser
            ? allResources.filter(
                (r) => r.ownerId === currentUser.id && r.status === 'available' && r.id !== res.resource.id
              )
            : [];
          if (ownList.length > 0 && res.resource.transferType !== 'free') {
            setTradeMode('barter');
            setOfferedResourceId(ownList[0].id);
            setOfferedQty(Math.min(ownList[0].quantity, Math.max(1, Math.round(ownList[0].quantity / 2))));
          } else {
            setTradeMode(ownList.length > 0 ? 'barter' : 'direct');
            setOfferedResourceId(ownList[0]?.id ?? '');
            setOfferedQty(ownList[0] ? Math.min(ownList[0].quantity, 1) : 1);
          }
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
  }, [target, currentUser, allResources]);

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
      const useBarter = tradeMode === 'barter' && Boolean(offeredResourceId);
      await api.createExchange({
        resourceId,
        needId,
        requestedQuantity: quantity,
        offeredResourceId: useBarter ? offeredResourceId : null,
        offeredQuantity: useBarter ? offeredQty : null,
        cashTopUpAmount: cashTopUp || 0,
        initialNote: note,
      });
      setSuccessMsg(
        useBarter
          ? 'Two-way barter proposal sent! Track counter-offers and OTP handover in the Exchanges tab.'
          : 'Trade request sent! Track acceptance and OTP handover in the Exchanges tab.'
      );
      setReqNote('');
      setCashTopUp(0);
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
    <div className="fixed inset-0 z-50 bg-[#060B18]/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] max-w-3xl w-full shadow-2xl overflow-hidden my-auto">
        <div className="px-6 py-4 bg-[#060B18] text-[#F8FAFC] border-b border-[#1D2740] flex items-center justify-between">
          <div className="font-mono-num text-[11px] font-semibold uppercase tracking-widest text-[#C7DBFF]">
            {target.type === 'resource'
              ? 'RESOURCE DETAILS // TWO-WAY B2B TRADE'
              : 'NEED POSTING // MATCHED SURPLUS'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[2px] text-[#8A94A6] hover:bg-[#0E1528] hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {loading && (
            <div className="font-mono-num text-xs uppercase text-[#5A6475] py-8 text-center">
              LOADING RECORD...
            </div>
          )}
          {error && (
            <div className="p-3 rounded-[2px] bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-[2px] bg-[#ECFDF5] border border-[#A7F3D0] text-sm text-[#047857] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {reportSuccess && (
            <div className="p-3 rounded-[2px] bg-[#FFFBEB] border border-[#FDE68A] text-sm text-[#D97706]">
              Report submitted to the Moderation Queue. Thank you for keeping ReWorth safe.
            </div>
          )}

          {resource && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
                <div className="h-44 md:h-full rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE] overflow-hidden flex items-center justify-center group">
                  {resource.imageUrl && !imgError ? (
                    <img
                      src={resource.imageUrl}
                      alt={resource.title}
                      onError={() => setImgError(true)}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#8A94A6]">
                      <Package className="w-10 h-10 mb-1" />
                      <span className="font-mono-num text-[10px] uppercase">NO IMAGE PROVIDED</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono-num text-[11px] font-semibold uppercase text-[#0052FF]">
                      {resource.category}
                    </span>
                    {resource.isSample && (
                      <span className="font-mono-num text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-[#F5F6F8] text-[#5A6475] border border-[#E2E6EE]">
                        SAMPLE DATA
                      </span>
                    )}
                    <span className="font-mono-num text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                      STATUS: {resource.status}
                    </span>
                  </div>

                  <h2 className="text-xl font-extrabold text-[#0B0F19] mb-2">{resource.title}</h2>
                  <p className="text-sm text-[#5A6475] mb-3">{resource.description}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs mb-3">
                    <div className="p-2.5 rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE]">
                      <div className="font-mono-num text-[#8A94A6] text-[10px] uppercase">
                        QUANTITY AVAILABLE
                      </div>
                      <div className="font-mono-num font-bold text-[#0B0F19] mt-0.5">
                        {resource.quantity} {resource.unit}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE]">
                      <div className="font-mono-num text-[#8A94A6] text-[10px] uppercase">
                        CONDITION
                      </div>
                      <div className="font-semibold text-[#0B0F19] mt-0.5">{resource.condition}</div>
                    </div>
                    <div className="p-2.5 rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE]">
                      <div className="font-mono-num text-[#8A94A6] text-[10px] uppercase">
                        TRANSFER TERMS
                      </div>
                      <div className="font-semibold text-[#0052FF] mt-0.5">
                        {resource.transferType === 'free'
                          ? 'Free Pickup'
                          : resource.transferType === 'exchange'
                            ? 'Exchange / Barter'
                            : `₹${resource.priceAmount} Low-Cost`}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-[#5A6475] space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0052FF]" />
                      <span>
                        <strong className="text-[#0B0F19]">Pickup Area:</strong> {resource.area} ·{' '}
                        {resource.pickupInstructions}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0052FF]" />
                      <span>
                        <strong className="text-[#0B0F19]">Availability:</strong>{' '}
                        {resource.availability} · Intended disposal: {resource.disposalDate}
                      </span>
                    </div>
                    <div>
                      <strong className="text-[#0B0F19]">Posted by:</strong> {resource.ownerName} (
                      <span className="capitalize">{resource.ownerAccountType}</span>
                      {resource.ownerOrganization ? ` · ${resource.ownerOrganization}` : ''})
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Notice */}
              <div className="p-3 rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5A6475]">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#0052FF] shrink-0" />
                  Owner confirmed non-hazardous. Both parties verify a 6-digit OTP at handover before inventory deducts.
                </span>
                <button
                  type="button"
                  onClick={() => setShowReport(!showReport)}
                  className="font-mono-num text-[11px] font-semibold uppercase text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" /> Report Unsafe Listing
                </button>
              </div>

              {/* Two-Way B2B Trade / Request Form */}
              {resource.status === 'available' && currentUser?.id !== resource.ownerId && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRequestExchange(resource.id, null, reqQty, reqNote);
                  }}
                  className="p-4 rounded-[2px] bg-[#EEF4FF] border border-[#C7DBFF] space-y-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-mono-num text-xs font-bold uppercase tracking-wider text-[#0052FF] flex items-center gap-1.5">
                      <ArrowLeftRight className="w-4 h-4" />
                      Propose B2B Barter or Direct Request
                    </div>
                    <div className="flex rounded-[2px] border border-[#C7DBFF] bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() => setTradeMode('barter')}
                        className={`px-2.5 py-1 rounded-[2px] font-mono-num text-[11px] font-semibold uppercase cursor-pointer ${
                          tradeMode === 'barter'
                            ? 'bg-[#0052FF] text-white'
                            : 'text-[#5A6475] hover:text-[#0B0F19]'
                        }`}
                      >
                        Two-Way Barter
                      </button>
                      <button
                        type="button"
                        onClick={() => setTradeMode('direct')}
                        className={`px-2.5 py-1 rounded-[2px] font-mono-num text-[11px] font-semibold uppercase cursor-pointer ${
                          tradeMode === 'direct'
                            ? 'bg-[#0052FF] text-white'
                            : 'text-[#5A6475] hover:text-[#0B0F19]'
                        }`}
                      >
                        Direct Request
                      </button>
                    </div>
                  </div>

                  {/* Requested Quantity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                        You Get: Quantity of {resource.title} ({resource.unit})
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={resource.quantity}
                        required
                        value={reqQty}
                        onChange={(e) => setReqQty(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-[2px] border border-[#C7DBFF] bg-white text-sm font-mono-num focus:outline-none focus:border-[#0052FF]"
                      />
                    </div>
                    <div>
                      <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                        Optional Cash Top-Up Difference (₹)
                      </label>
                      <input
                        type="number"
                        step={50}
                        value={cashTopUp}
                        onChange={(e) => setCashTopUp(Number(e.target.value))}
                        placeholder="0 for pure barter"
                        className="w-full px-3 py-2 rounded-[2px] border border-[#C7DBFF] bg-white text-sm font-mono-num focus:outline-none focus:border-[#0052FF]"
                      />
                      <p className="text-[10px] text-[#5A6475] mt-0.5">
                        Positive = you pay difference · Negative = requesting difference · 0 = pure barter
                      </p>
                    </div>
                  </div>

                  {/* Offered Resource Selector for Two-Way Barter */}
                  {tradeMode === 'barter' && (
                    <div className="p-3 rounded-[2px] bg-white border border-[#C7DBFF] space-y-2.5">
                      <div className="font-mono-num text-[11px] font-bold uppercase text-[#0052FF]">
                        You Give: Select One of Your Active Listings to Trade
                      </div>
                      {!currentUser ? (
                        <p className="text-xs text-[#5A6475]">
                          Sign in to select one of your company’s listings to offer in exchange.
                        </p>
                      ) : myAvailableResources.length === 0 ? (
                        <p className="text-xs text-[#5A6475]">
                          You don’t have any active surplus listings yet. Post a listing first to offer a
                          two-way swap, or switch to Direct Request.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-2.5">
                          <div>
                            <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#5A6475] mb-1">
                              Your Listing to Offer
                            </label>
                            <select
                              value={offeredResourceId}
                              onChange={(e) => {
                                const nextId = e.target.value;
                                setOfferedResourceId(nextId);
                                const found = myAvailableResources.find((r) => r.id === nextId);
                                if (found) setOfferedQty(Math.min(found.quantity, 1));
                              }}
                              className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] bg-white text-xs focus:outline-none focus:border-[#0052FF]"
                            >
                              <option value="">-- Select your surplus listing --</option>
                              {myAvailableResources.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.title} ({r.quantity} {r.unit} available · {r.area})
                                </option>
                              ))}
                            </select>
                          </div>
                          {selectedOfferedResource && (
                            <div>
                              <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#5A6475] mb-1">
                                Offer Qty ({selectedOfferedResource.unit})
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={selectedOfferedResource.quantity}
                                required
                                value={offeredQty}
                                onChange={(e) => setOfferedQty(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] bg-white text-xs font-mono-num focus:outline-none focus:border-[#0052FF]"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Live Side-by-Side Trade Preview */}
                  {tradeMode === 'barter' && selectedOfferedResource && (
                    <div className="p-2.5 rounded-[2px] bg-[#060B18] text-[#F8FAFC] border border-[#1D2740] text-xs flex flex-wrap items-center gap-2">
                      <span className="font-mono-num text-[#C7DBFF]">
                        YOU GIVE: {offeredQty} {selectedOfferedResource.unit} {selectedOfferedResource.title}
                        {cashTopUp > 0 ? ` + ₹${cashTopUp.toLocaleString()}` : ''}
                      </span>
                      <ArrowLeftRight className="w-3.5 h-3.5 text-[#0052FF]" />
                      <span className="font-mono-num text-[#A7F3D0]">
                        YOU GET: {reqQty} {resource.unit} {resource.title}
                        {cashTopUp < 0 ? ` + ₹${Math.abs(cashTopUp).toLocaleString()}` : ''}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                      Trade Terms &amp; Preferred Pickup Window *
                    </label>
                    <input
                      type="text"
                      required
                      value={reqNote}
                      onChange={(e) => setReqNote(e.target.value)}
                      placeholder="e.g. We can swap our surplus cartons this Friday 4 PM at Peenya"
                      className="w-full px-3 py-2 rounded-[2px] border border-[#C7DBFF] bg-white text-sm focus:outline-none focus:border-[#0052FF]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2.5 rounded-[2px] bg-[#0052FF] hover:bg-[#0040CC] text-white font-mono-num text-xs font-semibold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    {submitting
                      ? 'Sending Proposal...'
                      : currentUser
                        ? tradeMode === 'barter' && offeredResourceId
                          ? 'Send Two-Way Barter Proposal ↗'
                          : 'Send Trade Request ↗'
                        : 'Sign In to Propose Trade ↗'}
                  </button>
                </form>
              )}

              {/* Matching Needs */}
              <div>
                <h3 className="font-mono-num text-xs font-bold uppercase tracking-wider text-[#0B0F19] mb-2.5">
                  Matching Needs Found by Rule-Based Engine ({matches.length})
                </h3>
                {matches.length === 0 ? (
                  <p className="text-xs text-[#5A6475]">No open needs currently match this resource above threshold.</p>
                ) : (
                  <div className="space-y-2.5">
                    {matches.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-[2px] border border-[#E2E6EE] bg-[#F5F6F8] flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-num text-[11px] font-bold px-2 py-0.5 rounded-sm bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                              {m.score}% MATCH
                            </span>
                            <button
                              type="button"
                              onClick={() => onSwitchTarget({ type: 'need', id: m.need.id })}
                              className="text-sm font-bold text-[#0B0F19] hover:text-[#0052FF] cursor-pointer"
                            >
                              {m.need.title}
                            </button>
                          </div>
                          <div className="text-xs text-[#5A6475]">
                            {m.need.requesterName} ({m.need.area}, {m.distanceKm} km) · Needs{' '}
                            {m.need.quantity} {m.need.unit}
                          </div>
                          <div className="text-[11px] text-[#047857]">
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
                    <span className="font-mono-num text-xs font-semibold uppercase text-[#0052FF]">
                      {need.category}
                    </span>
                    {need.isSample && (
                      <span className="font-mono-num text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-[#F5F6F8] text-[#5A6475] border border-[#E2E6EE]">
                        SAMPLE DATA
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReport(!showReport)}
                    className="font-mono-num text-[11px] font-semibold uppercase text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" /> Report Need
                  </button>
                </div>

                <h2 className="text-xl font-extrabold text-[#0B0F19] mb-2">{need.title}</h2>
                <p className="text-sm text-[#5A6475] mb-3">{need.description}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs mb-4">
                  <div className="p-2.5 rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE]">
                    <div className="font-mono-num text-[#8A94A6] text-[10px] uppercase">
                      NEEDED QUANTITY
                    </div>
                    <div className="font-mono-num font-bold text-[#0B0F19] mt-0.5">
                      {need.quantity} {need.unit}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE]">
                    <div className="font-mono-num text-[#8A94A6] text-[10px] uppercase">
                      LOCATION
                    </div>
                    <div className="font-semibold text-[#0B0F19] mt-0.5">{need.area}</div>
                  </div>
                  <div className="p-2.5 rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE]">
                    <div className="font-mono-num text-[#8A94A6] text-[10px] uppercase">
                      DEADLINE
                    </div>
                    <div className="font-mono-num font-semibold text-[#0B0F19] mt-0.5">
                      {need.deadline}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE]">
                    <div className="font-mono-num text-[#8A94A6] text-[10px] uppercase">
                      PURPOSE
                    </div>
                    <div className="font-semibold text-[#0B0F19] truncate mt-0.5">{need.purpose}</div>
                  </div>
                </div>
              </div>

              {/* Matching Resources */}
              <div>
                <h3 className="font-mono-num text-xs font-bold uppercase tracking-wider text-[#0B0F19] mb-2.5">
                  Matching Available Resources ({matches.length})
                </h3>
                {matches.length === 0 ? (
                  <p className="text-xs text-[#5A6475]">No matching available resources found right now.</p>
                ) : (
                  <div className="space-y-3">
                    {matches.map((m) => (
                      <div
                        key={m.id}
                        className="p-4 rounded-[2px] border border-[#E2E6EE] bg-[#F5F6F8] space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-num text-[11px] font-bold px-2.5 py-0.5 rounded-sm bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                              {m.score}% MATCH
                            </span>
                            <button
                              type="button"
                              onClick={() => onSwitchTarget({ type: 'resource', id: m.resource.id })}
                              className="text-sm font-bold text-[#0B0F19] hover:text-[#0052FF] cursor-pointer"
                            >
                              {m.resource.title}
                            </button>
                          </div>
                          <span className="font-mono-num text-[11px] uppercase text-[#5A6475]">
                            {m.distanceKm} KM AWAY
                          </span>
                        </div>
                        <div className="text-xs text-[#5A6475]">
                          {m.resource.quantity} {m.resource.unit} · {m.resource.condition} ·{' '}
                          {m.resource.area}
                        </div>
                        <div className="text-xs text-[#047857] space-y-0.5">
                          {m.reasons.map((r, idx) => (
                            <div key={idx}>✓ {r}</div>
                          ))}
                        </div>
                        <div className="pt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => onSwitchTarget({ type: 'resource', id: m.resource.id })}
                            className="px-3.5 py-2 rounded-[2px] bg-[#0B0F19] hover:bg-[#0052FF] text-white font-mono-num text-[11px] font-semibold uppercase flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            View &amp; Propose Trade <ArrowRight className="w-3.5 h-3.5" />
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
              className="p-4 rounded-[2px] bg-red-50/70 border border-red-200 space-y-3"
            >
              <div className="font-mono-num text-xs font-bold uppercase text-red-900">
                Report Suspicious or Unsafe Listing
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-num text-[10px] font-semibold uppercase text-red-900 mb-1">
                    Reason
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-[2px] border border-red-200 bg-white text-xs"
                  >
                    <option>Unsafe or Hazardous Material</option>
                    <option>Medicines / Pharmaceuticals</option>
                    <option>Misleading Quantity or Condition</option>
                    <option>Spam or Commercial Advertisement</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono-num text-[10px] font-semibold uppercase text-red-900 mb-1">
                    Details
                  </label>
                  <input
                    type="text"
                    required
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Briefly explain what needs moderator review"
                    className="w-full px-3 py-2 rounded-[2px] border border-red-200 bg-white text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-[2px] bg-red-800 text-white font-mono-num text-[11px] font-semibold uppercase cursor-pointer"
                >
                  Submit Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowReport(false)}
                  className="px-3.5 py-1.5 rounded-[2px] border border-red-200 font-mono-num text-[11px] font-semibold uppercase text-red-900 cursor-pointer"
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
