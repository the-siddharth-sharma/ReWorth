import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Building2, GraduationCap, Users, User as UserIcon } from 'lucide-react';
import { api, setStoredToken } from '../api.ts';
import { ACCOUNT_TYPES, AREA_HUBS, CATEGORY_NAMES } from '../../../shared/constants.ts';
import type { AccountType, ResourceCategory, User } from '../../../shared/types.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthenticated }) => {
  const [mode, setMode] = useState<'demo' | 'login' | 'register'>('demo');
  const [demoAccounts, setDemoAccounts] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('student');
  const [organization, setOrganization] = useState('');
  const [area, setArea] = useState(AREA_HUBS[0].name);
  const [interests, setInterests] = useState<ResourceCategory[]>(['Textiles & Fabric']);
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    api
      .getDemoAccounts()
      .then((res) => setDemoAccounts(res.accounts))
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDemoLogin = async (demoUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.loginDemo(demoUserId);
      setStoredToken(res.token);
      onAuthenticated(res.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(loginEmail, loginPassword);
      setStoredToken(res.token);
      onAuthenticated(res.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.register({
        name,
        email,
        password,
        accountType,
        organization,
        area,
        interests,
        bio,
      });
      setStoredToken(res.token);
      onAuthenticated(res.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (cat: ResourceCategory) => {
    setInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const accountIcon = (t: AccountType, role: string) => {
    if (role === 'admin') return <ShieldCheck className="w-4 h-4 text-[#1B4332]" />;
    if (t === 'business') return <Building2 className="w-4 h-4 text-[#1B4332]" />;
    if (t === 'student') return <GraduationCap className="w-4 h-4 text-[#1B4332]" />;
    if (t === 'ngo') return <Users className="w-4 h-4 text-[#1B4332]" />;
    return <UserIcon className="w-4 h-4 text-[#1B4332]" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#E4DFD7] max-w-2xl w-full shadow-xl overflow-hidden my-auto">
        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E4DFD7] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1B4332]">Join or Switch Account</h2>
            <p className="text-xs text-[#5C6460]">
              Create a real local account or use a clearly labelled Demo Profile to test the workflow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5C6460] hover:bg-[#E4DFD7]/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 pt-4 flex gap-2 border-b border-[#E4DFD7]">
          {[
            { id: 'demo', label: 'Demo Accounts (1-Click)' },
            { id: 'register', label: 'Create Profile' },
            { id: 'login', label: 'Sign In' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMode(tab.id as typeof mode);
                setError(null);
              }}
              className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                mode === tab.id
                  ? 'border-[#1B4332] text-[#1B4332]'
                  : 'border-transparent text-[#5C6460] hover:text-[#1D2420]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}

          {mode === 'demo' && (
            <div className="space-y-3">
              <div className="text-xs text-[#5C6460] bg-[#F6EFE8] border border-[#E6D6C5] rounded-lg p-3">
                <strong>Sample Demo Profiles:</strong> These pre-seeded accounts represent the 5 core
                ReWorth scenarios plus a Moderator role so you can test listing, matching, and
                exchange approval end-to-end.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoLogin(acc.id)}
                    className="text-left p-3.5 rounded-xl border border-[#E4DFD7] hover:border-[#1B4332] hover:bg-[#FAF8F5] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="flex items-center gap-1.5 font-semibold text-sm text-[#1D2420]">
                        {accountIcon(acc.accountType, acc.role)}
                        {acc.name}
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#E8F3EC] text-[#1B4332]">
                        {acc.role === 'admin' ? 'Admin' : acc.accountType}
                      </span>
                    </div>
                    <div className="text-xs text-[#5C6460] mb-1">
                      {acc.organization ? `${acc.organization} · ` : ''}
                      {acc.area}
                    </div>
                    {acc.bio && <p className="text-xs text-[#5C6460] line-clamp-2">{acc.bio}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1D2420] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm focus:outline-none focus:border-[#1B4332]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1D2420] mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm focus:outline-none focus:border-[#1B4332]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#143326] disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                    Full Name / Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Nair"
                    className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                    Account Type *
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as AccountType)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm bg-white focus:outline-none focus:border-[#1B4332]"
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1D2420] mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="priya@college.edu"
                    className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                    Password (min 6 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                    Organization / College / Workshop
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm focus:outline-none focus:border-[#1B4332]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                    Neighborhood / Area *
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm bg-white focus:outline-none focus:border-[#1B4332]"
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
                <label className="block text-xs font-semibold text-[#1D2420] mb-1.5">
                  Material Interests (used for personalized discovery)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_NAMES.map((cat) => {
                    const selected = interests.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleInterest(cat)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#1B4332] text-white border-[#1B4332]'
                            : 'bg-[#FAF8F5] text-[#5C6460] border-[#E4DFD7] hover:border-[#1B4332]'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D2420] mb-1">
                  Short Bio / What You Make or Divert
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Architecture student building scale models from offcuts"
                  className="w-full px-3 py-2 rounded-lg border border-[#E4DFD7] text-sm focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#143326] disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Creating Profile...' : 'Create Account & Start Matching'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
