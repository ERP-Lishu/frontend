import type { InventoryItem } from "@/lib/types";
import apiClient from "./client";

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

export function apiInventoryToLocal(api: InventoryApiResponse): InventoryItem {
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
  };
}

function toApiPayload(item: InventoryItem) {
  return {
    name: item.name,
    category: item.cat,
    type: item.type === "Service" ? "SERVICE" : "PRODUCT",
    openingStock: item.qty,
    salesPrice: parseInt(item.sale.replace(/[^0-9]/g, "")) || 0,
    purchasePrice: parseInt(item.purchase.replace(/[^0-9]/g, "")) || 0,
    itemCode: item.code || undefined,
    lowStockAlert: item.low || false,
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
