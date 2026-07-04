import type { InventoryItem, InventoryVariant } from "@/lib/types";
import apiClient from "./client";

const VARIANT_STORE_KEY = "soch_item_variants";

interface VariantStore {
  [itemId: string]: {
    variants?: InventoryVariant[];
    varLabels?: string[];
    images?: string[];
    color?: string;
  };
}

export function saveVariantsLocally(itemId: string, item: Pick<InventoryItem, "variants" | "varLabels" | "images" | "color">) {
  try {
    const store: VariantStore = JSON.parse(localStorage.getItem(VARIANT_STORE_KEY) || "{}");
    store[itemId] = { variants: item.variants, varLabels: item.varLabels, images: item.images, color: item.color };
    localStorage.setItem(VARIANT_STORE_KEY, JSON.stringify(store));
  } catch {}
}

export function loadVariantsLocally(itemId: string) {
  try {
    const store: VariantStore = JSON.parse(localStorage.getItem(VARIANT_STORE_KEY) || "{}");
    return store[itemId] ?? {};
  } catch { return {}; }
}

export function deleteVariantsLocally(itemId: string) {
  try {
    const store: VariantStore = JSON.parse(localStorage.getItem(VARIANT_STORE_KEY) || "{}");
    delete store[itemId];
    localStorage.setItem(VARIANT_STORE_KEY, JSON.stringify(store));
  } catch {}
}

export interface InventoryApiVariant {
  id: string;
  sku?: string | null;
  attributes: Record<string, string>;
  salesPrice: number;
  purchasePrice: number;
  stock: number;
}

export interface InventoryApiResponse {
  id: string;
  name: string;
  category: string;
  type: string;
  openingStock: number;
  measuringUnit: string;
  salesPrice: number;
  purchasePrice: number;
  lowStockAlert: boolean;
  hasVariations: boolean;
  variants: InventoryApiVariant[];
  itemCode?: string | null;
  hsCode?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

function getInit(name: string): string {
  const words = name.trim().split(" ");
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "??";
}

// Backend stores variant attributes as a generic { [variationLabel]: value } map.
// The UI only ever deals in up to two variation types, surfaced as size/color —
// reconstruct that shape here, falling back to attribute key order when the
// variation type names aren't cached locally (e.g. first load on a new device).
function apiVariantsToLocal(
  apiVariants: InventoryApiVariant[],
  cachedLabels?: string[]
): { variants: InventoryVariant[]; varLabels: string[] } {
  const labels =
    cachedLabels && cachedLabels.length > 0
      ? cachedLabels
      : Array.from(new Set(apiVariants.flatMap((v) => Object.keys(v.attributes))));

  const variants = apiVariants.map((v) => ({
    size: (labels[0] && v.attributes[labels[0]]) || "",
    color: (labels[1] && v.attributes[labels[1]]) || "",
    stock: v.stock,
    sku: v.sku ?? undefined,
    salesPrice: v.salesPrice,
    purchasePrice: v.purchasePrice,
  }));

  return { variants, varLabels: labels };
}

export function apiInventoryToLocal(api: InventoryApiResponse): InventoryItem {
  const local = loadVariantsLocally(api.id);

  if (api.hasVariations && api.variants.length > 0) {
    const { variants, varLabels } = apiVariantsToLocal(api.variants, local.varLabels);
    const qty = variants.reduce((sum, v) => sum + v.stock, 0);
    // The parent record's own salesPrice/purchasePrice are always 0 once
    // variants exist (the backend zeroes them out), so the item-level display
    // mirrors the first variant's price instead of showing a flat Rs. 0.
    const firstVariant = variants[0];
    return {
      id: api.id,
      init: getInit(api.name),
      name: api.name,
      cat: api.category || "General",
      type: api.type === "SERVICE" ? "Service" : "Product",
      code: api.itemCode || api.id.slice(0, 8).toUpperCase(),
      sale: `Rs. ${Math.round(firstVariant?.salesPrice ?? 0).toLocaleString("en-US")}`,
      purchase: `Rs. ${Math.round(firstVariant?.purchasePrice ?? 0).toLocaleString("en-US")}`,
      qty,
      low: api.lowStockAlert && qty > 0 && qty <= 10,
      critical: qty === 0,
      variants,
      varLabels,
      images: local.images,
      color: local.color,
    };
  }

  const qty = api.openingStock ?? 0;
  return {
    id: api.id,
    init: getInit(api.name),
    name: api.name,
    cat: api.category || "General",
    type: api.type === "SERVICE" ? "Service" : "Product",
    code: api.itemCode || api.id.slice(0, 8).toUpperCase(),
    sale: `Rs. ${Math.round(api.salesPrice).toLocaleString("en-US")}`,
    purchase: `Rs. ${Math.round(api.purchasePrice).toLocaleString("en-US")}`,
    qty,
    low: api.lowStockAlert && qty > 0 && qty <= 10,
    critical: qty === 0,
    images: local.images,
    color: local.color,
  };
}

function toApiPayload(item: InventoryItem) {
  const labels = item.varLabels ?? [];

  // Item-level stock/price and per-variant stock/price are mutually exclusive:
  // once variants are present, the backend zeroes out openingStock/salesPrice/
  // purchasePrice on the parent item itself. Always send `variants` (even as
  // an empty array) so an edit that removes all variation values tells the
  // backend to clear the old variant rows and fall back to item-level stock.
  const variants = (item.variants ?? []).map((v) => ({
    sku: v.sku || undefined,
    attributes: {
      ...(labels[0] && v.size ? { [labels[0]]: v.size } : {}),
      ...(labels[1] && v.color ? { [labels[1]]: v.color } : {}),
    },
    salesPrice: v.salesPrice ?? 0,
    purchasePrice: v.purchasePrice ?? 0,
    stock: v.stock,
  }));

  return {
    name: item.name,
    category: item.cat,
    type: item.type === "Service" ? "SERVICE" : "PRODUCT",
    openingStock: item.qty,
    salesPrice: parseInt(item.sale.replace(/[^0-9]/g, "")) || 0,
    purchasePrice: parseInt(item.purchase.replace(/[^0-9]/g, "")) || 0,
    itemCode: item.code || undefined,
    lowStockAlert: item.low || false,
    variants,
  };
}

export async function fetchInventoryApi(): Promise<InventoryApiResponse[]> {
  const { data } = await apiClient.get<InventoryApiResponse[]>("/inventory");
  return data;
}

export async function createInventoryApi(item: InventoryItem): Promise<InventoryApiResponse> {
  const { data } = await apiClient.post<InventoryApiResponse>("/inventory", toApiPayload(item));
  return data;
}

export async function updateInventoryApi(id: string, item: InventoryItem): Promise<InventoryApiResponse> {
  const { data } = await apiClient.patch<InventoryApiResponse>(`/inventory/${id}`, toApiPayload(item));
  return data;
}

export async function deleteInventoryApi(id: string): Promise<void> {
  await apiClient.delete(`/inventory/${id}`);
}
