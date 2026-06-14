const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export interface ExpenseItemApiResponse {
  id: string;
  expenseId: string;
  itemName: string;
  amount: number;
}

export interface ExpenseApiResponse {
  id: string;
  expenseNumber: string;
  date: string;
  category?: string | null;
  totalAmount: number;
  paymentMethod: string;
  remarks?: string | null;
  imageUrl?: string | null;
  items: ExpenseItemApiResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface FullExpense {
  id: string;
  no: string;
  date: string;
  category: string;
  totalAmount: number;
  mode: string;
  remarks: string;
  items: { id: number; name: string; amount: string }[];
  attachImages: string[];
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
    "QR / Wallet": "CASH",
  };
  return map[mode] ?? "CASH";
}

export function apiExpenseToLocal(api: ExpenseApiResponse): FullExpense {
  return {
    id: api.id,
    no: api.expenseNumber,
    date: formatDate(api.date),
    category: api.category ?? "General",
    totalAmount: Math.round(api.totalAmount),
    mode: parseMode(api.paymentMethod),
    remarks: api.remarks ?? "",
    items: api.items.map((it, i) => ({
      id: i + 1,
      name: it.itemName,
      amount: String(Math.round(it.amount)),
    })),
    attachImages: api.imageUrl ? [api.imageUrl] : [],
  };
}

function toApiPayload(exp: FullExpense) {
  return {
    expenseNumber: exp.no,
    date: new Date().toISOString(),
    category: exp.category || undefined,
    totalAmount: exp.totalAmount,
    paymentMethod: toApiMode(exp.mode),
    remarks: exp.remarks || undefined,
    items: exp.items
      .filter((it) => it.name)
      .map((it) => ({ itemName: it.name, amount: Math.round(parseFloat(it.amount) || 0) })),
  };
}

export async function fetchExpensesApi(): Promise<ExpenseApiResponse[]> {
  const res = await fetch(`${BASE}/expenses`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch expenses (${res.status})`);
  return res.json();
}

export async function createExpenseApi(exp: FullExpense): Promise<ExpenseApiResponse> {
  const res = await fetch(`${BASE}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApiPayload(exp)),
  });
  if (!res.ok) throw new Error(`Failed to create expense (${res.status})`);
  return res.json();
}

export async function updateExpenseApi(id: string, exp: FullExpense): Promise<void> {
  const res = await fetch(`${BASE}/expenses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toApiPayload(exp)),
  });
  if (!res.ok) throw new Error(`Failed to update expense (${res.status})`);
}

export async function deleteExpenseApi(id: string): Promise<void> {
  const res = await fetch(`${BASE}/expenses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete expense (${res.status})`);
}
