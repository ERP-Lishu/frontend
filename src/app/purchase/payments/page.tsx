import { SimpleListPage } from "@/components/sales/SimpleListPage";
import { fetchPaymentOutApi, apiPaymentOutToRow } from "@/lib/api/payment-out";

const columns = [
  { key: "no", label: "Payment No" },
  { key: "party", label: "Supplier" },
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount" },
  { key: "method", label: "Method" },
  { key: "status", label: "Status" },
];

export default async function Page() {
  let rows: { no: string; party: string; date: string; amount: string; method: string; status: string }[] = [];
  try {
    const data = await fetchPaymentOutApi();
    rows = data.map(apiPaymentOutToRow);
  } catch {}

  return <SimpleListPage title="Payment Out" columns={columns} rows={rows} actionLabel="Record Payment" />;
}
