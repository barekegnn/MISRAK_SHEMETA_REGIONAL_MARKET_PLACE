/**
 * Demo seed — eight shops (two per city: Harar, Aweday, Dire_Dawa, Jigjiga), nine unique
 * products each (72 SKUs). Run: npm run seed
 *
 * Apply migration 005_extend_shop_cities.sql before seeding Aweday/Jigjiga shops.
 *
 * Runner zone = Haramaya_Campus matches buyer@ for DISPATCHED OTP demos.
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { randomInt } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });
config();

type ProductCategory =
  | "Textbooks"
  | "Electronics"
  | "Clothing"
  | "Food & Beverages"
  | "Stationery"
  | "Accessories"
  | "Home & Living"
  | "Other";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !svcKey || svcKey.includes("PASTE_")) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (full secret key).");
  process.exit(1);
}

const admin = createClient(url, svcKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO = [
  { email: "admin@misrak.demo", role: "admin" as const, delivery_zone: null as null, language: "en" as const },
  { email: "seller@misrak.demo", role: "seller" as const, delivery_zone: null, language: "en" as const },
  {
    email: "runner@misrak.demo",
    role: "runner" as const,
    delivery_zone: "Haramaya_Campus" as const,
    language: "en" as const,
  },
  {
    email: "buyer@misrak.demo",
    role: "buyer" as const,
    delivery_zone: "Haramaya_Campus" as const,
    language: "am" as const,
  },
];

const SHOPS = [
  {
    name: "Jugol Heritage House — Harar",
    city: "Harar" as const,
    phone: "+251913200101",
    description:
      "UNESCO Jugol soul: heirloom coffee, spice ceremonies, leather craft, and cultural gifts. Cooperatives only — " +
      "batch photos on every listing. Pickup near the walls; fast Misrak Shemeta handoffs to Haramaya and Aweday corridors.",
  },
  {
    name: "Old Gate Exam & Campus Annex (Harar)",
    city: "Harar" as const,
    phone: "+251913200102",
    description:
      "Built for Haramaya–Harar commuters: mock-exam packs, batteries, quick meals, and lab notebooks. Stock rotates each semester; " +
      "we publish which syllabus tranche each title matches. Runner-friendly OTP pickup windows.",
  },
  {
    name: "Aweday Chat & Grain Exchange",
    city: "Aweday" as const,
    phone: "+251913200201",
    description:
      "Aweday market-grade legumes, teff, honey, and weighing gear. Moisture and sieve grades on every sack; wholesale-friendly tiers. " +
      "Cold-chain honey slots for campus drops.",
  },
  {
    name: "Aweday Orchard & Preserves Co-op",
    city: "Aweday" as const,
    phone: "+251913200202",
    description:
      "Lowland fruit, small-batch jams, juices, and sun-dried snacks from partner orchards. Ingredient decks in Amharic and English; " +
      "no mystery ‘blend’ labels — cultivar and harvest week on jar lids.",
  },
  {
    name: "Dire Dawa Railhouse Supply",
    city: "Dire_Dawa" as const,
    phone: "+251913200301",
    description:
      "Rail-town tech for DDU and station commuters: docks, sleeves, calculators, dorm power. Firmware and warranty cards scanned to QR. " +
      "Evening platform pickup by appointment.",
  },
  {
    name: "Kezira Home & Kitchen Works — Dire Dawa",
    city: "Dire_Dawa" as const,
    phone: "+251913200302",
    description:
      "Kezira-quarter sourcing: enamel cookware, bedding, curtains, and host-guest bundles. Sized for narrow railway flats and new dorms. " +
      "We list burner types and mattress depth so returns stay rare.",
  },
  {
    name: "Jigjiga Highland Bazaar",
    city: "Jigjiga" as const,
    phone: "+251913200401",
    description:
      "Signature Somali Region goods: resin, pastoral textiles, camel-milk care, and gift trays. Photographed on wood scale for true color. " +
      "Long-haul lanes quoted at checkout via Misrak Shemeta matrix.",
  },
  {
    name: "Gode Road Outdoors & Caravan Gear",
    city: "Jigjiga" as const,
    phone: "+251913200402",
    description:
      "Highland wind, dust-season travel, and inter-town hops: rugged packs, lamps, power, navigation aids. Weight and packed size in every card. " +
      "Tested by regional runners on Jigjiga–Babile runs.",
  },
] as const;

/** Unsplash IDs — distinct hero per SKU */
function productImage(idx: number): string {
  const ids = [
    "1442512595331-e89e73853f31", // coffee
    "1596040037479-07ad40429144", // spices
    "1544947950-fef0bc31a188", // market
    "1519682337054-a94a3c8156a0", // textiles
    "1523240795612-9a054b0db644", // student
    "1503602642458-232111445657", // pottery / craft
    "1582719478250-c89acf4ad6bb", // tea / beverage
    "1553062407-98eeb64c6a62", // leather
    "1558618666-fcd25c85cd64", // electronics
    "1544197150-b99f920f4b8a", // office
    "1526423871908-334b6186a7b9", // shoes
    "1513475382583-d06e58bcb0e0", // books
    "1586495779744-25c9cf0fcd94", // honey
    "1616628188857-72d8cbfbd55d", // gadgets
    "1556911220-e15b29be8c8f", // baking / food
    "1562157873-09bc0a7ca2c3", // fashion
    "1452860606245-08b1f944ad73", // tools
    "1504196606672-a8097b7a0e58", // grains
    "1523275339524-6635f54ca9d9", // watch / accessory
    "1519682528368-4a53d56e31ce", // laptop
    "1490481651871-db69fc4c3f48", // home
    "1464223909042-de5d1a7b0b1a", // landscape product
    "1578662996442-48f60103fc96", // stationery
    "1556742502-ec4c0e3c3fb5", // snack
    "1556905055-8f358a7a47b2", // bag
    "1517248135467-4c7edcad34c4", // restaurant / food
    "1582735689369-4fe89db7114c", // fabric
    "1516216628855-6b6c4ce7c4f8", // juice
    "1602143407151-7111547c3bd8", // tech desk
    "1560472354-b33aa7c9b4ee", // fragrance / resin
    "1544441893-28e67d8d2c59", // soap
    "1540575467067-dea52d1baa3c", // scarf
    "1506439772253-4ba97f2e39f1", // atlas / maps
    "1605276379107-0d1a67bf2e39", // sandals
    "1506905925346-21bda4d32df4", // mountains / blanket
    "1558618047-3c05ab4b1e09", // lighting
    "1513506004635-25ed44e6367d", // bottle / drink
  ];
  const id = ids[idx % ids.length];
  return `https://images.unsplash.com/photo-${id}?w=900&q=82&auto=format&fit=crop&sig=${idx}`;
}

const CATALOG: {
  shopIndex: number;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  stock: number;
}[] = [
  // Harar — cultural / coffee / crafts
  {
    shopIndex: 0,
    name: "Harar Highland Sun-Dried Coffee 500g",
    description:
      "Single-origin lot from Eastern highlands, sun-dried on raised beds. Cup profile: jasmine, red berry, mild spice. " +
      "Roast-ready green or city roast notes on request. Sealed valve bag; Jugol Heritage trace tags included.",
    category: "Food & Beverages",
    price: 890,
    stock: 48,
  },
  {
    shopIndex: 0,
    name: "Jugol Berbere & Spice Sampler Tin",
    description:
      "Six small-batch spice packs: berbere, mitmita, cardamom pods, fenugreek, long pepper, korarima. " +
      "Partnered with Harari women-led processors; allergen note on label. Recipe leaflet for shiro and doro.",
    category: "Food & Beverages",
    price: 420,
    stock: 72,
  },
  {
    shopIndex: 0,
    name: "Handwoven Harari Market Basket Set (3)",
    description:
      "Nested grass-and-recycled-plastic baskets in natural dyes. Stiff rim for campus laundry, produce, or picnic runs. " +
      "Each set is slightly unique; wipe clean only.",
    category: "Home & Living",
    price: 650,
    stock: 30,
  },
  {
    shopIndex: 0,
    name: "Copper-Clad Jebena Set with Cups",
    description:
      "Traditional Harar coffee ceremony set: copper-clad jebena, six porcelain cups, brass tray. Polishing cloth included. " +
      "For decorative use or seasoned users — not induction-safe.",
    category: "Home & Living",
    price: 2450,
    stock: 12,
  },
  {
    shopIndex: 0,
    name: "Harar Blend Cotton Gabi Shawl",
    description:
      "Lightweight hand-finished shawl with subtle Jugol window motif. Natural cream base; cold wash. " +
      "Unisex sizing; fringe edged by cooperative tailors.",
    category: "Clothing",
    price: 1180,
    stock: 26,
  },
  {
    shopIndex: 0,
    name: "Eastern Ethiopia Languages Pocket Guide",
    description:
      "Amharic, Afaan Oromo, and situational Harari phrases for markets, clinics, and campus life. Phonetic pronunciations, " +
      "500+ entries, tear-resistant cover. Ideal for mobility between Harar, Haramaya, and Dire Dawa.",
    category: "Textbooks",
    price: 380,
    stock: 90,
  },
  {
    shopIndex: 0,
    name: "Silver-Finish Heritage Cross Pendant",
    description:
      "Stainless base with antique silver finish; 45cm rope chain. Hypoallergenic clasp. Gift box from local woodshop off Feres Megala.",
    category: "Accessories",
    price: 540,
    stock: 40,
  },
  {
    shopIndex: 0,
    name: "Beeswax Taper Bundle (8) — Natural",
    description:
      "Unscented hand-dipped tapers, 4-hour burn. Cotton wicks; slight honey scent from wax. Keep upright; draft-free burn.",
    category: "Home & Living",
    price: 260,
    stock: 55,
  },
  {
    shopIndex: 0,
    name: "Embossed Leather Field Journal A5",
    description:
      "Vegetable-tanned cover, cotton rag paper signatures. Lay-flat binding; refillable inserts sold separately. " +
      "Blind emboss: Misrak Shemeta × Jugol Heritage.",
    category: "Stationery",
    price: 720,
    stock: 34,
  },

  // Harar — Old Gate: exams & campus sprint
  {
    shopIndex: 1,
    name: "Semester Scan Pack — 10-Subject Bound Sheets",
    description:
      "Pre-collated past-mock booklets with grid margins; staples reinforced for backpack crush. Covers 2026 national draft matrix; " +
      "ISBN-style batch so you can reorder the same print run mid-semester.",
    category: "Stationery",
    price: 480,
    stock: 200,
  },
  {
    shopIndex: 1,
    name: "Gel Ink Pen Tower — 48 Mix Colors",
    description:
      "0.5 mm archive-safe gel; smear-tested for lefties. Cardboard desktop dispenser; refill SKUs on label. Exam hall allowed where gel is permitted.",
    category: "Stationery",
    price: 620,
    stock: 85,
  },
  {
    shopIndex: 1,
    name: "Engineering Template & Beam Compass Kit",
    description:
      "Transparent polycarbonate templates: circles, French curves, isometric. Brass lead compass with spare needle. Fits A3 folding board sold separately.",
    category: "Stationery",
    price: 540,
    stock: 44,
  },
  {
    shopIndex: 1,
    name: "Campus Energy Gel Sachets — Citrus (24)",
    description:
      "25g sachets, caffeine optional variant flagged on box side. Halal-cert slip inside; crush tab for night labs. Store cool.",
    category: "Food & Beverages",
    price: 510,
    stock: 120,
  },
  {
    shopIndex: 1,
    name: "Study Buds True-Wireless — ENC",
    description:
      "Bluetooth 5.3, 6h buds + 22h case; dual-mic ENC for shared dorms. USB-C; silicone fins three sizes. Not noise-canceling aviation grade.",
    category: "Electronics",
    price: 1290,
    stock: 55,
  },
  {
    shopIndex: 1,
    name: "Aluminum Fold Laptop Stand — Six Heights",
    description:
      "1.2 kg rated; silicone paw pads; folds flat under 15 mm. Nylon carry sock. Compatible with 11–16\" shells common on Haramaya shuttles.",
    category: "Accessories",
    price: 890,
    stock: 62,
  },
  {
    shopIndex: 1,
    name: "QR-Link STEM Quick Cards — LAM Grade",
    description:
      "200 flip cards; reverse prints solution stubs only after scan. Mechanics, circuits, organic reminders tuned to LAM syllabi — " +
      "difficulty tag per corner for triage study.",
    category: "Textbooks",
    price: 420,
    stock: 70,
  },
  {
    shopIndex: 1,
    name: "Clip-On Blue-Comfort Filter — 2 Frames",
    description:
      "Lightweight CR-39; clips over prescription frames or readers. Wipe pouch included; not a medical device — comfort tint for long LMS nights.",
    category: "Accessories",
    price: 310,
    stock: 95,
  },
  {
    shopIndex: 1,
    name: "Rechargeable Pocket Warmer 5200mAh",
    description:
      "Dual-side aluminum heat spread; USB-C trickle charge phone after exam block. Low/high lock; flight mode sheet included.",
    category: "Electronics",
    price: 760,
    stock: 48,
  },

  // Aweday — agrarian / bulk / market staples
  {
    shopIndex: 2,
    name: "Aweday Premium Legume Medley 5kg",
    description:
      "Rotating mix of chickpeas, red beans, and white peas — machine-cleaned, hand-sorted. Moisture-tested below 12%. " +
      "Ideal for dorms and cooperative kitchens; batch code on sack tie.",
    category: "Food & Beverages",
    price: 890,
    stock: 60,
  },
  {
    shopIndex: 2,
    name: "Eastern Escarpment Honey 1L (Glass)",
    description:
      "Raw-filtered eucalypt and sagebrush blend from escarpment apiaries. Crystallization is normal; warm gently. " +
      "Tamper ring and harvest month sticker on every jar.",
    category: "Food & Beverages",
    price: 1120,
    stock: 44,
  },
  {
    shopIndex: 2,
    name: "Stone-Ground White Teff Flour 5kg",
    description:
      "Pancake-grade teff flour, packed in breathable paper. Proof overnight for injera or quick porridge. Store cool; " +
      "milled within 10 days of shipment when possible.",
    category: "Food & Beverages",
    price: 780,
    stock: 85,
  },
  {
    shopIndex: 2,
    name: "Aweday Jute Weekend Tote — Reinforced",
    description:
      "Thick jute with cotton liner and leather handles. Holds 12kg comfortably for market runs. Natural tan; spot clean.",
    category: "Accessories",
    price: 340,
    stock: 52,
  },
  {
    shopIndex: 2,
    name: "Lowland Farmers’ Almanac (Student Edition)",
    description:
      "Rain windows, soil maps, and crop rotation primers for Eastern Ethiopia. Includes Aweday market calendar QR links. " +
      "Updated annually; nonprofit extension citations.",
    category: "Textbooks",
    price: 290,
    stock: 70,
  },
  {
    shopIndex: 2,
    name: "Digital Kitchen Scale 10kg / 1g",
    description:
      "USB-C rechargeable; tempered glass top. Tare, unit toggle, hold. Calibrated at Dire Dawa service lab; 1-year warranty slip inside.",
    category: "Electronics",
    price: 680,
    stock: 38,
  },
  {
    shopIndex: 2,
    name: "UV-Guard Compact Umbrella",
    description:
      "Wind-tunnel tested steel ribs; Teflon canopy. Fits commuter backpacks. Aweday dust-season grey print lining.",
    category: "Accessories",
    price: 450,
    stock: 64,
  },
  {
    shopIndex: 2,
    name: "Borosilicate Pantry Jar Set (5)",
    description:
      "Airtight bamboo lids with silicone seals. Dishwasher-safe glass; label stickers included. Sizes: 0.35L–1.2L stair-stepped.",
    category: "Home & Living",
    price: 510,
    stock: 41,
  },
  {
    shopIndex: 2,
    name: "Muck-Master Market Boots (Unisex)",
    description:
      "PVC shell, cushioned insole, pull-tabs. Sized EU 38–45; half sizes order up. Rinse after chat-market mud days.",
    category: "Clothing",
    price: 920,
    stock: 33,
  },

  // Aweday — orchard, juice & preserves
  {
    shopIndex: 3,
    name: "Sun-Floor Mango Strips — Lowland 400g",
    description:
      "Parchment-dried without sulfur; flesh-only strips from orchard partners east of Aweday. Rehydrate for baking or snack dry; " +
      "Brix and batch time on back label.",
    category: "Food & Beverages",
    price: 360,
    stock: 90,
  },
  {
    shopIndex: 3,
    name: "Pink Guava Nectar 1L — Tray of 4",
    description:
      "Pasteurized, not-from-concentrate where season allows; slight pulp by design. Refrigerate after opening; deposit-return bottles in Dire pilot.",
    category: "Food & Beverages",
    price: 720,
    stock: 56,
  },
  {
    shopIndex: 3,
    name: "Wild Mesquite Blossom Honey 500g",
    description:
      "Harvest windows tagged per hive; lighter body than escarpment lot. Pair with injera sweets; crystallizes firm — warm jar gently.",
    category: "Food & Beverages",
    price: 640,
    stock: 48,
  },
  {
    shopIndex: 3,
    name: "Chili-Kissed Pineapple Jam 380g",
    description:
      "Lowland pineapple, bird’s-eye infusion controlled to medium heat. Pectin from citrus peel batch; spoon test card inside lid.",
    category: "Food & Beverages",
    price: 290,
    stock: 110,
  },
  {
    shopIndex: 3,
    name: "Citrus Sampler Box — Seasonal 6-Pack",
    description:
      "Mixed mandarin, lime, and local lemon cultivars net-wrapped; wax-free. Weight ticket stapled; bruise policy printed on box top.",
    category: "Food & Beverages",
    price: 480,
    stock: 75,
  },
  {
    shopIndex: 3,
    name: "Hermetic Bottling Kit — Aweday Classroom",
    description:
      "Swing-top bottles 12×0.5L, funnel, shrimpless siphon, pH strips. English/Amharic pictorial; for juice clubs with advisor sign-off.",
    category: "Home & Living",
    price: 940,
    stock: 32,
  },
  {
    shopIndex: 3,
    name: "Escarpment Trail Mix — Roasted No-Salt 1.2kg",
    description:
      "Roasted chickpeas, sunflower, sesame snaps, dried guava dice. Allergen: sesame; student hall portion scoop included.",
    category: "Food & Beverages",
    price: 550,
    stock: 64,
  },
  {
    shopIndex: 3,
    name: "Aseptic Juice Tetra 6-Pack — Mixed",
    description:
      "Amb shelf-stable for outreach trips; straw piercer in sleeve. Flavors rotate — scan QR for this week’s chart.",
    category: "Food & Beverages",
    price: 410,
    stock: 120,
  },
  {
    shopIndex: 3,
    name: "Low-Spray Citrus Care Field Book",
    description:
      "Pruning calendars, mite ID plates, rinse protocol worksheets for student ag pilots. Wirebound; mud-proof cover laminate.",
    category: "Textbooks",
    price: 340,
    stock: 58,
  },

  // Dire Dawa — railway / DDU / tech-forward
  {
    shopIndex: 4,
    name: "Commuter Laptop Sleeve 15\" Ballistic",
    description:
      "Water-resistant nylon, fleece interior, luggage pass-through. Fits most 15\" ultralooks; rail-security friendly profile.",
    category: "Accessories",
    price: 590,
    stock: 47,
  },
  {
    shopIndex: 4,
    name: "DDU Dock USB-C 8-in-1 (100W PD)",
    description:
      "HDMI 4K60, 2× USB-A 3.0, SD/microSD, Ethernet, audio, PD pass-through. Aluminum chassis; firmware updatable via QR.",
    category: "Electronics",
    price: 2850,
    stock: 22,
  },
  {
    shopIndex: 4,
    name: "Architect Mechanical Pencil Set (0.3/0.5/0.7)",
    description:
      "Metal barrels, knurled grips, spare graphite tubes. Velvet roll case. Exam-approved where non-storage calculators allowed.",
    category: "Stationery",
    price: 820,
    stock: 56,
  },
  {
    shopIndex: 4,
    name: "USB-C Desk Breeze Mini Fan",
    description:
      "Brushless motor, tilt base, whisper mode under 30 dB. Draws < 5W — safe for solar-backed dorms.",
    category: "Electronics",
    price: 490,
    stock: 80,
  },
  {
    shopIndex: 4,
    name: "Blackout Curtain Panel Pair 140×240",
    description:
      "Thermal-lined charcoal panels; grommet top. Blocks street light near station hotels and campus perimeter roads.",
    category: "Home & Living",
    price: 1180,
    stock: 28,
  },
  {
    shopIndex: 4,
    name: "Rail Runner 28L Backpack — Cordura",
    description:
      "Laptop harness, hidden passport pocket, reflective rain fly. Grey-orange wayfinding accents for low-light platforms.",
    category: "Clothing",
    price: 1890,
    stock: 36,
  },
  {
    shopIndex: 4,
    name: "Station House Instant Coffee Tin 200g",
    description:
      "Aggressive crema freeze-dried blend — not artisan, just reliable during all-nighters. screw lid; moisture catcher included.",
    category: "Food & Beverages",
    price: 380,
    stock: 100,
  },
  {
    shopIndex: 4,
    name: "Exam Scientific Calculator — 240 Functions",
    description:
      "Allowed on standard Ethiopian exit mocks per 2024 sheet; solar + backup cell. Hard slip case, quick reference card.",
    category: "Stationery",
    price: 540,
    stock: 120,
  },
  {
    shopIndex: 4,
    name: "Railhouse Vacuum Flask 1L — Matte Slate",
    description:
      "18/8 steel, 24h hot / 36h cold (lab conditions). Powder coat resists platform scratches; cup doubles as sharing mug.",
    category: "Accessories",
    price: 760,
    stock: 45,
  },

  // Dire Dawa — Kezira home & kitchen
  {
    shopIndex: 5,
    name: "Kezira Enamel Stew Pot — 24cm Twin Handles",
    description:
      "Speckled enamel on steel; glass lid with steam slot. Induction-tested when disc marked; gas coil friendly. Weight before pack: 2.1 kg.",
    category: "Home & Living",
    price: 1420,
    stock: 28,
  },
  {
    shopIndex: 5,
    name: "Universal Cast Lid 26cm — Rail Flat",
    description:
      "Fits mixed-brand pans from station quarter kitchens; hollow handle stays cooler. Season lightly before first stew cycle.",
    category: "Home & Living",
    price: 480,
    stock: 40,
  },
  {
    shopIndex: 5,
    name: "Dorm Microfiber Sheet Set — Queen Short",
    description:
      "15 cm pocket for thin rail-quarter mattresses; tenacious elastic. Grey-stripe; washes cold, tumble low — anti-pill brush finish.",
    category: "Home & Living",
    price: 980,
    stock: 55,
  },
  {
    shopIndex: 5,
    name: "Mesh Pantry Tower — 4 Graduated Baskets",
    description:
      "Carbon steel frame, epoxy coat; casters lock for narrow kitchens. Clip-on S-hooks for ladles. Max 18 kg per tier.",
    category: "Home & Living",
    price: 1120,
    stock: 33,
  },
  {
    shopIndex: 5,
    name: "Kezira Ground-Spice Gift Trio — Jarred",
    description:
      "Berbere, korerima, garlic-ginger paste flight. Best-by on each lid; QR for recipe trios from cooperative testers.",
    category: "Food & Beverages",
    price: 420,
    stock: 90,
  },
  {
    shopIndex: 5,
    name: "Terry Loft Bath Set — 6 Pieces Sand",
    description:
      "Two bath, two hand, two wash; Oeko-Tex class II. Looped terry; hang loops reinforced — dries fast in humid Dire season.",
    category: "Home & Living",
    price: 890,
    stock: 47,
  },
  {
    shopIndex: 5,
    name: "Silicone Tool Set — 230°C Pro Temper",
    description:
      "Soup ladle, flipper, whisk core steel; BPA-free. Grey–terracotta mix; dishwasher top rack.",
    category: "Home & Living",
    price: 560,
    stock: 70,
  },
  {
    shopIndex: 5,
    name: "Sheer Window Pair — 200×250 Ice",
    description:
      "Diffuse glare for east-facing dorm rails; rod pocket plus back tabs. Hem weight tape included — steam before hang.",
    category: "Home & Living",
    price: 740,
    stock: 38,
  },
  {
    shopIndex: 5,
    name: "Kezira Guest Welcome Tray — Rattan & Glass",
    description:
      "Hand-sized welcome dates and cups; glass insert removable for wipe-down between hosts. Not oven-safe insert.",
    category: "Home & Living",
    price: 620,
    stock: 44,
  },

  // Jigjiga — Somali Region / resin / pastoral goods
  {
    shopIndex: 6,
    name: "Jigjiga Grade-A Boswellia Resin 200g",
    description:
      "Soft incense resin from managed Boswellia stands; cool-grind pellets. Use on charcoal or electric heater per enclosed safety sheet. " +
      "Batch resin-stamped for Misrak Shemeta traceability.",
    category: "Other",
    price: 980,
    stock: 55,
  },
  {
    shopIndex: 6,
    name: "Camel Milk & Shea Soap Bars (6)",
    description:
      "Cold-process bars; mild lather, low scent. Ingredients: camel milk powder, shea, coconut, lye fully saponified. Dry rack use — soft when wet.",
    category: "Home & Living",
    price: 360,
    stock: 88,
  },
  {
    shopIndex: 6,
    name: "Hand-Loomed Shash Scarf — Indigo Stripe",
    description:
      "Cotton-acrylic blend for durability on windy highland commutes. 180×70 cm; handwash. Pattern varies slightly by loom run.",
    category: "Clothing",
    price: 640,
    stock: 42,
  },
  {
    shopIndex: 6,
    name: "Engraved Serving Tray — Stainless",
    description:
      "Brushed stainless with low-profile lip; pastoral constellation laser motif. Food-safe; hand dry to prevent water spots on engraving.",
    category: "Home & Living",
    price: 890,
    stock: 24,
  },
  {
    shopIndex: 6,
    name: "Nomad 20Ah PD Power Brick",
    description:
      "45W USB-C PD + dual USB-A; aircraft-mode documentation card. Pass-through charge supported. Charcoal silicone bumpers.",
    category: "Electronics",
    price: 1950,
    stock: 30,
  },
  {
    shopIndex: 6,
    name: "Somali Region Atlas & Mobility Atlas (2nd ed.)",
    description:
      "Topographic spreads, seasonal road notes, and market town indexes for Jigjiga–Harar–Dire corridors. Student discount QR on back cover.",
    category: "Textbooks",
    price: 920,
    stock: 50,
  },
  {
    shopIndex: 6,
    name: "Pastoralist Leather Sandals — Double-Strap",
    description:
      "Vegetable-tanned upper, crepe wedge, brass buckles. EU sizing; break-in over ~5 wears. Avoid deep puddles — natural sole.",
    category: "Clothing",
    price: 1350,
    stock: 29,
  },
  {
    shopIndex: 6,
    name: "Gum Arabic Pottery Starter Kit",
    description:
      "Food-grade gum Arabic powder, small whisk, ratio card for beverages and icings. Partner cooperative in Jijiga enterprise zone.",
    category: "Food & Beverages",
    price: 280,
    stock: 66,
  },
  {
    shopIndex: 6,
    name: "Highland Wool Throw — Sand & Rust",
    description:
      "Loft wool blend, 130×170 cm. Dry-clean or cold wool cycle. Fringe tied by cooperative; slight nap variation is normal.",
    category: "Home & Living",
    price: 1680,
    stock: 18,
  },

  // Jigjiga — Gode Road outdoors & caravan
  {
    shopIndex: 7,
    name: "Gode Line 40L Ripstop Duffel — YKK",
    description:
      "840D ripstop, stowable backpack straps, four lash points. Empty mass 980 g; volume measured by ASTM soft-fill. Dust-skirt zipper garages.",
    category: "Clothing",
    price: 1680,
    stock: 40,
  },
  {
    shopIndex: 7,
    name: "Night-Heron Headlamp 1200lm — USB-C",
    description:
      "TIR spot + flood side LEDs; red preserve mode. IPX6; lockout triple-click. Runtime chart silk-screens inside battery door.",
    category: "Electronics",
    price: 890,
    stock: 52,
  },
  {
    shopIndex: 7,
    name: "Pace-Count & Lensatic Compass Kit",
    description:
      "Liquid-damped compass; 550 paracord pace beads with diagram card. Training pamphlet for Babile pacing drills — not aviation rated.",
    category: "Accessories",
    price: 640,
    stock: 60,
  },
  {
    shopIndex: 7,
    name: "Hydration Bladder 3L — Bite Valve Lock",
    description:
      "Military-pattern slide lock; wide mouth for ice. Taste-neutral TPU; hang tabs fit Gode duffel sleeve. Blow-out pressure note inside.",
    category: "Accessories",
    price: 520,
    stock: 85,
  },
  {
    shopIndex: 7,
    name: "Dust-Gard Ventilated Goggles — Twin Pack",
    description:
      "Indirect vents; anti-fog inner wipe sachet each. Fits over slender Rx frames; strap clip for helmet rim.",
    category: "Accessories",
    price: 430,
    stock: 110,
  },
  {
    shopIndex: 7,
    name: "Reflective Paracord 30m — Daybreak Orange",
    description:
      "7-strand Type III with tracer stripe for guy lines and truck bed tie-down teaching labs. Melting instructions on spool label.",
    category: "Other",
    price: 380,
    stock: 95,
  },
  {
    shopIndex: 7,
    name: "Folding Windscreen — Stove Height 18cm",
    description:
      "Titanium-coated aluminum; pins slot common canister stoves. Carry pouch doubles as heat mat when inverted — see caution glyph.",
    category: "Home & Living",
    price: 560,
    stock: 48,
  },
  {
    shopIndex: 7,
    name: "Tube Patch Wallet — 12 Patches + Lever",
    description:
      "Prepped patches, vulcanizing fluid mini, two nylon levers. Practice tube printed on wallet inner — for moto-runners and cycle clubs.",
    category: "Accessories",
    price: 310,
    stock: 140,
  },
  {
    shopIndex: 7,
    name: "Eastern Corridor Fold Map — Waterproof",
    description:
      "Babile–Jigjiga–Harar truck-stop notes on reverse; tear grid for triage. Updates quarterly via Misrak QR; matte UV print.",
    category: "Textbooks",
    price: 260,
    stock: 200,
  },
];

async function ensureAuthUser(email: string, password: string) {
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === email);
  if (existing) return existing.id;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user!.id;
}

function genOtp() {
  return String(randomInt(100000, 999999));
}

async function main() {
  for (const d of DEMO) {
    const id = await ensureAuthUser(d.email, "demo1234");
    const { error: upsertErr } = await admin.from("users").upsert(
      {
        id,
        email: d.email,
        full_name: d.email.split("@")[0],
        role: d.role,
        delivery_zone: d.delivery_zone,
        language: d.language,
      },
      { onConflict: "id" }
    );
    if (upsertErr) throw upsertErr;
  }

  const { data: sellerRow, error: sellerErr } = await admin
    .from("users")
    .select("id")
    .eq("email", "seller@misrak.demo")
    .maybeSingle();
  if (sellerErr) throw sellerErr;
  if (!sellerRow?.id) {
    throw new Error("seller@misrak.demo missing from public.users after upsert — check migrations and RLS (service role should bypass).");
  }
  const sellerId = sellerRow.id as string;

  const { data: existingSellerShops } = await admin.from("shops").select("id").eq("owner_id", sellerId);
  const oldIds = (existingSellerShops ?? []).map((r) => r.id as string);
  if (oldIds.length) {
    await admin.from("shop_transactions").delete().in("shop_id", oldIds);
    await admin.from("orders").delete().in("shop_id", oldIds);
    await admin.from("products").delete().in("shop_id", oldIds);
    await admin.from("shops").delete().in("id", oldIds);
  }

  const shopIds: string[] = [];
  for (const s of SHOPS) {
    const { data: ins, error } = await admin
      .from("shops")
      .insert({
        owner_id: sellerId,
        name: s.name,
        city: s.city,
        phone: s.phone,
        description: s.description,
      })
      .select("id")
      .single();
    if (error) throw error;
    shopIds.push(ins!.id as string);
  }

  const rows = CATALOG.map((p, i) => ({
    shop_id: shopIds[p.shopIndex]!,
    name: p.name,
    description: p.description,
    price: p.price,
    stock: p.stock,
    category: p.category,
    images: [productImage(i)],
    is_active: true,
  }));

  const { error: pe } = await admin.from("products").insert(rows);
  if (pe) throw pe;

  const hubId = shopIds[0]!;
  const { data: buyerRow } = await admin
    .from("users")
    .select("id")
    .eq("email", "buyer@misrak.demo")
    .single();
  const buyerId = buyerRow!.id as string;

  const { data: prod } = await admin
    .from("products")
    .select("id, name, price, shop_id, shops(city)")
    .eq("shop_id", hubId)
    .limit(1)
    .single();

  if (prod) {
    const price = Number(prod.price);
    const shopNest = prod.shops as unknown;
    const shopOne = Array.isArray(shopNest) ? shopNest[0] : shopNest;
    const city = (shopOne as { city: string }).city;
    const orderItem = {
      product_id: prod.id as string,
      shop_id: hubId,
      product_name: prod.name as string,
      quantity: 1,
      price_at_purchase: price,
      shop_city: city,
    };
    const subtotal = price;
    const deliveryFee = 100;
    const total = subtotal + deliveryFee;

    await admin.from("orders").delete().eq("buyer_id", buyerId);

    await admin.from("orders").insert([
      {
        buyer_id: buyerId,
        shop_id: hubId,
        items: [orderItem],
        subtotal,
        delivery_fee: deliveryFee,
        total,
        status: "PAID_ESCROW",
        otp: genOtp(),
      },
      {
        buyer_id: buyerId,
        shop_id: hubId,
        items: [orderItem],
        subtotal,
        delivery_fee: deliveryFee,
        total,
        status: "DISPATCHED",
        otp: genOtp(),
      },
    ]);
  }

  console.log("Seed complete: 8 shops (2 per city), 72 products, demo orders (first Harar shop).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});