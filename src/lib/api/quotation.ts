const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export interface QuotationApiResponse {
  id: string;
  partyId?: string | null;
  partyName?: string | null;
  quotationNumber: string;
  quotationDate: string;
  notes?: string | null;
  subTotal: number;
  totalAmount: number;
  imageUrl?: string | null;
  items: { id: string; itemName: string; quantity: number; rate: number; amount: number }[];
  createdAt: string;
  updatedAt: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
}

export interface QuotationRow {
  no: string;
  party: string;
  date: string;
  amount: string;
  status: string;
}

export function apiQuotationToRow(api: QuotationApiResponse): QuotationRow {
  return {
    no: `#${api.quotationNumber}`,
    party: api.partyName ?? "—",
    date: formatDate(api.quotationDate),
    amount: `Rs. ${Math.round(api.totalAmount).toLocaleString("en-US")}`,
    status: "UNPAID",
  };
}

export async function fetchQuotationsApi(): Promise<QuotationApiResponse[]> {
  const res = await fetch(`${BASE}/quotations`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch quotations (${res.status})`);
  return res.json();
}
