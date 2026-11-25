import React, { useState } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Send,
  MapPin,
  AlertCircle,
  Repeat,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import type { Exchange, ExchangeStatus, Resource, User } from '../../../shared/types.ts';
import { api } from '../api.ts';

interface ExchangesViewProps {
  exchanges: Exchange[];
  allResources?: Resource[];
  currentUser: User | null;
  onRequireAuth: () => void;
  onRefresh: () => void;
}

interface CounterDraft {
  requestedQuantity: number;
  offeredResourceId: string;
  offeredQuantity: number;
  cashTopUpAmount: number;
  note: string;
}

export const ExchangesView: React.FC<ExchangesViewProps> = ({
  exchanges,
  allResources = [],
  currentUser,
  onRequireAuth,
  onRefresh,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | ExchangeStatus>('all');
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [otpDrafts, setOtpDrafts] = useState<Record<string, string>>({});
  const [counterOpenId, setCounterOpenId] = useState<string | null>(null);
  const [counterDraft, setCounterDraft] = useState<CounterDraft | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-8 text-center max-w-xl mx-auto">
        <ArrowLeftRight className="w-8 h-8 text-[#0052FF] mx-auto mb-3" />
        <div className="font-mono-num text-[11px] uppercase tracking-widest text-[#8A94A6] mb-1">
          ( 05 ) B2B BARTER &amp; HANDOVER TRACKER
        </div>
        <h2 className="text-lg font-extrabold uppercase text-[#0B0F19] mb-2">
          SIGN IN TO ACCESS EXCHANGES
        </h2>
        <p className="text-sm text-[#5A6475] mb-5">
          Sign in or select a Demo Account (such as Karthik Shetty or Timberline Joinery) to view
          two-way trade proposals, negotiate counter-offers, and confirm OTP handovers.
        </p>
        <button
          type="button"
          onClick={onRequireAuth}
          className="px-5 py-2.5 rounded-[2px] bg-[#0B0F19] hover:bg-[#0052FF] text-white font-mono-num text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
        >
          Sign In / Choose Demo Account ↗
        </button>
      </div>
    );
  }

  const filtered = exchanges.filter((ex) =>
    statusFilter === 'all' ? true : ex.status === statusFilter
  );

  const handleStatusChange = async (id: string, nextStatus: ExchangeStatus) => {
    setBusyId(id);
    setError(null);
    setInfoMsg(null);
    try {
      await api.updateExchangeStatus(id, nextStatus);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update exchange status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmHandover = async (e: React.FormEvent, ex: Exchange) => {
    e.preventDefault();
    const otp = (otpDrafts[ex.id] ?? '').trim();
    if (!otp) {
      setError('Enter the 6-digit handover OTP to confirm.');
      return;
    }
    setBusyId(ex.id);
    setError(null);
    setInfoMsg(null);
    try {
      const res = await api.confirmExchangeHandover(ex.id, otp);
      setOtpDrafts((prev) => ({ ...prev, [ex.id]: '' }));
      setInfoMsg(
        res.awaitingCounterparty
          ? 'Your handover confirmation is recorded! Waiting for the other company to verify the OTP.'
          : 'Both companies verified the handover OTP! Inventories have been updated atomically.'
      );
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm handover.');
    } finally {
      setBusyId(null);
    }
  };

  const openCounterForm = (ex: Exchange) => {
    setCounterOpenId(ex.id);
    setCounterDraft({
      requestedQuantity: ex.requestedQuantity,
      offeredResourceId: ex.offeredResourceId ?? '',
      offeredQuantity: ex.offeredQuantity ?? 1,
      cashTopUpAmount: ex.cashTopUpAmount ?? 0,
      note: '',
    });
    setError(null);
  };

  const handleSubmitCounter = async (e: React.FormEvent, ex: Exchange) => {
    e.preventDefault();
    if (!counterDraft) return;
    setBusyId(ex.id);
    setError(null);
    setInfoMsg(null);
    try {
      await api.counterExchange(ex.id, {
        requestedQuantity: counterDraft.requestedQuantity,
        offeredResourceId: counterDraft.offeredResourceId || null,
        offeredQuantity: counterDraft.offeredResourceId ? counterDraft.offeredQuantity : null,
        cashTopUpAmount: counterDraft.cashTopUpAmount,
        note: counterDraft.note,
      });
      setCounterOpenId(null);
      setCounterDraft(null);
      setInfoMsg('Counter-offer sent! Waiting for the other company to respond.');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit counter-offer.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent, exchangeId: string) => {
    e.preventDefault();
    const text = (messageDrafts[exchangeId] ?? '').trim();
    if (!text) return;
    setBusyId(exchangeId);
    setError(null);
    try {
      await api.sendExchangeMessage(exchangeId, text);
      setMessageDrafts((prev) => ({ ...prev, [exchangeId]: '' }));
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setBusyId(null);
    }
  };

  const statusBadge = (status: ExchangeStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
      case 'countered':
        return 'bg-[#EEF4FF] text-[#0052FF] border-[#C7DBFF]';
      case 'accepted':
        return 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]';
      case 'completed':
        return 'bg-[#060B18] text-[#F8FAFC] border-[#1D2740]';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-50 text-red-800 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="font-mono-num text-[11px] font-semibold uppercase tracking-widest text-[#0052FF] mb-1">
            ( 05 ) TWO-WAY NEGOTIATION &amp; OTP HANDOVER
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-[#0B0F19]">
            B2B BARTER &amp; <span className="text-[#0052FF]">EXCHANGES</span>
          </h1>
          <p className="text-xs text-[#5A6475] mt-1">
            Negotiate two-way swaps (Pending ↔ Countered → Accepted → Dual-OTP Completed). Both
            companies verify a shared 6-digit OTP before inventories deduct.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'pending', 'countered', 'accepted', 'completed', 'cancelled'] as const).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-[2px] font-mono-num text-[11px] font-semibold uppercase tracking-wider cursor-pointer border transition-colors ${
                  statusFilter === st
                    ? 'bg-[#0B0F19] text-white border-[#0B0F19]'
                    : 'bg-[#F5F6F8] text-[#5A6475] border-[#E2E6EE] hover:border-[#0B0F19]'
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-[2px] bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {infoMsg && (
        <div className="p-3.5 rounded-[2px] bg-[#ECFDF5] border border-[#A7F3D0] text-sm text-[#047857] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{infoMsg}</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-[#F5F6F8] rounded-[2px] border border-[#E2E6EE] p-8 text-center text-sm text-[#5A6475]">
          No exchanges in this state yet.
        </div>
      ) : (
        <div className="bg-[#F5F6F8] border border-[#E2E6EE] p-4 rounded-[2px] space-y-4">
          {filtered.map((ex, idx) => {
            const isOwner = ex.ownerId === currentUser.id;
            const canRespondToCounter =
              ex.status === 'countered' && ex.lastCounterBy !== currentUser.id;
            const awaitingMyAction = (ex.status === 'pending' && isOwner) || canRespondToCounter;
            const myConfirmed = isOwner ? ex.ownerConfirmed : ex.requesterConfirmed;
            const requesterListings = allResources.filter(
              (r) => r.ownerId === ex.requesterId && r.status === 'available' && r.id !== ex.resourceId
            );

            // Side-by-side You Give vs You Get
            const cashAmt = ex.cashTopUpAmount ?? 0;
            const youGiveTitle = isOwner
              ? ex.resourceTitle
              : ex.offeredResourceTitle ?? 'No item offered (Direct Request)';
            const youGiveQty = isOwner
              ? `${ex.requestedQuantity} ${ex.unit}`
              : ex.offeredResourceId && ex.offeredQuantity
                ? `${ex.offeredQuantity} ${ex.offeredUnit ?? 'units'}`
                : '—';
            const youGiveCash =
              (isOwner && cashAmt < 0) || (!isOwner && cashAmt > 0)
                ? `+ ₹${Math.abs(cashAmt).toLocaleString()} cash top-up`
                : null;

            const youGetTitle = isOwner
              ? ex.offeredResourceTitle ?? 'Direct Pickup Request (No swap item)'
              : ex.resourceTitle;
            const youGetQty = isOwner
              ? ex.offeredResourceId && ex.offeredQuantity
                ? `${ex.offeredQuantity} ${ex.offeredUnit ?? 'units'}`
                : '—'
              : `${ex.requestedQuantity} ${ex.unit}`;
            const youGetCash =
              (isOwner && cashAmt > 0) || (!isOwner && cashAmt < 0)
                ? `+ ₹${Math.abs(cashAmt).toLocaleString()} cash top-up`
                : null;

            return (
              <div
                key={ex.id}
                className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-5 space-y-4"
              >
                {/* Header & Action Buttons */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#E2E6EE]">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-mono-num text-[10px] font-semibold text-[#8A94A6]">
                        {String(idx + 1).padStart(2, '0')} //
                      </span>
                      <span
                        className={`font-mono-num text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-sm border ${statusBadge(
                          ex.status
                        )}`}
                      >
                        {ex.status}
                      </span>
                      <span className="font-mono-num text-[11px] font-semibold uppercase text-[#0052FF]">
                        {ex.offeredResourceId ? 'TWO-WAY BARTER' : 'DIRECT REQUEST'} ·{' '}
                        {isOwner ? `FROM ${ex.requesterName}` : `WITH ${ex.ownerName}`}
                      </span>
                      {ex.status === 'countered' && (
                        <span className="font-mono-num text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-[#EEF4FF] text-[#0052FF] border border-[#C7DBFF]">
                          {canRespondToCounter
                            ? 'COUNTER AWAITING DECISION'
                            : 'COUNTER SENT — AWAITING'}
                        </span>
                      )}
                      {ex.isSample && (
                        <span className="font-mono-num text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-[#F5F6F8] text-[#5A6475] border border-[#E2E6EE]">
                          SAMPLE DATA
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#5A6475]">
                      Owner: <strong className="text-[#0B0F19]">{ex.ownerName}</strong> · Requester:{' '}
                      <strong className="text-[#0B0F19]">{ex.requesterName}</strong> · Est. Circular Impact:{' '}
                      <strong className="font-mono-num text-[#0B0F19]">{ex.estimatedKg} kg</strong>
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div className="flex flex-wrap gap-2">
                    {awaitingMyAction && (
                      <>
                        <button
                          type="button"
                          disabled={busyId === ex.id}
                          onClick={() => handleStatusChange(ex.id, 'accepted')}
                          className="px-3.5 py-1.5 rounded-[2px] bg-[#0B0F19] hover:bg-[#10B981] text-white font-mono-num text-[11px] font-semibold uppercase flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {ex.status === 'countered' ? 'Accept Counter' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === ex.id}
                          onClick={() => openCounterForm(ex)}
                          className="px-3.5 py-1.5 rounded-[2px] bg-[#0052FF] hover:bg-[#0040CC] text-white font-mono-num text-[11px] font-semibold uppercase flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Repeat className="w-3.5 h-3.5" /> Counter-Offer
                        </button>
                        <button
                          type="button"
                          disabled={busyId === ex.id}
                          onClick={() => handleStatusChange(ex.id, 'rejected')}
                          className="px-3.5 py-1.5 rounded-[2px] border border-red-300 text-red-800 font-mono-num text-[11px] font-semibold uppercase flex items-center gap-1 cursor-pointer hover:bg-red-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {(ex.status === 'pending' ||
                      ex.status === 'countered' ||
                      ex.status === 'accepted') && (
                      <button
                        type="button"
                        disabled={busyId === ex.id}
                        onClick={() => handleStatusChange(ex.id, 'cancelled')}
                        className="px-3 py-1.5 rounded-[2px] border border-[#E2E6EE] text-[#5A6475] font-mono-num text-[11px] font-semibold uppercase hover:border-[#0B0F19] hover:text-[#0B0F19] cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Side-by-Side "You Give ↔ You Get" Barter Card */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3 p-3.5 rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE]">
                  <div className="p-3.5 rounded-[2px] bg-[#FFFFFF] border border-[#E2E6EE]">
                    <div className="font-mono-num text-[10px] font-bold uppercase tracking-wider text-[#5A6475] mb-1">
                      YOU GIVE
                    </div>
                    <div className="text-sm font-bold text-[#0B0F19]">{youGiveTitle}</div>
                    <div className="text-xs font-mono-num text-[#5A6475] mt-0.5">{youGiveQty}</div>
                    {youGiveCash && (
                      <div className="mt-1.5 inline-block font-mono-num text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                        {youGiveCash}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-[2px] bg-[#EEF4FF] border border-[#C7DBFF] flex items-center justify-center text-[#0052FF]">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-[2px] bg-[#FFFFFF] border border-[#E2E6EE]">
                    <div className="font-mono-num text-[10px] font-bold uppercase tracking-wider text-[#0052FF] mb-1">
                      YOU GET
                    </div>
                    <div className="text-sm font-bold text-[#0B0F19]">{youGetTitle}</div>
                    <div className="text-xs font-mono-num text-[#5A6475] mt-0.5">{youGetQty}</div>
                    {youGetCash && (
                      <div className="mt-1.5 inline-block font-mono-num text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                        {youGetCash}
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Counter-Offer Form */}
                {counterOpenId === ex.id && counterDraft && (
                  <form
                    onSubmit={(e) => handleSubmitCounter(e, ex)}
                    className="p-4 rounded-[2px] bg-[#EEF4FF] border border-[#C7DBFF] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-mono-num text-xs font-bold uppercase tracking-wider text-[#0052FF] flex items-center gap-1.5">
                        <Repeat className="w-4 h-4" /> Submit Counter-Offer Terms
                      </div>
                      <button
                        type="button"
                        onClick={() => setCounterOpenId(null)}
                        className="font-mono-num text-[11px] uppercase text-[#0052FF] hover:underline cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                          Target Qty ({ex.unit} of {ex.resourceTitle})
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={counterDraft.requestedQuantity}
                          onChange={(e) =>
                            setCounterDraft({
                              ...counterDraft,
                              requestedQuantity: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-[2px] border border-[#C7DBFF] bg-white text-xs font-mono-num focus:outline-none focus:border-[#0052FF]"
                        />
                      </div>

                      <div>
                        <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                          Requester’s Barter Item
                        </label>
                        <select
                          value={counterDraft.offeredResourceId}
                          onChange={(e) =>
                            setCounterDraft({
                              ...counterDraft,
                              offeredResourceId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-[2px] border border-[#C7DBFF] bg-white text-xs focus:outline-none focus:border-[#0052FF]"
                        >
                          <option value="">No swap item (Direct)</option>
                          {requesterListings.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.title} ({r.quantity} {r.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                          Offered Item Qty
                        </label>
                        <input
                          type="number"
                          min={1}
                          disabled={!counterDraft.offeredResourceId}
                          value={counterDraft.offeredQuantity}
                          onChange={(e) =>
                            setCounterDraft({
                              ...counterDraft,
                              offeredQuantity: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-[2px] border border-[#C7DBFF] bg-white text-xs font-mono-num disabled:opacity-50 focus:outline-none focus:border-[#0052FF]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3">
                      <div>
                        <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                          Cash Top-Up (₹)
                        </label>
                        <input
                          type="number"
                          step={50}
                          value={counterDraft.cashTopUpAmount}
                          onChange={(e) =>
                            setCounterDraft({
                              ...counterDraft,
                              cashTopUpAmount: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-[2px] border border-[#C7DBFF] bg-white text-xs font-mono-num focus:outline-none focus:border-[#0052FF]"
                        />
                      </div>
                      <div>
                        <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                          Counter-Offer Note
                        </label>
                        <input
                          type="text"
                          value={counterDraft.note}
                          onChange={(e) =>
                            setCounterDraft({ ...counterDraft, note: e.target.value })
                          }
                          placeholder="Explain your proposed adjustment..."
                          className="w-full px-3 py-1.5 rounded-[2px] border border-[#C7DBFF] bg-white text-xs focus:outline-none focus:border-[#0052FF]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={busyId === ex.id}
                      className="px-4 py-2 rounded-[2px] bg-[#0052FF] hover:bg-[#0040CC] text-white font-mono-num text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      Send Counter-Offer
                    </button>
                  </form>
                )}

                {/* Dual Handover Confirmation + 6-Digit OTP Box */}
                {ex.status === 'accepted' && (
                  <div className="p-4 rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-mono-num text-xs font-bold uppercase tracking-wider text-[#0B0F19] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#0052FF]" />
                        Dual Handover Confirmation Required
                      </div>
                      {ex.handoverOtp && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[#060B18] border border-[#1D2740] text-xs">
                          <KeyRound className="w-3.5 h-3.5 text-[#10B981]" />
                          <span className="font-mono-num text-[10px] uppercase text-[#8A94A6]">
                            HANDOVER OTP:
                          </span>
                          <span className="font-mono-num font-bold tracking-widest text-[#F8FAFC]">
                            {ex.handoverOtp}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span
                        className={`px-2.5 py-1 rounded-sm border font-mono-num text-[11px] font-semibold ${
                          ex.ownerConfirmed
                            ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                            : 'bg-[#FFFFFF] text-[#5A6475] border-[#E2E6EE]'
                        }`}
                      >
                        {ex.ownerConfirmed ? '✓' : '○'} {ex.ownerName} (OWNER)
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-sm border font-mono-num text-[11px] font-semibold ${
                          ex.requesterConfirmed
                            ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                            : 'bg-[#FFFFFF] text-[#5A6475] border-[#E2E6EE]'
                        }`}
                      >
                        {ex.requesterConfirmed ? '✓' : '○'} {ex.requesterName} (REQUESTER)
                      </span>
                    </div>

                    {myConfirmed ? (
                      <div className="text-xs font-medium text-[#047857]">
                        ✓ You verified the handover OTP. Waiting for the other company to confirm so
                        both inventories update atomically.
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => handleConfirmHandover(e, ex)}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otpDrafts[ex.id] ?? ''}
                          onChange={(e) =>
                            setOtpDrafts((prev) => ({ ...prev, [ex.id]: e.target.value }))
                          }
                          placeholder="Enter 6-digit OTP"
                          className="w-44 px-3 py-2 rounded-[2px] border border-[#E2E6EE] bg-[#FFFFFF] text-xs font-mono-num tracking-widest focus:outline-none focus:border-[#0052FF]"
                        />
                        <button
                          type="submit"
                          disabled={busyId === ex.id}
                          className="px-4 py-2 rounded-[2px] bg-[#0B0F19] hover:bg-[#0052FF] text-white font-mono-num text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verify OTP &amp; Confirm Handover
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Pickup Details */}
                <div className="p-3 rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE] text-xs text-[#5A6475] flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#0052FF] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0B0F19]">Pickup Point ({ex.resourceArea}):</strong>{' '}
                    {ex.pickupInstructions}
                  </div>
                </div>

                {/* Coordination Thread */}
                <div className="border-t border-[#E2E6EE] pt-3 space-y-2.5">
                  <div className="font-mono-num text-[11px] font-semibold uppercase tracking-wider text-[#0B0F19]">
                    Coordination Messages ({ex.messages?.length ?? 0})
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(ex.messages ?? []).map((msg) => {
                      const mine = msg.senderId === currentUser.id;
                      return (
                        <div
                          key={msg.id}
                          className={`p-2.5 rounded-[2px] border text-xs ${
                            mine
                              ? 'bg-[#EEF4FF] border-[#C7DBFF] text-[#0B0F19] ml-8'
                              : 'bg-[#F5F6F8] border-[#E2E6EE] text-[#0B0F19] mr-8'
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono-num text-[10px] text-[#5A6475] mb-0.5">
                            <span className="font-semibold text-[#0B0F19]">{msg.senderName}</span>
                            <span>{new Date(msg.createdAt).toLocaleString()}</span>
                          </div>
                          <div>{msg.body}</div>
                        </div>
                      );
                    })}
                  </div>

                  {ex.status !== 'cancelled' && ex.status !== 'rejected' && (
                    <form
                      onSubmit={(e) => handleSendMessage(e, ex.id)}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={messageDrafts[ex.id] ?? ''}
                        onChange={(e) =>
                          setMessageDrafts((prev) => ({ ...prev, [ex.id]: e.target.value }))
                        }
                        placeholder="Coordinate pickup time, contact point, or inspect notes..."
                        className="flex-1 px-3 py-2 rounded-[2px] border border-[#E2E6EE] bg-[#FFFFFF] text-xs focus:outline-none focus:border-[#0052FF]"
                      />
                      <button
                        type="submit"
                        disabled={busyId === ex.id}
                        className="px-4 py-2 rounded-[2px] bg-[#0B0F19] hover:bg-[#0052FF] text-white font-mono-num text-xs font-semibold uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" /> Send
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
