import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';
import type { User } from '../../../shared/types.ts';

export type NavTab =
  | 'discover'
  | 'matches'
  | 'post-resource'
  | 'post-need'
  | 'exchanges'
  | 'impact'
  | 'moderation'
  | 'profile';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: User | null;
  pendingExchangesCount: number;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  user,
  pendingExchangesCount,
  onOpenAuth,
  onLogout,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems: { id: NavTab; num: string; label: string; badge?: number }[] = [
    { id: 'discover', num: '01', label: 'DISCOVER' },
    { id: 'matches', num: '02', label: 'MATCHES' },
    { id: 'post-resource', num: '03', label: 'OFFER' },
    { id: 'post-need', num: '04', label: 'NEED' },
    {
      id: 'exchanges',
      num: '05',
      label: 'EXCHANGES',
      badge: pendingExchangesCount > 0 ? pendingExchangesCount : undefined,
    },
    { id: 'impact', num: '06', label: 'IMPACT' },
    { id: 'moderation', num: '07', label: 'MOD' },
  ];

  const handleNav = (id: NavTab) => {
    onSelectTab(id);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E2E6EE]">
      {/* Slim Top Monospace Utility Strip */}
      <div className="bg-[#060B18] text-[#F8FAFC] border-b border-[#1D2740]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-8 flex items-center justify-between text-[11px] font-mono-num tracking-wider">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span className="truncate">B2B CIRCULAR EXCHANGE · VERIFIED LISTINGS</span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-[#8A94A6]">
            <span className="hidden sm:inline">RULE-BASED ENGINE</span>
            <span className="text-[#F8FAFC]">{clock}</span>
          </div>
        </div>
      </div>

      {/* Main Crisp White Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <button
          type="button"
          onClick={() => handleNav('discover')}
          className="flex items-center gap-3 text-left shrink-0 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-[2px] bg-[#0052FF] text-white flex items-center justify-center font-mono-num font-bold text-sm tracking-tighter">
            RW
          </div>
          <div>
            <div className="font-extrabold text-base leading-none text-[#0B0F19] tracking-tight uppercase">
              ReWorth
            </div>
            <div className="font-mono-num text-[10px] text-[#8A94A6] uppercase tracking-wider mt-0.5 hidden sm:block">
              Circular Resource Index
            </div>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`px-3 py-2 rounded-[2px] font-mono-num text-[11px] font-semibold tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  active
                    ? 'bg-[#0052FF] text-white border-[#0052FF]'
                    : 'bg-transparent text-[#5A6475] border-transparent hover:bg-[#F5F6F8] hover:text-[#0B0F19]'
                }`}
              >
                <span className={active ? 'text-[#C7DBFF]' : 'text-[#8A94A6]'}>{item.num}</span>
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.5 rounded-sm text-[10px] font-semibold ${
                      active ? 'bg-white text-[#0052FF]' : 'bg-[#0B0F19] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Account Controls */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNav('profile')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] border text-left transition-colors cursor-pointer ${
                  activeTab === 'profile'
                    ? 'border-[#0052FF] bg-[#EEF4FF]'
                    : 'border-[#E2E6EE] bg-[#F5F6F8] hover:border-[#0B0F19]'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5 text-[#0052FF] shrink-0" />
                <div className="hidden sm:block leading-tight">
                  <div className="text-xs font-bold text-[#0B0F19] max-w-[130px] truncate">
                    {user.name}
                  </div>
                  <div className="font-mono-num text-[10px] text-[#5A6475] uppercase">
                    {user.role === 'admin' ? 'MOD' : user.accountType} · {user.area}
                  </div>
                </div>
                {user.isDemo && (
                  <span className="font-mono-num text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#EEF4FF] text-[#0052FF] border border-[#C7DBFF]">
                    DEMO
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={onOpenAuth}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-[2px] text-[11px] font-mono-num font-semibold uppercase tracking-wider bg-[#0B0F19] text-white hover:bg-[#0052FF] transition-colors cursor-pointer"
              >
                Switch
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                className="p-2 rounded-[2px] border border-[#E2E6EE] text-[#5A6475] hover:bg-[#F5F6F8] hover:text-[#DC2626] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[2px] bg-[#0B0F19] text-white font-mono-num text-xs font-semibold uppercase tracking-wider hover:bg-[#0052FF] transition-colors cursor-pointer"
            >
              Sign In / Demo
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-[2px] border border-[#E2E6EE] text-[#0B0F19] hover:bg-[#F5F6F8]"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E2E6EE] bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full px-3 py-2.5 rounded-[2px] font-mono-num text-xs font-semibold tracking-wider flex items-center justify-between border ${
                  active
                    ? 'bg-[#0052FF] text-white border-[#0052FF]'
                    : 'text-[#0B0F19] border-transparent hover:bg-[#F5F6F8]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={active ? 'text-[#C7DBFF]' : 'text-[#8A94A6]'}>{item.num}</span>
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-[#0B0F19] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2 border-t border-[#E2E6EE] flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenAuth();
              }}
              className="flex-1 py-2.5 rounded-[2px] bg-[#0B0F19] text-white font-mono-num text-xs font-semibold uppercase tracking-wider"
            >
              {user ? 'Switch Account ↗' : 'Sign In / Demo ↗'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
