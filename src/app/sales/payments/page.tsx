import { SimpleListPage } from "@/components/sales/SimpleListPage";
import { fetchPaymentInApi, apiPaymentInToRow } from "@/lib/api/payment-in";

const columns = [
  { key: "no", label: "Receipt No" },
  { key: "party", label: "Party" },
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount" },
  { key: "method", label: "Payment Method" },
  { key: "status", label: "Status" },
];

export default async function Page() {
  let rows: { no: string; party: string; date: string; amount: string; method: string; status: string }[] = [];
  try {
    const data = await fetchPaymentInApi();
    rows = data.map(apiPaymentInToRow);
  } catch {}

  return <SimpleListPage title="Payment In" columns={columns} rows={rows} actionLabel="Record Payment" />;
}
