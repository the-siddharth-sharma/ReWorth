import React, { useEffect, useState } from 'react';
import { ShieldAlert, Check, Trash2, ShieldCheck } from 'lucide-react';
import type { Need, Report, Resource, User } from '../../../shared/types.ts';
import { api, setStoredToken } from '../api.ts';

interface ModerationViewProps {
  currentUser: User | null;
  onUserChanged: (user: User) => void;
  onListingsChanged: () => void;
}

export const ModerationView: React.FC<ModerationViewProps> = ({
  currentUser,
  onUserChanged,
  onListingsChanged,
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    setLoading(true);
    setError(null);
    api
      .getModerationQueue()
      .then((res) => {
        setReports(res.reports);
        setResources(res.allResources);
        setNeeds(res.allNeeds);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load queue.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQueue();
  }, [currentUser]);

  const handleSwitchToDemoAdmin = async () => {
    try {
      const res = await api.loginDemo('demo-admin');
      setStoredToken(res.token);
      onUserChanged(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not switch to demo moderator.');
    }
  };

  const handleResolve = async (id: string, action: 'dismiss' | 'remove_listing') => {
    try {
      await api.resolveReport(
        id,
        action,
        action === 'remove_listing'
          ? 'Removed by moderator for safety/policy review'
          : 'Reviewed and cleared by moderator'
      );
      loadQueue();
      onListingsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve report.');
    }
  };

  const handleDirectRemove = async (type: 'resource' | 'need', id: string) => {
    try {
      await api.removeListingDirectly(type, id, 'Removed during admin audit');
      loadQueue();
      onListingsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove listing.');
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#E4DFD7] p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-[#1B4332]">
          <ShieldAlert className="w-6 h-6" />
          <h1 className="text-xl font-bold">Trust, Safety &amp; Moderation</h1>
        </div>
        <p className="text-sm text-[#5C6460]">
          ReWorth enforces strict safety rules: hazardous chemicals, medicines/pharmaceuticals,
          medical waste, leaking batteries, and unsafe goods are blocked automatically on submission
          and can be reported by any community member.
        </p>
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E4DFD7] text-xs text-[#5C6460] space-y-2">
          <div>
            <strong>Admin Access Required:</strong> The moderation queue is restricted to accounts
            with the <code className="font-mono-num">admin</code> role.
          </div>
          <button
            type="button"
            onClick={handleSwitchToDemoAdmin}
            className="px-4 py-2 rounded-lg bg-[#1B4332] text-white text-xs font-semibold hover:bg-[#143326] cursor-pointer"
          >
            Switch to Demo Moderator Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#E4DFD7] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#1B4332] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Admin Moderation &amp; Safety Queue
            </h1>
            <p className="text-xs text-[#5C6460] mt-1">
              Review flagged resources/needs, dismiss false positives, or remove unsafe listings.
            </p>
          </div>
          <button
            type="button"
            onClick={loadQueue}
            className="px-3 py-1.5 rounded-lg border border-[#E4DFD7] text-xs font-semibold hover:bg-[#F3EFEA] cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Reports Queue */}
      <div className="bg-white rounded-2xl border border-[#E4DFD7] p-5 space-y-3">
        <h2 className="text-base font-bold text-[#1D2420]">
          Flagged Reports ({reports.length})
        </h2>
        {loading ? (
          <div className="text-xs text-[#5C6460]">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="text-xs text-[#5C6460]">No reports submitted yet.</div>
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded-xl border border-[#E4DFD7] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        rep.status === 'open'
                          ? 'bg-amber-100 text-amber-900'
                          : rep.status === 'removed'
                            ? 'bg-red-100 text-red-900'
                            : 'bg-[#E8F3EC] text-[#1B4332]'
                      }`}
                    >
                      {rep.status}
                    </span>
                    <span className="text-xs font-semibold text-[#1D2420]">
                      [{rep.targetType}] {rep.targetTitle}
                    </span>
                  </div>
                  <div className="text-xs text-[#5C6460]">
                    <strong>Reason:</strong> {rep.reason} · Reported by {rep.reporterName}
                  </div>
                  <div className="text-xs text-[#1D2420]">{rep.details}</div>
                  {rep.moderatorNote && (
                    <div className="text-[11px] text-[#2D6A4F]">
                      Moderator note: {rep.moderatorNote}
                    </div>
                  )}
                </div>

                {rep.status === 'open' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleResolve(rep.id, 'dismiss')}
                      className="px-3 py-1.5 rounded-lg border border-[#E4DFD7] bg-white text-xs font-semibold text-[#1B4332] flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolve(rep.id, 'remove_listing')}
                      className="px-3 py-1.5 rounded-lg bg-red-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Listing
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit All Active Listings */}
      <div className="bg-white rounded-2xl border border-[#E4DFD7] p-5 space-y-3">
        <h2 className="text-base font-bold text-[#1D2420]">
          Listing Audit ({resources.length} Resources, {needs.length} Needs)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E4DFD7] text-[#5C6460]">
              <tr>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Owner</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4DFD7]">
              {resources.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 pr-3 font-medium text-[#2D6A4F]">Resource</td>
                  <td className="py-2 pr-3 font-semibold text-[#1D2420]">{r.title}</td>
                  <td className="py-2 pr-3 text-[#5C6460]">{r.ownerName}</td>
                  <td className="py-2 pr-3 capitalize">{r.status}</td>
                  <td className="py-2 text-right">
                    {r.status !== 'removed' && (
                      <button
                        type="button"
                        onClick={() => handleDirectRemove('resource', r.id)}
                        className="text-red-800 font-semibold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {needs.map((n) => (
                <tr key={n.id}>
                  <td className="py-2 pr-3 font-medium text-[#9C6B43]">Need</td>
                  <td className="py-2 pr-3 font-semibold text-[#1D2420]">{n.title}</td>
                  <td className="py-2 pr-3 text-[#5C6460]">{n.requesterName}</td>
                  <td className="py-2 pr-3 capitalize">{n.status}</td>
                  <td className="py-2 text-right">
                    {n.status !== 'removed' && (
                      <button
                        type="button"
                        onClick={() => handleDirectRemove('need', n.id)}
                        className="text-red-800 font-semibold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
