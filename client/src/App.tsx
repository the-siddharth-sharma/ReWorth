import { useCallback, useEffect, useState } from 'react';
import { api, getStoredToken, setStoredToken } from './api.ts';
import type { Exchange, ImpactStats, MatchResult, Need, Resource, User } from '../../shared/types.ts';
import { Navbar, type NavTab } from './components/Navbar.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { DetailModal } from './components/DetailModal.tsx';
import { DiscoverView } from './components/DiscoverView.tsx';
import { MatchesView } from './components/MatchesView.tsx';
import { PostResourceView } from './components/PostResourceView.tsx';
import { PostNeedView } from './components/PostNeedView.tsx';
import { ExchangesView } from './components/ExchangesView.tsx';
import { ImpactView } from './components/ImpactView.tsx';
import { ModerationView } from './components/ModerationView.tsx';
import { ProfileView } from './components/ProfileView.tsx';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('discover');
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const [resources, setResources] = useState<Resource[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [impact, setImpact] = useState<ImpactStats | null>(null);
  const [detailTarget, setDetailTarget] = useState<{ type: 'resource' | 'need'; id: string } | null>(
    null
  );

  const loadPublicData = useCallback(async () => {
    try {
      const [resData, needData, matchData, impactData] = await Promise.all([
        api.getResources(),
        api.getNeeds(),
        api.getMatches('all', 45),
        api.getImpact(),
      ]);
      setResources(resData.resources);
      setNeeds(needData.needs);
      setMatches(matchData.matches);
      setImpact(impactData);
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  }, []);

  const loadExchanges = useCallback(async (activeUser: User | null) => {
    if (!activeUser) {
      setExchanges([]);
      return;
    }
    try {
      const exData = await api.getExchanges();
      setExchanges(exData.exchanges);
    } catch {
      setExchanges([]);
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      api
        .getMe()
        .then((res) => {
          setUser(res.user);
          loadExchanges(res.user);
        })
        .catch(() => {
          setStoredToken(null);
        });
    }
    loadPublicData();
  }, [loadPublicData, loadExchanges]);

  const handleAuthenticated = (nextUser: User) => {
    setUser(nextUser);
    loadExchanges(nextUser);
    loadPublicData();
  };

  const handleLogout = async () => {
    await api.logout().catch(() => {});
    setStoredToken(null);
    setUser(null);
    setExchanges([]);
  };

  const refreshAll = () => {
    loadPublicData();
    loadExchanges(user);
  };

  const pendingExchangesCount = exchanges.filter(
    (e) => e.status === 'pending' || e.status === 'accepted'
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1D2420]">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={user}
        pendingExchangesCount={pendingExchangesCount}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'discover' && (
          <DiscoverView
            resources={resources}
            needs={needs}
            matches={matches}
            currentUser={user}
            onSelectResource={(id) => setDetailTarget({ type: 'resource', id })}
            onSelectNeed={(id) => setDetailTarget({ type: 'need', id })}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesView
            matches={matches}
            currentUser={user}
            onInspectResource={(id) => setDetailTarget({ type: 'resource', id })}
            onRequireAuth={() => setAuthOpen(true)}
            onExchangeCreated={refreshAll}
          />
        )}

        {activeTab === 'post-resource' && (
          <PostResourceView
            currentUser={user}
            onRequireAuth={() => setAuthOpen(true)}
            onCreated={refreshAll}
            onInspectNeed={(id) => setDetailTarget({ type: 'need', id })}
          />
        )}

        {activeTab === 'post-need' && (
          <PostNeedView
            currentUser={user}
            onRequireAuth={() => setAuthOpen(true)}
            onCreated={refreshAll}
            onInspectResource={(id) => setDetailTarget({ type: 'resource', id })}
          />
        )}

        {activeTab === 'exchanges' && (
          <ExchangesView
            exchanges={exchanges}
            currentUser={user}
            onRequireAuth={() => setAuthOpen(true)}
            onRefresh={refreshAll}
          />
        )}

        {activeTab === 'impact' && <ImpactView impact={impact} />}

        {activeTab === 'moderation' && (
          <ModerationView
            currentUser={user}
            onUserChanged={handleAuthenticated}
            onListingsChanged={refreshAll}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            key={user?.id ?? 'guest'}
            user={user}
            onUpdated={setUser}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}
      </main>

      <footer className="border-t border-[#E4DFD7] bg-white py-4 px-4 text-center text-xs text-[#5C6460]">
        ReWorth Circular Resource Exchange · Rule-based matching (no AI claims) · Direct local
        pickup only (no physical delivery integrated) · Hazardous materials &amp; medicines prohibited.
      </footer>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={handleAuthenticated}
      />

      <DetailModal
        target={detailTarget}
        currentUser={user}
        onClose={() => setDetailTarget(null)}
        onRequireAuth={() => setAuthOpen(true)}
        onExchangeCreated={refreshAll}
        onSwitchTarget={(next) => setDetailTarget(next)}
      />
    </div>
  );
}

export default App;
