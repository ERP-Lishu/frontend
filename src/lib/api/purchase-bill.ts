import type { FullBill, BillRow } from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export interface PurchaseBillItemApiResponse {
  id: string;
  itemName: string;
  quantity: number;
  rate: number;
  discountPercent: number;
  discount: number;
  amount: number;
}

export interface PurchaseBillApiResponse {
  id: string;
  supplierId?: string | null;
  supplierName?: string | null;
  billNumber: string;
  billDate: string;
  notes?: string | null;
  paymentMode: string;
  subTotal: number;
  totalAmount: number;
  imageUrl?: string | null;
  items: PurchaseBillItemApiResponse[];
  createdAt: string;
  updatedAt: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()} ${d.toLocaleString("en", { month: "short" })} ${String(d.getDate()).padStart(2, "0")}`;
}

function parseMode(mode: string): string {
  const map: Record<string, string> = {
    CASH: "Cash", CHEQUE: "Cheque", BANK_TRANSFER: "Bank Transfer", CREDIT_CARD: "Credit Card",
  };
  return map[mode] ?? mode;
}

function toApiMode(mode: string): string {
  const map: Record<string, string> = {
    Cash: "CASH", Cheque: "CHEQUE", "Bank Transfer": "BANK_TRANSFER", "Credit Card": "CREDIT_CARD",
    Credit: "CASH", "QR / Wallet": "CASH",
  };
  return map[mode] ?? "CASH";
}

export function apiBillToLocal(api: PurchaseBillApiResponse): FullBill {
  const amount = api.totalAmount;
  const rows: BillRow[] = api.items.map((item, i) => ({
    id: i + 1,
    name: item.itemName,
    qty: String(item.quantity),
    rate: String(item.rate),
    discPct: item.discountPercent > 0 ? String(item.discountPercent) : "",
    discAmt: item.discount > 0 && item.discountPercent === 0 ? String(item.discount) : "",
  }));

  return {
    id: api.id,
    no: api.billNumber,
    supplier: api.supplierName ?? "—",
    supplierId: api.supplierId ?? undefined,
    date: formatDate(api.billDate),
    amount: `Rs. ${Math.round(amount).toLocaleString("en-US")}`,
    paid: "Rs. 0",
    balance: `Rs. ${Math.round(amount).toLocaleString("en-US")}`,
    status: "UNPAID",
    mode: parseMode(api.paymentMode),
    rows: rows.length > 0 ? rows : [{ id: 1, name: "", qty: "1", rate: String(amount), discPct: "", discAmt: "" }],
    notes: api.notes ?? "",
    attachImages: api.imageUrl ? [api.imageUrl] : [],
  };
}

export interface PurchaseBillRow {
  no: string;
  party: string;
  date: string;
  amount: string;
  status: string;
}

export function apiPurchaseBillToRow(api: PurchaseBillApiResponse): PurchaseBillRow {
  return {
    no: `#${api.billNumber}`,
    party: api.supplierName ?? "—",
    date: formatDate(api.billDate),
    amount: `Rs. ${Math.round(api.totalAmount).toLocaleString("en-US")}`,
    status: "UNPAID",
  };
}

function toBillApiPayload(bill: FullBill) {
  const subTotal = bill.rows.reduce((s, r) => {
    const qty = parseFloat(r.qty) || 0;
    const rate = parseFloat(r.rate) || 0;
    const discPct = parseFloat(r.discPct) || 0;
    const gross = qty * rate;
    const disc = discPct > 0 ? (gross * discPct) / 100 : parseFloat(r.discAmt) || 0;
    return s + Math.max(0, gross - disc);
  }, 0);

  return {
    supplierId: bill.supplierId,
    billNumber: bill.no.replace(/^#/, ""),
    billDate: new Date().toISOString(),
    notes: bill.notes || undefined,
    paymentMode: toApiMode(bill.mode),
    subTotal: Math.round(subTotal),
    totalAmount: Math.round(parseFloat((bill.amount.match(/[\d,]+/)?.[0] ?? "").replace(/,/g, "")) || subTotal),
    items: bill.rows
      .filter((r) => r.name)
      .map((r) => {
        const qty = parseFloat(r.qty) || 0;
        const rate = parseFloat(r.rate) || 0;
        const discPct = parseFloat(r.discPct) || 0;
        const gross = qty * rate;
        const disc = discPct > 0 ? (gross * discPct) / 100 : parseFloat(r.discAmt) || 0;
        return {
          itemName: r.name,
          quantity: qty,
          rate: Math.round(rate),
          discountPercent: discPct,
          discount: Math.round(disc),
          amount: Math.round(Math.max(0, gross - disc)),
        };
      }),
  };
}

export async function fetchPurchaseBillsApi(): Promise<PurchaseBillApiResponse[]> {
  const res = await fetch(`${BASE}/purchase-bills`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch purchase bills (${res.status})`);
  return res.json();
}

export async function createPurchaseBillApi(bill: FullBill): Promise<PurchaseBillApiResponse> {
  const res = await fetch(`${BASE}/purchase-bills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBillApiPayload(bill)),
  });
  if (!res.ok) throw new Error(`Failed to create purchase bill (${res.status})`);
  return res.json();
}

export async function updatePurchaseBillApi(id: string, bill: FullBill): Promise<void> {
  const res = await fetch(`${BASE}/purchase-bills/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toBillApiPayload(bill)),
  });
  if (!res.ok) throw new Error(`Failed to update purchase bill (${res.status})`);
}

export async function deletePurchaseBillApi(id: string): Promise<void> {
  const res = await fetch(`${BASE}/purchase-bills/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete purchase bill (${res.status})`);
}
