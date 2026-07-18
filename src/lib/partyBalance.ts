import type { Party } from "@/lib/types";
import type { FullInvoice } from "@/context/SalesContext";
import type { FullBill } from "@/context/PurchaseContext";
import type { PaymentInApiResponse } from "@/lib/api/payment-in";
import type { PaymentOutApiResponse } from "@/lib/api/payment-out";
import type { SalesReturnApiResponse } from "@/lib/api/sales-return";
import type { PurchaseReturnApiResponse } from "@/lib/api/purchase-return";

export function parsePartyAmount(value: string): number {
  const match = value.match(/[\d,]+(\.\d+)?/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, "")) || 0;
}

export interface PartyLedgerData {
  invoices: FullInvoice[];
  bills: FullBill[];
  paymentsIn: PaymentInApiResponse[];
  paymentsOut: PaymentOutApiResponse[];
  salesReturns: SalesReturnApiResponse[];
  purchaseReturns: PurchaseReturnApiResponse[];
}

/**
 * Net running balance for a party: opening balance (signed by its `g`
 * direction) plus all outstanding sales invoices / purchase bills, minus
 * recorded payments and returns. Mirrors the calculation used on the
 * Parties page so every screen shows the same figure.
 */
export function computePartyRunningBalance(
  party: Party,
  data: PartyLedgerData,
): { amt: string; g: boolean } {
  const matches = (name: string, id?: string) =>
    name === party.name || (!!party.id && id === party.id);

  const salesTotal = data.invoices
    .filter((inv) => matches(inv.party, inv.partyId))
    .reduce((sum, inv) => sum + parsePartyAmount(inv.balance), 0);

  const purchaseTotal = data.bills
    .filter((b) => matches(b.supplier, b.supplierId))
    .reduce((sum, b) => sum + parsePartyAmount(b.balance), 0);

  const ins = data.paymentsIn.filter(
    (pi) => (party.id && pi.partyId === party.id) || pi.partyName === party.name,
  );
  const outs = data.paymentsOut.filter(
    (po) => (party.id && po.partyId === party.id) || po.partyName === party.name,
  );
  const paymentsTotal =
    ins.reduce((s, pi) => s + (pi.receivedAmount || 0), 0) +
    outs.reduce((s, po) => s + (po.paidAmount || 0), 0);

  const salesRet = data.salesReturns.filter(
    (sr) => (party.id && sr.partyId === party.id) || sr.partyName === party.name,
  );
  const purchaseRet = data.purchaseReturns.filter(
    (pr) => (party.id && pr.partyId === party.id) || pr.partyName === party.name,
  );
  const returnsTotal =
    salesRet.reduce((s, sr) => s + (sr.totalAmount || 0), 0) +
    purchaseRet.reduce((s, pr) => s + (pr.totalAmount || 0), 0);

  const outstanding = salesTotal + purchaseTotal - paymentsTotal - returnsTotal;

  const opening = parsePartyAmount(party.amt);
  const openingSigned = party.g ? opening : -opening;
  const net = openingSigned + outstanding;
  const abs = Math.abs(net);

  return {
    amt: abs > 0 ? `Rs. ${Math.round(abs).toLocaleString("en-IN")}` : "Rs. 0",
    g: net >= 0,
  };
}
