import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { db } from './db.ts';
import { hashPassword, seedIfEmpty } from './seed.ts';
import {
  CATEGORY_NAMES,
  estimateDivertedKg,
  resolveAreaCoordinates,
} from '../../shared/constants.ts';
import { checkListingSafety } from '../../shared/safety.ts';
import {
  findAllRecommendedMatches,
  findMatchesForNeed,
  findMatchesForResource,
} from '../../shared/matching.ts';
import type {
  AccountType,
  Exchange,
  ExchangeMessage,
  ExchangeStatus,
  ImpactCategoryStat,
  ImpactStats,
  Need,
  Report,
  Resource,
  ResourceCategory,
  User,
} from '../../shared/types.ts';

seedIfEmpty();

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const REPO_ROOT = fs.existsSync(path.resolve(process.cwd(), 'uploads'))
  ? process.cwd()
  : path.resolve(process.cwd(), '..');
const UPLOADS_DIR = path.join(REPO_ROOT, 'uploads');
const CLIENT_DIST_DIR = path.join(REPO_ROOT, 'client', 'dist');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// --- Row Mappers ---

function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    accountType: row.account_type as AccountType,
    role: row.role as 'member' | 'admin',
    organization: row.organization ? String(row.organization) : undefined,
    area: String(row.area),
    lat: Number(row.lat),
    lng: Number(row.lng),
    interests: JSON.parse(String(row.interests_json || '[]')) as ResourceCategory[],
    bio: row.bio ? String(row.bio) : undefined,
    isDemo: Boolean(row.is_demo),
    createdAt: String(row.created_at),
  };
}

function mapResource(row: Record<string, unknown>): Resource {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    ownerName: String(row.owner_name ?? 'Member'),
    ownerAccountType: (row.owner_account_type as AccountType) ?? 'individual',
    ownerOrganization: row.owner_organization ? String(row.owner_organization) : undefined,
    title: String(row.title),
    description: String(row.description),
    category: row.category as ResourceCategory,
    materialTags: JSON.parse(String(row.material_tags_json || '[]')) as string[],
    quantity: Number(row.quantity),
    unit: String(row.unit),
    condition: row.condition as Resource['condition'],
    transferType: row.transfer_type as Resource['transferType'],
    priceAmount: row.price_amount !== null && row.price_amount !== undefined ? Number(row.price_amount) : null,
    exchangeNote: row.exchange_note ? String(row.exchange_note) : undefined,
    area: String(row.area),
    pickupInstructions: String(row.pickup_instructions),
    availability: String(row.availability),
    lat: Number(row.lat),
    lng: Number(row.lng),
    disposalDate: String(row.disposal_date),
    urgency: row.urgency as Resource['urgency'],
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    safetyConfirmed: Boolean(row.safety_confirmed),
    status: row.status as Resource['status'],
    isSample: Boolean(row.is_sample),
    createdAt: String(row.created_at),
  };
}

function mapNeed(row: Record<string, unknown>): Need {
  return {
    id: String(row.id),
    requesterId: String(row.requester_id),
    requesterName: String(row.requester_name ?? 'Member'),
    requesterAccountType: (row.requester_account_type as AccountType) ?? 'individual',
    requesterOrganization: row.requester_organization ? String(row.requester_organization) : undefined,
    title: String(row.title),
    description: String(row.description),
    category: row.category as ResourceCategory,
    materialTags: JSON.parse(String(row.material_tags_json || '[]')) as string[],
    quantity: Number(row.quantity),
    unit: String(row.unit),
    purpose: String(row.purpose),
    area: String(row.area),
    lat: Number(row.lat),
    lng: Number(row.lng),
    deadline: String(row.deadline),
    preferredTransfer: row.preferred_transfer as Need['preferredTransfer'],
    maxBudget: row.max_budget !== null && row.max_budget !== undefined ? Number(row.max_budget) : null,
    status: row.status as Need['status'],
    isSample: Boolean(row.is_sample),
    createdAt: String(row.created_at),
  };
}

function getAllResources(includeRemoved = false): Resource[] {
  const sql = `
    SELECT r.*, u.name AS owner_name, u.account_type AS owner_account_type, u.organization AS owner_organization
    FROM resources r
    JOIN users u ON u.id = r.owner_id
    ${includeRemoved ? '' : "WHERE r.status != 'removed'"}
    ORDER BY r.created_at DESC
  `;
  return (db.prepare(sql).all() as Record<string, unknown>[]).map(mapResource);
}

function getAllNeeds(includeRemoved = false): Need[] {
  const sql = `
    SELECT n.*, u.name AS requester_name, u.account_type AS requester_account_type, u.organization AS requester_organization
    FROM needs n
    JOIN users u ON u.id = n.requester_id
    ${includeRemoved ? '' : "WHERE n.status != 'removed'"}
    ORDER BY n.created_at DESC
  `;
  return (db.prepare(sql).all() as Record<string, unknown>[]).map(mapNeed);
}

// --- Auth Helpers ---

function getUserFromRequest(req: express.Request): User | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  if (!token) return null;

  const row = db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`
    )
    .get(token) as Record<string, unknown> | undefined;

  return row ? mapUser(row) : null;
}

function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please sign in or choose a demo account.' });
    return;
  }
  (req as express.Request & { user: User }).user = user;
  next();
}

function createSessionForUser(userId: string): string {
  const token = crypto.randomUUID();
  db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(
    token,
    userId,
    new Date().toISOString()
  );
  return token;
}

// --- Routes ---

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'reworth-api', timestamp: new Date().toISOString() });
});

// Upload image (base64 data URL -> /uploads/<id>.<ext>)
app.post('/api/upload', requireAuth, (req, res) => {
  const { dataUrl } = req.body as { dataUrl?: string };
  if (!dataUrl || typeof dataUrl !== 'string') {
    res.status(400).json({ error: 'Missing image dataUrl.' });
    return;
  }
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    res.status(400).json({ error: 'Unsupported image format. Please upload PNG, JPG, WEBP, or GIF.' });
    return;
  }
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 3 * 1024 * 1024) {
    res.status(400).json({ error: 'Image must be 3 MB or smaller.' });
    return;
  }
  const filename = `upload-${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  res.json({ imageUrl: `/uploads/${filename}` });
});

// Auth & Onboarding
app.get('/api/auth/demo-accounts', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM users WHERE is_demo = 1 ORDER BY role DESC, name ASC')
    .all() as Record<string, unknown>[];
  res.json({ accounts: rows.map(mapUser) });
});

app.post('/api/auth/register', (req, res) => {
  const {
    name,
    email,
    password,
    accountType,
    organization,
    area,
    interests,
    bio,
  } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    accountType?: AccountType;
    organization?: string;
    area?: string;
    interests?: ResourceCategory[];
    bio?: string;
  };

  if (!name?.trim() || !email?.trim() || !password || password.length < 6 || !area?.trim()) {
    res.status(400).json({
      error: 'Name, valid email, password (6+ chars), and neighborhood/area are required.',
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const id = `user-${crypto.randomUUID()}`;
  const coords = resolveAreaCoordinates(area);
  const now = new Date().toISOString();
  const validInterests = Array.isArray(interests)
    ? interests.filter((c) => CATEGORY_NAMES.includes(c))
    : [];

  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, account_type, role, organization, area, lat, lng, interests_json, bio, is_demo, created_at)
     VALUES (?, ?, ?, ?, ?, 'member', ?, ?, ?, ?, ?, ?, 0, ?)`
  ).run(
    id,
    name.trim(),
    normalizedEmail,
    hashPassword(password),
    accountType ?? 'individual',
    organization?.trim() || null,
    area.trim(),
    coords.lat,
    coords.lng,
    JSON.stringify(validInterests),
    bio?.trim() || null,
    now
  );

  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown>;
  const token = createSessionForUser(id);
  res.status(201).json({ token, user: mapUser(userRow) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, demoUserId } = req.body as {
    email?: string;
    password?: string;
    demoUserId?: string;
  };

  let row: Record<string, unknown> | undefined;

  if (demoUserId) {
    row = db
      .prepare('SELECT * FROM users WHERE id = ? AND is_demo = 1')
      .get(demoUserId) as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: 'Demo account not found.' });
      return;
    }
  } else {
    if (!email?.trim() || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    row = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.trim().toLowerCase()) as Record<string, unknown> | undefined;
    if (!row || String(row.password_hash) !== hashPassword(password)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
  }

  const user = mapUser(row);
  const token = createSessionForUser(user.id);
  res.json({ token, user });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = (req as express.Request & { user: User }).user;
  res.json({ user });
});

app.patch('/api/auth/me', requireAuth, (req, res) => {
  const user = (req as express.Request & { user: User }).user;
  const { name, accountType, organization, area, interests, bio } = req.body as Partial<User>;

  const nextArea = area?.trim() || user.area;
  const coords = resolveAreaCoordinates(nextArea);
  const nextInterests = Array.isArray(interests)
    ? interests.filter((c) => CATEGORY_NAMES.includes(c))
    : user.interests;

  db.prepare(
    `UPDATE users SET name = ?, account_type = ?, organization = ?, area = ?, lat = ?, lng = ?, interests_json = ?, bio = ? WHERE id = ?`
  ).run(
    name?.trim() || user.name,
    accountType ?? user.accountType,
    organization !== undefined ? organization?.trim() || null : user.organization || null,
    nextArea,
    coords.lat,
    coords.lng,
    JSON.stringify(nextInterests),
    bio !== undefined ? bio?.trim() || null : user.bio || null,
    user.id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as Record<string, unknown>;
  res.json({ user: mapUser(updated) });
});

app.post('/api/auth/logout', (req, res) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length).trim();
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  res.json({ ok: true });
});

// Resources
app.get('/api/resources', (req, res) => {
  const { category, transferType, search, status } = req.query as Record<string, string | undefined>;
  let items = getAllResources(false);

  if (status && status !== 'all') {
    items = items.filter((r) => r.status === status);
  } else if (!status) {
    items = items.filter((r) => r.status === 'available' || r.status === 'reserved');
  }
  if (category && category !== 'all') {
    items = items.filter((r) => r.category === category);
  }
  if (transferType && transferType !== 'all') {
    items = items.filter((r) => r.transferType === transferType);
  }
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    items = items.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q) ||
        r.materialTags.some((t) => t.toLowerCase().includes(q))
    );
  }
  res.json({ resources: items });
});

app.get('/api/resources/:id', (req, res) => {
  const resourceId = String(req.params.id);
  const row = db
    .prepare(
      `SELECT r.*, u.name AS owner_name, u.account_type AS owner_account_type, u.organization AS owner_organization
       FROM resources r JOIN users u ON u.id = r.owner_id WHERE r.id = ?`
    )
    .get(resourceId) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Resource not found.' });
    return;
  }
  const resource = mapResource(row);
  const matches = findMatchesForResource(resource, getAllNeeds(false));
  res.json({ resource, matches });
});

app.post('/api/resources', requireAuth, (req, res) => {
  const user = (req as express.Request & { user: User }).user;
  const body = req.body as Omit<Partial<Resource>, 'materialTags'> & { materialTags?: string[] | string };

  const title = body.title?.trim() ?? '';
  const description = body.description?.trim() ?? '';
  const tags = Array.isArray(body.materialTags)
    ? body.materialTags.map((t) => t.trim()).filter(Boolean)
    : typeof body.materialTags === 'string'
      ? body.materialTags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

  if (!title || !description || !body.category || !body.quantity || body.quantity <= 0 || !body.unit?.trim()) {
    res.status(400).json({ error: 'Title, description, category, positive quantity, and unit are required.' });
    return;
  }
  if (!body.safetyConfirmed) {
    res.status(400).json({ error: 'You must confirm the material is safe, non-hazardous, and not pharmaceutical/medical.' });
    return;
  }

  const safety = checkListingSafety(title, description, tags);
  if (!safety.safe) {
    res.status(400).json({ error: safety.reason, flaggedTerms: safety.flaggedTerms });
    return;
  }

  const area = body.area?.trim() || user.area;
  const coords = resolveAreaCoordinates(area);
  const id = `res-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO resources (
      id, owner_id, title, description, category, material_tags_json, quantity, unit,
      condition, transfer_type, price_amount, exchange_note, area, pickup_instructions,
      availability, lat, lng, disposal_date, urgency, image_url, safety_confirmed, status, is_sample, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'available', 0, ?)`
  ).run(
    id,
    user.id,
    title,
    description,
    body.category,
    JSON.stringify(tags),
    Number(body.quantity),
    body.unit.trim(),
    body.condition ?? 'Good - Minor Wear',
    body.transferType ?? 'free',
    body.transferType === 'low_cost' ? Number(body.priceAmount ?? 0) : null,
    body.transferType === 'exchange' ? body.exchangeNote?.trim() || null : null,
    area,
    body.pickupInstructions?.trim() || 'Coordinate exact pickup point upon acceptance.',
    body.availability?.trim() || 'By mutual coordination',
    coords.lat,
    coords.lng,
    body.disposalDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    body.urgency ?? 'this_week',
    body.imageUrl || null,
    now
  );

  const createdRow = db
    .prepare(
      `SELECT r.*, u.name AS owner_name, u.account_type AS owner_account_type, u.organization AS owner_organization
       FROM resources r JOIN users u ON u.id = r.owner_id WHERE r.id = ?`
    )
    .get(id) as Record<string, unknown>;
  const resource = mapResource(createdRow);
  const matches = findMatchesForResource(resource, getAllNeeds(false));
  res.status(201).json({ resource, matches });
});

app.patch('/api/resources/:id', requireAuth, (req, res) => {
  const user = (req as express.Request & { user: User }).user;
  const resourceId = String(req.params.id);
  const existing = db.prepare('SELECT * FROM resources WHERE id = ?').get(resourceId) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Resource not found.' });
    return;
  }
  if (String(existing.owner_id) !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Only the listing owner or an admin can edit this resource.' });
    return;
  }
  const { status, quantity } = req.body as { status?: Resource['status']; quantity?: number };
  db.prepare('UPDATE resources SET status = ?, quantity = ? WHERE id = ?').run(
    status ?? String(existing.status),
    quantity !== undefined && quantity >= 0 ? quantity : Number(existing.quantity),
    resourceId
  );
  const updated = db
    .prepare(
      `SELECT r.*, u.name AS owner_name, u.account_type AS owner_account_type, u.organization AS owner_organization
       FROM resources r JOIN users u ON u.id = r.owner_id WHERE r.id = ?`
    )
    .get(resourceId) as Record<string, unknown>;
  res.json({ resource: mapResource(updated) });
});

// Needs
app.get('/api/needs', (req, res) => {
  const { category, search, status } = req.query as Record<string, string | undefined>;
  let items = getAllNeeds(false);
  if (status && status !== 'all') {
    items = items.filter((n) => n.status === status);
  } else if (!status) {
    items = items.filter((n) => n.status === 'open');
  }
  if (category && category !== 'all') {
    items = items.filter((n) => n.category === category);
  }
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    items = items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.purpose.toLowerCase().includes(q) ||
        n.area.toLowerCase().includes(q) ||
        n.materialTags.some((t) => t.toLowerCase().includes(q))
    );
  }
  res.json({ needs: items });
});

app.get('/api/needs/:id', (req, res) => {
  const needId = String(req.params.id);
  const row = db
    .prepare(
      `SELECT n.*, u.name AS requester_name, u.account_type AS requester_account_type, u.organization AS requester_organization
       FROM needs n JOIN users u ON u.id = n.requester_id WHERE n.id = ?`
    )
    .get(needId) as Record<string, unknown> | undefined;
  if (!row) {
    res.status(404).json({ error: 'Need posting not found.' });
    return;
  }
  const need = mapNeed(row);
  const matches = findMatchesForNeed(need, getAllResources(false));
  res.json({ need, matches });
});

app.post('/api/needs', requireAuth, (req, res) => {
  const user = (req as express.Request & { user: User }).user;
  const body = req.body as Omit<Partial<Need>, 'materialTags'> & { materialTags?: string[] | string };

  const title = body.title?.trim() ?? '';
  const description = body.description?.trim() ?? '';
  const purpose = body.purpose?.trim() ?? '';
  const tags = Array.isArray(body.materialTags)
    ? body.materialTags.map((t) => t.trim()).filter(Boolean)
    : typeof body.materialTags === 'string'
      ? body.materialTags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

  if (!title || !description || !purpose || !body.category || !body.quantity || body.quantity <= 0 || !body.unit?.trim()) {
    res.status(400).json({ error: 'Title, description, purpose, category, positive quantity, and unit are required.' });
    return;
  }

  const safety = checkListingSafety(title, `${description} ${purpose}`, tags);
  if (!safety.safe) {
    res.status(400).json({ error: safety.reason, flaggedTerms: safety.flaggedTerms });
    return;
  }

  const area = body.area?.trim() || user.area;
  const coords = resolveAreaCoordinates(area);
  const id = `need-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO needs (
      id, requester_id, title, description, category, material_tags_json, quantity, unit,
      purpose, area, lat, lng, deadline, preferred_transfer, max_budget, status, is_sample, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 0, ?)`
  ).run(
    id,
    user.id,
    title,
    description,
    body.category,
    JSON.stringify(tags),
    Number(body.quantity),
    body.unit.trim(),
    purpose,
    area,
    coords.lat,
    coords.lng,
    body.deadline || new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
    body.preferredTransfer ?? 'free_or_exchange',
    body.preferredTransfer === 'low_cost_ok' && body.maxBudget !== undefined && body.maxBudget !== null
      ? Number(body.maxBudget)
      : null,
    now
  );

  const createdRow = db
    .prepare(
      `SELECT n.*, u.name AS requester_name, u.account_type AS requester_account_type, u.organization AS requester_organization
       FROM needs n JOIN users u ON u.id = n.requester_id WHERE n.id = ?`
    )
    .get(id) as Record<string, unknown>;
  const need = mapNeed(createdRow);
  const matches = findMatchesForNeed(need, getAllResources(false));
  res.status(201).json({ need, matches });
});

// Smart Matching
app.get('/api/matches', (req, res) => {
  const user = getUserFromRequest(req);
  const minScore = Number(req.query.minScore ?? 45);
  const scope = req.query.scope === 'mine' && user ? 'mine' : 'all';

  const resources = getAllResources(false);
  const needs = getAllNeeds(false);
  let matches = findAllRecommendedMatches(resources, needs, minScore);

  if (scope === 'mine' && user) {
    matches = matches.filter(
      (m) => m.need.requesterId === user.id || m.resource.ownerId === user.id
    );
  }
  res.json({
    engine: 'Transparent Rule-Based Scoring v1 (Category + Material Keywords + Quantity + Haversine Distance + Timeline + Transfer Fit)',
    matches,
  });
});

// Exchanges
function getExchangesForUser(user: User): Exchange[] {
  const isAdmin = user.role === 'admin';
  const rows = db
    .prepare(
      `SELECT e.*, r.title AS resource_title, r.category AS resource_category, r.image_url AS resource_image_url,
              r.area AS resource_area, r.pickup_instructions AS pickup_instructions,
              uo.name AS owner_name, ur.name AS requester_name
       FROM exchanges e
       JOIN resources r ON r.id = e.resource_id
       JOIN users uo ON uo.id = e.owner_id
       JOIN users ur ON ur.id = e.requester_id
       ${isAdmin ? '' : 'WHERE e.owner_id = ? OR e.requester_id = ?'}
       ORDER BY e.updated_at DESC`
    )
    .all(...(isAdmin ? [] : [user.id, user.id])) as Record<string, unknown>[];

  const msgStmt = db.prepare(
    `SELECT m.*, u.name AS sender_name FROM exchange_messages m JOIN users u ON u.id = m.sender_id WHERE m.exchange_id = ? ORDER BY m.created_at ASC`
  );

  return rows.map((row) => {
    const msgs = (msgStmt.all(String(row.id)) as Record<string, unknown>[]).map(
      (m): ExchangeMessage => ({
        id: String(m.id),
        exchangeId: String(m.exchange_id),
        senderId: String(m.sender_id),
        senderName: String(m.sender_name),
        body: String(m.body),
        createdAt: String(m.created_at),
      })
    );
    return {
      id: String(row.id),
      resourceId: String(row.resource_id),
      needId: row.need_id ? String(row.need_id) : null,
      resourceTitle: String(row.resource_title),
      resourceCategory: row.resource_category as ResourceCategory,
      resourceImageUrl: row.resource_image_url ? String(row.resource_image_url) : undefined,
      resourceArea: String(row.resource_area),
      pickupInstructions: String(row.pickup_instructions),
      ownerId: String(row.owner_id),
      ownerName: String(row.owner_name),
      requesterId: String(row.requester_id),
      requesterName: String(row.requester_name),
      requestedQuantity: Number(row.requested_quantity),
      unit: String(row.unit),
      status: row.status as ExchangeStatus,
      initialNote: String(row.initial_note),
      ownerNote: row.owner_note ? String(row.owner_note) : undefined,
      estimatedKg: Number(row.estimated_kg),
      isSample: Boolean(row.is_sample),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      messages: msgs,
    };
  });
}

app.get('/api/exchanges', requireAuth, (req, res) => {
  const user = (req as express.Request & { user: User }).user;
  res.json({ exchanges: getExchangesForUser(user) });
});

app.post('/api/exchanges', requireAuth, (req, res) => {
  const user = (req as express.Request & { user: User }).user;
  const { resourceId, needId, requestedQuantity, initialNote } = req.body as {
    resourceId?: string;
    needId?: string | null;
    requestedQuantity?: number;
    initialNote?: string;
  };

  if (!resourceId || !requestedQuantity || requestedQuantity <= 0 || !initialNote?.trim()) {
    res.status(400).json({ error: 'Resource ID, positive requested quantity, and a coordination note are required.' });
    return;
  }

  const resRow = db.prepare('SELECT * FROM resources WHERE id = ?').get(resourceId) as Record<string, unknown> | undefined;
  if (!resRow || resRow.status !== 'available') {
    res.status(400).json({ error: 'This resource is not currently available for requests.' });
    return;
  }
  if (String(resRow.owner_id) === user.id) {
    res.status(400).json({ error: 'You cannot request your own resource.' });
    return;
  }
  if (requestedQuantity > Number(resRow.quantity)) {
    res.status(400).json({
      error: `Requested quantity (${requestedQuantity}) exceeds available quantity (${resRow.quantity} ${resRow.unit}).`,
    });
    return;
  }

  const id = `ex-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const estKg = estimateDivertedKg(
    resRow.category as ResourceCategory,
    requestedQuantity,
    String(resRow.unit)
  );

  db.prepare(
    `INSERT INTO exchanges (
      id, resource_id, need_id, owner_id, requester_id, requested_quantity, unit,
      status, initial_note, estimated_kg, is_sample, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, 0, ?, ?)`
  ).run(
    id,
    resourceId,
    needId || null,
    String(resRow.owner_id),
    user.id,
    requestedQuantity,
    String(resRow.unit),
    initialNote.trim(),
    estKg,
    now,
    now
  );

  db.prepare(
    `INSERT INTO exchange_messages (id, exchange_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(`msg-${crypto.randomUUID()}`, id, user.id, initialNote.trim(), now);

  const created = getExchangesForUser(user).find((e) => e.id === id);
  res.status(201).json({ exchange: created });
});

app.patch('/api/exchanges/:id/status', requireAuth, (req, res) => {
  const user = (req as express.Request & { user: User }).user;
  const exchangeId = String(req.params.id);
  const { status, ownerNote } = req.body as { status?: ExchangeStatus; ownerNote?: string };
  const row = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(exchangeId) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Exchange not found.' });
    return;
  }

  const isOwner = String(row.owner_id) === user.id;
  const isRequester = String(row.requester_id) === user.id;
  if (!isOwner && !isRequester && user.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized to update this exchange.' });
    return;
  }

  const currentStatus = String(row.status) as ExchangeStatus;
  if (!status) {
    res.status(400).json({ error: 'Target status is required.' });
    return;
  }

  if ((status === 'accepted' || status === 'rejected') && !isOwner) {
    res.status(403).json({ error: 'Only the resource owner can accept or reject an exchange.' });
    return;
  }
  if (status === 'completed' && currentStatus !== 'accepted') {
    res.status(400).json({ error: 'An exchange must be accepted before marking it completed.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    'UPDATE exchanges SET status = ?, owner_note = COALESCE(?, owner_note), updated_at = ? WHERE id = ?'
  ).run(status, ownerNote?.trim() || null, now, exchangeId);

  // When completed, update resource remaining quantity and optionally linked need
  if (status === 'completed') {
    const resRow = db.prepare('SELECT * FROM resources WHERE id = ?').get(String(row.resource_id)) as Record<string, unknown> | undefined;
    if (resRow) {
      const remaining = Math.max(0, Number(resRow.quantity) - Number(row.requested_quantity));
      const nextResStatus = remaining === 0 ? 'completed' : 'available';
      db.prepare('UPDATE resources SET quantity = ?, status = ? WHERE id = ?').run(
        remaining,
        nextResStatus,
        String(row.resource_id)
      );
    }
    if (row.need_id) {
      db.prepare("UPDATE needs SET status = 'fulfilled' WHERE id = ?").run(String(row.need_id));
    }
  }

  const updated = getExchangesForUser(user).find((e) => e.id === exchangeId);
  res.json({ exchange: updated });
});

app.post('/api/exchanges/:id/messages', requireAuth, (req, res) => {
  const user = (req as express.Request & { user: User }).user;
  const exchangeId = String(req.params.id);
  const { body } = req.body as { body?: string };
  if (!body?.trim()) {
    res.status(400).json({ error: 'Message text cannot be empty.' });
    return;
  }
  const ex = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(exchangeId) as Record<string, unknown> | undefined;
  if (!ex) {
    res.status(404).json({ error: 'Exchange not found.' });
    return;
  }
  if (String(ex.owner_id) !== user.id && String(ex.requester_id) !== user.id && user.role !== 'admin') {
    res.status(403).json({ error: 'Only exchange participants can send messages.' });
    return;
  }
  const now = new Date().toISOString();
  const msgId = `msg-${crypto.randomUUID()}`;
  db.prepare(
    'INSERT INTO exchange_messages (id, exchange_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(msgId, exchangeId, user.id, body.trim(), now);
  db.prepare('UPDATE exchanges SET updated_at = ? WHERE id = ?').run(now, exchangeId);

  const updated = getExchangesForUser(user).find((e) => e.id === exchangeId);
  res.status(201).json({ exchange: updated });
});

// Impact Dashboard
app.get('/api/impact', (_req, res) => {
  const completedRows = db
    .prepare(
      `SELECT e.*, r.category FROM exchanges e JOIN resources r ON r.id = e.resource_id WHERE e.status = 'completed'`
    )
    .all() as Record<string, unknown>[];

  const resources = getAllResources(false);
  const needs = getAllNeeds(false);

  const sampleCompleted = completedRows.filter((r) => Boolean(r.is_sample));
  const liveCompleted = completedRows.filter((r) => !Boolean(r.is_sample));

  const totalEstimatedKgDiverted = Number(
    completedRows.reduce((acc, r) => acc + Number(r.estimated_kg), 0).toFixed(2)
  );
  const liveEstimatedKgDiverted = Number(
    liveCompleted.reduce((acc, r) => acc + Number(r.estimated_kg), 0).toFixed(2)
  );

  const distinctResourcesReused = new Set(completedRows.map((r) => String(r.resource_id))).size;

  const categoryBreakdown: ImpactCategoryStat[] = CATEGORY_NAMES.map((category) => {
    const catExchanges = completedRows.filter((r) => r.category === category);
    const activeListings = resources.filter(
      (r) => r.category === category && r.status === 'available'
    ).length;
    return {
      category,
      completedExchanges: catExchanges.length,
      actualUnitsReused: Number(
        catExchanges.reduce((sum, r) => sum + Number(r.requested_quantity), 0).toFixed(1)
      ),
      estimatedKgDiverted: Number(
        catExchanges.reduce((sum, r) => sum + Number(r.estimated_kg), 0).toFixed(2)
      ),
      activeListings,
    };
  });

  const stats: ImpactStats = {
    totalCompletedExchanges: completedRows.length,
    sampleCompletedExchanges: sampleCompleted.length,
    liveCompletedExchanges: liveCompleted.length,
    totalResourcesReused: distinctResourcesReused,
    totalEstimatedKgDiverted,
    liveEstimatedKgDiverted,
    activeAvailableResources: resources.filter((r) => r.status === 'available').length,
    openNeedsCount: needs.filter((n) => n.status === 'open').length,
    categoryBreakdown,
    methodologyNote:
      'Exchange counts and unit quantities are ACTUAL records from completed exchanges in SQLite. Kilograms diverted are ESTIMATED using transparent per-category unit weight factors (e.g., 0.35 kg/meter fabric, 0.45 kg/carton, 1.4 kg/wood offcut piece). Pre-seeded sample data is separated from live user activity.',
  };

  res.json(stats);
});

// Moderation & Reporting
app.post('/api/reports', requireAuth, (req, res) => {
  const user = (req as express.Request & { user: User }).user;
  const { targetType, targetId, reason, details } = req.body as {
    targetType?: 'resource' | 'need';
    targetId?: string;
    reason?: string;
    details?: string;
  };

  if (!targetType || !targetId || !reason?.trim()) {
    res.status(400).json({ error: 'Target type, target ID, and reason are required.' });
    return;
  }

  const id = `rep-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO reports (id, target_type, target_id, reporter_id, reason, details, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'open', ?)`
  ).run(id, targetType, targetId, user.id, reason.trim(), details?.trim() || '', now);

  res.status(201).json({ ok: true, reportId: id });
});

app.get('/api/moderation/reports', requireAuth, (req, res) => {
  const user = (req as express.Request & { user: User }).user;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Moderator/Admin role required.' });
    return;
  }

  const rows = db
    .prepare(
      `SELECT rep.*, u.name AS reporter_name,
              CASE WHEN rep.target_type = 'resource' THEN (SELECT title FROM resources WHERE id = rep.target_id)
                   ELSE (SELECT title FROM needs WHERE id = rep.target_id) END AS target_title
       FROM reports rep
       JOIN users u ON u.id = rep.reporter_id
       ORDER BY CASE WHEN rep.status = 'open' THEN 0 ELSE 1 END, rep.created_at DESC`
    )
    .all() as Record<string, unknown>[];

  const reports: Report[] = rows.map((r) => ({
    id: String(r.id),
    targetType: r.target_type as 'resource' | 'need',
    targetId: String(r.target_id),
    targetTitle: r.target_title ? String(r.target_title) : '[Deleted listing]',
    reporterId: String(r.reporter_id),
    reporterName: String(r.reporter_name),
    reason: String(r.reason),
    details: String(r.details),
    status: r.status as Report['status'],
    moderatorNote: r.moderator_note ? String(r.moderator_note) : undefined,
    createdAt: String(r.created_at),
    resolvedAt: r.resolved_at ? String(r.resolved_at) : undefined,
  }));

  res.json({
    reports,
    allResources: getAllResources(true),
    allNeeds: getAllNeeds(true),
  });
});

app.patch('/api/moderation/reports/:id', requireAuth, (req, res) => {
  const user = (req as express.Request & { user: User }).user;
  const reportId = String(req.params.id);
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Moderator/Admin role required.' });
    return;
  }
  const { action, moderatorNote } = req.body as {
    action?: 'dismiss' | 'remove_listing';
    moderatorNote?: string;
  };
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId) as Record<string, unknown> | undefined;
  if (!report) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }

  const now = new Date().toISOString();
  if (action === 'remove_listing') {
    const table = report.target_type === 'resource' ? 'resources' : 'needs';
    db.prepare(`UPDATE ${table} SET status = 'removed' WHERE id = ?`).run(String(report.target_id));
    db.prepare(
      `UPDATE reports SET status = 'removed', moderator_note = ?, resolved_at = ? WHERE id = ?`
    ).run(moderatorNote?.trim() || 'Removed by moderator', now, reportId);
  } else {
    db.prepare(
      `UPDATE reports SET status = 'dismissed', moderator_note = ?, resolved_at = ? WHERE id = ?`
    ).run(moderatorNote?.trim() || 'Reviewed and dismissed', now, reportId);
  }

  res.json({ ok: true });
});

app.post('/api/moderation/remove-listing', requireAuth, (req, res) => {
  const user = (req as express.Request & { user: User }).user;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Moderator/Admin role required.' });
    return;
  }
  const { targetType, targetId, reason } = req.body as {
    targetType?: 'resource' | 'need';
    targetId?: string;
    reason?: string;
  };
  if (!targetType || !targetId) {
    res.status(400).json({ error: 'targetType and targetId required.' });
    return;
  }
  const table = targetType === 'resource' ? 'resources' : 'needs';
  db.prepare(`UPDATE ${table} SET status = 'removed' WHERE id = ?`).run(targetId);
  db.prepare(
    `INSERT INTO reports (id, target_type, target_id, reporter_id, reason, details, status, moderator_note, created_at, resolved_at)
     VALUES (?, ?, ?, ?, ?, ?, 'removed', ?, ?, ?)`
  ).run(
    `rep-${crypto.randomUUID()}`,
    targetType,
    targetId,
    user.id,
    reason?.trim() || 'Direct Moderator Removal',
    'Removed during admin audit',
    reason?.trim() || 'Direct removal',
    new Date().toISOString(),
    new Date().toISOString()
  );
  res.json({ ok: true });
});

if (fs.existsSync(CLIENT_DIST_DIR)) {
  app.use(express.static(CLIENT_DIST_DIR));
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      next();
      return;
    }
    res.sendFile(path.join(CLIENT_DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`ReWorth API listening on http://localhost:${PORT}`);
});
