import { Suspense } from "react";
import { CreateInvoicePage } from "@/components/sales/CreateInvoicePage";

export default function Page() {
  return (
    <Suspense>
      <CreateInvoicePage />
    </Suspense>
  );
}
