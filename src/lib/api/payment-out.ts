const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export interface PaymentOutApiResponse {
  id: string;
  receiptNumber: string;
  date: string;
  partyId?: string | null;
  partyName?: string | null;
  paidAmount: number;
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

export interface PaymentOutRow {
  no: string;
  party: string;
  date: string;
  amount: string;
  method: string;
  status: string;
}

export function apiPaymentOutToRow(api: PaymentOutApiResponse): PaymentOutRow {
  return {
    no: `#${api.receiptNumber}`,
    party: api.partyName ?? "—",
    date: formatDate(api.date),
    amount: `Rs. ${Math.round(api.paidAmount).toLocaleString("en-US")}`,
    method: formatMethod(api.paymentMethod),
    status: "PAID",
  };
}

export async function fetchPaymentOutApi(): Promise<PaymentOutApiResponse[]> {
  const res = await fetch(`${BASE}/payment-out`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch payment-out records (${res.status})`);
  return res.json();
}

export interface CreatePaymentOutPayload {
  receiptNumber: string;
  partyId?: string;
  paidAmount: number;
  paymentMethod: string;
  remarks?: string;
  date?: string;
}

export async function createPaymentOutApi(payload: CreatePaymentOutPayload): Promise<PaymentOutApiResponse> {
  const res = await fetch(`${BASE}/payment-out`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create payment-out (${res.status})`);
  return res.json();
}
