import React, { useState } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Send,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import type { Exchange, ExchangeStatus, User } from '../../../shared/types.ts';
import { api } from '../api.ts';

interface ExchangesViewProps {
  exchanges: Exchange[];
  currentUser: User | null;
  onRequireAuth: () => void;
  onRefresh: () => void;
}

export const ExchangesView: React.FC<ExchangesViewProps> = ({
  exchanges,
  currentUser,
  onRequireAuth,
  onRefresh,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | ExchangeStatus>('all');
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl border border-[#E4DFD7] p-8 text-center max-w-xl mx-auto">
        <ArrowLeftRight className="w-8 h-8 text-[#1B4332] mx-auto mb-2" />
        <h2 className="text-lg font-bold text-[#1D2420] mb-1">Exchange &amp; Handover Tracker</h2>
        <p className="text-sm text-[#5C6460] mb-4">
          Sign in or select a Demo Account (such as Karthik Shetty or Timberline Joinery) to view
          pending requests, accept/reject offers, and coordinate pickup.
        </p>
        <button
          type="button"
          onClick={onRequireAuth}
          className="px-4 py-2 rounded-xl bg-[#1B4332] text-white text-sm font-semibold cursor-pointer"
        >
          Sign In / Choose Demo Account
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
    try {
      await api.updateExchangeStatus(id, nextStatus);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update exchange status.');
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
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'accepted':
        return 'bg-[#E8F3EC] text-[#1B4332] border-[#B7DFC5]';
      case 'completed':
        return 'bg-[#1B4332] text-white border-[#1B4332]';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-50 text-red-800 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#E4DFD7] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1B4332]">Exchange Workflow &amp; Coordination</h1>
          <p className="text-xs text-[#5C6460] mt-1">
            Track requests from Pending → Accepted → Completed. Participants arrange direct local
            pickup; ReWorth does not provide integrated shipping or physical delivery.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'pending', 'accepted', 'completed', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-[#FAF8F5] text-[#5C6460] border border-[#E4DFD7]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4DFD7] p-8 text-center text-sm text-[#5C6460]">
          No exchanges in this state yet.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ex) => {
            const isOwner = ex.ownerId === currentUser.id;
            return (
              <div
                key={ex.id}
                className="bg-white rounded-2xl border border-[#E4DFD7] p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${statusBadge(
                          ex.status
                        )}`}
                      >
                        {ex.status}
                      </span>
                      <span className="text-xs font-medium text-[#2D6A4F]">
                        {isOwner ? 'Incoming Request (You Own Resource)' : 'Outgoing Request'}
                      </span>
                      {ex.isSample && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F6EFE8] text-[#9C6B43] border border-[#E6D6C5]">
                          Sample Data
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[#1D2420]">{ex.resourceTitle}</h3>
                    <div className="text-xs text-[#5C6460] mt-0.5">
                      Owner: <strong>{ex.ownerName}</strong> · Requester:{' '}
                      <strong>{ex.requesterName}</strong> · Quantity:{' '}
                      <strong className="font-mono-num text-[#1D2420]">
                        {ex.requestedQuantity} {ex.unit}
                      </strong>{' '}
                      (est. {ex.estimatedKg} kg)
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div className="flex flex-wrap gap-2">
                    {ex.status === 'pending' && isOwner && (
                      <>
                        <button
                          type="button"
                          disabled={busyId === ex.id}
                          onClick={() => handleStatusChange(ex.id, 'accepted')}
                          className="px-3.5 py-1.5 rounded-lg bg-[#1B4332] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          type="button"
                          disabled={busyId === ex.id}
                          onClick={() => handleStatusChange(ex.id, 'rejected')}
                          className="px-3.5 py-1.5 rounded-lg border border-red-300 text-red-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {ex.status === 'accepted' && (
                      <button
                        type="button"
                        disabled={busyId === ex.id}
                        onClick={() => handleStatusChange(ex.id, 'completed')}
                        className="px-3.5 py-1.5 rounded-lg bg-[#2D6A4F] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Handover Completed
                      </button>
                    )}
                    {(ex.status === 'pending' || ex.status === 'accepted') && (
                      <button
                        type="button"
                        disabled={busyId === ex.id}
                        onClick={() => handleStatusChange(ex.id, 'cancelled')}
                        className="px-3 py-1.5 rounded-lg border border-[#E4DFD7] text-[#5C6460] text-xs font-semibold hover:bg-[#F3EFEA] cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Pickup Details */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E4DFD7] text-xs text-[#5C6460] flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#1D2420]">Pickup Point ({ex.resourceArea}):</strong>{' '}
                    {ex.pickupInstructions}
                  </div>
                </div>

                {/* Coordination Thread */}
                <div className="border-t border-[#E4DFD7] pt-3 space-y-2.5">
                  <div className="text-xs font-semibold text-[#1D2420]">
                    Coordination Messages ({ex.messages?.length ?? 0})
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(ex.messages ?? []).map((msg) => {
                      const mine = msg.senderId === currentUser.id;
                      return (
                        <div
                          key={msg.id}
                          className={`p-2.5 rounded-xl text-xs ${
                            mine
                              ? 'bg-[#E8F3EC] text-[#1D2420] ml-8'
                              : 'bg-[#F3EFEA] text-[#1D2420] mr-8'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-[#5C6460] mb-0.5">
                            <span className="font-semibold">{msg.senderName}</span>
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
                        className="flex-1 px-3 py-2 rounded-xl border border-[#E4DFD7] text-xs focus:outline-none focus:border-[#1B4332]"
                      />
                      <button
                        type="submit"
                        disabled={busyId === ex.id}
                        className="px-3.5 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
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
