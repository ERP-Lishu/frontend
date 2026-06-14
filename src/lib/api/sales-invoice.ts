import type { FullInvoice, InvoiceRow } from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export interface InvoiceItemApiResponse {
  id: string;
  invoiceId: string;
  inventoryId?: string | null;
  itemName: string;
  quantity: number;
  rate: number;
  discountPercent: number;
  discount: number;
  amount: number;
}

export interface SalesInvoiceApiResponse {
  id: string;
  customerId?: string | null;
  customerName?: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
  notes?: string | null;
  paymentMode: string;
  subTotal: number;
  totalAmount: number;
  imageUrl?: string | null;
  items: InvoiceItemApiResponse[];
  createdAt: string;
  updatedAt: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
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
    Credit: "CASH",
  };
  return map[mode] ?? "CASH";
}

export function apiInvoiceToLocal(api: SalesInvoiceApiResponse): FullInvoice {
  const amount = api.totalAmount;
  const rows: InvoiceRow[] = api.items.map((item, i) => ({
    id: i + 1,
    name: item.itemName,
    qty: String(item.quantity),
    rate: String(item.rate),
    discPct: item.discountPercent > 0 ? String(item.discountPercent) : "",
    discAmt: item.discount > 0 && item.discountPercent === 0 ? String(item.discount) : "",
  }));

  return {
    id: api.id,
    no: api.invoiceNumber,
    party: api.customerName ?? "—",
    partyId: api.customerId ?? undefined,
    date: formatDate(api.invoiceDate),
    due: api.dueDate ? formatDate(api.dueDate) : formatDate(api.invoiceDate),
    amount: `Rs. ${Math.round(amount).toLocaleString("en-US")}`,
    received: "Rs. 0",
    balance: `Rs. ${Math.round(amount).toLocaleString("en-US")}`,
    status: "UNPAID",
    mode: parseMode(api.paymentMode),
    creator: "Admin",
    rows: rows.length > 0 ? rows : [{ id: 1, name: "", qty: "1", rate: String(amount), discPct: "", discAmt: "" }],
    notes: api.notes ?? "",
    attachImages: api.imageUrl ? [api.imageUrl] : [],
  };
}

function toApiPayload(inv: FullInvoice) {
  const subTotal = inv.rows.reduce((s, r) => {
    const qty = parseFloat(r.qty) || 0;
    const rate = parseFloat(r.rate) || 0;
    return s + qty * rate;
  }, 0);

  return {
    invoiceNumber: inv.no,
    invoiceDate: new Date().toISOString(),
    customerId: inv.partyId || undefined,
    notes: inv.notes || undefined,
    paymentMode: toApiMode(inv.mode),
    subTotal,
    totalAmount: parseFloat((inv.amount.match(/[\d,]+/)?.[0] ?? "").replace(/,/g, "")) || subTotal,
    items: inv.rows
      .filter((r) => r.name.trim())
      .map((r) => {
        const qty = parseFloat(r.qty) || 0;
        const rate = parseFloat(r.rate) || 0;
        const discPct = parseFloat(r.discPct) || 0;
        const disc = discPct > 0
          ? (qty * rate * discPct) / 100
          : parseFloat(r.discAmt) || 0;
        return {
          itemName: r.name,
          quantity: qty,
          rate,
          discountPercent: discPct,
          discount: disc,
          amount: Math.max(0, qty * rate - disc),
        };
      }),
  };
}

export async function fetchSalesInvoicesApi(): Promise<SalesInvoiceApiResponse[]> {
  const res = await fetch(`${BASE}/sales-invoices`);
  if (!res.ok) throw new Error(`Failed to fetch sales invoices (${res.status})`);
  return res.json();
}

export async function createSalesInvoiceApi(inv: FullInvoice): Promise<SalesInvoiceApiResponse> {
  const res = await fetch(`${BASE}/sales-invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApiPayload(inv)),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Failed to create sales invoice (${res.status})`);
  }
  return res.json();
}

export async function updateSalesInvoiceApi(id: string, inv: FullInvoice): Promise<SalesInvoiceApiResponse> {
  const res = await fetch(`${BASE}/sales-invoices/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApiPayload(inv)),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Failed to update sales invoice (${res.status})`);
  }
  return res.json();
}

export async function deleteSalesInvoiceApi(id: string): Promise<void> {
  const res = await fetch(`${BASE}/sales-invoices/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete sales invoice (${res.status})`);
}
