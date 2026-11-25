# ReWorth — Architecture & Hackathon Deliverables

> **"One person's waste. Another person's opportunity."**

ReWorth is a **need-based circular resource exchange platform** connecting surplus, leftover, or discarded-but-usable materials directly with verified community needs.

---

## 1. Product Architecture

- **Frontend (`client/`)**: React 19 + TypeScript + Vite + Tailwind CSS v4. Single-page workspace communicating with the REST API over `/api/*` (proxied to port `3001` in Vite dev).
- **Shared Domain Logic (`shared/`)**:
  - `types.ts`: Shared TypeScript contracts across backend and frontend.
  - `constants.ts`: Categories, conditions, transfer types, city area hubs with coordinates, and transparent category weight-diversion conversion factors.
  - `safety.ts`: Deterministic keyword/pattern guardrail blocking hazardous chemicals, pharmaceuticals/medicines, medical waste, leaking batteries, and unsafe materials.
  - `matching.ts`: Transparent rule-based resource-to-need scoring and explanation engine.
- **Backend (`server/`)**: Node.js + Express 5 + built-in `node:sqlite` (`DatabaseSync` in WAL mode) persisting to `server/data/reworth.sqlite` and storing uploaded images in `uploads/`.

---

## 2. User Journey

1. **Onboarding & Authentication**: User creates an account (`Individual`, `Student`, `Business`, or `NGO`) with neighborhood area & material interests, or signs in via a clearly labelled **Demo Account** (1-click switcher).
2. **Offer Resource or Post Need**:
   - **Supplier** uploads a photo, enters quantity/unit, condition, transfer terms (`Free`, `Exchange`, `Low-Cost`), pickup instructions, and disposal urgency, confirms the Safety Declaration, and publishes. Immediately sees matching open Needs.
   - **Seeker** posts a material Need with quantity, purpose, deadline, and budget preference. Immediately sees matching available Resources.
3. **Smart Matching & Discovery**: Users browse Available Resources, Nearby Opportunities, Recent Needs, and the Smart Matches Explorer with exact score breakdowns and "Why these match" explanations.
4. **Exchange & Handover Coordination**: Seeker initiates an exchange request; Owner accepts or rejects; both coordinate pickup time/place via persistent exchange messages (no integrated shipping claimed); Owner or Seeker marks handover `Completed`.
5. **Impact & Moderation**: Completed exchanges decrement resource quantities and update actual/estimated impact metrics. Any user can flag unsafe listings; Moderators review and dismiss or remove listings.

---

## 3. Database Schema (`server/src/db.ts`)

- `users`: `id, name, email, password_hash, account_type, role, organization, area, lat, lng, interests_json, bio, is_demo, created_at`
- `sessions`: `token, user_id, created_at`
- `resources`: `id, owner_id, title, description, category, material_tags_json, quantity, unit, condition, transfer_type, price_amount, exchange_note, area, pickup_instructions, availability, lat, lng, disposal_date, urgency, image_url, safety_confirmed, status, is_sample, created_at`
- `needs`: `id, requester_id, title, description, category, material_tags_json, quantity, unit, purpose, area, lat, lng, deadline, preferred_transfer, max_budget, status, is_sample, created_at`
- `exchanges`: `id, resource_id, need_id, owner_id, requester_id, requested_quantity, unit, status, initial_note, owner_note, estimated_kg, is_sample, created_at, updated_at`
- `exchange_messages`: `id, exchange_id, sender_id, body, created_at`
- `reports`: `id, target_type, target_id, reporter_id, reason, details, status, moderator_note, created_at, resolved_at`

---

## 4. Complete Page Structure

| View | Purpose |
| :--- | :--- |
| **Discover** | Recommended matches strip, nearby opportunities, filterable available resources, recent community needs |
| **Smart Matches** | Full Resource ↔ Need pairings with transparent 100-pt score breakdowns and quick exchange initiation |
| **Offer Resource** | Validated listing form, image upload, live safety screening, instant post-publish matches |
| **Post Need** | Material need form with purpose/deadline/budget, instant post-publish resource matches |
| **Exchanges** | Status pipeline (`Pending`, `Accepted`, `Completed`, `Cancelled`), owner accept/reject, coordination chat |
| **Impact** | Actual completed counts vs estimated kg diverted, Sample vs Live separation, category reuse bars |
| **Moderation** | Admin report review queue (`Dismiss` / `Remove Listing`) and full listing audit table |
| **Profile & Auth Modal** | Account creation, neighborhood/interests update, and 1-click Demo Role Switcher |

---

## 5. Matching Algorithm (`shared/matching.ts`)

Deterministic **0–100 point** weighted rule engine (no AI claims):
1. **Category & Material Keywords (40 pts max)**: Exact category (`+25`) or adjacent category (`+10`), plus normalized material keyword overlap with synonym mapping (e.g., `carton` → `cardboard`, `cloth` → `fabric`, `arduino` → `microcontroller`) up to `+15`.
2. **Quantity & Unit Fit (20 pts max)**: Normalized unit comparison (`>=100%` coverage `+20`, `>=50%` `+14`, partial `+8`).
3. **Proximity (20 pts max)**: Haversine distance between pickup area and need area (`<=4 km` `+20`, `<=10 km` `+15`, `<=20 km` `+10`, `>20 km` `+4`).
4. **Timeline & Urgency (10 pts max)**: Rewards urgent disposal windows before disposal date and alignment with need deadline.
5. **Transfer & Budget Fit (10 pts max)**: `Free` (`+10`), `Exchange` when accepted (`+9`), `Low-Cost` within max budget (`+9`).

Every `MatchResult` generates human-readable `reasons[]` and `warnings[]`.

---

## 6. Working Prototype Plan (Implemented Stages)

- Stage 1: Monorepo workspace (`client`, `server`, `shared`) & shared contracts.
- Stage 2: SQLite schema, REST API, image upload endpoint, and clearly labelled 5-scenario sample seed.
- Stage 3: Rule-based matching engine + safety screening + automated unit tests.
- Stage 4: Responsive React + TypeScript UI with full resource-to-need-to-exchange-to-impact journey.
- Stage 5: Build verification, API smoke tests, and documentation.

---

## 7. Security & Moderation Considerations

- **Prohibited Materials Screening**: Both client-side live warning and server-side hard rejection (`checkListingSafety`) block pharmaceuticals, medicines, medical waste, toxic solvents, acids, asbestos, explosives, and damaged/leaking batteries.
- **Mandatory Safety Attestation**: Resource submissions require explicit `safetyConfirmed` checkbox verification.
- **Role-Based Authorization**: Session bearer tokens verified against SQLite; only resource owners can accept/reject exchanges; only `admin` role can access moderation endpoints.
- **Honest Liability & Scope**: Explicitly states ReWorth does not inspect materials in person and does not provide integrated shipping/delivery.
- **Prototype Limitations**: Password hashing uses salted SHA-256 (`node:crypto`) for zero-dependency hackathon portability; production deployment should upgrade to `argon2`/`bcrypt`, HTTPS-only `HttpOnly` cookies, and object storage (e.g., S3/GCS) for images.

---

## 8. Testing Checklist

- [x] Unit tests (`npm test`): Match scoring, own-listing filtering, category exclusion, safety keyword blocking + safe override.
- [x] Backend TypeScript compile (`npm --prefix server run build`).
- [x] Frontend TypeScript + Vite production build (`npm --prefix client run build`).
- [x] End-to-end API + production bundle smoke test (demo login, safety keyword block returning 400, live resource creation + need matching, exchange request → accept → complete, live Impact increment, and served HTML check).

---

## 9. Deployment Instructions

### Local Development
```bash
npm install && npm --prefix server install && npm --prefix client install
npm run dev
```
- Frontend runs at `http://localhost:5173`
- Backend API runs at `http://localhost:3001`

### Production Build & Serving
```bash
npm run build
npm run start
```
To serve the built `client/dist` behind a reverse proxy (Nginx/Caddy) or Render/Railway:
1. Build both packages (`npm run build`).
2. Host `server/dist/server/src/index.js` on a persistent Node 22+ volume (so `server/data/reworth.sqlite` and `uploads/` persist across restarts) and serve `client/dist` as static assets routing `/api` and `/uploads` to the Node server.
