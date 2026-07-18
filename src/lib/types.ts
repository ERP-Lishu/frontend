export interface Transaction {
  type: string;
  date: string;
  total: string;
  status: string;
  bal: string;
  rem: string;
  kind: "invoice" | "payment_in" | "payment_out" | "sales_return" | "purchase_return";
  rcpt?: string;
  refId?: string; // id of the source invoice / bill / payment, for navigation or editing
  mdate?: string;
  amount?: string;
  method?: string;
  creator?: string;
}

export interface Party {
  id?: string;
  init: string;
  name: string;
  ph: string;
  amt: string;
  g: boolean;
  type?: "c" | "s";
  email?: string;
  address?: string;
  panNumber?: string;
  txns: Transaction[];
}

export interface BomItem {
  ic: string;
  nm: string;
  dt: string;
  qty: string;
  cost: string;
}

export interface BomEntry {
  title: string;
  sub: string;
  cost: string;
  items: BomItem[];
}

export interface TransferRecord {
  id: string;
  from: string;
  to: string;
  items: string;
  date: string;
  st: "done" | "transit" | "pending";
}

export interface InventoryVariant {
  size: string;
  color: string;
  stock: number;
  sku?: string;
  salesPrice?: number;
  purchasePrice?: number;
}

export interface InventoryItem {
  id?: string;
  init: string;
  name: string;
  cat: string;
  type: string;
  code: string;
  sale: string;
  purchase: string;
  qty: number;
  low?: boolean;
  critical?: boolean;
  color?: string;
  variants?: InventoryVariant[];
  varLabels?: string[];   // actual variation type names in order, e.g. ["Color", "Size"]
  images?: string[];      // base64 data URLs of uploaded images
  activity?: { date: string; desc: string; qty: string }[];
}

export interface SalesInvoice {
  id: string;
  no: string;
  party: string;
  date: string;
  due: string;
  amount: string;
  received: string;
  balance: string;
  status: "UNPAID" | "PAID" | "PARTIAL";
  mode: string;
  creator: string;
}

export interface PurchaseBill {
  id: string;
  no: string;
  party: string;
  date: string;
  amount: string;
  status: string;
}

export interface CartItem {
  idx: number;
  name: string;
  price: number;
  qty: number;
  maxQty: number;
}

export interface BillRow {
  id: number;
  name: string;
  qty: string;
  rate: string;
  discPct: string;
  discAmt: string;
}

export interface FullBill {
  id: string;
  no: string;
  supplier: string;
  supplierId?: string;
  date: string;
  amount: string;
  paid: string;
  balance: string;
  status: "UNPAID" | "PAID" | "PARTIAL";
  mode: string;
  rows: BillRow[];
  notes: string;
  attachImages: string[];
  /** ISO creation timestamp from the backend, used for precise chronological (FIFO) ordering. */
  createdAt?: string;
}

export interface InvoiceRow {
  id: number;
  name: string;
  qty: string;
  rate: string;
  discPct: string;
  discAmt: string;
}

export interface FullInvoice {
  id: string;
  no: string;
  party: string;
  partyId?: string;
  date: string;
  due: string;
  amount: string;
  received: string;
  balance: string;
  status: "UNPAID" | "PAID" | "PARTIAL";
  mode: string;
  creator: string;
  rows: InvoiceRow[];
  notes: string;
  attachImages: string[];
  /** ISO creation timestamp from the backend, used for precise chronological (FIFO) ordering. */
  createdAt?: string;
}
