import type { Party } from "@/lib/types";
import apiClient from "./client";

const PARTY_STORE_KEY = "soch_party_balances";

interface PartyBalanceStore {
  [partyId: string]: { amt: string; g: boolean };
}

export function savePartyBalanceLocally(partyId: string, amt: string, g: boolean) {
  try {
    const store: PartyBalanceStore = JSON.parse(localStorage.getItem(PARTY_STORE_KEY) || "{}");
    store[partyId] = { amt, g };
    localStorage.setItem(PARTY_STORE_KEY, JSON.stringify(store));
  } catch {}
}

export function loadPartyBalanceLocally(partyId: string) {
  try {
    const store: PartyBalanceStore = JSON.parse(localStorage.getItem(PARTY_STORE_KEY) || "{}");
    return store[partyId] ?? null;
  } catch { return null; }
}

export function deletePartyBalanceLocally(partyId: string) {
  try {
    const store: PartyBalanceStore = JSON.parse(localStorage.getItem(PARTY_STORE_KEY) || "{}");
    delete store[partyId];
    localStorage.setItem(PARTY_STORE_KEY, JSON.stringify(store));
  } catch {}
}

export interface PartyApiResponse {
  id: string;
  fullName: string;
  phoneNumber?: string;
  type: "CUSTOMER" | "SUPPLIER";
  openingBalance?: number;
  balanceType?: "TO_RECEIVE" | "TO_GIVE";
  asOfDate?: string;
  address?: string;
  email?: string;
  panNumber?: string;
}

function parseMoneyAmount(value: string) {
  const match = value.match(/[\d,]+(\.\d+)?/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, "")) || 0;
}

function toApiPayload(p: Party) {
  const bal = parseMoneyAmount(p.amt);
  return {
    fullName: p.name,
    phoneNumber: p.ph || undefined,
    type: p.type === "s" ? "SUPPLIER" : "CUSTOMER",
    openingBalance: bal,
    balanceType: p.g ? "TO_RECEIVE" : "TO_GIVE",
    email: p.email || undefined,
    address: p.address || undefined,
    panNumber: p.panNumber || undefined,
  };
}

export async function fetchPartiesApi(): Promise<PartyApiResponse[]> {
  const { data } = await apiClient.get<PartyApiResponse[]>("/parties");
  return data;
}

export async function createPartyApi(p: Party): Promise<PartyApiResponse> {
  const { data } = await apiClient.post<PartyApiResponse>(
    "/parties",
    toApiPayload(p),
  );
  return data;
}

export async function updatePartyApi(
  id: string,
  p: Party,
): Promise<PartyApiResponse> {
  const { data } = await apiClient.patch<PartyApiResponse>(
    `/parties/${id}`,
    toApiPayload(p),
  );
  return data;
}

export async function deletePartyApi(id: string): Promise<void> {
  await apiClient.delete(`/parties/${id}`);
}

export function apiPartyToLocal(p: PartyApiResponse): Party {
  const words = p.fullName.trim().split(" ");
  const init =
    words
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "??";

  // Prefer locally stored balance if API returns 0 (backend may not persist it)
  const local = loadPartyBalanceLocally(p.id);
  const apiBal = p.openingBalance ?? 0;
  const amt = local ? local.amt : `Rs. ${apiBal > 0 ? Math.round(apiBal).toLocaleString("en-IN") : "0"}`;
  const g = local ? local.g : p.balanceType !== "TO_GIVE";

  return {
    id: p.id,
    init,
    name: p.fullName,
    ph: p.phoneNumber ?? "",
    amt,
    g,
    type: p.type === "SUPPLIER" ? "s" : "c",
    email: p.email,
    address: p.address,
    panNumber: p.panNumber,
    txns: [],
  };
}
