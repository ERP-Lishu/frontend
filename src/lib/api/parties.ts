import type { Party } from "@/lib/types";
import apiClient from "./client";

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
  const bal = p.openingBalance ?? 0;
  const words = p.fullName.trim().split(" ");
  const init =
    words
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "??";
  return {
    id: p.id,
    init,
    name: p.fullName,
    ph: p.phoneNumber ?? "",
    amt: `Rs. ${bal > 0 ? Math.round(bal).toLocaleString("en-IN") : "0"}`,
    g: p.balanceType !== "TO_GIVE",
    type: p.type === "SUPPLIER" ? "s" : "c",
    email: p.email,
    address: p.address,
    panNumber: p.panNumber,
    txns: [],
  };
}
