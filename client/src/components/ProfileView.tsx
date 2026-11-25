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
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-[#E4DFD7] p-8 text-center">
        <UserIcon className="w-8 h-8 text-[#1B4332] mx-auto mb-2" />
        <h2 className="text-lg font-bold mb-2">No Active Account</h2>
        <button
          type="button"
          onClick={onOpenAuth}
          className="px-4 py-2 rounded-xl bg-[#1B4332] text-white text-sm font-semibold cursor-pointer"
        >
          Sign In / Create Profile
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
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#E4DFD7] p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1B4332]">Your Profile &amp; Matching Area</h1>
          <p className="text-xs text-[#5C6460]">
            Your neighborhood determines distance calculations for nearby opportunities.
          </p>
        </div>
        {user.isDemo && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F6EFE8] text-[#9C6B43] border border-[#E6D6C5]">
            Demo Profile
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}
      {saved && (
        <div className="p-3 rounded-lg bg-[#E8F3EC] border border-[#B7DFC5] text-sm text-[#1B4332] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Profile updated!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Account Type</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm bg-white"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Organization / College</label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Area / Neighborhood</label>
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
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">Material Interests</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_NAMES.map((cat) => {
              const selected = interests.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleInterest(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer ${
                    selected
                      ? 'bg-[#1B4332] text-white border-[#1B4332]'
                      : 'bg-[#FAF8F5] text-[#5C6460] border-[#E4DFD7]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Bio</label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#143326] cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};
