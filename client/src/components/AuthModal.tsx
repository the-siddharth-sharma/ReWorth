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
    if (role === 'admin') return <ShieldCheck className="w-4 h-4 text-[#0052FF]" />;
    if (t === 'business') return <Building2 className="w-4 h-4 text-[#0052FF]" />;
    if (t === 'student') return <GraduationCap className="w-4 h-4 text-[#0052FF]" />;
    if (t === 'ngo') return <Users className="w-4 h-4 text-[#0052FF]" />;
    return <UserIcon className="w-4 h-4 text-[#0052FF]" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060B18]/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] rounded-[2px] border border-[#E2E6EE] max-w-2xl w-full shadow-2xl overflow-hidden my-auto">
        <div className="px-6 py-4 bg-[#060B18] text-[#F8FAFC] border-b border-[#1D2740] flex items-center justify-between">
          <div>
            <h2 className="font-mono-num text-xs font-bold uppercase tracking-widest text-[#F8FAFC]">
              JOIN OR SWITCH ACCOUNT
            </h2>
            <p className="text-xs text-[#8A94A6] mt-0.5">
              Create a real local account or use a clearly labelled Demo Profile to test the workflow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[2px] text-[#8A94A6] hover:bg-[#0E1528] hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 pt-3 flex gap-4 border-b border-[#E2E6EE] bg-[#F5F6F8]">
          {[
            { id: 'demo', label: '01 DEMO ACCOUNTS' },
            { id: 'register', label: '02 CREATE PROFILE' },
            { id: 'login', label: '03 SIGN IN' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMode(tab.id as typeof mode);
                setError(null);
              }}
              className={`pb-3 px-1 font-mono-num text-[11px] font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                mode === tab.id
                  ? 'border-[#0052FF] text-[#0052FF]'
                  : 'border-transparent text-[#5A6475] hover:text-[#0B0F19]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-[2px] bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}

          {mode === 'demo' && (
            <div className="space-y-3">
              <div className="text-xs text-[#0B0F19] bg-[#EEF4FF] border border-[#C7DBFF] rounded-[2px] p-3">
                <strong>Sample Demo Profiles:</strong> These pre-seeded accounts represent the core
                ReWorth B2B &amp; student scenarios plus a Moderator role for instant end-to-end testing.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoLogin(acc.id)}
                    className="text-left p-3.5 rounded-[2px] border border-[#E2E6EE] bg-[#FFFFFF] hover:border-[#0052FF] hover:bg-[#F5F6F8] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="flex items-center gap-1.5 font-bold text-sm text-[#0B0F19]">
                        {accountIcon(acc.accountType, acc.role)}
                        {acc.name}
                      </span>
                      <span className="font-mono-num text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm bg-[#EEF4FF] text-[#0052FF] border border-[#C7DBFF]">
                        {acc.role === 'admin' ? 'Admin' : acc.accountType}
                      </span>
                    </div>
                    <div className="font-mono-num text-[10px] uppercase text-[#5A6475] mb-1">
                      {acc.organization ? `${acc.organization} · ` : ''}
                      {acc.area}
                    </div>
                    {acc.bio && <p className="text-xs text-[#5A6475] line-clamp-2">{acc.bio}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm focus:outline-none focus:border-[#0052FF]"
                />
              </div>
              <div>
                <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm focus:outline-none focus:border-[#0052FF]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-[2px] bg-[#0B0F19] hover:bg-[#0052FF] text-white font-mono-num text-xs font-semibold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Signing in...' : 'Sign In ↗'}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                    Full Name / Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Nair"
                    className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm focus:outline-none focus:border-[#0052FF]"
                  />
                </div>
                <div>
                  <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                    Account Type *
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="priya@college.edu"
                    className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm focus:outline-none focus:border-[#0052FF]"
                  />
                </div>
                <div>
                  <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                    Password (min 6 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm focus:outline-none focus:border-[#0052FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                    Organization / College / Workshop
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm focus:outline-none focus:border-[#0052FF]"
                  />
                </div>
                <div>
                  <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                    Neighborhood / Area *
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
                <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1.5">
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
                        className={`px-2.5 py-1 rounded-[2px] font-mono-num text-[10px] font-semibold uppercase border transition-colors cursor-pointer ${
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
                <label className="block font-mono-num text-[10px] font-semibold uppercase text-[#0B0F19] mb-1">
                  Short Bio / What You Make or Divert
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Architecture student building scale models from offcuts"
                  className="w-full px-3 py-2 rounded-[2px] border border-[#E2E6EE] text-sm focus:outline-none focus:border-[#0052FF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-[2px] bg-[#0052FF] hover:bg-[#0040CC] text-white font-mono-num text-xs font-semibold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Creating Profile...' : 'Create Account & Start Matching ↗'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
