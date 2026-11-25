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
      <div className="max-w-2xl mx-auto bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-6 sm:p-8 space-y-4">
        <div className="font-mono-num text-[11px] font-semibold uppercase tracking-widest text-[#0052FF]">
          ( 07 ) TRUST &amp; SAFETY POLICY
        </div>
        <div className="flex items-center gap-2.5 text-[#0B0F19]">
          <ShieldAlert className="w-6 h-6 text-[#0052FF]" />
          <h1 className="text-xl font-extrabold uppercase tracking-tight">
            TRUST, SAFETY &amp; MODERATION
          </h1>
        </div>
        <p className="text-sm text-[#5A6475]">
          ReWorth enforces strict safety rules: hazardous chemicals, medicines/pharmaceuticals,
          medical waste, leaking batteries, and unsafe goods are blocked automatically on submission
          and can be reported by any community member.
        </p>
        <div className="p-4 rounded-[2px] bg-[#F5F6F8] border border-[#E2E6EE] text-xs text-[#5A6475] space-y-3">
          <div>
            <strong className="text-[#0B0F19]">Admin Access Required:</strong> The moderation queue
            is restricted to accounts with the <code className="font-mono-num">admin</code> role.
          </div>
          <button
            type="button"
            onClick={handleSwitchToDemoAdmin}
            className="px-4 py-2.5 rounded-[2px] bg-[#0B0F19] hover:bg-[#0052FF] text-white font-mono-num text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
          >
            Switch to Demo Moderator Account ↗
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-mono-num text-[11px] font-semibold uppercase tracking-widest text-[#0052FF] mb-1">
              ( 07 ) SAFETY AUDIT QUEUE
            </div>
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-[#0B0F19] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0052FF]" />
              ADMIN MODERATION &amp; SAFETY QUEUE
            </h1>
            <p className="text-xs text-[#5A6475] mt-1">
              Review flagged resources/needs, dismiss false positives, or remove unsafe listings.
            </p>
          </div>
          <button
            type="button"
            onClick={loadQueue}
            className="px-3.5 py-2 rounded-[2px] border border-[#E2E6EE] font-mono-num text-[11px] font-semibold uppercase hover:border-[#0B0F19] cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-[2px] bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Reports Queue */}
      <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-5 space-y-3">
        <h2 className="font-mono-num text-xs font-bold uppercase tracking-wider text-[#0B0F19]">
          Flagged Reports ({reports.length})
        </h2>
        {loading ? (
          <div className="font-mono-num text-xs text-[#5A6475]">LOADING REPORTS...</div>
        ) : reports.length === 0 ? (
          <div className="text-xs text-[#5A6475]">No reports submitted yet.</div>
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded-[2px] border border-[#E2E6EE] bg-[#F5F6F8] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-mono-num text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm border ${
                        rep.status === 'open'
                          ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                          : rep.status === 'removed'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                      }`}
                    >
                      {rep.status}
                    </span>
                    <span className="text-xs font-bold text-[#0B0F19]">
                      [{rep.targetType.toUpperCase()}] {rep.targetTitle}
                    </span>
                  </div>
                  <div className="text-xs text-[#5A6475]">
                    <strong className="text-[#0B0F19]">Reason:</strong> {rep.reason} · Reported by{' '}
                    {rep.reporterName}
                  </div>
                  <div className="text-xs text-[#0B0F19]">{rep.details}</div>
                  {rep.moderatorNote && (
                    <div className="text-[11px] text-[#047857]">
                      Moderator note: {rep.moderatorNote}
                    </div>
                  )}
                </div>

                {rep.status === 'open' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleResolve(rep.id, 'dismiss')}
                      className="px-3 py-1.5 rounded-[2px] border border-[#E2E6EE] bg-white font-mono-num text-[11px] font-semibold uppercase text-[#047857] hover:border-[#047857] flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolve(rep.id, 'remove_listing')}
                      className="px-3 py-1.5 rounded-[2px] bg-red-700 hover:bg-red-800 text-white font-mono-num text-[11px] font-semibold uppercase flex items-center gap-1 cursor-pointer"
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
      <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-5 space-y-3">
        <h2 className="font-mono-num text-xs font-bold uppercase tracking-wider text-[#0B0F19]">
          Listing Audit ({resources.length} Resources, {needs.length} Needs)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E2E6EE] font-mono-num text-[10px] uppercase text-[#8A94A6]">
              <tr>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Owner</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E6EE]">
              {resources.map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5 pr-3 font-mono-num text-[11px] font-semibold text-[#047857]">
                    RESOURCE
                  </td>
                  <td className="py-2.5 pr-3 font-semibold text-[#0B0F19]">{r.title}</td>
                  <td className="py-2.5 pr-3 text-[#5A6475]">{r.ownerName}</td>
                  <td className="py-2.5 pr-3 font-mono-num text-[11px] uppercase">{r.status}</td>
                  <td className="py-2.5 text-right">
                    {r.status !== 'removed' && (
                      <button
                        type="button"
                        onClick={() => handleDirectRemove('resource', r.id)}
                        className="font-mono-num text-[11px] uppercase text-red-700 font-semibold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {needs.map((n) => (
                <tr key={n.id}>
                  <td className="py-2.5 pr-3 font-mono-num text-[11px] font-semibold text-[#0052FF]">
                    NEED
                  </td>
                  <td className="py-2.5 pr-3 font-semibold text-[#0B0F19]">{n.title}</td>
                  <td className="py-2.5 pr-3 text-[#5A6475]">{n.requesterName}</td>
                  <td className="py-2.5 pr-3 font-mono-num text-[11px] uppercase">{n.status}</td>
                  <td className="py-2.5 text-right">
                    {n.status !== 'removed' && (
                      <button
                        type="button"
                        onClick={() => handleDirectRemove('need', n.id)}
                        className="font-mono-num text-[11px] uppercase text-red-700 font-semibold hover:underline cursor-pointer"
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
