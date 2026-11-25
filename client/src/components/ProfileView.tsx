import React, { useState } from 'react';
import { CheckCircle2, User as UserIcon } from 'lucide-react';
import { ACCOUNT_TYPES, AREA_HUBS, CATEGORY_NAMES } from '../../../shared/constants.ts';
import type { AccountType, ResourceCategory, User } from '../../../shared/types.ts';
import { api } from '../api.ts';

interface ProfileViewProps {
  user: User | null;
  onUpdated: (user: User) => void;
  onOpenAuth: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdated, onOpenAuth }) => {
  const [name, setName] = useState(user?.name ?? '');
  const [accountType, setAccountType] = useState<AccountType>(user?.accountType ?? 'individual');
  const [organization, setOrganization] = useState(user?.organization ?? '');
  const [area, setArea] = useState(user?.area ?? AREA_HUBS[0].name);
  const [interests, setInterests] = useState<ResourceCategory[]>(user?.interests ?? []);
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-8 text-center">
        <UserIcon className="w-8 h-8 text-[#0052FF] mx-auto mb-2" />
        <h2 className="text-lg font-extrabold uppercase text-[#0B0F19] mb-3">NO ACTIVE ACCOUNT</h2>
        <button
          type="button"
          onClick={onOpenAuth}
          className="px-5 py-2.5 rounded-[2px] bg-[#0B0F19] hover:bg-[#0052FF] text-white font-mono-num text-xs font-semibold uppercase cursor-pointer"
        >
          Sign In / Create Profile ↗
        </button>
      </div>
    );
  }

  const toggleInterest = (cat: ResourceCategory) => {
    setInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await api.updateMe({
        name,
        accountType,
        organization,
        area,
        interests,
        bio,
      });
      onUpdated(res.user);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] p-6 sm:p-8 space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E6EE]">
        <div>
          <div className="font-mono-num text-[11px] font-semibold uppercase tracking-widest text-[#0052FF] mb-0.5">
            ACCOUNT CONFIGURATION
          </div>
          <h1 className="text-xl font-extrabold uppercase tracking-tight text-[#0B0F19]">
            PROFILE &amp; MATCHING AREA
          </h1>
          <p className="text-xs text-[#5A6475] mt-0.5">
            Your neighborhood determines Haversine distance calculations for nearby opportunities.
          </p>
        </div>
        {user.isDemo && (
          <span className="font-mono-num text-[10px] font-semibold uppercase px-2.5 py-1 rounded-sm bg-[#EEF4FF] text-[#0052FF] border border-[#C7DBFF]">
            DEMO PROFILE
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-[2px] bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}
      {saved && (
        <div className="p-3 rounded-[2px] bg-[#ECFDF5] border border-[#A7F3D0] text-sm text-[#047857] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Profile updated!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1">
              Display Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm focus:outline-none focus:border-[#0052FF]"
            />
          </div>
          <div>
            <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1">
              Account Type
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm bg-white focus:outline-none focus:border-[#0052FF]"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1">
              Organization / College
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm focus:outline-none focus:border-[#0052FF]"
            />
          </div>
          <div>
            <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1">
              Area / Neighborhood
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
        </div>

        <div>
          <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1.5">
            Material Interests
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_NAMES.map((cat) => {
              const selected = interests.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleInterest(cat)}
                  className={`px-2.5 py-1 rounded-[2px] font-mono-num text-[10px] font-semibold uppercase border cursor-pointer ${
                    selected
                      ? 'bg-[#0052FF] text-white border-[#0052FF]'
                      : 'bg-[#F5F6F8] text-[#5A6475] border-[#E2E6EE] hover:border-[#0B0F19]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[#0B0F19] mb-1">
            Bio
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm focus:outline-none focus:border-[#0052FF]"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-[2px] bg-[#0B0F19] hover:bg-[#0052FF] text-white font-mono-num text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};
