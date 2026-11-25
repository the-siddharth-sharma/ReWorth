import React from 'react';
import {
  Leaf,
  Compass,
  Sparkles,
  PlusCircle,
  ArrowLeftRight,
  BarChart3,
  ShieldAlert,
  User as UserIcon,
  LogOut,
  Menu,
  X,
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
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'discover', label: 'Discover', icon: <Compass className="w-4 h-4" /> },
    { id: 'matches', label: 'Smart Matches', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'post-resource', label: 'Offer Resource', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'post-need', label: 'Post Need', icon: <PlusCircle className="w-4 h-4" /> },
    {
      id: 'exchanges',
      label: 'Exchanges',
      icon: <ArrowLeftRight className="w-4 h-4" />,
      badge: pendingExchangesCount > 0 ? pendingExchangesCount : undefined,
    },
    { id: 'impact', label: 'Impact', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'moderation', label: 'Moderation', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  const handleNav = (id: NavTab) => {
    onSelectTab(id);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E4DFD7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <button
          type="button"
          onClick={() => handleNav('discover')}
          className="flex items-center gap-2.5 text-left shrink-0 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-[#1B4332] text-white flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base leading-tight text-[#1B4332] tracking-tight">
              ReWorth
            </div>
            <div className="text-[11px] text-[#5C6460] hidden sm:block">
              Need-Based Resource Exchange
            </div>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1B4332] text-white'
                    : 'text-[#444C48] hover:bg-[#F3EFEA] hover:text-[#1B4332]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      active ? 'bg-white text-[#1B4332]' : 'bg-[#2D6A4F] text-white'
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
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  activeTab === 'profile'
                    ? 'border-[#1B4332] bg-[#E8F3EC]'
                    : 'border-[#E4DFD7] bg-[#FAF8F5] hover:bg-[#F3EFEA]'
                }`}
              >
                <UserIcon className="w-4 h-4 text-[#1B4332] shrink-0" />
                <div className="hidden sm:block leading-tight">
                  <div className="text-xs font-semibold text-[#1D2420] max-w-[130px] truncate">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-[#5C6460] capitalize">
                    {user.role === 'admin' ? 'Moderator' : user.accountType} · {user.area}
                  </div>
                </div>
                {user.isDemo && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#F6EFE8] text-[#9C6B43] border border-[#E6D6C5]">
                    Demo
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={onOpenAuth}
                className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#E4DFD7] text-[#1B4332] hover:bg-[#F3EFEA] cursor-pointer"
              >
                Switch
              </button>
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                className="p-2 rounded-lg text-[#5C6460] hover:bg-[#F3EFEA] hover:text-[#991B1B] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3.5 py-2 rounded-lg bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#143326] transition-colors cursor-pointer"
            >
              Sign In / Demo
            </button>
          )}

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg border border-[#E4DFD7] text-[#1D2420] hover:bg-[#F3EFEA]"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E4DFD7] bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                  active ? 'bg-[#1B4332] text-white' : 'text-[#1D2420] hover:bg-[#F3EFEA]'
                }`}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#2D6A4F] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2 border-t border-[#E4DFD7] flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenAuth();
              }}
              className="flex-1 py-2 rounded-lg border border-[#1B4332] text-[#1B4332] text-sm font-semibold"
            >
              {user ? 'Switch Account' : 'Sign In / Demo'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
