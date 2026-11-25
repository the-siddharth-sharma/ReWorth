import crypto from 'node:crypto';
import { db } from './db.ts';
import { estimateDivertedKg } from '../../shared/constants.ts';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`reworth_salt_v1:${password}`).digest('hex');
}

const SAMPLE_IMAGE_BY_ID: Record<string, string> = {
  'sample-res-fabric': '/images/fabric-bolts.jpg',
  'sample-res-boxes': '/images/cardboard-cartons.jpg',
  'sample-res-electronics': '/images/arduino-kit.jpg',
  'sample-res-books': '/images/engineering-books.jpg',
  'sample-res-wood': '/images/wood-offcuts.jpg',
  'sample-res-completed-jars': '/images/glass-jars.jpg',
};

export function seedIfEmpty(): void {
  const migrateSampleImage = db.prepare(
    `UPDATE resources SET image_url = ? WHERE id = ? AND (image_url IS NULL OR image_url LIKE '/uploads/sample-%')`
  );
  for (const [id, imageUrl] of Object.entries(SAMPLE_IMAGE_BY_ID)) {
    migrateSampleImage.run(imageUrl, id);
  }

  const existingCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (existingCount.cnt > 0) return;

  const now = new Date().toISOString();
  const demoPass = hashPassword('demo1234');

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, account_type, role, organization, area, lat, lng, interests_json, bio, is_demo, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  const demoUsers = [
    [
      'demo-garment',
      'LoomCraft Garments (Sample)',
      'loomcraft@demo.reworth.local',
      demoPass,
      'business',
      'member',
      'LoomCraft Apparel Pvt Ltd',
      'Peenya Industrial Area',
      13.0285,
      77.5197,
      JSON.stringify(['Textiles & Fabric', 'Packaging & Cardboard']),
      'Export garment unit sharing clean end-of-roll fabric and surplus shipping cartons.',
      now,
    ],
    [
      'demo-fashion-student',
      'Ananya Rao (Sample)',
      'ananya@demo.reworth.local',
      demoPass,
      'student',
      'member',
      'Design Studio Collective',
      'Malleswaram',
      13.0031,
      77.5643,
      JSON.stringify(['Textiles & Fabric', 'Art & Craft Supplies']),
      'Final-year fashion student upcycling surplus fabrics into modular outerwear.',
      now,
    ],
    [
      'demo-woodshop',
      'Timberline Joinery (Sample)',
      'timberline@demo.reworth.local',
      demoPass,
      'business',
      'member',
      'Timberline Custom Furniture',
      'Koramangala',
      12.9352,
      77.6245,
      JSON.stringify(['Wood & Carpentry', 'Metals & Hardware']),
      'Furniture workshop diverting seasoned teak and birch plywood offcuts.',
      now,
    ],
    [
      'demo-artisan',
      'Karthik Shetty (Sample)',
      'karthik@demo.reworth.local',
      demoPass,
      'individual',
      'member',
      'Indie Woodcraft Studio',
      'HSR Layout',
      12.9121,
      77.6446,
      JSON.stringify(['Wood & Carpentry', 'Art & Craft Supplies']),
      'Independent artisan crafting desk organizers, trays, and toys from reclaimed offcuts.',
      now,
    ],
    [
      'demo-eng-student',
      'Rohan Verma (Sample)',
      'rohan@demo.reworth.local',
      demoPass,
      'student',
      'member',
      'Maker Lab Society',
      'Indiranagar',
      12.9784,
      77.6408,
      JSON.stringify(['Electronics & Components', 'Books & Stationery']),
      'Final-year ECE student passing on tested microcontroller kits and textbooks.',
      now,
    ],
    [
      'demo-ngo',
      'GreenLoop Community Hub (Sample)',
      'hub@demo.reworth.local',
      demoPass,
      'ngo',
      'member',
      'GreenLoop Circular Trust',
      'Jayanagar',
      12.9299,
      77.5824,
      JSON.stringify(['Books & Stationery', 'Packaging & Cardboard', 'Glass & Containers']),
      'Community reuse collective connecting small businesses and students.',
      now,
    ],
    [
      'demo-admin',
      'ReWorth Moderator (Sample)',
      'admin@demo.reworth.local',
      demoPass,
      'ngo',
      'admin',
      'ReWorth Trust & Safety',
      'Indiranagar',
      12.9784,
      77.6408,
      JSON.stringify(['Textiles & Fabric', 'Electronics & Components']),
      'Platform safety moderator reviewing flagged materials and policy compliance.',
      now,
    ],
  ];

  for (const u of demoUsers) {
    insertUser.run(...(u as [string, string, string, string, string, string, string, string, number, number, string, string, string]));
  }

  const insertResource = db.prepare(`
    INSERT INTO resources (
      id, owner_id, title, description, category, material_tags_json, quantity, unit,
      condition, transfer_type, price_amount, exchange_note, area, pickup_instructions,
      availability, lat, lng, disposal_date, urgency, image_url, safety_confirmed, status, is_sample, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, ?)
  `);

  // 5 real-world examples + 1 completed historical example for Impact metrics
  const resources = [
    [
      'sample-res-fabric',
      'demo-garment',
      'Leftover Cotton & Medium-Weight Denim Fabric Bolts',
      'Clean end-of-roll cotton twill and 10oz denim bolts (widths 42–56 inches) left over after seasonal sampling. Ideal for apparel prototyping, tote bags, or patchwork.',
      'Textiles & Fabric',
      JSON.stringify(['cotton', 'denim', 'fabric', 'twill', 'apparel']),
      28,
      'meters',
      'Usable Offcuts',
      'free',
      null,
      null,
      'Peenya Industrial Area',
      'Gate 3 Receiving Desk — bring a carry bag; security will log pickup.',
      'Mon–Sat, 10:00 AM – 5:00 PM',
      13.0285,
      77.5197,
      '2026-12-08',
      'this_week',
      '/images/fabric-bolts.jpg',
      'available',
      now,
    ],
    [
      'sample-res-boxes',
      'demo-garment',
      'Unused 3-Ply Corrugated Shipping Cartons (14x10x8 in)',
      'Flat-packed surplus shipping cartons from an over-ordered batch. Clean, unprinted, never taped or used.',
      'Packaging & Cardboard',
      JSON.stringify(['cardboard', 'boxes', 'cartons', 'shipping', 'packaging']),
      60,
      'boxes',
      'Like New',
      'low_cost',
      8,
      null,
      'Peenya Industrial Area',
      'Loading Bay B — bundled in stacks of 20.',
      'Weekdays 9:30 AM – 4:30 PM',
      13.0285,
      77.5197,
      '2026-12-15',
      'this_month',
      '/images/cardboard-cartons.jpg',
      'available',
      now,
    ],
    [
      'sample-res-electronics',
      'demo-eng-student',
      'Tested Arduino Uno, Ultrasonic Sensors & Breadboard Kit',
      'Leftover prototyping hardware from completed robotics coursework: 3 Arduino-compatible boards, 2 breadboards, jumper bundles, DHT11 & HC-SR04 sensors. All verified working on bench.',
      'Electronics & Components',
      JSON.stringify(['arduino', 'microcontroller', 'sensors', 'breadboard', 'electronics', 'prototype']),
      18,
      'pieces',
      'Good - Minor Wear',
      'exchange',
      null,
      'Open to swapping for acrylic sheets or solder wire, or free for student demo.',
      'Indiranagar',
      'Meet near Indiranagar Metro Station East Exit.',
      'Evenings 6:00 PM – 8:30 PM & Weekends',
      12.9784,
      77.6408,
      '2026-12-20',
      'flexible',
      '/images/arduino-kit.jpg',
      'available',
      now,
    ],
    [
      'sample-res-books',
      'demo-eng-student',
      'Sem 3–6 Engineering & Embedded Systems Textbooks',
      'Clean paperback textbooks (Signals & Systems, Digital Logic Design, Microprocessors, Engineering Math) with minimal pencil margin notes.',
      'Books & Stationery',
      JSON.stringify(['textbooks', 'books', 'engineering', 'electronics', 'study']),
      6,
      'books',
      'Good - Minor Wear',
      'free',
      null,
      null,
      'Indiranagar',
      'Pickup from Indiranagar 100ft Road community shelf.',
      'Daily 10:00 AM – 7:00 PM',
      12.9784,
      77.6408,
      '2026-12-30',
      'flexible',
      '/images/engineering-books.jpg',
      'available',
      now,
    ],
    [
      'sample-res-wood',
      'demo-woodshop',
      'Seasoned Teak & Birch Plywood Workshop Offcuts',
      'Clean kiln-dried teak blocks (12–28 cm lengths) and 12mm birch plywood offcuts from custom shelving builds. Zero nails, unpainted.',
      'Wood & Carpentry',
      JSON.stringify(['wood', 'teak', 'plywood', 'offcuts', 'carpentry', 'craft']),
      22,
      'pieces',
      'Usable Offcuts',
      'free',
      null,
      null,
      'Koramangala',
      'Koramangala 4th Block Workshop back courtyard.',
      'Tue–Sat, 11:00 AM – 6:00 PM',
      12.9352,
      77.6245,
      '2026-12-01',
      'urgent',
      '/images/wood-offcuts.jpg',
      'available',
      now,
    ],
    [
      'sample-res-completed-jars',
      'demo-ngo',
      'Sanitized 500ml Glass Storage Jars (Batch Completed)',
      'Food-grade glass jars collected from a neighborhood zero-waste cafe.',
      'Glass & Containers',
      JSON.stringify(['glass', 'jars', 'containers']),
      30,
      'jars',
      'Like New',
      'free',
      null,
      null,
      'Jayanagar',
      'Jayanagar 4th Block Hub',
      'Completed',
      12.9299,
      77.5824,
      '2026-11-18',
      'this_week',
      '/images/glass-jars.jpg',
      'completed',
      now,
    ],
  ];

  for (const r of resources) {
    insertResource.run(...(r as [string, string, string, string, string, string, number, string, string, string, number | null, string | null, string, string, string, number, number, string, string, string | null, string, string]));
  }

  const insertNeed = db.prepare(`
    INSERT INTO needs (
      id, requester_id, title, description, category, material_tags_json, quantity, unit,
      purpose, area, lat, lng, deadline, preferred_transfer, max_budget, status, is_sample, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  const needs = [
    [
      'sample-need-fashion',
      'demo-fashion-student',
      'Need Denim & Cotton Fabric for College Fashion Project',
      'Looking for leftover medium-weight cotton or denim yardage (at least 15 meters) for a zero-waste capsule collection.',
      'Textiles & Fabric',
      JSON.stringify(['denim', 'cotton', 'fabric', 'apparel']),
      15,
      'meters',
      'College sustainable fashion design project',
      'Malleswaram',
      13.0031,
      77.5643,
      '2026-12-18',
      'free_or_exchange',
      null,
      'open',
      now,
    ],
    [
      'sample-need-packaging',
      'demo-ngo',
      'Small Business Packaging: Need 40 Corrugated Boxes',
      'Local handmade soap micro-business cooperative needs clean medium shipping cartons for holiday dispatch.',
      'Packaging & Cardboard',
      JSON.stringify(['cardboard', 'boxes', 'cartons', 'packaging', 'shipping']),
      40,
      'boxes',
      'Eco-friendly small business order packaging',
      'Jayanagar',
      12.9299,
      77.5824,
      '2026-12-14',
      'low_cost_ok',
      12,
      'open',
      now,
    ],
    [
      'sample-need-components',
      'demo-artisan',
      'Need Microcontroller & Sensors for Interactive Lamp Prototype',
      'Building a kinetic wooden desk lamp prototype and need an Arduino-style board, breadboard, and ultrasonic sensor.',
      'Electronics & Components',
      JSON.stringify(['arduino', 'microcontroller', 'sensor', 'breadboard', 'prototype']),
      10,
      'pieces',
      'Hardware prototype build',
      'HSR Layout',
      12.9121,
      77.6446,
      '2026-12-22',
      'free_or_exchange',
      null,
      'open',
      now,
    ],
    [
      'sample-need-books',
      'demo-fashion-student',
      'Junior Student Needs Digital Logic & Engineering Textbooks',
      'Collecting semester 3–4 engineering textbooks for my younger brother starting diploma coursework.',
      'Books & Stationery',
      JSON.stringify(['textbooks', 'books', 'engineering', 'logic']),
      4,
      'books',
      'Junior student semester study',
      'Malleswaram',
      13.0031,
      77.5643,
      '2026-12-28',
      'free_only',
      null,
      'open',
      now,
    ],
    [
      'sample-need-wood',
      'demo-artisan',
      'Artisan Seeking Teak & Plywood Offcuts for Desk Organizers',
      'Need clean hardwood or plywood scraps (10–30 cm) to turn into phone stands, coasters, and desk trays.',
      'Wood & Carpentry',
      JSON.stringify(['wood', 'teak', 'plywood', 'offcuts', 'craft']),
      15,
      'pieces',
      'Turning workshop wood scraps into desk products',
      'HSR Layout',
      12.9121,
      77.6446,
      '2026-12-05',
      'free_or_exchange',
      null,
      'open',
      now,
    ],
  ];

  for (const n of needs) {
    insertNeed.run(...(n as [string, string, string, string, string, string, number, string, string, string, number, number, string, string, number | null, string, string]));
  }

  // Seed one completed sample exchange and one pending sample exchange so workflow & impact states are demonstrable immediately (clearly marked is_sample=1)
  const insertExchange = db.prepare(`
    INSERT INTO exchanges (
      id, resource_id, need_id, owner_id, requester_id, requested_quantity, unit,
      status, initial_note, owner_note, estimated_kg, is_sample, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  insertExchange.run(
    'sample-ex-completed',
    'sample-res-completed-jars',
    null,
    'demo-ngo',
    'demo-artisan',
    30,
    'jars',
    'completed',
    'Would love to reuse these jars for storing wood stain finishes and beeswax.',
    'Picked up at Jayanagar Hub — thanks for keeping them in circulation!',
    estimateDivertedKg('Glass & Containers', 30, 'jars'),
    now,
    now
  );

  insertExchange.run(
    'sample-ex-pending',
    'sample-res-wood',
    'sample-need-wood',
    'demo-woodshop',
    'demo-artisan',
    15,
    'pieces',
    'pending',
    'Hi Timberline team! I can pick up 15 teak/plywood offcuts this Thursday afternoon for my desk organizer batch.',
    null,
    estimateDivertedKg('Wood & Carpentry', 15, 'pieces'),
    now,
    now
  );

  const insertMsg = db.prepare(`
    INSERT INTO exchange_messages (id, exchange_id, sender_id, body, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertMsg.run(
    'sample-msg-1',
    'sample-ex-pending',
    'demo-artisan',
    'Hi! Let me know if Thursday 3 PM works for loading bay pickup in Koramangala.',
    now
  );

  // Seed 1 open sample moderation report so Admin Moderation Queue shows a realistic workflow item
  db.prepare(`
    INSERT INTO reports (id, target_type, target_id, reporter_id, reason, details, status, created_at)
    VALUES (?, 'resource', 'sample-res-boxes', 'demo-ngo', 'Clarify Pricing / Condition', 'Sample moderation check: confirm ₹8/box low-cost fee is per carton and cartons are dry.', 'open', ?)
  `).run('sample-report-1', now);
}
