const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export interface SalesReturnApiResponse {
  id: string;
  partyId?: string | null;
  partyName?: string | null;
  returnNumber: string;
  returnDate: string;
  notes?: string | null;
  paymentMode: string;
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

export interface SalesReturnRow {
  no: string;
  party: string;
  date: string;
  amount: string;
  status: string;
}

export function apiSalesReturnToRow(api: SalesReturnApiResponse): SalesReturnRow {
  return {
    no: `#${api.returnNumber}`,
    party: api.partyName ?? "—",
    date: formatDate(api.returnDate),
    amount: `Rs. ${Math.round(api.totalAmount).toLocaleString("en-US")}`,
    status: "PAID",
  };
}

export async function fetchSalesReturnsApi(): Promise<SalesReturnApiResponse[]> {
  const res = await fetch(`${BASE}/sales-returns`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch sales returns (${res.status})`);
  return res.json();
}

export interface CreateSalesReturnPayload {
  partyId?: string;
  returnNumber: string;
  returnDate: string;
  notes?: string;
  paymentMode: string;
  subTotal: number;
  totalAmount: number;
  items: { itemName: string; quantity: number; rate: number; amount: number }[];
}

export async function createSalesReturnApi(payload: CreateSalesReturnPayload): Promise<SalesReturnApiResponse> {
  const res = await fetch(`${BASE}/sales-returns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create sales return (${res.status})`);
  return res.json();
}
