import { SimpleListPage } from "@/components/sales/SimpleListPage";
import { fetchSalesReturnsApi, apiSalesReturnToRow } from "@/lib/api/sales-return";

const columns = [
  { key: "no", label: "Return No" },
  { key: "party", label: "Party" },
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
];

export default async function Page() {
  let rows: { no: string; party: string; date: string; amount: string; status: string }[] = [];
  try {
    const data = await fetchSalesReturnsApi();
    rows = data.map(apiSalesReturnToRow);
  } catch {}

  return <SimpleListPage title="Sales Returns" columns={columns} rows={rows} actionLabel="Create Return" actionHref="/sales/returns/create" />;
}
