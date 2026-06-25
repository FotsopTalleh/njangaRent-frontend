// src/data/dummyListings.ts
// Realistic dummy property listings for Buea / Molyko, Cameroon
// Prices are authentic to the local market (XAF)
import type { Listing } from "@/api/listings.api";

// African/Cameroonian housing photo URLs (Unsplash, reliable and free)
const IMGS = {
  molykoBlock:   "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
  concreteFront: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
  hostelCourt:   "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
  studioInt:     "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  roomTiled:     "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80",
  aptLiving:     "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  aptKitchen:    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
  selfContained: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
  gatedExt:      "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80",
  tropicalHouse: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  compoundGate:  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  hostelRoom:    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
};

function d(days: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().split("T")[0];
}

export const DUMMY_LISTINGS: Listing[] = [
  // ── SINGLE ROOMS (monthly: 30k–50k XAF) ──────────────────────────────────
  {
    id: "dummy-1",
    landlordId: "lld-001",
    title: "Clean single room — Molyko Junction",
    description:
      "Quiet and well-ventilated room in a secure compound. Shared bathroom with only 2 other rooms. Walking distance to Molyko market, pharmacies, and transport. Perfect for a young professional or student. Water and electricity included. No cooking in rooms.",
    propertyType: "single_room",
    rentAmount: 35_000,
    rentPeriod: "monthly",
    availableFrom: d(0),
    amenities: ["water", "electricity", "security"],
    maxOccupants: 1,
    exteriorImages: [IMGS.molykoBlock, IMGS.compoundGate],
    roomImages: [IMGS.roomTiled],
    location: { lat: 4.1551, lng: 9.2461, displayAddress: "Molyko Junction, Buea" },
    distanceFromUbKm: 0.25,
    status: "active",
    viewsCount: 142,
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-20T08:00:00Z",
  },
  {
    id: "dummy-2",
    landlordId: "lld-002",
    title: "Furnished single room — Molyko main road",
    description:
      "Furnished room with built-in wardrobe, desk, and fan. Tiled floor. Shared bathroom and toilet. The compound has 24/7 water supply and a generator for power cuts. Located on the main road — easy taxis and motos. Ideal for individuals.",
    propertyType: "single_room",
    rentAmount: 45_000,
    rentPeriod: "monthly",
    availableFrom: d(7),
    amenities: ["water", "electricity", "wifi", "security", "generator"],
    maxOccupants: 1,
    exteriorImages: [IMGS.tropicalHouse],
    roomImages: [IMGS.roomTiled, IMGS.hostelRoom],
    location: { lat: 4.1537, lng: 9.2481, displayAddress: "Molyko Main Road, Buea" },
    distanceFromUbKm: 0.4,
    status: "active",
    viewsCount: 89,
    createdAt: "2026-06-05T10:00:00Z",
    updatedAt: "2026-06-21T08:00:00Z",
  },
  {
    id: "dummy-3",
    landlordId: "lld-003",
    title: "Budget single room — Great Soppo",
    description:
      "Affordable room in a quiet neighbourhood. 5 minutes by moto to Molyko market. The compound is clean and family-managed. Water tank on-site. Best for someone looking for peace and affordability.",
    propertyType: "single_room",
    rentAmount: 30_000,
    rentPeriod: "monthly",
    availableFrom: d(0),
    amenities: ["water", "electricity"],
    maxOccupants: 1,
    exteriorImages: [IMGS.concreteFront],
    roomImages: [IMGS.hostelRoom],
    location: { lat: 4.1456, lng: 9.2389, displayAddress: "Great Soppo, Buea" },
    distanceFromUbKm: 1.3,
    status: "active",
    viewsCount: 211,
    createdAt: "2026-05-28T08:00:00Z",
    updatedAt: "2026-06-18T08:00:00Z",
  },
  {
    id: "dummy-4",
    landlordId: "lld-004",
    title: "Spacious room — Bonduma",
    description:
      "Large room with separate entrance in a gated compound. Ceramic tiles, ceiling fan, strong wooden door. Shared toilet and shower. Quiet, safe street. Landlord lives on-site. Close to Bonduma market.",
    propertyType: "single_room",
    rentAmount: 40_000,
    rentPeriod: "monthly",
    availableFrom: d(14),
    amenities: ["water", "electricity", "security", "parking"],
    maxOccupants: 2,
    exteriorImages: [IMGS.gatedExt, IMGS.compoundGate],
    roomImages: [IMGS.roomTiled],
    location: { lat: 4.1617, lng: 9.2513, displayAddress: "Bonduma, Buea" },
    distanceFromUbKm: 1.8,
    status: "active",
    viewsCount: 67,
    createdAt: "2026-06-10T08:00:00Z",
    updatedAt: "2026-06-22T08:00:00Z",
  },
  {
    id: "dummy-5",
    landlordId: "lld-005",
    title: "Single room — Mile 16 Bolifamba",
    description:
      "Newly painted room with good ventilation. Shared facilities. Peaceful compound with ample parking. Easy access to Mile 16 junction and frequent transport to Buea Town and Molyko. Great for workers or residents.",
    propertyType: "single_room",
    rentAmount: 32_000,
    rentPeriod: "monthly",
    availableFrom: d(0),
    amenities: ["water", "electricity", "parking"],
    maxOccupants: 1,
    exteriorImages: [IMGS.hostelCourt],
    roomImages: [IMGS.hostelRoom],
    location: { lat: 4.1326, lng: 9.2291, displayAddress: "Mile 16 Bolifamba, Buea" },
    distanceFromUbKm: 2.9,
    status: "active",
    viewsCount: 34,
    createdAt: "2026-06-15T08:00:00Z",
    updatedAt: "2026-06-23T08:00:00Z",
  },

  // ── SELF-CONTAINED (monthly: 50k–80k XAF) ────────────────────────────────
  {
    id: "dummy-6",
    landlordId: "lld-006",
    title: "Self-contained — Molyko (private bath & kitchen)",
    description:
      "Your own private bathroom and mini kitchen. Well-lit room with tiled floor. Located inside a secured compound with CCTV. Generator backup. Very popular — contact quickly. Ideal for individuals or couples.",
    propertyType: "self_contained",
    rentAmount: 60_000,
    rentPeriod: "monthly",
    availableFrom: d(0),
    amenities: ["water", "electricity", "wifi", "security", "kitchen", "generator"],
    maxOccupants: 2,
    exteriorImages: [IMGS.molykoBlock, IMGS.gatedExt],
    roomImages: [IMGS.selfContained, IMGS.aptKitchen],
    location: { lat: 4.1545, lng: 9.2468, displayAddress: "Molyko, Buea" },
    distanceFromUbKm: 0.35,
    status: "active",
    viewsCount: 308,
    createdAt: "2026-05-20T08:00:00Z",
    updatedAt: "2026-06-24T08:00:00Z",
  },
  {
    id: "dummy-7",
    landlordId: "lld-007",
    title: "Self-contained — Santa Barbara",
    description:
      "Modern self-contained unit with private bathroom, kitchenette, and large window. Mountain views from the terrace. Close to Santa Barbara restaurant strip. Water included. Monthly or yearly rental available.",
    propertyType: "self_contained",
    rentAmount: 70_000,
    rentPeriod: "monthly",
    availableFrom: d(21),
    amenities: ["water", "electricity", "security", "kitchen"],
    maxOccupants: 2,
    exteriorImages: [IMGS.tropicalHouse, IMGS.compoundGate],
    roomImages: [IMGS.selfContained],
    location: { lat: 4.1589, lng: 9.2501, displayAddress: "Santa Barbara, Buea" },
    distanceFromUbKm: 0.9,
    status: "active",
    viewsCount: 122,
    createdAt: "2026-06-08T08:00:00Z",
    updatedAt: "2026-06-20T08:00:00Z",
  },

  // ── STUDIOS (yearly: 500k–700k XAF) ──────────────────────────────────────
  {
    id: "dummy-8",
    landlordId: "lld-008",
    title: "Furnished studio — Molyko",
    description:
      "Open-plan studio apartment with built-in bed frame, wardrobe, bathroom, and kitchenette. WiFi-ready. Uninterrupted water supply. Generator on-site. Located in a clean, modern mini-estate. Perfect for young professionals.",
    propertyType: "studio",
    rentAmount: 600_000,
    rentPeriod: "yearly",
    availableFrom: d(0),
    amenities: ["water", "electricity", "wifi", "security", "kitchen", "generator"],
    maxOccupants: 2,
    exteriorImages: [IMGS.molykoBlock],
    roomImages: [IMGS.studioInt, IMGS.aptKitchen],
    location: { lat: 4.1540, lng: 9.2455, displayAddress: "Molyko, Buea" },
    distanceFromUbKm: 0.2,
    status: "active",
    viewsCount: 445,
    createdAt: "2026-05-15T08:00:00Z",
    updatedAt: "2026-06-22T08:00:00Z",
  },
  {
    id: "dummy-9",
    landlordId: "lld-009",
    title: "Modern studio — Bonduma",
    description:
      "Contemporary studio with high-quality tiles, French windows, and a modern bathroom. All-inclusive (water, electricity up to 30,000/month). Parking available. Perfect for a couple or single professional. Quiet area, close to Bonduma administration.",
    propertyType: "studio",
    rentAmount: 650_000,
    rentPeriod: "yearly",
    availableFrom: d(30),
    amenities: ["water", "electricity", "security", "parking", "kitchen"],
    maxOccupants: 2,
    exteriorImages: [IMGS.concreteFront, IMGS.gatedExt],
    roomImages: [IMGS.studioInt],
    location: { lat: 4.1630, lng: 9.2520, displayAddress: "Bonduma, Buea" },
    distanceFromUbKm: 2.1,
    status: "active",
    viewsCount: 198,
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-21T08:00:00Z",
  },

  // ── APARTMENTS (yearly: 650k–1M XAF) ─────────────────────────────────────
  {
    id: "dummy-10",
    landlordId: "lld-010",
    title: "2-bedroom apartment — Molyko",
    description:
      "Spacious 2-bedroom apartment with sitting room, kitchen, and 2 bathrooms. Fully tiled. Generator and water tanker supplied. Gated compound with security guard. Suitable for a family, couple, or sharers. Landlord based abroad.",
    propertyType: "apartment",
    rentAmount: 850_000,
    rentPeriod: "yearly",
    availableFrom: d(0),
    amenities: ["water", "electricity", "wifi", "security", "parking", "kitchen", "generator"],
    maxOccupants: 4,
    exteriorImages: [IMGS.gatedExt, IMGS.tropicalHouse],
    roomImages: [IMGS.aptLiving, IMGS.aptKitchen, IMGS.selfContained],
    location: { lat: 4.1548, lng: 9.2474, displayAddress: "Molyko, Buea" },
    distanceFromUbKm: 0.5,
    status: "active",
    viewsCount: 512,
    createdAt: "2026-05-10T08:00:00Z",
    updatedAt: "2026-06-24T08:00:00Z",
  },
  {
    id: "dummy-11",
    landlordId: "lld-011",
    title: "Executive 3-bedroom apartment — Buea Town",
    description:
      "Premium 3-bedroom apartment in a secure estate. Marble floors, DSTV cabling, borehole water, inverter system. Sitting room, dining room, modern kitchen, 3 bathrooms. Rare in Buea — perfect for families or senior professionals. Caretaker on-site.",
    propertyType: "apartment",
    rentAmount: 1_000_000,
    rentPeriod: "yearly",
    availableFrom: d(45),
    amenities: ["water", "electricity", "security", "parking", "kitchen", "generator", "wifi"],
    maxOccupants: 6,
    exteriorImages: [IMGS.compoundGate, IMGS.concreteFront],
    roomImages: [IMGS.aptLiving, IMGS.aptKitchen],
    location: { lat: 4.1661, lng: 9.2438, displayAddress: "Buea Town, Buea" },
    distanceFromUbKm: 2.8,
    status: "active",
    viewsCount: 267,
    createdAt: "2026-05-25T08:00:00Z",
    updatedAt: "2026-06-23T08:00:00Z",
  },
  {
    id: "dummy-12",
    landlordId: "lld-012",
    title: "1-bedroom apartment — Mile 17",
    description:
      "Well-maintained 1-bedroom apartment. Living room, kitchen, bathroom. Tiles throughout. Dedicated water supply and electricity meter. Parking space included. Close to Mile 17 junction for easy commuting.",
    propertyType: "apartment",
    rentAmount: 700_000,
    rentPeriod: "yearly",
    availableFrom: d(0),
    amenities: ["water", "electricity", "parking", "kitchen"],
    maxOccupants: 3,
    exteriorImages: [IMGS.hostelCourt],
    roomImages: [IMGS.aptLiving, IMGS.aptKitchen],
    location: { lat: 4.1301, lng: 9.2261, displayAddress: "Mile 17, Buea" },
    distanceFromUbKm: 3.4,
    status: "active",
    viewsCount: 88,
    createdAt: "2026-06-12T08:00:00Z",
    updatedAt: "2026-06-22T08:00:00Z",
  },

  // ── HOSTEL BLOCKS (monthly: 25k–45k XAF) ─────────────────────────────────
  {
    id: "dummy-13",
    landlordId: "lld-013",
    title: "Hostel block room — Molyko (room for 2)",
    description:
      "Room in a managed hostel block. Shared bathroom and WC (1 per 4 rooms). Common compound with clotheslines and sitting area. 24/7 security. Water supplied daily by tanker. Very affordable — best value near Molyko.",
    propertyType: "hostel_block",
    rentAmount: 25_000,
    rentPeriod: "monthly",
    availableFrom: d(0),
    amenities: ["water", "electricity", "security"],
    maxOccupants: 2,
    exteriorImages: [IMGS.hostelCourt, IMGS.molykoBlock],
    roomImages: [IMGS.hostelRoom],
    location: { lat: 4.1533, lng: 9.2449, displayAddress: "Molyko, Buea" },
    distanceFromUbKm: 0.15,
    status: "active",
    viewsCount: 390,
    createdAt: "2026-05-05T08:00:00Z",
    updatedAt: "2026-06-24T08:00:00Z",
  },
  {
    id: "dummy-14",
    landlordId: "lld-014",
    title: "Private hostel room — Great Soppo",
    description:
      "Single occupancy room in a quiet hostel. Clean shared toilets and showers. Generator for night electricity. Monthly maid service for common areas. Landlord lives on compound. Ample natural light. Calm neighbourhood.",
    propertyType: "hostel_block",
    rentAmount: 28_000,
    rentPeriod: "monthly",
    availableFrom: d(0),
    amenities: ["water", "electricity", "generator"],
    maxOccupants: 1,
    exteriorImages: [IMGS.compoundGate],
    roomImages: [IMGS.hostelRoom, IMGS.roomTiled],
    location: { lat: 4.1461, lng: 9.2394, displayAddress: "Great Soppo, Buea" },
    distanceFromUbKm: 1.2,
    status: "active",
    viewsCount: 156,
    createdAt: "2026-06-02T08:00:00Z",
    updatedAt: "2026-06-19T08:00:00Z",
  },
];

export function paginateDummyListings(params: {
  page?: number;
  limit?: number;
  propertyType?: string;
  minRent?: number;
  maxRent?: number;
  amenities?: string;
  maxDistanceKm?: number;
  sort?: string;
}) {
  const page  = params.page  ?? 1;
  const limit = params.limit ?? 20;

  let results = [...DUMMY_LISTINGS];

  if (params.propertyType) {
    results = results.filter((l) => l.propertyType === params.propertyType);
  }
  if (params.minRent != null) {
    results = results.filter((l) => l.rentAmount >= params.minRent!);
  }
  if (params.maxRent != null) {
    results = results.filter((l) => l.rentAmount <= params.maxRent!);
  }
  if (params.amenities) {
    const required = params.amenities.split(",").filter(Boolean);
    results = results.filter((l) => required.every((a) => l.amenities.includes(a)));
  }
  if (params.maxDistanceKm != null) {
    results = results.filter(
      (l) => l.distanceFromUbKm != null && l.distanceFromUbKm <= params.maxDistanceKm!,
    );
  }

  switch (params.sort) {
    case "price_asc":
      results.sort((a, b) => a.rentAmount - b.rentAmount);
      break;
    case "price_desc":
      results.sort((a, b) => b.rentAmount - a.rentAmount);
      break;
    case "closest":
      results.sort((a, b) => (a.distanceFromUbKm ?? 99) - (b.distanceFromUbKm ?? 99));
      break;
    default: // newest
      results.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  const total   = results.length;
  const start   = (page - 1) * limit;
  const paged   = results.slice(start, start + limit);
  const hasNext = start + limit < total;

  return {
    data: paged,
    pagination: { page, limit, total, hasNext },
  };
}

export function getDummyListingById(id: string): Listing | undefined {
  return DUMMY_LISTINGS.find((l) => l.id === id);
}
