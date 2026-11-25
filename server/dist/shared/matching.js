const STOP_WORDS = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'have', 'need', 'needed',
    'unused', 'leftover', 'available', 'good', 'condition', 'project', 'make',
    'some', 'about', 'into', 'your', 'free', 'pickup', 'area', 'near', 'per',
]);
const SYNONYM_MAP = {
    carton: 'cardboard',
    cartons: 'cardboard',
    boxes: 'box',
    corrugated: 'cardboard',
    cloth: 'fabric',
    textile: 'fabric',
    textiles: 'fabric',
    fabrics: 'fabric',
    garment: 'fabric',
    cotton: 'cotton',
    denim: 'denim',
    timber: 'wood',
    lumber: 'wood',
    plywood: 'wood',
    offcuts: 'scrap',
    offcut: 'scrap',
    scraps: 'scrap',
    textbooks: 'book',
    textbook: 'book',
    books: 'book',
    manuals: 'book',
    electronic: 'electronics',
    components: 'component',
    sensors: 'sensor',
    microcontrollers: 'microcontroller',
    arduino: 'microcontroller',
    esp32: 'microcontroller',
    resistors: 'resistor',
    jars: 'jar',
    containers: 'container',
};
const RELATED_CATEGORIES = {
    'Textiles & Fabric': ['Art & Craft Supplies'],
    'Art & Craft Supplies': ['Textiles & Fabric', 'Wood & Carpentry', 'Packaging & Cardboard'],
    'Wood & Carpentry': ['Art & Craft Supplies', 'Metals & Hardware'],
    'Metals & Hardware': ['Wood & Carpentry', 'Electronics & Components'],
    'Electronics & Components': ['Metals & Hardware'],
    'Packaging & Cardboard': ['Art & Craft Supplies', 'Glass & Containers'],
    'Glass & Containers': ['Packaging & Cardboard'],
};
export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
}
export function extractKeywords(parts) {
    const tokens = new Set();
    for (const part of parts) {
        const cleaned = part.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
        for (const raw of cleaned.split(/\s+/)) {
            if (raw.length < 3 || STOP_WORDS.has(raw))
                continue;
            tokens.add(SYNONYM_MAP[raw] ?? raw);
        }
    }
    return tokens;
}
function normalizeUnit(unit) {
    const u = unit.trim().toLowerCase();
    if (['meter', 'meters', 'm', 'mtr', 'mtrs'].includes(u))
        return 'meters';
    if (['kg', 'kgs', 'kilogram', 'kilograms'].includes(u))
        return 'kg';
    if (['piece', 'pieces', 'pcs', 'pc', 'unit', 'units'].includes(u))
        return 'pieces';
    if (['box', 'boxes', 'carton', 'cartons'].includes(u))
        return 'boxes';
    if (['book', 'books'].includes(u))
        return 'books';
    if (['jar', 'jars'].includes(u))
        return 'jars';
    if (['plank', 'planks'].includes(u))
        return 'planks';
    if (['sheet', 'sheets'].includes(u))
        return 'sheets';
    if (['kit', 'kits'].includes(u))
        return 'kits';
    return u;
}
export function scoreMatch(resource, need) {
    const reasons = [];
    const warnings = [];
    // 1. Category & Material Overlap (max 40 pts: 25 category + 15 material keywords)
    let categoryScore = 0;
    if (resource.category === need.category) {
        categoryScore = 25;
        reasons.push(`Exact category match (${resource.category})`);
    }
    else if (RELATED_CATEGORIES[resource.category]?.includes(need.category)) {
        categoryScore = 10;
        reasons.push(`Adjacent category (${resource.category} ↔ ${need.category})`);
    }
    else {
        warnings.push(`Different categories (${resource.category} vs ${need.category})`);
    }
    const resTokens = extractKeywords([
        resource.title,
        resource.description,
        ...resource.materialTags,
    ]);
    const needTokens = extractKeywords([
        need.title,
        need.description,
        need.purpose,
        ...need.materialTags,
    ]);
    const sharedTokens = [];
    for (const token of needTokens) {
        if (resTokens.has(token))
            sharedTokens.push(token);
    }
    const keywordRatio = needTokens.size > 0 ? Math.min(1, sharedTokens.length / Math.min(4, needTokens.size)) : 0;
    const keywordScore = Math.round(keywordRatio * 15);
    if (sharedTokens.length > 0) {
        reasons.push(`Shared material terms: ${sharedTokens.slice(0, 4).join(', ')}`);
    }
    else if (categoryScore < 25) {
        warnings.push('No direct material keyword overlap found');
    }
    const categoryAndMaterial = Math.min(40, categoryScore + keywordScore);
    // 2. Quantity Fit (max 20 pts)
    const resUnit = normalizeUnit(resource.unit);
    const needUnit = normalizeUnit(need.unit);
    let quantityFit = 0;
    if (resUnit === needUnit && need.quantity > 0) {
        const coverage = resource.quantity / need.quantity;
        if (coverage >= 1) {
            quantityFit = 20;
            reasons.push(`Covers 100% of needed ${need.quantity} ${need.unit} (${resource.quantity} ${resource.unit} available)`);
        }
        else if (coverage >= 0.5) {
            quantityFit = 14;
            const pct = Math.round(coverage * 100);
            reasons.push(`Covers ${pct}% of needed quantity (${resource.quantity} of ${need.quantity} ${need.unit})`);
        }
        else {
            quantityFit = 8;
            const pct = Math.max(1, Math.round(coverage * 100));
            warnings.push(`Partial quantity only (${pct}%: ${resource.quantity} vs ${need.quantity} ${need.unit} needed)`);
        }
    }
    else {
        quantityFit = 8;
        warnings.push(`Units differ (${resource.unit} vs ${need.unit}) — confirm volume in chat`);
    }
    // 3. Proximity (max 20 pts)
    const distanceKm = haversineDistanceKm(resource.lat, resource.lng, need.lat, need.lng);
    let proximity = 4;
    if (distanceKm <= 4) {
        proximity = 20;
        reasons.push(`Very close pickup: ${distanceKm} km (${resource.area} → ${need.area})`);
    }
    else if (distanceKm <= 10) {
        proximity = 15;
        reasons.push(`Nearby pickup: ${distanceKm} km (${resource.area} → ${need.area})`);
    }
    else if (distanceKm <= 20) {
        proximity = 10;
        reasons.push(`Same-city pickup: ${distanceKm} km (${resource.area} → ${need.area})`);
    }
    else {
        proximity = 4;
        warnings.push(`Longer pickup distance: ${distanceKm} km`);
    }
    // 4. Timeline & Urgency Alignment (max 10 pts)
    let timeline = 5;
    const disposalMs = Date.parse(resource.disposalDate);
    const deadlineMs = Date.parse(need.deadline);
    const nowMs = Date.now();
    const daysToDisposal = Number.isNaN(disposalMs)
        ? 30
        : Math.ceil((disposalMs - nowMs) / (1000 * 60 * 60 * 24));
    const daysToDeadline = Number.isNaN(deadlineMs)
        ? 30
        : Math.ceil((deadlineMs - nowMs) / (1000 * 60 * 60 * 24));
    if (daysToDisposal >= 0 && daysToDeadline >= 0) {
        if (resource.urgency === 'urgent' || daysToDisposal <= 5) {
            timeline = 10;
            reasons.push(`Urgent disposal window (${resource.disposalDate}) — claim before disposal`);
        }
        else if (daysToDisposal >= daysToDeadline) {
            timeline = 9;
            reasons.push(`Available through your ${need.deadline} deadline`);
        }
        else {
            timeline = 7;
            reasons.push(`Pickup needed by ${resource.disposalDate} (before ${need.deadline} deadline)`);
        }
    }
    else if (daysToDisposal < 0) {
        timeline = 2;
        warnings.push('Intended disposal date has passed — confirm still available');
    }
    // 5. Transfer Type & Budget Fit (max 10 pts)
    let budgetFit = 0;
    if (resource.transferType === 'free') {
        budgetFit = 10;
        reasons.push('Free pickup matches any budget');
    }
    else if (resource.transferType === 'exchange') {
        if (need.preferredTransfer !== 'free_only') {
            budgetFit = 9;
            reasons.push('Exchange/barter aligns with your transfer preference');
        }
        else {
            budgetFit = 4;
            warnings.push('Owner prefers exchange/barter while need is set to Free only');
        }
    }
    else if (resource.transferType === 'low_cost') {
        const price = resource.priceAmount ?? 0;
        if (need.preferredTransfer === 'low_cost_ok' && (need.maxBudget === null || price <= need.maxBudget)) {
            budgetFit = 9;
            reasons.push(`Low-cost transfer (₹${price}) fits your budget`);
        }
        else if (need.preferredTransfer === 'low_cost_ok' && need.maxBudget !== null && price > need.maxBudget) {
            budgetFit = 3;
            warnings.push(`Asking price (₹${price}) exceeds max budget (₹${need.maxBudget})`);
        }
        else {
            budgetFit = 2;
            warnings.push(`Low-cost item (₹${price}) vs Free/Exchange preference`);
        }
    }
    const breakdown = {
        categoryAndMaterial,
        quantityFit,
        proximity,
        timeline,
        budgetFit,
    };
    const score = Math.min(100, categoryAndMaterial + quantityFit + proximity + timeline + budgetFit);
    return {
        id: `${resource.id}__${need.id}`,
        resource,
        need,
        score,
        breakdown,
        reasons,
        warnings,
        distanceKm,
    };
}
export function findMatchesForNeed(need, resources, minScore = 40) {
    return resources
        .filter((r) => r.status === 'available' && r.ownerId !== need.requesterId)
        .map((r) => scoreMatch(r, need))
        .filter((m) => m.score >= minScore && m.breakdown.categoryAndMaterial >= 10)
        .sort((a, b) => b.score - a.score);
}
export function findMatchesForResource(resource, needs, minScore = 40) {
    return needs
        .filter((n) => n.status === 'open' && n.requesterId !== resource.ownerId)
        .map((n) => scoreMatch(resource, n))
        .filter((m) => m.score >= minScore && m.breakdown.categoryAndMaterial >= 10)
        .sort((a, b) => b.score - a.score);
}
export function findAllRecommendedMatches(resources, needs, minScore = 55) {
    const results = [];
    for (const need of needs) {
        if (need.status !== 'open')
            continue;
        for (const resource of resources) {
            if (resource.status !== 'available')
                continue;
            if (resource.ownerId === need.requesterId)
                continue;
            const match = scoreMatch(resource, need);
            if (match.score >= minScore && match.breakdown.categoryAndMaterial >= 15) {
                results.push(match);
            }
        }
    }
    return results.sort((a, b) => b.score - a.score);
}
