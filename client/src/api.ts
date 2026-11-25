import type {
  Exchange,
  ExchangeStatus,
  ImpactStats,
  MatchResult,
  Need,
  Report,
  Resource,
  User,
} from '../../shared/types.ts';

const TOKEN_KEY = 'reworth_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  getDemoAccounts: () => request<{ accounts: User[] }>('/api/auth/demo-accounts'),
  loginDemo: (demoUserId: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ demoUserId }),
    }),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (payload: {
    name: string;
    email: string;
    password: string;
    accountType: User['accountType'];
    organization?: string;
    area: string;
    interests: User['interests'];
    bio?: string;
  }) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => request<{ user: User }>('/api/auth/me'),
  updateMe: (payload: Partial<User>) =>
    request<{ user: User }>('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  logout: () =>
    request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  uploadImage: (dataUrl: string) =>
    request<{ imageUrl: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl }),
    }),

  getResources: (params?: { category?: string; transferType?: string; search?: string; status?: string; ownerId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.transferType) qs.set('transferType', params.transferType);
    if (params?.search) qs.set('search', params.search);
    if (params?.status) qs.set('status', params.status);
    if (params?.ownerId) qs.set('ownerId', params.ownerId);
    return request<{ resources: Resource[] }>(`/api/resources?${qs.toString()}`);
  },
  getResourceDetail: (id: string) =>
    request<{ resource: Resource; matches: MatchResult[] }>(`/api/resources/${id}`),
  createResource: (payload: Record<string, unknown>) =>
    request<{ resource: Resource; matches: MatchResult[] }>('/api/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getNeeds: (params?: { category?: string; search?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    if (params?.status) qs.set('status', params.status);
    return request<{ needs: Need[] }>(`/api/needs?${qs.toString()}`);
  },
  getNeedDetail: (id: string) =>
    request<{ need: Need; matches: MatchResult[] }>(`/api/needs/${id}`),
  createNeed: (payload: Record<string, unknown>) =>
    request<{ need: Need; matches: MatchResult[] }>('/api/needs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMatches: (scope: 'all' | 'mine' = 'all', minScore = 45) =>
    request<{ engine: string; matches: MatchResult[] }>(
      `/api/matches?scope=${scope}&minScore=${minScore}`
    ),

  getExchanges: () => request<{ exchanges: Exchange[] }>('/api/exchanges'),
  createExchange: (payload: {
    resourceId: string;
    needId?: string | null;
    requestedQuantity: number;
    offeredResourceId?: string | null;
    offeredQuantity?: number | null;
    cashTopUpAmount?: number | null;
    initialNote: string;
  }) =>
    request<{ exchange: Exchange }>('/api/exchanges', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  counterExchange: (
    id: string,
    payload: {
      requestedQuantity?: number;
      offeredResourceId?: string | null;
      offeredQuantity?: number | null;
      cashTopUpAmount?: number | null;
      note?: string;
    }
  ) =>
    request<{ exchange: Exchange }>(`/api/exchanges/${id}/counter`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  confirmExchangeHandover: (id: string, otp: string) =>
    request<{ exchange: Exchange; awaitingCounterparty: boolean }>(
      `/api/exchanges/${id}/confirm-handover`,
      {
        method: 'POST',
        body: JSON.stringify({ otp }),
      }
    ),
  updateExchangeStatus: (id: string, status: ExchangeStatus, ownerNote?: string, otp?: string) =>
    request<{ exchange: Exchange; awaitingCounterparty?: boolean }>(`/api/exchanges/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ownerNote, otp }),
    }),
  sendExchangeMessage: (id: string, body: string) =>
    request<{ exchange: Exchange }>(`/api/exchanges/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),

  getImpact: () => request<ImpactStats>('/api/impact'),

  submitReport: (payload: {
    targetType: 'resource' | 'need';
    targetId: string;
    reason: string;
    details: string;
  }) =>
    request<{ ok: boolean; reportId: string }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getModerationQueue: () =>
    request<{ reports: Report[]; allResources: Resource[]; allNeeds: Need[] }>(
      '/api/moderation/reports'
    ),
  resolveReport: (id: string, action: 'dismiss' | 'remove_listing', moderatorNote: string) =>
    request<{ ok: boolean }>(`/api/moderation/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, moderatorNote }),
    }),
  removeListingDirectly: (targetType: 'resource' | 'need', targetId: string, reason: string) =>
    request<{ ok: boolean }>('/api/moderation/remove-listing', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId, reason }),
    }),
};
