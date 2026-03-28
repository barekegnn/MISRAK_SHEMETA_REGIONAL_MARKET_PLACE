import type {
  Product,
  ProductCategory,
  Shop,
  ShopCategory,
  ShopCity,
} from "@/types";

const now = () => new Date().toISOString();

/** 15 categories per shop — cycles through allowed ProductCategory values. */
const CATEGORY_CYCLE: ProductCategory[] = [
  "Textbooks",
  "Electronics",
  "Clothing",
  "Food & Beverages",
  "Stationery",
  "Accessories",
  "Home & Living",
  "Other",
  "Textbooks",
  "Electronics",
  "Clothing",
  "Food & Beverages",
  "Stationery",
  "Accessories",
  "Home & Living",
];

const UNSPLASH_IDS = [
  "photo-1544716278-ca5e3f16abd8",
  "photo-1512820790803-83ca734da794",
  "photo-1496181133206-80ce9b88a853",
  "photo-1511707171634-5f897ff02aa9",
  "photo-1584100936595-c9d19d44230f",
  "photo-1556905055-8f358a7a47b2",
  "photo-1517842645767-c96b00f0a97a",
  "photo-1523275335684-37898b6baf30",
  "photo-1505740420928-5e560c06d30e",
  "photo-1560472354-b33ff0c44a43",
  "photo-1526170375885-4d8ecf77b99f",
  "photo-1526178810565-732e8963f5ca",
  "photo-1516975080664-ed2fc6a32937",
  "photo-1586495777744-4413f21062fa",
  "photo-1542291026-7eec264c27ff",
];

function img(seed: string) {
  return `https://images.unsplash.com/${seed}?w=600&h=600&fit=crop&q=80`;
}

function longDescription(shopName: string, productName: string, city: ShopCity) {
  return (
    `${productName} from ${shopName} in ${city.replace("_", " ")}. ` +
    `Curated for the Misrak Shemeta regional marketplace — quality-checked listing with fair pricing for students and residents across Eastern Ethiopia. ` +
    `Supports escrow payments and coordinated campus and town delivery.`
  );
}

type ShopBlueprint = {
  id: string;
  owner_id: string;
  name: string;
  category: ShopCategory;
  city: ShopCity;
  phone: string;
  description: string;
};

const SHOP_BLUEPRINTS: ShopBlueprint[] = [
  // Harar — 5 shops
  {
    id: "shop-harar-books",
    owner_id: "owner-harar-1",
    name: "Harar Book Hub",
    category: "Books & Learning",
    city: "Harar",
    phone: "+251911112233",
    description:
      "Textbooks and study guides for Harar campuses and nearby towns. Fast local pickup and delivery.",
  },
  {
    id: "shop-harar-electronics",
    owner_id: "owner-harar-2",
    name: "Harar Tech Corner",
    category: "Electronics & Devices",
    city: "Harar",
    phone: "+251911112234",
    description: "Phones, accessories, and student-friendly gadgets in central Harar.",
  },
  {
    id: "shop-harar-lifestyle",
    owner_id: "owner-harar-3",
    name: "Harar Lifestyle Market",
    category: "Essentials & Lifestyle",
    city: "Harar",
    phone: "+251911112235",
    description: "Daily essentials, dorm basics, and gifts for Harar families and students.",
  },
  {
    id: "shop-harar-study",
    owner_id: "owner-harar-4",
    name: "Old Town Study Supplies",
    category: "Books & Learning",
    city: "Harar",
    phone: "+251911112236",
    description: "Stationery, reference books, and exam prep materials.",
  },
  {
    id: "shop-harar-campus-tech",
    owner_id: "owner-harar-5",
    name: "Campus Device Repair & Sales",
    category: "Electronics & Devices",
    city: "Harar",
    phone: "+251911112237",
    description: "Repairs, chargers, and refurbished laptops near Harar campuses.",
  },
  // Dire Dawa — 5 shops
  {
    id: "shop-ddu-electronics",
    owner_id: "owner-dd-1",
    name: "DDU Electronics",
    category: "Electronics & Devices",
    city: "Dire_Dawa",
    phone: "+251922334455",
    description:
      "Laptops, phones, and accessories near Dire Dawa University. Student-friendly prices.",
  },
  {
    id: "shop-dire-books",
    owner_id: "owner-dd-2",
    name: "Dire Dawa Readers",
    category: "Books & Learning",
    city: "Dire_Dawa",
    phone: "+251922334456",
    description: "Textbooks and language materials for DDU and Dire city learners.",
  },
  {
    id: "shop-dire-essentials",
    owner_id: "owner-dd-3",
    name: "Railway Quarter Essentials",
    category: "Essentials & Lifestyle",
    city: "Dire_Dawa",
    phone: "+251922334457",
    description: "Home goods, hygiene, and quick snacks along the eastern corridor.",
  },
  {
    id: "shop-dire-gadgets",
    owner_id: "owner-dd-4",
    name: "DD Smart Gadgets",
    category: "Electronics & Devices",
    city: "Dire_Dawa",
    phone: "+251922334458",
    description: "Audio gear, peripherals, and smart accessories.",
  },
  {
    id: "shop-dire-campus-mart",
    owner_id: "owner-dd-5",
    name: "Campus Corner Mart",
    category: "Essentials & Lifestyle",
    city: "Dire_Dawa",
    phone: "+251922334459",
    description: "Bundles for dorms: bedding, lighting, and study kits.",
  },
  // Haramaya — 5 shops
  {
    id: "shop-haramaya-essentials",
    owner_id: "owner-hm-1",
    name: "Haramaya Essentials",
    category: "Essentials & Lifestyle",
    city: "Haramaya",
    phone: "+251933445566",
    description:
      "Daily essentials, home goods, and gifts for Haramaya town and campus corridors.",
  },
  {
    id: "shop-haramaya-books",
    owner_id: "owner-hm-2",
    name: "Haramaya Academic Books",
    category: "Books & Learning",
    city: "Haramaya",
    phone: "+251933445567",
    description: "STEM and social science titles tailored for Haramaya students.",
  },
  {
    id: "shop-haramaya-tech",
    owner_id: "owner-hm-3",
    name: "Haramaya Tech Exchange",
    category: "Electronics & Devices",
    city: "Haramaya",
    phone: "+251933445568",
    description: "Affordable devices and accessories with local support.",
  },
  {
    id: "shop-haramaya-bazaar",
    owner_id: "owner-hm-4",
    name: "Green Campus Bazaar",
    category: "Essentials & Lifestyle",
    city: "Haramaya",
    phone: "+251933445569",
    description: "Handmade goods, textiles, and sustainable dorm products.",
  },
  {
    id: "shop-haramaya-lab",
    owner_id: "owner-hm-5",
    name: "Field Station Supplies",
    category: "Books & Learning",
    city: "Haramaya",
    phone: "+251933445570",
    description: "Field guides, lab notebooks, and agriculture readers.",
  },
  // Jijiga — 5 shops
  {
    id: "shop-jijiga-textiles",
    owner_id: "owner-jj-1",
    name: "Jijiga Heritage Textiles",
    category: "Essentials & Lifestyle",
    city: "Jijiga",
    phone: "+251944556601",
    description: "Traditional fabrics, apparel, and gifts from Jijiga artisans.",
  },
  {
    id: "shop-jijiga-electronics",
    owner_id: "owner-jj-2",
    name: "Jijiga Mobile & Tech",
    category: "Electronics & Devices",
    city: "Jijiga",
    phone: "+251944556602",
    description: "Phones, power banks, and accessories with regional warranty partners.",
  },
  {
    id: "shop-jijiga-books",
    owner_id: "owner-jj-3",
    name: "Somali Regional Bookstore",
    category: "Books & Learning",
    city: "Jijiga",
    phone: "+251944556603",
    description: "Multilingual titles, dictionaries, and civic education readers.",
  },
  {
    id: "shop-jijiga-daily",
    owner_id: "owner-jj-4",
    name: "Kezira Daily Market Online",
    category: "Essentials & Lifestyle",
    city: "Jijiga",
    phone: "+251944556604",
    description: "Pantry staples, beverages, and household necessities delivered locally.",
  },
  {
    id: "shop-jijiga-innovation",
    owner_id: "owner-jj-5",
    name: "Jijiga Innovation Hub Shop",
    category: "Electronics & Devices",
    city: "Jijiga",
    phone: "+251944556605",
    description: "Arduino kits, sensors, and student innovation project gear.",
  },
];

export const MOCK_SHOPS: Shop[] = SHOP_BLUEPRINTS.map((b) => ({
  id: b.id,
  owner_id: b.owner_id,
  name: b.name,
  category: b.category,
  city: b.city,
  phone: b.phone,
  description: b.description,
  balance: 0,
  is_active: true,
  created_at: now(),
}));

const PRODUCTS_PER_SHOP = 15;

function hashPrice(shopId: string, index: number) {
  let h = 0;
  const s = `${shopId}-${index}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 200 + (h % 9800);
}

function hashStock(shopId: string, index: number) {
  let h = 0;
  const s = `${shopId}-stock-${index}`;
  for (let i = 0; i < s.length; i++) h = (h * 17 + s.charCodeAt(i)) >>> 0;
  return 3 + (h % 38);
}

function buildProductsForShop(shop: Shop): Product[] {
  return Array.from({ length: PRODUCTS_PER_SHOP }, (_, i) => {
    const category = CATEGORY_CYCLE[i]!;
    const name = `${shop.name} — ${category} #${i + 1}`;
    return {
      id: `p-${shop.id}-${i + 1}`,
      shop_id: shop.id,
      name,
      description: longDescription(shop.name, name, shop.city),
      price: hashPrice(shop.id, i),
      stock: hashStock(shop.id, i),
      category,
      images: [img(UNSPLASH_IDS[i % UNSPLASH_IDS.length]!)],
      is_active: true,
      created_at: now(),
    };
  });
}

export const MOCK_PRODUCTS: Product[] = MOCK_SHOPS.flatMap((shop) =>
  buildProductsForShop(shop),
);

export const SHOP_CATEGORY_ORDER: ShopCategory[] = [
  "Books & Learning",
  "Electronics & Devices",
  "Essentials & Lifestyle",
];

export function enrichProduct(p: Product): Product {
  const shop = MOCK_SHOPS.find((s) => s.id === p.shop_id);
  return { ...p, shop: shop ?? p.shop };
}

export function getMockProducts(): Product[] {
  return MOCK_PRODUCTS.map(enrichProduct);
}

export function getMockShops(): Shop[] {
  return [...MOCK_SHOPS];
}

export function getMockShopById(shopId: string): Shop | undefined {
  return MOCK_SHOPS.find((shop) => shop.id === shopId);
}

export function getProductsByShopId(shopId: string): Product[] {
  return getMockProducts().filter((product) => product.shop_id === shopId);
}

export function getShopProductCount(shopId: string): number {
  return getProductsByShopId(shopId).length;
}

export function getShopsGroupedByCategory(): Array<{
  category: ShopCategory;
  shops: Shop[];
}> {
  return SHOP_CATEGORY_ORDER.map((category) => ({
    category,
    shops: getMockShops().filter((shop) => shop.category === category),
  })).filter((section) => section.shops.length > 0);
}

export function filterProducts(params: {
  q?: string;
  category?: string;
  city?: ShopCity;
  minPrice?: number;
  maxPrice?: number;
}): Product[] {
  let list = getMockProducts();
  if (params.q?.trim()) {
    const q = params.q.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }
  if (params.category && params.category !== "All") {
    list = list.filter((p) => p.category === params.category);
  }
  if (params.city) {
    list = list.filter((p) => p.shop?.city === params.city);
  }
  if (params.minPrice != null) {
    list = list.filter((p) => p.price >= params.minPrice!);
  }
  if (params.maxPrice != null) {
    list = list.filter((p) => p.price <= params.maxPrice!);
  }
  return list;
}
