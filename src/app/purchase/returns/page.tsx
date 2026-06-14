import { SimpleListPage } from "@/components/sales/SimpleListPage";
import { fetchPurchaseReturnsApi, apiPurchaseReturnToRow } from "@/lib/api/purchase-return";

const columns = [
  { key: "no", label: "Return No" },
  { key: "party", label: "Supplier" },
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
];

export default async function Page() {
  let rows: { no: string; party: string; date: string; amount: string; status: string }[] = [];
  try {
    const data = await fetchPurchaseReturnsApi();
    rows = data.map(apiPurchaseReturnToRow);
  } catch {}

  return <SimpleListPage title="Purchase Returns" columns={columns} rows={rows} actionLabel="Create Return" />;
}
