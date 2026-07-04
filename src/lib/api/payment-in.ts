const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export interface PaymentInApiResponse {
  id: string;
  receiptNumber: string;
  date: string;
  partyId?: string | null;
  partyName?: string | null;
  receivedAmount: number;
  paymentMethod: string;
  remarks?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
}

function formatMethod(method: string): string {
  const map: Record<string, string> = {
    CASH: "Cash", CHEQUE: "Cheque", BANK_TRANSFER: "Bank Transfer", CREDIT_CARD: "Credit Card",
  };
  return map[method] ?? method;
}

export interface PaymentInRow {
  no: string;
  party: string;
  date: string;
  amount: string;
  method: string;
  status: string;
}

export function apiPaymentInToRow(api: PaymentInApiResponse): PaymentInRow {
  return {
    no: `#${api.receiptNumber}`,
    party: api.partyName ?? "—",
    date: formatDate(api.date),
    amount: `Rs. ${Math.round(api.receivedAmount).toLocaleString("en-US")}`,
    method: formatMethod(api.paymentMethod),
    status: "PAID",
  };
}

export async function fetchPaymentInApi(): Promise<PaymentInApiResponse[]> {
  const res = await fetch(`${BASE}/payment-in`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch payment-in records (${res.status})`);
  return res.json();
}

export interface CreatePaymentInPayload {
  receiptNumber: string;
  partyId?: string;
  receivedAmount: number;
  paymentMethod: string;
  remarks?: string;
  date?: string;
}

export async function createPaymentInApi(payload: CreatePaymentInPayload): Promise<PaymentInApiResponse> {
  const res = await fetch(`${BASE}/payment-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create payment-in (${res.status})`);
  return res.json();
}
